import * as XLSX from 'xlsx';
import { SERVICE_PRICES, ADMIN_HANDLERS, PAYMENT_METHODS } from './constants';

export const formatRupiah = (num) => {
  const n = Number(num) || 0;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[monthIndex] || month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatDateWithDay = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const dayName = days[d.getDay()];
    return `${dayName}, ${formatDate(dateStr)}`;
  } catch {
    return dateStr;
  }
};

export const normalizePatientName = (name) => {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
};

// Ekstrak data terstruktur dari field notes
export const parseAppointmentNotes = (rawNotes = '') => {
  const notes = String(rawNotes || '');

  // Ekstrak Nomor HP
  const phoneMatch = notes.match(/HP:\s*([0-9+]+)/i);
  const phone = phoneMatch ? phoneMatch[1].trim() : '';

  // Ekstrak Handle By Admin
  const handleMatch = notes.match(/\[Handle By:\s*([^\]]+)\]/i);
  let handleBy = handleMatch ? handleMatch[1].trim() : '';
  if (!ADMIN_HANDLERS.includes(handleBy)) {
    // Cari yang cocok sebagian jika format sedikit berbeda
    const found = ADMIN_HANDLERS.find(h => handleBy.toLowerCase().includes(h.toLowerCase()));
    handleBy = found || ADMIN_HANDLERS[0];
  }

  // Ekstrak Metode Bayar
  const paymentMatch = notes.match(/\[Metode Bayar:\s*([^\]]+)\]/i);
  let paymentMethod = paymentMatch ? paymentMatch[1].trim() : '';
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    const found = PAYMENT_METHODS.find(p => paymentMethod.toLowerCase().includes(p.toLowerCase()));
    paymentMethod = found || PAYMENT_METHODS[0];
  }

  // Ekstrak Voucher & Diskon
  const voucherMatch = notes.match(/\[Voucher Used:\s*([^\s-]+)/i);
  const voucherCode = voucherMatch ? voucherMatch[1].trim().toUpperCase() : '';
  const discountMatch = notes.match(/Diskon\s*Rp\s*([0-9.]+)/i);
  const discountAmount = discountMatch ? parseInt(discountMatch[1].replace(/\./g, ''), 10) : (voucherCode ? 100000 : 0);

  // Ekstrak Durasi Sesi
  const durationMatch = notes.match(/Durasi Sesi:\s*([^\n]+)/i);
  const durationLabel = durationMatch ? durationMatch[1].trim() : '';

  // Ekstrak Overtime Sesi (Menit & Biaya)
  const overtimeMatch = notes.match(/\[Overtime:\s*(\d+)\s*Menit\s*-\s*Rp\s*([0-9.]+)\]/i);
  const overtimeMinutes = overtimeMatch ? parseInt(overtimeMatch[1], 10) : 0;
  const overtimeFee = overtimeMatch ? parseInt(overtimeMatch[2].replace(/\./g, ''), 10) : 0;

  // Ekstrak Rekam Medis Psikolog
  const anamnesaMatch = notes.match(/Anamnesa:\s*([\s\S]*?)(?=\n\s*(?:Diagnosa:|Rancangan Tindak Lanjut:|Rujukan:|$))/i);
  const anamnesa = anamnesaMatch ? anamnesaMatch[1].trim() : '';

  const diagnosisMatch = notes.match(/Diagnosa:\s*([\s\S]*?)(?=\n\s*(?:Rancangan Tindak Lanjut:|Rujukan:|$))/i);
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : '';

  const followUpMatch = notes.match(/Rancangan Tindak Lanjut:\s*([\s\S]*?)(?=\n\s*(?:Rujukan:|$))/i);
  const followUpPlan = followUpMatch ? followUpMatch[1].trim() : '';

  const internalRefMatch = notes.match(/Rujukan Terapis Internal:\s*([^|\n]+)/i);
  const internalReferral = internalRefMatch ? internalRefMatch[1].trim() : '';

  const externalRefMatch = notes.match(/Rujukan Eksternal:\s*([^\n]+)/i);
  const externalReferral = externalRefMatch ? externalRefMatch[1].trim() : '';

  // Ekstrak Progress Terapis
  const progressMatch = notes.match(/\[PROGRESS TERAPIS[^\]]*\][\s\S]*?Progress & Perubahan:\s*([\s\S]*?)(?=\n\n\[|$)/i);
  const therapyProgress = progressMatch ? progressMatch[1].trim() : '';

  return {
    phone,
    handleBy,
    paymentMethod,
    voucherCode,
    discountAmount,
    durationLabel,
    overtimeMinutes,
    overtimeFee,
    anamnesa,
    diagnosis,
    followUpPlan,
    internalReferral,
    externalReferral,
    therapyProgress,
    rawNotes: notes
  };
};

