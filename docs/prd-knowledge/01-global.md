# 01 - Global dan Fitur Pendukung (mockup final v2.14.4)

Dokumen pengetahuan untuk agen pembuat PRD. Sumber kebenaran: kode di `/Users/dionscholus/Documents/claude/Paydia/dashboard CLRM` (React + Vite + TS, hash routing). Bila panduan halaman (`src/guides/*.ts`), `README.md`, atau `docs/*.md` berbeda dari kode, kode menang dan selisih dicatat. Semua path file relatif terhadap root project.

Ruang lingkup dokumen ini: server login gate, sesi, layout (header, sidebar, routing), peran dan permission, pusat notifikasi, perilaku umum kit (dipakai 10 halaman berbasis kit), Approval, Admin, Log, Master Data, Profile (Ganti Password dan Ganti PIN), Versi/changelog, Import, dan perilaku penyimpanan lokal. Halaman modul (Tracker, Reporting, dll.) ada di dokumen lain.

## 0. Temuan penting sebelum membaca (ringkas)

1. TIDAK ADA login, 2FA, dan Reset Password di dalam aplikasi. Yang ada hanya SATU gate password di server (satu password bersama, bukan per akun). Setelah lolos gate, aplikasi langsung membuka dashboard sebagai akun aktif pertama (Super Admin). Ganti peran dilakukan lewat pilihan "Akun demo" di header. Padahal keputusan final menyebut Login, 2FA, Reset Password sebagai fitur pendukung. Lihat bagian 1, 2, dan 15.
2. Hak akses efektif dihitung PER KATEGORI (Compliance, Risk, Fraud, Legal, Approval, Master Data, Log, Admin), bukan per halaman. Matriks per halaman di `src/kit/perms.ts` hanya dipakai untuk menurunkan daftar izin awal akun. Lihat bagian 4.
3. Aksi "Batalkan/Kembalikan" mengikuti izin "Update" kategori (bukan hanya Head CLRM). Pada izin bawaan, peran yang punya "Update" di kategori itu bisa membatalkan. Lihat bagian 4.3.
4. Master Data memakai HAPUS PERMANEN dari daftar (tombol Hapus), dan label menu "Unit Kerja" (bukan "Departemen"). Master "Laporan" ada tetapi tidak dipakai form mana pun. Lihat bagian 10.
5. Log hanya mencatat sebagian aksi secara langsung (live). Banyak jenis aksi di panduan Log (login, 2FA, lihat detail, upload file, buka sensor, buka notifikasi) hanya ada di data contoh, tidak dicatat saat dipakai. Lihat bagian 9.
6. Import Excel disembunyikan di semua halaman (flag `SHOW_IMPORT = false`), tetapi kode import masih ada. Lihat bagian 12.

---

## 1. Server login gate (di luar aplikasi React)

- Menu: tidak ada. Berupa halaman terpisah `/login.html` dan fungsi server.
- Ringkasan: seluruh situs dikunci dengan satu password bersama sebelum aplikasi dimuat. Bukan sistem login per pengguna.
- Prasyarat akses: siapa pun yang tahu password. Tidak ada email, tidak ada akun, tidak ada 2FA.

### 1.1 Middleware (`middleware.js:1-30`)
- Berlaku untuk semua path kecuali path yang diawali `/_vercel/` (matcher `'/((?!_vercel/).*)'`).
- Path publik (tanpa cookie): `/login.html`, `/login.js`, `/login.css`, `/api/login`, `/api/logout`, `/favicon.svg`.
- Path lain wajib punya cookie `clrm_auth` yang valid. Bila tidak valid: redirect 302 ke `/login.html`.
- Bila env `AUTH_SECRET` belum diset: respons 500 dengan teks "AUTH_SECRET belum diset".
- Validasi cookie: format `<expiryMs>.<hex HMAC-SHA256(expiryMs, AUTH_SECRET)>`. Ditolak bila format salah, sudah kedaluwarsa (expiry < sekarang), atau tanda tangan tidak sama (perbandingan constant-time).

### 1.2 Endpoint login (`api/login.js:1-36`)
- Hanya metode POST (metode lain: 405). Body JSON `{ password }`.
- Bila env `MOCKUP_PASSWORD` atau `AUTH_SECRET` kosong: 500 `{ error: 'Env belum diset' }`.
- Password dibandingkan dengan `MOCKUP_PASSWORD` (hash SHA-256 lalu `timingSafeEqual`). Password tidak ada di repo.
- Rate limit: maksimal 5 percobaan gagal per IP (dari `x-forwarded-for`) per jendela 15 menit. Setelah itu respons 429 `{ error: 'Terlalu banyak percobaan' }` dengan header `Retry-After` (detik). Penghitung di memori per instance serverless (reset saat cold start, tidak dibagi antar instance). Penghitung dihapus setelah login sukses.
- Password salah: tunda 500 ms, respons 401 `{ error: 'Salah' }`, hitung gagal +1.
- Sukses: set cookie `clrm_auth=<exp>.<sig>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400` (24 jam), respons 200 `{ ok: true }`.

### 1.3 Endpoint logout (`api/logout.js:1-4`)
- Menghapus cookie (`Max-Age=0`), respons 200 `{ ok: true }`.

### 1.4 Halaman login (`public/login.html`, `login.js`, `login.css`)
- Isi halaman: HANYA satu kolom input password di tengah layar (lebar 280 px). Tidak ada judul, label teks, tombol, logo, atau tautan "Lupa password". Atribut `aria-label` kosong dan `<title>` kosong.
- Submit lewat tombol Enter. Saat memproses: input dinonaktifkan dan muncul spinner di bawahnya.
- Sukses: pindah ke `/` (aplikasi).
- Gagal (status apa pun selain OK, termasuk 429 dan error jaringan): input diberi border merah dan bergetar singkat, isi dipilih ulang, fokus kembali. Tidak ada pesan teks kesalahan. Ketik ulang menghapus tanda merah.

### 1.5 Header keamanan (`vercel.json`)
- Content-Security-Policy (`default-src 'self'` dst.), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (kamera, mikrofon, geolokasi, payment dimatikan), HSTS 2 tahun.

### 1.6 Kondisi khusus
- Gate hanya aktif saat dijalankan di Vercel atau `vercel dev` (karena `middleware.js`). Di `npm run dev` lokal tidak ada gate (README).
- Env yang wajib: `MOCKUP_PASSWORD`, `AUTH_SECRET`.

### 1.7 Selisih dengan keputusan final
- Keputusan: fitur pendukung "Login, 2FA, Reset Password, Logout". Mockup: hanya gate password tunggal + logout. Tidak ada 2FA, tidak ada reset password, tidak ada login per akun, tidak ada halaman error teks. Dicatat saja.

---

## 2. Sesi aplikasi, "login", 2FA, reset password, logout di dalam aplikasi

### 2.1 Sesi (`src/kit/store.tsx:20-22, 91-101`, `src/App.tsx:104-111`)
- Sesi disimpan di `localStorage` kunci `clrm.session` bentuk `{ accountId, verified2fa }`.
- Saat aplikasi dimuat: bila tidak ada sesi sah (`verified2fa` benar DAN akun ada DAN status akun `Active`), aplikasi otomatis membuat sesi untuk akun pertama yang berstatus `Active` di daftar akun (seed: Super Admin). Komentar kode: "gate server sudah cukup; tanpa sesi, langsung masuk sebagai akun aktif pertama".
- Akibat: tidak ada layar login/2FA di aplikasi. Field `verified2fa` selalu `true`.

### 2.2 Ada/tidak
| Fitur (keputusan) | Status di mockup |
| --- | --- |
| Login per akun (email + password) | TIDAK ADA di aplikasi. Hanya gate password bersama (bagian 1). |
| 2FA (PIN) | TIDAK ADA layar. PIN akun disimpan dan hanya bisa diganti lewat Ganti PIN (bagian 11). Data contoh Log memuat baris `2fa-verify` dan `login-failed`, tetapi tidak dibuat saat dipakai. |
| Reset Password | TIDAK ADA. |
| Logout | ADA, lewat menu avatar (bagian 3.1). |
| Ganti Password, Ganti PIN | ADA (bagian 11). |

### 2.3 Logout (`src/kit/store.tsx:117`)
- Urutan: catat Log (container `clrm-auth`, type `logout`), hapus sesi lokal, panggil POST `/api/logout`, lalu pindah ke `/login.html`.
- Karena sesi lokal otomatis dibuat ulang untuk akun aktif pertama, setelah login gate lagi aplikasi selalu mulai sebagai Super Admin, bukan akun demo terakhir (perilaku sampingan).

### 2.4 Pilihan "Akun demo" (pengganti login per peran)
Lihat bagian 3.2 untuk aturan lengkap.

### 2.5 Selisih dengan keputusan final
- Login, 2FA, Reset Password tidak diimplementasi sebagai alur aplikasi. Hanya logout, ganti password, ganti PIN.

---

## 3. Layout aplikasi: header, sidebar, routing

Sumber: `src/App.tsx`.

### 3.1 Header (tinggi 56 px, biru `#1f2ab5`, sticky)
Urutan elemen dari kiri ke kanan:
1. Teks logo "paydia".
2. Tombol ikon menu (aria-label "Menu"): buka/tutup sidebar. Di layar < 768 px sidebar awalnya tertutup dan muncul sebagai overlay; di >= 768 px awalnya terbuka. Pindah rute di layar kecil menutup sidebar.
3. Pilihan "Akun demo" (lihat 3.2).
4. Lonceng notifikasi (lihat bagian 5).
5. Pemilih versi (lihat 3.3 dan bagian 13).
6. Tombol reset data contoh (ikon putar, tooltip "Reset data contoh"): konfirmasi browser "Kembalikan semua data ke data contoh awal?". Bila OK: hapus `clrm.db.v9` dan `clrm.app.v18` dari localStorage lalu reload. Kunci `clrm.session` dan `clrm.notif.v1` TIDAK dihapus.
7. Menu avatar (huruf pertama nama + nama di layar >= 768 px): isi "Ganti Password" (ke `#/profil/password`), "Ganti PIN" (ke `#/profil/pin`), "Logout".

### 3.2 Pilihan "Akun demo" (aria-label "Akun demo")
- Teks opsi: `Akun demo: {nama} ({peran})`.
- Isi daftar: SEMUA akun berstatus `Active` (termasuk admin baru dari tombol Add di Admin, sejak v2.14.4). Akun berstatus Inactive, Archive, Suspend TIDAK muncul. Akun yang sedang dipakai selalu muncul walau status bukan Active.
- Ganti akun: tanpa password/PIN. Mencatat Log: modul "Sesi", aksi "Ganti akun demo", keterangan `{nama lama} -> {nama baru}` (container `clrm-auth`, type `switch-account`). Seluruh hak akses, sidebar, notifikasi langsung berubah mengikuti akun baru.
- Seed (12 akun, sandi bawaan `Paydia123!`, PIN `123456`): lihat 4.1. Akun Active ada 9, sehingga daftar demo berisi 9 akun.

### 3.3 Pemilih versi
- Tombol "v{versi terbaru}" (saat ini v2.14.4, teks hanya ikon di layar kecil). Isi dropdown: semua entri `src/versions.ts` (54 versi, terbaru di atas) dengan label "Latest" (entri pertama), "Deployed" (bila `deployed`), tanggal, judul, "Prompt: ...", "~Nk token", daftar perubahan. Ini fitur khusus mockup (riwayat pengerjaan), bukan fitur produk.

### 3.4 Sidebar (lebar 216 px)
- Blok profil: huruf pertama nama, nama, email akun aktif.
- Label "Menu".
- Urutan menu (`App.tsx:200-208`):
  1. Grup **Compliance**: Regulatory Findings Tracker, Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol.
  2. Grup **Risk**: Risk Register, Kajian Risiko.
  3. Grup **Fraud**: Fraud Case Monitoring.
  4. Grup **Legal**: Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum.
  5. Garis pemisah.
  6. **Approval** (satu item, bukan grup) dengan badge merah angka bila ada pengajuan menunggu yang boleh diputuskan akun ini (lihat 7.1).
  7. Grup **Master Data** dengan 11 sub-menu: Laporan, PIC, Kategori Regulasi, Unit Kerja, Produk, Mitra Vendor, Kategori Pelapor, Media Pelapor, Jenis PKS Kontrak, Instansi Pengirim APH, Kategori Dokumen Perizinan.
  8. **Admin** (satu halaman: tabel akun + Manage Permissions; dulu dua sub-menu Akun dan Permission).
  9. **Log**.
