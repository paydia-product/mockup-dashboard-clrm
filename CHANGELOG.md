# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan [Semantic Versioning](https://semver.org/lang/id/).

**Aturan:** tiap pengerjaan wajib punya entri di file ini, bump file `VERSION` (dan `src/versions.ts`), commit, tag git, lalu deploy.

| Versi | Tanggal | Estimasi token |
| --- | --- | --- |
| 2.15.0 | 2026-11-02 | ~60k |
| 2.14.6 | 2026-11-01 | ~5k |
| 2.14.5 | 2026-11-01 | ~15k |
| 2.14.4 | 2026-11-01 | ~5k |
| 2.14.3 | 2026-11-01 | ~5k |
| 2.14.2 | 2026-11-01 | ~10k |
| 2.14.1 | 2026-11-01 | ~60k |
| 2.14.0 | 2026-11-01 | ~250k |
| 2.13.10 | 2026-10-31 | ~25k |
| 2.13.9 | 2026-10-31 | ~10k |
| 2.13.8 | 2026-10-31 | ~20k |
| 2.13.7 | 2026-10-31 | ~40k |
| 2.13.6 | 2026-10-31 | ~40k |
| 2.13.5 | 2026-10-31 | ~40k |
| 2.13.4 | 2026-10-31 | ~40k |
| 2.13.3 | 2026-10-31 | ~80k |
| 2.13.2 | 2026-10-31 | ~40k |
| 2.13.1 | 2026-10-31 | ~60k |
| 2.13.0 | 2026-10-31 | ~450k |
| 2.12.1 | 2026-10-30 | ~150k |
| 2.12.0 | 2026-10-30 | ~250k |
| 2.11.1 | 2026-10-30 | ~60k |
| 2.11.0 | 2026-10-30 | ~200k |
| 2.10.1 | 2026-10-30 | ~230k |
| 2.10.0 | 2026-10-30 | ~250k |
| 2.9.2 | 2026-10-30 | ~130k |
| 2.9.1 | 2026-10-30 | ~300k |
| 2.9.0 | 2026-10-30 | ~400k |
| 2.8.3 | 2026-10-30 | ~120k |
| 2.8.2 | 2026-10-30 | ~190k |
| 2.8.1 | 2026-10-30 | ~360k |
| 2.8.0 | 2026-10-30 | ~300k |
| 2.7.3 | 2026-10-30 | ~120k |
| 2.7.2 | 2026-10-30 | ~160k |
| 2.7.1 | 2026-10-30 | ~330k |
| 2.7.0 | 2026-10-30 | ~250k |
| 2.6.1 | 2026-10-30 | ~200k |
| 2.6.0 | 2026-10-30 | ~200k |
| 2.5.1 | 2026-10-30 | ~25k |
| 2.5.0 | 2026-10-30 | ~40k |
| 2.4.1 | 2026-10-30 | ~10k |
| 2.4.0 | 2026-10-30 | ~60k |
| 2.3.0 | 2026-10-29 | ~25k |
| 2.2.2 | 2026-10-29 | ~30k |
| 2.2.1 | 2026-10-29 | ~220k |
| 2.2.0 | 2026-10-29 | ~950k |
| 2.1.0 | 2026-10-29 | ~150k |
| 2.0.0 | 2026-10-29 | ~2,2 juta |
| 1.5.0 | 2026-10-29 | ~40k |
| 1.4.1 | 2026-10-29 | ~10k |
| 1.4.0 | 2026-10-29 | ~80k |
| 1.3.1 | 2026-10-29 | ~15k |
| 1.3.0 | 2026-10-29 | ~90k |
| 1.2.0 | 2026-10-29 | ~120k |
| 1.1.1 | 2026-10-29 | ~40k |
| 1.1.0 | 2026-10-29 | ~180k |
| 1.0.0 | 2026-10-29 | ~450k |

## [2.15.0] - 2026-11-02

### Diubah
- Semua filter periode dashboard (Periode tanggal halaman, Periode Tanggal Temuan di Tracker, filter bulan per grafik) hanya mengubah draft; data berubah setelah klik tombol **Terapkan Filter**
- Dashboard tidak lagi punya drill-down: klik kartu, batang, irisan, atau legenda tidak membuka tab Table terfilter. Teks info (i) dan panduan disesuaikan

### Dihapus
- Prop `drill` pada kit dashboard dan handler klik pada StatCards, BarCard, DonutCard

## [2.14.6] - 2026-11-01

### Diperbaiki
- Ganti Akun demo memuat ulang halaman, jadi sensor yang sudah dibuka tertutup lagi

## [2.14.5] - 2026-11-01

### Diubah
- Fraud: semua peran yang bisa membuka halaman kini punya ikon mata untuk membuka Nama Terlapor dan RRN; Export tetap selalu tersamar

## [2.14.4] - 2026-11-01

### Diubah
- Pilihan Akun demo menampilkan semua admin berstatus Active, termasuk admin baru dari tombol Add

