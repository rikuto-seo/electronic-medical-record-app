import { jsPDF } from 'jspdf';
import { Patient, MedicalRecord } from '../types/PatientData';
import { PdfRow, PdfSection, medicalRecordSections, patientSummarySections, pdfDate } from './patientPdfData';

const LEFT = 15;
const WIDTH = 180;
const BOTTOM = 278;
const TOP = 44;
const FONT = 'PatientSans';
export type PatientPdfOptions = { exportedAt?: Date; includeSummary?: boolean };

const assertSupportedText = (doc: jsPDF, sections: PdfSection[], extra: string) => {
  const metadata = doc.getFont().metadata as { characterToGlyph?: (code: number) => number };
  if (!metadata.characterToGlyph) throw new Error('PDF用の日本語フォントを読み込めませんでした。');
  const content = extra + sections.flatMap(section => [section.title,...section.rows.flatMap(row => row.flatMap(cell => [cell.label,cell.value]))]).join('\n');
  const missing = Array.from(new Set(Array.from(content).filter(character => !/[\n\r\t]/.test(character) &&
    (character.codePointAt(0)! > 0xffff || !metadata.characterToGlyph!(character.codePointAt(0)!)))));
  if (missing.length) throw new Error(`PDF用フォントで表示できない文字があります（${missing.slice(0,10).join(' ')}）。患者情報・記録の表記を確認してください。`);
};

const createDocument = (fontBase64: string, title: string, exportedAt: Date): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('PatientSans.ttf', fontBase64);
  doc.addFont('PatientSans.ttf', FONT, 'normal');
  doc.setFont(FONT);
  doc.setCreationDate(exportedAt);
  doc.setProperties({ title, creator: '院内カルテシステム' });
  return doc;
};

const header = (doc: jsPDF, patient: Patient, title: string, subtitle: string, exportedAt: Date) => {
  doc.setFont(FONT); doc.setTextColor(24, 49, 63); doc.setFontSize(18);
  doc.text(title, LEFT, 22);
  doc.setDrawColor(39, 119, 124); doc.setLineWidth(.6); doc.line(LEFT, 27, LEFT + WIDTH, 27);
  doc.setFontSize(9); doc.setTextColor(65, 88, 101);
  const subtitleLines: string[] = doc.splitTextToSize(subtitle, WIDTH);
  doc.text(subtitleLines, LEFT, 33);
  doc.setFontSize(7.5);
  doc.text(`出力: ${pdfDate(exportedAt.toISOString(), true)}`, LEFT + WIDTH, 15, { align: 'right' });
  const start = Math.max(TOP, 35 + subtitleLines.length * lineHeight(9));
  if (start > BOTTOM - 30) throw new Error('患者氏名が長すぎるため、PDFの見出しに収まりません。患者情報をご確認ください。');
  return start;
};

const lineHeight = (size: number) => size * .352778 * 1.4;
const rowLayout = (doc: jsPDF, row: PdfRow, size: number) => row.map(cell => {
  const width = WIDTH / row.length;
  const labelWidth = row.length === 1 ? 37 : 27;
  doc.setFontSize(size - 1);
  const labels: string[] = doc.splitTextToSize(cell.label, labelWidth - 5);
  doc.setFontSize(size);
  const values: string[] = doc.splitTextToSize(cell.value.replace(/\r\n?/g, '\n').replace(/\t/g,'    '), width - labelWidth - 5);
  return { width, labelWidth, labels, values, height: Math.max(labels.length * lineHeight(size - 1), values.length * lineHeight(size)) + 5 };
});

const sectionHeight = (doc: jsPDF, section: PdfSection, size: number) => 10 + section.rows.reduce((height, row) => height + Math.max(...rowLayout(doc,row,size).map(cell => cell.height)), 0);
const sectionHeading = (doc: jsPDF, title: string, y: number) => {
  doc.setFillColor(231, 239, 242); doc.rect(LEFT,y,WIDTH,7,'F');
  doc.setTextColor(24, 64, 78); doc.setFontSize(10); doc.text(title,LEFT+3,y+4.9);
  return y+7;
};

const drawRow = (doc: jsPDF, row: PdfRow, y: number, size: number) => {
  const layout = rowLayout(doc,row,size);
  const height = Math.max(...layout.map(cell => cell.height));
  layout.forEach((cell,index) => {
    const x = LEFT + index * cell.width;
    doc.setFillColor(247,249,250); doc.rect(x,y,cell.labelWidth,height,'F');
    doc.setDrawColor(204,215,221); doc.setLineWidth(.15); doc.rect(x,y,cell.width,height);
    doc.line(x+cell.labelWidth,y,x+cell.labelWidth,y+height);
    doc.setTextColor(77,96,106); doc.setFontSize(size-1);
    doc.text(cell.labels,x+2.5,y+2.5+lineHeight(size-1)*.75,{lineHeightFactor:1.4});
    doc.setTextColor(24,40,49); doc.setFontSize(size);
    doc.text(cell.values,x+cell.labelWidth+2.5,y+2.5+lineHeight(size)*.75,{lineHeightFactor:1.4});
  });
  return y+height;
};