- Ganti Password dan Ganti PIN TIDAK ada di sidebar; hanya lewat menu avatar.
- Grup bisa dilipat/dibuka (klik judul grup). Status lipat tidak disimpan.
- Kondisi tampil item/grup: item hanya tampil bila akun punya izin "Lihat" (kategori `view`) untuk halaman itu (lihat bagian 4). Grup yang semua itemnya tersembunyi ikut hilang. Approval, Admin, Log mengikuti kategori masing-masing. Master Data mengikuti kategori Master Data.
- Item aktif diberi latar biru muda.

### 3.5 Breadcrumb dan judul
- Di atas konten: `home / {grup} / {nama halaman}` (grup kosong untuk Approval, Admin, Log, Ganti Password, Ganti PIN).
- Judul halaman `h1` = nama menu. Di samping judul: tombol "Panduan Halaman" (bila halaman punya isi panduan; lihat 6.12). Di kanan judul: slot tombol aksi halaman (dipakai Admin untuk "Refresh Permissions" dan "Add").

### 3.6 Routing (hash)
Route (bagian setelah `#/`):
- `compliance/regulatory-findings-tracker` (rute bawaan bila hash kosong), `compliance/regulatory-reporting`, `compliance/regulatory-change`, `compliance/sop-dokumen-kontrol`
- `risk/risk-register`, `risk/kajian-risiko`
- `fraud/fraud-case-monitoring`
- `legal/kontrak`, `legal/permintaan-aph`, `legal/perizinan`, `legal/layanan-hukum`
- `approval` (parameter `?id=<id pengajuan>` membuka Detail pengajuan itu)
- `master/laporan`, `master/pic`, `master/kategori-regulasi`, `master/unit-kerja`, `master/produk`, `master/mitra-vendor`, `master/kategori-pelapor`, `master/media-pelapor`, `master/jenis-pks-kontrak`, `master/instansi-pengirim-aph`, `master/kategori-dokumen-perizinan`
- `admin`, `log`, `profil/password`, `profil/pin`

Redirect/alias (kompatibilitas tautan lama, `App.tsx:62-65`):
- `master/mitra` dialihkan ke `master/mitra-vendor`.
- `admin/akun` dan `admin/permission` dialihkan ke `admin`.
- Parameter `?open=<id data>` pada rute modul (dari klik notifikasi) membuka modal Detail data itu lalu parameter dihapus dari URL.

Halaman khusus:
- Rute tidak dikenal: kartu teks "Halaman tidak ditemukan".
- Rute dikenal tetapi akun tidak punya izin "Lihat": kartu teks "Anda tidak memiliki akses ke halaman ini". Catatan: Ganti Password/Ganti PIN dihitung memakai izin "Lihat" kategori Approval (`perm: 'approval'`), jadi bila izin Approval-View dicabut dari akun, akun itu tidak bisa membuka Ganti Password/PIN.

### 3.7 Kondisi khusus
- Sidebar mobile: overlay gelap menutup sidebar saat diklik.
- Tombol reset dan pemilih versi adalah alat mockup, bukan fitur produk.

---

## 4. Peran dan permission

Sumber: `src/kit/perms.ts`, `src/kit/store.tsx` (hook `can`), `src/kit/types.ts`.

### 4.1 Daftar peran (9) dan akun seed
| Peran | Akun seed (status) | Departemen akun |
| --- | --- | --- |
| Super Admin | Super Admin, admin@paydia.id (Active) | Information Technology |
| Head CLRM | Dewi Anggraini (Active) | Compliance Legal & Risk Management |
| Compliance Officer | Rina Kartika (Active); Arief Nugraha (Suspend) | Compliance Legal & Risk Management |
| Risk Officer | Rudi Hartono (Active); Citra Dewi (Archive) | Compliance Legal & Risk Management |
| Legal Officer | Lina Marlina (Active) | Compliance Legal & Risk Management |
| Fraud Investigator | Fakhri (Active); Bima Prakoso (Inactive) | Operation |
| Ketua SMKI | Yusuf Hakim (Active) | Information Technology |
| PIC | Regie (Active) | Business |
| Viewer | Tono Santoso (Active) | Finance, Accounting, Tax & Treasury |
Email seed `{nama huruf kecil titik}@paydia.id` (kecuali Super Admin = admin@paydia.id). Password awal `Paydia123!`, PIN `123456`. Tiap akun punya `permissions` (daftar id izin) yang diturunkan dari peran lewat `permsOf` saat seed.

### 4.2 Katalog izin per kategori (`PERM_CATEGORIES`)
Izin berbentuk `{kategori}.{aksi}`. Label aksi di layar: View, Create, Update, Export, Approve, Dashboard.

| Kategori (label) | Halaman di dalamnya | Aksi yang tersedia |
| --- | --- | --- |
| Compliance | Regulatory Findings Tracker, Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol | view, create, update, export, approve, dashboard |
| Risk | Risk Register, Kajian Risiko | view, create, update, export, approve, dashboard |
| Fraud | Fraud Case Monitoring | view, create, update, export, approve, dashboard |
| Legal | Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum | view, create, update, export, dashboard (tidak ada approve) |
| Approval | Approval | view, update, approve |
| Master Data | 11 daftar master | view, create, update |
| Log | Log | view, update, export |
| Admin | Admin | view, create, update |

Total id izin: 6+6+6+5+3+3+3+3 = 35.

Pemetaan aksi izin ke aksi di kode (`ACTION_OF`): View = Lihat; Create = Tambah; Update = Ubah DAN Cancel (edit sekaligus batalkan/kembalikan/hapus master); Export = Export; Approve = Approve; Dashboard = tab Dashboard. Aksi "Import" tidak punya izin: selalu tidak diizinkan (tombol Import disembunyikan, lihat bagian 12).

### 4.3 Cara kerja efektif (PENTING)
- Hook `can(halaman, aksi)` selalu memakai `permissions` milik akun aktif (`canAccount`), karena semua akun punya daftar izin. Matriks per halaman (`DEFAULT_PERMS`) tidak dipakai langsung untuk keputusan UI kecuali di dua tempat: penurunan izin awal akun (`permsOf`) dan pusat notifikasi (lihat 5.4).
- Izin berlaku untuk SELURUH halaman dalam satu kategori. Contoh: Compliance Officer punya `compliance.create`, jadi tombol Tambah muncul di Tracker, Reporting, Regulatory Change, dan SOP. Head CLRM punya `compliance.update`, jadi punya Edit sekaligus Batalkan/Kembalikan di keempat halaman Compliance (tetap tunduk pada aturan baris per halaman, mis. PIC hanya miliknya sendiri).
- Penurunan izin awal (`grants`): kategori memberi aksi bila SALAH SATU halaman di kategori itu memberi salah satu aksi lama yang dipetakan di matriks bawaan. Dashboard = punya "Lihat" di salah satu halaman kategori. Khusus Approval-Update = peran punya "Approve" di salah satu halaman.
- Super Admin: semua id izin (35), tidak bisa diubah (kotak dikunci di Admin) dan "Refresh Permissions" mengembalikannya ke semua izin.

### 4.4 Matriks bawaan per halaman (sumber penurunan, `build()` di `perms.ts:21-45`)
Aturan penyusun:
- Semua peran selain Super Admin: "Lihat" dan "Export" pada 11 halaman modul. "Lihat" pada Approval dan Master Data.
- Tambah (dan Import) bawaan: Tracker, Reporting, Regulatory Change = Compliance Officer; SOP = Compliance Officer, PIC; Risk Register = Risk Officer, PIC; Kajian Risiko = Risk Officer; Fraud = Fraud Investigator, Compliance Officer; Kontrak, Permintaan APH, Perizinan = Legal Officer; Layanan Hukum = Legal Officer, PIC.
- Ubah bawaan: Tracker, Reporting, Regulatory Change, SOP = Compliance Officer, PIC; Risk Register = Risk Officer, PIC; Kajian Risiko = Risk Officer, PIC; Fraud = Fraud Investigator, Compliance Officer, PIC; Kontrak, APH, Perizinan = Legal Officer, PIC; Layanan Hukum = Legal Officer.
- Cancel (Batalkan/Kembalikan) di matriks halaman: hanya Head CLRM. (Efektif lain, lihat 4.3.)
- Approve bawaan: Tracker = Head CLRM; Fraud = Head CLRM; Regulatory Change = Ketua SMKI; Risk Register = Risk Officer.
- Approval: Lihat semua peran; Approve untuk peran yang punya Approve di salah satu modul (Head CLRM, Ketua SMKI, Risk Officer).
- Master Data: Lihat semua; Tambah dan Ubah hanya Head CLRM.
- Admin: tidak ada untuk semua peran kecuali Super Admin.
- Log: Lihat dan Export hanya Head CLRM.

### 4.5 Izin efektif bawaan per peran (hasil `permsOf`, id izin)
| Peran | Izin akun |
| --- | --- |
| Super Admin | semua 35 |
| Head CLRM | compliance.{view,update,export,approve,dashboard}; risk.{view,update,export,dashboard}; fraud.{view,update,export,approve,dashboard}; legal.{view,update,export,dashboard}; approval.{view,update,approve}; master.{view,create,update}; log.{view,export} |
| Compliance Officer | compliance.{view,create,update,export,dashboard}; risk.{view,export,dashboard}; fraud.{view,create,update,export,dashboard}; legal.{view,export,dashboard}; approval.view; master.view |
| Risk Officer | compliance.{view,export,dashboard}; risk.{view,create,update,export,approve,dashboard}; fraud.{view,export,dashboard}; legal.{view,export,dashboard}; approval.{view,update,approve}; master.view |
| Legal Officer | compliance.{view,export,dashboard}; risk.{view,export,dashboard}; fraud.{view,export,dashboard}; legal.{view,create,update,export,dashboard}; approval.view; master.view |
| Fraud Investigator | compliance.{view,export,dashboard}; risk.{view,export,dashboard}; fraud.{view,create,update,export,dashboard}; legal.{view,export,dashboard}; approval.view; master.view |
| Ketua SMKI | compliance.{view,export,approve,dashboard}; risk.{view,export,dashboard}; fraud.{view,export,dashboard}; legal.{view,export,dashboard}; approval.{view,update,approve}; master.view |
| PIC | compliance.{view,create,update,export,dashboard}; risk.{view,create,update,export,dashboard}; fraud.{view,update,export,dashboard}; legal.{view,create,update,export,dashboard}; approval.view; master.view |
| Viewer | compliance.{view,export,dashboard}; risk.{view,export,dashboard}; fraud.{view,export,dashboard}; legal.{view,export,dashboard}; approval.view; master.view |

### 4.6 Matriks ringkas per peran (efektif, tingkat kategori)
Kolom: Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Buka sensor. "Buka sensor" tidak diatur izin; ditentukan per field di halaman modul (`Field.reveal`, lihat 6.9) dan di keputusan final berlaku untuk semua peran yang punya akses halaman Fraud. Catatan "milik sendiri" untuk PIC diatur per halaman (dokumen modul).

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export |
| --- | --- | --- | --- | --- | --- | --- |
| Super Admin | semua halaman | semua | semua | semua | semua | semua |
| Head CLRM | semua modul, Approval, Master, Log | tidak (kecuali Master Data) | semua modul (kategori Update) | semua modul | Tracker, Fraud; Approval | semua modul, Log |
| Compliance Officer | semua modul | Compliance (4 halaman), Fraud | Compliance, Fraud | Compliance, Fraud (karena Update) | tidak | semua modul |
| Risk Officer | semua modul | Risk (2 halaman) | Risk | Risk | Risk Register (perubahan level); Approval | semua modul |
| Legal Officer | semua modul | Legal (4 halaman) | Legal | Legal | tidak | semua modul |
| Fraud Investigator | semua modul | Fraud | Fraud | Fraud | tidak | semua modul |
| Ketua SMKI | semua modul | tidak | tidak | tidak | Regulatory Change (kategori Compliance, tetapi hanya pengajuan yang approver-nya Ketua SMKI); Approval | semua modul |
| PIC | semua modul | Compliance, Risk, Legal (izin Create kategori; Fraud tidak) | Compliance, Risk, Fraud, Legal (tunduk aturan baris: milik sendiri) | Compliance, Risk, Fraud, Legal (karena Update) | tidak | semua modul |
| Viewer | semua modul | tidak | tidak | tidak | tidak | semua modul |

