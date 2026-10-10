import { test, expect } from "@jest/globals";
import { mergePayments, paymentTotals, validatePayments } from "./paymentUtils";
import { ReservationPayment } from "../types/reservation";
const payment: ReservationPayment = {
  id: "pay-1",
  kind: "payment",
  amount: 5000,
  paidAt: "2026-10-10T01:00:00Z",
  method: "cash",
  note: "初回入金",
};
test("請求額や予約の状態ではなく、実際の入金・返金をそれぞれ集計する", () => {
  expect(
    paymentTotals([
      { payments: [payment] },
      {
        payments: [{ ...payment, id: "refund", kind: "refund", amount: 1000 }],
      },
      { payments: [] },
    ]),
  ).toEqual({ received: 5000, refunded: 1000, net: 4000 });
});
test("整数の金額・支払日時・一意の明細IDを検証する", () => {
  [0, -10, 1.5, Infinity].forEach((amount) =>
    expect(() => validatePayments([{ ...payment, amount }])).toThrow("整数"),
  );
  expect(() => validatePayments([payment, payment])).toThrow("重複");
  expect(() =>
    validatePayments([{ ...payment, paidAt: "2026-10-10T10:00" }]),
  ).toThrow("日時");
});
test("保存済み明細は残し、追加分だけに登録者と登録日時を付ける", () => {
  const original = { ...payment, createdAt: "old", createdBy: "old-staff" };
  const added = {
    ...payment,
    id: "refund",
    kind: "refund" as const,
    amount: 1000,
    note: "訂正",
  };
  expect(
    mergePayments([original], [original, added], "staff-a", "now"),
  ).toEqual([original, { ...added, createdAt: "now", createdBy: "staff-a" }]);
  expect(() => mergePayments([original], [], "staff", "now")).toThrow(
    "変更・削除",
  );
  expect(() =>
    mergePayments([original], [{ ...original, amount: 6000 }], "staff", "now"),
  ).toThrow("変更・削除");
});
test("返金超過を拒否し、不確実な保存の再送でも同じ明細を二重に追加しない", () => {
  const saved = mergePayments([], [payment], "staff", "first");
  expect(mergePayments(saved, [payment], "staff", "retry")).toEqual(saved);
  expect(() =>
    mergePayments(
      saved,
      [...saved, { ...payment, id: "refund", kind: "refund", amount: 6000 }],
      "staff",
      "now",
    ),
  ).toThrow("超えられません");
  expect(mergePayments(saved, undefined, "staff", "now")).toEqual(saved);
});
test("入金の完全削除で差引が負になっても、残る明細の編集を妨げない", () => {
  const refund = {
    ...payment,
    id: "refund",
    kind: "refund" as const,
    amount: 1000,
  };
  expect(mergePayments([refund], undefined, "staff", "now")).toEqual([refund]);
  const addition = { ...payment, id: "new-payment", amount: 500 };
  expect(
    paymentTotals([
      { payments: mergePayments([refund], [refund, addition], "staff", "now") },
    ]).net,
  ).toBe(-500);
  expect(() =>
    mergePayments(
      [refund],
      [refund, { ...refund, id: "another-refund", amount: 1 }],
      "staff",
      "now",
    ),
  ).toThrow("超えられません");
});
