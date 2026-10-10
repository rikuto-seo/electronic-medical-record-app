import { Patient, MedicalRecord } from '../types/PatientData';
import { patientPdfFileName } from './patientPdfData';
import type { PatientPdfOptions } from './patientPdfRenderer';

let fontPromise: Promise<string> | undefined;
const loadFont = (): Promise<string> => {
  if (!fontPromise) fontPromise = (async () => {
    const response = await fetch(`${process.env.PUBLIC_URL ?? ''}/fonts/NotoSansJP-Regular.ttf`);
    if (!response.ok) throw new Error('PDF用の日本語フォントを取得できませんでした。接続を確認して再度出力してください。');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 1000 || bytes[0] !== 0 || bytes[1] !== 1) throw new Error('PDF用のフォントが正しく読み込めませんでした。');
    let binary = '';
    for (let offset=0;offset<bytes.length;offset+=8192) binary += String.fromCharCode(...Array.from(bytes.subarray(offset,offset+8192)));
    return btoa(binary);
  })().catch(error => { fontPromise = undefined; throw error; });
  return fontPromise;
};

export const downloadPatientSummaryPdf = async (patient: Patient, options: PatientPdfOptions = {}): Promise<void> => {
  const [font, renderer] = await Promise.all([loadFont(), import('./patientPdfRenderer')]);
  const exportedAt = options.exportedAt ?? new Date();
  await renderer.buildPatientSummaryPdf(patient,font,{...options,exportedAt}).save(patientPdfFileName(patient,'summary',exportedAt), {returnPromise:true});
};
export const downloadMedicalRecordsPdf = async (patient: Patient, records: MedicalRecord[], options: PatientPdfOptions = {}): Promise<void> => {
  const [font, renderer] = await Promise.all([loadFont(), import('./patientPdfRenderer')]);
  const exportedAt = options.exportedAt ?? new Date();
  await renderer.buildMedicalRecordsPdf(patient,records,font,{...options,exportedAt}).save(patientPdfFileName(patient,'chart',exportedAt), {returnPromise:true});
};
