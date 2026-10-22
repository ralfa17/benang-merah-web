import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { saveAs } from 'file-saver';
import Auth from './components/Auth';
import PublicLanding from './components/PublicLanding';
import PatientForm from './components/PatientForm';
import PatientAccordionRow from './components/PatientAccordionRow';
import DateFilterPills from './components/DateFilterPills';
import MedicalRecordModal from './components/MedicalRecordModal';
import TherapyProgressModal from './components/TherapyProgressModal';
import ReceiptModal from './components/ReceiptModal';
import EditAppointmentModal from './components/EditAppointmentModal';
import InstallPrompt from './components/InstallPrompt';
import {
  DownloadIcon,
  StethoscopeIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  TagIcon,
  RefreshCwIcon,
  ShieldCheckIcon
} from './components/icons';
import {
  ROLE_LABELS,
  normalizeRole,
  accessFromRole,
  matchesTherapistAssignment
} from './lib/roles';
import {
  LIST_PSIKOLOG,
  ADMIN_HANDLERS,
  PAYMENT_METHODS,
  MASTER_VOUCHERS,
  MAX_OPENING_VOUCHER_QUOTA
} from './lib/constants';
import {
  buildAppointmentNotes,
  groupAppointmentsByPatient,
  exportFinancialCsv,
  exportFinancialExcel,
  exportTherapistExcel
} from './lib/helpers';

