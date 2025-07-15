//src/components/PatientContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Patient, MedicalRecord } from '../types/PatientData';

type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (updated: Patient) => void;
  addMedicalRecord: (patientId: string, record: MedicalRecord) => void;
  updateMedicalRecord: (patientId: string, updatedRecord: MedicalRecord) => void;
};

export const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  // 🔄 ローカルストレージから読み込み
  useEffect(() => {
    const stored = localStorage.getItem('patients');
    if (stored) {
      try {
        setPatients(JSON.parse(stored));
      } catch (e) {
        console.error('患者データの読み込みに失敗しました', e);
      }
    }
  }, []);

  // 💾 ローカルストレージへ保存
  useEffect(() => {
    localStorage.setItem('patients', JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patient: Patient) => {
    setPatients((prev) => [...prev, patient]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
  };

  const addMedicalRecord = (patientId: string, record: MedicalRecord) => {
    setPatients((prev) => {
      const updated = prev.map((p) =>
        p.id === patientId
          ? { ...p, records: [...(p.records || []), record] }
          : p
      );
      console.log('更新後のpatients:', updated);
      return updated;
    });
  };

  const updateMedicalRecord = (patientId: string, updatedRecord: MedicalRecord) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
            ...p,
            records: p.records.map((r) =>
              r.id === updatedRecord.id ? updatedRecord : r
            ),
          }
          : p
      )
    );
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        addPatient,
        updatePatient,
        addMedicalRecord,
        updateMedicalRecord,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