## [2.14.3] - 2026-11-01

### Diperbaiki
- Log tolak penutupan Tracker tidak lagi mencatat isian Validator yang diajukan seolah berubah

## [2.14.2] - 2026-11-01

### Diperbaiki
- Log tolak penutupan Tracker mencatat status yang benar-benar terjadi (Menunggu Validasi -> status sebelumnya), bukan perubahan yang diajukan

## [2.14.1] - 2026-11-01

### Diperbaiki
- Seed Approval: jam pengajuan selalu valid (HH:mm), dan permintaan Fraud yang disetujui menampilkan Open -> Closed
- Tolak penutupan Tracker di halaman Approval mengembalikan temuan ke status sebelumnya (bukan tertahan di Menunggu Validasi)
- Log: IP demo selalu 0-255 per oktet; type konsisten (approve, reject); detail export live memakai format "Jumlah baris: N"; seed ditambah switch-account, restore, delete, master-delete, dan export tiap modul
- Rute lama #/admin/akun dan #/admin/permission dialihkan ke #/admin
- Approval: izin Update pada kategori Approval kini menentukan tombol Approve dan Reject; teks "Permission diperbarui untuk N admin"

## [2.14.0] - 2026-11-01

### Ditambah
- Permintaan APH: Nama Penyidik dan No. Telepon Penyidik tersamar dengan ikon mata (Super Admin, Head CLRM, Legal Officer), di Detail dan form Edit
- Export: kolom ber-reveal (APH penyidik, Fraud Terlapor dan RRN) selalu tersamar untuk semua peran
- Log: tabel Tanggal, Container, Type, Detail, IP; tombol Filter (panel Container, Type, Tanggal, Detail, IP) dan Export hijau; seed 120 baris 30 hari terakhir; entri live dipetakan ke bentuk baru
- Approval: seed pengajuan Menunggu, Disetujui, Ditolak untuk Fraud (Penutupan Kasus), Regulatory Change (Perubahan Daftar Peraturan), Risk Register (Perubahan Level Risiko), dan Tracker (Penutupan Temuan)
- Admin: sub-menu Akun dan Permission digabung menjadi satu menu Admin; tabel No, Email, Nama, Status, Edit; modal Add New Admin dan Edit Admin dengan Manage Permissions per kategori (Compliance, Risk, Fraud, Legal, Approval, Master Data, Log, Admin)
- Permission per admin (View, Create, Update, Export, Approve, Dashboard) kini dipakai can(); status admin Active, Inactive, Archive, Suspend; seed 12 admin

### Diubah
- Kunci data naik: clrm.app.v18 dan clrm.db.v9 (data contoh lama dibuang)

## [2.13.10] - 2026-10-31

### Diubah
- Fraud: Super Admin kini punya ikon mata untuk membuka Nama Terlapor dan RRN (selain Head CLRM dan Fraud Investigator)
- APH: judul chart menjadi "Top 5 Group merchant paling banyak disebut"
- Risk Register: tombol dan teks "Setelah kontrol (residual)" dihapus dari heatmap dan panduan
- Risk Register: kolom tabel D, K, Skor menjadi Skor Dampak, Skor Kemungkinan, Skor Total

## [2.13.9] - 2026-10-31

### Diperbaiki
- Kontrak Kedaluwarsa tanpa Tanggal Berakhir: notifikasi tidak lagi menampilkan "? hari lalu"

## [2.13.8] - 2026-10-31

### Diperbaiki
- Kontrak: status "Expired" menjadi "Kedaluwarsa" di opsi status, filter, tabel, detail, ekspor, kartu dashboard "Kontrak Kedaluwarsa", grafik, panduan, dan notifikasi; nilai tersimpan ikut diganti dan data lama dimigrasi saat load() (kunci penyimpanan v16 menjadi v17)
- Panduan Temuan, Laporan, Kajian, Layanan Hukum, dan SOP: butir alert menjelaskan judul notifikasi "... jatuh tempo hari ini" bila tenggatnya hari ini

## [2.13.7] - 2026-10-31

### Diperbaiki
- Semua label alert halaman sama dengan judul notifikasi (judul = label, atau kata benda objek + label): Fraud "Kasus belum ditangani", "Hold settlement lebih dari 30 hari", "Kasus Open lebih dari 90 hari", "Data kasus belum lengkap"; Kontrak "Kontrak kedaluwarsa belum diperpanjang", "Tanggal berakhir kontrak belum diisi"; APH "Jawaban APH lewat batas waktu", "Data permintaan APH belum lengkap"; Layanan "Belum punya PIC"; Regulatory Change "Belum dinilai lebih dari 10 hari kerja", "Akan berlaku, kepatuhan belum terpenuhi", "Peraturan dicabut, SOP terkait perlu diperbarui"; Kajian "Jadwal evaluasi mitra akan tiba / terlewat"
- Judul notifikasi diturunkan dari label halaman (tanpa teks judul ganda); imbauan terlambat: "Segera kirim jawaban."
- Kartu dashboard: SOP "Peninjauan akan tiba (≤ 30 hari)", Layanan "Lewat batas waktu", Kajian "Jadwal evaluasi mitra akan tiba / terlewat"
- Seed Risk Register: "Kontrol berkala dan peninjauan oleh <unit>" (kunci penyimpanan v15 menjadi v16); panduan semua modul disesuaikan

