import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import api from '../../services/api';
import { formatRupiah, formatDateTime, BOOKING_STATUS_CONFIG } from '../../utils/format';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function PaymentResultPage() {
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  const fetchPayment = async () => {
    try {
      // First attempt to sync with Midtrans API in case payment just finished
      try {
        await paymentService.checkStatus(paymentId);
      } catch (e) {
        // Fallback to fetch payment normally if direct check doesn't succeed
      }

      const res = await paymentService.getPayment(paymentId);
      if (res.data) setPayment(res.data);
    } catch (err) {
      setError('Gagal memuat status pembayaran.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  // Handle checking status from Midtrans / server
  const handleCheckStatus = async () => {
    setRefreshing(true);
    try {
      await paymentService.checkStatus(paymentId);
      await fetchPayment();
    } catch (err) {
      console.error(err);
      setRefreshing(false);
    }
  };

  // Development sandbox helper: simulate instant settlement
  const handleSimulatePayment = async () => {
    if (!payment) return;
    setSimulating(true);
    try {
      // Trigger webhook directly using sandbox simulated signature
      await api.post('/webhooks/midtrans', {
        order_id: payment.order_id,
        status_code: '200',
        gross_amount: Math.round(payment.gross_amount).toFixed(2),
        signature_key: 'SIMULATED_SIGNATURE',
        transaction_status: 'settlement',
        payment_type: 'qris',
        transaction_id: 'SIM-' + Date.now(),
      });
      await fetchPayment();
    } catch (err) {
      alert('Simulasi gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-slate-500 text-sm mt-3">Memeriksa status transaksi...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <p className="text-red-500 font-semibold">{error || 'Data pembayaran tidak ditemukan.'}</p>
      </div>
    );
  }

  const isPaid = payment.status === 'PAID';
  const booking = payment.booking;
  const statusCfg = BOOKING_STATUS_CONFIG[booking?.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 p-8 text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          {isPaid ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Status Heading */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isPaid ? 'Pembayaran Berhasil Diverifikasi!' : 'Menunggu Konfirmasi Pembayaran'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isPaid
              ? 'Terima kasih, reservasi jadwal layanan Anda telah resmi terkonfirmasi.'
              : 'Silakan selesaikan pembayaran sebelum batas waktu reservasi Anda berakhir.'}
          </p>
        </div>

        {/* Receipt Box */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-left space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Kode Booking:</span>
            <span className="font-mono font-bold text-slate-900">{booking?.booking_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Order ID Midtrans:</span>
            <span className="font-mono text-xs text-slate-700">{payment.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Layanan:</span>
            <span className="font-semibold text-slate-900">{booking?.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jadwal Sesi:</span>
            <span className="font-semibold text-slate-900">
              {formatDateTime(booking?.slot?.start_at)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status Booking:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base">
            <span className="font-bold text-slate-700">Total Nominal:</span>
            <span className="text-xl font-extrabold text-indigo-600">
              {formatRupiah(payment.gross_amount)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isPaid && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={refreshing}
                onClick={handleCheckStatus}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Cek Status Terbaru</span>
              </button>

              <button
                type="button"
                disabled={simulating}
                onClick={handleSimulatePayment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition flex items-center justify-center space-x-2"
                title="Gunakan ini untuk langsung mengonfirmasi pembayaran di environment pengujian/sandbox"
              >
                {simulating ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <span>Simulasi Bayar Berhasil</span>
                )}
              </button>
            </div>
          )}

          <Link
            to="/customer/dashboard"
            className="block w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition text-center"
          >
            Buka Riwayat Booking Saya
          </Link>
        </div>
      </div>
    </div>
  );
}

