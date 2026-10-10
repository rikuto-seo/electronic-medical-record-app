import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Patient, MedicalRecord } from "../types/PatientData";
import { Reservation } from "../types/reservation";
import { usePatientContext } from "../hooks/usePatientContext";
import PatientBasicInfoForm from "../components/patient/PatientBasicInfoForm";
import MedicalRecordForm from "../components/record/MedicalRecordForm";
import PatientVisitHistory from "../components/patient/PatientVisitHistory";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import { MedicalRecordFormData } from "../schema/medicalRecordSchema";
import {
  displayPatientAge,
  patientAge,
  validatePatientDraft,
} from "../utils/patientUtils";
import { clinicDateTimeInput } from "../utils/reservationUtils";
import { getReservationById } from "../utils/reservationService";
import { pdfDate } from "../utils/patientPdfData";
import { normalizeMedicalRecord } from "../utils/medicalRecordUtils";
import "../components/record/records.css";

const emptyRecord = (reservation?: Reservation | null): MedicalRecord => ({
  id: uuidv4(),
  date: clinicDateTimeInput(new Date()),
  currentCondition: "",
  treatmentPlan: "",
  notes: "",
  reservationId: reservation?.id,
  treatmentPerformedBy: reservation?.staffName,
});
type Tab = "chart" | "history" | "patient";
const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab: Tab =
    requestedTab === "chart" ||
    requestedTab === "history" ||
    requestedTab === "patient"
      ? requestedTab
      : params.get("reservationId")
        ? "chart"
        : "history";
  const reservationId = params.get("reservationId");
  const {
    patients,
    patientsLoading,
    patientsError,
    reloadPatients,
    updatePatient,
    deletePatient,
    addMedicalRecord,
    updateMedicalRecord,
  } = usePatientContext();
  const currentPatient = patients.find((item) => item.id === id);
  const [patient, setPatient] = useState<Patient | null>(null);
  const patientDirty = useRef(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientMessage, setPatientMessage] = useState("");
  const [patientError, setPatientError] = useState("");
  const [newRecord, setNewRecord] = useState(() => emptyRecord());
  const [editingRecord, setEditingRecord] = useState<MedicalRecord>();
  const [recordDirty, setRecordDirty] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const changeTab = (next: Tab) => {
    const search = new URLSearchParams(params);
    search.set("tab", next);
    setParams(search, { replace: true });
  };
  useEffect(() => {
    patientDirty.current = false;
    setEditingRecord(undefined);
    setNewRecord(emptyRecord());
    setPatientMessage("");
    setPatientError("");
    setRecordMessage("");
    setRecordDirty(false);
  }, [id, reservationId]);
  useEffect(() => {
    setPatient((previous) =>
      currentPatient
        ? patientDirty.current && previous?.id === currentPatient.id
          ? {
              ...currentPatient,
              ...previous,
              records: currentPatient.records,
              patientNumber: currentPatient.patientNumber,
              deletionOperation: currentPatient.deletionOperation,
            }
          : currentPatient
        : null,
    );
  }, [currentPatient]);
  useEffect(() => {
    if (
      editingRecord &&
      currentPatient &&
      !currentPatient.records?.some((record) => record.id === editingRecord.id)
    ) {
      setEditingRecord(undefined);
      setNewRecord(emptyRecord(reservation));
      setRecordDirty(false);
    }
  }, [currentPatient, editingRecord, reservation]);
  useEffect(() => {
    let active = true;
    setReservation(null);
    setReservationError("");
    setReservationLoading(!!reservationId);
    if (!reservationId) return;
    getReservationById(reservationId)
      .then((found) => {
        if (!active) return;
        if (!found || found.patientId !== id) {
          setReservationError(
            "予約と患者の情報が一致しません。予約一覧から開き直してください。",
          );
          return;
        }
        setReservation(found);
        setNewRecord((previous) => ({
          ...previous,
          reservationId,
          treatmentPerformedBy: found.staffName ?? "",
        }));
      })
      .catch(() => {
        if (active)
          setReservationError(
            "予約情報を取得できません。予約一覧で患者を確認してから入力してください。",
          );
      })
      .finally(() => {
        if (active) setReservationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, reservationId]);
  if (patientsLoading) return <p role="status">患者情報を読み込み中…</p>;
  if (patientsError)
    return (
      <div>
        <p role="alert">{patientsError}</p>
        <button onClick={reloadPatients}>再読み込み</button>
      </div>
    );
  if (!patient || patient.id !== id)
    return (
      <div>
        <p>患者が見つかりません。</p>
        <Link to="/patients">患者一覧に戻る</Link>
      </div>
    );
  const changePatient = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    if (name === "patientNumber") return;
    patientDirty.current = true;
    setPatient((previous) =>
      previous ? { ...previous, [name]: value } : null,
    );
  };
  const changeEmergency = (event: React.ChangeEvent<HTMLInputElement>) => {
    const key = event.target.name.split(".")[1],
      value = event.target.value;
    patientDirty.current = true;
    setPatient((previous) =>
      previous
        ? {
            ...previous,
            emergencyContact: {
              name: "",
              relationship: "",
              phoneNumber: "",
              ...previous.emergencyContact,
              [key]: value,
            },
          }
        : null,
    );
  };
  const savePatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingPatient) return;
    setPatientError("");
    setPatientMessage("");
    const error = validatePatientDraft(patient);
    if (error) {
      setPatientError(error);
      return;
    }
    setSavingPatient(true);
    try {
      await updatePatient({ ...patient, age: patientAge(patient.birthDate)! });
      patientDirty.current = false;
      setPatientMessage("患者情報を保存しました。");
    } catch {
      setPatientError(
        "患者情報を保存できませんでした。入力内容は保持されています。",
      );
    } finally {
      setSavingPatient(false);
    }
  };
  const saveRecord = async (data: MedicalRecordFormData, files: File[]) => {
    const record = normalizeMedicalRecord(data, editingRecord);
    if (editingRecord) await updateMedicalRecord(patient.id, record, files);
    else await addMedicalRecord(patient.id, record, files);
    setRecordMessage(
      editingRecord
        ? "診療記録の変更を保存しました。"
        : "診療記録を保存しました。",
    );
    setEditingRecord(undefined);
    setNewRecord(emptyRecord(reservation));
  };
  const editRecord = (record: MedicalRecord) => {
    if (recordDirty) {
      setRecordMessage(
        "入力中の内容があります。保存または入力をクリアしてから、別の記録を編集してください。",
      );
      changeTab("chart");
      return;
    }
    setEditingRecord(record);
    setRecordMessage("");
    changeTab("chart");
  };
  const records = currentPatient?.records ?? [];
  return (
    <div className="chart-workspace">
      <header className="chart-patient-header">
        <div>
          <p>
            <span className="chart-number">
              患者番号 {patient.patientNumber || "未発行"}
            </span>{" "}
            / {displayPatientAge(patient)} / {patient.gender}
          </p>
          <h1>{patient.name}</h1>
          <p>{patient.nameKana}</p>
        </div>
        <div className="chart-header-links">
          <Link to="/reservations">予約一覧</Link>
          <Link to={`/patients/${patient.id}/records/print`}>カルテPDF</Link>
          <Link to={`/patients/${patient.id}/card`}>会員カード</Link>
          <ConfirmDeleteButton
            label="患者を完全削除"
            target={`${patient.name} / 患者番号 ${patient.patientNumber || "未発行"}`}
            description="患者情報、全カルテ、来院・予約履歴、請求・入金・返金、添付ファイルを完全に削除します。患者番号は再使用しません。"
            onDelete={() => deletePatient(patient)}
            onDeleted={() => navigate("/patients", { replace: true })}
          />
        </div>
      </header>
      {patient.deletionOperation && (
        <p role="status" className="patient-help">
          削除処理中のため入力を停止しています。中断された場合は同じ対象の完全削除を再実行してください。
        </p>
      )}
      <div className="chart-background">
        <div>
          <strong>アレルギー・注意事項</strong>
          <p>{patient.allergies || "未記載・要確認"}</p>
        </div>
        <div>
          <strong>服薬中の薬</strong>
          <p>{patient.currentMedications || "未記載・要確認"}</p>
        </div>
      </div>
      <details className="chart-background-details">
        <summary>既往歴・診断情報を確認</summary>
        <p>
          <strong>既往歴・手術歴：</strong>
          {patient.medicalHistory || "未記載・要確認"}
        </p>
        <p>
          <strong>他院等での診断名：</strong>
          {patient.existingDiagnosis || "未記載・要確認"}
        </p>
      </details>
      <nav className="chart-main-tabs" role="tablist" aria-label="患者メニュー">
        {(
          [
            { id: "chart", label: "カルテ入力" },
            { id: "history", label: `来院・カルテ履歴` },
            { id: "patient", label: "患者情報" },
          ] as { id: Tab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            id={`chart-tab-${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`chart-panel-${item.id}`}
            onClick={() => changeTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div
        role="tabpanel"
        id="chart-panel-chart"
        aria-labelledby="chart-tab-chart"
        hidden={tab !== "chart"}
      >
        {reservation &&
          (!editingRecord ||
            editingRecord.reservationId === reservation.id) && (
            <div className="chart-reservation-context">
              予約: {pdfDate(reservation.date.toISOString(), true)} /{" "}
              {reservation.type} / 担当: {reservation.staffName || "未指定"}
            </div>
          )}
        {reservationLoading && <p role="status">予約情報を読み込み中…</p>}
        {reservationError && (
          <p role="alert" className="record-save-error">
            {reservationError}
          </p>
        )}
        {recordMessage && (
          <div className="chart-saved-message" role="status">
            {recordMessage}{" "}
            <button
              className="record-secondary"
              onClick={() => changeTab("history")}
            >
              来院・カルテ履歴を見る
            </button>
          </div>
        )}
        {!reservationLoading &&
          !reservationError &&
          !patient.deletionOperation && (
            <MedicalRecordForm
              initialData={editingRecord ?? newRecord}
              onSubmit={saveRecord}
              editing={!!editingRecord}
              onDirtyChange={setRecordDirty}
              onCancel={() => {
                setEditingRecord(undefined);
                setNewRecord(emptyRecord(reservation));
                setRecordMessage("");
              }}
            />
          )}
      </div>
      <div
        role="tabpanel"
        id="chart-panel-history"
        aria-labelledby="chart-tab-history"
        hidden={tab !== "history"}
      >
        <div className="patient-actions">
          <button onClick={() => changeTab("chart")}>カルテ入力へ</button>
        </div>
        <PatientVisitHistory
          key={patient.id}
          records={records}
          patientId={patient.id}
          patientName={patient.name}
          onEdit={editRecord}
        />
      </div>
      <div
        role="tabpanel"
        id="chart-panel-patient"
        aria-labelledby="chart-tab-patient"
        hidden={tab !== "patient"}
      >
        <p className="patient-help">
          住所・連絡先・既往歴など、患者さんの基本情報を確認・更新します。
        </p>
        <form onSubmit={savePatient}>
          <fieldset
            disabled={savingPatient || !!patient.deletionOperation}
            className="patient-form-body"
          >
            <PatientBasicInfoForm
              patient={patient}
              onChange={changePatient}
              onEmergencyContactChange={changeEmergency}
            />
          </fieldset>
          {patientError && (
            <p role="alert" className="patient-error">
              {patientError}
            </p>
          )}
          {patientMessage && <p role="status">{patientMessage}</p>}
          <div className="patient-actions">
            <button
              type="submit"
              disabled={savingPatient || !!patient.deletionOperation}
            >
              {savingPatient ? "保存中…" : "患者情報を保存"}
            </button>
            <Link to={`/patients/${patient.id}/summary/print`}>
              患者情報PDF
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default PatientDetail;
