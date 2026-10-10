import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ReservationPayment, PaymentMethod } from "../../types/reservation";
import {
  clinicDateTimeInput,
  parseClinicDateTime,
} from "../../utils/reservationUtils";
import {
  PAYMENT_METHOD_LABELS,
  paymentTotals,
  validatePayments,
  yen,
} from "../../utils/paymentUtils";
import { pdfDate } from "../../utils/patientPdfData";
interface Props {
  payments: ReservationPayment[];
  savedIds: string[];
  onChange: (payments: ReservationPayment[]) => void;
  onDraftChange: (dirty: boolean) => void;
}
const PaymentEditor: React.FC<Props> = ({
  payments,
  savedIds,
  onChange,
  onDraftChange,
}) => {
  const [kind, setKind] = useState<"payment" | "refund">("payment");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => clinicDateTimeInput(new Date()));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useEffect(
    () => onDraftChange(!!amount || !!note),
    [amount, note, onDraftChange],
  );
  const totals = paymentTotals([{ payments }]);
  const remove = (id: string) => {
    const next = payments.filter((item) => item.id !== id);
    if (
      paymentTotals([{ payments: next }]).net < 0 &&
      next.some(
        (entry) => entry.kind === "refund" && !savedIds.includes(entry.id),
      )
    ) {
      setError("この入金を取り消す前に、未保存の返金を取り消してください。");
      return;
    }
    onChange(next);
    setError("");
  };
  const add = () => {
    try {
      const paidAt = parseClinicDateTime(date);
      if (!Number.isFinite(paidAt.getTime()))
        throw new Error("支払日時を入力してください。");
      const entry: ReservationPayment = {
        id: uuidv4(),
        kind,
        amount: amount.trim() ? Number(amount) : NaN,
        paidAt: paidAt.toISOString(),
        method,
        note: note.trim(),
      };
      validatePayments([entry]);
      const next = [...payments, entry];
      if (
        entry.kind === "refund" &&
        paymentTotals([{ payments: next }]).net < 0
      )
        throw new Error("返金額は、この予約の入金額を超えられません。");
      onChange(next);
      setAmount("");
      setNote("");
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "明細を追加できませんでした。",
      );
    }
  };
  return (
    <section
      className="reservation-payment-editor"
      aria-label="入金・返金の記録"
    >
      <h3>入金・返金</h3>
      <p className="reservation-help">
        実際に受け取った金額を記録します。明細を追加し、予約と一緒に保存してください。保存済み明細の訂正は返金・入金を追加します。
      </p>
      <div className="reservation-payment-summary">
        入金 {yen(totals.received)} / 返金 {yen(totals.refunded)} / 差引{" "}
        {yen(totals.net)}
      </div>
      {!!payments.length && (
        <ul className="reservation-payment-list">
          {payments.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>
                  {entry.kind === "refund" ? "返金" : "入金"}{" "}
                  {yen(entry.amount)}
                </strong>
                <span>
                  {pdfDate(entry.paidAt, true)} /{" "}
                  {PAYMENT_METHOD_LABELS[entry.method]}
                </span>
                {entry.note && <span>{entry.note}</span>}
                <small>
                  {savedIds.includes(entry.id) ? "保存済み" : "未保存の明細"}
                </small>
              </div>
              {!savedIds.includes(entry.id) && (
                <button
                  type="button"
                  className="reservation-secondary"
                  onClick={() => remove(entry.id)}
                >
                  追加を取り消す
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="reservation-form-grid">
        <label>
          支払い区分
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as "payment" | "refund")
            }
          >
            <option value="payment">入金</option>
            <option value="refund">返金</option>
          </select>
        </label>
        <label>
          入金・返金額（円）
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="金額を入力"
          />
        </label>
        <label>
          支払日時
          <input
            type="datetime-local"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label>
          支払方法
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="reservation-span-2">
          支払いメモ
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="分割入金・返金理由など"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="reservation-error">
          {error}
        </p>
      )}
      <button type="button" className="reservation-secondary" onClick={add}>
        明細に追加
      </button>
    </section>
  );
};
export default PaymentEditor;
