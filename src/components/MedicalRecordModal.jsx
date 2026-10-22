import React, { useState, useEffect } from 'react';
import {
  StethoscopeIcon,
  CloseIcon,
  CheckIcon,
  PrinterIcon,
  CalendarIcon,
  UserIcon,
  SparklesIcon,
  DownloadIcon
} from './icons';
import { OVERTIME_PASANGAN, OVERTIME_ASESMEN } from '../lib/constants';
import { parseAppointmentNotes, formatDate } from '../lib/helpers';
import { exportPsychologistReportDocx } from '../lib/docxExport';

export default function MedicalRecordModal({
  appointment,
  allPatientSessions = [],
  activeTherapistList = [],
  onClose,
  onSaveRecord
}) {
  const [serviceType, setServiceType] = useState('assessment');
  const [sessionDurationPrice, setSessionDurationPrice] = useState(300000);
  const [durationLabel, setDurationLabel] = useState('1 Sesi (60 Menit)');
  const [anamnesaNotes, setAnamnesaNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [referToTherapist, setReferToTherapist] = useState('');
  const [externalReferral, setExternalReferral] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sesi sebelumnya (untuk multi-sesi continuation)
  const previousSessions = allPatientSessions.filter(
    (s) => s.id !== appointment?.id && (Number(s.visit_number) < Number(appointment?.visit_number || 1))
  );

  // Pre-load data saat modal dibuka
  useEffect(() => {
    if (appointment) {
      const parsed = parseAppointmentNotes(appointment.notes);

      // Isi dari data tersimpan jika sudah ada
      if (parsed.anamnesa) setAnamnesaNotes(parsed.anamnesa);
      if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
      if (parsed.followUpPlan) setFollowUpPlan(parsed.followUpPlan);
      if (parsed.internalReferral) setReferToTherapist(parsed.internalReferral);
      if (parsed.externalReferral) setExternalReferral(parsed.externalReferral);
      if (parsed.durationLabel) setDurationLabel(parsed.durationLabel);

      const serv = appointment.service_type || appointment.category || '';
      if (serv.toLowerCase().includes('couple') || serv.toLowerCase().includes('pasangan')) {
        setServiceType('couple');
        setSessionDurationPrice(600000);
      } else if (serv.toLowerCase().includes('psikoterapi')) {
        setServiceType('psikoterapi');
        setSessionDurationPrice(350000);
      } else if (serv.toLowerCase().includes('keluarga')) {
        setServiceType('keluarga');
        setSessionDurationPrice(600000);
      } else {
        setServiceType('assessment');
        setSessionDurationPrice(300000);
      }
    }
  }, [appointment]);

  // Fungsi Salin dari Sesi Sebelumnya
  const handleCopyFromPrevious = (prevSession) => {
    const prevMeta = parseAppointmentNotes(prevSession.notes);
    if (prevMeta.diagnosis && !diagnosis) {
      setDiagnosis(prevMeta.diagnosis);
    }
    if (prevMeta.followUpPlan && !followUpPlan) {
      setFollowUpPlan(prevMeta.followUpPlan);
    }
    if (prevMeta.anamnesa && !anamnesaNotes) {
      setAnamnesaNotes(`[Lanjutan Sesi #${prevSession.visit_number}]: ${prevMeta.anamnesa}`);
    }
    alert(`Data rekam medis sesi #${prevSession.visit_number || 1} berhasil disalin ke form!`);
  };

  const handleSave = async (completeSession = false) => {
    setSaving(true);
    try {
      await onSaveRecord({
        appointment,
        serviceType,
        sessionDurationPrice,
        durationLabel,
        anamnesaNotes,
        diagnosis,
        followUpPlan,
        referToTherapist,
        externalReferral,
        completeSession
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Unduh Laporan Rekam Medis ke format Word (.docx)
  const handleDownloadDocx = async () => {
    try {
      const simulatedAppt = {
        ...appointment,
        assigned_terapis: referToTherapist || appointment.assigned_terapis,
        notes: `[Anamnesa: ${anamnesaNotes || '-'}] [Diagnosa: ${diagnosis || '-'}] [Rencana: ${followUpPlan || '-'}] [Rujukan: ${referToTherapist || '-'}] [RujukanEksternal: ${externalReferral || '-'}] ${appointment.notes || ''}`
      };
      await exportPsychologistReportDocx(simulatedAppt, allPatientSessions);
    } catch (err) {
      console.error('Gagal export Word:', err);
      alert('Terjadi kesalahan saat membuat file Word: ' + err.message);
    }
  };

  // Cetak Lembar Rekam Medis langsung dari Web (Bebas Word)
  const handlePrintMedicalReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LEMBAR REKAM MEDIS - ${appointment.patient_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; line-height: 1.6; }
          .header { border-bottom: 2px solid #701A24; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { color: #701A24; font-size: 20px; font-weight: bold; margin: 0; }
          .subtitle { color: #6b7280; font-size: 11px; margin-top: 4px; }
          .section { margin-bottom: 16px; background: #faf8f5; padding: 12px 16px; border-radius: 8px; border: 1px solid #eadfd5; }
          .section-title { font-weight: bold; font-size: 12px; color: #701A24; text-transform: uppercase; margin-bottom: 6px; }
          .content { font-size: 12px; white-space: pre-line; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          .meta-table td { padding: 4px 8px; }
          .meta-label { font-weight: bold; color: #4b5563; width: 180px; }
          .footer { margin-top: 40px; display: flex; justify-content: flex-end; }
          .signature-box { text-align: center; width: 220px; font-size: 12px; }
          .signature-space { height: 70px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">KLINIK BENANG MERAH</h1>
            <p class="subtitle">Layanan Psikologi & Kesehatan Mental | Jl. Bandung No. B9/16, Nuansa Majasem</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #701A24; font-weight: bold;">
            DOKUMEN RAHASIA MEDIS
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Nama Pasien:</td>
            <td><strong>${appointment.patient_name || '-'}</strong></td>
            <td class="meta-label">Kunjungan Sesi Ke-:</td>
            <td>${appointment.visit_number || 1}</td>
          </tr>
          <tr>
            <td class="meta-label">Usia:</td>
            <td>${appointment.age ? appointment.age + ' Tahun' : '-'}</td>
            <td class="meta-label">Tanggal Sesi:</td>
            <td>${formatDate(appointment.booking_date)} (${appointment.booking_time || 'Sesuai Janji'})</td>
          </tr>
          <tr>
            <td class="meta-label">Psikolog PJ:</td>
            <td>${appointment.doctor_name || '-'}</td>
            <td class="meta-label">Durasi Sesi:</td>
            <td>${durationLabel}</td>
          </tr>
        </table>

        <div class="section">
          <div class="section-title">1. Anamnesa & Observasi Klinis</div>
          <div class="content">${anamnesaNotes || 'Belum ada catatan.'}</div>
        </div>

        <div class="section">
          <div class="section-title">2. Diagnosa Dinamika Psikologis</div>
          <div class="content">${diagnosis || 'Belum ada diagnosa.'}</div>
        </div>

        <div class="section">
          <div class="section-title">3. Rancangan Tindak Lanjut & Intervensi</div>
          <div class="content">${followUpPlan || 'Belum ada rencana tindak lanjut.'}</div>
        </div>

        ${referToTherapist ? `
          <div class="section">
            <div class="section-title">Rujukan Terapis Internal</div>
            <div class="content">${referToTherapist}</div>
          </div>
        ` : ''}

        ${externalReferral ? `
          <div class="section">
            <div class="section-title">Rujukan Eksternal</div>
            <div class="content">${externalReferral}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="signature-box">
            <p>Psikolog Penanggung Jawab,</p>
            <div class="signature-space"></div>
            <p><strong>${appointment.doctor_name || 'Psikolog'}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-[#EADFD5]">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center border-b border-[#EADFD5] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#701A24]/10 flex items-center justify-center text-[#701A24]">
              <StethoscopeIcon className="w-5 h-5 text-[#701A24]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                Rekam Medis & Diagnosa Psikolog
              </h3>
              <p className="text-[11px] text-gray-500">
                Sistem Web-Based Editable (Tanpa Perlu Unduh File Word)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintMedicalReport}
              className="p-2 text-gray-600 hover:text-[#701A24] hover:bg-[#701A24]/5 rounded-xl transition border border-gray-200"
              title="Cetak Lembar Rekam Medis (Web Print)"
            >
              <PrinterIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INFO PASIEN CARD */}
        <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EADFD5] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#701A24]" />
            <span className="font-bold text-gray-900 text-sm">
              {appointment.patient_name}
            </span>
            <span className="text-gray-500 font-medium">
              ({appointment.age ? `${appointment.age} Thn` : 'Usia -'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#701A24] text-white font-bold text-[11px]">
              Sesi #{appointment.visit_number || 1}
            </span>
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(appointment.booking_date)}
            </span>
          </div>
        </div>

        {/* MULTI-SESI CONTINUATION VIEW */}
        {previousSessions.length > 0 && (
          <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-blue-700" />
                Multi-Sesi Continuation ({previousSessions.length} Riwayat Sesi Lalu Tersedia)
              </p>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-[11px] font-semibold text-blue-700 hover:underline"
              >
                {showHistory ? 'Sembunyikan Riwayat' : 'Lihat Rekam Medis Sesi Lalu'}
              </button>
            </div>

            {showHistory && (
              <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {previousSessions.map((prev, pIdx) => {
                  const pMeta = parseAppointmentNotes(prev.notes);
                  return (
                    <div
                      key={pIdx}
                      className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-800">
                          Kunjungan Ke-{prev.visit_number || (pIdx + 1)} ({formatDate(prev.booking_date)})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyFromPrevious(prev)}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-semibold border border-blue-200"
                        >
                          Salin ke Form Sesi Ini
                        </button>
                      </div>
                      {pMeta.diagnosis && (
                        <p className="text-[11px] text-gray-700">
                          <strong>Diagnosa Lalu:</strong> {pMeta.diagnosis}
                        </p>
                      )}
                      {pMeta.followUpPlan && (
                        <p className="text-[11px] text-gray-600">
                          <strong>Rancangan Tindak Lanjut Lalu:</strong> {pMeta.followUpPlan}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* WEB-BASED EDITABLE FORM INPUTS */}
        <div className="space-y-3.5 text-xs">
          
          {/* PILIHAN LAYANAN & DURASI OVERTIME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Kategori Layanan Konseling
              </label>
              <select
                value={serviceType}
                onChange={(e) => {
                  const val = e.target.value;
                  setServiceType(val);
                  if (val === 'couple') {
                    setSessionDurationPrice(600000);
                    setDurationLabel('1 Sesi (60 Menit)');
                  } else {
                    setSessionDurationPrice(300000);
                    setDurationLabel('1 Sesi (60 Menit)');
                  }
                }}
                className="w-full p-2.5 border border-gray-300 rounded-xl outline-none font-medium bg-white focus:ring-2 focus:ring-[#701A24]"
              >
                <option value="assessment">Assessment / Intake Interview</option>
                <option value="konseling">Konseling Individu</option>
                <option value="psikoterapi">Psikoterapi</option>
                <option value="terapi_anak">Terapi Anak</option>
                <option value="couple">Konseling Pasangan (Couple)</option>
                <option value="keluarga">Konseling Keluarga</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Durasi Sesi / Overtime Rate
              </label>
              <select
                value={sessionDurationPrice}
                onChange={(e) => {
                  const selPrice = Number(e.target.value);
                  setSessionDurationPrice(selPrice);
                  const list = serviceType === 'couple' ? OVERTIME_PASANGAN : OVERTIME_ASESMEN;
                  const item = list.find((x) => x.price === selPrice);
                  if (item) setDurationLabel(item.label);
                }}
                className="w-full p-2.5 border border-amber-300 bg-amber-50/50 rounded-xl outline-none font-bold text-gray-800 focus:ring-2 focus:ring-amber-500"
              >
                {(serviceType === 'couple' ? OVERTIME_PASANGAN : OVERTIME_ASESMEN).map((opt, idx) => (
                  <option key={idx} value={opt.price}>
                    {opt.label} - Rp {opt.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1. ANAMNESA */}
          <div>
            <label className="block font-bold text-[#701A24] mb-1 text-xs">
              1. Anamnesa & Observasi Klinis:
            </label>
            <textarea
              rows="3"
              placeholder="Ketik keluhan utama klien, latar belakang persoalan, dan hasil wawancara awal..."
              value={anamnesaNotes}
              onChange={(e) => setAnamnesaNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] font-normal leading-relaxed bg-white"
            />
          </div>

          {/* 2. DIAGNOSA */}
          <div>
            <label className="block font-bold text-[#701A24] mb-1 text-xs">
              2. Diagnosa Dinamika Psikologis:
            </label>
            <input
              type="text"
              placeholder="Contoh: Generalized Anxiety Disorder / Dinamika Komunikasi Pasangan..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] font-medium bg-white"
            />
          </div>

          {/* 3. RANCANGAN TINDAK LANJUT */}
          <div>
            <label className="block font-bold text-[#701A24] mb-1 text-xs">
              3. Rancangan Tindak Lanjut & Intervensi:
            </label>
            <textarea
              rows="3"
              placeholder="Rencana sesi lanjutan, tugas mandiri klien, atau intervensi perilaku..."
              value={followUpPlan}
              onChange={(e) => setFollowUpPlan(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#701A24] font-normal leading-relaxed bg-white"
            />
          </div>

          {/* 4. RUJUKAN INTERNAL & EKSTERNAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-red-50/30 rounded-xl border border-[#701A24]/20">
              <label className="block font-semibold text-[#701A24] mb-1 text-[11px]">
                Rujuk ke Terapis Internal (Opsional):
              </label>
              <select
                value={referToTherapist}
                onChange={(e) => setReferToTherapist(e.target.value)}
                className="w-full p-2 border border-[#701A24]/30 rounded-lg outline-none font-medium bg-white"
              >
                <option value="">-- Tanpa Rujukan Terapis --</option>
                {activeTherapistList.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-200">
              <label className="block font-semibold text-blue-900 mb-1 text-[11px]">
                Rujukan Eksternal (Dokter/RS - Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Dr. Sp.KJ / RS Gunung Jati"
                value={externalReferral}
                onChange={(e) => setExternalReferral(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded-lg outline-none font-medium bg-white"
              />
            </div>
          </div>

        </div>

        {/* TOMBOL OPSIONAL EKSPOR & CETAK LAPORAN */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center gap-1.5 shadow-2xs"
            title="Download Dokumen Laporan Rekam Medis format Microsoft Word (.docx)"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>Download Laporan (.docx / Word)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintMedicalReport}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs transition border border-gray-200 flex items-center gap-1.5"
            title="Cetak langsung Lembar Rekam Medis"
          >
            <PrinterIcon className="w-3.5 h-3.5 text-gray-600" />
            <span>Cetak Rekam Medis</span>
          </button>
        </div>

        {/* TOMBOL AKSI SIMPAN */}
        <div className="pt-2 border-t border-[#EADFD5] flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 border border-gray-300"
          >
            {saving ? 'Menyimpan...' : 'Simpan Draft Rekam Medis (Web-Based)'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="flex-1 py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? 'Memproses...' : 'Selesaikan Sesi & Terbitkan Invoice'}
          </button>
        </div>

      </div>
    </div>
  );
}
