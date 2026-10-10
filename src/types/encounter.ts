// src/types/encounter.ts

import { MedicalRecord, VitalSigns } from './PatientData';

export type EncounterStatus = 'draft' | 'finalized' | 'amended';

/** 1来院 = 1 Encounter。施術カルテの中核エンティティ */
export interface Encounter {
  id: string;
  patientId: string;
  date: string;
  status: EncounterStatus;

  chiefComplaint?: string;
  symptomOnsetDate?: string;
  symptomDuration?: string;
  symptomLocation?: string;
  painType?: string;
  painSeverity?: number | null;
  painScale?: number | null;
  rangeOfMotion?: string;
  muscleStrength?: string;
  palpationFindings?: string;
  skinCondition?: string;
  imagingResults?: string;
  neurologicalExamResults?: string;
  otherExamResults?: string;
  diagnosis?: string;
  currentCondition: string;
  acupunctureType?: string;
  acupunctureCount?: number | null;
  moxibustionType?: string;
  treatmentFrequency?: string;
  treatmentPlan: string;
  selfCareInstructions?: string;
  treatmentProgress?: string;
  notes: string;

  treatmentDate?: string;
  treatmentDuration?: string;
  medicationsPrescribed?: string;
  adverseReactions?: string;
  followUpDate?: string;
  patientFeedback?: string;
  treatmentPerformedBy?: string;

  vitalSigns?: VitalSigns;
  mediaUrls?: string[];

  staffId?: string;
  staffName?: string;
  reservationId?: string;
  createdAt: string;
  finalizedAt?: string;
}

export function encounterToMedicalRecord(encounter: Encounter): MedicalRecord {
  const {
    patientId: _pid,
    status: _status,
    staffId: _sid,
    staffName: _sname,
    reservationId: _rid,
    createdAt: _ca,
    finalizedAt: _fa,
    ...record
  } = encounter;
  return record;
}

export function medicalRecordToEncounter(
  patientId: string,
  record: MedicalRecord,
  status: EncounterStatus = 'finalized'
): Encounter {
  const now = new Date().toISOString();
  return {
    ...record,
    patientId,
    status,
    currentCondition: record.currentCondition ?? '',
    treatmentPlan: record.treatmentPlan ?? '',
    notes: record.notes ?? '',
    createdAt: now,
    finalizedAt: status === 'finalized' ? now : undefined,
  };
}
