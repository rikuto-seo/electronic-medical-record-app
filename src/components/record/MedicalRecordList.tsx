// src/components/record/MedicalRecordList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicalRecord } from '../../types/PatientData';
import { formatJST } from '../../utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faFileMedicalAlt } from '@fortawesome/free-solid-svg-icons';

type Props = {
  records: MedicalRecord[];
  patientId: string;
};

const fieldLabels: Partial<Record<keyof MedicalRecord, string>> = {
  id: 'ID',
  date: '日付',
  chiefComplaint: '主訴',
  symptomOnsetDate: '発症日',
  symptomDuration: '症状の持続期間',
  symptomLocation: '症状の部位',
  painType: '痛みの種類',
  painSeverity: '痛みの程度',
  rangeOfMotion: '可動域',
  muscleStrength: '筋力',
  palpationFindings: '触診所見',
  skinCondition: '皮膚の状態',
  imagingResults: '画像診断結果',
  neurologicalExamResults: '神経学的検査結果',
  otherExamResults: 'その他の検査結果',
  diagnosis: '診断名',
  acupunctureType: '鍼の種類',
  acupunctureCount: '鍼の本数',
  moxibustionType: '灸の種類',
  treatmentFrequency: '施術頻度',
  currentCondition: '現症',
  treatmentPlan: '治療方針',
  selfCareInstructions: 'セルフケア指導',
  treatmentProgress: '経過',
  notes: '備考',
};

const MedicalRecordList: React.FC<Props> = ({ records, patientId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mediaOpenIds, setMediaOpenIds] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleMediaFiles = (id: string) => {
    setMediaOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const joined = selectedIds.join('_');
    navigate(`/print/${patientId}/${joined}`);
  };

  return (
    <div className="mt-6">
      <h2
        className="text-lg font-bold mb-4"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <FontAwesomeIcon icon={faFileMedicalAlt} style={{ marginRight: '0.5em', color: '#E76F51' }} />
        診療記録
      </h2>

      {records.length === 0 && (
        <p className="text-gray-500 italic">診療記録はまだありません。</p>
      )}

      {records.length > 0 && (
        <div className="mb-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
            disabled={selectedIds.length === 0}
            onClick={handleExportSelected}
          >
            選択した診療録をPDF出力
          </button>
        </div>
      )}

      {records
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((record) => (
          <div
            key={record.id}
            className="border rounded-md mb-4 shadow-sm hover:shadow-md transition"
          >
            <div
              className="record-header"
              onClick={() => toggleAccordion(record.id)}
            >
              <span className="record-date-label">
                {formatJST(record.date)} の記録
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/patients/${patientId}/records/${record.id}/print`);
                }}
                className="record-print-button"
              >
                カルテ出力
              </button>
            </div>

            {expandedId === record.id && (
              <div className="p-4 bg-white text-sm space-y-2">
                {Object.entries(record).map(([key, value]) => {
                  if (key === 'id' || key === 'mediaFiles') return null;

                  const label = fieldLabels[key as keyof MedicalRecord] || key;
                  const formattedValue =
                    key === 'date' && typeof value === 'string'
                      ? formatJST(value)
                      : value ?? '―';

                  return (
                    <p key={key} className="leading-relaxed">
                      <strong className="text-gray-700">{label}:</strong>{' '}
                      <span className="text-gray-900">{formattedValue}</span>
                    </p>
                  );
                })}

                {/* 添付ファイル表示 */}
                {Array.isArray(record.mediaUrls) && record.mediaUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <button
                      className="text-blue-600 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMediaFiles(record.id);
                      }}
                    >
                      {mediaOpenIds[record.id] ? '添付ファイルを閉じる' : '添付ファイルを表示'}
                    </button>

                    {mediaOpenIds[record.id] && (
                      <div className="flex flex-wrap gap-4 mt-2">
                        {record.mediaUrls.map((url, index) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isVideo = /\.(mp4|webm|ogg)$/i.test(url);

                          return (
                            <div key={index} className="border p-2 rounded shadow-sm max-w-xs">
                              {isImage ? (
                                <img
                                  src={url}
                                  alt={`添付画像${index + 1}`}
                                  className="max-w-full h-auto"
                                />
                              ) : isVideo ? (
                                <video controls className="max-w-full h-auto">
                                  <source src={url} />
                                  お使いのブラウザは video タグに対応していません。
                                </video>
                              ) : (
                                <a href={url} download className="text-blue-600 underline">
                                  ファイルをダウンロード
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default MedicalRecordList;
