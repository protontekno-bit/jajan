import React, { useState } from 'react';
import {
  MapPin,
  CreditCard,
  ChevronRight,
  Sparkles,
  Edit3,
  Check,
  User,
  Phone,
} from 'lucide-react';
import { useCustomerProfile } from '../../hooks/useCustomerProfile.js';

/**
 * Profile & Account tab view with persistent local customer identity.
 * Allows customer to customize their name, phone, and delivery address.
 */
export const ProfileView = () => {
  const { profile, updateProfile, clearProfile } = useCustomerProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    address: profile.address || '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1200);
  };

  const displayName = profile.name?.trim() || 'Sobat Beliyuk';
  const displayPhone = profile.phone?.trim() || 'Belum diisi (otomatis tersimpan saat pesan)';
  const displayAddress = profile.address?.trim() || 'Belum diatur (masukkan alamat antar Anda)';

  return (
    <div className="py-4 animate-in fade-in duration-200">
      {/* Smart Auto-Save Information Banner */}
      <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-2xl bg-orange-500/10 text-[#FF7A00] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-extrabold text-gray-800">Otomatis Tersimpan di Perangkat Ini</h4>
          <p className="text-gray-500 leading-relaxed">
            Anda tidak perlu membuat akun atau mengingat kata sandi. Saat Anda memesan di keranjang, nama, nomor WhatsApp, dan alamat antar Anda otomatis tersimpan di HP ini untuk mempermudah pesanan berikutnya.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-orange-100 shadow-xs mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-[#FF7A00] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white flex-shrink-0">
            {displayName.charAt(0).toUpperCase() || '🍞'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-800">{displayName}</h3>
              <span className="text-[10px] bg-orange-100 text-[#FF7A00] font-black px-2 py-0.5 rounded-full">
                Pelanggan Setia
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{displayPhone}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: profile.name || '',
              phone: profile.phone || '',
              address: profile.address || '',
            });
            setIsEditing(!isEditing);
          }}
          className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#FF7A00] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Tutup' : 'Ubah Data'}</span>
        </button>
      </div>

      {/* Edit Profile Form Accordion */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl p-5 border border-orange-200 shadow-md mb-6 space-y-3.5 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#FF7A00]" />
              Ubah Data Pemesan & Alamat
            </h4>
            <span className="text-[10px] text-gray-400">Otomatis masuk ke Checkout</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nama Panggilan / Lengkap</label>
              <input
                type="text"
                id="profile-name-input"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Kak Dinda"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium focus:outline-none focus:border-[#FF7A00]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                id="profile-phone-input"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium focus:outline-none focus:border-[#FF7A00]"
                required
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-gray-700 block mb-1">Alamat Antar di Sangatta</label>
            <textarea
              rows={2}
              id="profile-address-input"
              name="address"
              autoComplete="street-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jalan, Gang, Nomor Rumah, RT/RW, Patokan"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium focus:outline-none focus:border-[#FF7A00] resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer btn-bounce"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Informasi Member & Poin */}
      <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-white">Member Beliyuk Jajan</h4>
            <p className="text-xs text-white/80">
              Pesan langsung via WhatsApp, cepat, hangat & tanpa biaya admin aplikasi!
            </p>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden mb-6">
        <div
          onClick={() => setIsEditing(true)}
          className="p-4 flex items-center justify-between hover:bg-orange-50/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-gray-800">Alamat Pengiriman Utama</p>
              <p className="text-[11px] text-gray-400 line-clamp-1">{displayAddress}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-orange-50/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-gray-800">Metode Pembayaran Kasir</p>
              <p className="text-[11px] text-gray-400">QRIS All Payment, Transfer Bank, & Tunai (COD)</p>
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/6285128024754?text=Halo%20Admin%20Beliyuk%20Jajan,%20saya%20butuh%20bantuan%20terkait%20pesanan%20roti%20bakar."
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 flex items-center justify-between hover:bg-orange-50/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-gray-800">Hubungi Kasir & CS (WhatsApp)</p>
              <p className="text-[11px] text-emerald-600 font-semibold">0851-2802-4754 (Fast Response)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </a>
      </div>

      {/* Optional: Clear local profile button */}
      {(profile.name || profile.phone || profile.address) && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              if (window.confirm('Kosongkan data pemesan yang tersimpan di perangkat ini?')) {
                clearProfile();
              }
            }}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors cursor-pointer py-1.5 px-4 rounded-full hover:bg-red-50"
          >
            Kosongkan Data Pemesan di Perangkat Ini
          </button>
        </div>
      )}
    </div>
  );
};
