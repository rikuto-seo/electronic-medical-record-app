import React from 'react';
import { beforeEach, test, expect, jest } from '@jest/globals';
import type { Mock as JestMock } from 'jest-mock';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { usePatientContext } from '../../hooks/usePatientContext';
import PatientForm from './PatientForm';
type Mock = JestMock<any,any[]>;
jest.mock('../../hooks/usePatientContext',()=>{const {jest}=require('@jest/globals');return {usePatientContext:jest.fn()};});
jest.mock('uuid',()=>({v4:()=> 'test-new-patient-id'}));
const save=jest.fn();
beforeEach(()=>{
  (usePatientContext as unknown as Mock).mockReturnValue({patients:[],patientsLoading:false,patientsError:'',addPatient:save});
  (save as Mock).mockResolvedValue(undefined);
});
const open=()=>render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}} initialEntries={['/patients/new']}><Routes><Route path="/patients/new" element={<PatientForm/>}/><Route path="/patients/:id" element={<p>登録後の患者詳細</p>}/></Routes></MemoryRouter>);
const fill=()=>{
  fireEvent.change(screen.getByLabelText(/^氏名/),{target:{value:'新規患者'}});
  fireEvent.change(screen.getByLabelText(/^性別/),{target:{value:'女性'}});
  fireEvent.change(screen.getByLabelText(/^生年月日/),{target:{value:'1990-01-01'}});
  fireEvent.change(screen.getByLabelText('住所'),{target:{value:'テスト住所'}});
  fireEvent.change(screen.getByLabelText('電話番号'),{target:{value:'09012345678'}});
  fireEvent.change(screen.getByLabelText('アレルギー・注意事項'),{target:{value:'テープに注意'}});
};
test('追加項目を保存して、保存後に患者詳細へ移動する',async()=>{
  open();fill();fireEvent.click(screen.getByRole('button',{name:'患者を登録する'}));
  await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({id:'test-new-patient-id',name:'新規患者',address:'テスト住所',phoneNumber:'09012345678',allergies:'テープに注意',records:[]})));
  expect(await screen.findByText('登録後の患者詳細')).toBeTruthy();
});
test('保存中の連打を防ぎ、失敗時の再送は同じIDと入力内容を使う',async()=>{
  let reject: (reason: Error)=>void = ()=>{};
  (save as Mock).mockImplementationOnce(()=>new Promise((_resolve,rejectRequest)=>{reject=rejectRequest;}));
  open();fill();const form=screen.getByRole('button',{name:'患者を登録する'}).closest('form')!;
  fireEvent.submit(form);fireEvent.submit(form);
  expect(save).toHaveBeenCalledTimes(1);
  reject(new Error('offline'));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect((screen.getByLabelText('住所') as HTMLInputElement).value).toBe('テスト住所');
  fireEvent.submit(form);
  await waitFor(()=>expect(save).toHaveBeenCalledTimes(2));
  expect((save as Mock).mock.calls[0][0].id).toBe((save as Mock).mock.calls[1][0].id);
});
test('患者番号は手入力できず、生年月日の未来日を登録しない',async()=>{
  (usePatientContext as unknown as Mock).mockReturnValue({patients:[{id:'old',patientNumber:'0001'}],patientsLoading:false,patientsError:'',addPatient:save});
  open();fill();const form=screen.getByRole('button',{name:'患者を登録する'}).closest('form')!;
  fireEvent.change(screen.getByLabelText(/^生年月日/),{target:{value:'2999-01-01'}});fireEvent.submit(form);
  expect(await screen.findByText('生年月日は今日以前の日付を入力してください。')).toBeTruthy();
  expect((screen.getByLabelText('患者番号') as HTMLInputElement).readOnly).toBe(true);
  expect((screen.getByLabelText('患者番号') as HTMLInputElement).value).toBe('登録時に自動発行');
  expect(save).not.toHaveBeenCalled();
});
