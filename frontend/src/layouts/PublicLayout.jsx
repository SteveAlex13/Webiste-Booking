import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hotel, User, LogOut, Menu, X, Shield, Sparkles, Star, MapPin, Phone } from 'lucide-react';

export default function PublicLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Banner / Announcement */}
      <div className="bg-amber-950 text-amber-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Nikmati Diskon Spesial Pembayaran Instan via QRIS Midtrans & Garansi Best Rate Langsung!</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-200/50 group-hover:scale-105 transition transform">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition">
                    The Royal Nusantara
                  </span>
                  <span className="flex text-amber-500 ml-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase block">
                  Resort & Luxury Suites
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition">
                Beranda
              </Link>
              <Link to="/services" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition">
                Kamar & Suite
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                  {isAdmin ? (
                    <Link
                      to="/admin/dashboard"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-800 rounded-xl hover:bg-amber-100 border border-amber-200 transition"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Admin Hotel Panel</span>
                    </Link>
                  ) : (
                    <Link
                      to="/customer/dashboard"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 border border-slate-200 transition"
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      <span>Reservasi Saya</span>
                    </Link>
                  )}
                  <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-slate-100"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-amber-600 transition"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl shadow-md hover:shadow-lg transition shadow-amber-600/30"
                  >
                    Daftar Akun
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Beranda
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kamar & Suite
            </Link>

            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/customer/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-amber-50"
                >
                  {isAdmin ? 'Admin Hotel Dashboard' : 'Reservasi Saya'}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 border border-slate-200"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white shadow"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-white">
                  <Hotel className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-white">The Royal Nusantara Resort</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Resort bintang lima dengan perpaduan keindahan alam tropis, layanan butler privat, dan suite mewah berpemandangan laut lepas. Dilengkapi sistem reservasi anti double-booking real-time dan pembayaran QRIS Midtrans.
              </p>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Jl. Pantai Indah Sunset Boulevard No. 88, Nusa Dua, Bali</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span>+62 361 8899000 | concierge@royalnusantara.com</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Navigasi Tamu</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="hover:text-amber-400 transition">Beranda</Link></li>
                <li><Link to="/services" className="hover:text-amber-400 transition">Koleksi Kamar & Suite</Link></li>
                <li><Link to="/customer/dashboard" className="hover:text-amber-400 transition">Status Reservasi Saya</Link></li>
                <li><Link to="/login" className="hover:text-amber-400 transition">Portal Tamu & Admin</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Jaminan Pembayaran</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Seluruh transaksi reservasi diproses melalui Midtrans Snap berstandar PCI-DSS Level 1 dengan dukungan QRIS cepat tanpa biaya tersembunyi.
              </p>
              <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-[11px] text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant QRIS & Bank Transfer</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 text-xs text-center text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span>&copy; {new Date().getFullYear()} The Royal Nusantara Resort & Luxury Suites. All rights reserved.</span>
            <span className="text-slate-600">Enterprise Hotel Booking Engine v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
