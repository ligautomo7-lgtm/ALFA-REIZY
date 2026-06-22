/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Layers, Calendar, AlertCircle, BarChart3, PieChartIcon } from 'lucide-react';
import { Transaction } from '../types';

interface AnalyticsChartsProps {
  transactions: Transaction[];
}

export default function AnalyticsCharts({ transactions }: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<'bank' | 'timeline' | 'status'>('bank');

  // Filter for only "wait for payment" transactions
  const pendingTxs = transactions.filter(t => t.status.trim().toLowerCase() === 'wait for payment');

  if (pendingTxs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 mt-6 border border-white/5 bg-slate-950/40 text-center">
        <p className="text-xs text-slate-400">Tidak ada data untuk diagram visualisasi.</p>
      </div>
    );
  }

  // 1. Prepare Bank Data
  const bankDataMap: Record<string, { name: string; volume: number; count: number }> = {};
  pendingTxs.forEach(t => {
    const bank = t.paymentMethod || 'Lainnya';
    if (!bankDataMap[bank]) {
      bankDataMap[bank] = { name: bank, volume: 0, count: 0 };
    }
    bankDataMap[bank].volume += t.amount;
    bankDataMap[bank].count += 1;
  });
  const bankData = Object.values(bankDataMap).sort((a, b) => b.volume - a.volume);

  // 2. Prepare Timeline (Date) Data
  const timelineMap: Record<string, { date: string; volume: number; count: number }> = {};
  pendingTxs.forEach(t => {
    // Extract YYYY-MM-DD
    const dateStr = (t.dateTime || '').split(' ')[0] || 'Unknown';
    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { date: dateStr, volume: 0, count: 0 };
    }
    timelineMap[dateStr].volume += t.amount;
    timelineMap[dateStr].count += 1;
  });
  const timelineData = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Prepare Status Data (In wait_for_payment it's all "wait for payment")
  const statusMap: Record<string, { status: string; count: number; volume: number }> = {};
  pendingTxs.forEach(t => {
    const status = t.status || 'Wait for Payment';
    if (!statusMap[status]) {
      statusMap[status] = { status, count: 0, volume: 0 };
    }
    statusMap[status].count += 1;
    statusMap[status].volume += t.amount;
  });
  const statusData = Object.values(statusMap);

  // Styling properties & Colors suited for premium cyberpunk dark dashboard
  const COLORS = ['#3b82f6', '#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
  const STATUS_COLORS: Record<string, string> = {
    'wait for payment': '#f59e0b',
    'pending': '#f59e0b',
    'success': '#10b981',
    'paid': '#10b981',
    'failed': '#ef4444',
  };

  const getStatusColor = (status: string, idx: number) => {
    const s = status.toLowerCase();
    for (const key in STATUS_COLORS) {
      if (s.includes(key)) return STATUS_COLORS[key];
    }
    return COLORS[idx % COLORS.length];
  };

  const formatIDR = (val: number) => {
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(absVal));
    return `Rp ${formatted}`;
  };

  // Custom tooltips
  const formatTooltipIDR = (val: any) => {
    return [
      formatIDR(Number(val)),
      'Nominal Pending'
    ];
  };

  const formatTooltipCount = (val: any) => {
    return [ `${val} transaksi`, 'Jumlah' ];
  };

  return (
    <div id="analytics-charts-card" className="glass-card rounded-2xl p-6 mt-6 border border-white/10 [0_0_20px_rgba(37,99,235,0.05)] bg-slate-950/40">
      
      {/* Header and Toggles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-5">
        <div>
          <h3 className="font-display text-base font-extrabold text-white">Visualisasi Grafik Pending</h3>
          <p className="text-xs text-slate-400 mt-1">Distribusi penarikan bedasarkan saluran bayar bank dan deret tren waktu</p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Saluran Bank
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Tren Harian
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Status Bayar
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full pt-6">
        {activeTab === 'bank' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bankData}
              margin={{ top: 10, right: 10, left: 15, bottom: 20 }}
            >
              <defs>
                <linearGradient id="bankGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.95}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.15}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('en-US')}k`}
              />
              <Tooltip 
                formatter={formatTooltipIDR}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
              />
              <Bar 
                dataKey="volume" 
                name="Volume Pending (Rp)" 
                fill="url(#bankGrad)" 
                radius={[6, 6, 0, 0]}
                maxBarSize={55}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
            >
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('en-US')}k`}
              />
              <Tooltip 
                formatter={formatTooltipIDR}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                name="Total Nominal" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#timeGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'status' && (
          <div className="flex flex-col md:flex-row h-full items-center justify-around gap-6">
            <div className="w-full md:w-1/2 h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status, index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltipCount} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Legends Table */}
            <div className="w-full md:w-1/2 max-h-full overflow-y-auto pr-2">
              <span className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wider">Metrik Status Pembayaran</span>
              <div className="space-y-2.5">
                {statusData.map((entry, idx) => {
                  const color = getStatusColor(entry.status, idx);
                  const share = ((entry.count / pendingTxs.length) * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-md" style={{ backgroundColor: color }} />
                        <span className="font-bold text-slate-200 capitalize">{entry.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-100 block">{entry.count} Transaksi ({share}%)</span>
                        <span className="text-[#F59E0B] font-mono text-[10px] font-bold">
                          {formatIDR(entry.volume)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
