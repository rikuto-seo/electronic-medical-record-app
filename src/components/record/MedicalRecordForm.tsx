import React, { useEffect, useRef, useState } from "react";
import { FieldErrors, FieldPath, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  medicalRecordSchema,
  MedicalRecordFormData,
} from "../../schema/medicalRecordSchema";
import { recordSections, RecordSection } from "./recordFields";
import {
  recordDateInput,
  recordMediaUrls,
} from "../../utils/medicalRecordUtils";
import "./records.css";

interface Props {
  initialData: MedicalRecordFormData;
  onSubmit: (data: MedicalRecordFormData, files: File[]) => Promise<void>;
  onCancel?: () => void;
  editing?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}
const MedicalRecordForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  editing = false,
  onDirtyChange,
}) => {
  const [section, setSection] = useState<RecordSection>("subjective");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [focusError, setFocusError] =
    useState<FieldPath<MedicalRecordFormData>>();
  const fileInput = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      ...initialData,
      date: recordDateInput(initialData.date),
      mediaUrls: recordMediaUrls(initialData.mediaUrls),
    },
    shouldFocusError: false,
  });
  useEffect(() => {
    reset({
      ...initialData,
      date: recordDateInput(initialData.date),
      mediaUrls: recordMediaUrls(initialData.mediaUrls),
    });
    setMediaFiles([]);
    setError("");
    setSection("subjective");
    if (fileInput.current) fileInput.current.value = "";
  }, [initialData, reset]);
  useEffect(() => {
    if (focusError) {
      setFocus(focusError);
      setFocusError(undefined);
    }
  }, [section, focusError, setFocus]);
  useEffect(() => {
    onDirtyChange?.(isDirty || !!mediaFiles.length);
  }, [isDirty, mediaFiles.length, onDirtyChange]);
  useEffect(() => {
    if (!isDirty && !mediaFiles.length) return;
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => window.removeEventListener("beforeunload", preventLeave);
  }, [isDirty, mediaFiles.length]);
  const save = async (data: MedicalRecordFormData) => {
    setError("");
    try {
      await onSubmit(data, mediaFiles);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "診療記録を保存できませんでした。入力内容は保持されています。",
      );
    }
  };
  const invalid = (validationErrors: FieldErrors<MedicalRecordFormData>) => {
    const first = recordSections.find((group) =>
      group.fields.some((field) => {
        const [key, nested] = field.name.split(".");
        const entry = validationErrors[key];
        return nested ? entry && (entry as any)[nested] : entry;
      }),
    );
    if (first) {
      setSection(first.id);
      const field = first.fields.find((field) => {
        const [key, nested] = field.name.split(".");
        return nested
          ? (validationErrors[key] as any)?.[nested]
          : validationErrors[key];
      });
      setFocusError(field?.name);
    } else setFocusError("date");
  };
  return (
    <form
      className="record-editor"
      noValidate
      onSubmit={handleSubmit(save, invalid)}
    >
      <div className="record-editor-heading">
        <div>
          <h2>{editing ? "診療記録を編集" : "新しい診療記録を入力"}</h2>
          <p>
            確認・実施した内容を記録します。未確認の項目は空欄のまま保存できます。
          </p>
        </div>
        <span className="record-draft-badge">
          {isDirty || mediaFiles.length ? "未保存の変更あり" : "入力待ち"}
        </span>
      </div>
      <fieldset disabled={isSubmitting} className="record-editor-body">
        <div className="record-metadata">
          <label>
            <span>
              記録日時 <b>必須</b>
            </span>
            <input type="datetime-local" {...register("date")} />
            {errors.date && (
              <small role="alert">{String(errors.date.message)}</small>
            )}
          </label>
          <label>
            <span>診療区分</span>
            <select {...register("visitType")}>
              <option value="">未選択</option>
              <option>初診</option>
              <option>再診</option>
              <option>相談</option>
            </select>
          </label>
          <label>
            <span>記録・施術担当</span>
            <input
              {...register("treatmentPerformedBy")}
              placeholder="担当スタッフ名"
            />
          </label>
        </div>
        <div
          className="record-section-tabs"
          role="tablist"
          aria-label="カルテ入力項目"
        >
          {recordSections.map((group, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={section === group.id}
              aria-controls={`record-${group.id}`}
              id={`record-tab-${group.id}`}
              key={group.id}
              onClick={() => setSection(group.id)}
            >
              <span>{index + 1}</span>
              {group.label}
            </button>
          ))}
        </div>
        {recordSections.map((group) => (
          <section
            role="tabpanel"
            aria-labelledby={`record-tab-${group.id}`}
            id={`record-${group.id}`}
            key={group.id}
            hidden={section !== group.id}
          >
            <p className="record-section-description">{group.description}</p>
            <div className="record-fields">
              {group.fields.map((field) => {
                const [key, nested] = field.name.split(".");
                const fieldError = nested
                  ? (errors[key] as any)?.[nested]
                  : errors[key];
                const registration = register(
                  field.name,
                  field.type === "number"
                    ? {
                        setValueAs: (value) =>
                          value === "" ? undefined : Number(value),
                      }
                    : {},
                );
                return (
                  <label
                    key={field.name}
                    className={field.wide ? "record-field-wide" : ""}
                  >
                    <span>
                      {field.label}
                      {field.required && <b>必須</b>}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        {...registration}
                        rows={3}
                        aria-label={field.label}
                        aria-invalid={!!fieldError}
                      />
                    ) : (
                      <input
                        {...registration}
                        aria-label={field.label}
                        type={field.type ?? "text"}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        aria-invalid={!!fieldError}
                      />
                    )}
                    {field.hint && (
                      <small className="record-field-hint">{field.hint}</small>
                    )}
                    {fieldError && (
                      <small role="alert" className="record-field-error">
                        {String(fieldError.message)}
                      </small>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        <details className="record-attachments">
          <summary>
            添付ファイル{" "}
            {mediaFiles.length ? `（選択中 ${mediaFiles.length}件）` : ""}
          </summary>
          {!!recordMediaUrls(initialData.mediaUrls).length && (
            <p>
              保存済み添付: {recordMediaUrls(initialData.mediaUrls).length}
              件（保持されます）
            </p>
          )}
          <label>
            画像・動画・PDFを追加
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*,application/pdf,text/plain"
              multiple
              onChange={(event) => {
                setMediaFiles(Array.from(event.target.files ?? []));
              }}
            />
          </label>
          <ul>
            {mediaFiles.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setMediaFiles((previous) =>
                      previous.filter((_, i) => i !== index),
                    )
                  }
                >
                  外す
                </button>
              </li>
            ))}
          </ul>
        </details>
      </fieldset>
      {error && (
        <p role="alert" className="record-save-error">
          {error} 入力内容は保持されています。
        </p>
      )}
      {Object.keys(errors).length > 0 && (
        <p className="record-save-error" role="alert">
          必須項目・数値を確認してください。該当の入力項目を表示しました。
        </p>
      )}
      <div className="record-save-bar">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中…" : editing ? "変更を保存" : "診療記録を保存"}
        </button>
        <button
          type="button"
          className="record-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {editing ? "編集を終了" : "入力をクリア"}
        </button>
        <span>必須：記録日時・現症・治療方針</span>
      </div>
    </form>
  );
};
export default MedicalRecordForm;
