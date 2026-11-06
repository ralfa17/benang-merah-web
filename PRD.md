# Product Requirements Document (PRD)
## Klinik Psikologi & Layanan Terpadu Benang Merah

**Versi:** 2.5.0  
**Tanggal:** November 2026  
**Status:** Implemented & Verified (Production Ready)  
**Teknologi:** React 19, Vite, Tailwind CSS v4, Supabase (PostgreSQL & RLS), SheetJS (`xlsx`), docx, PWA Workbox  

---

## 1. Ringkasan Eksekutif & Tujuan Sistem
Website dan portal internal **Klinik Psikologi Benang Merah** dirancang untuk mendigitalkan seluruh siklus alur kerja klinik:
1. **Landing Page Publik:** Profil layanan, katalog psikolog & terapis, FAQ interaktif, serta rute rahasia login tim (`/login` atau `/admin`).
2. **Dashboard Operasional Internal:** Manajemen pendaftaran pasien, pencatatan rekam medis & evaluasi psikologi, kartu perkembangan terapi mandiri, nota kuitansi resmi, presensi & laporan shift admin, serta rekapitulasi data pasien bulanan berformat native spreadsheet `.xlsx`.
3. **Harmonisasi Visual (Warm & Professional Theme):** Desain visual 100% mengacu pada palet resmi Benang Merah (Cream Halus `#FAF8F5`, Maroon `#701A24`/`#6B1D2F`, Light Rose `#F5EBE6`, Dark Charcoal `#1E293B`/`#2C1810`, dan Stone borders). Bebas warna neon.

---

## 2. Struktur Hak Akses & Matriks Kewenangan (Role & Permissions)

| Fitur / Modul | Master IT (Default/Non-Simulasi) | Master IT (Simulasi POV Nakes) | Admin (Fauzan/Admin Lain) | Psikolog (Aska/Sofia) | Terapis (Shima/Silvi/Difa/Eka/Casmi) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Pendaftaran Pasien Baru** | ✅ Akses Penuh | Mengikuti Role Simulasi | ✅ Akses Penuh | ❌ | ❌ (Hanya input sesi lanjutan) |
| **POV Tampilan Pasien** | ✅ Unrestricted (Semua Pasien) | 🔒 **Strict Simulated POV** (100% Persis Nakes) | ✅ Unrestricted (Semua Pasien) | 🔒 **Strict POV** (Hanya Pasien Sendiri) | 🔒 **Strict POV** (Hanya Pasien Ditugaskan) |
| **Isolasi Pasien Lintas Nakes** | Terbuka Penuh | **Dihilangkan Total** (Dilarang Bypass) | Terbuka Penuh | **Dihilangkan Total** (Bukan Blur) | **Dihilangkan Total** (Bukan Blur) |
| **Presensi & Shift Admin** | ✅ Form & Tinjau Semua | ❌ **Disembunyikan Total** | ✅ Form Check-in/out & Handover | ❌ **Disembunyikan Total** | ❌ **Disembunyikan Total** |
| **Rekap Bulanan (.xlsx)** | ✅ Akses Penuh & Unduh | Mengikuti Izin Simulasi | ❌ **Ditiadakan / Disembunyikan** | ✅ Pasien Sendiri (Toggle Download) | ❌ **Ditiadakan / Disembunyikan** |
| **Quick Excel (.xlsx)** | ✅ Semua Pasien | Mengikuti Role Simulasi | ❌ **Ditiadakan Total** | ✅ Pasien Sendiri (+ Terapis PJ) | ✅ Pasien Rujukan Sendiri |
| **Rekam Medis & Diagnosa** | ✅ Akses Penuh | Mengikuti Role Simulasi | ❌ | ✅ Pasien Sendiri | ❌ |
| **Progress Terapi Berkelanjutan** | ✅ Akses Penuh | Mengikuti Role Simulasi | ❌ | ❌ | ✅ Pasien Sendiri |
| **Simulasi Switch View** | ✅ Eksklusif Master | ✅ Tetap Tersedia untuk Ganti Role | ❌ | ❌ | ❌ |
| **Database Backup Snapshot (.json)** | ✅ Eksklusif Master | ❌ (Hanya tampil saat default) | ❌ | ❌ | ❌ |

---

## 3. Rincian Aturan Bisnis & Pembaruan Sistem

### A. Hak Akses Modul Rekap Bulanan (Master & Psikolog Only)
* **Pemberian Hak:** Modul dan opsi "Rekap Bulanan" **HANYA DITAMPILKAN** untuk Role Master dan Role Psikolog.
* **Isolasi Antarmuka:** Modul Rekap Bulanan **ditiadakan dan disembunyikan total** dari antarmuka Role Admin dan Role Terapis.
* **Strict Simulated POV:** Saat Master melakukan simulasi ke Terapis, tombol dan modal Rekap Bulanan otomatis hilang total.

