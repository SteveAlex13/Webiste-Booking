import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatRupiah, formatDateTime, BOOKING_STATUS_CONFIG } from '../../utils/format';
import { BarChart3, Download, Filter, Calendar, Award } from 'lucide-react';

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports({
        start_date: startDate,
        end_date: endDate,
      });
      if (res.data) setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Laporan & Rekapitulasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis pendapatan dan layanan paling populer berdasarkan rentang tanggal.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Cetak / Ekspor PDF</span>
        </button>
      </div>

      {/* Date Filter Box */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          {loading ? 'Memuat...' : 'Terapkan Filter'}
        </button>
      </form>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Pendapatan Terverifikasi Periode Ini
          </span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {formatRupiah(reportData?.total_revenue || 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Booking Masuk Periode Ini
          </span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">
            {reportData?.total_bookings || 0} Reservasi
          </p>
        </div>
      </div>

      {/* Top Services Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Layanan Paling Banyak Dipesan</span>
        </h2>

        {reportData?.top_services?.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada data pemesanan pada periode ini.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reportData?.top_services?.map((svc, idx) => (
              <div key={svc.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{svc.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({formatRupiah(svc.price)})</span>
                  </div>
                </div>
                <div className="text-right font-extrabold text-indigo-600 text-sm">
                  {svc.bookings_count}x Dipesan
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Rincian Reservasi Periode</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Kode</th>
                <th className="px-6 py-3 text-left">Tgl Order</th>
                <th className="px-6 py-3 text-left">Pelanggan</th>
                <th className="px-6 py-3 text-left">Layanan</th>
                <th className="px-6 py-3 text-left">Nominal</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.bookings?.map((b) => {
                const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                      {b.booking_code}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {b.customer_name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 whitespace-nowrap">{b.service_name}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(b.total_amount)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

