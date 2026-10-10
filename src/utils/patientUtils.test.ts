import { describe, test, expect } from '@jest/globals';
import { buildNewPatient, emptyPatientDraft, isValidPatientDate, patientAge, patientDocument, validatePatientDraft } from './patientUtils';
import { Patient } from '../types/PatientData';

describe('患者登録の入力と保存データ', () => {
  test('誕生日前日・当日で年齢を正しく計算する', () => {
    expect(patientAge('1987-10-10','2026-10-09')).toBe(38);
    expect(patientAge('1987-10-10','2026-10-10')).toBe(39);
    expect(patientAge('2026-10-09','2026-10-09')).toBe(0);
  });
  test('存在しない日付・未来の生年月日を受け付けない', () => {
    expect(isValidPatientDate('2026-02-30')).toBe(false);
    expect(isValidPatientDate('2024-02-29')).toBe(true);
    const draft = {...emptyPatientDraft(),name:'患者',gender:'未回答',birthDate:'2026-10-10',firstVisitDate:'2026-10-10'};
    expect(validatePatientDraft(draft,'2026-10-09')).toContain('今日以前');
    expect(validatePatientDraft({...draft,birthDate:'1980-01-01',firstVisitDate:'1970-01-01'},'2026-10-09')).toContain('生年月日以降');
  });
  test('空白だけの氏名を受け付けない', () => {
    expect(validatePatientDraft({...emptyPatientDraft(),name:'　 '})).toContain('氏名');
  });
  test('連絡先・診療背景を含めて保存し、空の診療記録を作る', () => {
    const patient = buildNewPatient({...emptyPatientDraft(),name:' 患者氏名 ',gender:'女性',birthDate:'1990-01-01',
      phoneNumber:'090-1234-5678',address:'テスト住所',nameKana:'カンジャ',patientNumber:'0001',allergies:'テープ',currentMedications:'薬A',notes:'申し送り'},'p1');
    expect(patient).toMatchObject({id:'p1',name:'患者氏名',address:'テスト住所',phoneNumber:'090-1234-5678',nameKana:'カンジャ',allergies:'テープ',currentMedications:'薬A',notes:'申し送り',records:[]});
    expect(patient).not.toHaveProperty('patientNumber');
  });
  test('Firestoreで不正になるundefinedと画面専用データを除去する', () => {
    const patient = {...emptyPatientDraft(),id:'p1',age:36,name:'患者',hasReservation:true,records:[{id:'r1',date:'2026-10-09',currentCondition:'',treatmentPlan:'',notes:'',mediaFiles:[],painSeverity:0,diagnosis:undefined}]} as Patient;
    const output = patientDocument(patient);
    const deletionOutput = patientDocument({...patient, deletionOperation: 'record:r1', deletionRecordIds: ['r1']} as Patient);
    expect(deletionOutput).not.toHaveProperty('deletionOperation');
    expect(deletionOutput).not.toHaveProperty('deletionRecordIds');
    expect(output).not.toHaveProperty('hasReservation');
    expect((output.records as any[])[0]).not.toHaveProperty('mediaFiles');
    expect((output.records as any[])[0]).not.toHaveProperty('diagnosis');
    expect((output.records as any[])[0]).toHaveProperty('painSeverity',0);
  });
});
