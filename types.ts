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
  matchConfidence: number; // 0-1
  notes: string;
}

export interface ReconciliationSummary {
  totalMatches: number;
  totalUnmatchedBank: number;
  totalUnmatchedLedger: number;
  netDiscrepancy: number;
}

export interface ReconciliationResult {
  summary: ReconciliationSummary;
  matches: ReconciledMatch[];
  unmatchedBank: Transaction[];
  unmatchedLedger: Transaction[];
}

export interface FileData {
  file: File;
  content: string; // Base64 or Text
  type: 'pdf' | 'csv';
}