// Buat string notes baru yang rapi dan terstandar
export const buildAppointmentNotes = ({
  patientName,
  patientPhone,
  handleBy = 'Fauzan',
  paymentMethod = 'QRIS',
  voucherCode = '',
  discountAmount = 0,
  overtimeMinutes = 0,
  overtimeFee = 0,
  isDirect = false,
  directMethod = '',
  existingNotes = ''
}) => {
  let header = `[Klien: ${patientName || 'Klien'} - HP: ${patientPhone || '-'}] [Handle By: ${handleBy}] [Metode Bayar: ${paymentMethod}]`;

  if (isDirect && directMethod) {
    header += ` (Layanan Langsung Terapis: ${directMethod})`;
  }

  if (voucherCode && discountAmount > 0) {
    header += ` [Voucher Used: ${voucherCode.toUpperCase()} - Diskon Rp ${discountAmount.toLocaleString('id-ID')}]`;
  }

  if (Number(overtimeMinutes) > 0 && Number(overtimeFee) > 0) {
    header += ` [Overtime: ${Number(overtimeMinutes)} Menit - Rp ${Number(overtimeFee).toLocaleString('id-ID')}]`;
  }

  // Jika ada rekam medis sebelumnya, pertahankan
  let preservedSections = '';
  if (existingNotes) {
    const medicalIndex = existingNotes.indexOf('[REKAM MEDIS PSIKOLOG]');
    const progressIndex = existingNotes.indexOf('[PROGRESS TERAPIS');

    const firstSectionIndex = medicalIndex !== -1 && progressIndex !== -1
      ? Math.min(medicalIndex, progressIndex)
      : (medicalIndex !== -1 ? medicalIndex : progressIndex);

    if (firstSectionIndex !== -1) {
      preservedSections = '\n\n' + existingNotes.slice(firstSectionIndex).trim();
    }
  }

  return `${header}${preservedSections}`;
};

// KELOMPOKKAN APPOINTMENT MENJADI 1 BARIS PER NAMA PASIEN (SINGLE ROW ACCORDION)
export const groupAppointmentsByPatient = (appointmentsList) => {
  const map = new Map();

  appointmentsList.forEach((item) => {
    const rawName = (item.patient_name || '').trim();
    const key = normalizePatientName(rawName) || `anon_${item.id}`;

    if (!map.has(key)) {
      map.set(key, {
        patientKey: key,
        patientName: rawName || 'Tanpa Nama',
        age: item.age || 0,
        phone: parseAppointmentNotes(item.notes).phone,
        doctorName: item.doctor_name || '',
        assignedTherapist: item.assigned_terapis || '',
        sessions: [],
        latestSession: null,
        totalSessions: 0,
        hasPendingPayment: false,
      });
    }

    const group = map.get(key);
    group.sessions.push(item);
    if (item.status !== 'lunas') {
      group.hasPendingPayment = true;
    }
    if (!group.age && item.age) group.age = item.age;
    if (!group.phone) {
      const p = parseAppointmentNotes(item.notes).phone;
      if (p) group.phone = p;
    }
  });

  const result = Array.from(map.values()).map((group) => {
    // Urutkan sesi: kunjungan ke-1, 2, 3... atau berdasarkan tanggal
    group.sessions.sort((a, b) => {
      const vA = Number(a.visit_number) || 0;
      const vB = Number(b.visit_number) || 0;
      if (vA !== vB) return vA - vB;
      return (a.booking_date || '').localeCompare(b.booking_date || '');
    });

    group.totalSessions = group.sessions.length;
    // Sesi terbaru (terakhir)
    group.latestSession = group.sessions[group.sessions.length - 1];
    return group;
  });

  // Urutkan grup pasien berdasarkan tanggal sesi terbaru (yang paling dekat/baru di atas)
  result.sort((a, b) => {
    const dateA = a.latestSession?.booking_date || '';
    const dateB = b.latestSession?.booking_date || '';
    return dateB.localeCompare(dateA);
  });

  return result;
};

