import React from 'react';
import { Check, Clock, CalendarCheck, Ban, Sparkles } from 'lucide-react';
import { formatDateTime } from '../../utils/format';

export default function BookingTimeline({ booking }) {
  if (!booking) return null;

  const isCancelled = booking.status === 'CANCELLED';
  const isExpired = booking.status === 'EXPIRED';

  if (isCancelled || isExpired) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-start space-x-3 text-xs text-rose-800">
        <Ban className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
        <div>
          <span className="font-bold text-sm block">
            {isCancelled ? 'Reservasi Telah Dibatalkan' : 'Reservasi Kedaluwarsa (Expired)'}
          </span>
          <p className="mt-0.5 text-rose-700 leading-relaxed">
            {booking.cancellation_reason ||
              'Batas waktu pembayaran telah habis atau pesanan dibatalkan. Kapasitas jadwal telah dilepas.'}
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      key: 'created',
      label: 'Dibuat',
      desc: formatDateTime(booking.created_at),
      isDone: true,
      isCurrent: false,
    },
    {
      key: 'payment',
      label: 'Pembayaran',
      desc: booking.status === 'PENDING_PAYMENT' ? 'Menunggu Midtrans' : 'Lunas',
      isDone: booking.status !== 'PENDING_PAYMENT',
      isCurrent: booking.status === 'PENDING_PAYMENT',
    },
    {
      key: 'confirmed',
      label: 'Terkonfirmasi',
      desc: booking.confirmed_at ? formatDateTime(booking.confirmed_at) : 'Menunggu jadwal',
      isDone: booking.status === 'CONFIRMED' || booking.status === 'COMPLETED',
      isCurrent: booking.status === 'CONFIRMED',
    },
    {
      key: 'completed',
      label: 'Selesai',
      desc: booking.completed_at ? formatDateTime(booking.completed_at) : 'Layanan siap',
      isDone: booking.status === 'COMPLETED',
      isCurrent: booking.status === 'COMPLETED',
    },
  ];

  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting bar */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => (
          <div key={step.key} className="flex flex-col items-center relative z-10 text-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                step.isDone
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : step.isCurrent
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-indigo-200 animate-pulse'
                  : 'bg-white text-slate-400 border-2 border-slate-300'
              }`}
            >
              {step.isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
            </div>
            <span
              className={`text-xs font-bold mt-2 ${
                step.isDone ? 'text-slate-900' : step.isCurrent ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 max-w-[80px] truncate leading-tight">
              {step.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

