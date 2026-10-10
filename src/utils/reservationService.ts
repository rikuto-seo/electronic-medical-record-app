import { db, auth } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where,
  DocumentData,
} from "firebase/firestore";
import {
  Reservation,
  ReservationSettings,
  ReservationStatusEvent,
} from "../types/reservation";
import { mergePayments, validatePayments } from "./paymentUtils";
import {
  DEFAULT_RESERVATION_SETTINGS,
  findReservationConflicts,
  reservationStatus,
  validateReservation,
  clinicTime,
  occupiesSlot,
} from "./reservationUtils";

const reservationsRef = collection(db, "reservations");
const settingsRef = doc(db, "clinicSettings", "reservations");
const revisionRef = doc(db, "clinicSettings", "reservationRevision");

export const decodeReservation = (
  id: string,
  data: DocumentData,
): Reservation => {
  const reservation: Reservation = {
    id,
    patientId: data.patientId,
    date: data.date.toDate(),
    duration: data.duration ?? 30,
    type: data.type ?? "",
    memo: data.memo ?? "",
    checkedIn: data.checkedIn ?? false,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    staffId: data.staffId ?? "",
    staffName: data.staffName ?? "",
    bedId: data.bedId ?? "",
    bedName: data.bedName ?? "",
    menuId: data.menuId ?? "",
    cancellationReason: data.cancellationReason ?? "",
    updatedBy: data.updatedBy ?? "",
    feeAmount: data.feeAmount ?? null,
    payments: data.payments ?? [],
    statusHistory: data.statusHistory ?? [],
    deletionOperation: data.deletionOperation,
  };
  reservation.status = data.status ?? reservationStatus(reservation);
  validatePayments(reservation.payments ?? []);
  return reservation;
};
export const getReservations = async (): Promise<Reservation[]> => {
  const snapshot = await getDocs(
    query(reservationsRef, orderBy("date", "asc")),
  );
  return snapshot.docs.map((item) => decodeReservation(item.id, item.data()));
};
export const subscribeReservations = (
  callback: (reservations: Reservation[]) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    query(reservationsRef, orderBy("date", "asc")),
    (snapshot) => {
      try {
        callback(
          snapshot.docs.map((item) => decodeReservation(item.id, item.data())),
        );
      } catch (error) {
        onError(error as Error);
      }
    },
    onError,
  );
