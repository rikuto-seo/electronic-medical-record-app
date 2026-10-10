import React from 'react';
import { PatientDraft, patientAge } from '../../utils/patientUtils';
import { clinicDateKey } from '../../utils/reservationUtils';
import './patients.css';

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type Props = { patient: PatientDraft; onChange: (event: ChangeEvent) => void; onEmergencyContactChange: (event: React.ChangeEvent<HTMLInputElement>) => void };
const PatientInfoFields: React.FC<Props> = ({ patient, onChange, onEmergencyContactChange }) => {
  const input = (name: keyof PatientDraft, label: string, type = 'text', required = false, wide = false) => (
    <label className={wide ? 'patient-field-wide' : ''} key={name}>
      <span>{label}{required && <span className="patient-required"> 必須</span>}</span>
      <input name={name} value={String(patient[name] ?? '')} onChange={onChange} type={type}
        required={required} maxLength={500} max={type === 'date' && name === 'birthDate' ? clinicDateKey(new Date()) : undefined} />
    </label>
  );
  const textarea = (name: keyof PatientDraft, label: string) => (
    <label key={name}><span>{label}</span><textarea name={name} value={String(patient[name] ?? '')} onChange={onChange} rows={3} /></label>
  );
  return <>
    <fieldset className="patient-panel"><legend>基本情報</legend><div className="patient-fields">
      {input('name', '氏名', 'text', true)}{input('nameKana', 'フリガナ')}
      <label><span>患者番号</span><input aria-label="患者番号" readOnly value={patient.patientNumber || '登録時に自動発行'} /><small className="patient-help">自動採番され、発行後は変更できません。</small></label>
      <label><span>性別<span className="patient-required"> 必須</span></span><select name="gender" value={patient.gender} onChange={onChange} required>
        <option value="">選択してください</option>{['男性', '女性', 'その他', '未回答'].map(value => <option key={value}>{value}</option>)}
      </select></label>
      {input('birthDate', '生年月日', 'date', true)}
      <label><span>年齢（自動計算）</span><input readOnly value={patientAge(patient.birthDate) === undefined ? '' : `${patientAge(patient.birthDate)}歳`} /></label>
      {input('firstVisitDate', '初診日', 'date', true)}{input('occupation', '職業')}
    </div></fieldset>
    <fieldset className="patient-panel"><legend>連絡先</legend><div className="patient-fields">
      {input('phoneNumber', '電話番号', 'tel')}{input('email', 'メールアドレス', 'email')}{input('address', '住所', 'text', false, true)}
      {(['name', 'relationship', 'phoneNumber'] as const).map((key, index) => <label key={key}>
        <span>{['緊急連絡先の氏名', '緊急連絡先の続柄', '緊急連絡先の電話番号'][index]}</span>
        <input name={`emergencyContact.${key}`} value={patient.emergencyContact?.[key] ?? ''} onChange={onEmergencyContactChange} type={key === 'phoneNumber' ? 'tel' : 'text'} maxLength={500} />
      </label>)}
    </div></fieldset>
    <fieldset className="patient-panel"><legend>診療に必要な情報</legend>
      <p className="patient-help">未確認の情報は空欄にしてください。「なし」は確認した場合に記入します。</p>
      <div className="patient-fields">
        {textarea('existingDiagnosis', '他院等での診断名')}{textarea('medicalHistory', '既往歴・手術歴')}
        {textarea('allergies', 'アレルギー・注意事項')}{textarea('currentMedications', '服薬中の薬')}
        {textarea('familyHistory', '家族歴')}{textarea('insuranceInfo', '保険・支払区分の情報')}
        {input('assignedStaff', '担当スタッフ')}{input('referralSource', '紹介元・来院経路')}
        <div className="patient-field-wide">{textarea('notes', '申し送り・患者メモ')}</div>
      </div>
    </fieldset>
  </>;
};
export default PatientInfoFields;
