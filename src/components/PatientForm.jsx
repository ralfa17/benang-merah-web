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
import { ADMIN_HANDLERS, PAYMENT_METHODS, LIST_PSIKOLOG, SERVICE_PRICES, THERAPIST_INCENTIVE_SERVICES, PSYCHOLOGICAL_REPORT_FEE } from '../lib/constants';
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
    includePsychologicalReport = false,
    blockPaymentScheme = 'start', // 'start' (Bayar di Awal) | 'end' (Bayar di Akhir)
    voucherInput,
    discountApplied
  } = formData;

  // Helper kalkulasi harga paket blok terapis (8 sesi)
  const calculateBlockPrice = (serviceName, vNumber, scheme = blockPaymentScheme) => {
    const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
      (serviceName || '').toLowerCase().includes(svc.toLowerCase())
    );
    if (!isBlockPackage) {
      return SERVICE_PRICES[serviceName] || 0;
    }
    const fullPrice = SERVICE_PRICES[serviceName] || (serviceName.includes('Bimbel') ? 600000 : 500000);
    const sessionInBlock = ((Number(vNumber || 1) - 1) % 8) + 1;
    if (scheme === 'end') {
      // Bayar di Akhir: Sesi 1 s/d 7 Rp 0, Sesi 8 akumulasi penuh
      return sessionInBlock === 8 ? fullPrice : 0;
    } else {
      // Bayar di Awal: Sesi 1 penuh, Sesi 2 s/d 8 Rp 0
      return sessionInBlock === 1 ? fullPrice : 0;
    }
  };

  const handleChange = (field, value) => {
    if (field === 'visitNumber') {
      const vNum = Number(value) || 1;
      const currentService = registrationType === 'terapis_direct' ? directTherapyMethod : serviceTypeInput;
      const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
        (currentService || '').toLowerCase().includes(svc.toLowerCase())
      );
      let newPrice = customServicePrice;
      if (isBlockPackage) {
        newPrice = calculateBlockPrice(currentService, vNum, blockPaymentScheme);
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

  const handleBlockSchemeChange = (scheme) => {
    const currentService = registrationType === 'terapis_direct' ? directTherapyMethod : serviceTypeInput;
    const newPrice = calculateBlockPrice(currentService, visitNumber, scheme);
    // Jika skema baru menghasilkan sesi nol-biaya, admin fee di-bypass
    const sib = ((Number(visitNumber || 1) - 1) % 8) + 1;
    const willBeZeroCost =
      (scheme === 'end' && sib < 8) ||
      (scheme === 'start' && sib > 1);
    setFormData((prev) => ({
      ...prev,
      blockPaymentScheme: scheme,
      customServicePrice: newPrice,
      // Simpan adminFeeInput tetap di state; penghitungan effectiveAdminFee dilakukan saat render
    }));
  };

  const handleSelectService = (selectedService) => {
    const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
      selectedService.toLowerCase().includes(svc.toLowerCase())
    );
    let price = isBlockPackage
      ? calculateBlockPrice(selectedService, visitNumber, blockPaymentScheme)
      : (SERVICE_PRICES[selectedService] || 0);

    setFormData((prev) => ({
      ...prev,
      serviceTypeInput: selectedService,
      customServicePrice: price
    }));
  };

  const handleSelectDirectMethod = (method) => {
    const price = calculateBlockPrice(method, visitNumber, blockPaymentScheme);
    setFormData((prev) => ({
      ...prev,
      directTherapyMethod: method,
      customServicePrice: price
    }));
  };

  const isBlockMethod = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
    ((registrationType === 'terapis_direct' ? directTherapyMethod : serviceTypeInput) || '')
      .toLowerCase()
      .includes(svc.toLowerCase())
  );

  // Hitung apakah sesi ini adalah sesi nol-biaya (zero-cost block session)
  // Bayar di Akhir: Sesi 1–7 = Rp 0 (service + admin). Sesi 8 = bayar penuh.
  // Bayar di Awal:  Sesi 1 = bayar penuh. Sesi 2–8 = Rp 0 (service + admin).
  const isZeroCostBlockSession = isBlockMethod && registrationType === 'terapis_direct' && (() => {
    const sib = ((Number(visitNumber || 1) - 1) % 8) + 1;
    if (blockPaymentScheme === 'end') return sib < 8;
    if (blockPaymentScheme === 'start') return sib > 1;
    return false;
  })();

  const overtimeFeeNum = Number(overtimeFee || 0);
  const psychologicalReportFeeNum = includePsychologicalReport ? PSYCHOLOGICAL_REPORT_FEE : 0;
  // Biaya admin di-bypass ke Rp 0 untuk sesi nol-biaya pada paket blok
  const effectiveAdminFee = isZeroCostBlockSession ? 0 : Number(adminFeeInput || 0);
  const totalCalculated = Number(customServicePrice || 0) + effectiveAdminFee + overtimeFeeNum + psychologicalReportFeeNum;

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
                  onChange={(e) => handleSelectDirectMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none font-medium text-gray-800 bg-white"
                >
                  <option value="Terapi Anak Spesial">Terapi Anak Spesial — Rp 150.000/sesi</option>
                  <option value="Kelas Anak Usia Dini (Pra-Literasi)">Kelas Anak Usia Dini (Pra-Literasi) — Rp 500.000/blok</option>
                  <option value="Bimbingan Belajar Intensif SD">Bimbingan Belajar Intensif SD — Rp 600.000/8 pertemuan</option>
                  <option value="Shadow Teacher">Shadow Teacher — Sesuai Kebutuhan</option>
                </select>
              </div>

              {/* Skema Penagihan Paket Blok (Pra-Literasi & Bimbel SD) */}
              {isBlockMethod && (
                <div className="p-2.5 bg-white rounded-lg border border-blue-200 space-y-1.5">
                  <label className="block font-semibold text-blue-950 text-[10px]">
                    Skema Penagihan Paket Blok (8 Sesi):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBlockSchemeChange('start')}
                      className={`px-2 py-1.5 rounded-md text-[10px] font-semibold text-center border transition ${
                        blockPaymentScheme === 'start'
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Bayar di Awal (Sesi 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlockSchemeChange('end')}
                      className={`px-2 py-1.5 rounded-md text-[10px] font-semibold text-center border transition ${
                        blockPaymentScheme === 'end'
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Bayar di Akhir (Sesi 8)
                    </button>
                  </div>
                  <p className="text-[9px] text-blue-800 italic leading-tight">
                    {blockPaymentScheme === 'end'
                      ? '* Sesi 1 s/d 7 tercatat Rp 0. Total paket otomatis ditagihkan pada Sesi 8.'
                      : '* Total paket ditagihkan pada Sesi 1. Sesi 2 s/d 8 tercatat Rp 0 (Lunas di awal).'}
                  </p>
                </div>
              )}

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
                  <optgroup label="── Layanan Konseling & Terapi ──">
                    <option value="Konseling Anak, Remaja, Dewasa (60 menit)">Konseling Anak, Remaja, Dewasa (60 menit) — Rp 300.000</option>
                    <option value="Konseling Couple (Pra Nikah) (60 menit)">Konseling Couple (Pra Nikah) (60 menit) — Rp 500.000</option>
                    <option value="Konseling Marital / Rumah Tangga (60 menit)">Konseling Marital / Rumah Tangga (60 menit) — Rp 700.000</option>
                    <option value="Konseling Keluarga (60 menit)">Konseling Keluarga (60 menit) — Rp 800.000</option>
                    <option value="Psikoterapi">Psikoterapi — Rp 400.000</option>
                  </optgroup>
                  <optgroup label="── Asesmen & Tes Psikologi ──">
                    <option value="Asesmen Klinis Dewasa">Asesmen Klinis Dewasa — Rp 500.000</option>
                    <option value="Tes IQ">Tes IQ — Rp 350.000</option>
                    <option value="Tes IQ WAIS / WISC">Tes IQ WAIS / WISC — Rp 750.000</option>
                    <option value="Tes Kepribadian">Tes Kepribadian — Rp 400.000</option>
                    <option value="Tes Minat">Tes Minat — Rp 450.000</option>
                    <option value="Tes Minat Potensial (Minat + IQ)">Tes Minat Potensial (Minat + IQ) — Rp 600.000</option>
                    <option value="Tes CTKI">Tes CTKI — Rp 450.000</option>
                  </optgroup>
                  <optgroup label="── Dokumen & Laporan ──">
                    <option value="Laporan Hasil Pemeriksaan Psikologis">Laporan Hasil Pemeriksaan Psikologis — Rp 150.000</option>
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

              {/* Opsional Checkbox: Laporan Hasil Pemeriksaan Psikologis */}
              <div className="pt-1.5 border-t border-amber-200">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(includePsychologicalReport)}
                    onChange={(e) => handleChange('includePsychologicalReport', e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#701A24] rounded border-amber-300 focus:ring-[#701A24] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-amber-950 text-[11px] block">
                      Sertakan Laporan Hasil Pemeriksaan Psikologis (+Rp 150.000)
                    </span>
                    <span className="text-[10px] text-amber-800 leading-tight block">
                      Otomatis menambahkan biaya Rp 150.000 dan tercetak transparan di lembar Nota/Kuitansi.
                    </span>
                  </div>
                </label>
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
                  step="15"
                  placeholder="Contoh: 15"
                  value={overtimeMinutes || ''}
                  onChange={(e) => {
                    const mins = Math.max(0, parseInt(e.target.value, 10) || 0);
                    const autoFee = Math.ceil(mins / 15) * 50000;
                    setFormData((prev) => ({
                      ...prev,
                      overtimeMinutes: mins,
                      overtimeFee: autoFee
                    }));
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
              * Kelipatan 15 menit otomatis mematok Rp 50.000 (tetap dapat disesuaikan manual). Tercetak transparan di struk / nota.
            </p>
          </div>

          {/* 9. BIAYA ADMINISTRASI */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Biaya Administrasi Klinik (Rp)</label>
            {isZeroCostBlockSession ? (
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 font-bold text-xs flex items-center gap-2">
                <span>Rp 0</span>
                <span className="text-[10px] italic font-normal text-gray-400">
                  — Otomatis Rp 0 (Paket Blok: {blockPaymentScheme === 'end' ? 'Ditagihkan pada Sesi 8' : 'Sudah Lunas di Sesi 1'})
                </span>
              </div>
            ) : (
              <input
                type="number"
                value={adminFeeInput}
                onChange={(e) => handleChange('adminFeeInput', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none font-bold text-gray-800 focus:ring-2 focus:ring-[#701A24] bg-white"
              />
            )}
          </div>

          {/* TOTAL ESTIMASI BIAYA */}
          <div className={`p-3 rounded-xl border font-semibold flex justify-between items-center text-xs ${
            isZeroCostBlockSession
              ? 'bg-blue-50/40 border-blue-200 text-blue-800'
              : 'bg-[#FAF8F5] border-[#EADFD5] text-gray-700'
          }`}>
            <span>Estimasi Total Biaya:</span>
            <span className={`font-bold text-sm ${isZeroCostBlockSession ? 'text-blue-700' : 'text-[#701A24]'}`}>
              {isZeroCostBlockSession ? 'Rp 0 (Sesi Paket Blok)' : formatRupiah(totalCalculated)}
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
