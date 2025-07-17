// src/lib/firebase/patient.ts
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Patient } from '../../types/PatientData';

export const addPatient = async (patient: Patient) => {
  const ref = doc(db, 'patients', patient.id); // ✅ IDを指定
  await setDoc(ref, patient);                  // ✅ データをそのIDで保存
};