export const getReservationById = async (
  id: string,
): Promise<Reservation | null> => {
  const snapshot = await getDoc(doc(reservationsRef, id));
  return snapshot.exists()
    ? decodeReservation(snapshot.id, snapshot.data())
    : null;
};
export const getReservationsByPatientId = async (
  patientId: string,
): Promise<Reservation[]> => {
  const snapshot = await getDocs(
    query(reservationsRef, where("patientId", "==", patientId)),
  );
  return snapshot.docs
    .map((item) => decodeReservation(item.id, item.data()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};
export const subscribePatientReservations = (
  patientId: string,
  callback: (reservations: Reservation[]) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    query(reservationsRef, where("patientId", "==", patientId)),
    (snapshot) => {
      try {
        callback(
          snapshot.docs
            .map((item) => decodeReservation(item.id, item.data()))
            .sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
      } catch (error) {
        onError(error as Error);
      }
    },
    onError,
  );
const statusEvent = (
  reservation: Reservation,
  at: string | undefined,
  changedBy?: string,
): ReservationStatusEvent => ({
  ...(at ? { at } : {}),
  status: reservationStatus(reservation),
  reservationDate: reservation.date.toISOString(),
  type: reservation.type,
  staffName: reservation.staffName ?? "",
  cancellationReason: reservation.cancellationReason ?? "",
  ...(changedBy ? { changedBy } : {}),
});

class ScheduleChangedError extends Error {}
// 全ての予約更新を共通のrevisionで直列化。他端末の更新後は再取得して重複を再判定。
const saveReservation = async (
  id: string,
  changes: Partial<Reservation>,
  creating: boolean,
  expectedUpdatedAt?: Date | null,
) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const revision =
      (await getDocFromServer(revisionRef)).data()?.revision ?? 0;
    const snapshot = await getDocsFromServer(reservationsRef);
    const existing = snapshot.docs.map((item) =>
      decodeReservation(item.id, item.data()),
    );
    const previous = existing.find((item) => item.id === id);
    if (creating && previous) {
      if (previous.patientId !== changes.patientId)
        throw new Error(
          "予約IDが別の患者に使用されています。予約画面を開き直してください。",
        );
      return; // Idempotent retry after an uncertain registration result.
    }
    if (!creating && !previous)
      throw new Error("予約が見つかりません。予約表を更新してください。");
    if (
      !creating &&
      expectedUpdatedAt !== undefined &&
      (previous?.updatedAt?.getTime() ?? null) !==
        (expectedUpdatedAt?.getTime() ?? null)
    )
      throw new Error(
        "他のスタッフがこの予約を変更しました。閉じてから、最新の予約を開き直してください。",
      );
    const candidate = { ...previous, ...changes, id } as Reservation;
    if (
      previous &&
      changes.patientId &&
      changes.patientId !== previous.patientId
    )
      throw new Error(
        "登録済み予約の患者は変更できません。元の予約をキャンセルし、正しい患者で新規予約を作成してください。",
      );
    if (changes.checkedIn !== undefined && changes.status === undefined)
      candidate.status = changes.checkedIn ? "checked_in" : "booked";
    validateReservation(candidate);
    const scheduleChanged =
      !previous ||
      ["patientId", "staffId", "bedId", "duration"].some(
        (key) => (candidate as any)[key] !== (previous as any)[key],
      ) ||
      candidate.date.getTime() !== previous.date.getTime() ||
      (!occupiesSlot(previous) && occupiesSlot(candidate));
    const conflict = scheduleChanged
      ? findReservationConflicts(candidate, existing)[0]
      : undefined;
    if (conflict)
      throw new Error(
        `${clinicTime(conflict.reservation.date)}の予約と${conflict.reasons.join("・")}が重複しています。日時・担当者・ベッドを変更してください。`,
      );
    const status = reservationStatus(candidate);
    const now = new Date().toISOString();
    const payments = mergePayments(
      previous?.payments ?? [],
      changes.payments,
      auth.currentUser?.uid ?? "",
      now,
    );
    const history = previous?.statusHistory?.length
      ? [...previous.statusHistory]
      : previous
        ? [
            statusEvent(
              previous,
              previous.updatedAt?.toISOString() ??
                previous.createdAt?.toISOString(),
            ),
          ]
        : [];
    if (
      !previous ||
      [
        "status",
        "type",
        "staffId",
        "bedId",
        "duration",
        "cancellationReason",
      ].some((key) => (candidate as any)[key] !== (previous as any)[key]) ||
      candidate.date.getTime() !== previous.date.getTime()
    )
      history.push(statusEvent(candidate, now, auth.currentUser?.uid));
    const payload = Object.fromEntries(
      Object.entries({
        ...candidate,
        status,
        payments,
        statusHistory: history,
        checkedIn: ["checked_in", "in_treatment", "completed"].includes(status),
        date: Timestamp.fromDate(candidate.date),
        updatedAt: Timestamp.now(),
        updatedBy: auth.currentUser?.uid ?? "",
        ...(creating ? { createdAt: Timestamp.now() } : {}),
      }).filter(([key, value]) => key !== "id" && value !== undefined),
    );
    if (!creating) delete payload.createdAt;
    try {
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(revisionRef);
        if ((current.data()?.revision ?? 0) !== revision)
          throw new ScheduleChangedError();
        if (creating) transaction.set(doc(reservationsRef, id), payload);
        else transaction.update(doc(reservationsRef, id), payload);
        transaction.set(revisionRef, {
          revision: revision + 1,
          updatedAt: Timestamp.now(),
        });
      });
      return;
    } catch (error) {
      if (!(error instanceof ScheduleChangedError)) throw error;
    }
  }
  throw new Error(
    "他の端末で予約が更新されています。少し待って再度保存してください。",
  );
};
export const addReservation = async (
  data: Omit<Reservation, "id" | "createdAt" | "updatedAt">,
  registrationId?: string,
) => {
  const id = registrationId ?? doc(reservationsRef).id;
  await saveReservation(id, data, true);
  return id;
};
export const updateReservation = async (
  id: string,
  data: Partial<Reservation>,
  expectedUpdatedAt?: Date | null,
) => saveReservation(id, data, false, expectedUpdatedAt);
export const deleteReservation = async (id: string) =>
  updateReservation(id, { status: "cancelled" });
export const markAsCheckedIn = async (id: string) =>
  updateReservation(id, { status: "checked_in" });
export const subscribeReservationSettings = (
  callback: (settings: ReservationSettings) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    settingsRef,
    (snapshot) => {
      const data = snapshot.data();
      callback(
        data
          ? {
              revision: data.revision ?? 0,
              staff: data.staff ?? [],
              beds: data.beds ?? [],
              menus: data.menus ?? [],
            }
          : DEFAULT_RESERVATION_SETTINGS,
      );
    },
    onError,
  );
export const saveReservationSettings = async (
  settings: ReservationSettings,
) => {
  for (const group of [settings.staff, settings.beds, settings.menus]) {
    if (group.some((item) => !item.name.trim()))
      throw new Error("名称を入力してください。");
    const names = group.map((item) => item.name.trim());
    if (new Set(names).size !== names.length)
      throw new Error("同じ名称が重複しています。");
  }
  if (
    settings.menus.some(
      (menu) =>
        !Number.isInteger(menu.duration) ||
        menu.duration < 1 ||
        menu.duration > 480,
    )
  )
    throw new Error("メニューの所要時間は1〜480分で入力してください。");
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(settingsRef);
    if ((current.data()?.revision ?? 0) !== (settings.revision ?? 0))
      throw new Error(
        "他のスタッフが院内設定を変更しました。閉じてから、設定を開き直してください。",
      );
    transaction.set(settingsRef, {
      ...settings,
      staff: settings.staff.map((item) => ({
        ...item,
        name: item.name.trim(),
      })),
      beds: settings.beds.map((item) => ({ ...item, name: item.name.trim() })),
      menus: settings.menus.map((item) => ({
        ...item,
        name: item.name.trim(),
      })),
      updatedAt: Timestamp.now(),
      revision: (settings.revision ?? 0) + 1,
    });
  });
};
