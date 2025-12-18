
export type ProcessingMode = 'speed' | 'accuracy';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  ref?: string;
  source?: 'Bank' | 'GL';
}

export interface ReconciledMatch {
  date: string;
  description: string;
  amount: number;
  bankRef?: string;
  ledgerRef?: string;
  matchConfidence: number; // 0 to 100
  notes: string;
  reasoning?: string; // AI's explanation for the match
}

export interface ReconciliationSummary {
  totalMatches: number;
  totalUnmatchedBank: number;
  totalUnmatchedLedger: number;
  netDiscrepancy: number;
  matchedAmount: number;
  unmatchedBankAmount: number;
  unmatchedLedgerAmount: number;
  bankStatementBalance?: number;
  ledgerBalance?: number;
  auditScore: number; // 0 to 100 rating of reconciliation completeness
}

export interface ReconciliationResult {
  summary: ReconciliationSummary;
  matches: ReconciledMatch[];
  unmatchedBank: Transaction[];
  unmatchedLedger: Transaction[];
}

export interface FileData {
  file: File;
  content: string;
  type: 'pdf' | 'csv';
}
