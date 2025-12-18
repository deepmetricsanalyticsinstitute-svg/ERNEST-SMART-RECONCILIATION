import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { ReconciliationResult } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, CheckSquare, Square, Edit3 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReconciliationResult;
  companyName: string;
  asAtDate: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data, companyName, asAtDate }) => {
  // Local state for PDF-specific header info
  const [pdfCompanyName, setPdfCompanyName] = useState(companyName);
  const [pdfAsAtDate, setPdfAsAtDate] = useState(asAtDate);

  const [sections, setSections] = useState({
    summary: true,
    matches: true,
    unmatchedBank: true,
    unmatchedLedger: true
  });
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: asAtDate,
    transactionType: 'all'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  const filterList = <T extends { date: string; amount: number }>(list: T[]): T[] => {
    return list.filter(item => {
      const dateInRange = (!filters.startDate || item.date >= filters.startDate) &&
                         (!filters.endDate || item.date <= filters.endDate);
      
      let typeMatch = true;
      if (filters.transactionType === 'inflow') typeMatch = item.amount > 0;
      else if (filters.transactionType === 'outflow') typeMatch = item.amount < 0;

      return dateInRange && typeMatch;
    });
  };

  const filteredMatches = useMemo(() => filterList(data.matches), [data.matches, filters]);
  const filteredUnmatchedBank = useMemo(() => filterList(data.unmatchedBank), [data.unmatchedBank, filters]);
  const filteredUnmatchedLedger = useMemo(() => filterList(data.unmatchedLedger), [data.unmatchedLedger, filters]);

  const allSelected = Object.values(sections).every(Boolean);
  const toggleAll = () => {
    const newState = !allSelected;
    setSections({
      summary: newState,
      matches: newState,
      unmatchedBank: newState,
      unmatchedLedger: newState
    });
  };

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(5);
    setExportStatus('Analyzing reconciliation data...');

    // Simulate progress steps for a better UX
    const runTask = (progress: number, status: string, delay: number) => 
      new Promise(resolve => setTimeout(() => {
        setExportProgress(progress);
        setExportStatus(status);
        resolve(true);
      }, delay));

    await runTask(25, 'Formatting statement tables...', 600);
    await runTask(50, 'Generating report pages...', 800);
    await runTask(75, 'Applying brand styling...', 500);
    await runTask(90, 'Finalizing PDF output...', 400);

    setTimeout(() => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        
        const brandBlue = [26, 35, 126];
        const matchGreen = [16, 185, 129];
        const bankOrange = [245, 158, 11];
        const ledgerPurple = [99, 102, 241];
        const summaryDark = [30, 41, 59];

        const formatGHS = (val: number) => {
          return `GHS ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(val)}`;
        };

        const now = new Date();
        const genDate = now.toLocaleDateString('en-GB');
        const genTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        const fullGenTimestamp = `${genDate}, ${genTime}`;

        const drawHeader = () => {
          doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
          doc.rect(0, 0, pageWidth, 42, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(28);
          doc.text("Reconciliation Report", margin, 24);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(14);
          doc.text(`${pdfCompanyName} - As At ${pdfAsAtDate}`, margin, 34);

          doc.setFontSize(8);
          doc.text("Classification: Protected", pageWidth - margin, 18, { align: 'right' });
          doc.text(`Generated: ${fullGenTimestamp}`, pageWidth - margin, 24, { align: 'right' });
        };

        const addFooter = (currentPage: number, totalPages: number) => {
          doc.setPage(currentPage);
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
          
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          const footerY = pageHeight - 10;
          doc.text(`${pdfCompanyName} | Reconciliation Report Pro   Page ${currentPage} of ${totalPages}`, margin, footerY);
          doc.text(`Export Date: ${genDate}`, pageWidth - margin, footerY, { align: 'right' });
        };

        drawHeader();
        let currentY = 55;

        if (sections.summary) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text("1. Executive Summary", margin, currentY);
          currentY += 8;

          const summaryRows = [
            ["Successfully Matched", filteredMatches.length.toString(), formatGHS(filteredMatches.reduce((acc, m) => acc + m.amount, 0))],
            ["Outstanding Bank Items", filteredUnmatchedBank.length.toString(), formatGHS(filteredUnmatchedBank.reduce((acc, m) => acc + m.amount, 0))],
            ["Outstanding Ledger Items", filteredUnmatchedLedger.length.toString(), formatGHS(filteredUnmatchedLedger.reduce((acc, m) => acc + m.amount, 0))]
          ];

          autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Transaction Count', 'Net Value (GHS)']],
            body: summaryRows,
            theme: 'grid',
            headStyles: { fillColor: summaryDark, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 
              1: { halign: 'center' },
              2: { halign: 'right', fontStyle: 'bold' } 
            },
            styles: { fontSize: 10, cellPadding: 5 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        if (sections.matches && filteredMatches.length > 0) {
          if (currentY > pageHeight - 40) { doc.addPage(); drawHeader(); currentY = 55; }
          doc.setFontSize(14);
          doc.setTextColor(matchGreen[0], matchGreen[1], matchGreen[2]);
          doc.text(`2. Verified Matches (${filteredMatches.length})`, margin, currentY);
          currentY += 8;

          autoTable(doc, {
            startY: currentY,
            head: [['Bank Date', 'Statement Narrative', 'Ledger Date', 'Internal Reference', 'Amount']],
            body: filteredMatches.map(m => [m.date, m.description, m.date, m.description, formatGHS(m.amount)]),
            theme: 'grid',
            headStyles: { fillColor: matchGreen, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
            styles: { fontSize: 8, cellPadding: 4 },
            margin: { top: 45 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        if (sections.unmatchedBank && filteredUnmatchedBank.length > 0) {
          if (currentY > pageHeight - 40) { doc.addPage(); drawHeader(); currentY = 55; }
          doc.setFontSize(14);
          doc.setTextColor(bankOrange[0], bankOrange[1], bankOrange[2]);
          doc.text(`3. Unmatched Bank Statement Items (${filteredUnmatchedBank.length})`, margin, currentY);
          currentY += 8;

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Transaction Description', 'Value']],
            body: filteredUnmatchedBank.map(m => [m.date, m.description, formatGHS(m.amount)]),
            theme: 'grid',
            headStyles: { fillColor: bankOrange, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
            styles: { fontSize: 8, cellPadding: 4 },
            margin: { top: 45 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        if (sections.unmatchedLedger && filteredUnmatchedLedger.length > 0) {
          if (currentY > pageHeight - 40) { doc.addPage(); drawHeader(); currentY = 55; }
          doc.setFontSize(14);
          doc.setTextColor(ledgerPurple[0], ledgerPurple[1], ledgerPurple[2]);
          doc.text(`4. Unmatched Internal Ledger Entries (${filteredUnmatchedLedger.length})`, margin, currentY);
          currentY += 8;

          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'General Ledger Description', 'Value']],
            body: filteredUnmatchedLedger.map(m => [m.date, m.description, formatGHS(m.amount)]),
            theme: 'grid',
            headStyles: { fillColor: ledgerPurple, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
            styles: { fontSize: 8, cellPadding: 4 },
            margin: { top: 45 }
          });
        }

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          addFooter(i, totalPages);
        }

        const fileName = `Reconciliation_Report_${pdfCompanyName.replace(/\s+/g, '_')}_${now.getTime()}.pdf`;
        doc.save(fileName);
        
        setExportProgress(100);
        setExportStatus('Download successful!');
        setTimeout(() => onClose(), 800);

      } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to generate PDF. Check console for details.");
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <Icons.Pdf size={18} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-sm tracking-tight">PDF Export Configuration</h3>
          </div>
          <button onClick={onClose} disabled={isExporting} className="text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Icons.Close size={20} />
          </button>
        </div>
        
        <div className="relative">
          <div className={`p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-white transition-opacity duration-300 ${isExporting ? 'opacity-20 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
            
            {/* Report Header Customization */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Edit3 size={10} className="text-indigo-400" />
                Report Header Customization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Report Company Name</label>
                  <input 
                    type="text" 
                    value={pdfCompanyName}
                    onChange={(e) => setPdfCompanyName(e.target.value)}
                    placeholder="Enter company name..."
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Report 'As At' Date</label>
                  <input 
                    type="text" 
                    value={pdfAsAtDate}
                    onChange={(e) => setPdfAsAtDate(e.target.value)}
                    placeholder="e.g. 18/12/2025"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Section Selection */}
            <section className="pt-4 border-t border-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Report Sections</h4>
                <button 
                  onClick={toggleAll}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                >
                  {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'summary', label: 'Summary', count: 1, color: 'text-indigo-400' },
                  { id: 'matches', label: 'Matches', count: filteredMatches.length, color: 'text-green-400' },
                  { id: 'unmatchedBank', label: 'Bank Unmatched', count: filteredUnmatchedBank.length, color: 'text-orange-400' },
                  { id: 'unmatchedLedger', label: 'Ledger Unmatched', count: filteredUnmatchedLedger.length, color: 'text-amber-400' }
                ].map(opt => (
                  <label key={opt.id} className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer group ${ (sections as any)[opt.id] ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_-5px_rgba(79,70,229,0.4)]' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${ (sections as any)[opt.id] ? opt.color : 'text-slate-400'}`}>{opt.label}</span>
                      <input
                        type="checkbox"
                        checked={(sections as any)[opt.id]}
                        onChange={() => setSections(prev => ({ ...prev, [opt.id]: !(prev as any)[opt.id] }))}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {(sections as any)[opt.id] ? `${opt.count} item${opt.count !== 1 ? 's' : ''} included` : 'Excluded'}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Data Filtering */}
            <section className="space-y-4 pt-4 border-t border-slate-800/50">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Refine Export Content</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Transaction Start Date</label>
                  <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Transaction End Date</label>
                  <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Transaction Category Filter</label>
                <div className="relative">
                  <select 
                    value={filters.transactionType}
                    onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                    className="w-full appearance-none bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Inflows & Outflows</option>
                    <option value="inflow">Inflows (Deposits) Only</option>
                    <option value="outflow">Outflows (Payments) Only</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                </div>
              </div>
            </section>
          </div>

          {/* Exporting Overlay with Progress Indicator */}
          {isExporting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-transparent animate-in fade-in duration-300">
              <div className="bg-[#1e293b]/95 border border-indigo-500/30 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-[320px] w-full relative overflow-hidden">
                {/* Progress Ring Glow */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/10 blur-[50px] pointer-events-none"></div>
                
                <div className="bg-indigo-600/20 p-5 rounded-3xl border border-indigo-500/30 relative">
                  <Icons.Loader size={36} className="text-indigo-400 animate-spin" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                </div>
                
                <div className="w-full space-y-4">
                  <div>
                    <h5 className="text-white font-black text-xl mb-1 tracking-tight">Exporting Report</h5>
                    <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest min-h-[14px]">
                      {exportStatus}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        style={{ width: `${exportProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Status</span>
                      <span className="text-white">{exportProgress}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic opacity-80">
                  Compiling high-resolution PDF assets for {pdfCompanyName}...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0f172a] border-t border-slate-800 flex gap-3">
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors disabled:opacity-0 pointer-events-auto"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting || !Object.values(sections).some(Boolean)}
            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 overflow-hidden 
              ${isExporting 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600'
              }`}
          >
            {isExporting ? (
              <>
                <Icons.Loader size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Icons.Download size={14} />
                <span>Download Branded Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
