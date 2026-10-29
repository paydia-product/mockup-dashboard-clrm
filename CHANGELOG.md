# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan [Semantic Versioning](https://semver.org/lang/id/).

**Aturan:** tiap pengerjaan wajib punya entri di file ini, bump file `VERSION` (dan `src/versions.ts`), commit, tag git, lalu deploy.

| Versi | Tanggal | Estimasi token |
| --- | --- | --- |
| 1.4.1 | 2026-10-29 | ~10k |
| 1.4.0 | 2026-10-29 | ~80k |
| 1.3.1 | 2026-10-29 | ~15k |
| 1.3.0 | 2026-10-29 | ~90k |
| 1.2.0 | 2026-10-29 | ~120k |
| 1.1.1 | 2026-10-29 | ~40k |
| 1.1.0 | 2026-10-29 | ~180k |
| 1.0.0 | 2026-10-29 | ~450k |

## [1.4.1] - 2026-10-29

Estimasi token: ~10k

### Diubah
- Unit Kerja Finance dan Accounting, Tax & Treasury digabung menjadi "Finance, Accounting, Tax & Treasury".
- Key localStorage naik ke `clrm.db.v4`.

## [1.4.0] - 2026-10-29

Estimasi token: ~80k

### Diubah
- Nomor Temuan menjadi angka urut dan tidak lagi bisa diklik. Field Nomor dihapus dari form. Tombol Lihat Detail ada di kolom Aksi.
- Pilihan Unit Kerja diganti.
- Label "Rencana Tindak Lanjut & Bukti" menjadi "Rencana Tindak Lanjut".
- PIC menjadi isian teks.
- Status di Tambah: Open, Proses, Menunggu Validasi. Edit juga bisa memilih Selesai. Selesai wajib diisi Validasi Ulang dan Nama Validator, lalu menunggu persetujuan Head CLRM.
- Field Alasan di Edit. Alasan wajib jika Batas Waktu diubah.

### Dihapus
- Progress dari tabel, form, detail, dan export.

## [1.3.1] - 2026-10-29

Estimasi token: ~15k

### Diubah
- File bukti Rencana Tindak Lanjut wajib diunggah di Tambah dan Edit.

## [1.3.0] - 2026-10-29

Estimasi token: ~90k

### Diubah
- Tooltip Temuan per Unit Kerja menampilkan Total, Selesai, dan Open.
- Data Dibatalkan selalu tampil di tabel. Checkbox "Tampilkan yang dibatalkan" dihapus.
- Kolom Alert dihapus. Simulasi notifikasi menjadi 3 contoh email sesuai aturan alert.
- Modal Edit hanya mengubah Progress, Batas Waktu, Tindak Lanjut & Bukti, dan Bukti Surat Regulator. Perubahan Batas Waktu wajib diberi alasan.
- Rencana Tindak Lanjut & Bukti menjadi satu teks dan satu file.

### Ditambah
- Field Bukti Surat Regulator.
- Komponen upload `FileField` dan fungsi `validateFile`: PDF, JPG, JPEG, PNG, ekstensi cocok dengan MIME, maks 25 MB, 1 file. Cek: `node scripts/check-upload.ts`.
- Key localStorage naik ke `clrm.db.v2`.

## [1.2.0] - 2026-10-29

Estimasi token: ~120k

### Diubah
- Filter menjadi popover di bawah tombol Filter; berlaku setelah Apply Filters, Clear All mereset. Simpan Filter dan daftar tersimpan ada di dalamnya.
- Simulasi notifikasi ditampilkan sebagai bubble pesan Telegram.
- Kolom Aksi memakai tombol Edit, Batalkan, Kembalikan sesuai peran; baris tidak lagi bisa diklik, detail dibuka dari link Nomor Temuan.
- Tab Dashboard menjadi default dan pertama.

### Dihapus
- Tombol dan riwayat Riwayat Export (export tetap berfungsi).

## [1.1.1] - 2026-10-29

Estimasi token: ~40k

### Diubah
- Menu placeholder Risk (Risk Register, Kajian Risiko), Fraud (Fraud Case Monitoring), dan Legal (Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum) dikembalikan ke sidebar.

## [1.1.0] - 2026-10-29

Estimasi token: ~180k

### Diubah
- Sidebar hanya Compliance (4 sub menu), Approval, Admin, Log; grup Risk, Fraud, Legal dihapus.
- Edit temuan kini membuat permintaan perubahan yang menunggu persetujuan Head CLRM (Setujui/Tolak), tercatat di Riwayat.
- Info pagination menjadi "x sampai y dari z data".
- Halaman login: input nonaktif saat request, error merah dibersihkan, spinner CSS.

### Keamanan
- Rate limit `/api/login`: 5 percobaan gagal per IP per 15 menit (429 + Retry-After).
- `xlsx` memakai tarball resmi SheetJS 0.20.3; `@vercel/functions` dihapus dari middleware. `npm audit --omit=dev`: 0 kerentanan.

## [1.0.0] - 2026-10-29

Estimasi token: ~450k

### Ditambahkan
- Shell dashboard bergaya admin Paydia: header, sidebar, menu placeholder "Segera hadir".
- Halaman Compliance > Regulatory Findings Tracker: tabel, cari, filter gabungan, filter tersimpan, pagination, sort, toggle dibatalkan, export xlsx, riwayat export.
- Drawer detail 14 kolom dengan tab Riwayat (audit trail).
- Tambah, ubah, batalkan, kembalikan; alur penutupan; modal alasan Batas Waktu; aturan per peran.
- Tab Dashboard dengan 7 visual, badge alert, panel Simulasi notifikasi.
- Login gate (Vercel Routing Middleware, `/api/login`, `/api/logout`), header keamanan di `vercel.json`.
- Pemilih versi di header.
