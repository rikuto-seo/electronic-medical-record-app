import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ReservationSettings, ReservationResource, TreatmentMenu } from '../../types/reservation';
import { saveReservationSettings } from '../../utils/reservationService';
import ReservationDialog from './ReservationDialog';

interface Props { settings: ReservationSettings; onClose: () => void; onSaved: () => void }

const ReservationSettingsForm: React.FC<Props> = ({ settings, onClose, onSaved }) => {
  const [draft, setDraft] = useState<ReservationSettings>(() => ({
    ...settings, staff: settings.staff.map(item => ({ ...item })),
    beds: settings.beds.map(item => ({ ...item })), menus: settings.menus.map(item => ({ ...item })),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (group: 'staff' | 'beds' | 'menus', id: string, changes: Partial<TreatmentMenu>) => {
    setDraft(previous => ({ ...previous, [group]: previous[group].map(item => item.id === id ? { ...item, ...changes } : item) }));
  };
  const add = (group: 'staff' | 'beds' | 'menus') => {
    const item: ReservationResource = { id: crypto.randomUUID(), name: '', active: true };
    setDraft(previous => ({ ...previous, [group]: [...previous[group], group === 'menus' ? { ...item, duration: 30 } : item] }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try { await saveReservationSettings(draft); onSaved(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '設定を保存できませんでした。'); }
    finally { setBusy(false); }
  };
  const sections = [
    { key: 'staff' as const, title: '担当スタッフ', placeholder: '例：山田' },
    { key: 'beds' as const, title: 'ベッド・施術室', placeholder: '例：ベッド1' },
    { key: 'menus' as const, title: '施術メニュー', placeholder: '例：鍼灸施術' },
  ];
  return <ReservationDialog title="院内設定" busy={busy} onClose={onClose}>
    <form className="reservation-form" onSubmit={submit}>
      <p className="reservation-help">院内の予約表で共通して使用します。使用停止にしても過去の予約は残ります。</p>
      <fieldset disabled={busy}>
        {sections.map(section => <section className="reservation-settings-section" key={section.key}>
          <div className="reservation-settings-heading"><h3>{section.title}</h3><button type="button" className="reservation-secondary" onClick={() => add(section.key)}><Plus size={15} />追加</button></div>
          {draft[section.key].length === 0 && <p className="reservation-help">まだ登録されていません。</p>}
          {draft[section.key].map((item, index) => <div className="reservation-settings-row" key={item.id}>
            <input type="text" aria-label={`${section.title}${index + 1}の名称`} placeholder={section.placeholder} value={item.name} maxLength={80} required onChange={event => update(section.key, item.id, { name: event.target.value })} />
            {section.key === 'menus' && <label className="reservation-duration-input"><input type="number" aria-label={`メニュー${index + 1}の所要時間`} min={1} max={480} value={(item as TreatmentMenu).duration || ''} required onChange={event => update(section.key, item.id, { duration: Number(event.target.value) })} />分</label>}
            <label className="reservation-checkbox"><input type="checkbox" checked={item.active} onChange={event => update(section.key, item.id, { active: event.target.checked })} />使用</label>
            {!settings[section.key].some(saved => saved.id === item.id) && <button type="button" className="reservation-text-button" onClick={() => setDraft(previous => ({ ...previous, [section.key]: previous[section.key].filter(row => row.id !== item.id) }))}>取り消す</button>}
          </div>)}
        </section>)}
      </fieldset>
      {error && <p className="reservation-error" role="alert">{error}</p>}
      <footer className="reservation-modal-footer"><button type="button" className="reservation-secondary" onClick={onClose} disabled={busy}>閉じる</button><button type="submit" disabled={busy}>{busy ? '保存中…' : '設定を保存'}</button></footer>
    </form>
  </ReservationDialog>;
};
export default ReservationSettingsForm;
