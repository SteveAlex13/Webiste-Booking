import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import BookingTimeline from '../../components/booking/BookingTimeline';
import { formatRupiah, formatDateTime, BOOKING_STATUS_CONFIG } from '../../utils/format';
import { loadSnapScript, openSnapModal } from '../../utils/midtrans';
import {
  Calendar,
  Clock,
  CreditCard,
  XCircle,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

const CANCELLATION_REASONS = [
  'Berhalangan hadir / Ada keperluan mendadak',
  'Ingin memilih jadwal atau tanggal yang berbeda',
  'Salah memilih jenis layanan',
  'Lainnya',
];

export default function CustomerDashboardPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'HISTORY'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Modal Cancel State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);

  // Paying State
  const [payingId, setPayingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getMyBookings();
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancelReason(CANCELLATION_REASONS[0]);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(bookingToCancel.id, cancelReason);
      toast.success('Reservasi berhasil dibatalkan. Kapasitas jadwal telah dilepas.');
      setCancelModalOpen(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan reservasi.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async (booking) => {
    setPayingId(booking.id);
    try {
      const checkoutRes = await paymentService.checkout(booking.id);
      const { snap_token, client_key, payment_id } = checkoutRes.data;

      const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
      await loadSnapScript(client_key || import.meta.env.VITE_MIDTRANS_CLIENT_KEY, isProduction);

      if (snap_token.startsWith('SIMULATED_') || snap_token.startsWith('SANDBOX_FALLBACK_')) {
        window.location.href = `/payment-result/${payment_id}`;
        return;
      }

      openSnapModal(snap_token, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil!');
          window.location.href = `/payment-result/${payment_id}`;
        },
        onPending: () => {
          toast.info('Menunggu penyelesaian pembayaran.');
          fetchBookings();
        },
        onError: () => {
          toast.error('Pembayaran gagal atau dibatalkan.');
          fetchBookings();
        },
        onClose: () => {
          fetchBookings();
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuka pembayaran Midtrans.');
    } finally {
      setPayingId(null);
    }
  };

  const copyBookingCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.info(`Kode ${code} berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'PENDING_PAYMENT' || b.status === 'CONFIRMED'
  );
  const historyBookings = bookings.filter(
    (b) => b.status !== 'PENDING_PAYMENT' && b.status !== 'CONFIRMED'
  );

  const displayedBookings =
    filterTab === 'ACTIVE'
      ? activeBookings
      : filterTab === 'HISTORY'
      ? historyBookings
      : bookings;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dashboard Reservasi Pelanggan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jadwal & Riwayat Booking</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Kelola janji temu Anda, selesaikan pembayaran QRIS via Midtrans, atau batalkan jadwal tanpa repot.
          </p>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/40 transition transform hover:-translate-y-0.5 text-sm self-start sm:self-auto"
        >
          <span>+ Pesan Layanan Lain</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setFilterTab('ALL')}
          className={`cursor-pointer bg-white p-6 rounded-2xl border transition shadow-sm hover:shadow-md ${
            filterTab === 'ALL' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reservasi</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{bookings.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Klik untuk menampilkan semua</span>
        </div>

        <div
          onClick={() => setFilterTab('ACTIVE')}
          className={`cursor-pointer bg-white p-6 rounded-2xl border transition shadow-sm hover:shadow-md ${
            filterTab === 'ACTIVE' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Booking Aktif</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{activeBookings.length}</p>
          <span className="text-xs text-indigo-500/80 mt-1 block">Menunggu bayar & terkonfirmasi</span>
        </div>

        <div
          onClick={() => setFilterTab('HISTORY')}
          className={`cursor-pointer bg-white p-6 rounded-2xl border transition shadow-sm hover:shadow-md ${
            filterTab === 'HISTORY' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Booking Selesai / Batal</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{historyBookings.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Riwayat sesi terdahulu</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({bookings.length})
        </button>
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'ACTIVE'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Aktif ({activeBookings.length})
        </button>
        <button
          onClick={() => setFilterTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'HISTORY'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Riwayat ({historyBookings.length})
        </button>
      </div>

      {/* Bookings Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
          Memuat daftar reservasi Anda...
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Belum Ada Reservasi</h3>
            <p className="text-xs text-slate-400 mt-1">Anda belum memiliki pesanan dalam kategori ini.</p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <span>Pesan Sekarang</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedBookings.map((b) => {
            const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;
            const isPending = b.status === 'PENDING_PAYMENT';
            const isConfirmed = b.status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Header Card */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 flex items-center space-x-1.5">
                        <span>{b.booking_code}</span>
                      </span>
                      <button
                        onClick={() => copyBookingCode(b.booking_code, b.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                        title="Salin Kode Booking"
                      >
                        {copiedId === b.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mt-3 group-hover:text-indigo-600 transition">
                    {b.service_name}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-700">
                        {formatDateTime(b.slot?.start_at)}
                      </span>
                    </div>
                  </div>

                  {/* Pending payment notice */}
                  {isPending && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span>Batas pembayaran 15 menit. Segera selesaikan sebelum expired.</span>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Pembayaran lunas. Jadwal Anda telah diamankan.</span>
                    </div>
                  )}
                </div>

                {/* Footer Card with Action */}
                <div className="p-6 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Total Biaya
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatRupiah(b.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(b)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                        >
                          Batalkan
                        </button>
                        <button
                          type="button"
                          disabled={payingId === b.id}
                          onClick={() => handlePayNow(b)}
                          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition flex items-center space-x-1.5"
                        >
                          {payingId === b.id ? (
                            <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar QRIS</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
                      title="Lihat Detail & Tiket"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Custom Cancellation Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        type="danger"
        title="Batalkan Reservasi Jadwal?"
        message={`Apakah Anda yakin ingin membatalkan booking (${bookingToCancel?.booking_code}) untuk layanan ${bookingToCancel?.service_name}? Slot jadwal akan segera dilepas untuk pelanggan lain.`}
        confirmText="Ya, Batalkan Booking"
        cancelText="Kembali"
        reason={cancelReason}
        setReason={setCancelReason}
        reasonsList={CANCELLATION_REASONS}
      />

      {/* Interactive Booking Detail & Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                  Tiket Reservasi
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">Rincian Booking</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Visual Timeline */}
            <BookingTimeline booking={selectedBooking} />

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Booking:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBooking.booking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Layanan:</span>
                <span className="font-semibold text-slate-900">{selectedBooking.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Sesi:</span>
                <span className="font-semibold text-slate-900">
                  {formatDateTime(selectedBooking.slot?.start_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pelanggan:</span>
                <span className="font-medium text-slate-900">{selectedBooking.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Telepon:</span>
                <span className="font-medium text-slate-900">{selectedBooking.customer_phone}</span>
              </div>
              {selectedBooking.notes && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <strong>Catatan Khusus:</strong> {selectedBooking.notes}
                </div>
              )}
              {selectedBooking.cancellation_reason && (
                <div className="pt-2 border-t border-rose-200 text-rose-700">
                  <strong>Alasan Pembatalan:</strong> {selectedBooking.cancellation_reason}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Pembayaran:
              </span>
              <span className="text-xl font-extrabold text-indigo-600">
                {formatRupiah(selectedBooking.total_amount)}
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              {selectedBooking.status === 'PENDING_PAYMENT' && (
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handlePayNow(b);
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 transition"
                >
                  Bayar Sekarang via Midtrans
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
