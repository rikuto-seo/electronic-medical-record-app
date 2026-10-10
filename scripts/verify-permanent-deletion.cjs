// This script refuses to run against live projects; both services must be local.
const assert = require("node:assert/strict"),
  path = require("path"),
  fs = require("fs");
const { createRequire } = require("module");
const root = path.resolve(__dirname, "..");
assert.match(
  process.env.FIRESTORE_EMULATOR_HOST ?? "",
  /^127\.0\.0\.1:8088$/,
  "Local demo Firestore is required",
);
const functionRequire = createRequire(path.join(root, "functions/index.js"));
assert.match(
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "",
  /^127\.0\.0\.1:9198$/,
  "Local demo Storage is required",
);
process.env.STORAGE_EMULATOR_HOST = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`;
const qaRequire = createRequire(path.join(root, "tmp/firebase-qa/qa.cjs"));
const admin = functionRequire("firebase-admin");
const { initializeTestEnvironment, assertFails, assertSucceeds } = qaRequire(
  "@firebase/rules-unit-testing",
);
const {
  doc,
  updateDoc,
  setDoc,
  writeBatch,
  Timestamp: ClientTimestamp,
} = qaRequire("firebase/firestore");
const {
  createPermanentDeletionHandler,
} = require("../functions/permanentDeletion");
const staffUid = "khSrR6rwn2OjLAyVbeXqrSxBiGE3";
const { ref, uploadBytes } = qaRequire("firebase/storage");
const app = admin.initializeApp(
  { projectId: "demo-clinic-qa" },
  "permanent-deletion-qa",
);
const db = admin.firestore(app),
  Timestamp = admin.firestore.Timestamp,
  FieldValue = admin.firestore.FieldValue;
let files = new Set(),
  failStorage = false,
  checks = 0;
const realBucket = admin.storage(app).bucket("demo-clinic-qa.appspot.com");
const bucket = {
  getFiles: async ({ prefix }) => {
    if (failStorage) throw new Error("simulated storage interruption");
    const [found] = await realBucket.getFiles({ prefix });
    return [
      found.map((file) => ({
        delete: async () => {
          await file.delete({ ignoreNotFound: true });
          files.delete(file.name);
        },
      })),
    ];
  },
};
const remove = createPermanentDeletionHandler(
  db,
  bucket,
  FieldValue,
  Timestamp,
);
const request = (data, uid = staffUid) =>
  remove({
    auth: uid ? { uid } : undefined,
    data: { confirmed: true, ...data },
  });
const check = async (label, action) => {
  await action();
  checks++;
  console.log(`PASS ${label}`);
};
const rejects = (action, code) =>
  assert.rejects(action, (error) => error.code === code);
const snapshot = async (path) => (await db.doc(path).get()).data();
async function main() {
  const env = await initializeTestEnvironment({
    projectId: "demo-clinic-qa",
    firestore: {
      host: "127.0.0.1",
      port: 8088,
      rules: fs.readFileSync(path.join(root, "firestore.rules"), "utf8"),
    },
    storage: {
      host: "127.0.0.1",
      port: 9198,
      rules: fs.readFileSync(path.join(root, "storage.rules"), "utf8"),
    },
  });
  try {
    await env.clearFirestore();
    const client = env.authenticatedContext(staffUid).firestore();
    const updatedAt = Timestamp.fromMillis(2000);
    const p1 = {
      id: "pay",
      kind: "payment",
      amount: 5000,
      paidAt: "2026-10-10T00:00:00Z",
      method: "cash",
      note: "",
    };
    const refund = { ...p1, id: "refund", kind: "refund", amount: 1000 };
    await db.doc("patients/a").set({
      name: "架空患者A",
      patientNumber: "000011",
      records: [
        {
          id: "record-a",
          reservationId: "visit-a",
          date: "2026-10-10T10:00",
          currentCondition: "架空所見",
        },
        {
          id: "record-other",
          reservationId: "visit-other",
          date: "2026-10-09T10:00",
        },
      ],
    });
    await db
      .doc("patients/ab")
      .set({ name: "架空患者B", patientNumber: "000012", records: [] });
    await db.doc("patientNumbers/000011").set({ patientId: "a" });
    await db
      .doc("clinicSettings/patientNumberCounter")
      .set({ lastNumber: 11, lastPatientNumber: "000011", lastPatientId: "a" });
    await db.doc("reservations/visit-a").set({
      patientId: "a",
      updatedAt,
      date: Timestamp.fromMillis(3000),
      status: "completed",
      payments: [p1, refund],
    });
    await db.doc("reservations/visit-other").set({
      patientId: "a",
      updatedAt,
      date: Timestamp.fromMillis(4000),
      status: "completed",
      payments: [p1],
    });
    await db.doc("reservations/visit-b").set({
      patientId: "ab",
      updatedAt,
      date: Timestamp.fromMillis(4000),
      status: "completed",
      payments: [p1, refund],
    });
    await db
      .doc("patients/a/encounters/encounter-a")
      .set({ reservationId: "visit-a", date: "2026-10-10" });
    await db
      .doc("patients/a/encounters/encounter-a/notes/nested")
      .set({ note: "架空の階層データ" });
    await db
      .doc("patients/a/encounters/encounter-other")
      .set({ reservationId: "visit-other", date: "2026-10-09" });
    await db
      .doc("patients/a/timeline/timeline-a")
      .set({ encounterId: "encounter-a" });
    await db
      .doc("patients/a/timeline/timeline-other")
      .set({ encounterId: "encounter-other" });
    files = new Set([
      "patients/a/records/record-a/file.pdf",
      "patients/a/records/encounter-a/file.jpg",
      "patients/a/records/record-other/file.pdf",
      "patients/ab/records/safe/file.pdf",
    ]);
    for (const name of files)
      await realBucket.file(name).save(Buffer.from("Fictional QA attachment"));
    const clientStorage = env
      .authenticatedContext(staffUid)
      .storage("gs://demo-clinic-qa.appspot.com");
    await check("staff attachment upload allowed before deletion", () =>
      assertSucceeds(
        uploadBytes(
          ref(clientStorage, "patients/a/records/qa/file.txt"),
          new Uint8Array([1, 2, 3]),
        ),
      ),
    );
    await check("unapproved attachment upload denied", () =>
      assertFails(
        uploadBytes(
          ref(
            env
              .authenticatedContext("outsider")
              .storage("gs://demo-clinic-qa.appspot.com"),
            "patients/a/records/qa/denied.txt",
          ),
          new Uint8Array([1]),
        ),
      ),
    );
    const visit = {
      kind: "reservation",
      patientId: "a",
      targetId: "visit-a",
      expectedUpdatedAt: 2000,
    };
    await check("unauthenticated deletion denied", () =>
      rejects(() => request(visit, null), "unauthenticated"),
    );
    await check("unapproved staff deletion denied", () =>
      rejects(() => request(visit, "outsider"), "permission-denied"),
    );
    await check("missing confirmation denied", () =>
      rejects(
        () => request({ ...visit, confirmed: false }),
        "invalid-argument",
      ),
    );
    await check("path injection denied", () =>
      rejects(
        () => request({ ...visit, patientId: "a/encounters/x" }),
        "invalid-argument",
      ),
    );
    await check("stale visit denied", () =>
      rejects(
        () => request({ ...visit, expectedUpdatedAt: 1 }),
        "failed-precondition",
      ),
    );
    await check("wrong patient denied", () =>
      rejects(
        () => request({ ...visit, patientId: "ab" }),
        "failed-precondition",
      ),
    );
    await check(
      "interrupted deletion reports failure and retains data/lock",
      async () => {
        failStorage = true;
        await rejects(() => request(visit), "internal");
        failStorage = false;
        assert.equal(
          (await snapshot("patients/a")).deletionOperation,
          "reservation:visit-a",
        );
        assert.equal((await snapshot("patients/a")).records.length, 2);
        assert.ok(await snapshot("reservations/visit-a"));
      },
    );
    await check("editing/recreation while locked denied by rules", async () => {
      await assertFails(
        uploadBytes(
          ref(clientStorage, "patients/a/records/qa/locked.txt"),
          new Uint8Array([1]),
        ),
      );
      await assertFails(
        updateDoc(doc(client, "patients/a"), { name: "編集不可" }),
      );
      await assertFails(
        setDoc(doc(client, "patients/a/encounters/new"), {
          date: "2026-10-10",
        }),
      );
      await assertFails(
        setDoc(doc(client, "reservations/new"), {
          patientId: "a",
          date: ClientTimestamp.fromMillis(5000),
          status: "booked",
          statusHistory: [{ status: "booked" }],
        }),
      );
    });
    await check("different deletion cannot override an unfinished job", () =>
      rejects(
        () =>
          request({
            kind: "patient",
            patientId: "a",
            expectedName: "架空患者A",
            expectedNumber: "000011",
          }),
        "failed-precondition",
      ),
    );
    await check(
      "retry deletes visit/linked charts/media without touching other visits",
      async () => {
        await request(visit);
        assert.equal(await snapshot("reservations/visit-a"), undefined);
        assert.equal(
          await snapshot("patients/a/encounters/encounter-a"),
          undefined,
        );
        assert.equal(
          await snapshot("patients/a/encounters/encounter-a/notes/nested"),
          undefined,
        );
        assert.equal(
          await snapshot("patients/a/timeline/timeline-a"),
          undefined,
        );
        const patient = await snapshot("patients/a");
        assert.equal(patient.records.length, 1);
        assert.equal(patient.lastVisitDate, "2026-10-09");
        assert.equal(patient.deletionOperation, undefined);
        assert.ok(await snapshot("reservations/visit-other"));
        assert.ok(await snapshot("patients/a/timeline/timeline-other"));
        assert.equal(files.has("patients/a/records/record-a/file.pdf"), false);
        assert.equal(
          files.has("patients/a/records/encounter-a/file.jpg"),
          false,
        );
        assert.equal(
          files.has("patients/a/records/record-other/file.pdf"),
          true,
        );
      },
    );
    await check("payment deletion verifies the displayed entry", () =>
      rejects(
        () =>
          request({
            kind: "payment",
            patientId: "ab",
            targetId: "visit-b",
            paymentId: "pay",
            expectedPayment: { ...p1, amount: 1 },
          }),
        "failed-precondition",
      ),
    );
    await check(
      "payment deletion removes only the chosen entry, including negative net",
      async () => {
        const reverse = Object.fromEntries(Object.entries(p1).reverse());
        const args = {
          kind: "payment",
          patientId: "ab",
          targetId: "visit-b",
          paymentId: "pay",
          expectedPayment: reverse,
        };
        await request(args);
        await request(args);
        const visit = await snapshot("reservations/visit-b");
        assert.deepEqual(visit.payments, [refund]);
        assert.ok(visit.updatedAt.toMillis() > 2000);
        assert.ok(await snapshot("patients/ab"));
      },
    );
    await check(
      "standalone chart deletion preserves visit/payments",
      async () => {
        await request({
          kind: "record",
          patientId: "a",
          targetId: "record-other",
        });
        assert.equal((await snapshot("patients/a")).records.length, 0);
        assert.ok(await snapshot("reservations/visit-other"));
        assert.equal(
          files.has("patients/a/records/record-other/file.pdf"),
          false,
        );
      },
    );
    await check("patient deletion validates displayed identity", () =>
      rejects(
        () =>
          request({
            kind: "patient",
            patientId: "a",
            expectedName: "別の氏名",
            expectedNumber: "000011",
          }),
        "failed-precondition",
      ),
    );
    const writer = db.bulkWriter();
    for (let i = 0; i < 620; i++)
      writer.set(db.doc(`patients/a/futureHistory/item-${i}`), {
        value: "架空履歴",
      });
    await writer.close();
    await check(
      "patient deletion cleans more than 500 docs and unknown descendants",
      async () => {
        const args = {
          kind: "patient",
          patientId: "a",
          expectedName: "架空患者A",
          expectedNumber: "000011",
        };
        await request(args);
        await request(args);
        assert.equal(await snapshot("patients/a"), undefined);
        assert.equal(
          (await realBucket.getFiles({ prefix: "patients/a/" }))[0].length,
          0,
        );
        assert.equal(await snapshot("reservations/visit-other"), undefined);
        assert.equal(
          (await db.collection("patients/a/futureHistory").get()).size,
          0,
        );
        assert.equal(
          (await db.collection("patients/a/encounters").get()).size,
          0,
        );
        assert.deepEqual(await snapshot("patientNumbers/000011"), {
          retired: true,
        });
        assert.deepEqual(
          await snapshot("clinicSettings/patientNumberCounter"),
          { lastNumber: 11 },
        );
        assert.ok(await snapshot("patients/ab"));
        assert.ok(await snapshot("reservations/visit-b"));
        assert.equal(files.has("patients/ab/records/safe/file.pdf"), true);
      },
    );
    await check(
      "retired patient number is not reused; next atomic allocation still works",
      async () => {
        const batch = writeBatch(client);
        batch.set(doc(client, "clinicSettings/patientNumberCounter"), {
          lastNumber: 13,
          lastPatientNumber: "000013",
          lastPatientId: "new",
        });
        batch.set(doc(client, "patientNumbers/000013"), { patientId: "new" });
        batch.set(doc(client, "patients/new"), {
          name: "新規の架空患者",
          patientNumber: "000013",
        });
        await assertSucceeds(batch.commit());
        await assertFails(
          setDoc(doc(client, "patients/reused"), { patientNumber: "000011" }),
        );
      },
    );
    await check("upload after patient removal denied", () =>
      assertFails(
        uploadBytes(
          ref(clientStorage, "patients/a/records/qa/late.txt"),
          new Uint8Array([1]),
        ),
      ),
    );
    console.log(
      `${checks} permanent deletion checks passed (demo Firestore and Storage).`,
    );
  } finally {
    await env.cleanup();
    await db.terminate();
    await app.delete();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
