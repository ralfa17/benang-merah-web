import React, { useState, useMemo } from 'react';
import { LIST_PSIKOLOG } from '../lib/constants';
import { MONTH_OPTIONS, getAvailableYears, filterByMonth, formatRupiah } from '../lib/helpers';
import { BarChartIcon, UserIcon, StethoscopeIcon, DownloadIcon } from './icons';

export default function PsychologistMonthlySummaryCard({
  appointmentsList = [],
  activeName = '',
  onOpenMonthlyRekap
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Available years from data
  const availableYears = useMemo(() => {
    return getAvailableYears(appointmentsList);
  }, [appointmentsList]);

  // Pasien milik psikolog aktif
  const myAllPatients = useMemo(() => {
    const nameLower = (activeName || '').toLowerCase();
    return appointmentsList.filter((item) => {
      const docLower = (item.doctor_name || '').toLowerCase();
      return (
        LIST_PSIKOLOG.some((p) =>
          p.keywords.some((k) => nameLower.includes(k) && docLower.includes(k))
        ) || docLower.includes(nameLower)
      );
    });
  }, [appointmentsList, activeName]);

  // Pasien bulan terpilih
  const monthlyPatients = useMemo(() => {
    return filterByMonth(myAllPatients, selectedYear, selectedMonth);
  }, [myAllPatients, selectedYear, selectedMonth]);

  // Kalkulasi statistik & total nominal fee
  const stats = useMemo(() => {
    let totalNominal = 0;
    let paidCount = 0;
    let pendingCount = 0;

    monthlyPatients.forEach((p) => {
      const nominal = Number(p.total_price || p.price || 0);
      totalNominal += nominal;
      if (p.status === 'lunas' || p.payment_status === 'paid') {
        paidCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      totalPatients: monthlyPatients.length,
      totalNominal,
      paidCount,
      pendingCount
    };
  }, [monthlyPatients]);

  const monthLabel =
    MONTH_OPTIONS.find((m) => m.value === Number(selectedMonth))?.label || `Bulan ${selectedMonth}`;

  return (
    <div className="bg-white rounded-3xl border border-[#EADFD5] shadow-sm p-5 sm:p-6 mb-6 animate-fade-up">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADFD5] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#701A24]/10 text-[#701A24] flex items-center justify-center shadow-xs">
            <BarChartIcon className="w-5 h-5 text-[#701A24]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-[#2C1810]">
                Ringkasan Laporan Bulanan Psikolog
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#701A24] text-white">
                {activeName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi total pendapatan/fee dan daftar pasien konseling terdaftar
            </p>
          </div>
        </div>

        {/* Filter Bulan & Tahun */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EADFD5] text-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#701A24] outline-none cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EADFD5] text-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#701A24] outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenMonthlyRekap}
            className="px-3.5 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Buka detail tabel & unduh file Excel"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Detail & Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Kartu Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EADFD5]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Periode Laporan
          </span>
          <p className="text-sm font-bold text-[#2C1810] mt-1">
            {monthLabel} {selectedYear}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EADFD5]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Pasien Terdaftar
          </span>
          <p className="text-xl font-bold text-[#2C1810] mt-1">
            {stats.totalPatients} <span className="text-xs font-normal text-slate-500">Pasien</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EADFD5]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Estimasi Fee / Nominal
          </span>
          <p className="text-xl font-bold text-[#701A24] mt-1">
            {formatRupiah(stats.totalNominal)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EADFD5]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Status Pembayaran
          </span>
          <div className="flex items-center gap-2 mt-1 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.paidCount} Lunas
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {stats.pendingCount} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Daftar Pasien Bulan Terpilih (Mini Preview Table) */}
      <div className="border border-[#EADFD5] rounded-2xl overflow-hidden bg-white">
        <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#EADFD5] flex justify-between items-center text-xs">
          <span className="font-bold text-[#2C1810]">
            Daftar Pasien Konseling ({monthLabel} {selectedYear})
          </span>
          <span className="text-slate-500 text-[11px]">
            {monthlyPatients.length} Data Ditemukan
          </span>
        </div>

        <div className="max-h-56 overflow-y-auto">
          {monthlyPatients.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Belum ada data pendaftaran pasien konseling untuk periode {monthLabel} {selectedYear}.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5]/80 text-[#701A24] font-semibold border-b border-[#EADFD5] sticky top-0">
                <tr>
                  <th className="px-3.5 py-2">No</th>
                  <th className="px-3.5 py-2">Tanggal</th>
                  <th className="px-3.5 py-2">Nama Pasien</th>
                  <th className="px-3.5 py-2">Layanan</th>
                  <th className="px-3.5 py-2">Terapis Rujukan</th>
                  <th className="px-3.5 py-2 text-right">Biaya / Fee</th>
                  <th className="px-3.5 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADFD5]/60 text-slate-700">
                {monthlyPatients.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-[#FAF8F5]/50 transition">
                    <td className="px-3.5 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3.5 py-2 whitespace-nowrap font-medium">{p.booking_date || '-'}</td>
                    <td className="px-3.5 py-2 font-bold text-[#2C1810]">{p.patient_name || '-'}</td>
                    <td className="px-3.5 py-2 text-slate-600">{p.service_type || '-'}</td>
                    <td className="px-3.5 py-2 text-slate-600">{p.assigned_terapis || '-'}</td>
                    <td className="px-3.5 py-2 text-right font-semibold text-[#701A24]">
                      {formatRupiah(p.total_price || p.price || 0)}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
    </div>
  );
}