Catatan matriks:
- Karena izin per kategori, PIC bisa Tambah di Tracker/Reporting/Regulatory Change walau matriks halaman hanya memberi Tambah di SOP, Risk Register, Layanan Hukum. Pembatasan lebih halus (mis. PIC hanya mengedit datanya sendiri) dilakukan lewat `canEditRow`/`editableBy` per halaman. Lihat dokumen modul.
- Tab Dashboard hanya tampil bila akun punya izin Dashboard kategori itu (semua peran bawaan punya).
- Tracker memakai peran sesi yang dipetakan (`App.tsx:58`): Head CLRM dan Super Admin menjadi "Head CLRM", Compliance Officer tetap, PIC tetap, semua peran lain menjadi "Viewer" untuk logika Drawer Tracker.

### 4.7 Override per akun (sejak v2.14, Admin > Manage Permissions)
- Setiap akun menyimpan daftar `permissions` sendiri. Admin dengan izin Admin-Update mengubahnya lewat modal Edit (bagian 8). Perubahan langsung berlaku untuk akun itu (sidebar, tombol, tab) tanpa kode peran.
- Peran akun tidak berubah ketika izin diubah. Peran dipakai untuk: identitas approver pada pengajuan (approver harus sama dengan peran akun, atau Super Admin), penerima notifikasi (5.3), tampilan teks "Akun demo".
- Admin baru dari tombol Add selalu berperan "Viewer" dengan izin sesuai centang saja.
- "Refresh Permissions": menyegarkan semua akun ke katalog (buang id izin yang tidak ada lagi; Super Admin diisi penuh).

### 4.8 Selisih dengan keputusan final
- Keputusan menyebut "atur permission" per akun: ADA (granularitas kategori x aksi, bukan per halaman).
- Keputusan: Batalkan wajib alasan, tidak dihapus permanen; mockup menyamakan izin Batalkan dengan Update (bukan izin terpisah).

---

## 5. Pusat notifikasi (lonceng)

Sumber: `src/kit/notify.tsx`.

### 5.1 Lonceng di header
- Tombol ikon lonceng (tooltip "Notifikasi", aria-label "Notifikasi, {n} belum dibaca"). Badge merah angka belum dibaca bila > 0 (maksimal tampil "99+").
- Klik membuka panel (lebar 400 px, tinggi maksimal 75% layar, di layar kecil menempel kanan). Klik di luar menutup.
- Judul panel "Notifikasi" ditambah " ({n} belum dibaca)" bila ada. Tombol "Tandai semua dibaca" (nonaktif bila tidak ada yang belum dibaca).
- Daftar kosong: "Tidak ada notifikasi".
- Tiap item: ikon (merah bulat-seru untuk merah, segitiga kuning untuk kuning), garis kiri berwarna, judul (tebal bila belum dibaca) dengan titik biru "Belum dibaca", pesan, dan baris kecil `{nama halaman} · {referensi data} · {waktu pertama muncul DD/MM/YYYY HH:mm}`. Item belum dibaca berlatar biru muda.
- Klik item: tandai dibaca, tutup panel, pindah ke `#/{route halaman}?open={id data}`. Halaman tujuan membuka modal Detail data itu.

### 5.2 Sumber dan perhitungan
- Notifikasi TIDAK disimpan. Dihitung ulang dari data dan aturan alert tiap halaman (`AlertDef.check`) setiap data berubah. Alert yang kondisinya sudah tidak berlaku otomatis hilang.
- Sumber: Tracker (`alertsFor` di `src/lib.ts`) dan 10 halaman kit: Reporting, Regulatory Change, SOP, Risk Register, Kajian Risiko, Fraud, Kontrak, Permintaan APH, Perizinan, Layanan Hukum.
- Data berstatus Dibatalkan (punya `cancelled`) tidak memicu notifikasi. Untuk Tracker, hanya temuan yang belum Selesai/Dibatalkan.
- Id notifikasi: `{modul}:{id data}:{key alert}`. Warna: `red` atau `yellow` dari hasil alert.
- Hanya semua alert yang punya tujuan (`to`) ke akun aktif yang tampil (5.3). Tidak ada email dan tidak ada Telegram.

### 5.3 Penerima (`isRecipient`, `notify.tsx:148-158`)
- **Super Admin melihat SEMUA notifikasi** (pengawas), termasuk yang ditujukan ke penerima tanpa akun (Direksi, CISO, Direktur terkait).
- Peran lain: item tampil bila salah satu token `to` cocok:
  - token sama dengan peran akun (mis. `Head CLRM`, `Compliance Officer`, `Risk Officer`, `Legal Officer`, `Fraud Investigator`);
  - `PIC (Nama)`: akun yang namanya sama (tanpa beda huruf besar/kecil) dengan Nama itu. Ini bentuk `toPic(r)` per data;
  - `PIC`, `PIC Dokumen`, atau `PIC unit terdampak`: semua akun berperan PIC;
  - `Risk Owner (Departemen)`: akun yang `departemen`-nya sama dengan nama itu (apa pun perannya).
- Token `Direksi`, `CISO`, `Direktur terkait` tidak cocok akun mana pun, jadi hanya terlihat oleh Super Admin.
- Tampil hanya bila peran akun punya "Lihat" halaman sumber, memakai MATRIKS PERAN bawaan di store (`store.perms`), bukan izin per akun hasil Manage Permissions. Artinya mencabut izin View satu akun lewat Admin tidak menyembunyikan notifikasi dari halaman itu (selisih perilaku). [tidak pasti: apakah ini disengaja]

### 5.4 Status baca dan urutan
- Disimpan di `localStorage` kunci `clrm.notif.v1`, per id akun: `{ read: [id...], seen: { id: waktu pertama muncul } }`.
- "Waktu pertama muncul" = waktu notifikasi pertama kali terhitung di browser itu (bukan tanggal pemicu). Dibersihkan untuk id yang sudah tidak aktif.
- Urutan daftar: waktu pertama muncul terbaru dulu; lalu Merah sebelum Kuning; lalu urut abjad referensi.
- "Tandai semua dibaca" menandai semua notifikasi yang sedang aktif.
- Reset data contoh tidak menghapus `clrm.notif.v1`.

### 5.5 Teks judul dan pesan per jenis alert
Judul dibentuk dari label alert halaman (supaya sama dengan label di Detail). Pola: `nearTitle(kata benda)` = bila detail diawali "H-0 " atau "0 hari" maka judul "{kata benda} jatuh tempo hari ini", selain itu "{kata benda} {label huruf kecil awal}"; `withNoun` = "{kata benda} {label huruf kecil awal}"; `sameLabel` = judul sama persis dengan label. Frasa waktu: "0 hari lagi/lalu" menjadi "hari ini", "1 hari lagi" menjadi "besok", "1 hari lalu" menjadi "kemarin".

| Kunci alert | Judul | Pola pesan (S = subjek data) |
| --- | --- | --- |
| tracker.near | nearTitle("Temuan"): "Temuan mendekati batas waktu" atau "Temuan jatuh tempo hari ini" | "{S} jatuh tempo {n hari lagi / hari ini}. Segera selesaikan tindak lanjutnya." |
| tracker.overdue | "Temuan lewat batas waktu" | "{S} melewati batas waktu {n hari}. Segera tindak lanjuti." |
| tracker.stale | "Menunggu validasi terlalu lama" | "{S} menunggu validasi ulang selama {n hari} (batas 7 hari). Segera validasi." |
| reporting.near | "Laporan mendekati batas waktu" / "Laporan jatuh tempo hari ini" | "{Laporan X (periode P)} belum terkirim. Batas waktu {tanggal} ({hari ini/besok/n hari lagi}). Siapkan dan kirim tepat waktu." |
| reporting.late | "Laporan lewat batas waktu" | "{Laporan} belum terkirim dan terlambat {n} hari dari batas waktu. Segera kirim dan isi alasan keterlambatan." |
| reporting.siber | label alert | "Insiden siber "{nama}" terjadi pada {waktu}. Notifikasi awal: {status}. Laporan lengkap: {status}." |
| reporting.nobukti | "Laporan terkirim tanpa bukti" | "{Laporan} berstatus Terkirim, tetapi file bukti dan nomor tanda terima belum diisi. Lengkapi bukti pengiriman." |
| regchange.unrated | "Peraturan belum dinilai lebih dari 10 hari kerja" | "{S} belum dinilai dampaknya, sudah {d}. Segera lakukan penilaian dampak." |
| regchange.effective | "Peraturan akan berlaku, kepatuhan belum terpenuhi" | "{S} berlaku {tanggal}, tetapi status kepatuhan masih {status}. Percepat pemenuhan sebelum tanggal berlaku." |
| regchange.reply | label alert | "{S}: batas jawaban {..} / batas jawaban sudah lewat {..}. Segera siapkan jawaban. / Segera kirim jawaban." |
| regchange.sop | label alert | "{S} dicabut sejak {tanggal}. Ada {n} SOP terkait yang perlu diperbarui. Perbarui SOP tersebut, lalu hapus dari daftar SOP terkait pada peraturan ini." |
| regchange.high | label alert | "{S} berdampak {tingkat}, dicatat {..}. Perlu perhatian segera." |
| sop.due | "Peninjauan SOP jatuh tempo hari ini" atau label dengan "Peninjauan SOP" | "{S} perlu ditinjau sebelum {tanggal} ({n hari lagi}). Jadwalkan peninjauan." / "harus ditinjau hari ini ({tanggal}). Segera lakukan peninjauan." |
| sop.overdue | label dengan "Peninjauan SOP" | "{S} melewati batas peninjauan {tanggal} selama {n} hari. Segera lakukan peninjauan." |
| sop.incomplete | "Data SOP belum lengkap" | "{S} belum lengkap: {kolom} belum diisi. Lengkapi datanya." |
| risk.high | label alert | "Risiko "{nama}" dengan level High sejak {tanggal} (skor {n}). Perlu rencana mitigasi dan eskalasi." |
| kajian.overdue | "Kajian lewat batas waktu" | "{S} belum selesai dan melewati batas waktu {n hari}. Segera selesaikan." |
| kajian.near | "Kajian mendekati batas waktu" / "Kajian jatuh tempo hari ini" | "{S} jatuh tempo {..}. Segera selesaikan." |
| kajian.nohasil | "Kajian selesai tanpa hasil" | "{S} berstatus Selesai, tetapi Hasil / Opini belum diisi. Lengkapi hasilnya." |
| kajian.mitra | label dengan "akan tiba" atau "terlewat" | "{S}: jadwal evaluasi mitra jatuh tempo {..}. Siapkan evaluasinya." / "jadwal evaluasi mitra terlewat {n hari}. Segera jadwalkan ulang." |
| fraud.nopic | label alert | "{S} masih Open dan sudah {n hari} tanpa PIC, tindakan, atau EDD. Segera tetapkan PIC dan tentukan tindakan." (varian hanya PIC atau hanya tindakan/EDD) |
| fraud.edd | label alert | "{S} melewati batas waktu {n hari} dan hasil belum diisi. Segera lengkapi." |
| fraud.hold | label alert | "{S} berstatus Hold selama {n hari} dan belum dilepas (Released) atau diblokir. Tinjau kelanjutannya." |
| fraud.lapor | label alert | "{S} belum dilaporkan ke {regulator} ({..}). Segera laporkan ke regulator." |
| fraud.old | label alert | "{S} sudah Open selama {n hari}. Tinjau dan percepat penyelesaian." |
| fraud.kosong | label alert | "{S} belum lengkap: {kolom} belum diisi. Lengkapi datanya." |
| kontrak.hmin | label alert | "Kontrak {nomor} dengan {mitra} berakhir pada {tanggal} ({n hari lagi}). Siapkan perpanjangan atau penggantian." |
| kontrak.expired | label alert | "Kontrak {nomor} dengan {mitra} sudah kedaluwarsa{..}. Segera perpanjang atau tutup kontrak." |
| kontrak.kosong | label alert | "Kontrak ... belum memiliki Tanggal Berakhir. Lengkapi datanya." |
| aph.bap | label alert | "{S}: BAP dijadwalkan {tanggal} ({..}). Siapkan kehadiran dan dokumen." |
| aph.overdue | label alert | "{S} belum dijawab dan melewati batas waktu jawaban {n hari}. Segera kirim jawaban." |
| aph.kosong | label alert | "{S} belum lengkap: {kolom} belum diisi. Lengkapi datanya." |
| perizinan.akan | label alert | "{S} kedaluwarsa pada {tanggal} ({..}). Siapkan perpanjangan." |
| perizinan.lewat | label alert | "{S} sudah kedaluwarsa {n hari} lalu. Segera proses perpanjangan." |
| layanan.overdue | "Permintaan layanan hukum lewat batas waktu" | "{S} belum selesai dan melewati batas waktu {n hari}. Segera selesaikan." |
| layanan.near | "Permintaan layanan hukum mendekati batas waktu" / "... jatuh tempo hari ini" | "{S} jatuh tempo {..}. Segera selesaikan." |
| layanan.nopic | "Permintaan layanan hukum belum punya PIC" | "{S} sudah {d}. Tetapkan PIC." |

