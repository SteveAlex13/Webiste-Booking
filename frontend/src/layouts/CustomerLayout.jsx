import React from 'react';
import { Link, NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, User, LogOut, ChevronRight, Home } from 'lucide-react';

export default function CustomerLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900">BookingHub</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-1 text-sm text-slate-400">
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-600 font-medium">Customer Area</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/services"
                className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
              >
                + Pesan Layanan Baru
              </Link>
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-8 border-t border-slate-100 overflow-x-auto">
            <NavLink
              to="/customer/dashboard"
              end
              className={({ isActive }) =>
                `py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`
              }
            >
              Dashboard & Booking Saya
            </NavLink>
            <NavLink
              to="/customer/profile"
              className={({ isActive }) =>
                `py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`
              }
            >
              Profil Saya
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