## [2.13.6] - 2026-10-31

### Diperbaiki
- Label alert halaman dan judul notifikasi memakai frasa yang sama: Mendekati batas waktu, Lewat batas waktu, Peninjauan akan tiba / terlewat, Kontrak akan berakhir, Jadwal BAP akan tiba, Jadwal evaluasi mitra, Tenggat pelaporan insiden siber sedang berjalan; judul notifikasi kini diturunkan dari label halaman sehingga tidak bisa berbeda
- Peninjauan SOP: judul "Peninjauan SOP akan tiba" bila masih N hari, "Peninjauan SOP jatuh tempo hari ini" bila 0 hari (sebelumnya judul "mendekat" dengan isi "hari ini")
- Laporan terlambat menjadi "Laporan lewat batas waktu"; "Peraturan dicabut, SOP terkait perlu ditinjau"; Layanan: "Permintaan layanan hukum (Review) dari ..."
- Kartu SOP: "bila peninjauan terlewat"; panduan semua modul disesuaikan dengan label baru

## [2.13.5] - 2026-10-31

### Diperbaiki
- Istilah SOP seragam: peninjauan dan ditinjau (Tanggal Peninjauan Berikutnya, alert Peninjauan mendekat/terlewat, kartu, tabel, panduan); kunci data tidak berubah
- Judul notifikasi "Peninjauan SOP mendekat"; judul "hampir jatuh tempo" Temuan, Laporan, Kajian, Layanan Hukum menjadi "mendekati batas waktu", dan "jatuh tempo hari ini" saat 0 hari
- Hold: "selama N hari dan belum dilepas (Released) atau diblokir"; SOP dicabut: "hapus dari daftar SOP terkait pada peraturan ini"
- Reporting: Tanggal Submit menjadi Tanggal Pengiriman, tidak ada lagi kata submit di tampilan; label Tanggal Review Perizinan menjadi Tanggal Peninjauan
- Panduan: kata Field diganti isian di semua panduan

## [2.13.4] - 2026-10-31

### Diperbaiki
- Fraud: pesan kasus belum ditangani sesuai kekurangannya (tanpa PIC, tanpa tindakan atau EDD, atau keduanya)
- Notifikasi: level High ditulis dengan level High, Lengkapi bukti pengiriman, Segera validasi, Segera lakukan penilaian dampak, belum dilepas (Released) atau diblokir
- Peninjauan SOP: judul dan pesan memakai peninjauan dan ditinjau
- Judul notifikasi mitra dipisah: Jadwal evaluasi mitra terlewat dan Jadwal evaluasi mitra mendekat
- Label kolom Bukti Submit menjadi Bukti Pengiriman (form, tabel, Detail, export, panduan)
- Panduan: Isian wajib menggantikan Field wajib, Insiden siber dengan jam berjalan, kalimat Tandai semua dibaca diganti, paragraf Notifikasi Risk Register disamakan

## [2.13.3] - 2026-10-31

### Diperbaiki
- Semua pesan notifikasi ditulis ulang: nama data dirangkai wajar (Kontrak PKS/... dengan Mitra, Permintaan review dari unit, Risiko "judul"), tanpa tanda pisah panjang, titik koma, atau pengulangan kata
- Daftar kolom kosong memakai kata dan (Nama Penyidik dan No. Telepon belum diisi; a, b, dan c untuk tiga atau lebih)
- Batas waktu ditulis sebagai angka hari atau kata natural: hari ini, besok, kemarin, N hari lagi, melewati batas waktu N hari
- Fraud: Kasus EDD/... melewati batas waktu N hari dan hasil belum diisi (EDD tidak lagi muncul tiga kali)
- Regulatory Change: batas jawaban N hari lagi, berlaku N hari lagi dengan status kepatuhan masih Gap, tanpa kata tahap
- Seed Regulatory Reporting memakai periode nyata (28/10/2026, Oktober 2026, September 2026, Minggu s.d. 01/11/2026) menggantikan Hari lalu, Bulan lalu, Bulan berjalan, Minggu berjalan; baris referensi notifikasi menjadi Dana Float (28/10/2026); kunci data lokal naik ke v15
- Notifikasi SOP memakai nama kolom baku (Tanggal Review, Status, PIC) dan batas review dalam hari
- Panduan halaman: titik koma pada paragraf Notifikasi diganti titik, contoh pesan SOP diperbarui, kalimat batas notifikasi Active, Baru/Proses, dan Perizinan dirapikan
- Teks info kartu Risk Register tanpa koma menggantung; label alert Fraud menjadi EDD lewat batas waktu

