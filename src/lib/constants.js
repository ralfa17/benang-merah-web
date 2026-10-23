// MASTER KODE VOUCHER & NOMINAL DISKON
export const MASTER_VOUCHERS = {
  'OPENING100K': 100000,
  'BENANGMERAH100': 100000
};

// BATAS MAX PEMAKAIAN VOUCHER OPENING
export const MAX_OPENING_VOUCHER_QUOTA = 17;

// ============================================================
// MASTER HARGA LAYANAN 2026 - PRICELIST RESMI KLINIK BENANG MERAH
// ============================================================

// LAYANAN INDIVIDU (Psikolog)
export const SERVICE_PRICES = {
  // Layanan Individu
  'Konseling Individu (60 Menit)': 300000,
  'Program Psikoterapi': 400000,
  'Couple Counseling (60 Menit)': 650000,
  'Tes IQ Individual (WISC/WAIS)': 850000,
  'Tes Skrining ADHD (DIVA-5)': 500000,
  'Asesmen Tumbuh Kembang Preschool': 300000,

  // Layanan Anak & Terapi Khusus
  'Terapi Anak Spesial': 150000,
  'Kelas Anak Usia Dini (Pra-Literasi)': 500000,
  'Bimbingan Belajar Intensif SD': 600000,
  'Shadow Teacher': 0, // Sesuai Kebutuhan Sekolah (harga custom)

  // Layanan Instansi
  'Psikoedukasi': 1500000,
  'Psikotes Rekrutmen': 300000,
  'Analisis Jabatan Manajerial': 400000,
  'Analisis Jabatan Pimpinan': 700000,
  'Outbound / Forest Therapy': 300000,

  // Legacy/Compatibility (agar data lama tidak rusak)
  'Konseling Individu': 300000,
  'Psikoterapi': 400000,
  'Terapi Anak': 150000,
  'Konseling Pasangan (Couple)': 650000,
  'Konseling Keluarga': 600000,
  'Assessment / Intake Interview': 300000,
  'Pra Literasi': 500000,
  'Play and Grow': 150000
};

// LAYANAN YANG MEMILIKI SISTEM INSENTIF TERAPIS (per 8 sesi/pertemuan)
// Insentif cair tiap genap 8 sesi, pada tanggal 5 bulan berikutnya
export const THERAPIST_INCENTIVE_SERVICES = [
  'Kelas Anak Usia Dini (Pra-Literasi)',
  'Bimbingan Belajar Intensif SD',
  'Pra Literasi' // legacy key
];
export const THERAPIST_INCENTIVE_SESSION_THRESHOLD = 8; // Per berapa sesi insentif cair


// MASTER PETUGAS HANDLE BY ADMIN (MURNI FAUZAN)
export const ADMIN_HANDLERS = ['Fauzan'];

// MASTER METODE PEMBAYARAN RESMI
export const PAYMENT_METHODS = ['QRIS', 'Transfer BCA', 'Cash / Tunai'];

// MASTER DATA PSIKOLOG
export const LIST_PSIKOLOG = [
  {
    id: 'azka',
    label: 'M. Azka Maulana, M.Psi., Psikolog',
    shortName: 'Azka',
    keywords: ['azka', 'maulana']
  },
  {
    id: 'sofia',
    label: 'Sofia Halida Fatma, M.Psi., Psikolog',
    shortName: 'Sofia',
    keywords: ['sofia', 'halida']
  }
];

// Master Rate Card Overtime Sesi Konseling Pasangan
export const OVERTIME_PASANGAN = [
  { label: '1 Sesi (60 Menit)', price: 600000 },
  { label: '1 Jam 15 Menit', price: 750000 },
  { label: '1 Jam 30 Menit', price: 900000 },
  { label: '1 Jam 45 Menit', price: 1050000 },
  { label: '2 Sesi (120 Menit)', price: 1200000 },
  { label: '2 Jam 15 Menit', price: 1350000 },
  { label: '2 Jam 30 Menit', price: 1500000 },
  { label: '2 Jam 45 Menit', price: 1650000 },
  { label: '3 Sesi (180 Menit)', price: 1800000 }
];

// Master Rate Card Overtime Sesi Konseling Asesmen / Individu
export const OVERTIME_ASESMEN = [
  { label: '1 Sesi (60 Menit)', price: 300000 },
  { label: '1 Jam 15 Menit', price: 350000 },
  { label: '1 Jam 30 Menit', price: 450000 },
  { label: '1 Jam 45 Menit', price: 500000 },
  { label: '2 Sesi (120 Menit)', price: 600000 },
  { label: '2 Jam 15 Menit', price: 650000 },
  { label: '2 Jam 30 Menit', price: 800000 },
  { label: '2 Jam 45 Menit', price: 850000 },
  { label: '3 Sesi (180 Menit)', price: 900000 }
];

