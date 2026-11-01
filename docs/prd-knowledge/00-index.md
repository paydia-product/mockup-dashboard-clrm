# 00 - Indeks Pengetahuan Mockup Dashboard CLRM (v2.14.4)

## A. Tujuan dan urutan baca

Dokumen 00 sampai 05 adalah bahan baku untuk agen yang menulis PRD Dashboard Monitoring CLRM. Isinya menggambarkan perilaku mockup final v2.14.4. Sumber kebenaran adalah kode di repo ini. Bila panduan halaman, README, atau `docs/*.md` berbeda dari kode, dokumen ini mengikuti kode dan mencatat selisihnya.

Aturan pakai untuk agen PRD:
- Keputusan final (meeting 29 dan 30 Oktober 2026) menang atas mockup. Bagian C mendaftar semua selisih. Tulis versi keputusan di requirement, lalu catat selisih di Open Questions.
- Fitur mockup yang tidak ada di keputusan tetap masuk PRD. Bagian D mendaftarnya sebagai "tambahan mockup".
- Data contoh (nama vendor, merchant, angka dummy) bukan requirement.
- Matriks izin default di bagian E sudah dihitung dari kode. Pakai bagian E untuk blok `perm` di PRD.

Urutan baca:
1. `00-index.md` (dokumen ini): peta halaman, selisih, matriks izin, konvensi.
2. `01-global.md`: gate login, sesi, layout, peran dan izin, notifikasi, perilaku kit bersama, Approval, Admin, Log, Master Data, Ganti Password dan PIN.
3. `02-compliance-a.md`: Regulatory Findings Tracker dan Regulatory Reporting.
4. `03-compliance-b.md`: Regulatory Change dan SOP & Dokumen Kontrol.
5. `04-risk-fraud.md`: Risk Register, Kajian Risiko, Fraud Case Monitoring.
6. `05-legal.md`: Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum.

## B. Menu dan halaman

| Menu | Halaman | Dokumen |
| --- | --- | --- |
| (di luar aplikasi) | Gate password server, Logout | 01 bagian 1 dan 2 |
| Header | Akun demo, pemilih versi, lonceng notifikasi, menu avatar | 01 bagian 3 dan 5 |
| Compliance | Regulatory Findings Tracker | 02 bagian A |
| Compliance | Regulatory Reporting | 02 bagian B |
| Compliance | Regulatory Change | 03 |
| Compliance | SOP & Dokumen Kontrol | 03 |
| Risk | Risk Register | 04 |
| Risk | Kajian Risiko | 04 |
| Fraud | Fraud Case Monitoring | 04 |
| Legal | Kontrak | 05 bagian 1 |
| Legal | Permintaan APH | 05 |
| Legal | Perizinan & Dokumen Legalitas | 05 |
| Legal | Permintaan Layanan Hukum | 05 |
| Approval | Approval (daftar dan Detail request) | 01 bagian 7 |
| Master Data | 11 daftar: Laporan, PIC, Kategori Regulasi, Unit Kerja, Produk, Mitra Vendor, Kategori Pelapor, Media Pelapor, Jenis PKS Kontrak, Instansi Pengirim APH, Kategori Dokumen Perizinan | 01 bagian 10 |
| Admin | Admin (tabel akun, Add, Edit, Manage Permissions, Refresh Permissions) | 01 bagian 8 |
| Log | Log aktivitas | 01 bagian 9 |
| Menu avatar | Ganti Password, Ganti PIN | 01 bagian 11 |

Setiap halaman modul (11 halaman) punya tab Dashboard (tab pertama) dan tab Table. Tab Dashboard hanya tampil bila akun punya izin Dashboard kategori itu. Semua akun bawaan punya izin itu.

## C. Selisih mockup vs keputusan final

Sumber keputusan: bagian "Keputusan yang sudah final" di prompt PRD tanggal 1 November 2026.

