// src/components/PatientContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Patient, MedicalRecord } from '../types/PatientData';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Firestore初期化済み

type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (updated: Patient) => Promise<void>;
  addMedicalRecord: (patientId: string, record: MedicalRecord) => Promise<void>;
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
    const patientsRef = collection(db, 'patients');
    await addDoc(patientsRef, {
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

  const addMedicalRecord = async (patientId: string, record: MedicalRecord) => {
    const patientDoc = doc(db, 'patients', patientId);
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    const updatedRecords = [...(patient.records || []), record];
    await updateDoc(patientDoc, { records: updatedRecords });
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
