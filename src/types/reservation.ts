// src/types/reservation.ts

export interface Reservation {
  id?: string;
  patientId: string;
  date: Date;
  duration: number;
  type: string;
  memo: string;
  createdAt?: Date;
  updatedAt?: Date;
  checkedIn?: boolean;  // ← 追加（初期値は false または undefined）
}