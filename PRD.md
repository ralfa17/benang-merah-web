# Product Requirements Document (PRD)
## Klinik Psikologi & Layanan Terpadu Benang Merah

**Versi:** 2.8.0  
**Tanggal:** November 2026  
**Status:** Implemented & Verified (Production Ready)  
**Teknologi:** React 19, Vite, Tailwind CSS v4, Supabase (PostgreSQL & RLS), ExcelJS, SheetJS (`xlsx`), docx, PWA Workbox  

---

## 1. Ringkasan Eksekutif & Tujuan Sistem
Website dan portal internal **Klinik Psikologi Benang Merah** dirancang untuk mendigitalkan seluruh siklus alur kerja klinik:
1. **Landing Page Publik:** Profil layanan, katalog psikolog & terapis, FAQ interaktif, serta rute rahasia login tim (`/login` atau `/admin`).
2. **Dashboard Operasional Internal:** Manajemen pendaftaran pasien, pencatatan rekam medis & evaluasi psikologi, kartu perkembangan terapi mandiri, nota kuitansi resmi, presensi & laporan shift admin, filter tanggal dinamis bulanan & pencarian custom, serta rekapitulasi data pasien bulanan berformat native spreadsheet `.xlsx`.
3. **Harmonisasi Visual (Warm & Professional Theme):** Desain visual 100% mengacu pada palet resmi Benang Merah (Cream Halus `#FAF8F5`, Maroon `#701A24`/`#6B1D2F`, Light Rose `#F5EBE6`, Dark Charcoal `#1E293B`/`#2C1810`, dan Stone borders). Bebas warna neon.

---

## 2. Struktur Hak Akses & Matriks Kewenangan (Role & Permissions)

| Fitur / Modul | Master IT (Default/Non-Simulasi) | Master IT (Simulasi POV Nakes) | Admin (Fauzan/Admin Lain) | Psikolog (Aska/Sofia) | Terapis (Shima/Silvi/Difa/Eka/Casmi) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Pendaftaran Pasien Baru** | ✅ Akses Penuh | Mengikuti Role Simulasi | ✅ Akses Penuh | ❌ | ❌ (Hanya input sesi lanjutan) |
| **POV Tampilan Pasien** | ✅ Unrestricted (Semua Pasien) | 🔒 **Strict Simulated POV** (100% Persis Nakes) | ✅ Unrestricted (Semua Pasien) | 🔒 **Strict POV** (Hanya Pasien Sendiri) | 🔒 **Strict POV** (Hanya Pasien Ditugaskan) |
| **Isolasi Pasien Lintas Nakes** | Terbuka Penuh | **Dihilangkan Total** (Dilarang Bypass) | Terbuka Penuh | **Dihilangkan Total** (Bukan Blur) | **Dihilangkan Total** (Bukan Blur) |
| **Presensi & Shift Admin** | ✅ Form & Tinjau Semua | ❌ **Disembunyikan Total** | ✅ Form Check-in/out & Handover | ❌ **Disembunyikan Total** | ❌ **Disembunyikan Total** |
| **Download Excel Laporan Shift** | ✅ **Eksklusif Master** (.xlsx) | ❌ **Disembunyikan Total** | ❌ **Hanya Lihat Ringkasan** | ❌ **Disembunyikan Total** | ❌ **Disembunyikan Total** |
| **Rekap Bulanan (.xlsx)** | ✅ Akses Penuh & Unduh | Mengikuti Izin Simulasi | ❌ **Ditiadakan / Disembunyikan** | ✅ Pasien Sendiri (Nominal Fee & Pasien) | ❌ **Ditiadakan / Disembunyikan** |
| **Ringkasan Bulanan Psikolog** | ❌ | Mengikuti Role Psikolog | ❌ | ✅ Widget Pendapatan & Pasien | ❌ |
| **Quick Excel (.xlsx)** | ✅ Semua Pasien | Mengikuti Role Simulasi | ❌ **Ditiadakan Total** | ✅ Pasien Sendiri (+ Terapis PJ) | ✅ Pasien Rujukan Sendiri |
| **Breakdown Nominal Excel (3 Bagian)** | ✅ Total + Lunas + Pending | ✅ Total + Lunas + Pending | ❌ | ✅ Total + Lunas + Pending | ✅ Total + Lunas + Pending |
| **Dynamic Monthly Quick Filter** | ✅ Bulan Berjalan / Pilih Bulan | ✅ Bulan Berjalan / Pilih Bulan | ✅ Bulan Berjalan / Pilih Bulan | ✅ Bulan Berjalan / Pilih Bulan | ✅ Bulan Berjalan / Pilih Bulan |
| **Filter & Search Tanggal Custom** | ✅ Tanggal / Rentang | ✅ Tanggal / Rentang | ✅ Tanggal / Rentang | ✅ Tanggal / Rentang | ✅ Tanggal / Rentang |
| **Rekam Medis & Diagnosa** | ✅ Akses Penuh | Mengikuti Role Simulasi | ❌ | ✅ Pasien Sendiri | ❌ |
| **Progress Terapi Berkelanjutan** | ✅ Akses Penuh | Mengikuti Role Simulasi | ❌ | ❌ | ✅ Pasien Sendiri |
| **Simulasi Switch View** | ✅ Eksklusif Master | ✅ Tetap Tersedia untuk Ganti Role | ❌ | ❌ | ❌ |
| **Database Backup Snapshot (.json)** | ✅ Eksklusif Master | ❌ (Hanya tampil saat default) | ❌ | ❌ | ❌ |