## [2.13.2] - 2026-10-31

### Diperbaiki
- Pesan notifikasi insiden siber: tanpa kata Insiden ganda, satu titik dua, contoh: Insiden siber "akses tidak sah" (kejadian 31/10/2026 08:00) — notifikasi awal ...
- Huruf kecil setelah titik dua di semua pesan notifikasi (kecuali nama status seperti High, Open, Hold, Comply, Dicabut)
- Notifikasi Kontrak memakai kata kedaluwarsa, bukan expired
- Notifikasi Regulatory Reporting: nama laporan dan periode dirangkai wajar, mis. Laporan Dana Float (periode hari lalu) belum terkirim
- Notifikasi Regulatory Change: judul kepatuhan belum terpenuhi, pesan Status kepatuhan: Belum Dinilai
- Rapikan redaksi Kontrak, Permintaan APH, Perizinan, Kajian mitra, dan Fraud (tanpa titik dua ganda atau kalimat janggal)

## [2.13.1] - 2026-10-31

### Diperbaiki
- Klik notifikasi selalu membuka Detail data: halaman yang ditinggalkan tidak lagi menghapus parameter tautan milik halaman tujuan (Tracker, PageShell)
- Teks info chart Regulatory Change memakai kata notifikasi, bukan alert email
- Pesan notifikasi: level High tetap kapital, 0 hari lagi menjadi hari ini, awalan Peraturan ganda dihapus, data kosong tanpa titik dua ganda, redaksi SOP terkait peraturan dicabut dirapikan

## [2.13.0] - 2026-10-31

### Diubah
- Semua field upload di Tambah/Edit opsional
- Alert email diganti notifikasi di dashboard: ikon lonceng dengan badge, daftar alert per penerima, tandai dibaca, klik membuka data terkait
- SOP: Klasifikasi ISO (Publik, Internal, Rahasia, Sangat Rahasia); Tanggal Review Berikutnya otomatis = Tanggal Berlaku + 1 tahun dan tidak bisa diubah; status Dicabut tidak memicu review; opsi Retensi Permanen dihapus
- Fraud: Tindakan EDD 1 dan EDD 2; field EDD tampil sejak awal; Jenis Data dihapus; tombol buka sensor RRN dan Nama Terlapor; No Laporan EDD otomatis EDD/tahun/bulan/nomor
- Master Data baru: Jenis PKS Kontrak, Instansi Pengirim APH, Kategori Dokumen Perizinan
- Kontrak: Dokumen Induk jadi teks isian
- APH: chart Group merchant top 5; Batas Waktu Jawaban opsional
- Perizinan: Tanggal Kedaluwarsa dan No Versi opsional
- Risk Register: semua info, chart, kolom dan field RAS-RT dihapus

## [2.12.1] - 2026-10-30

### Diperbaiki
- Popover info (ⓘ) tidak lagi meluap layar: dijepit dalam viewport, lebar maksimal layar dikurangi 32px
- Mobile (< 768px): sidebar tertutup bawaan dan terbuka sebagai overlay; header ringkas; kartu angka 2 kolom; tabel dashboard bisa digeser; tidak ada scroll horizontal halaman di 390px pada semua rute
- Ganti Password dan Ganti PIN tidak lagi berbagi state Panduan
- Risk Register: alert RAS-RT dipisah menjadi "Breach RAS-RT" (merah) dan "Dalam Toleransi RAS-RT" (kuning)
- Teks info kalender Reporting: warna biru hari ini hanya di tampilan Minggu dan Bulan
- Label upload SOP menjadi "File Dokumen"
- Teks bebas pada pilihan Lainnya dihitung di grafik dan filter (Kontrak, APH, Layanan, Fraud Media, Regulatory Change Kategori, Tracker Area); teks info dan panduan diperbarui

## [2.12.0] - 2026-10-30

### Ditambahkan
- Tombol Panduan Halaman di samping judul semua halaman (Tracker, 10 halaman kit, Approval, Master Data, Admin Akun, Admin Permission, Log, Ganti Password, Ganti PIN): panel item yang dibuka satu per satu berisi alur penggunaan dan penjelasan fitur per halaman
- Ikon info (ⓘ) di setiap grafik, kartu angka, kalender, dan tabel mini dashboard: hover atau klik menampilkan "Apa yang ditampilkan" dan "Cara membaca" (Esc atau klik di luar menutup)
- Komponen `PageGuide` dan `InfoTip`; prop `info` pada kit Card, BarCard, DonutCard, LineCard, ComboCard, CalendarCard, MiniTable, StatCards

## [2.11.1] - 2026-10-30

### Diperbaiki
- Master Mitra Vendor: nama merchant dibuang; seed Kajian, Kontrak, Risk Register tetap ada di master
- Kontrak Tambah: Nama Mitra / Nama Merchant tampil setelah Jenis Hubungan dipilih
- Kontrak: kartu dan alert Tanggal Berakhir Kosong memakai aturan sama (tanpa Berakhir/Dibatalkan)
- load() membuang slice modul bukan array (seed dipakai ulang); helper tanggal menoleransi nilai kosong
- Tracker: label sumbu Hari pada grafik Temuan Lewat Batas Waktu
- APP_KEY naik ke v13

