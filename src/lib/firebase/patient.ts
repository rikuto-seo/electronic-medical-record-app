// src/lib/firebase/patient.ts
import { db } from '../../firebase';
import { doc, updateDoc, DocumentData, UpdateData } from 'firebase/firestore';
import { Patient } from '../../types/PatientData';
import { patientDocument } from '../../utils/patientUtils';
import { registerPatientWithNumber } from './patientNumber';

export const addPatient = registerPatientWithNumber;

export const updatePatientInfo = async (patient: Patient) => {
  const { id, records, schemaVersion, patientNumber, ...info } = patientDocument(patient);
  // Demographic edits must never write a stale copy of the clinical records.
  await updateDoc(doc(db, 'patients', patient.id), info as UpdateData<DocumentData>);
};
