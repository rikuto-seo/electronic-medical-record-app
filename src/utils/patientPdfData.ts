import { Patient, MedicalRecord } from '../types/PatientData';
import { clinicDateKey } from './reservationUtils';
import { patientAge } from './patientUtils';

export type PdfCell = { label: string; value: string };
export type PdfRow = PdfCell[];
export type PdfSection = { title: string; rows: PdfRow[] };
type Value = string | number | null | undefined;
const present = (value: Value) => value !== null && value !== undefined && String(value).trim() !== '';
export const pdfValue = (value: Value): string => present(value) ? String(value).trim() : '未記載';
const cell = (label: string, value: Value): PdfCell => ({ label, value: pdfValue(value) });
const row = (label: string, value: Value): PdfRow => [cell(label, value)];
const pair = (label: string, value: Value, secondLabel: string, secondValue: Value): PdfRow => [cell(label, value), cell(secondLabel, secondValue)];
const optionalRows = (fields: [string, Value][]): PdfRow[] => fields.filter(([,value]) => present(value)).map(([label,value]) => row(label,value));
export const recordAttachmentCount = (value: unknown): number => {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string' && item.trim()).length;
  if (typeof value === 'string') return value.match(/https?:\/\//g)?.length ?? 0;
  return 0;
};
const recordTime = (record: MedicalRecord): number => {
  const value = record.date;
  const date = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value) ? `${value}+09:00` : value);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
};

export const pdfDate = (value: string | undefined, time = false): string => {
  if (!value) return '未記載';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, '/');
  // Existing datetime-local chart values represent Japan time.
  const date = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value) ? `${value}+09:00` : value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    ...(time ? { hour: '2-digit', minute: '2-digit' } as const : {}) }).format(date);
};

export const patientSummarySections = (patient: Patient, exportedAt = new Date()): PdfSection[] => {
  const age = patientAge(patient.birthDate, clinicDateKey(exportedAt));
  const emergency = patient.emergencyContact;
  const insurance = patient.insuranceDetails;
  return [
    { title: '基本情報', rows: [
      pair('氏名',patient.name,'患者番号',patient.patientNumber),
      pair('フリガナ',patient.nameKana,'性別',patient.gender),
      pair('生年月日・年齢',`${pdfDate(patient.birthDate)} / ${age === undefined ? '年齢未確認' : `${age}歳`}`,'初診日',pdfDate(patient.firstVisitDate)),
      pair('職業',patient.occupation,'担当スタッフ',patient.assignedStaff),
      row('住所',patient.address),pair('電話番号',patient.phoneNumber,'メール',patient.email),
      ...optionalRows([['最終来院日', patient.lastVisitDate ? pdfDate(patient.lastVisitDate) : undefined], ['紹介元・来院経路',patient.referralSource]]),
    ] },
    { title: '緊急連絡先', rows: [pair('氏名・続柄',[emergency?.name,emergency?.relationship].filter(Boolean).join(' / '),'電話番号',emergency?.phoneNumber)] },
    { title: '診療上の注意・背景', rows: [
      row('アレルギー・注意事項',patient.allergies), row('服薬中の薬',patient.currentMedications),
      row('既往歴・手術歴',patient.medicalHistory), row('他院等での診断名',patient.existingDiagnosis), row('家族歴',patient.familyHistory),
      ...optionalRows([
        ['生活習慣', [patient.lifestyle?.smoking && `喫煙: ${patient.lifestyle.smoking}`, patient.lifestyle?.drinking && `飲酒: ${patient.lifestyle.drinking}`, patient.lifestyle?.exercise && `運動: ${patient.lifestyle.exercise}`].filter(Boolean).join(' / ')],
        ['身体計測', [patient.physicalMeasurements?.height !== undefined && `身長: ${patient.physicalMeasurements.height} cm`, patient.physicalMeasurements?.weight !== undefined && `体重: ${patient.physicalMeasurements.weight} kg`, patient.physicalMeasurements?.bmi !== undefined && `BMI: ${patient.physicalMeasurements.bmi}`].filter(Boolean).join(' / ')],
      ]),
    ] },
    { title: '保険・院内申し送り', rows: [
      row('保険・支払区分',patient.insuranceInfo),
      ...optionalRows([['保険者・番号',[insurance?.providerName,insurance?.insuranceNumber].filter(Boolean).join(' / ')],
        ['被保険者・続柄',[insurance?.insuredPersonName,insurance?.relationToInsured].filter(Boolean).join(' / ')],
        ['保険有効期間',insurance?.validFrom || insurance?.validTo ? `${pdfDate(insurance.validFrom)} - ${pdfDate(insurance.validTo)}` : undefined]]),
      row('申し送り・患者メモ',patient.notes),
    ] },
  ];
};

