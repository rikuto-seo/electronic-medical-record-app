//src/components/patient/LatestMedicalRecordForm.tsx
import React from 'react';
import { MedicalRecord } from '../../types/PatientData';

interface Props {
  record: MedicalRecord;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
}

const LatestMedicalRecordForm: React.FC<Props> = ({ record, onChange }) => {
  // 日時の表示用に整形
  const formatDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';

    // "YYYY-MM-DD" のみなら "T00:00" を追加
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr + 'T00:00';
    }

    // "YYYY-MM-DDTHH:mm" または "YYYY-MM-DDTHH:mm:ss" の形式ならそのまま使う
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
      return dateStr.slice(0, 16); // 秒以下は削る（datetime-local 用）
    }

    return '';
  };

  return (
    <fieldset style={{ border: '1px solid #ccc', padding: '1rem' }}>
      <legend>最新診療記録</legend>
      {!record ? (
        <p>診療記録がありません</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              記録日：
              <input
                type="datetime-local"
                name="date"
                value={formatDateTimeLocal(record.date)}
                onChange={onChange}
                required
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              主訴：
              <textarea
                name="chiefComplaint"
                value={record.chiefComplaint || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              症状発症日：
              <input
                type="date"
                name="symptomOnsetDate"
                value={record.symptomOnsetDate || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              症状継続期間：
              <input
                type="text"
                name="symptomDuration"
                value={record.symptomDuration || ''}
                onChange={onChange}
                placeholder="例: 3週間"
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              症状部位：
              <input
                type="text"
                name="symptomLocation"
                value={record.symptomLocation || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              痛みの種類：
              <input
                type="text"
                name="painType"
                value={record.painType || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              痛みの強さ（1-10）：
              <input
                type="number"
                name="painSeverity"
                value={record.painSeverity ?? ''}
                onChange={onChange}
                min={1}
                max={10}
                style={{ marginLeft: 8, width: '4rem' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              可動域：
              <input
                type="text"
                name="rangeOfMotion"
                value={record.rangeOfMotion || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              筋力：
              <input
                type="text"
                name="muscleStrength"
                value={record.muscleStrength || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              触診所見：
              <textarea
                name="palpationFindings"
                value={record.palpationFindings || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              皮膚状態：
              <textarea
                name="skinCondition"
                value={record.skinCondition || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              画像診断結果：
              <textarea
                name="imagingResults"
                value={record.imagingResults || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              神経学的検査結果：
              <textarea
                name="neurologicalExamResults"
                value={record.neurologicalExamResults || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              その他検査結果：
              <textarea
                name="otherExamResults"
                value={record.otherExamResults || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              診断：
              <textarea
                name="diagnosis"
                value={record.diagnosis || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              鍼治療の種類：
              <input
                type="text"
                name="acupunctureType"
                value={record.acupunctureType || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              鍼治療回数：
              <input
                type="number"
                name="acupunctureCount"
                value={record.acupunctureCount ?? ''}
                onChange={onChange}
                min={0}
                style={{ marginLeft: 8, width: '5rem' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              灸治療の種類：
              <input
                type="text"
                name="moxibustionType"
                value={record.moxibustionType || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              治療頻度：
              <input
                type="text"
                name="treatmentFrequency"
                value={record.treatmentFrequency || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              現症：
              <textarea
                name="currentCondition"
                value={record.currentCondition || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              治療計画：
              <textarea
                name="treatmentPlan"
                value={record.treatmentPlan || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              自宅ケア指示：
              <textarea
                name="selfCareInstructions"
                value={record.selfCareInstructions || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              治療経過：
              <textarea
                name="treatmentProgress"
                value={record.treatmentProgress || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              備考：
              <textarea
                name="notes"
                value={record.notes || ''}
                onChange={onChange}
                rows={2}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>
        </>
      )}
    </fieldset>
  );
};

export default LatestMedicalRecordForm;