### B. Aturan Rekap Pasien & Quick Excel per Role
* **Role Admin:** Ditiadakan total opsi lihat rekap pasien dan download Excel/CSV, karena Admin berfokus pada operasional pendaftaran dan handover shift, bukan pemegang data klinis langsung.
* **Role Terapis (Shima, Silvi, Difa, Eka, Casmi):** Hanya dapat mengunduh Quick Excel berisi daftar pasien yang **eksklusif dirujuk / ditangani** oleh terapis bersangkutan. Pasien terapis lain dan pasien psikolog tidak ikut ter-download.
* **Role Psikolog (misal: Psikolog Aska):** 
  * Hanya melihat & men-download Quick Excel berisi daftar pasien milik psikolog bersangkutan.
  * Pasien yang dirujuk ke Terapis (misal Terapis Shima) **tetap masuk di rekapan psikolog** dengan kolom wajib: `"Terapis Perujuk / Pendamping"`.
* **Role Master (Ridho):** Memiliki akses mutlak untuk melihat & men-download Quick Excel seluruh data pasien dari semua psikolog dan terapis tanpa batasan.

### C. Akses Khusus Sistem Shift & Presensi Admin (Admin & Master Only)
* **Tujuan:** Sistem Presensi, Handover Shift, dan Laporan Shift khusus diperuntukkan bagi Role Admin (misal: Fauzan) dan Role Master (Ridho, merangkap operasional Admin) guna memperjelas rekapan jam kerja serta penggajian operasional Admin.
* **Isolasi Antarmuka:** Modul dan tombol Laporan Shift **disembunyikan total** dari antarmuka Role Psikolog dan Terapis.
* **Strict Simulated POV:** Saat Master memilih Simulasi POV Psikolog atau Terapis, tombol dan akses Laporan Shift otomatis hilang total dari tampilan layar.

### D. Penghapusan Opsi Kode Promo
* Opsi input "Kode Promo / Voucher" pada form pendaftaran pasien (`PatientForm.jsx`) dan form edit janji (`EditAppointmentModal.jsx`) telah **dihapus total**.
* Kalkulasi total biaya pasien berjalan normal: `Total = Biaya Layanan + Biaya Administrasi + Biaya Overtime (jika ada)`.
* Integritas riwayat transaksi pasien terdahulu yang pernah memanfaatkan promo di bulan sebelumnya tetap terjaga aman (*read-only historical support*).

### E. Harmonisasi Visual 100% Palet Benang Merah (Warm, Light, & Elegant)
* **Pembersihan Total Warna Neon:** Seluruh elemen warna neon (cyan neon, green neon, dark navy slate container) telah dihapus dari seluruh komponen.
* **Palet Warna Resmi:**
  - **Latar Belakang:** Cream Halus / Warm Off-White (`bg-[#FAF8F5]` / `bg-white`).
  - **Aksen Utama & Tombol:** Maroon / Crimson Red / Dark Burgundy (`bg-[#701A24]` / `bg-[#6B1D2F]`, hover: `bg-[#581524]`, teks putih).
  - **Badge Sekunder:** Light Rose / Warm Dust (`bg-[#F5EBE6] text-[#701A24] border border-[#E8D5CE]`).
  - **Tipografi:** Heading `#2C1810` / `#1E293B`, teks sekunder slate-600.
  - **Container & Card:** `bg-white border border-stone-200 shadow-sm rounded-2xl`.
  - **Modal Dialog:** Backdrop `bg-stone-900/40 backdrop-blur-sm`, container `bg-white border border-stone-200 shadow-xl rounded-2xl`.
  - **Tabel Data:**
    - Header: `bg-[#F8F4F0] text-[#6B1D2F] font-semibold text-xs tracking-wider uppercase border-b border-stone-200`.
    - Baris: `hover:bg-[#FAF6F2] transition-colors border-b border-stone-100 text-sm text-slate-700`, padding `px-4 py-3.5`.

### F. Rekap Pasien per Bulan & Ekspor File Native Spreadsheet (`.xlsx` Murni)
* **Komponen:** `src/components/MonthlyRekapModal.jsx` & modul `src/lib/helpers.js`
* **Format Native Excel:** Menggunakan library **SheetJS (`xlsx`)** yang menghasilkan binary OpenXML Spreadsheet murni tanpa peringatan korup.
* **Filter Periode Bulan & Tahun:** Dilengkapi dropdown pemilihan bulan dan tahun sebelum ekspor dilakukan.
* **Toggle Izin Unduh:** Master dapat mengaktifkan/menonaktifkan izin unduh bagi nakes.

---

## 4. Verifikasi Kompilasi & Kualitas Kode
* **Build Command:** `npm run build`
* **Status:** Exit Code 0 (SUKSES 100%, 0 Error).
* **Output:** `dist/assets/index-CN1i9y2O.js` (1,526.84 kB), `dist/assets/index-Ci9Zh9JL.css` (58.41 kB), PWA precache 12 entries.
