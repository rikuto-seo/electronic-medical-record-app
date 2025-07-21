// src/components/record/MedicalRecordList.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { MedicalRecord } from '../../types/PatientData';
import { formatJST } from '../../utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedicalAlt } from '@fortawesome/free-solid-svg-icons';

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
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
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

  const getMediaUrlArray = (mediaUrls: unknown): string[] => {
    if (Array.isArray(mediaUrls)) {
      return mediaUrls;
    }
    if (typeof mediaUrls === 'string') {
      return mediaUrls
        .split('https://')
        .filter(Boolean)
        .map((url) => 'https://' + url);
    }
    return [];
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faFileMedicalAlt} className="mr-2 text-red-500" />
        診療記録
      </h2>

      {records.length === 0 && (
        <p className="text-gray-500 italic">診療記録はまだありません。</p>
      )}

      {records
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((record) => {
          const mediaUrlArray = getMediaUrlArray(record.mediaUrls);

          return (
            <div
              key={record.id}
              className="border rounded-md mb-4 shadow-sm hover:shadow-md transition"
            >
              <div className="record-header flex justify-between items-center cursor-pointer" onClick={() => toggleAccordion(record.id)}>
                <span className="record-date-label">{formatJST(record.date)} の記録</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patientId}/records/${record.id}/print`);
                  }}
                  className="record-print-button text-blue-600 underline"
                >
                  カルテ出力
                </button>
              </div>

              {expandedId === record.id && (
                <div className="p-4 bg-white text-sm space-y-2">
                  {Object.entries(record).map(([key, value]) => {
                    if (key === 'id' || key === 'mediaFiles' || key === 'mediaUrls') return null;

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

                  {mediaUrlArray.length > 0 && (
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
                          {mediaUrlArray.map((url, index) => {
                            const getFileExtension = (url: string): string => {
                              const urlWithoutQuery = url.split('?')[0];
                              return urlWithoutQuery.split('.').pop()?.toLowerCase() || '';
                            };

                            const extension = getFileExtension(url);

                            let type: string = 'other';
                            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension))
                              type = 'image';
                            else if (['mp4', 'webm', 'ogg'].includes(extension)) type = 'video';
                            else if (['pdf'].includes(extension)) type = 'pdf';
                            else if (['txt'].includes(extension)) type = 'text';

                            return (
                              <div key={index} className="border p-2 rounded shadow-sm max-w-xs">
                                <a
                                  className="text-blue-600 underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMedia({ url, type });
                                  }}
                                >
                                  ファイル{index + 1} を表示
                                </a>
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
          );
        })}

      {/* モーダル（React Portalで表示） */}
      {selectedMedia &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedMedia(null)}
          >
            <div
              className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[80vh] overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black"
                onClick={() => setSelectedMedia(null)}
                aria-label="閉じる"
              >
                ✕
              </button>

              {selectedMedia.type === 'image' && (
                <img src={selectedMedia.url} alt="添付画像" className="w-full h-auto max-h-[70vh]" />
              )}
              {selectedMedia.type === 'video' && (
                <video src={selectedMedia.url} controls className="w-full h-auto max-h-[70vh]" />
              )}
              {selectedMedia.type === 'pdf' && (
                <iframe
                  src={selectedMedia.url}
                  title="PDF表示"
                  className="w-full h-[70vh]"
                />
              )}
              {selectedMedia.type === 'text' && (
                <iframe
                  src={selectedMedia.url}
                  title="テキスト表示"
                  className="w-full h-[70vh]"
                />
              )}
              {selectedMedia.type === 'other' && (
                <p>このファイルは埋め込み表示に対応していません。</p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MedicalRecordList;
