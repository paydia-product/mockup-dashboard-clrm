# Pengetahuan PRD 02: Compliance A (Regulatory Findings Tracker dan Regulatory Reporting)

Versi mockup yang didokumentasikan: v2.14.4 (React + Vite + TypeScript, hash routing). Sumber utama adalah KODE. Bila panduan halaman (src/guides/*.ts) berbeda dari kode, kode yang dipakai dan perbedaannya dicatat di bagian "Selisih".

Cakupan file ini: dua halaman di menu Compliance.
1. Regulatory Findings Tracker (src/Tracker.tsx, src/lib.ts, src/Drawer.tsx, src/Form.tsx, src/TrackerImport.tsx, src/Dashboard.tsx, src/guides/tracker.ts).
2. Regulatory Reporting (src/pages/Reporting.tsx, src/pages/laporan.shared.ts, src/guides/reporting.ts). Halaman ini dirakit oleh kerangka generik (src/kit/PageShell.tsx, DataTable.tsx, FormModal.tsx, DetailModal.tsx, FilterPopover.tsx, exportXlsx.ts, store.tsx, charts.tsx).

Komponen lintas halaman yang dipakai kedua halaman dan dijelaskan di sini seperlunya: pusat notifikasi (src/kit/notify.tsx), menu Approval (src/shared/Approval.tsx), Log (src/shared/Log.tsx), Master Data (src/shared/MasterData.tsx), matriks permission (src/kit/perms.ts), Panduan Halaman (src/kit/PageGuide.tsx).

---

## 0. Konsep umum yang berlaku untuk kedua halaman

### 0.1 Struktur menu dan akses
- Menu sidebar: grup "Compliance" berisi "Regulatory Findings Tracker", "Regulatory Reporting", "Regulatory Change", "SOP & Dokumen Kontrol" (src/App.tsx:24-30). Item menu hanya tampil bila akun punya aksi Lihat untuk modul itu (App.tsx: `items = g.items.filter(can(i.perm,'Lihat'))`). Rute default aplikasi (hash kosong) adalah Regulatory Findings Tracker.
- Bila akun tidak punya Lihat dan membuka rute langsung: tampil teks "Anda tidak memiliki akses ke halaman ini" (App.tsx:~159).
- Setiap halaman punya dua tab: "Dashboard" dan "Table". Urutan tab: Dashboard dulu, Table kedua. Tab awal adalah Dashboard bila akun punya aksi Dashboard; bila tidak, tab Table saja yang tampil dan jadi tab awal (Tracker.tsx:26,172; PageShell.tsx:23,81).
- Tombol "Panduan Halaman" (ikon buku) di baris judul membuka panel panduan berisi item akordeon (Alur penggunaan, Dashboard, Tabel cari filter, Tambah & Edit, dst). Panduan adalah isi statis, bukan fitur data.
- Tautan dari notifikasi: `#/compliance/regulatory-findings-tracker?open=<id>` atau `#/compliance/regulatory-reporting?open=<id>` membuka modal Detail data itu lalu parameter dihapus dari URL (Tracker.tsx:51-66; PageShell.tsx:48-63).

### 0.2 Model peran dan permission (dua lapis, penting)
Lapis 1: matriks default per peran per modul (src/kit/perms.ts:14-42). Lapis 2: setiap akun punya daftar izin per KATEGORI (kolom `permissions`), diturunkan dari peran saat akun dibuat dan bisa diubah di Admin > Manage Permissions (sejak v2.14.0). Fungsi pemeriksa `can()` memakai lapis 2 bila akun punya daftar izin (store.tsx:115), yang berlaku untuk semua 12 akun seed.

Kategori "Compliance" menggabungkan 4 halaman (Tracker, Reporting, Regulatory Change, SOP) dalam satu set izin: view, create, update, export, approve, dashboard (perms.ts:52-62). Pemetaan ke aksi lama: `view`=Lihat, `create`=Tambah, `update`=Ubah DAN Cancel (Batalkan/Kembalikan), `export`=Export, `approve`=Approve, `dashboard`=tab Dashboard (perms.ts:48-50,73-77). Akibatnya izin tidak bisa diatur terpisah antara Tracker dan Reporting dan tidak bisa memisahkan Ubah dari Batalkan.

Izin awal akun diturunkan dari matriks peran dengan aturan: kategori memberi aksi bila SALAH SATU halaman di kategori itu memberi aksi (perms.ts:64-71). Contoh: PIC boleh Tambah di SOP, maka PIC mendapat `compliance.create`, sehingga tombol Tambah juga muncul untuk PIC di Tracker dan Reporting (lihat matriks efektif di bagian Peran tiap halaman).

Daftar 9 peran (perms.ts:3): Super Admin, Head CLRM, Compliance Officer, Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, PIC, Viewer. Akun seed (store.tsx:20-27): Super Admin (Super Admin), Dewi Anggraini (Head CLRM), Rina Kartika (Compliance Officer), Arief Nugraha (Compliance Officer, status Suspend), Rudi Hartono (Risk Officer), Lina Marlina (Legal Officer), Fakhri (Fraud Investigator), Yusuf Hakim (Ketua SMKI), Regie (PIC), Tono Santoso (Viewer), Bima Prakoso (Fraud Investigator, Inactive), Citra Dewi (Risk Officer, Archive). Dropdown "Akun demo" di header mengganti akun aktif (hanya akun status Active).

Peran khusus Tracker: App.tsx:59 memetakan peran sesi ke 4 peran Tracker untuk Drawer dan aturan "milik sendiri": Head CLRM dan Super Admin menjadi "Head CLRM"; Compliance Officer tetap; PIC tetap; peran lain (Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer) menjadi "Viewer".

### 0.3 Komponen bersama
- Upload file (komponen FileField, src/ui.tsx:36-72, validasi src/lib.ts:297-313): hanya metadata (nama, ukuran, tipe) yang disimpan, isi file TIDAK disimpan. Konsekuensinya file di Detail tampil sebagai nama dan ukuran (teks biru dengan ikon), tidak ada aksi buka atau unduh.
  - Format: ekstensi harus pdf, jpg, jpeg, atau png DAN tipe MIME harus cocok dengan ekstensi.
  - Ukuran maksimal 25 MB (25 * 1024 * 1024 byte). File 0 byte ditolak.
  - Satu file per isian. Drop lebih dari satu file ditolak. Memilih file baru mengganti file lama. Tombol x menghapus file.
  - Teks bantuan di bawah kotak upload: "PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file." Tombol: "Pilih file" (kosong) atau "Ganti file" (terisi). Drag and drop didukung.
  - Pesan error persis: "File kosong"; "Format file harus PDF, JPG, JPEG, atau PNG"; "Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG" (MIME kosong); "Ukuran file maksimal 25 MB"; "Hanya boleh 1 file".
  - Format ukuran tampil: B, KB (1 desimal), MB (1 desimal).
- Pilihan "Lainnya" (src/kit/Lainnya.tsx): dropdown tertentu otomatis diberi opsi "Lainnya" di akhir daftar (opsi tidak disimpan di Master Data; Master Data menolak nama "Lainnya"). Memilih "Lainnya" memunculkan kotak teks (placeholder "Sebutkan lainnya", maksimal 255 karakter) yang wajib diisi dan nilai yang disimpan adalah teks bebas itu. Bila kosong saat simpan: pesan "Wajib diisi jika memilih Lainnya". Di tabel, nilai teks bebas ditampilkan sebagai "Lainnya"; di Detail dan Export tampil teks aslinya.
- Format tanggal tampil dd/mm/yyyy; tanggal dan jam dd/mm/yyyy HH:mm (tabel) atau dd/mm/yyyy HH:mm:ss (Detail dan Export).
- Pagination tabel utama: pilihan "Baris per halaman" 10, 25, 50 (default 10). Teks "N sampai M dari T data". Tombol "<" dan ">" serta nomor halaman. Nomor baris (kolom "Nomor") adalah posisi baris (1..n, lanjut antar halaman) dan kembali ke 1 saat cari atau filter berubah. Nomor internal temuan (`no`) tidak ditampilkan di tabel, hanya dipakai untuk pencarian, log, dan approval.
- Urutan tabel tetap: "Tanggal Dibuat" terbaru dulu (tie-break nomor internal terbesar dulu). Tidak ada sort kolom.
- Baris Dibatalkan tetap tampil di tabel dengan teks abu-abu.
- Teks kosong tabel: "Tidak ada data".
- Info (i): ikon "i" di judul kartu dashboard. Hover membuka, klik mengunci, Esc atau klik di luar menutup. Isi: satu kalimat "apa" dan daftar "baca".
- Notifikasi (lonceng di header): lihat bagian Notifikasi tiap halaman dan 0.4.

### 0.4 Mekanisme notifikasi (berlaku untuk dua halaman)
Sumber: src/kit/notify.tsx. Tidak ada email dan tidak ada Telegram. Notifikasi tidak disimpan; dihitung ulang langsung dari data dan aturan alert setiap render. Yang disimpan per akun demo di penyimpanan browser: daftar id yang sudah dibaca dan waktu pertama muncul.
- Lonceng di header kanan atas menampilkan angka belum dibaca (maks "99+"). Panel: judul "Notifikasi (N belum dibaca)", tombol "Tandai semua dibaca" (nonaktif bila 0), daftar notifikasi, teks kosong "Tidak ada notifikasi".
- Tiap item: ikon (merah untuk red, kuning untuk yellow), judul, pesan, baris kecil "<nama halaman> · <referensi data> · <waktu pertama muncul>". Item belum dibaca punya titik biru dan latar tipis. Klik item menandai dibaca dan membuka halaman terkait dengan Detail data terbuka.
- Urutan: waktu pertama muncul terbaru dulu, lalu merah sebelum kuning, lalu referensi alfabet.
- Notifikasi hilang sendiri bila kondisi pemicu tidak berlaku lagi (status berubah, tanggal diubah, data dibatalkan). Status baca untuk id yang sudah tidak aktif dibuang.
- Data Dibatalkan tidak memicu notifikasi (Tracker lewat `isOpenish`, Reporting lewat pengecualian `cancelled`).
- Penerima: token `to` pada alert dicocokkan ke akun yang sedang aktif (notify.tsx:148-158). Super Admin melihat SEMUA notifikasi. Token peran (mis. "Head CLRM", "Compliance Officer") cocok dengan akun berperan itu. Token "PIC (Nama)" cocok dengan akun yang namanya sama (tidak sensitif huruf besar kecil). Token "PIC" polos cocok dengan semua akun berperan PIC. Penerima yang tidak punya akun demo ("Direktur terkait", "CISO") hanya terlihat oleh Super Admin.
- Notifikasi hanya dibangun bila peran akun punya Lihat untuk modul itu berdasarkan matriks peran default (bukan daftar izin kategori akun): `canPerm(store.perms, ctx.role, ...)`.

---

# BAGIAN A

## Regulatory Findings Tracker (menu: Compliance > Regulatory Findings Tracker)

- Ringkasan tujuan: mencatat temuan dan permintaan regulator (satu baris = satu temuan), memantau status tindak lanjut, batas waktu, validasi ulang, dan penutupan yang butuh persetujuan Head CLRM.
- Prasyarat akses: aksi Lihat modul Tracker untuk membuka halaman. Tab Dashboard butuh aksi Dashboard. Tab Table selalu tampil bagi yang punya Lihat. Tiap tombol punya syarat sendiri (lihat Peran dan Kondisi khusus).
- Rute: `compliance/regulatory-findings-tracker`. Komponen dipanggil dari App.tsx:163 dengan `role=trackerRole(...)` dan `can=(a)=>can('tracker',a)`.
- Pilihan tetap di kode (src/lib.ts:4-15):
  - Regulator: BI, PPATK, Komdigi, BSSN, Pemerintah-DPR (+ "Lainnya" otomatis). Daftar ini konstanta kode, BUKAN Master Data.
  - Area Temuan (kategori regulasi): dari Master Data "Kategori Regulasi" (seed: APU PPT, QRIS, SNAP, Pelindungan Konsumen, Ketahanan Siber) + "Lainnya" otomatis.
  - Jenis Penyebab (ROOT_TYPES): Orang, Proses, Sistem, Kebijakan, Pihak Ketiga.
  - Status (STATUSES): Open, Proses, Menunggu Validasi, Selesai, Dibatalkan.
  - Tingkat Risiko (RISKS): High, Medium, Low.
  - Unit Kerja: dari Master Data "Unit Kerja" (seed: Internal Audit, Business, Operation, Information Technology, Compliance Legal & Risk Management, Support, "Finance, Accounting, Tax & Treasury").
  - PIC: dari Master Data "PIC" (seed: Regie, Fakhri, Osama).
  - Konstanta alert: WAIT_VALIDATION_DAYS = 7, NEAR_DUE_DAYS = 7, DIRECTOR_DAYS = 7.

### Tab Dashboard (src/Dashboard.tsx)

**Filter global halaman: "Periode Tanggal Temuan"**
- Dua input tanggal (dari, sampai) dipisah teks "sampai", tombol "Reset", dan teks di kanan "{N} temuan (tanpa yang dibatalkan)". Kosong berarti semua tanggal. Menyaring semua kartu KECUALI kartu Tren (punya filter bulan sendiri).
- Dasar data dashboard: temuan dengan status BUKAN Dibatalkan dan `Tanggal Temuan` dalam rentang (dari <= tglTemuan <= sampai).
- Periode ini dibagi dengan filter "Periode" di tab Table (state filter yang sama). Mengubah tanggal di Dashboard memanggil `setFilter({...EMPTY_FILTER, from, to})`: semua filter tab Table lain (status, PIC, unit, regulator, risiko) dan kotak pencarian ikut dikosongkan. Tombol "Reset" mengosongkan tanggal dan seluruh filter tab Table. Filter tab Table selain tanggal tidak mempengaruhi Dashboard.
- Definisi dasar: "Open (belum selesai)" = status Open, Proses, Menunggu Validasi (semua yang bukan Selesai dan bukan Dibatalkan). `lateDays(f)` = jumlah hari lewat Batas Waktu bila status bukan Selesai/Dibatalkan, selain itu 0; hari dihitung selisih tanggal kalender (hari ini - Batas Waktu).

**Kartu "Ringkasan" (4 kartu angka; judul bagian "Ringkasan" dengan ikon info)**
- Bentuk: grid 4 kotak angka (2 kolom di layar kecil, 4 di layar lebar). Tidak bisa diklik.
- "Open (belum selesai)": jumlah temuan status bukan Selesai.
- "Selesai": jumlah temuan status Selesai.
- "Lewat Batas Waktu": jumlah temuan dengan `lateDays > 0`. Kotak berwarna merah (border dan latar merah muda, teks merah) bila angka lebih dari 0; netral bila 0.
- "% Selesai": `round(Selesai / total * 100)` ditampilkan dengan "%", 0% bila total 0. Tooltip (atribut title) saat kursor di kotak: "Selesai {done} dari {total} temuan ({pct}%)".
- Teks info (i) "Ringkasan": apa = "Empat angka ringkas dari temuan pada Periode Tanggal Temuan yang dipilih. Temuan Dibatalkan tidak dihitung."; baca memuat definisi Open, Selesai, Lewat Batas Waktu, % Selesai, dan "Kotak angka tidak bisa diklik."

**Kartu "Temuan per Regulator"**
- Bentuk: bar chart vertikal bertumpuk, tinggi 260, legenda. Sumbu X: BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya. Sumbu Y: jumlah (bilangan bulat).
- Seri: "Open" biru (#3b82f6) dan "Selesai" hijau (#10b981), ditumpuk. Open = semua belum Selesai (Open + Proses + Menunggu Validasi). Tinggi total = jumlah temuan regulator itu.
- Regulator yang diketik bebas (di luar 5 nama tetap) masuk kolom "Lainnya".
- Filter milik visual: tidak ada (ikut Periode Tanggal Temuan). Dibatalkan dikecualikan. Tidak bisa diklik; tooltip hover menampilkan angka per warna.
- Info (i): apa = "Jumlah temuan per regulator, dipisah menjadi belum selesai dan selesai. Regulator yang diketik bebas di luar daftar masuk ke Lainnya."

**Kartu "Temuan per Unit Kerja"**
- Bentuk: bar horizontal satu seri, warna #1f2ab5, tinggi 260, label unit di sumbu Y (lebar 170). Hanya unit yang punya temuan yang muncul. Diurutkan dari terbanyak ke tersedikit.
- Tooltip custom: nama unit, "Total: n", "Selesai: n", "Open: n" (Open = total - Selesai).
- Tidak ada filter sendiri. Dibatalkan dikecualikan. Tidak bisa diklik.
- Info (i): apa = "Jumlah temuan per Unit Kerja, diurutkan dari yang terbanyak."

**Kartu "Temuan per Area"**
- Bentuk: donut (radius dalam 55, luar 90), label angka di irisan, legenda, tooltip. Palet warna berputar: #1f2ab5, #3b82f6, #06b6d4, #10b981, #f59e0b, #8b5cf6.
- Isi: jumlah temuan per Area Temuan. Area yang tidak ada di Master Data Kategori Regulasi (teks bebas "Lainnya") dihitung sebagai "Lainnya".
- Tidak ada filter sendiri. Dibatalkan dikecualikan. Tidak bisa diklik.
- Info (i): apa = "Pembagian temuan menurut Area Temuan (kategori peraturan). Area yang diketik bebas di luar daftar dihitung sebagai Lainnya."

**Kartu "Temuan per Tingkat Risiko (menurut status)"**
- Bentuk: bar vertikal bertumpuk, tinggi 260. Sumbu X: High, Medium, Low. Seri per status (tanpa Dibatalkan): Open biru #3b82f6, Proses kuning #f59e0b, Menunggu Validasi ungu #8b5cf6, Selesai hijau #10b981.
- Filter sendiri: tidak ada. Tidak bisa diklik.
- Info (i): apa = "Jumlah temuan per Tingkat Risiko, ditumpuk menurut status temuan (tanpa Dibatalkan)."

**Kartu "Temuan Lewat Batas Waktu"** (kartu lebar, border merah muda)
- Bentuk: kiri bar chart (tinggi 220), kanan tabel mini (2/3 lebar).
- Bar chart: sumbu X kelompok lama terlambat dengan label sumbu "Hari": "1-7 hari", "8-30 hari", "31-90 hari", ">90 hari". Satu seri "Temuan" merah #dc2626.
- Tabel kolom persis: No, PIC, Batas Waktu, Terlambat, Kelompok, Status, Risiko. "Terlambat" tampil "{n} hari" merah tebal. "Kelompok" = nama kelompok grafik. Status dan Risiko tampil sebagai badge. Diurutkan dari yang paling lama terlambat. Pagination tetap 5 baris per halaman tanpa pilihan jumlah baris (komponen pager dashboard). Kosong: "Tidak ada temuan lewat batas waktu".
- Interaksi: klik satu baris tabel membuka modal Detail temuan itu. Grafik tidak bisa diklik.
- Isi: temuan yang belum Selesai dan Batas Waktunya sudah lewat (hari ini > Batas Waktu). Dibatalkan dikecualikan.
- Info (i): apa = "Temuan yang belum Selesai dan Batas Waktunya sudah lewat. Grafik mengelompokkan lama keterlambatan, tabel merinci temuannya."

**Kartu "Tren Penyelesaian (per bulan)"**
- Bentuk: line chart dua garis, tinggi 260, legenda. Garis "Temuan masuk" biru #1f2ab5; garis "Temuan selesai" hijau #10b981. Sumbu X bulan (format YYYY-MM), sumbu Y jumlah.
- Aturan hitung: dasar data SEMUA temuan non-Dibatalkan (TIDAK ikut Periode Tanggal Temuan). "Masuk" per bulan dari `Tanggal Temuan`. "Selesai" per bulan dari bulan waktu entri audit terakhir yang mengubah kolom Status menjadi Selesai (bila tidak ada entri, dipakai tanggal Persetujuan Penutupan).
- Filter sendiri (toolbar di atas grafik, label "Periode"): dropdown "Seluruh Waktu", "3 bulan terakhir", "6 bulan terakhir", "9 bulan terakhir", "12 bulan terakhir" (default), "Custom". Custom memunculkan dua input bulan (dari, sampai, dipisah "sampai"; kosong = bulan data tertua / bulan ini). N bulan terakhir = tepat N bulan termasuk bulan berjalan. Seluruh Waktu = dari bulan data tertua sampai bulan ini (atau sampai bulan data terbaru bila di masa depan). Bulan tanpa data tetap tampil bernilai 0.
- Titik hanya tooltip, tidak bisa diklik.
- Info (i): apa = "Jumlah temuan masuk (menurut bulan Tanggal Temuan) dan temuan selesai (menurut bulan status berubah menjadi Selesai) per bulan. Temuan Dibatalkan tidak dihitung."

Catatan: seluruh kartu dashboard Tracker memakai komponen grafik langsung (tidak memakai kartu bersama kit). Tidak ada tampilan "Tidak ada data" otomatis pada grafik kosong (hanya tabel Lewat Batas Waktu yang punya teks kosong).

### Tab Table (src/Tracker.tsx)

**Toolbar**
- Kotak pencarian, placeholder persis "Cari nomor, regulator, area, PIC". Pencarian langsung (tanpa tombol), tidak sensitif huruf besar kecil, mencari substring pada gabungan teks: nomor internal temuan, Regulator, Area Temuan, PIC. (Regulator dan Area dicari memakai nilai asli, bukan tampilan "Lainnya".) Mengubah teks mengembalikan ke halaman 1.
- Tombol biru "Filter" membuka popover (lebar 380 px, Esc atau klik luar menutup). Isi popover berurutan:
  1. "Periode": dua input tanggal untuk Tanggal Temuan (dari - sampai).
  2. "Status": dropdown placeholder "Pilih Status", opsi Open, Proses, Menunggu Validasi, Selesai, Dibatalkan.
  3. "PIC": placeholder "Pilih PIC", opsi = nama PIC unik yang ada di data temuan (urut abjad).
  4. "Unit Kerja": placeholder "Pilih Unit Kerja", opsi dari Master Data Unit Kerja.
  5. "Regulator": placeholder "Pilih Regulator", opsi BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya. "Lainnya" menampilkan temuan yang regulatornya teks bebas di luar daftar tetap.
  6. "Tingkat Risiko": placeholder "Pilih Tingkat Risiko", opsi High, Medium, Low.
  - Tombol "Clear All" (mengosongkan semua filter dan kotak pencarian) dan "Apply Filters" (menerapkan, mempertahankan teks pencarian, menutup popover).
  - Semua kriteria digabung AND. Tidak ada filter OR. Tidak ada fitur "simpan filter" (dihapus sejak v8 kunci data; kode lama yang menyimpan filter dibuang saat data dimuat).
- Tombol di kanan (muncul bersyarat):
  - "Export Excel": bila akun punya aksi Export.
  - "Tambah": bila akun punya aksi Tambah.
  - "Import Excel": TIDAK tampil (konstanta SHOW_IMPORT = false; komponen TrackerImport tetap ada di kode tetapi tidak terjangkau dari UI).

**Kolom tabel, urutan persis**: Nomor | Regulator | Tanggal Temuan | Area Temuan | PIC | Batas Waktu | Status | Tingkat Risiko | Tanggal Dibuat | Aksi.
- Regulator dan Area Temuan: teks bebas ditampilkan "Lainnya". Tanggal Temuan dan Batas Waktu dd/mm/yyyy. Status memakai badge. Tingkat Risiko memakai badge. Tanggal Dibuat dd/mm/yyyy HH:mm.
- Warna badge Status: Open biru, Proses kuning, Menunggu Validasi kuning, Selesai hijau, Dibatalkan abu-abu. Warna badge Tingkat Risiko: High merah, Medium kuning, Low hijau.
- Kolom yang TIDAK ada di tabel tetapi ada di data: Penyebab Utama, Jenis Penyebab, Unit Kerja, Validasi Ulang, Persetujuan Penutupan, Rencana Tindak Lanjut, file (semua hanya di Detail dan Export).
- Kolom Aksi: tombol "Lihat Detail" (selalu), "Edit" (bersyarat), "Batalkan" (bersyarat), "Kembalikan" (bersyarat); syarat di bagian Edit dan Status.

**Pagination**: "Baris per halaman" 10 / 25 / 50, default 10; teks "{a} sampai {b} dari {n} data"; tombol "<", semua nomor halaman, ">" (di Tracker semua nomor halaman ditampilkan tanpa jendela, beda dengan halaman kit yang membatasi 7 nomor).

**Export Excel (doExport, Tracker.tsx:141-154)**
- Data: baris yang sedang tampil sesuai pencarian dan filter (seluruh hasil, bukan hanya halaman aktif), termasuk temuan Dibatalkan bila lolos filter.
- Nama file: `Temuan_Regulator_<YYYY-MM-DD hari ini>.xlsx`; nama sheet "Temuan".
- Kolom persis berurutan: Nomor (urutan baris) | Tanggal Dibuat (dd/mm/yyyy HH:mm:ss) | Regulator | Tanggal Temuan (dd/mm/yyyy) | Area Temuan | Penyebab Utama (Root Cause) (format "teks (Jenis Penyebab)") | PIC | Batas Waktu (dd/mm/yyyy) | Status | Validasi Ulang ("Belum" bila belum, selain itu "<hasil> - <nama validator> - <tanggal yyyy-mm-dd>") | Persetujuan Penutupan ("<status> - <nama> - <tanggal yyyy-mm-dd>" bila ada nama, selain itu hanya status) | Unit Kerja | Tingkat Risiko | Rencana Tindak Lanjut | File Bukti Tindak Lanjut (nama file) | Bukti Surat Regulator (nama file).
- Masking: tidak ada (halaman ini tidak punya data tersamar). Nilai teks bebas Regulator dan Area diekspor apa adanya.
- Pencatatan: setelah unduh, entri Log aplikasi "Regulatory Findings Tracker / Export" dengan keterangan "{n} baris".

### Form Tambah (modal "Tambah Temuan Regulator"; src/Form.tsx)

Modal lebar; grid 2 kolom. Tombol "Batal" dan "Simpan". Semua kolom bertanda `*` wajib. Urutan tampil:

| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan error |
| --- | --- | --- | --- | --- | --- | --- |
| Regulator * | Dropdown (+ teks bebas bila Lainnya) | BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya (konstanta kode) | Wajib | - | Selalu | "Regulator wajib diisi"; bila Lainnya dipilih dan teks kosong: "Wajib diisi jika memilih Lainnya" |
| Tanggal Temuan * | Tanggal | bebas | Wajib | - | Selalu | "Tanggal Temuan wajib diisi" |
| Area Temuan * | Dropdown (+ teks bebas bila Lainnya) | Master Data "Kategori Regulasi" + Lainnya | Wajib | - | Selalu | "Area Temuan wajib diisi"; "Wajib diisi jika memilih Lainnya" |
| Penyebab Utama (Root Cause) * | Teks satu baris | bebas | Wajib | - | Selalu | "Penyebab Utama wajib diisi" (label di pesan tanpa "(Root Cause)") |
| Jenis Penyebab * | Dropdown | Orang, Proses, Sistem, Kebijakan, Pihak Ketiga | Wajib | - | Selalu (bersebelahan dengan Penyebab Utama) | "Jenis Penyebab wajib diisi" |
| PIC * | Dropdown | Master Data "PIC" | Wajib | - | Selalu | "PIC wajib diisi" |
| Batas Waktu (Due Date) * | Tanggal | bebas | Wajib | - | Selalu | "Batas Waktu wajib diisi"; bila lebih awal dari Tanggal Temuan: "Batas Waktu tidak boleh sebelum Tanggal Temuan" |
| Status * | Dropdown | Hanya Open, Proses, Menunggu Validasi (default Open) | Wajib | - | Selalu | "Status wajib diisi" |
| Unit Kerja * | Dropdown | Master Data "Unit Kerja" | Wajib | - | Selalu | "Unit Kerja wajib diisi" |
| Tingkat Risiko * | Dropdown | High, Medium, Low | Wajib | - | Selalu | "Tingkat Risiko wajib diisi" |
| Rencana Tindak Lanjut * | Teks area 3 baris (placeholder "Rencana tindak lanjut") | bebas | Wajib | - | Selalu | "Rencana Tindak Lanjut wajib diisi" |
| File bukti | Upload 1 file | PDF, JPG, JPEG, PNG; maks 25 MB | Opsional | - | Selalu (di bawah Rencana Tindak Lanjut) | Pesan upload di 0.3 |
| Bukti Surat Regulator | Upload 1 file | sama | Opsional | - | Selalu | sama |

- Nilai otomatis saat Simpan (Tracker.tsx:84-91): Nomor internal = nomor terbesar + 1; id baru; Tanggal Dibuat = waktu saat simpan (dd/mm/yyyy HH:mm:ss); Validasi Ulang = "Belum"; Persetujuan Penutupan = "Menunggu" (tanpa nama dan tanggal); Nama Validator kosong. Entri audit "Tambah temuan" kolom "Temuan" nilai baru "<Regulator> - <Area>" ditulis dengan nama akun penyimpan.
- Status yang tidak bisa dipilih saat tambah: Selesai dan Dibatalkan.
- Tidak ada approval saat tambah. Semua error tampil di bawah kolom masing-masing; bila ada error, form tidak tersimpan dan tetap terbuka.
- File bukti opsional di status apa pun (termasuk Menunggu Validasi dan Selesai).
- Tidak ada validasi tanggal masa depan atau masa lalu selain Batas Waktu >= Tanggal Temuan.
- Pembuat tidak ada di form; tercatat di audit (nama akun).

### Edit (modal "Ubah Temuan <Regulator - Area>")

**Siapa boleh** (`canEdit`, Tracker.tsx:139): tombol "Edit" muncul bila SEMUA terpenuhi:
1. Temuan tidak punya pengajuan persetujuan berstatus Menunggu.
2. Status temuan bukan Dibatalkan dan bukan Selesai.
3. Akun punya aksi Ubah (efektif: Super Admin, Head CLRM, Compliance Officer, PIC, lihat matriks).
4. Bila peran Tracker = PIC: nama PIC temuan sama persis dengan nama akun ("milik sendiri").
Catatan: Head CLRM mendapat Ubah efektif lewat kategori `compliance.update` (lihat Peran).

**Struktur modal**: ringkasan baca-saja (5 kotak: Tanggal Dibuat, Regulator, Area, PIC, Status saat ini), teks "Perubahan lain tersimpan langsung. Mengubah status ke Selesai mengajukan penutupan temuan yang menunggu persetujuan Head CLRM.", lalu kolom yang bisa diubah.

**Kolom yang bisa diubah**: Status (opsi Open, Proses, Menunggu Validasi, Selesai; tidak ada Dibatalkan), Batas Waktu (Due Date), Alasan perubahan Batas Waktu, Rencana Tindak Lanjut, File bukti, Bukti Surat Regulator. Bila Status = Selesai muncul tambahan "Validasi Ulang *" (dropdown "Pilih...", opsi Belum, Valid, Tidak Valid) dan "Nama Validator *" (teks bebas).
**Kolom yang terkunci (tidak ada di form edit)**: Regulator, Tanggal Temuan, Area Temuan, Penyebab Utama, Jenis Penyebab, PIC, Unit Kerja, Tingkat Risiko.

**Aturan alasan**: label "Alasan perubahan Batas Waktu"; wajib (tanda *) hanya bila Batas Waktu diubah dari nilai awal. Teks bantu: "Alasan terakhir: <tanggal>" bila pernah ada alasan sebelumnya, dan "Batas waktu dari <lama> menjadi <baru>" saat diubah. Kolom terisi awal dengan alasan terakhir; bila Batas Waktu diubah dan alasan sama persis dengan alasan terakhir: "Isi alasan baru untuk perubahan Batas Waktu". Bila kosong: "Alasan wajib diisi jika batas waktu diubah". Alasan tersimpan hanya bila Batas Waktu diubah, dan ditempelkan ke setiap baris log perubahan pada simpanan itu. Perubahan kolom lain tidak butuh alasan.
**Validasi tambahan**: Rencana Tindak Lanjut tetap wajib ("Rencana Tindak Lanjut wajib diisi"); Batas Waktu tidak boleh sebelum Tanggal Temuan; bila Selesai: "Validasi Ulang wajib diisi" dan "Nama Validator wajib diisi" (pilihan "Belum" lolos validasi). Saat Status diubah ke Selesai, isian Validasi Ulang dan Nama Validator dikosongkan agar diisi ulang; bila Status diubah ke selain Selesai nilai awal dikembalikan.
**Yang dibandingkan untuk deteksi perubahan** (diffs): Status, Batas Waktu, Rencana Tindak Lanjut, File Bukti Tindak Lanjut (nama file), Bukti Surat Regulator (nama file), dan (hanya bila baru menjadi Selesai) Validasi Ulang dan Nama Validator. Bila tidak ada yang berubah: modal tertutup tanpa menyimpan apa pun.
**Perubahan yang memicu approval**: hanya perubahan Status dari bukan-Selesai menjadi Selesai. Seluruh perubahan di form itu (status, Batas Waktu, rencana, file, validasi, nama validator) masuk ke SATU pengajuan "Penutupan Temuan" dan TIDAK diterapkan ke temuan sampai disetujui. Temuan mengunci (lihat Approval). Edit lain (termasuk ke "Menunggu Validasi") disimpan langsung dengan entri audit "Ubah temuan" per kolom.
**Nomor request**: memakai urutan nomor approval bersama semua modul (`seq.approval`).

### Lihat Detail (modal "Detail"; src/Drawer.tsx)

Urutan isi:
1. Badge alert aktif (bila ada), ditumpuk. Hanya label yang tampil; tooltip hover memuat "<label> (<detail>). Penerima notifikasi: <daftar>".
2. Kotak kuning bila ada pengajuan Menunggu: "Menunggu persetujuan Head CLRM (Penutupan Temuan). Lihat di menu Approval" (tautan ke approval).
3. Grid 2 kolom: Tanggal Dibuat (dd/mm/yyyy HH:mm:ss); Regulator; Tanggal Temuan; Area Temuan; Penyebab Utama (Root Cause) dengan badge Jenis Penyebab; PIC; Batas Waktu (Due Date); Alasan perubahan Batas Waktu (alasan terakhir dari log, "-" bila tidak ada); Status (badge); Unit Kerja; Tingkat Risiko (badge); [Validasi Ulang (badge: Valid hijau, Tidak Valid merah, Belum abu-abu) dan Nama Validator HANYA bila status Selesai]; Persetujuan Penutupan (badge Disetujui hijau, Ditolak merah, Menunggu abu-abu; baris kecil "Oleh: <nama atau -> , Tanggal: <tanggal>").
4. Rencana Tindak Lanjut: teks (spasi baris dipertahankan, "-" bila kosong) dan di bawahnya nama file bukti dengan ukuran, atau "Belum ada file bukti".
5. Bukti Surat Regulator: nama file dengan ukuran, atau "Belum ada file".
6. "Log Perubahan" (riwayat).
- File: hanya nama dan ukuran tampil; tidak ada aksi buka atau unduh karena isi file tidak disimpan.
- Sensor dan tombol mata: TIDAK ada di halaman ini.

**Log Perubahan** (src/kit/history.tsx `trackerHistory`): daftar dari terbaru (urut waktu menurun). Tiap entri: badge judul, waktu dd/mm/yyyy HH:mm:ss, "Oleh: <nama>" atau "Pengaju: <x>. Approver: <y>.", tabel Kolom | Sebelum | Sesudah (nilai lama merah, baru hijau; tanggal ISO diformat dd/mm/yyyy), dan baris "Alasan: ..." atau "Catatan: ...". Judul entri: "Data dibuat" (biru), "Perubahan data" (abu), "Pengajuan approval: Penutupan Temuan" (kuning), "Approval: Approve (pemisah panjang) Penutupan Temuan" (hijau), "Approval: Reject (pemisah panjang) Penutupan Temuan" (merah, tanpa tabel kolom), "Dibatalkan" (merah), "Dikembalikan" (hijau), dan aksi lain memakai nama aksi (mis. "Validasi ulang", abu). [Catatan: kode memakai karakter pemisah panjang pada judul Approve/Reject; PRD boleh menulis tanda titik dua atau tanda hubung.] Entri satu aksi pada waktu dan pengguna yang sama digabung dalam satu kartu dengan banyak baris kolom. Tinggi daftar maks 72 (scroll).

**Tombol di footer Detail** (bersyarat; peran = peran Tracker hasil pemetaan):
- Teks "Viewer: hanya dapat melihat." di kiri bila peran Tracker = Viewer (berlaku untuk Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, dan Viewer).
- "Isi Validasi Ulang" (primer): hanya bila status = Menunggu Validasi DAN Validasi Ulang masih "Belum" DAN peran = Compliance Officer.
- "Batalkan" (merah): hanya bila peran Tracker = Head CLRM (Head CLRM atau Super Admin), tidak ada pengajuan Menunggu, dan status bukan Dibatalkan.
- "Kembalikan" (primer): hanya bila peran Tracker = Head CLRM dan status Dibatalkan.
- "Tutup" selalu.

**Dialog "Validasi Ulang"**: judul "Validasi Ulang"; "Hasil *" dropdown (Valid, Tidak Valid; default Valid); "Catatan / alasan" (diberi * dan wajib bila Tidak Valid); error persis "Alasan wajib diisi untuk hasil Tidak Valid."; tombol Batal dan Simpan.

### Status dan transisi

**Daftar status**: Open, Proses, Menunggu Validasi, Selesai, Dibatalkan.

**Transisi yang terjadi di kode** (tidak ada mesin status yang membatasi urutan; yang membatasi adalah daftar pilihan di form):
- Saat Tambah: pilih Open, Proses, atau Menunggu Validasi.
- Saat Edit (hanya temuan bukan Selesai/Dibatalkan/tanpa pengajuan): pilih Open, Proses, Menunggu Validasi (langsung tersimpan, audit "Ubah temuan") atau Selesai (menjadi pengajuan, lihat Approval). Perpindahan mundur (mis. Proses ke Open) diperbolehkan.
- Validasi Ulang "Tidak Valid" (dari Detail): status otomatis menjadi Proses; audit "Validasi ulang" untuk kolom "Validasi Ulang" dan kolom "Status" (dengan catatan). Validasi Ulang "Valid": hanya mencatat hasil, nama validator (nama akun), tanggal hari ini; status TIDAK berubah otomatis; menutup temuan tetap lewat Edit ke Selesai.
- Disetujui Head CLRM: status menjadi Selesai.
- Ditolak Head CLRM: perubahan tidak diterapkan; bila status temuan saat itu Menunggu Validasi maka kembali ke status sebelum pengajuan (dari audit "Ajukan penutupan", bawaan Proses); selain itu tidak berubah.
- Batalkan: status menjadi Dibatalkan.
- Kembalikan: status kembali ke nilai "lama" pada entri audit pembatalan terakhir; bila tak terbaca, Open.
- Status otomatis (rumus): TIDAK ada status yang dihitung otomatis pada Tracker. Alert dihitung otomatis dari tanggal (bagian Notifikasi).

**Batalkan**: tombol di tabel (syarat: aksi Cancel efektif, tidak ada pengajuan Menunggu, status bukan Dibatalkan; status Selesai pun boleh dibatalkan) dan di Detail (syarat peran Head CLRM/Super Admin). Membuka modal dengan judul "Batalkan temuan <Regulator - Area>", label "Alasan *", teks area, tombol "Batal" dan "Konfirmasi" (merah). Alasan kosong: "Alasan wajib diisi.". Hasil: status Dibatalkan; audit "Batalkan temuan" kolom Status lama -> Dibatalkan, alasan dicatat. Data tidak dihapus. Temuan Dibatalkan: teks abu-abu di tabel, tidak dihitung di dashboard, tidak memicu notifikasi, tidak bisa diedit.
**Kembalikan**: tombol "Kembalikan" (hijau) untuk status Dibatalkan, syarat aksi Cancel efektif (tabel) atau peran Head CLRM/Super Admin (Detail). Modal "Kembalikan temuan <Regulator - Area>", alasan wajib (pesan sama), audit "Kembalikan temuan".

### Approval

- Pemicu: simpan Edit yang mengubah Status menjadi Selesai (Tracker.tsx:94-109). Jenis request: "Penutupan Temuan". Approver tercatat "Head CLRM".
- Data pengajuan: pengaju (nama akun), waktu, alasan (alasan perubahan Batas Waktu bila ada, selain itu kosong), dan daftar perubahan (kolom, nilai lama, nilai baru). Audit "Ajukan penutupan (menunggu Head CLRM)" per kolom.
- Selama Menunggu: temuan terkunci (tombol Edit dan Batalkan hilang), status temuan belum berubah, Detail menampilkan kotak kuning dan tautan. Hanya satu pengajuan Menunggu per temuan secara praktis karena Edit terkunci.
- Menu Approval (src/shared/Approval.tsx): tabel dengan kolom Nomor Request | Modul | Jenis Request | Data | Pengaju | Tanggal Ajuan | Status | Aksi; pencarian "Cari jenis, data, pengaju"; filter "Semua status" (Menunggu, Disetujui, Ditolak) dan "Semua modul"; pagination 10/25/50. Request Tracker tampil dengan Modul "Regulatory Findings Tracker", Data "<Regulator - Area>". Detail request memuat Modul, Jenis request, Data, Pengaju (peran), Tanggal ajuan, Approver, Alasan, tabel Kolom | Nilai lama | Nilai baru, dan status keputusan.
- Siapa bisa memutuskan (`canDecide`): status Menunggu DAN (peran akun = Head CLRM atau Super Admin) DAN akun punya aksi Approve di modul Tracker DAN punya aksi Ubah di Approval. Tombol "Approve" dan "Reject" di Detail request; badge angka merah di menu Approval = jumlah request yang bisa diputuskan akun itu.
- Setuju (modal "Approve request", Catatan opsional, tombol Konfirmasi): semua perubahan diterapkan ke temuan; bila status menjadi Selesai: Tanggal validasi = hari ini, Persetujuan Penutupan = Disetujui, Oleh = nama approver, Tanggal = hari ini. Audit "Setujui penutupan" per kolom (alasan = alasan pengajuan). Request ditandai Disetujui (tidak dihapus).
- Tolak (modal "Reject request", Catatan wajib; pesan "Catatan wajib diisi saat Reject"): perubahan tidak diterapkan; Persetujuan Penutupan = Ditolak, Oleh = approver, Tanggal = hari ini; status kembali ke status sebelum pengajuan bila sedang Menunggu Validasi (lihat transisi); audit "Tolak penutupan" hanya untuk kolom Status (nilai sebelum dan sesudah menurut yang benar-benar terjadi) dengan catatan sebagai alasan. Temuan terbuka untuk diedit lagi. Request ditandai Ditolak.
- Tracker tidak punya approval untuk Tambah, edit selain penutupan, Batalkan, maupun Kembalikan.

### Notifikasi / alert

Aturan alert (src/lib.ts:104-124) hanya berlaku untuk temuan yang BUKAN Selesai dan BUKAN Dibatalkan (`isOpenish`). Hari dihitung selisih tanggal kalender (bukan hari kerja). d = Batas Waktu - hari ini.

| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul notifikasi | Pesan notifikasi | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Mendekati batas waktu | 0 <= d <= 7 (Batas Waktu hari ini sampai 7 hari ke depan). Detail "<d> hari lagi" | kuning | PIC temuan (token "PIC (nama)") | "Temuan mendekati batas waktu"; bila d = 0: "Temuan jatuh tempo hari ini" | "Temuan <Regulator - Area> jatuh tempo <hari ini / besok / N hari lagi>. Segera selesaikan tindak lanjutnya." | status Selesai atau Dibatalkan; Batas Waktu diundur ke lebih dari 7 hari; atau Batas Waktu terlewat (berganti ke alert lewat) |
| Lewat batas waktu | d < 0 (hari ini lewat Batas Waktu). Detail "Lewat <n> hari" | merah | PIC temuan dan Head CLRM; ditambah "Direktur terkait" bila n > 7 (terlambat lebih dari 7 hari) | "Temuan lewat batas waktu" | "Temuan <Regulator - Area> melewati batas waktu <n> hari. Segera tindak lanjuti." | status Selesai atau Dibatalkan; Batas Waktu diundur sampai tidak lewat |
| Menunggu validasi terlalu lama | status = Menunggu Validasi DAN selisih (hari ini - tanggal entri audit terakhir yang mengubah Status menjadi Menunggu Validasi) > 7 hari. Detail "<w> hari menunggu". Bila tidak ada entri audit seperti itu, alert tidak muncul | kuning | Compliance Officer (semua akun berperan itu) dan Head CLRM | "Menunggu validasi terlalu lama" | "Temuan <Regulator - Area> menunggu validasi ulang selama <w> hari (batas 7 hari). Segera validasi." | status berubah dari Menunggu Validasi; atau menjadi Selesai atau Dibatalkan |

- Satu temuan bisa memicu dua alert sekaligus (mis. Lewat batas waktu dan Menunggu validasi terlalu lama).
- "Direktur terkait" tidak punya akun demo sehingga hanya terlihat oleh Super Admin.
- Notifikasi mengikuti aturan di 0.4. Nilai 7 hari adalah konstanta kode.
- Tidak ada pengulangan jadwal: alert aktif terus selama kondisi berlaku, dan tiap alert per temuan hanya satu item notifikasi.

### Peran

Matriks DEFAULT per modul Tracker (perms.ts) dan matriks EFEKTIF yang benar-benar berlaku di UI untuk akun seed (hasil perhitungan `permsOf` dan `canAccount` pada kategori Compliance). "Tab Dashboard" = aksi Dashboard.

| Peran | Lihat | Tambah | Ubah | Batalkan / Kembalikan | Approve | Export | Dashboard | Buka sensor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | Ya | Ya | Ya | tidak ada sensor |
| Head CLRM | Ya | Tidak | Ya (efektif; default modul: Tidak) | Ya | Ya | Ya | Ya | tidak ada sensor |
| Compliance Officer | Ya | Ya | Ya | Ya pada tombol tabel (efektif; default modul: Tidak) | Tidak | Ya | Ya | tidak ada sensor |
| Risk Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya | tidak ada sensor |
| Legal Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya | tidak ada sensor |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya | tidak ada sensor |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | Ya pada izin Tracker (efektif) tetapi tidak jadi approver penutupan | Ya | Ya | tidak ada sensor |
| PIC | Ya | Ya (efektif; default modul: Tidak) | Ya, hanya temuan dengan nama PIC = nama akun (milik sendiri) | Ya pada tombol tabel (efektif) | Tidak | Ya | Ya | tidak ada sensor |
| Viewer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya | tidak ada sensor |

Penjelasan selisih default vs efektif (kode menang):
- Default modul Tracker (perms.ts:15-17): Tambah = Compliance Officer; Ubah = Compliance Officer dan PIC; Cancel = Head CLRM; Approve = Head CLRM; Export dan Lihat = semua; Super Admin semua aksi.
- Efektif memakai kategori Compliance gabungan, jadi: PIC mendapat Tambah (karena PIC boleh Tambah di SOP); Head CLRM mendapat Ubah dan Compliance Officer serta PIC mendapat Cancel (karena `update` = Ubah dan Cancel sekaligus untuk kategori); Ketua SMKI mendapat Approve (dari Regulatory Change). Approve pada Tracker baru benar-benar bisa dipakai bila peran akun = Head CLRM atau Super Admin (`canDecide`), jadi Ketua SMKI tidak bisa memutuskan Penutupan Temuan.
- Tombol Batalkan di tabel mengikuti Cancel efektif (Super Admin, Head CLRM, Compliance Officer, PIC), tetapi tombol Batalkan/Kembalikan di Detail hanya untuk peran Tracker Head CLRM (Head CLRM dan Super Admin). Panduan halaman menyebut hanya Head CLRM dan Super Admin yang bisa Batalkan: tidak sesuai dengan tombol tabel.
- "Isi Validasi Ulang" hanya untuk peran sesi Compliance Officer (Super Admin dipetakan menjadi Head CLRM sehingga tidak melihat tombol ini).
- "Milik sendiri": hanya Edit oleh peran PIC (nama PIC temuan harus sama dengan nama akun). Tidak ada "milik sendiri" untuk Batalkan atau Lihat.
- Sejak v2.14.0, Super Admin dapat mengubah izin per akun di Admin > Manage Permissions (kategori Compliance: View, Create, Update, Export, Approve, Dashboard). Matriks di atas adalah nilai awal akun seed dan bisa berubah. Karena izin per kategori, perubahan berlaku sekaligus untuk Tracker, Reporting, Regulatory Change, dan SOP & Dokumen Kontrol.
- Akun status Inactive, Archive, Suspend tidak bisa dipilih sebagai akun demo aktif.

### Kondisi khusus dan prasyarat (daftar eksplisit)

- Tab Dashboard hanya tampil bila akun punya aksi Dashboard; bila tidak, hanya tab Table dan tab itu jadi tab awal.
- Tombol "Tambah" hanya bila aksi Tambah; "Export Excel" hanya bila aksi Export; "Import Excel" tidak pernah tampil.
- Tombol "Edit" per baris: lihat 4 syarat di bagian Edit. Hilang untuk status Selesai, Dibatalkan, dan temuan dengan pengajuan Menunggu; hilang untuk PIC pada temuan PIC lain.
- Tombol "Batalkan" per baris: aksi Cancel efektif DAN tidak ada pengajuan Menunggu DAN status bukan Dibatalkan.
- Tombol "Kembalikan" per baris: aksi Cancel efektif DAN status Dibatalkan.
- Kotak kuning "Menunggu persetujuan Head CLRM" di Detail hanya bila ada pengajuan berstatus Menunggu.
- Baris "Validasi Ulang" dan "Nama Validator" di Detail hanya bila status Selesai. Di form Edit, dua kolom itu hanya muncul bila Status yang dipilih = Selesai.
- Kolom "Alasan perubahan Batas Waktu" di Edit hanya wajib bila Batas Waktu diubah; di Detail menampilkan alasan terakhir.
- Tombol "Isi Validasi Ulang": status Menunggu Validasi DAN Validasi Ulang = Belum DAN peran sesi = Compliance Officer.
- Pilihan Status "Selesai" hanya ada di form Edit, tidak di form Tambah. "Dibatalkan" tidak pernah ada di form.
- Alert hanya untuk temuan status Open, Proses, Menunggu Validasi. Alert "Menunggu validasi terlalu lama" butuh entri audit perubahan ke Menunggu Validasi.
- "Direktur terkait" menjadi penerima hanya bila terlambat lebih dari 7 hari.
- Opsi "Lainnya" hanya untuk Regulator dan Area Temuan (form Tambah). Di Edit, Regulator dan Area terkunci.
- Badge alert di Detail hanya untuk temuan yang masih open-ish.
- Filter "Regulator = Lainnya" menampilkan hanya temuan dengan regulator di luar 5 nama tetap.
- Tautan notifikasi membuka Detail hanya bila id temuan ada di data.
- Edit oleh Head CLRM atau Super Admin pada temuan yang statusnya Menunggu Validasi dan sudah Valid tidak mengubah apa pun otomatis; penutupan tetap harus lewat Edit ke Selesai dan persetujuan.
- Persetujuan Penutupan berisi "Menunggu" (abu-abu) untuk semua temuan baru yang belum pernah diajukan; ini nilai awal, bukan menandakan ada pengajuan aktif.

### Data contoh (bukan requirement)
40 temuan seed (src/lib.ts:145-225): status Open 8, Proses 15, Menunggu Validasi 5, Selesai 10, Dibatalkan 2; risiko High 13, Medium 11, Low 16; regulator BI 8, PPATK 10, Komdigi 8, BSSN 8, Pemerintah-DPR 6; satu temuan Proses dengan penutupan Ditolak; 9 request approval (1 Ditolak, 5 Menunggu, 3 Disetujui). Alert seed pada tanggal pengujian: mendekati 5, lewat 10, menunggu validasi terlalu lama 3. PIC seed bergilir Regie, Fakhri, Osama. Penyimpanan di browser dengan kunci `clrm.db.v9`; tombol reset di header mengembalikan seed.

### Sumber kode
- src/Tracker.tsx: COLS 21; filter popover 185-205; tabel 214-247; pager 249-262; saveForm (tambah, edit, pengajuan) 84-114; actsFor (validasi, batalkan, kembalikan) 123-136; canEdit 139; doExport 141-154; dashFilter 156.
- src/Form.tsx: validate 11-21; ADD_STATUS 8, EDIT_STATUS 9; submit 50-56; form edit dan tambah 74-132.
- src/Drawer.tsx: Decision 13-28; isi Detail 44-86; tombol 87-93.
- src/Dashboard.tsx: INFO 13-73; perhitungan 104-139; tampilan 142-235.
- src/lib.ts: konstanta 4-15; alertsFor 104-124; makeSeed 145-225; applyTrackerRequest 258-275; applyFilter 278-291; validateFile 304-313.
- src/App.tsx: trackerRole 59, pemanggilan 163. src/kit/perms.ts:14-77. src/kit/notify.tsx: WORDS 59-73, isRecipient 148-158, buildNotifs 160-174. src/shared/Approval.tsx:14-20 (adapter, canDecide). src/kit/history.tsx: trackerHistory. src/ui.tsx: FileField 36-72, ReasonModal 82-97.

### Selisih dengan keputusan final (Regulatory Findings Tracker)
Dibandingkan dengan bagian "Keputusan yang sudah final" pada file prompt PRD. Hanya dicatat, tidak dipilih.
1. "Progress diisi manual": mockup tidak punya kolom Progress.
2. "Rencana Tindak Lanjut & Bukti: teks dan file, bisa lebih dari satu": mockup hanya satu teks Rencana Tindak Lanjut dan satu file bukti.
3. "Tren per bulan punya filter sendiri: all time, 3 bulan terakhir, per kuartal, custom": mockup punya Seluruh Waktu, 3, 6, 9, 12 bulan terakhir (default 12), dan Custom; TIDAK ada "per kuartal".
4. "Semua kolom unit kerja bernama Departemen, pilihan dari Master Data Departemen (nama mengikuti dokumen HR)": mockup memakai label "Unit Kerja" dan Master Data "Unit Kerja" (isi seed sudah daftar departemen Paydia).
5. "Menutup temuan: Validasi Ulang, lalu approval Head CLRM": mockup menyediakan Validasi Ulang lewat dua jalur (tombol di Detail oleh Compliance Officer saat Menunggu Validasi, atau isian saat Edit ke Selesai oleh siapa pun yang boleh Edit) dan hasil "Valid" tidak mewajibkan urutan; isian Validasi Ulang boleh "Belum".
6. "Dibatalkan bisa dikembalikan ke status terakhir": sesuai.
7. "Import tidak ada di dashboard": sesuai di UI (tombol disembunyikan), tetapi kode TrackerImport.tsx dan entri audit "Import Excel" masih ada.
8. "Mencatat semua permintaan regulator, termasuk permintaan data": mockup tidak punya pembeda jenis (audit versus permintaan data); semua sama sebagai temuan dengan Area dan Jenis Penyebab.
9. "Batalkan wajib alasan": sesuai. "Approval hanya untuk menutup temuan": sesuai.
10. Fitur mockup yang tidak ada di keputusan: kolom Penyebab Utama dan Jenis Penyebab; Tingkat Risiko (High, Medium, Low); Unit Kerja; Validasi Ulang dan Nama Validator; Persetujuan Penutupan; Alasan perubahan Batas Waktu (wajib bila Batas Waktu diubah dan harus berbeda dari alasan terakhir); opsi "Lainnya" teks bebas untuk Regulator dan Area; tiga alert (Mendekati batas waktu, Lewat batas waktu dengan eskalasi "Direktur terkait", Menunggu validasi terlalu lama) dengan konstanta 7 hari; dashboard 6 kartu dan tabel Lewat Batas Waktu; kolom Tanggal Dibuat; sembilan peran dengan izin per kategori.
11. Daftar Regulator adalah konstanta kode, bukan Master Data (keputusan menyebut Master Data hanya untuk Departemen, PIC, kategori regulasi, dst; Regulator tidak disebut).
12. Panduan Halaman (tracker.ts) tidak sesuai kode pada: siapa yang bisa Batalkan di tabel (lihat Peran); frasa "Tambah (Compliance Officer dan Super Admin)" sementara PIC efektif juga melihat tombol Tambah.

---

# BAGIAN B

## Regulatory Reporting (menu: Compliance > Regulatory Reporting)

- Ringkasan tujuan: mencatat laporan rutin dan insidental ke regulator beserta batas waktunya, status penyusunan sampai terkirim, ketepatan waktu, dan memantau lewat kalender serta alert.
- Prasyarat akses: aksi Lihat modul Reporting. Tab Dashboard butuh aksi Dashboard. Halaman TIDAK memakai approval.
- Rute: `compliance/regulatory-reporting`. Dirakit oleh PageShell dengan konfigurasi `cfg` di Reporting.tsx:212-264. Judul halaman "Regulatory Reporting", kata benda "Laporan", awalan file export "Pelaporan_Regulator".
- Jadwal laporan TIDAK dibuat otomatis; setiap laporan ditambah manual (komentar kode "A9").
- Pilihan tetap di kode (Reporting.tsx:66-68):
  - Regulator (REG): BI, PPATK, Komdigi, BSSN, Pemerintah-DPR (tanpa opsi Lainnya, karena field select dengan daftar tanpa "Lainnya").
  - Jenis Periode (JENIS): Harian, Mingguan, Bulanan, Triwulanan, Tahunan, 3 Tahun Sekali, Insidental.
  - Status (STATUS): Belum Disiapkan, Disusun, Review, Terkirim, Terlambat. Status lain di sistem: Dibatalkan (hanya lewat Batalkan).
  - PIC Penyusun dan PIC Reviewer: Master Data "PIC" (seed Regie, Fakhri, Osama).

### Tab Dashboard

**Filter global halaman: "Periode Batas Waktu"** (PageShell.tsx:88-97)
- Dua input tanggal (dari, sampai), tombol "Reset", dan teks "{N} data (tanpa yang dibatalkan)". Menyaring berdasarkan Batas Waktu. Kosong berarti semua.
- Berlaku untuk: Kalender, Ketepatan waktu, Beban laporan, Jatuh tempo 7 hari. TIDAK berlaku untuk Tren laporan terlambat (memakai semua data non-Dibatalkan).
- Semua kartu mengecualikan laporan Dibatalkan.
- Status yang dipakai adalah status hasil normalisasi (Terlambat otomatis, lihat Status dan transisi).

**Kartu "Kalender pelaporan (batas waktu)"**
- Bentuk: kalender dengan tombol tampilan "hari", "minggu", "bulan" (huruf kecil kapital awal lewat CSS; tampilan awal = hari), tanda panah "Sebelumnya" dan "Berikutnya", judul periode. Tampilan Bulan: grid 7 kolom (Min Sen Sel Rab Kam Jum Sab), 42 sel, sel di luar bulan diredupkan, maksimal 3 titik per hari dan sisanya "+N lagi". Tampilan Minggu: 7 hari mulai Minggu. Tampilan Hari: satu hari, hingga 20 titik. Tanggal hari ini diberi latar biru dan teks biru tebal pada Minggu dan Bulan (tidak pada Hari).
- Isi: satu titik per laporan pada tanggal Batas Waktunya, label = Nama Laporan. Dibatalkan tidak tampil. Mengikuti filter Periode Batas Waktu.
- Warna titik mengikuti Status: hijau untuk Terkirim; kuning untuk Belum Disiapkan, Disusun, Review; merah untuk Terlambat.
- Interaksi: arahkan kursor menampilkan nama laporan (tooltip); klik titik membuka Detail laporan.
- Info (i): apa = "Kalender laporan menurut Batas Waktu. Tiap titik adalah satu laporan pada tanggal Batas Waktunya (laporan Dibatalkan tidak ditampilkan)."

**Kartu "Ketepatan waktu: jenis periode dan regulator (% tepat waktu)"**
- Bentuk: bar horizontal satu seri "Tepat Waktu (%)", 12 batang: "Jenis: Harian", "Jenis: Mingguan", "Jenis: Bulanan", "Jenis: Triwulanan", "Jenis: Tahunan", "Jenis: 3 Tahun Sekali", "Jenis: Insidental", lalu "Regulator: BI", "Regulator: PPATK", "Regulator: Komdigi", "Regulator: BSSN", "Regulator: Pemerintah-DPR". Batang Jenis biru (#3b82f6), batang Regulator hijau (#10b981).
- Aturan hitung: dari laporan berstatus Terkirim yang punya Tanggal Pengiriman (kelompok bersangkutan): persen = round(jumlah tepat waktu / jumlah laporan itu * 100); 0 bila tidak ada laporan. Tepat waktu = tanggal (bagian tanggal) Tanggal Pengiriman tidak lebih dari tanggal Batas Waktu (kirim di hari yang sama = tepat).
- Tooltip: nama kelompok, "Tepat waktu %: <n>", "Rincian: <tepat>/<total>". Catatan: batang 0 bisa berarti tidak ada laporan Terkirim di kelompok itu atau semuanya terlambat.
- Interaksi: klik batang membuka tab Table dengan filter Jenis Periode (batang "Jenis: x") atau Regulator (batang "Regulator: x") terisi; pencarian dikosongkan.
- Kartu menampilkan "Tidak ada data" bila semua batang bernilai 0.
- Info (i): apa = "Persentase laporan Terkirim yang dikirim tepat waktu, per jenis periode dan per regulator. Hanya laporan Terkirim yang punya Tanggal Pengiriman yang dihitung. Tepat waktu berarti tanggal pengiriman tidak melewati Batas Waktu."

**Kartu "Beban laporan per jenis periode"**
- Bentuk: bar vertikal bertumpuk (legenda), sumbu X 7 Jenis Periode. Seri: "Terkirim" hijau (#10b981), "Dalam proses" kuning (#f59e0b), "Terlambat" merah (#ef4444).
- Aturan: Terkirim = status Terkirim; Dalam proses = belum Terkirim dan status bukan Terlambat (Belum Disiapkan, Disusun, Review); Terlambat = status Terlambat (hasil normalisasi).
- Interaksi: klik batang warna mana pun membuka tab Table terfilter Jenis Periode itu.
- Info (i): apa = "Jumlah laporan per Jenis Periode menurut kondisinya: Terkirim, Dalam proses (belum Terkirim dan belum Terlambat), dan Terlambat."

**Kartu "Tren laporan terlambat per bulan"**
- Bentuk: line chart satu garis "Terlambat" merah (#ef4444). Sumbu X bulan Batas Waktu (YYYY-MM), sumbu Y jumlah.
- Aturan: dihitung laporan yang `wasLate` = status Terlambat ATAU Tanggal Pengiriman melewati Batas Waktu, dikelompokkan menurut bulan Batas Waktu. Memakai semua data non-Dibatalkan, tidak ikut Periode Batas Waktu.
- Filter sendiri (toolbar "Periode"): "Seluruh Waktu", "3 bulan terakhir", "6 bulan terakhir", "9 bulan terakhir", "12 bulan terakhir" (default), "Custom" (dua input bulan). Bulan kosong tampil 0.
- Titik tidak bisa diklik.
- Info (i): apa = "Jumlah laporan yang terlambat per bulan Batas Waktu. Dihitung laporan berstatus Terlambat atau yang Tanggal Pengiriman-nya melewati Batas Waktu. Memakai semua data, tidak ikut Periode Batas Waktu."

**Kartu "Jatuh tempo 7 hari ke depan"**
- Bentuk: tabel mini kolom: No, Nama Laporan, Batas, PIC, Status. No = posisi baris (lanjut antar halaman). Kolom PIC = PIC Penyusun. Status memakai pill berwarna. Pagination tetap 5 baris per halaman tanpa pilihan ukuran. Kosong: "Tidak ada data".
- Isi: laporan yang belum Terkirim, status bukan Terlambat, dan Batas Waktu dari hari ini sampai 7 hari ke depan (inklusif), urut Batas Waktu naik (terdekat dulu). Mengikuti filter Periode Batas Waktu.
- Interaksi: klik baris membuka Detail laporan.
- Info (i): apa = "Laporan yang belum Terkirim dan belum Terlambat dengan Batas Waktu dari hari ini sampai 7 hari ke depan, diurutkan dari yang paling dekat."

### Tab Table

- Toolbar: kotak cari (placeholder persis "Cari nama laporan, regulator, PIC"); tombol "Filter"; di kanan "Export Excel" (aksi Export), "Tambah" (aksi Tambah); "Import Excel" disembunyikan (SHOW_IMPORT = false di kerangka, tidak pernah tampil).
- **Pencarian**: substring tidak sensitif huruf besar kecil pada gabungan: nomor internal, Nama Laporan, Regulator, PIC Penyusun, PIC Reviewer.
- **Filter** (popover 380 px, "Clear All" dan "Apply Filters", AND antar kriteria, placeholder dropdown "Pilih <label>"):
  1. "Periode (Batas Waktu)": rentang tanggal terhadap Batas Waktu (dari - sampai).
  2. "Jenis Periode": Harian, Mingguan, Bulanan, Triwulanan, Tahunan, 3 Tahun Sekali, Insidental.
  3. "Status": Belum Disiapkan, Disusun, Review, Terkirim, Terlambat, Dibatalkan (cocok dengan status hasil normalisasi).
  4. "Regulator": BI, PPATK, Komdigi, BSSN, Pemerintah-DPR.
  5. "PIC": nama unik semua PIC Penyusun dan Reviewer yang ada di data (urut abjad); cocok bila laporan punya PIC itu sebagai Penyusun ATAU Reviewer.
  - Tidak ada fitur simpan filter. Mengubah cari atau filter mengembalikan ke halaman 1.
- **Kolom tabel, urutan persis**: Nomor | Nama Laporan | Regulator | Jenis Periode | Periode | Batas Waktu | Status | Tepat Waktu? | Penyusun | Tanggal Dibuat | Aksi.
  - Batas Waktu dd/mm/yyyy. Status memakai pill: hijau untuk Terkirim; kuning untuk Belum Disiapkan, Disusun, Review; merah untuk Terlambat; abu-abu untuk Dibatalkan. "Tepat Waktu?": "Tepat Waktu" (hijau) atau "Terlambat (+N hari)" (merah), "-" bila Tanggal Pengiriman atau Batas Waktu kosong. "Penyusun" = PIC Penyusun. Tanggal Dibuat dd/mm/yyyy HH:mm.
  - Kolom tidak ada di tabel tetapi ada di data: Reviewer, Waktu Kejadian, Waktu Notifikasi Awal, Tanggal Pengiriman, bukti, nomor tanda terima, dasar ketentuan, alasan.
- **Pagination**: 10 / 25 / 50, default 10; jendela maksimal 7 nomor halaman; teks "N sampai M dari T data"; urutan Tanggal Dibuat terbaru dulu.
- **Aksi per baris**: "Lihat Detail" (selalu), "Edit", "Batalkan", "Kembalikan" (syarat di bawah).
- **Export Excel** (src/kit/exportXlsx.ts): data = baris yang sedang tampil sesuai cari dan filter (semua hasil, status hasil normalisasi, termasuk Dibatalkan bila lolos filter). Nama file `Pelaporan_Regulator_<YYYY-MM-DD>.xlsx`, sheet "Regulatory Reporting". Kolom: Nomor (urutan baris), Tanggal Dibuat (dd/mm/yyyy HH:mm:ss), lalu semua isian laporan sesuai urutan form, kecuali yang tersembunyi untuk baris itu: Nama Laporan, Regulator, Jenis Periode, Waktu Kejadian, Laporan Insiden Siber? (hanya jenis Insidental), Waktu Notifikasi Awal (hanya laporan siber), Periode yang Dilaporkan, Batas Waktu (Due Date), Tanggal Pengiriman, Status, Tepat Waktu?, PIC Penyusun, PIC Reviewer, Bukti Pengiriman (file) (nama file), Nomor Tanda Terima, Dasar Ketentuan, Alasan Terlambat. Tanggal dd/mm/yyyy, tanggal waktu dd/mm/yyyy HH:mm. Tidak ada masking. Tercatat di Log "Regulatory Reporting / Export" dengan "{n} baris".

### Form Tambah (modal "Tambah Laporan")

Modal lebar, grid 2 kolom, tombol "Batal" dan "Simpan". Urutan field mengikuti konfigurasi; label dengan `*` bila wajib pada kondisi saat itu (label berubah sesuai isian).

| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan error |
| --- | --- | --- | --- | --- | --- | --- |
| Nama Laporan | Teks bebas | diketik bebas (Master Data "Laporan" ada tetapi TIDAK dipakai form) | Wajib | - | Selalu | "Nama Laporan wajib diisi" |
| Regulator | Dropdown | BI, PPATK, Komdigi, BSSN, Pemerintah-DPR | Wajib | - | Selalu | "Regulator wajib diisi" |
| Jenis Periode | Dropdown | Harian, Mingguan, Bulanan, Triwulanan, Tahunan, 3 Tahun Sekali, Insidental | Wajib | - | Selalu | "Jenis Periode wajib diisi" |
| Waktu Kejadian | Tanggal dan jam (datetime-local) | bebas | Opsional; wajib bila Jenis Periode = Insidental DAN Laporan Insiden Siber? = Ya | - | Selalu tampil (semua jenis) | "Waktu Kejadian wajib diisi". Bantuan: "Opsional; wajib untuk laporan insiden siber (jam berjalan dihitung dari waktu kejadian)." |
| Laporan Insiden Siber? | Dropdown Ya / Tidak | Ya, Tidak | Opsional | - | Hanya bila Jenis Periode = Insidental | Bantuan: "Jam berjalan insiden siber dihitung dari waktu kejadian." |
| Waktu Notifikasi Awal | Tanggal dan jam | bebas | Opsional | - | Hanya bila Insidental DAN Laporan Insiden Siber? = Ya | Tidak boleh sebelum Waktu Kejadian: "Waktu notifikasi tidak boleh sebelum waktu kejadian". Bantuan: "Paling lambat 1 jam sejak kejadian." (hanya teks, tidak divalidasi) |
| Periode yang Dilaporkan | Teks bebas | diketik manual | Wajib | - | Selalu | "Periode yang Dilaporkan wajib diisi". Bantuan: 'Diisi manual, mis. "Oktober 2026" atau "Q3 2026".' |
| Batas Waktu (Due Date) | Tanggal | bebas | Wajib | - | Selalu | "Batas Waktu (Due Date) wajib diisi" |
| Tanggal Pengiriman | Tanggal dan jam | bebas | Wajib bila Status = Terkirim | - | Selalu | "Tanggal Pengiriman wajib diisi" |
| Status | Dropdown | Belum Disiapkan, Disusun, Review, Terkirim, Terlambat (default Belum Disiapkan) | Wajib | - | Selalu | "Status wajib diisi"; bila Terlambat dipilih tetapi Batas Waktu belum lewat atau kosong: "Status Terlambat hanya bisa dipilih jika Batas Waktu sudah lewat". Bantuan: "Terlambat terisi otomatis bila Batas Waktu lewat dan belum Terkirim; dapat dipilih manual hanya jika Batas Waktu sudah lewat." |
| PIC Penyusun | Dropdown | Master Data "PIC" | Wajib | - | Selalu | "PIC Penyusun wajib diisi" |
| PIC Reviewer | Dropdown | Master Data "PIC" | Wajib | - | Selalu | "PIC Reviewer wajib diisi"; bila sama dengan Penyusun (tidak sensitif huruf): "PIC Penyusun dan Reviewer harus orang yang berbeda" |
| Bukti Pengiriman (file) | Upload 1 file | PDF, JPG, JPEG, PNG; maks 25 MB | Opsional | - | Selalu | Pesan upload 0.3. Bantuan: "Boleh kosong. Status Terkirim tanpa file dan tanpa Nomor Tanda Terima memunculkan notifikasi pengingat." |
| Nomor Tanda Terima | Teks | bebas | Opsional | - | Selalu | - |
| Dasar Ketentuan | Teks | bebas | Opsional | - | Selalu | - |
| Alasan Terlambat | Teks area lebar | bebas | Wajib bila: Status = Terlambat, ATAU Tanggal Pengiriman melewati Batas Waktu (tanggal), ATAU laporan belum Terkirim dan Batas Waktu < hari ini | - | Selalu | "Alasan Terlambat wajib diisi" |

- Kolom "Tepat Waktu?" tidak ada di form: dihitung otomatis (tampil di tabel, Detail, Export).
- Nomor internal otomatis (maks + 1), Tanggal Dibuat otomatis (waktu simpan), pembuat otomatis nama akun.
- Status yang tidak bisa dipilih saat tambah: tidak ada yang diblokir kecuali "Terlambat" bila Batas Waktu belum lewat; "Dibatalkan" bukan opsi form. Terkirim boleh dipilih saat tambah (wajib Tanggal Pengiriman).
- Tidak ada approval saat tambah. Log: entri Log "Regulatory Reporting / Tambah" dengan nama "<Nama Laporan> <Periode>".
- Aturan Status saat tampil vs tersimpan: tersimpan apa adanya; tampil mengikuti normalisasi (lihat Status).
- Semua file opsional di status apa pun.

### Edit (modal "Ubah Laporan <Nama Laporan> <Periode>")

- **Siapa boleh** (PageShell.tsx:45): tombol "Edit" muncul bila aksi Ubah efektif DAN laporan tidak Dibatalkan DAN tidak ada approval menunggu (Reporting tidak punya approval, jadi selalu terpenuhi) DAN (peran akun bukan PIC ATAU nama akun PIC sama dengan PIC Penyusun atau PIC Reviewer laporan, tidak sensitif huruf). Berlaku untuk Super Admin, Head CLRM (efektif), Compliance Officer, PIC.
- **Kolom yang bisa diubah** oleh selain Super Admin: Tanggal Pengiriman, Status, Bukti Pengiriman (file), Nomor Tanda Terima, Alasan Terlambat.
- **Kolom terkunci** untuk selain Super Admin (tampil nonaktif, nilai tidak ditulis ulang): Nama Laporan, Regulator, Jenis Periode, Waktu Kejadian, Laporan Insiden Siber?, Waktu Notifikasi Awal, Periode yang Dilaporkan, Batas Waktu (Due Date), PIC Penyusun, PIC Reviewer, Dasar Ketentuan. Super Admin bisa mengubah semua.
- Kolom terkunci tidak divalidasi.
- **Alasan perubahan**: kolom "Alasan perubahan" (teks area, opsional; tidak ada kolom yang memicu wajib) ikut masuk ke Log Perubahan. Alasan Terlambat tetap wajib sesuai syarat di tabel form.
- Teks info bila status saat ini otomatis berbeda dari yang tersimpan: "Status saat ini (otomatis): <status>".
- **Perubahan yang memicu approval**: tidak ada. Edit langsung tersimpan; bila tidak ada perubahan, tidak ada yang disimpan. Log: "Ubah" dengan daftar "Kolom: sebelum -> sesudah" dan alasan.

### Lihat Detail (modal "Detail")

- Badge alert aktif (satu per alert yang cocok) berisi "<label alert>: <detail>" dengan tooltip penerima; tidak tampil untuk laporan Dibatalkan.
- Kotak abu bila Dibatalkan: "Dibatalkan oleh <nama>, <tanggal>. Alasan: <alasan>. Status sebelumnya: <status>."
- Grid 2 kolom: Tanggal Dibuat, lalu semua field berurutan (yang kondisi tampilnya terpenuhi): Nama Laporan, Regulator, Jenis Periode, Waktu Kejadian, [Laporan Insiden Siber? bila Insidental], [Waktu Notifikasi Awal bila siber], Periode yang Dilaporkan, Batas Waktu (Due Date), Tanggal Pengiriman, Status, Tepat Waktu?, PIC Penyusun, PIC Reviewer, Bukti Pengiriman (file) (nama dan ukuran), Nomor Tanda Terima, Dasar Ketentuan, Alasan Terlambat. Nilai kosong tampil "-". Tidak ada sensor atau tombol mata.
- File hanya nama dan ukuran (tidak bisa dibuka).
- "Log Perubahan": entri "Data dibuat" (oleh pembuat), "Perubahan data" (kolom sebelum dan sesudah, alasan), "Dibatalkan", "Dikembalikan", dan entri log lama berupa teks. Tombol footer: "Tutup".

### Status dan transisi

- **Daftar status**: Belum Disiapkan, Disusun, Review, Terkirim, Terlambat, Dibatalkan.
- **Status otomatis** (normalize, Reporting.tsx:219-225), dihitung saat tampil untuk laporan yang tidak Dibatalkan:
  - Bila Batas Waktu sudah lewat (tanggal Batas Waktu < hari ini) DAN status tersimpan bukan Terkirim dan bukan Terlambat: tampil sebagai "Terlambat".
  - Bila Batas Waktu belum lewat (>= hari ini) DAN status tersimpan = Terlambat: tampil sebagai "Belum Disiapkan".
  - Status tersimpan tidak diubah oleh normalisasi; yang diubah adalah tampilan, filter, dashboard, alert, dan export.
- Status Terkirim tidak pernah menjadi Terlambat otomatis, tetapi kolom "Tepat Waktu?" menunjukkan "Terlambat (+N hari)" bila Tanggal Pengiriman melewati Batas Waktu.
- Alasan Terlambat wajib saat status Terlambat (lihat form). Pembatalan Terlambat: memilih status lain atau mengundur Batas Waktu (hanya Super Admin yang bisa mengubah Batas Waktu).
- **Transisi manual**: tidak dibatasi; user yang boleh Edit bisa memilih status mana pun dari 5 pilihan (Terlambat hanya bila Batas Waktu sudah lewat).
- **Batalkan**: tombol di tabel bila aksi Cancel efektif (Super Admin, Head CLRM, Compliance Officer, PIC) DAN laporan belum Dibatalkan. Modal "Batalkan Laporan <nama periode>", "Alasan *", error "Alasan wajib diisi.", tombol "Batal" dan "Konfirmasi" (merah). Hasil: status Dibatalkan; menyimpan status sebelumnya, alasan, pembatal, waktu; data tidak dihapus. Dibatalkan: baris abu-abu, tidak dihitung dashboard, tidak memicu alert, tidak bisa diedit.
- **Kembalikan**: tombol hijau "Kembalikan" untuk laporan Dibatalkan (aksi Cancel efektif). Modal "Kembalikan Laporan <nama periode>", alasan wajib. Status kembali ke status sebelum dibatalkan.
- Membatalkan satu laporan hanya berlaku untuk laporan itu: tidak ada jadwal berulang yang ikut terhapus.

### Approval
Tidak ada. Panduan halaman menyatakan "halaman ini tidak memakai approval". Tambah, Edit, Batalkan, Kembalikan semuanya langsung tanpa persetujuan.

### Notifikasi / alert

Aturan di Reporting.tsx:124-152. Semua alert tidak berlaku untuk laporan Dibatalkan. Evaluasi memakai data hasil normalisasi. Referensi laporan di notifikasi: "<Nama Laporan> (<Periode>)" (untuk Insidental: periode tanpa awalan "Insiden "). Subjek pesan "Laporan <nama> (periode <periode>)" untuk non-Insidental, "Laporan <nama> (<keterangan insiden>)" untuk Insidental; awalan "Laporan" tidak diulang bila nama sudah diawali kata itu.

| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul notifikasi | Pesan notifikasi | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Mendekati batas waktu | laporan belum Terkirim, status bukan Terlambat, Batas Waktu terisi, dan 0 <= (Batas Waktu - hari ini) <= 7. Detail "H-<d> batas waktu (<dd/mm/yyyy>)". Catatan: kode memicu setiap hari dalam rentang 0 sampai 7, bukan hanya H-7, H-3, H-1 seperti tertulis di teks aturan | kuning | PIC Penyusun (token "PIC (nama)", atau "PIC" bila Penyusun kosong) dan Compliance Officer | "Laporan mendekati batas waktu"; bila H-0: "Laporan jatuh tempo hari ini" | "<Laporan ...> belum terkirim. Batas waktu <dd/mm/yyyy> (hari ini / besok / N hari lagi). Siapkan dan kirim tepat waktu." | status Terkirim; Batas Waktu terlewat (berganti ke alert lewat); atau Dibatalkan |
| Lewat batas waktu | status (hasil normalisasi) = Terlambat. Detail "Terlambat sejak <dd/mm/yyyy>" | merah | PIC Penyusun dan Head CLRM | "Laporan lewat batas waktu" | "<Laporan ...> belum terkirim dan terlambat <n> hari dari batas waktu. Segera kirim dan isi alasan keterlambatan." (n = hari ini - Batas Waktu) | status Terkirim; Dibatalkan; atau Batas Waktu diundur |
| Tenggat pelaporan insiden siber sedang berjalan | Jenis Periode = Insidental DAN Laporan Insiden Siber? = Ya, belum Terkirim, Waktu Kejadian terisi. Notifikasi awal jatuh tempo 1 jam setelah Waktu Kejadian; laporan lengkap 3 hari kalender (72 jam) setelah Waktu Kejadian. Detail "Kejadian <dd/mm/yyyy HH:mm>: notifikasi awal <sudah dikirim ... / TERLEWAT x / sisa x>; laporan lengkap <TERLEWAT x / sisa x>" | merah (selalu) | Head CLRM dan CISO | "Tenggat pelaporan insiden siber sedang berjalan" | 'Insiden siber "<keterangan>" terjadi pada <dd/mm/yyyy HH:mm>. Notifikasi awal: <sudah dikirim dd/mm/yyyy HH:mm / terlewat N menit atau jam / sisa N menit atau jam>. Laporan lengkap: <terlewat ... / sisa ...>.' Durasi: kurang dari 120 menit ditulis "N menit", selain itu "N jam" | status Terkirim; Dibatalkan; Waktu Kejadian dikosongkan; Laporan Insiden Siber? bukan Ya |
| Terkirim tanpa bukti | status Terkirim DAN file Bukti Pengiriman kosong DAN Nomor Tanda Terima kosong (setelah trim). Detail "Bukti pengiriman belum diisi" | kuning | PIC Penyusun | "Laporan terkirim tanpa bukti" | "<Laporan ...> berstatus Terkirim, tetapi file bukti dan nomor tanda terima belum diisi. Lengkapi bukti pengiriman." | salah satu dari file atau Nomor Tanda Terima diisi; atau Dibatalkan |

- "CISO" tidak punya akun demo (hanya terlihat oleh Super Admin). Head CLRM melihat alert siber dan Lewat batas waktu.
- Pengiriman tepat waktu atau terlambat tidak menimbulkan notifikasi baru; hanya alert di atas.
- Mekanisme penerima dan penghentian: lihat 0.4.

### Peran

| Peran | Lihat | Tambah | Ubah | Batalkan / Kembalikan | Approve | Export | Dashboard | Buka sensor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya, semua kolom | Ya | tidak ada approval | Ya | Ya | tidak ada sensor |
| Head CLRM | Ya | Tidak | Ya (efektif), hanya 5 kolom | Ya | tidak ada approval | Ya | Ya | tidak ada sensor |
| Compliance Officer | Ya | Ya | Ya, hanya 5 kolom | Ya pada tombol tabel (efektif) | tidak ada approval | Ya | Ya | tidak ada sensor |
| Risk Officer | Ya | Tidak | Tidak | Tidak | tidak ada approval | Ya | Ya | tidak ada sensor |
| Legal Officer | Ya | Tidak | Tidak | Tidak | tidak ada approval | Ya | Ya | tidak ada sensor |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | tidak ada approval | Ya | Ya | tidak ada sensor |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | tidak ada approval | Ya | Ya | tidak ada sensor |
| PIC | Ya | Ya (efektif; default modul: Tidak) | Ya, hanya laporan dengan nama akun = PIC Penyusun atau Reviewer (milik sendiri), hanya 5 kolom | Ya pada tombol tabel (efektif) | tidak ada approval | Ya | Ya | tidak ada sensor |
| Viewer | Ya | Tidak | Tidak | Tidak | tidak ada approval | Ya | Ya | tidak ada sensor |

- Default modul Reporting (perms.ts:15-16): Tambah = Compliance Officer; Ubah = Compliance Officer dan PIC; Cancel = Head CLRM; Lihat dan Export = semua. Efektif per akun sama dengan Tracker karena kategori Compliance gabungan (PIC mendapat Tambah, Head CLRM mendapat Ubah, Compliance Officer dan PIC mendapat Batalkan). 5 kolom yang bisa diubah selain Super Admin: Tanggal Pengiriman, Status, Bukti Pengiriman, Nomor Tanda Terima, Alasan Terlambat.
- Sejak v2.14.0 izin per akun bisa diubah Super Admin di Admin > Manage Permissions (berlaku bersama Tracker, Regulatory Change, SOP karena satu kategori).
- Panduan halaman menyebut "Compliance Officer: Lihat, Tambah, Ubah, Export" dan "Batalkan hanya Head CLRM dan Super Admin": tidak sesuai tombol Batalkan efektif di tabel.

### Kondisi khusus dan prasyarat (daftar eksplisit)

- "Laporan Insiden Siber?" hanya tampil bila Jenis Periode = Insidental.
- "Waktu Notifikasi Awal" hanya tampil bila Insidental DAN Laporan Insiden Siber? = Ya.
- "Waktu Kejadian" selalu tampil; wajib bila Insidental DAN Laporan Insiden Siber? = Ya.
- "Tanggal Pengiriman" wajib hanya bila Status = Terkirim.
- "Alasan Terlambat" wajib bila status Terlambat, ATAU Tanggal Pengiriman melewati Batas Waktu, ATAU (belum Terkirim dan Batas Waktu < hari ini).
- Status "Terlambat" hanya bisa dipilih manual bila Batas Waktu sudah lewat.
- Kolom "Tepat Waktu?" bernilai "-" bila Tanggal Pengiriman atau Batas Waktu kosong.
- Alert "Terkirim tanpa bukti" hanya bila status Terkirim; alert "Tenggat pelaporan insiden siber" hanya untuk laporan siber belum Terkirim dengan Waktu Kejadian terisi; alert Mendekati dan Lewat hanya untuk laporan belum Terkirim.
- Tombol Edit hilang untuk laporan Dibatalkan dan, bagi peran PIC, untuk laporan yang tidak menyebut nama akunnya sebagai Penyusun atau Reviewer.
- Kolom terkunci pada Edit bagi selain Super Admin (11 kolom di atas).
- Tombol Batalkan hilang untuk laporan yang sudah Dibatalkan; tombol Kembalikan hanya untuk laporan Dibatalkan.
- Tab Dashboard butuh aksi Dashboard.
- Kalender: tombol tampilan Hari, Minggu, Bulan; warna biru hari ini hanya pada Minggu dan Bulan.
- Kartu "Ketepatan waktu" menampilkan "Tidak ada data" bila semua persentase 0.
- Kartu Tren memakai semua data dan tidak ikut filter Periode Batas Waktu.
- PIC Penyusun dan PIC Reviewer harus orang berbeda (validasi saat simpan).
- "Nama Laporan" diketik bebas; tidak ada autocomplete dari Master Data "Laporan" walau menu itu masih ada.

### Data contoh (bukan requirement)
44 laporan seed: 34 laporan Terkirim dengan Batas Waktu 12 bulan ke belakang (tiap laporan ke-5 terlambat dengan alasan terisi, nomor tanda terima TT-20260xx), 3 laporan H-7/H-3/H-1 (Review, Disusun, Belum Disiapkan), 2 laporan jatuh tempo jauh (Belum Disiapkan), 2 laporan terlambat (Disusun dan Review dengan alasan), 1 laporan Terkirim tanpa bukti, 2 laporan Insidental siber (BSSN) dengan Waktu Kejadian relatif terhadap waktu sekarang. Sebaran status saat seed: Terkirim 35, Review 2, Disusun 3, Belum Disiapkan 4 (Terlambat muncul lewat normalisasi). Jenis Periode: Harian 2, Mingguan 5, Bulanan 10, Triwulanan 8, Tahunan 16, 3 Tahun Sekali 1, Insidental 2. Katalog kewajiban pelaporan (laporan.shared.ts, 40 baris CAT) hanya dipakai untuk membentuk seed dan daftar Master Data "Laporan"; bukan jadwal otomatis.

### Sumber kode
- src/pages/Reporting.tsx: INFO 20-64; konstanta 66-81; fields (form dan detail) 84-102; columns 103-113; filters 115-121; alerts 124-152; seed 159-196; TrenTerlambat 198-203; SoonTable 204-210; cfg (search, normalize, canEditRow, validate) 212-235; Dashboard 236-263.
- src/pages/laporan.shared.ts: CAT 15-53, periodeOf 73-83.
- src/kit/PageShell.tsx: tab 23,81; filter periode dashboard 88-97; canEdit 45; aksi 65-75; export 108. src/kit/FormModal.tsx: validateRecord 21-36; form 99-185. src/kit/DetailModal.tsx. src/kit/DataTable.tsx. src/kit/FilterPopover.tsx. src/kit/exportXlsx.ts:13-26. src/kit/store.tsx: update/cancel/restore 150-205. src/kit/charts.tsx: useMonthRange 34-50, BarCard 83-110, LineCard 130-142, MiniTable 163-185, CalendarCard 186-250. src/kit/fmt.tsx: statusTone. src/kit/notify.tsx: WORDS 63-73 (reporting.*), SOURCES 27.

### Selisih dengan keputusan final (Regulatory Reporting)
1. "Nama laporan diketik bebas": sesuai (teks bebas). Master Data "Laporan" masih ada di menu tetapi tidak dipakai Reporting.
2. "Jenis Periode termasuk Insidental untuk laporan insidental yang diatur PBI atau PADG": Insidental ada, tetapi mockup memakainya terutama untuk insiden siber (Laporan Insiden Siber?, Waktu Kejadian, Waktu Notifikasi Awal, alert jam berjalan, dasar seed "Perban BSSN 8/2020"). Keputusan tidak menyebut insiden siber.
3. "Status Terlambat otomatis bila hari ini lewat batas waktu dan status sebelumnya bukan Terkirim. Alasan terlambat wajib saat Terlambat": sesuai; mockup menambah syarat Alasan Terlambat wajib juga bila Tanggal Pengiriman melewati Batas Waktu atau Batas Waktu lewat dan belum Terkirim. Status tersimpan tidak diubah (hanya tampilan otomatis).
4. "Kalender hari, minggu, bulan. Tabel jatuh tempo 7 hari maksimal 5 baris per halaman": sesuai (tampilan awal Hari).
5. "Edit tanpa approval": sesuai. Tetapi mockup membatasi kolom yang bisa diubah selain Super Admin menjadi 5 kolom; keputusan tidak menyebut pembatasan ini.
6. "Batalkan dan kembalikan wajib alasan": sesuai.
7. "Membatalkan laporan berulang menghapus jadwal berikutnya": TIDAK ADA di mockup. Tidak ada laporan berulang atau jadwal otomatis; setiap laporan ditambah manual; Batalkan hanya berlaku untuk laporan itu.
8. Fitur mockup yang tidak ada di keputusan: status Belum Disiapkan, Disusun, Review; PIC Penyusun dan PIC Reviewer (harus berbeda); kolom Tepat Waktu? otomatis; Tanggal Pengiriman; Bukti Pengiriman dan Nomor Tanda Terima dan alert "Terkirim tanpa bukti"; Dasar Ketentuan; dashboard Ketepatan waktu dan Beban laporan dan Tren laporan terlambat; klik batang membuka Table terfilter; alert "Mendekati batas waktu" harian 0 sampai 7 hari dan "Lewat batas waktu"; alert insiden siber dengan CISO; pembatasan kolom edit.
9. Teks aturan alert "Mendekati batas waktu" di kode menyebut "H-7/H-3/H-1" tetapi logika memicu setiap hari 0 sampai 7. Panduan halaman menyebut "0 sampai 7 hari" (konsisten dengan logika).
10. Panduan halaman (reporting.ts) menyebut Waktu Notifikasi Awal ikut menjadi wajib saat siber; di kode Waktu Notifikasi Awal tidak wajib (hanya Waktu Kejadian yang wajib).
11. Departemen: Reporting tidak punya kolom unit kerja/departemen; PIC dari Master Data PIC.
