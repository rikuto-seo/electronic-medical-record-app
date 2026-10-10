import { beforeEach, test, expect, jest } from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
import {
  doc,
  getDocFromServer,
  getDocsFromServer,
  runTransaction,
} from "firebase/firestore";
import {
  registerPatientWithNumber,
  issuePatientNumber,
  formatPatientNumber,
} from "./patientNumber";
import { Patient } from "../../types/PatientData";
type Mock = JestMock<any, any[]>;
jest.mock("../../firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => {
  const { jest } = require("@jest/globals");
  return {
    doc: jest.fn(),
    collection: () => "patients",
    getDocFromServer: jest.fn(),
    getDocsFromServer: jest.fn(),
    runTransaction: jest.fn(),
  };
});
const patient = (id: string): Patient => ({
  id,
  name: "患者",
  gender: "女性",
  birthDate: "1990-01-01",
  age: 36,
  firstVisitDate: "2026-10-10",
  address: "住所",
  records: [],
});
let documents: Map<string, any>;
let updates: Mock;
let queue: Promise<unknown>;
const snapshot = (path: string) => ({
  exists: () => documents.has(path),
  data: () => documents.get(path),
});
beforeEach(() => {
  documents = new Map();
  updates = jest.fn() as Mock;
  queue = Promise.resolve();
  (doc as unknown as Mock).mockImplementation((_db, ...path: string[]) =>
    path.join("/"),
  );
  (getDocFromServer as unknown as Mock).mockImplementation((path: string) =>
    Promise.resolve(snapshot(path)),
  );
  (getDocsFromServer as unknown as Mock).mockImplementation(() =>
    Promise.resolve({
      docs: Array.from(documents)
        .filter(([path]) => path.startsWith("patients/"))
        .map(([path, data]) => ({ id: path.split("/")[1], data: () => data })),
    }),
  );
  (runTransaction as unknown as Mock).mockImplementation((_db, callback) => {
    const result = queue.then(async () => {
      let writing = false;
      const pending: [string, any][] = [];
      const tx = {
        get: async (path: string) => {
          if (writing) throw new Error("read after write");
          return snapshot(path);
        },
        set: (path: string, data: any) => {
          writing = true;
          updates(path, data);
          pending.push([path, data]);
        },
        update: (path: string, data: any) => {
          writing = true;
          updates(path, data);
          pending.push([path, { ...documents.get(path), ...data }]);
        },
      };
      const result = await callback(tx);
      pending.forEach(([path, data]) => documents.set(path, data));
      return result;
    });
    queue = result.catch(() => {});
    return result;
  });
});
test("新規登録は手入力番号を無視し、患者・番号台帳・カウンタを同時に保存する", async () => {
  const saved = await registerPatientWithNumber({
    ...patient("p1"),
    patientNumber: "999999",
  });
  expect(saved.patientNumber).toBe("000001");
  expect(documents.get("patients/p1")).toMatchObject({
    patientNumber: "000001",
    address: "住所",
  });
  expect(documents.get("patientNumbers/000001")).toEqual({ patientId: "p1" });
  expect(documents.get("clinicSettings/patientNumberCounter")).toEqual({
    lastNumber: 1,
    lastPatientNumber: "000001",
    lastPatientId: "p1",
  });
});
test("複数登録と同一IDの再送でも番号を消費・上書きしない", async () => {
  const [a, b] = await Promise.all([
    registerPatientWithNumber(patient("a")),
    registerPatientWithNumber(patient("b")),
  ]);
  expect([a.patientNumber, b.patientNumber]).toEqual(["000001", "000002"]);
  updates.mockClear();
  expect(
    await registerPatientWithNumber({ ...patient("a"), name: "別名" }),
  ).toEqual(a);
  expect(updates).not.toHaveBeenCalled();
});
test("旧番号の最大値から開始し、未発行患者には情報・カルテを保持して発行する", async () => {
  documents.set("patients/old", { ...patient("old"), patientNumber: "004201" });
  const old = {
    ...patient("missing"),
    records: [{ id: "r1", currentCondition: "所見" }],
  };
  documents.set("patients/missing", old);
  const issued = await issuePatientNumber("missing");
  expect(issued.patientNumber).toBe("004202");
  expect(documents.get("patients/missing")).toMatchObject(old);
  expect((await issuePatientNumber("old")).patientNumber).toBe("004201");
});
test("台帳に存在する番号を再使用しない", async () => {
  documents.set("clinicSettings/patientNumberCounter", { lastNumber: 5 });
  documents.set("patientNumbers/000006", { patientId: "other" });
  expect((await registerPatientWithNumber(patient("a"))).patientNumber).toBe(
    "000007",
  );
});
test("同時登録による権限拒否はカウンタの進行を確認した場合だけ再試行する", async () => {
  (runTransaction as unknown as Mock).mockImplementationOnce(async () => {
    // Let the production callback read the old counter before rejecting its commit.
    const callback = (runTransaction as unknown as Mock).mock.calls[0][1];
    await callback({
      get: async (path: string) => snapshot(path),
      set: () => {},
      update: () => {},
    });
    documents.set("clinicSettings/patientNumberCounter", { lastNumber: 1 });
    documents.set("patientNumbers/000001", { patientId: "other" });
    throw Object.assign(new Error("concurrent registry claim"), {
      code: "permission-denied",
    });
  });
  expect((await registerPatientWithNumber(patient("a"))).patientNumber).toBe(
    "000002",
  );
  expect(runTransaction).toHaveBeenCalledTimes(2);
});
test("実際の権限拒否は再試行しない", async () => {
  const denied = Object.assign(new Error("denied"), {
    code: "permission-denied",
  });
  (runTransaction as unknown as Mock).mockRejectedValueOnce(denied);
  await expect(registerPatientWithNumber(patient("a"))).rejects.toBe(denied);
  expect(runTransaction).toHaveBeenCalledTimes(1);
});
test("不正なカウンタ・上限では何も書き込まない", async () => {
  documents.set("clinicSettings/patientNumberCounter", { lastNumber: -1 });
  await expect(registerPatientWithNumber(patient("a"))).rejects.toThrow(
    "カウンター",
  );
  expect(updates).not.toHaveBeenCalled();
  expect(() => formatPatientNumber(1000000000000)).toThrow("上限");
  expect(formatPatientNumber(1000000)).toBe("1000000");
});
