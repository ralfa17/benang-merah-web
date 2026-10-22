import React, { useState, useEffect } from 'react';
import {
  EditIcon,
  CloseIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  SparklesIcon,
  DownloadIcon
} from './icons';
import { parseAppointmentNotes, formatDate } from '../lib/helpers';
import { exportTherapistProgressDocx } from '../lib/docxExport';

export default function TherapyProgressModal({
  appointment,
  allPatientSessions = [],
  userName = 'Terapis',
  onClose,
  onSaveProgress
}) {
  const [therapyProgress, setTherapyProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sesi-sesi sebelumnya
  const previousSessions = allPatientSessions.filter(
    (s) => s.id !== appointment?.id && (Number(s.visit_number) < Number(appointment?.visit_number || 1))
  );

  useEffect(() => {
    if (appointment) {
      const parsed = parseAppointmentNotes(appointment.notes);
      if (parsed.therapyProgress) {
        setTherapyProgress(parsed.therapyProgress);
      }
    }
  }, [appointment]);

  const handleSave = async () => {
    if (!therapyProgress.trim()) {
      alert('Mohon isi catatan progress perkembangan terapi terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      await onSaveProgress({
        appointment,
        therapyProgress,
        userName
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const simulatedAppt = {
        ...appointment,
        notes: `[ProgressTerapi: ${therapyProgress || '-'}] ${appointment.notes || ''}`
      };
      await exportTherapistProgressDocx(simulatedAppt, allPatientSessions, userName);
    } catch (err) {
      console.error('Gagal export Word terapis:', err);
      alert('Terjadi kesalahan saat mengekspor file Word: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#EADFD5]">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center border-b border-[#EADFD5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <EditIcon className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                Catatan Progress & Perkembangan Terapi
              </h3>
              <p className="text-[11px] text-gray-500">
                Web-Based Editable oleh Terapis: {userName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* INFO PASIEN CARD */}
        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-gray-900">
              {appointment.patient_name}
            </span>
            <span className="text-gray-500">
              ({appointment.age ? `${appointment.age} Thn` : 'Usia -'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white font-bold text-[10px]">
              Kunjungan Sesi #{appointment.visit_number || 1}
            </span>
            <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(appointment.booking_date)}
            </span>
          </div>
        </div>

        {/* MULTI-SESI CONTINUATION (RIWAYAT PROGRESS LALU) */}
        {previousSessions.length > 0 && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5 text-[11px]">
                <SparklesIcon className="w-3.5 h-3.5 text-blue-700" />
                Riwayat Sesi Terapi Sebelumnya ({previousSessions.length} Sesi)
              </span>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-[11px] font-semibold text-blue-700 hover:underline"
              >
                {showHistory ? 'Tutup' : 'Lihat'}
              </button>
            </div>

            {showHistory && (
              <div className="mt-2.5 space-y-2 max-h-40 overflow-y-auto pr-1">
                {previousSessions.map((prev, pIdx) => {
                  const pMeta = parseAppointmentNotes(prev.notes);
                  return (
                    <div
                      key={pIdx}
                      className="bg-white p-2.5 rounded-xl border border-blue-100 text-[11px]"
                    >
                      <p className="font-bold text-blue-800">
                        Kunjungan Ke-{prev.visit_number || (pIdx + 1)} ({formatDate(prev.booking_date)})
                      </p>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">
                        {pMeta.therapyProgress || '(Tidak ada catatan progress khusus)'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FORM INPUT PROGRESS TERAPIS */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-blue-900 mb-1 text-xs">
              Catatan Kemajuan & Perubahan Perilaku / Stimulasi:
            </label>
            <textarea
              rows="5"
              required
              placeholder="Contoh: Pada sesi ini anak mulai berani merespons kontak mata, motorik halus menunjukkan peningkatan dengan menyusun balok, dan regulasi emosi lebih stabil..."
              value={therapyProgress}
              onChange={(e) => setTherapyProgress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-normal leading-relaxed bg-white"
            />
          </div>

          <p className="text-[11px] text-gray-500 italic">
            Catatan ini tersimpan secara web-based langsung ke database dan dapat diperbarui sewaktu-waktu tanpa mengunduh file dokumen Word.
          </p>
        </div>

        {/* TOMBOL SIMPAN & OPSIONAL DOWNLOAD WORD */}
        <div className="pt-2 border-t border-[#EADFD5] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-blue-200"
            title="Download Laporan Kemajuan Terapi format Microsoft Word (.docx)"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>Download Laporan (.docx / Word)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Catatan Progress'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