| Halaman | Keputusan final | Perilaku mockup | Catatan |
| --- | --- | --- | --- |
| Umum | Fitur pendukung Login, 2FA, Reset Password | Hanya gate password bersama di server (bukan per akun). Tidak ada 2FA dan Reset Password. Peran diganti lewat "Akun demo" | 01 bagian 1, 2, 15 |
| Umum | Semua kolom unit kerja bernama Departemen, dari Master Data Departemen | Label "Unit Kerja" (juga "Unit Kerja Terdampak", "Unit Kerja Pemohon", "Unit Pemilik", "Pemilik Dokumen"). Master bernama "Unit Kerja". Isi sudah mengikuti daftar departemen | Berlaku di Tracker, Regulatory Change, SOP, Risk Register, Kajian, Kontrak, Layanan Hukum |
| Umum | Master Data memuat pihak pelapor | Ada "Kategori Pelapor" dan "Media Pelapor". Tidak ada master "Pihak Pelapor" | 01 bagian 10.5 |
| Umum | Data tidak dihapus permanen | Data modul tidak dihapus (Batalkan). Master Data memakai tombol Hapus permanen dari daftar | 01 bagian 10 |
| Umum | Log mencatat semua aksi | Login, 2FA, lihat detail, upload, buka sensor, import tidak dicatat saat dipakai. Hanya ada di data contoh Log | 01 bagian 9 |
| Umum | Approval hanya untuk tutup temuan Tracker, close case Fraud, dan persetujuan lain di CR | Ada 4 jenis: Penutupan Temuan, Penutupan Kasus, Perubahan Daftar Peraturan (Ketua SMKI), Perubahan Level Risiko (Risk Officer) | Keempatnya ada di CR (lihat C.1) |
| Umum | Atur permission per akun | Ada, tetapi per kategori (Compliance, Risk, Fraud, Legal, Approval, Master Data, Log, Admin), bukan per halaman. Update mencakup Ubah dan Batalkan sekaligus | Lihat bagian E |
| Umum | Tidak ada fitur import | Tombol Import tersembunyi di semua halaman. Kode import masih ada | 01 bagian 12 |
| Regulatory Findings Tracker | Progress diisi manual | Tidak ada kolom Progress | 02 |
| Regulatory Findings Tracker | Rencana Tindak Lanjut & Bukti: teks dan file, bisa lebih dari satu | Satu teks Rencana Tindak Lanjut dan satu file bukti | 02 |
| Regulatory Findings Tracker | Tren per bulan: all time, 3 bulan terakhir, per kuartal, custom | Seluruh Waktu, 3, 6, 9, 12 bulan terakhir (default 12), Custom. Tidak ada per kuartal | 02 |
| Regulatory Findings Tracker | Menutup temuan: Validasi Ulang, lalu approval Head CLRM | Validasi Ulang lewat dua jalur (tombol di Detail oleh Compliance Officer, atau isian saat Edit ke Selesai). Nilai "Belum" lolos validasi saat Edit ke Selesai | 02 |
| Regulatory Findings Tracker | Mencatat semua permintaan regulator termasuk permintaan data | Tidak ada pembeda jenis temuan atau permintaan data | 02 |
| Regulatory Reporting | Insidental untuk laporan insidental PBI atau PADG | Insidental ada, dipakai terutama untuk insiden siber (Waktu Kejadian, alert jam berjalan) | 02 |
| Regulatory Reporting | Membatalkan laporan berulang menghapus jadwal berikutnya | Tidak ada laporan berulang. Batalkan hanya berlaku untuk satu laporan | 02 |
| Regulatory Reporting | Edit tanpa approval | Sesuai, tetapi selain Super Admin hanya 5 kolom yang bisa diubah | 02 |
| Regulatory Change | Dampak memakai tingkat dampak saja | Tingkat Dampak ditambah Uraian Dampak (wajib) | 03 |
| Regulatory Change | Pemenuhan manual dan opsional | Sesuai, ditambah Status Kepatuhan otomatis (Comply, Partial, Gap, Belum Dinilai) dan Tindak Lanjut wajib bila Partial atau Gap | 03 |
| Regulatory Change | Upload dokumen peraturan | Isian bernama "Lampiran / Bukti", satu file, opsional | 03 |
| Regulatory Change | Tidak disebut punya approval | Edit isian identitas peraturan butuh approval Ketua SMKI | 03 |
| SOP & Dokumen Kontrol | Klasifikasi dari ISO, saat ini semua Internal | Empat pilihan (Publik, Internal, Rahasia, Sangat Rahasia), tidak dikunci ke Internal | 03 |
| SOP & Dokumen Kontrol | Dokumen SOP diunggah | Ada, tetapi opsional | 03 |
| SOP & Dokumen Kontrol | Batalkan tidak menghapus data | Status hasil Batalkan bernama "Dicabut", sama dengan status manual "Dicabut" | 03 |
| Risk Register | Approval hanya yang ada di CR | Ada approval Perubahan Level Risiko (approver Risk Officer) bila pengubah bukan Risk Officer | 04 |
| Kajian Risiko | Batalkan wajib alasan | Ada dua status batal: "Batal" (status manual) dan "Dibatalkan" (aksi Batalkan) | 04 |
| Fraud Case Monitoring | No. Laporan EDD `EDD/YYYY/MM/DD/NNNN` | `EDD/YYYY/MM/NNNN`, urutan mulai lagi tiap bulan | 04 |
| Fraud Case Monitoring | Batas waktu EDD = tanggal surat EDD + 2 hari kerja, notifikasi saat jatuh tempo | Rumus sementara: Tanggal Terima + 3 hari kerja bila EDD 1 kosong, selain itu EDD 1 + 7 hari kalender. Alert muncul setelah lewat batas | 04 |
| Fraud Case Monitoring | Semua peran yang punya akses halaman bisa membuka sensor | Sesuai sejak v2.14.5: semua peran punya ikon mata. Export selalu tersamar | 04 |
| Fraud Case Monitoring | Nama merchant: teks uraian, bisa banyak, bisa dicari, tidak tampil di tabel | Tidak ada field Nama Merchant. Hanya Group Merchant (satu teks) dan Nama Terlapor | 04 |
| Fraud Case Monitoring | Visual punya filter produk UE dan QRIS | Tidak ada filter produk di Dashboard. Produk hanya filter Table | 04 |
| Kontrak | Mitra dari Master Data | Master hanya untuk Jenis Hubungan selain Merchant. Merchant memakai teks bebas | 05 |
| Kontrak | Jenis dokumen dari Master Data jenis PKS | Sesuai, ditambah opsi Lainnya teks bebas | 05 |
| Permintaan APH | Instansi pengirim tingkat Polda dan Bareskrim | Master berisi juga Polres, PPATK, Kejaksaan, ditambah Lainnya | 05 |
| Permintaan APH | Chart merchant atau group terbanyak top 5 | Hanya Top 5 Group Merchant | 05 |
| Permintaan APH | Kalender BAP 30 hari tanpa filter | Kalender mengikuti filter Periode Tanggal Terima Surat | 05 |
| Permintaan APH | Group merchant = PT induk, merchant = sub merchant | Dua teks bebas tanpa relasi | 05 |
| Permintaan APH | Semua file bukti opsional | Tidak ada upload file | 05 |
| Perizinan & Dokumen Legalitas | Edit tanpa approval, dengan alasan perubahan | Alasan perubahan ada tetapi opsional | 05 |
| Permintaan Layanan Hukum | Jenis bisa ditambah | Jenis daftar tetap di kode ditambah Lainnya. Tidak ada Master Data jenis | 05 |

