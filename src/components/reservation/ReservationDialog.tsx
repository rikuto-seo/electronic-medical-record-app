import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props { title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }

const ReservationDialog: React.FC<Props> = ({ title, onClose, busy, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(<dialog ref={ref} className="reservation-modal" aria-labelledby="reservation-dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="reservation-modal-header">
      <div><span className="reservation-eyebrow">院内予約管理</span><h2 id="reservation-dialog-title">{title}</h2></div>
      <button type="button" className="reservation-icon-button" onClick={onClose} disabled={busy} aria-label="閉じる"><X size={20} /></button>
    </header>
    {children}
  </dialog>, document.body);
};
export default ReservationDialog;
