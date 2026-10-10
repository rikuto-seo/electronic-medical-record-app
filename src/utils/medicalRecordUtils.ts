import { MedicalRecord } from "../types/PatientData";
import { clinicDateTimeInput, parseClinicDateTime } from "./reservationUtils";
import { MedicalRecordFormData } from "../schema/medicalRecordSchema";
export const recordMediaUrls = (value: unknown): string[] => {
  const urls = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/(?=https?:\/\/)/)
      : [];
  return urls
    .filter(
      (url): url is string =>
        typeof url === "string" && /^https?:\/\//.test(url.trim()),
    )
    .map((url) => url.trim());
};
export const recordDateInput = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? clinicDateTimeInput(date) : "";
};
export const normalizeMedicalRecord = (
  data: MedicalRecordFormData,
  original?: MedicalRecord,
): MedicalRecord => ({
  ...original,
  ...data,
  id: data.id,
  date: parseClinicDateTime(data.date).toISOString(),
  currentCondition: data.currentCondition,
  treatmentPlan: data.treatmentPlan,
  notes: data.notes ?? "",
  mediaUrls: recordMediaUrls(original?.mediaUrls),
});
