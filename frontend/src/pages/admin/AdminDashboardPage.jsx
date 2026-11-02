import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { formatRupiah, formatDateTime, BOOKING_STATUS_CONFIG } from '../../utils/format';
import {
  Users,
  Calendar,
  CreditCard,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminService.getDashboard();
        if (res.data) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-slate-400 text-sm mt-3">Memuat statistik operasional...</p>
      </div>
    );
  }

  const {
    total_bookings,
    total_customers,
    total_services,
    total_revenue,
    status_breakdown,
    revenue_trend,
    recent_bookings,
    recent_payments,
  } = data || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Dashboard Operasional</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan performa pemesanan layanan, kapasitas jadwal, dan pendapatan Midtrans.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan Terverifikasi</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{formatRupiah(total_revenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reservasi</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{total_bookings}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggan Terdaftar</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{total_customers}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Layanan Aktif</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{total_services}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-xl">
          <span className="text-xs text-amber-700 font-semibold">Menunggu Pembayaran</span>
          <p className="text-xl font-bold text-amber-800 mt-1">{status_breakdown?.pending_payment || 0}</p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
          <span className="text-xs text-emerald-700 font-semibold">Terkonfirmasi</span>
          <p className="text-xl font-bold text-emerald-800 mt-1">{status_breakdown?.confirmed || 0}</p>
        </div>
        <div className="bg-blue-50/60 border border-blue-200/70 p-4 rounded-xl">
          <span className="text-xs text-blue-700 font-semibold">Selesai</span>
          <p className="text-xl font-bold text-blue-800 mt-1">{status_breakdown?.completed || 0}</p>
        </div>
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl">
          <span className="text-xs text-slate-600 font-semibold">Batal / Expired</span>
          <p className="text-xl font-bold text-slate-700 mt-1">{status_breakdown?.cancelled_or_expired || 0}</p>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Tren Pendapatan 7 Hari Terakhir</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Berdasarkan tanggal pembayaran terverifikasi.</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rp ${val / 1000}k`}
              />
              <Tooltip
                formatter={(val) => [formatRupiah(val), 'Pendapatan']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings & Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Booking Terbaru</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_bookings?.map((b) => {
              const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;
              return (
                <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{b.booking_code}</span>
                    <p className="text-slate-500 font-medium mt-0.5">{b.customer_name} • {b.service_name}</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(b.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      {statusCfg.label}
                    </span>
                    <p className="font-bold text-slate-900 mt-1">{formatRupiah(b.total_amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Midtrans Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Transaksi Midtrans Terbaru</h3>
            <Link to="/admin/payments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_payments?.map((p) => {
              const isPaid = p.status === 'PAID';
              return (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800 truncate max-w-[200px] block">
                      {p.order_id}
                    </span>
                    <p className="text-slate-500 mt-0.5">
                      Metode: <strong>{p.payment_type || 'Snap'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                        isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                    <p className="font-bold text-slate-900 mt-1">{formatRupiah(p.gross_amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

