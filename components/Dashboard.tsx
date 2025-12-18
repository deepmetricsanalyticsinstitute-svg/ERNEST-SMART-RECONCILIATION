import React from 'react';
import { Components, Recharts } from './ChartComponents'; 
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

  const donutData = [
    { name: 'Matched', value: summary.totalMatches, color: '#10b981' },
    { name: 'Unmatched Bank', value: summary.totalUnmatchedBank, color: '#f59e0b' },
    { name: 'Unmatched Ledger', value: summary.totalUnmatchedLedger, color: '#f59e0b' },
  ];

  const totalItems = summary.totalMatches + summary.totalUnmatchedBank + summary.totalUnmatchedLedger;

  const barData = [
    { name: 'Matched', amount: summary.matchedAmount, color: '#10b981' },
    { name: 'Bank', amount: summary.unmatchedBankAmount, color: '#f59e0b' },
    { name: 'Ledger', amount: summary.unmatchedLedgerAmount, color: '#f59e0b' },
  ];

  const topUnmatched = [...unmatchedBank, ...unmatchedLedger]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const variance = (summary.bankStatementBalance || 0) - (summary.ledgerBalance || 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Matched', val: summary.totalMatches, color: 'border-green-500' },
          { label: 'Unmatched (Bank)', val: summary.totalUnmatchedBank, color: 'border-amber-500' },
          { label: 'Unmatched (Ledger)', val: summary.totalUnmatchedLedger, color: 'border-amber-500' },
          { label: 'Matched Total', val: formatValue(summary.matchedAmount), color: 'border-green-500' },
          { label: 'Unmatched Bank', val: formatValue(summary.unmatchedBankAmount), color: 'border-amber-500' },
          { label: 'Unmatched Ledger', val: formatValue(summary.unmatchedLedgerAmount), color: 'border-amber-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-[#1e293b]/40 border-l-4 ${stat.color} p-4 rounded-r-lg`}>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-lg font-bold text-white">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Count Breakdown */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-xl p-6">
          <h3 className="text-center text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Transaction Count Breakdown</h3>
          <div className="h-64 w-full relative">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.PieChart>
                <Recharts.Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Recharts.Pie>
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{totalItems}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Items</span>
            </div>
          </div>
        </div>

        {/* Total Amount Comparison */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-xl p-6">
          <h3 className="text-center text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Total Amount Comparison</h3>
          <div className="h-64 w-full">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Recharts.XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Recharts.Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Recharts.Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Recharts.LabelList dataKey="amount" position="top" content={(props: any) => {
                     const { x, y, width, value } = props;
                     return (
                        <g>
                           <text x={x + width / 2} y={y - 10} fill="#64748b" textAnchor="middle" fontSize="10" fontWeight="bold">
                              {formatValue(value)}
                           </text>
                        </g>
                     );
                  }} />
                </Recharts.Bar>
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Largest Unmatched */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Top 5 Largest Unmatched Transactions</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800">
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {topUnmatched.map((tx, idx) => (
                <tr key={idx} className="text-xs">
                  <td className="py-4 text-slate-500">{tx.date}</td>
                  <td className="py-4 text-indigo-400 font-medium">{tx.description}</td>
                  <td className="py-4 text-right text-amber-500 font-bold">{formatValue(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing Balances */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-center text-sm font-bold text-slate-300 mb-6 uppercase tracking-widest">Closing Balances</h3>
          
          <div className="bg-[#1e293b]/40 rounded-lg p-4 flex justify-between items-center border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Bank Statement Balance</span>
            <span className="text-sm font-bold text-white">{formatValue(summary.bankStatementBalance || 0)}</span>
          </div>

          <div className="bg-[#1e293b]/40 rounded-lg p-4 flex justify-between items-center border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">General Ledger Balance</span>
            <span className="text-sm font-bold text-white">{formatValue(summary.ledgerBalance || 0)}</span>
          </div>

          <div className="bg-red-500/10 rounded-lg p-4 flex justify-between items-center border border-red-500/30 mt-8">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Total Variance</span>
            <span className="text-lg font-bold text-white">{formatValue(Math.abs(variance))}</span>
          </div>
        </div>
      </div>
    </div>
  );
};