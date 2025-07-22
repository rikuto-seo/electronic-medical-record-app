// src/utils/reservationService.ts

import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { Reservation } from '../types/reservation';

// Firestoreコレクション参照
const reservationCollection = collection(db, 'reservations');

/**
 * 新しい予約を追加する
 */
export const addReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const docRef = await addDoc(reservationCollection, {
        ...data,
        date: Timestamp.fromDate(data.date),
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
};

/**
 * 予約一覧を取得する
 */
export const getReservations = async (): Promise<Reservation[]> => {
    const snapshot = await getDocs(query(reservationCollection, orderBy('date', 'asc')));
    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            patientId: data.patientId,
            date: data.date.toDate(),
            duration: data.duration,
            type: data.type,
            memo: data.memo,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            checkedIn: data.checkedIn ?? false, // ここを追加
        };
    });
};


/**
 * IDから予約を取得する
 */
export const getReservationById = async (id: string): Promise<Reservation | null> => {
    const docRef = doc(db, 'reservations', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        patientId: data.patientId,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        memo: data.memo,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
    };
};

/**
 * 予約を更新する
 */
export const updateReservation = async (id: string, data: Partial<Reservation>) => {
    const docRef = doc(db, 'reservations', id);
    await updateDoc(docRef, {
        ...data,
        ...(data.date ? { date: Timestamp.fromDate(data.date) } : {}),
        updatedAt: Timestamp.now(),
    });
};

/**
 * 予約を削除する
 */
export const deleteReservation = async (id: string) => {
    const docRef = doc(db, 'reservations', id);
    await deleteDoc(docRef);
};

/**
 * 特定患者の予約を取得
 */
export const getReservationsByPatientId = async (patientId: string): Promise<Reservation[]> => {
    const snapshot = await getDocs(
        query(reservationCollection, where('patientId', '==', patientId), orderBy('date', 'asc'))
    );
    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            patientId: data.patientId,
            date: data.date.toDate(),
            duration: data.duration,
            type: data.type,
            memo: data.memo,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
        };
    });
};

export const markAsCheckedIn = async (reservationId: string) => {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
        checkedIn: true,
        updatedAt: Timestamp.now(),  // Timestamp型に統一
    });
};