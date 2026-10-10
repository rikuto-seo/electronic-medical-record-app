import React, { useRef, useState, useEffect } from "react";
import { usePatientContext } from "../hooks/usePatientContext";
import { getReservations } from "../utils/reservationService";
import { Reservation } from "../types/reservation";
import { Link } from "react-router-dom";
import { Patient } from "../types/PatientData";
import { displayPatientAge } from "../utils/patientUtils";
import { pdfDate } from "../utils/patientPdfData";
import { downloadPatientSummaryPdf } from "../utils/pdfUtils";
import "../components/patient/patients.css";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

const PatientListPage: React.FC = () => {
  const {
    patients,
    patientsLoading,
    patientsError,
    reloadPatients,
    deletePatient,
  } = usePatientContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationState, setReservationState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getReservations()
      .then((data) => {
        if (active) {
          setReservations(data);
          setReservationState("ready");
        }
      })
      .catch(() => {
        if (active) setReservationState("error");
      });
    return () => {
      active = false;
    };
  }, []);
  const downloadSummary = async (patient: Patient) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(patient.id);
    setError("");
    try {
      await downloadPatientSummaryPdf(patient);
    } catch (downloadError) {
      setError(
        `${patient.name}: ${downloadError instanceof Error ? downloadError.message : "PDFを出力できませんでした。"}`,
      );
    } finally {
      busyRef.current = false;
      setBusyId("");
    }
  };
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s\-()]/g, "");
  const visible = patients.filter((patient) =>
    [
      patient.name,
      patient.nameKana,
      patient.patientNumber,
      patient.phoneNumber,
    ].some((value) =>
      value
        ?.toLocaleLowerCase()
        .replace(/[\s\-()]/g, "")
        .includes(normalizedQuery),
    ),
  );
  return (
    <div className="patient-workspace">
      <h2>患者一覧</h2>
      <p className="patient-help">
        患者情報PDFはA4・1ページ。カルテPDFは出力する診療記録を選んで作成できます。
      </p>
      <div className="patient-toolbar">
        <input
          aria-label="患者を検索"
          placeholder="氏名・フリガナ・患者番号・電話番号で検索"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Link to="/patients/new">＋ 新規患者登録</Link>
        <span>{visible.length}名</span>
      </div>
      {patientsLoading && <p role="status">患者情報を読み込み中…</p>}
      {patientsError && (
        <div>
          <p role="alert" className="patient-error">
            {patientsError}
          </p>
          <button onClick={reloadPatients}>再読み込み</button>
        </div>
      )}
      {error && (
        <p role="alert" className="patient-error">
          {error}
        </p>
      )}
      {!patientsLoading && !patientsError && (
        <div className="patient-table-wrap">
          <table className="patient-table">
            <thead>
              <tr>
                <th>患者番号・氏名</th>
                <th>年齢・性別</th>
                <th>電話番号</th>
                <th>初診日</th>
                <th>次回予約</th>
                <th>カルテ・出力・カード</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((patient) => {
                const hasReservation = reservations.some(
                  (reservation) =>
                    reservation.patientId === patient.id &&
                    reservation.date >= new Date() &&
                    (reservation.status ??
                      (reservation.checkedIn ? "checked_in" : "booked")) ===
                      "booked",
                );
                return (
                  <tr key={patient.id}>
                    <td>
                      <small>{patient.patientNumber || "患者番号未登録"}</small>
                      <Link to={`/patients/${patient.id}?tab=history`}>
                        {patient.name}
                      </Link>
                      <small>{patient.nameKana}</small>
                    </td>
                    <td>
                      {displayPatientAge(patient)}
                      <small>{patient.gender}</small>
                    </td>
                    <td>{patient.phoneNumber || "未記載"}</td>
                    <td>{pdfDate(patient.firstVisitDate)}</td>
                    <td>
                      {reservationState === "loading"
                        ? "取得中…"
                        : reservationState === "error"
                          ? "取得できません"
                          : hasReservation
                            ? "あり"
                            : "なし"}
                    </td>
                    <td>
                      <div className="patient-row-actions">
                        <Link to={`/patients/${patient.id}?tab=history`}>
                          来院・支払い履歴
                        </Link>
                        <Link to={`/patients/${patient.id}?tab=chart`}>
                          カルテ入力
                        </Link>
                        <button
                          disabled={!!busyId}
                          aria-label={`${patient.name}の患者情報PDFを出力`}
                          onClick={() => downloadSummary(patient)}
                        >
                          {busyId === patient.id ? "作成中…" : "患者情報PDF"}
                        </button>
                        <Link to={`/patients/${patient.id}/records/print`}>
                          カルテPDF
                        </Link>
                        <Link to={`/patients/${patient.id}/summary/print`}>
                          患者情報の確認
                        </Link>
                        <Link to={`/patients/${patient.id}/card`}>
                          会員カード
                        </Link>
                        <ConfirmDeleteButton
                          label="患者を完全削除"
                          target={`${patient.name} / 患者番号 ${patient.patientNumber || "未発行"}`}
                          description="患者情報、全カルテ、来院・予約履歴、請求・入金・返金、添付ファイルを完全に削除します。患者番号は再使用しません。"
                          onDelete={() => deletePatient(patient)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <p className="patient-help">
              {patients.length
                ? "検索条件に一致する患者がいません。"
                : "患者はまだ登録されていません。"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
export default PatientListPage;