export const medicalRecordSections = (record: MedicalRecord): PdfSection[] => [
  { title: '主訴・症状', rows: [row('主訴',record.chiefComplaint), ...optionalRows([
    ['診療区分',record.visitType],['現病歴・これまでの経過',record.historyOfPresentIllness],
    ['発症日',record.symptomOnsetDate ? pdfDate(record.symptomOnsetDate) : undefined],['症状の持続期間',record.symptomDuration],
    ['症状の部位',record.symptomLocation],['痛みの種類',record.painType],['痛みの程度',record.painSeverity],['疼痛スケール',record.painScale],
    ['増悪する動作・条件',record.aggravatingFactors],['軽減する動作・条件',record.relievingFactors],['日常生活・仕事への影響',record.dailyLifeImpact],['患者の希望・目標',record.patientGoals],
  ])] },
  { title: '評価・所見', rows: [row('現症',record.currentCondition), ...optionalRows([
    ['診断名・評価',record.diagnosis],['可動域',record.rangeOfMotion],['筋力',record.muscleStrength],['触診所見',record.palpationFindings],
    ['皮膚の状態',record.skinCondition],['画像検査所見',record.imagingResults],['神経学的検査所見',record.neurologicalExamResults],['その他の検査所見',record.otherExamResults],
    ['姿勢・アライメント',record.postureFindings],['歩行・動作所見',record.gaitFindings],['整形外科的テスト',record.orthopedicTests],['機能評価・ADL',record.functionalAssessment],['安全確認・禁忌・注意所見',record.safetyFindings],['施術上の評価・見立て',record.clinicalAssessment],
    ['血圧',record.vitalSigns?.bloodPressure],['脈拍',record.vitalSigns?.pulse !== undefined ? `${record.vitalSigns.pulse} 回/分` : undefined],
    ['体温',record.vitalSigns?.temperature !== undefined ? `${record.vitalSigns.temperature} ℃` : undefined],
    ['呼吸数',record.vitalSigns?.respiratoryRate !== undefined ? `${record.vitalSigns.respiratoryRate} 回/分` : undefined],
    ['SpO2',record.vitalSigns?.oxygenSaturation !== undefined ? `${record.vitalSigns.oxygenSaturation} %` : undefined],
  ])] },
  { title: '施術・計画', rows: [row('治療・施術方針',record.treatmentPlan), ...optionalRows([
    ['実施した施術・対応',record.treatmentDetails],['施術部位・左右',record.treatedAreas],['使用穴・刺鍼部位',record.usedPoints],
    ['施術日',record.treatmentDate ? pdfDate(record.treatmentDate, true) : undefined],['施術時間',record.treatmentDuration],
    ['鍼の種類',record.acupunctureType],['鍼の本数',record.acupunctureCount !== undefined && record.acupunctureCount !== null ? `${record.acupunctureCount} 本` : undefined],
    ['灸の種類',record.moxibustionType],['施術頻度',record.treatmentFrequency],['処方・薬剤の記録',record.medicationsPrescribed],['セルフケア指導',record.selfCareInstructions],
    ['刺激方法・通電条件',record.stimulationMethod],['置鍼時間',record.needleRetentionMinutes !== undefined && record.needleRetentionMinutes !== null ? `${record.needleRetentionMinutes} 分` : undefined],
    ['手技の内容',record.manualTherapy],['物理療法・使用機器',record.physicalTherapy],['治療・施術の目標',record.treatmentGoals],['施術上の注意事項',record.precautions],['説明内容・同意の確認',record.informedConsent],
  ]), row('記録・施術担当',record.treatmentPerformedBy)] },
  { title: '経過・申し送り', rows: [...optionalRows([
    ['経過',record.treatmentProgress],['有害反応・副作用',record.adverseReactions],['患者の反応',record.patientFeedback],
    ['次回確認日',record.followUpDate ? pdfDate(record.followUpDate) : undefined],
    ['次回の評価・対応予定',record.nextVisitPlan],['他院への相談・紹介',record.referralPlan],
  ]), row('備考',record.notes), ...(recordAttachmentCount(record.mediaUrls) ? [row('添付ファイル',`${recordAttachmentCount(record.mediaUrls)}件（内容は院内システムで確認）`)] : [])] },
];

export const selectedMedicalRecords = (patient: Pick<Patient,'records'>, recordIds?: string): MedicalRecord[] => {
  const records = patient.records ?? [];
  if (!recordIds) return records.slice().sort((a,b) => recordTime(a)-recordTime(b));
  const ids = Array.from(new Set(recordIds.split('_').filter(Boolean)));
  if (!ids.length || ids.some(id => !records.some(record => record.id === id))) throw new Error('選択した診療記録が見つかりません。患者詳細から選び直してください。');
  return records.filter(record => ids.includes(record.id)).sort((a,b) => recordTime(a)-recordTime(b));
};

export const patientPdfFileName = (patient: Patient, kind: 'summary' | 'chart', exportedAt = new Date()): string => {
  const name = `${patient.patientNumber ? `${patient.patientNumber}_` : ''}${patient.name}_${clinicDateKey(exportedAt)}_${kind === 'summary' ? '患者情報' : '診療録'}`;
  const safeName = Array.from(name).map(character => character.charCodeAt(0) < 32 ? '_' : character).join('').replace(/[<>:"/\\|?*]/g,'_');
  return `${safeName.slice(0,160)}.pdf`;
};
