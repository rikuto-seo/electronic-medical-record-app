// src/components/patient-form/InitialRecordSection.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faClipboardList, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

type Props = {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
};

const InitialRecordSection: React.FC<Props> = ({ formData, handleChange }) => (
  <>
    <h2>
      <FontAwesomeIcon icon={faClipboardList} style={{ marginRight: '0.5em', color: '#457B9D' }} />
      初回診療記録
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <div>
        <label>記録日時</label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>主訴</label>
        <textarea
          name="chiefComplaint"
          value={formData.chiefComplaint}
          onChange={handleChange}
          rows={2}
        />
      </div>
      <div>
        <label>現病歴</label>
        <textarea
          name="currentCondition"
          value={formData.currentCondition}
          onChange={handleChange}
          rows={2}
        />
      </div>
      <div>
        <label>症状発現日</label>
        <input
          type="date"
          name="symptomOnsetDate"
          value={formData.symptomOnsetDate || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>痛みの程度（0〜10）</label>
        <input
          type="number"
          min="0"
          max="10"
          name="painSeverity"
          value={formData.painSeverity || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>治療頻度</label>
        <input
          type="text"
          name="treatmentFrequency"
          value={formData.treatmentFrequency || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>治療方針</label>
        <textarea
          name="treatmentPlan"
          value={formData.treatmentPlan}
          onChange={handleChange}
          rows={2}
        />
      </div>
      <div>
        <label>備考</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
        />
      </div>
    </div>
  </>
);

export default InitialRecordSection;
