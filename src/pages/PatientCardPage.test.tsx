import React from 'react';
import {beforeEach,test,expect,jest} from '@jest/globals';
import type {Mock as JestMock} from 'jest-mock';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {usePatientContext} from '../hooks/usePatientContext';
import {issuePatientNumber} from '../lib/firebase/patientNumber';
import PatientCardPage from './PatientCardPage';
type Mock=JestMock<any,any[]>;
jest.mock('../hooks/usePatientContext',()=>{const {jest}=require('@jest/globals');return {usePatientContext:jest.fn()};});
jest.mock('../lib/firebase/patientNumber',()=>{const {jest}=require('@jest/globals');return {issuePatientNumber:jest.fn()};});
jest.mock('qrcode.react',()=>({QRCodeSVG:({value}:any)=><svg data-testid="card-qr" data-value={value}/> }));
const patient={id:'firebase-document-uuid',name:'山田花子',patientNumber:'000123'};
const context=(patients:any[])=>({patients,patientsLoading:false,patientsError:''});
beforeEach(()=>{(usePatientContext as unknown as Mock).mockReturnValue(context([patient]));});
const open=()=>render(<MemoryRouter initialEntries={['/patients/firebase-document-uuid/card']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/patients/:id/card" element={<PatientCardPage/>}/></Routes></MemoryRouter>);
test('カードの文字とQRには患者番号を使い、FirebaseのIDを載せない',()=>{
  open();expect(screen.getByText('000123')).toBeTruthy();
  expect(screen.getByTestId('card-qr').getAttribute('data-value')).toBe(`${window.location.origin}/patients/by-number/000123`);
  expect(screen.queryByText('firebase-document-uuid')).toBeNull();expect((screen.getByRole('button',{name:'カードを印刷'}) as HTMLButtonElement).disabled).toBe(false);
});
test('未発行の旧患者は番号発行後にカードを表示する',async()=>{
  (usePatientContext as unknown as Mock).mockReturnValue(context([{...patient,patientNumber:undefined}]));(issuePatientNumber as unknown as Mock).mockResolvedValue(patient);
  open();expect((screen.getByRole('button',{name:'カードを印刷'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'患者番号を発行してカードを作成'}));
  expect(await screen.findByText('000123')).toBeTruthy();expect(issuePatientNumber).toHaveBeenCalledWith(patient.id);
});
test('旧番号が重複する場合は印刷を止める',()=>{
  (usePatientContext as unknown as Mock).mockReturnValue(context([patient,{...patient,id:'other'}]));open();
  expect(screen.getByRole('alert').textContent).toContain('重複');expect(screen.queryByTestId('card-qr')).toBeNull();
});
