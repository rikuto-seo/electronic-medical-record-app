import { describe,test,expect } from '@jest/globals';
import { firebaseErrorCode,patientReadErrorMessage } from './firestoreErrors';
describe('患者取得のエラー表示',()=>{
  test('権限拒否と認証失敗を接続エラーと区別する',()=>{
    expect(patientReadErrorMessage({code:'permission-denied'})).toContain('読み取り権限が拒否');
    expect(patientReadErrorMessage({code:'firestore/permission-denied'})).toContain('エラーコード: permission-denied');
    expect(patientReadErrorMessage({code:'unauthenticated'})).toContain('ログインし直して');
  });
  test('接続・利用上限・設定エラーを区別する',()=>{
    expect(patientReadErrorMessage({code:'unavailable'})).toContain('サーバーに接続できません');
    expect(patientReadErrorMessage({code:'resource-exhausted'})).toContain('利用上限');
    expect(patientReadErrorMessage({code:'failed-precondition'})).toContain('サーバー設定');
  });
  test('エラー本文・患者データ・トークンは表示しない',()=>{
    const error={code:'permission-denied',message:'private-token',patientName:'患者氏名'};
    expect(patientReadErrorMessage(error)).not.toContain('private-token');
    expect(patientReadErrorMessage(error)).not.toContain('患者氏名');
    expect(firebaseErrorCode({code:'invalid data private-token'})).toBe('unknown');
    expect(firebaseErrorCode(null)).toBe('unknown');
  });
});
