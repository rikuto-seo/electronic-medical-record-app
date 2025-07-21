// src/components/record/MedicalRecordForm.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  medicalRecordSchema,
  MedicalRecordFormData,
} from '../../schema/medicalRecordSchema';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImage, faFileVideo, faFileAlt, faFile } from '@fortawesome/free-solid-svg-icons';

interface Props {
  initialData?: MedicalRecordFormData;
  onSubmit: (formData: FormData) => void;  // ここを変更
  onCancel?: () => void;
}

const isJapaneseOnly = (value: string) =>
  /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー\s　]*$/u.test(value);

const getLocalDateTimeString = (): string => {
  const now = new Date();
  now.setSeconds(0, 0);
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

// ファイルタイプに応じたアイコンを返す関数
const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return faFileImage;
  if (type.startsWith('video/')) return faFileVideo;
  if (type === 'text/plain') return faFileAlt;
  return faFile; // その他のファイル
};

const MedicalRecordForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: initialData || {
      id: crypto.randomUUID(),
      date: getLocalDateTimeString(),
      chiefComplaint: '',
      symptomOnsetDate: '',
      symptomDuration: '',
      symptomLocation: '',
      painType: '',
      painSeverity: null,
      rangeOfMotion: '',
      muscleStrength: '',
      palpationFindings: '',
      skinCondition: '',
      imagingResults: '',
      neurologicalExamResults: '',
      otherExamResults: '',
      diagnosis: '',
      acupunctureType: '',
      acupunctureCount: null,
      moxibustionType: '',
      treatmentFrequency: '',
      currentCondition: '',
      treatmentPlan: '',
      selfCareInstructions: '',
      treatmentProgress: '',
      notes: '',
    },
  });

  const [mediaFiles, setMediaFiles] = React.useState<File[]>([]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: MedicalRecordFormData) => {
    const localDate = new Date(data.date);
    const jstDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

    const correctedData = {
      ...data,
      date: jstDate.toISOString(),
    };

    // FormDataで送る
    const formData = new FormData();
    formData.append('record', new Blob([JSON.stringify(correctedData)], { type: 'application/json' }));

    mediaFiles.forEach((file) => {
      formData.append('mediaFiles', file); // 複数ファイル送信
    });

    onSubmit(formData as any); // backendでFormDataを処理するように変更する必要あり
  };

  const fieldDefinitions: {
    name: keyof MedicalRecordFormData;
    label: string;
    type?: 'text' | 'textarea' | 'date' | 'datetime-local' | 'number';
  }[] = [
      { name: 'date', label: '日付と時刻', type: 'datetime-local' },
      { name: 'chiefComplaint', label: '主訴' },
      { name: 'symptomOnsetDate', label: '発症日', type: 'date' },
      { name: 'symptomDuration', label: '症状の持続期間' },
      { name: 'symptomLocation', label: '症状の部位' },
      { name: 'painType', label: '痛みの種類' },
      { name: 'painSeverity', label: '痛みの程度', type: 'number' },
      { name: 'rangeOfMotion', label: '可動域' },
      { name: 'muscleStrength', label: '筋力' },
      { name: 'palpationFindings', label: '触診所見' },
      { name: 'skinCondition', label: '皮膚の状態' },
      { name: 'imagingResults', label: '画像診断結果' },
      { name: 'neurologicalExamResults', label: '神経学的検査結果' },
      { name: 'otherExamResults', label: 'その他の検査結果' },
      { name: 'diagnosis', label: '診断名' },
      { name: 'acupunctureType', label: '鍼の種類' },
      { name: 'acupunctureCount', label: '鍼の本数', type: 'number' },
      { name: 'moxibustionType', label: '灸の種類' },
      { name: 'treatmentFrequency', label: '施術頻度' },
      { name: 'currentCondition', label: '現症', type: 'textarea' },
      { name: 'treatmentPlan', label: '治療方針', type: 'textarea' },
      { name: 'selfCareInstructions', label: 'セルフケア指導', type: 'textarea' },
      { name: 'treatmentProgress', label: '経過', type: 'textarea' },
      { name: 'notes', label: '備考', type: 'textarea' },
    ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {fieldDefinitions.map(({ name, label, type = 'text' }) => {
        const validation =
          type === 'number'
            ? { valueAsNumber: true }
            : {
              validate: (value: unknown) =>
                typeof value === 'string'
                  ? isJapaneseOnly(value) || '日本語のみで入力してください。'
                  : true,
            };

        return (
          <div key={name}>
            <label className="block font-medium">{label}</label>
            {type === 'textarea' ? (
              <textarea {...register(name, validation)} className="border px-2 py-1 w-full" />
            ) : (
              <input type={type} {...register(name, validation)} className="border px-2 py-1 w-full" />
            )}
            {errors[name] && (
              <p className="text-red-500 text-sm">{errors[name]?.message?.toString()}</p>
            )}
          </div>
        );
      })}

      <p className="block font-semibold text-blue-700 text-lg mb-2">
        添付ファイル（画像・動画）
      </p>

      <div className="file-upload-box">
        <label
          htmlFor="mediaFiles"
          className="file-upload-label block w-full h-full cursor-pointer"
        >
          <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            ファイルを選択
          </span>
          <input
            id="mediaFiles"
            type="file"
            accept="image/*,video/*,text/plain"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                setMediaFiles(Array.from(files));
              }
            }}
          />
        </label>
      </div>


      {/* 選択ファイルのリスト表示 */}
      {mediaFiles.length > 0 && (
        <ul className="mt-2 space-y-1">
          {mediaFiles.map((file, index) => (
            <li key={index} className="flex items-center gap-2">
              <FontAwesomeIcon icon={getFileIcon(file)} className="text-blue-600" />
              <span>{file.name}</span>
            </li>
          ))}
        </ul>
      )}

      <br />

      <div className="flex justify-end gap-4 pt-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          保存
        </button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;