// EXPORT REKAP KEUANGAN KE CSV (Dukungan Excel UTF-8 BOM)
export const exportFinancialCsv = (appointmentsList) => {
  if (!appointmentsList || appointmentsList.length === 0) {
    alert('Belum ada data pendaftaran untuk diunduh.');
    return;
  }

  const headers = [
    'No',
    'Tanggal Sesi',
    'Jam Sesi',
    'Nama Pasien',
    'Usia',
    'Kunjungan Ke-',
    'Layanan',
    'Psikolog PJ',
    'Terapis PJ',
    'Biaya Layanan',
    'Biaya Admin',
    'Total Bayar',
    'Metode Pembayaran',
    'Handle By Admin',
    'Status Pembayaran'
  ];

  const rows = appointmentsList.map((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const adminFee = Number(item.admin_fee ?? 30000);
    const totalBayar = Number(item.price ?? 30000);
    const hasVoucher = meta.voucherCode === 'OPENING100K';
    const baseServicePrice = SERVICE_PRICES[item.service_type] || Math.max(0, totalBayar - adminFee + (hasVoucher ? 100000 : 0));

    return [
      index + 1,
      `"${item.booking_date || '-'}"`,
      `"${item.booking_time || '-'}"`,
      `"${(item.patient_name || '-').replace(/"/g, '""')}"`,
      item.age ? `${item.age} Thn` : '-',
      item.visit_number || 1,
      `"${(item.service_type || item.category || 'Konseling').replace(/"/g, '""')}"`,
      `"${(item.doctor_name || '-').replace(/"/g, '""')}"`,
      `"${(item.assigned_terapis || 'Tidak Ada').replace(/"/g, '""')}"`,
      baseServicePrice,
      adminFee,
      totalBayar,
      `"${meta.paymentMethod}"`,
      `"${meta.handleBy}"`,
      item.status === 'lunas' ? 'LUNAS' : 'PENDING'
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Keuangan_BenangMerah_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================
// HELPER INTERNAL: Simpan file Excel menggunakan SheetJS (NATIVE .xlsx BINARY)
// ============================================================
const saveXlsx = (wb, filename) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

// EXPORT REKAP KEUANGAN KE EXCEL NATIVE (.XLSX MURNI — BUKAN HTML)
export const exportFinancialExcel = (appointmentsList, monthLabel = '') => {
  if (!appointmentsList || appointmentsList.length === 0) {
    alert('Belum ada data pendaftaran untuk diunduh.');
    return;
  }

  const headers = [
    'No', 'Tanggal Sesi', 'Jam Sesi', 'Nama Pasien', 'Usia', 'Sesi Ke-',
    'Layanan', 'Psikolog PJ', 'Terapis PJ', 'Biaya Layanan (Rp)',
    'Biaya Admin (Rp)', 'Total Bayar (Rp)', 'Metode Pembayaran',
    'Handle By Admin', 'Status Pembayaran'
  ];

  let totalAllRevenue = 0;
  let totalAdminRevenue = 0;
  let totalServiceRevenue = 0;

  const rows = appointmentsList.map((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const adminFee = Number(item.admin_fee ?? 30000);
    const totalBayar = Number(item.price ?? 30000);
    const hasVoucher = meta.voucherCode === 'OPENING100K';
    const baseServicePrice = SERVICE_PRICES[item.service_type] || Math.max(0, totalBayar - adminFee + (hasVoucher ? 100000 : 0));

    totalAllRevenue += totalBayar;
    totalAdminRevenue += adminFee;
    totalServiceRevenue += baseServicePrice;

    return [
      index + 1,
      item.booking_date || '-',
      item.booking_time || '-',
      item.patient_name || '-',
      item.age ? `${item.age} Thn` : '-',
      item.visit_number || 1,
      item.service_type || item.category || 'Konseling',
      item.doctor_name || '-',
      item.assigned_terapis || 'Tidak Ada',
      baseServicePrice,
      adminFee,
      totalBayar,
      meta.paymentMethod || 'QRIS',
      meta.handleBy || 'Fauzan',
      item.status === 'lunas' ? 'LUNAS' : 'PENDING'
    ];
  });

  // Baris total rekapitulasi
  rows.push([
    '', '', '', '', '', '', '', '', 'TOTAL REKAPITULASI:',
    totalServiceRevenue, totalAdminRevenue, totalAllRevenue, '', '', ''
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set lebar kolom agar rapi
  ws['!cols'] = [
    { wch: 4 }, { wch: 13 }, { wch: 10 }, { wch: 25 }, { wch: 7 },
    { wch: 7 }, { wch: 30 }, { wch: 32 }, { wch: 25 }, { wch: 16 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 15 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Rekap Keuangan';
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  saveXlsx(wb, `Rekap_Keuangan_BenangMerah${suffix}_${dateStr}.xlsx`);
};



// EXPORT PROGRESS REKAM MEDIS TERAPIS KE EXCEL NATIVE (.XLSX MURNI)
export const exportTherapistExcel = (myPatients, userName, monthLabel = '') => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pasien rujukan khusus untuk ${userName}.`);
    return;
  }

  const headers = [
    'No', 'Tanggal', 'Jam', 'Nama Pasien', 'Usia', 'Sesi Ke-',
    'Layanan', 'Psikolog PJ', 'Catatan Rekam Medis & Progress Terapi', 'Status'
  ];

  const rows = myPatients.map((item, index) => [
    index + 1,
    item.booking_date || '-',
    item.booking_time || '-',
    item.patient_name || '-',
    item.age ? `${item.age} Thn` : '-',
    item.visit_number || 1,
    (item.service_type || item.category || 'Terapi Anak').toUpperCase(),
    item.doctor_name || '-',
    (item.notes || '-'),
    (item.status || 'pending').toUpperCase()
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 4 }, { wch: 13 }, { wch: 10 }, { wch: 25 }, { wch: 7 },
    { wch: 7 }, { wch: 30 }, { wch: 32 }, { wch: 60 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Progress Terapis';
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  saveXlsx(wb, `Rekap_Medis_${userName.replace(/\s+/g, '_')}${suffix}_${dateStr}.xlsx`);
};

// EXPORT REKAP KONSELING & REKAM MEDIS PSIKOLOG KE EXCEL NATIVE (.XLSX MURNI)
export const exportPsychologistExcel = (myPatients, userName, monthLabel = '') => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pendaftaran/konseling untuk ${userName}.`);
    return;
  }

  const headers = [
    'No', 'Tanggal', 'Jam', 'Nama Pasien', 'Usia', 'Sesi Ke-',
    'Layanan', 'Psikolog PJ', 'Terapis Perujuk / Pendamping', 'Anamnesa / Keluhan', 'Diagnosa Klinis',
    'Rencana Tindak Lanjut', 'Status'
  ];

  const rows = myPatients.map((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const terapisPendamping = item.assigned_terapis || meta.internalReferral || 'Tidak Ada';
    return [
      index + 1,
      item.booking_date || '-',
      item.booking_time || '-',
      item.patient_name || '-',
      item.age ? `${item.age} Thn` : '-',
      item.visit_number || 1,
      (item.service_type || item.category || 'Konseling').toUpperCase(),
      item.doctor_name || '-',
      terapisPendamping,
      meta.anamnesa || '-',
      meta.diagnosis || '-',
      meta.followUpPlan || '-',
      (item.status || 'pending').toUpperCase()
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 4 }, { wch: 13 }, { wch: 10 }, { wch: 25 }, { wch: 7 },
    { wch: 7 }, { wch: 30 }, { wch: 32 }, { wch: 28 }, { wch: 40 },
    { wch: 30 }, { wch: 30 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Rekap Konseling';
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  saveXlsx(wb, `Rekap_Konseling_${userName.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_${dateStr}.xlsx`);
};

// ============================================================
// REKAP BULANAN: Filter dan export data berdasarkan bulan & tahun
// ============================================================

/**
 * Filter daftar appointments berdasarkan bulan & tahun (1-indexed)
 * @param {Array} appointmentsList - Semua data appointments
 * @param {number} year - Tahun (misal: 2026)
 * @param {number} month - Bulan 1-12 (atau 0 = semua bulan)
 * @returns {Array} appointments yang sesuai filter
 */
export const filterByMonth = (appointmentsList, year, month) => {
  if (!year) return appointmentsList;
  return (appointmentsList || []).filter((item) => {
    if (!item.booking_date) return false;
    const [itemYear, itemMonth] = item.booking_date.split('-').map(Number);
    if (itemYear !== year) return false;
    if (month && itemMonth !== month) return false;
    return true;
  });
};

/**
 * Daftar bulan dalam Bahasa Indonesia untuk dropdown filter
 */
export const MONTH_OPTIONS = [
  { value: 0, label: 'Semua Bulan' },
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

/**
 * Dapatkan daftar tahun yang tersedia dari data appointments
 */
export const getAvailableYears = (appointmentsList) => {
  const years = new Set();
  (appointmentsList || []).forEach((item) => {
    if (item.booking_date) {
      const year = parseInt(item.booking_date.split('-')[0], 10);
      if (!isNaN(year)) years.add(year);
    }
  });
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  return Array.from(years).sort((a, b) => b - a);
};



