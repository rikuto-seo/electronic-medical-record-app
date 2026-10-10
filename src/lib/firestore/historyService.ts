// src/lib/firestore/historyService.ts

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  AddressHistoryEntry,
  ContactHistoryEntry,
  InsuranceHistoryEntry,
} from '../../types/history';

type HistoryCollection = 'addressHistory' | 'contactHistory' | 'insuranceHistory';

const historyRef = (patientId: string, col: HistoryCollection) =>
  collection(db, 'patients', patientId, col);

export async function getAddressHistory(patientId: string): Promise<AddressHistoryEntry[]> {
  const q = query(historyRef(patientId, 'addressHistory'), orderBy('validFrom', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as AddressHistoryEntry));
}

export async function getContactHistory(patientId: string): Promise<ContactHistoryEntry[]> {
  const q = query(historyRef(patientId, 'contactHistory'), orderBy('validFrom', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ContactHistoryEntry));
}

export async function getInsuranceHistory(patientId: string): Promise<InsuranceHistoryEntry[]> {
  const q = query(historyRef(patientId, 'insuranceHistory'), orderBy('validFrom', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as InsuranceHistoryEntry));
}

export async function getCurrentAddress(patientId: string): Promise<AddressHistoryEntry[]> {
  const entries = await getAddressHistory(patientId);
  return entries.filter((e) => e.validTo == null);
}

async function closeOpenHistoryEntries(
  patientId: string,
  col: HistoryCollection
): Promise<void> {
  const q = query(historyRef(patientId, col), orderBy('validFrom', 'desc'));
  const snap = await getDocs(q);
  const today = new Date().toISOString().split('T')[0];
  const openEntries = snap.docs.filter((d) => d.data().validTo == null);
  await Promise.all(
    openEntries.map((d) =>
      updateDoc(doc(db, 'patients', patientId, col, d.id), { validTo: today })
    )
  );
}

export async function addAddressHistory(
  patientId: string,
  entry: AddressHistoryEntry
): Promise<void> {
  await closeOpenHistoryEntries(patientId, 'addressHistory');
  const ref = doc(db, 'patients', patientId, 'addressHistory', entry.id);
  await setDoc(ref, { ...entry, validTo: null });
}

export async function addContactHistory(
  patientId: string,
  entry: ContactHistoryEntry
): Promise<void> {
  await closeOpenHistoryEntries(patientId, 'contactHistory');
  const ref = doc(db, 'patients', patientId, 'contactHistory', entry.id);
  await setDoc(ref, { ...entry, validTo: null });
}

export async function addInsuranceHistory(
  patientId: string,
  entry: InsuranceHistoryEntry
): Promise<void> {
  await closeOpenHistoryEntries(patientId, 'insuranceHistory');
  const ref = doc(db, 'patients', patientId, 'insuranceHistory', entry.id);
  await setDoc(ref, { ...entry, validTo: null });
}

export async function createInitialHistories(
  patientId: string,
  data: {
    address?: string;
    phoneNumber?: string;
    email?: string;
    emergencyContact?: ContactHistoryEntry['emergencyContact'];
    insuranceInfo?: string;
    validFrom: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const { v4: uuidv4 } = await import('uuid');

  if (data.address) {
    await addAddressHistory(patientId, {
      id: uuidv4(),
      address: data.address,
      validFrom: data.validFrom,
      validTo: null,
      changedAt: now,
    });
  }

  if (data.phoneNumber || data.email || data.emergencyContact) {
    await addContactHistory(patientId, {
      id: uuidv4(),
      phoneNumber: data.phoneNumber,
      email: data.email,
      emergencyContact: data.emergencyContact,
      validFrom: data.validFrom,
      validTo: null,
      changedAt: now,
    });
  }

  if (data.insuranceInfo) {
    await addInsuranceHistory(patientId, {
      id: uuidv4(),
      insuranceType: 'その他',
      copayRatio: 3,
      insurerName: data.insuranceInfo,
      validFrom: data.validFrom,
      validTo: null,
      changedAt: now,
    });
  }
}