---

## 3. Rincian Pembaruan Fitur & Aturan Bisnis

### A. Penambahan Breakdown Nominal di File Excel (.xlsx) Rekap Pasien
* **Ringkasan Rekapitulasi Pembayaran (Summary Block):** Pada seluruh file spreadsheet `.xlsx` rekap pasien (Rekap Keuangan Master, Rekap Konseling Psikolog, Rekap Progress Terapis, dan Laporan Shift Admin), ditambahkan blok ringkasan di bawah tabel yang memecah nominal menjadi 3 bagian:
  1. **TOTAL KESELURUHAN NOMINAL:** Akumulasi seluruh biaya pasien (Status Lunas + Status Pending).
  2. **TOTAL DANA LUNAS:** Akumulasi nominal transaksi khusus yang status pembayarannya telah **SUDAH LUNAS**.
  3. **TOTAL DANA PENDING:** Akumulasi nominal transaksi khusus yang status pembayarannya masih **PENDING / BELUM LUNAS**.
* **Format Currency Rupiah Murni:** Seluruh kolom biaya dan sel ringkasan diformat menggunakan number format OpenXML `"\"Rp\" #,##0"` (contoh tampilan: `Rp 1.500.000`), sehingga rapi, siap pakai, dan tetap bertipe angka numerik untuk pengolahan formula spreadsheet lebih lanjut.
* **Integritas UI Web:** Seluruh tampilan antarmuka (UI/UX) Rekap Pasien pada web dipertahankan 100% utuh tanpa perubahan.
* **Strict POV Compliance:** Kepemilikan data pada file Excel tetap terisolasi ketat sesuai hak akses (Terapis hanya mengunduh data pasiennya sendiri, Psikolog data pasiennya sendiri + catatan nakes pendamping, Master mengunduh seluruhnya).

### B. Fitur Export Excel Laporan Shift Admin (Master Only)
* **Kontrol Hak Akses Ketat (Master Exclusive):** Tombol download Excel pada modul Laporan Shift Admin / Handover (`AdminShiftReport.jsx` & `MasterShiftReview`) **hanya muncul dan dapat diakses oleh Role Master (Ridho)** saat tidak berada dalam simulasi POV nakes (`hasMasterAccess === true`).
* **Proteksi Role Admin & Nakes:** Admin biasa (Fauzan) atau Nakes hanya dapat mengisi form check-in/out, ringkasan shift, dan melihat ringkasan di layar tanpa akses unduh file Excel laporan shift.
* **Format Native Excel (.xlsx) murni via ExcelJS:**
  - Header & Metadata: Nama Petugas Admin, Peran, Tanggal Shift, Label Shift, Jam Check-in, Jam Check-out, dan Ringkasan Aktivitas Operasional.
  - Tabel Pasien Shift: Daftar nama pasien, kategori layanan, nakes penanggung jawab, total bayar (Currency Rupiah), metode pembayaran, serta kolom Status Pembayaran dengan conditional formatting (Background Hijau `#C6EFCE` untuk Lunas, Background Merah `#FFC7CE` untuk Pending).
  - Summary Block Breakdown Nominal (Total Keseluruhan, Dana Lunas, Dana Pending).
  - Tabel Rekapitulasi Metode Transaksi: Rincian total transaksi per metode bayar (QRIS, Transfer BCA, Tunai).

