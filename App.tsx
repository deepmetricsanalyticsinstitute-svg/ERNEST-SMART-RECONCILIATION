import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { TransactionsTable } from './components/TransactionsTable';
import { reconcileDocuments } from './services/geminiService';
import { ReconciliationResult, FileData } from './types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [bankFile, setBankFile] = useState<FileData | null>(null);
  const [ledgerFile, setLedgerFile] = useState<FileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'precise'>('precise');

  const handleBankUpload = (file: File, content: string, type: 'pdf' | 'csv') => {
    setBankFile({ file, content, type });
    setError(null);
  };

  const handleLedgerUpload = (file: File, content: string, type: 'pdf' | 'csv') => {
    setLedgerFile({ file, content, type });
    setError(null);
  };

  const handleReconcile = async () => {
    if (!bankFile || !ledgerFile) return;

    setIsProcessing(true);
    setLoadingStep('Initializing Gemini AI...');
    setError(null);

    try {
      // Simulate steps for better UX since API call might be long
      setTimeout(() => setLoadingStep('Extracting transaction data...'), 1500);
      setTimeout(() => setLoadingStep(analysisMode === 'precise' ? 'Deep reasoning analysis...' : 'Fast matching algorithm...'), 3000);
      setTimeout(() => setLoadingStep('Reconciling final report...'), 6000);

      const data = await reconcileDocuments(bankFile, ledgerFile, analysisMode);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to reconcile documents. Please check the file formats and try again.");
    } finally {
      setIsProcessing(false);
      setLoadingStep('');
    }
  };

  const handleExportPDF = () => {
    if (!results) return;

    const doc = new jsPDF();
    const { summary, matches, unmatchedBank, unmatchedLedger } = results;

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Reconciliation Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Summary", 14, 40);

    const summaryData = [
        ["Total Matches", summary.totalMatches.toString()],
        ["Unmatched (Bank)", summary.totalUnmatchedBank.toString()],
        ["Unmatched (GL)", summary.totalUnmatchedLedger.toString()],
        ["Net Discrepancy", formatCurrency(summary.netDiscrepancy)]
    ];

    autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Brand blue
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { cellWidth: 40 }
        }
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY || 45;

    // Matches
    if (matches.length > 0) {
        finalY += 15;
        doc.setFontSize(14);
        doc.text(`Matched Transactions (${matches.length})`, 14, finalY);
        
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date', 'Description', 'Amount', 'Notes']],
            body: matches.map(m => [
                m.date,
                m.description,
                formatCurrency(m.amount),
                m.notes
            ]),
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] }, // Green
            styles: { fontSize: 8 },
        });
        // @ts-ignore
        finalY = doc.lastAutoTable.finalY;
    }

    // Unmatched Bank
    if (unmatchedBank.length > 0) {
         finalY += 15;
         if (finalY > 250) { doc.addPage(); finalY = 20; }

        doc.setFontSize(14);
        doc.text(`Unmatched Bank Transactions (${unmatchedBank.length})`, 14, finalY);
        
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date', 'Description', 'Amount', 'Ref']],
            body: unmatchedBank.map(m => [
                m.date,
                m.description,
                formatCurrency(m.amount),
                m.ref || '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] }, // Red
            styles: { fontSize: 8 },
        });
        // @ts-ignore
        finalY = doc.lastAutoTable.finalY;
    }

    // Unmatched GL
    if (unmatchedLedger.length > 0) {
         finalY += 15;
         if (finalY > 250) { doc.addPage(); finalY = 20; }

        doc.setFontSize(14);
        doc.text(`Unmatched GL Transactions (${unmatchedLedger.length})`, 14, finalY);
        
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date', 'Description', 'Amount', 'Ref']],
            body: unmatchedLedger.map(m => [
                m.date,
                m.description,
                formatCurrency(m.amount),
                m.ref || '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] }, // Amber
            styles: { fontSize: 8 },
        });
    }

    doc.save('Reconciliation_Report.pdf');
  };

  const handleExportCSV = () => {
    if (!results) return;

    const { summary, matches, unmatchedBank, unmatchedLedger } = results;
    
    const rows: string[] = [];

    // Helper to escape CSV fields
    const escape = (field: string | number | undefined) => {
        if (field === undefined || field === null) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    // Header
    rows.push(`Reconciliation Report`);
    rows.push(`Generated on ${new Date().toLocaleDateString()}`);
    rows.push(''); 

    // Summary
    rows.push('Summary');
    rows.push('Metric,Value');
    rows.push(`Total Matches,${summary.totalMatches}`);
    rows.push(`Unmatched (Bank),${summary.totalUnmatchedBank}`);
    rows.push(`Unmatched (GL),${summary.totalUnmatchedLedger}`);
    rows.push(`Net Discrepancy,${summary.netDiscrepancy}`);
    rows.push('');

    // Matches
    if (matches.length > 0) {
        rows.push(`Matched Transactions (${matches.length})`);
        rows.push('Date,Description,Amount,Notes,Bank Ref,Ledger Ref');
        matches.forEach(m => {
            rows.push(`${escape(m.date)},${escape(m.description)},${m.amount},${escape(m.notes)},${escape(m.bankRef)},${escape(m.ledgerRef)}`);
        });
        rows.push('');
    }

    // Unmatched Bank
    if (unmatchedBank.length > 0) {
        rows.push(`Unmatched Bank Transactions (${unmatchedBank.length})`);
        rows.push('Date,Description,Amount,Ref');
        unmatchedBank.forEach(m => {
            rows.push(`${escape(m.date)},${escape(m.description)},${m.amount},${escape(m.ref)}`);
        });
        rows.push('');
    }

    // Unmatched Ledger
    if (unmatchedLedger.length > 0) {
        rows.push(`Unmatched GL Transactions (${unmatchedLedger.length})`);
        rows.push('Date,Description,Amount,Ref');
        unmatchedLedger.forEach(m => {
            rows.push(`${escape(m.date)},${escape(m.description)},${m.amount},${escape(m.ref)}`);
        });
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Reconciliation_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setBankFile(null);
    setLedgerFile(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <Icons.Reconcile size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
              ERNEST SMART RECONCILIATION
            </h1>
          </div>
          {results && (
            <button 
                onClick={reset}
                className="text-sm font-medium text-slate-500 hover:text-brand-600 flex items-center gap-2 transition-colors"
            >
                <Icons.Refresh size={16} /> Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section (only if no results and not processing) */}
        {!results && !isProcessing && (
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Automated Financial Reconciliation
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Upload your Bank Statement and General Ledger (PDF or CSV). 
              Our AI will extract, analyze, and match transactions instantly.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!results && (
          <div className={`transition-all duration-500 ${isProcessing ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
                <FileUpload 
                  label="Upload Bank Statement" 
                  accept=".pdf, .csv" 
                  onFileSelect={handleBankUpload} 
                  fileData={bankFile} 
                />
                <FileUpload 
                  label="Upload General Ledger" 
                  accept=".pdf, .csv" 
                  onFileSelect={handleLedgerUpload} 
                  fileData={ledgerFile} 
                />
             </div>

             <div className="flex flex-col items-center gap-6">
                
                {/* Analysis Mode Toggle */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  <button
                    onClick={() => setAnalysisMode('fast')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${analysisMode === 'fast' 
                        ? 'bg-amber-100 text-amber-700 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50'}
                    `}
                  >
                    <Icons.Fast size={18} />
                    <span>Turbo Reconciliation</span>
                  </button>
                  <button
                    onClick={() => setAnalysisMode('precise')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${analysisMode === 'precise' 
                        ? 'bg-brand-100 text-brand-700 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50'}
                    `}
                  >
                    <Icons.Smart size={18} />
                    <span>Deep Analysis</span>
                  </button>
                </div>

                <button
                  onClick={handleReconcile}
                  disabled={!bankFile || !ledgerFile}
                  className={`
                    group relative px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                    ${bankFile && ledgerFile 
                      ? 'bg-brand-600 text-white hover:bg-brand-700' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  <span className="flex items-center gap-3">
                     Reconcile Documents <Icons.Reconcile size={20} className={bankFile && ledgerFile ? 'group-hover:rotate-180 transition-transform duration-500' : ''} />
                  </span>
                </button>
                
                <p className="text-xs text-slate-400 max-w-md text-center">
                  {analysisMode === 'fast' 
                    ? "Turbo Mode matches clear transactions instantly using high-speed models." 
                    : "Deep Analysis uses advanced reasoning to identify complex fuzzy matches and anomalies."}
                </p>
             </div>
          </div>
        )}

        {/* Loading State Overlay */}
        {isProcessing && (
           <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full text-center">
                 <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    {analysisMode === 'precise' ? (
                       <Icons.Smart className="absolute inset-0 m-auto text-brand-600 animate-pulse" size={24} />
                    ) : (
                       <Icons.Fast className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={24} />
                    )}
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Data</h3>
                 <p className="text-slate-500 text-sm animate-pulse">{loadingStep}</p>
              </div>
           </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <Icons.Alert className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-800">Reconciliation Error</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results View */}
        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-8 flex items-end justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">Reconciliation Report</h2>
                   <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                        <Icons.Pdf size={16} /> Export PDF
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Icons.Csv size={16} /> Export CSV
                    </button>
                </div>
             </div>
             
             <Dashboard data={results} />
             <TransactionsTable data={results} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;