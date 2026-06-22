/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { DollarSign, Hash, Percent, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';

interface KPICardsProps {
  transactions: Transaction[];
  lastUpdatedStr?: string;
}

export default function KPICards({ transactions, lastUpdatedStr }: KPICardsProps) {
  // Ensure we operate strictly on "wait for payment" transactions
  const pendingTxs = transactions.filter(t => t.status.trim().toLowerCase() === 'wait for payment');
  
  // 1. Total Nominal Pending
  const totalNominalPending = pendingTxs.reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Jumlah Transaksi Pending
  const totalTransaksiPending = pendingTxs.length;

  // 3. Rata-rata Nominal
  const averageNominal = totalTransaksiPending > 0 ? (totalNominalPending / totalTransaksiPending) : 0;

  // 4. Nominal Terbesar
  const maxNominal = totalTransaksiPending > 0 ? Math.max(...pendingTxs.map(t => t.amount)) : 0;

  // 5. Nominal Terkecil
  const minNominal = totalTransaksiPending > 0 ? Math.min(...pendingTxs.map(t => t.amount)) : 0;

  // Format Helper to Indonesian Rupiah with commas (e.g., Rp 12,875,000)
  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(val));
    return `Rp ${formatted}`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 15 } }
  };

  const fallbackDate = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {/* Card 1: Total Nominal Pending */}
      <motion.div 
        variants={item}
        id="kpi-total-nominal"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-blue-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Nominal Pending</span>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/25 transition-all">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-lg font-extrabold tracking-tight text-white block truncate" title={formatIDR(totalNominalPending)}>
            {formatIDR(totalNominalPending)}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Sumber dana tunggu bayar aktif
          </p>
        </div>
      </motion.div>

      {/* Card 2: Jumlah Transaksi Pending */}
      <motion.div 
        variants={item}
        id="kpi-total-trx"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-amber-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaksi Pending</span>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/25 transition-all">
            <Hash className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-lg font-extrabold tracking-tight text-white block">
            {totalTransaksiPending} <span className="text-xs font-normal text-slate-300">Trx</span>
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Segera selesaikan pembayaran
          </p>
        </div>
      </motion.div>

      {/* Card 3: Rata-Rata Nominal */}
      <motion.div 
        variants={item}
        id="kpi-average-nominal"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-indigo-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Nominal</span>
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/25 transition-all">
            <Percent className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-lg font-extrabold tracking-tight text-white block truncate" title={formatIDR(averageNominal)}>
            {formatIDR(averageNominal)}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Rerata nilai penarikan operator
          </p>
        </div>
      </motion.div>

      {/* Card 4: Nominal Terbesar */}
      <motion.div 
        variants={item}
        id="kpi-max-nominal"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-emerald-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nominal Terbesar</span>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/25 transition-all">
            <ArrowUpRight className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-lg font-extrabold tracking-tight text-emerald-400 block truncate" title={formatIDR(maxNominal)}>
            {formatIDR(maxNominal)}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Limit teratas tunggu bayar
          </p>
        </div>
      </motion.div>

      {/* Card 5: Nominal Terkecil */}
      <motion.div 
        variants={item}
        id="kpi-min-nominal"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-rose-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nominal Terkecil</span>
          <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/25 transition-all">
            <ArrowDownRight className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-lg font-extrabold tracking-tight text-rose-400 block truncate" title={formatIDR(minNominal)}>
            {formatIDR(minNominal)}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Nilai penarikan terkecil
          </p>
        </div>
      </motion.div>

      {/* Card 6: Update Terakhir */}
      <motion.div 
        variants={item}
        id="kpi-last-updated"
        className="relative overflow-hidden rounded-2xl p-5 glass-card glass-card-hover group cursor-pointer border-l-4 border-l-cyan-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Update Terakhir</span>
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/25 transition-all">
            <RefreshCw className="h-4.5 w-4.5 animate-spin-slow" />
          </div>
        </div>
        <div className="mt-3">
          <span className="font-display text-sm font-extrabold text-cyan-400 block leading-tight pt-1">
            {lastUpdatedStr || fallbackDate}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            Siklus sinkron otomatis 60s
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