## [2.11.0] - 2026-10-30

Estimasi token: ~200k

### Ditambah
- Semua dashboard kit (Regulatory Reporting sampai Layanan Hukum): filter Periode tanggal utama di atas dashboard, dengan Reset dan jumlah data. Grafik per bulan tetap memakai filter bulan sendiri dan tidak terpengaruh.
- Kontrak: Nama Merchant (teks bebas) untuk Jenis Hubungan Merchant; Nama Mitra (dropdown master Mitra Vendor) untuk jenis lain. Mengganti Jenis Hubungan mengosongkan isian yang tidak cocok.
- APH: hover Permintaan per kasus dan Surat masuk per bulan menampilkan rincian per Instansi Pengirim.
- Layanan Hukum: hover Permintaan per jenis menampilkan rincian per Unit Kerja.

### Diubah
- Grafik berbasis hari (Kajian, Fraud, Layanan Hukum, APH, Regulatory Change) diberi satuan Hari pada sumbu dan hover.
- Kontrak: semua judul kartu diawali Kontrak; kartu Tanggal kosong menjadi Kontrak Tanggal Berakhir Kosong.
- Perizinan: Tanggal Terbit, Berlaku, Kedaluwarsa wajib untuk semua kategori; seed dilengkapi tiga tanggal.
- APP_KEY naik ke v12.

### Dihapus
- APH: kartu Active lewat batas jawaban.
- Perizinan: alert Izin tanpa tanggal dan kelompok Tanpa tanggal kedaluwarsa (tidak mungkin lagi terjadi).

## [2.10.1] - 2026-10-30

Estimasi token: ~230k (QA penuh oleh agent terpisah dan perbaikan)

### Diperbaiki
- Filter Vendor / Mitra di Risk Register memakai daftar master Mitra Vendor.
- Field Tanggal EDD 1 dan EDD 2 di Fraud tampil setiap Jenis Data = EDD, tidak bergantung pada Hasil Asesmen Awal.

## [2.10.0] - 2026-10-30

Estimasi token: ~250k

### Ditambah
- Fraud: field Jenis Data (Fraud/EDD) tepat setelah Tanggal Terima Tugas; field EDD (EDD 1, EDD 2, Batas Waktu EDD, Hasil EDD) hanya tampil dan berlaku untuk EDD. Alert EDD dan grafik terima ke EDD 1 hanya memakai baris EDD.
- Fraud: hover grafik Jenis dugaan menampilkan rincian per Kategori Pelapor; hover Top 10 merchant menampilkan rincian per Jenis Dugaan.

### Diubah
- Master Mitra menjadi Mitra Vendor (rute `master/mitra-vendor`; tautan lama dialihkan; key data tetap `mitra`). Semua field Mitra/Vendor (Kajian Nama Mitra, Kontrak Nama Mitra, Risk Register Vendor / Mitra) menjadi dropdown master tanpa Lainnya. Seed master ditambah PT Jaringan Nusa dan PT Data Aman.
- Unit Kerja tanpa Lainnya di Kajian, Kontrak, Layanan Hukum, Regulatory Change, dan Form tracker.
- Kajian Risiko: kartu mitra dipisah menjadi dua kartu berdampingan; modal Selesai tanpa teks keterangan.
- Fraud: Kategori Pelapor dan Produk dari master tanpa Lainnya; seed Produk UE/QRIS/Biller. Saldo Tertahan wajib bila Tindakan Blokir.
- `APP_KEY` naik ke v11.

### Dihapus
- Fraud: field No. Rekening (data tersimpan lama diabaikan).

## [2.9.2] - 2026-10-30

Estimasi token: ~130k (cek ulang oleh agent terpisah dan perbaikan)

### Diperbaiki
- Simulasi notifikasi menampilkan contoh statis hanya jika tidak ada data yang cocok, sama dengan tracker.

## [2.9.1] - 2026-10-30

Estimasi token: ~300k (QA penuh oleh agent terpisah dan perbaikan)

