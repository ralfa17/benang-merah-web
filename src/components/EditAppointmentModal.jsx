import React, { useState, useEffect } from 'react';
import {
  EditIcon,
  CloseIcon,
  UserIcon,
  CreditCardIcon,
  CheckIcon
} from './icons';
import { ADMIN_HANDLERS, PAYMENT_METHODS, LIST_PSIKOLOG, SERVICE_PRICES, MASTER_VOUCHERS } from '../lib/constants';
import { parseAppointmentNotes, formatRupiah, buildAppointmentNotes } from '../lib/helpers';

export default function EditAppointmentModal({
  appointment,
  activeTherapistList = [],
  onClose,
  onSave
}) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState(0);
  const [visitNumber, setVisitNumber] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [handleBy, setHandleBy] = useState(ADMIN_HANDLERS[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [serviceType, setServiceType] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [adminFee, setAdminFee] = useState(30000);
  const [voucherInput, setVoucherInput] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [overtimeFee, setOvertimeFee] = useState(0);
  const [psychologist, setPsychologist] = useState('');
  const [therapist, setTherapist] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setPatientName(appointment.patient_name || '');
      setAge(appointment.age || 0);
      setVisitNumber(appointment.visit_number || 1);
      setBookingDate(appointment.booking_date || '');
      setBookingTime(appointment.booking_time || '');
      setAdminFee(Number(appointment.admin_fee ?? 30000));
      setPsychologist(appointment.doctor_name || LIST_PSIKOLOG[0].label);
      setTherapist(appointment.assigned_terapis || '');
      setServiceType(appointment.service_type || appointment.category || '');

      const meta = parseAppointmentNotes(appointment.notes);
      setHandleBy(meta.handleBy);
      setPaymentMethod(meta.paymentMethod);
      setOvertimeMinutes(meta.overtimeMinutes || 0);
      setOvertimeFee(meta.overtimeFee || 0);

      if (meta.voucherCode === 'OPENING100K') {
        setVoucherInput('OPENING100K');
        setDiscountApplied(100000);
        setVoucherMsg('Voucher OPENING100K terpasang (Diskon Rp 100.000)');
      } else {
        setVoucherInput('');
        setDiscountApplied(0);
        setVoucherMsg('');
      }

      const basePrice = SERVICE_PRICES[appointment.service_type] ||
        Math.max(0, (appointment.price ?? 30000) - (appointment.admin_fee ?? 30000) + (meta.voucherCode === 'OPENING100K' ? 100000 : 0));
      setCustomPrice(basePrice);
    }
  }, [appointment]);

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setDiscountApplied(0);
      setVoucherMsg('');
      return;
    }

    if (MASTER_VOUCHERS[code]) {
      const discountVal = MASTER_VOUCHERS[code];
      setDiscountApplied(discountVal);
      setVoucherMsg(`Voucher ${code} Aktif (Diskon ${formatRupiah(discountVal)})`);
    } else {
      setDiscountApplied(0);
      setVoucherMsg('Kode voucher tidak valid.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedAdminFee = Number(adminFee) || 0;
      const baseServicePrice = Number(customPrice) || 0;
      const overtimeFeeNum = Number(overtimeFee) || 0;
      const finalServicePrice = Math.max(0, baseServicePrice - discountApplied);
      const newTotalPrice = finalServicePrice + parsedAdminFee + overtimeFeeNum;

      const meta = parseAppointmentNotes(appointment.notes);

      const newNotes = buildAppointmentNotes({
        patientName,
        patientPhone: meta.phone,
        handleBy,
        paymentMethod,
        voucherCode: discountApplied > 0 ? voucherInput : '',
        discountAmount: discountApplied,
        overtimeMinutes: Number(overtimeMinutes) || 0,
        overtimeFee: overtimeFeeNum,
        isDirect: psychologist === 'Layanan Langsung Terapis',
        directMethod: serviceType,
        existingNotes: appointment.notes
      });

      const updatedPayload = {
        patient_name: patientName,
        age: parseInt(age, 10) || 0,
        visit_number: parseInt(visitNumber, 10) || 1,
        booking_date: bookingDate,
        booking_time: bookingTime || 'Sesuai Janji',
        admin_fee: parsedAdminFee,
        price: newTotalPrice,
        notes: newNotes,
        service_type: serviceType || null,
        category: serviceType || null,
        doctor_name: psychologist,
        assigned_terapis: therapist || null
      };

      await onSave(appointment.id, updatedPayload);
      onClose();
    } catch (err) {
      alert(`Gagal menyimpan perubahan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const calculatedTotal = Math.max(0, Number(customPrice) - discountApplied) + Number(adminFee) + Number(overtimeFee || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#EADFD5]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-[#EADFD5] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#701A24]/10 flex items-center justify-center text-[#701A24]">
              <EditIcon className="w-4 h-4 text-[#701A24]" />
            </div>
            <h3 className="font-serif font-bold text-gray-900 text-sm leading-tight">
              Edit Data Pendaftaran Pasien
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          
          {/* HANDLE BY & METODE BAYAR */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                Handle By Admin:
              </label>
              <select
                value={handleBy}
                onChange={(e) => setHandleBy(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none font-bold text-gray-800 bg-white"
              >
                {ADMIN_HANDLERS.map((h, idx) => (
                  <option key={idx} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <label className="block font-semibold text-amber-900 mb-1 flex items-center gap-1 text-[11px]">
                <CreditCardIcon className="w-3.5 h-3.5 text-amber-700" />
                Metode Pembayaran:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white"
              >
                {PAYMENT_METHODS.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* NAMA PASIEN */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Nama Pasien</label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none font-semibold text-gray-800"
            />
          </div>

          {/* USIA & KUNJUNGAN KE- */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Usia (Tahun)</label>
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Kunjungan Ke-</label>
              <input
                type="number"
                min="1"
                value={visitNumber}
                onChange={(e) => setVisitNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold text-[#701A24]"
              />
            </div>
          </div>

          {/* TANGGAL & JAM */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Tanggal Sesi</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Jam Sesi</label>
              <input
                type="text"
                required
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* LAYANAN & TARIF */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
            <div>
              <label className="block font-semibold text-amber-900 mb-1">Opsi Layanan</label>
              <select
                value={serviceType}
                onChange={(e) => {
                  const val = e.target.value;
                  setServiceType(val);
                  if (SERVICE_PRICES[val]) {
                    setCustomPrice(SERVICE_PRICES[val]);
                  }
                }}
                className="w-full p-2 border border-amber-300 rounded-lg outline-none font-medium text-gray-800 bg-white"
              >
                <option value="">-- Pilih Layanan --</option>
                <optgroup label="── Layanan Individu ──">
                  <option value="Konseling Individu (60 Menit)">Konseling Individu (60 Menit) — Rp 300.000</option>
                  <option value="Program Psikoterapi">Program Psikoterapi — Rp 400.000</option>
                  <option value="Couple Counseling (60 Menit)">Couple Counseling (60 Menit) — Rp 650.000</option>
                  <option value="Tes IQ Individual (WISC/WAIS)">Tes IQ Individual (WISC/WAIS) — Rp 850.000</option>
                  <option value="Tes Skrining ADHD (DIVA-5)">Tes Skrining ADHD (DIVA-5) — Rp 500.000</option>
                  <option value="Asesmen Tumbuh Kembang Preschool">Asesmen Tumbuh Kembang Preschool — Rp 300.000</option>
                </optgroup>
                <optgroup label="── Layanan Anak & Terapis ──">
                  <option value="Terapi Anak Spesial">Terapi Anak Spesial — Rp 150.000/sesi</option>
                  <option value="Kelas Anak Usia Dini (Pra-Literasi)">Kelas Anak Usia Dini (Pra-Literasi) — Rp 500.000/blok</option>
                  <option value="Bimbingan Belajar Intensif SD">Bimbingan Belajar Intensif SD — Rp 600.000/8 pertemuan</option>
                  <option value="Shadow Teacher">Shadow Teacher — Sesuai Kebutuhan</option>
                </optgroup>
                <optgroup label="── Layanan Instansi ──">
                  <option value="Psikoedukasi">Psikoedukasi — Rp 1.500.000</option>
                  <option value="Psikotes Rekrutmen">Psikotes Rekrutmen — Rp 300.000/orang</option>
                  <option value="Analisis Jabatan Manajerial">Analisis Jabatan Manajerial — Rp 400.000/orang</option>
                  <option value="Analisis Jabatan Pimpinan">Analisis Jabatan Pimpinan — Rp 700.000/orang</option>
                  <option value="Outbound / Forest Therapy">Outbound / Forest Therapy — Rp 300.000/orang</option>
                </optgroup>
                <optgroup label="── Lainnya ──">
                  <option value="Layanan Lainnya">Layanan Lainnya / Manual</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-amber-900 mb-1">Biaya Layanan (Rp)</label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full p-2 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white"
              />
            </div>

            <div className="pt-1.5 border-t border-amber-200">
              <label className="block font-semibold text-amber-900 mb-1">Voucher Diskon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="OPENING100K"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg outline-none uppercase font-bold text-gray-800 bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs whitespace-nowrap"
                >
                  Terapkan
                </button>
              </div>
              {voucherMsg && (
                <p className={`text-[11px] font-semibold mt-1 ${discountApplied > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {voucherMsg}
                </p>
              )}
            </div>
          </div>

          {/* BIAYA ADMIN */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Biaya Administrasi (Rp)</label>
            <input
              type="number"
              value={adminFee}
              onChange={(e) => setAdminFee(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none font-bold text-gray-800"
            />
          </div>

          {/* OVERTIME / KELEBIHAN WAKTU */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
            <label className="block font-semibold text-amber-950 text-xs">
              Overtime / Kelebihan Waktu Sesi (Opsional):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                  Durasi Overtime (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0 menit"
                  value={overtimeMinutes || ''}
                  onChange={(e) => setOvertimeMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full p-2 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                  Tarif Overtime (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="Rp 0"
                  value={overtimeFee || ''}
                  onChange={(e) => setOvertimeFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full p-2 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* TOTAL ESTIMASI BARU */}
          <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EADFD5] font-semibold text-gray-700 flex justify-between items-center text-xs">
            <span>Total Tagihan Baru:</span>
            <span className="text-[#701A24] font-bold text-sm">
              {formatRupiah(calculatedTotal)}
            </span>
          </div>

          {/* PSIKOLOG & TERAPIS */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Psikolog PJ</label>
              <select
                value={psychologist}
                onChange={(e) => setPsychologist(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              >
                {LIST_PSIKOLOG.map((p, idx) => (
                  <option key={idx} value={p.label}>{p.shortName}</option>
                ))}
                <option value="Layanan Langsung Terapis">Layanan Langsung Terapis</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Terapis Rujukan</label>
              <select
                value={therapist}
                onChange={(e) => setTherapist(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
              >
                <option value="">-- Tanpa Terapis --</option>
                {activeTherapistList.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TOMBOL SIMPAN */}
          <div className="pt-2 border-t border-[#EADFD5] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <CheckIcon className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
