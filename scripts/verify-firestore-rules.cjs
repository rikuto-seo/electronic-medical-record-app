// Local emulator only. Install tooling in tmp/firebase-qa; see docs/visit-history-and-payments.md.
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { createRequire } = require("module");
const root = path.resolve(__dirname, "..");
const qaRequire = createRequire(path.join(root, "tmp/firebase-qa/qa.cjs"));
const { initializeTestEnvironment, assertSucceeds, assertFails } = qaRequire(
  "@firebase/rules-unit-testing",
);
const { doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, Timestamp } =
  qaRequire("firebase/firestore");
const staffUid = "khSrR6rwn2OjLAyVbeXqrSxBiGE3";
let checks = 0;
async function check(label, action) {
  try {
    await action();
  } catch (error) {
    console.error(`FAIL ${label}`);
    const coverage = await fetch(
      "http://127.0.0.1:8088/emulator/v1/projects/demo-clinic-qa:ruleCoverage",
    ).then((response) => response.text());
    fs.writeFileSync(
      path.join(root, "tmp/firebase-qa/rule-coverage.json"),
      coverage,
    );
    throw error;
  }
  checks++;
  console.log(`PASS ${label}`);
}

async function main() {
  const env = await initializeTestEnvironment({
    projectId: "demo-clinic-qa",
    firestore: {
      host: "127.0.0.1",
      port: 8088,
      rules: fs.readFileSync(path.join(root, "firestore.rules"), "utf8"),
    },
  });
  try {
    await env.clearFirestore();
    const db = env.authenticatedContext(staffUid).firestore();
    const stranger = env.authenticatedContext("unapproved-staff").firestore();
    const anonymous = env.unauthenticatedContext().firestore();
    const counter = doc(db, "clinicSettings/patientNumberCounter");
    const modules = new Map();
    function productionModule(file) {
      if (file === path.join(root, "src/firebase.ts"))
        return { db, auth: { currentUser: { uid: staffUid } } };
      if (modules.has(file)) return modules.get(file).exports;
      const module = { exports: {} };
      modules.set(file, module);
      const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
        },
      }).outputText;
      const localRequire = (name) =>
        name.startsWith(".")
          ? productionModule(path.resolve(path.dirname(file), `${name}.ts`))
          : name === "firebase/firestore"
            ? qaRequire(name)
            : require(name);
      new Function("require", "module", "exports", source)(
        localRequire,
        module,
        module.exports,
      );
      return module.exports;
    }
    const { registerPatientWithNumber, issuePatientNumber } = productionModule(
      path.join(root, "src/lib/firebase/patientNumber.ts"),
    );
    async function allocate(patientId) {
      const patient =
        patientId === "legacy"
          ? await issuePatientNumber(patientId)
          : await registerPatientWithNumber({
              id: patientId,
              name: "架空の検証患者",
              gender: "女性",
              birthDate: "1990-01-01",
              age: 36,
              firstVisitDate: "2026-10-10",
              address: "検証用住所",
              records: [],
            });
      return patient.patientNumber;
    }
    await check("atomic patient number allocation", async () =>
      assert.equal(await allocate("patient-a"), "000001"),
    );
    await check("staff access", () =>
      assertSucceeds(getDoc(doc(db, "patients/patient-a"))),
    );
    await check("anonymous access denied", () =>
      assertFails(getDoc(doc(anonymous, "patients/patient-a"))),
    );
    await check("unapproved staff denied", () =>
      assertFails(getDoc(doc(stranger, "patients/patient-a"))),
    );
    await check("patient number cannot change", () =>
      assertFails(
        updateDoc(doc(db, "patients/patient-a"), { patientNumber: "000999" }),
      ),
    );
    await check("patient requires atomic number registration", () =>
      assertFails(
        setDoc(doc(db, "patients/invalid"), { patientNumber: "000002" }),
      ),
    );
    await check("registry cannot change", () =>
      assertFails(
        updateDoc(doc(db, "patientNumbers/000001"), { patientId: "other" }),
      ),
    );
    await check("registry cannot be deleted", () =>
      assertFails(deleteDoc(doc(db, "patientNumbers/000001"))),
    );
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "patients/legacy"), {
        name: "架空の既存患者",
      }),
    );
    await check("existing patient first number allocation", async () =>
      assert.equal(await allocate("legacy"), "000002"),
    );
    await check("concurrent allocation uses distinct numbers", async () => {
      const numbers = await Promise.all([
        allocate("concurrent-a"),
        allocate("concurrent-b"),
      ]);
      assert.deepEqual(numbers.sort(), ["000003", "000004"]);
    });
    await check("counter rewind denied even with atomic writes", async () => {
      const batch = writeBatch(db);
      batch.set(counter, {
        lastNumber: 1,
        lastPatientNumber: "000001",
        lastPatientId: "rewind",
      });
      batch.set(doc(db, "patients/rewind"), { patientNumber: "000001" });
      batch.set(doc(db, "patientNumbers/000001"), { patientId: "rewind" });
      await assertFails(batch.commit());
    });

    const date = Timestamp.fromDate(new Date("2026-10-10T00:00:00Z"));
    const event = (status) => ({
      status,
      reservationDate: date.toDate().toISOString(),
      type: "施術",
      staffName: "検証スタッフ",
      cancellationReason: status === "cancelled" ? "予定変更" : "",
    });
    const paid = {
      id: "receipt-1",
      kind: "payment",
      amount: 5000,
      paidAt: "2026-10-10T00:30:00Z",
      method: "cash",
      note: "架空入金",
      createdAt: "2026-10-10T00:31:00Z",
      createdBy: staffUid,
    };
    const refund = {
      ...paid,
      id: "refund-1",
      kind: "refund",
      amount: 1000,
      note: "架空返金",
    };
    const reservation = doc(db, "reservations/visit-a");
    const initialHistory = [event("booked")];
    await check("reservation and payment creation", () =>
      assertSucceeds(
        setDoc(reservation, {
          patientId: "patient-a",
          date,
          status: "booked",
          feeAmount: 5000,
          payments: [paid],
          statusHistory: initialHistory,
        }),
      ),
    );
    await check("reservation without history denied", () =>
      assertFails(
        setDoc(doc(db, "reservations/no-history"), {
          patientId: "patient-a",
          date,
          status: "booked",
        }),
      ),
    );
    const cancelledHistory = [...initialHistory, event("cancelled")];
    await check("cancel leaves history", () =>
      assertSucceeds(
        updateDoc(reservation, {
          status: "cancelled",
          statusHistory: cancelledHistory,
        }),
      ),
    );
    const restoredHistory = [...cancelledHistory, event("booked")];
    await check("restore retains cancellation", () =>
      assertSucceeds(
        updateDoc(reservation, {
          status: "booked",
          statusHistory: restoredHistory,
        }),
      ),
    );
    await check("status change without new event denied", () =>
      assertFails(updateDoc(reservation, { status: "completed" })),
    );
    await check("history removal denied", () =>
      assertFails(updateDoc(reservation, { statusHistory: initialHistory })),
    );
    await check("payment removal denied", () =>
      assertFails(updateDoc(reservation, { payments: [] })),
    );
    await check("payment modification denied", () =>
      assertFails(
        updateDoc(reservation, { payments: [{ ...paid, amount: 1 }] }),
      ),
    );
    await check("reservation patient transfer denied", () =>
      assertFails(updateDoc(reservation, { patientId: "legacy" })),
    );
    await check("additional refund accepted", () =>
      assertSucceeds(updateDoc(reservation, { payments: [paid, refund] })),
    );
    await check("billing update preserves payments", () =>
      assertSucceeds(updateDoc(reservation, { feeAmount: 6000 })),
    );
    await check("reservation deletion denied", () =>
      assertFails(deleteDoc(reservation)),
    );
    await check("unapproved staff cannot modify money", () =>
      assertFails(
        updateDoc(doc(stranger, "reservations/visit-a"), { feeAmount: 0 }),
      ),
    );
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "reservations/legacy"), {
        patientId: "legacy",
        date,
        checkedIn: false,
      }),
    );
    await check("legacy reservation can acquire baseline history", () =>
      assertSucceeds(
        updateDoc(doc(db, "reservations/legacy"), {
          status: "cancelled",
          payments: [],
          statusHistory: [event("booked"), event("cancelled")],
        }),
      ),
    );
    await check(
      "production reservation payment and cancellation workflow",
      async () => {
        const { addReservation, updateReservation } = productionModule(
          path.join(root, "src/utils/reservationService.ts"),
        );
        const data = {
          patientId: "patient-a",
          date: new Date("2026-10-12T00:00:00Z"),
          duration: 30,
          type: "検証施術",
          feeAmount: 5000,
          payments: [{ ...paid, id: "integration-payment" }],
        };
        await addReservation(data, "integration-visit");
        await addReservation(data, "integration-visit");
        await updateReservation("integration-visit", {
          status: "cancelled",
          cancellationReason: "検証取消",
        });
        await updateReservation("integration-visit", {
          status: "booked",
          cancellationReason: "",
        });
        const reference = doc(db, "reservations/integration-visit");
        const before = (await getDoc(reference)).data();
        await updateReservation("integration-visit", {
          payments: [
            ...before.payments,
            { ...refund, id: "integration-refund" },
          ],
        });
        const saved = (await getDoc(reference)).data();
        assert.equal(saved.payments.length, 2);
        assert.equal(saved.payments[0].createdBy, staffUid);
        assert.deepEqual(
          saved.statusHistory.map((item) => item.status),
          ["booked", "cancelled", "booked"],
        );
        assert.equal(saved.statusHistory[1].cancellationReason, "検証取消");
      },
    );
    console.log(`${checks} Firestore rule checks passed (demo emulator only).`);
  } finally {
    await env.cleanup();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
