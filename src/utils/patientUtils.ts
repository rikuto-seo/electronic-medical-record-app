import { Patient } from '../types/PatientData';
import { clinicDateKey } from './reservationUtils';

export type PatientDraft = Omit<Patient, 'id' | 'age' | 'records' | 'schemaVersion' | 'hasReservation'>;
export const emptyPatientDraft = (): PatientDraft => ({
  name: '', nameKana: '', patientNumber: '', gender: '', birthDate: '',
  firstVisitDate: clinicDateKey(new Date()), address: '', phoneNumber: '', email: '',
  occupation: '', assignedStaff: '', referralSource: '', insuranceInfo: '',
  medicalHistory: '', allergies: '', currentMedications: '', familyHistory: '',
  existingDiagnosis: '', notes: '', emergencyContact: { name: '', relationship: '', phoneNumber: '' },
});
export const isValidPatientDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
export const patientAge = (birthDate: string, referenceDate = clinicDateKey(new Date())): number | undefined => {
  if (!isValidPatientDate(birthDate) || !isValidPatientDate(referenceDate) || birthDate > referenceDate) return undefined;
  const [year, month, day] = birthDate.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = referenceDate.split('-').map(Number);
  return currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0);
};
export const validatePatientDraft = (draft: PatientDraft, today = clinicDateKey(new Date())): string => {
  if (!draft.name.trim()) return '氏名を入力してください。';
  if (!draft.gender) return '性別を選択してください。';
  if (!isValidPatientDate(draft.birthDate)) return '生年月日を正しく入力してください。';
  if (draft.birthDate > today) return '生年月日は今日以前の日付を入力してください。';
  if (!isValidPatientDate(draft.firstVisitDate)) return '初診日を正しく入力してください。';
  if (draft.firstVisitDate < draft.birthDate) return '初診日は生年月日以降の日付を入力してください。';
  return '';
};
/** Exclude undefined, UI-only properties and server-managed deletion markers. */
export const patientDocument = (patient: Patient): Record<string, unknown> => {
  const clean = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') return Object.fromEntries(
      Object.entries(value).filter(([key, item]) => item !== undefined && !['mediaFiles', 'hasReservation', 'deletionOperation', 'deletionRecordIds'].includes(key))
        .map(([key, item]) => [key, clean(item)])
    );
    return typeof value === 'string' ? value.trim() : value;
  };
  return clean(patient) as Record<string, unknown>;
};
export const buildNewPatient = (draft: PatientDraft, id: string): Patient => {
  const error = validatePatientDraft(draft);
  if (error) throw new Error(error);
  return patientDocument({ ...draft, patientNumber: undefined, id, age: patientAge(draft.birthDate)!, records: [] }) as unknown as Patient;
};
export const displayPatientAge = (patient: Patient): string => {
  const age = patientAge(patient.birthDate);
  return age === undefined ? '未確認' : `${age}歳`;
};
