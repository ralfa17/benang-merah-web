import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDate, exportAdminShiftExcel, exportAllAdminShiftsExcel } from '../lib/helpers';
import { PAYMENT_METHODS } from '../lib/constants';
import {
  ClipboardListIcon,
  ClockIcon,
  CheckCircleIcon,
  CloseIcon,
  EyeIcon,
  CreditCardIcon,
  FileTextIcon,
  UserIcon,
  DownloadIcon
} from './icons';

// ============================================================
// MODUL PRESENSI & LAPORAN SHIFT ADMIN — KLINIK BENANG MERAH
// ============================================================

const SHIFT_OPTIONS = [
  { id: 'shift1', label: 'Shift 1 (08:00 – 17:00)', start: '08:00', end: '17:00' },
  { id: 'shift2', label: 'Shift 2 (17:00 – 20:00)', start: '17:00', end: '20:00' },
  { id: 'custom', label: 'Jam Kerja Khusus (Sesuai Jadwal)', start: '', end: '' },
];

const getNowWIB = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  return { dateStr, timeStr };
};

const formatTimeLabel = (timeStr) => (timeStr ? `${timeStr} WIB` : '-');

// ============================================================
// PANEL MASTER: Riwayat Laporan Shift Semua Admin
// ============================================================
function MasterShiftReview({ onClose, appointmentsList = [] }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_shift_reports')
        .select('*')
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterDate) query = query.eq('shift_date', filterDate);
      if (filterAdmin) query = query.ilike('admin_name', `%${filterAdmin}%`);

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Gagal memuat laporan shift:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterAdmin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 shadow-xl rounded-2xl text-slate-800 w-full max-w-4xl mt-6 mb-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-xl flex items-center justify-center shadow-xs">
              <ClipboardListIcon className="w-5 h-5 text-[#701A24]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#2C1810] tracking-tight">
                Riwayat Laporan Shift Admin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akses Master IT — Rekaman presensi jam kerja & rekapan penggajian operasional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="Tutup"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-stone-200 bg-[#FAF8F5] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filter Tanggal
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cari Nama Admin
              </label>
              <input
                type="text"
                placeholder="Ketik nama admin..."
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none w-48"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterDate('');
                  setFilterAdmin('');
                }}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tombol Export Excel Rekap Laporan Shift (Master Only) */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => exportAllAdminShiftsExcel(reports)}
              disabled={reports.length === 0}
              className="px-3.5 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Unduh seluruh rekap riwayat laporan shift ke file Excel .xlsx"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Download Excel Rekap ({reports.length})</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-xs">
              Memuat laporan shift...
            </p>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-stone-200 rounded-xl">
              Belum ada riwayat laporan shift yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-[#2C1810]">
                      {r.admin_name}
                    </span>
                    <span className="bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {r.shift_label}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">{formatDate(r.shift_date)}</p>
                    <p className="text-[11px] text-slate-500">
                      Check-in: {formatTimeLabel(r.check_in_time)} — Check-out: {formatTimeLabel(r.check_out_time)}
                    </p>
                  </div>
                </div>

                {r.operational_summary && (
                  <div className="bg-white border border-stone-200 rounded-lg p-3">
                    <p className="text-[11px] font-bold text-slate-700 mb-1">
                      Ringkasan Operasional & Catatan:
                    </p>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {r.operational_summary}
                    </p>
                  </div>
                )}

                {r.patients_handled && r.patients_handled.length > 0 && (
                  <div className="bg-white border border-stone-200 rounded-lg p-3">
                    <p className="text-[11px] font-bold text-slate-700 mb-2">
                      Pasien Ditangani ({r.patients_handled.length} orang):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.patients_handled.map((name, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] px-2 py-0.5 rounded-md font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {r.payment_summary && (
                  <div className="bg-white border border-stone-200 rounded-lg p-3">
                    <p className="text-[11px] font-bold text-slate-700 mb-2">
                      Rincian Metode Transaksi:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(r.payment_summary).map(([method, count]) =>
                        count > 0 ? (
                          <div
                            key={method}
                            className="text-center bg-[#FAF8F5] border border-stone-200 rounded-md p-2"
                          >
                            <p className="text-sm font-bold text-[#701A24]">{count}x</p>
                            <p className="text-[10px] text-slate-500">{method}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {/* Tombol Download Excel Laporan Shift Per Baris (Master Only) */}
                <div className="flex justify-end pt-2 border-t border-stone-200/70">
                  <button
                    type="button"
                    onClick={() => exportAdminShiftExcel(r, appointmentsList)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title={`Download file Excel (.xlsx) untuk shift ${r.admin_name} tanggal ${r.shift_date}`}
                  >
                    <DownloadIcon className="w-3.5 h-3.5 text-[#701A24]" />
                    <span>Download Excel Laporan Shift (.xlsx)</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA: Form Presensi & Handover Shift Admin
// ============================================================
export default function AdminShiftReport({
  userName,
  userRole,
  hasMasterAccess,
  appointmentsList = [],
  onClose
}) {
  const { dateStr: todayDate, timeStr: nowTime } = getNowWIB();

  const [shiftDate, setShiftDate] = useState(todayDate);
  const [selectedShift, setSelectedShift] = useState(SHIFT_OPTIONS[0].id);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [checkInTime, setCheckInTime] = useState(nowTime);
  const [checkOutTime, setCheckOutTime] = useState('');
  const [operationalSummary, setOperationalSummary] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [paymentCounts, setPaymentCounts] = useState({
    'QRIS': 0,
    'Transfer BCA': 0,
    'Cash / Tunai': 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [showMasterReview, setShowMasterReview] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const todayPatients = useMemo(() => {
    const patientsMap = new Map();
    (appointmentsList || []).forEach((item) => {
      if (item.booking_date === shiftDate && item.patient_name) {
        const name = item.patient_name.trim();
        if (!patientsMap.has(name)) {
          patientsMap.set(name, item);
        }
      }
    });
    return Array.from(patientsMap.keys());
  }, [appointmentsList, shiftDate]);

  useEffect(() => {
    const checkExisting = async () => {
      setLoadingExisting(true);
      try {
        const { data } = await supabase
          .from('admin_shift_reports')
          .select('id, check_in_time, check_out_time, shift_label')
          .eq('shift_date', shiftDate)
          .ilike('admin_name', `%${userName.split(' ')[0]}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setExistingReport(data || null);
      } catch (err) {
        console.error('Gagal cek laporan existing:', err.message);
      } finally {
        setLoadingExisting(false);
      }
    };
    if (userName && shiftDate) checkExisting();
  }, [userName, shiftDate]);

  const togglePatient = (name) => {
    setSelectedPatients((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const totalPaymentCount = Object.values(paymentCounts).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkOutTime) {
      alert('Mohon isi Jam Check-Out sebelum menyimpan laporan shift.');
      return;
    }
    if (!operationalSummary.trim()) {
      alert('Mohon isi Ringkasan Aktivitas Operasional shift ini.');
      return;
    }

    setSubmitting(true);
    setSubmitMsg('');

    const shiftInfo = SHIFT_OPTIONS.find((s) => s.id === selectedShift);
    const shiftLabel =
      selectedShift === 'custom'
        ? `Jam Khusus (${customStart || checkInTime} – ${customEnd || checkOutTime})`
        : shiftInfo?.label || 'Shift Sesuai Jadwal';

    try {
      const payload = {
        admin_name: userName,
        admin_role: userRole,
        shift_date: shiftDate,
        shift_label: shiftLabel,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        operational_summary: operationalSummary.trim(),
        patients_handled: selectedPatients,
        payment_summary: paymentCounts,
        total_patients: selectedPatients.length,
        total_transactions: totalPaymentCount,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('admin_shift_reports').insert([payload]);
      if (error) throw error;

      setSubmitMsg('Laporan shift berhasil disimpan dan siap di-handover.');
      setTimeout(() => {
        setSubmitMsg('');
        onClose();
      }, 2000);
    } catch (err) {
      setSubmitMsg(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (showMasterReview && hasMasterAccess) {
    return (
      <MasterShiftReview
        onClose={() => setShowMasterReview(false)}
        appointmentsList={appointmentsList}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 shadow-xl rounded-2xl text-slate-800 w-full max-w-2xl mt-6 mb-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-xl flex items-center justify-center shadow-xs">
              <ClipboardListIcon className="w-5 h-5 text-[#701A24]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#2C1810] tracking-tight">
                Laporan & Presensi Shift Admin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klinik Benang Merah • Petugas: {userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* KONTROL HAK AKSES: Tombol Download Excel Laporan Shift HANYA UNTUK MASTER */}
            {hasMasterAccess && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const shiftInfo = SHIFT_OPTIONS.find((s) => s.id === selectedShift);
                    const shiftLabel =
                      selectedShift === 'custom'
                        ? `Jam Khusus (${customStart || checkInTime} – ${customEnd || checkOutTime})`
                        : shiftInfo?.label || 'Shift Sesuai Jadwal';
                    const reportPayload = {
                      admin_name: userName,
                      admin_role: userRole,
                      shift_date: shiftDate,
                      shift_label: shiftLabel,
                      check_in_time: checkInTime,
                      check_out_time: checkOutTime,
                      operational_summary: operationalSummary || 'Ringkasan shift aktif',
                      patients_handled: selectedPatients,
                      payment_summary: paymentCounts
                    };
                    exportAdminShiftExcel(reportPayload, appointmentsList);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Download data laporan shift aktif ke format Excel .xlsx (Master IT Only)"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-[#701A24]" />
                  <span className="hidden sm:inline">Download Excel Shift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMasterReview(true)}
                  className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Lihat Semua Laporan</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              title="Tutup"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Notifikasi Laporan Existing */}
          {!loadingExisting && existingReport && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
              <p className="font-semibold text-amber-900">
                Catatan: Laporan shift pada tanggal ini sudah pernah diisi.
              </p>
              <p className="mt-0.5 text-amber-800 text-[11px]">
                {existingReport.shift_label} • Check-in: {formatTimeLabel(existingReport.check_in_time)} — Check-out: {formatTimeLabel(existingReport.check_out_time || '-')}
              </p>
              <p className="mt-1 text-amber-700 text-[11px]">
                Anda tetap dapat menyimpan laporan baru untuk pergantian shift berikutnya.
              </p>
            </div>
          )}

          {/* BAGIAN 1: INFO PRESENSI */}
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#701A24]">
              <ClockIcon className="w-4 h-4 text-[#701A24]" />
              <span>Informasi Presensi & Waktu Kerja</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Shift
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Shift
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none cursor-pointer"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Check-In (WIB)
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Check-Out / Handover (WIB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: RINGKASAN OPERASIONAL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#701A24]">
              <FileTextIcon className="w-4 h-4 text-[#701A24]" />
              <span>Ringkasan Aktivitas Operasional</span>
              <span className="text-red-500">*</span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="Catatan pendaftaran baru, konfirmasi jadwal, kendala operasional, atau pesan penting untuk shift berikutnya..."
              value={operationalSummary}
              onChange={(e) => setOperationalSummary(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none resize-none leading-relaxed placeholder:text-slate-400"
            />
          </div>

          {/* BAGIAN 3: DAFTAR PASIEN SHIFT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#701A24]">
                <UserIcon className="w-4 h-4 text-[#701A24]" />
                <span>Pasien Ditangani Shift Ini</span>
              </div>
              <span className="text-xs text-slate-500">
                Pilih dari jadwal tanggal {formatDate(shiftDate)}
              </span>
            </div>

            {todayPatients.length === 0 ? (
              <div className="bg-[#FAF8F5] border border-dashed border-stone-200 rounded-xl p-3.5 text-center text-xs text-slate-500">
                Tidak ada data janji pasien pada tanggal {formatDate(shiftDate)}. Anda dapat memasukkan nama pasien manual di bawah.
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                {todayPatients.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-white px-2 py-1.5 rounded-lg transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(name)}
                      onChange={() => togglePatient(name)}
                      className="rounded text-[#701A24] focus:ring-[#701A24] accent-[#701A24]"
                    />
                    <span className="text-xs font-medium text-slate-800 group-hover:text-[#701A24]">
                      {name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {selectedPatients.length > 0 && (
              <p className="text-xs text-[#701A24] font-semibold">
                ✓ {selectedPatients.length} pasien dipilih
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tambah Nama Pasien Manual (pisahkan dengan koma):
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso, Ani Kartika"
                className="w-full px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none placeholder:text-slate-400"
                onBlur={(e) => {
                  const manualNames = e.target.value
                    .split(',')
                    .map((n) => n.trim())
                    .filter((n) => n && !selectedPatients.includes(n));
                  if (manualNames.length > 0) {
                    setSelectedPatients((prev) => [...prev, ...manualNames]);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* BAGIAN 4: RINCIAN METODE PEMBAYARAN */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#701A24]">
              <CreditCardIcon className="w-4 h-4 text-[#701A24]" />
              <span>Rincian Metode Transaksi Pasien Shift Ini</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method}
                  className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3 text-center"
                >
                  <p className="text-xs font-semibold text-slate-700 mb-2">{method}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentCounts((prev) => ({
                          ...prev,
                          [method]: Math.max(0, (prev[method] || 0) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 text-slate-700 font-bold text-sm transition cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-[#701A24] min-w-[2ch] text-center">
                      {paymentCounts[method] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentCounts((prev) => ({
                          ...prev,
                          [method]: (prev[method] || 0) + 1,
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-[#701A24] hover:bg-[#581524] text-white font-bold text-sm transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">transaksi</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
              <span>Total Transaksi Shift:</span>
              <span className="font-bold text-[#701A24]">{totalPaymentCount} transaksi</span>
            </div>
          </div>

          {/* PESAN STATUS */}
          {submitMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                submitMsg.includes('Gagal')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              <span>{submitMsg}</span>
            </div>
          )}

          {/* TOMBOL AKSI */}
          <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#701A24] hover:bg-[#581524] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Laporan & Handover Shift'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
