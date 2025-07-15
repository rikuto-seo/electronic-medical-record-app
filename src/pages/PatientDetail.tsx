// src/pages/PatientDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Patient, MedicalRecord } from '../types/PatientData';
import { usePatientContext } from '../hooks/usePatientContext';
import PatientBasicInfoForm from '../components/patient/PatientBasicInfoForm';
import MedicalRecordForm from '../components/record/MedicalRecordForm';
import MedicalRecordList from '../components/record/MedicalRecordList';
import { v4 as uuidv4 } from 'uuid';
import { MedicalRecordFormData } from '../schema/medicalRecordSchema';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, updatePatient, addMedicalRecord } = usePatientContext();
  const navigate = useNavigate();

  const getNowInJSTDateTimeLocal = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const date = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());

  return `${year}-${month}-${date}T${hours}:${minutes}`;
};


  // 修正: 常に現在時刻を反映する emptyRecord を関数に変更
  const createEmptyRecord = (): MedicalRecord => ({
    id: '',
    date: getNowInJSTDateTimeLocal(),
    chiefComplaint: '',
    symptomOnsetDate: '',
    symptomDuration: '',
    symptomLocation: '',
    painType: '',
    painSeverity: null,
    rangeOfMotion: '',
    muscleStrength: '',
    palpationFindings: '',
    skinCondition: '',
    imagingResults: '',
    neurologicalExamResults: '',
    otherExamResults: '',
    diagnosis: '',
    acupunctureType: '',
    acupunctureCount: null,
    moxibustionType: '',
    treatmentFrequency: '',
    currentCondition: '',
    treatmentPlan: '',
    selfCareInstructions: '',
    treatmentProgress: '',
    notes: '',
  });

  const normalizeRecord = (data: MedicalRecordFormData): MedicalRecord => {
    return {
      ...data,
      chiefComplaint: data.chiefComplaint ?? '',
      symptomOnsetDate: data.symptomOnsetDate ?? '',
      symptomDuration: data.symptomDuration ?? '',
      symptomLocation: data.symptomLocation ?? '',
      painType: data.painType ?? '',
      painSeverity: data.painSeverity ?? null,
      rangeOfMotion: data.rangeOfMotion ?? '',
      muscleStrength: data.muscleStrength ?? '',
      palpationFindings: data.palpationFindings ?? '',
      skinCondition: data.skinCondition ?? '',
      imagingResults: data.imagingResults ?? '',
      neurologicalExamResults: data.neurologicalExamResults ?? '',
      otherExamResults: data.otherExamResults ?? '',
      diagnosis: data.diagnosis ?? '',
      acupunctureType: data.acupunctureType ?? '',
      acupunctureCount: data.acupunctureCount ?? null,
      moxibustionType: data.moxibustionType ?? '',
      treatmentFrequency: data.treatmentFrequency ?? '',
      currentCondition: data.currentCondition ?? '',
      treatmentPlan: data.treatmentPlan ?? '',
      selfCareInstructions: data.selfCareInstructions ?? '',
      treatmentProgress: data.treatmentProgress ?? '',
      notes: data.notes ?? '',
      id: data.id || '',
      date: data.date || getNowInJSTDateTimeLocal(),
    };
  };

  const [patient, setPatient] = useState<Patient | null>(null);
  const [newRecord, setNewRecord] = useState<MedicalRecord>(createEmptyRecord());

  useEffect(() => {
    const found = patients.find((p) => p.id === id);
    if (found) {
      setPatient(found);
      setNewRecord(createEmptyRecord()); // ← 再生成して常に新しい時刻にする
    }
  }, [id, patients]);

  if (!patient) return <div>患者が見つかりません。</div>;

  const handlePatientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPatient((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEmergencyContactChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const field = name.split('.')[1];

    setPatient((prev) =>
      prev
        ? {
            ...prev,
            emergencyContact: {
              ...(prev.emergencyContact ?? {
                name: '',
                relationship: '',
                phoneNumber: '',
              }),
              [field]: value,
            },
          }
        : null
    );
  };

  const handleRecordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]:
        name === 'painSeverity' || name === 'acupunctureCount'
          ? value === ''
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSaveNewRecord = (record: MedicalRecordFormData) => {
    if (!patient) return;

    const normalizedRecord = normalizeRecord(record);
    const recordToSave = { ...normalizedRecord, id: uuidv4() };
    addMedicalRecord(patient.id, recordToSave);

    setNewRecord(createEmptyRecord());
    alert('診療記録を保存しました。');
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h2>患者詳細</h2>

        <PatientBasicInfoForm
          patient={patient}
          onChange={handlePatientChange}
          onEmergencyContactChange={handleEmergencyContactChange}
        />

        <MedicalRecordForm
          initialData={newRecord}
          onSubmit={handleSaveNewRecord}
          onCancel={() => setNewRecord(createEmptyRecord())}
        />

        <hr style={{ margin: '2rem 0' }} />

        <MedicalRecordList records={patient.records} patientId={patient.id} />
      </div>
    </div>
  );
};

export default PatientDetail;
