import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { usePatientContext } from '../../hooks/usePatientContext';
import { buildNewPatient, emptyPatientDraft, validatePatientDraft } from '../../utils/patientUtils';
import PatientInfoFields from '../patient/PatientInfoFields';
import { firebaseErrorCode } from '../../utils/firestoreErrors';

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { addPatient, patientsLoading, patientsError } = usePatientContext();
  const [formData, setFormData] = useState(emptyPatientDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  // Retain the document ID when retrying an uncertain request.
  const patientId = useRef(uuidv4());
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({ ...prev, emergencyContact: { name: '', relationship: '', phoneNumber: '', ...prev.emergencyContact, [key]: value } }));
    } else setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    setError('');
    const validation = validatePatientDraft(formData);
    if (validation) { setError(validation); return; }
    if (patientsLoading || patientsError) { setError('患者一覧の取得が完了してから登録してください。'); return; }
    savingRef.current = true; setSaving(true);
    try {
      await addPatient(buildNewPatient(formData, patientId.current));
      navigate(`/patients/${patientId.current}`);
    } catch (reason) {
      const code=firebaseErrorCode(reason);
      setError(code==='permission-denied'
        ? '患者番号の発行・登録が許可されていません。最新のFirestoreルールを公開し、院内スタッフのアカウントでログインしてください。入力内容は保持されています。'
        : `患者情報を保存できませんでした。${reason instanceof Error ? reason.message : '接続を確認して、もう一度登録してください。'} 入力内容は保持されています。`);
    } finally { savingRef.current = false; setSaving(false); }
  };
  return <form className="patient-form" onSubmit={handleSubmit}>
    <p className="patient-help">院内スタッフ用の登録画面です。登録した情報は患者情報PDFにも反映されます。</p>
    {patientsError && <p role="alert" className="patient-error">{patientsError}</p>}
    {error && <p role="alert" className="patient-error">{error}</p>}
    <fieldset disabled={saving} className="patient-form-body"><PatientInfoFields patient={formData} onChange={handleChange} onEmergencyContactChange={handleChange} /></fieldset>
    <div className="patient-actions">
      <button type="submit" disabled={saving || patientsLoading || !!patientsError}>{saving ? '登録中…' : '患者を登録する'}</button>
      {!saving && <Link to="/patients">患者一覧に戻る</Link>}
    </div>
  </form>;
};
export default PatientForm;
