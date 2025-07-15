//src/components/patient/PatientBasicInfoForm.tsx
import React from 'react';
import { Patient } from '../../types/PatientData';

interface Props {
  patient: Patient;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onEmergencyContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PatientBasicInfoForm: React.FC<Props> = ({ patient, onChange, onEmergencyContactChange }) => {
  return (
    <fieldset style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
      <legend>🧑‍⚕️ 基本情報</legend>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          氏名：
          <input
            type="text"
            name="name"
            value={patient.name}
            onChange={onChange}
            required
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          性別：
          <select
            name="gender"
            value={patient.gender}
            onChange={onChange}
            required
            style={{ marginLeft: 8 }}
          >
            <option value="">選択してください</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          生年月日：
          <input
            type="date"
            name="birthDate"
            value={patient.birthDate}
            onChange={onChange}
            required
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          初診日：
          <input
            type="date"
            name="firstVisitDate"
            value={patient.firstVisitDate}
            onChange={onChange}
            required
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          住所：
          <input
            type="text"
            name="address"
            value={patient.address || ''}
            onChange={onChange}
            style={{ marginLeft: 8, width: '70%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          電話番号：
          <input
            type="tel"
            name="phoneNumber"
            value={patient.phoneNumber || ''}
            onChange={onChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          メールアドレス：
          <input
            type="email"
            name="email"
            value={patient.email || ''}
            onChange={onChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          職業：
          <input
            type="text"
            name="occupation"
            value={patient.occupation || ''}
            onChange={onChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          緊急連絡先（氏名）：
          <input
            type="text"
            name="emergencyContact.name"
            value={patient.emergencyContact?.name || ''}
            onChange={onEmergencyContactChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          緊急連絡先（続柄）：
          <input
            type="text"
            name="emergencyContact.relationship"
            value={patient.emergencyContact?.relationship || ''}
            onChange={onEmergencyContactChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          緊急連絡先（電話番号）：
          <input
            type="tel"
            name="emergencyContact.phoneNumber"
            value={patient.emergencyContact?.phoneNumber || ''}
            onChange={onEmergencyContactChange}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
    </fieldset>
  );
};

export default PatientBasicInfoForm;
