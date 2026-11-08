import React, { useState } from 'react';
import { CalendarIcon, FilterIcon, CloseIcon, SearchIcon } from './icons';
import { formatDateWithDay, MONTH_OPTIONS } from '../lib/helpers';

export default function DateFilterPills({
  availableDates = [],
  selectedDate = '',
  onSelectDate,
  startDate = '',
  endDate = '',
  onDateRangeChange,
  selectedMonth = new Date().getMonth() + 1,
  onMonthChange,
  selectedYear = new Date().getFullYear(),
  onYearChange,
  availableYears = [],
  onResetAllDateFilters,
  totalItemsCount = 0
}) {
  const [filterMode, setFilterMode] = useState('single'); // 'single' | 'range'

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const isCustomMonth = selectedMonth !== currentMonth;
  const hasActiveFilter = Boolean(
    selectedDate ||
    startDate ||
    endDate ||
    (selectedMonth !== currentMonth && selectedMonth !== 0) ||
    selectedYear !== currentYear
  );

  const activeMonthLabel =
    selectedMonth === 0
      ? 'Semua Bulan'
      : MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || 'Bulan';

  const handleReset = () => {
    if (onResetAllDateFilters) {
      onResetAllDateFilters();
    } else {
      if (onSelectDate) onSelectDate('');
      if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
      if (onMonthChange) onMonthChange(currentMonth);
      if (onYearChange) onYearChange(currentYear);
    }
  };

  return (
    <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#EADFD5] mb-5 space-y-3.5 shadow-xs">
      
      {/* Header Toolbar Filter Tanggal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADFD5]/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#701A24]/10 text-[#701A24] flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-[#701A24]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#701A24] tracking-tight">
                Pencarian & Filter Tanggal Sesi
              </h4>
              {selectedMonth === currentMonth && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-semibold">
                  Default Bulan Berjalan
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              Menampilkan sesi {activeMonthLabel} {selectedMonth !== 0 ? selectedYear : ''} • Pilih tanggal atau rentang waktu
            </p>
          </div>
        </div>

        {/* Action Controls: Selector Bulan & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          
          {/* Selector Bulan Dinamis */}
          <div className="inline-flex items-center gap-1.5 bg-white border border-[#EADFD5] px-2.5 py-1 rounded-xl text-xs font-medium shadow-xs">
            <span className="text-[11px] text-gray-500 font-semibold">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (onMonthChange) onMonthChange(val);
                if (onSelectDate) onSelectDate('');
                if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
              }}
              className="bg-transparent text-xs font-bold text-[#701A24] outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map((m) => {
                const isCurrent = m.value === currentMonth;
                return (
                  <option key={m.value} value={m.value}>
                    {m.value === 0
                      ? 'Semua Bulan'
                      : isCurrent
                      ? `${m.label} (Bulan Berjalan)`
                      : m.label}
                  </option>
                );
              })}
            </select>

            {availableYears && availableYears.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (onYearChange) onYearChange(val);
                  if (onSelectDate) onSelectDate('');
                  if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer border-l border-stone-200 pl-1.5"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Toggle Single vs Range Mode */}
          <div className="inline-flex p-0.5 bg-white border border-[#EADFD5] rounded-xl text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('single')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'single'
                  ? 'bg-[#701A24] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#701A24]'
              }`}
            >
              Tanggal Spesifik
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('range')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'range'
                  ? 'bg-[#701A24] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#701A24]'
              }`}
            >
              Rentang Tanggal
            </button>
          </div>

          {/* Reset Button */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-[#701A24] hover:text-[#54121B] flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-[#EADFD5] shadow-xs hover:bg-red-50 transition cursor-pointer"
              title="Reset seluruh filter tanggal ke Bulan Berjalan"
            >
              <CloseIcon className="w-3 h-3 text-[#701A24]" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Picker Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {filterMode === 'single' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
              <span>Cari Tanggal Spesifik:</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onSelectDate) onSelectDate(val);
                  if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
                  if (val) {
                    const [y, m] = val.split('-').map(Number);
                    if (onYearChange && y) onYearChange(y);
                    if (onMonthChange && m) onMonthChange(m);
                  }
                }}
                className="px-3 py-1.5 bg-white border border-[#EADFD5] text-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none shadow-xs cursor-pointer"
              />
            </div>
            {selectedDate && (
              <span className="text-[11px] text-[#701A24] font-medium bg-[#701A24]/10 px-2.5 py-1 rounded-lg">
                Aktif: {formatDateWithDay(selectedDate)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-gray-700">Dari:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onSelectDate) onSelectDate('');
                  if (onDateRangeChange) onDateRangeChange({ start: val, end: endDate });
                }}
                className="px-3 py-1.5 bg-white border border-[#EADFD5] text-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none shadow-xs cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-gray-700">Sampai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onSelectDate) onSelectDate('');
                  if (onDateRangeChange) onDateRangeChange({ start: startDate, end: val });
                }}
                className="px-3 py-1.5 bg-white border border-[#EADFD5] text-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#701A24] focus:border-[#701A24] outline-none shadow-xs cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <span className="text-[11px] text-[#701A24] font-medium bg-[#701A24]/10 px-2.5 py-1 rounded-lg">
                Rentang: {startDate || 'Awal'} s/d {endDate || 'Akhir'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kotak-kotak Pintas Tanggal Sesi (Quick Filter Pills) */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Pilihan Cepat Sesi Terjadwal:
            <span className="text-[#701A24] font-bold ml-1">
              {selectedMonth === 0 ? 'Semua Bulan' : `${activeMonthLabel} ${selectedYear}`}
            </span>
          </p>
          {isCustomMonth && selectedMonth !== 0 && (
            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              Filter Bulan Khusus
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#EADFD5]">
          {/* Tombol Semua Tanggal di Bulan Terpilih */}
          <button
            type="button"
            onClick={() => {
              if (onSelectDate) onSelectDate('');
              if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shadow-xs cursor-pointer ${
              !selectedDate && !startDate && !endDate
                ? 'bg-[#701A24] text-white border-[#701A24] shadow-sm'
                : 'bg-white text-gray-700 border-[#EADFD5] hover:border-[#701A24]/40 hover:bg-[#701A24]/5'
            }`}
          >
            <FilterIcon className="w-3.5 h-3.5" />
            <span>Semua Sesi {selectedMonth !== 0 ? activeMonthLabel : ''}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              !selectedDate && !startDate && !endDate ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {totalItemsCount}
            </span>
          </button>

          {/* Kotak-kotak Tanggal Sesi Sesuai Bulan Berjalan / Bulan Terpilih */}
          {availableDates.map((item) => {
            const dateStr = item.date;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    if (onSelectDate) onSelectDate('');
                  } else {
                    if (onSelectDate) onSelectDate(dateStr);
                    if (onDateRangeChange) onDateRangeChange({ start: '', end: '' });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border shadow-xs cursor-pointer ${
                  isSelected
                    ? 'bg-[#701A24] text-white border-[#701A24] shadow-sm font-semibold'
                    : 'bg-white text-gray-700 border-[#EADFD5] hover:border-[#701A24]/40 hover:bg-[#701A24]/5'
                }`}
              >
                <CalendarIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#701A24]'}`} />
                <span>{formatDateWithDay(dateStr)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#701A24]/10 text-[#701A24]'
                }`}>
                  {item.count} Sesi
                </span>
              </button>
            );
          })}

          {availableDates.length === 0 && (
            <div className="flex items-center gap-2 py-1 px-2">
              <span className="text-xs text-gray-400 italic">
                Belum ada jadwal sesi di {activeMonthLabel} {selectedYear}.
              </span>
              {selectedMonth !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onMonthChange) onMonthChange(0);
                    if (onSelectDate) onSelectDate('');
                  }}
                  className="text-xs text-[#701A24] underline font-semibold hover:text-[#581524] cursor-pointer"
                >
                  Tampilkan Semua Bulan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
