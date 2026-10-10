// src/lib/firestore/encounterService.ts

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Encounter } from '../../types/encounter';

const encountersRef = (patientId: string) =>
  collection(db, 'patients', patientId, 'encounters');

export async function getEncounters(patientId: string): Promise<Encounter[]> {
  const q = query(encountersRef(patientId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Encounter));
}

export function subscribeEncounters(
  patientId: string,
  callback: (encounters: Encounter[]) => void
): Unsubscribe {
  const q = query(encountersRef(patientId), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Encounter)));
  });
}

export async function addEncounter(encounter: Encounter): Promise<void> {
  const ref = doc(db, 'patients', encounter.patientId, 'encounters', encounter.id);
  await setDoc(ref, encounter);
}

export async function updateEncounter(encounter: Encounter): Promise<void> {
  const ref = doc(db, 'patients', encounter.patientId, 'encounters', encounter.id);
  await updateDoc(ref, { ...encounter });
}

export async function finalizeEncounter(
  patientId: string,
  encounterId: string
): Promise<void> {
  const ref = doc(db, 'patients', patientId, 'encounters', encounterId);
  await updateDoc(ref, {
    status: 'finalized',
    finalizedAt: new Date().toISOString(),
  });
}
