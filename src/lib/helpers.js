import ExcelJS from 'exceljs';
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

  // Ekstrak Opsional Laporan Hasil Pemeriksaan Psikologis
  const reportMatch = notes.match(/\[Laporan Psikologis:\s*Ya(?:\s*-\s*Rp\s*([0-9.]+))?\]/i);
  const includePsychologicalReport = Boolean(reportMatch);
  const psychologicalReportFee = reportMatch && reportMatch[1]
    ? parseInt(reportMatch[1].replace(/\./g, ''), 10)
    : (includePsychologicalReport ? 150000 : 0);

  // Ekstrak Skema Pembayaran Blok Terapis (Bayar di Awal / Bayar di Akhir)
  const schemeMatch = notes.match(/\[Skema Blok:\s*([^\]]+)\]/i);
  const blockPaymentScheme = schemeMatch
    ? (schemeMatch[1].toLowerCase().includes('akhir') ? 'end' : 'start')
    : 'start';

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
    includePsychologicalReport,
    psychologicalReportFee,
    blockPaymentScheme,
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
  includePsychologicalReport = false,
  psychologicalReportFee = 150000,
  blockPaymentScheme = 'start',
  isDirect = false,
  directMethod = '',
  existingNotes = ''
}) => {
  let header = `[Klien: ${patientName || 'Klien'} - HP: ${patientPhone || '-'}] [Handle By: ${handleBy}] [Metode Bayar: ${paymentMethod}]`;

  if (isDirect && directMethod) {
    header += ` (Layanan Langsung Terapis: ${directMethod})`;
  }

  if (blockPaymentScheme) {
    const schemeLabel = blockPaymentScheme === 'end' ? 'Bayar di Akhir' : 'Bayar di Awal';
    header += ` [Skema Blok: ${schemeLabel}]`;
  }

  if (includePsychologicalReport) {
    const fee = Number(psychologicalReportFee) || 150000;
    header += ` [Laporan Psikologis: Ya - Rp ${fee.toLocaleString('id-ID')}]`;
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
// HELPER INTERNAL: Simpan workbook ExcelJS (.xlsx BINARY)
// ============================================================
const saveExcelJsWorkbook = async (workbook, filename) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

// HELPER: Styling kondisional pada cell status pembayaran (background fill)
const applyPaymentStatusStyle = (cell, rawStatus) => {
  const statusStr = String(rawStatus || '').toUpperCase().trim();
  const isPaid = statusStr === 'LUNAS' || statusStr === 'PAID';
  const isPending = statusStr === 'PENDING' || statusStr === 'BELUM LUNAS' || statusStr === 'UNPAID';

  if (isPaid) {
    // Background HIJAU (#C6EFCE) dengan teks gelap (#006100)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC6EFCE' }
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FF006100' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  } else if (isPending) {
    // Background MERAH (#FFC7CE) dengan teks gelap (#9C0006)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC7CE' }
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FF9C0006' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  } else {
    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
};

// HELPER: Format border dan font standar tabel
const applyStandardCellBorder = (cell) => {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE0D6CE' } },
    left: { style: 'thin', color: { argb: 'FFE0D6CE' } },
    bottom: { style: 'thin', color: { argb: 'FFE0D6CE' } },
    right: { style: 'thin', color: { argb: 'FFE0D6CE' } }
  };
};

const formatHeaderRow = (row) => {
  row.height = 28;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F4F0' } // Cream Warm Benang Merah
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FF701A24' } // Maroon Benang Merah
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    applyStandardCellBorder(cell);
  });
};

