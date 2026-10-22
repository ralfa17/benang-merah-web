import React from 'react';
import { CalendarIcon, FilterIcon, CloseIcon } from './icons';
import { formatDateWithDay } from '../lib/helpers';

export default function DateFilterPills({
  availableDates = [],
  selectedDate,
  onSelectDate,
  totalItemsCount = 0
}) {
  return (
    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EADFD5] mb-5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#701A24]">
          <CalendarIcon className="w-4 h-4 text-[#701A24]" />
          <span>Sortir By Tanggal Sesi</span>
        </div>
        {selectedDate && (
          <button
            onClick={() => onSelectDate('')}
            className="text-[11px] font-semibold text-[#701A24] hover:text-[#54121B] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#EADFD5] shadow-xs transition"
          >
            <CloseIcon className="w-3 h-3" />
            Reset Filter Tanggal
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#EADFD5]">
        {/* Tombol Semua Tanggal */}
        <button
          onClick={() => onSelectDate('')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border shadow-xs ${
            !selectedDate
              ? 'bg-[#701A24] text-white border-[#701A24] shadow-sm'
              : 'bg-white text-gray-700 border-[#EADFD5] hover:border-[#701A24]/40 hover:bg-[#701A24]/5'
          }`}
        >
          <FilterIcon className="w-3.5 h-3.5" />
          <span>Semua Tanggal</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            !selectedDate ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {totalItemsCount}
          </span>
        </button>

        {/* Kotak-kotak Tanggal Sesi */}
        {availableDates.map((item) => {
          const dateStr = item.date;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? '' : dateStr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border shadow-xs ${
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
          <span className="text-xs text-gray-400 italic py-1 px-2">
            Belum ada jadwal sesi di tab ini.
          </span>
        )}
      </div>
    </div>
  );
}
