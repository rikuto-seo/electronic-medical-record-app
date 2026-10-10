import { describe, test, expect } from '@jest/globals';
import { emptyPatientDraft } from './patientUtils';
import { medicalRecordSections, patientSummarySections, selectedMedicalRecords, patientPdfFileName, pdfDate, recordAttachmentCount } from './patientPdfData';
import { MedicalRecord, Patient } from '../types/PatientData';
const record: MedicalRecord = {id:'r1',date:'2026-10-09T10:00',currentCondition:'現症',treatmentPlan:'計画',notes:'備考',painSeverity:0,painScale:0,acupunctureCount:0,vitalSigns:{pulse:0,temperature:36.5},treatmentPerformedBy:'スタッフ'};
const patient: Patient = {...emptyPatientDraft(),id:'p1',age:10,name:'テスト患者',gender:'女性',birthDate:'1987-10-10',firstVisitDate:'2026-10-09',records:[record,{...record,id:'r2',date:'2026-10-16T10:00'}]};
describe('PDFの出力内容', () => {
  test('追加した問診・機能評価・施術・同意・次回予定をPDFに含める',()=>{
    const content=medicalRecordSections({...record,historyOfPresentIllness:'3週間の経過',functionalAssessment:'ADLへの影響',treatmentDetails:'手技の実施記録',informedConsent:'説明後に同意を確認',nextVisitPlan:'次回ROM再評価',needleRetentionMinutes:0}).flatMap(section=>section.rows.flat());
    expect(content).toEqual(expect.arrayContaining([{label:'現病歴・これまでの経過',value:'3週間の経過'},{label:'機能評価・ADL',value:'ADLへの影響'},{label:'実施した施術・対応',value:'手技の実施記録'},{label:'説明内容・同意の確認',value:'説明後に同意を確認'},{label:'次回の評価・対応予定',value:'次回ROM再評価'},{label:'置鍼時間',value:'0 分'}]));
  });
  test('旧日時とUTC日時が混在しても診療順に並べる', () => {
    const mixed = {...patient,records:[{...record,id:'late',date:'2026-10-09T01:00:00Z'},{...record,id:'early',date:'2026-10-09T09:00'}]};
    expect(selectedMedicalRecords(mixed).map(item=>item.id)).toEqual(['early','late']);
  });
  test('旧文字列形式の添付URLも正しい件数で表示する', () => {
    expect(recordAttachmentCount('https://example.invalid/one.jpghttps://example.invalid/two.jpg')).toBe(2);
    expect(recordAttachmentCount(['https://example.invalid/one.jpg','',null])).toBe(1);
    expect(recordAttachmentCount(undefined)).toBe(0);
  });
  test('複数指定の記録だけを抽出し、存在しないIDなら全件に戻さずエラーにする', () => {
    expect(selectedMedicalRecords(patient,'r2').map(item=>item.id)).toEqual(['r2']);
    expect(selectedMedicalRecords(patient,'r2_r1').map(item=>item.id)).toEqual(['r1','r2']);
    expect(() => selectedMedicalRecords(patient,'r1_unknown')).toThrow('見つかりません');
    expect(selectedMedicalRecords({...patient,records:undefined})).toEqual([]);
  });
  test('古い保存年齢を使わず、出力日現在の年齢を表示する', () => {
    const content = patientSummarySections(patient,new Date('2026-10-09T01:00:00Z')).flatMap(section=>section.rows.flat());
    expect(content.some(cell=>cell.value.includes('38歳'))).toBe(true);
    expect(content.some(cell=>cell.value.includes('10歳'))).toBe(false);
  });
  test('疼痛0、鍼0本、バイタル、担当者を落とさず出力する', () => {
    const content = medicalRecordSections(record).flatMap(section=>section.rows.flat());
    expect(content).toEqual(expect.arrayContaining([{label:'痛みの程度',value:'0'},{label:'鍼の本数',value:'0 本'},{label:'脈拍',value:'0 回/分'},{label:'記録・施術担当',value:'スタッフ'}]));
  });
  test('日時を日本時間で扱い、ファイル名の危険文字を除去する', () => {
    expect(pdfDate('2026-10-09T01:00:00Z',true)).toBe('2026/10/09 10:00');
    expect(pdfDate('2026-10-09T10:00',true)).toBe('2026/10/09 10:00');
    expect(patientPdfFileName({...patient,name:'患者/氏名:*'},'summary',new Date('2026-10-08T18:00:00Z'))).toBe('患者_氏名___2026-10-09_患者情報.pdf');
  });
});
