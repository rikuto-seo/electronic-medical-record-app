import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings2,
  Search,
  RefreshCw,
} from "lucide-react";
import { usePatientContext } from "../hooks/usePatientContext";
import {
  Reservation,
  ReservationSettings,
  ReservationStatus,
} from "../types/reservation";
import {
  subscribeReservations,
  subscribeReservationSettings,
  updateReservation,
} from "../utils/reservationService";
import {
  clinicDateKey,
  clinicTime,
  dayLabel,
  shiftClinicDay,
  weekDays,
  reservationStatus,
  STATUS_LABELS,
  DEFAULT_RESERVATION_SETTINGS,
} from "../utils/reservationUtils";
import ReservationForm from "../components/reservation/ReservationForm";
import ReservationList from "../components/reservation/ReservationList";
import ReservationSettingsForm from "../components/reservation/ReservationSettingsForm";
import "../components/reservation/reservations.css";

const ReservationPage: React.FC = () => {
  const { patients, patientsLoading, patientsError, reloadPatients } =
    usePatientContext();
  const [params, setParams] = useSearchParams();
  const today = clinicDateKey(new Date());
  const initialDay = params.get("date");
  const [day, setDay] = useState(
    initialDay &&
      /^\d{4}-\d{2}-\d{2}$/.test(initialDay) &&
      Number.isFinite(new Date(`${initialDay}T12:00:00+09:00`).getTime())
      ? initialDay
      : today,
  );
  const [view, setView] = useState<"day" | "week">(
    params.get("view") === "week" ? "week" : "day",
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<ReservationSettings>(
    DEFAULT_RESERVATION_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [staff, setStaff] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editor, setEditor] = useState<Partial<Reservation> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const requestedReservation = params.get("reservationId");
  useEffect(() => {
    if (!requestedReservation || loading || loadError) return;
    const found = reservations.find((item) => item.id === requestedReservation);
    if (found) setEditor(found);
    else
      setActionError(
        "指定した予約が見つかりません。予約一覧をご確認ください。",
      );
    const searchParams = new URLSearchParams(params);
    searchParams.delete("reservationId");
    setParams(searchParams, { replace: true });
  }, [
    requestedReservation,
    loading,
    loadError,
    reservations,
    params,
    setParams,
  ]);

  useEffect(() => {
    setLoading(true);
    setSettingsLoading(true);
    setLoadError("");
    setSettingsError("");
    const unsubscribe = subscribeReservations(
      (data) => {
        setReservations(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setLoadError(
          "予約を取得できませんでした。接続とアクセス権限を確認して再読み込みしてください。",
        );
      },
    );
    const unsubscribeSettings = subscribeReservationSettings(
      (data) => {
        setSettings(data);
        setSettingsLoading(false);
      },
      () => {
        setSettingsLoading(false);
        setSettingsError(
          "院内設定を取得できませんでした。接続とアクセス権限をご確認ください。",
        );
      },
    );
    return () => {
      unsubscribe();
      unsubscribeSettings();
    };
  }, [retry]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);
  const chooseDay = (value: string) => {
    if (!value) return;
    setDay(value);
    setParams({ date: value, view }, { replace: true });
  };
  const chooseView = (value: "day" | "week") => {
    setView(value);
    setParams({ date: day, view: value }, { replace: true });
  };
  const days = useMemo(
    () => (view === "day" ? [day] : weekDays(day)),
    [day, view],
  );
  const period = useMemo(
    () =>
      reservations.filter((item) => days.includes(clinicDateKey(item.date))),
    [reservations, days],
  );
  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );
  const filtered = period.filter((item) => {
    if (
      staff !== "all" &&
      (staff === "unassigned" ? !!item.staffId : item.staffId !== staff)
    )
      return false;
    if (status !== "all" && reservationStatus(item) !== status) return false;
    const patient = patientMap.get(item.patientId);
    const term = search.trim().toLowerCase().replace(/[\s-]/g, "");
    return (
      !term ||
      [
        patient?.name,
        patient?.nameKana,
        patient?.phoneNumber,
        patient?.patientNumber,
        item.type,
        item.memo,
      ].some((value) =>
        value?.toLowerCase().replace(/[\s-]/g, "").includes(term),
      )
    );
  });
  const disabled =
    loading ||
    settingsLoading ||
    !!loadError ||
    !!settingsError ||
    patientsLoading ||
    !!patientsError;
  const create = (date: string, preset: Partial<Reservation> = {}) => {
    setActionError("");
    setEditor({
      ...preset,
      id: undefined,
      status: "booked",
      checkedIn: false,
      staffId: settings.staff.some(
        (item) => item.id === preset.staffId && item.active,
      )
        ? preset.staffId
        : "",
      bedId: settings.beds.some(
        (item) => item.id === preset.bedId && item.active,
      )
        ? preset.bedId
        : "",
      menuId: settings.menus.some(
        (item) => item.id === preset.menuId && item.active,
      )
        ? preset.menuId
        : "",
      cancellationReason: "",
      memo: "",
      payments: [],
      statusHistory: [],
      createdAt: undefined,
      updatedAt: undefined,
      date: new Date(
        `${date}T${preset.date ? clinicTime(preset.date) : "09:00"}:00+09:00`,
      ),
    });
  };
  const changeStatus = async (
    reservation: Reservation,
    next: ReservationStatus,
  ) => {
    if (!reservation.id || busyId) return;
    setBusyId(reservation.id);
    setActionError("");
    try {
      await updateReservation(
        reservation.id,
        { status: next },
        reservation.updatedAt ?? null,
      );
      setMessage(
        `${patientMap.get(reservation.patientId)?.name || "患者"}さんを「${STATUS_LABELS[next]}」に更新しました。`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "状態を更新できませんでした。",
      );
    } finally {
      setBusyId("");
    }
  };
  const stats = [
    {
      label: "予約件数",
      count: period.filter(
        (item) => !["cancelled", "no_show"].includes(reservationStatus(item)),
      ).length,
      key: "all",
    },
    {
      label: "来院待ち",
      count: period.filter((item) => reservationStatus(item) === "booked")
        .length,
      key: "booked",
    },
    {
      label: "院内",
      count: period.filter((item) =>
        ["checked_in", "in_treatment"].includes(reservationStatus(item)),
      ).length,
      key: "inside",
    },
    {
      label: "施術終了",
      count: period.filter((item) => reservationStatus(item) === "completed")
        .length,
      key: "completed",
    },
  ];
  // 使用停止したスタッフの予約もフィルター対象に残す。
  const staffOptions = new Map(
    settings.staff.map((item) => [item.id, item.name]),
  );
  period.forEach((item) => {
    if (item.staffId && !staffOptions.has(item.staffId))
      staffOptions.set(item.staffId, item.staffName || "以前の担当者");
  });
  return (
    <div className="reservation-workspace">
      <header className="reservation-page-header">
        <div>
          <span className="reservation-eyebrow">RECEPTION / 受付</span>
          <h1>
            <CalendarDays size={26} />
            予約管理
          </h1>
          <p>予約から来院・施術終了まで、院内の動きをひとつの画面で。</p>
        </div>
        <div className="reservation-header-actions">
          <button
            className="reservation-secondary"
            onClick={() => setShowSettings(true)}
            disabled={settingsLoading || !!settingsError}
          >
            <Settings2 size={16} />
            院内設定
          </button>
          <button onClick={() => create(day)} disabled={disabled}>
            <Plus size={18} />
            新規予約
          </button>
        </div>
      </header>
      {(loadError || settingsError || patientsError) && (
        <div className="reservation-error" role="alert">
          {loadError || settingsError || patientsError}
          <button
            className="reservation-secondary"
            onClick={() => {
              setRetry((value) => value + 1);
              reloadPatients();
            }}
          >
            <RefreshCw size={14} />
            再読み込み
          </button>
        </div>
      )}
      {actionError && (
        <div className="reservation-error" role="alert">
          {actionError}
        </div>
      )}
      {message && (
        <div className="reservation-success" role="status">
          {message}
        </div>
      )}
      <section className="reservation-stats" aria-label="表示期間の予約集計">
        {stats.map((stat) => (
          <div key={stat.key}>
            <span>{stat.label}</span>
            <strong>
              {loading || loadError ? "—" : stat.count}
              <small>件</small>
            </strong>
          </div>
        ))}
      </section>
      <section className="reservation-board" aria-label="院内予約表">
        <div className="reservation-toolbar">
          <div className="reservation-date-nav">
            <button
              className="reservation-icon-button"
              aria-label={view === "day" ? "前の日" : "前の週"}
              onClick={() =>
                chooseDay(shiftClinicDay(day, view === "day" ? -1 : -7))
              }
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="reservation-secondary"
              onClick={() => chooseDay(today)}
            >
              今日
            </button>
            <button
              className="reservation-icon-button"
              aria-label={view === "day" ? "次の日" : "次の週"}
              onClick={() =>
                chooseDay(shiftClinicDay(day, view === "day" ? 1 : 7))
              }
            >
              <ChevronRight size={20} />
            </button>
            <input
              type="date"
              aria-label="表示日"
              value={day}
              onChange={(event) => chooseDay(event.target.value)}
            />
          </div>
          <div className="reservation-view-toggle" aria-label="表示切替">
            <button
              aria-pressed={view === "day"}
              className={view === "day" ? "is-active" : ""}
              onClick={() => chooseView("day")}
            >
              日表示
            </button>
            <button
              aria-pressed={view === "week"}
              className={view === "week" ? "is-active" : ""}
              onClick={() => chooseView("week")}
            >
              週表示
            </button>
          </div>
        </div>
        <div className="reservation-filter-bar">
          <div className="reservation-search">
            <Search size={17} />
            <input
              aria-label="予約検索"
              type="search"
              placeholder="患者名・電話番号・施術メニュー"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            aria-label="担当者で絞り込み"
            value={staff}
            onChange={(event) => setStaff(event.target.value)}
          >
            <option value="all">すべての担当者</option>
            <option value="unassigned">担当者未指定</option>
            {Array.from(staffOptions).map(([id, name]) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="来院状態で絞り込み"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">すべての状態</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {(search || staff !== "all" || status !== "all") && (
            <button
              className="reservation-text-button"
              onClick={() => {
                setSearch("");
                setStaff("all");
                setStatus("all");
              }}
            >
              解除
            </button>
          )}
        </div>
        <div className="reservation-period-label">
          <span>
            {view === "day"
              ? `${day.slice(0, 4)}年 ${dayLabel(day)}`
              : `${days[0]} 〜 ${days[6]}`}
          </span>
          <span>
            {loading || loadError ? "読込中" : `${filtered.length}件を表示`} /
            日本時間
          </span>
        </div>
        {loading || patientsLoading ? (
          <div className="reservation-empty" role="status">
            予約表を読み込み中…
          </div>
        ) : !loadError && !patientsError ? (
          <ReservationList
            reservations={filtered}
            patients={patients}
            days={days}
            view={view}
            settings={settings}
            busyId={busyId}
            disabled={disabled}
            hasFilters={!!search || staff !== "all" || status !== "all"}
            onAdd={create}
            onEdit={(item) => {
              setActionError("");
              setEditor(item);
            }}
            onNext={(item) =>
              create(shiftClinicDay(clinicDateKey(item.date), 7), item)
            }
            onStatus={changeStatus}
          />
        ) : (
          <div className="reservation-empty">
            予約表を表示できません。上のエラーをご確認ください。
          </div>
        )}
      </section>
      {!settingsLoading &&
        !settingsError &&
        (settings.staff.length === 0 || settings.beds.length === 0) && (
          <p className="reservation-bottom-note">
            最初に「院内設定」で担当スタッフとベッドを登録すると、予約の重複確認に使えます。
          </p>
        )}
      <p className="reservation-bottom-note">
        <Link to="/patients/new">新しい患者を登録</Link>
        してから予約を追加できます。キャンセル・無断キャンセル・金額は「予約・支払い」から記録できます。
      </p>
      {editor && (
        <ReservationForm
          initialData={editor}
          reservations={reservations}
          settings={settings}
          onClose={() => setEditor(null)}
          onSaved={(date) => {
            setMessage(
              editor.id ? "予約を変更しました。" : "予約を登録しました。",
            );
            setEditor(null);
            chooseDay(clinicDateKey(date));
          }}
        />
      )}
      {showSettings && (
        <ReservationSettingsForm
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            setMessage("院内設定を保存しました。");
          }}
        />
      )}
    </div>
  );
};
export default ReservationPage;
