import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService } from '../../services/serviceService';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah, formatDate } from '../../utils/format';
import { loadSnapScript, openSnapModal } from '../../utils/midtrans';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Sun,
  Sunset,
  Sparkles,
} from 'lucide-react';

export default function BookingFlowPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loadingService, setLoadingService] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate Quick Dates (Next 5 days)
  const quickDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label =
      i === 0
        ? 'Hari Ini'
        : i === 1
        ? 'Besok'
        : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    return { dateStr, label };
  });

  // 1. Fetch Service Info
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await serviceService.getService(serviceId);
        if (res.data) setService(res.data);
      } catch (err) {
        toast.error('Layanan tidak ditemukan.');
      } finally {
        setLoadingService(false);
      }
    };
    fetchService();
  }, [serviceId]);

  // 2. Fetch Availability Slots for Date
  useEffect(() => {
    if (!serviceId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await serviceService.getAvailability(serviceId, selectedDate);
        if (res.data?.slots) {
          setSlots(res.data.slots);
        }
      } catch (err) {
        toast.error('Gagal memuat jadwal ketersediaan.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [serviceId, selectedDate]);

  // Group slots by time of day
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.start_time_formatted.split(':')[0], 10);
    return hour < 12;
  });
  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.start_time_formatted.split(':')[0], 10);
    return hour >= 12 && hour < 15;
  });
  const eveningSlots = slots.filter((s) => {
    const hour = parseInt(s.start_time_formatted.split(':')[0], 10);
    return hour >= 15;
  });

  // 3. Handle Submit Booking & Open Midtrans Snap
  const handleBookingAndPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Silakan masuk terlebih dahulu untuk melanjutkan pemesanan.');
      navigate('/login', { state: { from: { pathname: `/book/${serviceId}` } } });
      return;
    }

    if (!selectedSlot) {
      toast.warning('Silakan pilih salah satu jadwal sesi terlebih dahulu.');
      return;
    }

    setSubmitting(true);

    try {
      // Step A: Create booking in backend
      const bookingRes = await bookingService.createBooking({
        service_id: service.id,
        booking_slot_id: selectedSlot.id,
        notes: notes,
      });

      const newBooking = bookingRes.data;
      toast.success('Reservasi berhasil dibuat! Membuka Midtrans...');

      // Step B: Request Midtrans Snap Token
      const checkoutRes = await paymentService.checkout(newBooking.id);
      const { snap_token, client_key, payment_id } = checkoutRes.data;

      // Step C: Load Snap script and trigger payment modal
      const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
      await loadSnapScript(client_key || import.meta.env.VITE_MIDTRANS_CLIENT_KEY, isProduction);

      if (snap_token.startsWith('SIMULATED_') || snap_token.startsWith('SANDBOX_FALLBACK_')) {
        navigate(`/payment-result/${payment_id}?status=simulated`);
        return;
      }

      openSnapModal(snap_token, {
        onSuccess: function () {
          navigate(`/payment-result/${payment_id}?status=success`);
        },
        onPending: function () {
          navigate(`/payment-result/${payment_id}?status=pending`);
        },
        onError: function () {
          navigate(`/payment-result/${payment_id}?status=error`);
        },
        onClose: function () {
          navigate(`/customer/dashboard`);
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memproses pemesanan.');
      setSubmitting(false);
    }
  };

  if (loadingService) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="text-slate-500 text-sm mt-3">Memuat detail layanan...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-rose-500 font-semibold">Layanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Breadcrumb */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Kembali ke Katalog</span>
        </button>

        {/* Step Indicator Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
              Pemesanan Layanan
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{service.name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Kategori: <strong>{service.category?.name || 'Umum'}</strong> • Durasi:{' '}
              <strong>{service.duration_minutes} Menit</strong> • Kapasitas: <strong>{service.capacity} Orang</strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-semibold">Tarif Layanan</span>
            <span className="text-2xl font-extrabold text-indigo-600">{formatRupiah(service.price)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Date and Slot selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Date */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">1. Tentukan Tanggal Kunjungan</h2>
            </div>

            {/* Quick date pills */}
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <button
                  key={qd.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(qd.dateStr)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center min-w-[90px] ${
                    selectedDate === qd.dateStr
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{qd.label}</span>
                  <span
                    className={`text-[10px] mt-0.5 font-normal ${
                      selectedDate === qd.dateStr ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {qd.dateStr.slice(5)}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center space-x-3 text-xs text-slate-500">
              <span>Atau pilih tanggal lain:</span>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Step 2: Pick Time Slot */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">2. Pilih Sesi Jam Tersedia</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                {slots.filter((s) => s.is_available).length} Slot Tersedia
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
                Memeriksa ketersediaan jadwal...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-slate-700 text-sm font-bold">Tidak ada sesi jadwal operasional pada tanggal ini.</p>
                <p className="text-xs text-slate-400">Silakan pilih tanggal lain di atas.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Slots */}
                {morningSlots.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pagi (09:00 - 12:00)</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {morningSlots.map((slot) => renderSlotButton(slot, selectedSlot, setSelectedSlot))}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoonSlots.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sun className="w-3.5 h-3.5 text-orange-500" />
                      <span>Siang (12:00 - 15:00)</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {afternoonSlots.map((slot) => renderSlotButton(slot, selectedSlot, setSelectedSlot))}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {eveningSlots.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Sore (15:00 - 18:00)</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {eveningSlots.map((slot) => renderSlotButton(slot, selectedSlot, setSelectedSlot))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Optional Notes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">3. Catatan Khusus untuk Kami (Opsional)</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Permintaan terapis tertentu / permintaan ruangan khusus..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Langkah Terakhir</span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">Ringkasan Pemesanan</h2>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-bold text-slate-800 text-right">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Durasi:</span>
              <span className="font-semibold text-slate-800">{service.duration_minutes} Menit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span className="font-semibold text-slate-800">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Sesi:</span>
              <span className="font-bold text-slate-900">
                {selectedSlot
                  ? `${selectedSlot.start_time_formatted} - ${selectedSlot.end_time_formatted}`
                  : 'Belum dipilih'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Total Tagihan:</span>
            <span className="text-2xl font-extrabold text-indigo-600">
              {formatRupiah(service.price)}
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-start space-x-2.5 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
            <span className="leading-relaxed">
              Jadwal dijamin aman dari double-booking dengan sistem kunci atomik kami.
            </span>
          </div>

          <button
            type="button"
            disabled={!selectedSlot || submitting}
            onClick={handleBookingAndPayment}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none disabled:transform-none text-sm"
          >
            {submitting ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Lanjut Bayar via Midtrans Snap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderSlotButton(slot, selectedSlot, setSelectedSlot) {
  const isSelected = selectedSlot?.id === slot.id;
  const isFullOrPast = !slot.is_available;

  return (
    <button
      key={slot.id}
      type="button"
      disabled={isFullOrPast}
      onClick={() => setSelectedSlot(slot)}
      className={`p-3.5 rounded-2xl border text-left transition transform duration-150 flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-600/30 scale-[1.02] shadow-sm'
          : isFullOrPast
          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 text-slate-800 hover:scale-[1.01]'
      }`}
    >
      <div className="font-bold text-sm">
        {slot.start_time_formatted} - {slot.end_time_formatted}
      </div>
      <div className="mt-2 text-[11px]">
        {slot.is_past ? (
          <span className="text-slate-400">Sudah lewat</span>
        ) : slot.available_spots <= 0 ? (
          <span className="text-rose-500 font-bold">Penuh</span>
        ) : (
          <span className="text-emerald-600 font-bold">
            Sisa {slot.available_spots} slot
          </span>
        )}
      </div>
    </button>
  );
}
