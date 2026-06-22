/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClipboardCopy, HelpCircle, AlertCircle, Sparkles, Sliders, PlayCircle } from 'lucide-react';
import { DEFAULT_SAMPLE_TEXT, autoDetectColumns, textToGrid } from '../utils/parser';
import { ColumnMapping } from '../types';

interface PasteSectionProps {
  onParse: (text: string, mapping?: ColumnMapping) => void;
  isLoading?: boolean;
}

export default function PasteSection({ onParse, isLoading = false }: PasteSectionProps) {
  const [inputText, setInputText] = useState('');
  const [showMappingPanel, setShowMappingPanel] = useState(false);
  const [previewGrid, setPreviewGrid] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    pastedIndex: -1,
    username: -1,
    fullName: -1,
    accountNumber: -1,
    paymentMethod: -1,
    trxCode: -1,
    uuid1: -1,
    dateTime: -1,
    amount: -1,
    status: -1,
    uuid2: -1
  });

  // Whenever text changes, analyze the columns for preview & auto-detect defaults
  useEffect(() => {
    const grid = textToGrid(inputText);
    setPreviewGrid(grid);
    if (grid.length > 0) {
      const detected = autoDetectColumns(grid);
      setMapping(detected);
    }
  }, [inputText]);

  const handleProcess = () => {
    if (!inputText.trim()) return;
    onParse(inputText, mapping);
  };

  const handleResetMapping = () => {
    if (previewGrid.length > 0) {
      const detected = autoDetectColumns(previewGrid);
      setMapping(detected);
    }
  };

  const handleLoadSample = () => {
    setInputText(DEFAULT_SAMPLE_TEXT.trim());
  };

  const updateMappingField = (field: keyof ColumnMapping, val: number) => {
    setMapping(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Helper lists for dropdown configuration
  const mapFieldLabels: Record<keyof ColumnMapping, string> = {
    pastedIndex: 'Nomor Index',
    username: 'Username Member',
    fullName: 'Nama Lengkap',
    accountNumber: 'Norek / No HP',
    paymentMethod: 'Bank / E-Wallet',
    trxCode: 'Kode Transaksi',
    uuid1: 'ID Pengenal 1',
    dateTime: 'Tanggal Waktu',
    amount: 'Nominal Jumlah',
    status: 'Status',
    uuid2: 'ID Pengenal 2'
  };

  const maxCols = previewGrid.length > 0 ? Math.max(...previewGrid.map(r => r.length)) : 0;
  const colIndices = Array.from({ length: maxCols }, (_, i) => i);

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 mb-6 bg-slate-950/40 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="raw-pasted-data" className="flex items-center gap-2 font-display text-base font-extrabold text-white">
          <ClipboardCopy className="h-4.5 w-4.5 text-blue-400" />
          Tempel Data Transaksi Baru (Withdraw Operate)
        </label>
        
        <button
          onClick={handleLoadSample}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          Gunakan Contoh Data
        </button>
      </div>

      <div className="relative">
        <textarea
          id="raw-pasted-data"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Contoh tempelan baris tabel:\n7\tsemogahoki1221\tifnu juliawan\t081264183559\tDANA\tLGBDT-MW727604\t...\t200,000.00\twait for payment`}
          className="w-full min-h-[140px] rounded-xl border border-white/10 p-4 text-xs font-mono bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-950 text-slate-100 placeholder:text-slate-500 transition-all leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        />
        {inputText && (
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5 font-mono">
            <span>{previewGrid.length} baris terdeteksi</span>
            <span>•</span>
            <span>{maxCols} kolom</span>
          </div>
        )}
      </div>

      {/* Column Auto-Detection Notification */}
      {previewGrid.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="text-xs text-blue-200 font-bold font-sans">
              Data terdeteksi otomatis! Klik "Proses & Hitung" untuk menampilkan rekap.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMappingPanel(prev => !prev)}
              id="btn-toggle-mapping"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg cursor-pointer transition-all"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              {showMappingPanel ? 'Sembunyikan Mapping Kolom' : 'Sesuaikan Kolom'}
            </button>
            
            <button
              onClick={handleProcess}
              id="btn-process-pasted"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer transition-all shadow-md"
            >
              <PlayCircle className="h-3.5 w-3.5 text-white" />
              Proses & Hitung
            </button>
          </div>
        </div>
      )}

      {/* Advanced Custom Mapping Editor */}
      {showMappingPanel && previewGrid.length > 0 && (
        <div className="mt-4 border border-white/5 rounded-xl p-4 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white">Pemetaan Struktur Kolom (Column Index)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Tentukan indeks kolom mana yang mewakili masing-masing data (0 = kolom pertama)</p>
            </div>
            
            <button
              onClick={handleResetMapping}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Reset ke Deteksi Otomatis
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(Object.keys(mapFieldLabels) as (keyof ColumnMapping)[]).map((field) => (
              <div key={field} className="flex flex-col gap-1 text-[11px]">
                <span className="font-bold text-slate-400 truncate">{mapFieldLabels[field]}</span>
                <select
                  value={mapping[field]}
                  id={`select-map-${field}`}
                  onChange={(e) => updateMappingField(field, parseInt(e.target.value, 10))}
                  className="rounded-lg border border-white/10 bg-slate-950 py-1 px-2 text-[11px] font-semibold text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value={-1}>Sembunyikan / Tidak Ada</option>
                  {colIndices.map((colIdx) => {
                    const sampleVal = previewGrid[0]?.[colIdx] || '';
                    const label = `K-${colIdx} (${sampleVal.length > 10 ? sampleVal.slice(0, 10) + '...' : sampleVal || 'kosong'})`;
                    return (
                      <option key={colIdx} value={colIdx}>{label}</option>
                    );
                  })}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-1.5 bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/20 text-[10px] text-blue-300">
            <AlertCircle className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pratinjau Baris Pertama:</span>
              <div className="mt-1 font-mono flex flex-wrap gap-x-3 gap-y-1 select-none">
                {Object.entries(mapping).map(([field, idx]) => {
                  if (idx === -1) return null;
                  const label = mapFieldLabels[field as keyof ColumnMapping];
                  const val = previewGrid[0]?.[idx] || '-';
                  return (
                    <span key={field} className="bg-slate-950 border border-white/5 rounded px-1.5 py-0.5 text-[9px] text-slate-200 font-sans">
                      <span className="font-bold text-slate-400">{label}:</span> <span className="font-mono text-blue-300">{val}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Text Placeholder / Tips */}
      {!inputText && (
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-slate-900/20 border border-dashed border-white/10 rounded-xl p-4">
          <HelpCircle className="h-4.5 w-4.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-slate-200">💡 Cara Mengulang/Mengambil Rekapan Total:</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
              <li>Buka halaman <span className="text-blue-400 font-bold">Withdraw Operate</span> di panel admin Anda.</li>
              <li>Salin (Block & Copy) baris-baris tabel transaksi atau HTML tabel secara penuh.</li>
              <li>Satelah disalin, tempelkan (Ctrl+V) langsung ke kotak input teks di atas.</li>
              <li>Sistem secara cerdas memotong baris, menyaring status <span className="text-amber-500 font-bold">"wait for payment"</span>, memvalidasi nominal, serta menampilkan kalkulasi instant secara real-time.</li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
}
