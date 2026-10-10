import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Reservation,
  ReservationSettings,
  ReservationStatus,
} from "../../types/reservation";
import { usePatientContext } from "../../hooks/usePatientContext";
import {
  addReservation,
  updateReservation,
} from "../../utils/reservationService";
import {
  clinicDateTimeInput,
  clinicTime,
  parseClinicDateTime,
  reservationStatus,
  findReservationConflicts,
  STATUS_LABELS,
} from "../../utils/reservationUtils";
import PatientSearch from "./PatientSearch";
import ReservationDialog from "./ReservationDialog";
import PaymentEditor from "./PaymentEditor";
import { v4 as uuidv4 } from "uuid";
import { validateReservation } from "../../utils/reservationUtils";

interface Props {
  initialData: Partial<Reservation>;
  reservations: Reservation[];
  settings: ReservationSettings;
  onSaved: (date: Date) => void;
  onClose: () => void;
}

const ReservationForm: React.FC<Props> = ({
  initialData,
  reservations,
  settings,
  onSaved,
  onClose,
}) => {
  const { patients, patientsLoading, patientsError } = usePatientContext();
  const [patientId, setPatientId] = useState(initialData.patientId ?? "");
  const [dateInput, setDateInput] = useState(
    clinicDateTimeInput(initialData.date ?? new Date()),
  );
  const [duration, setDuration] = useState(initialData.duration ?? 30);
  const [menuId, setMenuId] = useState(initialData.menuId ?? "");
  const [type, setType] = useState(initialData.type ?? "");
  const [staffId, setStaffId] = useState(initialData.staffId ?? "");
  const [bedId, setBedId] = useState(initialData.bedId ?? "");
  const [status, setStatus] = useState<ReservationStatus>(
    reservationStatus(initialData),
  );
  const [memo, setMemo] = useState(initialData.memo ?? "");
  const [reason, setReason] = useState(initialData.cancellationReason ?? "");
  const [feeAmount, setFeeAmount] = useState(
    initialData.feeAmount == null ? "" : String(initialData.feeAmount),
  );
  const [payments, setPayments] = useState(initialData.payments ?? []);
  const [paymentDraft, setPaymentDraft] = useState(false);
  const [registrationId] = useState(() => uuidv4());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedPatient =
    patients.find((patient) => patient.id === patientId) ?? null;
  const candidate: Reservation = {
    id: initialData.id,
    patientId,
    date: parseClinicDateTime(dateInput),
    duration,
    type: type.trim(),
    menuId,
    staffId,
    bedId,
    status,
    memo: memo.trim(),
    staffName:
      settings.staff.find((item) => item.id === staffId)?.name ??
      (staffId ? (initialData.staffName ?? "") : ""),
    bedName:
      settings.beds.find((item) => item.id === bedId)?.name ??
      (bedId ? (initialData.bedName ?? "") : ""),
    cancellationReason: ["cancelled", "no_show"].includes(status)
      ? reason.trim()
      : "",
    feeAmount: feeAmount.trim() ? Number(feeAmount) : null,
    payments,
  };
  const conflicts = findReservationConflicts(candidate, reservations);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!selectedPatient) {
      setError("登録済みの患者を選択してください。");
      return;
    }
    if (paymentDraft) {
      setError(
        "入力中の支払いを「明細に追加」してから予約を保存してください。",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      validateReservation(candidate);
      if (initialData.id)
        await updateReservation(
          initialData.id,
          candidate,
          initialData.updatedAt ?? null,
        );
      else {
        const { id, ...data } = candidate;
        await addReservation(data, registrationId);
      }
      onSaved(candidate.date);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "予約を保存できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  };
  const resourceOptions = (
    group: "staff" | "beds",
    selected: string,
    oldName?: string,
  ) => {
    const items = settings[group].filter(
      (item) => item.active || item.id === selected,
    );
    return (
      <>
        <option value="">未指定</option>
        {selected && !items.some((item) => item.id === selected) && (
          <option value={selected}>{oldName || "以前の割り当て"}</option>
        )}
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {!item.active ? "（使用停止）" : ""}
          </option>
        ))}
      </>
    );
  };
  return (
    <ReservationDialog
      title={initialData.id ? "予約を編集" : "新しい予約"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} className="reservation-form" noValidate>
        <fieldset
          disabled={
            busy ||
            !!initialData.deletionOperation ||
            !!selectedPatient?.deletionOperation
          }
        >
          {initialData.id ? (
            <p className="reservation-fixed-patient">
              <strong>{selectedPatient?.name ?? "患者情報未取得"}</strong>
              <small>登録済み予約の患者は変更できません。</small>
            </p>
          ) : (
            <PatientSearch
              value={selectedPatient}
              onSelect={(patient) => {
                if (payments.length || paymentDraft) {
                  setError(
                    "支払いを入力中です。患者を変更する場合は未保存の明細・入力を取り消してください。",
                  );
                  return;
                }
                setPatientId(patient?.id ?? "");
              }}
            />
          )}
          {selectedPatient && (
            <p className="reservation-patient-hint">
              {selectedPatient.phoneNumber || "電話番号未登録"}
              <Link
                to={`/patients/${selectedPatient.id}?tab=chart${initialData.id ? `&reservationId=${encodeURIComponent(initialData.id)}` : ""}`}
              >
                カルテ入力を開く
              </Link>
            </p>
          )}
          <div className="reservation-form-grid">
            <label>
              予約日時
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                required
              />
            </label>
            <label>
              所要時間（分）
              <input
                type="number"
                value={duration || ""}
                onChange={(event) => setDuration(Number(event.target.value))}
                min={1}
                max={480}
                required
              />
            </label>
            <label className="reservation-span-2">
              施術メニュー
              <select
                value={menuId}
                onChange={(event) => {
                  const selected = settings.menus.find(
                    (item) => item.id === event.target.value,
                  );
                  setMenuId(event.target.value);
                  if (selected) {
                    setType(selected.name);
                    setDuration(selected.duration);
                  } else setType("");
                }}
              >
                <option value="">自由入力</option>
                {menuId &&
                  !settings.menus.some((item) => item.id === menuId) && (
                    <option value={menuId}>{initialData.type}</option>
                  )}
                {settings.menus
                  .filter((item) => item.active || item.id === menuId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} / {item.duration}分
                      {!item.active ? "（使用停止）" : ""}
                    </option>
                  ))}
              </select>
            </label>
            {!menuId && (
              <label className="reservation-span-2">
                施術内容
                <input
                  type="text"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  placeholder="例：腰痛の再診・評価"
                  maxLength={120}
                  required
                />
              </label>
            )}
            <label>
              担当スタッフ
              <select
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
              >
                {resourceOptions("staff", staffId, initialData.staffName)}
              </select>
            </label>
            <label>
              ベッド・施術室
              <select
                value={bedId}
                onChange={(event) => setBedId(event.target.value)}
              >
                {resourceOptions("beds", bedId, initialData.bedName)}
              </select>
            </label>
            {initialData.id && (
              <label className="reservation-span-2">
                来院状態
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ReservationStatus)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {["cancelled", "no_show"].includes(status) && (
              <label className="reservation-span-2">
                キャンセル理由
                <input
                  type="text"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={300}
                />
              </label>
            )}
            <label className="reservation-span-2">
              受付メモ
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="連絡事項、来院時に確認したいこと"
              />
            </label>
            <label className="reservation-span-2">
              請求額（円）
              <input
                type="number"
                min={0}
                step={1}
                value={feeAmount}
                onChange={(event) => setFeeAmount(event.target.value)}
                placeholder="未確定なら空欄"
              />
            </label>
          </div>
          <p className="reservation-help">
            担当者・ベッドを指定すると重複を確認できます。院内設定で追加・変更できます。
          </p>
          {conflicts.length > 0 && (
            <div className="reservation-error" role="alert">
              <strong>同じ時間帯に予約があります</strong>
              {conflicts.map((conflict) => (
                <div key={conflict.reservation.id}>
                  {clinicTime(conflict.reservation.date)}　
                  {patients.find(
                    (patient) => patient.id === conflict.reservation.patientId,
                  )?.name || "患者"}{" "}
                  / {conflict.reasons.join("・")}が重複
                </div>
              ))}
            </div>
          )}
          <PaymentEditor
            payments={payments}
            savedIds={(initialData.payments ?? []).map((entry) => entry.id)}
            onChange={setPayments}
            onDraftChange={setPaymentDraft}
          />
        </fieldset>
        {error && (
          <p className="reservation-error" role="alert">
            {error}
          </p>
        )}
        <footer className="reservation-modal-footer">
          <button
            type="button"
            className="reservation-secondary"
            onClick={onClose}
            disabled={busy}
          >
            閉じる
          </button>
          <button
            type="submit"
            disabled={
              busy || patientsLoading || !!patientsError || conflicts.length > 0
            }
          >
            {busy ? "保存中…" : initialData.id ? "変更を保存" : "予約を登録"}
          </button>
        </footer>
      </form>
    </ReservationDialog>
  );
};
export default ReservationForm;
