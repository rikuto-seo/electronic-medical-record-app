import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Patient } from '../types/PatientData';

const patientsRef = collection(db, 'patients');

// 追加
export const addPatient = async (patient: Patient) => {
  await setDoc(doc(patientsRef, patient.id), patient);
};

// 一覧取得
export const fetchPatients = async (): Promise<Patient[]> => {
  const snapshot = await getDocs(patientsRef);
  return snapshot.docs.map(doc => doc.data() as Patient);
};

// 個別取得
export const getPatientById = async (id: string): Promise<Patient | null> => {
  const docRef = doc(patientsRef, id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as Patient) : null;
};

// 更新
export const updatePatient = async (patient: Patient) => {
  const { id, ...patientDataWithoutId } = patient; // id を除外
  const docRef = doc(patientsRef, id);
  await updateDoc(docRef, patientDataWithoutId);
};

// 削除
export const deletePatient = async (id: string) => {
  await deleteDoc(doc(patientsRef, id));
};
