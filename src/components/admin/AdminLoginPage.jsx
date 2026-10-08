import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { loginAdmin } from '../../services/firebase.js';

/**
 * Strict Production Admin Login Page.
 * Pure Firebase Authentication (Email/Password only).
 * No public self-registration and no insecure backdoor PIN.
 * @param {Object} props
 * @param {() => void} props.onLoginSuccess
 * @param {() => void} props.onBackToCustomerPortal
 */
export const AdminLoginPage = ({ onLoginSuccess, onBackToCustomerPortal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Pure Firebase Email/Password Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await loginAdmin(email.trim(), password);
      setSuccessMessage('Kredensial valid! Mengalihkan ke dashboard...');
      setTimeout(() => onLoginSuccess(), 500);
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      let msg = 'Gagal masuk. Silakan periksa kembali email dan password Anda.';
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        msg = 'Email atau password administrator salah!';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan gagal. Akses ditangguhkan sementara demi keamanan.';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'Metode Email/Password belum diaktifkan di Firebase Console > Authentication.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          onClick={onBackToCustomerPortal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 font-bold text-xs shadow-xs border border-orange-100 transition-all btn-bounce cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF7A00]" />
          <span>Kembali ke Website Pelanggan</span>
        </button>

        <span className="text-[11px] font-bold text-orange-700 bg-orange-100/90 px-3 py-1 rounded-full border border-orange-200">
          🔒 Restricted Area
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 border border-orange-100 shadow-[0_20px_50px_-15px_rgba(255,122,0,0.15)] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#FF7A00] to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-500/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
            Portal Administrator
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Masuk dengan akun resmi yang telah terdaftar di Firebase Console
          </p>
        </div>

        {/* Feedback Alert Messages */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STRICT EMAIL & PASSWORD LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Email Administrator
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@beliyukjajan.com"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF7A00] focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                required
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF7A00] focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 hover:opacity-95 transition-all btn-bounce cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-3"
          >
            {isLoading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <span>Masuk ke Dashboard Administrator &rarr;</span>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-1 text-[11px] text-gray-400">
          <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Terverifikasi Firebase Authentication & IAM Security</span>
          </div>
          <p>
            Akun admin dibuat dan dikelola secara terpusat oleh pemilik sistem.
          </p>
        </div>
      </div>
    </div>
  );
};
