import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Patient } from "../../types/PatientData";
import { patientDocument } from "../../utils/patientUtils";

const counterRef = () => doc(db, "clinicSettings", "patientNumberCounter");
export const formatPatientNumber = (number: number): string => {
  if (!Number.isSafeInteger(number) || number < 1 || number > 999999999999)
    throw new Error("患者番号の採番上限に達しました。");
  return String(number).padStart(6, "0");
};

/** One transaction commits the counter, immutable number registry and patient. */
const allocate = async (
  patientId: string,
  newPatient?: Patient,
): Promise<Patient> => {
  const counter = await getDocFromServer(counterRef());
  let initialMaximum = 0;
  const legacyNumbers = new Map<string, string[]>();
  if (!counter.exists()) {
    // Bootstrap above all existing numeric numbers; preserve already issued legacy numbers.
    const existing = await getDocsFromServer(collection(db, "patients"));
    existing.docs.forEach((item) => {
      const number = item.data().patientNumber;
      if (typeof number !== "string" || !number.trim()) return;
      const ids = legacyNumbers.get(number) ?? [];
      ids.push(item.id);
      legacyNumbers.set(number, ids);
      if (/^\d+$/.test(number) && Number.isSafeInteger(Number(number)))
        initialMaximum = Math.max(initialMaximum, Number(number));
    });
  }
  const patientRef = doc(db, "patients", patientId);
  const bootstrapMaximum = initialMaximum;
  for (let attempt = 0; attempt < 5; attempt++) {
    let attemptedLastNumber: number | undefined;
    try {
      return await runTransaction(db, async (transaction) => {
        const patientSnapshot = await transaction.get(patientRef);
        const current = patientSnapshot.exists()
          ? ({ ...patientSnapshot.data(), id: patientId } as Patient)
          : undefined;
        if (!current && !newPatient) throw new Error("患者が見つかりません。");
        if (current?.patientNumber) {
          if ((legacyNumbers.get(current.patientNumber)?.length ?? 0) > 1)
            throw new Error(
              "既存の患者番号が重複しています。番号の登録状況を確認してください。",
            );
          return current; // Includes a retry after the first registration already succeeded.
        }
        const counterSnapshot = await transaction.get(counterRef());
        const lastNumber = counterSnapshot.exists()
          ? counterSnapshot.data()?.lastNumber
          : bootstrapMaximum;
        if (!Number.isSafeInteger(lastNumber) || lastNumber < 0)
          throw new Error("採番カウンターの設定が正しくありません。");
        attemptedLastNumber = lastNumber;
        let nextNumber = lastNumber + 1;
        let patientNumber = formatPatientNumber(nextNumber);
        // Registry lookup detects a collision even after a counter restore/reset.
        let registryRef = doc(db, "patientNumbers", patientNumber);
        let registry = await transaction.get(registryRef);
        for (
          let attempts = 0;
          registry.exists() || legacyNumbers.has(patientNumber);
          attempts++
        ) {
          if (attempts >= 100)
            throw new Error("患者番号の採番設定を確認してください。");
          patientNumber = formatPatientNumber(++nextNumber);
          registryRef = doc(db, "patientNumbers", patientNumber);
          registry = await transaction.get(registryRef);
        }
        const patient = { ...(current ?? newPatient!), patientNumber };
        transaction.set(counterRef(), {
          lastNumber: nextNumber,
          lastPatientNumber: patientNumber,
          lastPatientId: patientId,
        });
        transaction.set(registryRef, { patientId });
        if (current) transaction.update(patientRef, { patientNumber });
        else transaction.set(patientRef, patientDocument(patient));
        return patient;
      });
    } catch (error) {
      // A simultaneous claim can be rejected by registry rules before the SDK
      // retries the transaction. Retry only after confirming counter advancement.
      if (
        (error as { code?: string }).code !== "permission-denied" ||
        attemptedLastNumber === undefined ||
        attempt === 4
      )
        throw error;
      let latest;
      try {
        latest = await getDocFromServer(counterRef());
      } catch {
        throw error;
      }
      if (
        !latest.exists() ||
        !(latest.data()?.lastNumber > attemptedLastNumber)
      )
        throw error;
    }
  }
  throw new Error(
    "患者の同時登録が続いています。少し待って再度登録してください。",
  );
};

export const registerPatientWithNumber = (patient: Patient): Promise<Patient> =>
  allocate(patient.id, { ...patient, patientNumber: undefined });
export const issuePatientNumber = (patientId: string): Promise<Patient> =>
  allocate(patientId);