### C.1 Keputusan pemilik produk, 1 November 2026 (mengikat)

Keputusan ini menggantikan "Keputusan final" untuk baris yang disebut. Tulis requirement PRD sesuai kolom "Requirement PRD". Jangan masukkan butir ini ke Open Questions.

| Topik | Requirement PRD |
| --- | --- |
| Label unit kerja | Pakai label mockup "Unit Kerja" (beserta "Unit Kerja Terdampak", "Unit Kerja Pemohon", "Unit Pemilik", "Pemilik Dokumen"). Bukan selisih. |
| No. Laporan EDD Fraud | Format mockup `EDD/YYYY/MM/NNNN`, urutan mulai lagi dari 0001 tiap bulan, otomatis, tidak bisa diedit. |
| Batas waktu EDD Fraud | Rumus mockup: Tanggal Terima + 3 hari kerja selama Tanggal EDD 1 kosong. Setelah EDD 1 terisi: Tanggal EDD 1 + 7 hari kalender. Alert muncul setelah batas terlewat. |
| Sensor Fraud | Semua peran yang bisa membuka halaman Fraud punya ikon mata untuk Nama Terlapor dan RRN (header kolom Table, label Detail, label form Edit). Bawaan tersamar. Export selalu tersamar untuk semua peran. Ganti akun menutup lagi sensor yang terbuka. Sudah diterapkan di v2.14.5 dan v2.14.6. |
| Nama Merchant Fraud | Pakai mockup: tidak ada field Nama Merchant. Yang ada Group Merchant (teks) dan Nama Terlapor. |
| Filter produk Fraud | Pakai mockup: Produk (UE, QRIS, Biller dari Master Data) ada sebagai filter di tab Table. Dashboard tidak punya filter produk. [Menunggu jawaban pemilik produk apakah Dashboard juga perlu filter produk.] |
| Progress Tracker | Pakai mockup: tidak ada kolom Progress. |
| Tren Tracker | Pakai mockup: Seluruh Waktu, 3, 6, 9, 12 bulan terakhir (bawaan 12), Custom. Tidak ada per kuartal. |
| Rencana Tindak Lanjut Tracker | Satu isian teks bebas (pengguna bisa menulis beberapa rencana dalam satu teks) dan satu file bukti opsional. |
| Permission per kategori | Pakai perilaku mockup apa adanya: Head CLRM bisa Ubah dan Batalkan di semua halaman modul; PIC bisa Tambah di halaman Compliance, Risk, dan Legal; Officer bisa Batalkan di kategorinya. Matriks bagian E adalah requirement. |
| Approval | Empat jenis approval semuanya ada di CR 6 Oktober 2026: Penutupan Temuan Tracker (Head CLRM, setelah Validasi Ulang), Penutupan Kasus Fraud (Head CLRM), Perubahan Daftar Peraturan Regulatory Change (CR: "Daftar peraturan versi baru disetujui Ketua SMKI"), Perubahan Level Risiko Risk Register (CR: "Perubahan level risiko dicek Risk Officer"). |

