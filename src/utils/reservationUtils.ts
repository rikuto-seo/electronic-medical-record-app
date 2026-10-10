import {
  Reservation,
  ReservationSettings,
  ReservationStatus,
} from "../types/reservation";
import { validatePayments } from "./paymentUtils";

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  booked: "予約",
  checked_in: "来院",
  in_treatment: "施術中",
  completed: "終了",
  cancelled: "キャンセル",
  no_show: "無断キャンセル",
};
export const DEFAULT_RESERVATION_SETTINGS: ReservationSettings = {
  staff: [],
  beds: [],
  menus: [
    { id: "initial", name: "初診", duration: 60, active: true },
    { id: "followup", name: "再診", duration: 30, active: true },
    { id: "acupuncture", name: "鍼灸", duration: 45, active: true },
  ],
};
export const reservationStatus = (
  reservation: Pick<Reservation, "status" | "checkedIn">,
): ReservationStatus =>
  reservation.status ?? (reservation.checkedIn ? "checked_in" : "booked");
export const occupiesSlot = (
  reservation: Pick<Reservation, "status" | "checkedIn">,
) => !["cancelled", "no_show"].includes(reservationStatus(reservation));

// 院内日時は端末のタイムゾーンにかかわらず日本時間で扱う。
export const clinicDateKey = (date: Date): string =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const clinicTime = (date: Date): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
export const clinicDateTimeInput = (date: Date): string =>
  `${clinicDateKey(date)}T${clinicTime(date)}`;
export const parseClinicDateTime = (input: string): Date =>
  new Date(`${input}:00+09:00`);
export const shiftClinicDay = (day: string, amount: number): string =>
  clinicDateKey(
    new Date(new Date(`${day}T12:00:00+09:00`).getTime() + amount * 86400000),
  );
export const weekDays = (day: string): string[] => {
  const weekday = new Date(`${day}T12:00:00+09:00`).getUTCDay();
  const monday = shiftClinicDay(day, -(weekday + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => shiftClinicDay(monday, index));
};
export const dayLabel = (day: string): string =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${day}T12:00:00+09:00`));
export const reservationEnd = (
  reservation: Pick<Reservation, "date" | "duration">,
): Date => new Date(reservation.date.getTime() + reservation.duration * 60000);
export interface ReservationConflict {
  reservation: Reservation;
  reasons: string[];
}
export const findReservationConflicts = (
  candidate: Reservation,
  existing: Reservation[],
): ReservationConflict[] => {
  if (!occupiesSlot(candidate)) return [];
  const start = candidate.date.getTime(),
    end = reservationEnd(candidate).getTime();
  return existing.flatMap((reservation) => {
    if (
      (candidate.id && candidate.id === reservation.id) ||
      !occupiesSlot(reservation)
    )
      return [];
    if (
      !(
        start < reservationEnd(reservation).getTime() &&
        end > reservation.date.getTime()
      )
    )
      return [];
    const reasons: string[] = [];
    if (candidate.patientId === reservation.patientId) reasons.push("患者");
    if (candidate.staffId && candidate.staffId === reservation.staffId)
      reasons.push("担当者");
    if (candidate.bedId && candidate.bedId === reservation.bedId)
      reasons.push("ベッド");
    return reasons.length ? [{ reservation, reasons }] : [];
  });
};
export const validateReservation = (reservation: Reservation): void => {
  if (
    reservation.feeAmount !== undefined &&
    reservation.feeAmount !== null &&
    (!Number.isSafeInteger(reservation.feeAmount) || reservation.feeAmount < 0)
  )
    throw new Error("請求額は0円以上の整数で入力してください。");
  validatePayments(reservation.payments ?? []);
  if (!reservation.patientId || !reservation.type.trim())
    throw new Error("患者と施術メニューを選択してください。");
  if (!Number.isFinite(reservation.date.getTime()))
    throw new Error("予約日時を入力してください。");
  if (
    !Number.isInteger(reservation.duration) ||
    reservation.duration < 1 ||
    reservation.duration > 480
  )
    throw new Error("所要時間は1〜480分の整数で入力してください。");
  if (
    reservation.status &&
    !Object.prototype.hasOwnProperty.call(STATUS_LABELS, reservation.status)
  )
    throw new Error("予約の状態が正しくありません。");
};
