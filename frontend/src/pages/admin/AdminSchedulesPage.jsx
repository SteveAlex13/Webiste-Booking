import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Clock, Calendar, Plus, Trash2, Sparkles, Check } from 'lucide-react';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function AdminSchedulesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' | 'exceptions' | 'generate'
  const [businessHours, setBusinessHours] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete exception modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exceptionToDelete, setExceptionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Exception Form
  const [newException, setNewException] = useState({
    exception_date: '',
    start_time: '',
    end_time: '',
    is_closed: true,
    description: '',
  });

  // Generator Form
  const [genForm, setGenForm] = useState({
    service_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [hrsRes, excRes, svcRes] = await Promise.all([
        adminService.getBusinessHours(),
        adminService.getExceptions(),
        adminService.getServices(),
      ]);
      if (hrsRes.data) setBusinessHours(hrsRes.data);
      if (excRes.data) setExceptions(excRes.data);
      if (svcRes.data?.data) {
        setServices(svcRes.data.data);
        if (svcRes.data.data.length > 0) {
          setGenForm((prev) => ({ ...prev, service_id: svcRes.data.data[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHourChange = (index, field, value) => {
    const updated = [...businessHours];
    updated[index][field] = value;
    setBusinessHours(updated);
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await adminService.updateBusinessHours(businessHours);
      toast.success('Jam operasional berhasil disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan jam operasional.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.createException(newException);
      toast.success('Pengecualian jadwal berhasil ditambahkan.');
      setNewException({
        exception_date: '',
        start_time: '',
        end_time: '',
        is_closed: true,
        description: '',
      });
      fetchData();
    } catch (err) {
      toast.error('Gagal menambahkan pengecualian jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteExceptionModal = (exc) => {
    setExceptionToDelete(exc);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteException = async () => {
    if (!exceptionToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteException(exceptionToDelete.id);
      toast.success('Pengecualian jadwal berhasil dihapus.');
      setDeleteModalOpen(false);
      setExceptionToDelete(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus pengecualian.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateSlots = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.generateSlots(genForm);
      toast.success(res.message || 'Slot berhasil digenerate!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate slot jadwal.');
    } finally {
      setSaving(false);
    }
  };
    try {
      const res = await adminService.generateSlots(genForm);
      setMessage({ type: 'success', text: res.message || 'Slot berhasil digenerate!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal generate slot jadwal.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Memuat data jadwal...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Manajemen Jam Buka & Slot Jadwal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi hari operasional, hari libur khusus, dan buat slot pemesanan massal.
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('hours')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'hours'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Jam Operasional Mingguan
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'exceptions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pengecualian / Hari Libur Khusus ({exceptions.length})
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'generate'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Generator Slot Jadwal Massal
        </button>
      </div>

      {/* Tab 1: Business Hours */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            {businessHours.map((bh, idx) => (
              <div
                key={bh.day_of_week}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 gap-3"
              >
                <div className="w-28 font-bold text-slate-900 text-sm">
                  {DAY_NAMES[bh.day_of_week]}
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={bh.is_closed}
                      onChange={(e) => handleHourChange(idx, 'is_closed', e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span>Tutup / Libur</span>
                  </label>
                </div>

                {!bh.is_closed ? (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-medium">Buka:</span>
                    <input
                      type="time"
                      value={bh.open_time ? bh.open_time.substring(0, 5) : '09:00'}
                      onChange={(e) => handleHourChange(idx, 'open_time', e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <span className="text-slate-500 font-medium">Sampai:</span>
                    <input
                      type="time"
                      value={bh.close_time ? bh.close_time.substring(0, 5) : '18:00'}
                      onChange={(e) => handleHourChange(idx, 'close_time', e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-red-500 font-semibold px-3 py-1 bg-red-50 rounded-lg">
                    Toko Tutup Penuh
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveHours}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Jam Operasional'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Schedule Exceptions */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6">
          {/* Add form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Tambah Tanggal Khusus / Libur</h2>
            <form onSubmit={handleAddException} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={newException.exception_date}
                  onChange={(e) => setNewException({ ...newException, exception_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya"
                  value={newException.description}
                  onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="exc_closed"
                  checked={newException.is_closed}
                  onChange={(e) => setNewException({ ...newException, is_closed: e.target.checked })}
                  className="rounded text-red-600 h-4 w-4"
                />
                <label htmlFor="exc_closed" className="text-xs font-semibold text-slate-700">
                  Tutup Total
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  {saving ? 'Menyimpan...' : 'Tambah Hari Khusus'}
                </button>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {exceptions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Belum ada hari libur khusus.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Tanggal</th>
                    <th className="px-6 py-3 text-left">Keterangan</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exceptions.map((ex) => (
                    <tr key={ex.id}>
                      <td className="px-6 py-3.5 font-bold text-slate-900">{ex.exception_date}</td>
                      <td className="px-6 py-3.5 text-slate-600">{ex.description || '-'}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                          {ex.is_closed ? 'Tutup Penuh' : 'Jam Khusus'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => openDeleteExceptionModal(ex)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Libur Khusus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Slot Generator */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Generate Slot Jadwal Otomatis</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sistem akan otomatis menghitung slot waktu berdasarkan durasi layanan dan jam operasional harian.
            </p>
          </div>

          <form onSubmit={handleGenerateSlots} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Layanan
              </label>
              <select
                required
                value={genForm.service_id}
                onChange={(e) => setGenForm({ ...genForm, service_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} Menit)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mulai Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={genForm.start_date}
                  onChange={(e) => setGenForm({ ...genForm, start_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={genForm.end_date}
                  onChange={(e) => setGenForm({ ...genForm, end_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              {saving ? 'Sedang Memproses...' : 'Generate Slot Sekarang'}
            </button>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteException}
        loading={deleting}
        type="danger"
        title="Hapus Pengecualian Jadwal?"
        message={`Apakah Anda yakin ingin menghapus pengecualian tanggal ${exceptionToDelete?.exception_date}? Jam kerja reguler akan kembali berlaku pada hari tersebut.`}
        confirmText="Ya, Hapus"
      />
    </div>
  );
}

