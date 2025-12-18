
import React from 'react';
import { Recharts } from './ChartComponents'; 
import { ReconciliationResult } from '../types';

interface DashboardProps {
  data: ReconciliationResult;
}

const GH_CURRENCY = "GH¢";

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { summary, unmatchedBank, unmatchedLedger } = data;
  
  const formatValue = (val: number) => {
    return `${GH_CURRENCY}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  };

  const totalItems = summary.totalMatches + summary.totalUnmatchedBank + summary.totalUnmatchedLedger;
  
  const donutData = [
    { name: 'Matched', value: summary.totalMatches, color: '#10b981' },
    { name: 'Unmatched (Bank)', value: summary.totalUnmatchedBank, color: '#f97316' },
    { name: 'Unmatched (Ledger)', value: summary.totalUnmatchedLedger, color: '#eab308' },
  ];

  const barData = [
    { name: 'Matched', value: summary.matchedAmount, color: '#10b981' },
    { name: 'Bank', value: summary.unmatchedBankAmount, color: '#f97316' },
    { name: 'Ledger', value: summary.unmatchedLedgerAmount, color: '#eab308' },
  ];

  const allUnmatched = [
    ...unmatchedBank.map(t => ({ ...t, source: 'Bank' })),
    ...unmatchedLedger.map(t => ({ ...t, source: 'Ledger' }))
  ].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);

  const variance = (summary.bankStatementBalance || 0) - (summary.ledgerBalance || 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Metrics Row - 6 Cards as per image */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-[#1e293b]/40 border-l-[3px] border-green-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Matched</div>
          <div className="text-xl font-black text-white">{summary.totalMatches}</div>
        </div>
        <div className="bg-[#1e293b]/40 border-l-[3px] border-orange-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Unmatched (Bank)</div>
          <div className="text-xl font-black text-white">{summary.totalUnmatchedBank}</div>
        </div>
        <div className="bg-[#1e293b]/40 border-l-[3px] border-yellow-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Unmatched (Ledger)</div>
          <div className="text-xl font-black text-white">{summary.totalUnmatchedLedger}</div>
        </div>
        <div className="bg-[#1e293b]/40 border-l-[3px] border-green-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Matched Total</div>
          <div className="text-sm font-black text-white">{formatValue(summary.matchedAmount)}</div>
        </div>
        <div className="bg-[#1e293b]/40 border-l-[3px] border-orange-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Unmatched Bank</div>
          <div className="text-sm font-black text-white">{formatValue(summary.unmatchedBankAmount)}</div>
        </div>
        <div className="bg-[#1e293b]/40 border-l-[3px] border-yellow-500 p-3 rounded-r-lg border border-slate-800 shadow-sm">
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mb-1">Unmatched Ledger</div>
          <div className="text-sm font-black text-white">{formatValue(summary.unmatchedLedgerAmount)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Transaction Count Breakdown */}
        <div className="bg-[#111827]/60 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white text-center mb-5 uppercase tracking-widest">Transaction Count Breakdown</h3>
          <div className="h-48 w-full relative">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.PieChart>
                <Recharts.Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Recharts.Pie>
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white leading-none">{totalItems}</span>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Total Items</span>
            </div>
          </div>
        </div>

        {/* Total Amount Comparison */}
        <div className="bg-[#111827]/60 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white text-center mb-5 uppercase tracking-widest">Total Amount Comparison</h3>
          <div className="h-48 w-full">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Recharts.XAxis dataKey="name" hide />
                <Recharts.YAxis hide />
                <Recharts.Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={50}>
                  {barData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Recharts.LabelList 
                    dataKey="name" 
                    position="bottom" 
                    content={(props: any) => {
                        const { x, y, width, value } = props;
                        return (
                            <text x={x + width / 2} y={y + 15} fill="#64748b" textAnchor="middle" fontSize="9" fontWeight="bold" className="uppercase">
                                {value}
                            </text>
                        );
                    }}
                  />
                  <Recharts.LabelList 
                    dataKey="value" 
                    position="top" 
                    content={(props: any) => {
                        const { x, y, width, value } = props;
                        return (
                            <text x={x + width / 2} y={y - 8} fill="white" textAnchor="middle" fontSize="9" fontWeight="black">
                                {formatValue(value)}
                            </text>
                        );
                    }}
                  />
                </Recharts.Bar>
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Largest Unmatched Transactions */}
        <div className="bg-[#111827]/60 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white mb-5 uppercase tracking-widest">Top 5 Largest Unmatched Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] text-slate-500 font-black uppercase border-b border-slate-800">
                  <th className="px-1 py-2">Date</th>
                  <th className="px-1 py-2">Description</th>
                  <th className="px-1 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allUnmatched.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-1 py-3 text-[10px] font-bold text-indigo-400">{item.date}</td>
                    <td className="px-1 py-3 text-[10px] font-bold text-slate-300">{item.description}</td>
                    <td className="px-1 py-3 text-[10px] text-right font-black text-yellow-500 whitespace-nowrap">{formatValue(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closing Balances */}
        <div className="bg-[#111827]/60 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white text-center mb-6 uppercase tracking-widest">Closing Balances</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#1e293b]/40 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400">Bank Statement Balance</span>
              <span className="text-md font-black text-white">{formatValue(summary.bankStatementBalance || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#1e293b]/40 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400">General Ledger Balance</span>
              <span className="text-md font-black text-white">{formatValue(summary.ledgerBalance || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-red-950/20 rounded-lg border border-red-900/60 mt-3">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Total Variance</span>
              <span className="text-md font-black text-white">{formatValue(Math.abs(variance))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
