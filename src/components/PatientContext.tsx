// src/components/PatientContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Patient, MedicalRecord } from '../types/PatientData';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Firestore初期化済み
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { setDoc } from 'firebase/firestore';

type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (updated: Patient) => Promise<void>;
  addMedicalRecord: (patientId: string, record: MedicalRecord, mediaFiles?: File[]) => Promise<void>; // ← ここを修正
  updateMedicalRecord: (patientId: string, updatedRecord: MedicalRecord) => Promise<void>;
};

export const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const patientsRef = collection(db, 'patients');
    const unsubscribe = onSnapshot(patientsRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Patient[];
      setPatients(list);
    });

    return () => unsubscribe();
  }, []);

  const addPatient = async (patient: Patient) => {
    const patientDoc = doc(db, 'patients', patient.id);
    await setDoc(patientDoc, {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      birthDate: patient.birthDate,
      firstVisitDate: patient.firstVisitDate,
      insuranceInfo: patient.insuranceInfo,
      emergencyContact: patient.emergencyContact,
      records: [],
    });
  };

  const updatePatient = async (updatedPatient: Patient) => {
    const patientDoc = doc(db, 'patients', updatedPatient.id);
    await updateDoc(patientDoc, {
      name: updatedPatient.name,
      age: updatedPatient.age,
      gender: updatedPatient.gender,
      birthDate: updatedPatient.birthDate,
      firstVisitDate: updatedPatient.firstVisitDate,
      insuranceInfo: updatedPatient.insuranceInfo,
      emergencyContact: updatedPatient.emergencyContact,
      records: updatedPatient.records,
    });
  };

  const addMedicalRecord = async (patientId: string, record: MedicalRecord, mediaFiles: File[] = []) => {
    const patientDoc = doc(db, 'patients', patientId);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // 1. 添付ファイルを Cloud Storage にアップロード
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      const fileRef = ref(storage, `patients/${patientId}/records/${record.id}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploadedUrls.push(url);
    }

    // 2. mediaUrls を record に追加して保存
    const updatedRecord = {
      ...record,
      mediaUrls: uploadedUrls,
    };

    const updatedRecords = [...(patient.records || []), updatedRecord];
    await updateDoc(patientDoc, { records: updatedRecords });

    // 3. ローカル状態も更新（リアルタイム更新待たずに即時反映）
    setPatients(prevPatients => prevPatients.map(p =>
      p.id === patientId ? { ...p, records: updatedRecords } : p
    ));
  };


  const updateMedicalRecord = async (patientId: string, updatedRecord: MedicalRecord) => {
    const patientDoc = doc(db, 'patients', patientId);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    const updatedRecords = patient.records.map(r =>
      r.id === updatedRecord.id ? updatedRecord : r
    );
    await updateDoc(patientDoc, { records: updatedRecords });
  };

  return (
    <PatientContext.Provider
      value={{ patients, addPatient, updatePatient, addMedicalRecord, updateMedicalRecord }}
    >
      {children}
    </PatientContext.Provider>
  );
};
