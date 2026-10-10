import React from 'react';
import {beforeEach,test,expect,jest} from '@jest/globals';
import type {Mock as JestMock} from 'jest-mock';
import {render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route,useLocation} from 'react-router-dom';
import {usePatientContext} from '../hooks/usePatientContext';
import PatientByNumberPage from './PatientByNumberPage';
type Mock=JestMock<any,any[]>;
jest.mock('../hooks/usePatientContext',()=>{const {jest}=require('@jest/globals');return {usePatientContext:jest.fn()};});
const patient={id:'saved-firebase-id',patientNumber:'000007'};
beforeEach(()=>{(usePatientContext as unknown as Mock).mockReturnValue({patients:[patient],patientsLoading:false,patientsError:''});});
const Destination=()=>{const location=useLocation();return <p>{location.pathname}{location.search}</p>;};
const open=()=>render(<MemoryRouter initialEntries={['/patients/by-number/000007']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/patients/by-number/:patientNumber" element={<PatientByNumberPage/>}/><Route path="/patients/:id" element={<Destination/>}/></Routes></MemoryRouter>);
test('QRの患者番号から既存の患者ドキュメントのカルテへ移動する',async()=>{
  open();expect(await screen.findByText('/patients/saved-firebase-id?tab=chart')).toBeTruthy();
});
test('未登録・重複した番号なら別の患者へ移動しない',()=>{
  (usePatientContext as unknown as Mock).mockReturnValue({patients:[patient,{...patient,id:'other'}],patientsLoading:false,patientsError:''});
  const view=open();expect(screen.getByRole('alert').textContent).toContain('重複');view.unmount();
  (usePatientContext as unknown as Mock).mockReturnValue({patients:[],patientsLoading:false,patientsError:''});open();expect(screen.getByRole('alert').textContent).toContain('見つかりません');
});
