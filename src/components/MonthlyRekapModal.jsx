import React, { useState, useMemo } from 'react';
import {
  exportFinancialExcel,
  exportTherapistExcel,
  exportPsychologistExcel,
  filterByMonth,
  MONTH_OPTIONS,
  getAvailableYears,
  formatRupiah
} from '../lib/helpers';
import { LIST_PSIKOLOG } from '../lib/constants';
import {
  BarChartIcon,
  DownloadIcon,
  CloseIcon,
  TableIcon
} from './icons';

export default function MonthlyRekapModal({
  appointmentsList = [],
  userRole = '',
  userName = '',
  hasMasterAccess = false,
  hasAdminAccess = false,
  hasPsychologistAccess = false,
  hasTherapistAccess = false,
  activeName = '',
  matchesTherapistAssignment,
  onClose
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Toggle download permission for nakes (Psikolog/Terapis)
  // Master / Admin always have download permission
  const [allowDownloadNakes, setAllowDownloadNakes] = useState(true);

  // Available years from data
  const availableYears = useMemo(() => {
    return getAvailableYears(appointmentsList);
  }, [appointmentsList]);

  // Filter scoped data based on role (Strict POV)
  const scopedPatients = useMemo(() => {
    let list = [];

    if (hasMasterAccess) {
      list = appointmentsList;
    } else if (hasPsychologistAccess) {
      const nameLower = (activeName || userName).toLowerCase();
      list = appointmentsList.filter(item => {
        const docLower = (item.doctor_name || '').toLowerCase();
        return LIST_PSIKOLOG.some(p =>
          p.keywords.some(k => nameLower.includes(k) && docLower.includes(k))
        ) || docLower.includes(nameLower);
      });
    } else if (hasTherapistAccess) {
      const tName = activeName || userName;
      list = appointmentsList.filter(item =>
        matchesTherapistAssignment
          ? matchesTherapistAssignment(item.assigned_terapis, tName)
          : (item.assigned_terapis || '').toLowerCase().includes(tName.toLowerCase())
      );
    }

    return list;
  }, [appointmentsList, hasMasterAccess, hasPsychologistAccess, hasTherapistAccess, activeName, userName, matchesTherapistAssignment]);

  // Filter based on selected month & year
  const monthlyData = useMemo(() => {
    return filterByMonth(scopedPatients, selectedYear, selectedMonth);
  }, [scopedPatients, selectedYear, selectedMonth]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPatients = monthlyData.length;
    let totalRevenue = 0;
    let paymentBreakdown = {
      qris: 0,
      bca: 0,
      cash: 0,
      other: 0
    };

    monthlyData.forEach(p => {
      const nominal = Number(p.total_price || p.price || 0);
      totalRevenue += nominal;

      const method = (p.payment_method || '').toLowerCase();
      if (method.includes('qris')) paymentBreakdown.qris += 1;
      else if (method.includes('transfer') || method.includes('bca')) paymentBreakdown.bca += 1;
      else if (method.includes('cash') || method.includes('tunai')) paymentBreakdown.cash += 1;
      else if (p.payment_status === 'paid' || p.payment_method) paymentBreakdown.other += 1;
    });

    return { totalPatients, totalRevenue, paymentBreakdown };
  }, [monthlyData]);

  // Month label
  const monthName = MONTH_OPTIONS.find(m => m.value === Number(selectedMonth))?.label || `Bulan ${selectedMonth}`;
  const periodLabel = `${monthName} ${selectedYear}`;

  // Download capability check (Master always can, Psychologist depends on allowDownloadNakes)
  const canDownload = hasMasterAccess || allowDownloadNakes;

  // Handle Export
  const handleExport = () => {
    if (!canDownload) {
      alert('Izin unduh belum diaktifkan oleh Administrator / Master.');
      return;
    }

    if (monthlyData.length === 0) {
      alert(`Tidak ada data pasien untuk periode ${periodLabel}`);
      return;
    }

    if (hasMasterAccess) {
      exportFinancialExcel(monthlyData, periodLabel);
    } else if (hasPsychologistAccess) {
      exportPsychologistExcel(monthlyData, activeName || userName, periodLabel);
    } else if (hasTherapistAccess) {
      exportTherapistExcel(monthlyData, activeName || userName, periodLabel);
    } else {
      exportFinancialExcel(monthlyData, periodLabel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 shadow-xl rounded-2xl text-slate-800 max-w-4xl w-full p-6 md:p-8 space-y-6 my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-stone-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-xl flex items-center justify-center shadow-xs">
              <BarChartIcon className="w-5 h-5 text-[#701A24]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#2C1810] tracking-tight">
                Rekap Pasien Bulanan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ekspor Native OpenXML Spreadsheet (.xlsx) • {hasMasterAccess ? 'Akses Penuh Master' : (activeName || userName)}
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
        <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Bulan Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Periode Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none cursor-pointer"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-stone-300 text-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action / Permission Controls */}
          <div className="flex items-center gap-3">
            {/* Toggle Permission for Master */}
            {hasMasterAccess && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white px-3 py-1.5 border rounded-lg border-stone-300 cursor-pointer hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={allowDownloadNakes}
                  onChange={(e) => setAllowDownloadNakes(e.target.checked)}
                  className="rounded text-[#701A24] focus:ring-[#701A24] accent-[#701A24]"
                />
                <span className="text-xs">Izinkan Unduh Nakes</span>
              </label>
            )}

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!canDownload || monthlyData.length === 0}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                canDownload && monthlyData.length > 0
                  ? 'bg-[#701A24] hover:bg-[#581524] text-white cursor-pointer active:scale-95'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Unduh File .xlsx</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Total Pasien</span>
            <div className="text-xl font-bold text-[#2C1810] mt-1">
              {stats.totalPatients} <span className="text-xs font-normal text-slate-500">Pasien</span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Total Pendapatan / Fee</span>
            <div className="text-xl font-bold text-[#701A24] mt-1">
              {formatRupiah(stats.totalRevenue)}
            </div>
            <span className="text-[10px] text-slate-500">
              Periode {periodLabel}
            </span>
          </div>

          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Metode Non-Tunai</span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {stats.paymentBreakdown.qris} QRIS / {stats.paymentBreakdown.bca} BCA
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Tunai & Lainnya</span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {stats.paymentBreakdown.cash} Tunai / {stats.paymentBreakdown.other} Lain
            </div>
          </div>
        </div>

        {/* Patient Table Preview */}
        <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="px-4 py-3 bg-[#FAF8F5] border-b border-stone-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#701A24]" />
              <h3 className="text-xs font-bold text-[#2C1810] tracking-wider uppercase">
                Pratinjau Data ({periodLabel}) — {monthlyData.length} Pasien
              </h3>
            </div>
            <span className="bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-full px-2.5 py-0.5 text-xs font-medium">
              {canDownload ? 'Akses Unduh Aktif' : 'Pratinjau Terbatas'}
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            {monthlyData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada riwayat kunjungan pasien untuk periode {periodLabel}.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8F4F0] text-[#6B1D2F] font-semibold text-xs tracking-wider uppercase sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3.5">No</th>
                    <th className="px-4 py-3.5">Tgl Janji</th>
                    <th className="px-4 py-3.5">Nama Pasien</th>
                    <th className="px-4 py-3.5">Layanan</th>
                    <th className="px-4 py-3.5">Dokter / Nakes</th>
                    <th className="px-4 py-3.5">Terapis</th>
                    <th className="px-4 py-3.5">Nominal / Fee</th>
                    <th className="px-4 py-3.5">Metode Bayar</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {monthlyData.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-[#FAF6F2] transition-colors border-b border-stone-100 text-sm text-slate-700">
                      <td className="px-4 py-3.5 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700 text-xs">{p.date || p.booking_date || '-'}</td>
                      <td className="px-4 py-3.5 font-bold text-[#2C1810]">{p.name || p.patient_name || '-'}</td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{p.service_type || '-'}</td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{p.doctor_name || '-'}</td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">{p.assigned_terapis || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#701A24] text-xs">
                        {formatRupiah(p.total_price || p.price || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className="bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE] rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                          {p.payment_method || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'lunas' || p.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {p.status === 'lunas' || p.payment_status === 'paid' ? 'LUNAS' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-stone-200">
          <div className="text-[11px] text-slate-400">
            Format binary spreadsheet (.xlsx) murni via SheetJS engine.
          </div>
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
