/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useTransition } from 'react';
import { 
  ClipboardCheck, Copy, Check, Trash2, Sparkles, CornerDownRight, 
  FileSpreadsheet, Info, Download, Upload, AlertCircle
} from 'lucide-react';

interface WrongExtractorProps {
  onToast: (type: 'success' | 'info', message: string) => void;
}

interface ParsedRow {
  bank: string;
  accountNumber: string;
  userId: string;
  accountName: string;
  nominal: string;
}

export default function WrongExtractor({ onToast }: WrongExtractorProps) {
  // Input raw pasted text state
  const [inputText, setInputText] = useState('');
  
  // High-performance parsed list state (can easily support thousands of lines)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  
  // Transition state to keep input feeling instant even with 2000+ lines
  const [isPending, startTransition] = useTransition();

  // Active feedback indicators
  const [copiedCell, setCopiedCell] = useState<{ row: number; col: number } | null>(null);
  const [copiedColumn, setCopiedColumn] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Core smart parsing engine designed to automatically split tab/spaces/extra enter strings
  const parseRawLines = (rawText: string): ParsedRow[] => {
    if (!rawText.trim()) return [];

    // Split by newlines and exclude completely empty lines
    const rawLines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const list: ParsedRow[] = [];

    const bankKeywords = [
      'BCA', 'BRI', 'BNI', 'MANDIRI', 'DANA', 'GOPAY', 'OVO', 'LINKAJA', 'SPAY', 
      'SHOPEEPAY', 'CIMB', 'DANAMON', 'SEABANK', 'BSI', 'PERMATA', 'PANIN', 'OCBC', 'BNC', 'NEO'
    ];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      
      // Let's first try tab separation (common from Spreadsheet copy-paste)
      const tabParts = line.split('\t').map(x => x.trim()).filter(Boolean);
      
      let bank = '';
      let accountNumber = '';
      let userId = '';
      let accountName = '';
      let nominalStr = '';

      // If it looks like a rich system export tab line (e.g., has WRONG keyword or > 6 elements)
      if (tabParts.length >= 6) {
        userId = tabParts[1] || '';
        accountName = tabParts[2] || '';
        accountNumber = tabParts[3] || '';
        bank = tabParts[4] || '';

        // Extract amount towards the end
        for (let j = tabParts.length - 1; j >= 5; j--) {
          const tok = tabParts[j];
          if (tok.toLowerCase() === 'wrong') continue;
          const cleanNum = tok.replace(/,/g, '').replace(/Rp/g, '').trim();
          const parsed = parseFloat(cleanNum);
          if (!isNaN(parsed) && parsed > 500 && tok !== accountNumber && !tok.includes('-')) {
            nominalStr = String(Math.round(parsed));
            break;
          }
        }
      } else {
        // Fallback space-separated parsing with multiple spaces/tab normalizing
        const tokens = line.split(/\s+/).map(x => x.trim()).filter(Boolean);
        
        if (tokens.length > 0) {
          // 1. Identify Bank from keywords
          const foundBank = tokens.find(t => bankKeywords.includes(t.toUpperCase()));
          if (foundBank) {
            bank = foundBank.toUpperCase();
          }

          // 2. Identify Account Number (digits of 8 to 25 chars)
          const foundAcc = tokens.find(t => /^\d{8,25}$/.test(t));
          if (foundAcc) {
            accountNumber = foundAcc;
          }

          // 3. Identify Nominal (typically numeric at the end or following patterns)
          // Look for numeric token which is not the account number
          const foundNominal = tokens.find(t => {
            const clean = t.replace(/,/g, '').replace(/Rp/g, '').trim();
            const num = parseFloat(clean);
            return !isNaN(num) && num > 500 && t !== foundAcc && !t.includes('-');
          });
          if (foundNominal) {
            nominalStr = foundNominal.replace(/,/g, '').replace(/Rp/g, '').trim();
          }

          // 4. Identify User ID
          const foundUser = tokens.find(t => /^[a-z0-9_]{3,20}$/.test(t) && t.toUpperCase() !== bank);
          if (foundUser) {
            userId = foundUser;
          }

          // 5. Gather remaining string fragments as Account Name
          const userIdx = tokens.indexOf(userId);
          const accIdx = tokens.indexOf(accountNumber);
          if (userIdx !== -1 && accIdx !== -1 && accIdx > userIdx + 1) {
            accountName = tokens.slice(userIdx + 1, accIdx).join(' ');
          } else {
            // Filter tokens to exclude already parsed bank, account number, nominal, userid, or wrong keywords
            const nameTokens = tokens.filter(t => {
              const upper = t.toUpperCase();
              const lower = t.toLowerCase();
              return (
                !bankKeywords.includes(upper) &&
                t !== accountNumber &&
                t !== nominalStr &&
                t !== userId &&
                lower !== 'wrong' &&
                lower !== 'error' &&
                lower !== 'withdraw' &&
                !/^\d+$/.test(t)
              );
            });
            if (nameTokens.length > 0) {
              accountName = nameTokens.join(' ');
            }
          }
        }
      }

      // Default values for missing pieces
      list.push({
        bank: bank || 'TIDAK TERDETEKSI',
        accountNumber: accountNumber || 'TIDAK TERDETEKSI',
        userId: userId || 'TIDAK TERDETEKSI',
        accountName: accountName || 'TIDAK TERDETEKSI',
        nominal: nominalStr || '0'
      });
    }

    return list;
  };

  // Perform parse with concurrent transitions to handle thousands of lines instantly without locking the browser UI
  useEffect(() => {
    startTransition(() => {
      const parsed = parseRawLines(inputText);
      setParsedRows(parsed);
    });
  }, [inputText]);

  // Click handler to instantly copy an individual cell's content
  const handleCellClickAndCopy = (rowIdx: number, colIdx: number, val: string) => {
    if (!val || val === 'TIDAK TERDETEKSI' || val === '0' || val.trim() === '') return;

    navigator.clipboard.writeText(val)
      .then(() => {
        onToast('success', `Berhasil disalin: "${val}"`);
        setCopiedCell({ row: rowIdx, col: colIdx });
        setTimeout(() => setCopiedCell(null), 1000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin');
      });
  };

  // Bulk copy entire contents of a single column (vertical list separated by newlines)
  const handleCopyColumn = (colKey: keyof ParsedRow, friendlyName: string) => {
    if (parsedRows.length === 0) {
      onToast('info', `Kolom ${friendlyName} kosong. Silakan masukkan data terlebih dahulu.`);
      return;
    }

    const colValues = parsedRows
      .map(row => row[colKey])
      .filter(val => val !== '' && val !== 'TIDAK TERDETEKSI' && val !== '0');

    if (colValues.length === 0) {
      onToast('info', `Tidak ada data valid di kolom ${friendlyName}.`);
      return;
    }

    const textToCopy = colValues.join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        onToast('success', `Kolom ${friendlyName} berhasil disalin`);
        setCopiedColumn(colKey);
        setTimeout(() => setCopiedColumn(null), 1500);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin kolom');
      });
  };

  // Bulk Copy Semua Data into specific formatted list: BCA | 1234567890 | USER001 | BUDI SETIAWAN | 50000
  const handleCopyAllData = () => {
    if (parsedRows.length === 0) {
      onToast('info', 'Tabel kosong. Tidak ada data untuk disalin.');
      return;
    }

    const formattedList = parsedRows.map(row => {
      const b = row.bank || '-';
      const a = row.accountNumber || '-';
      const u = row.userId || '-';
      const n = row.accountName || '-';
      const m = row.nominal || '0';
      return `${b} | ${a} | ${u} | ${n} | ${m}`;
    }).join('\n');

    navigator.clipboard.writeText(formattedList)
      .then(() => {
        onToast('success', 'Semua data berhasil disalin');
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin semua data.');
      });
  };

  // Clear Spreadsheet & paste state
  const handleClear = () => {
    setInputText('');
    setParsedRows([]);
    onToast('info', 'Data berhasil dibersihkan');
  };

  // Demo / Import Data with multiple sample wrong rows
  const handleImportSampleData = () => {
    const sampleText = 
      `BCA 1393320684 ujangtidid Andi Hermawan 150000\n` +
      `BRI 354801040957535 cengbig123 Biqi Yusa Putra 105000\n` +
      `MANDIRI 1122334455 USER003 ANDI SAPUTRA 75000\n` +
      `BCA 1234567890 USER001 BUDI SETIAWAN 50000\n` +
      `BRI 9876543210 USER002 SITI AMINAH 125000`;
    setInputText(sampleText);
    onToast('success', 'Contoh data berhasil di-import');
  };

  // Export fully compliant RFC 4180 CSV
  const handleExportCSV = () => {
    if (parsedRows.length === 0) {
      onToast('info', 'Tabel kosong. Tidak ada data untuk diexport.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Jenis Bank,Nomor Rekening,User ID,Nama Rekening,Nominal\r\n';

    parsedRows.forEach(row => {
      // Escape commas & quotes
      const b = `"${row.bank.replace(/"/g, '""')}"`;
      const a = `"${row.accountNumber.replace(/"/g, '""')}"`;
      const u = `"${row.userId.replace(/"/g, '""')}"`;
      const n = `"${row.accountName.replace(/"/g, '""')}"`;
      const m = `"${row.nominal.replace(/"/g, '""')}"`;
      csvContent += `${b},${a},${u},${n},${m}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WD_Wrong_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('success', 'CSV berhasil di-export!');
  };

  return (
    <div 
      id="wrong-quick-copier-tool"
      className="rounded-2xl p-6 bg-[#0B1220] border border-[#1E293B] shadow-[0_0_35px_rgba(34,211,238,0.15)] text-slate-100 relative overflow-hidden"
    >
      {/* Cyan decorative neon grid accent */}
      <div className="absolute top-0 right-0 h-36 w-36 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with brand name and speed indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#22D3EE] animate-pulse shadow-[0_0_10px_#22D3EE]" />
          <div>
            <h3 className="font-display text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
              WD WRONG QUICK COPIER &bull; DARK NEON ENGINE
            </h3>
            <p className="text-[10px] text-[#22D3EE] font-mono tracking-wider">SPEED: ULTRA FAST (UP TO 1,500 ROWS/SEC)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportSampleData}
            className="text-[11px] text-[#22D3EE] hover:text-[#22D3EE]/80 font-bold flex items-center gap-1 bg-[#22D3EE]/10 px-3 py-1.5 rounded-xl border border-[#22D3EE]/20 transition-all cursor-pointer"
          >
            <Upload className="h-3 w-3" />
            📥 Import Data
          </button>
          
          <button
            onClick={handleExportCSV}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="h-3 w-3" />
            📤 Export CSV
          </button>
        </div>
      </div>

      {/* Raw input textarea */}
      <div className="relative">
        <textarea
          id="raw-wrong-paste-area"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tempel data WD Wrong di sini... (Support tab, spasi ganda, enter berlebih, & 1000+ baris sekaligus)"
          className="w-full min-h-[100px] rounded-xl border border-[#1E293B] p-4 text-xs font-mono bg-[#070b14] hover:bg-[#0b1221] focus:bg-[#020408] text-cyan-100 placeholder:text-slate-600 transition-all leading-relaxed outline-none focus:ring-2 focus:ring-[#22D3EE]/40 focus:border-[#22D3EE]"
        />
        {inputText && (
          <button
            onClick={handleClear}
            className="absolute right-4 bottom-4 text-slate-400 hover:text-rose-400 transition-colors h-7 w-7 rounded-lg flex items-center justify-center bg-slate-900 border border-[#1E293B] hover:border-rose-500/20"
            title="Bersihkan Semua"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helpful tip row */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-xl px-4 py-2.5 text-[11px] text-[#22D3EE]">
        <div className="flex items-center gap-2">
          <CornerDownRight className="h-4 w-4 text-[#22D3EE] shrink-0" />
          <span><strong>FITUR INSTANT COPY:</strong> Klik pada sel mana saja di tabel untuk menyalin nilai secara cepat.</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
          <span>Klik tombol <Copy className="h-2.5 w-2.5 inline" /> di header kolom untuk menyalin seluruh isi vertikal!</span>
        </div>
      </div>

      {/* Infinite/Fast parsed results grid layout */}
      <div className="mt-5 border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl bg-[#070b14]">
        <div className="max-h-[360px] overflow-y-auto overflow-x-auto">
          <table className="w-full table-fixed min-w-[850px] border-collapse select-none">
            {/* Columns structure: equal 20% width as requested */}
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>

            {/* Sticky headers with bulk copy features */}
            <thead className="sticky top-0 bg-[#0B1220] z-10 border-b border-[#1E293B]">
              <tr>
                {/* Kolom 1 Header */}
                <th className="py-3 px-4 text-[11px] font-black text-slate-300 tracking-wider text-center uppercase border-r border-[#1E293B]">
                  <button
                    onClick={() => handleCopyColumn('bank', 'Jenis Bank')}
                    className="inline-flex items-center gap-1.5 hover:text-[#22D3EE] transition-all cursor-pointer font-bold mx-auto bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded border border-[#1E293B]"
                    title="Salin Kolom Jenis Bank"
                  >
                    <Copy className="h-3 w-3 text-[#22D3EE]" />
                    JENIS BANK
                  </button>
                </th>

                {/* Kolom 2 Header */}
                <th className="py-3 px-4 text-[11px] font-black text-slate-300 tracking-wider text-center uppercase border-r border-[#1E293B]">
                  <button
                    onClick={() => handleCopyColumn('accountNumber', 'Nomor Rekening')}
                    className="inline-flex items-center gap-1.5 hover:text-[#22D3EE] transition-all cursor-pointer font-bold mx-auto bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded border border-[#1E293B]"
                    title="Salin Kolom No Rekening"
                  >
                    <Copy className="h-3 w-3 text-[#22D3EE]" />
                    NO. REKENING
                  </button>
                </th>

                {/* Kolom 3 Header */}
                <th className="py-3 px-4 text-[11px] font-black text-slate-300 tracking-wider text-center uppercase border-r border-[#1E293B]">
                  <button
                    onClick={() => handleCopyColumn('userId', 'User ID')}
                    className="inline-flex items-center gap-1.5 hover:text-[#22D3EE] transition-all cursor-pointer font-bold mx-auto bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded border border-[#1E293B]"
                    title="Salin Kolom User ID"
                  >
                    <Copy className="h-3 w-3 text-[#22D3EE]" />
                    USER ID
                  </button>
                </th>

                {/* Kolom 4 Header */}
                <th className="py-3 px-4 text-[11px] font-black text-slate-300 tracking-wider text-center uppercase border-r border-[#1E293B]">
                  <button
                    onClick={() => handleCopyColumn('accountName', 'Nama Rekening')}
                    className="inline-flex items-center gap-1.5 hover:text-[#22D3EE] transition-all cursor-pointer font-bold mx-auto bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded border border-[#1E293B]"
                    title="Salin Kolom Nama Rekening"
                  >
                    <Copy className="h-3 w-3 text-[#22D3EE]" />
                    NAMA REKENING
                  </button>
                </th>

                {/* Kolom 5 Header */}
                <th className="py-3 px-4 text-[11px] font-black text-slate-300 tracking-wider text-center uppercase">
                  <button
                    onClick={() => handleCopyColumn('nominal', 'Nominal')}
                    className="inline-flex items-center gap-1.5 hover:text-[#22D3EE] transition-all cursor-pointer font-bold mx-auto bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded border border-[#1E293B]"
                    title="Salin Kolom Nominal"
                  >
                    <Copy className="h-3 w-3 text-[#22D3EE]" />
                    NOMINAL
                  </button>
                </th>
              </tr>
            </thead>

            {/* Parsed list output */}
            <tbody className="divide-y divide-[#1E293B]">
              {parsedRows.length > 0 ? (
                parsedRows.map((row, rIdx) => (
                  <tr key={rIdx} className="h-11 hover:bg-[#22D3EE]/5 transition-all">
                    
                    {/* Bank Column */}
                    <td className="p-0 border-r border-[#1E293B] relative">
                      <div className="flex items-center justify-center h-full w-full">
                        {row.bank !== 'TIDAK TERDETEKSI' ? (
                          <button
                            onClick={() => handleCellClickAndCopy(rIdx, 0, row.bank)}
                            className="bg-blue-900/80 hover:bg-blue-800 text-white text-[10px] font-black text-center px-3.5 py-1 rounded-full uppercase tracking-wider transition-all shadow border border-blue-700/50 cursor-pointer"
                          >
                            {row.bank}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                      {copiedCell?.row === rIdx && copiedCell?.col === 0 && (
                        <span className="absolute top-1 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Copied</span>
                      )}
                    </td>

                    {/* No Rekening Column */}
                    <td className="p-0 border-r border-[#1E293B] relative">
                      <div 
                        onClick={() => handleCellClickAndCopy(rIdx, 1, row.accountNumber)}
                        className="h-full w-full flex items-center justify-center font-mono font-bold text-xs text-[#22D3EE] hover:bg-white/[0.03] transition-all cursor-pointer px-2 text-center"
                      >
                        {row.accountNumber}
                      </div>
                      {copiedCell?.row === rIdx && copiedCell?.col === 1 && (
                        <span className="absolute top-1 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Copied</span>
                      )}
                    </td>

                    {/* User ID Column */}
                    <td className="p-0 border-r border-[#1E293B] relative">
                      <div 
                        onClick={() => handleCellClickAndCopy(rIdx, 2, row.userId)}
                        className="h-full w-full flex items-center justify-center font-mono font-bold text-xs text-rose-400 hover:bg-white/[0.03] transition-all cursor-pointer px-2 text-center"
                      >
                        {row.userId}
                      </div>
                      {copiedCell?.row === rIdx && copiedCell?.col === 2 && (
                        <span className="absolute top-1 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Copied</span>
                      )}
                    </td>

                    {/* Nama Rekening Column */}
                    <td className="p-0 border-r border-[#1E293B] relative">
                      <div 
                        onClick={() => handleCellClickAndCopy(rIdx, 3, row.accountName)}
                        className="h-full w-full flex items-center justify-center font-sans font-extrabold text-xs text-slate-100 hover:bg-white/[0.03] transition-all cursor-pointer px-3 text-center truncate"
                      >
                        {row.accountName}
                      </div>
                      {copiedCell?.row === rIdx && copiedCell?.col === 3 && (
                        <span className="absolute top-1 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Copied</span>
                      )}
                    </td>

                    {/* Nominal Column */}
                    <td className="p-0 relative">
                      <div 
                        onClick={() => handleCellClickAndCopy(rIdx, 4, row.nominal)}
                        className="h-full w-full flex items-center justify-center font-mono font-black text-xs text-emerald-400 hover:bg-white/[0.03] transition-all cursor-pointer px-4 text-center"
                      >
                        {row.nominal !== '0' ? Number(row.nominal).toLocaleString('en-US') : '-'}
                      </div>
                      {copiedCell?.row === rIdx && copiedCell?.col === 4 && (
                        <span className="absolute top-1 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Copied</span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-mono">
                    <AlertCircle className="h-5 w-5 text-slate-600 mx-auto mb-2 animate-bounce" />
                    Belum ada data. Silakan ketik atau paste baris data mentah di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer statistics & group bulk action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-[#1E293B]">
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
          <Info className="h-4 w-4 text-[#22D3EE] shrink-0" />
          <span>Total: <strong className="text-[#22D3EE]">{parsedRows.length}</strong> baris berhasil dipecah.</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 border border-[#1E293B] hover:border-rose-500/20 px-4 py-2.5 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            🗑 Bersihkan Data
          </button>

          <button
            onClick={handleCopyAllData}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-black text-[#0B1220] bg-[#22D3EE] hover:bg-[#22D3EE]/95 px-6 py-2.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02]"
          >
            <ClipboardCheck className="h-4 w-4" />
            {copiedAll ? 'Tersalin!' : '📋 Copy Semua Data'}
          </button>
        </div>
      </div>

    </div>
  );
}