export default function App() {
  // ============================================================
  // 1. STATE ROUTING (HALAMAN PUBLIK vs RUTE LOGIN TIM RAHASIA)
  // ============================================================
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname + window.location.hash;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname + window.location.hash);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const isSecretLoginRoute = useMemo(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/login' ||
      path === '/admin' ||
      path.startsWith('/login') ||
      path.startsWith('/admin') ||
      hash === '#/login' ||
      hash === '#/admin' ||
      hash.startsWith('#/login') ||
      hash.startsWith('#/admin')
    );
  }, [currentPath]);

  const navigateTo = (to) => {
    if (to.startsWith('#')) {
      window.location.hash = to;
    } else {
      window.history.pushState({}, '', to);
    }
    setCurrentPath(window.location.pathname + window.location.hash);
  };

  // ============================================================
  // 2. STATE AUTENTIKASI & PROFIL PENGGUNA
  // ============================================================
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [userName, setUserName] = useState('Tim Benang Merah');
  const [profileReady, setProfileReady] = useState(false);
  const [teamAccessDenied, setTeamAccessDenied] = useState(false);

  // Switch View Simulator (Khusus Master IT)
  const [simulationPersona, setSimulationPersona] = useState(null);

  // ============================================================
  // 3. STATE DATA APPOINTMENTS & TERAPIS DARI SUPABASE
  // ============================================================
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [activeTherapistList, setActiveTherapistList] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [voucherUsedCount, setVoucherUsedCount] = useState(0);

  // ============================================================
  // 4. STATE TAB & FILTER VIEW
  // ============================================================
  // Tab pilihan: 'azka' | 'sofia' | 'direct'
  const [activeTab, setActiveTab] = useState('azka');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================
  // 5. STATE FORM PENDAFTARAN PASIEN BARU (STICKY RIGHT PANEL)
  // ============================================================
  const [formData, setFormData] = useState({
    registrationType: 'psikolog', // 'psikolog' | 'terapis_direct'
    patientName: '',
    patientPhone: '',
    patientAge: '',
    visitNumber: 1,
    assignedPsychologist: LIST_PSIKOLOG[0].label,
    directTherapist: '',
    directTherapyMethod: 'Play and Grow',
    handleBy: ADMIN_HANDLERS[0],
    paymentMethod: PAYMENT_METHODS[0],
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: '09:00 WIB',
    serviceTypeInput: '',
    customServicePrice: 0,
    adminFeeInput: 30000,
    overtimeMinutes: 0,
    overtimeFee: 0,
    voucherInput: '',
    discountApplied: 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState('');

  // ============================================================
  // 6. STATE MODALS (REKAM MEDIS, PROGRESS, RECEIPT, EDIT)
  // ============================================================
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showTherapyModal, setShowTherapyModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptType, setReceiptType] = useState('invoice');
  const [showEditModal, setShowEditModal] = useState(false);

  // ============================================================
  // 7. ROLE & PRIVILEGE CHECKS (MENDUKUNG SIMULATOR MASTER)
  // ============================================================
  const activeRole = simulationPersona?.role || userRole;
  const activeName = simulationPersona?.name || userName;

  const { hasMasterAccess } = accessFromRole(userRole);
  const { hasAdminAccess, hasTherapistAccess, hasPsychologistAccess } =
    accessFromRole(activeRole);

  // ============================================================
  // 8. SUPABASE DATA FETCHING
  // ============================================================
  const fetchVoucherUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .ilike('notes', '%OPENING100K%');

      if (!error && data) {
        setVoucherUsedCount(data.length);
      }
    } catch (err) {
      console.error('Gagal memuat kuota voucher:', err.message);
    }
  }, []);

  const fetchActiveTherapists = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('full_name, role');

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        const registeredTherapists = profiles
          .filter((p) => {
            const role = normalizeRole(p.role, { fullName: p.full_name || '' });
            return role === 'terapis' || role === 'admin_terapis';
          })
          .map((p) => p.full_name)
          .filter(Boolean);

        setActiveTherapistList(registeredTherapists);
        if (registeredTherapists.length > 0) {
          setFormData((prev) => ({
            ...prev,
            directTherapist: prev.directTherapist || registeredTherapists[0]
          }));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil terapis terdaftar:', err.message);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('booking_date', { ascending: true });

      // Jika role murni psikolog (bukan admin), filter hanya pasien miliknya
      if (hasPsychologistAccess && !hasAdminAccess) {
        const me = LIST_PSIKOLOG.find((p) =>
          p.keywords.some((key) => activeName.toLowerCase().includes(key))
        );
        if (me) {
          query = query.ilike('doctor_name', `%${me.keywords[0]}%`);
        }
      } else if (hasTherapistAccess && !hasAdminAccess) {
        // Jika role murni terapis, filter pasien yang ditugaskan padanya
        const firstName = activeName.split(' ')[0];
        query = query.ilike('assigned_terapis', `%${firstName}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointmentsList(data || []);
    } catch (err) {
      console.error('Gagal mengambil data pendaftaran:', err.message);
    } finally {
      setLoadingAppts(false);
    }
  }, [hasPsychologistAccess, hasAdminAccess, hasTherapistAccess, activeName]);

  const loadUserProfile = useCallback(async (currentSession) => {
    if (!currentSession) {
      setUserRole('guest');
      setUserName('Tim Benang Merah');
      setTeamAccessDenied(false);
      setProfileReady(true);
      return;
    }

    setProfileReady(false);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      const email = currentSession.user.email || '';
      const metaName = currentSession.user.user_metadata?.full_name || '';
      const metaRole = currentSession.user.user_metadata?.role || '';
      const fullName = profile?.full_name || metaName || email || 'Tim Benang Merah';
      const role = normalizeRole(profile?.role || metaRole, { email, fullName });

      setUserName(fullName);
      setUserRole(role);

      // Pastikan profil tersimpan di DB jika akun belum memiliki baris profile
      if (!profile && role !== 'guest') {
        try {
          await supabase.from('profiles').upsert([
            { id: currentSession.user.id, full_name: fullName, role: role }
          ]);
        } catch (dbErr) {
          console.warn('Upsert profil warning:', dbErr);
        }
      }

      if (role === 'guest') {
        setTeamAccessDenied(true);
        await supabase.auth.signOut();
        alert('Akun Anda belum terdaftar di profil tim resmi. Hubungi admin IT.');
      } else {
        setTeamAccessDenied(false);
      }
    } catch (err) {
      console.error('Gagal verifikasi profil:', err.message);
      setUserRole('guest');
      setTeamAccessDenied(true);
    } finally {
      setProfileReady(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      loadUserProfile(sess);
      fetchActiveTherapists();
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      loadUserProfile(sess);
      fetchActiveTherapists();
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile, fetchActiveTherapists]);

  useEffect(() => {
    if (session && !teamAccessDenied) {
      fetchAppointments();
      fetchVoucherUsage();
    }
  }, [session, teamAccessDenied, fetchAppointments, fetchVoucherUsage]);

  // ============================================================
  // 9. KONTROL MASTER BACKUP DATABASE (.JSON)
  // ============================================================
  const handleBackupDatabase = async () => {
    try {
      const [apptsRes, profRes] = await Promise.all([
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);

      const backupData = {
        title: 'Klinik Psikologi Benang Merah - Database Snapshot Backup',
        exportedAt: new Date().toISOString(),
        exportedBy: userName,
        totalAppointments: (apptsRes.data || []).length,
        totalProfiles: (profRes.data || []).length,
        appointments: apptsRes.data || [],
        profiles: profRes.data || []
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      saveAs(blob, `Backup-BenangMerah-DB-${timestamp}.json`);
      alert(`Berhasil membuat file cadangan database (${backupData.totalAppointments} data janji/rekam medis & ${backupData.totalProfiles} profil)!`);
    } catch (err) {
      console.error('Gagal backup:', err);
      alert('Terjadi kesalahan saat mengekspor backup: ' + err.message);
    }
  };

  // ============================================================
  // 10. HANDLERS VOUCHER & PENDAFTARAN PASIEN
  // ============================================================
  const handleApplyVoucher = async () => {
    const code = formData.voucherInput.trim().toUpperCase();
    if (!code) return;

    if (MASTER_VOUCHERS[code]) {
      setCheckingVoucher(true);
      try {
        if (code === 'OPENING100K') {
          const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .ilike('notes', '%OPENING100K%');

          if (error) throw error;

          const usedCount = data ? data.length : 0;
          if (usedCount >= MAX_OPENING_VOUCHER_QUOTA) {
            setFormData((prev) => ({ ...prev, discountApplied: 0 }));
            setVoucherMsg(`Kuota voucher ${code} sudah HABIS (Telah digunakan ${usedCount}/${MAX_OPENING_VOUCHER_QUOTA} kali).`);
          } else {
            const discountValue = MASTER_VOUCHERS[code];
            setFormData((prev) => ({ ...prev, discountApplied: discountValue }));
            setVoucherMsg(`Voucher ${code} Berhasil! Diskon Rp ${discountValue.toLocaleString('id-ID')} (Sisa Kuota: ${MAX_OPENING_VOUCHER_QUOTA - usedCount - 1}x lagi)`);
          }
        } else {
          const discountValue = MASTER_VOUCHERS[code];
          setFormData((prev) => ({ ...prev, discountApplied: discountValue }));
          setVoucherMsg(`Voucher ${code} (Diskon Rp ${discountValue.toLocaleString('id-ID')}) Diterapkan!`);
        }
      } catch (err) {
        console.error('Gagal verifikasi voucher:', err.message);
        setVoucherMsg('Terjadi kesalahan saat memverifikasi kuota voucher.');
      } finally {
        setCheckingVoucher(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, discountApplied: 0 }));
      setVoucherMsg('Kode voucher tidak valid.');
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBookingMsg('');

    try {
      const isDirect = formData.registrationType === 'terapis_direct';
      const selectedTherapist = isDirect
        ? (formData.directTherapist || activeTherapistList[0] || null)
        : null;

      const finalServiceType = isDirect
        ? formData.directTherapyMethod
        : (formData.serviceTypeInput || null);

      const parsedAdminFee = Number(formData.adminFeeInput) || 0;
      const baseServicePrice = Number(formData.customServicePrice) || 0;
      const overtimeFeeNum = Number(formData.overtimeFee) || 0;
      const finalServicePriceAfterDiscount = Math.max(0, baseServicePrice - formData.discountApplied);
      const totalCalculatedPrice = finalServicePriceAfterDiscount + parsedAdminFee + overtimeFeeNum;

      const initialNotes = buildAppointmentNotes({
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        handleBy: formData.handleBy,
        paymentMethod: formData.paymentMethod,
        voucherCode: formData.discountApplied > 0 ? formData.voucherInput : '',
        discountAmount: formData.discountApplied,
        overtimeMinutes: Number(formData.overtimeMinutes) || 0,
        overtimeFee: overtimeFeeNum,
        isDirect,
        directMethod: formData.directTherapyMethod
      });

      const { error } = await supabase.from('appointments').insert([
        {
          patient_name: formData.patientName,
          doctor_name: isDirect ? 'Layanan Langsung Terapis' : formData.assignedPsychologist,
          assigned_to: isDirect ? 'Layanan Langsung Terapis' : formData.assignedPsychologist,
          assigned_terapis: selectedTherapist,
          booking_date: formData.bookingDate,
          booking_time: formData.bookingTime || 'Sesuai Janji',
          status: isDirect ? 'dirujuk_terapis' : 'pending',
          service_type: finalServiceType,
          category: finalServiceType,
          notes: initialNotes,
          age: parseInt(formData.patientAge, 10) || 0,
          visit_number: parseInt(formData.visitNumber, 10) || 1,
          price: totalCalculatedPrice,
          admin_fee: parsedAdminFee
        }
      ]);

      if (error) throw error;

      setBookingMsg('Pendaftaran pasien berhasil disimpan!');
      fetchAppointments();
      fetchVoucherUsage();

      setFormData((prev) => ({
        ...prev,
        patientName: '',
        patientPhone: '',
        patientAge: '',
        visitNumber: 1,
        bookingTime: '09:00 WIB',
        serviceTypeInput: '',
        customServicePrice: 0,
        overtimeMinutes: 0,
        overtimeFee: 0,
        voucherInput: '',
        discountApplied: 0
      }));
      setVoucherMsg('');
    } catch (err) {
      setBookingMsg(`Gagal: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddSession = (patientGroup) => {
    const nextVisitNumber = patientGroup.totalSessions + 1;
    const isDirect = patientGroup.latestSession?.doctor_name === 'Layanan Langsung Terapis';

    setFormData((prev) => ({
      ...prev,
      registrationType: isDirect ? 'terapis_direct' : 'psikolog',
      patientName: patientGroup.patientName,
      patientPhone: patientGroup.phone || prev.patientPhone,
      patientAge: patientGroup.age || prev.patientAge,
      visitNumber: nextVisitNumber,
      assignedPsychologist: patientGroup.latestSession?.doctor_name || LIST_PSIKOLOG[0].label,
      directTherapist: patientGroup.latestSession?.assigned_terapis || prev.directTherapist,
      bookingDate: new Date().toISOString().slice(0, 10),
      bookingTime: '09:00 WIB',
      serviceTypeInput: '',
      customServicePrice: 0,
      voucherInput: '',
      discountApplied: 0
    }));

    setBookingMsg(`Form disiapkan untuk Sesi #${nextVisitNumber} - Pasien: ${patientGroup.patientName}`);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // ============================================================
  // 11. HANDLERS MODALS (REKAM MEDIS, PROGRESS, EDIT, RECEIPT)
  // ============================================================
  const handleOpenMedicalModal = (item) => {
    setSelectedAppt(item);
    setShowMedicalModal(true);
  };

  const handleOpenTherapyModal = (item) => {
    setSelectedAppt(item);
    setShowTherapyModal(true);
  };

  const handleOpenReceiptModal = (item) => {
    setSelectedAppt(item);
    setReceiptType(item.status === 'lunas' ? 'paid' : 'invoice');
    setShowReceiptModal(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedAppt(item);
    setShowEditModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data sesi pendaftaran ini?')) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      fetchAppointments();
      fetchVoucherUsage();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleSavePsychologistRecord = async ({
    appointment,
    serviceType,
    sessionDurationPrice,
    durationLabel,
    anamnesaNotes,
    diagnosis,
    followUpPlan,
    referToTherapist,
    externalReferral,
    completeSession = false
  }) => {
    try {
      const adminFee = Number(appointment.admin_fee ?? 30000);
      const totalPrice = sessionDurationPrice + adminFee;

      let rujukanText = 'Rujukan: Tidak Ada';
      if (referToTherapist && externalReferral) {
        rujukanText = `Rujukan Terapis Internal: ${referToTherapist} | Rujukan Eksternal: ${externalReferral}`;
      } else if (referToTherapist) {
        rujukanText = `Rujukan Terapis Internal: ${referToTherapist}`;
      } else if (externalReferral) {
        rujukanText = `Rujukan Eksternal: ${externalReferral}`;
      }

      const medicalLog = `[REKAM MEDIS PSIKOLOG]\n` +
        ` Durasi Sesi: ${durationLabel}\n` +
        ` Anamnesa: ${anamnesaNotes}\n` +
        ` Diagnosa: ${diagnosis}\n` +
        ` Rancangan Tindak Lanjut: ${followUpPlan}\n` +
        ` ${rujukanText}`;

      let baseNotes = (appointment.notes || '')
        .replace(/\[REKAM MEDIS PSIKOLOG\][\s\S]*?(?=\n\n\[PROGRESS TERAPIS|$)/i, '')
        .trim();

      const finalNotes = `${baseNotes}\n\n${medicalLog}`.trim();

      const updatedPayload = {
        notes: finalNotes,
        status: completeSession
          ? (referToTherapist ? 'dirujuk_terapis' : 'selesai_konseling')
          : appointment.status,
        assigned_terapis: referToTherapist || appointment.assigned_terapis || null,
        service_type: `${serviceType} (${durationLabel})`,
        category: serviceType,
        price: totalPrice
      };

      const { error } = await supabase
        .from('appointments')
        .update(updatedPayload)
        .eq('id', appointment.id);

      if (error) throw error;

      alert('Rekam medis psikolog berhasil disimpan secara web-based!');
      fetchAppointments();

      if (completeSession) {
        const updatedAppt = { ...appointment, ...updatedPayload };
        setSelectedAppt(updatedAppt);
        setReceiptType('invoice');
        setShowReceiptModal(true);
      }
    } catch (err) {
      alert(`Gagal menyimpan rekam medis: ${err.message}`);
      throw err;
    }
  };

  const handleSaveTherapyProgress = async ({
    appointment,
    therapyProgress,
    userName: currentUserName
  }) => {
    try {
      const progressLog = `[PROGRESS TERAPIS - ${currentUserName}]\nProgress & Perubahan: ${therapyProgress}`;

      let baseNotes = (appointment.notes || '')
        .replace(/\[PROGRESS TERAPIS[^\]]*\][\s\S]*?(?=\n\n\[|$)/i, '')
        .trim();

      const finalNotes = `${baseNotes}\n\n${progressLog}`.trim();

      const { error } = await supabase
        .from('appointments')
        .update({
          notes: finalNotes,
          status: 'selesai_terapi'
        })
        .eq('id', appointment.id);

      if (error) throw error;

      alert('Catatan perkembangan terapis berhasil disimpan!');
      fetchAppointments();
    } catch (err) {
      alert(`Gagal menyimpan progress: ${err.message}`);
      throw err;
    }
  };

  const handleSaveEditAppointment = async (id, updatedPayload) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updatedPayload)
        .eq('id', id);

      if (error) throw error;

      alert('Data pendaftaran berhasil diperbarui!');
      fetchAppointments();
      fetchVoucherUsage();
    } catch (err) {
      alert(`Gagal memperbarui: ${err.message}`);
      throw err;
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedAppt) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'lunas' })
        .eq('id', selectedAppt.id);

      if (error) throw error;

      alert('Pembayaran terverifikasi! Status berubah menjadi LUNAS.');
      setSelectedAppt({ ...selectedAppt, status: 'lunas' });
      setReceiptType('paid');
      fetchAppointments();
    } catch (err) {
      alert(`Gagal mengupdate status: ${err.message}`);
    }
  };

  // ============================================================
  // 12. FILTERING & PENGELOMPOKAN DATA PASIEN (ACCORDION)
  // ============================================================
  const tabAppointments = useMemo(() => {
    return appointmentsList.filter((item) => {
      const docName = item.doctor_name || '';

      if (activeTab === 'direct') {
        return docName === 'Layanan Langsung Terapis';
      }

      if (activeTab === 'azka') {
        return LIST_PSIKOLOG[0].keywords.some((k) => docName.toLowerCase().includes(k));
      }

      if (activeTab === 'sofia') {
        return LIST_PSIKOLOG[1].keywords.some((k) => docName.toLowerCase().includes(k));
      }

      return true;
    });
  }, [appointmentsList, activeTab]);

  const availableDates = useMemo(() => {
    const map = new Map();
    tabAppointments.forEach((item) => {
      const d = item.booking_date;
      if (d) {
        map.set(d, (map.get(d) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tabAppointments]);

  const filteredAppointments = useMemo(() => {
    return tabAppointments.filter((item) => {
      if (selectedDateFilter && item.booking_date !== selectedDateFilter) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.patient_name || '').toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        return nameMatch || notesMatch;
      }

      return true;
    });
  }, [tabAppointments, selectedDateFilter, searchQuery]);

  const patientGroups = useMemo(() => {
    return groupAppointmentsByPatient(filteredAppointments);
  }, [filteredAppointments]);

  // ============================================================
  // 13. TAMPILAN JIKA SESI LOGIN SEDANG DIPERIKSA
  // ============================================================
  if (session && !profileReady) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center text-sm text-gray-500 font-sans gap-3">
        <RefreshCwIcon className="w-6 h-6 text-[#701A24] animate-spin" />
        <p className="font-medium text-[#701A24]">Memuat Profil Tim Benang Merah...</p>
      </div>
    );
  }

  // ============================================================
  // 14. TAMPILAN DASHBOARD UTAMA (JIKA SUDAH LOGIN RESMI)
  // ============================================================
  if (session && !teamAccessDenied && userRole !== 'guest') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans print:bg-white animate-fade-up">
        
        {/* BANNER NOTIFIKASI JIKA SIMULATOR MASTER AKTIF */}
        {simulationPersona && (
          <div className="bg-amber-600 text-white px-6 py-2.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-sm sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-amber-100" />
              <span>
                <strong>Mode Simulator Master IT:</strong> Sedang melihat antarmuka sebagai <u>{simulationPersona.name}</u> (Role: {ROLE_LABELS[simulationPersona.role] || simulationPersona.role})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimulationPersona(null)}
              className="bg-white text-amber-900 px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-amber-50 transition shadow-2xs"
            >
              Kembalikan ke Tampilan Asli Master IT
            </button>
          </div>
        )}

        {/* HEADER DASHBOARD MAROON KLASIK */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#EADFD5] sticky top-0 z-30 shadow-xs print:hidden">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
            
            {/* BRANDING & LOGO */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Logo Benang Merah"
                className="w-9 h-9 object-contain rounded-xl shadow-xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.jpeg';
                }}
              />
              <div>
                <h1 className="font-serif font-bold text-lg text-[#701A24] leading-tight">
                  Benang Merah
                </h1>
                <p className="text-[11px] text-gray-500 font-medium">
                  Sistem Rekam Medis & Manajemen Klinis Terpadu
                </p>
              </div>
            </div>

            {/* USER INFO, SWITCH VIEW, & EXPORT ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-right hidden sm:block mr-1">
                <p className="text-xs font-bold text-gray-900">{activeName}</p>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#701A24]/10 text-[#701A24] uppercase tracking-wider">
                  Role: {ROLE_LABELS[activeRole] || activeRole}
                </span>
              </div>

              {/* FITUR KHUSUS MASTER: KONTROL BACKUP DATABASE */}
              {hasMasterAccess && (
                <button
                  type="button"
                  onClick={handleBackupDatabase}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                  title="Ekspor Snapshot Data appointments & profiles ke file .json"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span>Backup DB (.json)</span>
                </button>
              )}

              {/* FITUR KHUSUS MASTER: SWITCH VIEW SIMULATOR */}
              {hasMasterAccess && (
                <div className="relative inline-block">
                  <select
                    value={simulationPersona ? `${simulationPersona.role}:${simulationPersona.name}` : 'default'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'default') {
                        setSimulationPersona(null);
                      } else {
                        const [role, name] = val.split(':');
                        setSimulationPersona({ role, name });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-amber-100 transition shadow-2xs"
                    title="Simulasikan tampilan role lain"
                  >
                    <option value="default">🔍 Switch View (Master IT)</option>
                    <option value="admin:Fauzan Hamdani">View as: Admin (Fauzan)</option>
                    <option value="terapis:Shima Adinda Salsabil">View as: Terapis (Shima)</option>
                    <option value="psikolog:M. Azka Maulana, M.Psi., Psikolog">View as: Psikolog (Pak Azka)</option>
                    <option value="psikolog:Sofia Halida Fatma, M.Psi., Psikolog">View as: Psikolog (Bu Sofia)</option>
                    <option value="terapis:Silviyah Wulandari">View as: Terapis (Silvi)</option>
                    <option value="terapis:Nadifah AM">View as: Terapis (Difa)</option>
                    <option value="terapis:Eka Zahra Nabila Nakhwa">View as: Terapis (Eka)</option>
                  </select>
                </div>
              )}

              {/* REKAP KEUANGAN EXCEL / CSV (KHUSUS ADMIN) */}
              {hasAdminAccess && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => exportFinancialExcel(appointmentsList)}
                    className="px-3 py-1.5 bg-[#701A24] hover:bg-[#54121B] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                    title="Export Rekap Keuangan Bulanan ke Excel (.xls)"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportFinancialCsv(appointmentsList)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 hidden md:flex"
                    title="Export Rekap Keuangan ke file .CSV"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              )}

              {/* EXPORT MEDIS TERAPIS (KHUSUS TERAPIS) */}
              {hasTherapistAccess && !hasAdminAccess && (
                <button
                  type="button"
                  onClick={() => {
                    const myPatients = appointmentsList.filter((item) =>
                      matchesTherapistAssignment(item.assigned_terapis, activeName)
                    );
                    exportTherapistExcel(myPatients, activeName);
                  }}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                  title="Download Rekap Progress Pasien Terapis"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Excel Medis Saya</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSimulationPersona(null);
                  navigateTo('/');
                }}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold rounded-xl text-xs transition border border-[#EADFD5] shadow-xs"
              >
                Keluar
              </button>
            </div>

          </div>
        </header>

        {/* ISI DASHBOARD UTAMA */}
        <main className="max-w-7xl mx-auto px-6 py-8 print:p-0">
          
          {/* BANNER UTAMA DENGAN GRADIENT MAROON KLASIK */}
          <div className="bg-gradient-to-r from-[#701A24] via-[#5D151E] to-[#420E15] rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 print:hidden relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-red-100 mb-3 backdrop-blur-sm border border-white/10">
                <SparklesIcon className="w-3.5 h-3.5 text-red-200" />
                Portal Rekam Medis & Manajemen Pasien Terintegrasi
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2 tracking-tight">
                Dashboard Operasional Tim Benang Merah
              </h2>
              <p className="text-red-100/90 max-w-3xl text-xs md:text-sm leading-relaxed font-light">
                {hasMasterAccess && 'Akses Master IT: Kontrol backup database cadangan (.json), monitoring multi-role, dan simulasi tampilan seluruh anggota tim.'}
                {!hasMasterAccess && hasAdminAccess && 'Akses Admin: Kelola pendaftaran pasien, atur Handle By & Metode Pembayaran, pantau pembukuan keuangan, dan terbitkan nota resmi.'}
                {hasPsychologistAccess && 'Akses Psikolog: Mengisi Anamnesa, Diagnosa, Rancangan Tindak Lanjut & Rujukan secara web-based langsung dari dashboard.'}
                {hasTherapistAccess && !hasAdminAccess && 'Akses Terapis: Memantau dan memperbarui progress perkembangan terapi anak secara berkelanjutan tanpa file Word.'}
              </p>
            </div>
          </div>

          {/* BANNER INDIKATOR VOUCHER REAL-TIME (TANPA EMOJI GENERIK) */}
          <div className="bg-amber-50/70 border border-amber-300 p-3.5 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                <TagIcon className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Status Voucher Promo: OPENING100K (Diskon Rp 100.000)
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  Validasi otomatis kuota maksimal pemakaian 17 pendaftaran
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                voucherUsedCount >= MAX_OPENING_VOUCHER_QUOTA
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {voucherUsedCount} / {MAX_OPENING_VOUCHER_QUOTA} Terpakai
              </span>
              <span className="text-xs font-semibold text-gray-600">
                {MAX_OPENING_VOUCHER_QUOTA - voucherUsedCount > 0
                  ? `(Sisa: ${MAX_OPENING_VOUCHER_QUOTA - voucherUsedCount} kuota)`
                  : '(Kuota Habis)'}
              </span>
            </div>
          </div>

          {/* LAYOUT 2 KOLOM: DAFTAR PASIEN DI KIRI & FORM STICKY DI KANAN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
            
            {/* ======================================================== */}
            {/* KOLOM KIRI: DAFTAR PASIEN, TAB, & FILTER TANGGAL */}
            {/* ======================================================== */}
            <div className={`${hasAdminAccess ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-6 print:border-none print:p-0`}>
              
              <div className="bg-white p-6 rounded-3xl border border-[#EADFD5] shadow-sm">
                
                {/* 1. NAVIGASI TAB UTAMA */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-[#EADFD5] pb-4">
                  {LIST_PSIKOLOG.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(p.id);
                        setSelectedDateFilter('');
                      }}
                      className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 border shadow-xs ${
                        activeTab === p.id
                          ? 'bg-[#701A24] text-white border-[#701A24] shadow-sm'
                          : 'bg-white text-gray-700 border-[#EADFD5] hover:border-[#701A24]/40 hover:bg-[#701A24]/5'
                      }`}
                    >
                      <StethoscopeIcon className={`w-4 h-4 ${activeTab === p.id ? 'text-white' : 'text-[#701A24]'}`} />
                      <span>Pasien Psikolog {idx === 0 ? 'A' : 'B'}: {p.shortName}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('direct');
                      setSelectedDateFilter('');
                    }}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 border shadow-xs ${
                      activeTab === 'direct'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-gray-700 border-[#EADFD5] hover:border-blue-400 hover:bg-blue-50/30'
                    }`}
                  >
                    <SparklesIcon className={`w-4 h-4 ${activeTab === 'direct' ? 'text-white' : 'text-blue-700'}`} />
                    <span>Direct Terapis (Anak)</span>
                  </button>
                </div>

                {/* 2. FILTER TANGGAL BERBENTUK KOTAK-KOTAK SESI */}
                <DateFilterPills
                  availableDates={availableDates}
                  selectedDate={selectedDateFilter}
                  onSelectDate={setSelectedDateFilter}
                  totalItemsCount={tabAppointments.length}
                />

                {/* 3. TOOLBAR PENCARIAN & TOTAL DATA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 print:hidden">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Cari nama pasien atau kata kunci..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-[#EADFD5] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#701A24] focus:border-transparent transition bg-[#FAF8F5]/50"
                    />
                    <span className="absolute left-3 top-2.5">
                      <SearchIcon className="w-4 h-4 text-gray-400" />
                    </span>
                  </div>

                  <span className="text-xs bg-[#701A24]/10 text-[#701A24] font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-[#701A24]/20">
                    {patientGroups.length} Pasien Terdaftar ({filteredAppointments.length} Total Sesi)
                  </span>
                </div>

                {/* 4. DAFTAR PASIEN SINGLE ROW ACCORDION */}
                {loadingAppts ? (
                  <div className="text-center py-12 text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCwIcon className="w-5 h-5 text-[#701A24] animate-spin" />
                    <p>Memuat daftar pasien...</p>
                  </div>
                ) : patientGroups.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs border border-dashed border-[#EADFD5] rounded-2xl p-6 bg-[#FAF8F5]/40">
                    <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">
                      {searchQuery
                        ? `Tidak ditemukan pasien dengan keyword "${searchQuery}"`
                        : 'Belum ada jadwal pasien di filter atau tab ini.'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Silakan pilih tab lain, reset filter tanggal, atau tambah pasien baru melalui form di samping.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {patientGroups.map((group) => (
                      <PatientAccordionRow
                        key={group.patientKey}
                        patientGroup={group}
                        userRole={activeRole}
                        userName={activeName}
                        hasAdminAccess={hasAdminAccess}
                        hasPsychologistAccess={hasPsychologistAccess}
                        hasTherapistAccess={hasTherapistAccess}
                        matchesTherapistAssignment={matchesTherapistAssignment}
                        onOpenMedicalModal={handleOpenMedicalModal}
                        onOpenTherapyModal={handleOpenTherapyModal}
                        onOpenEditModal={handleOpenEditModal}
                        onOpenReceiptModal={handleOpenReceiptModal}
                        onDeleteSession={handleDeleteSession}
                        onQuickAddSession={handleQuickAddSession}
                        onToggleStatus={handleMarkAsPaid}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>

            {/* ======================================================== */}
            {/* KOLOM KANAN: FORM INPUT PASIEN STICKY (ADMIN) */}
            {/* ======================================================== */}
            {hasAdminAccess && (
              <div className="lg:col-span-5 xl:col-span-4 print:hidden">
                <PatientForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleRegisterPatient}
                  submitting={submitting}
                  bookingMsg={bookingMsg}
                  checkingVoucher={checkingVoucher}
                  onApplyVoucher={handleApplyVoucher}
                  voucherMsg={voucherMsg}
                  activeTherapistList={activeTherapistList}
                  voucherUsedCount={voucherUsedCount}
                  maxVoucherQuota={MAX_OPENING_VOUCHER_QUOTA}
                />
              </div>
            )}

          </div>

        </main>

        {/* ============================================================ */}
        {/* MODALS SECTION */}
        {/* ============================================================ */}

        {/* MODAL 1: REKAM MEDIS & DIAGNOSA (PSIKOLOG) */}
        {showMedicalModal && selectedAppt && (
          <MedicalRecordModal
            appointment={selectedAppt}
            allPatientSessions={appointmentsList.filter(
              (a) => (a.patient_name || '').trim().toLowerCase() === (selectedAppt.patient_name || '').trim().toLowerCase()
            )}
            activeTherapistList={activeTherapistList}
            onClose={() => setShowMedicalModal(false)}
            onSaveRecord={handleSavePsychologistRecord}
          />
        )}

        {/* MODAL 2: PROGRESS TERAPI (TERAPIS) */}
        {showTherapyModal && selectedAppt && (
          <TherapyProgressModal
            appointment={selectedAppt}
            allPatientSessions={appointmentsList.filter(
              (a) => (a.patient_name || '').trim().toLowerCase() === (selectedAppt.patient_name || '').trim().toLowerCase()
            )}
            userName={activeName}
            onClose={() => setShowTherapyModal(false)}
            onSaveProgress={handleSaveTherapyProgress}
          />
        )}

        {/* MODAL 3: NOTA & INVOICE PEMBAYARAN */}
        {showReceiptModal && selectedAppt && (
          <ReceiptModal
            appointment={selectedAppt}
            receiptType={receiptType}
            onClose={() => setShowReceiptModal(false)}
            onMarkAsPaid={handleMarkAsPaid}
          />
        )}

        {/* MODAL 4: EDIT DETAIL PENDAFTARAN (ADMIN) */}
        {showEditModal && selectedAppt && (
          <EditAppointmentModal
            appointment={selectedAppt}
            activeTherapistList={activeTherapistList}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveEditAppointment}
          />
        )}

        {/* PWA INSTALL PROMPT */}
        <InstallPrompt />

      </div>
    );
  }

  // ============================================================
  // 15. TAMPILAN HALAMAN LOGIN TIM RAHASIA (/login ATAU /admin)
  // ============================================================
  if (!session && isSecretLoginRoute) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#701A24]/20 selection:text-[#701A24] relative overflow-hidden">
        {/* Ornamen latar belakang blur elegan */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#701A24]/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#701A24]/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EADFD5] relative z-10 animate-fade-up">
          {/* Logo & Judul Akses Tim Rahasia */}
          <div className="text-center mb-5">
            <div className="inline-block p-2 bg-[#701A24]/5 rounded-2xl border border-[#701A24]/15 mb-2.5 shadow-2xs">
              <img
                src="/logo.png"
                alt="Logo Benang Merah"
                className="w-12 h-12 object-contain mx-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.jpeg';
                }}
              />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#701A24] tracking-tight">
              Portal Tim Internal
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-light">
              Klinik Psikologi & Layanan Terpadu Benang Merah
            </p>
          </div>

          {/* Form Login 4 Role */}
          <Auth onLoginSuccess={() => navigateTo('/admin')} />

          {/* Tombol Kembali ke Halaman Publik */}
          <div className="mt-5 pt-4 border-t border-[#EADFD5] text-center">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="text-xs text-gray-500 hover:text-[#701A24] font-medium transition inline-flex items-center gap-1.5"
            >
              <span>← Kembali ke Halaman Publik</span>
            </button>
          </div>
        </div>

        <InstallPrompt />
      </div>
    );
  }

  // ============================================================
  // 16. TAMPILAN HALAMAN PUBLIK MURNI (BEBAS TOMBOL LOGIN TIM)
  // ============================================================
  return (
    <>
      <PublicLanding />
      <InstallPrompt />
    </>
  );
}
