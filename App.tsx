
import React, { useState } from 'react';
import { Icons } from './components/Icons';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { ExportModal } from './components/ExportModal';
import { ThemeSelector } from './components/ThemeSelector';
import { reconcileDocuments } from './services/geminiService';
import { ReconciliationResult, FileData, ProcessingMode } from './types';
import { Download, Calendar } from 'lucide-react';

const SAMPLE_BANK_CSV = `Date,Description,Amount,Reference
2024-03-01,Deposit - ABC Corp,1500.00,DEP-001
2024-03-05,Amazon.com*Purchase,-45.99,AMZ-99
2024-03-10,WeWork Rent,-1200.00,RENT-MAR
2024-03-15,Starbucks Coffee,-5.50,STR-23
2024-03-20,Stripe Transfer,250.00,STR-PAY
2024-03-28,Check #5055 Consultant,-500.00,CHK-5055
2024-03-31,Monthly Service Fee,-25.00,FEE-MAR`;

const SAMPLE_LEDGER_CSV = `Date,Description,Amount,ID
2024-03-01,Service Revenue: ABC Corp,1500.00,INV-101
2024-03-04,Office Supplies - Amazon,-45.99,EXP-45
2024-03-10,Monthly Office Rent,-1200.00,EXP-RENT
2024-03-25,In-flight meal,-22.00,EXP-TRAVEL
2024-03-31,Interest Income,12.50,INT-01`;