Dokumen CR asli: `CR Pengajuan Dashboard ttd_Fakhrirafi Zharfan.pdf` (diberikan pemilik produk). Baris lain di tabel C tetap ditulis versi keputusan final di PRD dan dicatat di Open Questions, kecuali pemilik produk memutuskan lain.

## D. Tambahan mockup (tidak ada di keputusan)

Umum:
- Pemilih "Akun demo" di header dan log "Ganti akun demo".
- Pemilih versi, changelog, dan tombol reset data contoh.
- Gate password bersama dengan batas 5 gagal per 15 menit per IP.
- Panduan Halaman dan ikon info (i) di setiap visual.
- Pusat notifikasi dengan status baca per akun, "Tandai semua dibaca", dan tautan buka Detail.
- Status akun 4 nilai (Active, Inactive, Archive, Suspend) dan tombol Refresh Permissions.
- Badge jumlah request di menu Approval.
- Filter Periode global tab Dashboard, filter bulan per grafik garis, drill dari visual ke tab Table.
- Log Perubahan (riwayat) di modal Detail.
- Opsi "Lainnya" dengan teks bebas di dropdown tertentu.
- Master Data "Laporan" (tidak dipakai form) dan "PIC".
- Alasan "Kembalikan" wajib.

Per halaman:
- Tracker: Penyebab Utama, Jenis Penyebab, Tingkat Risiko, Unit Kerja, Validasi Ulang, Nama Validator, Persetujuan Penutupan, Alasan perubahan Batas Waktu (wajib bila Batas Waktu diubah), 3 alert dengan eskalasi "Direktur terkait".
- Reporting: status Belum Disiapkan, Disusun, Review; PIC Penyusun dan Reviewer harus beda; Tepat Waktu? otomatis; Bukti Pengiriman dan Nomor Tanda Terima; alert "Terkirim tanpa bukti" dan alert insiden siber.
- Regulatory Change: Jenis Perubahan, Status Peraturan, Peraturan yang Diubah / Dicabut, alur jawaban Imbauan, Tanggal Sosialisasi Internal (wajib), keunikan Jenis + Nomor + Tahun, alert SOP terkait perlu diperbarui.
- SOP: Ringkasan, No Revisi, Tanggal Perubahan Terakhir, PIC Dokumen, Status, alert "Peninjauan terlewat" dan "Data belum lengkap", keunikan No Dokumen.
- Risk Register: alert "Risiko High baru / naik ke High", Domain Risiko 10 nilai tetap, kolom skor dan Level.
- Kajian Risiko: Jenis (5 nilai), SLA hari kalender, isian vendor tambahan, status manual Batal, 4 alert.
- Fraud: Jenis Pengguna, Rincian Dugaan, Alasan Asesmen, Hold Settlement, Saldo Tertahan, tiga Tanggal Lapor (Komdigi 7, BI 14, PPATK 30 hari), PIC Investigator, enam alert.
- Kontrak: Jenis Hubungan, Lama Perpanjangan, aturan PIC atau Unit Pemilik salah satu wajib, status otomatis Akan Berakhir dan Kedaluwarsa, PIC hanya ubah 4 kolom.
- APH: sensor Nama Penyidik dan No. Telepon Penyidik, status Active dan Done, Tanggal Jadwal Ulang BAP, 3 alert.
- Perizinan: Perpanjang izin dengan Versi Sebelumnya, Kewajiban Pelaporan, status Dalam Perpanjangan dan Tidak Berlaku, alert ke "Direksi".
- Layanan Hukum: Prioritas, status Batal, Edit terkunci setelah Selesai atau Batal, alasan wajib bila Tanggal Masuk atau SLA diubah, 3 alert.

