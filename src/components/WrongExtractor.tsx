/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, Copy, Check, Trash2, Sparkles, CornerDownRight, 
  Landmark, CreditCard, User, Users, DollarSign, Info
} from 'lucide-react';

interface WrongExtractorProps {
  onToast: (type: 'success' | 'info', message: string) => void;
}

export default function WrongExtractor({ onToast }: WrongExtractorProps) {
  // Input raw state
  const [inputText, setInputText] = useState('');

  // 5 Kolom Terpisah States (allows manual edits too!)
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [amountVal, setAmountVal] = useState('');

  // UI state for individual copied checkmarks
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Refs for auto-selecting input elements on-click
  const bankRef = useRef<HTMLInputElement>(null);
  const accNumRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const formatIDRICOMMA = (val: number) => {
    if (isNaN(val)) return 'Rp 0';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(val));
    return `Rp ${formatted}`;
  };

  // Automated split parser upon pasting
  const handleParse = (text: string) => {
    if (!text.trim()) {
      setBank('');
      setAccountNumber('');
      setUsername('');
      setFullName('');
      setAmountVal('');
      return;
    }

    const lines = text.trim().split('\n');
    const line = lines[0]; // operate on first line pasted

    // Excel/spreadsheet tabs split
    const tabParts = line.split('\t').map(x => x.trim());
    const visibleTokens = tabParts.filter(Boolean);

    let parsedBank = '';
    let parsedAccNum = '';
    let parsedUser = '';
    let parsedName = '';
    let parsedAmount = 0;

    const bankKeywords = [
      'BCA', 'BRI', 'BNI', 'MANDIRI', 'DANA', 'GOPAY', 'OVO', 'LINKAJA', 'SPAY', 
      'SHOPEEPAY', 'CIMB', 'DANAMON', 'SEABANK', 'BSI', 'PERMATA', 'PANIN', 'OCBC', 'BNC', 'NEO'
    ];

    // If it's a spreadsheet line with at least 5-6 non-empty elements
    if (visibleTokens.length >= 6) {
      parsedUser = visibleTokens[1] || '';
      parsedName = visibleTokens[2] || '';
      parsedAccNum = visibleTokens[3] || '';
      parsedBank = visibleTokens[4] || '';

      // Find amount towards the end of line
      for (let i = visibleTokens.length - 1; i >= 5; i--) {
        const tok = visibleTokens[i];
        if (tok === 'wrong') continue;
        const cleanNum = tok.replace(/,/g, '');
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed) && parsed > 500 && tok !== parsedAccNum && !tok.includes('-')) {
          parsedAmount = Math.round(parsed);
          break;
        }
      }
    } else {
      // Heuristic parsing for mixed spaces formatting
      const tokens = line.split(/\s+/).map(x => x.trim()).filter(Boolean);
      
      // 1. Bank
      const foundBank = tokens.find(t => bankKeywords.includes(t.toUpperCase()));
      if (foundBank) parsedBank = foundBank.toUpperCase();

      // 2. Account Number (typically digits between 8-25 chars)
      const foundAcc = tokens.find(t => /^\d{8,25}$/.test(t));
      if (foundAcc) parsedAccNum = foundAcc;

      // 3. Amount/Nominal
      const foundAmount = tokens.find(t => {
        const clean = t.replace(/,/g, '');
        const num = parseFloat(clean);
        return !isNaN(num) && num > 500 && t !== foundAcc && !t.includes('-');
      });
      if (foundAmount) {
        const clean = foundAmount.replace(/,/g, '');
        parsedAmount = Math.round(parseFloat(clean));
      }

      // 4. Username (usually lowercase alphanumeric, between 3-20 chars)
      const foundUser = tokens.find(t => /^[a-z0-9_]{3,20}$/.test(t) && t.toUpperCase() !== parsedBank);
      if (foundUser) parsedUser = foundUser;

      // 5. Full Name (alphabetical words positioned in between username and account number)
      const userIdx = tokens.indexOf(parsedUser);
      const accIdx = tokens.indexOf(parsedAccNum);
      if (userIdx !== -1 && accIdx !== -1 && accIdx > userIdx + 1) {
        parsedName = tokens.slice(userIdx + 1, accIdx).join(' ');
      } else {
        // Fallback names if indices are scrambled
        const nameTokens = tokens.filter(t => 
          /^[A-Za-z]+$/.test(t) && 
          t.toUpperCase() !== parsedBank && 
          t !== parsedUser && 
          t.toLowerCase() !== 'wrong' &&
          t.toLowerCase() !== 'error' &&
          t.toLowerCase() !== 'withdraw'
        );
        if (nameTokens.length > 0) {
          parsedName = nameTokens.join(' ');
        }
      }
    }

    setBank(parsedBank || 'TIDAK TERDETEKSI');
    setAccountNumber(parsedAccNum || 'TIDAK TERDETEKSI');
    setUsername(parsedUser || 'TIDAK TERDETEKSI');
    setFullName(parsedName || 'TIDAK TERDETEKSI');
    setAmountVal(parsedAmount ? String(parsedAmount) : '0');
  };

  useEffect(() => {
    handleParse(inputText);
  }, [inputText]);

  // Handles copying a specified value and animating UI
  const handleCopyValue = (val: string, fieldName: string) => {
    if (!val || val === 'TIDAK TERDETEKSI' || val === '0') {
      onToast('info', `Gagal menyalin: data ${fieldName} kosong atau belum terisi`);
      return;
    }
    navigator.clipboard.writeText(val)
      .then(() => {
        onToast('success', `${fieldName} berhasil disalin ke clipboard!`);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin ke clipboard.');
      });
  };

  // Helper when clicking or focusing on any input to trigger automatic select & instant copy
  const handleInputFocusSelect = (e: React.FocusEvent<HTMLInputElement>, fieldName: string, value: string) => {
    e.target.select();
    if (value && value !== 'TIDAK TERDETEKSI' && value !== '0') {
      navigator.clipboard.writeText(value)
        .then(() => {
          onToast('success', `${fieldName} tersalin otomatis!`);
          setCopiedField(fieldName);
          setTimeout(() => setCopiedField(null), 1500);
        });
    }
  };

  const handleCopyFormattedGroup = () => {
    const numericAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g, '')) || 0;
    const formatted = `=== DATA WD WRONG ===\n` +
                      `Bank        : ${bank}\n` +
                      `No. Rekening: ${accountNumber}\n` +
                      `Userid      : ${username}\n` +
                      `Nama Rekening: ${fullName}\n` +
                      `Nominal     : ${formatIDRICOMMA(numericAmount)}`;

    navigator.clipboard.writeText(formatted)
      .then(() => {
        onToast('success', 'Rincian data WD Wrong berhasil disalin dalam satu format!');
        setCopiedField('all_group');
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => {
        onToast('info', 'Gagal menyalin kelompok format.');
      });
  };

  const handleLoadSampleWrong = () => {
    setInputText(`1\t\tcengbig123\tBiqi Yusa Putra\t354801040957535\tBRI\tLGBDT-GARUDA1902175\t-\t2026-06-22 09:38:31\t-\t105,000.00\twrong\tWithdraw auto request is error!\tResend Move`);
    onToast('success', 'Contoh data WD Wrong berhasil dimuat');
  };

  const handleClear = () => {
    setInputText('');
    setBank('');
    setAccountNumber('');
    setUsername('');
    setFullName('');
    setAmountVal('');
  };

  const hasAnyData = bank || accountNumber || username || fullName || amountVal;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 bg-slate-950/40 border-white/10 shadow-[0_0_25px_rgba(239,68,68,0.12)] relative overflow-hidden group">
      
      {/* Visual Red accent representation on the background */}
      <div className="absolute top-0 right-0 h-28 w-28 bg-rose-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-600/8 transition-colors" />

      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-display text-xs sm:text-sm font-black text-rose-400 tracking-wider uppercase flex items-center gap-1">
            ALAT PEMISAH DATA WD WRONG &bull; QUICK COPIER
          </h3>
        </div>

        <button
          onClick={handleLoadSampleWrong}
          className="text-[10px] text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1 cursor-pointer transition-all bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20"
        >
          <Sparkles className="h-3 w-3 text-red-400" />
          Coba Paste Contoh Tabular
        </button>
      </div>

      {/* Main Single Paste Text Area */}
      <div className="relative">
        <textarea
          id="raw-wrong-data"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tempel data WD Wrong satu baris di sini... (sekali tempel langsung memisahkan ke 5 kolom di bawah)"
          className="w-full min-h-[75px] rounded-xl border border-white/10 p-3.5 text-xs font-mono bg-slate-900/60 hover:bg-slate-900/85 focus:bg-slate-950 text-slate-100 placeholder:text-slate-500 transition-all leading-normal outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400"
        />
        {inputText && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 bottom-3 text-slate-400 hover:text-rose-400 transition-colors h-6 w-6 rounded flex items-center justify-center bg-slate-950/80 border border-white/5 hover:border-rose-500/20"
            title="Bersihkan Semua Input"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* The 5 Columns / Inputs Fields Section (Always visible for cleaner structure) */}
      <div className="mt-5 space-y-4">
        
        <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2 text-[10px] text-rose-300/90 leading-tight">
          <div className="flex items-center gap-1.5">
            <CornerDownRight className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span><strong>FITUR SHORTCUT COPIER:</strong> Klik atau salin langsung di masing-masing kolom input di bawah ini. Nilai dapat diedit manual jika diinginkan.</span>
          </div>
        </div>

        {/* 5 columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          
          {/* Kolom 1: Jenis Bank */}
          <div className="relative border border-white/5 hover:border-blue-500/25 bg-slate-900/35 rounded-xl p-3 pt-2.5 transition-all flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Landmark className="h-3 w-3 text-blue-400" />
                1. Jenis Bank
              </span>
              {bank && bank !== 'TIDAK TERDETEKSI' && (
                <span className="text-[8px] text-blue-400 font-bold">Auto-Copy On Click</span>
              )}
            </label>
            <div className="relative flex items-center mt-1">
              <input
                ref={bankRef}
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                onFocus={(e) => handleInputFocusSelect(e, 'Jenis Bank', bank)}
                placeholder="cth. BRI/BCA"
                className="w-full bg-slate-950/85 text-xs font-mono font-extrabold text-blue-300 pr-8 pl-2.5 py-2 rounded-lg border border-white/5 focus:border-blue-500 outline-none text-center uppercase"
              />
              <button
                onClick={() => handleCopyValue(bank, 'Jenis Bank')}
                className="absolute right-1.5 p-1 rounded hover:bg-white/5 text-slate-400 hover:text-blue-400 transition-colors"
                title="Salin Bank"
              >
                {copiedField === 'Jenis Bank' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Kolom 2: Nomor Rekening */}
          <div className="relative border border-white/5 hover:border-emerald-500/25 bg-slate-900/35 rounded-xl p-3 pt-2.5 transition-all flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-emerald-400" />
                2. No. Rekening
              </span>
              {accountNumber && accountNumber !== 'TIDAK TERDETEKSI' && (
                <span className="text-[8px] text-emerald-400 font-bold">Auto-Copy On Click</span>
              )}
            </label>
            <div className="relative flex items-center mt-1">
              <input
                ref={accNumRef}
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                onFocus={(e) => handleInputFocusSelect(e, 'Nomor Rekening', accountNumber)}
                placeholder="Nomor rekening"
                className="w-full bg-slate-950/85 text-xs font-mono font-extrabold text-emerald-400 pr-8 pl-2.5 py-2 rounded-lg border border-white/5 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={() => handleCopyValue(accountNumber, 'Nomor Rekening')}
                className="absolute right-1.5 p-1 rounded hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Salin No Rekening"
              >
                {copiedField === 'Nomor Rekening' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Kolom 3: User ID */}
          <div className="relative border border-white/5 hover:border-amber-500/25 bg-slate-900/35 rounded-xl p-3 pt-2.5 transition-all flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-amber-400" />
                3. User ID
              </span>
              {username && username !== 'TIDAK TERDETEKSI' && (
                <span className="text-[8px] text-amber-500 font-bold">Auto-Copy On Click</span>
              )}
            </label>
            <div className="relative flex items-center mt-1">
              <input
                ref={userRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => handleInputFocusSelect(e, 'User ID', username)}
                placeholder="ID member"
                className="w-full bg-slate-950/85 text-xs font-mono font-extrabold text-amber-300 pr-8 pl-2.5 py-2 rounded-lg border border-white/5 focus:border-amber-500 outline-none"
              />
              <button
                onClick={() => handleCopyValue(username, 'User ID')}
                className="absolute right-1.5 p-1 rounded hover:bg-white/5 text-slate-400 hover:text-amber-500 transition-colors"
                title="Salin User ID"
              >
                {copiedField === 'User ID' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Kolom 4: Nama Rekening */}
          <div className="relative border border-white/5 hover:border-purple-500/25 bg-slate-900/35 rounded-xl p-3 pt-2.5 transition-all flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-400" />
                4. Nama Rekening
              </span>
              {fullName && fullName !== 'TIDAK TERDETEKSI' && (
                <span className="text-[8px] text-purple-400 font-bold">Auto-Copy On Click</span>
              )}
            </label>
            <div className="relative flex items-center mt-1">
              <input
                ref={nameRef}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={(e) => handleInputFocusSelect(e, 'Nama Rekening', fullName)}
                placeholder="Nama pemilik rekening"
                className="w-full bg-slate-950/85 text-xs font-sans font-extrabold text-purple-300 pr-8 pl-2.5 py-2 rounded-lg border border-white/5 focus:border-purple-500 outline-none"
              />
              <button
                onClick={() => handleCopyValue(fullName, 'Nama Rekening')}
                className="absolute right-1.5 p-1 rounded hover:bg-white/5 text-slate-400 hover:text-purple-400 transition-colors"
                title="Salin Nama Rekening"
              >
                {copiedField === 'Nama Rekening' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Kolom 5: Nominal WD */}
          <div className="relative border border-white/5 hover:border-rose-500/25 bg-slate-900/35 rounded-xl p-3 pt-2.5 transition-all flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-rose-400" />
                5. Nominal (Rp)
              </span>
              {amountVal && amountVal !== '0' && (
                <span className="text-[8px] text-rose-400 font-bold font-mono">{formatIDRICOMMA(Number(amountVal))}</span>
              )}
            </label>
            <div className="relative flex items-center mt-1">
              <input
                ref={amountRef}
                type="text"
                value={amountVal}
                onChange={(e) => setAmountVal(e.target.value)}
                onFocus={(e) => handleInputFocusSelect(e, 'Nominal', amountVal)}
                placeholder="Nominal Penarikan"
                className="w-full bg-slate-950/85 text-xs font-mono font-extrabold text-rose-400 pr-16 pl-2.5 py-2 rounded-lg border border-white/5 focus:border-rose-500 outline-none"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button
                  onClick={() => handleCopyValue(amountVal, 'Nominal')}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Salin Nominal Bersih"
                >
                  {copiedField === 'Nominal' ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                </button>
                <button
                  onClick={() => handleCopyValue(formatIDRICOMMA(Number(amountVal)), 'Format Uang')}
                  className="px-1 text-[8px] bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded py-1 transition-all"
                  title="Salin Format Rp"
                >
                  Rp
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Action Button: Group formatting structured copiers */}
        {hasAnyData && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-rose-500/70" />
              <span>Semua nilai bersifat dinamis. Anda bisa mengganti data kolom di atas kapan saja secara manual.</span>
            </div>
            
            <button
              onClick={handleCopyFormattedGroup}
              className="inline-flex items-center gap-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 px-5.5 py-2 cursor-pointer transition-all shadow-md hover:shadow-red-500/10 shrink-0 w-full sm:w-auto justify-center"
            >
              <ClipboardCheck className="h-4 w-4" />
              {copiedField === 'all_group' ? 'Segrup Terformat Tersalin!' : 'Copy Semua Terstruktur (1 Format Group)'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
