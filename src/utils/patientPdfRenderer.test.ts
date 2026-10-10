/** @jest-environment node */
import { test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { buildMedicalRecordsPdf, buildPatientSummaryPdf } from './patientPdfRenderer';
import { Patient } from '../types/PatientData';
const font=readFileSync('public/fonts/NotoSansJP-Regular.ttf').toString('base64');
const patient:Patient={id:'p1',name:'検証患者',birthDate:'1990-01-01',age:36,gender:'男性',firstVisitDate:'2026-10-09',address:'テスト住所'};
const record={id:'r1',date:'2026-10-09T10:00',currentCondition:'現症',treatmentPlan:'計画',notes:''};
test('日本語フォントを埋め込んだ患者情報PDFはA4の1ページになる',()=>{
  const pdf=buildPatientSummaryPdf(patient,font);
  expect(pdf.getNumberOfPages()).toBe(1);
  expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210,0);
  expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297,0);
  expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(5000);
});
test('表紙+2件の診療記録は3ページ、表紙なしは2ページになる',()=>{
  expect(buildMedicalRecordsPdf(patient,[record,{...record,id:'r2'}],font).getNumberOfPages()).toBe(3);
  expect(buildMedicalRecordsPdf(patient,[record,{...record,id:'r2'}],font,{includeSummary:false}).getNumberOfPages()).toBe(2);
});
test('1ページに収まらない患者情報は切り落とさずエラーにする',()=>{
  expect(()=>buildPatientSummaryPdf({...patient,notes:'非常に長い申し送り\n'.repeat(300)},font)).toThrow('1ページに収まりません');
});
test('長文の診療記録は改ページし、空の記録選択は出力しない',()=>{
  expect(buildMedicalRecordsPdf(patient,[{...record,currentCondition:'長文の現症\n'.repeat(150)}],font,{includeSummary:false}).getNumberOfPages()).toBeGreaterThan(2);
  expect(()=>buildMedicalRecordsPdf(patient,[],font)).toThrow('診療記録がありません');
});
test('フォントが対応しない文字を消さずにエラーで伝える',()=>{
  expect(()=>buildPatientSummaryPdf({...patient,name:'患者😀'},font)).toThrow('表示できない文字');
});