## E. Matriks izin default efektif

Cara hitung: setiap akun menyimpan izin per kategori (`permissions`). Izin awal diturunkan dari peran lewat `permsOf`. Tombol di halaman memakai `canAccount`. Matriks ini hasil menjalankan kedua fungsi itu untuk 9 peran, lalu menambahkan aturan baris per halaman (`canEditRow`) dan aturan approver (`canDecide`). Super Admin bisa mengubah izin per akun di Admin. Matriks ini hanya nilai awal.

Singkatan peran: SA = Super Admin, HC = Head CLRM, CO = Compliance Officer, RO = Risk Officer, LO = Legal Officer, FI = Fraud Investigator, SMKI = Ketua SMKI, PIC = PIC, VW = Viewer.

Nilai: Ya, Tidak, Milik sendiri. "Milik sendiri" hanya berlaku untuk Ubah. Aturan ini tidak berlaku untuk Batalkan dan Kembalikan.

### E.1 Halaman modul

| Halaman | Aksi | SA | HC | CO | RO | LO | FI | SMKI | PIC | VW |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Semua 11 halaman modul | Lihat, tab Dashboard, Export | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Regulatory Findings Tracker | Tambah | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Findings Tracker | Ubah | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Milik sendiri | Tidak |
| Regulatory Findings Tracker | Batalkan dan Kembalikan | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Findings Tracker | Approve Penutupan Temuan | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Regulatory Reporting | Tambah | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Reporting | Ubah | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Milik sendiri | Tidak |
| Regulatory Reporting | Batalkan dan Kembalikan | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Change | Tambah | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Change | Ubah | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Regulatory Change | Batalkan dan Kembalikan | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Regulatory Change | Approve Perubahan Daftar Peraturan | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Ya | Tidak | Tidak |
| SOP & Dokumen Kontrol | Tambah | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| SOP & Dokumen Kontrol | Ubah | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Milik sendiri | Tidak |
| SOP & Dokumen Kontrol | Batalkan dan Kembalikan | Ya | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Risk Register | Tambah | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Tidak | Ya | Tidak |
| Risk Register | Ubah | Ya | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Milik sendiri | Tidak |
| Risk Register | Batalkan dan Kembalikan | Ya | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Ya | Tidak |
| Risk Register | Approve Perubahan Level Risiko | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |
| Kajian Risiko | Tambah | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Tidak | Ya | Tidak |
| Kajian Risiko | Ubah dan aksi Selesai | Ya | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Milik sendiri | Tidak |
| Kajian Risiko | Batalkan dan Kembalikan | Ya | Ya | Tidak | Ya | Tidak | Tidak | Tidak | Ya | Tidak |
| Fraud Case Monitoring | Tambah | Ya | Tidak | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Tidak |
| Fraud Case Monitoring | Ubah | Ya | Ya | Ya | Tidak | Tidak | Milik sendiri | Tidak | Milik sendiri | Tidak |
| Fraud Case Monitoring | Batalkan dan Kembalikan | Ya | Ya | Ya | Tidak | Tidak | Ya | Tidak | Ya | Tidak |
| Fraud Case Monitoring | Approve Penutupan Kasus | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Fraud Case Monitoring | Buka sensor Nama Terlapor dan RRN | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Kontrak | Tambah | Ya | Tidak | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Kontrak | Ubah | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Milik sendiri | Tidak |
| Kontrak | Batalkan dan Kembalikan | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan APH | Tambah | Ya | Tidak | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan APH | Ubah | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Milik sendiri | Tidak |
| Permintaan APH | Batalkan dan Kembalikan | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan APH | Buka sensor Nama Penyidik dan No. Telepon | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Tidak | Tidak |
| Perizinan & Dokumen Legalitas | Tambah | Ya | Tidak | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Perizinan & Dokumen Legalitas | Ubah | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Milik sendiri | Tidak |
| Perizinan & Dokumen Legalitas | Batalkan dan Kembalikan | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan Layanan Hukum | Tambah | Ya | Tidak | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan Layanan Hukum | Ubah | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |
| Permintaan Layanan Hukum | Batalkan dan Kembalikan | Ya | Ya | Tidak | Tidak | Ya | Tidak | Tidak | Ya | Tidak |

