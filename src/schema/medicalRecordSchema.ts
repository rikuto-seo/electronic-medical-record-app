// src/schema/medicalRecordSchema.ts
import { z } from 'zod';

export const medicalRecordSchema = z.object({
  id: z.string(),
  date: z.string().min(1, '記録日を入力してください'),
  chiefComplaint: z.string().optional(),
  symptomOnsetDate: z.string().optional(),
  symptomDuration: z.string().optional(),
  symptomLocation: z.string().optional(),
  painType: z.string().optional(),
  painSeverity: z.number().nullable().optional(),
  rangeOfMotion: z.string().optional(),
  muscleStrength: z.string().optional(),
  palpationFindings: z.string().optional(),
  skinCondition: z.string().optional(),
  imagingResults: z.string().optional(),
  neurologicalExamResults: z.string().optional(),
  otherExamResults: z.string().optional(),
  diagnosis: z.string().optional(),
  currentCondition: z
    .string()
    .min(1, '現症は必須です')
    .refine((val) => val.trim().length > 0, {
      message: '現症は空白以外の文字を入力してください',
    }),
  acupunctureType: z.string().optional(),
  acupunctureCount: z.number().nullable().optional(),
  moxibustionType: z.string().optional(),
  treatmentFrequency: z.string().optional(),
  treatmentPlan: z
    .string()
    .min(1, '治療方針は必須です')
    .refine((val) => val.trim().length > 0, {
      message: '治療方針は空白以外の文字を入力してください',
    }),
  selfCareInstructions: z.string().optional(),
  treatmentProgress: z.string().optional(),
  notes: z.string().optional(),
  mediaFiles: z.array(z.union([z.instanceof(File), z.string()])).optional(),
});

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;