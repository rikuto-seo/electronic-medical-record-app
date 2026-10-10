import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase";
import { Patient, MedicalRecord } from "../types/PatientData";
import { Reservation, ReservationPayment } from "../types/reservation";
const remove = async (data: Record<string, unknown>) => {
  try {
    const call = httpsCallable(
      getFunctions(db.app, "asia-northeast1"),
      "permanentlyDeleteClinicData",
      { timeout: 540000 },
    );
    await call({ ...data, confirmed: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (["functions/not-found", "functions/unavailable"].includes(code ?? ""))
      throw new Error(
        "完全削除用のサーバー処理に接続できません。接続とCloud Functionsの公開状態をご確認ください。",
      );
    throw error;
  }
};
export const permanentlyDeletePatient = (patient: Patient) =>
  remove({
    kind: "patient",
    patientId: patient.id,
    expectedName: patient.name,
    expectedNumber: patient.patientNumber ?? "",
  });
export const permanentlyDeleteVisit = (reservation: Reservation) =>
  remove({
    kind: "reservation",
    patientId: reservation.patientId,
    targetId: reservation.id,
    expectedUpdatedAt: reservation.updatedAt?.getTime() ?? null,
  });
export const permanentlyDeletePayment = (
  reservation: Reservation,
  entry: ReservationPayment,
) => {
  const expectedPayment = reservation.payments?.find(
    (item) => item.id === entry.id,
  );
  if (!expectedPayment)
    return Promise.reject(
      new Error("支払い明細が変更されています。画面を開き直してください。"),
    );
  return remove({
    kind: "payment",
    patientId: reservation.patientId,
    targetId: reservation.id,
    paymentId: entry.id,
    expectedPayment,
  });
};
export const permanentlyDeleteRecord = (
  patientId: string,
  record: MedicalRecord,
) =>
  remove({
    kind: "record",
    patientId,
    targetId: record.id,
    expectedRecordUpdatedAt: record.updatedAt ?? null,
  });