// Data Layanan Company Profile
export const SERVICES_DATA = [
  {
    title: 'Konseling Individu',
    desc: 'Sesi privat untuk membantu meredakan kecemasan, depresi, manajemen stres, hingga pemulihan trauma bersama psikolog klinis.',
    tags: ['Kecemasan', 'Stres', 'Depresi', 'Self-Growth'],
    type: 'user'
  },
  {
    title: 'Konseling Pasangan & Pernikahan',
    desc: 'Membangun kembali komunikasi yang sehat, menyelesaikan konflik hubungan, serta mempererat ikatan emosional pasangan.',
    tags: ['Komunikasi', 'Konflik Hubungan', 'Pernikahan'],
    type: 'heart'
  },
  {
    title: 'Pengembangan Diri & Karir',
    desc: 'Eksplorasi potensi diri, mengatasi burnout kerja, penyusunan tujuan hidup, dan peningkatan resilience emosional.',
    tags: ['Burnout', 'Karir', 'Confidence', 'Life-Goal'],
    type: 'shield'
  }
];

// Data Tim Psikolog
export const PSYCHOLOGISTS_DATA = [
  {
    name: 'M. Azka Maulana, M.Psi., Psikolog',
    role: 'FOUNDER & PSIKOLOG KLINIS ANAK - REMAJA',
    spec: 'Fokus mendampingi tumbuh kembang anak, pengasuhan remaja, serta asesmen psikologi pendidikan dan perilaku.',
    image: '/azka.jpeg'
  },
  {
    name: 'Sofia Halida Fatma, M.Psi., Psikolog',
    role: 'CO-FOUNDER & PSIKOLOG KLINIS DEWASA',
    spec: 'Ahli dalam konseling kesehatan mental dewasa, manajemen stres & kecemasan, hubungan interpersonal, serta pemulihan trauma.',
    image: '/sofia.jpeg'
  }
];

// Data Tim Terapis
export const THERAPISTS_DATA = [
  {
    name: 'Shima Adinda Salsabil',
    role: 'TERAPIS ANAK',
    spec: 'Spesialisasi: Pendampingan interaksi positif, Play and Grow, Pra Literasi, stimulasi kemandirian, serta intervensi anak.',
    image: '/shima.jpeg'
  },
  {
    name: 'Silviyah Wulandari',
    role: 'TERAPIS ANAK',
    spec: 'Spesialisasi: Stimulasi kemampuan sensorik, Play and Grow, Pra Literasi, serta kesiapan belajar pra-sekolah anak.',
    image: '/silvi.jpeg'
  },
  {
    name: 'Nadifa A.M',
    role: 'TERAPIS ANAK',
    spec: 'Spesialisasi: Pendampingan stimulasi pemahaman emosi, ekspresi diri positif, Play and Grow, serta Pra Literasi.',
    image: '/difa.jpeg'
  },
  {
    name: 'Eka Zahra Nabila Nakhwa',
    role: 'TERAPIS ANAK',
    spec: 'Spesialisasi: Fasilitasi terapi bermain edukatif (Play and Grow), Pra Literasi, serta pembinaan regulasi emosi.',
    image: '/eka.jpeg'
  },
  {
    name: 'Casmi Gustari',
    role: 'TERAPIS ANAK',
    spec: 'Spesialisasi: Pendampingan terapi anak, stimulasi tumbuh kembang, interaksi positif, dan intervensi perilaku anak.',
    image: '/casmi.jpeg'
  }
];

// Tim IT
export const IT_TEAM_DATA = [
  {
    name: 'Ridho Al Fattaah',
    role: 'TIM IT & SISTEM DATA',
    spec: 'Mengelola sistem rekam medis digital yang efisien, aman, dan menjamin 100% kerahasiaan data pribadi klien.',
    image: '/ridho.jpeg'
  }
];

// Tim Creator
export const CREATOR_TEAM_DATA = [
  {
    name: 'Fauzan Hamdani',
    role: 'CONTENT CREATOR & MEDIA',
    spec: 'Merancang dan memproduksi konten kreatif visual serta media edukasi kesehatan mental untuk memperluas edukasi publik.',
    image: '/fauzan.jpeg'
  }
];

// FAQs
export const FAQS_DATA = [
  {
    q: 'Apakah kerahasiaan sesi konseling saya terjamin?',
    a: 'Sangat terjamin. Seluruh sesi konseling berada di bawah naungan Kode Etik Psikologi Indonesia. Informasi dan identitas Anda dijaga ketat 100% rahasia.'
  },
  {
    q: 'Apa perbedaan antara konseling Online dan Offline?',
    a: 'Sesi Online dilakukan via Google Meet/Zoom dari lokasi mana pun Anda berada. Sesi Offline dilakukan di klinik kami dengan suasana privat yang tenang dan nyaman.'
  },
  {
    q: 'Berapa lama durasi untuk satu kali sesi?',
    a: 'Satu sesi konseling standar berlangsung selama 60 menit, mencakup eksplorasi masalah, asesmen awal, dan diskusi langkah pemulihan.'
  }
];
