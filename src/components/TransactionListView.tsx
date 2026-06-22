/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, Trash2, Edit3, ChevronLeft, ChevronRight,
  Clipboard, Download, Copy, Check, FilterX, HelpCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionListViewProps {
  transactions: Transaction[];
  onAddClick: () => void;
  onEditClick: (trx: Transaction) => void;
  onDeleteTrx: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onToast: (type: 'success' | 'info', msg: string) => void;
}

export default function TransactionListView({
  transactions,
  onAddClick,
  onEditClick,
  onDeleteTrx,
  onBulkDelete,
  onToast
}: TransactionListViewProps) {
  // Dual-search filters
  const [searchThirdId, setSearchThirdId] = useState('');
  const [searchUsername, setSearchUsername] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<'amount' | 'dateTime'>('dateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // States to animate copy icons temporarily
  const [copiedIdMap, setCopiedIdMap] = useState<Record<string, 'third' | 'nominal' | null>>({});

  // Format Helper to Indonesian Rupiah with commas (e.g., Rp 12,875,000)
  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(val));
    return `Rp ${formatted}`;
  };

  // Handle header sorting toggle
  const toggleSort = (field: 'amount' | 'dateTime') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'amount' ? 'desc' : 'asc'); // default descending for big numbers, ascending for date
    }
  };

  // Filter & Sort core process
  const processedTransactions = useMemo(() => {
    // Only process wait for payment status as per instructions
    let filtered = transactions.filter(t => t.status.trim().toLowerCase() === 'wait for payment');

    // Filter 1: Search Third ID (trxCode)
    if (searchThirdId.trim()) {
      const q = searchThirdId.toLowerCase().trim();
      filtered = filtered.filter(t => t.trxCode.toLowerCase().includes(q));
    }

    // Filter 2: Search Username
    if (searchUsername.trim()) {
      const q = searchUsername.toLowerCase().trim();
      filtered = filtered.filter(t => t.username.toLowerCase().includes(q));
    }

    // Sort: Nominal or Tanggal (dateTime)
    filtered.sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else {
        const valA = a.dateTime || '';
        const valB = b.dateTime || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

    return filtered;
  }, [transactions, searchThirdId, searchUsername, sortField, sortOrder]);

  // Pagination bounds
  const totalRows = processedTransactions.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * rowsPerPage;
    return processedTransactions.slice(start, start + rowsPerPage);
  }, [processedTransactions, activePage, rowsPerPage]);

  // ACTION Handlers

  // Copy Single Third ID
  const handleCopyThirdId = (trxCode: string, id: string) => {
    if (!trxCode) return;
    navigator.clipboard.writeText(trxCode)
      .then(() => {
        onToast('success', `Third ID [${trxCode}] berhasil disalin!`);
        setCopiedIdMap(p => ({ ...p, [id]: 'third' }));
        setTimeout(() => setCopiedIdMap(p => ({ ...p, [id]: null })), 2000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin otomatis');
      });
  };

  // Copy Single Nominal
  const handleCopyNominal = (amount: number, id: string) => {
    const amtClean = String(amount);
    navigator.clipboard.writeText(amtClean)
      .then(() => {
        onToast('success', `Nominal ${formatIDR(amount)} berhasil disalin!`);
        setCopiedIdMap(p => ({ ...p, [id]: 'nominal' }));
        setTimeout(() => setCopiedIdMap(p => ({ ...p, [id]: null })), 2000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin otomatis');
      });
  };

  // Copy ALL Third IDs (Comma Separated)
  const handleCopyAllThirdIds = () => {
    if (processedTransactions.length === 0) {
      onToast('info', 'Tidak ada data transaksi untuk disalin.');
      return;
    }
    const thirdIds = processedTransactions.map(t => t.trxCode).filter(Boolean);
    const joined = thirdIds.join(', ');
    navigator.clipboard.writeText(joined)
      .then(() => {
        onToast('success', `Disalin ${thirdIds.length} Third ID ke clipboard dengan sukses.`);
      })
      .catch(() => onToast('info', 'Gagal menyalin'));
  };

  // Copy ALL processed/filtered rows as readable summary table string
  const handleCopyAllRecords = () => {
    if (processedTransactions.length === 0) {
      onToast('info', 'Tidak ada data untuk disalin');
      return;
    }

    let resultStr = `DASHBOARD KALKULATOR WD PENDING\n`;
    resultStr += `Format Rekap: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}\n`;
    resultStr += `---------------------------------------------------------\n`;
    resultStr += `No\tThird ID\tUsername\tNominal\tStatus\tTanggal Waktu\n`;
    
    processedTransactions.forEach((t, i) => {
      const [tanggal, jam] = (t.dateTime || '').split(' ');
      resultStr += `${i + 1}\t${t.trxCode}\t${t.username}\t${formatIDR(t.amount)}\t${t.status}\t${tanggal} ${jam || ''}\n`;
    });
    
    resultStr += `---------------------------------------------------------\n`;
    resultStr += `TOTAL TRANSAKSI pending: ${processedTransactions.length}\n`;
    const sum = processedTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    resultStr += `TOTAL NOMINAL PENDING: ${formatIDR(sum)}\n`;

    navigator.clipboard.writeText(resultStr)
      .then(() => {
        onToast('success', `Berhasil menyalin seluruh data (${processedTransactions.length} baris) ke clipboard!`);
      })
      .catch(() => onToast('info', 'Gagal menyalin'));
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (processedTransactions.length === 0) {
      onToast('info', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['No', 'Third ID', 'Username', 'Nominal', 'Status', 'Tanggal', 'Jam'];
    const rows = processedTransactions.map((t, idx) => {
      const [tanggal, jam] = (t.dateTime || '').split(' ');
      return [
        idx + 1,
        t.trxCode,
        t.username,
        t.amount,
        t.status,
        tanggal || '-',
        jam || '-'
      ];
    });

    const csvContent = "\uFEFF" + [ // Add UTF-8 BOM
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    triggerFileDownload(csvContent, 'rekap_wd_pending_csv.csv', 'text/csv;charset=utf-8;');
    onToast('success', `Berhasil mengekspor ${processedTransactions.length} transaksi ke CSV.`);
  };

  // Export to Excel-compatible Formatted Tab-separated file (XLS wrapper style)
  const handleExportExcel = () => {
    if (processedTransactions.length === 0) {
      onToast('info', 'Tidak ada data transaksi untuk diekspor ke Excel.');
      return;
    }

    // Creating HTML format suited for Excel with column styling, borders, and proper rupiah formats!
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; }
          th { background-color: #2563EB; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .number-format { mso-number-format:"\\#\\,\\#\\#0"; }
          .text-format { mso-number-format:"\\@"; }
        </style>
      </head>
      <body>
        <h3>DASHBOARD KALKULATOR WD PENDING</h3>
        <p>Ekspor Tanggal: ${new Date().toLocaleString('id-ID')}</p>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Third ID</th>
              <th>Username</th>
              <th>Nominal</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Jam</th>
            </tr>
          </thead>
          <tbody>
    `;

    processedTransactions.forEach((t, idx) => {
      const [tanggal, jam] = (t.dateTime || '').split(' ');
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td class="text-format">${t.trxCode}</td>
          <td class="text-format">${t.username}</td>
          <td class="number-format">${t.amount}</td>
          <td>${t.status}</td>
          <td>${tanggal || '-'}</td>
          <td>${jam || '-'}</td>
        </tr>
      `;
    });

    // Append total summing block
    const sum = processedTransactions.reduce((a, c) => a + c.amount, 0);
    html += `
        <tr>
          <td colspan="3" style="font-weight:bold; text-align:right">TOTAL PENDING:</td>
          <td class="number-format" style="font-weight:bold; color:#1e1b4b">${sum}</td>
          <td colspan="3" style="background-color:#f1f5f9"></td>
        </tr>
      </tbody>
      </table>
      </body>
      </html>
    `;

    triggerFileDownload(html, 'rekap_wd_pending_excel.xls', 'application/vnd.ms-excel');
    onToast('success', 'File Excel (.xls) berhasil diekspor.');
  };

  const triggerFileDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchThirdId('');
    setSearchUsername('');
    onToast('info', 'Pencarian dikosongkan');
  };

  return (
    <div id="wd-pending-table-container" className="glass-card rounded-2xl overflow-hidden flex flex-col mt-6 border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.15)] bg-slate-950/40">
      
      {/* TOOLBAR */}
      <div className="p-5 border-b border-white/5 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
            {/* Search Third ID */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-third-id"
                type="text"
                value={searchThirdId}
                onChange={(e) => {
                  setSearchThirdId(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Third ID..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Search Username */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-username"
                type="text"
                value={searchUsername}
                onChange={(e) => {
                  setSearchUsername(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Username..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {(searchThirdId || searchUsername) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs rounded-xl transition-all cursor-pointer"
              >
                <FilterX className="h-3.5 w-3.5" />
                Reset Cari
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Actions */}
            <button
              onClick={handleCopyAllThirdIds}
              id="btn-copy-all-ids"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900/95 text-slate-200 px-3 py-2 text-xs font-semibold cursor-pointer transition-all"
            >
              <Clipboard className="h-3.5 w-3.5 text-blue-400" />
              Copy Semua Third ID
            </button>

            <button
              onClick={handleCopyAllRecords}
              id="btn-copy-all-data"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900/95 text-slate-200 px-3 py-2 text-xs font-semibold cursor-pointer transition-all"
            >
              <Copy className="h-3.5 w-3.5 text-amber-400" />
              Copy Semua Data
            </button>

            {/* Export Actions */}
            <button
              onClick={handleExportExcel}
              id="btn-export-excel"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs font-extrabold cursor-pointer transition-all shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </button>

            <button
              onClick={handleExportCSV}
              id="btn-export-csv-direct"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-extrabold cursor-pointer transition-all shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* TABLE DATA GRID */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
              <th className="py-3.5 px-4 text-center w-14">No</th>
              
              <th className="py-3.5 px-4 w-44">Third ID</th>
              
              <th className="py-3.5 px-4 w-44">Username</th>
              
              <th className="py-3.5 px-4 w-44 cursor-pointer hover:bg-slate-900 hover:text-white transition-colors" onClick={() => toggleSort('amount')}>
                <div className="flex items-center justify-end gap-1">
                  Nominal
                  <ArrowUpDown className={`h-3 w-3 ${sortField === 'amount' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
              </th>
              
              <th className="py-3.5 px-4 w-36">Status</th>
              
              <th className="py-3.5 px-4 w-32 cursor-pointer hover:bg-slate-900 hover:text-white transition-colors" onClick={() => toggleSort('dateTime')}>
                <div className="flex items-center gap-1">
                  Tanggal
                  <ArrowUpDown className={`h-3 w-3 ${sortField === 'dateTime' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
              </th>
              
              <th className="py-3.5 px-4 w-28">Jam</th>
              
              <th className="py-3.5 px-4 text-center w-36">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-sans">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center bg-slate-950/20">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="h-10 w-10 text-slate-500 bg-slate-900 rounded-full flex items-center justify-center mb-2 border border-white/5">
                      <FilterX className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-200 text-sm block">Tidak Ada Data "Wait For Payment"</span>
                    <span className="text-slate-400 text-[11px] block mt-1 leading-normal max-w-xs">
                      Pastikan filter pencarian diisi dengan benar atau datanya mengandung status: <span className="text-amber-500 font-bold">"wait for payment"</span>.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((trx, index) => {
                const globalIndex = (activePage - 1) * rowsPerPage + index + 1;
                
                // Split date time precisely into Tanggal & Jam
                const [datePart = '-', timePart = '-'] = (trx.dateTime || '').split(' ');

                return (
                  <tr
                    key={trx.id}
                    className="hover:bg-blue-500/5 transition-colors border-b border-white/5 bg-slate-950/10 group"
                  >
                    {/* Index column */}
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-500">
                      {globalIndex}
                    </td>

                    {/* Third ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      <span className="hover:text-blue-400 transition-colors" title={trx.trxCode}>
                        {trx.trxCode || '-'}
                      </span>
                    </td>

                    {/* Username detail */}
                    <td className="py-3 px-4">
                      <span className="bg-slate-900/80 text-blue-300 border border-blue-500/10 rounded px-2.5 py-0.5 font-bold font-mono">
                        {trx.username}
                      </span>
                    </td>

                    {/* Nominal IDR */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-slate-100 text-[13px] tracking-wide">
                        {formatIDR(trx.amount)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                        {trx.status}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {datePart}
                    </td>

                    {/* Jam */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {timePart}
                    </td>

                    {/* Copier Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Copy Third ID */}
                        <button
                          onClick={() => handleCopyThirdId(trx.trxCode, trx.id)}
                          className="inline-flex items-center gap-1 bg-slate-900 border border-white/10 hover:border-blue-500/30 hover:bg-slate-950 text-slate-300 hover:text-blue-400 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
                          title="Copy Third ID"
                        >
                          {copiedIdMap[trx.id] === 'third' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400 animate-scaleUp" />
                              <span className="text-emerald-400 text-[9px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="h-3 w-3" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>

                        {/* Copy Nominal */}
                        <button
                          onClick={() => handleCopyNominal(trx.amount, trx.id)}
                          className="inline-flex items-center gap-1 bg-slate-900 border border-white/10 hover:border-amber-500/30 hover:bg-slate-950 text-slate-300 hover:text-amber-400 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
                          title="Copy Nominal Value"
                        >
                          {copiedIdMap[trx.id] === 'nominal' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400 animate-scaleUp" />
                              <span className="text-emerald-400 text-[9px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Rp</span>
                            </>
                          )}
                        </button>

                        {/* Small edit trigger */}
                        <button
                          onClick={() => onEditClick(trx)}
                          className="p-1 rounded bg-slate-900 border border-white/5 text-slate-500 hover:text-slate-300 cursor-pointer hover:border-white/10"
                          title="Ubah Transaksi"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      {totalRows > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-950/80 border-t border-white/10 text-xs font-semibold text-slate-400 font-sans">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={rowsPerPage}
              id="rows-dropdown"
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-white/10 bg-slate-900 text-white p-1 text-xs outline-none cursor-pointer font-bold focus:ring-1 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map(cnt => (
                <option key={cnt} value={cnt}>{cnt} Baris</option>
              ))}
            </select>
            <span>dari <span className="font-bold text-white font-mono">{totalRows}</span> baris pending</span>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <span>Halaman <span className="font-bold text-white font-mono">{activePage}</span> / {totalPages}</span>
            <div className="inline-flex gap-1">
              <button
                disabled={activePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 px-2.5 rounded border border-white/10 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <button
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 px-2.5 rounded border border-white/10 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
