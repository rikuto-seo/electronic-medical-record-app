// src/components/PatientContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Patient, MedicalRecord } from "../types/PatientData";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Firestore初期化済み
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import {
  addPatient as saveNewPatient,
  updatePatientInfo,
} from "../lib/firebase/patient";
import {
  firebaseErrorCode,
  patientReadErrorMessage,
} from "../utils/firestoreErrors";
import { patientDocument } from "../utils/patientUtils";
import { clinicDateKey } from "../utils/reservationUtils";
import { v4 as uuidv4 } from "uuid";
import { recordMediaUrls } from "../utils/medicalRecordUtils";
import { permanentlyDeletePatient } from "../utils/permanentDeletion";

type PatientContextType = {
  patients: Patient[];
  patientsLoading: boolean;
  patientsError: string;
  reloadPatients: () => void;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (updated: Patient) => Promise<void>;
  deletePatient: (patient: Patient) => Promise<void>;
  addMedicalRecord: (
    patientId: string,
    record: MedicalRecord,
    mediaFiles?: File[],
  ) => Promise<void>; // ← ここを修正
  updateMedicalRecord: (
    patientId: string,
    updatedRecord: MedicalRecord,
    mediaFiles?: File[],
  ) => Promise<void>;
};

export const PatientContext = createContext<PatientContextType | undefined>(
  undefined,
);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState("");
  const [patientReload, setPatientReload] = useState(0);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribePatients: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribePatients?.();
        unsubscribePatients = undefined;
        const subscriptionGeneration = ++generation;
        const isCurrent = () => active && subscriptionGeneration === generation;
        if (!active) return;
        setPatients([]);
        setPatientsError("");
        setPatientsLoading(!!user);
        if (!user) return;
        unsubscribePatients = onSnapshot(
          collection(db, "patients"),
          (snapshot) => {
            if (!isCurrent()) return;
            setPatients(
              snapshot.docs.map((item) => ({
                ...item.data(),
                id: item.id,
              })) as Patient[],
            );
            setPatientsError("");
            setPatientsLoading(false);
          },
          (error) => {
            if (!isCurrent()) return;
            setPatients([]);
            setPatientsError(patientReadErrorMessage(error));
            // Log diagnostic metadata only; no patient data, account identifiers or tokens.
            console.error("患者情報の読み取りエラー", {
              code: firebaseErrorCode(error),
              projectId: db.app.options.projectId,
              database: "(default)",
              collection: "patients",
              signedIn: !!auth.currentUser,
            });
            setPatientsLoading(false);
          },
        );
      },
      (error) => {
        if (!active) return;
        generation++;
        unsubscribePatients?.();
        unsubscribePatients = undefined;
        setPatients([]);
        setPatientsError(
          `ログイン状態を確認できません。ログインし直してください。（エラーコード: ${firebaseErrorCode(error)}）`,
        );
        setPatientsLoading(false);
      },
    );
    return () => {
      active = false;
      generation++;
      unsubscribePatients?.();
      unsubscribeAuth();
    };
  }, [patientReload]);

  const addPatient = async (patient: Patient) => {
    const saved = await saveNewPatient(patient);
    setPatients((previous) =>
      previous.some((item) => item.id === saved.id)
        ? previous.map((item) =>
            item.id === saved.id ? { ...item, ...saved } : item,
          )
        : [...previous, saved],
    );
  };

  const updatePatient = async (updatedPatient: Patient) => {
    await updatePatientInfo(updatedPatient);
    setPatients((previous) =>
      previous.map((item) =>
        item.id === updatedPatient.id
          ? {
              ...item,
              ...updatedPatient,
              patientNumber: item.patientNumber,
              records: item.records,
              schemaVersion: item.schemaVersion,
            }
          : item,
      ),
    );
  };

  const addMedicalRecord = async (
    patientId: string,
    record: MedicalRecord,
    mediaFiles: File[] = [],
  ) => {
    const patientDoc = doc(db, "patients", patientId);
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) throw new Error("患者が見つかりません。");

    // 1. 添付ファイルを Cloud Storage にアップロード
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      const fileRef = ref(
        storage,
        `patients/${patientId}/records/${record.id}/${uuidv4()}-${file.name}`,
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploadedUrls.push(url);
    }

    // 2. mediaUrls を record に追加して保存
    const updatedRecord = {
      ...record,
      mediaUrls: [...recordMediaUrls(record.mediaUrls), ...uploadedUrls],
      updatedAt: new Date().toISOString(),
    };

    const updatedRecords = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(patientDoc);
      if (!snapshot.exists()) throw new Error("患者が見つかりません。");
      const latest: MedicalRecord[] = snapshot.data().records ?? [];
      if (latest.some((item) => item.id === record.id)) return latest;
      const records = [...latest, updatedRecord];
      const visitDate = clinicDateKey(new Date(record.date));
      transaction.update(patientDoc, {
        records: patientDocument({ ...patient, records }).records,
        lastVisitDate: [snapshot.data().lastVisitDate ?? "", visitDate]
          .sort()
          .pop(),
      });
      return records;
    });

    // 3. ローカル状態も更新（リアルタイム更新待たずに即時反映）
    setPatients((prevPatients) =>
      prevPatients.map((p) =>
        p.id === patientId ? { ...p, records: updatedRecords } : p,
      ),
    );
  };

  const updateMedicalRecord = async (
    patientId: string,
    updatedRecord: MedicalRecord,
    mediaFiles: File[] = [],
  ) => {
    const patientDoc = doc(db, "patients", patientId);
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) throw new Error("患者が見つかりません。");
    const uploadedUrls: string[] = [];
    for (const file of mediaFiles) {
      const fileRef = ref(
        storage,
        `patients/${patientId}/records/${updatedRecord.id}/${uuidv4()}-${file.name}`,
      );
      await uploadBytes(fileRef, file);
      uploadedUrls.push(await getDownloadURL(fileRef));
    }
    const updatedRecords = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(patientDoc);
      if (!snapshot.exists()) throw new Error("患者が見つかりません。");
      const latest: MedicalRecord[] = snapshot.data().records ?? [];
      const original = latest.find((item) => item.id === updatedRecord.id);
      if (!original) throw new Error("診療記録が見つかりません。");
      if (original.updatedAt !== updatedRecord.updatedAt)
        throw new Error(
          "この記録は他の端末で更新されました。履歴から最新の記録を開き直してください。",
        );
      const records = latest.map((item) =>
        item.id === updatedRecord.id
          ? {
              ...updatedRecord,
              mediaUrls: [
                ...recordMediaUrls(original.mediaUrls),
                ...uploadedUrls,
              ],
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      transaction.update(patientDoc, {
        records: patientDocument({ ...patient, records }).records,
      });
      return records;
    });
    setPatients((previous) =>
      previous.map((item) =>
        item.id === patientId ? { ...item, records: updatedRecords } : item,
      ),
    );
  };

  const deletePatient = async (patient: Patient) => {
    await permanentlyDeletePatient(patient);
    setPatients((previous) =>
      previous.filter((item) => item.id !== patient.id),
    );
  };
  return (
    <PatientContext.Provider
      value={{
        patients,
        patientsLoading,
        patientsError,
        reloadPatients: () => setPatientReload((value) => value + 1),
        addPatient,
        updatePatient,
        deletePatient,
        addMedicalRecord,
        updateMedicalRecord,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
