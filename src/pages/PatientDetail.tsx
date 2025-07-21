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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faFileMedicalAlt } from '@fortawesome/free-solid-svg-icons';

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
    mediaUrls: [],
  });

  const normalizeRecord = (data: MedicalRecordFormData): MedicalRecord => {
    const { mediaFiles, ...rest } = data;  // mediaFilesを除外

    return {
      ...rest,
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
      mediaUrls: [],  // mediaUrlsは空配列で初期化
    };
  };

  const [patient, setPatient] = useState<Patient | null>(null);
  const [newRecord, setNewRecord] = useState<MedicalRecord>(createEmptyRecord());

  useEffect(() => {
    if (patients.length === 0) return; // データ未取得なら何もしない
    const found = patients.find((p) => p.id === id);
    if (found) {
      setPatient(found);
      setNewRecord(createEmptyRecord());
    } else {
      setPatient(null); // 明示的にnullを設定
    }
  }, [id, patients]);

  // 読み込み中の表示
  if (patients.length === 0) {
    return <div>読み込み中...</div>;
  }

  // 患者が見つからなかった場合のみ表示
  if (!patient) {
    return <div>患者が見つかりません。</div>;
  }

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

  const handleSaveNewRecord = async (formData: FormData) => {
    if (!patient) return;

    try {
      // JSON部分（record）をBlobから抽出
      const recordBlob = formData.get('record') as Blob;
      const recordJson = JSON.parse(await recordBlob.text());

      const normalizedRecord = normalizeRecord(recordJson);
      const recordId = uuidv4();

      // mediaFiles部分を取得
      const mediaFiles = formData.getAll('mediaFiles') as File[];

      let mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        const storage = getStorage();
        const uploadPromises = mediaFiles.map(async (file) => {
          const storageRef = ref(storage, `patients/${patient.id}/records/${recordId}/${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });

        mediaUrls = await Promise.all(uploadPromises);
      }

      const recordToSave = {
        ...normalizedRecord,
        id: recordId,
        mediaUrls,
      };

      await addMedicalRecord(patient.id, recordToSave, mediaFiles);

      setNewRecord(createEmptyRecord());
      alert('診療記録を保存しました。');
    } catch (error) {
      console.error('診療記録の保存でエラーが発生しました:', error);
      alert('保存中にエラーが発生しました。コンソールを確認してください。');
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '0.5em', color: '#1D3557' }} />
          患者詳細
        </h2>

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
