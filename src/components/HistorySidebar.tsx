/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bookmark, FolderOpen, Trash2, Edit3, Save, Check, Plus, Calendar, Database } from 'lucide-react';
import { ImportSession } from '../types';

interface HistorySidebarProps {
  sessions: ImportSession[];
  activeSessionId: string | null;
  onLoadSession: (id: string) => void;
  onSaveCurrentSession: (name: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  hasCurrentData: boolean;
  triggerConfirm?: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export default function HistorySidebar({
  sessions,
  activeSessionId,
  onLoadSession,
  onSaveCurrentSession,
  onDeleteSession,
  onRenameSession,
  hasCurrentData,
  triggerConfirm
}: HistorySidebarProps) {
  const [newSessionName, setNewSessionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const formatIDR = (val: number) => {
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(absVal));
    return `${val < 0 ? '-' : ''}Rp ${formatted}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    onSaveCurrentSession(newSessionName.trim());
    setNewSessionName('');
  };

  const startRename = (session: ImportSession) => {
    setEditingId(session.id);
    setTempName(session.name);
  };

  const commitRename = (id: string) => {
    if (tempName.trim()) {
      onRenameSession(id, tempName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 h-full flex flex-col gap-5">
      
      {/* Sidebar Header */}
      <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
        <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 border border-indigo-100">
          <Database className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-gray-900">Arsip Sesi Rekapan</h3>
          <p className="text-[10px] text-gray-500 font-medium">Simpan hasil kalkulasi secara lokal</p>
        </div>
      </div>

      {/* Save Current Session Form */}
      {hasCurrentData && (
        <form onSubmit={handleSave} className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-200/50">
          <label htmlFor="new-session-name" className="text-[10px] font-bold text-gray-600 block">Simpan Sesi Saat Ini</label>
          <div className="flex gap-1.5">
            <input
              id="new-session-name"
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Contoh: Rekap Pagi 21 Juni"
              className="flex-1 rounded-lg border border-gray-200 bg-white py-1 px-2.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-sans placeholder:text-gray-400"
            />
            <button
              type="submit"
              id="btn-save-session"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 cursor-pointer flex items-center justify-center transition-colors shadow-xs"
              title="Simpan Sesi"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] max-h-[300px] lg:max-h-none">
        {sessions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl bg-slate-50/20">
            <Bookmark className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
            <span className="text-[11px] text-gray-400 font-medium block">Belum ada sesi disimpan</span>
            <span className="text-[9px] text-gray-400 block px-4 mt-0.5">Sesi rekap membantu Anda beralih antar database impor secara instan</span>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingId;
            const totalAmount = session.transactions.reduce((acc, curr) => acc + curr.amount, 0);

            return (
              <div
                key={session.id}
                className={`relative group rounded-xl p-3 border transition-all ${
                  isActive
                    ? 'border-indigo-200 bg-indigo-50/30 shadow-xs'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onLoadSession(session.id)}
                    className="flex-1 text-left cursor-pointer select-none"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && commitRename(session.id)}
                          className="rounded border border-indigo-200 bg-white py-0.5 px-2 text-xs font-semibold text-gray-800 outline-none w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => commitRename(session.id)}
                          className="text-emerald-600 hover:text-emerald-800 p-0.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-xs font-bold block truncate leading-tight ${isActive ? 'text-indigo-950' : 'text-gray-800'}`}>
                          {session.name}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] bg-white font-mono border border-gray-100 text-gray-500 rounded px-1 py-0.5 font-bold leading-none">
                            {session.transactions.length} Trx
                          </span>
                          <span className="text-[10px] text-indigo-600 font-mono font-bold leading-none">
                            {formatIDR(totalAmount)}
                          </span>
                        </div>
                      </>
                    )}
                    
                    <span className="text-[8px] text-gray-400 flex items-center gap-1 mt-1 font-sans">
                      <Calendar className="h-2 w-2" />
                      {new Date(session.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>

                  {/* Actions (Edit / Delete) */}
                  {!isEditing && (
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                      <button
                        onClick={() => startRename(session)}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        title="Ubah Nama"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (triggerConfirm) {
                            triggerConfirm({
                              title: 'Hapus Arsip Sesi',
                              message: `Apakah Anda yakin ingin menghapus arsip sesi "${session.name}"? Seluruh data transaksi di dalamnya akan terhapus secara permanen dari penyimpanan lokal.`,
                              confirmText: 'Ya, Hapus Sesi',
                              cancelText: 'Batal',
                              isDestructive: true,
                              onConfirm: () => onDeleteSession(session.id)
                            });
                          } else {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