### Diperbaiki
- Alert "Peraturan baru berdampak Tinggi" di Regulatory Change punya data contoh.
- Nama master bawaan yang mengandung karakter di luar aturan bisa disimpan selama tidak diubah. Nama baru atau yang diubah tetap hanya boleh huruf, angka, spasi, dan ` ' - &.
- Contoh email alert SOP memakai SOP yang ada di daftar.
- Data contoh APH yang PIC-nya kosong sekarang punya PIC.
- Data demo direset (key `clrm.app.v10`).

## [2.9.0] - 2026-10-30

Estimasi token: ~400k (Request Product.xlsx: master, Regulatory Change, SOP, Risk Register, RAS-RT)

### Ditambahkan
- Field `multidrop` di kit: dropdown pilih banyak dengan chip yang bisa dihapus (dipakai SOP di Regulatory Change).
- RAS-RT otomatis di Risk Register: Low = Dalam Appetite, Medium = Dalam Toleransi, High = Breach (wajib eskalasi). Detail menampilkan kriteria Appetite/Tolerance/Breach domain terpilih (konstanta `RAS_RT`, 10 domain dari sheet).
- Pemerintah-DPR kembali jadi pilihan Regulator di Tracker, Regulatory Reporting, dan Regulatory Change.

### Diubah
- Regulatory Change: Tindak Lanjut menjadi satu teks; Tanggal Sosialisasi Internal wajib; SOP yang harus diperbarui memakai dropdown pilih banyak; PIC tidak dapat mengubah; tooltip rata-rata pemenuhan hanya persen.
- SOP: Pemilik Dokumen dari Master Unit Kerja tanpa Lainnya; PIC Dokumen wajib; hover Umur dokumen dan SOP per status menampilkan rincian per Unit Kerja.
- Risk Register: heatmap berlabel Tinggi/Sedang/Rendah dan "Skor n"; Unit Kerja dan Produk tanpa Lainnya; tooltip Risiko per unit kerja memuat High/Medium/Low.
- Master Unit Kerja, Kategori Pelapor, dan Laporan memakai data sheet; seed Reporting memakai nama dan jadwal sheet.
- `APP_KEY` clrm.app.v9 dan `KEY` tracker clrm.db.v8 (data lama tidak dibaca; load() tetap aman terhadap bentuk lama).

### Dihapus
- Simpan filter di semua tabel dan tracker.
- Tombol "+ SOP cepat", centang "sudah diperbarui" per SOP, dan Daftar revisi SOP (beserta toggle Revisi dokumen).

## [2.8.3] - 2026-10-30

Estimasi token: ~120k (cek ulang oleh agent terpisah dan perbaikan)

### Diperbaiki
- Subjek email simulasi tidak lagi mengulang kata, misalnya "Laporan Laporan RBSP".
- Tanggal di isi email simulasi memakai format dd/mm/yyyy.

## [2.8.2] - 2026-10-30

Estimasi token: ~190k (cek ulang oleh agent terpisah dan perbaikan)

### Diperbaiki
- Isi email simulasi di semua halaman tidak lagi menampilkan nomor internal data.
- README memakai nama key penyimpanan yang berlaku.

## [2.8.1] - 2026-10-30

Estimasi token: ~360k (QA penuh oleh agent terpisah dan perbaikan)

### Diperbaiki
- PIC hanya bisa mengedit data miliknya di Permintaan APH dan Perizinan.
- Semua tabel di dashboard punya kolom No yang mulai dari 1.
- Nomor internal data tidak lagi tampil di UI. Menu Approval, judul modal, email simulasi, dan Log memakai nama data.
- Filter bulan Custom yang tidak berisi data menampilkan bulan kosong.
- Nama request penutupan tracker sama di menu Approval dan Log Perubahan: Penutupan Temuan.
- Pesan error Alasan Terlambat di Reporting tidak lagi tampil dua kali.
- Data demo direset (key `clrm.app.v8` dan `clrm.db.v7`).

## [2.8.0] - 2026-10-30

Estimasi token: ~300k

### Ditambahkan
- Master Data PIC (Regie, Fakhri, Osama). Semua field PIC di semua halaman kini dropdown dari master ini (tanpa Lainnya).
- Filter bulan per grafik (Seluruh Waktu, 3/6/9/12 bulan terakhir, Custom dengan input bulan) untuk semua grafik per bulan: komponen bersama `useMonthRange` + `MonthRangeFilter`.
- Tooltip persen dengan rincian x/y di grafik persen (Rata-rata pemenuhan per kategori) dan tile % Selesai tracker.
- Regulatory Reporting: field Waktu Kejadian (opsional) untuk semua laporan; Status Terlambat bisa dipilih manual jika Batas Waktu sudah lewat.

### Diubah
- Master Regulator dihapus; dropdown regulator memakai daftar tetap per halaman (Tracker BI/PPATK/Komdigi/BSSN/Lainnya, Reporting BI/PPATK/Komdigi/BSSN, Regulatory Change + Pemerintah-DPR/Lainnya). Sumbu regulator di dashboard mengikuti daftar itu.
- Kolom nomor tabel dashboard (mini tabel) = posisi baris 1..n.
- Tabel menampilkan "Lainnya" untuk teks bebas pilihan Lainnya; Detail dan Export tetap teks aslinya.
- Regulatory Reporting: Nama Laporan teks bebas, Batas Waktu hanya tanggal, teks bantu insidental dihapus, Alasan Terlambat wajib saat Terlambat.
- Regulatory Change: label "Jawab imbauan" menjadi "Imbauan".
- Log Perubahan: keputusan approval berjudul "Approval: Approve — jenis" / "Approval: Reject — jenis"; Approve menampilkan field berubah, Reject hanya aksi.
- Akun demo PIC menjadi Regie, Fraud Investigator menjadi Fakhri (agar aturan PIC pemilik data tetap jalan). Data demo direset (key `clrm.app.v7`, `clrm.db.v6`).

## [2.7.3] - 2026-10-30

Estimasi token: ~120k (cek ulang oleh agent terpisah dan perbaikan)

### Diperbaiki
- Log Perubahan menampilkan entri Dibatalkan juga untuk data yang dibatalkan sebelum log tercatat, misalnya data contoh.
- Tanggal batal data contoh Fraud tetap, tidak berubah setiap hari. Data demo direset (key `clrm.app.v6`).

## [2.7.2] - 2026-10-30

Estimasi token: ~160k (cek ulang oleh agent terpisah dan perbaikan)

### Diperbaiki
- Export tracker: Tanggal Dibuat memakai format dd/mm/yyyy HH:mm:ss dan berada di kolom kedua, sama dengan halaman lain.
- Kasus Fraud contoh yang dibatalkan tercatat atas nama orang, bukan peran. Data demo direset (key `clrm.app.v5`).

## [2.7.1] - 2026-10-30

Estimasi token: ~330k (QA penuh oleh agent terpisah dan perbaikan)

### Diperbaiki
- Export Excel di semua halaman kit: kolom Nomor urut (terbaru di atas) dan Tanggal Dibuat. Nomor internal tidak ikut diekspor.
- Tanggal di Log Perubahan tracker dan export tracker memakai format dd/mm/yyyy.
- Kolom nomor dokumen di Kontrak, Perizinan, dan Regulatory Change tidak lagi bernama "Nomor".
- Data contoh: "Data dibuat" menampilkan nama orang. Tanggal Dibuat tidak lagi sama dengan waktu buka halaman. Kasus Fraud contoh bisa diedit tanpa mengisi field yang hanya wajib saat Closed.
- Data demo direset (key `clrm.app.v4`).

## [2.7.0] - 2026-10-30

Estimasi token: ~250k

### Diubah
- Dashboard Reporting: tabel Jatuh tempo 7 hari ke depan tidak lagi punya pager ganda dan latar kuning.
- Semua tabel: kolom Tanggal Dibuat. Nomor menunjukkan urutan baris, 1 adalah data terbaru. Sort per kolom dihapus.
- Master Data: nama boleh memakai karakter ` ' - &. Opsi "Lainnya" dihapus dari data master dan otomatis tersedia di setiap dropdown.

