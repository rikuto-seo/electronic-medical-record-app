// src/types/PatientData.ts

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface VitalSigns {
  [key: string]: unknown;
  bloodPressure?: string; // 血圧 (例: "120/80")
  pulse?: number; // 脈拍
  temperature?: number; // 体温 (℃)
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface InsuranceDetail {
  providerName?: string; // 保険者名
  insuranceNumber?: string; // 保険証番号
  validFrom?: string; // 保険有効開始日
  validTo?: string; // 保険有効終了日
  insuredPersonName?: string; // 被保険者名
  relationToInsured?: string; // 被保険者との関係
}

export interface MedicalRecord {
  [key: string]: unknown;
  id: string;
  date: string;
  chiefComplaint?: string;
  visitType?: string;
  reservationId?: string;
  historyOfPresentIllness?: string;
  aggravatingFactors?: string;
  relievingFactors?: string;
  dailyLifeImpact?: string;
  patientGoals?: string;
  postureFindings?: string;
  gaitFindings?: string;
  orthopedicTests?: string;
  functionalAssessment?: string;
  safetyFindings?: string;
  clinicalAssessment?: string;
  treatmentDetails?: string;
  treatedAreas?: string;
  usedPoints?: string;
  stimulationMethod?: string;
  needleRetentionMinutes?: number | null;
  manualTherapy?: string;
  physicalTherapy?: string;
  treatmentGoals?: string;
  precautions?: string;
  informedConsent?: string;
  nextVisitPlan?: string;
  referralPlan?: string;
  updatedAt?: string;
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

  /** Cloud Storage にアップロードされたファイルのURL一覧 */
  mediaUrls?: string[];

  /** クライアント側で一時保持されるFileオブジェクト（保存対象外） */
  mediaFiles?: File[]; // ※ UIでのみ使用
}

/** 現在のスキーマバージョン。2 = サブコレクション型 */
export const CURRENT_SCHEMA_VERSION = 2;

export interface Patient {
  id: string;
  deletionOperation?: string;
  /** 自動採番される不変の患者番号。未発行の旧患者はundefined。 */
  patientNumber?: string;
  name: string;
  nameKana?: string;
  gender: string;
  birthDate: string; // 生年月日 (yyyy-mm-dd)
  age: number; // 年齢（birthDateから計算）
  address?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
  occupation?: string;
  medicalHistory?: string; // 既往歴
  allergies?: string; // アレルギー情報
  currentMedications?: string; // 服薬中の薬
  familyHistory?: string; // 家族歴
  insuranceInfo?: string; // 保険情報（旧項目・移行用）
  insuranceDetails?: InsuranceDetail; // 保険の詳細情報
  firstVisitDate: string; // 初診日
  lastVisitDate?: string; // 最終来院日
  assignedStaff?: string; // 主担当
  referralSource?: string; // 紹介元
  existingDiagnosis?: string; // 既存の診断名
  lifestyle?: {
    smoking?: string;
    drinking?: string;
    exercise?: string;
  };
  physicalMeasurements?: {
    height?: number; // cm
    weight?: number; // kg
    bmi?: number;
  };
  notes?: string;
  /** @deprecated encounters サブコレクションへ移行。移行前データのみ */
  records?: MedicalRecord[];
  schemaVersion?: number;
  hasReservation?: boolean;
}