function App() {
  const [bankFile, setBankFile] = useState<FileData | null>(null);
  const [ledgerFile, setLedgerFile] = useState<FileData | null>(null);
  const [companyName, setCompanyName] = useState('Sample Logistics Ltd.');
  const [asAtDate, setAsAtDate] = useState('2024-03-31');
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('speed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Detailed'>('Dashboard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReconcile = async () => {
    if (!bankFile || !ledgerFile) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress(p => (p < 95 ? p + 1 : p));
    }, 150);

    try {
      const data = await reconcileDocuments(bankFile, ledgerFile, processingMode);
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Audit failed.");
      setIsProcessing(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const loadSampleData = () => {
    const bankBlob = new Blob([SAMPLE_BANK_CSV], { type: 'text/csv' });
    const bankFileObj = new File([bankBlob], "sample_bank_statement.csv", { type: 'text/csv' });
    const ledgerBlob = new Blob([SAMPLE_LEDGER_CSV], { type: 'text/csv' });
    const ledgerFileObj = new File([ledgerBlob], "sample_general_ledger.csv", { type: 'text/csv' });
    setBankFile({ file: bankFileObj, content: SAMPLE_BANK_CSV, type: 'csv' });
    setLedgerFile({ file: ledgerFileObj, content: SAMPLE_LEDGER_CSV, type: 'csv' });
  };

  const reset = () => {
    setResults(null);
    setBankFile(null);
    setLedgerFile(null);
    setShowResetConfirm(false);
    setProgress(0);
  };

  const handleExportCSV = () => {
    if (!results) return;
    const csvRows = ["Type,Date,Description,Amount,Bank Reference,Ledger Reference,Notes"];
    results.matches.forEach(m => csvRows.push(`MATCHED,${m.date},"${m.description}",${m.amount},${m.bankRef || ''},${m.ledgerRef || ''},"${m.notes || ''}"`));
    results.unmatchedBank.forEach(m => csvRows.push(`UNMATCHED_BANK,${m.date},"${m.description}",${m.amount},${m.ref || ''},,""`));
    results.unmatchedLedger.forEach(m => csvRows.push(`UNMATCHED_LEDGER,${m.date},"${m.description}",${m.amount},,${m.ref || ''},""`));
    
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReconReport_${companyName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 text-white bg-theme-bg">
      <ThemeSelector />

      {!results && !isProcessing && (
        <div className="w-full max-w-[900px] mt-12 animate-in fade-in duration-700">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icons.Pdf className="text-indigo-400" size={40} />
              <h1 className="text-5xl font-black tracking-tight">Bank Reconciliation</h1>
            </div>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
              Upload your bank statement and general ledger to allow our app to automatically perform the reconciliation for you.
            </p>
          </div>

          <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name (Optional)</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)} 
                  className="w-full bg-[#0a0f1b] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-semibold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reconciliation 'As At' Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={asAtDate} 
                    onChange={e => setAsAtDate(e.target.value)} 
                    className="w-full bg-[#0a0f1b] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:[color-scheme:dark] font-semibold appearance-none" 
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
              <FileUpload 
                label="Bank Statement" 
                description="Upload PDF or CSV statement."
                accept=".pdf,.csv" 
                onFileSelect={(f, c, t) => setBankFile({ file: f, content: c, type: t })} 
                fileData={bankFile} 
              />
              <FileUpload 
                label="General Ledger" 
                description="Upload Excel, CSV or PDF ledger."
                accept=".pdf,.csv" 
                onFileSelect={(f, c, t) => setLedgerFile({ file: f, content: c, type: t })} 
                fileData={ledgerFile} 
              />
            </div>

            <div className="flex flex-col items-center gap-8 border-t border-slate-800/50 pt-8">
              <div className="text-center">
                <button onClick={loadSampleData} className="text-sm text-indigo-400 font-bold underline hover:text-indigo-300 transition-colors">
                  No files? Load sample data to test
                </button>
                <div className="flex items-center justify-center gap-4 mt-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-slate-300"><Download size={12} /> Sample Statement</span>
                  <span className="opacity-30">|</span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-slate-300"><Download size={12} /> Sample Ledger</span>
                </div>
              </div>

              <div className="w-full max-w-sm text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Processing Mode</p>
                <p className="text-[10px] text-slate-600 font-medium mb-3 italic">'Accuracy' is better for complex files.</p>
                <div className="flex bg-[#0a0f1b] border border-slate-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setProcessingMode('speed')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${processingMode === 'speed' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Speed
                  </button>
                  <button 
                    onClick={() => setProcessingMode('accuracy')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${processingMode === 'accuracy' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Accuracy
                  </button>
                </div>
              </div>

              <button 
                onClick={handleReconcile} 
                disabled={!bankFile || !ledgerFile} 
                className={`px-12 py-4 rounded-xl text-sm font-bold tracking-tight transition-all active:scale-95 min-w-[200px] ${bankFile && ledgerFile ? 'bg-slate-300 text-[#0a0f1b] hover:bg-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                Reconcile Files
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full max-w-lg animate-in fade-in duration-500">
          <div className="w-full space-y-8 text-center">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-black tracking-tight">Reconciling Data...</h3>
                <span className="text-3xl font-black text-indigo-400">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>
             <p className="text-slate-500 text-sm font-medium animate-pulse">Running advanced matching algorithms...</p>
          </div>
        </div>
      )}

      {results && !isProcessing && (
        <div className="w-full max-w-[1000px] bg-[#0f172a]/80 backdrop-blur-3xl border border-slate-800 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-700 mt-6 overflow-hidden">
          {/* Detailed Report Header exactly as in screenshot */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-4 border-b border-slate-800 gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white leading-tight">Reconciliation Report</h2>
              <p className="text-indigo-400 text-[12px] font-bold uppercase tracking-widest mt-1 opacity-80">{companyName}</p>
              
              <div className="mt-8 flex items-center gap-3">
                 <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Reconciliation Period Ending:</span>
                 <span className="text-[10px] font-black bg-indigo-900/40 text-indigo-300 px-4 py-1.5 rounded-full border border-indigo-800/60 shadow-[0_0_15px_-5px_rgba(79,70,229,0.3)]">{asAtDate}</span>
              </div>
            </div>
            
            {/* Nav Tabs on the right */}
            <div className="flex pt-4">
              <button 
                onClick={() => setActiveTab('Dashboard')} 
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'Dashboard' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Dashboard
                {activeTab === 'Dashboard' && <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-indigo-400 rounded-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('Detailed')} 
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'Detailed' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Detailed Report
                {activeTab === 'Detailed' && <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-indigo-400 rounded-full"></div>}
              </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'Dashboard' ? <Dashboard data={results} /> : <TransactionsTable data={results} />}
          </div>

          {/* Action Buttons Footer exactly as in screenshot */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setShowResetConfirm(true)} 
              className="px-10 py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-indigo-500/10 min-w-[240px]"
            >
              Start New Reconciliation
            </button>
            <button 
              onClick={handleExportCSV} 
              className="px-10 py-3.5 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shadow-cyan-500/10 min-w-[140px]"
            >
              <Icons.Download size={14} /> Export CSV
            </button>
            <button 
              onClick={() => setShowExportModal(true)} 
              className="px-10 py-3.5 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shadow-red-500/10 min-w-[140px]"
            >
              <Icons.Pdf size={14} /> Export PDF
            </button>
          </div>
        </div>
      )}

      {results && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} data={results} companyName={companyName} asAtDate={asAtDate} />}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
            <Icons.Alert size={32} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Clear Report?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">This will permanently delete the current reconciliation results.</p>
            <div className="flex flex-col gap-3">
              <button onClick={reset} className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest hover:bg-red-500 transition-all active:scale-95">Clear All</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full bg-slate-800 py-3.5 rounded-xl font-bold uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed bottom-10 max-w-md w-full p-5 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-sm flex items-center gap-4 backdrop-blur-xl animate-in slide-in-from-bottom-10 shadow-2xl z-[300]">
          <Icons.Alert size={20} className="shrink-0 text-red-500" />
          <p className="flex-1 font-bold">{error}</p>
          <button onClick={() => setError(null)} className="hover:scale-110 transition-transform"><Icons.Close size={18} /></button>
        </div>
      )}
    </div>
  );
}

export default App;
