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
import AdminShiftReport from './components/AdminShiftReport';
import MonthlyRekapModal from './components/MonthlyRekapModal';
import InstallPrompt from './components/InstallPrompt';
import {
  DownloadIcon,
  StethoscopeIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  TagIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  MenuIcon,
  CloseIcon,
  ClipboardListIcon,
  BarChartIcon
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
  MAX_OPENING_VOUCHER_QUOTA,
  SERVICE_PRICES,
  THERAPIST_INCENTIVE_SERVICES,
  THERAPIST_INCENTIVE_SESSION_THRESHOLD
} from './lib/constants';
import {
  buildAppointmentNotes,
  groupAppointmentsByPatient,
  normalizePatientName,
  exportFinancialExcel,
  exportTherapistExcel,
  exportPsychologistExcel
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
    directTherapyMethod: 'Terapi Anak Spesial',
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
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [showMonthlyRekap, setShowMonthlyRekap] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State untuk Fitur Kemandirian Terapis (Input Sesi & Edit Jadwal Mandiri)
  const [showTherapistSessionForm, setShowTherapistSessionForm] = useState(false);
  const [therapistSessionData, setTherapistSessionData] = useState({
    patientGroup: null,
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: '09:00 WIB',
    serviceType: 'Terapi Anak Spesial',
    notes: ''
  });
  const [therapistEditTarget, setTherapistEditTarget] = useState(null);
  const [showTherapistEditModal, setShowTherapistEditModal] = useState(false);
  const [therapistScheduleDate, setTherapistScheduleDate] = useState('');
  const [therapistScheduleTime, setTherapistScheduleTime] = useState('');
  const [therapistScheduleService, setTherapistScheduleService] = useState('Terapi Anak Spesial');
  const [savingTherapistSession, setSavingTherapistSession] = useState(false);

  // Persistence State: Menyimpan patientKey accordion yang sedang terbuka agar tidak reset saat background refresh
  const [expandedPatientKeys, setExpandedPatientKeys] = useState(() => new Set());

  const handleTogglePatientAccordion = useCallback((patientKey) => {
    setExpandedPatientKeys((prev) => {
      const next = new Set(prev);
      if (next.has(patientKey)) {
        next.delete(patientKey);
      } else {
        next.add(patientKey);
      }
      return next;
    });
  }, []);

  // ============================================================
  // 7. ROLE & PRIVILEGE CHECKS (MENDUKUNG SIMULATOR MASTER)
  // ============================================================
  const activeRole = simulationPersona?.role || userRole;
  const activeName = simulationPersona?.name || userName;

  // isRealMaster: akses UI eksklusif master (Switch View, Backup) — SELALU dari userRole asli
  // hasMasterAccess: penentu sensor data pasien — FALSE saat simulationPersona aktif
  //   agar sensor Frosted Glass bekerja 100% mengikuti POV yang dipilih.
  const { hasMasterAccess: isRealMaster } = accessFromRole(userRole);
  const hasMasterAccess = isRealMaster && !simulationPersona;
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
    const defaultTherapists = [
      'Shima Adinda Salsabil',
      'Silviyah Wulandari',
      'Nadifah AM',
      'Eka Zahra Nabila Nakhwa',
      'Casmi Gustari'
    ];

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('full_name, role');

      if (error) {
        console.warn('Gagal mengambil profil terapis dari DB, gunakan default:', error.message);
        setActiveTherapistList(defaultTherapists);
        setFormData((prev) => ({
          ...prev,
          directTherapist: prev.directTherapist || defaultTherapists[0]
        }));
        return;
      }

      const dbTherapists = (profiles || [])
        .filter((p) => {
          const role = normalizeRole(p.role, { fullName: p.full_name || '' });
          return role === 'terapis' || role === 'admin_terapis';
        })
        .map((p) => p.full_name)
        .filter(Boolean);

      // Gabungkan daftar default master data dengan profil yang sudah register di Supabase
      const combined = Array.from(new Set([...defaultTherapists, ...dbTherapists]));

      setActiveTherapistList(combined);
      if (combined.length > 0) {
        setFormData((prev) => ({
          ...prev,
          directTherapist: prev.directTherapist || combined[0]
        }));
      }
    } catch (err) {
      console.error('Gagal mengambil terapis terdaftar:', err.message);
      setActiveTherapistList(defaultTherapists);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      // Mengambil seluruh data pendaftaran klinik agar statistik & list lengkap dapat diakses seluruh tim,
      // sedangkan batasan privasi data rekam medis & identitas diatur oleh sensor komponen PatientAccordionRow
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setAppointmentsList(data || []);
    } catch (err) {
      console.error('Gagal mengambil data pendaftaran:', err.message);
    } finally {
      setLoadingAppts(false);
    }
  }, []);

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

    if (code === 'OPENING100K') {
      setFormData((prev) => ({ ...prev, discountApplied: 0 }));
      setVoucherMsg('Promo OPENING100K telah berakhir karena telah berganti bulan.');
      return;
    }

    if (MASTER_VOUCHERS[code]) {
      const discountValue = MASTER_VOUCHERS[code];
      setFormData((prev) => ({ ...prev, discountApplied: discountValue }));
      setVoucherMsg(`Voucher ${code} (Diskon Rp ${discountValue.toLocaleString('id-ID')}) Diterapkan!`);
    } else {
      setFormData((prev) => ({ ...prev, discountApplied: 0 }));
      setVoucherMsg('Kode voucher tidak valid atau masa berlaku telah berakhir.');
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
  // HANDLERS KEMANDIRIAN TERAPIS (TAMBAH SESI MANDIRI & EDIT JADWAL)
  // ============================================================
  const handleTherapistAddSession = (patientGroup) => {
    const latest = patientGroup.latestSession;
    const defaultSvc = latest?.service_type || latest?.category || 'Terapi Anak Spesial';
    setTherapistSessionData({
      patientGroup,
      bookingDate: new Date().toISOString().slice(0, 10),
      bookingTime: '09:00 WIB',
      serviceType: defaultSvc,
      notes: ''
    });
    setShowTherapistSessionForm(true);
  };

  const handleSubmitTherapistSession = async () => {
    if (!therapistSessionData.patientGroup) return;
    setSavingTherapistSession(true);
    try {
      const pg = therapistSessionData.patientGroup;
      const nextVisit = pg.totalSessions + 1;
      const latest = pg.latestSession;

      // Deteksi apakah layanan termasuk paket blok 8 pertemuan
      const isBlockPackage = THERAPIST_INCENTIVE_SERVICES.some((svc) =>
        therapistSessionData.serviceType.toLowerCase().includes(svc.toLowerCase())
      );
      const sessionInBlock = ((nextVisit - 1) % 8) + 1;
      const isSubsequentInBlock = isBlockPackage && sessionInBlock > 1;

      // Harga dasar layanan terapis
      let calculatedPrice = 0;
      let sessionStatus = 'dirujuk_terapis';

      if (isSubsequentInBlock) {
        calculatedPrice = 0;
        sessionStatus = 'lunas'; // Sesi lanjutan dalam paket blok otomatis berstatus lunas
      } else {
        calculatedPrice = SERVICE_PRICES[therapistSessionData.serviceType] || Number(latest?.price || 150000);
      }

      const therapistLogNote = `[SESI MANDIRI TERAPIS]\nDitambahkan mandiri oleh: ${activeName}\nLayanan: ${therapistSessionData.serviceType}\nCatatan: ${therapistSessionData.notes || 'Sesi lanjutan terapi'}${isSubsequentInBlock ? ` (Termasuk Paket Blok 8 Pertemuan - Sesi #${sessionInBlock}/8)` : ''}`;

      const { error } = await supabase.from('appointments').insert([
        {
          patient_name: pg.patientName,
          doctor_name: latest?.doctor_name || 'Layanan Langsung Terapis',
          assigned_to: latest?.doctor_name || 'Layanan Langsung Terapis',
          assigned_terapis: activeName,
          booking_date: therapistSessionData.bookingDate,
          booking_time: therapistSessionData.bookingTime || 'Sesuai Janji',
          status: sessionStatus,
          service_type: therapistSessionData.serviceType,
          category: therapistSessionData.serviceType,
          notes: therapistLogNote,
          age: parseInt(pg.age, 10) || 0,
          visit_number: nextVisit,
          price: calculatedPrice,
          admin_fee: 0 // Biaya admin tidak ditagihkan lagi pada sesi lanjutan mandiri terapis
        }
      ]);

      if (error) throw error;

      alert(`Sesi ke-${nextVisit} untuk pasien ${pg.patientName} berhasil ditambahkan oleh Terapis ${activeName.split(' ')[0]}!`);
      setShowTherapistSessionForm(false);

      // Pertahankan posisi accordion pasien tetap terbuka & tidak reset/redirect ke awal
      if (pg.patientKey) {
        setExpandedPatientKeys((prev) => new Set([...prev, pg.patientKey]));
      }

      await fetchAppointments();
    } catch (err) {
      alert(`Gagal menambahkan sesi terapi: ${err.message}`);
    } finally {
      setSavingTherapistSession(false);
    }
  };

  const handleTherapistEditSchedule = (item) => {
    setTherapistEditTarget(item);
    setTherapistScheduleDate(item.booking_date || new Date().toISOString().slice(0, 10));
    setTherapistScheduleTime(item.booking_time || '09:00 WIB');
    setTherapistScheduleService(item.service_type || item.category || 'Terapi Anak Spesial');
    setShowTherapistEditModal(true);
  };

  const handleSubmitTherapistSchedule = async () => {
    if (!therapistEditTarget) return;
    setSavingTherapistSession(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          booking_date: therapistScheduleDate,
          booking_time: therapistScheduleTime,
          service_type: therapistScheduleService,
          category: therapistScheduleService
        })
        .eq('id', therapistEditTarget.id);

      if (error) throw error;

      alert('Jadwal dan layanan sesi terapi berhasil diperbarui!');
      setShowTherapistEditModal(false);

      // Pertahankan posisi accordion pasien tetap terbuka & tidak reset/redirect ke awal
      const targetKey = normalizePatientName(therapistEditTarget.patient_name || '');
      if (targetKey) {
        setExpandedPatientKeys((prev) => new Set([...prev, targetKey]));
      }

      await fetchAppointments();
    } catch (err) {
      alert(`Gagal memperbarui jadwal: ${err.message}`);
    } finally {
      setSavingTherapistSession(false);
    }
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
      // 1. STRICT POV ISOLATION UNTUK NAKES (Psikolog & Terapis)
      // Master IT saat mode default (hasMasterAccess=true) & Admin memiliki akses penuh tanpa pembatasan nakes.
      // Saat Master memilih SIMULASI POV Nakes (hasMasterAccess=false), DILARANG BYPASS: Tampilan wajib 100% persis POV Nakes yang disimulasikan!
      if (!hasMasterAccess && !hasAdminAccess) {
        if (hasPsychologistAccess) {
          const docLower = (item.doctor_name || '').toLowerCase();
          const nameLower = (activeName || userName).toLowerCase();
          const isMyPatient = LIST_PSIKOLOG.some((p) => {
            const matchesUser = p.keywords.some((k) => nameLower.includes(k));
            const matchesDoc = p.keywords.some((k) => docLower.includes(k));
            return matchesUser && matchesDoc;
          }) || docLower.includes(nameLower);

          if (!isMyPatient) {
            return false; // HILANGKAN TOTAL DARI TAMPILAN
          }
        } else if (hasTherapistAccess) {
          const tName = activeName || userName;
          const isMyPatient = matchesTherapistAssignment
            ? matchesTherapistAssignment(item.assigned_terapis, tName)
            : (item.assigned_terapis || '').toLowerCase().includes(tName.toLowerCase());

          if (!isMyPatient) {
            return false; // HILANGKAN TOTAL DARI TAMPILAN
          }
        }
      }

      // 2. Filter Tab Pilihan
      const docName = item.doctor_name || '';

      if (activeTab === 'all') {
        return true;
      }

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
  }, [
    appointmentsList,
    activeTab,
    hasMasterAccess,
    hasAdminAccess,
    hasPsychologistAccess,
    hasTherapistAccess,
    activeName,
    userName
  ]);

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
            {/* USER INFO, SWITCH VIEW, & EXPORT ACTIONS (DESKTOP) */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="text-right mr-1">
                <p className="text-xs font-bold text-gray-900">{activeName}</p>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#701A24]/10 text-[#701A24] uppercase tracking-wider">
                  Role: {ROLE_LABELS[activeRole] || activeRole}
                </span>
              </div>

              {/* FITUR KHUSUS MASTER: KONTROL BACKUP DATABASE */}
              {hasMasterAccess && !simulationPersona && (
                <button
                  type="button"
                  onClick={handleBackupDatabase}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
                  title="Ekspor Snapshot Data appointments & profiles ke file .json"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span>Backup DB (.json)</span>
                </button>
              )}

              {/* FITUR KHUSUS MASTER: SWITCH VIEW SIMULATOR — tampil selama akun asli Master (isRealMaster) */}
              {isRealMaster && (
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
                    <option value="default">Switch View (Master IT)</option>
                    <option value="admin:Fauzan Hamdani">View as: Admin (Fauzan)</option>
                    <option value="terapis:Shima Adinda Salsabil">View as: Terapis (Shima)</option>
                    <option value="psikolog:M. Azka Maulana, M.Psi., Psikolog">View as: Psikolog (Pak Azka)</option>
                    <option value="psikolog:Sofia Halida Fatma, M.Psi., Psikolog">View as: Psikolog (Bu Sofia)</option>
                    <option value="terapis:Silviyah Wulandari">View as: Terapis (Silvi)</option>
                    <option value="terapis:Nadifah AM">View as: Terapis (Difa)</option>
                    <option value="terapis:Eka Zahra Nabila Nakhwa">View as: Terapis (Eka)</option>
                    <option value="terapis:Casmi Gustari">View as: Terapis (Casmi)</option>
                  </select>
                </div>
              )}

              {/* FITUR 1: LAPORAN SHIFT ADMIN & HANDOVER (KHUSUS ADMIN & MASTER SAAT DEFAULT) */}
              {(hasAdminAccess || hasMasterAccess) && (
                <button
                  type="button"
                  onClick={() => setShowShiftReport(true)}
                  className="px-3 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Form Presensi & Laporan Ringkasan Shift Admin"
                >
                  <ClipboardListIcon className="w-3.5 h-3.5 text-white" />
                  <span>Laporan Shift</span>
                </button>
              )}

              {/* FITUR 2: REKAP BULANAN NATIVE EXCEL (.XLSX) (KHUSUS MASTER & PSIKOLOG) */}
              {(hasMasterAccess || hasPsychologistAccess) && (
                <button
                  type="button"
                  onClick={() => setShowMonthlyRekap(true)}
                  className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#701A24] border border-[#EADFD5] font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Buka Rekap Pasien per Bulan & Download Native .xlsx"
                >
                  <BarChartIcon className="w-3.5 h-3.5 text-[#701A24]" />
                  <span>Rekap Bulanan</span>
                </button>
              )}

              {/* QUICK EXCEL SELURUH DATA PASIEN (KHUSUS MASTER) */}
              {hasMasterAccess && (
                <button
                  type="button"
                  onClick={() => exportFinancialExcel(appointmentsList)}
                  className="px-3 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Download Quick Excel Seluruh Pasien & Keuangan (.xlsx)"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Quick Excel</span>
                </button>
              )}

              {/* QUICK EXCEL PASIEN SENDIRI (KHUSUS PSIKOLOG) */}
              {hasPsychologistAccess && !hasMasterAccess && (
                <button
                  type="button"
                  onClick={() => {
                    const myPatients = appointmentsList.filter((item) => {
                      const docLower = (item.doctor_name || '').toLowerCase();
                      const nameLower = activeName.toLowerCase();
                      return docLower.includes(nameLower) || LIST_PSIKOLOG.some((p) => p.keywords.some((k) => nameLower.includes(k) && docLower.includes(k)));
                    });
                    exportPsychologistExcel(myPatients, activeName);
                  }}
                  className="px-3 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Download Quick Excel Pasien Psikolog (.xlsx)"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Quick Excel</span>
                </button>
              )}

              {/* QUICK EXCEL PASIEN RUJUKAN SENDIRI (KHUSUS TERAPIS) */}
              {hasTherapistAccess && !hasMasterAccess && (
                <button
                  type="button"
                  onClick={() => {
                    const myPatients = appointmentsList.filter((item) =>
                      matchesTherapistAssignment(item.assigned_terapis, activeName)
                    );
                    exportTherapistExcel(myPatients, activeName);
                  }}
                  className="px-3 py-1.5 bg-[#701A24] hover:bg-[#581524] text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Download Quick Excel Pasien Rujukan Terapis (.xlsx)"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Quick Excel</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSimulationPersona(null);
                  navigateTo('/');
                }}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold rounded-xl text-xs transition border border-[#EADFD5] shadow-xs active:scale-95"
              >
                Keluar
              </button>
            </div>

            {/* MOBILE HAMBURGER MENU BUTTON (☰) - KHUSUS LAYAR HP */}
            <div className="flex items-center gap-2 lg:hidden">
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#701A24]/10 text-[#701A24] uppercase">
                {ROLE_LABELS[activeRole] || activeRole}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-[#EADFD5] bg-white text-gray-700 hover:text-[#701A24] hover:bg-[#FAF8F5] transition active:scale-95 shadow-2xs"
                title="Buka Menu Manajemen"
              >
                {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* MOBILE DRAWER / DROPDOWN ACTIONS */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[#EADFD5] bg-white/98 backdrop-blur-md px-6 py-4 space-y-3.5 shadow-lg animate-fade-up print:hidden">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">{activeName}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Role: {ROLE_LABELS[activeRole] || activeRole}</p>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#701A24]/10 text-[#701A24]">
                  Klinik Benang Merah
                </span>
              </div>

              {/* FITUR KHUSUS MASTER DI MOBILE — tampil selama akun asli Master (isRealMaster) */}
              {isRealMaster && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Akses Master IT:</p>
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
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="default">Switch View (Master IT)</option>
                    <option value="admin:Fauzan Hamdani">View as: Admin (Fauzan)</option>
                    <option value="terapis:Shima Adinda Salsabil">View as: Terapis (Shima)</option>
                    <option value="psikolog:M. Azka Maulana, M.Psi., Psikolog">View as: Psikolog (Pak Azka)</option>
                    <option value="psikolog:Sofia Halida Fatma, M.Psi., Psikolog">View as: Psikolog (Bu Sofia)</option>
                    <option value="terapis:Silviyah Wulandari">View as: Terapis (Silvi)</option>
                    <option value="terapis:Nadifah AM">View as: Terapis (Difa)</option>
                    <option value="terapis:Eka Zahra Nabila Nakhwa">View as: Terapis (Eka)</option>
                    <option value="terapis:Casmi Gustari">View as: Terapis (Casmi)</option>
                  </select>

                  {!simulationPersona && (
                    <button
                      type="button"
                      onClick={() => {
                        handleBackupDatabase();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs active:scale-95"
                    >
                      <DownloadIcon className="w-3.5 h-3.5 text-slate-300" />
                      <span>Backup DB Snapshot (.json)</span>
                    </button>
                  )}
                </div>
              )}

              {/* FITUR OPERASIONAL & EKSPOR DI MOBILE */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operasional & Rekap:</p>
                
                {/* AKSI SHIFT & REKAP DI MOBILE */}
                {((hasAdminAccess || hasMasterAccess) || (hasMasterAccess || hasPsychologistAccess)) && (
                  <div className={`grid ${(hasAdminAccess || hasMasterAccess) && (hasMasterAccess || hasPsychologistAccess) ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {(hasAdminAccess || hasMasterAccess) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowShiftReport(true);
                          setMobileMenuOpen(false);
                        }}
                        className="px-3 py-2 bg-[#701A24] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <ClipboardListIcon className="w-3.5 h-3.5 text-white" />
                        <span>Laporan Shift</span>
                      </button>
                    )}
                    {(hasMasterAccess || hasPsychologistAccess) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMonthlyRekap(true);
                          setMobileMenuOpen(false);
                        }}
                        className="px-3 py-2 bg-white text-[#701A24] border border-[#EADFD5] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <BarChartIcon className="w-3.5 h-3.5 text-[#701A24]" />
                        <span>Rekap Bulanan</span>
                      </button>
                    )}
                  </div>
                )}

                {/* QUICK EXCEL SELURUH DATA PASIEN DI MOBILE (KHUSUS MASTER) */}
                {hasMasterAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      exportFinancialExcel(appointmentsList);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-[#701A24] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Quick Excel (Semua Pasien)</span>
                  </button>
                )}

                {/* QUICK EXCEL PASIEN SENDIRI DI MOBILE (KHUSUS PSIKOLOG) */}
                {hasPsychologistAccess && !hasMasterAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      const myPatients = appointmentsList.filter((item) => {
                        const docLower = (item.doctor_name || '').toLowerCase();
                        const nameLower = activeName.toLowerCase();
                        return docLower.includes(nameLower) || LIST_PSIKOLOG.some((p) => p.keywords.some((k) => nameLower.includes(k) && docLower.includes(k)));
                      });
                      exportPsychologistExcel(myPatients, activeName);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-[#701A24] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Quick Excel (.xlsx)</span>
                  </button>
                )}

                {/* QUICK EXCEL PASIEN RUJUKAN DI MOBILE (KHUSUS TERAPIS) */}
                {hasTherapistAccess && !hasMasterAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      const myPatients = appointmentsList.filter((item) =>
                        matchesTherapistAssignment(item.assigned_terapis, activeName)
                      );
                      exportTherapistExcel(myPatients, activeName);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-[#701A24] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Quick Excel (.xlsx)</span>
                  </button>
                )}
              </div>

              {/* LOGOUT BUTTON DI MOBILE */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await supabase.auth.signOut();
                    setSimulationPersona(null);
                    navigateTo('/');
                  }}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-red-200 transition active:scale-95"
                >
                  Keluar dari Dashboard
                </button>
              </div>
            </div>
          )}
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

          {/* LAYOUT 2 KOLOM RESPONSIF: MOBILE-FIRST */}
          {/* Pada Mobile: Form Pendaftaran tampil PALING ATAS, List Pasien di bawahnya */}
          {/* Pada Desktop (lg+): Form di KANAN, List di KIRI */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start print:block">

            {/* ================================================================ */}
            {/* KOLOM FORM (MOBILE: order-1 = PALING ATAS | DESKTOP: col kanan) */}
            {/* ================================================================ */}
            {hasAdminAccess && (
              <div className="w-full order-1 lg:order-2 lg:col-span-5 xl:col-span-4 print:hidden">
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

            {/* ================================================================ */}
            {/* KOLOM LIST PASIEN (MOBILE: order-2 = di bawah form | DESKTOP: col kiri) */}
            {/* ================================================================ */}
            <div className={`w-full order-2 lg:order-1 ${hasAdminAccess ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-6 print:border-none print:p-0`}>

              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#EADFD5] shadow-sm">
                
                {/* 1. NAVIGASI TAB UTAMA */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-[#EADFD5] pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('all');
                      setSelectedDateFilter('');
                    }}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 border shadow-xs ${
                      activeTab === 'all'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-gray-700 border-[#EADFD5] hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className={`w-4 h-4 ${activeTab === 'all' ? 'text-white' : 'text-slate-600'}`} />
                    <span>Semua Pasien ({appointmentsList.length})</span>
                  </button>

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
                        isExpanded={expandedPatientKeys.has(group.patientKey)}
                        onToggle={() => handleTogglePatientAccordion(group.patientKey)}
                        userRole={activeRole}
                        userName={activeName}
                        hasMasterAccess={hasMasterAccess}
                        hasAdminAccess={hasAdminAccess}
                        hasPsychologistAccess={hasPsychologistAccess}
                        hasTherapistAccess={hasTherapistAccess}
                        matchesTherapistAssignment={matchesTherapistAssignment}
                        isSimulatingRole={isRealMaster && !!simulationPersona}
                        isRealMaster={isRealMaster}
                        onOpenMedicalModal={handleOpenMedicalModal}
                        onOpenTherapyModal={handleOpenTherapyModal}
                        onOpenEditModal={handleOpenEditModal}
                        onOpenReceiptModal={handleOpenReceiptModal}
                        onDeleteSession={handleDeleteSession}
                        onQuickAddSession={handleQuickAddSession}
                        onTherapistAddSession={handleTherapistAddSession}
                        onTherapistEditSchedule={handleTherapistEditSchedule}
                        onToggleStatus={handleMarkAsPaid}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>

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
            isTherapist={hasTherapistAccess && !hasAdminAccess}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveEditAppointment}
          />
        )}

        {/* MODAL 5: TAMBAH SESI TERAPI MANDIRI (TERAPIS) */}
        {showTherapistSessionForm && therapistSessionData.patientGroup && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#EADFD5] w-full max-w-md p-6 space-y-4 animate-fade-up">
              <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
                <h3 className="font-serif font-bold text-base text-[#701A24]">
                  + Tambah Sesi Terapi Mandiri
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTherapistSessionForm(false)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  ✕ Tutup
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                <p className="font-bold text-sm text-blue-950">
                  Pasien: {therapistSessionData.patientGroup.patientName}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-blue-800">
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-100">
                    Sesi Ke-{therapistSessionData.patientGroup.totalSessions + 1}
                  </span>
                  <span>•</span>
                  <span>Terapis PJ: <strong>{activeName}</strong></span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Sesi Terapi
                  </label>
                  <input
                    type="date"
                    required
                    value={therapistSessionData.bookingDate}
                    onChange={(e) =>
                      setTherapistSessionData((prev) => ({ ...prev, bookingDate: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Jam Sesi (WIB)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09:00 WIB atau 14:00 WIB"
                    value={therapistSessionData.bookingTime}
                    onChange={(e) =>
                      setTherapistSessionData((prev) => ({ ...prev, bookingTime: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Layanan Terapi
                  </label>
                  <select
                    value={therapistSessionData.serviceType}
                    onChange={(e) =>
                      setTherapistSessionData((prev) => ({ ...prev, serviceType: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                  >
                    <option value="Terapi Anak Spesial">Terapi Anak Spesial (Rp 150.000/sesi)</option>
                    <option value="Kelas Anak Usia Dini (Pra-Literasi)">Kelas Anak Usia Dini / Pra-Literasi (Rp 500.000/blok)</option>
                    <option value="Bimbingan Belajar Intensif SD">Bimbingan Belajar Intensif SD (Rp 600.000/8 pertemuan)</option>
                    <option value="Shadow Teacher">Shadow Teacher (Sesuai Kebutuhan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan Rencana Sesi (Opsional)
                  </label>
                  <textarea
                    placeholder="Contoh: Fokus stimulasi konsentrasi dan sensori motorik..."
                    rows={2}
                    value={therapistSessionData.notes}
                    onChange={(e) =>
                      setTherapistSessionData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 resize-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EADFD5]">
                <button
                  type="button"
                  onClick={() => setShowTherapistSessionForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitTherapistSession}
                  disabled={savingTherapistSession}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {savingTherapistSession ? 'Menyimpan...' : 'Simpan Sesi Terapi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: EDIT JADWAL SESI TERAPIS MANDIRI */}
        {showTherapistEditModal && therapistEditTarget && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#EADFD5] w-full max-w-sm p-6 space-y-4 animate-fade-up">
              <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
                <h3 className="font-serif font-bold text-base text-[#701A24]">
                  Penyesuaian Jadwal Terapi
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTherapistEditModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  ✕ Tutup
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800">
                <p className="font-bold text-slate-900">{therapistEditTarget.patient_name}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Kunjungan Ke-{therapistEditTarget.visit_number} • {therapistEditTarget.service_type || therapistEditTarget.category}
                </p>
                <p className="text-[10px] text-blue-700 font-semibold mt-1">
                  🔒 Batasan Akses: Hanya tanggal, jam, dan layanan terapi anak yang dapat disesuaikan oleh Terapis.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Sesi Baru
                  </label>
                  <input
                    type="date"
                    required
                    value={therapistScheduleDate}
                    onChange={(e) => setTherapistScheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Jam Sesi Baru (WIB)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 10:00 WIB"
                    value={therapistScheduleTime}
                    onChange={(e) => setTherapistScheduleTime(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Layanan Terapi Anak
                  </label>
                  <select
                    value={therapistScheduleService}
                    onChange={(e) => setTherapistScheduleService(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                  >
                    <option value="Terapi Anak Spesial">Terapi Anak Spesial (Rp 150.000/sesi)</option>
                    <option value="Kelas Anak Usia Dini (Pra-Literasi)">Kelas Anak Usia Dini / Pra-Literasi (Rp 500.000/blok)</option>
                    <option value="Bimbingan Belajar Intensif SD">Bimbingan Belajar Intensif SD (Rp 600.000/8 pertemuan)</option>
                    <option value="Shadow Teacher">Shadow Teacher (Sesuai Kebutuhan)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#EADFD5]">
                <button
                  type="button"
                  onClick={() => setShowTherapistEditModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitTherapistSchedule}
                  disabled={savingTherapistSession}
                  className="flex-1 py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {savingTherapistSession ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: LAPORAN SHIFT ADMIN (CHECK-IN / HANDOVER & REVIEW MASTER) */}
        {showShiftReport && (hasAdminAccess || hasMasterAccess) && (
          <AdminShiftReport
            userName={activeName}
            userRole={activeRole}
            hasMasterAccess={hasMasterAccess}
            appointmentsList={appointmentsList}
            onClose={() => setShowShiftReport(false)}
          />
        )}

        {/* MODAL 7: REKAP PASIEN BULANAN & NATIVE EXCEL (.XLSX) (MASTER & PSIKOLOG ONLY) */}
        {showMonthlyRekap && (hasMasterAccess || hasPsychologistAccess) && (
          <MonthlyRekapModal
            appointmentsList={appointmentsList}
            userRole={activeRole}
            userName={activeName}
            hasMasterAccess={hasMasterAccess}
            hasAdminAccess={hasAdminAccess}
            hasPsychologistAccess={hasPsychologistAccess}
            hasTherapistAccess={hasTherapistAccess}
            activeName={activeName}
            matchesTherapistAssignment={matchesTherapistAssignment}
            onClose={() => setShowMonthlyRekap(false)}
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
