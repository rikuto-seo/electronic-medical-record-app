// src/utils/patientService.ts
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getPatientNameById = async (patientId: string): Promise<string> => {
  const docRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return '不明な患者';
  const data = docSnap.data();
  return data?.name ?? '名無し';
};
