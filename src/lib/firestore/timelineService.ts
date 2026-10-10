// src/lib/firestore/timelineService.ts

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { TimelineEvent, TimelineEventType } from '../../types/timeline';

const timelineRef = (patientId: string) =>
  collection(db, 'patients', patientId, 'timeline');

export async function getTimelineEvents(patientId: string): Promise<TimelineEvent[]> {
  const q = query(timelineRef(patientId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as TimelineEvent));
}

export function subscribeTimeline(
  patientId: string,
  callback: (events: TimelineEvent[]) => void
): Unsubscribe {
  const q = query(timelineRef(patientId), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as TimelineEvent)));
  });
}

export async function addTimelineEvent(event: TimelineEvent): Promise<void> {
  const ref = doc(db, 'patients', event.patientId, 'timeline', event.id);
  await setDoc(ref, event);
}

export function buildVisitTimelineEvent(
  patientId: string,
  encounterId: string,
  date: string,
  summary: string,
  isFirstVisit: boolean
): TimelineEvent {
  return {
    id: encounterId,
    patientId,
    type: isFirstVisit ? 'first_visit' : 'visit',
    date,
    title: isFirstVisit ? '初診' : '来院',
    summary,
    encounterId,
    createdAt: new Date().toISOString(),
  };
}

export function buildAddressChangeEvent(
  patientId: string,
  historyId: string,
  date: string,
  oldAddress: string,
  newAddress: string
): TimelineEvent {
  return {
    id: historyId,
    patientId,
    type: 'address_change',
    date,
    title: '住所変更',
    summary: `${oldAddress || '（未登録）'} → ${newAddress}`,
    historyId,
    createdAt: new Date().toISOString(),
  };
}

export function buildInsuranceChangeEvent(
  patientId: string,
  historyId: string,
  date: string,
  summary: string
): TimelineEvent {
  return {
    id: `insurance-${historyId}`,
    patientId,
    type: 'insurance_change',
    date,
    title: '保険変更',
    summary,
    historyId,
    createdAt: new Date().toISOString(),
  };
}

export function buildContactChangeEvent(
  patientId: string,
  historyId: string,
  date: string,
  summary: string
): TimelineEvent {
  return {
    id: `contact-${historyId}`,
    patientId,
    type: 'contact_change',
    date,
    title: '連絡先変更',
    summary,
    historyId,
    createdAt: new Date().toISOString(),
  };
}
