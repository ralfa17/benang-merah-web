import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserIcon,
  StethoscopeIcon,
  LockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  PlusIcon
} from './icons';

// KREDENSIAL ANGGOTA 4 ROLE KLINIK BENANG MERAH
const MASTER_USER = {
  name: 'Ridho Al Fattaah',
  roleTitle: 'Master IT & Super Admin',
  dbRole: 'master',
  email: 'ridhoalfattaah17@gmail.com',
  desc: 'Akses penuh kontrol database, backup cadangan snapshot & switch view simulator'
};

const ADMIN_USERS = [
  {
    name: 'Fauzan Hamdani',
    roleTitle: 'Admin Utama Klinik',
    dbRole: 'admin',
    email: 'fauzanhamdani@gmail.com'
  }
];

const PSYCHOLOGIST_USERS = [
  {
    name: 'M. Azka Maulana, M.Psi., Psikolog',
    shortName: 'Pak Azka',
    roleTitle: 'Psikolog Klinis Anak & Remaja',
    dbRole: 'psikolog',
    email: 'aska.maulana@umc.ac.id'
  },
  {
    name: 'Sofia Halida Fatma, M.Psi., Psikolog',
    shortName: 'Bu Sofia',
    roleTitle: 'Psikolog Klinis Dewasa',
    dbRole: 'psikolog',
    email: 'sofiazka916@gmail.com'
  }
];

const THERAPIST_USERS = [
  {
    name: 'Shima Adinda Salsabil',
    shortName: 'Shima',
    roleTitle: 'Terapis Anak',
    dbRole: 'terapis',
    email: 'salsabilshima@gmail.com'
  },
  {
    name: 'Silviyah Wulandari',
    shortName: 'Silvi',
    roleTitle: 'Terapis Anak',
    dbRole: 'terapis',
    email: 'silviyahwulandari00@gmail.com'
  },
  {
    name: 'Nadifah AM',
    shortName: 'Difa',
    roleTitle: 'Terapis Anak',
    dbRole: 'terapis',
    email: 'nadifahmahfuzh@gmail.com'
  },
  {
    name: 'Eka Zahra Nabila Nakhwa',
    shortName: 'Eka',
    roleTitle: 'Terapis Anak',
    dbRole: 'terapis',
    email: 'ekazahra687@gmail.com'
  },
  {
    name: 'Casmi Gustari',
    shortName: 'Casmi',
    roleTitle: 'Terapis Anak',
    dbRole: 'terapis',
    email: 'casmi.gustari@benangmerah.id'
  }
];

