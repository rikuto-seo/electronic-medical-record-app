import React from 'react';
import { beforeEach,test,expect,jest } from '@jest/globals';
import type { Mock as JestMock } from 'jest-mock';
import { act,fireEvent,render,screen } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot,doc,runTransaction } from 'firebase/firestore';
import { uploadBytes } from 'firebase/storage';
import { PatientProvider } from './PatientContext';
import { usePatientContext } from '../hooks/usePatientContext';
type Mock=JestMock<any,any[]>;
jest.mock('uuid',()=>({v4:()=> 'file-uuid'}));
jest.mock('../firebase',()=>({db:{app:{options:{projectId:'test-project'}}},auth:{currentUser:{uid:'test-user'}},storage:{}}));
jest.mock('firebase/auth',()=>{const {jest}=require('@jest/globals');return {onAuthStateChanged:jest.fn()};});
jest.mock('firebase/firestore',()=>{const {jest}=require('@jest/globals');return {collection:jest.fn(),doc:jest.fn(),onSnapshot:jest.fn(),runTransaction:jest.fn()};});
jest.mock('firebase/storage',()=>{const {jest}=require('@jest/globals');return {ref:()=>({}),uploadBytes:jest.fn(()=>Promise.resolve()),getDownloadURL:()=>Promise.resolve('https://example.invalid/upload.pdf')};});
jest.mock('../lib/firebase/patient',()=>({addPatient:()=>Promise.resolve(),updatePatientInfo:()=>Promise.resolve()}));
const PatientState=()=>{
  const context=usePatientContext();
  return <><p role="status">{context.patientsLoading?'loading':'ready'}</p><p data-testid="names">{context.patients.map(patient=>patient.name).join(',')}</p><p data-testid="error">{context.patientsError}</p><button onClick={context.reloadPatients}>再読み込み</button></>;
};
let authListener: (user: {uid:string}|null)=>void;
let listeners:{success:(snapshot:unknown)=>void;error:(error:unknown)=>void;unsubscribe:Mock}[];
const snapshot={docs:[{id:'p1',data:()=>({name:'テスト患者'})}]};
beforeEach(()=>{
  listeners=[];
  (onAuthStateChanged as unknown as Mock).mockImplementation((_auth:unknown,callback:typeof authListener)=>{authListener=callback;callback({uid:'staff-a'});return ()=>{};});
  (onSnapshot as unknown as Mock).mockImplementation((_collection:unknown,success:(snapshot:unknown)=>void,error:(error:unknown)=>void)=>{
    const unsubscribe=jest.fn() as Mock;listeners.push({success,error,unsubscribe});return unsubscribe;
  });
});
let patientActions:ReturnType<typeof usePatientContext>;
const RecordActions=()=>{patientActions=usePatientContext();return <PatientState/>;};
const record={id:'new-record',date:'2026-10-10T01:00:00.000Z',currentCondition:'ROM 120°',treatmentPlan:'再評価',notes:'',painSeverity:0};
const initializeRecords=()=>{
  render(<PatientProvider><RecordActions/></PatientProvider>);
  act(()=>listeners[0].success({docs:[{id:'p1',data:()=>({name:'患者',records:[]})}]}));
  (doc as unknown as Mock).mockReturnValue({path:'patients/p1'});
};
test('記録追加は最新の患者を読み、他端末の記録を残して添付を1回アップロードする',async()=>{
  initializeRecords();const other={...record,id:'other',date:'2026-10-11T01:00:00.000Z'};const update=jest.fn();
  (runTransaction as unknown as Mock).mockImplementation((_db,callback)=>callback({get:()=>Promise.resolve({exists:()=>true,data:()=>({records:[other],lastVisitDate:'2026-10-11'})}),update}));
  await act(async()=>{await patientActions.addMedicalRecord('p1',record,[new File(['data'],'file.pdf')]);});
  const saved=(update as Mock).mock.calls[0][1];expect(saved.lastVisitDate).toBe('2026-10-11');expect(saved.records).toHaveLength(2);
  expect(saved.records[0].id).toBe('other');expect(saved.records[1]).toMatchObject({id:'new-record',painSeverity:0,mediaUrls:['https://example.invalid/upload.pdf']});
  expect(uploadBytes).toHaveBeenCalledTimes(1);
});
test('同じ記録IDの保存再送では記録を二重に追加しない',async()=>{
  initializeRecords();const update=jest.fn();
  (runTransaction as unknown as Mock).mockImplementation((_db,callback)=>callback({get:()=>Promise.resolve({exists:()=>true,data:()=>({records:[record]})}),update}));
  await act(async()=>{await patientActions.addMedicalRecord('p1',record);});expect(update).not.toHaveBeenCalled();expect(patientActions.patients[0].records).toHaveLength(1);
});
test('履歴の編集は添付を保持し、他端末で変更済みなら上書きを止める',async()=>{
  initializeRecords();const update=jest.fn();let latest={...record,updatedAt:'version-a',mediaUrls:['https://example.invalid/original.pdf']};
  (runTransaction as unknown as Mock).mockImplementation((_db,callback)=>callback({get:()=>Promise.resolve({exists:()=>true,data:()=>({records:[latest]})}),update}));
  await act(async()=>{await patientActions.updateMedicalRecord('p1',{...latest,currentCondition:'編集した所見'});});
  expect((update as Mock).mock.calls[0][1].records[0]).toMatchObject({currentCondition:'編集した所見',mediaUrls:latest.mediaUrls});
  update.mockClear();latest={...latest,updatedAt:'version-b'};
  await expect(patientActions.updateMedicalRecord('p1',{...record,updatedAt:'version-a'})).rejects.toThrow('他の端末');expect(update).not.toHaveBeenCalled();
});
test('権限拒否をコード付きで表示し、取得済み患者を消す',()=>{
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  render(<PatientProvider><PatientState/></PatientProvider>);
  act(()=>listeners[0].success(snapshot));expect(screen.getByTestId('names').textContent).toBe('テスト患者');
  act(()=>listeners[0].error({code:'permission-denied',message:'not logged'}));
  expect(screen.getByTestId('error').textContent).toContain('permission-denied');
  expect(screen.getByTestId('names').textContent).toBe('');
  expect(screen.getByRole('status').textContent).toBe('ready');
  expect(log).toHaveBeenCalledWith('患者情報の読み取りエラー',{code:'permission-denied',projectId:'test-project',database:'(default)',collection:'patients',signedIn:true});
  log.mockRestore();
});
test('再読み込みで購読を作り直し、成功時はエラーを消す',()=>{
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  render(<PatientProvider><PatientState/></PatientProvider>);
  act(()=>listeners[0].error({code:'unavailable'}));
  fireEvent.click(screen.getByRole('button',{name:'再読み込み'}));
  expect(listeners[0].unsubscribe).toHaveBeenCalled();
  act(()=>listeners[1].success(snapshot));
  expect(screen.getByTestId('error').textContent).toBe('');expect(screen.getByTestId('names').textContent).toBe('テスト患者');
  log.mockRestore();
});
test('ログアウト・アカウント変更後に古い購読が患者やエラーを表示しない',()=>{
  render(<PatientProvider><PatientState/></PatientProvider>);
  const old=listeners[0];
  act(()=>authListener(null));act(()=>old.success(snapshot));act(()=>old.error({code:'permission-denied'}));
  expect(screen.getByTestId('names').textContent).toBe('');expect(screen.getByTestId('error').textContent).toBe('');
  act(()=>authListener({uid:'staff-b'}));act(()=>old.success(snapshot));
  expect(screen.getByTestId('names').textContent).toBe('');
  act(()=>listeners[1].success(snapshot));expect(screen.getByTestId('names').textContent).toBe('テスト患者');
});
