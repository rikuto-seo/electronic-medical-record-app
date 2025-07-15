// src/pages/PrintPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { usePatientContext } from '../hooks/usePatientContext';
import { exportToPDF } from '../utils/pdfUtils';
import { formatJST } from '../utils/dateUtils';
import '../components/pdf/PrintableMedicalRecord.css';

const PrintPage: React.FC = () => {
  const { patientId, recordId } = useParams<{ patientId: string; recordId?: string }>();
  const { patients } = usePatientContext();

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    return <div className="p-6 text-red-600">患者が見つかりません。</div>;
  }

  // recordId がなければ全記録、あれば該当ID群の記録のみを抽出
  const recordsToShow = recordId ? recordId.split('_') : patient.records.map(r => r.id);
  const records = patient.records.filter((r) => recordsToShow.includes(r.id));

  if (records.length === 0) {
    return <div className="p-6 text-red-600">診療記録が見つかりません。</div>;
  }

  // PDFファイル名は「氏名_最初の記録日_診療録.pdf」
  const firstRecordDate = formatJST(records[0].date).replace(/[\/: ]/g, '');
  const pdfFileName = `${patient.name}_${firstRecordDate}_診療録.pdf`;

  const printDateTime = new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="text-center mb-4 print-hidden">
        <button
          onClick={() => exportToPDF('print-area', pdfFileName)}
          className="pdf-export-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          PDF出力
        </button>
      </div>

      <div id="print-area">
        {records.map((record, index) => (
          <div key={record.id} className="print-record page">
            <div className="meta-info">
              <div><strong>記録日時：</strong>{formatJST(record.date)}</div>
              <div><strong>印刷日時：</strong>{printDateTime}</div>
            </div>

            <h1>診療録</h1>

            {/* 基本情報 */}
            <div className="section">
              <h2>基本情報</h2>
              <div className="field"><strong>氏名：</strong> <span className="field-value">{patient.name}</span></div>
              <div className="field"><strong>性別：</strong> <span className="field-value">{patient.gender}</span></div>
              <div className="field"><strong>年齢：</strong> <span className="field-value">{patient.age}歳</span></div>
              <div className="field"><strong>生年月日：</strong> <span className="field-value">{patient.birthDate}</span></div>
              <div className="field"><strong>初診日：</strong> <span className="field-value">{patient.firstVisitDate}</span></div>
              {patient.occupation && <div className="field"><strong>職業：</strong> <span className="field-value">{patient.occupation}</span></div>}
              {patient.address && <div className="field"><strong>住所：</strong> <span className="field-value">{patient.address}</span></div>}
              {patient.phoneNumber && <div className="field"><strong>電話番号：</strong> <span className="field-value">{patient.phoneNumber}</span></div>}
              {patient.email && <div className="field"><strong>Email：</strong> <span className="field-value">{patient.email}</span></div>}
            </div>

            {/* 保険情報 */}
            {patient.insuranceInfo && (
              <div className="section">
                <h2>保険情報</h2>
                <div className="field"><span className="field-value">{patient.insuranceInfo}</span></div>
              </div>
            )}

            {/* 緊急連絡先 */}
            {patient.emergencyContact && (
              <div className="section">
                <h2>緊急連絡先</h2>
                <div className="field"><strong>氏名：</strong> <span className="field-value">{patient.emergencyContact.name}</span></div>
                <div className="field"><strong>続柄：</strong> <span className="field-value">{patient.emergencyContact.relationship}</span></div>
                <div className="field"><strong>電話番号：</strong> <span className="field-value">{patient.emergencyContact.phoneNumber}</span></div>
              </div>
            )}

            {/* 生活習慣 */}
            {patient.lifestyle && (
              <div className="section">
                <h2>生活習慣</h2>
                {patient.lifestyle.smoking && <div className="field"><strong>喫煙：</strong> <span className="field-value">{patient.lifestyle.smoking}</span></div>}
                {patient.lifestyle.drinking && <div className="field"><strong>飲酒：</strong> <span className="field-value">{patient.lifestyle.drinking}</span></div>}
                {patient.lifestyle.exercise && <div className="field"><strong>運動：</strong> <span className="field-value">{patient.lifestyle.exercise}</span></div>}
              </div>
            )}

            {/* 身体測定 */}
            {patient.physicalMeasurements && (
              <div className="section">
                <h2>身体測定</h2>
                {patient.physicalMeasurements.height && <div className="field"><strong>身長：</strong> <span className="field-value">{patient.physicalMeasurements.height} cm</span></div>}
                {patient.physicalMeasurements.weight && <div className="field"><strong>体重：</strong> <span className="field-value">{patient.physicalMeasurements.weight} kg</span></div>}
                {patient.physicalMeasurements.bmi && <div className="field"><strong>BMI：</strong> <span className="field-value">{patient.physicalMeasurements.bmi}</span></div>}
              </div>
            )}

            {/* 家族歴・既往歴・アレルギー・服薬 */}
            {patient.familyHistory && (
              <div className="section">
                <h2>家族歴</h2>
                <div className="field"><span className="field-value">{patient.familyHistory}</span></div>
              </div>
            )}
            {patient.medicalHistory && (
              <div className="section">
                <h2>既往歴</h2>
                <div className="field"><span className="field-value">{patient.medicalHistory}</span></div>
              </div>
            )}
            {patient.allergies && (
              <div className="section">
                <h2>アレルギー</h2>
                <div className="field"><span className="field-value">{patient.allergies}</span></div>
              </div>
            )}
            {patient.currentMedications && (
              <div className="section">
                <h2>服薬中の薬</h2>
                <div className="field"><span className="field-value">{patient.currentMedications}</span></div>
              </div>
            )}

            {/* 初回診療記録 */}
            <div className="section">
              <h2>初回診療記録</h2>
              <div className="field"><strong>記録日：</strong> <span className="field-value">{formatJST(record.date)}</span></div>
              <div className="field"><strong>主訴：</strong> <span className="field-value">{record.chiefComplaint || '—'}</span></div>
              <div className="field"><strong>現病歴：</strong> <span className="field-value">{record.currentCondition || '—'}</span></div>
              <div className="field"><strong>治療方針：</strong> <span className="field-value">{record.treatmentPlan || '—'}</span></div>
              <div className="field"><strong>診断：</strong> <span className="field-value">{record.diagnosis || '—'}</span></div>
              <div className="field"><strong>備考：</strong> <span className="field-value">{record.notes || '—'}</span></div>
            </div>

            {/* 詳細記録 */}
            <div className="section">
              <h2>詳細記録</h2>
              {[
                ['症状の出現日', record.symptomOnsetDate],
                ['症状の持続期間', record.symptomDuration],
                ['症状の部位', record.symptomLocation],
                ['痛みの種類', record.painType],
                ['痛みの強さ', record.painSeverity?.toString()],
                ['可動域', record.rangeOfMotion],
                ['筋力', record.muscleStrength],
                ['触診所見', record.palpationFindings],
                ['皮膚の状態', record.skinCondition],
                ['画像検査所見', record.imagingResults],
                ['神経学的所見', record.neurologicalExamResults],
                ['その他の所見', record.otherExamResults],
                ['鍼の種類', record.acupunctureType],
                ['灸の種類', record.moxibustionType],
                ['治療頻度', record.treatmentFrequency],
                ['セルフケア指導', record.selfCareInstructions],
                ['経過・備考', record.treatmentProgress],
              ].map(([label, value], idx) =>
                value ? (
                  <div key={idx} className="field">
                    <strong>{label}：</strong> <span className="field-value">{value}</span>
                  </div>
                ) : null
              )}
            </div>

            <div className="signature-area">
              医師署名：____________________
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintPage;
