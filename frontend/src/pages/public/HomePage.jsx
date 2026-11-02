import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { formatRupiah } from '../../utils/format';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, svcRes] = await Promise.all([
          serviceService.getCategories(),
          serviceService.getServices(),
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (svcRes.data) setServices(svcRes.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 pt-16 pb-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Sistem Pemesanan Layanan Online Terpadu</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Pesan Jadwal Layanan Tanpa Antri & Bayar Mudah
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Pilih layanan favorit, tentukan waktu luang Anda dengan sistem ketersediaan jadwal real-time, dan selesaikan pembayaran aman via Midtrans Snap.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200 transition transform hover:-translate-y-0.5"
              >
                <span>Lihat Semua Layanan</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/customer/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200 shadow-sm transition"
              >
                <span>Cek Booking Saya</span>
              </Link>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Anti Double-Booking</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Penguncian kapasitas berbasis database atomik menjamin jadwal yang Anda pilih tidak tertumpuk pelanggan lain.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Midtrans Snap Payment</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung QRIS, GoPay, ShopeePay, Virtual Account (BCA, Mandiri, BNI, BRI), dan kartu kredit.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Instan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Status otomatis terkonfirmasi secara real-time via webhook begitu pembayaran berhasil diverifikasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Pilihan Terbaik</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Layanan Populer</h2>
          </div>
          <Link
            to="/services"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 mt-2 md:mt-0"
          >
            <span>Semua Layanan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-64"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {service.category?.name || 'Umum'}
                      </span>
                      <div className="flex items-center text-xs text-slate-500 space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration_minutes} Menit</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {service.description || 'Layanan berkualitas tinggi dengan pelayanan memuaskan.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Tarif Layanan</span>
                      <span className="text-lg font-extrabold text-indigo-600">
                        {formatRupiah(service.price)}
                      </span>
                    </div>
                    <Link
                      to={`/book/${service.id}`}
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      <span>Pilih Jadwal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it Works */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold">Cara Mudah Melakukan Pemesanan</h2>
            <p className="text-slate-400 text-sm mt-2">Hanya butuh 4 langkah mudah untuk mengamankan slot layanan Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-lg font-bold">
                1
              </div>
              <h3 className="font-bold text-base">Pilih Layanan</h3>
              <p className="text-xs text-slate-400">Temukan layanan yang Anda butuhkan dengan detail harga dan durasi transparan.</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-lg font-bold">
                2
              </div>
              <h3 className="font-bold text-base">Pilih Tanggal & Slot</h3>
              <p className="text-xs text-slate-400">Lihat ketersediaan jam operasional langsung, bebas dari overbooking.</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-lg font-bold">
                3
              </div>
              <h3 className="font-bold text-base">Bayar via Midtrans</h3>
              <p className="text-xs text-slate-400">Pilih channel pembayaran favorit (QRIS, VA Bank, E-Wallet) dalam 15 menit.</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-lg font-bold">
                4
              </div>
              <h3 className="font-bold text-base">Konfirmasi Otomatis</h3>
              <p className="text-xs text-slate-400">Jadwal langsung terkonfirmasi otomatis dan simpan tiket booking Anda.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

