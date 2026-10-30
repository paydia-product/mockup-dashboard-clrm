# Dashboard Monitoring CLRM (mockup)

Mockup klik untuk Dashboard Monitoring CLRM (Compliance, Legal & Risk Management). Halaman lengkap saat ini: **Compliance > Regulatory Findings Tracker** dan **Legal > Permintaan Layanan Hukum** (halaman referensi page kit). Approval, Master Data, Admin (Akun, Permission), Log, dan profil juga sudah jalan. Tidak ada backend; data contoh disimpan di `localStorage` (tombol reset di header).

Stack: React + Vite + TypeScript + Tailwind + Recharts + lucide-react + xlsx. Source "dashboard admin" Paydia tidak ada di workspace, jadi tampilan meniru gayanya (header biru royal, sidebar putih, tabel dengan badge outline).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173 (tanpa login gate)
npm run build      # cek TypeScript + build ke dist/
npm run preview
```

Login gate hanya aktif di Vercel (atau `vercel dev`), karena dijalankan oleh `middleware.js`.

## Variabel environment (Vercel)

| Nama | Fungsi |
| --- | --- |
| `MOCKUP_PASSWORD` | Password login. Tidak ada di repo. |
| `AUTH_SECRET` | Kunci HMAC untuk cookie `clrm_auth`. Pakai string acak panjang. |

Jika salah satu belum diset, `/api/login` dan middleware membalas 500 (tanpa nilai bawaan). Cookie: `clrm_auth=<expiryMs>.<hex HMAC-SHA256>`, HttpOnly, Secure, SameSite=Strict, berlaku 24 jam.

Login dibatasi 5 percobaan gagal per IP per 15 menit (429 + Retry-After); memori per instance, untuk produksi pakai Vercel WAF rate limit / KV.

Halaman publik: `/login.html` (+ `login.js`, `login.css`), `/api/login`, `/api/logout`, `/favicon.svg`. Sisanya butuh cookie valid.

## Asumsi (bagian G dan tambahan)

- Format Nomor Temuan `TR-YYYY-NNNN`.
- Validasi Ulang diisi oleh Compliance Officer.
- Semua peran boleh export (CR belum mengatur).
- Kelompok keterlambatan: 1-7, 8-30, 31-90, >90 hari.
- Area Temuan: lima contoh CR + "Lainnya".
- Alert "Menunggu Validasi terlalu lama": > 7 hari (`WAIT_VALIDATION_DAYS` di `src/lib.ts`). Lama menunggu dihitung dari riwayat audit.
- Di Dashboard, "Open" berarti semua temuan belum Selesai (Open, Proses, Menunggu Validasi); yang Dibatalkan tidak dihitung.
- Peran demo memetakan ke satu pengguna: PIC = Bima Pratama. Temuan PIC lain tidak bisa diubah oleh peran PIC.
- Edit oleh PIC/Compliance Officer membuat permintaan perubahan (menunggu Head CLRM, tersimpan sebagai metadata, bukan kolom data). Head CLRM menyetujui (diff diterapkan) atau menolak (alasan wajib). Satu permintaan aktif per temuan. Alur penutupan tetap terpisah.
- "Ajukan Penutupan" otomatis mengisi progress 100%.
- Batalkan/Kembalikan: status sebelum batal dibaca dari Riwayat (tidak ada kolom tambahan).
- Pencarian, filter, memakai data yang sama; Export mencakup semua halaman hasil filter.

## Akun demo (di dalam app)

Login hanya lewat gate server (`middleware.js`, `/login.html`, password saja). Setelah lolos gate, app langsung membuka dashboard sebagai Super Admin, tanpa login kedua. Ganti akun lewat pemilih akun demo di header. Logout memanggil `/api/logout` dan kembali ke `/login.html`.

Semua akun contoh memakai password `Paydia123!` dan PIN `123456`:

| Email | Peran |
| --- | --- |
| admin@paydia.id | Super Admin |
| dewi.anggraini@paydia.id | Head CLRM |
| rina.kartika@paydia.id, arief.nugraha@paydia.id | Compliance Officer |
| rudi.hartono@paydia.id | Risk Officer |
| lina.marlina@paydia.id | Legal Officer |
| fajar.ramadhan@paydia.id | Fraud Investigator |
| yusuf.hakim@paydia.id | Ketua SMKI |
| bima.pratama@paydia.id | PIC |
| tono.santoso@paydia.id | Viewer |

Pemilih "Akun demo" di header berganti akun tanpa login ulang. Tombol reset menghapus `clrm.db.v4` dan `clrm.app.v1`.

## Penyimpanan

Tracker di `clrm.db.v4`. Semua halaman lain, approval, log, master, akun, dan permission di `clrm.app.v1`. Sesi di `clrm.session`. Kontrak page kit ada di `docs/plan-halaman.md` bagian A, keputusan desain di `docs/keputusan-desain.md`.

## Asumsi tambahan (halaman baru)

- Peran Fraud Investigator dan Ketua SMKI ditambah (ada di CR).
- Hari kerja = Senin sampai Jumat tanpa libur nasional. SLA Kajian dan Layanan = hari kalender.
- Status "Batal" (pilihan CR) beda dari "Dibatalkan" (hasil Cancel Head CLRM).
- Rename dan hapus master data tidak mengubah data lama.
- Master Data: Laporan, Regulator, Kategori Regulasi, Unit Kerja, Produk, Mitra, Kategori Pelapor, Media Pelapor. Data lama `departemen` dimigrasi ke `unitKerja`, `pihakPelapor` dibuang.
- Logout menghapus sesi demo dan cookie gate, lalu kembali ke `/login.html`.
- Export boleh untuk semua peran dan diatur lewat matriks permission.
- Request perubahan tracker ikut tampil di menu Approval; keputusan yang sudah diambil tidak disimpan di daftar Approval (tercatat di Log).
- Halaman yang masih stub ("Segera hadir" di Dashboard, 2 kolom): Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol, Risk Register, Kajian Risiko, Fraud Case Monitoring, Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas.

## Ritual rilis

Tiap pengerjaan wajib:

1. Tambah entri di `CHANGELOG.md` (termasuk estimasi token) dan di `src/versions.ts` (newest-first; `prompt` dan `tokens`).
2. Bump `VERSION` (dan `version` di `package.json`).
3. Commit, lalu tag `vX.Y.Z`.
4. Deploy. Tandai `deployed: true` di `src/versions.ts` pada versi yang sudah rilis.
