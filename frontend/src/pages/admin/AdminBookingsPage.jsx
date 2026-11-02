import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatRupiah, formatDateTime, BOOKING_STATUS_CONFIG } from '../../utils/format';
import { Search, Filter, Eye, CheckCircle2, AlertCircle, Edit, Calendar } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('CONFIRMED');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (search) params.search = search;

      const res = await adminService.getBookings(params);
      if (res.data?.data) {
        setBookings(res.data.data);
        setTotalPages(res.data.last_page || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status === 'PENDING_PAYMENT' ? 'CONFIRMED' : 'COMPLETED');
    setReason('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });
    try {
      await adminService.updateBookingStatus(selectedBooking.id, newStatus, reason);
      setMessage({ type: 'success', text: `Status booking berhasil diubah ke ${newStatus}.` });
      setStatusModalOpen(false);
      fetchBookings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengubah status booking.',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Kelola Semua Reservasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau seluruh pesanan masuk, verifikasi status, dan selesaikan janji temu layanan.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode booking, nama, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
            <option value="CONFIRMED">Terkonfirmasi</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />

          {(statusFilter || dateFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuat booking...</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Tidak ada booking yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Kode</th>
                  <th className="px-6 py-3.5 text-left">Pelanggan</th>
                  <th className="px-6 py-3.5 text-left">Layanan</th>
                  <th className="px-6 py-3.5 text-left">Jadwal Sesi</th>
                  <th className="px-6 py-3.5 text-left">Total</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PENDING_PAYMENT;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {b.booking_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{b.customer_name}</div>
                        <div className="text-xs text-slate-400">{b.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                        {b.service_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                        {formatDateTime(b.slot?.start_at)}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 whitespace-nowrap">
                        {formatRupiah(b.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openStatusModal(b)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Ubah Status</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {statusModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Ubah Status Reservasi</h3>
            <p className="text-xs text-slate-500">
              Booking: <strong className="font-mono text-slate-800">{selectedBooking.booking_code}</strong> ({selectedBooking.customer_name})
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Status Baru
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="CONFIRMED">Terkonfirmasi (Sudah Dibayar/Disetujui)</option>
                  <option value="COMPLETED">Selesai (Layanan Telah Diberikan)</option>
                  <option value="CANCELLED">Batalkan (Lepaskan Kapasitas Jadwal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan / Catatan Perubahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Pelanggan telah selesai melakukan perawatan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Perbarui Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

