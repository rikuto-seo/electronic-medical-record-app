// src/lib/firebase/patient.ts
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Patient } from '../../types/PatientData';

export const addPatient = async (patient: Patient) => {
  const docRef = await addDoc(collection(db, 'patients'), patient);
  return docRef.id;
};