### C. Dynamic Monthly Quick Filter Sesi Terjadwal & Custom Date Search
* **Default Monthly Filter (Bulan Berjalan):**
  - Pada komponen Pilihan Cepat (*Quick Filter*) Sesi Terjadwal (`DateFilterPills.jsx`), daftar tanggal sesi otomatis disaring ke **BULAN BERJALAN saat ini** (contoh: bulan November 2026).
  - Sesi dari bulan sebelumnya (seperti 19 Oktober) secara default otomatis tersaring dari *Quick View* agar antarmuka rapi dan terarah pada periode berjalan.
* **Selector Bulan & Tahun Dinamis:**
  - Dilengkapi dropdown pemilih bulan (*Januari – Desember*) serta opsi *"Semua Bulan"* di header filter toolbar.
  - Saat user memilih bulan tertentu (misal: Oktober), daftar pill sesi terjadwal dan pasien yang tampil langsung otomatis menyesuaikan ke bulan yang dipilih tersebut.
* **Pencarian Tanggal Spesifik & Rentang Waktu (Custom Date Search):**
  - Pengguna dapat mencari tanggal spesifik via *Custom Date Picker* (`type="date"`) atau menentukan *Date Range* (Dari Tanggal s/d Sampai Tanggal).
  - Jika user memilih tanggal di luar bulan berjalan (misal: memilih 19 Oktober 2026), filter dan quick pills otomatis sinkron ke bulan yang dipilih.
  - Tombol *"Reset"* mengembalikan filter ke default Bulan Berjalan saat ini.

### D. Fiksasi Login Admin (Fauzan Hamdani) & Strict Role Verification
* **Autentikasi Ketat:** Tab Admin pada Portal Tim Internal diverifikasi secara ketat. Hanya pengguna dengan role terverifikasi `'admin'` (Fauzan Hamdani) yang dapat masuk.
* **Isolasi Akun Terapis:** Akun Shima Adinda Salsabil dikunci murni sebagai `'terapis'`, mencegah konflik role.
* **Penanganan Error Spesifik:** Jika kredensial salah, password tidak cocok, atau akun bukan admin mencoba masuk via tab Admin, sistem otomatis menolak login (`signOut`), memberikan notifikasi error yang spesifik, dan mengarahkan ke tab role yang tepat.
* **Show/Hide Password (Ikon Mata):** Form login tim dilengkapi ikon mata (`EyeIcon` / `EyeOffIcon`) untuk mempermudah verifikasi sandi tim secara aman.

### E. Laporan Bulanan Psikolog (Nominal Fee & Pasien)
* **Widget Ringkasan Bulanan:** Tampilan dashboard Psikolog dilengkapi kartu ringkasan bulanan interaktif (`PsychologistMonthlySummaryCard.jsx`) yang menyajikan:
  - Selector Bulan & Tahun periode laporan.
  - Total Pasien Konseling terdaftar.
  - Total Nominal / Fee Pendapatan sesi konseling (Rupiah).
  - Rincian status pembayaran (Lunas vs Pending).
  - Pratinjau tabel daftar pasien konseling bulanan.
* **Modal Rekap Bulanan:** Kolom nominal fee dan status pembayaran telah dibuka transparan untuk Psikolog.

### F. Conditional Formatting Background Cell Export Excel (.xlsx)
* **Engine Export:** Menggunakan library **`exceljs`** untuk menghasilkan format OpenXML Spreadsheet murni (.xlsx).
* **Pewarnaan Sel Status Pembayaran:**
  - Status `'lunas'` / `'paid'`: Background sel diwarnai **HIJAU LEMBUT** (`#C6EFCE` / `FFC6EFCE`) dengan teks gelap (`#006100`).
  - Status `'pending'` / `'belum lunas'`: Background sel diwarnai **MERAH LEMBUT** (`#FFC7CE` / `FFFFC7CE`) dengan teks gelap (`#9C0006`).
* **Format Tabel:** Dilengkapi header bertema warm Benang Merah (`#F8F4F0` teks `#701A24`), border sel tipis (`thin border`), format angka nominal ribuan, dan lebar kolom proporsional.

---

## 4. Verifikasi Kompilasi & Kualitas Kode
* **Build Command:** `npm run build`
* **Status:** Exit Code 0 (SUKSES 100%, 0 Error).
* **PWA Workbox Limit:** Dikonfigurasi `maximumFileSizeToCacheInBytes: 4 MiB` pada `vite.config.js` sehingga bundle `2.2 MB` ter-cache dengan sempurna.
