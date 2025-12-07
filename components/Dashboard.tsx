import React from 'react';
import { Recharts, Components } from './ChartComponents'; // Helper for Recharts to keep file clean
import { ReconciliationResult } from '../types';
import { Icons } from './Icons';

interface DashboardProps {
  data: ReconciliationResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { summary } = data;
  
  const chartData = [
    { name: 'Matched', value: summary.totalMatches, color: '#22c55e' }, // Green
    { name: 'Unmatched Bank', value: summary.totalUnmatchedBank, color: '#ef4444' }, // Red
    { name: 'Unmatched GL', value: summary.totalUnmatchedLedger, color: '#f59e0b' }, // Amber
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center gap-3 text-slate-500 mb-2">
          <Icons.Reconcile size={20} />
          <span className="text-sm font-medium">Total Matches</span>
        </div>
        <div className="text-3xl font-bold text-slate-800">{summary.totalMatches}</div>
        <div className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
          <Icons.Check size={12} /> Verified pairs
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center gap-3 text-slate-500 mb-2">
           <Icons.Alert size={20} className="text-red-500" />
          <span className="text-sm font-medium">Unmatched (Bank)</span>
        </div>
        <div className="text-3xl font-bold text-slate-800">{summary.totalUnmatchedBank}</div>
        <div className="text-xs text-red-600 mt-2 font-medium">Requires attention</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center gap-3 text-slate-500 mb-2">
          <Icons.Alert size={20} className="text-amber-500" />
          <span className="text-sm font-medium">Unmatched (GL)</span>
        </div>
        <div className="text-3xl font-bold text-slate-800">{summary.totalUnmatchedLedger}</div>
        <div className="text-xs text-amber-600 mt-2 font-medium">Check receipts</div>
      </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center gap-3 text-slate-500 mb-2">
          <Icons.Chart size={20} />
          <span className="text-sm font-medium">Net Discrepancy</span>
        </div>
        <div className={`text-3xl font-bold ${summary.netDiscrepancy === 0 ? 'text-slate-800' : 'text-red-600'}`}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.netDiscrepancy)}
        </div>
         <div className="text-xs text-slate-400 mt-2">Total unresolved value</div>
      </div>
      
      {/* Chart Section - Spanning full width on mobile, 2 cols on large */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-2">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Reconciliation Status</h3>
        <div className="h-64 w-full">
            <Components.SimplePieChart data={chartData} />
        </div>
      </div>
    </div>
  );
};
