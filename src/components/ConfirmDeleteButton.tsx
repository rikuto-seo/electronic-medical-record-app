import React, { useId, useRef, useEffect, useState } from "react";
interface Props {
  label?: string;
  target: string;
  description: string;
  onDelete: () => Promise<void>;
  onDeleted?: () => void;
  disabled?: boolean;
}
const ConfirmDeleteButton: React.FC<Props> = ({
  label = "完全削除",
  target,
  description,
  onDelete,
  onDeleted,
  disabled,
}) => {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const running = useRef(false),
    dialog = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (open) element?.showModal();
    return () => element?.close();
  }, [open]);
  const confirm = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await onDelete();
      setOpen(false);
      onDeleted?.();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "削除できませんでした。再度実行してください。",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        className="ui-danger-secondary"
        disabled={disabled || busy}
        onClick={() => {
          setOpen(true);
          setError("");
        }}
      >
        {label}
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="delete-confirmation"
          aria-labelledby={titleId}
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setOpen(false);
          }}
        >
          <h2 id={titleId}>完全削除の確認</h2>
          <p className="delete-target">{target}</p>
          <p>{description}</p>
          <p className="delete-warning">この操作は取り消せません。</p>
          {error && (
            <p role="alert" className="patient-error">
              {error}
            </p>
          )}
          <div className="patient-actions">
            <button
              type="button"
              className="record-secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              削除しない
            </button>
            <button
              type="button"
              className="ui-danger"
              disabled={busy}
              onClick={confirm}
            >
              {busy ? "削除中…" : "完全に削除する"}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
};
export default ConfirmDeleteButton;
