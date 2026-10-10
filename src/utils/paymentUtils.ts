import {
  Reservation,
  ReservationPayment,
  PaymentMethod,
} from "../types/reservation";
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "現金",
  card: "カード",
  transfer: "振込",
  other: "その他",
};
export const yen = (amount: number): string =>
  `${amount.toLocaleString("ja-JP")} 円`;
export const validatePayments = (payments: ReservationPayment[]): void => {
  if (!Array.isArray(payments))
    throw new Error("支払い明細の形式が正しくありません。");
  const ids = new Set<string>();
  payments.forEach((entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !entry.id ||
      ids.has(entry.id)
    )
      throw new Error("支払い明細のIDが重複または不正です。");
    ids.add(entry.id);
    if (!Number.isSafeInteger(entry.amount) || entry.amount <= 0)
      throw new Error("入金・返金額は1円以上の整数で入力してください。");
    if (
      !["payment", "refund"].includes(entry.kind) ||
      !Object.prototype.hasOwnProperty.call(PAYMENT_METHOD_LABELS, entry.method)
    )
      throw new Error("支払い区分・方法を確認してください。");
    if (
      !/\+09:00$|Z$/.test(entry.paidAt) ||
      !Number.isFinite(new Date(entry.paidAt).getTime())
    )
      throw new Error("支払日時を正しく入力してください。");
    if (typeof entry.note !== "string")
      throw new Error("支払いメモの形式が正しくありません。");
  });
};
export const paymentTotals = (
  reservations: Pick<Reservation, "payments">[],
) => {
  let received = 0,
    refunded = 0;
  reservations.forEach((reservation) => {
    validatePayments(reservation.payments ?? []);
    (reservation.payments ?? []).forEach((entry) => {
      if (entry.kind === "refund") refunded += entry.amount;
      else received += entry.amount;
    });
  });
  if (!Number.isSafeInteger(received) || !Number.isSafeInteger(refunded))
    throw new Error("支払いの集計額が上限を超えています。");
  return { received, refunded, net: received - refunded };
};
/** Persisted entries cannot be rewritten. Corrections use an additional refund/payment. */
export const mergePayments = (
  previous: ReservationPayment[],
  requested: ReservationPayment[] | undefined,
  staffUid: string,
  now: string,
): ReservationPayment[] => {
  const entries = requested ?? previous;
  validatePayments(entries);
  const oldById = new Map(previous.map((entry) => [entry.id, entry]));
  previous.forEach((old) => {
    const next = entries.find((entry) => entry.id === old.id);
    if (
      !next ||
      ["kind", "amount", "paidAt", "method", "note"].some(
        (key) => (next as any)[key] !== (old as any)[key],
      ) ||
      ["createdAt", "createdBy"].some(
        (key) =>
          (next as any)[key] !== undefined &&
          (next as any)[key] !== (old as any)[key],
      )
    )
      throw new Error(
        "保存済みの支払いは変更・削除できません。訂正は返金・入金を追加してください。",
      );
  });
  const merged = [
    ...previous,
    ...entries
      .filter((entry) => !oldById.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        amount: entry.amount,
        paidAt: entry.paidAt,
        method: entry.method,
        note: entry.note.trim(),
        createdAt: now,
        createdBy: staffUid,
      })),
  ];
  const baseline = paymentTotals([{ payments: previous }]);
  const additions = paymentTotals([
    { payments: merged.filter((entry) => !oldById.has(entry.id)) },
  ]);
  if (additions.refunded > Math.max(0, baseline.net) + additions.received)
    throw new Error("返金額は、この予約の入金額を超えられません。");
  return merged;
};
