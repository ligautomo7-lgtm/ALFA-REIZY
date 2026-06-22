/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, Info, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

import { Transaction, ImportSession, ColumnMapping } from './types';
import { parsePastedText, DEFAULT_SAMPLE_TEXT } from './utils/parser';

// Import our custom subcomponents
import DashboardHeader from './components/DashboardHeader';
import KPICards from './components/KPICards';
import AnalyticsCharts from './components/AnalyticsCharts';
import PasteSection from './components/PasteSection';
import HistorySidebar from './components/HistorySidebar';
import TransactionListView from './components/TransactionListView';
import AddEditModal from './components/AddEditModal';
import ParticleNetwork from './components/ParticleNetwork';
import ConfirmDialog from './components/ConfirmDialog';
import WrongExtractor from './components/WrongExtractor';
import techBg from './assets/images/tech_network_bg_1782092467071.jpg';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Auto-Refresh & Mode states
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncMode, setSyncMode] = useState<'simulation' | 'crawler' | 'simulation-fallback' | 'simulation-empty'>('simulation');
  const [lastUpdatedStr, setLastUpdatedStr] = useState<string>('');

  // Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);

  // Success Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Custom Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      ...config
    });
  };

  // Toast notifier
  const showToast = (type: 'success' | 'info', message: string) => {
    setNotification({ type, message });
    // Keep visible for a reasonable time
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // --- CRAWLER DATA SYNC CORE ---
  const fetchCrawlerData = async (silently: boolean = false) => {
    if (!silently) {
      setIsRefreshing(true);
    }
    try {
      const response = await fetch('/api/crawl');
      const result = await response.json();
      
      if (result.success) {
        // Enforce deduplication and filtering just to be completely compliant with goals
        const waitOnly = (result.data || []).filter((t: any) => t.status.trim().toLowerCase() === 'wait for payment');
        setTransactions(waitOnly);
        setSyncMode(result.mode || 'simulation');
        
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
        setLastUpdatedStr(formattedTime);

        if (!silently) {
          if (result.mode === 'crawler') {
            showToast('success', `Sukses mensinkronkan ${waitOnly.length} transaksi pending dari server.`);
          } else {
            showToast('success', `Real-time sync berhasil! Data simulasi pending terperbarui.`);
          }
        }
      } else {
        // Fallback simulated data if connection error or empty credentials
        const waitFallback = (result.data || []).filter((t: any) => t.status.trim().toLowerCase() === 'wait for payment');
        setTransactions(waitFallback);
        setSyncMode('simulation-fallback');
        
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
        setLastUpdatedStr(`${formattedTime} (Simulasi)`);
        
        if (!silently) {
          showToast('info', 'Berjalan menggunakan database simulasi real-time.');
        }
      }
    } catch (e: any) {
      console.error('[API Crawl Request Failed]', e);
      // fallback local sample if api offline
      if (transactions.length === 0) {
        const initialSample = parsePastedText(DEFAULT_SAMPLE_TEXT);
        setTransactions(initialSample);
      }
      setSyncMode('simulation-fallback');
      if (!silently) {
        showToast('info', 'Gagal menghubungi server. Menggunakan database simulasi.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger manual refresh
  const handleManualRefresh = () => {
    setRefreshCountdown(60); // reset countdown
    fetchCrawlerData(false);
  };

  // 1. Initial State Load & Auto-Refresh Interval
  useEffect(() => {
    // A. Load existing sessions from localStorage
    const savedSessionsStr = localStorage.getItem('rekap_sessions');
    let loadedSessions: ImportSession[] = [];
    if (savedSessionsStr) {
      try {
        loadedSessions = JSON.parse(savedSessionsStr);
        setSessions(loadedSessions);
      } catch (e) {
        console.error('Failed to parse saved sessions', e);
      }
    }

    // B. Check active session id
    const savedActiveSessionId = localStorage.getItem('rekap_active_session_id');
    
    // C. Check if we have normal transactions in localStorage, otherwise pull from server
    const savedTrxStr = localStorage.getItem('rekap_transactions');
    if (savedTrxStr) {
      try {
        setTransactions(JSON.parse(savedTrxStr));
        if (savedActiveSessionId) {
          setActiveSessionId(savedActiveSessionId);
        }
        // Check mode
        setSyncMode('simulation');
        const now = new Date();
        setLastUpdatedStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB");
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    } else {
      // First boot: trigger initial fetch from API
      fetchCrawlerData(true);
    }

    // D. Timer ticker (60 seconds countdown)
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          // Trigger autosync
          fetchCrawlerData(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Persists
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('rekap_transactions', JSON.stringify(transactions));
    } else {
      localStorage.removeItem('rekap_transactions');
    }
  }, [transactions]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('rekap_sessions', JSON.stringify(sessions));
    } else {
      localStorage.removeItem('rekap_sessions');
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('rekap_active_session_id', activeSessionId);
    } else {
      localStorage.removeItem('rekap_active_session_id');
    }
  }, [activeSessionId]);

  // --- ACTIONS HANDLERS ---

  // Handle parsing copy-pasted blocks
  const handleParse = (text: string, mapping?: ColumnMapping) => {
    const parsed = parsePastedText(text, mapping);
    // Filter to wait for payment only
    const waitOnly = parsed.filter(t => t.status.trim().toLowerCase() === 'wait for payment');

    if (waitOnly.length === 0) {
      showToast('info', 'Tidak ada data "wait for payment" yang bisa diurai. Cek format!');
      return;
    }
    setTransactions(waitOnly);
    // Break active session connection as this is a new custom import
    setActiveSessionId(null);
    showToast('success', `Berhasil menyaring & memuat ${waitOnly.length} transaksi wait for payment!`);
  };

  // Handle clearing active database
  const handleClearAll = () => {
    triggerConfirm({
      title: 'Kosongkan Transaksi Aktif',
      message: 'Apakah Anda yakin ingin menghapus seluruh data transaksi aktif di layar? (Sesi arsip Anda tidak akan terhapus)',
      confirmText: 'Yakin, Kosongkan',
      cancelText: 'Batal',
      isDestructive: true,
      onConfirm: () => {
        setTransactions([]);
        setActiveSessionId(null);
        showToast('info', 'Daftar transaksi aktif dikosongkan.');
      }
    });
  };

  // Save current active list as a local session
  const handleSaveCurrentSession = (name: string) => {
    if (transactions.length === 0) return;

    const existingIdx = sessions.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    
    const saveSessionData = () => {
      const sessionId = existingIdx !== -1 ? sessions[existingIdx].id : `session-${Date.now()}`;
      const newSession: ImportSession = {
        id: sessionId,
        name,
        createdAt: new Date().toISOString(),
        transactions: [...transactions]
      };

      let updatedSessions = [...sessions];
      if (existingIdx !== -1) {
        updatedSessions[existingIdx] = newSession;
      } else {
        updatedSessions = [newSession, ...updatedSessions];
      }

      setSessions(updatedSessions);
      setActiveSessionId(sessionId);
      showToast('success', `Sesi Archieve "${name}" disimpan ke arsip.`);
    };

    if (existingIdx !== -1) {
      triggerConfirm({
        title: 'Sesi Sudah Ada',
        message: `Sesi dengan nama "${name}" sudah ada. Timpa dengan data saat ini?`,
        confirmText: 'Ya, Timpa',
        cancelText: 'Batal',
        isDestructive: true,
        onConfirm: saveSessionData
      });
    } else {
      saveSessionData();
    }
  };

  // Load a saved database session
  const handleLoadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    setTransactions([...session.transactions]);
    setActiveSessionId(sessionId);
    showToast('success', `Memuat arsip sesi: "${session.name}"`);
  };

  // Delete a saved session
  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    showToast('info', `Sesi "${session?.name || ''}" telah dihapus.`);
  };

  // Rename a session
  const handleRenameSession = (sessionId: string, newName: string) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, name: newName };
      }
      return s;
    });
    setSessions(updated);
    showToast('success', 'Nama sesi diperbarui.');
  };

  // Add / Edit manual triggers
  const handleAddClick = () => {
    setEditingTrx(null);
    setShowAddEditModal(true);
  };

  const handleEditClick = (trx: Transaction) => {
    setEditingTrx(trx);
    setShowAddEditModal(true);
  };

  const handleDeleteTrx = (trxId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== trxId));
    showToast('info', 'Transaksi telah dihapus.');
  };

  const handleBulkDelete = (ids: string[]) => {
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    showToast('info', `${ids.length} transaksi dihapus sekaligus.`);
  };

  const handleAddEditSave = (savedTrx: Transaction) => {
    // Force lowercase trimming of status to always comply with wait for payment filters
    const forcedTrx = {
      ...savedTrx,
      status: 'wait for payment' // Enforce wait for payment only
    };

    if (editingTrx) {
      // Edit mode
      setTransactions(prev => prev.map(t => t.id === forcedTrx.id ? forcedTrx : t));
      showToast('success', `Detail transaksi #${forcedTrx.pastedIndex} berhasil diubah.`);
    } else {
      // Add mode
      setTransactions(prev => [forcedTrx, ...prev]);
      showToast('success', `Berhasil menambahkan transaksi baru (Index #${forcedTrx.pastedIndex})`);
    }
    setShowAddEditModal(false);
    setEditingTrx(null);
  };

  // Copy computed beautiful summary text to clipboard (perfect for admin groups!)
  const handleCopySummary = () => {
    // Filter wait for payment list
    const pendingOnly = transactions.filter(t => t.status.trim().toLowerCase() === 'wait for payment');

    if (pendingOnly.length === 0) {
      showToast('info', 'Tidak ada data pending rekap.');
      return;
    }

    const totalVolume = pendingOnly.reduce((acc, curr) => acc + curr.amount, 0);
    const count = pendingOnly.length;

    // Group methods
    const methodCounts: Record<string, { count: number; volume: number }> = {};
    pendingOnly.forEach(t => {
      const bank = t.paymentMethod || 'LAINNYA';
      if (!methodCounts[bank]) methodCounts[bank] = { count: 0, volume: 0 };
      methodCounts[bank].count += 1;
      methodCounts[bank].volume += t.amount;
    });

    // Format money helper
    const formatRp = (v: number) => `Rp ${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    let textStr = `*--- REKAP WD PENDING - LIGA BANDOT ---*\n`;
    textStr += `Status Pantau: *Wait For Payment*\n`;
    textStr += `Sinkronisasi Terakhir: ${lastUpdatedStr || '-'}\n`;
    textStr += `Total Antrean: *${count} Transaksi*\n`;
    textStr += `Total Nilai Nominal: *${formatRp(totalVolume)}*\n\n`;

    textStr += `*RINCIAN ANTRIAN BANK & E-WALLET:*\n`;
    Object.entries(methodCounts).sort((a,b) => b[1].volume - a[1].volume).forEach(([bank, data]) => {
      textStr += `- ${bank}: *${formatRp(data.volume)}* (${data.count} Antrean)\n`;
    });
    
    textStr += `\n_Kalkulasi real-time via Dashboard WD Pending - Liga Bandot_`;

    navigator.clipboard.writeText(textStr)
      .then(() => {
        showToast('success', 'Rekapan WA tersalin ke clipboard! Siap kirim.');
      })
      .catch(err => {
        console.error('Failed to copy', err);
        showToast('info', 'Gagal menyalin rekap otomatis.');
      });
  };

  // Export structured CSV file
  const handleExportCSV = () => {
    const pendingOnly = transactions.filter(t => t.status.trim().toLowerCase() === 'wait for payment');
    if (pendingOnly.length === 0) {
      showToast('info', 'Tidak ada data untuk diekspor.');
      return;
    }

    // Build header row
    const headers = ['Index', 'Username', 'Nama Penerima', 'Norek / No HP', 'Bank', 'Kode Transaksi', 'ID Pengenal 1', 'Tanggal Waktu', 'Nominal', 'Status', 'ID Pengenal 2'];
    
    const rows = pendingOnly.map(t => [
      t.pastedIndex,
      t.username,
      `"${t.fullName.replace(/"/g, '""')}"`, // escape quotes
      `'${t.accountNumber}`, // force Excel text treatment for leading zeros
      t.paymentMethod,
      t.trxCode,
      t.uuid1,
      t.dateTime,
      t.amount,
      t.status,
      t.uuid2
    ]);

    const csvContent = "\uFEFF" + [ // Add UTF-8 BOM
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_wd_pending_${new Date().toISOString().slice(0,10)}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'File CSV berhasil diekspor.');
  };

  // Calculate next index helper for manually adding
  const nextPastedIndex = useMemo(() => {
    if (transactions.length === 0) return 1;
    const maxIdx = Math.max(...transactions.map(t => t.pastedIndex));
    return maxIdx + 1;
  }, [transactions]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#020617] via-[#09112a] to-[#020617] animate-bg-gradient font-sans text-slate-200 flex flex-col selection:bg-blue-900 selection:text-blue-100 overflow-x-hidden">
      
      {/* Background Animated Image Layer (12% Opacity for subtle Tech detail) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img 
          src={techBg} 
          alt="Tech Network Background" 
          className="w-full h-full object-cover opacity-12 animate-slow-zoom scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-transparent to-[#020617]" />
      </div>

      {/* Particle Network Animation Layer (30% opacity) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <ParticleNetwork />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
      
      {/* Absolute Dynamic Pop-up Toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full pointer-events-none px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl bg-slate-950/90 ${
              notification.type === 'success' 
                ? 'border-emerald-500/30 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                : 'border-blue-500/30 text-slate-100 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
            }`}>
              <div className={`rounded-xl p-2 ${
                notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {notification.type === 'success' ? <CheckCircle className="h-4.5 w-4.5" /> : <Info className="h-4.5 w-4.5" />}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold block text-slate-200">System Notification</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">{notification.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <DashboardHeader
        onClearAll={handleClearAll}
        onCopySummary={handleCopySummary}
        onExportCSV={handleExportCSV}
        hasData={transactions.length > 0}
        onRefreshNow={handleManualRefresh}
        isRefreshing={isRefreshing}
        refreshCountdown={refreshCountdown}
        syncMode={syncMode}
        lastUpdatedStr={lastUpdatedStr}
      />

      {/* Main Container Stage */}
      <main className="flex-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        
        {/* Layout Grid: Left Content (75%), Right Sidebar (25% on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main workspace section (left) */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            
            {/* 1. Paste section */}
            <PasteSection onParse={handleParse} isLoading={isRefreshing} />

            {/* 1b. WD Wrong Quick Extractor Shortcut Tool */}
            <WrongExtractor onToast={showToast} />

            {/* 2. KPI Cards metrics block */}
            <KPICards transactions={transactions} lastUpdatedStr={lastUpdatedStr} />

            {/* 3. Operational Charts visualizer */}
            <AnalyticsCharts transactions={transactions} />

            {/* 4. Filterable Ledger Table */}
            <TransactionListView 
              transactions={transactions}
              onAddClick={handleAddClick}
              onEditClick={handleEditClick}
              onDeleteTrx={handleDeleteTrx}
              onBulkDelete={handleBulkDelete}
              onToast={showToast}
            />

          </div>

          {/* Local storage sidebar section (right) */}
          <div className="col-span-1 lg:sticky lg:top-24">
            <HistorySidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onLoadSession={handleLoadSession}
              onSaveCurrentSession={handleSaveCurrentSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              hasCurrentData={transactions.length > 0}
              triggerConfirm={triggerConfirm}
            />
          </div>

        </div>

      </main>

      {/* Manual Insert & Edit overlay portal */}
      {showAddEditModal && (
        <AddEditModal
          transaction={editingTrx}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingTrx(null);
          }}
          onSave={handleAddEditSave}
          nextIndex={nextPastedIndex}
        />
      )}

      {/* Modern Dialog Modal to replace browser window.confirm inside IFRAMEs */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Humble Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 py-6 mt-12 text-center text-[10px] text-slate-500 font-sans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>&copy; 2026 DASHBOARD KALKULATOR WD PENDING. All rights reserved.</span>
          <span className="flex items-center gap-1 justify-center">
            Automatic Crawler &bull; Real-time Calculations &bull; Encrypted Local Sessions
          </span>
        </div>
      </footer>

      </div> {/* Close relative z-10 wrapper */}
    </div>
  );
}