Arti "Milik sendiri" per halaman:
- Tracker: nama PIC temuan sama dengan nama akun.
- Reporting: nama akun sama dengan PIC Penyusun atau PIC Reviewer.
- SOP: nama akun sama dengan PIC Dokumen.
- Risk Register: Unit Pemilik Risiko sama dengan departemen akun.
- Kajian Risiko: nama akun sama dengan PIC.
- Fraud (FI dan PIC): nama akun sama dengan PIC Investigator. Kasus tanpa PIC Investigator tidak bisa diubah oleh FI dan PIC.
- Kontrak: nama akun sama dengan PIC, atau departemen akun sama dengan Unit Pemilik. PIC hanya bisa mengubah Tanggal Berakhir, Perpanjangan, Lama Perpanjangan, Status.
- APH dan Perizinan: nama akun sama dengan PIC.

Aturan baris lain yang berlaku untuk semua peran:
- Ubah dan Batalkan hilang selama data punya request approval berstatus Menunggu.
- Data Dibatalkan tidak bisa diubah. Tombol Kembalikan muncul untuk peran dengan izin Batalkan.
- Tracker dan Kajian: data Selesai tidak bisa diubah. Fraud: kasus Closed tidak bisa diubah. Perizinan: dokumen Tidak Berlaku tidak bisa diubah. Layanan Hukum: data Selesai atau Batal tidak bisa diubah.
- Regulatory Reporting: selain Super Admin hanya 5 kolom yang bisa diubah (Tanggal Pengiriman, Status, Bukti Pengiriman, Nomor Tanda Terima, Alasan Terlambat).
- Tracker: tombol Batalkan dan Kembalikan di modal Detail hanya untuk HC dan SA. Tombol di tabel mengikuti matriks di atas.

Mengapa matriks ini berbeda dari panduan halaman:
- Izin per kategori berlaku untuk semua halaman dalam kategori. PIC boleh Tambah di SOP, jadi PIC mendapat `compliance.create` dan bisa Tambah di Tracker, Reporting, dan Regulatory Change. PIC boleh Tambah di Risk Register dan Layanan Hukum, jadi PIC bisa Tambah di Kajian Risiko, Kontrak, APH, dan Perizinan.
- Update mencakup Ubah dan Batalkan. HC punya Batalkan di matriks peran, jadi HC juga bisa Ubah di semua 11 halaman. CO, RO, LO, FI, dan PIC punya Ubah, jadi mereka juga bisa Batalkan di kategorinya.
- HC tidak punya Tambah di halaman mana pun.
- Izin Approve per kategori tidak cukup. Approve atau Reject juga butuh peran akun sama dengan approver request (atau SA) dan izin `approval.update`. Contoh: SMKI punya `compliance.approve` tetapi tidak bisa memutuskan Penutupan Temuan. HC punya `compliance.approve` tetapi tidak bisa memutuskan Perubahan Daftar Peraturan.
- Hak buka sensor ditentukan oleh nama peran, bukan izin akun. Fraud: semua peran. APH: Super Admin, Head CLRM, Legal Officer.

### E.2 Halaman pendukung

