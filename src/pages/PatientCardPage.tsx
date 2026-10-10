import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePatientContext } from "../hooks/usePatientContext";
import { issuePatientNumber } from "../lib/firebase/patientNumber";
import { Patient } from "../types/PatientData";
import ClinicCard from "../components/ClinicCard";

const PatientCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, patientsLoading, patientsError, reloadPatients } =
    usePatientContext();
  const [issued, setIssued] = useState<Patient>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const found = patients.find((patient) => patient.id === id);
  const patient = found?.patientNumber
    ? found
    : issued?.id === id
      ? issued
      : found;
  if (patientsLoading) return <p role="status">患者情報を読み込み中…</p>;
  if (patientsError)
    return (
      <div>
        <p role="alert">{patientsError}</p>
        <button onClick={reloadPatients}>再読み込み</button>
      </div>
    );
  if (!patient) return <p>患者が見つかりません。</p>;
  const issue = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setIssued(await issuePatientNumber(patient.id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "患者番号を発行できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  };
  const duplicated =
    !!patient.patientNumber &&
    patients.filter((item) => item.patientNumber === patient.patientNumber)
      .length > 1;
  const oversized =
    Array.from(patient.name).length > 40 ||
    (patient.patientNumber?.length ?? 0) > 12;
  return (
    <div className="card-workspace">
      <div className="card-no-print">
        <h2>会員カード</h2>
        <p className="patient-help">
          患者番号を記載した91 × 55
          mmのカードです。印刷は倍率100%でご利用ください。
        </p>
        {error && (
          <p role="alert" className="patient-error">
            {error}
          </p>
        )}
        {duplicated && (
          <p role="alert" className="patient-error">
            既存の患者番号が重複しています。カードを発行する前に登録状況を確認してください。
          </p>
        )}
        {oversized && (
          <p role="alert" className="patient-error">
            氏名または既存の患者番号がカードの印刷範囲に収まりません。患者情報を確認してください。
          </p>
        )}
        <div className="card-toolbar">
          <button
            onClick={() => window.print()}
            disabled={!patient.patientNumber || duplicated || oversized}
          >
            カードを印刷
          </button>
          <Link to={`/patients/${patient.id}?tab=chart`}>カルテ入力に戻る</Link>
          <Link to="/patients">患者一覧</Link>
        </div>
      </div>
      {patient.patientNumber && !duplicated && !oversized ? (
        <div className="card-preview">
          <ClinicCard
            name={patient.name}
            patientNumber={patient.patientNumber}
          />
        </div>
      ) : (
        !patient.patientNumber &&
        !duplicated && (
          <div className="card-no-print">
            <p>この患者には患者番号がまだ発行されていません。</p>
            <button onClick={issue} disabled={busy}>
              {busy ? "患者番号を発行中…" : "患者番号を発行してカードを作成"}
            </button>
            <p className="patient-help">一度発行した番号は変更されません。</p>
          </div>
        )
      )}
    </div>
  );
};
export default PatientCardPage;