// HELPER: Tambahkan Blok Ringkasan Rekapitulasi Pembayaran (Breakdown 3 Bagian)
// 1. TOTAL KESELURUHAN NOMINAL (Lunas + Pending)
// 2. TOTAL DANA LUNAS (Status: Lunas)
// 3. TOTAL DANA PENDING (Status: Belum Lunas)
const addPaymentSummaryBlock = (worksheet, { totalAll = 0, totalLunas = 0, totalPending = 0, countAll = 0, countLunas = 0, countPending = 0, startCol = 1 }) => {
  // Baris kosong pemisah
  worksheet.addRow([]);

  // Baris Judul Blok Ringkasan
  const sectionTitleRow = worksheet.addRow(['RINGKASAN REKAPITULASI PEMBAYARAN PASIEN']);
  sectionTitleRow.height = 24;
  const tCell = sectionTitleRow.getCell(startCol);
  tCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF701A24' } };

  // 1. TOTAL KESELURUHAN NOMINAL
  const rowAll = worksheet.addRow([
    'TOTAL KESELURUHAN NOMINAL (LUNAS + PENDING)',
    totalAll,
    `${countAll || 0} Pasien / Transaksi`
  ]);
  rowAll.height = 22;
  rowAll.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EBE6' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF2C1810' } };
    if (colNumber === 2) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // 2. TOTAL DANA LUNAS
  const rowLunas = worksheet.addRow([
    'TOTAL DANA LUNAS (STATUS: SUDAH LUNAS)',
    totalLunas,
    `${countLunas || 0} Transaksi Lunas`
  ]);
  rowLunas.height = 22;
  rowLunas.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF006100' } };
    if (colNumber === 2) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // 3. TOTAL DANA PENDING
  const rowPending = worksheet.addRow([
    'TOTAL DANA PENDING (STATUS: MASIH PENDING)',
    totalPending,
    `${countPending || 0} Transaksi Pending`
  ]);
  rowPending.height = 22;
  rowPending.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9C0006' } };
    if (colNumber === 2) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });
};

