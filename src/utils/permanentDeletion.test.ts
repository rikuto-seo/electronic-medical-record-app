import { test, expect, jest } from "@jest/globals";
import { httpsCallable, getFunctions } from "firebase/functions";
import {
  permanentlyDeletePayment,
  permanentlyDeletePatient,
} from "./permanentDeletion";
import type { Mock } from "jest-mock";
jest.mock("../firebase", () => ({ db: { app: "clinic-app" } }));
jest.mock("firebase/functions", () => {
  const { jest } = require("@jest/globals");
  return { httpsCallable: jest.fn(), getFunctions: jest.fn(() => ({})) };
});
test("支払いの確認データに表示用の予約オブジェクトを混ぜない", async () => {
  const call = jest.fn(async () => ({ data: { deleted: true } }));
  (httpsCallable as unknown as Mock<any, any[]>).mockReturnValue(call);
  const payment = {
    id: "pay1",
    kind: "payment" as const,
    amount: 3000,
    paidAt: "2026-10-10T00:00:00Z",
    method: "cash" as const,
    note: "",
  };
  const reservation = {
    id: "r1",
    patientId: "p1",
    date: new Date(),
    duration: 30,
    type: "施術",
    memo: "",
    payments: [payment],
  };
  const displayEntry = { ...payment, reservation };
  await permanentlyDeletePayment(reservation, displayEntry);
  expect(getFunctions).toHaveBeenCalledWith("clinic-app", "asia-northeast1");
  expect(call).toHaveBeenCalledWith({
    kind: "payment",
    patientId: "p1",
    targetId: "r1",
    paymentId: "pay1",
    expectedPayment: payment,
    confirmed: true,
  });
});
test("未公開・接続エラーでは削除成功と扱わず具体的な案内を返す", async () => {
  const call = jest.fn(async () => {
    throw Object.assign(new Error("not found"), {
      code: "functions/not-found",
    });
  });
  (httpsCallable as unknown as Mock<any, any[]>).mockReturnValue(call);
  await expect(
    permanentlyDeletePatient({
      id: "p1",
      name: "検証患者",
      gender: "男性",
      birthDate: "1990-01-01",
      age: 36,
      firstVisitDate: "2026-10-10",
    }),
  ).rejects.toThrow("Cloud Functionsの公開状態");
});