Alert tanpa entri di tabel ini (bila ada) memakai: judul = label alert, pesan = "{S}: {detail huruf kecil awal}". Rumus tanggal pemicu, warna, dan penerima per alert didokumentasikan di dokumen halaman masing-masing (sumber `AlertDef` di `src/pages/*.tsx` dan `src/lib.ts`).

### 5.6 Hal terkait notifikasi di luar lonceng
- Badge alert di modal Detail (semua halaman kit): tiap alert aktif tampil sebagai badge `{label}: {detail}` berwarna kuning/merah; tooltip berisi "Penerima notifikasi: ...". Data Dibatalkan tidak menampilkan badge alert.
- Badge jumlah Approval di sidebar bukan bagian pusat notifikasi (lihat 7.1).

### 5.7 Selisih dengan keputusan final
- Keputusan: semua alert berupa notifikasi di dalam dashboard, tanpa email/Telegram. Sesuai. Tidak ada pengulangan/frekuensi kirim: notifikasi muncul selama kondisi berlaku, tidak ada jadwal pengiriman ulang.

---

## 6. Perilaku umum kit (berlaku untuk 10 halaman berbasis kit)

Halaman berbasis kit: Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol, Risk Register, Kajian Risiko, Fraud Case Monitoring, Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum. Tracker punya komponen sendiri (`src/Tracker.tsx`, `src/Drawer.tsx`, `src/Form.tsx`) dengan perilaku mirip; perbedaan Tracker dicatat di dokumen Tracker. Sumber umum: `src/kit/PageShell.tsx`, `DataTable.tsx`, `FilterPopover.tsx`, `FormModal.tsx`, `DetailModal.tsx`, `store.tsx`, `exportXlsx.ts`, `InfoTip.tsx`, `PageGuide.tsx`, `Lainnya.tsx`, `charts.tsx`, `history.tsx`, `fmt.tsx`, `src/ui.tsx`, `src/lib.ts`.

### 6.1 Tab (PageShell)
- Dua tab: "Dashboard" lalu "Table". Tab Dashboard hanya tampil bila akun punya izin Dashboard kategori itu; tab Table selalu tampil. Tab awal = Dashboard bila diizinkan, selain itu Table.
- Pindah tab tidak mereset pencarian/filter, kecuali drill dari dashboard (6.3).

### 6.2 Filter Periode global tab Dashboard
- Hanya ada bila halaman mendefinisikan `dashDate` (tanggal acuan + label). Bar di atas dashboard: "Periode {label tanggal}", dua input tanggal (dari, sampai), tombol "Reset", dan teks kanan "{n} data (tanpa yang dibatalkan)".
- Filter memakai tanggal acuan halaman (mis. Tanggal Terima untuk Fraud, Tanggal Register untuk Risk Register, Tanggal Dicatat untuk Regulatory Change). Salah satu ujung boleh kosong. Data tanpa tanggal acuan disaring keluar bila filter diisi.
- Semua data berstatus Dibatalkan DIKECUALIKAN dari dashboard (`live`), dengan atau tanpa filter. Grafik bulanan menerima data tanpa filter Periode halaman (`allRows`) dan memakai filter bulan sendiri (6.4).

### 6.3 Drill dari dashboard ke Table
- Kartu angka/batang/donut yang punya `onClick` memanggil `drill(filter)`: mengisi filter tabel dengan filter itu, mengosongkan kotak cari, dan pindah ke tab Table.

### 6.4 Komponen visual dashboard bersama (`src/kit/charts.tsx`)
- Setiap visual berada di kartu putih sendiri (`Card`): judul tebal, ikon (i) opsional (6.11), toolbar opsional.
- Jenis: `StatCards` (kartu angka dengan strip warna kiri; nada: red, yellow, green, blue, gray, orange; bisa diklik; judul grup bawaan "Ringkasan"), `BarCard` (batang, bisa bertumpuk/horizontal, satuan sumbu, tooltip rincian), `DonutCard` (lingkaran berongga; hanya nilai > 0; legenda), `LineCard`, `ComboCard` (batang + garis), `MiniTable` (tabel mini 5 baris per halaman tanpa pilihan jumlah baris, kolom "No" otomatis lanjut antar halaman, pager tampil bila ada data), `CalendarCard` (kalender; tampilan hari/minggu/bulan atau rentang tetap N hari mulai hari ini tanpa navigasi; titik berwarna per event; maksimal 3 event per sel di tampilan bulan dan rentang, sisanya "+n lagi"; sel hari ini diberi latar biru).
- Warna nada: merah `#ef4444`, kuning `#f59e0b`, hijau `#10b981`, biru `#3b82f6`, abu `#94a3b8`, oranye `#f97316`. Palet seri: `#1f2ab5`, `#3b82f6`, `#06b6d4`, `#10b981`, `#f59e0b`, `#8b5cf6`, `#ec4899`, `#64748b`.
- Visual tanpa data: teks "Tidak ada data". Grafik bulanan (yang punya toolbar Periode) tetap menampilkan bulan kosong sebagai nol.
- Filter bulan per grafik (`MonthRangeFilter`): label "Periode", pilihan "Seluruh Waktu", "3 bulan terakhir", "6 bulan terakhir", "9 bulan terakhir", "12 bulan terakhir", "Custom" (dua input bulan "sampai"). "N bulan terakhir" = tepat N bulan termasuk bulan berjalan. "Seluruh Waktu" = dari bulan data tertua sampai bulan ini (atau bulan data terbaru bila di masa depan). Custom: kosong = tertua / bulan ini. Bawaan 12 bulan bila halaman tidak menentukan lain. [Catatan: keputusan final Tracker menyebut "all time, 3 bulan terakhir, per kuartal, custom"; pilihan kuartal tidak ada di komponen bersama, cek dokumen Tracker.]

### 6.5 Tab Table: kotak cari, filter, tombol
- Kotak cari: placeholder dari halaman (`searchPlaceholder`); mencocokkan teks (tanpa beda huruf) pada field yang ditentukan fungsi `search` halaman. Spasi ujung diabaikan.
- Tombol "Filter" (biru) membuka popover (lebar 380 px, menutup dengan Esc atau klik di luar). Isi: satu kontrol per definisi filter halaman. Tipe `select` (opsi "Pilih {label}") atau `daterange` (dua tanggal "-"). Tombol "Clear All" (kosongkan semua dan terapkan) dan "Apply Filters" (terapkan lalu tutup). Filter belum berlaku sebelum "Apply Filters". Gabungan filter = AND semua. TIDAK ADA fitur simpan filter (dihapus v2.9.0). Nilai kosong diabaikan.
- Cari dan filter digabung (AND). Mengubah cari/filter mengembalikan ke halaman 1.
- Tombol kanan (bergantian sesuai izin): "Import Excel" (disembunyikan, lihat bagian 12), "Export Excel" (izin Export), "Tambah" (izin Create).

### 6.6 Tabel (DataTable)
- TANPA sort per kolom (keputusan desain lama menyebut sort per kolom; kode tidak punya). Urutan tetap: Tanggal Dibuat terbaru dulu, lalu nomor internal terbesar.
- Kolom: "Nomor" (posisi baris, 1..n, lanjut antar halaman, bukan nomor data) + kolom halaman (kolom bernama "No" bawaan konfigurasi disembunyikan) + "Tanggal Dibuat" (DD/MM/YYYY HH:mm) + "Aksi".
- Header kolom bisa punya ikon mata untuk membuka sensor bila field punya `reveal` (6.9) dan akun boleh.
- Pagination: pilihan "Baris per halaman" 10, 25, 50 (bawaan 10); teks "{x} sampai {y} dari {z} data"; tombol `<`, nomor halaman (jendela 7 nomor), `>`.
- Kosong: "Tidak ada data".
- Baris Dibatalkan berwarna abu.
- Teks bebas dari pilihan ber-"Lainnya" tampil sebagai "Lainnya" di tabel; Detail dan Export memakai teks aslinya.
- Tombol di kolom Aksi, berurutan:
  - "Lihat Detail": semua akun yang bisa melihat halaman.
  - "Edit": izin Update, data tidak Dibatalkan, tidak ada pengajuan approval Menunggu untuk data itu, dan lolos aturan baris halaman (`canEditRow`).
  - "Batalkan" (merah): izin Update, data belum Dibatalkan, tidak ada pengajuan Menunggu.
  - "Kembalikan" (hijau): izin Update dan data berstatus Dibatalkan.
  - Aksi baris khusus halaman (`rowActions`, mis. tombol Selesai): izin Update, data belum Dibatalkan, dan kondisi `show` halaman.

### 6.7 Form Tambah/Edit (FormModal)
- Modal lebar. Judul: "Tambah {noun}" atau "Ubah {noun} {nama data}". Tombol "Batal" dan "Simpan".
- Field dari konfigurasi halaman; field `no` dan field otomatis (`auto`) tidak tampil. Field `inForm`: `add`, `edit`, `both` (bawaan), `none`.
- Tanda wajib: tanda bintang " *" setelah label bila field wajib (wajib bisa kondisional per isi form). Field dengan `showIf` hanya muncul bila kondisinya terpenuhi, dan validasinya dilewati saat tersembunyi.
- Tipe input: teks, textarea (3 baris), angka, uang (awalan "Rp"), persen (0-100, akhiran "%"), tanggal, tanggal-jam, select ("Pilih..."), Ya/Tidak, multiselect (kotak centang), multidrop (dropdown pilih banyak, pilihan jadi chip dengan tombol hapus; "Belum ada pilihan" bila kosong), checklist (kotak centang per sub-item), file, list (daftar item berulang dengan "Tambah item" dan "Hapus item").
- Pilihan "Lainnya": select/multiselect yang opsinya memuat "Lainnya" menampilkan kolom teks "Sebutkan lainnya" (maksimal 255 karakter) saat dipilih; nilai tersimpan = teks itu. Bila "Lainnya" dipilih tetapi teks kosong, simpan ditolak dengan pesan "Wajib diisi jika memilih Lainnya". "Lainnya" tidak disimpan di Master Data (ditambahkan otomatis di dropdown halaman yang memakainya).
- Select dengan semua opsi angka disimpan sebagai angka.
- Field `readOnly`/`editableBy` salah: tampil nonaktif.
- Validasi (`validateRecord`, dijalankan saat klik Simpan; hasil tampil merah di bawah field):
  - Wajib kosong: "{label} wajib diisi"
  - Angka/uang/persen bukan angka: "{label} harus berupa angka"
  - Persen di luar 0-100: "{label} harus 0 sampai 100"
  - Sub-field wajib dalam list: "{label sub} wajib diisi"
  - Aturan khusus halaman (`validate`) menimpa pesan lain pada field yang sama bila belum ada pesan.
  - Pesan khusus tiap halaman ada di dokumen halaman.
- Setelah sukses: modal menutup, data masuk tabel (urutan terbaru), tercatat di Log (6.13).
- Nomor data (`no`) otomatis = nomor terbesar yang ada + 1; id internal unik; tidak tampil di form.

