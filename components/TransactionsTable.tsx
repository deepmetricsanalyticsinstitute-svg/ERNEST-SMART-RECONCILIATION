import React, { useState, useMemo } from 'react';
import { ReconciliationResult, ReconciledMatch, Transaction } from '../types';
import { Icons } from './Icons';
import { ChevronDown } from 'lucide-react';

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
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
        <div className="flex-1 relative w-full">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search description, date, or amount..." 
            className="w-full pl-10 pr-4 py-2 bg-[#1e293b]/40 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status:</span>
          <div className="relative">
            <select 
              className="appearance-none bg-[#1e293b]/40 border border-slate-700 rounded-lg pl-4 pr-10 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="matched">Matched</option>
              <option value="unmatched_bank">Unmatched Bank</option>
              <option value="unmatched_ledger">Unmatched Ledger</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Matched Transactions Section */}
      {showMatches && (
        <div className="bg-[#1e293b]/10 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800 bg-[#1e293b]/20">
            <ChevronDown size={16} className="text-green-500" />
            <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest">Matched Transactions ({data.matches.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800">
                  <th className="px-6 py-4">Bank Date</th>
                  <th className="px-6 py-4">Bank Description</th>
                  <th className="px-6 py-4">Ledger Date</th>
                  <th className="px-6 py-4">Ledger Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredMatches.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs text-white font-bold">{item.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-white font-bold">{item.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-right">{formatValue(item.amount, 'text-green-500')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched Bank Transactions Section */}
      {showBankUnmatched && (
        <div className="bg-[#1e293b]/10 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800 bg-[#1e293b]/20">
            <h3 className="text-sm font-bold text-orange-500 uppercase tracking-widest">Unmatched Bank Transactions ({data.unmatchedBank.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" className="rounded border-slate-700 bg-slate-800 checked:bg-indigo-600 focus:ring-indigo-500" readOnly />
                  </th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBankUnmatched.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-700 bg-slate-800 checked:bg-indigo-600 focus:ring-indigo-500" readOnly />
                    </td>
                    <td className="px-6 py-4 text-xs text-white font-bold">{item.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-right">{formatValue(item.amount, 'text-orange-500')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched Ledger Entries Section */}
      {showLedgerUnmatched && (
        <div className="bg-[#1e293b]/10 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800 bg-[#1e293b]/20">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Unmatched Ledger Entries ({data.unmatchedLedger.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" className="rounded border-slate-700 bg-slate-800 checked:bg-indigo-600 focus:ring-indigo-500" readOnly />
                  </th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredLedgerUnmatched.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-700 bg-slate-800 checked:bg-indigo-600 focus:ring-indigo-500" readOnly />
                    </td>
                    <td className="px-6 py-4 text-xs text-white font-bold">{item.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{item.description}</td>
                    <td className="px-6 py-4 text-xs text-right">{formatValue(item.amount, 'text-amber-500')}</td>
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