const drawSummary = (doc: jsPDF, patient: Patient, exportedAt: Date) => {
  const sections = patientSummarySections(patient,exportedAt);
  assertSupportedText(doc,sections,patient.id);
  let size = 0;
  for (const candidate of [10,9.5,9,8.5,8]) {
    if (TOP + sections.reduce((height,section) => height+sectionHeight(doc,section,candidate),0) <= BOTTOM) { size = candidate; break; }
  }
  if (!size) throw new Error('患者情報がA4・1ページに収まりません。申し送り・既往歴などを要約してから出力してください。カルテは「患者情報シートを先頭に付ける」を外すと出力できます。');
  header(doc,patient,'患者情報シート','基本情報・連絡先・診療上の注意 / 空欄は未記載',exportedAt);
  let y = TOP;
  sections.forEach(section => {
    y = sectionHeading(doc,section.title,y);
    section.rows.forEach(row => { y = drawRow(doc,row,y,size); });
    y += 3;
  });
};

const drawRecord = (doc: jsPDF, patient: Patient, record: MedicalRecord, exportedAt: Date) => {
  const size = 10;
  assertSupportedText(doc,medicalRecordSections(record),`${patient.name} ${patient.id} ${patient.patientNumber ?? ''}`);
  const subtitle = `${patient.name} / 記録日時: ${pdfDate(record.date,true)}`;
  const newPage = () => { doc.addPage(); return header(doc,patient,'診療記録（続き）',subtitle,exportedAt); };
  const start = header(doc,patient,'診療記録',subtitle,exportedAt);
  let y = start;
  medicalRecordSections(record).forEach(section => {
    const firstHeight = section.rows.length ? Math.max(...rowLayout(doc,section.rows[0],size).map(cell => cell.height)) : 0;
    if (y+7+Math.min(firstHeight,20) > BOTTOM) y = newPage();
    y = sectionHeading(doc,section.title,y);
    section.rows.forEach(row => {
      const rowHeight = Math.max(...rowLayout(doc,row,size).map(cell => cell.height));
      if (rowHeight <= BOTTOM-start-7) {
        if (y+rowHeight > BOTTOM) { y = newPage(); y = sectionHeading(doc,`${section.title}（続き）`,y); }
        y = drawRow(doc,row,y,size);
        return;
      }
      // A very long clinical paragraph is continued across pages; nothing is clipped or discarded.
      const cell = row[0];
      const lines = rowLayout(doc,[cell],size)[0].values;
      let offset = 0;
      while (offset < lines.length) {
        const capacity = Math.floor((BOTTOM-y-5)/lineHeight(size));
        const label = offset ? `${cell.label}（続き）` : cell.label;
        const minHeight = rowLayout(doc,[{label,value:lines[offset]}],size)[0].height;
        if (capacity < 1 || y+minHeight > BOTTOM) { y = newPage(); y = sectionHeading(doc,`${section.title}（続き）`,y); continue; }
        const count = Math.min(capacity, lines.length-offset);
        y = drawRow(doc,[{ label, value: lines.slice(offset,offset+count).join('\n') }],y,size);
        offset += count;
      }
    });
    y += 3;
  });
};

const footer = (doc: jsPDF, patient: Patient) => {
  const pages = doc.getNumberOfPages();
  for (let page=1;page<=pages;page++) {
    doc.setPage(page); doc.setFont(FONT); doc.setFontSize(7); doc.setTextColor(88,105,116);
    doc.setDrawColor(204,215,221); doc.line(LEFT,282,LEFT+WIDTH,282);
    const identifier = patient.patientNumber ? `患者番号: ${patient.patientNumber}` : `患者ID: ${patient.id}`;
    doc.text(doc.splitTextToSize(identifier,150)[0],LEFT,287);
    doc.text(`${page} / ${pages}`,LEFT+WIDTH,287,{align:'right'});
  }
};

export const buildPatientSummaryPdf = (patient: Patient, fontBase64: string, options: PatientPdfOptions = {}): jsPDF => {
  const exportedAt = options.exportedAt ?? new Date();
  const doc = createDocument(fontBase64,'患者情報シート',exportedAt);
  drawSummary(doc,patient,exportedAt); footer(doc,patient);
  return doc;
};
export const buildMedicalRecordsPdf = (patient: Patient, records: MedicalRecord[], fontBase64: string, options: PatientPdfOptions = {}): jsPDF => {
  if (!records.length) throw new Error('出力する診療記録がありません。');
  const exportedAt = options.exportedAt ?? new Date();
  const doc = createDocument(fontBase64,'診療録',exportedAt);
  if (options.includeSummary !== false) drawSummary(doc,patient,exportedAt);
  records.forEach((record,index) => {
    if (options.includeSummary !== false || index > 0) doc.addPage();
    drawRecord(doc,patient,record,exportedAt);
  });
  footer(doc,patient); return doc;
};