### 6.8 Alasan perubahan saat Edit
- Di bawah form Edit selalu ada kolom "Alasan perubahan" (textarea). Tanda " *" muncul bila ada field `reasonOnChange` yang berubah dari nilai awal yang tidak kosong; bila alasan kosong, simpan ditolak: "Alasan wajib diisi jika {label field, dipisah koma} diubah". Selain itu opsional, dan bila diisi tercatat di riwayat dan Log.
- Hanya field yang tidak otomatis yang dibandingkan; bila tidak ada perubahan sama sekali, simpan tidak membuat apa pun (tidak ada Log).
- Field terkunci (`editableBy` salah, atau disamarkan) tampil nonaktif dan nilainya tidak pernah ditimpa. File/list terkunci tampil "(tidak dapat diubah)". Item list yang tidak boleh diubah akun itu menampilkan "Item ini tidak dapat diubah oleh Anda." dan tetap tersimpan.
- Untuk halaman dengan status otomatis (`normalize`): bila status tersimpan beda dari status hasil rumus, tampil catatan kuning "Status saat ini (otomatis): {status}" di bawah field Status.

### 6.9 Sensor (mask) dan tombol mata (reveal)
- `mask` benar untuk akun tertentu: nilai selalu tersamar di tabel, Detail, form Edit, dan Export; tidak bisa dibuka.
- `reveal` benar untuk akun: nilai bawaan tersamar; ikon mata (tooltip "Tampilkan {label}" / "Sembunyikan {label}") di header kolom tabel, label Detail, dan label form Edit membuka sementara (hanya di layar itu, tidak disimpan). Membuka sensor TIDAK dicatat di Log pada kode live.
- Bentuk samaran: tiap kata dijadikan huruf pertama + bintang (minimal 2 bintang), mis. "Budi Santoso" menjadi "B*** S******".
- Export: field `reveal` SELALU tersamar untuk semua peran (tombol mata hanya untuk layar). Field bertanda `mask` juga tersamar.
- Field sensor mana yang ada: Fraud (RRN, Nama Terlapor) dan Permintaan APH (Nama Penyidik, No. Telepon Penyidik) menurut data contoh Log; detail di dokumen halaman.

### 6.10 Upload file
- Komponen satu-file: tombol "Pilih file" atau "Ganti file", chip nama + ukuran dengan tombol hapus (aria "Hapus file"), area seret-lepas. Teks bantu tetap: "PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file."
- Aturan (`validateFile` di `src/lib.ts:304`): maksimal 25 MB (25 x 1024 x 1024 byte); ekstensi pdf/jpg/jpeg/png (tanpa beda huruf besar/kecil) DAN tipe MIME harus cocok pasangannya (pdf=application/pdf; jpg/jpeg=image/jpeg; png=image/png). Pesan: "File kosong" (0 byte), "Format file harus PDF, JPG, JPEG, atau PNG", "Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG" (MIME kosong), "Ukuran file maksimal 25 MB".
- Lebih dari 1 file dijatuhkan sekaligus: ditolak dengan "Hanya boleh 1 file".
- Hanya metadata (nama, ukuran, tipe) yang disimpan; isi file tidak disimpan. Karena itu "file yang bisa dibuka" di Detail hanya menampilkan nama dan ukuran sebagai teks `{nama} ({ukuran})`, bukan tautan unduh/pratinjau.
- Wajib/opsional per field ditentukan halaman. Keputusan final: semua file bukti opsional.
- Ukuran ditampilkan dengan satuan B, KB, MB.

### 6.11 Teks info (i) pada visual (InfoTip)
- Ikon (i) di sebelah judul kartu. Hover membuka, klik mengunci (untuk layar sentuh), Esc atau klik di luar menutup. Lebar maksimal 288 px dan dijepit ke dalam layar.
- Isi dua bagian: "Apa yang ditampilkan" (satu kalimat) dan "Cara membaca" (satu kalimat atau daftar poin). Isi per visual ada di kode halaman.

### 6.12 Panduan Halaman (PageGuide)
- Tombol "Panduan Halaman" (ikon buku) di samping judul halaman; membuka panel akordeon di bawah judul: judul "Panduan Halaman {nama}", teks "Klik tiap item untuk melihat penjelasannya.", tiap item membuka isi HTML statis. Esc atau tombol X menutup. Hanya tampil bila halaman punya isi panduan.
- Ada juga untuk Approval, Admin, Log, Master Data (per daftar), Ganti Password, Ganti PIN. Isi panduan ada di `src/guides/*.ts` dan bisa usang terhadap kode (lihat selisih di bagian 7, 9).

### 6.13 Detail (DetailModal)
- Modal "Detail" (tanpa tombol ubah/ajukan). Urutan: badge alert aktif (kuning/merah, tooltip penerima); kotak kuning "Menunggu persetujuan {approver}" bila ada pengajuan approval Menunggu, berisi jenis, pengaju, waktu, dan tautan "Lihat di menu Approval" (`#/approval?id=...`); kotak abu "Dibatalkan oleh {nama}, {tanggal}. Alasan: {alasan}. Status sebelumnya: {status}." bila Dibatalkan.
- Grid dua kolom: "Tanggal Dibuat" (DD/MM/YYYY HH:mm:ss) lalu semua field konfigurasi (kecuali `no` dan field `showIf` yang tidak terpenuhi). Nilai kosong tampil "-". File = ikon + nama (ukuran). List = tabel kecil. Multidrop = bullet. Checklist = "✓ / ✗ label". Field sensor mengikuti 6.9.
- Bagian bawah "Log Perubahan" (6.14). Tombol "Tutup".

### 6.14 Riwayat/Log Perubahan di Detail (`src/kit/history.tsx`)
- Daftar kronologis (terbaru di atas), tiap entri: badge judul + waktu DD/MM/YYYY HH:mm:ss, "Oleh: {nama}" atau "Pengaju: ... Approver: ...", tabel Kolom/Sebelum/Sesudah, catatan "Alasan: ..." atau "Catatan: ...".
- Jenis entri: "Data dibuat" (biru; dari `createdAt/createdBy`), "Perubahan data" (abu), "Dibatalkan" (merah), "Dikembalikan" (hijau), "Pengajuan approval: {jenis}" (kuning), "Approval: Approve - {jenis}" (hijau; memuat kolom berubah) atau "Approval: Reject - {jenis}" (merah; hanya aksi), dan entri lama teks. (Kode memakai tanda pisah panjang di judul "Approve/Reject"; di sini ditulis " - ".)
- Data Dibatalkan tanpa entri log (data contoh) tetap menampilkan entri "Dibatalkan" dari catatan batal.
- Riwayat dibangun dari Log tersimpan dan daftar approval; riwayat sebelum fitur ini mungkin tidak lengkap.

### 6.15 Batalkan dan Kembalikan
- Klik "Batalkan": modal "Batalkan {noun} {nama data}" dengan kolom "Alasan *" (textarea), tombol "Batal" dan "Konfirmasi" (merah). Alasan kosong: pesan "Alasan wajib diisi." dan tidak diproses.
- Hasil: status data menjadi `cancelStatus` halaman (bawaan "Dibatalkan"), catatan batal menyimpan status sebelumnya, alasan, siapa, kapan. Data TIDAK dihapus. Data tidak dihitung di dashboard dan tidak memicu notifikasi. Tanpa approval. Log: aksi "Cancel" dengan "Status lama -> Dibatalkan. Alasan: ...".
- Klik "Kembalikan": modal "Kembalikan {noun} {nama data}" dengan "Alasan *" wajib (modal sama). Hasil: status kembali ke status sebelum dibatalkan, catatan batal dihapus. Log: aksi "Kembalikan".
- Siapa: akun dengan izin Update kategori halaman (lihat 4.3). Tombol Batalkan/Edit disembunyikan selama ada approval Menunggu untuk data itu.

### 6.16 Approval di kit (pemicu umum)
- Modul mendefinisikan aturan (`ApprovalRule`): jenis, approver (peran), kondisi `needs(old, next, ctx)`, daftar kolom yang ikut approval (`keys`, opsional), tambalan sementara (`pendingPatch`) dan tambalan tolak (`rejectPatch`).
- Saat Edit disimpan: bila `needs` benar dan ada kolom yang termasuk `keys`, kolom itu TIDAK langsung diterapkan; dibuat pengajuan Menunggu berisi nilai lama dan baru; kolom lain yang berubah langsung tersimpan. Kolom turunan (mis. `levelAt`) ikut pengajuan. Satu Log "Ubah" untuk perubahan langsung dan satu Log "Ajukan approval" untuk pengajuan.
- Pengajuan aktif per data: selama Menunggu, Edit dan Batalkan disembunyikan.
- Aturan nyata di 3 modul kit (+Tracker): lihat bagian 7.4.

### 6.17 Export Excel (`src/kit/exportXlsx.ts`)
- Tombol "Export Excel" (izin Export). Isi = data hasil cari dan filter tab Table (SEMUA halaman pagination, bukan hanya halaman tampil). Data Dibatalkan ikut bila lolos filter/cari.
- Nama file `{exportPrefix halaman}_{YYYY-MM-DD hari ini}.xlsx`; satu sheet dengan nama = judul halaman (dipotong 31 karakter).
- Kolom: "Nomor" (posisi baris), "Tanggal Dibuat" (DD/MM/YYYY HH:mm:ss), lalu SEMUA field detail dalam urutan konfigurasi kecuali field `no`, `noExport`, dan field `showIf` yang tidak terpenuhi pada baris itu. Angka/uang/persen tetap sebagai angka; lainnya sebagai teks hasil format (tanggal DD/MM/YYYY, uang "Rp 1.000.000", multiselect dipisah ", ", multidrop dipisah "; ", file = nama file).
- Sensor: nilai field `mask` atau `reveal` selalu tersamar (6.9).
- Tercatat di Log: modul = judul halaman, aksi "Export", keterangan "{n} baris" (container halaman, type `export`, detail "Jumlah baris: n").
- Nama file per halaman (prefix) ada di dokumen halaman. Tracker: `Temuan_Regulator_{tanggal}.xlsx`. Log: `Log_Aktivitas_{tanggal}.xlsx`.

### 6.18 Format tampilan
- Tanggal DD/MM/YYYY; tanggal-jam DD/MM/YYYY HH:mm; uang "Rp {angka lokal id-ID}"; persen "{n}%".
- Warna status otomatis (`statusTone`): hijau untuk selesai/aktif/disetujui/closed/done/tepat waktu/direkomendasikan/terkirim/diperpanjang/valid/comply/berlaku; kuning untuk proses/review/dalam .../disusun/partial/akan berakhir/menunggu/belum disiapkan/diubah/perlu; biru untuk baru/open/draft/active/rencana/eksisting; merah untuk terlambat/expired/kedaluwarsa/gap/melewati/tidak direkomendasikan/ditolak/lewat; sisanya abu. Halaman bisa memakai warna sendiri.
- Hari kerja = Senin-Jumat tanpa libur nasional (`addWorkDays`, `workDaysBetween`). SLA Kajian dan Layanan = hari kalender.

### 6.19 Hal-hal "Lainnya" pada hash/URL
- `?open=<id>` di URL halaman modul membuka Detail data itu (dari notifikasi), lalu parameter dihapus. Bila id tidak ada di halaman itu, parameter dibiarkan untuk halaman tujuan.

### 6.20 Selisih dengan keputusan final (umum kit)
- Keputusan: "Tidak ada fitur import di dashboard". Mockup: kode import ada tetapi disembunyikan (bagian 12).
- Keputusan lama (`docs/keputusan-desain.md`) menyebut sort per kolom dan filter tersimpan; kode: tidak ada sort, filter tersimpan dihapus. Kode menang.
- Keputusan: "Departemen" untuk kolom unit kerja. Mockup: label "Unit Kerja" (dan "Unit Kerja Terdampak", "Unit Kerja Pemohon", dll.).

---

## 7. Approval (menu: Approval, item tunggal)

Sumber: `src/shared/Approval.tsx`, `src/kit/approvalSeed.ts`, `src/kit/store.tsx:208-219`, `src/lib.ts:255-275`, panduan `src/guides/shared.ts:3-12`.

- Ringkasan: daftar semua pengajuan perubahan yang butuh persetujuan dari modul Tracker, Fraud, Regulatory Change, dan Risk Register, dengan detail nilai lama/baru dan keputusan Approve atau Reject.
- Prasyarat akses (halaman): izin Approval-View (semua peran bawaan). Tidak ada tab; satu tabel.
- Prasyarat akses (tombol Approve/Reject): lihat 7.5.

