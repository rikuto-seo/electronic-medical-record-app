// src/types/history.ts

import { EmergencyContact } from './PatientData';

export interface AddressHistoryEntry {
  id: string;
  address: string;
  postalCode?: string;
  validFrom: string;
  validTo?: string | null;
  changedAt: string;
  changedBy?: string;
}

export interface ContactHistoryEntry {
  id: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
  validFrom: string;
  validTo?: string | null;
  changedAt: string;
  changedBy?: string;
}

export type InsuranceType =
  | '国保'
  | '社保'
  | '組合健保'
  | '共済'
  | '労災'
  | '自賠責'
  | 'その他';

export type CopayRatio = 0 | 1 | 2 | 3;

export interface InsuranceHistoryEntry {
  id: string;
  insuranceType: InsuranceType;
  insurerNumber?: string;
  symbol?: string;
  number?: string;
  branchNumber?: string;
  insuredPersonName?: string;
  relationToInsured?: string;
  copayRatio: CopayRatio;
  validFrom: string;
  validTo?: string | null;
  publicExpensePayerNumber?: string;
  publicExpenseRecipientNumber?: string;
  insurerName?: string;
  changedAt: string;
  changedBy?: string;
}
