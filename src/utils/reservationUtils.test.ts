import { describe, test, expect } from '@jest/globals';
import { Reservation } from '../types/reservation';
import { findReservationConflicts, reservationStatus, parseClinicDateTime, clinicDateTimeInput, clinicDateKey, weekDays, validateReservation } from './reservationUtils';
const appointment = (changes: Partial<Reservation> = {}): Reservation => ({
  id: 'one', patientId: 'patient-1', staffId: 'staff-1', bedId: 'bed-1',
  date: parseClinicDateTime('2026-10-09T10:00'), duration: 30, type: '再診', memo: '', status: 'booked', ...changes,
});
describe('院内予約の重複判定', () => {
  test('患者・担当者・ベッドの重複を検出する', () => {
    const conflicts = findReservationConflicts(appointment({ id: 'two', date: parseClinicDateTime('2026-10-09T10:15') }), [appointment()]);
    expect(conflicts[0].reasons).toEqual(['患者', '担当者', 'ベッド']);
  });
  test('前の予約の終了時刻から開始できる', () => {
    expect(findReservationConflicts(appointment({ id: 'two', date: parseClinicDateTime('2026-10-09T10:30') }), [appointment()])).toEqual([]);
  });
  test('別の患者・スタッフ・ベッドなら同時刻に予約できる', () => {
    expect(findReservationConflicts(appointment({ id: 'two', patientId: 'patient-2', staffId: 'staff-2', bedId: 'bed-2' }), [appointment()])).toEqual([]);
  });
  test('未指定の資源同士は重複としないが同じ患者は検出する', () => {
    const existing = appointment({ staffId: '', bedId: '' });
    expect(findReservationConflicts(appointment({ id: 'two', patientId: 'patient-2', staffId: '', bedId: '' }), [existing])).toEqual([]);
    expect(findReservationConflicts(appointment({ id: 'two', staffId: '', bedId: '' }), [existing])[0].reasons).toEqual(['患者']);
  });
  test.each(['cancelled', 'no_show'] as const)('%sは枠を占有せず復帰時は重複を確認する', status => {
    const cancelled = appointment({ id: 'two', status });
    expect(findReservationConflicts(cancelled, [appointment()])).toEqual([]);
    expect(findReservationConflicts(appointment(), [cancelled])).toEqual([]);
    expect(findReservationConflicts({ ...cancelled, status: 'booked' }, [appointment()])).toHaveLength(1);
  });
  test('自分自身とは重複しない', () => {
    expect(findReservationConflicts(appointment(), [appointment()])).toEqual([]);
  });
  test('前日から日をまたぐ予約も判定する', () => {
    const existing = appointment({ date: parseClinicDateTime('2026-10-08T23:45'), duration: 60 });
    expect(findReservationConflicts(appointment({ id: 'two', date: parseClinicDateTime('2026-10-09T00:15') }), [existing])).toHaveLength(1);
  });
});
describe('日時と既存データ', () => {
  test('日本時間の入力と表示を往復できる', () => {
    const date = parseClinicDateTime('2026-10-09T09:00');
    expect(date.toISOString()).toBe('2026-10-09T00:00:00.000Z');
    expect(clinicDateTimeInput(date)).toBe('2026-10-09T09:00');
    expect(clinicDateKey(new Date('2026-10-08T16:00:00Z'))).toBe('2026-10-09');
  });
  test('日曜日も月曜始まりの同じ週に含める', () => {
    expect(weekDays('2026-10-11')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  });
  test('旧来のcheckedInを来院状態へ変換する', () => {
    expect(reservationStatus({ checkedIn: true })).toBe('checked_in');
    expect(reservationStatus({ checkedIn: false })).toBe('booked');
    expect(reservationStatus({ checkedIn: true, status: 'completed' })).toBe('completed');
  });
  test.each([0, -1, 30.5, 481, NaN])('不正な所要時間 %s を拒否する', duration => {
    expect(() => validateReservation(appointment({ duration }))).toThrow('所要時間');
  });
});