| Halaman | Aksi | SA | HC | CO | RO | LO | FI | SMKI | PIC | VW |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Approval | Lihat daftar dan Detail request | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Approval | Approve dan Reject | Ya | Ya | Tidak | Ya | Tidak | Tidak | Ya | Tidak | Tidak |
| Master Data | Lihat | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Master Data | Tambah | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Master Data | Edit dan Hapus | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Admin | Lihat, Add, Edit, Refresh Permissions | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Log | Lihat dan Export | Ya | Ya | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| Ganti Password dan Ganti PIN | Buka dan simpan | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |

Catatan E.2:
- Approve dan Reject di Approval hanya untuk request yang approver-nya sama dengan peran akun: HC untuk Tracker dan Fraud, SMKI untuk Regulatory Change, RO untuk Risk Register. SA untuk semua.
- Ganti Password dan Ganti PIN memakai izin Lihat kategori Approval. Akun tanpa `approval.view` tidak bisa membukanya.
- Akun baru dari Admin > Add selalu berperan Viewer. Izinnya hanya hasil centang.

## F. Konvensi global

Upload file:
- Format PDF, JPG, JPEG, PNG. Ekstensi dan tipe file harus cocok.
- Ukuran maksimal 25 MB. File 0 byte ditolak.
- Satu file per isian upload. Semua file opsional di status apa pun.
- Pesan error: "File kosong", "Format file harus PDF, JPG, JPEG, atau PNG", "Ukuran file maksimal 25 MB".
- File di mockup hanya tampil nama dan ukuran. File tidak bisa dibuka.

Batalkan dan Kembalikan:
- Tombol "Batalkan" membuka modal dengan "Alasan *". Alasan kosong memunculkan "Alasan wajib diisi.".
- Status hasil: "Dibatalkan" di 9 halaman (Tracker dan 8 halaman kit), "Dicabut" di SOP, "Tidak Berlaku" di Perizinan.
- Data tidak dihapus. Data Dibatalkan tampil abu-abu di tabel, tidak dihitung di Dashboard, tidak memicu notifikasi, dan tidak bisa diubah.
- Tombol "Kembalikan" membuka modal dengan alasan wajib. Status kembali ke status sebelum dibatalkan.
- Batalkan dan Kembalikan tidak memakai approval. Keduanya tercatat di Log dan di Log Perubahan Detail.

Alasan perubahan saat Edit:
- Kit punya isian "Alasan perubahan" di form Edit. Isian ini opsional, kecuali halaman menandai kolom tertentu.
- Alasan wajib bila kolom ini diubah: Batas Waktu (Tracker), Tanggal Masuk atau SLA (Kajian Risiko, Layanan Hukum), dan kolom tertentu di Fraud (lihat 04).
- Pesan kit: "Alasan wajib diisi jika {daftar kolom} diubah". Pesan Tracker: "Alasan wajib diisi jika batas waktu diubah".
- Alasan ikut tercatat di Log dan di request approval.

Notifikasi:
- Semua alert tampil di lonceng header. Tidak ada email dan tidak ada Telegram.
- Notifikasi dihitung ulang dari data setiap kali data berubah. Notifikasi hilang sendiri bila kondisi tidak berlaku lagi. Tidak ada jadwal kirim ulang.
- Warna merah atau kuning per alert.
- Penerima dicocokkan dengan peran akun, nama PIC pada data, atau departemen (Risk Owner). SA melihat semua notifikasi. Penerima tanpa akun (Direksi, CISO, Direktur terkait) hanya terlihat oleh SA.
- Status baca disimpan per akun. Klik item membuka Detail data.
- Filter halaman memakai matriks peran bawaan, bukan izin per akun.

Export dan masking:
- Export Excel memakai baris yang sedang tampil sesuai cari dan filter, termasuk baris Dibatalkan bila lolos filter.
- Kolom: Nomor, Tanggal Dibuat, lalu semua isian Detail.
- Isian bersensor (Nama Terlapor dan RRN di Fraud, Nama Penyidik dan No. Telepon Penyidik di APH) selalu tersamar di Export untuk semua peran, termasuk SA.
- Setiap Export tercatat di Log dengan jumlah baris.
- Membuka sensor tidak dicatat di Log.

Tidak ada import:
- Tombol "Import Excel" tidak tampil di halaman mana pun. Izin Import tidak ada di katalog izin per akun.
- Data lama dimigrasi lewat template Excel yang diisi tim CLRM. IT memasukkan data itu ke database. Tulis ini sebagai asumsi dan kebutuhan non-fungsional, bukan fitur UI.