### 7.1 Badge di sidebar
- Angka merah di item "Approval" = jumlah pengajuan berstatus Menunggu yang boleh diputuskan akun aktif (aturan 7.5). Tidak tampil bila 0.

### 7.2 Tabel
- Kolom (urutan): "Nomor Request" (NOTE: berisi nomor urut baris di tabel, bukan nomor pengajuan internal), "Modul", "Jenis Request", "Data" (nama data, "-" bila kosong), "Pengaju", "Tanggal Ajuan" (DD/MM/YYYY HH:mm), "Status" (badge: Menunggu kuning, Disetujui hijau, Ditolak merah), "Aksi" (tombol "Lihat Detail").
- Daftar menampilkan SEMUA pengajuan terlepas dari peran/pemilik (tidak disaring per peran). Urut terbaru dulu (waktu ajuan).
- Pagination: 10, 25, 50 baris per halaman (bawaan 10), teks "{x} sampai {y} dari {z} data". Kosong: "Tidak ada data".
- Cari: placeholder "Cari jenis, data, pengaju"; mencari pada jenis request, nama data, pengaju, dan nama modul (tidak mencari status).
- Filter: dropdown "Semua status" (Menunggu, Disetujui, Ditolak) dan "Semua modul" (hanya modul yang punya pengajuan; nama modul = label menu). Langsung berlaku tanpa tombol Apply; mengubah filter kembali ke halaman 1. Tidak ada filter tanggal, tidak ada export, tidak ada simpan filter.
- Rute `#/approval?id=<id>` membuka Detail pengajuan itu langsung.

### 7.3 Detail pengajuan (modal "Detail")
- Blok: Modul, Jenis request, Data, Pengaju (`nama (peran)`), Tanggal ajuan, Approver (peran), Alasan ("-" bila kosong).
- Tabel: Kolom | Nilai lama (merah) | Nilai baru (hijau); "-" untuk kosong.
- Baris status: badge status; bila diputuskan: " oleh {nama}, {tanggal-jam}" dan ". Catatan: {catatan}" bila ada.
- Tombol: "Approve" dan "Reject" (hanya bila 7.5 terpenuhi), "Tutup".

### 7.4 Jenis request (4 jenis)
| Modul | Jenis Request | Pemicu | Approver | Kolom yang diajukan | Bila disetujui | Bila ditolak |
| --- | --- | --- | --- | --- | --- | --- |
| Regulatory Findings Tracker | Penutupan Temuan | Edit mengubah Status menjadi Selesai (dari status lain); ikut kolom Validasi Ulang dan Nama Validator yang berubah | Head CLRM | Status, Validasi Ulang, Nama Validator, dan perubahan lain pada edit yang sama (Batas Waktu, Rencana Tindak Lanjut, file) | Perubahan diterapkan ke temuan; bila status menjadi Selesai: tanggal validasi = hari ini, Persetujuan = Disetujui, oleh siapa, tanggal | Status kembali ke status sebelum pengajuan (bukan tertahan di Menunggu Validasi), Persetujuan Penutupan = Ditolak (oleh, tanggal); isian lain yang diajukan tidak diterapkan |
| Fraud Case Monitoring | Penutupan Kasus | Edit mengubah Status dari bukan Closed menjadi Closed | Head CLRM | Status (dan Tanggal Resolved bila ikut berubah) | Perubahan diterapkan (kasus Closed) | Data tidak berubah (tetap Open) |
| Regulatory Change | Perubahan Daftar Peraturan | Edit apa pun pada kolom identitas peraturan (`keys: IDENT`, kondisi selalu benar) | Ketua SMKI | Kolom identitas peraturan saja; kolom lain langsung tersimpan | Perubahan diterapkan | Data tidak berubah |
| Risk Register | Perubahan Level Risiko | Edit Dampak atau Kemungkinan yang mengubah Level DAN pengubah BUKAN peran Risk Officer | Risk Officer | Dampak, Kemungkinan; kolom turunan "level sejak" ikut bila level naik | Perubahan diterapkan | Data tidak berubah |
Tracker: pengajuan tersimpan di data Tracker (bukan di store approval), ditampilkan lewat adapter dengan jenis tetap "Penutupan Temuan" dan approver "Head CLRM". Daftar kolom persis per modul ada di dokumen halaman.
Catatan: "Tambah" dan "Batalkan/Kembalikan" tidak memakai approval (sesuai keputusan).

### 7.5 Siapa boleh Approve/Reject (`canDecide`)
Semua syarat harus benar:
1. Status pengajuan = Menunggu.
2. Peran akun aktif = approver pengajuan, ATAU akun berperan Super Admin.
3. Akun punya izin "Approve" pada kategori modul pengajuan (mis. compliance.approve untuk Tracker/Regulatory Change, fraud.approve, risk.approve).
4. Akun punya izin "Update" pada kategori Approval (approval.update).
Hasil bawaan: Head CLRM (Tracker, Fraud), Ketua SMKI (Regulatory Change), Risk Officer (Risk Register), dan Super Admin (semua). Peran lain hanya bisa Lihat Detail.
- Catatan: Ketua SMKI punya compliance.approve (kategori), sehingga lolos syarat 3 untuk Tracker juga, tetapi syarat 2 menahannya karena approver Tracker = Head CLRM.
- Head CLRM juga bisa melihat tombol di pengajuan Fraud/Tracker saja, bukan Regulatory Change atau Risk Register (syarat 2).
- Tidak ada larangan menyetujui pengajuan milik sendiri di kode. [tidak pasti: bukan aturan eksplisit]

### 7.6 Dialog keputusan
- Klik Approve: modal "Approve request" dengan "Catatan" (opsional). Klik Reject: modal "Reject request" dengan "Catatan *" wajib; bila kosong: "Catatan wajib diisi saat Reject".
- Tombol "Batal" dan "Konfirmasi" (warna primer untuk Approve, merah untuk Reject).
- Keputusan final dan hanya sekali (pengajuan yang sudah Disetujui/Ditolak tidak bisa diputuskan lagi; kode abaikan bila status bukan Menunggu).
- Efek: Approve menerapkan semua perubahan (dan kolom turunan) ke data; Reject menerapkan tambalan tolak bila ada (Tracker memutar status), selain itu tidak mengubah data. Mencatat `decidedBy`, `decidedAt`, `catatan`.
- Log: modul = label menu modul, aksi "Approve" atau "Reject", keterangan "{jenis}. Catatan: {catatan}"; di tabel Log: container `approval`, type `approve`/`reject`.

### 7.7 Data contoh
- 21 pengajuan: Tracker 9 (5 Menunggu, 3 Disetujui, 1 Ditolak), Fraud 4 (2 Menunggu, 1 Disetujui, 1 Ditolak), Regulatory Change 4 (2/1/1), Risk Register 4 (2/1/1). Diisi sekali per data baru (flag `seq.approvalSeed`). Ini bukan requirement.

### 7.8 Selisih dengan keputusan final
- Keputusan: "Approval (pagination, view detail request, approve, reject)": sesuai.
- Keputusan: approval hanya untuk menutup temuan (Tracker), close case (Fraud), "dan persetujuan lain yang ada di CR". Mockup menambahkan dua jenis: Perubahan Daftar Peraturan (Regulatory Change, Ketua SMKI) dan Perubahan Level Risiko (Risk Register, Risk Officer). Tidak dipilih, hanya dicatat. Apakah kedua jenis ini ada di CR: [tidak pasti: tidak dapat diverifikasi dari kode].
- README menyebut keputusan Tracker tidak disimpan di daftar Approval; kode menyimpan (status Disetujui/Ditolak tetap tampil). Kode menang.
- Panduan Approval menyebut "peran Anda sama dengan Approver" dan izin Update kategori Approval: sesuai kode.

---

## 8. Admin (menu: Admin)

Sumber: `src/shared/Admin.tsx`, `src/kit/perms.ts`, `src/kit/store.tsx`, panduan `src/guides/shared.ts` (ADMIN_GUIDE).

- Ringkasan: kelola akun admin (tambah, edit, status) dan atur permission per akun dalam satu halaman.
- Prasyarat akses: izin Admin-View (bawaan hanya Super Admin). Tombol "Add" butuh Admin-Create. Tombol "Edit" dan "Refresh Permissions" butuh Admin-Update.
- Tidak ada tab Dashboard/Table terpisah: halaman = tabel.

### 8.1 Tabel
- Kolom: "No" (urutan baris, lanjut antar halaman), "Email", "Nama", "Status" (badge: Active hijau, Suspend oranye, Inactive abu, Archive abu), "Action" (tombol "Edit" bila izin Update).
- Pagination 10, 25, 50. Kosong "Tidak ada data". TIDAK ada cari, filter, export, kolom peran/departemen.
- Urutan = urutan penyimpanan akun (tambahan di akhir).
- Tombol di baris judul (kanan): "Refresh Permissions" (ikon segarkan) dan "+ Add" (primer).

### 8.2 Form Add ("Add New Admin")
| Label | Tipe | Pilihan | Wajib | Otomatis | Kondisi tampil | Validasi dan pesan |
| --- | --- | --- | --- | --- | --- | --- |
| Name | teks | - | Wajib | - | selalu | "Name wajib diisi" |
| Email | teks | - | Wajib | - | selalu | "Email wajib berformat valid" (pola `x@y.z` tanpa spasi); "Email sudah dipakai" (tanpa beda huruf besar/kecil, terhadap semua akun lain) |
| Password | teks tersembunyi + ikon mata | - | Wajib | - | hanya Add | "Password wajib diisi"; "Password minimal 8 karakter" |
| Confirm Password | idem | - | Wajib | - | hanya Add | "Confirm Password wajib diisi"; "Confirm Password tidak sama dengan Password" |
| PIN | tersembunyi + mata, maks 6 | hanya angka | Wajib | - | hanya Add | "PIN wajib diisi"; "PIN harus 6 digit angka" |
| Confirm PIN | idem | - | Wajib | - | hanya Add | "Confirm PIN wajib diisi"; "Confirm PIN tidak sama dengan PIN" |
| Select Status | select | Active, Inactive, Archive, Suspend (opsi awal kosong) | Wajib | - | selalu | "Status wajib dipilih" |
| Manage Permissions | kotak centang per kategori (8.5) | - | Opsional | awal kosong pada Add | selalu | tidak ada |
- Setiap label berawalan tanda bintang merah untuk wajib, diikuti " :". Teks bantu: "Contoh password awal demo: Paydia123!, PIN: 123456."
- Hasil: akun baru dengan peran tetap "Viewer", departemen = entri pertama Master Data Unit Kerja, `lastLogin` kosong, id `a{timestamp}`, izin = hasil centang. Modal menutup. Admin baru muncul di pilihan Akun demo bila statusnya Active (v2.14.4).
- Log: modul Admin, aksi "Tambah akun", keterangan "email: {email}; Status: {status}; Izin: {n}" (container `admin`, type `admin-create`).

### 8.3 Form Edit ("Edit Admin")
- Siapa: akun dengan Admin-Update.
- Bisa diubah: Name, Email (validasi sama dengan Add, tidak boleh sama dengan email akun lain), Select Status, dan Manage Permissions. Password dan PIN TIDAK ada di form Edit (diganti sendiri lewat profil). Peran dan departemen tidak bisa diubah.
- Super Admin (akun berperan Super Admin): seluruh kotak izin dikunci dengan teks "Super Admin selalu punya semua izin dan tidak dapat diubah."; nama/email/status masih bisa diubah.
- Tidak ada alasan perubahan.
- Log: aksi "Ubah akun", keterangan "email: {email}" ditambah "; Nama: a -> b" dan "; Status: x -> y" bila berubah (type `admin-update`); bila izin berubah, aksi tambahan "Ubah permission" dengan "email: {email}; Izin: {jumlah lama} -> {jumlah baru}" (type `permission-update`).
- Mengubah status akun yang sedang dipakai menjadi bukan Active akan memindahkan sesi ke akun Active pertama (lihat 2.1).

### 8.4 Aturan status akun
- Status: Active, Inactive, Archive, Suspend. Hanya Active yang muncul di pilihan Akun demo dan boleh menjadi sesi aktif. Tidak ada tombol terpisah untuk menonaktifkan; dilakukan lewat Select Status di Edit. Akun tidak pernah dihapus.
- Akun seed: Arief Nugraha = Suspend, Bima Prakoso = Inactive, Citra Dewi = Archive.

