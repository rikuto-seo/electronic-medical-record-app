import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { usePatientContext } from "../hooks/usePatientContext";
const PatientByNumberPage: React.FC = () => {
  const { patientNumber } = useParams<{ patientNumber: string }>();
  const { patients, patientsLoading, patientsError, reloadPatients } =
    usePatientContext();
  if (patientsLoading) return <p role="status">患者情報を読み込み中…</p>;
  if (patientsError)
    return (
      <div>
        <p role="alert">{patientsError}</p>
        <button onClick={reloadPatients}>再読み込み</button>
      </div>
    );
  const matches = patients.filter(
    (patient) => patient.patientNumber === patientNumber,
  );
  if (matches.length === 1)
    return <Navigate to={`/patients/${matches[0].id}?tab=chart`} replace />;
  return (
    <div>
      <p role="alert">
        {matches.length
          ? "患者番号が重複しています。登録状況を確認してください。"
          : "この患者番号は見つかりません。"}
      </p>
      <Link to="/patients">患者一覧に戻る</Link>
    </div>
  );
};
export default PatientByNumberPage;
