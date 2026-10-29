import {
  EditIcon,
  UserIcon,
  CreditCardIcon,
  TagIcon,
  StethoscopeIcon,
  SparklesIcon,
  CheckIcon,
  ClockIcon
} from './icons';
import { ADMIN_HANDLERS, PAYMENT_METHODS, LIST_PSIKOLOG, SERVICE_PRICES, THERAPIST_INCENTIVE_SERVICES } from '../lib/constants';
import { formatRupiah } from '../lib/helpers';

export default function PatientForm({
  formData,
  setFormData,
  onSubmit,
  submitting,
  bookingMsg,
  checkingVoucher,
  onApplyVoucher,
  voucherMsg,
  activeTherapistList = [],
  voucherUsedCount = 0,
  maxVoucherQuota = 17
}) {
  const {
    registrationType,
    patientName,
    patientPhone,
    patientAge,
    visitNumber,
    assignedPsychologist,
    directTherapist,
    directTherapyMethod,
    handleBy,
    paymentMethod,
    bookingDate,
    bookingTime,
    serviceTypeInput,
    customServicePrice,
    adminFeeInput,
    overtimeMinutes = 0,
    overtimeFee = 0,
    voucherInput,
    discountApplied
  } = formData;

  const handleChange = (field, value) => {
    if (field === 'visitNumber') {
      const vNum = Number(value) || 1;
      const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
        (serviceTypeInput || '').toLowerCase().includes(svc.toLowerCase())
      );
      const sessionInBlock = ((vNum - 1) % 8) + 1;
      let newPrice = customServicePrice;
      if (isBlockPackage) {
        if (sessionInBlock > 1) {
          newPrice = 0;
        } else {
          newPrice = SERVICE_PRICES[serviceTypeInput] || 500000;
        }
      }
      setFormData((prev) => ({
        ...prev,
        visitNumber: value,
        customServicePrice: newPrice
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectService = (selectedService) => {
    const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
      selectedService.toLowerCase().includes(svc.toLowerCase())
    );
    const sessionInBlock = ((Number(visitNumber || 1) - 1) % 8) + 1;
    let price = SERVICE_PRICES[selectedService] || 0;
    if (isBlockPackage && sessionInBlock > 1) {
      price = 0; // Termasuk ke dalam paket 1 blok 8 pertemuan yang telah dibayar di awal
    }

    setFormData((prev) => ({
      ...prev,
      serviceTypeInput: selectedService,
      customServicePrice: price
    }));
  };

  const overtimeFeeNum = Number(overtimeFee || 0);
  const totalCalculated = Math.max(0, Number(customServicePrice) - discountApplied) + Number(adminFeeInput) + overtimeFeeNum;

  return (
    <div className="sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-[#EADFD5]">
      <div className="bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm hover:shadow-md transition-shadow">
        
        {/* HEADER FORM */}
        <div className="border-b border-[#EADFD5] pb-3 mb-4 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#701A24] flex items-center gap-2">
            <EditIcon className="w-4 h-4 text-[#701A24]" />
            Form Tambah Pasien Baru
          </h3>
          <span className="text-[10px] font-semibold bg-[#701A24]/10 text-[#701A24] px-2 py-0.5 rounded-full">
            Sticky Panel
          </span>
        </div>

        {bookingMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
              bookingMsg.includes('Gagal')
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {bookingMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          
          {/* 1. HANDLE BY ADMIN & METODE PEMBAYARAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Handle By Admin */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-[11px]">
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                Handle By Admin:
              </label>
              <select
                value={handleBy}
                onChange={(e) => handleChange('handleBy', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-bold text-gray-800 bg-white focus:ring-2 focus:ring-[#701A24]"
              >
                {ADMIN_HANDLERS.map((handler, idx) => (
                  <option key={idx} value={handler}>
                    {handler}
                  </option>
                ))}
              </select>
            </div>

            {/* Metode Pembayaran */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <label className="block font-semibold text-amber-900 mb-1 flex items-center gap-1.5 text-[11px]">
                <CreditCardIcon className="w-3.5 h-3.5 text-amber-700" />
                Metode Pembayaran:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white focus:ring-2 focus:ring-[#701A24]"
              >
                {PAYMENT_METHODS.map((method, idx) => (
                  <option key={idx} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. PILIH JALUR PENDAFTARAN */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EADFD5]">
            <label className="block font-semibold text-gray-700 mb-2 text-[11px]">
              Jalur Pendaftaran Layanan:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('registrationType', 'psikolog')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition border flex items-center justify-center gap-1.5 ${
                  registrationType === 'psikolog'
                    ? 'bg-[#701A24] text-white border-[#701A24] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#701A24]/40'
                }`}
              >
                <StethoscopeIcon className="w-3.5 h-3.5" />
                Psikolog Utama
              </button>
              <button
                type="button"
                onClick={() => handleChange('registrationType', 'terapis_direct')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition border flex items-center justify-center gap-1.5 ${
                  registrationType === 'terapis_direct'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                Direct Terapis
              </button>
            </div>
          </div>

          {/* 3. NAMA PASIEN & WHATSAPP */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Nama Pasien</label>
            <input
              type="text"
              required
              placeholder="Contoh: Anindya Putri"
              value={patientName}
              onChange={(e) => handleChange('patientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] focus:border-transparent transition bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">No. WhatsApp</label>
            <input
              type="text"
              required
              placeholder="08xxxxxxxxxx"
              value={patientPhone}
              onChange={(e) => handleChange('patientPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] focus:border-transparent transition bg-white"
            />
          </div>

          {/* 4. USIA & KUNJUNGAN KE- */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Usia (Tahun)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="25"
                value={patientAge}
                onChange={(e) => handleChange('patientAge', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Kunjungan Ke-</label>
              <input
                type="number"
                required
                min="1"
                placeholder="1"
                value={visitNumber}
                onChange={(e) => handleChange('visitNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] bg-white font-bold text-[#701A24]"
              />
            </div>
          </div>

          {/* 5. PEMILIHAN PSIKOLOG ATAU TERAPIS */}
          {registrationType === 'psikolog' ? (
            <div>
              <label className="block font-semibold text-[#701A24] mb-1">
                Pilih Psikolog Penanggung Jawab
              </label>
              <select
                value={assignedPsychologist}
                onChange={(e) => handleChange('assignedPsychologist', e.target.value)}
                className="w-full px-3 py-2 border border-[#701A24]/30 bg-red-50/20 rounded-lg outline-none font-medium text-gray-800 focus:ring-2 focus:ring-[#701A24]"
              >
                {LIST_PSIKOLOG.map((p, idx) => (
                  <option key={idx} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
              <div>
                <label className="block font-semibold text-blue-900 mb-1 text-[11px]">
                  Metode Layanan Terapis Direct
                </label>
                <select
                  value={directTherapyMethod}
                  onChange={(e) => handleChange('directTherapyMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none font-medium text-gray-800 bg-white"
                >
                  <option value="Terapi Anak Spesial">Terapi Anak Spesial — Rp 150.000/sesi</option>
                  <option value="Kelas Anak Usia Dini (Pra-Literasi)">Kelas Anak Usia Dini (Pra-Literasi) — Rp 500.000/blok</option>
                  <option value="Bimbingan Belajar Intensif SD">Bimbingan Belajar Intensif SD — Rp 600.000/8 pertemuan</option>
                  <option value="Shadow Teacher">Shadow Teacher — Sesuai Kebutuhan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-blue-900 mb-1 text-[11px]">
                  Pilih Terapis Penanggung Jawab
                </label>
                <select
                  value={directTherapist}
                  onChange={(e) => handleChange('directTherapist', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none font-medium text-gray-800 bg-white"
                >
                  {activeTherapistList.length === 0 ? (
                    <option value="">-- Memuat Terapis Aktif... --</option>
                  ) : (
                    activeTherapistList.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* 6. TANGGAL & JAM SESI */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Tanggal Sesi</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => handleChange('bookingDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Jam Sesi</label>
              <input
                type="text"
                required
                placeholder="10:30 WIB"
                value={bookingTime}
                onChange={(e) => handleChange('bookingTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#701A24] bg-white text-xs"
              />
            </div>
          </div>

          {/* 7. LAYANAN & TARIF */}
          {registrationType === 'psikolog' && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2.5">
              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Opsi Layanan Psikolog
                </label>
                <select
                  value={serviceTypeInput}
                  onChange={(e) => handleSelectService(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg outline-none font-medium text-gray-800 bg-white focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  <option value="">-- Pilih Layanan Standar --</option>
                  <optgroup label="── Layanan Individu ──">
                    <option value="Konseling Individu (60 Menit)">Konseling Individu (60 Menit) — Rp 300.000</option>
                    <option value="Program Psikoterapi">Program Psikoterapi — Rp 400.000</option>
                    <option value="Couple Counseling (60 Menit)">Couple Counseling (60 Menit) — Rp 650.000</option>
                    <option value="Tes IQ Individual (WISC/WAIS)">Tes IQ Individual (WISC/WAIS) — Rp 850.000</option>
                    <option value="Tes Skrining ADHD (DIVA-5)">Tes Skrining ADHD (DIVA-5) — Rp 500.000</option>
                    <option value="Asesmen Tumbuh Kembang Preschool">Asesmen Tumbuh Kembang Preschool — Rp 300.000</option>
                  </optgroup>
                  <optgroup label="── Layanan Instansi ──">
                    <option value="Psikoedukasi">Psikoedukasi — Rp 1.500.000</option>
                    <option value="Psikotes Rekrutmen">Psikotes Rekrutmen — Rp 300.000/orang</option>
                    <option value="Analisis Jabatan Manajerial">Analisis Jabatan Manajerial — Rp 400.000/orang</option>
                    <option value="Analisis Jabatan Pimpinan">Analisis Jabatan Pimpinan — Rp 700.000/orang</option>
                    <option value="Outbound / Forest Therapy">Outbound / Forest Therapy — Rp 300.000/orang</option>
                  </optgroup>
                  <optgroup label="── Layanan Lainnya ──">
                    <option value="Layanan Lainnya">Layanan Lainnya / Kustom (Isi Manual)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Biaya Layanan (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={customServicePrice}
                  onChange={(e) => handleChange('customServicePrice', e.target.value)}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* VOUCHER PROMO */}
              <div className="pt-1.5 border-t border-amber-200">
                <label className="block font-semibold text-amber-900 mb-1 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-3.5 h-3.5 text-amber-700" />
                    Kode Voucher Promo
                  </span>
                  <span className="text-[10px] text-amber-800 font-normal">
                    Quota: {voucherUsedCount}/{maxVoucherQuota}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="OPENING100K"
                    value={voucherInput}
                    onChange={(e) => handleChange('voucherInput', e.target.value)}
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg outline-none uppercase font-bold text-gray-800 bg-white"
                  />
                  <button
                    type="button"
                    disabled={checkingVoucher}
                    onClick={onApplyVoucher}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs whitespace-nowrap shadow-xs disabled:opacity-50"
                  >
                    {checkingVoucher ? 'Cek...' : 'Terapkan'}
                  </button>
                </div>
                {voucherMsg && (
                  <p className={`text-[11px] font-semibold mt-1 ${discountApplied > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {voucherMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 8. FITUR OVERTIME / KELEBIHAN WAKTU KONSULTASI */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
            <label className="block font-semibold text-amber-950 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-amber-700" />
                Overtime / Kelebihan Waktu Sesi (Opsional)
              </span>
              {overtimeFeeNum > 0 && (
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  +{formatRupiah(overtimeFeeNum)}
                </span>
              )}
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-amber-900 mb-0.5">
                  Durasi Overtime (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Contoh: 15"
                  value={overtimeMinutes || ''}
                  onChange={(e) => {
                    const mins = Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleChange('overtimeMinutes', mins);
                  }}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white text-xs focus:ring-2 focus:ring-[#701A24]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-amber-900 mb-0.5">
                  Tarif / Biaya Overtime (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="Contoh: 50000"
                  value={overtimeFee || ''}
                  onChange={(e) => {
                    const fee = Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleChange('overtimeFee', fee);
                  }}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg outline-none font-bold text-gray-800 bg-white text-xs focus:ring-2 focus:ring-[#701A24]"
                />
              </div>
            </div>
            <p className="text-[10px] text-amber-800 italic">
              * Otomatis ditambahkan ke total pembayaran dan tercetak transparan di struk / invoice.
            </p>
          </div>

          {/* 9. BIAYA ADMINISTRASI */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Biaya Administrasi Klinik (Rp)</label>
            <input
              type="number"
              value={adminFeeInput}
              onChange={(e) => handleChange('adminFeeInput', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-2 focus:ring-[#701A24] bg-white"
            />
          </div>

          {/* TOTAL ESTIMASI BIAYA */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EADFD5] font-semibold text-gray-700 flex justify-between items-center text-xs">
            <span>Estimasi Total Biaya:</span>
            <span className="text-[#701A24] font-bold text-sm">
              {formatRupiah(totalCalculated)}
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#701A24] text-white rounded-xl font-bold hover:bg-[#54121B] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            {submitting ? 'Menyimpan Pendaftaran...' : 'Simpan Pendaftaran Pasien'}
          </button>
        </form>

      </div>
    </div>
  );
}
