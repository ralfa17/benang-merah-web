// MASTER KODE VOUCHER & NOMINAL DISKON
export const MASTER_VOUCHERS = {
  'OPENING100K': 100000,
  'BENANGMERAH100': 100000
};

// BATAS MAX PEMAKAIAN VOUCHER OPENING
export const MAX_OPENING_VOUCHER_QUOTA = 17;

// MASTER HARGA STANDAR LAYANAN PSIKOLOG
export const SERVICE_PRICES = {
  'Assessment / Intake Interview': 300000,
  'Konseling Individu': 300000,
  'Psikoterapi': 350000,
  'Terapi Anak': 300000,
  'Konseling Pasangan (Couple)': 600000,
  'Konseling Keluarga': 600000,
  'Play and Grow': 250000,
  'Pra Literasi': 250000
};

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
    role: 'CO-TERAPIS ANAK',
    spec: 'Spesialisasi: Pendampingan interaksi positif, Play and Grow, Pra Literasi, stimulasi kemandirian, serta intervensi anak.',
    image: '/shima.jpeg'
  },
  {
    name: 'Silviyah Wulandari',
    role: 'CO-TERAPIS ANAK',
    spec: 'Spesialisasi: Stimulasi kemampuan sensorik, Play and Grow, Pra Literasi, serta kesiapan belajar pra-sekolah anak.',
    image: '/silvi.jpeg'
  },
  {
    name: 'Nadifa A.M',
    role: 'CO-TERAPIS ANAK',
    spec: 'Spesialisasi: Pendampingan stimulasi pemahaman emosi, ekspresi diri positif, Play and Grow, serta Pra Literasi.',
    image: '/difa.jpeg'
  },
  {
    name: 'Eka Zahra Nabila Nakhwa',
    role: 'CO-TERAPIS ANAK',
    spec: 'Spesialisasi: Fasilitasi terapi bermain edukatif (Play and Grow), Pra Literasi, serta pembinaan regulasi emosi.',
    image: '/eka.jpeg'
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
