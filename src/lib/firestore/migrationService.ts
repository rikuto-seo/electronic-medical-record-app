// src/lib/firestore/migrationService.ts

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Patient, MedicalRecord, CURRENT_SCHEMA_VERSION } from '../../types/PatientData';
import { medicalRecordToEncounter } from '../../types/encounter';
import { addEncounter } from './encounterService';
import { createInitialHistories } from './historyService';
import {
  addTimelineEvent,
  buildVisitTimelineEvent,
} from './timelineService';

export async function migratePatientIfNeeded(patient: Patient): Promise<boolean> {
  if (patient.schemaVersion === CURRENT_SCHEMA_VERSION) return false;

  const patientRef = doc(db, 'patients', patient.id);
  const snap = await getDoc(patientRef);
  if (!snap.exists()) return false;

  const data = snap.data() as Patient;
  if (data.schemaVersion === CURRENT_SCHEMA_VERSION) return false;

  const legacyRecords: MedicalRecord[] = data.records ?? [];
  const isFirstVisit = legacyRecords.length === 0;

  // 既存 records[] → encounters サブコレクション
  for (const record of legacyRecords) {
    const encounter = medicalRecordToEncounter(patient.id, record, 'finalized');
    await addEncounter(encounter);

    const summaryParts: string[] = [];
    if (record.chiefComplaint) summaryParts.push(record.chiefComplaint);
    if (record.treatmentProgress) summaryParts.push(record.treatmentProgress);
    if (record.treatmentPerformedBy) summaryParts.push(record.treatmentPerformedBy);

    await addTimelineEvent(
      buildVisitTimelineEvent(
        patient.id,
        record.id,
        record.date,
        summaryParts.join(' / ') || '施術記録',
        false
      )
    );
  }

  // 住所・連絡先・保険の初期履歴
  await createInitialHistories(patient.id, {
    address: data.address,
    phoneNumber: data.phoneNumber,
    email: data.email,
    emergencyContact: data.emergencyContact,
    insuranceInfo: data.insuranceInfo,
    validFrom: data.firstVisitDate || new Date().toISOString().split('T')[0],
  });

  // 初診タイムライン（records が空でも初診日があれば）
  if (isFirstVisit && data.firstVisitDate) {
    await addTimelineEvent({
      id: `first-visit-${patient.id}`,
      patientId: patient.id,
      type: 'first_visit',
      date: data.firstVisitDate,
      title: '初診',
      summary: '患者登録',
      createdAt: new Date().toISOString(),
    });
  }

  await updateDoc(patientRef, {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    records: [],
  });

  return true;
}

export async function ensurePatientMigrated(patientId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'patients', patientId));
  if (!snap.exists()) return;
  const patient = { ...snap.data(), id: snap.id } as Patient;
  await migratePatientIfNeeded(patient);
}
