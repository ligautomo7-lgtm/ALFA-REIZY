import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Ambient blur backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#070b19]/60 backdrop-blur-md"
          />

          {/* Centered Modal Content Card with glassmorphism */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card p-6 shadow-2xl border border-white/25 z-10 flex flex-col gap-4 text-left select-none"
          >
            <div className="flex items-start gap-4">
              
              {/* Colored Indicator Rounded Icon */}
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                isDestructive 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                {isDestructive ? <Trash2 className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
              </div>

              {/* Title & Body */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {title}
                </h3>
                <p className="text-gray-500 font-sans text-xs mt-1.5 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer select-none"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onCancel(); // auto close
                }}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer select-none hover:shadow-md ${
                  isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {confirmText}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