### Ditambah
- Detail: field Tanggal Dibuat dan segmen Log Perubahan berisi data dibuat, perubahan field (sebelum dan sesudah), pengajuan dan hasil approval, batal, dan kembalikan. Setiap entri punya timestamp dd/mm/yyyy HH:mm:ss dan user pelaku serta approver.
- Data demo direset (key `clrm.app.v3` dan `clrm.db.v5`).

## [2.6.1] - 2026-10-30

Estimasi token: ~200k (QA penuh oleh agent terpisah dan perbaikan)

### Diperbaiki
- Nama master yang panjang tanpa spasi tidak lagi melebarkan tabel.
- Data contoh memakai nama Unit Kerja yang sama dengan master (Operation, Support (HRD & GA), Finance, Accounting, Tax & Treasury). Data demo halaman CR direset (key `clrm.app.v2`).

## [2.6.0] - 2026-10-30

Estimasi token: ~200k

### Diubah
- Master Data: tabel selebar halaman tanpa pagination. Tambah dan edit lewat modal. Validasi nama: wajib, 2 sampai 255 karakter, hanya huruf, angka, dan spasi, tidak boleh duplikat.
- Kolom Aksi master berisi Edit dan Hapus. Hapus memakai konfirmasi.
- Daftar master: Laporan, Regulator, Kategori Regulasi, Unit Kerja (sebelumnya Departemen), Produk, Mitra, Kategori Pelapor (menggantikan Pihak Pelapor), Media Pelapor.
- Label "Departemen" menjadi "Unit Kerja" di semua halaman.
- Dropdown halaman memakai master: Regulator, Kategori Regulasi, Unit Kerja, Laporan, Mitra, Kategori Pelapor, Media Pelapor.

### Ditambah
- Di semua modal tambah dan edit, dropdown yang punya opsi "Lainnya" memunculkan field teks wajib saat opsi itu dipilih.

## [2.5.1] - 2026-10-30

Estimasi token: ~25k

### Diubah
- Kalender tampilan Hari tidak lagi menandai hari ini. Tampilan Minggu dan Bulan tetap biru.
- Semua tabel di dashboard (semua halaman) memakai pagination tetap 5 data per halaman, tanpa pilihan Baris per halaman.

## [2.5.0] - 2026-10-30

Estimasi token: ~40k

