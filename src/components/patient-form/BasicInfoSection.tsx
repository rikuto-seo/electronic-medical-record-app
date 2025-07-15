// src/components/patient-form/BasicInfoSection.tsx
import React from 'react';

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const BasicInfoSection: React.FC<Props> = ({ formData, handleChange }) => (
  <>
    <h2>基本情報</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div>
        <label>氏名</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <label>性別</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">選択してください</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
      </div>
      <div>
        <label>生年月日</label>
        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
      </div>
      <div>
        <label>初診日</label>
        <input type="date" name="firstVisitDate" value={formData.firstVisitDate} onChange={handleChange} required />
      </div>
    </div>
  </>
);

export default BasicInfoSection;