### 8.5 Manage Permissions
- Judul "Manage Permissions" dengan garis. Kolom cari "Cari permission berdasarkan nama kategori..." (menyaring kategori menurut nama); bila tidak ada: "Kategori tidak ditemukan".
- Tiap kategori: baris abu-abu "{Kategori} ({n} permissions)" + kotak "Select All", lalu kotak centang tiga kolom dengan label aksi: View, Create, Update, Export, Approve, Dashboard (sesuai katalog 4.2).
- Deskripsi aksi menurut panduan: View membuka halaman; Update mengubah dan membatalkan data; Create menambah data; Export mengunduh Excel; Approve memutuskan pengajuan; Dashboard membuka tab Dashboard.

### 8.6 Refresh Permissions
- Tombol "Refresh Permissions" (izin Update): untuk semua akun, buang id izin yang tidak ada di katalog; Super Admin diisi semua izin. Pesan hijau 4 detik: "Permission diperbarui untuk {n} admin." Log: aksi "Ubah permission", keterangan "Refresh permissions: {n} admin".

### 8.7 Kondisi khusus
- Penyimpanan password/PIN: teks biasa di localStorage (mockup). Password/PIN dipakai hanya untuk validasi "lama" di Ganti Password/Ganti PIN.
- "Add" tidak membuat login: akun baru bisa dipilih lewat Akun demo, tidak ada login dengan email/password ini.

### 8.8 Selisih dengan keputusan final
- Keputusan: "Admin (tambah dan edit akun, status akun, atur permission)": sesuai. Peran akun baru tidak dapat dipilih (selalu Viewer); keputusan tidak membahas pemilihan peran.
- Panduan Admin sesuai kode kecuali mencatat bahwa hanya admin Active "dapat masuk" (di mockup berarti dapat dipilih sebagai Akun demo).

---

## 9. Log (menu: Log)

Sumber: `src/shared/Log.tsx`, `src/kit/logSeed.ts`, `src/kit/store.tsx` (`mkLog`, `withLogs`, `pushLog`), panduan LOG_GUIDE.

- Ringkasan: tabel semua aktivitas (data contoh 30 hari + aktivitas live + riwayat audit Tracker) dengan filter dan export.
- Prasyarat akses: Log-View (bawaan Head CLRM dan Super Admin). Tombol Export butuh Log-Export (bawaan Head CLRM, Super Admin).
- Tidak ada tab.

### 9.1 Tabel
- Kolom (urutan): "Tanggal" (DD-MM-YYYY HH:mm:ss, dengan tanda hubung), "Container", "Type", "Detail" (beberapa baris `kunci: nilai`), "IP".
- Urutan: waktu terbaru dulu. Pagination 10, 25, 50. Kosong "Tidak ada data". Detail kosong tampil "-".
- Gabungan tiga sumber: (1) log live dari aplikasi (`store.log`, maksimal 3000 entri terbaru), (2) riwayat audit Tracker (`db.audit`), (3) data contoh 120 baris (`store.activity`).

### 9.2 Tombol dan filter
- Tombol "Filter" (primer) membuka panel; tombol "Export" (hijau) bila izin.
- Panel filter: tombol "Clear All" (kosongkan dan terapkan) dan "Apply Filters". Kolom: "Container" (ketik + saran daftar), "Type" (ketik + saran), "Tanggal" (dua input "Start date" -> "End date", salah satu boleh kosong), "Detail" (placeholder "detail"), "IP" (placeholder "ip address"). Semua pencocokan "mengandung teks" tanpa beda huruf besar/kecil; tanggal membandingkan bagian tanggal. Filter baru berlaku setelah "Apply Filters"; menerapkan kembali ke halaman 1.
- Export: semua baris yang lolos filter (bukan hanya halaman tampil). File `Log_Aktivitas_{YYYY-MM-DD}.xlsx`, sheet "Log", kolom "Tanggal", "Container", "Type", "Detail", "IP". Export Log sendiri dicatat (modul Log, aksi "Export", "{n} baris"). Tidak ada masking di Log.

### 9.3 Aksi yang dicatat LIVE (dibuat saat dipakai) di kode
| Aksi pengguna | Container | Type | Isi Detail |
| --- | --- | --- | --- |
| Tambah data di halaman kit | slug halaman | create | email, user_type, data, ... |
| Ubah data (perubahan langsung) | slug halaman | update | kolom: lama -> baru; Alasan |
| Batalkan | slug halaman | cancel | Status lama -> Dibatalkan; Alasan |
| Kembalikan | slug halaman | restore | status; Alasan |
| Ajukan approval | slug halaman | submit-approval | jenis, approver, kolom lama -> baru |
| Approve / Reject | approval | approve / reject | jenis, Catatan |
| Export Excel (halaman modul) | slug halaman | export | Jumlah baris |
| Export Log | log | export | Jumlah baris |
| Master Data tambah/ubah/hapus | master-data | master-create / master-update / master-delete | `{Master}: {nilai}` |
| Tambah akun / Ubah akun / Ubah permission | admin | admin-create / admin-update / permission-update | email, status, jumlah izin |
| Ganti password / Ganti PIN | clrm-auth | password-change / pin-change | tanpa isi password/PIN |
| Ganti akun demo | clrm-auth | switch-account | `A -> B` |
| Logout | clrm-auth | logout | email, user_type |
| Aksi Tracker (tambah, ubah, ajukan, setujui, tolak, batalkan, kembalikan, validasi) | regulatory-findings-tracker | dari audit Tracker (create, update, submit-approval, approve, reject, cancel, restore, validate) | kolom lama -> baru, Alasan |
Format Detail live: baris `email: {email akun}`, `user_type: {peran}`, `data: {nama data}` (bila ada), lalu keterangan dipecah per `; ` menjadi baris. IP live = IP demo tetap per email (pola `182.253.x.y`, hasil hash) bukan IP asli.

### 9.4 Aksi yang HANYA ada di data contoh (tidak dicatat live)
login, 2fa-verify, login-failed, view-detail (melihat Detail), upload-file, reveal-data (buka sensor via ikon mata), notif-open (membuka notifikasi), import, delete (hapus data), validate (selain Tracker). Panduan Log menyebut semua ini sebagai "dicatat", tetapi kode live tidak membuatnya. Catatan keputusan final Fraud: membuka sensor tidak dicatat di log; kode live sesuai (tidak dicatat), tetapi data contoh memuat baris `reveal-data`.

### 9.5 Data contoh
- 120 baris, 30 hari terakhir (4 baris per hari mundur), deterministik. Memakai email akun aktif, 10 IPv4 dan 5 potongan IPv6 tetap per pengguna. Container contoh: clrm-auth, 10 halaman modul, approval, master-data, admin, notification, log. Bukan requirement.

### 9.6 Selisih dengan keputusan final
- Keputusan: "Log aktivitas (pagination, export, mencatat semua aksi)". Mockup mencatat sebagian aksi saja (lihat 9.3 vs 9.4): lihat saja, upload, login/2FA, import tidak tercatat live.
- Keputusan: pembukaan sensor tidak dicatat: sesuai kode live.

---

## 10. Master Data (menu: Master Data, 11 sub-menu)

Sumber: `src/shared/MasterData.tsx`, `src/kit/store.tsx:39-47`, panduan `masterGuide`.

- Ringkasan: daftar pilihan (dropdown) yang dipakai form di halaman modul. Setiap daftar adalah halaman sendiri dengan tabel satu kolom nama.
- Prasyarat akses: Master-View (semua peran bawaan). Tombol "Tambah" butuh Master-Create (bawaan Head CLRM, Super Admin). Tombol "Edit" dan "Hapus" butuh Master-Update (bawaan Head CLRM, Super Admin).

### 10.1 Daftar master (urutan menu), sumber isi awal, dan pemakaian
| No | Menu | Isi awal (seed) | Dipakai di |
| --- | --- | --- | --- |
| 1 | Laporan | semua nama laporan dari katalog laporan (`LAPORAN_NAMES`) | TIDAK dipakai form mana pun (Nama Laporan di Regulatory Reporting adalah teks bebas) |
| 2 | PIC | Regie, Fakhri, Osama | field PIC di halaman modul (Reporting PIC Penyusun/Reviewer, Kontrak, Perizinan, Fraud PIC Investigator, SOP PIC Dokumen, Layanan Hukum) |
| 3 | Kategori Regulasi | APU PPT, QRIS, SNAP, Pelindungan Konsumen, Ketahanan Siber | Tracker (Area), Regulatory Change (Kategori) |
| 4 | Unit Kerja | Internal Audit, Business, Operation, Information Technology, Compliance Legal & Risk Management, Support, Finance, Accounting, Tax & Treasury (satu entri bernama "Finance, Accounting, Tax & Treasury") = 7 entri | semua field unit/departemen (Tracker, Regulatory Change "Unit Kerja Terdampak", SOP "Pemilik Dokumen", Risk Register, Kajian "Unit Kerja Pengusul", Kontrak "Unit Pemilik", Layanan "Unit Kerja Pemohon") |
| 5 | Produk | UE, QRIS, Biller | Risk Register, Fraud |
| 6 | Mitra Vendor | 16 nama PT/CV/Bank (mis. PT Telkom Biller, Bank Mitra Utama, ... PT Jaringan Nusa, PT Data Aman) | Kontrak (Nama Mitra), Kajian (Nama Mitra), Risk Register (Vendor / Mitra) |
| 7 | Kategori Pelapor | Departemen Internal, Konsumen, Switching, PJP/Bank, Institusi Berwenang Lainnya, Kepolisian, Bank Indonesia, Asosiasi | Fraud |
| 8 | Media Pelapor | Email, IASC, GO AML, WhatsApp | Fraud (ditambah "Lainnya") |
| 9 | Jenis PKS Kontrak | PKS QRIS, Biller Gateway, Account Linkage, Payout, Program Peningkatan Transaksi, NDA, Amandemen | Kontrak (Jenis Dokumen, ditambah "Lainnya") |
| 10 | Instansi Pengirim APH | Bareskrim, Polda, Polres, PPATK, Kejaksaan | Permintaan APH (Pengirim, ditambah "Lainnya") |
| 11 | Kategori Dokumen Perizinan | Akta + SK, Izin, Legalitas Lainnya | Perizinan |
Regulator memakai daftar tetap per halaman (bukan Master Data). "Lainnya" tidak disimpan di Master (ditambah otomatis di dropdown tertentu).

### 10.2 Layar daftar
- Judul = nama master. Kotak cari (placeholder "Cari {nama master huruf kecil}") menyaring nama (mengandung teks). Tombol "Tambah" (kanan, bila izin).
- Tabel: "No" (urutan di daftar penuh, tidak berubah saat disaring), kolom nama (judul = nama master), "Aksi" ("Edit" dan "Hapus" merah bila izin Update). Tanpa pagination (semua baris tampil). Daftar kosong: "Belum ada data".
- Catatan kaki: "Ubah atau hapus tidak mengubah data lama yang sudah memakai nilai ini."

### 10.3 Tambah dan Edit (modal "Tambah {master}" / "Edit {master}")
- Satu field "Nama *". Enter di kolom = Simpan. Tombol "Batal" dan "Simpan".
- Validasi (`validateMasterName`), pesan persis:
  - kosong: "Nama wajib diisi"
  - kurang dari 2 karakter (setelah dipangkas): "Minimal 2 karakter"
  - lebih dari 255 karakter: "Maksimal 255 karakter"
  - karakter selain huruf, angka, spasi, ` ' - &: "Hanya huruf, angka, spasi, dan karakter ` ' - &" (saat Edit, nama lama yang belum diganti tidak diperiksa ulang karakternya)
  - sama dengan "Lainnya" (tanpa beda huruf): "Lainnya tidak dipakai sebagai nama master"
  - nama sudah ada (tanpa beda huruf besar/kecil, kecuali dirinya sendiri): "Nama sudah ada"
- Hasil: nilai ditambahkan ke akhir daftar (Tambah) atau menggantikan di posisi yang sama (Edit). Langsung tersedia di dropdown halaman lain.
- Log: modul "Master Data", aksi "Tambah" atau "Ubah" dengan "`{Master}: {nilai}`" atau "`{Master}: {lama} -> {baru}`" (container `master-data`, type `master-create`/`master-update`).

