# Keputusan desain dashboard CLRM

Ringkasan aturan yang berlaku untuk semua halaman. Detail halaman dan kontrak kit: `docs/plan-halaman.md`.

## Aturan dasar (dari keputusan user di Regulatory Findings Tracker)
1. Tab Dashboard pertama (default), lalu Table.
2. Filter berupa popover dengan Clear All dan Apply Filters. Tidak ada simpan filter (dihapus di v2.9.0). Kotak cari terpisah.
3. Kolom Aksi: Lihat Detail, Edit (sesuai permission dan aturan baris), Batalkan atau Kembalikan (Head CLRM, alasan wajib, tanpa approval).
4. Detail berupa Modal berjudul "Detail". Tanpa nomor urut kolom, tanpa Riwayat, tanpa tombol Ubah atau Ajukan.
5. Simulasi notifikasi berupa modal email. Maksimal 3 email per jenis alert, lalu satu contoh statis berlabel.
6. Upload memakai `FileField`: PDF, JPG, JPEG, PNG, maksimal 25 MB, tepat 1 file, hanya metadata.
7. Nomor data berupa angka urut biasa, terisi otomatis, tidak ada di form.
8. PIC berupa teks bebas. Unit Kerja dari Master Data.
8a. Master Data punya 8 list: Laporan, Regulator, Kategori Regulasi, Unit Kerja, Produk, Mitra, Kategori Pelapor, Media Pelapor. Tambah dan Edit lewat modal dengan field Nama (2 sampai 255 karakter, huruf/angka/spasi, unik tanpa beda huruf besar). Hapus lewat modal konfirmasi. Semua aksi masuk Log.
8b. Select yang punya opsi "Lainnya" menampilkan teks wajib. Teks itu yang disimpan sebagai nilai. Saat ubah, nilai di luar opsi dipilih sebagai Lainnya dan teks terisi.
9. Export Excel berisi baris hasil filter dan cari, nama file `<Prefix>_YYYY-MM-DD.xlsx`, dicatat di Log.
10. Pagination 10, 25, 50. Teks "x sampai y dari z data". Sort per kolom.
11. Tiap visual dalam kartu sendiri.
12. Import Excel di tab Table: template, pratinjau dengan validasi per baris, impor baris valid, unduh baris gagal, dicatat di Log.

## Keputusan implementasi page kit
- Store berupa singleton di `src/kit/store.tsx` (subscribe lewat `useSyncExternalStore`). Alasan: `readModule` dan `addRecord` harus bisa dipanggil dari modul lain (RegChange menulis ke SOP). `AppProvider` hanya passthrough.
- Seed tiap modul dibuat saat modul pertama dibaca, lalu disimpan.
- `status` ikut tipe `NewRec<T>` karena status adalah isian form. `id`, `no`, `createdAt`, `createdBy`, `cancelled` diisi kit.
- Approval: `ApprovalRule.keys` (opsional) memisahkan kolom yang harus disetujui dari kolom yang langsung diterapkan. Tanpa `keys`, seluruh perubahan masuk request.
- Selama ada request Menunggu, baris tidak bisa diedit. Detail menampilkan "Menunggu persetujuan" dan link ke menu Approval.
- Tracker tidak dimigrasi ke kit. Tombol Tambah, Edit, Batalkan, Kembalikan mengikuti `can('tracker', aksi)`. Aturan PIC-pemilik tetap. Logika approve dan tolak request dipindah ke `applyTrackerRequest` di `lib.ts`.
- Drawer tracker masih memakai peran tracker (Head CLRM, Compliance Officer, PIC, Viewer) hasil pemetaan dari peran sesi. Tombol di dalam Drawer belum membaca matriks permission.

## Konflik terbuka dan asumsi
Lihat bagian E di `docs/plan-halaman.md` (C1 sampai C9, A1 sampai A12).