// EXPORT REKAP KEUANGAN KE EXCEL NATIVE (.XLSX MURNI DENGAN STYLING STATUS & BREAKDOWN NOMINAL)
export const exportFinancialExcel = async (appointmentsList, monthLabel = '') => {
  if (!appointmentsList || appointmentsList.length === 0) {
    alert('Belum ada data pendaftaran untuk diunduh.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Klinik Benang Merah';
  workbook.created = new Date();

  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Rekap Keuangan';
  const worksheet = workbook.addWorksheet(sheetTitle.slice(0, 31));

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal Sesi', key: 'booking_date', width: 14 },
    { header: 'Jam Sesi', key: 'booking_time', width: 12 },
    { header: 'Nama Pasien', key: 'patient_name', width: 28 },
    { header: 'Usia', key: 'age', width: 10 },
    { header: 'Sesi Ke-', key: 'visit_number', width: 10 },
    { header: 'Layanan', key: 'service_type', width: 28 },
    { header: 'Psikolog PJ', key: 'doctor_name', width: 30 },
    { header: 'Terapis PJ', key: 'assigned_terapis', width: 25 },
    { header: 'Biaya Layanan (Rp)', key: 'service_price', width: 18 },
    { header: 'Biaya Admin (Rp)', key: 'admin_fee', width: 16 },
    { header: 'Total Bayar (Rp)', key: 'total_price', width: 18 },
    { header: 'Metode Pembayaran', key: 'payment_method', width: 20 },
    { header: 'Handle By Admin', key: 'handle_by', width: 16 },
    { header: 'Status Pembayaran', key: 'status', width: 18 }
  ];

  formatHeaderRow(worksheet.getRow(1));

  let totalAllRevenue = 0;
  let totalAdminRevenue = 0;
  let totalServiceRevenue = 0;
  let totalDanaLunas = 0;
  let totalDanaPending = 0;
  let countLunas = 0;
  let countPending = 0;

  appointmentsList.forEach((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const adminFee = Number(item.admin_fee ?? 30000);
    const totalBayar = Number(item.price ?? 30000);
    const hasVoucher = meta.voucherCode === 'OPENING100K';
    const baseServicePrice = SERVICE_PRICES[item.service_type] || Math.max(0, totalBayar - adminFee + (hasVoucher ? 100000 : 0));

    totalAllRevenue += totalBayar;
    totalAdminRevenue += adminFee;
    totalServiceRevenue += baseServicePrice;

    const isLunas = (item.status || '').toLowerCase() === 'lunas';
    if (isLunas) {
      totalDanaLunas += totalBayar;
      countLunas++;
    } else {
      totalDanaPending += totalBayar;
      countPending++;
    }

    const statusText = isLunas ? 'LUNAS' : 'PENDING';

    const row = worksheet.addRow({
      no: index + 1,
      booking_date: item.booking_date || '-',
      booking_time: item.booking_time || '-',
      patient_name: item.patient_name || '-',
      age: item.age ? `${item.age} Thn` : '-',
      visit_number: item.visit_number || 1,
      service_type: item.service_type || item.category || 'Konseling',
      doctor_name: item.doctor_name || '-',
      assigned_terapis: item.assigned_terapis || 'Tidak Ada',
      service_price: baseServicePrice,
      admin_fee: adminFee,
      total_price: totalBayar,
      payment_method: meta.paymentMethod || 'QRIS',
      handle_by: meta.handleBy || 'Fauzan',
      status: statusText
    });

    row.height = 22;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Angka nomor & sesi di-center
      if (colNumber === 1 || colNumber === 5 || colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      // Nominal Currency Rupiah rata kanan
      if (colNumber === 10 || colNumber === 11 || colNumber === 12) {
        cell.numFmt = '"Rp" #,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      // Status Pembayaran dengan conditional background fill (MERAH / HIJAU)
      if (colNumber === 15) {
        applyPaymentStatusStyle(cell, statusText);
      }
    });
  });

  // Baris Total Rekapitulasi Tabel Pasien
  const totalRow = worksheet.addRow({
    no: '',
    booking_date: '',
    booking_time: '',
    patient_name: '',
    age: '',
    visit_number: '',
    service_type: '',
    doctor_name: '',
    assigned_terapis: 'TOTAL REKAPITULASI:',
    service_price: totalServiceRevenue,
    admin_fee: totalAdminRevenue,
    total_price: totalAllRevenue,
    payment_method: '',
    handle_by: '',
    status: ''
  });

  totalRow.height = 24;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EBE6' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A24' } };
    if (colNumber === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    if (colNumber === 10 || colNumber === 11 || colNumber === 12) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // Blok Ringkasan Rekapitulasi Pembayaran (Breakdown 3 Bagian: Total Keseluruhan, Dana Lunas, Dana Pending)
  addPaymentSummaryBlock(worksheet, {
    totalAll: totalAllRevenue,
    totalLunas: totalDanaLunas,
    totalPending: totalDanaPending,
    countAll: appointmentsList.length,
    countLunas,
    countPending
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  await saveExcelJsWorkbook(workbook, `Rekap_Keuangan_BenangMerah${suffix}_${dateStr}.xlsx`);
};

// EXPORT PROGRESS REKAM MEDIS TERAPIS KE EXCEL NATIVE (.XLSX DENGAN STYLING STATUS & BREAKDOWN NOMINAL)
export const exportTherapistExcel = async (myPatients, userName, monthLabel = '') => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pasien rujukan khusus untuk ${userName}.`);
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Klinik Benang Merah';
  workbook.created = new Date();

  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Progress Terapis';
  const worksheet = workbook.addWorksheet(sheetTitle.slice(0, 31));

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal', key: 'booking_date', width: 14 },
    { header: 'Jam', key: 'booking_time', width: 12 },
    { header: 'Nama Pasien', key: 'patient_name', width: 28 },
    { header: 'Usia', key: 'age', width: 10 },
    { header: 'Sesi Ke-', key: 'visit_number', width: 10 },
    { header: 'Layanan', key: 'service_type', width: 28 },
    { header: 'Psikolog PJ', key: 'doctor_name', width: 30 },
    { header: 'Catatan Rekam Medis & Progress Terapi', key: 'notes', width: 50 },
    { header: 'Biaya Layanan (Rp)', key: 'price', width: 18 },
    { header: 'Status Pembayaran', key: 'status', width: 18 }
  ];

  formatHeaderRow(worksheet.getRow(1));

  let totalAllRevenue = 0;
  let totalDanaLunas = 0;
  let totalDanaPending = 0;
  let countLunas = 0;
  let countPending = 0;

  myPatients.forEach((item, index) => {
    const isLunas = (item.status || '').toLowerCase() === 'lunas';
    const statusText = isLunas ? 'LUNAS' : 'PENDING';
    const totalBayar = Number(item.price ?? SERVICE_PRICES[item.service_type] ?? 30000);

    totalAllRevenue += totalBayar;
    if (isLunas) {
      totalDanaLunas += totalBayar;
      countLunas++;
    } else {
      totalDanaPending += totalBayar;
      countPending++;
    }

    const row = worksheet.addRow({
      no: index + 1,
      booking_date: item.booking_date || '-',
      booking_time: item.booking_time || '-',
      patient_name: item.patient_name || '-',
      age: item.age ? `${item.age} Thn` : '-',
      visit_number: item.visit_number || 1,
      service_type: (item.service_type || item.category || 'Terapi Anak').toUpperCase(),
      doctor_name: item.doctor_name || '-',
      notes: item.notes || '-',
      price: totalBayar,
      status: statusText
    });

    row.height = 24;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      if (colNumber === 1 || colNumber === 5 || colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
      if (colNumber === 10) {
        cell.numFmt = '"Rp" #,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      // Status Pembayaran dengan conditional background fill (MERAH / HIJAU)
      if (colNumber === 11) {
        applyPaymentStatusStyle(cell, statusText);
      }
    });
  });

  // Baris Total Rekapitulasi Tabel Terapis
  const totalRow = worksheet.addRow({
    no: '',
    booking_date: '',
    booking_time: '',
    patient_name: '',
    age: '',
    visit_number: '',
    service_type: '',
    doctor_name: '',
    notes: 'TOTAL REKAPITULASI TERAPI:',
    price: totalAllRevenue,
    status: ''
  });

  totalRow.height = 24;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EBE6' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A24' } };
    if (colNumber === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    if (colNumber === 10) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // Blok Ringkasan Rekapitulasi Pembayaran (Breakdown 3 Bagian: Total Keseluruhan, Dana Lunas, Dana Pending)
  addPaymentSummaryBlock(worksheet, {
    totalAll: totalAllRevenue,
    totalLunas: totalDanaLunas,
    totalPending: totalDanaPending,
    countAll: myPatients.length,
    countLunas,
    countPending
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  await saveExcelJsWorkbook(workbook, `Rekap_Medis_${userName.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_${dateStr}.xlsx`);
};

// EXPORT REKAP KONSELING & REKAM MEDIS PSIKOLOG KE EXCEL NATIVE (.XLSX DENGAN STYLING STATUS & BREAKDOWN NOMINAL)
export const exportPsychologistExcel = async (myPatients, userName, monthLabel = '') => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pendaftaran/konseling untuk ${userName}.`);
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Klinik Benang Merah';
  workbook.created = new Date();

  const sheetTitle = monthLabel ? `Rekap ${monthLabel}` : 'Rekap Konseling';
  const worksheet = workbook.addWorksheet(sheetTitle.slice(0, 31));

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal', key: 'booking_date', width: 14 },
    { header: 'Jam', key: 'booking_time', width: 12 },
    { header: 'Nama Pasien', key: 'patient_name', width: 28 },
    { header: 'Usia', key: 'age', width: 10 },
    { header: 'Sesi Ke-', key: 'visit_number', width: 10 },
    { header: 'Layanan', key: 'service_type', width: 28 },
    { header: 'Psikolog PJ', key: 'doctor_name', width: 30 },
    { header: 'Terapis Perujuk / Pendamping', key: 'terapis_pj', width: 28 },
    { header: 'Anamnesa / Keluhan', key: 'anamnesa', width: 35 },
    { header: 'Diagnosa Klinis', key: 'diagnosis', width: 30 },
    { header: 'Rencana Tindak Lanjut', key: 'follow_up', width: 30 },
    { header: 'Biaya Layanan (Rp)', key: 'price', width: 18 },
    { header: 'Status Pembayaran', key: 'status', width: 18 }
  ];

  formatHeaderRow(worksheet.getRow(1));

  let totalAllRevenue = 0;
  let totalDanaLunas = 0;
  let totalDanaPending = 0;
  let countLunas = 0;
  let countPending = 0;

  myPatients.forEach((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const terapisPendamping = item.assigned_terapis || meta.internalReferral || 'Tidak Ada';
    const isLunas = (item.status || '').toLowerCase() === 'lunas';
    const statusText = isLunas ? 'LUNAS' : 'PENDING';
    const totalBayar = Number(item.price ?? SERVICE_PRICES[item.service_type] ?? 30000);

    totalAllRevenue += totalBayar;
    if (isLunas) {
      totalDanaLunas += totalBayar;
      countLunas++;
    } else {
      totalDanaPending += totalBayar;
      countPending++;
    }

    const row = worksheet.addRow({
      no: index + 1,
      booking_date: item.booking_date || '-',
      booking_time: item.booking_time || '-',
      patient_name: item.patient_name || '-',
      age: item.age ? `${item.age} Thn` : '-',
      visit_number: item.visit_number || 1,
      service_type: (item.service_type || item.category || 'Konseling').toUpperCase(),
      doctor_name: item.doctor_name || '-',
      terapis_pj: terapisPendamping,
      anamnesa: meta.anamnesa || '-',
      diagnosis: meta.diagnosis || '-',
      follow_up: meta.followUpPlan || '-',
      price: totalBayar,
      status: statusText
    });

    row.height = 24;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      if (colNumber === 1 || colNumber === 5 || colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 10 || colNumber === 11 || colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
      if (colNumber === 13) {
        cell.numFmt = '"Rp" #,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      // Status Pembayaran dengan conditional background fill (MERAH / HIJAU)
      if (colNumber === 14) {
        applyPaymentStatusStyle(cell, statusText);
      }
    });
  });

  // Baris Total Rekapitulasi Tabel Konseling Psikolog
  const totalRow = worksheet.addRow({
    no: '',
    booking_date: '',
    booking_time: '',
    patient_name: '',
    age: '',
    visit_number: '',
    service_type: '',
    doctor_name: '',
    terapis_pj: '',
    anamnesa: '',
    diagnosis: '',
    follow_up: 'TOTAL REKAPITULASI KONSELING:',
    price: totalAllRevenue,
    status: ''
  });

  totalRow.height = 24;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EBE6' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A24' } };
    if (colNumber === 12) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    if (colNumber === 13) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // Blok Ringkasan Rekapitulasi Pembayaran (Breakdown 3 Bagian: Total Keseluruhan, Dana Lunas, Dana Pending)
  addPaymentSummaryBlock(worksheet, {
    totalAll: totalAllRevenue,
    totalLunas: totalDanaLunas,
    totalPending: totalDanaPending,
    countAll: myPatients.length,
    countLunas,
    countPending
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const suffix = monthLabel ? `_${monthLabel.replace(/\s+/g, '_')}` : '';
  await saveExcelJsWorkbook(workbook, `Rekap_Konseling_${userName.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_${dateStr}.xlsx`);
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

// ============================================================
// EXPORT LAPORAN SHIFT ADMIN KE EXCEL NATIVE (.XLSX MURNI)
// KHUSUS DIAKSES OLEH ROLE MASTER (RIDHO)
// ============================================================

/**
 * Export Laporan Shift Individual ke Excel Native (.xlsx)
 * Berisi metadata jam kerja admin, daftar pasien shift, rincian pembayaran & status bayar
 */
export const exportAdminShiftExcel = async (reportData, appointmentsList = []) => {
  if (!reportData) {
    alert('Data laporan shift tidak valid.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Klinik Benang Merah';
  workbook.created = new Date();

  const sheetTitle = `Shift ${reportData.shift_date || ''}`.slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetTitle);

  // Setup Kolom
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nama Pasien', key: 'patient_name', width: 28 },
    { header: 'Layanan / Kategori', key: 'service_type', width: 26 },
    { header: 'Nakes PJ', key: 'doctor_name', width: 28 },
    { header: 'Total Bayar (Rp)', key: 'price', width: 18 },
    { header: 'Metode Pembayaran', key: 'payment_method', width: 20 },
    { header: 'Status Pembayaran', key: 'status', width: 18 }
  ];

  // Header Metadata Section (Baris 1-9)
  worksheet.spliceRows(1, 0,
    ['LAPORAN SHIFT & PRESENSI OPERASIONAL ADMIN'],
    ['KLINIK PSIKOLOGI & LAYANAN TERPADU BENANG MERAH'],
    [''],
    ['Nama Petugas Admin:', reportData.admin_name || '-'],
    ['Peran / Posisi:', (reportData.admin_role || 'admin').toUpperCase()],
    ['Tanggal Shift:', formatDate(reportData.shift_date)],
    ['Jenis / Label Shift:', reportData.shift_label || '-'],
    ['Jam Kerja:', `Check-in: ${reportData.check_in_time || '-'} WIB | Check-out: ${reportData.check_out_time || '-'} WIB`],
    ['Ringkasan Operasional:', reportData.operational_summary || '-'],
    ['']
  );

  // Styling Header Judul
  worksheet.mergeCells('A1:G1');
  worksheet.mergeCells('A2:G2');
  const titleCell1 = worksheet.getCell('A1');
  titleCell1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF701A24' } };
  titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };

  const titleCell2 = worksheet.getCell('A2');
  titleCell2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF54121B' } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

  // Styling baris metadata (Baris 4-9)
  for (let r = 4; r <= 9; r++) {
    const lbl = worksheet.getCell(`A${r}`);
    lbl.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF2C1810' } };
    const val = worksheet.getCell(`B${r}`);
    val.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
    if (r === 9) {
      worksheet.mergeCells(`B${r}:G${r}`);
      val.alignment = { wrapText: true, vertical: 'top' };
    }
  }

  // Row 11 adalah Header Tabel Pasien
  const tableHeaderRow = worksheet.getRow(11);
  tableHeaderRow.values = ['No', 'Nama Pasien', 'Layanan / Kategori', 'Nakes PJ', 'Total Bayar (Rp)', 'Metode Pembayaran', 'Status Pembayaran'];
  formatHeaderRow(tableHeaderRow);

  // Map data pasien yang ditangani
  const patientsHandled = Array.isArray(reportData.patients_handled) ? reportData.patients_handled : [];
  
  let totalRevenueShift = 0;
  let totalDanaLunasShift = 0;
  let totalDanaPendingShift = 0;
  let countLunasShift = 0;
  let countPendingShift = 0;

  patientsHandled.forEach((patientName, idx) => {
    const norm = normalizePatientName(patientName);
    const matched = (appointmentsList || []).find((item) => {
      const matchName = normalizePatientName(item.patient_name) === norm;
      const matchDate = !reportData.shift_date || item.booking_date === reportData.shift_date;
      return matchName && matchDate;
    }) || (appointmentsList || []).find((item) => normalizePatientName(item.patient_name) === norm);

    const price = matched ? Number(matched.price ?? 30000) : 0;
    totalRevenueShift += price;

    const isLunas = matched ? (matched.status || '').toLowerCase() === 'lunas' : false;
    if (isLunas) {
      totalDanaLunasShift += price;
      countLunasShift++;
    } else {
      totalDanaPendingShift += price;
      countPendingShift++;
    }

    const meta = matched ? parseAppointmentNotes(matched.notes) : {};
    const paymentMethod = meta.paymentMethod || '-';
    const statusText = matched ? (isLunas ? 'LUNAS' : 'PENDING') : '-';
    const nakesPj = matched ? (matched.doctor_name || matched.assigned_terapis || '-') : '-';
    const serviceType = matched ? (matched.service_type || matched.category || '-') : '-';

    const row = worksheet.addRow({
      no: idx + 1,
      patient_name: patientName,
      service_type: serviceType,
      doctor_name: nakesPj,
      price: price,
      payment_method: paymentMethod,
      status: statusText
    });

    row.height = 22;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 5) {
        cell.numFmt = '"Rp" #,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNumber === 7) {
        applyPaymentStatusStyle(cell, statusText);
      }
    });
  });

  // Baris Total Pasien & Revenue
  const totalRow = worksheet.addRow({
    no: '',
    patient_name: `TOTAL: ${patientsHandled.length} Pasien`,
    service_type: '',
    doctor_name: '',
    price: totalRevenueShift,
    payment_method: '',
    status: ''
  });
  totalRow.height = 24;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyStandardCellBorder(cell);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EBE6' }
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A24' } };
    if (colNumber === 5) {
      cell.numFmt = '"Rp" #,##0';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });

  // Blok Ringkasan Rekapitulasi Pembayaran Shift
  addPaymentSummaryBlock(worksheet, {
    totalAll: totalRevenueShift,
    totalLunas: totalDanaLunasShift,
    totalPending: totalDanaPendingShift,
    countAll: patientsHandled.length,
    countLunas: countLunasShift,
    countPending: countPendingShift
  });

  // Bagian Ringkasan Transaksi per Metode Pembayaran
  worksheet.addRow([]);
  const sectionTitleRow = worksheet.addRow(['RINGKASAN METODE TRANSAKSI SHIFT']);
  sectionTitleRow.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF701A24' } };

  const paySummary = reportData.payment_summary || {};
  const paySummaryHeaderRow = worksheet.addRow(['No', 'Metode Pembayaran', 'Jumlah Transaksi']);
  formatHeaderRow(paySummaryHeaderRow);

  let payIndex = 1;
  let totalTrans = 0;
  Object.entries(paySummary).forEach(([method, count]) => {
    const c = Number(count) || 0;
    totalTrans += c;
    const pRow = worksheet.addRow([payIndex++, method, `${c} transaksi`]);
    pRow.height = 20;
    pRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
    });
  });

  // Baris Total Transaksi
  const totalTransRow = worksheet.addRow(['', 'Total Keseluruhan Transaksi:', `${totalTrans} transaksi`]);
  totalTransRow.height = 22;
  totalTransRow.eachCell({ includeEmpty: true }, (cell) => {
    applyStandardCellBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EBE6' } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A24' } };
  });

  const cleanAdmin = (reportData.admin_name || 'Admin').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = reportData.shift_date || new Date().toISOString().slice(0, 10);
  await saveExcelJsWorkbook(workbook, `Laporan_Shift_${cleanAdmin}_${dateStr}.xlsx`);
};

