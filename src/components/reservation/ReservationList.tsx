import React from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, FileText } from "lucide-react";
import {
  Reservation,
  ReservationSettings,
  ReservationStatus,
} from "../../types/reservation";
import { Patient } from "../../types/PatientData";
import {
  clinicTime,
  clinicDateKey,
  dayLabel,
  reservationEnd,
  reservationStatus,
  STATUS_LABELS,
} from "../../utils/reservationUtils";
import { paymentTotals, yen } from "../../utils/paymentUtils";

interface Props {
  reservations: Reservation[];
  patients: Patient[];
  days: string[];
  view: "day" | "week";
  settings: ReservationSettings;
  busyId: string;
  disabled: boolean;
  hasFilters: boolean;
  onEdit: (reservation: Reservation) => void;
  onNext: (reservation: Reservation) => void;
  onStatus: (reservation: Reservation, status: ReservationStatus) => void;
  onAdd: (day: string) => void;
}
const NEXT_STATUS: Partial<Record<ReservationStatus, ReservationStatus>> = {
  booked: "checked_in",
  checked_in: "in_treatment",
  in_treatment: "completed",
};
const ReservationList: React.FC<Props> = (props) => {
  const patientMap = new Map(
    props.patients.map((patient) => [patient.id, patient]),
  );
  return (
    <div className={`reservation-agenda reservation-agenda-${props.view}`}>
      {props.days.map((day) => {
        const reservations = props.reservations.filter(
          (item) => clinicDateKey(item.date) === day,
        );
        return (
          <section
            key={day}
            className="reservation-day-column"
            aria-label={`${dayLabel(day)}の予約`}
          >
            <header className="reservation-day-heading">
              <div>
                <h3>{dayLabel(day)}</h3>
                <span>{reservations.length}件</span>
              </div>
              <button
                className="reservation-icon-button"
                onClick={() => props.onAdd(day)}
                disabled={props.disabled}
                aria-label={`${dayLabel(day)}に予約を追加`}
              >
                <Plus size={18} />
              </button>
            </header>
            {reservations.length === 0 && (
              <div className="reservation-empty">
                <p>
                  {props.hasFilters
                    ? "条件に合う予約はありません"
                    : "予約はありません"}
                </p>
                <button
                  className="reservation-secondary"
                  onClick={() => props.onAdd(day)}
                  disabled={props.disabled}
                >
                  この日に予約を追加
                </button>
              </div>
            )}
            {reservations.map((reservation) => {
              const patient = patientMap.get(reservation.patientId);
              const status = reservationStatus(reservation);
              const next = NEXT_STATUS[status];
              const busy = props.busyId === reservation.id;
              const deleting =
                !!reservation.deletionOperation || !!patient?.deletionOperation;
              const payment = paymentTotals([reservation]);
              return (
                <article
                  className={`reservation-entry status-${status}`}
                  key={reservation.id}
                >
                  <div className="reservation-entry-time">
                    <strong>{clinicTime(reservation.date)}</strong>
                    <span>
                      〜 {clinicTime(reservationEnd(reservation))}
                      {clinicDateKey(reservationEnd(reservation)) !== day
                        ? "（翌日）"
                        : ""}
                    </span>
                    <small>{reservation.duration}分</small>
                  </div>
                  <div className="reservation-entry-body">
                    <div className="reservation-entry-title">
                      <Link
                        to={`/patients/${reservation.patientId}?tab=history`}
                      >
                        {patient?.name || "患者情報未取得"}
                      </Link>
                      <span className={`reservation-status status-${status}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <p className="reservation-entry-menu">{reservation.type}</p>
                    <div className="reservation-entry-meta">
                      <span>
                        担当：
                        {props.settings.staff.find(
                          (item) => item.id === reservation.staffId,
                        )?.name ||
                          reservation.staffName ||
                          "未指定"}
                      </span>
                      <span>
                        {props.settings.beds.find(
                          (item) => item.id === reservation.bedId,
                        )?.name ||
                          reservation.bedName ||
                          "ベッド未指定"}
                      </span>
                      {patient?.phoneNumber && (
                        <span>{patient.phoneNumber}</span>
                      )}
                    </div>
                    {reservation.memo && (
                      <p className="reservation-entry-memo">
                        {reservation.memo}
                      </p>
                    )}
                    {reservation.cancellationReason && (
                      <p className="reservation-entry-memo">
                        キャンセル理由：{reservation.cancellationReason}
                      </p>
                    )}
                    <p className="reservation-entry-money">
                      請求：
                      {reservation.feeAmount == null
                        ? "未入力"
                        : yen(reservation.feeAmount)}{" "}
                      / 入金：{yen(payment.received)}
                      {payment.refunded
                        ? ` / 返金：${yen(payment.refunded)}`
                        : ""}
                    </p>
                  </div>
                  <div className="reservation-entry-actions">
                    {next && (
                      <button
                        onClick={() => props.onStatus(reservation, next)}
                        disabled={props.disabled || !!props.busyId || deleting}
                      >
                        {busy ? "更新中…" : STATUS_LABELS[next]}
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      className="reservation-secondary"
                      onClick={() => props.onEdit(reservation)}
                      disabled={props.disabled || !!props.busyId}
                    >
                      予約・支払い
                    </button>
                    <button
                      className="reservation-secondary"
                      onClick={() => props.onNext(reservation)}
                      disabled={props.disabled || !!props.busyId}
                    >
                      次回予約
                    </button>
                    <Link
                      className="reservation-chart-link"
                      to={`/patients/${reservation.patientId}?tab=chart${reservation.id ? `&reservationId=${encodeURIComponent(reservation.id)}` : ""}`}
                    >
                      <FileText size={14} />
                      カルテ入力
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};
export default ReservationList;
