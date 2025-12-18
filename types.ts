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
  matchConfidence: number;
  notes: string;
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