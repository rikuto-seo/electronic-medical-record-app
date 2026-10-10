import { z } from "zod";
const text = z.string().optional();
const number = z.number().finite().nonnegative().nullable().optional();
const requiredText = (label: string) =>
  z
    .string()
    .refine((value) => value.trim().length > 0, `${label}を入力してください。`);
export const medicalRecordSchema = z
  .object({
    id: z.string(),
    date: z.string().min(1, "記録日時を入力してください。"),
    visitType: text,
    reservationId: text,
    chiefComplaint: text,
    historyOfPresentIllness: text,
    symptomOnsetDate: text,
    symptomDuration: text,
    symptomLocation: text,
    painType: text,
    painSeverity: z
      .number()
      .finite()
      .min(0)
      .max(10, "痛みの程度は0〜10で入力してください。")
      .nullable()
      .optional(),
    painScale: number,
    aggravatingFactors: text,
    relievingFactors: text,
    dailyLifeImpact: text,
    patientGoals: text,
    currentCondition: requiredText("現症・観察所見"),
    rangeOfMotion: text,
    muscleStrength: text,
    palpationFindings: text,
    skinCondition: text,
    imagingResults: text,
    neurologicalExamResults: text,
    otherExamResults: text,
    postureFindings: text,
    gaitFindings: text,
    orthopedicTests: text,
    functionalAssessment: text,
    safetyFindings: text,
    diagnosis: text,
    clinicalAssessment: text,
    treatmentDetails: text,
    treatedAreas: text,
    usedPoints: text,
    acupunctureType: text,
    acupunctureCount: z
      .number()
      .finite()
      .int()
      .nonnegative()
      .nullable()
      .optional(),
    stimulationMethod: text,
    needleRetentionMinutes: number,
    moxibustionType: text,
    manualTherapy: text,
    physicalTherapy: text,
    treatmentDate: text,
    treatmentDuration: text,
    treatmentPerformedBy: text,
    treatmentGoals: text,
    treatmentPlan: requiredText("治療・施術方針"),
    treatmentFrequency: text,
    selfCareInstructions: text,
    precautions: text,
    informedConsent: text,
    nextVisitPlan: text,
    referralPlan: text,
    treatmentProgress: text,
    notes: text,
    medicationsPrescribed: text,
    adverseReactions: text,
    followUpDate: text,
    patientFeedback: text,
    updatedAt: text,
    mediaUrls: z.array(z.string()).optional(),
    vitalSigns: z
      .object({
        bloodPressure: text,
        pulse: z.number().finite().nonnegative().optional(),
        temperature: z.number().finite().nonnegative().optional(),
        respiratoryRate: z.number().finite().nonnegative().optional(),
        oxygenSaturation: z.number().finite().min(0).max(100).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();
export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;