### 10.4 Hapus
- Tombol "Hapus" membuka modal "Hapus {master}": "Hapus {nama}? Data lama yang memakai nilai ini tidak berubah." dengan "Batal" dan "Hapus" (merah).
- Hasil: nilai DIHAPUS PERMANEN dari daftar (tidak ada status nonaktif/soft delete di Master Data). Data lama yang memakai nilai tersebut tetap menyimpan teksnya. Log aksi "Hapus" (type `master-delete`).
- Tidak ada pemeriksaan "masih dipakai data".
- Edit nama master juga tidak mengubah data lama.

### 10.5 Selisih dengan keputusan final
- Keputusan: master memuat "Departemen (nama mengikuti dokumen HR)". Mockup: menu "Unit Kerja" (nama label berbeda); isi mengikuti sheet "Daftar Departemen Paydia".
- Keputusan: master "pihak pelapor": mockup punya "Kategori Pelapor" dan "Media Pelapor"; tidak ada master "Pihak Pelapor" (sudah dihapus dari migrasi).
- Keputusan: semua pilihan bisa ditambah, termasuk "kategori regulasi, produk, vendor dan mitra, jenis dokumen PKS, instansi pengirim APH, kategori dokumen izin": sesuai. Mockup menambah master "Laporan" (tidak terpakai) dan "PIC".
- Keputusan lain: "Data tidak dihapus permanen" berlaku untuk data; Master Data memakai hapus permanen dari daftar (bukan nonaktif).

---

## 11. Profile: Ganti Password dan Ganti PIN (menu: avatar > Ganti Password / Ganti PIN)

Sumber: `src/shared/Profile.tsx`, panduan PASSWORD_GUIDE dan PIN_GUIDE.

- Ringkasan: pengguna mengganti password atau PIN akunnya sendiri.
- Prasyarat akses: akun aktif dengan Approval-View (lihat catatan 3.6). Hanya mengubah akun yang sedang aktif.
- Dua halaman terpisah, kartu sempit (maks 448 px): `profil/password` dan `profil/pin`.

### 11.1 Form
| Label | Tipe | Wajib | Validasi |
| --- | --- | --- | --- |
| Password lama / PIN lama | password tersembunyi | Wajib (tanda *) | harus sama dengan password/PIN akun; salah: "Password lama salah" / "PIN lama salah" |
| Password baru / PIN baru | password tersembunyi (PIN dibatasi 6 karakter) | Wajib | Password: minimal 8 karakter, pesan "Password baru minimal 8 karakter". PIN: tepat 6 digit angka, pesan "PIN baru harus 6 digit angka" |
| Konfirmasi Password baru / Konfirmasi PIN baru | idem | Wajib | harus sama dengan yang baru: "Konfirmasi Password tidak sama" / "Konfirmasi PIN tidak sama" |
- Urutan pemeriksaan: lama, aturan baru, konfirmasi; satu pesan error merah ditampilkan sekaligus.
- Sukses: pesan hijau "Password berhasil diganti." / "PIN berhasil diganti.", form dikosongkan.
- Log: modul "Profil", aksi "Ganti password" atau "Ganti PIN" (container `clrm-auth`, type `password-change`/`pin-change`). Isi password/PIN tidak dicatat.
- Perubahan hanya berlaku untuk akun sendiri; password tersimpan teks biasa di localStorage (mockup).

### 11.2 Kondisi khusus
- Tidak ada aturan kompleksitas password selain panjang minimal 8. Tidak ada aturan "tidak boleh sama dengan password lama".
- Password/PIN hasil Ganti dipakai ulang bila diganti lagi (validasi "lama").

### 11.3 Selisih dengan keputusan final
- Keputusan: "Ganti PIN dan password": sesuai. Reset Password (lupa password) tidak ada.

---

## 12. Import (disembunyikan)

- Flag: `SHOW_IMPORT = false` di `src/kit/PageShell.tsx:16` dan di `src/Tracker.tsx:19`; komentar "disembunyikan atas permintaan user". Tombol "Import Excel" tidak tampil di halaman mana pun, apa pun perannya. Izin "Import" tidak ada di katalog izin (selalu ditolak oleh `canAccount`).
- Kode masih ada (`src/kit/ImportExcel.tsx`, `src/TrackerImport.tsx`): unduh template, unggah, pratinjau validasi per baris, impor baris valid, unduh baris gagal. Tercatat di Log ("Import", "{ok} baris berhasil, {gagal} gagal"). Field bertipe file, list, checklist, multidrop dilewati. Tidak dipakai di mockup final.
- Selisih: keputusan "Tidak ada fitur import di dashboard; migrasi lewat template Excel oleh tim CLRM dan IT". Sesuai dari sisi tampilan (tidak terlihat). Kode import yang tidak aktif bisa diabaikan oleh PRD (sebut hanya sebagai asumsi migrasi).

---

## 13. Versi dan changelog

- Versi saat ini 2.14.4 (2026-11-01), file `VERSION`, `CHANGELOG.md`, `src/versions.ts` (54 entri, dari 1.0.0 sampai 2.14.4). Tampil di header sebagai pemilih versi (3.3). Aturan internal: tiap pengerjaan wajib bump versi + entri changelog + commit + tag + deploy. Bukan fitur produk.
- Perubahan terbaru: 2.14.4 admin baru muncul di Akun demo; 2.14.3 dan 2.14.2 log tolak penutupan Tracker hanya mencatat perubahan Status yang benar-benar terjadi; 2.14.1 perbaikan QA seed Approval, Log, tolak Tracker, rute Admin; 2.14.0 izin per akun (Manage Permissions), Log berbentuk container/type/detail/ip, status akun, seed approval.

---

## 14. Penyimpanan lokal, seed, reset

- Tidak ada backend. Data contoh dibuat di browser dan tersimpan di `localStorage`:
  - `clrm.db.v9`: data Tracker (temuan, audit, request).
  - `clrm.app.v18`: semua halaman kit, approval, log, master, akun, izin, urutan (`seq`).
  - `clrm.session`: sesi akun aktif.
  - `clrm.notif.v1`: status baca notifikasi per akun.
- Tombol reset (header): hapus dua kunci data (`clrm.db.v9`, `clrm.app.v18`) lalu reload; seed dibuat ulang. Sesi dan status baca notifikasi tetap. Akun baru dari Add hilang setelah reset; bila sesi menunjuk akun yang hilang, aplikasi memilih akun Active pertama.
- Seed halaman modul dibuat sekali saat halaman pertama dibuka (idempoten). Seed approval (Fraud, Regulatory Change, Risk Register) dibuat sekali saat aplikasi dimuat (flag `seq.approvalSeed`).
- Kunci versi dinaikkan tiap perubahan bentuk data (v18 saat ini), sehingga data lama otomatis dibuang; `load()` toleran terhadap bentuk lama (migrasi: departemen menjadi unitKerja, status akun Aktif/Nonaktif menjadi Active/Inactive, Kontrak status Expired menjadi Kedaluwarsa, SOP retensi Permanen menjadi 10 Tahun, dan lainnya).
- Penyimpanan bisa gagal (privat/penuh): dibungkus try/catch, aplikasi tetap jalan tanpa persist.
- Ukuran log live dibatasi 3000 entri.
- Jumlah seed global (bukan requirement): 12 akun (9 Active), 21 pengajuan approval, 120 baris Log contoh, 11 daftar master.

---

## 15. Selisih global dengan keputusan final (daftar, tanpa memilih)

Dibandingkan dengan bagian "Keputusan yang sudah final" di `/Users/dionscholus/Downloads/2026-11-01-prompt-PRD-dari-mockup-dashboard-CLRM.md`.

Perbedaan mockup vs keputusan:
1. Login, 2FA, Reset Password: tidak ada di aplikasi (hanya gate password bersama di server + logout + ganti password/PIN).
2. Kolom unit kerja: keputusan "Departemen"; mockup "Unit Kerja" (menu master dan label field).
3. Master Data: menu "Laporan" tidak dipakai form mana pun; Nama Laporan teks bebas (sesuai keputusan Reporting, tetapi master Laporan tetap ada).
4. Master Data hapus permanen dari daftar; keputusan "data tidak dihapus permanen" hanya untuk data transaksi (batalkan).
5. Log: tidak mencatat semua aksi (tidak ada login, 2FA, lihat detail, upload, import live).
6. Approval: mockup punya 4 jenis (Penutupan Temuan, Penutupan Kasus, Perubahan Daftar Peraturan, Perubahan Level Risiko). Keputusan menyebut tutup temuan, close case, dan "persetujuan lain yang ada di CR".
7. Notifikasi memakai matriks peran bawaan untuk filter halaman, bukan izin per akun (selisih internal, bukan keputusan).
8. Batalkan/Kembalikan mengikuti izin Update kategori, tidak khusus peran tertentu.
9. Tren/filter bulan per grafik: komponen bersama menawarkan Seluruh Waktu, 3/6/9/12 bulan terakhir, Custom; keputusan Tracker menyebut "all time, 3 bulan terakhir, per kuartal, custom". Cek dokumen Tracker untuk bentuk di halaman itu.
10. Import: tidak tampil (sesuai), kode tetap ada.

Fitur mockup yang tidak ada di keputusan (tambahan mockup):
- Pemilih "Akun demo" di header dan log "Ganti akun demo".
- Pemilih versi/changelog dan tombol reset data contoh (alat mockup).
- Gate password bersama dengan rate limit 5 gagal per 15 menit per IP.
- Panduan Halaman (akordeon) di tiap halaman.
- Teks info (i) pada visual.
- Pusat notifikasi dengan status baca per akun, urutan, dan tautan buka data.
- Ikon mata (reveal) dan sensor di kit.
- Permission per akun granular per kategori x aksi (Manage Permissions, Refresh Permissions, status akun 4 nilai).
- Badge jumlah Approval di sidebar.
- Filter Periode global tab Dashboard, filter bulan per grafik, drill dari dashboard ke Table.
- Log Perubahan (riwayat) di modal Detail.
- Teks "Lainnya" bebas pada dropdown tertentu.

Catatan tidak pasti:
- [tidak pasti: apakah penggunaan matriks peran untuk filter notifikasi per halaman disengaja]
- [tidak pasti: apakah dua jenis Approval tambahan (Perubahan Daftar Peraturan, Perubahan Level Risiko) ada di CR]
- [tidak pasti: apakah approver boleh menyetujui pengajuan miliknya sendiri; kode tidak melarang]

---

## 16. Sumber kode utama (file:baris)

- `middleware.js:1-30` gate cookie; `api/login.js:1-36`; `api/logout.js:1-4`; `public/login.html`, `login.js`, `login.css`; `vercel.json` header.
- `src/App.tsx:14-62` menu, grup, rute, alias; `:64-92` pemilih versi; `:100-111` sesi otomatis; `:113-160` header, Akun demo, reset, logout; `:171-208` sidebar.
- `src/kit/perms.ts:1-77` peran, katalog izin, `build()`, `permsOf`, `canAccount`.
- `src/kit/store.tsx:12-48` kunci, akun seed, master seed; `:52-84` load/migrasi; `:107-120` `useApp`, `can`, `logout`; `:122-` `useModule` (update, cancel, restore, approval); `:208-219` `decideApproval`.
- `src/kit/notify.tsx:59-135` teks notifikasi; `:148-158` penerima; `:160-191` penyusun; `:194-232` status baca; `:235-278` lonceng.
- `src/kit/PageShell.tsx`, `DataTable.tsx`, `FilterPopover.tsx`, `FormModal.tsx:20-36` validasi, `DetailModal.tsx`, `history.tsx`, `exportXlsx.ts`, `fmt.tsx`, `charts.tsx`, `InfoTip.tsx`, `PageGuide.tsx`, `Lainnya.tsx`, `Reveal.tsx`, `src/ui.tsx` (Modal, ReasonModal, FileField), `src/lib.ts:298-313` validasi file, `:255-275` `applyTrackerRequest`.
- `src/shared/Approval.tsx:1-94`, `Admin.tsx:1-164`, `Log.tsx:1-107`, `MasterData.tsx:1-104`, `Profile.tsx:1-32`, `Pager.tsx`.
- `src/kit/approvalSeed.ts`, `src/kit/logSeed.ts`, `src/guides/shared.ts`, `src/versions.ts`.
