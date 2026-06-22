/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, FileText, Trash2, ClipboardCopy, Download, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';
import Logo from './Logo';

interface DashboardHeaderProps {
  onClearAll: () => void;
  onCopySummary: () => void;
  onExportCSV: () => void;
  hasData: boolean;
  
  // Auto-refresh properties
  onRefreshNow: () => void;
  isRefreshing: boolean;
  refreshCountdown: number;
  syncMode: 'simulation' | 'crawler' | 'simulation-fallback' | 'simulation-empty';
  lastUpdatedStr: string;
}

export default function DashboardHeader({
  onClearAll,
  onCopySummary,
  onExportCSV,
  hasData,
  onRefreshNow,
  isRefreshing,
  refreshCountdown,
  syncMode,
  lastUpdatedStr
}: DashboardHeaderProps) {
  
  const getBannerModeStyles = () => {
    switch(syncMode) {
      case 'crawler':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          label: 'API CONNECTED',
          icon: <CheckCircle className="h-3.5 w-3.5" />
        };
      case 'simulation-fallback':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          label: 'CRAWLER FALLBACK',
          icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
        };
      case 'simulation-empty':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          label: 'EMPTY WAIT FOR PAYMENT',
          icon: <Sparkles className="h-3.5 w-3.5" />
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          label: 'DATABASE DEMO SIMULASI',
          icon: <Sparkles className="h-3.5 w-3.5" />
        };
    }
  };

  const modeStyle = getBannerModeStyles();

  return (
    <header className="border-b border-white/10 bg-slate-950/60 sticky top-0 z-30 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Title and Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Logo />
            <div className="hidden sm:block h-8 w-px bg-slate-800" />
            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                DASHBOARD KALKULATOR WD PENDING
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                  Withdraw Operate Monitor
                </span>
                
                {/* Dynamically Styled Mode Badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${modeStyle.bg}`}>
                  {modeStyle.icon}
                  <span>{modeStyle.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons and Auto Refresh Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Auto Refresh Progress bar block */}
            <div className="flex items-center gap-2.5 bg-slate-900/85 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                Autosync:
              </span>
              <span className="font-mono font-extrabold text-[#F59E0B]">
                {refreshCountdown}s
              </span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${(refreshCountdown / 60) * 100}%` }}
                />
              </div>

              <button
                onClick={onRefreshNow}
                disabled={isRefreshing}
                id="btn-refresh-manual"
                className="ml-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                title="Refresh crawler data sekarang"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {hasData && (
              <>
                <button
                  onClick={onCopySummary}
                  id="btn-copy-summary"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/25 text-xs font-bold text-blue-400 px-3.5 py-2 transition-all cursor-pointer"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Salin Rekapan WA
                </button>

                <button
                  onClick={onExportCSV}
                  id="btn-export-csv"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-505/25 text-xs font-bold text-emerald-400 px-3.5 py-2 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Ekspor CSV
                </button>

                <button
                  onClick={onClearAll}
                  id="btn-clear-all"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 text-xs font-bold text-red-400 px-3.5 py-2 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Layar
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
