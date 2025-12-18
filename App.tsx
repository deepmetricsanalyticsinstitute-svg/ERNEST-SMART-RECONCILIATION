import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { ExportModal } from './components/ExportModal';
import { ThemeSelector } from './components/ThemeSelector';
import { reconcileDocuments } from './services/geminiService';
import { ReconciliationResult, FileData } from './types';

// Sample Data Constants
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
  const [asAtDate, setAsAtDate] = useState('2025-12-18');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'precise'>('fast');
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Detailed'>('Dashboard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReconcile = async () => {
    if (!bankFile || !ledgerFile) return;
    setIsProcessing(true);
    setProcessStep(0);
    setProgress(0);
    setError(null);

    const stepInterval = setInterval(() => {
      setProcessStep(s => (s < 3 ? s + 1 : s));
    }, 4500);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 30) return p + 1.5;
        if (p < 60) return p + 0.8;
        if (p < 95) return p + 0.3;
        return p;
      });
    }, 200);

    try {
      const data = await reconcileDocuments(bankFile, ledgerFile, analysisMode);
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Reconciliation failed. Check connection.");
      setIsProcessing(false);
    } finally {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    }
  };

  const handleExportCSV = () => {
    if (!results) return;
    setTimeout(() => {
      let csvRows = ["Type,Date,Description,Amount,Bank Reference,Ledger Reference,Notes"];
      results.matches.forEach(m => csvRows.push(`MATCHED,${m.date},"${m.description.replace(/"/g, '""')}",${m.amount},${m.bankRef || ''},${m.ledgerRef || ''},"${(m.notes || '').replace(/"/g, '""')}"`));
      results.unmatchedBank.forEach(m => csvRows.push(`UNMATCHED_BANK,${m.date},"${m.description.replace(/"/g, '""')}",${m.amount},${m.ref || ''},,""`));
      results.unmatchedLedger.forEach(m => csvRows.push(`UNMATCHED_LEDGER,${m.date},"${m.description.replace(/"/g, '""')}",${m.amount},,${m.ref || ''},""`));
      const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Ernest_Recon_${companyName.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 0);
  };

  const loadSampleData = () => {
    const bankBlob = new Blob([SAMPLE_BANK_CSV], { type: 'text/csv' });
    const bankFileObj = new File([bankBlob], "sample_bank_statement.csv", { type: 'text/csv' });
    const ledgerBlob = new Blob([SAMPLE_LEDGER_CSV], { type: 'text/csv' });
    const ledgerFileObj = new File([ledgerBlob], "sample_general_ledger.csv", { type: 'text/csv' });
    setBankFile({ file: bankFileObj, content: SAMPLE_BANK_CSV, type: 'csv' });
    setLedgerFile({ file: ledgerFileObj, content: SAMPLE_LEDGER_CSV, type: 'csv' });
    setError(null);
  };

  const reset = () => {
    setResults(null);
    setBankFile(null);
    setLedgerFile(null);
    setError(null);
    setProgress(0);
    setProcessStep(0);
    setShowResetConfirm(false);
  };

  const steps = [
    "Initializing high-speed engine...",
    "Extracting statement data...",
    "Matching transactions across systems...",
    "Finalizing financial summary..."
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white transition-colors duration-500">
      <ThemeSelector />

      {/* Main Container */}
      {!results && !isProcessing && (
        <div className="w-full max-w-[950px] animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
               <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30">
                  <Icons.Smart className="text-indigo-600 dark:text-indigo-400" size={32} />
               </div>
               <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">Bank Reconciliation</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed opacity-80">
              Upload your bank statement and general ledger / Cash book to allow app to automatically perform the reconciliation for you.
            </p>
          </div>

          {/* Form Content */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-10 shadow-2xl">
            
            {/* Top Row Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  Company Name <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  Reconciliation 'As At' Date
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={asAtDate} 
                    onChange={e => setAsAtDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Upload Area Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <FileUpload 
                label="Bank Statement" 
                accept=".pdf,.csv" 
                onFileSelect={(f, c, t) => setBankFile({ file: f, content: c, type: t })} 
                fileData={bankFile} 
              />
              <FileUpload 
                label="General Ledger" 
                accept=".pdf,.csv,.xlsx" 
                onFileSelect={(f, c, t) => setLedgerFile({ file: f, content: c, type: t })} 
                fileData={ledgerFile} 
              />
            </div>

            {/* Sample Data Utility */}
            <div className="flex flex-col items-center mb-10 text-center">
              <button 
                onClick={loadSampleData} 
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors mb-3"
              >
                No files? Load sample data to test
              </button>
              <div className="flex gap-6 text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-slate-300 transition-colors">
                  <Icons.Download size={12} /> Sample Statement
                </button>
                <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-800 self-center"></div>
                <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-slate-300 transition-colors">
                  <Icons.Download size={12} /> Sample Ledger
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex flex-col items-center mb-10">
              <div className="text-center mb-3">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-1">Processing Mode</p>
                <p className="text-[10px] text-slate-500">'Accuracy' is better for complex files.</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-1 w-full max-w-[300px]">
                <button 
                  onClick={() => setAnalysisMode('fast')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${analysisMode === 'fast' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Speed
                </button>
                <button 
                  onClick={() => setAnalysisMode('precise')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${analysisMode === 'precise' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Accuracy
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center w-full">
                <button 
                  onClick={handleReconcile} 
                  disabled={!bankFile || !ledgerFile} 
                  className={`w-full max-w-[220px] py-4 rounded-xl text-sm font-bold tracking-widest transition-all shadow-xl active:scale-95 border border-black/5 dark:border-white/10 ${bankFile && ledgerFile ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                >
                  Reconcile Files
                </button>
              </div>
              {(bankFile || ledgerFile) && (
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-red-500 font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                >
                  <Icons.Close size={12} /> Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center space-y-12 py-20 w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="w-full space-y-8">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black tracking-tight">Reconciling...</h3>
                <span className="text-3xl font-black text-indigo-500 dark:text-indigo-400 font-mono drop-shadow-[0_0_10px_rgba(79,70,229,0.3)]">
                  {Math.round(progress)}%
                </span>
             </div>
             
             <div className="w-full h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/50 relative shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-700 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:30px_30px] animate-[progress-stripe_1s_linear_infinite]"></div>
                </div>
             </div>
          </div>

          <div className="text-left w-full bg-white/60 dark:bg-[#111827]/60 border border-slate-200 dark:border-slate-800/80 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-lg">
            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-5 transition-all duration-500 ${processStep >= idx ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${processStep > idx ? 'bg-green-500/20 text-green-600 dark:text-green-500 border border-green-500/30' : processStep === idx ? 'bg-indigo-600 text-white animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                    {processStep > idx ? <Icons.Check size={14} /> : idx + 1}
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${processStep === idx ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/40 px-6 py-2 rounded-full border border-slate-200 dark:border-slate-800/50">
            <Icons.Fast size={14} className="text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-70">Engine Optimized Analysis</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {results && !isProcessing && (
        <div className="w-full max-w-6xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b border-slate-200 dark:border-slate-800/50 pb-10 gap-6">
            <div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Reconciliation Report</h2>
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-bold tracking-wide uppercase opacity-90">{companyName}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">As At Date:</span>
                <span className="bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-500/30">
                  {asAtDate}
                </span>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setActiveTab('Dashboard')} 
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${activeTab === 'Dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('Detailed')} 
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${activeTab === 'Detailed' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Detailed Report
              </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'Dashboard' ? <Dashboard data={results} /> : <TransactionsTable data={results} />}
          </div>

          <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800/50 flex flex-wrap justify-center gap-6">
            <button onClick={() => setShowResetConfirm(true)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
              Reset Session
            </button>
            <button onClick={handleExportCSV} className="bg-sky-600 text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-sky-500 transition-all shadow-lg active:scale-95 border border-sky-400/20">
              <Icons.Download size={16} /> Export CSV
            </button>
            <button onClick={() => setShowExportModal(true)} className="bg-red-600 text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-red-500 transition-all shadow-lg active:scale-95 border border-red-400/20">
              <Icons.Download size={16} /> Export Branded PDF
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {results && (
        <ExportModal 
          isOpen={showExportModal} 
          onClose={() => setShowExportModal(false)} 
          data={results} 
          companyName={companyName} 
          asAtDate={asAtDate} 
        />
      )}

      {/* Confirmation Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Icons.Alert size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Reset Session?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              This will clear all uploaded files and current reconciliation results. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                Yes, Reset All
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Error */}
      {error && (
        <div className="fixed bottom-10 max-w-md w-full p-5 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 rounded-2xl text-red-900 dark:text-red-200 text-sm flex items-center gap-4 backdrop-blur-xl animate-in slide-in-from-bottom-10 z-[100] shadow-2xl">
          <Icons.Alert size={20} className="shrink-0 text-red-500 dark:text-red-400" />
          <p className="flex-1 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors">
            <Icons.Close size={18} />
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 60px 0; }
        }
      `}</style>
    </div>
  );
}

export default App;