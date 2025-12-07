import React, { useState, useMemo } from 'react';
import { ReconciliationResult, ReconciledMatch, Transaction } from '../types';
import { Icons } from './Icons';

interface TransactionsTableProps {
  data: ReconciliationResult;
}

type TabType = 'matches' | 'unmatched_bank' | 'unmatched_gl';

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [filters, setFilters] = useState({
    description: '',
    date: '',
    amount: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const clearFilters = () => {
    setFilters({ description: '', date: '', amount: '' });
  };

  const filteredData = useMemo(() => {
    let sourceData: any[] = [];
    if (activeTab === 'matches') sourceData = data.matches;
    else if (activeTab === 'unmatched_bank') sourceData = data.unmatchedBank;
    else sourceData = data.unmatchedLedger;

    return sourceData.filter((item) => {
      // Description Filter (checks description, notes, refs)
      const searchTerm = filters.description.toLowerCase();
      const descriptionMatch = 
        item.description.toLowerCase().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
        (item.ref && item.ref.toLowerCase().includes(searchTerm)) ||
        (item.bankRef && item.bankRef.toLowerCase().includes(searchTerm)) ||
        (item.ledgerRef && item.ledgerRef.toLowerCase().includes(searchTerm));

      // Date Filter
      const dateMatch = item.date.includes(filters.date);

      // Amount Filter (strips commas from filter input for flexibility)
      const amountFilterClean = filters.amount.replace(/,/g, '');
      const amountMatch = amountFilterClean === '' || item.amount.toString().includes(amountFilterClean);

      return descriptionMatch && dateMatch && amountMatch;
    });
  }, [data, activeTab, filters]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === 'matches' ? 'bg-white text-brand-600 border-t-2 border-t-brand-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
          `}
        >
          <Icons.Check size={16} />
          Matches ({data.matches.length})
        </button>
        <button
          onClick={() => setActiveTab('unmatched_bank')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === 'unmatched_bank' ? 'bg-white text-red-600 border-t-2 border-t-red-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
          `}
        >
          <Icons.Alert size={16} />
          Unmatched Bank ({data.unmatchedBank.length})
        </button>
        <button
          onClick={() => setActiveTab('unmatched_gl')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === 'unmatched_gl' ? 'bg-white text-amber-600 border-t-2 border-t-amber-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
          `}
        >
          <Icons.Alert size={16} />
          Unmatched GL ({data.unmatchedLedger.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search description, reference, notes..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
            value={filters.description}
            onChange={(e) => setFilters({ ...filters, description: e.target.value })}
          />
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
             <input 
              type="text" 
              placeholder="Filter Date" 
              className="w-full md:w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="relative">
             <input 
              type="text" 
              placeholder="Filter Amount" 
              className="w-full md:w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
              value={filters.amount}
              onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
            />
          </div>
        </div>

        {(filters.description || filters.date || filters.amount) && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors px-2 py-1"
          >
            <Icons.Close size={16} />
            <span className="hidden md:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
              {activeTab === 'matches' && <th className="px-6 py-4">Notes</th>}
              {activeTab !== 'matches' && <th className="px-6 py-4">Ref</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'matches' && (filteredData as ReconciledMatch[]).map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.date}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{item.description}</td>
                <td className="px-6 py-4 text-sm text-right font-mono text-slate-700">{formatCurrency(item.amount)}</td>
                <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs">{item.notes || 'Exact match'}</td>
              </tr>
            ))}

            {activeTab === 'unmatched_bank' && (filteredData as Transaction[]).map((item, idx) => (
              <tr key={idx} className="hover:bg-red-50/30 transition-colors group">
                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.date}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                   {item.description}
                </td>
                <td className="px-6 py-4 text-sm text-right font-mono text-red-600 font-medium">{formatCurrency(item.amount)}</td>
                <td className="px-6 py-4 text-xs text-slate-400 font-mono">{item.ref || '-'}</td>
              </tr>
            ))}

            {activeTab === 'unmatched_gl' && (filteredData as Transaction[]).map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.date}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                   {item.description}
                </td>
                <td className="px-6 py-4 text-sm text-right font-mono text-amber-600 font-medium">{formatCurrency(item.amount)}</td>
                <td className="px-6 py-4 text-xs text-slate-400 font-mono">{item.ref || '-'}</td>
              </tr>
            ))}
            
            {/* Empty States */}
            {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center w-full">
                    <Icons.Search size={48} className="text-slate-200 mb-2" />
                    <p>No transactions found matching your filters.</p>
                  </td>
                </tr>
            )}
            {filteredData.length > 0 && activeTab === 'matches' && filteredData.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No matches found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};