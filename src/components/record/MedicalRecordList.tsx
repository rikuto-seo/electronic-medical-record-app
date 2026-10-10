import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MedicalRecord } from "../../types/PatientData";
import {
  medicalRecordSections,
  pdfDate,
  selectedMedicalRecords,
} from "../../utils/patientPdfData";
import "./records.css";
import { recordMediaUrls } from "../../utils/medicalRecordUtils";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import { permanentlyDeleteRecord } from "../../utils/permanentDeletion";
type Props = {
  records: MedicalRecord[];
  patientId: string;
  patientName?: string;
  onEdit?: (record: MedicalRecord) => void;
};
const MedicalRecordList: React.FC<Props> = ({
  records,
  patientId,
  onEdit,
  patientName = "選択中の患者",
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const visibleSelection = selected.filter((id) =>
    records.some((record) => record.id === id),
  );
  const sorted = selectedMedicalRecords({ records }).reverse();
  return (
    <div>
      {!records.length && (
        <p className="patient-help">
          診療記録はまだありません。「カルテ入力」から最初の記録を保存できます。
        </p>
      )}
      {!!records.length && (
        <div className="patient-actions">
          <button
            disabled={!visibleSelection.length}
            onClick={() =>
              navigate(`/print/${patientId}/${visibleSelection.join("_")}`)
            }
          >
            選択した記録をPDF出力（{visibleSelection.length}件）
          </button>
          <Link to={`/patients/${patientId}/records/print`}>全記録のPDF</Link>
        </div>
      )}
      {sorted.map((record) => (
        <article className="record-history-card" key={record.id}>
          <div className="record-history-top">
            <input
              type="checkbox"
              aria-label={`${pdfDate(record.date, true)}の記録を選択`}
              style={{ width: 17, margin: 0 }}
              checked={selected.includes(record.id)}
              onChange={(event) =>
                setSelected((previous) =>
                  event.target.checked
                    ? [...previous, record.id]
                    : previous.filter((id) => id !== record.id),
                )
              }
            />
            <span className="record-history-date">
              {pdfDate(record.date, true)} {record.visitType}
            </span>
            <small>{record.treatmentPerformedBy}</small>
            {onEdit && (
              <button
                className="record-secondary"
                onClick={() => onEdit(record)}
              >
                記録を編集
              </button>
            )}
            <Link to={`/patients/${patientId}/records/${record.id}/print`}>
              PDF
            </Link>
            <ConfirmDeleteButton
              label="カルテを完全削除"
              target={`${patientName} / ${pdfDate(record.date, true)} / ${(record.chiefComplaint || record.currentCondition || "診療記録").slice(0, 100)}`}
              description="このカルテと添付ファイルを完全に削除します。来院・予約と支払い明細は残します。"
              onDelete={() => permanentlyDeleteRecord(patientId, record)}
            />
          </div>
          <div className="record-history-content">
            <p className="record-history-preview">
              {(
                record.chiefComplaint ||
                record.currentCondition ||
                "主訴未記載"
              ).slice(0, 180)}
            </p>
            <details>
              <summary>記録の詳細を確認</summary>
              {medicalRecordSections(record).map((section) => (
                <section className="record-history-section" key={section.title}>
                  <h3>{section.title}</h3>
                  <dl>
                    {section.rows.flat().map((cell, index) => (
                      <div key={`${cell.label}-${index}`}>
                        <dt>{cell.label}</dt>
                        <dd>{cell.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {!!recordMediaUrls(record.mediaUrls).length && (
                <div>
                  <h3>添付ファイル</h3>
                  {recordMediaUrls(record.mediaUrls).map((url, index) => (
                    <p key={index}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        添付ファイル {index + 1} を開く
                      </a>
                    </p>
                  ))}
                </div>
              )}
            </details>
          </div>
        </article>
      ))}
    </div>
  );
};
export default MedicalRecordList;
