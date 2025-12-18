
import React, { useState, useMemo } from 'react';
import { ReconciliationResult, ReconciledMatch, Transaction } from '../types';
import { Icons } from './Icons';
import { ChevronDown, Info } from 'lucide-react';

interface TransactionsTableProps {
  data: ReconciliationResult;
}

const GH_CURRENCY = "GH¢";

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatValue = (val: number, colorClass: string) => {
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    return <span className={`font-bold ${colorClass}`}>{GH_CURRENCY}{formatted}</span>;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (score >= 70) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  const filteredMatches = useMemo(() => {
    return data.matches.filter(m => 
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.date.includes(searchTerm) ||
      m.amount.toString().includes(searchTerm)
    );
  }, [data.matches, searchTerm]);

  const filteredBankUnmatched = useMemo(() => {
    return data.unmatchedBank.filter(m => 
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.date.includes(searchTerm) ||
      m.amount.toString().includes(searchTerm)
    );
  }, [data.unmatchedBank, searchTerm]);

  const filteredLedgerUnmatched = useMemo(() => {
    return data.unmatchedLedger.filter(m => 
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.date.includes(searchTerm) ||
      m.amount.toString().includes(searchTerm)
    );
  }, [data.unmatchedLedger, searchTerm]);

  const showMatches = statusFilter === 'all' || statusFilter === 'matched';
  const showBankUnmatched = statusFilter === 'all' || statusFilter === 'unmatched_bank';
  const showLedgerUnmatched = statusFilter === 'all' || statusFilter === 'unmatched_ledger';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
        <div className="flex-1 relative w-full">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full pl-10 pr-4 py-3 bg-white/5 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Filter:</span>
          <div className="relative">
            <select 
              className="appearance-none bg-white/5 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Records</option>
              <option value="matched">Matches Only</option>
              <option value="unmatched_bank">Unmatched Bank</option>
              <option value="unmatched_ledger">Unmatched Ledger</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {showMatches && (
        <div className="bg-white/30 dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-green-500/5">
            <div className="flex items-center gap-3">
              <Icons.Check size={18} className="text-green-500" />
              <h3 className="text-sm font-black text-green-600 dark:text-green-500 uppercase tracking-widest">Reconciled Matches ({data.matches.length})</h3>
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">Audit Verified</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-black uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredMatches.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{item.description}</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">{item.date}</span>
                          {item.bankRef && <span className="opacity-60">Ref: {item.bankRef}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getConfidenceColor(item.matchConfidence)}`}>
                           {item.matchConfidence}% Match
                         </span>
                         {item.notes && (
                           <div className="group/note relative">
                             <Info size={14} className="text-slate-400 cursor-help" />
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                               {item.notes}
                             </div>
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-right whitespace-nowrap">{formatValue(item.amount, 'text-green-600 dark:text-green-400')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBankUnmatched && (
        <div className="bg-white/30 dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mt-8">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-orange-500/5">
            <div className="flex items-center gap-3">
              <Icons.Alert size={18} className="text-orange-500" />
              <h3 className="text-sm font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">Unmatched Bank Items ({data.unmatchedBank.length})</h3>
            </div>
            <span className="text-[10px] text-orange-600/70 font-bold uppercase tracking-widest">Missing from Ledger</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-black uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statement Narrative</th>
                  <th className="px-6 py-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredBankUnmatched.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{item.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-right whitespace-nowrap">{formatValue(item.amount, 'text-orange-600 dark:text-orange-400')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showLedgerUnmatched && (
        <div className="bg-white/30 dark:bg-[#1e293b]/10 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mt-8">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-indigo-500/5">
            <div className="flex items-center gap-3">
              <Icons.Alert size={18} className="text-indigo-500" />
              <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest">Unmatched Ledger Entries ({data.unmatchedLedger.length})</h3>
            </div>
            <span className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-widest">Uncleared Items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-black uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">General Ledger Reference</th>
                  <th className="px-6 py-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLedgerUnmatched.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{item.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-right whitespace-nowrap">{formatValue(item.amount, 'text-indigo-600 dark:text-indigo-400')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