/**
 * Export Seluruh Riwayat Laporan Shift ke Excel Native (.xlsx)
 * Menampilkan daftar seluruh laporan shift admin yang tersimpan
 */
export const exportAllAdminShiftsExcel = async (reportsList) => {
  if (!reportsList || reportsList.length === 0) {
    alert('Belum ada data laporan shift untuk diunduh.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Klinik Benang Merah';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rekap Laporan Shift');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal Shift', key: 'shift_date', width: 14 },
    { header: 'Nama Admin', key: 'admin_name', width: 24 },
    { header: 'Role', key: 'admin_role', width: 14 },
    { header: 'Label Shift', key: 'shift_label', width: 28 },
    { header: 'Jam Check-In', key: 'check_in', width: 14 },
    { header: 'Jam Check-Out', key: 'check_out', width: 14 },
    { header: 'Total Pasien', key: 'total_patients', width: 14 },
    { header: 'Total Transaksi', key: 'total_trans', width: 14 },
    { header: 'Pasien Ditangani', key: 'patients', width: 40 },
    { header: 'Rincian Pembayaran', key: 'payments', width: 30 },
    { header: 'Ringkasan Operasional / Catatan', key: 'summary', width: 45 }
  ];

  formatHeaderRow(worksheet.getRow(1));

  reportsList.forEach((r, idx) => {
    const patientsStr = Array.isArray(r.patients_handled) ? r.patients_handled.join(', ') : '-';
    let payStr = '';
    if (r.payment_summary && typeof r.payment_summary === 'object') {
      payStr = Object.entries(r.payment_summary)
        .filter(([, count]) => count > 0)
        .map(([m, c]) => `${m}: ${c}x`)
        .join(' | ');
    }

    const row = worksheet.addRow({
      no: idx + 1,
      shift_date: r.shift_date || '-',
      admin_name: r.admin_name || '-',
      admin_role: r.admin_role || 'admin',
      shift_label: r.shift_label || '-',
      check_in: r.check_in_time ? `${r.check_in_time} WIB` : '-',
      check_out: r.check_out_time ? `${r.check_out_time} WIB` : '-',
      total_patients: r.total_patients || (r.patients_handled ? r.patients_handled.length : 0),
      total_trans: r.total_transactions || 0,
      patients: patientsStr,
      payments: payStr || '-',
      summary: r.operational_summary || '-'
    });

    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      applyStandardCellBorder(cell);
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      if (colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 7 || colNumber === 8 || colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 10 || colNumber === 11 || colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  await saveExcelJsWorkbook(workbook, `Rekapitulasi_Laporan_Shift_Admin_${dateStr}.xlsx`);
};



