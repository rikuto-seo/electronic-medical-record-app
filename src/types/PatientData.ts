// src/types/PatientData.ts

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface VitalSigns {
  bloodPressure?: string;   // 血圧 (例: "120/80")
  pulse?: number;           // 脈拍
  temperature?: number;     // 体温 (℃)
}

export interface InsuranceDetail {
  providerName?: string;     // 保険者名
  insuranceNumber?: string;  // 保険証番号
  validFrom?: string;        // 保険有効開始日
  validTo?: string;          // 保険有効終了日
  insuredPersonName?: string;// 被保険者名
  relationToInsured?: string;// 被保険者との関係
}

export interface MedicalRecord {
  id: string;
  date: string; // 記録日
  chiefComplaint?: string;
  symptomOnsetDate?: string;
  symptomDuration?: string;
  symptomLocation?: string;
  painType?: string;
  painSeverity?: number | null;
  painScale?: number | null;  // 痛みの数値評価（0-10など）
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

  treatmentDate?: string;         // 実際の治療日
  treatmentDuration?: string;     // 治療時間
  medicationsPrescribed?: string; // 処方薬
  adverseReactions?: string;      // 副反応やアレルギー反応
  followUpDate?: string;          // 次回受診予定日
  patientFeedback?: string;       // 患者の感想や反応
  treatmentPerformedBy?: string;  // 治療担当者名

  vitalSigns?: VitalSigns;        // バイタルサイン情報
  mediaFiles?: (File | string)[];
}

export interface Patient {
  id: string;
  name: string;
  gender: string;
  birthDate: string;       // 生年月日 (yyyy-mm-dd)
  age: number;             // 年齢（将来的にはbirthDateから計算も可）
  address?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
  occupation?: string;
  medicalHistory?: string; // 既往歴
  allergies?: string;      // アレルギー情報
  currentMedications?: string; // 服薬中の薬
  familyHistory?: string;  // 家族歴
  insuranceInfo?: string;  // 保険情報（旧項目）
  insuranceDetails?: InsuranceDetail; // 保険の詳細情報を追加
  firstVisitDate: string;  // 初診日
  referralSource?: string; // 紹介元
  existingDiagnosis?: string; // 既存の診断名
  lifestyle?: {
    smoking?: string;
    drinking?: string;
    exercise?: string;
  };
  physicalMeasurements?: {
    height?: number;       // cm
    weight?: number;       // kg
    bmi?: number;
  };
  notes?: string;
  records: MedicalRecord[];
}
