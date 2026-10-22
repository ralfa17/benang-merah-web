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

// EXPORT REKAP KEUANGAN KE EXCEL (.XLS DENGAN FORMAT TABEL CANTIK)
export const exportFinancialExcel = (appointmentsList) => {
  if (!appointmentsList || appointmentsList.length === 0) {
    alert('Belum ada data pendaftaran untuk diunduh.');
    return;
  }

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, sans-serif; }
        .title { font-size: 14pt; font-weight: bold; color: #701A24; }
        .subtitle { font-size: 10pt; color: #555555; margin-bottom: 15px; }
        table { border-collapse: collapse; width: 100%; font-size: 10pt; }
        th { background-color: #701A24; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #54121B; text-align: left; }
        td { padding: 6px 10px; border: 1px solid #D1D5DB; vertical-align: middle; }
        .num { text-align: right; }
        .center { text-align: center; }
        .paid { color: #065F46; font-weight: bold; background-color: #D1FAE5; }
        .pending { color: #92400E; font-weight: bold; background-color: #FEF3C7; }
        .footer-total { font-weight: bold; background-color: #F3F4F6; border-top: 2px solid #701A24; }
      </style>
    </head>
    <body>
      <div class="title">REKAP TRANSAKSI & PEMBUKUAN KEUANGAN KLINIK BENANG MERAH</div>
      <div class="subtitle">Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Data: ${appointmentsList.length} Transaksi</div>
      <table>
        <thead>
          <tr>
            <th class="center">No</th>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Nama Pasien</th>
            <th class="center">Usia</th>
            <th class="center">Sesi Ke-</th>
            <th>Layanan</th>
            <th>Psikolog PJ</th>
            <th>Terapis PJ</th>
            <th class="num">Biaya Layanan</th>
            <th class="num">Biaya Admin</th>
            <th class="num">Total Bayar</th>
            <th class="center">Metode Bayar</th>
            <th class="center">Handle By Admin</th>
            <th class="center">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  let totalAllRevenue = 0;
  let totalAdminRevenue = 0;
  let totalServiceRevenue = 0;

  appointmentsList.forEach((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    const adminFee = Number(item.admin_fee ?? 30000);
    const totalBayar = Number(item.price ?? 30000);
    const hasVoucher = meta.voucherCode === 'OPENING100K';
    const baseServicePrice = SERVICE_PRICES[item.service_type] || Math.max(0, totalBayar - adminFee + (hasVoucher ? 100000 : 0));

    totalAllRevenue += totalBayar;
    totalAdminRevenue += adminFee;
    totalServiceRevenue += baseServicePrice;

    const isPaid = item.status === 'lunas';

    tableHTML += `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${item.booking_date || '-'}</td>
        <td>${item.booking_time || '-'}</td>
        <td><strong>${item.patient_name || '-'}</strong></td>
        <td class="center">${item.age ? item.age + ' Thn' : '-'}</td>
        <td class="center">${item.visit_number || 1}</td>
        <td>${(item.service_type || item.category || 'Konseling').toUpperCase()}</td>
        <td>${item.doctor_name || '-'}</td>
        <td>${item.assigned_terapis || 'Tidak Ada'}</td>
        <td class="num">Rp ${baseServicePrice.toLocaleString('id-ID')}</td>
        <td class="num">Rp ${adminFee.toLocaleString('id-ID')}</td>
        <td class="num"><strong>Rp ${totalBayar.toLocaleString('id-ID')}</strong></td>
        <td class="center"><strong>${meta.paymentMethod}</strong></td>
        <td class="center">${meta.handleBy}</td>
        <td class="center ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'LUNAS' : 'PENDING'}</td>
      </tr>
    `;
  });

  tableHTML += `
        </tbody>
        <tfoot>
          <tr class="footer-total">
            <td colspan="9" style="text-align: right; padding-right: 12px;"><strong>TOTAL REKAPITULASI:</strong></td>
            <td class="num"><strong>Rp ${totalServiceRevenue.toLocaleString('id-ID')}</strong></td>
            <td class="num"><strong>Rp ${totalAdminRevenue.toLocaleString('id-ID')}</strong></td>
            <td class="num" style="color:#701A24;"><strong>Rp ${totalAllRevenue.toLocaleString('id-ID')}</strong></td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Keuangan_BenangMerah_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// EXPORT PROGRESS REKAM MEDIS TERAPIS KE EXCEL
export const exportTherapistExcel = (myPatients, userName) => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pasien rujukan khusus untuk ${userName}.`);
    return;
  }

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, sans-serif; }
        .title { font-size: 14pt; font-weight: bold; color: #1D4ED8; }
        table { border-collapse: collapse; width: 100%; font-size: 10pt; }
        th { background-color: #1D4ED8; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #1E40AF; text-align: left; }
        td { padding: 6px 10px; border: 1px solid #D1D5DB; vertical-align: top; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="title">REKAP PROGRESS PASIEN TERAPIS - ${userName.toUpperCase()}</div>
      <p>Klinik Benang Merah | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}</p>
      <table>
        <thead>
          <tr>
            <th class="center">No</th>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Nama Pasien</th>
            <th class="center">Usia</th>
            <th class="center">Sesi Ke-</th>
            <th>Layanan</th>
            <th>Psikolog PJ</th>
            <th>Catatan Rekam Medis & Progress Terapi</th>
            <th class="center">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  myPatients.forEach((item, index) => {
    tableHTML += `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${item.booking_date || '-'}</td>
        <td>${item.booking_time || '-'}</td>
        <td><strong>${item.patient_name || '-'}</strong></td>
        <td class="center">${item.age ? item.age + ' Thn' : '-'}</td>
        <td class="center">${item.visit_number || 1}</td>
        <td>${(item.service_type || item.category || 'Terapi Anak').toUpperCase()}</td>
        <td>${item.doctor_name || '-'}</td>
        <td>${(item.notes || '-').replace(/\n/g, '<br/>')}</td>
        <td class="center">${(item.status || 'pending').toUpperCase()}</td>
      </tr>
    `;
  });

  tableHTML += `</tbody></table></body></html>`;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Medis_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// EXPORT REKAP KONSELING & REKAM MEDIS PSIKOLOG KE EXCEL
export const exportPsychologistExcel = (myPatients, userName) => {
  if (!myPatients || myPatients.length === 0) {
    alert(`Belum ada data pendaftaran/konseling untuk ${userName}.`);
    return;
  }

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, sans-serif; }
        .title { font-size: 14pt; font-weight: bold; color: #701A24; }
        .subtitle { font-size: 10pt; color: #555555; margin-bottom: 15px; }
        table { border-collapse: collapse; width: 100%; font-size: 10pt; }
        th { background-color: #701A24; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #54121B; text-align: left; }
        td { padding: 6px 10px; border: 1px solid #D1D5DB; vertical-align: top; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="title">REKAP EVALUASI & REKAM MEDIS PSIKOLOG - ${userName.toUpperCase()}</div>
      <div class="subtitle">Klinik Benang Merah | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')} | Total: ${myPatients.length} Pasien/Sesi</div>
      <table>
        <thead>
          <tr>
            <th class="center">No</th>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Nama Pasien</th>
            <th class="center">Usia</th>
            <th class="center">Sesi Ke-</th>
            <th>Layanan</th>
            <th>Psikolog PJ</th>
            <th>Anamnesa / Keluhan</th>
            <th>Diagnosa Klinis</th>
            <th>Rencana Tindak Lanjut</th>
            <th>Rujukan Terapis</th>
            <th class="center">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  myPatients.forEach((item, index) => {
    const meta = parseAppointmentNotes(item.notes);
    tableHTML += `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${item.booking_date || '-'}</td>
        <td>${item.booking_time || '-'}</td>
        <td class="bold">${item.patient_name || '-'}</td>
        <td class="center">${item.age ? item.age + ' Thn' : '-'}</td>
        <td class="center">${item.visit_number || 1}</td>
        <td>${(item.service_type || item.category || 'Konseling').toUpperCase()}</td>
        <td>${item.doctor_name || '-'}</td>
        <td>${(meta.anamnesa || '-').replace(/\n/g, '<br/>')}</td>
        <td>${(meta.diagnosis || '-').replace(/\n/g, '<br/>')}</td>
        <td>${(meta.followUpPlan || '-').replace(/\n/g, '<br/>')}</td>
        <td>${meta.internalReferral || '-'}</td>
        <td class="center">${(item.status || 'pending').toUpperCase()}</td>
      </tr>
    `;
  });

  tableHTML += `</tbody></table></body></html>`;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Konseling_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

