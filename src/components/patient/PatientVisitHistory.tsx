import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MedicalRecord } from "../../types/PatientData";
import { Reservation } from "../../types/reservation";
import { subscribePatientReservations } from "../../utils/reservationService";
import {
  reservationStatus,
  STATUS_LABELS,
  clinicDateKey,
} from "../../utils/reservationUtils";
import {
  paymentTotals,
  PAYMENT_METHOD_LABELS,
  yen,
} from "../../utils/paymentUtils";
import { pdfDate } from "../../utils/patientPdfData";
import MedicalRecordList from "../record/MedicalRecordList";
import "./visitHistory.css";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import {
  permanentlyDeleteVisit,
  permanentlyDeletePayment,
} from "../../utils/permanentDeletion";
interface Props {
  patientId: string;
  patientName?: string;
  records: MedicalRecord[];
  onEdit: (record: MedicalRecord) => void;
}
const PatientVisitHistory: React.FC<Props> = ({
  patientId,
  patientName = "選択中の患者",
  records,
  onEdit,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setReservations([]);
    const unsubscribe = subscribePatientReservations(
      patientId,
      (data) => {
        if (active) {
          setReservations(data);
          setLoading(false);
        }
      },
      () => {
        if (active) {
          setReservations([]);
          setLoading(false);
          setError(
            "来院・支払い履歴を取得できません。接続とアクセス権限を確認してください。",
          );
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [patientId, retry]);
  if (loading) return <p role="status">来院・支払い履歴を読み込み中…</p>;
  if (error)
    return (
      <div>
        <p role="alert" className="patient-error">
          {error}
        </p>
        <button onClick={() => setRetry((value) => value + 1)}>
          履歴を再読み込み
        </button>
      </div>
    );
  let totals;
  try {
    totals = paymentTotals(reservations);
  } catch {
    return (
      <p role="alert" className="patient-error">
        支払い明細を確認できないため集計を表示できません。登録状況を確認してください。
      </p>
    );
  }
  const visited = reservations.filter((item) =>
    ["checked_in", "in_treatment", "completed"].includes(
      reservationStatus(item),
    ),
  ).length;
  const knownIds = new Set(reservations.map((item) => item.id).filter(Boolean));
  const unlinked = records.filter(
    (record) => !record.reservationId || !knownIds.has(record.reservationId),
  );
  const payments = reservations
    .flatMap((reservation) =>
      (reservation.payments ?? []).map((entry) => ({ ...entry, reservation })),
    )
    .sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  return (
    <div className="patient-visit-history">
      <section
        className="patient-history-totals"
        aria-label="患者の来院・支払い集計"
      >
        <div>
          <span>来院回数</span>
          <strong>
            {visited}
            <small>回</small>
          </strong>
        </div>
        <div>
          <span>支払総額（入金）</span>
          <strong>{yen(totals.received)}</strong>
        </div>
        <div>
          <span>返金総額</span>
          <strong>{yen(totals.refunded)}</strong>
        </div>
        <div>
          <span>差引支払総額</span>
          <strong>{yen(totals.net)}</strong>
        </div>
      </section>
      <p className="patient-help">
        支払総額は保存した入金明細の合計です。未払いの請求額は含みません。キャンセル・無断キャンセルも履歴に残ります。
      </p>
      {totals.net < 0 && (
        <p className="patient-help">
          返金総額が入金総額を超えています。入金明細を削除した場合は集計をご確認ください。
        </p>
      )}
      <div className="patient-section-heading">
        <h2>来院・予約履歴</h2>
        <Link to="/reservations">予約・支払いを管理</Link>
      </div>
      {!reservations.length && (
        <p className="patient-help">予約・来院履歴はまだありません。</p>
      )}
      {reservations.map((reservation) => {
        const status = reservationStatus(reservation);
        const related = records.filter(
          (record) => reservation.id && record.reservationId === reservation.id,
        );
        const subtotal = paymentTotals([reservation]);
        const cancelledBefore = reservation.statusHistory?.some((event) =>
          ["cancelled", "no_show"].includes(event.status),
        );
        return (
          <article className="patient-visit-card" key={reservation.id}>
            <header>
              <div>
                <h3>{pdfDate(reservation.date.toISOString(), true)}</h3>
                <p>
                  {reservation.type} / 担当：{reservation.staffName || "未指定"}
                </p>
              </div>
              <span className={`visit-status visit-status-${status}`}>
                {STATUS_LABELS[status]}
              </span>
              {cancelledBefore &&
                !["cancelled", "no_show"].includes(status) && (
                  <span className="visit-status visit-status-cancelled">
                    キャンセル履歴あり
                  </span>
                )}
            </header>
            {reservation.cancellationReason && (
              <p className="visit-cancellation">
                キャンセル理由：{reservation.cancellationReason}
              </p>
            )}
            {reservation.memo && (
              <p className="visit-note">受付メモ：{reservation.memo}</p>
            )}
            <div className="visit-billing">
              <span>
                請求：
                {reservation.feeAmount == null
                  ? "未入力"
                  : yen(reservation.feeAmount)}
              </span>
              <span>入金：{yen(subtotal.received)}</span>
              <span>返金：{yen(subtotal.refunded)}</span>
            </div>
            <div className="patient-actions">
              <Link
                to={`/reservations?date=${clinicDateKey(reservation.date)}&reservationId=${encodeURIComponent(reservation.id ?? "")}`}
              >
                予約・支払いを開く
              </Link>
              {!["cancelled", "no_show"].includes(status) && (
                <Link
                  to={`/patients/${patientId}?tab=chart&reservationId=${encodeURIComponent(reservation.id ?? "")}`}
                >
                  この回のカルテを入力
                </Link>
              )}
              <ConfirmDeleteButton
                label="この来院を完全削除"
                target={`${patientName} / ${pdfDate(reservation.date.toISOString(), true)} / ${reservation.type}`}
                description="この来院・予約の変更履歴、請求・入金・返金、その予約に紐付いたカルテと添付ファイルを完全に削除します。患者の基本情報と他の来院は残します。"
                onDelete={() => permanentlyDeleteVisit(reservation)}
              />
            </div>
            {!!related.length ? (
              <details className="visit-records">
                <summary>この回のカルテを確認（{related.length}件）</summary>
                <MedicalRecordList
                  records={related}
                  patientId={patientId}
                  onEdit={onEdit}
                  patientName={patientName}
                />
              </details>
            ) : (
              <p className="patient-help">
                この予約に紐付いたカルテは未登録です。
              </p>
            )}
            {!!reservation.statusHistory?.length && (
              <details className="visit-changes">
                <summary>
                  予約の変更履歴（{reservation.statusHistory.length}件）
                </summary>
                <ol>
                  {reservation.statusHistory.map((event, index) => (
                    <li key={`${event.at}-${index}`}>
                      <strong>{STATUS_LABELS[event.status]}</strong>
                      <span>
                        変更：
                        {event.at
                          ? pdfDate(event.at, true)
                          : "日時未記録（旧予約）"}
                      </span>
                      <span>
                        予約日時：{pdfDate(event.reservationDate, true)} /{" "}
                        {event.type}
                      </span>
                      {event.cancellationReason && (
                        <span>理由：{event.cancellationReason}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </article>
        );
      })}
      {!!unlinked.length && (
        <section>
          <h2>予約と未連携のカルテ</h2>
          <p className="patient-help">
            以前のカルテなど、予約との対応が未登録の記録です。
          </p>
          <MedicalRecordList
            records={unlinked}
            patientId={patientId}
            onEdit={onEdit}
            patientName={patientName}
          />
        </section>
      )}
      <section className="patient-payments">
        <h2>支払い明細</h2>
        {!payments.length ? (
          <p className="patient-help">入金・返金の記録はまだありません。</p>
        ) : (
          <div className="patient-table-wrap">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>支払日時</th>
                  <th>区分</th>
                  <th>金額</th>
                  <th>方法</th>
                  <th>対象の来院・予約</th>
                  <th>メモ</th>
                  <th>削除</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((entry) => (
                  <tr key={`${entry.reservation.id}-${entry.id}`}>
                    <td>{pdfDate(entry.paidAt, true)}</td>
                    <td>{entry.kind === "refund" ? "返金" : "入金"}</td>
                    <td className="payment-amount">{yen(entry.amount)}</td>
                    <td>{PAYMENT_METHOD_LABELS[entry.method]}</td>
                    <td>
                      <Link
                        to={`/reservations?date=${clinicDateKey(entry.reservation.date)}&reservationId=${encodeURIComponent(entry.reservation.id ?? "")}`}
                      >
                        {pdfDate(entry.reservation.date.toISOString())} /{" "}
                        {entry.reservation.type}
                      </Link>
                    </td>
                    <td>{entry.note || "—"}</td>
                    <td>
                      <ConfirmDeleteButton
                        label="明細を完全削除"
                        target={`${patientName} / ${entry.kind === "refund" ? "返金" : "入金"} ${yen(entry.amount)} / ${pdfDate(entry.paidAt, true)}`}
                        description="この支払い明細だけを完全に削除し、患者の支払総額を再集計します。実際のお金の返金処理は行いません。"
                        onDelete={() =>
                          permanentlyDeletePayment(entry.reservation, entry)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {!records.length && (
        <p className="patient-help">
          診療記録はまだありません。「カルテ入力」から記録を追加できます。
        </p>
      )}
    </div>
  );
};
export default PatientVisitHistory;
