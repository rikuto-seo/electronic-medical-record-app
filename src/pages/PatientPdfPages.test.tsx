import React from 'react';
import { beforeEach, test, expect, jest } from '@jest/globals';
import type { Mock as JestMock } from 'jest-mock';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { usePatientContext } from '../hooks/usePatientContext';
import { getReservations } from '../utils/reservationService';
import { downloadMedicalRecordsPdf,downloadPatientSummaryPdf } from '../utils/pdfUtils';
import PrintPage from './PrintPage';
import PatientListPage from './PatientListPage';
type Mock=JestMock<any,any[]>;
jest.mock('../hooks/usePatientContext',()=>{const {jest}=require('@jest/globals');return {usePatientContext:jest.fn()};});
jest.mock('../utils/reservationService',()=>{const {jest}=require('@jest/globals');return {getReservations:jest.fn()};});
jest.mock('../utils/pdfUtils',()=>{const {jest}=require('@jest/globals');return {downloadMedicalRecordsPdf:jest.fn(),downloadPatientSummaryPdf:jest.fn()};});
const record={id:'r1',date:'2026-10-09T10:00',chiefComplaint:'主訴A',currentCondition:'現症',treatmentPlan:'方針',notes:''};
const patient={id:'p1',name:'テスト患者',birthDate:'1990-01-01',age:1,gender:'男性',firstVisitDate:'2026-10-09',phoneNumber:'09012345678',records:[record,{...record,id:'r2',date:'2026-10-16T10:00',chiefComplaint:'主訴B'}]};
beforeEach(()=>{
  (usePatientContext as unknown as Mock).mockReturnValue({patients:[patient],patientsLoading:false,patientsError:'',reloadPatients:jest.fn()});
  (getReservations as unknown as Mock).mockResolvedValue([]);
  (downloadMedicalRecordsPdf as unknown as Mock).mockResolvedValue(undefined);
  (downloadPatientSummaryPdf as unknown as Mock).mockResolvedValue(undefined);
});
const openPrint=(path:string,route:string)=>render(<MemoryRouter initialEntries={[path]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path={route} element={<PrintPage/>}/></Routes></MemoryRouter>);
test('患者一覧から患者情報PDFを直接ダウンロードできる',async()=>{
  render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><PatientListPage/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'テスト患者の患者情報PDFを出力'}));
  await waitFor(()=>expect(downloadPatientSummaryPdf).toHaveBeenCalledWith(patient));
  expect(screen.getByRole('link',{name:'カルテPDF'}).getAttribute('href')).toBe('/patients/p1/records/print');
});
test('旧複数選択URLのrecordIdsを読み取り、選択以外の記録を出力しない',async()=>{
  openPrint('/print/p1/r2','/print/:patientId/:recordIds');
  fireEvent.click(screen.getByRole('button',{name:'PDFをダウンロード'}));
  await waitFor(()=>expect(downloadMedicalRecordsPdf).toHaveBeenCalledWith(patient,[patient.records[1]],expect.objectContaining({includeSummary:true})));
});
test('記録選択を外し、患者表紙なしで出力できる',async()=>{
  openPrint('/patients/p1/records/print','/patients/:patientId/records/print');
  fireEvent.click(screen.getByRole('checkbox',{name:/主訴A/}));
  fireEvent.click(screen.getByRole('checkbox',{name:'患者情報シートを先頭に付ける'}));
  fireEvent.click(screen.getByRole('button',{name:'PDFをダウンロード'}));
  await waitFor(()=>expect(downloadMedicalRecordsPdf).toHaveBeenCalledWith(patient,[patient.records[1]],expect.objectContaining({includeSummary:false})));
});
test('空選択と見つからない記録は出力を止める',()=>{
  openPrint('/print/p1/missing','/print/:patientId/:recordIds');
  expect(screen.getByRole('alert').textContent).toContain('見つかりません');
  expect(downloadMedicalRecordsPdf).not.toHaveBeenCalled();
});
test('PDF失敗時に理由を表示し、再度出力できる',async()=>{
  (downloadMedicalRecordsPdf as unknown as Mock).mockRejectedValueOnce(new Error('患者情報が1ページに収まりません。'));
  openPrint('/patients/p1/records/print','/patients/:patientId/records/print');
  fireEvent.click(screen.getByRole('button',{name:'PDFをダウンロード'}));
  expect((await screen.findByRole('alert')).textContent).toContain('1ページに収まりません');
  expect((screen.getByRole('button',{name:'PDFをダウンロード'}) as HTMLButtonElement).disabled).toBe(false);
});