export default function Auth({ onLoginSuccess }) {
  // Pilihan Tab Role: 'master' | 'admin' | 'psikolog' | 'terapis'
  const [activeRoleTab, setActiveRoleTab] = useState('admin');

  // Daftar Akun Terapis (Didukung penyimpanan lokal agar terapis baru langsung muncul)
  const [therapists, setTherapists] = useState(() => {
    try {
      const saved = localStorage.getItem('bm_custom_therapists');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingEmails = new Set(THERAPIST_USERS.map((t) => t.email.toLowerCase()));
        const extra = parsed.filter((t) => !existingEmails.has(t.email.toLowerCase()));
        return [...THERAPIST_USERS, ...extra];
      }
    } catch (e) {
      // ignore
    }
    return THERAPIST_USERS;
  });

  // Anggota yang dipilih dalam tab
  const [selectedUser, setSelectedUser] = useState(ADMIN_USERS[0]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Mode Registrasi Mandiri Admin Baru
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [regLoading, setRegLoading] = useState(false);

  // Mode Registrasi Mandiri Terapis Baru
  const [isRegisterTherapistMode, setIsRegisterTherapistMode] = useState(false);
  const [regTherapistForm, setRegTherapistForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [regTherapistLoading, setRegTherapistLoading] = useState(false);

  // Ganti Tab Role
  const handleTabChange = (roleKey) => {
    setActiveRoleTab(roleKey);
    setIsRegisterMode(false);
    setIsRegisterTherapistMode(false);
    setMessage({ text: '', type: '' });
    setPassword('');

    if (roleKey === 'master') setSelectedUser(MASTER_USER);
    else if (roleKey === 'admin') setSelectedUser(ADMIN_USERS[0]);
    else if (roleKey === 'psikolog') setSelectedUser(PSYCHOLOGIST_USERS[0]);
    else if (roleKey === 'terapis') setSelectedUser(therapists[0] || THERAPIST_USERS[0]);
  };

  // Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedUser?.email) {
      setMessage({ text: 'Pilih nama pengguna terlebih dahulu.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: selectedUser.email,
        password: password
      });

      if (error) throw error;

      setMessage({ text: 'Login berhasil! Mengalihkan ke dashboard...', type: 'success' });
      if (onLoginSuccess) onLoginSuccess(data?.session);
    } catch (err) {
      setMessage({
        text: 'Password salah atau akun belum diaktifkan. Silakan periksa kembali password Anda.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit Registrasi Mandiri Admin Baru
  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      setMessage({ text: 'Konfirmasi password tidak cocok!', type: 'error' });
      return;
    }
    if (regForm.password.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setRegLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regForm.email.trim(),
        password: regForm.password,
        options: {
          data: {
            full_name: regForm.fullName.trim(),
            role: 'admin'
          }
        }
      });

      if (error) throw error;

      // Coba masukkan / upsert profil ke tabel profiles
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: regForm.fullName.trim(),
              role: 'admin'
            }
          ]);
        } catch (dbErr) {
          console.warn('Upsert profil warning:', dbErr);
        }
      }

      setMessage({
        text: 'Pendaftaran Admin Baru berhasil! Silakan login menggunakan email & password tersebut.',
        type: 'success'
      });
      setIsRegisterMode(false);
      setRegForm({ fullName: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setMessage({
        text: `Gagal mendaftar: ${err.message}`,
        type: 'error'
      });
    } finally {
      setRegLoading(false);
    }
  };

  // Submit Registrasi Mandiri Terapis Baru
  const handleRegisterTherapist = async (e) => {
    e.preventDefault();
    if (regTherapistForm.password !== regTherapistForm.confirmPassword) {
      setMessage({ text: 'Konfirmasi password tidak cocok!', type: 'error' });
      return;
    }
    if (regTherapistForm.password.length < 6) {
      setMessage({ text: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    setRegTherapistLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const emailTrimmed = regTherapistForm.email.trim();
      const fullNameTrimmed = regTherapistForm.fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: emailTrimmed,
        password: regTherapistForm.password,
        options: {
          data: {
            full_name: fullNameTrimmed,
            role: 'terapis',
            role_title: 'Terapis Anak'
          }
        }
      });

      if (error) throw error;

      // Coba masukkan / upsert profil ke tabel profiles
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: fullNameTrimmed,
              role: 'terapis'
            }
          ]);
        } catch (dbErr) {
          console.warn('Upsert profil terapis warning:', dbErr);
        }
      }

      // Tambahkan profil terapis baru langsung ke daftar pilihan
      const newTherapist = {
        name: fullNameTrimmed,
        shortName: fullNameTrimmed.split(' ')[0],
        roleTitle: 'Terapis Anak',
        dbRole: 'terapis',
        email: emailTrimmed
      };

      setTherapists((prev) => {
        const updated = prev.some((t) => t.email.toLowerCase() === emailTrimmed.toLowerCase())
          ? prev
          : [...prev, newTherapist];
        try {
          localStorage.setItem('bm_custom_therapists', JSON.stringify(updated));
        } catch (storageErr) {
          console.warn('LocalStorage save warning:', storageErr);
        }
        return updated;
      });

      // Otomatis pilih akun terapis baru
      setSelectedUser(newTherapist);

      setMessage({
        text: `Pendaftaran Terapis Baru (${fullNameTrimmed}) berhasil! Silakan login menggunakan email & password tersebut.`,
        type: 'success'
      });
      setIsRegisterTherapistMode(false);
      setRegTherapistForm({ fullName: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setMessage({
        text: `Gagal mendaftar: ${err.message}`,
        type: 'error'
      });
    } finally {
      setRegTherapistLoading(false);
    }
  };

  return (
    <div className="w-full text-xs font-sans text-gray-800">
      
      {/* 4 TAB SELECTOR ROLE RESMI */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#FAF8F5] border border-[#EADFD5] rounded-2xl mb-4">
        <button
          type="button"
          onClick={() => handleTabChange('master')}
          className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition flex flex-col items-center gap-1 ${
            activeRoleTab === 'master'
              ? 'bg-[#701A24] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#701A24] hover:bg-white/80'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Master</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('admin')}
          className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition flex flex-col items-center gap-1 ${
            activeRoleTab === 'admin'
              ? 'bg-[#701A24] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#701A24] hover:bg-white/80'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Admin</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('psikolog')}
          className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition flex flex-col items-center gap-1 ${
            activeRoleTab === 'psikolog'
              ? 'bg-[#701A24] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#701A24] hover:bg-white/80'
          }`}
        >
          <StethoscopeIcon className="w-4 h-4" />
          <span>Psikolog</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('terapis')}
          className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition flex flex-col items-center gap-1 ${
            activeRoleTab === 'terapis'
              ? 'bg-[#701A24] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#701A24] hover:bg-white/80'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Terapis</span>
        </button>
      </div>

      {/* NOTIFIKASI PESAN */}
      {message.text && (
        <div
          className={`p-3 rounded-xl mb-3.5 text-xs font-medium border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ROLE MASTER (IT ADMIN / RIDHO) */}
      {/* ======================================================== */}
      {activeRoleTab === 'master' && (
        <div className="space-y-3.5 animate-fade-up">
          <div className="p-3.5 bg-[#701A24]/5 border border-[#701A24]/20 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#701A24] text-white flex items-center justify-center font-bold">
                <ShieldCheckIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">{MASTER_USER.name}</p>
                <p className="text-[10px] text-[#701A24] font-semibold">{MASTER_USER.roleTitle}</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-light">
              {MASTER_USER.desc}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                Password Master IT
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ketik password master IT..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] text-xs font-medium bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk sebagai Master IT'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ROLE ADMIN (FAUZAN / RIDHO / SHIMA + REGISTRASI MANDIRI) */}
      {/* ======================================================== */}
      {activeRoleTab === 'admin' && (
        <div className="space-y-3.5 animate-fade-up">
          {!isRegisterMode ? (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-gray-700 text-[11px]">
                    Pilih Petugas Admin:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setMessage({ text: '', type: '' });
                    }}
                    className="text-[#701A24] hover:underline font-bold text-[10px] flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3 text-[#701A24]" />
                    <span>Registrasi Admin Baru</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ADMIN_USERS.map((adm, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedUser(adm);
                        setMessage({ text: '', type: '' });
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedUser?.email === adm.email
                          ? 'border-[#701A24] bg-[#701A24]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-gray-800 text-xs">{adm.name}</p>
                        <p className="text-[10px] text-gray-500">{adm.roleTitle}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedUser?.email === adm.email
                            ? 'border-[#701A24] bg-[#701A24]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedUser?.email === adm.email && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Password Admin ({selectedUser?.name})
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password admin..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] text-xs font-medium bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  <span>{loading ? 'Memverifikasi...' : `Masuk sebagai Admin ${selectedUser?.name.split(' ')[0]}`}</span>
                </button>
              </form>
            </>
          ) : (
            /* FORM REGISTRASI MANDIRI ADMIN BARU */
            <form onSubmit={handleRegisterAdmin} className="space-y-3 animate-fade-up">
              <div className="flex items-center justify-between pb-1 border-b border-[#EADFD5]">
                <span className="font-serif font-bold text-[#701A24] text-xs">
                  Pendaftaran Admin Baru Mandiri
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-gray-500 hover:text-gray-800 text-[11px] font-semibold"
                >
                  ← Kembali ke Login
                </button>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Nama Lengkap Admin
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Admin Baru"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#701A24] bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Email Resmi Admin
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@benangmerah.id"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#701A24] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 karakter"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#701A24] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Ulangi Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ketik ulang"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#701A24] bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md text-xs mt-2"
              >
                {regLoading ? 'Mendaftarkan...' : 'Daftarkan Akun Admin Baru'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ROLE PSIKOLOG (PAK AZKA & BU SOFIA) */}
      {/* ======================================================== */}
      {activeRoleTab === 'psikolog' && (
        <div className="space-y-3.5 animate-fade-up">
          <div>
            <label className="block font-semibold text-gray-700 mb-2 text-[11px]">
              Pilih Psikolog Penanggung Jawab:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PSYCHOLOGIST_USERS.map((psy, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedUser(psy);
                    setMessage({ text: '', type: '' });
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition text-center ${
                    selectedUser?.email === psy.email
                      ? 'border-[#701A24] bg-[#701A24]/5 text-[#701A24]'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EADFD5] shadow-2xs mx-auto mb-2 flex items-center justify-center">
                    <StethoscopeIcon className="w-5 h-5 text-[#701A24]" />
                  </div>
                  <p className="font-bold text-xs">{psy.shortName}</p>
                  <p className="text-[10px] text-gray-500 font-light mt-0.5 truncate">{psy.name}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-1">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                Password Akses {selectedUser?.name}
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan password psikolog..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] text-xs font-medium bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : `Masuk Sesi Rekam Medis (${selectedUser?.shortName})`}</span>
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ROLE TERAPIS (SHIMA, SILVI, DIFA, EKA, CASMI) */}
      {/* ======================================================== */}
      {activeRoleTab === 'terapis' && (
        <div className="space-y-3.5 animate-fade-up">
          {!isRegisterTherapistMode ? (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-gray-700 text-[11px]">
                    Pilih Nama Terapis:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterTherapistMode(true);
                      setMessage({ text: '', type: '' });
                    }}
                    className="text-blue-700 hover:underline font-bold text-[10px] flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3 text-blue-700" />
                    <span>+ Registrasi Terapis Baru</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {therapists.map((th, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedUser(th);
                        setMessage({ text: '', type: '' });
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedUser?.email === th.email && selectedUser?.name === th.name
                          ? 'border-[#701A24] bg-[#701A24]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-gray-800 text-xs">{th.name}</p>
                        <p className="text-[10px] text-blue-700 font-medium">{th.roleTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Password Terapis ({selectedUser?.name})
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password terapis..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] text-xs font-medium bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  <span>{loading ? 'Memverifikasi...' : `Masuk Dashboard Terapi (${selectedUser?.name?.split(' ')[0] || 'Terapis'})`}</span>
                </button>
              </form>
            </>
          ) : (
            /* FORM REGISTRASI MANDIRI TERAPIS BARU */
            <form onSubmit={handleRegisterTherapist} className="space-y-3 animate-fade-up">
              <div className="flex items-center justify-between pb-1 border-b border-[#EADFD5]">
                <span className="font-serif font-bold text-blue-800 text-xs">
                  Pendaftaran Terapis Baru Mandiri
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegisterTherapistMode(false)}
                  className="text-gray-500 hover:text-gray-800 text-[11px] font-semibold"
                >
                  ← Kembali ke Login
                </button>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Nama Lengkap Terapis
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terapis Baru, S.Psi."
                  value={regTherapistForm.fullName}
                  onChange={(e) => setRegTherapistForm({ ...regTherapistForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Email Resmi Terapis
                </label>
                <input
                  type="email"
                  required
                  placeholder="terapis@benangmerah.id"
                  value={regTherapistForm.email}
                  onChange={(e) => setRegTherapistForm({ ...regTherapistForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                  Jabatan / Spesialisasi
                </label>
                <div className="w-full px-3 py-2 border border-blue-200 bg-blue-50/70 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-between">
                  <span>Terapis Anak</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-200 text-blue-900">
                    Otomatis
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 karakter"
                    value={regTherapistForm.password}
                    onChange={(e) => setRegTherapistForm({ ...regTherapistForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                    Ulangi Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ketik ulang"
                    value={regTherapistForm.confirmPassword}
                    onChange={(e) => setRegTherapistForm({ ...regTherapistForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regTherapistLoading}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition shadow-md text-xs mt-2 disabled:opacity-50"
              >
                {regTherapistLoading ? 'Mendaftarkan...' : 'Daftarkan Akun Terapis Baru'}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
