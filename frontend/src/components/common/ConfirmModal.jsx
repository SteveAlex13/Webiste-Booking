import React, { useEffect } from 'react';
import { AlertTriangle, X, Check, AlertCircle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
  reason = '',
  setReason = null,
  reasonsList = [],
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Animated Icon Container */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              isDanger
                ? 'bg-rose-50 text-rose-600 shadow-rose-100 ring-8 ring-rose-50/60'
                : isWarning
                ? 'bg-amber-50 text-amber-600 shadow-amber-100 ring-8 ring-amber-50/60'
                : 'bg-indigo-50 text-indigo-600 shadow-indigo-100 ring-8 ring-indigo-50/60'
            }`}
          >
            {isDanger && <AlertTriangle className="w-8 h-8 animate-bounce-short" />}
            {isWarning && <AlertCircle className="w-8 h-8" />}
            {!isDanger && !isWarning && <Check className="w-8 h-8" />}
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
        </div>

        {/* Reason Presets & Custom Input (if requested) */}
        {setReason && (
          <div className="mt-5 space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Alasan Pembatalan
            </label>
            {reasonsList.length > 0 && (
              <div className="space-y-1.5">
                {reasonsList.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium rounded-xl border transition flex items-center justify-between ${
                      reason === r
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {reason === r && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Atau tulis alasan lainnya di sini..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

