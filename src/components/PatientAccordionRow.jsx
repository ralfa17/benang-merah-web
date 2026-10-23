import React, { useState } from 'react';
import {
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CalendarIcon,
  CreditCardIcon,
  StethoscopeIcon,
  EditIcon,
  ReceiptIcon,
  TrashIcon,
  PlusIcon,
  LockIcon,
  CheckIcon,
  PhoneIcon,
  DownloadIcon
} from './icons';
import { formatRupiah, formatDate, parseAppointmentNotes } from '../lib/helpers';
import { LIST_PSIKOLOG, THERAPIST_INCENTIVE_SERVICES, THERAPIST_INCENTIVE_SESSION_THRESHOLD } from '../lib/constants';
import { exportPsychologistReportDocx, exportTherapistProgressDocx } from '../lib/docxExport';

export default function PatientAccordionRow({
  patientGroup,
  isOpenDefault = false,
  userRole,
  userName,
  hasMasterAccess = false,
  hasAdminAccess,
  hasPsychologistAccess,
  hasTherapistAccess,
  matchesTherapistAssignment,
  onOpenMedicalModal,
  onOpenTherapyModal,
  onOpenEditModal,
  onOpenReceiptModal,
  onDeleteSession,
  onQuickAddSession,
  onTherapistAddSession,
  onTherapistEditSchedule
}) {

  const [isOpen, setIsOpen] = useState(isOpenDefault);

  const {
    patientName,
    age,
    phone,
    sessions = [],
    totalSessions,
    latestSession,
    hasPendingPayment
  } = patientGroup;

  // Cek apakah pasien ini ditugaskan ke terapis yang sedang login
  const isAssignedToThisTherapist = sessions.some((s) => {
    if (typeof matchesTherapistAssignment === 'function') {
      return matchesTherapistAssignment(s.assigned_terapis, userName);
    }
    const at = (s.assigned_terapis || '').toLowerCase();
    const un = (userName || '').toLowerCase();
    return at && un && (at.includes(un) || un.includes(at));
  });

  // ── Incentive Session Indicator (hanya untuk Terapis & Master) ──
  const incentiveSessions = sessions.filter(s => {
    const st = (s.service_type || s.category || '').toLowerCase();
    return THERAPIST_INCENTIVE_SERVICES.some(svc =>
      st.includes(svc.toLowerCase()) || svc.toLowerCase().includes(st)
    );
  });
  const isIncentiveService = incentiveSessions.length > 0;
  const incentiveCount = incentiveSessions.length;
  const incentiveReady = incentiveCount >= THERAPIST_INCENTIVE_SESSION_THRESHOLD;

  return (
    <div className="border border-[#EADFD5] rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all duration-200">
      {/* HEADER CARD SINGLE ROW (KLIK UNTUK BUKA/TUTUP ACCORDION) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 cursor-pointer bg-white hover:bg-[#FAF8F5]/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
      >
        {/* Kolom Kiri: Nama Pasien, Usia, Telepon, & Tag Jumlah Sesi */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#701A24]/10 border border-[#701A24]/20 flex items-center justify-center text-[#701A24] shrink-0">
            <UserIcon className="w-5 h-5 text-[#701A24]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-serif font-bold text-base text-gray-900 leading-tight">
                {patientName}
              </h4>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {age ? `${age} Tahun` : 'Usia -'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#701A24] text-white shadow-xs">
                {totalSessions} Sesi Kunjungan
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5 font-medium">
              {phone && (
                <span className="flex items-center gap-1 text-slate-600">
                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                  {phone}
                </span>
              )}
              {latestSession && (
                <span className="flex items-center gap-1 text-slate-600">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  Sesi Terakhir: {formatDate(latestSession.booking_date)} ({latestSession.booking_time || 'Sesuai Janji'})
                </span>
              )}
              {latestSession?.doctor_name && (
                <span className="text-gray-500">
                  PJ: <strong className="text-gray-700">{latestSession.doctor_name.split(',')[0]}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status Tagihan, Quick Add, & Tombol Toggle Accordion */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EADFD5]">
          {hasPendingPayment ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Ada Tagihan Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
              Semua Sesi Lunas
            </span>
          )}

          {/* Badge Insentif Terapis - hanya tampil untuk Terapis & Master jika layanan insentif */}
          {(hasTherapistAccess || hasMasterAccess) && isIncentiveService && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                incentiveReady
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {incentiveReady
                ? `✓ Syarat Insentif (Tgl 5)`
                : `Progression: ${incentiveCount}/${THERAPIST_INCENTIVE_SESSION_THRESHOLD} Sesi`}
            </span>
          )}

          {hasAdminAccess && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddSession(patientGroup);
              }}
              title="Tambah Sesi Lanjutan untuk Pasien Ini"
              className="px-3 py-1.5 bg-[#701A24]/10 hover:bg-[#701A24] text-[#701A24] hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 border border-[#701A24]/20"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Sesi Lanjutan</span>
            </button>
          )}

          {/* Tombol Mandiri Terapis: Tambah Sesi untuk Pasien Binaan */}
          {hasTherapistAccess && isAssignedToThisTherapist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onTherapistAddSession) onTherapistAddSession(patientGroup);
              }}
              title="Tambah Sesi Terapi Mandiri untuk Pasien Ini"
              className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-700 text-blue-700 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-blue-300/60 active:scale-95 shadow-2xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Sesi Terapi</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-[#701A24]/10 group-hover:text-[#701A24] transition">
            {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ISI ACCORDION: DETAIL RIWAYAT SESI PASIEN */}
      {isOpen && (
        <div className="border-t border-[#EADFD5] bg-[#FAF8F5]/60 p-4 sm:p-6 space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-[#701A24]">
              Riwayat Kunjungan & Detail Sesi ({sessions.length} Sesi Terjadwal)
            </h5>
            <span className="text-[11px] text-gray-500">
              Klik aksi di samping setiap sesi untuk kelola data & rekam medis
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map((item, idx) => {
              const meta = parseAppointmentNotes(item.notes);
              const isDirectTherapy = item.doctor_name === 'Layanan Langsung Terapis';
              const docLower = (item.doctor_name || '').toLowerCase();
              const currentNameLower = (userName || '').toLowerCase();

              const isMyPsychologistPatient = item.doctor_name && (
                LIST_PSIKOLOG.some((p) => {
                  const matchesUser = p.keywords.some((k) => currentNameLower.includes(k));
                  const matchesDoc = p.keywords.some((k) => docLower.includes(k));
                  return matchesUser && matchesDoc;
                }) || docLower.includes(currentNameLower)
              );

              const isMyTherapistPatient = matchesTherapistAssignment(item.assigned_terapis, userName);

              let canReadNotes = false;
              if (hasMasterAccess) {
                // Role Master IT memiliki transparansi penuh monitoring
                canReadNotes = true;
              } else if (hasPsychologistAccess && !isDirectTherapy && isMyPsychologistPatient) {
                canReadNotes = true;
              } else if (hasTherapistAccess && isMyTherapistPatient) {
                canReadNotes = true;
              }
              // Catatan: Admin (Fauzan) strictly canReadNotes = false (Privasi Medis)

              const itemAdminFee = Number(item.admin_fee ?? 30000);
              const itemTotalPrice = Number(item.price ?? 30000);
              const hasVoucher = meta.voucherCode === 'OPENING100K';
              const baseServicePrice = Math.max(0, itemTotalPrice - itemAdminFee + (hasVoucher ? 100000 : 0));
              const isPaid = item.status === 'lunas';

              return (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-2xl border border-[#EADFD5] p-4 sm:p-5 shadow-xs hover:border-[#701A24]/30 hover:shadow-sm transition-all duration-300"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    
                    {/* Kolom 1: Nomor Kunjungan, Tanggal, Jam */}
                    <div className="lg:col-span-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg font-bold text-xs bg-[#701A24] text-white">
                          Kunjungan Ke-{item.visit_number || (idx + 1)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPaid ? 'Lunas' : 'Pending'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pt-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#701A24]" />
                        {formatDate(item.booking_date)}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                        <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                        {item.booking_time || 'Sesuai Janji'}
                      </p>

                      <p className="text-[11px] text-[#701A24] font-semibold mt-1">
                        Layanan: {item.service_type || item.category || 'Konseling'}
                      </p>
                    </div>

                    {/* Kolom 2: Handle By Admin & Metode Pembayaran */}
                    <div className="lg:col-span-3 space-y-1.5 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-[11px] text-slate-500 font-medium">Petugas Handle By:</p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                          {meta.handleBy || 'Fauzan'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/80">
                        <p className="text-[11px] text-amber-800 font-medium">Metode Pembayaran:</p>
                        <p className="font-bold text-amber-950 text-xs mt-0.5 flex items-center gap-1">
                          <CreditCardIcon className="w-3.5 h-3.5 text-amber-700" />
                          {meta.paymentMethod || 'QRIS'}
                        </p>
                      </div>
                    </div>

                    {/* Kolom 3: Rincian Keuangan (Biaya Admin & Layanan) */}
                    <div className="lg:col-span-3 space-y-1 text-xs">
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADFD5] space-y-1 font-mono">
                        <div className="flex justify-between text-gray-600 text-[11px]">
                          <span>Biaya Layanan:</span>
                          <span>{formatRupiah(baseServicePrice)}</span>
                        </div>
                        {hasVoucher && (
                          <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
                            <span>Voucher (OPENING):</span>
                            <span>- Rp 100.000</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600 text-[11px]">
                          <span>Biaya Admin:</span>
                          <span>{formatRupiah(itemAdminFee)}</span>
                        </div>
                        {meta.overtimeFee > 0 && (
                          <div className="flex justify-between text-amber-800 text-[11px] font-semibold">
                            <span>Overtime ({meta.overtimeMinutes || 0}m):</span>
                            <span>+{formatRupiah(meta.overtimeFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-xs text-[#701A24] pt-1 border-t border-dashed border-[#EADFD5]">
                          <span>Total Tagihan:</span>
                          <span>{formatRupiah(itemTotalPrice)}</span>
                        </div>
                      </div>

                      {item.assigned_terapis && (
                        <p className="text-[11px] text-blue-700 font-medium pt-0.5">
                          Terapis: <strong>{item.assigned_terapis}</strong>
                        </p>
                      )}
                    </div>

                    {/* Kolom 4: Tombol Aksi Sesi Ini */}
                    <div className="lg:col-span-3 space-y-1.5 pt-1">
                      
                      {/* Tombol Rekam Medis (Khusus Psikolog) */}
                      {hasPsychologistAccess && !isDirectTherapy && isMyPsychologistPatient && (
                        <button
                          type="button"
                          onClick={() => onOpenMedicalModal(item)}
                          className="w-full px-3 py-1.5 bg-[#701A24] text-white rounded-lg text-xs font-semibold hover:bg-[#54121B] flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <StethoscopeIcon className="w-3.5 h-3.5" />
                          Rekam Medis & Selesai
                        </button>
                      )}

                      {/* Tombol Progress Terapi (Khusus Terapis) */}
                      {hasTherapistAccess && isMyTherapistPatient && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenTherapyModal(item)}
                            className="w-full px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            Progress Terapi
                          </button>

                          <button
                            type="button"
                            onClick={() => onTherapistEditSchedule && onTherapistEditSchedule(item)}
                            className="w-full px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-700" />
                            Edit Jadwal Sesi
                          </button>
                        </>
                      )}

                      {/* Tombol Cetak / Lihat Nota Invoice (Admin) */}
                      {hasAdminAccess && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenReceiptModal(item)}
                            className={`w-full px-3 py-1.5 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs ${
                              isPaid ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#701A24] hover:bg-[#54121B]'
                            }`}
                          >
                            <ReceiptIcon className="w-3.5 h-3.5" />
                            {isPaid ? 'Lihat Nota Lunas' : 'Invoice & Cetak'}
                          </button>

                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(item)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            >
                              <EditIcon className="w-3 h-3" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteSession(item.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            >
                              <TrashIcon className="w-3 h-3" />
                              Hapus
                            </button>
                          </div>
                        </>
                      )}

                      {/* Terapis/Psikolog yang ingin cetak nota jika diperbolehkan */}
                      {!hasAdminAccess && (
                        <button
                          type="button"
                          onClick={() => onOpenReceiptModal(item)}
                          className="w-full px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                        >
                          <ReceiptIcon className="w-3.5 h-3.5" />
                          Lihat Rincian Biaya
                        </button>
                      )}

                    </div>

                  </div>

                  {/* PREVIEW CATATAN REKAM MEDIS JIKA BERHAK AKSES */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Catatan Rekam Medis & Diagnosa:
                      </p>

                      {/* DOWNLOAD WORD (.DOCX) LANGSUNG DARI BARIS SESI (PSIKOLOG / TERAPIS / MASTER) */}
                      {canReadNotes && (
                        <div className="flex items-center gap-1.5">
                          {hasPsychologistAccess && !isDirectTherapy && (
                            <button
                              type="button"
                              onClick={() => exportPsychologistReportDocx(item, sessions)}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold border border-blue-200 transition flex items-center gap-1 active:scale-95 shadow-2xs"
                              title="Download Lembar Rekam Medis format .docx"
                            >
                              <DownloadIcon className="w-3 h-3 text-blue-700" />
                              <span>Word (.docx)</span>
                            </button>
                          )}
                          {hasTherapistAccess && (
                            <button
                              type="button"
                              onClick={() => exportTherapistProgressDocx(item, sessions, userName)}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold border border-blue-200 transition flex items-center gap-1 active:scale-95 shadow-2xs"
                              title="Download Progress Terapi format .docx"
                            >
                              <DownloadIcon className="w-3 h-3 text-blue-700" />
                              <span>Word (.docx)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {canReadNotes ? (
                      <div className="bg-[#FAF8F5] p-3 rounded-xl text-gray-700 font-sans whitespace-pre-line text-[11px] leading-relaxed border border-[#EADFD5]">
                        {meta.anamnesa || meta.diagnosis || meta.therapyProgress ? (
                          <div className="space-y-1.5">
                            {meta.anamnesa && (
                              <p><strong>Anamnesa:</strong> {meta.anamnesa}</p>
                            )}
                            {meta.diagnosis && (
                              <p><strong>Diagnosa:</strong> {meta.diagnosis}</p>
                            )}
                            {meta.followUpPlan && (
                              <p><strong>Rencana Tindak Lanjut:</strong> {meta.followUpPlan}</p>
                            )}
                            {meta.therapyProgress && (
                              <p className="text-blue-800"><strong>Progress Terapis:</strong> {meta.therapyProgress}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">
                            Belum ada formulir rekam medis yang diisi untuk sesi ini.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <LockIcon className="w-3.5 h-3.5 text-amber-800" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                            <span>🔒 Terkunci (Privasi Medis)</span>
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            Catatan Anamnesa, Diagnosa Klinis, dan Progress Terapi bersifat konfidensial dan disamarkan dari Admin. Akses penuh hanya terbuka bagi Tenaga Medis (Psikolog/Terapis) atau Master IT.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