### Diubah
- Kalender (semua halaman yang memakainya) menandai hari ini dengan sel biru.
- Regulatory Reporting: tooltip Ketepatan waktu menampilkan persentase dan rincian jumlah (tepat waktu / total).
- Regulatory Reporting: Tren laporan terlambat punya filter sendiri (Seluruh Waktu, 3, 6, 9, 12 bulan terakhir, custom pilih bulan).
- Regulatory Reporting: tabel Jatuh tempo 7 hari ke depan memakai pagination 5 data per halaman.

## [2.4.1] - 2026-10-30

Estimasi token: ~10k

### Diperbaiki
- Filter Tren 3, 6, 9, 12 bulan terakhir menampilkan tepat N bulan termasuk bulan ini. Sebelumnya ada 1 bulan tambahan karena perhitungan memakai UTC.

## [2.4.0] - 2026-10-30

Estimasi token: ~60k

### Diubah
- Dashboard tracker: tabel Temuan Lewat Batas Waktu tanpa kolom nomor.
- Tren Penyelesaian punya filter waktu sendiri (Seluruh Waktu, 3, 6, 9, 12 bulan terakhir, custom), lepas dari filter atas.
- Label "Nomor Temuan" menjadi "Nomor".
- Detail: baris alert hanya tampil kalau temuan punya alert.
- Alasan perubahan Batas Waktu terakhir tampil di modal Edit dan Detail. Ubah Batas Waktu wajib diberi alasan baru.
- Tombol Import Excel disembunyikan di semua halaman. Kodenya tetap ada (`SHOW_IMPORT`).

## [2.3.0] - 2026-10-29

Estimasi token: ~25k

### Diubah
- Setelah lolos login gate, app langsung membuka dashboard sebagai Super Admin. Login mock email, password, dan 2FA dihapus.
- Logout menghapus sesi dan kembali ke halaman login gate.

## [2.2.2] - 2026-10-29

Estimasi token: ~30k

### Diperbaiki
- Pratinjau import menampilkan tanggal sebagai YYYY-MM-DD, bukan teks tanggal mentah.

## [2.2.1] - 2026-10-29

Estimasi token: ~220k (cek ulang di prod dan perbaikan)

### Diperbaiki
- Import tracker menolak tanggal yang tidak ada dan menampilkan semua error dalam satu baris.
- Rentang kalender BAP sama dengan judulnya (30 hari).

## [2.2.0] - 2026-10-29

Estimasi token: ~950k (QA penuh di prod oleh 3 agent, lalu perbaikan)

### Diperbaiki
- Regulatory Change: PIC hanya bisa mengubah item tindak lanjut miliknya. PIC tidak bisa menambah, menghapus, atau memindah item.
- Tracker: Kembalikan wajib alasan. Simulasi menampilkan sampai 3 email per jenis alert. Export tercatat di Log dan mengikuti permission.
- Import Excel menolak tanggal yang tidak ada dan menampilkan semua error dalam satu baris.
- Tanggal Masuk di Layanan Hukum dan Kajian wajib alasan saat diubah.
- Kalender BAP di Permintaan APH menampilkan 30 hari ke depan tanpa pindah halaman.
- Form Edit menampilkan status otomatis saat ini di bawah Status.
- Aksi baris (misalnya Selesai di Kajian) mengikuti permission Ubah.
- Import Kajian menerima status Selesai. Import SOP menerima data belum lengkap.
- Jumlah visual Reporting, Regulatory Change, dan Kajian sesuai CR. Seed Regulatory Change menjadi 30 data.

## [2.1.0] - 2026-10-29

Estimasi token: ~150k

### Diubah
- Tracker: approval hanya untuk penutupan temuan (status ke Selesai), diputus di menu Approval. Edit lain langsung tersimpan.
- Detail tracker menampilkan status request yang menunggu dan link ke menu Approval. Tombol Setujui dan Tolak di detail dihapus.

### Ditambah
- Import Excel di tracker.

## [2.0.0] - 2026-10-29

Estimasi token: ~2,2 juta (rencana, fondasi, 9 halaman paralel, audit, perbaikan)

### Ditambah
- Page kit bersama di `src/kit` sebagai dasar semua halaman.
- 10 halaman CR: Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol, Risk Register, Kajian Risiko, Fraud Case Monitoring, Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum.
- Menu Approval, Master Data (Departemen, Produk, Pihak Pelapor), Admin (Akun, Permission), Log aktivitas.
- Login mock email, password, dan 2FA. Reset password, ganti password, ganti PIN, logout.
- `docs/plan-halaman.md` dan `docs/keputusan-desain.md`.

### Diubah
- Judul detail tracker menjadi "Detail", tanpa badge status dan tingkat risiko.
- Tombol tracker mengikuti matriks permission. Request tracker tampil dan bisa diputus di menu Approval.

## [1.5.0] - 2026-10-29

Estimasi token: ~40k

### Diubah
- Detail temuan tampil di modal seperti Tambah dan Ubah.

### Dihapus
- Riwayat, penomoran field, tombol Ubah dan Ajukan Penutupan dari detail.

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
