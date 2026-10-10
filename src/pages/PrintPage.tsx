import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePatientContext } from '../hooks/usePatientContext';
import { downloadMedicalRecordsPdf, downloadPatientSummaryPdf } from '../utils/pdfUtils';
import { PdfSection, medicalRecordSections, patientSummarySections, pdfDate, selectedMedicalRecords } from '../utils/patientPdfData';
import '../components/pdf/PrintableMedicalRecord.css';

const Sections: React.FC<{ sections: PdfSection[] }> = ({ sections }) => <>
  {sections.map(section => <section className="pdf-section" key={section.title}>
    <h3>{section.title}</h3>
    {section.rows.map((row,index) => <div className="pdf-row" key={index}>
      {row.map(cell => <div className="pdf-cell" key={cell.label}><strong>{cell.label}</strong><span>{cell.value}</span></div>)}
    </div>)}
  </section>)}
</>;

const PrintPage: React.FC<{ mode?: 'summary' | 'chart' }> = ({ mode = 'chart' }) => {
  const { patientId, recordId, recordIds } = useParams<{ patientId: string; recordId?: string; recordIds?: string }>();
  const { patients, patientsLoading, patientsError, reloadPatients } = usePatientContext();
  const [includeSummary, setIncludeSummary] = useState(true);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [exportedAt] = useState(() => new Date());
  useEffect(() => { setExcluded([]); setError(''); }, [patientId,recordId,recordIds,mode]);
  const patient = patients.find(item => item.id === patientId);
  if (patientsLoading) return <p role="status">患者情報を読み込み中…</p>;
  if (patientsError) return <div><p role="alert">{patientsError}</p><button onClick={reloadPatients}>再読み込み</button></div>;
  if (!patient) return <div><p role="alert">患者が見つかりません。</p><Link to="/patients">患者一覧に戻る</Link></div>;
  let records;
  try { records = mode === 'summary' ? [] : selectedMedicalRecords(patient,recordId ?? recordIds); }
  catch (selectionError) { return <div><p role="alert">{(selectionError as Error).message}</p><Link to={`/patients/${patient.id}`}>患者詳細に戻る</Link></div>; }
  const selected = records.filter(record => !excluded.includes(record.id));
  const download = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      if (mode === 'summary') await downloadPatientSummaryPdf(patient,{exportedAt});
      else await downloadMedicalRecordsPdf(patient,selected,{exportedAt,includeSummary});
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'PDFを出力できませんでした。もう一度お試しください。');
    } finally { busyRef.current = false; setBusy(false); }
  };
  return <div className="pdf-workspace">
    <div className="pdf-controls">
      <h2>{mode === 'summary' ? '患者情報PDF' : 'カルテPDF'}の出力</h2>
      <p>{patient.name} / {mode === 'summary' ? 'A4・1ページの患者情報シート' : `診療記録 ${selected.length}件`}</p>
      <p className="pdf-help">以下は出力内容です。PDFは日本語フォントを埋め込み、長い診療記録は自動で改ページします。</p>
      {mode === 'chart' && <>
        <label className="pdf-check"><input type="checkbox" checked={includeSummary} disabled={busy} onChange={event => setIncludeSummary(event.target.checked)} />患者情報シートを先頭に付ける</label>
        <fieldset disabled={busy} className="pdf-record-selector"><legend>出力する診療記録</legend>
          {!records.length && <p>診療記録はまだありません。</p>}
          {records.map(record => <label className="pdf-check" key={record.id}><input type="checkbox" checked={!excluded.includes(record.id)} onChange={event => setExcluded(previous => event.target.checked ? previous.filter(id => id !== record.id) : [...previous,record.id])} />
            {pdfDate(record.date,true)} {record.chiefComplaint || '主訴未記載'}
          </label>)}
        </fieldset>
      </>}
      {error && <p role="alert" className="pdf-error">{error}</p>}
      <div className="pdf-buttons"><button onClick={download} disabled={busy || (mode === 'chart' && !selected.length)}>{busy ? 'PDFを作成中…' : 'PDFをダウンロード'}</button><Link to="/patients">患者一覧に戻る</Link></div>
    </div>
    {(mode === 'summary' || includeSummary) && <article className="pdf-preview-sheet"><h2>患者情報シート</h2><p className="pdf-meta">出力日時: {pdfDate(exportedAt.toISOString(),true)} / 空欄は未記載</p><Sections sections={patientSummarySections(patient,exportedAt)} /></article>}
    {mode === 'chart' && selected.map(record => <article className="pdf-preview-sheet" key={record.id}><h2>診療記録</h2><p className="pdf-meta">{patient.name} / 記録日時: {pdfDate(record.date,true)}</p><Sections sections={medicalRecordSections(record)} /></article>)}
  </div>;
};
export default PrintPage;
