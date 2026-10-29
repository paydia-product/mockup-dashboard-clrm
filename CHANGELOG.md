# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan [Semantic Versioning](https://semver.org/lang/id/).

**Aturan:** tiap pengerjaan wajib punya entri di file ini, bump file `VERSION` (dan `src/versions.ts`), commit, tag git, lalu deploy.

| Versi | Tanggal | Estimasi token |
| --- | --- | --- |
| 1.0.0 | 2026-10-29 | ~450k |

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
