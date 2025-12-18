import React, { useState } from 'react';
import { Icons } from './components/Icons';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { ExportModal } from './components/ExportModal';
import { ThemeSelector } from './components/ThemeSelector';
import { reconcileDocuments } from './services/geminiService';
import { ReconciliationResult, FileData } from './types';

// Sample Data Constants for demonstration
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
  const [companyName, setCompanyName] = useState('My Business Ltd.');
  const [asAtDate, setAsAtDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Detailed'>('Dashboard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReconcile = async () => {
    if (!bankFile || !ledgerFile) return;
    setIsProcessing(true);
    setProcessStep(0);
    setProgress(0);
    setError(null);

    // Visual progress indicators
    const stepInterval = setInterval(() => {
      setProcessStep(s => (s < 3 ? s + 1 : s));
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress(p => (p < 92 ? p + 0.4 : p));
    }, 100);

    try {
      const data = await reconcileDocuments(bankFile, ledgerFile);
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The reconciliation engine failed to process the files. Please try again later.");
      setIsProcessing(false);
    } finally {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    }
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
    setProcessStep(0);
  };

  const steps = ["Configuring AI environment...", "Analyzing statement layout...", "Matching records with Ledger...", "Generating discrepancy report..."];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white transition-colors duration-500">
      <ThemeSelector />

      {!results && !isProcessing && (
        <div className="w-full max-w-[950px] animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
               <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30">
                  <Icons.Smart className="text-indigo-600 dark:text-indigo-400" size={32} />
               </div>
               <h1 className="text-4xl font-extrabold tracking-tight">Financial Reconciliation</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mx-auto opacity-80 leading-relaxed font-medium">
              Intelligent automated matching for Bank Statements and Cash Books. Powered by Gemini.
            </p>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-[2rem] p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Client / Company Name</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reconciliation Date</label>
                <input 
                  type="date" 
                  value={asAtDate} 
                  onChange={e => setAsAtDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:[color-scheme:dark] font-semibold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <FileUpload label="Bank Statement" accept=".pdf,.csv" onFileSelect={(f, c, t) => setBankFile({ file: f, content: c, type: t })} fileData={bankFile} />
              <FileUpload label="General Ledger" accept=".pdf,.csv" onFileSelect={(f, c, t) => setLedgerFile({ file: f, content: c, type: t })} fileData={ledgerFile} />
            </div>

            <div className="flex flex-col items-center gap-6">
              <button onClick={loadSampleData} className="text-xs text-indigo-500 font-bold uppercase tracking-widest hover:underline transition-all active:scale-95">
                Load Demo Datasets
              </button>
              <button 
                onClick={handleReconcile} 
                disabled={!bankFile || !ledgerFile} 
                className={`w-full max-w-xs py-4 rounded-xl text-sm font-bold tracking-widest transition-all shadow-xl active:scale-95 border border-black/5 dark:border-white/10 ${bankFile && ledgerFile ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'}`}
              >
                Start Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center space-y-12 py-20 w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="w-full space-y-8 text-center">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black tracking-tight">AI Audit in Progress...</h3>
                <span className="text-3xl font-black text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/50 shadow-inner">
                <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>
          </div>
          <div className="w-full bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-5 transition-all duration-500 ${processStep >= idx ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${processStep > idx ? 'bg-green-500/20 text-green-500 border border-green-500/30' : processStep === idx ? 'bg-indigo-600 text-white animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                    {processStep > idx ? <Icons.Check size={14} /> : idx + 1}
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${processStep === idx ? 'text-indigo-500' : 'text-slate-400'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && !isProcessing && (
        <div className="w-full max-w-6xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b border-slate-200 dark:border-slate-800 pb-10 gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Audit Report</h2>
              <p className="text-indigo-500 text-sm font-bold uppercase tracking-widest mt-1">{companyName}</p>
              <div className="mt-4 flex items-center gap-2">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date:</span>
                 <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">{asAtDate}</span>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button onClick={() => setActiveTab('Dashboard')} className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'Dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('Detailed')} className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'Detailed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Transactions</button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'Dashboard' ? <Dashboard data={results} /> : <TransactionsTable data={results} />}
          </div>

          <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-center gap-6">
            <button onClick={() => setShowResetConfirm(true)} className="bg-slate-100 dark:bg-slate-800 px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">Reset Session</button>
            <button onClick={handleExportCSV} className="bg-sky-600 text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-sky-500 transition-all shadow-lg active:scale-95">
              <Icons.Download size={16} /> CSV Export
            </button>
            <button onClick={() => setShowExportModal(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-indigo-500 transition-all active:scale-95">
              <Icons.Pdf size={16} /> PDF Audit Pack
            </button>
          </div>
        </div>
      )}

      {results && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} data={results} companyName={companyName} asAtDate={asAtDate} />}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-sm text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <Icons.Alert size={32} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Clear Data?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">This will remove all currently analyzed records and uploaded documents. This cannot be undone.</p>
            <div className="flex flex-col gap-3">
              <button onClick={reset} className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-500/20 active:scale-95">Confirm Clear</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed bottom-10 max-w-md w-full p-5 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 rounded-2xl text-red-900 dark:text-red-200 text-sm flex items-center gap-4 backdrop-blur-xl animate-in slide-in-from-bottom-10 shadow-2xl z-[300]">
          <Icons.Alert size={20} className="shrink-0 text-red-500" />
          <p className="flex-1 font-bold">{error}</p>
          <button onClick={() => setError(null)} className="hover:scale-110 transition-transform"><Icons.Close size={18} /></button>
        </div>
      )}
    </div>
  );
}

export default App;