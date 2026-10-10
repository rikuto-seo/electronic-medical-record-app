import { beforeEach, test, expect, jest } from '@jest/globals';
import type { Mock as JestMock } from 'jest-mock';
import { setDoc, updateDoc, doc } from 'firebase/firestore';
import { addPatient, updatePatientInfo } from './patient';
import { Patient } from '../../types/PatientData';
import { registerPatientWithNumber } from './patientNumber';
type Mock = JestMock<any,any[]>;
jest.mock('../../firebase',()=>({db:{}}));
jest.mock('./patientNumber',()=>{const {jest}=require('@jest/globals');return {registerPatientWithNumber:jest.fn()};});
jest.mock('firebase/firestore',()=>{const {jest}=require('@jest/globals');return {doc:jest.fn(),setDoc:jest.fn(),updateDoc:jest.fn()};});
const patient: Patient = {id:'p1',name:'患者',gender:'男性',birthDate:'1990-01-01',age:36,firstVisitDate:'2026-10-09',address:'住所',phoneNumber:'09000000000',nameKana:'カンジャ',allergies:'注意事項',records:[]};
beforeEach(()=>{(doc as unknown as Mock).mockReturnValue({id:'p1'});(setDoc as unknown as Mock).mockResolvedValue(undefined);(updateDoc as unknown as Mock).mockResolvedValue(undefined);});
test('新規登録時は自動採番のサービスに登録情報を渡す',async()=>{
  await addPatient(patient);
  expect(registerPatientWithNumber).toHaveBeenCalledWith(patient);
});
test('患者情報の編集保存では診療記録を上書きしない',async()=>{
  await updatePatientInfo({...patient,schemaVersion:2,patientNumber:'999999'});
  const saved=(updateDoc as unknown as Mock).mock.calls[0][1];
  expect(saved).toMatchObject({address:'住所',phoneNumber:'09000000000',allergies:'注意事項'});
  expect(saved).not.toHaveProperty('records');expect(saved).not.toHaveProperty('schemaVersion');expect(saved).not.toHaveProperty('id');
  expect(saved).not.toHaveProperty('patientNumber');
});
