// src/components/patient-form/EmergencyContactSection.tsx
import React from 'react';

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const EmergencyContactSection: React.FC<Props> = ({ formData, handleChange }) => (
  <>
    <h2>📞 緊急連絡先</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      <div>
        <label>氏名</label>
        <input
          type="text"
          name="emergencyContact.name"
          value={formData.emergencyContact?.name || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>続柄</label>
        <input
          type="text"
          name="emergencyContact.relationship"
          value={formData.emergencyContact?.relationship || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>電話番号</label>
        <input
          type="tel"
          name="emergencyContact.phoneNumber"
          value={formData.emergencyContact?.phoneNumber || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  </>
);

export default EmergencyContactSection;
