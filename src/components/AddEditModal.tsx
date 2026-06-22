/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';

interface AddEditModalProps {
  transaction: Transaction | null; // Null means we are adding new
  onClose: () => void;
  onSave: (trx: Transaction) => void;
  nextIndex?: number;
}

export default function AddEditModal({
  transaction,
  onClose,
  onSave,
  nextIndex = 1
}: AddEditModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    accountNumber: '',
    paymentMethod: 'DANA',
    trxCode: '',
    uuid1: '-',
    dateTime: '',
    amount: 100000,
    status: 'wait for payment',
    uuid2: '-'
  });

  const [errorMsg, setErrorMsg] = useState('');

  // If in edit mode, populate initial form values
  useEffect(() => {
    if (transaction) {
      setFormData({
        username: transaction.username || '',
        fullName: transaction.fullName || '',
        accountNumber: transaction.accountNumber || '',
        paymentMethod: transaction.paymentMethod || 'DANA',
        trxCode: transaction.trxCode || '',
        uuid1: transaction.uuid1 || '-',
        dateTime: transaction.dateTime || '',
        amount: transaction.amount || 0,
        status: transaction.status || 'wait for payment',
        uuid2: transaction.uuid2 || '-'
      });
    } else {
      // Set typical default values for Add New mode
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      setFormData({
        username: '',
        fullName: '',
        accountNumber: '',
        paymentMethod: 'DANA',
        trxCode: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
        uuid1: '-',
        dateTime: nowStr,
        amount: 200000,
        status: 'wait for payment',
        uuid2: '-'
      });
    }
    setErrorMsg('');
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Form validation
    if (!formData.fullName.trim()) {
      setErrorMsg('Nama Lengkap harus diisi.');
      return;
    }
    if (!formData.username.trim()) {
      setErrorMsg('Username harus diisi.');
      return;
    }
    if (formData.amount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari 0.');
      return;
    }

    const payload: Transaction = {
      id: transaction ? transaction.id : `m-trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pastedIndex: transaction ? transaction.pastedIndex : nextIndex,
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      accountNumber: formData.accountNumber.trim() || '-',
      paymentMethod: formData.paymentMethod.toUpperCase().trim(),
      trxCode: formData.trxCode.trim() || '-',
      uuid1: formData.uuid1.trim() || '-',
      dateTime: formData.dateTime.trim() || new Date().toISOString().slice(0, 19).replace('T', ' '),
      amount: formData.amount,
      status: formData.status.trim(),
      uuid2: formData.uuid2.trim() || '-',
      rawLine: transaction?.rawLine || ''
    };

    onSave(payload);
  };

  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scaleIn">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">
              {transaction ? `Ubah Data Transaksi #${transaction.pastedIndex}` : 'Tambah Transaksi Manual Baru'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Isi detail bidang data di bawah (* bersifat wajib)</p>
          </div>
          <button
            onClick={onClose}
            id="modal-close"
            className="p-1 px-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Field Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-username" className="text-xs font-bold text-gray-700">Username Member *</label>
              <input
                id="modal-username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                placeholder="misal: semogahoki1221"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            {/* Field Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-fullname" className="text-xs font-bold text-gray-700">Nama Penerima *</label>
              <input
                id="modal-fullname"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="misal: Ifnu Juliawan"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Account number / HP */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-account" className="text-xs font-bold text-gray-700">Nomor Rekening / HP</label>
              <input
                id="modal-account"
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                placeholder="misal: 081264183559"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            {/* Bank payment channel */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-bank" className="text-xs font-bold text-gray-700">Bank / E-Wallet</label>
              <select
                id="modal-bank"
                value={formData.paymentMethod}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer text-gray-800 font-semibold"
              >
                {['DANA', 'BCA', 'BRI', 'BNI', 'GOPAY', 'OVO', 'LINKAJA', 'SEABANK', 'MANDIRI', 'CIMB'].map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Timestamp date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-datetime" className="text-xs font-bold text-gray-700">Tanggal & Waktu</label>
              <input
                id="modal-datetime"
                type="text"
                value={formData.dateTime}
                onChange={(e) => handleFieldChange('dateTime', e.target.value)}
                placeholder="YYYY-MM-DD HH:MM:ss"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-amount" className="text-xs font-bold text-gray-700">Nominal Transaksi (Rp) *</label>
              <input
                id="modal-amount"
                type="number"
                required
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="misal: 200000"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-status" className="text-xs font-bold text-gray-700">Status Pembayaran</label>
              <select
                id="modal-status"
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer text-gray-800"
              >
                <option value="wait for payment">Wait for payment</option>
                <option value="success">Success / Paid</option>
                <option value="failed">Failed / Cancelled</option>
              </select>
            </div>

            {/* Code */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-code" className="text-xs font-bold text-gray-700">Kode Transaksi</label>
              <input
                id="modal-code"
                type="text"
                value={formData.trxCode}
                onChange={(e) => handleFieldChange('trxCode', e.target.value)}
                placeholder="misal: LGBDT-MW727604"
                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* UUID indicators (Advanced fields) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500">ID Pengenal 1 (UUID1)</span>
              <input
                type="text"
                value={formData.uuid1}
                onChange={(e) => handleFieldChange('uuid1', e.target.value)}
                className="rounded-lg border border-gray-200 py-1 px-2.5 text-[10px] bg-slate-50 outline-none font-mono text-gray-500"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500">ID Pengenal 2 (UUID2)</span>
              <input
                type="text"
                value={formData.uuid2}
                onChange={(e) => handleFieldChange('uuid2', e.target.value)}
                className="rounded-lg border border-gray-200 py-1 px-2.5 text-[10px] bg-slate-50 outline-none font-mono text-gray-500"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              id="btn-modal-cancel"
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-modal-submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan Perubahan
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
