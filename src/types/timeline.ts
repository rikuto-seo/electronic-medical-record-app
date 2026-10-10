// src/types/timeline.ts

export type TimelineEventType =
  | 'visit'
  | 'first_visit'
  | 'address_change'
  | 'contact_change'
  | 'insurance_change'
  | 'intake';

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  date: string;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  encounterId?: string;
  historyId?: string;
  createdAt: string;
}

export const TIMELINE_TYPE_LABELS: Record<TimelineEventType, string> = {
  visit: '来院',
  first_visit: '初診',
  address_change: '住所変更',
  contact_change: '連絡先変更',
  insurance_change: '保険変更',
  intake: '問診',
};
