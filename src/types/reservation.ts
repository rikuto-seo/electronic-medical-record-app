// src/types/reservation.ts

export type ReservationStatus =
  | "booked"
  | "checked_in"
  | "in_treatment"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentMethod = "cash" | "card" | "transfer" | "other";
export interface ReservationPayment {
  id: string;
  kind: "payment" | "refund";
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  note: string;
  createdAt?: string;
  createdBy?: string;
}
export interface ReservationStatusEvent {
  at?: string;
  status: ReservationStatus;
  reservationDate: string;
  type: string;
  staffName: string;
  cancellationReason: string;
  changedBy?: string;
}

export interface Reservation {
  id?: string;
  deletionOperation?: string;
  patientId: string;
  date: Date;
  duration: number;
  type: string;
  memo: string;
  createdAt?: Date;
  updatedAt?: Date;
  checkedIn?: boolean; // ← 追加（初期値は false または undefined）
  status?: ReservationStatus;
  staffId?: string;
  staffName?: string;
  bedId?: string;
  bedName?: string;
  menuId?: string;
  cancellationReason?: string;
  updatedBy?: string;
  feeAmount?: number | null;
  payments?: ReservationPayment[];
  statusHistory?: ReservationStatusEvent[];
}

export interface ReservationResource {
  id: string;
  name: string;
  active: boolean;
}
export interface TreatmentMenu extends ReservationResource {
  duration: number;
}
export interface ReservationSettings {
  revision?: number;
  staff: ReservationResource[];
  beds: ReservationResource[];
  menus: TreatmentMenu[];
}
