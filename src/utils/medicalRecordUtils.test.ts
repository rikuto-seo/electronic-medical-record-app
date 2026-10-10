import {test,expect} from '@jest/globals';
import {medicalRecordSchema} from '../schema/medicalRecordSchema';
import {normalizeMedicalRecord,recordDateInput,recordMediaUrls} from './medicalRecordUtils';
test('旧形式の連結された添付URLを配列として読み取り、不正なリンクを開かない',()=>{
  expect(recordMediaUrls('https://example.invalid/one.pdfhttps://example.invalid/two.jpg')).toEqual(['https://example.invalid/one.pdf','https://example.invalid/two.jpg']);
  expect(recordMediaUrls(['javascript:alert(1)',null,'https://example.invalid/test'])).toEqual(['https://example.invalid/test']);
});
test('日本時間の入力・UTC保存・編集表示を往復し、既存の独自項目と添付を保持する',()=>{
  const original={id:'r1',date:'2026-10-10T01:30:00Z',currentCondition:'旧所見',treatmentPlan:'旧方針',notes:'',mediaUrls:['https://example.invalid/a.pdf'],legacyAssessment:'旧評価'};
  expect(recordDateInput(original.date)).toBe('2026-10-10T10:30');
  const parsed=medicalRecordSchema.parse({...original,date:recordDateInput(original.date),currentCondition:'ROM 120°、MMT 4/5',treatmentPlan:'次回再評価',painSeverity:0,acupunctureCount:0});
  const saved=normalizeMedicalRecord(parsed,original);
  expect(saved).toMatchObject({id:'r1',date:'2026-10-10T01:30:00.000Z',legacyAssessment:'旧評価',painSeverity:0,acupunctureCount:0,mediaUrls:original.mediaUrls});
});
test('未確認を正常で埋めず、必須所見・方針と疼痛の範囲を検証する',()=>{
  const base={id:'r',date:'2026-10-10T10:00',currentCondition:'左肩挙上時痛',treatmentPlan:'反応を再評価する'};
  expect(medicalRecordSchema.parse(base)).not.toHaveProperty('vitalSigns');
  expect(medicalRecordSchema.safeParse({...base,currentCondition:'　 '}).success).toBe(false);
  expect(medicalRecordSchema.safeParse({...base,painSeverity:11}).success).toBe(false);
  expect(recordDateInput('2026-10-10')).toBe('2026-10-10T00:00');
});
