# 05 Legal: pengetahuan mockup v2.14.4 (Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum)

Sumber: kode di `src/pages/Kontrak.tsx`, `Aph.tsx`, `Perizinan.tsx`, `LayananHukum.tsx`, kit bersama di `src/kit/*`, panduan di `src/guides/{kontrak,aph,perizinan,layanan}.ts`. Bila panduan dan kode berbeda, kode menang dan perbedaan dicatat. Data contoh bukan requirement. Dokumen ini hanya mencatat fakta, tidak memilih antara mockup dan keputusan final.

Menu: grup **Legal** berisi Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum (rute `legal/kontrak`, `legal/permintaan-aph`, `legal/perizinan`, `legal/layanan-hukum`; `src/App.tsx:37-40`).

---

## A. Perilaku bersama keempat halaman (kit)

Keempat halaman dibangun dari satu kit (`PageShell` + `DataTable` + `FormModal` + `DetailModal` + `FilterPopover`). Perilaku di bagian ini berlaku sama untuk semua halaman, kecuali dinyatakan lain di bagian halaman.

### A1. Akses halaman dan tab
- Halaman hanya terbuka bila akun punya izin Lihat untuk modul itu. Bila tidak: kotak teks "Anda tidak memiliki akses ke halaman ini" (`src/App.tsx:162`).
- Dua tab: **Dashboard** (tab pertama, default) dan **Table**. Tab Dashboard hanya muncul bila akun punya izin Dashboard kategori Legal (`legal.dashboard`). Bila tidak punya, hanya tab Table yang tampil dan jadi default (`PageShell.tsx:23, 84`).
- Tombol **Panduan Halaman** di samping judul halaman membuka isi panduan (HTML statis, `src/guides/*.ts`).
- Tombol **Import Excel** disembunyikan di semua halaman (`PageShell.tsx:16 SHOW_IMPORT = false`). Kode import masih ada, tetapi tidak ada tombol di UI. Field `Perpanjang izin` dan `Versi Sebelumnya` (Perizinan) ditandai `noImport`.

### A2. Filter Periode global tab Dashboard
- Baris di atas dashboard: label "Periode {nama tanggal}", dua input tanggal, teks "sampai", tombol **Reset**, dan teks di kanan "{n} data (tanpa yang dibatalkan)".
- Nama tanggal per halaman: Kontrak = Tanggal Mulai; Permintaan APH = Tanggal Terima Surat; Perizinan = Tanggal Terbit; Layanan Hukum = Tanggal Masuk.
- Kosong di kedua ujung = semua data. Salah satu ujung boleh kosong. Rekaman tanpa tanggal itu tidak ikut bila filter diisi.
- Data berstatus Dibatalkan (atribut `cancelled`) selalu dikeluarkan dari semua visual dashboard.
- Visual yang memakai `rows` mengikuti Periode ini. Visual bulanan (garis) memakai `allRows` dan punya filter Periode bulan sendiri, tidak mengikuti Periode halaman.
- Klik elemen visual (kartu, batang, irisan) memanggil **drill**: filter Table diganti dengan filter dari elemen itu saja (filter lain dan kotak cari dikosongkan), lalu tab pindah ke Table. Periode halaman TIDAK ikut terbawa ke filter Table, jadi jumlah di Table bisa lebih besar dari angka kartu bila Periode halaman diisi.

### A3. Filter bulan per grafik garis (`useMonthRange`)
- Dropdown "Periode" dengan pilihan: "Seluruh Waktu", "3 bulan terakhir", "6 bulan terakhir", "9 bulan terakhir", "12 bulan terakhir", "Custom". Default 12 bulan terakhir.
- N bulan terakhir = tepat N bulan termasuk bulan berjalan. Seluruh Waktu = dari bulan data tertua sampai bulan berjalan (atau bulan data terbaru bila di masa depan). Custom menampilkan dua input bulan (dari, sampai); kosong = bulan data tertua / bulan berjalan.
- Bulan tanpa data tampil sebagai nol (grafik bulanan tidak pernah menampilkan "Tidak ada data" selama ada bulan).

### A4. Ikon info (i)
Setiap kartu/visual punya ikon (i): hover membuka, klik mengunci, Esc atau klik di luar menutup. Isi: "apa" (apa yang ditampilkan) dan "baca" (cara membaca, daftar poin). Teks lengkap per visual ada di bagian halaman masing-masing.

### A5. Tab Table: bilah alat dan tabel
- Kotak cari (placeholder per halaman), tombol **Filter** (popover), lalu di kanan tombol **Export Excel** dan **Tambah** (urutan: Export, Tambah; **Import Excel** tersembunyi).
- Pencarian: substring, tidak peka huruf besar/kecil, teks dipangkas (trim), mengenai gabungan field per halaman (lihat bagian halaman). Pencarian langsung berjalan saat mengetik.
- Filter (popover lebar 380px): satu kontrol per filter. Tipe `select` = dropdown "Pilih {label}"; tipe `daterange` = dua input tanggal dengan tanda "-". Tombol **Clear All** (mengosongkan draf dan menerapkan kosong) dan **Apply Filters** (menerapkan lalu menutup). Semua filter yang terisi digabung dengan AND. Tidak ada fitur simpan filter (dihapus sejak v2.9.0; `docs/keputusan-desain.md` poin 2). Tutup dengan Esc atau klik di luar.
- Urutan baris tetap: Tanggal Dibuat terbaru dulu (lalu `no` turun). Tidak ada sort per kolom (panduan: "Tabel tidak bisa diurutkan per kolom"). `docs/keputusan-desain.md` poin 10 menyebut "Sort per kolom"; itu usang, kode tidak punya.
- Kolom pertama selalu **Nomor** = posisi baris (1..n), berlanjut antar halaman, bukan ID data. Kolom `No` bawaan konfigurasi tidak ditampilkan. Dua kolom tetap di ujung: **Tanggal Dibuat** (format tanggal + jam) dan **Aksi**.
- Pagination: dropdown "Baris per halaman" pilihan 10, 25, 50 (default 10). Teks "{a} sampai {b} dari {n} data". Tombol `<` dan `>`, tombol nomor halaman maksimal 7 sekaligus. Ubah cari/filter kembali ke halaman 1. Bila kosong: "Tidak ada data".
- Baris Dibatalkan tetap tampil di tabel dengan teks abu-abu. Dashboard, alert, dan notifikasi tidak menghitungnya.
- Tabel menampilkan "Lainnya" untuk nilai teks bebas dari field pilihan yang punya opsi Lainnya (hanya untuk kolom bertipe `get` tanpa `render`). Detail dan Export menampilkan teks aslinya.
- Tombol Aksi per baris (urutan): **Lihat Detail** (selalu); **Edit** (izin Ubah dan baris tidak dibatalkan dan tidak menunggu approval dan lolos aturan baris halaman); **Batalkan** (izin Cancel dan baris belum dibatalkan, teks merah); **Kembalikan** (izin Cancel dan baris sudah dibatalkan, teks hijau). Tidak ada aksi baris tambahan di keempat halaman (`rowActions` kosong).

### A6. Warna lencana status (`StatusPill`)
Aturan pewarnaan berdasarkan teks status (urutan pencocokan): hijau untuk Selesai, Aktif, Disetujui, Closed, Done, Tepat Waktu, Direkomendasikan, Terkirim, Diperpanjang, Valid, Comply, Berlaku; kuning untuk status berawalan Proses, Review, "Dalam ", Disusun, Partial, "Akan Berakhir", Menunggu, Belum Disiapkan, Diubah, Perlu; biru untuk Baru, Open, Draft, Active, Rencana, Eksisting; merah untuk teks yang memuat Terlambat, Expired, Kedaluwarsa, Gap, Melewati, Tidak Direkomendasikan, Ditolak, Lewat; selain itu abu-abu (mis. Berakhir, Dibatalkan, Batal, Tidak Berlaku). Status kosong tampil "-".

### A7. Form Tambah dan Edit (modal)
- Judul: "Tambah {noun}" dan "Ubah {noun} {nama data}". Noun: Kontrak = "Kontrak"; APH = "Permintaan"; Perizinan = "Dokumen"; Layanan = "Permintaan".
- Isian dua kolom (field lebar penuh untuk textarea, daftar, checklist, file, atau yang bertanda lebar). Label wajib diberi tanda `*`. Teks bantuan (help) abu-abu di bawah isian.
- Validasi saat klik **Simpan**: wajib isi memunculkan "{Label} wajib diisi"; tipe angka non-angka "{Label} harus berupa angka"; lalu aturan halaman. Modal tidak tertutup bila ada error.
- **Lainnya**: field `select` yang opsinya memuat "Lainnya" menampilkan kotak teks "Sebutkan lainnya" (maksimal 255 karakter) saat Lainnya dipilih; nilai tersimpan adalah teks itu. Teks kosong ditolak dengan "Wajib diisi jika memilih Lainnya". "Lainnya" tidak disimpan di Master Data (otomatis ditambah di dropdown). Saat Edit, nilai di luar opsi dipilih sebagai Lainnya dan teksnya terisi.
- Field `select` master yang tidak punya Lainnya tetap menampilkan nilai lama (mis. entri yang kemudian dihapus dari master) sebagai opsi tambahan.
- Edit: form diisi dari rekaman tersimpan (bukan nilai hasil hitung otomatis). Bila status tampilan otomatis berbeda dari tersimpan, di bawah Status muncul "Status saat ini (otomatis): {status}" (oranye).
- Edit: ada isian "Alasan perubahan" (textarea). Opsional kecuali bila field bertanda `reasonOnChange` yang sudah terisi diubah (hanya Layanan Hukum, lihat halaman itu); lalu tanda `*` dan error "Alasan wajib diisi jika {label, ...} diubah".
- Simpan Edit tanpa ada perubahan nilai = tidak ada efek dan tidak ada log.
- Tidak ada approval di keempat halaman (`approvals` tidak diisi). Edit dan Tambah langsung tersimpan.
- Field `auto` (hitung otomatis) tidak muncul di form.
- Nomor data internal otomatis (naik 1 dari nomor terbesar), tidak ada di form; ID `{modul}-{uid}`; createdAt/createdBy otomatis (nama akun).

### A8. Unggah file (`FileField`)
- Satu file. Format PDF, JPG, JPEG, PNG. Maksimal 25 MB. Teks petunjuk: "PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file."
- Tombol "Pilih file" (menjadi "Ganti file" bila sudah ada), seret-lepas didukung, tombol x "Hapus file".
- Pesan error persis: "Hanya boleh 1 file" (lebih dari satu), "File kosong" (0 byte), "Format file harus PDF, JPG, JPEG, atau PNG" (ekstensi salah atau MIME tidak cocok), "Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG" (MIME kosong), "Ukuran file maksimal 25 MB".
- Mockup hanya menyimpan metadata (nama, ukuran, tipe). Tidak ada penyimpanan isi file, pratinjau, atau unduhan.

### A9. Detail (modal berjudul "Detail")
- Urutan: lencana alert aktif (bila ada), kotak "Dibatalkan oleh {nama}, {tanggal}. Alasan: {alasan}. Status sebelumnya: {status}." (bila dibatalkan), grid dua kolom "Tanggal Dibuat" lalu semua field (kecuali `no` dan yang `showIf`-nya salah), lalu **Log Perubahan**. Tombol **Tutup**.
- Detail memuat semua field bertipe apa pun, termasuk yang tidak ada di form (`auto`, `inForm: none`), dan field edit-saja. Nilai kosong tampil "-".
- Tipe tampilan: tanggal dd/mm/yyyy; uang "Rp 25.000.000"; checklist "✓ label" atau "✗ label" per butir; file "{nama} ({ukuran})" dengan ikon (bukan tautan); daftar (list) sebagai tabel mini.
- Lencana alert: satu lencana per alert yang sedang aktif, teks "{label alert}: {detail}", warna kuning atau merah, tooltip "{label} ({detail}). Penerima notifikasi: {daftar}". Tidak tampil untuk data dibatalkan.
- Log Perubahan (terbaru di atas) memuat entri: "Data dibuat" (biru, dari createdAt/createdBy), "Perubahan data" (abu-abu; tabel Kolom / Sebelum / Sesudah dan "Alasan: ..." bila diisi), "Dibatalkan" (merah; alasan), "Dikembalikan" (hijau; alasan). Tidak ada entri approval di keempat halaman.
- Detail bisa dibuka lewat klik baris MiniTable di dashboard, klik acara kalender (APH), atau tautan notifikasi (`#/{rute}?open={id}`).

### A10. Batalkan dan Kembalikan
- Modal alasan: judul "Batalkan {noun} {nama data}" atau "Kembalikan {noun} {nama data}", textarea berlabel "Alasan *", tombol **Batal** dan **Konfirmasi**. Alasan kosong: "Alasan wajib diisi." (modal tetap terbuka).
- Batalkan: status menjadi status batal halaman (Kontrak/APH/Layanan = "Dibatalkan"; Perizinan = "Tidak Berlaku"), menyimpan `cancelled {status sebelumnya, alasan, oleh, waktu}`. Data tidak dihapus permanen.
- Kembalikan: status kembali ke status sebelum dibatalkan (`cancelled.prev`), `cancelled` dihapus. Alasan wajib.
- Tidak ada approval. Tombol Batalkan/Kembalikan tidak melihat aturan "milik sendiri" (hanya izin Cancel).
- Tercatat di menu Log (aksi "Cancel" dan "Kembalikan", keterangan "{status lama} -> {status baru}. Alasan: ...") dan di Log Perubahan Detail.

### A11. Export Excel
- Mengekspor `shown` = baris yang tampil di tabel menurut cari + filter saat itu (semua halaman, bukan hanya halaman aktif; termasuk baris Dibatalkan bila tampil).
- File `{Prefix}_{YYYY-MM-DD}.xlsx`, satu sheet bernama judul halaman. Prefix: `Kontrak`, `Permintaan_APH`, `Perizinan_Legalitas`, `Permintaan_Layanan_Hukum`.
- Kolom: "Nomor" (posisi baris dalam urutan Tanggal Dibuat terbaru dulu, bukan nomor internal), "Tanggal Dibuat" (tanggal + jam + detik), lalu semua field halaman (urutan definisi field) kecuali `noExport` dan yang `showIf` tidak terpenuhi untuk baris itu (kolom hanya ada bila ada baris yang memilikinya). Field `auto` ikut (nilai hitung). Angka/uang tetap angka (bukan teks). Teks bebas Lainnya diekspor dengan teks aslinya. Checklist diekspor sebagai daftar label yang dicentang dipisah koma; file = nama file; daftar = "kolom1 | kolom2; ...".
- Field sensor (`reveal`) selalu diekspor tersamar untuk semua peran (hanya APH).
- Hanya akun dengan izin Export melihat tombol. Setiap export dicatat di menu Log: modul = judul halaman, aksi "Export", keterangan "{n} baris".

### A12. Pusat notifikasi (lonceng di header)
- Notifikasi dihitung langsung dari data + aturan alert tiap halaman (tidak disimpan). Hanya data yang tidak dibatalkan. Hanya untuk modul yang dilihat akun (izin Lihat dari matriks peran). Tidak ada email/Telegram.
- Penerima: token `to` pada alert dicocokkan dengan akun. Token nama peran = semua akun berperan itu. Token `PIC (Nama)` = akun berperan apa pun yang namanya sama dengan Nama (tidak peka huruf besar). Token `PIC` tanpa nama = semua akun berperan PIC. Token yang tidak punya akun demo (mis. "Direksi") hanya terlihat oleh Super Admin. **Super Admin melihat semua notifikasi.**
- Satu notifikasi per (modul, data, alert); id `{modul}:{idData}:{kunciAlert}`. Muncul selama kondisi alert benar; hilang otomatis saat kondisi tidak lagi benar atau data dibatalkan. Tidak ada pengulangan terjadwal (tidak ada tahap per hari; lihat catatan Kontrak). Status "sudah dibaca" disimpan per akun di localStorage `clrm.notif.v1` dan dibuang bila notifikasi tidak aktif lagi (jadi bila kondisi muncul lagi, kembali belum dibaca). Waktu pertama muncul dicatat.
- Urutan daftar: waktu pertama muncul terbaru dulu, lalu merah sebelum kuning, lalu abjad referensi. Ikon: merah = lingkaran peringatan, kuning = segitiga. Garis kiri berwarna. Titik biru = belum dibaca. Badge angka di lonceng ("99+" bila lebih dari 99). Tombol "Tandai semua dibaca". Klik notifikasi menandai dibaca dan membuka halaman dan Detail data.
- Baris bawah tiap notifikasi: "{nama halaman} · {referensi} · {waktu}".

### A13. Izin per peran: matriks bawaan vs yang berlaku di UI (PENTING)
Sejak v2.14 setiap akun punya daftar izin sendiri (`Account.permissions`, diatur Super Admin di Admin > Manage Permissions). Izin tersimpan per KATEGORI, bukan per halaman: kategori **Legal** (`legal.*`) mencakup keempat halaman sekaligus, dengan aksi `view`, `create`, `update`, `export`, `dashboard` (tidak ada `approve` untuk Legal). Pemetaan: `update` = Ubah + Batalkan/Kembalikan (Cancel); `create` = Tambah; `dashboard` = tab Dashboard. Import tidak ada (`src/kit/perms.ts:46-61`).

Izin awal akun diturunkan dari matriks peran bawaan (`permsOf`): kategori memberi aksi bila SALAH SATU halaman kategori memberinya. Karena UI membaca izin akun (bukan matriks peran), perilaku efektif di keempat halaman Legal seragam per peran:

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Tab Dashboard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | - | Ya | Ya |
| Head CLRM | Ya | Tidak | **Ya** | Ya | - | Ya | Ya |
| Compliance Officer | Ya | Tidak | Tidak | Tidak | - | Ya | Ya |
| Risk Officer | Ya | Tidak | Tidak | Tidak | - | Ya | Ya |
| Legal Officer | Ya | Ya | Ya | **Ya** | - | Ya | Ya |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | - | Ya | Ya |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | - | Ya | Ya |
| PIC | Ya | **Ya** (semua 4 halaman) | Ya (dibatasi aturan baris per halaman) | **Ya** | - | Ya | Ya |
| Viewer | Ya | Tidak | Tidak | Tidak | - | Ya | Ya |

Yang dicetak tebal berbeda dari matriks peran bawaan di panduan (lihat tiap halaman, bagian Peran). Akibatnya: Head CLRM bisa Edit (bukan hanya Batalkan); Legal Officer dan PIC bisa Batalkan/Kembalikan; PIC bisa Tambah di Kontrak, APH, dan Perizinan (bawaan hanya Layanan Hukum). Super Admin bisa menyesuaikan per akun, jadi perilaku nyata adalah milik Manage Permissions. Aturan "milik sendiri" per baris (`canEditRow`) tetap berlaku untuk Edit setelah izin Ubah terpenuhi, tetapi tidak berlaku untuk Batalkan/Kembalikan. Notifikasi memakai matriks peran bawaan (bukan izin akun) hanya untuk memeriksa izin Lihat modul.

Demo akun: Super Admin; Dewi Anggraini (Head CLRM); Rina Kartika (Compliance Officer); Rudi Hartono (Risk Officer); Lina Marlina (Legal Officer); Fakhri (Fraud Investigator); Yusuf Hakim (Ketua SMKI); Regie (PIC, departemen Business); Tono Santoso (Viewer). Pilihan akun demo memuat admin berstatus Active.

### A14. Master Data yang dipakai keempat halaman
| Master (menu) | Dipakai di | Isi awal |
| --- | --- | --- |
| Jenis PKS Kontrak | Kontrak: Jenis Dokumen | PKS QRIS; Biller Gateway; Account Linkage; Payout; Program Peningkatan Transaksi; NDA; Amandemen |
| Mitra Vendor | Kontrak: Nama Mitra | 16 nama (PT Telkom Biller; Bank Mitra Utama; CV Digital Kreasi; PT Logistik Cepat; PT Nusa Cloud; PT Data Prima; PT Aman Jaya Logistik; PT Mitra Bayar; PT Sentra Verifikasi; PT Cipta Layanan; PT Biller Nusantara; PT Arta Teknologi; PT Kirim Cepat; PT Sigma Analitik; PT Jaringan Nusa; PT Data Aman) |
| Instansi Pengirim APH | APH: Pengirim dan Kategori | Bareskrim; Polda; Polres; PPATK; Kejaksaan |
| Kategori Dokumen Perizinan | Perizinan: Kategori Dokumen | Akta + SK; Izin; Legalitas Lainnya |
| PIC | Kontrak, APH, Perizinan, Layanan: PIC | Regie; Fakhri; Osama |
| Unit Kerja | Kontrak: Unit Pemilik; Layanan: Unit Kerja Pemohon dan grafik per unit kerja | Internal Audit; Business; Operation; Information Technology; Compliance Legal & Risk Management; Support; Finance, Accounting, Tax & Treasury |

Aturan Master Data (`src/shared/MasterData.tsx`): nama wajib, 2 sampai 255 karakter, hanya huruf, angka, spasi, dan karakter ` ' - &, unik tanpa beda huruf besar, "Lainnya" ditolak ("Lainnya tidak dipakai sebagai nama master"). Pesan: "Nama wajib diisi", "Minimal 2 karakter", "Maksimal 255 karakter", "Nama sudah ada". Data lama yang memakai nilai master yang kemudian diubah/dihapus tidak diubah otomatis.
Daftar yang TIDAK dari master (daftar tetap di kode): Kontrak: Jenis Hubungan, Perpanjangan, Status, Bidang Usaha. APH: Perihal (Jenis), Kasus, Unit Penyidik, Status. Perizinan: Status. Layanan: Jenis, Prioritas, Status.

---

## 1. Kontrak (menu: Legal > Kontrak)

- **Tujuan**: mencatat PKS, NDA, dan amandemen dengan merchant dan mitra, memantau masa berlaku dan kelengkapan dokumen, dan mengingatkan sebelum kontrak berakhir.
- **Prasyarat akses**: izin Lihat kategori Legal. Tab Dashboard butuh izin Dashboard Legal. Peran pada bagian A13 dan Peran di bawah.
- Modul `kontrak`, file `src/pages/Kontrak.tsx`; judul menu "Kontrak"; noun "Kontrak"; nama data `{Mitra atau Merchant} - {Nomor PKS / NDA}`; tanggal Periode dashboard = Tanggal Mulai.

### Tab Dashboard
Filter global: **Periode Tanggal Mulai** (bagian A2). Semua visual kecuali garis bulanan memakai data dalam periode tanpa data Dibatalkan.

**Aturan kelompok masa berlaku** (dasar enam kartu, `Kontrak.tsx:31-37`): S = Tanggal Berakhir dikurangi hari ini (hari).
- Tanpa Tanggal Berakhir: kelompok "Kosong" kecuali status Berakhir atau Dibatalkan (tidak masuk kelompok mana pun).
- Dengan Tanggal Berakhir: status Kedaluwarsa = "Kedaluwarsa". Status bukan Aktif/Akan Berakhir (Draft, Review, Diperpanjang, Berakhir) = tidak masuk kelompok. Aktif/Akan Berakhir: S ≤ 30 = "≤30 hari"; 31 sampai 60 = "30–60 hari"; 61 sampai 90 = "60–90 hari"; S > 90 = ">90 hari". Status sudah dinormalisasi otomatis (lihat Status): S < 0 jadi Kedaluwarsa.

#### Kartu "Masa berlaku kontrak" (6 kartu angka dalam satu grup, judul grup "Masa berlaku kontrak")
Bentuk: enam kartu angka dengan garis kiri berwarna; tiap kartu bisa diklik (drill ke Table dengan filter "Kelompok masa berlaku").
| Label kartu persis | Isi | Warna | Filter drill |
| --- | --- | --- | --- |
| Kontrak Aktif > 90 hari | kontrak Aktif/Akan Berakhir dengan S > 90 | hijau | ">90 hari" |
| Kontrak Berakhir 60–90 hari | S 61 sampai 90 | kuning | "60–90 hari" |
| Kontrak Berakhir 30–60 hari | S 31 sampai 60 | kuning | "30–60 hari" |
| Kontrak Berakhir < 30 hari | S 0 sampai 30 (label memakai "<" tetapi rentang sebenarnya ≤30) | merah | "≤30 hari" |
| Kontrak Kedaluwarsa | status Kedaluwarsa (setelah normalisasi) dengan Tanggal Berakhir | merah | "Kedaluwarsa" |
| Kontrak Tanggal Berakhir Kosong | tanpa Tanggal Berakhir, kecuali status Berakhir/Dibatalkan | kuning | "Kosong" |
Teks (i) "apa": "Enam kartu yang mengelompokkan kontrak menurut sisa hari sampai Tanggal Berakhir. Hanya kontrak berstatus Aktif atau Akan Berakhir yang masuk kelompok hari. Data Dibatalkan tidak dihitung." Poin "baca": rumus tiap kartu seperti tabel di atas; "Kontrak berstatus Draft, Review, Diperpanjang, atau Berakhir yang punya Tanggal Berakhir tidak masuk kartu mana pun."; "Klik kartu untuk membuka tab Table dengan filter Kelompok masa berlaku yang sama." Kartu bernilai nol tetap tampil (warna tetap, tidak jadi abu-abu).

#### Batang "Kontrak per jenis dokumen"
Bentuk: batang mendatar (horizontal), satu seri "Jumlah". Sumbu vertikal: Jenis Dokumen; horizontal: jumlah. Kategori = isi Master Jenis PKS Kontrak + "Lainnya" (7 + 1 baris); kategori nol tetap tercantum tetapi tanpa batang; bila semua nol: "Tidak ada data". Isian teks bebas di luar master dihitung di batang Lainnya, sehingga jumlah semua batang = jumlah kontrak (tanpa Dibatalkan, dalam Periode). Semua status ikut dihitung. Warna batang: biru tua bawaan palet. Klik batang = drill filter "Jenis Dokumen" = nama batang. Tooltip default menampilkan jumlah. Teks (i) apa: "Jumlah kontrak menurut Jenis Dokumen, semua status kecuali Dibatalkan, dalam Periode Tanggal Mulai yang dipilih."

#### Garis "Kontrak baru per bulan"
Bentuk: garis satu seri "Kontrak baru", sumbu horizontal bulan (YYYY-MM), vertikal jumlah (bilangan bulat). Isi: jumlah kontrak menurut bulan Tanggal Mulai, semua status kecuali Dibatalkan, dihitung dari `allRows`, jadi TIDAK mengikuti Periode halaman. Filter sendiri: dropdown Periode bulan (bagian A3), default 12 bulan terakhir. Tidak bisa diklik. Tooltip default (bulan dan jumlah). Teks (i): lihat bagian A3 plus "Bulan tanpa kontrak tampil sebagai nol."

#### Tabel mini "Kontrak berakhir dalam 90 hari (terdekat dulu)"
Bentuk: tabel mini 5 baris per halaman (pager tanpa pilihan jumlah baris). Kolom: No (posisi, lanjut antar halaman), Mitra / Merchant, Nomor PKS / NDA, Jenis Dokumen, Berakhir (dd/mm/yyyy), Sisa hari, PIC / Unit (PIC, atau Unit Pemilik bila PIC kosong). Isi: kontrak berstatus Aktif/Akan Berakhir (setelah normalisasi) dengan Tanggal Berakhir dan S dari 0 sampai 90, dalam Periode, urut Tanggal Berakhir terdekat paling atas. Klik baris = buka Detail. Kosong: "Tidak ada data". Tidak ada pewarnaan sel.

### Tab Table
- **Kolom (urutan persis)**: Nomor, Jenis Hubungan, Mitra / Merchant, Nomor PKS / NDA, Jenis Dokumen, Mulai (dd/mm/yyyy), Berakhir (dd/mm/yyyy atau "-"), Sisa hari (angka, negatif bila lewat, "-" bila tanpa Tanggal Berakhir; tanpa warna), Status (lencana warna A6), Tanggal Dibuat, Aksi.
- **Pencarian** (placeholder "Cari mitra, nomor, jenis dokumen"): `{Mitra/Merchant} {Nomor PKS / NDA} {Jenis Dokumen}`.
- **Filter** (urutan di popover): Periode (Tanggal Mulai) [rentang tanggal]; Jenis Hubungan [HUBUNGAN]; Jenis Dokumen [master + Lainnya]; Status [Draft, Review, Aktif, Akan Berakhir, Kedaluwarsa, Diperpanjang, Berakhir, **Dibatalkan**]; PIC / Unit [nilai PIC atau Unit Pemilik yang ada di data, urut abjad]; Bidang Usaha [F&B, Retail, Jasa, Pendidikan, Lainnya]; Kelompok masa berlaku [≤30 hari, 30–60 hari, 60–90 hari, >90 hari, Kedaluwarsa, Kosong]. Filter Jenis Hubungan/Jenis Dokumen/Bidang Usaha mengelompokkan teks bebas ke "Lainnya". Gabungan AND. Tanpa simpan filter.
- **Tombol**: Export Excel (izin Export), Tambah (izin Tambah). Aksi baris sesuai A5.
- **Export**: file `Kontrak_{YYYY-MM-DD}.xlsx`, sheet "Kontrak"; kolom: Nomor, Tanggal Dibuat, Jenis Hubungan, Nama Mitra (hanya baris non-Merchant), Nama Merchant (hanya baris Merchant), Nomor PKS / NDA, Jenis Dokumen, Tanggal Mulai, Tanggal Berakhir, Perpanjangan, Lama Perpanjangan (bulan) (hanya baris Otomatis/Manual), Status, Bidang Usaha, PIC, Unit Pemilik (Unit Kerja), Dokumen Induk, Kelengkapan (mis. "Hardcopy diterima, Tanda tangan lengkap"), File Perjanjian (nama file), Sisa Hari (angka). Data mengikuti cari + filter. Status yang diekspor adalah status tampilan (setelah normalisasi). Tercatat di Log. Tidak ada masking.
- **Badge/warna baris**: baris Dibatalkan teks abu-abu; lencana status sesuai A6 (Aktif hijau, Akan Berakhir kuning, Kedaluwarsa merah, Draft biru, Review kuning, Diperpanjang hijau, Berakhir abu-abu, Dibatalkan abu-abu).

### Form Tambah
Judul "Tambah Kontrak". Status awal "Draft". Urutan isian persis seperti tabel.

| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
| --- | --- | --- | --- | --- | --- | --- |
| Jenis Hubungan | dropdown + Lainnya (teks bebas) | Merchant; Partner-Vendor; Paybuddy; NDA; Lainnya (daftar tetap kode) | Wajib | - | Selalu | "Jenis Hubungan wajib diisi"; Lainnya kosong: "Wajib diisi jika memilih Lainnya". Mengganti nilai mengosongkan isian nama yang tidak lagi cocok (Merchant: Nama Mitra dikosongkan; selain Merchant: Nama Merchant dikosongkan) |
| Nama Mitra | dropdown | Master Mitra Vendor (tanpa Lainnya) | Wajib bila tampil | - | Hanya bila Jenis Hubungan terisi DAN bukan "Merchant" (termasuk NDA, Paybuddy, Partner-Vendor, dan teks bebas Lainnya) | "Nama Mitra wajib diisi" |
| Nama Merchant | teks | teks bebas (tidak harus ada di master) | Wajib bila tampil | - | Hanya bila Jenis Hubungan = "Merchant" | "Nama Merchant wajib diisi" |
| Nomor PKS / NDA | teks | bebas | Wajib | - (help: "Harus unik.") | Selalu | "Nomor PKS / NDA wajib diisi"; "Nomor PKS / NDA sudah dipakai" (unik tanpa peka huruf besar, spasi pinggir diabaikan, kontrak dibatalkan diabaikan, kontrak itu sendiri dikecualikan saat edit) |
| Jenis Dokumen | dropdown + Lainnya | Master Jenis PKS Kontrak + Lainnya | Wajib | - | Selalu | "Jenis Dokumen wajib diisi" |
| Tanggal Mulai | tanggal | - | Wajib | - | Selalu | "Tanggal Mulai wajib diisi" |
| Tanggal Berakhir | tanggal | - | Opsional (help: "Boleh kosong (masuk kartu \"Kontrak Tanggal Berakhir Kosong\").") | - | Selalu | "Tanggal Berakhir tidak boleh sebelum Tanggal Mulai" |
| Perpanjangan | dropdown | Otomatis; Manual; Sampai Diputus; Tidak Diperpanjang | Wajib | - | Selalu | "Perpanjangan wajib diisi" |
| Lama Perpanjangan (bulan) | angka | bilangan | Wajib bila tampil | - | Hanya bila Perpanjangan = Otomatis atau Manual | "Lama Perpanjangan (bulan) wajib diisi"; "Lama Perpanjangan (bulan) harus berupa angka"; "Minimal 1 bulan" |
| Status | dropdown | Draft; Review; Aktif; Akan Berakhir; Kedaluwarsa; Diperpanjang; Berakhir | Wajib | Default Draft. Help: "Aktif otomatis menjadi Akan Berakhir (≤90 hari) atau Kedaluwarsa menurut Tanggal Berakhir." | Selalu | "Status wajib diisi". "Dibatalkan" tidak ada di pilihan (hanya lewat Batalkan) |
| Bidang Usaha | dropdown + Lainnya | F&B; Retail; Jasa; Pendidikan; Lainnya (tetap kode, bukan master) | Opsional | - | Selalu | - |
| PIC | dropdown | Master PIC | Wajib bila Unit Pemilik kosong (help: "Isi PIC atau Unit Pemilik, salah satu wajib.") | - | Selalu | "PIC wajib diisi" (muncul bila PIC dan Unit Pemilik sama-sama kosong) |
| Unit Pemilik (Unit Kerja) | dropdown | Master Unit Kerja | Wajib bila PIC kosong | - | Selalu | "Unit Pemilik (Unit Kerja) wajib diisi" (bila keduanya kosong) |
| Dokumen Induk | teks | teks bebas (mis. nomor PKS induk) | Wajib bila Jenis Dokumen = "Amandemen" (persis); selain itu opsional | - (help: "Teks bebas (mis. nomor PKS induk). Wajib untuk Amandemen.") | Selalu tampil | "Dokumen Induk wajib diisi"; "Dokumen Induk tidak boleh dirinya sendiri" (sama dengan Nomor PKS / NDA kontrak itu) |
| Kelengkapan | checklist 2 kotak centang | "Hardcopy diterima"; "Tanda tangan lengkap" (default tidak dicentang) | Opsional | - | Selalu | - |
| File Perjanjian | upload | PDF/JPG/JPEG/PNG, 25 MB, 1 file | Opsional | - | Selalu | Pesan A8 |
| Sisa Hari | angka (hitung) | - | - | Hitung otomatis = Tanggal Berakhir - hari ini; kosong bila tanpa Tanggal Berakhir; tidak muncul di form | Hanya di Detail dan Export | - |

- Status yang tidak bisa dipilih saat tambah: tidak ada pembatasan selain "Dibatalkan" (tidak ada di daftar). Semua tujuh status bisa dipilih saat Tambah.
- Aturan upload: A8 (opsional di semua status).

### Edit
- **Siapa boleh**: peran dengan izin Ubah (A13: Super Admin, Head CLRM, Legal Officer, PIC). Panduan (matriks bawaan): Legal Officer dan PIC. Untuk peran **PIC** ada aturan baris "milik sendiri": hanya bila nama PIC kontrak sama dengan nama akun (tidak peka huruf besar) ATAU Unit Pemilik kontrak terisi dan sama dengan departemen akun. Peran selain PIC tidak dibatasi.
- **Kolom terkunci untuk PIC**: semua kecuali **Tanggal Berakhir, Perpanjangan, Lama Perpanjangan (bulan), Status**. Kolom terkunci tampil nonaktif; File Perjanjian terkunci tampil "{nama file atau -} (tidak dapat diubah)"; nilai terkunci tidak pernah ditulis ulang saat simpan. Validasi wajib-isi diabaikan untuk kolom terkunci.
- **Alasan perubahan**: opsional (tidak ada kolom `reasonOnChange`). Dicatat di Log Perubahan bila diisi.
- **Approval**: tidak ada. Ubah status langsung tersimpan.
- Tombol Edit tidak ada pada kontrak Dibatalkan.

### Lihat Detail
- Isi (urutan): Tanggal Dibuat; Jenis Hubungan; Nama Mitra (bila bukan Merchant) atau Nama Merchant (bila Merchant); Nomor PKS / NDA; Jenis Dokumen; Tanggal Mulai; Tanggal Berakhir; Perpanjangan; Lama Perpanjangan (bulan) (hanya bila Otomatis/Manual); Status (status tampilan hasil normalisasi); Bidang Usaha; PIC; Unit Pemilik (Unit Kerja); Dokumen Induk; Kelengkapan ("✓/✗ Hardcopy diterima", "✓/✗ Tanda tangan lengkap"); File Perjanjian ({nama} ({ukuran}), tidak bisa dibuka); Sisa Hari.
- Lencana alert aktif di atas. Riwayat: Log Perubahan (A9). Tidak ada sensor di halaman ini.

### Status dan transisi
- **Daftar status**: Draft, Review, Aktif, Akan Berakhir, Kedaluwarsa, Diperpanjang, Berakhir (dipilih di form) dan Dibatalkan (hanya lewat Batalkan). Tidak ada aturan transisi: semua status bisa dipilih bebas oleh peran yang boleh Edit.
- **Status otomatis (normalisasi saat tampil, tidak menulis ke data tersimpan)**: hanya berlaku bila status tersimpan "Aktif" atau "Akan Berakhir" DAN Tanggal Berakhir terisi. S = Tanggal Berakhir - hari ini. S < 0 maka "Kedaluwarsa"; 0 ≤ S ≤ 90 maka "Akan Berakhir"; S > 90 maka "Aktif". Status lain (Draft, Review, Diperpanjang, Berakhir, Kedaluwarsa, Dibatalkan) tidak diubah otomatis. Kontrak Aktif/Akan Berakhir tanpa Tanggal Berakhir tidak berubah.
- Catatan perilaku: status yang tersimpan "Kedaluwarsa" (bukan Aktif/Akan Berakhir) tidak kembali otomatis ke Akan Berakhir/Aktif bila Tanggal Berakhir diperpanjang; pengguna harus mengubah Status manual (mis. ke Diperpanjang atau Aktif). Selama status Kedaluwarsa, alert "Kontrak kedaluwarsa belum diperpanjang" tetap aktif.
- **Batalkan**: A10. Siapa: peran dengan izin Cancel (A13). Status menjadi "Dibatalkan"; keluar dari dashboard, alert, notifikasi, dan pengecekan unik Nomor PKS / NDA. **Kembalikan**: status kembali ke status sebelum dibatalkan.

### Approval
Tidak ada. Panduan: "Halaman ini tidak memakai approval. Perubahan langsung tersimpan." Aksi Approve tidak dipakai.

### Notifikasi / alert
Aturan hari: S = Tanggal Berakhir - hari ini. "Berjalan" = status tampilan Aktif atau Akan Berakhir. Hanya data tidak dibatalkan.
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul notifikasi | Pesan notifikasi | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Kontrak akan berakhir | berjalan dan Tanggal Berakhir terisi dan 0 ≤ S ≤ 90 | Kuning bila S > 30; merah bila S ≤ 30 | Legal Officer, dan `PIC (nama PIC)` bila PIC terisi; bila PIC kosong (hanya Unit Pemilik) penerimanya token `PIC` = semua akun berperan PIC | "Kontrak akan berakhir" | "Kontrak {nomor} dengan {mitra/merchant} berakhir pada {dd/mm/yyyy} ({N hari lagi / hari ini / besok}). Siapkan perpanjangan atau penggantian." | status berubah dari berjalan, S < 0, S > 90, atau dibatalkan |
| Kontrak kedaluwarsa belum diperpanjang | status = Kedaluwarsa ATAU (berjalan dan S < 0) | Merah | Legal Officer, Head CLRM | "Kontrak kedaluwarsa belum diperpanjang" | "Kontrak {nomor} dengan {mitra} sudah kedaluwarsa {N hari lalu}. Segera perpanjang atau tutup kontrak." (tanpa N bila tanpa Tanggal Berakhir) | status diubah ke Diperpanjang/Berakhir/dll. di luar Kedaluwarsa dan berjalan, atau dibatalkan |
| Tanggal berakhir kontrak belum diisi | Tanggal Berakhir kosong dan status bukan Berakhir dan bukan Dibatalkan (status Draft, Review, Aktif, Akan Berakhir, Kedaluwarsa, Diperpanjang ikut) | Kuning | Legal Officer | "Tanggal berakhir kontrak belum diisi" | "Kontrak {nomor} dengan {mitra} belum memiliki Tanggal Berakhir. Lengkapi datanya." | Tanggal Berakhir diisi, status Berakhir, atau dibatalkan |
- Teks aturan di definisi alert menyebut "Pengingat H-90, H-60, H-30, H-7 sebelum Tanggal Berakhir". Di kode tidak ada tahap H-90/H-60/H-30/H-7 terpisah: satu notifikasi aktif terus-menerus selama 0 ≤ S ≤ 90, hanya warna yang berubah di S = 30. Panduan juga menyebut "Pengingat berlaku pada tahap H-90, H-60, H-30, dan H-7". Ini selisih antara teks dan kode (kode menang).
- Alert tampil juga sebagai lencana di Detail.

### Peran
Matriks bawaan (panduan `guides/kontrak.ts`, `DEFAULT_PERMS`):
| Peran | Lihat | Tambah | Ubah | Batalkan | Approve | Export | Sensor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | tidak dipakai | Ya | - |
| Head CLRM | Ya | Tidak | Tidak | Ya | - | Ya | - |
| Compliance Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Risk Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Legal Officer | Ya | Ya | Ya | Tidak | - | Ya | - |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| PIC | Ya | Tidak | Milik sendiri (nama PIC = nama akun, atau Unit Pemilik = departemen akun), hanya Tanggal Berakhir, Perpanjangan, Lama Perpanjangan, Status | Tidak | - | Ya | - |
| Viewer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
Sejak v2.14 izin per akun (Admin > Manage Permissions) dapat mengubah default ini, dan perilaku efektif di UI mengikuti tabel A13 (Head CLRM bisa Ubah; Legal Officer dan PIC bisa Batalkan/Kembalikan; PIC bisa Tambah).

### Kondisi khusus dan prasyarat
- Nama Mitra (dropdown master) hanya muncul bila Jenis Hubungan terisi dan ≠ "Merchant"; Nama Merchant (teks) hanya bila = "Merchant".
- Lama Perpanjangan (bulan) hanya muncul dan wajib bila Perpanjangan = Otomatis atau Manual.
- Dokumen Induk wajib hanya bila Jenis Dokumen = "Amandemen" (tepat sama; teks bebas Lainnya tidak memicu).
- PIC atau Unit Pemilik: salah satu wajib. Notifikasi "Kontrak akan berakhir" untuk kontrak yang hanya punya Unit Pemilik dikirim ke semua akun berperan PIC.
- Status otomatis hanya untuk Aktif/Akan Berakhir yang punya Tanggal Berakhir.
- Alert "Kontrak akan berakhir" hanya untuk status berjalan; "kosong" tidak untuk Berakhir/Dibatalkan.
- Kontrak Draft, Review, Diperpanjang, Berakhir yang punya Tanggal Berakhir tidak masuk kartu masa berlaku mana pun, tetapi masuk batang jenis dokumen dan garis bulanan.
- Kontrak Draft, Review, Diperpanjang, Kedaluwarsa yang tanpa Tanggal Berakhir masuk kartu "Kontrak Tanggal Berakhir Kosong".
- PIC: tombol Edit hanya pada kontrak miliknya; kolom lain terkunci.
- Tombol Edit/Batalkan/Kembalikan/Tambah/Export sesuai izin akun (A13).
- Uniqueness Nomor PKS / NDA mengabaikan kontrak dibatalkan.
- "Lainnya" pada Jenis Hubungan, Jenis Dokumen, Bidang Usaha memunculkan teks wajib.

### Data contoh
35 kontrak. Status tersimpan: Aktif 17, Akan Berakhir 10, Kedaluwarsa 2, Review 2, Draft 1, Berakhir 1, Diperpanjang 2 (setelah normalisasi: Aktif 16, Akan Berakhir 10, Kedaluwarsa 3). Jenis Hubungan: Merchant 19, Partner-Vendor 9, Paybuddy 3, NDA 3, Lainnya 1. Jenis Dokumen: PKS QRIS 13, Biller Gateway 4, Payout 4, Account Linkage 3, Program Peningkatan Transaksi 2, NDA 3, Amandemen 4, Lainnya 2. 2 kontrak tanpa Tanggal Berakhir. 4 Amandemen dengan Dokumen Induk. Sebagian kontrak (setiap ke-5) hanya punya Unit Pemilik tanpa PIC. Setiap kontrak punya file PDF contoh.

### Sumber kode
`src/pages/Kontrak.tsx`: konstanta 17-27, grup/sisa 29-37, fields 43-61, columns 63-75, filters 77-86, alerts 88-109, seed 111-147, cfg (normalize 156-162, onChange 163, canEditRow 164, validate 165-172), Dashboard 175-224. `src/guides/kontrak.ts`. Kit: `src/kit/PageShell.tsx`, `FormModal.tsx`, `DetailModal.tsx`, `DataTable.tsx`, `FilterPopover.tsx`, `exportXlsx.ts`, `notify.tsx:115-120 (kontrak.*)`, `perms.ts`.

### Selisih dengan keputusan final
- Keputusan: "Mitra dari Master Data." Mockup: Mitra dari master hanya untuk Jenis Hubungan selain Merchant; untuk Merchant, Nama Merchant teks bebas. Mockup menambah field Jenis Hubungan (Merchant, Partner-Vendor, Paybuddy, NDA, Lainnya), yang tidak ada di keputusan.
- Keputusan: "Jenis dokumen dari Master Data jenis PKS." Mockup: sama, ditambah opsi Lainnya dengan teks bebas (tidak ada di keputusan).
- Keputusan: "Tanggal berakhir dan bidang usaha opsional." Mockup: sesuai. Bidang Usaha memakai daftar tetap (F&B, Retail, Jasa, Pendidikan, Lainnya), bukan Master Data.
- Keputusan: "Pilihan perpanjangan tetap seperti mockup." Sesuai (Otomatis, Manual, Sampai Diputus, Tidak Diperpanjang).
- Keputusan: "Checklist: Hardcopy diterima, Tanda tangan lengkap. File perjanjian diunggah." Sesuai; file opsional.
- Keputusan: "Ubah status tanpa approval." Sesuai.
- Keputusan: semua kolom unit kerja bernama **Departemen** dari Master Data Departemen. Mockup: field "Unit Pemilik (Unit Kerja)" dari menu Master "Unit Kerja". Tidak sesuai penamaan.
- Fitur mockup yang tidak ada di keputusan: field Jenis Hubungan; Lama Perpanjangan (bulan); aturan PIC atau Unit Pemilik salah satu wajib; Status otomatis (Aktif / Akan Berakhir / Kedaluwarsa) dan lima status daftar; kelompok masa berlaku dan enam kartu; Dokumen Induk wajib untuk Amandemen dan larangan merujuk diri sendiri; peran PIC terbatas (hanya 4 field); tiga alert (H-90 dan seterusnya, kedaluwarsa, tanggal kosong); opsi Lainnya.
- Selisih internal: panduan menyebut tahap H-90/H-60/H-30/H-7, kode tidak. Panduan peran bawaan tidak sama dengan izin efektif akun (A13).

---

## 2. Permintaan APH (menu: Legal > Permintaan APH)

- **Tujuan**: mencatat surat permintaan dari Aparat Penegak Hukum (data identitas, keterangan, pemblokiran), memantau batas waktu jawaban dan jadwal BAP.
- **Prasyarat akses**: izin Lihat Legal; tab Dashboard butuh izin Dashboard Legal. Data penyidik disensor untuk peran tertentu (lihat Detail dan Peran).
- Modul `aph`, file `src/pages/Aph.tsx`; noun "Permintaan"; nama data = Nomor Surat; Periode dashboard = Tanggal Terima Surat. Tidak ada field file/bukti.

### Tab Dashboard
Filter global: **Periode Tanggal Terima Surat**. Semua visual memakai `rows` dalam periode tanpa Dibatalkan, kecuali garis bulanan (`allRows` + filter bulan sendiri). "ACTIVE" = status Active.
Definisi: umur = hari ini - Tanggal Terima Surat; terlambat = status Active dan Batas Waktu Jawaban terisi dan sebelum hari ini; tanggal BAP efektif = Tanggal Jadwal Ulang BAP bila ada, selain itu Tanggal BAP.

#### Kartu "Status permintaan" (judul grup; 2 kartu angka)
| Label | Isi | Warna | Klik |
| --- | --- | --- | --- |
| Active | jumlah status Active | kuning bila > 0, abu-abu bila 0 | Table terfilter Status = Active |
| Done | jumlah status Done | hijau | Table terfilter Status = Done |
(i) apa: "Jumlah permintaan APH menurut status. Data Dibatalkan tidak dihitung."

#### Garis "Surat masuk per bulan"
Garis satu seri "Surat"; sumbu horizontal bulan (tahun-bulan) berdasarkan Tanggal Terima Surat; vertikal jumlah surat. Semua status kecuali Dibatalkan. Dari `allRows`, tidak mengikuti Periode halaman; filter bulan sendiri default 12 bulan terakhir (A3). Tooltip khusus: judul "{bulan}: {n} surat", sub "Per instansi pengirim", rincian jumlah per Pengirim (urut terbanyak). Tidak bisa diklik.

#### Batang "Instansi pengirim terbanyak"
Batang mendatar, seri "Jumlah". Kategori = isi Master Instansi Pengirim APH + Lainnya, diurut jumlah terbesar di atas; nol tetap tercantum. Isi: Active dan Done (tanpa Dibatalkan) dalam Periode. Teks bebas di luar master dihitung di Lainnya. Klik batang = Table terfilter Pengirim.

#### Donat "Permintaan per kasus"
Donat, irisan = Kasus (Judi Online, Pencucian Uang, Penipuan, Lainnya); irisan bernilai nol tidak tampil; legenda di bawah. Isi: Active dan Done (tanpa Dibatalkan) dalam Periode. Teks bebas di luar daftar dihitung di Lainnya. Warna palet bawaan berurutan. Tooltip: "{kasus}: {n} permintaan", sub "Per instansi pengirim", rincian per Pengirim. Klik irisan = Table terfilter Kasus.

#### Batang "Top 5 Group merchant paling banyak disebut"
Batang tegak, seri "Jumlah", sumbu horizontal Group Merchant (terbanyak di kiri), vertikal jumlah. Lima Group Merchant teratas menurut jumlah permintaan (Active dan Done, tanpa Dibatalkan, dalam Periode). Group sama dihitung berdasarkan teks persis. Bila seri imbang, urutan abjad nama group. Tidak ada visual "merchant" terpisah, hanya group. Klik batang = Table terfilter Group Merchant.

#### Kalender "Jadwal BAP 30 hari ke depan"
Kalender rentang tetap 30 hari mulai hari ini (header "{dd/mm/yyyy} - {dd/mm/yyyy}", tanpa tombol maju/mundur, tanpa pilihan tampilan, kolom Min..Sab). Isi: permintaan berstatus Active yang tanggal BAP efektifnya ≥ hari ini dan < hari ini + 30 hari. Titik berwarna dengan teks "BAP {Nama Merchant}": merah bila BAP ≤ 2 hari dari hari ini; kuning 3 sampai 7 hari; biru lebih dari 7 hari. Sel hari ini diberi warna biru muda. Maksimal 3 jadwal per sel; selebihnya "+N lagi". Klik jadwal = buka Detail. CATATAN: kalender memakai `rows` sehingga mengikuti Periode halaman (Tanggal Terima Surat); meski teks (i) tidak menyebut. (i) apa: "Kalender 30 hari mulai hari ini. Menampilkan jadwal BAP permintaan berstatus Active. Bila ada Tanggal Jadwal Ulang BAP, tanggal itu yang dipakai."

#### Kartu "Permintaan Active menurut umur sejak surat diterima (hari)"
Satu kartu berisi dua bagian: (1) batang tegak dengan rentang umur "0-7", "8-14", "15-30", ">30" (sumbu horizontal berlabel "Hari", vertikal jumlah permintaan Active); batang merah (#ef4444) bila di rentang itu ada permintaan terlambat, kuning/amber (#f59e0b) bila tidak; batang tidak bisa diklik. (2) tabel mini 5 baris per halaman dengan kolom No, Nomor Surat, Merchant, Umur (hari), Batas (dd/mm/yyyy; merah tebal bila terlambat); urut umur terbesar (tertua) dulu; klik baris = Detail. Isi: hanya status Active dalam Periode.

### Tab Table
- **Kolom (urutan)**: Nomor, Tgl Terima, Nomor Surat, Pengirim, Kasus, Merchant (format "{Nama Merchant} ({Group Merchant})"), Batas Jawaban, Status, PIC (atau "-"), Tanggal Dibuat, Aksi. Kolom Pengirim dan Kasus menampilkan "Lainnya" untuk teks bebas.
- **Pencarian** (placeholder "Cari nomor surat, merchant, group, perihal"): `{Nomor Surat} {Nama Merchant} {Group Merchant} {Perihal Jenis} {Perihal Uraian}`.
- **Filter**: Periode (Tanggal Terima) [rentang]; Status [Active, Done, Dibatalkan]; Pengirim [master + Lainnya]; Kasus [Judi Online, Pencucian Uang, Penipuan, Lainnya]; Unit Penyidik [Dittipidsiber, Ditreskrimsus, Lainnya]; Group Merchant [nilai yang ada di data]; PIC [nilai yang ada di data]. Teks bebas dikelompokkan ke Lainnya. Tanpa simpan filter.
- **Tombol**: Export Excel (izin Export), Tambah (izin Tambah).
- **Export**: `Permintaan_APH_{YYYY-MM-DD}.xlsx`, sheet "Permintaan APH"; kolom: Nomor, Tanggal Dibuat, Tanggal Terima Surat, Nomor Surat, Tanggal Surat, Pengirim dan Kategori, Perihal Permintaan (Jenis), Perihal Permintaan (Uraian), Kasus, Nama Merchant, Group Merchant, Unit Penyidik, Nama Penyidik, No. Telepon Penyidik, Tanggal BAP, Tanggal Jadwal Ulang BAP, Tempat BAP, Status, Nominal Hold Settlement (Rp) (angka), Dana Taktis (Rp) (angka), Batas Waktu Jawaban, PIC, Tanggal Jawaban Dikirim. **Nama Penyidik dan No. Telepon Penyidik selalu tersamar untuk semua peran** (aturan maskStr). Data mengikuti cari + filter. Tercatat di Log.
- **Badge/warna**: lencana status Active biru, Done hijau, Dibatalkan abu-abu; baris Dibatalkan teks abu-abu. Tidak ada kolom alert di tabel.

### Form Tambah
Judul "Tambah Permintaan". Status awal "Active".
| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
| --- | --- | --- | --- | --- | --- | --- |
| Tanggal Terima Surat | tanggal | - | Wajib | help: "Awal hitungan batas waktu jawaban." | Selalu | "Tanggal Terima Surat wajib diisi" |
| Nomor Surat | teks | bebas | Wajib | - | Selalu | "Nomor Surat wajib diisi" (tidak ada pengecekan unik) |
| Tanggal Surat | tanggal | - | Wajib | - | Selalu | "Tanggal Surat wajib diisi" |
| Pengirim dan Kategori | dropdown + Lainnya | Master Instansi Pengirim APH + Lainnya | Wajib | - | Selalu | "Pengirim dan Kategori wajib diisi" |
| Perihal Permintaan (Jenis) | dropdown + Lainnya | Permintaan Data Identitas; Permintaan Keterangan; Pemblokiran; Lainnya | Wajib | - | Selalu | "Perihal Permintaan (Jenis) wajib diisi" |
| Perihal Permintaan (Uraian) | teks | bebas | Wajib | - | Selalu | "Perihal Permintaan (Uraian) wajib diisi" |
| Kasus | dropdown + Lainnya | Judi Online; Pencucian Uang; Penipuan; Lainnya | Wajib | - | Selalu | "Kasus wajib diisi" |
| Nama Merchant | teks | bebas | Wajib | - | Selalu | "Nama Merchant wajib diisi" |
| Group Merchant | teks | bebas | Wajib | - | Selalu | "Group Merchant wajib diisi" |
| Unit Penyidik | dropdown + Lainnya | Dittipidsiber; Ditreskrimsus; Lainnya (tetap kode) | Wajib | - | Selalu | "Unit Penyidik wajib diisi" |
| Nama Penyidik | teks (sensitif) | bebas | Opsional | Disamarkan; lihat Edit | Selalu | - |
| No. Telepon Penyidik | teks (sensitif) | bebas | Opsional | Disamarkan; lihat Edit | Selalu | - |
| Tanggal BAP | tanggal | - | Opsional | - | Selalu | - |
| Tanggal Jadwal Ulang BAP | tanggal | - | Opsional (help: "Perubahan jadwal BAP tercatat di Log.") | - | Selalu | "Jadwal ulang tidak boleh sebelum tanggal BAP" (hanya bila Tanggal BAP dan Jadwal Ulang terisi) |
| Tempat BAP | teks | bebas | Opsional | - | Selalu | - |
| Status | dropdown | Active; Done | Wajib | Default Active | Selalu | "Status wajib diisi" |
| Nominal Hold Settlement (Rp) | uang (angka, prefiks "Rp") | - | Opsional | - | Selalu | "Nominal Hold Settlement (Rp) harus berupa angka" bila bukan angka |
| Dana Taktis (Rp) | uang | - | Opsional | terpisah dari hold settlement | Selalu | "Dana Taktis (Rp) harus berupa angka" |
| Batas Waktu Jawaban | tanggal | - | Opsional (help: "Boleh kosong; tanpa batas waktu tidak ada notifikasi keterlambatan.") | tidak dihitung otomatis dari Tanggal Terima | Selalu | "Batas waktu tidak boleh sebelum tanggal terima" |
| PIC | dropdown | Master PIC | Wajib | - | Selalu | "PIC wajib diisi" |
| Tanggal Jawaban Dikirim | tanggal | - | Wajib bila Status = Done, selain itu opsional | - | Selalu tampil | "Tanggal Jawaban Dikirim wajib diisi" (bila Done); "Tanggal jawaban tidak boleh sebelum tanggal terima" |
- Status yang tidak bisa dipilih saat tambah: tidak ada pembatasan; Done bisa dipilih saat tambah (lalu Tanggal Jawaban Dikirim wajib). "Dibatalkan" tidak ada di daftar.
- Mockup tidak punya upload file di halaman ini. Teks tanggal tidak punya batas atas/bawah selain aturan di atas.

### Edit
- **Siapa boleh**: peran dengan izin Ubah (A13). Aturan baris: peran PIC hanya bila nama PIC permintaan sama dengan nama akun (tidak peka huruf besar). Peran lain tanpa batas baris.
- **Kolom terkunci**: tidak ada kunci per field untuk semua peran, kecuali sensor: **Nama Penyidik** dan **No. Telepon Penyidik** terkunci (nonaktif, tampil tersamar, nilai asli dipertahankan saat simpan) untuk peran selain Super Admin, Head CLRM, Legal Officer. Untuk Super Admin, Head CLRM, Legal Officer: isian bawaan nonaktif dan tersamar; klik ikon mata di samping label membuka nilai asli agar bisa diedit; klik lagi menyamarkan lagi (status buka per sesi form, tidak tersimpan, tidak dicatat di Log).
- **Alasan perubahan**: opsional. Perubahan jadwal BAP dicatat di Log Perubahan sebagai perubahan kolom biasa (help field: "Perubahan jadwal BAP tercatat di Log.").
- **Approval**: tidak ada. Panduan: "Halaman ini tidak memakai approval dan tidak ada isian yang wajib alasan."

### Lihat Detail
- Isi (urutan): Tanggal Dibuat, lalu semua 21 field di atas sesuai urutan form (termasuk uang "Rp 25.000.000").
- **Sensor + tombol mata**: Nama Penyidik dan No. Telepon Penyidik. Peran selain Super Admin, Head CLRM, Legal Officer: selalu tersamar tanpa tombol mata. Super Admin, Head CLRM, Legal Officer: tersamar bawaan dengan ikon mata di label; klik membuka/menutup (per Detail, tidak dicatat di log). Aturan samar: tiap kata dipertahankan huruf pertamanya diikuti bintang sebanyak panjang kata dikurangi 1 (minimal 2 bintang); contoh "AKP Penyidik 1" menjadi "A** P******* 1**" (angka satu karakter pun jadi "1**"; lihat `maskStr`). Nilai kosong tampil "-".
- File: tidak ada. Riwayat: Log Perubahan (A9). Lencana alert aktif di atas.

### Status dan transisi
- **Daftar status**: Active, Done (form), Dibatalkan (hanya lewat Batalkan).
- Tidak ada transisi terbatas: Active dan Done dapat saling ubah lewat Edit. Done wajib punya Tanggal Jawaban Dikirim. Tidak ada status otomatis (tidak ada rumus).
- **Batalkan**: peran dengan izin Cancel; alasan wajib; status "Dibatalkan"; data keluar dari dashboard, alert, notifikasi. **Kembalikan**: status kembali ke Active atau Done sebelum batal; alasan wajib.

### Approval
Tidak ada.

### Notifikasi / alert
Semua alert hanya untuk status Active dan data tidak dibatalkan. Done tidak memicu apa pun.
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul | Pesan | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Jadwal BAP akan tiba | Active, ada tanggal BAP efektif (Jadwal Ulang bila ada), dan 0 ≤ (BAP - hari ini) ≤ 7 | Kuning bila 3 sampai 7 hari; merah bila ≤ 2 hari | Legal Officer, Head CLRM | "Jadwal BAP akan tiba" | "Permintaan {Nomor Surat}: BAP dijadwalkan {N hari lagi / hari ini / besok} ({dd/mm/yyyy}). Siapkan kehadiran dan dokumen." | BAP lewat (selisih < 0), BAP > 7 hari, status Done/Dibatalkan, tanggal BAP dikosongkan |
| Jawaban APH lewat batas waktu | Active, Batas Waktu Jawaban terisi dan sebelum hari ini | Merah | Legal Officer, Head CLRM | "Jawaban APH lewat batas waktu" | "Permintaan {Nomor Surat} belum dijawab dan melewati batas waktu jawaban {N hari}. Segera kirim jawaban." (detail: "Lewat N hari") | status Done/Dibatalkan, atau Batas Waktu diperpanjang/dikosongkan |
| Data permintaan APH belum lengkap | Active dan salah satu kosong: PIC, Nama Penyidik, No. Telepon Penyidik | Kuning | Legal Officer | "Data permintaan APH belum lengkap" | "Permintaan {Nomor Surat} belum lengkap: {daftar kolom, mis. Nama Penyidik dan No. Telepon} belum diisi. Lengkapi datanya." (detail "Kosong: PIC, Nama Penyidik, No. Telepon") | semua terisi, Done, atau dibatalkan |
- Alert hanya hitung lewat bila Batas Waktu < hari ini (hari yang sama belum lewat).

### Peran
Matriks bawaan (panduan):
| Peran | Lihat | Tambah | Ubah | Batalkan | Approve | Export | Buka sensor (mata) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | tidak dipakai | Ya | Ya |
| Head CLRM | Ya | Tidak | Tidak | Ya | - | Ya | Ya |
| Compliance Officer | Ya | Tidak | Tidak | Tidak | - | Ya | Tidak (selalu tersamar) |
| Risk Officer | Ya | Tidak | Tidak | Tidak | - | Ya | Tidak |
| Legal Officer | Ya | Ya | Ya | Tidak | - | Ya | Ya |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | - | Ya | Tidak |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | - | Ya | Tidak |
| PIC | Ya | Tidak | Milik sendiri (nama PIC = nama akun) | Tidak | - | Ya | Tidak |
| Viewer | Ya | Tidak | Tidak | Tidak | - | Ya | Tidak |
Izin efektif akun: lihat A13. Hak buka sensor ditentukan oleh NAMA PERAN (Super Admin, Head CLRM, Legal Officer), bukan oleh izin akun. Sejak v2.14 izin per akun dapat mengubah default Tambah/Ubah/Batalkan/Export/Dashboard, tidak mengubah hak sensor.

### Kondisi khusus dan prasyarat
- Tanggal Jawaban Dikirim wajib hanya bila Status = Done.
- Tanggal Jadwal Ulang BAP menggantikan Tanggal BAP untuk alert dan kalender.
- Ikon mata Nama Penyidik / No. Telepon Penyidik hanya untuk Super Admin, Head CLRM, Legal Officer (Detail, form Ubah); peran lain tersamar tetap dan tidak bisa mengubah nilainya.
- Export selalu menyamarkan kedua kolom untuk semua peran, termasuk yang boleh membuka ikon mata.
- Alert hanya untuk Active; alert BAP hanya bila ada tanggal BAP; alert terlambat hanya bila Batas Waktu terisi.
- Kalender BAP hanya Active, 0 sampai 29 hari ke depan, dan mengikuti Periode halaman.
- Chart "Instansi pengirim terbanyak" dan "Permintaan per kasus" tidak mengecualikan Done.
- PIC hanya mengedit permintaan miliknya (nama sama).
- Batas Waktu Jawaban tidak dihitung otomatis; kosong berarti tidak ada notifikasi keterlambatan.

### Data contoh
30 permintaan: Active 12, Done 18. Pengirim: Bareskrim 10, Polda 5, PPATK 5, Polres 5, Kejaksaan 5. Kasus: Judi Online 15, Pencucian Uang 5, Penipuan 5, Lainnya 5. Group Merchant: Gemilang Group 8, Surya Group 7, Nusa Group 7, Bintang Group 4, Cahaya Group 4. 7 permintaan Active punya jadwal BAP (satu punya Jadwal Ulang). Dua permintaan Active lewat batas waktu. Satu data tanpa nama penyidik dan telepon, satu tanpa telepon. Hold settlement dan Dana Taktis terisi di sebagian data.

### Sumber kode
`src/pages/Aph.tsx`: konstanta 20-33, fields 35-57, columns 58-68, filters 70-78, alerts 80-103, seed 105-132, cfg 134-148 (canEditRow 137, validate 142-148), Dashboard 150-213. `src/guides/aph.ts`. Kit: `FormModal.tsx` (mask/reveal 93-100), `DetailModal.tsx:55`, `exportXlsx.ts:23`, `fmt.tsx:6 maskStr`, `notify.tsx:121-126`.

### Selisih dengan keputusan final
- Keputusan: "Instansi pengirim dari Master Data (tingkat Polda dan Bareskrim)." Mockup: dari Master Instansi Pengirim APH, isi awal juga Polres, PPATK, Kejaksaan, plus opsi Lainnya.
- Keputusan: "Batas waktu jawaban opsional." Sesuai.
- Keputusan: "Chart merchant atau group terbanyak: top 5." Mockup: hanya "Top 5 Group merchant paling banyak disebut"; tidak ada chart merchant terpisah.
- Keputusan: "Kalender BAP 30 hari ke depan tanpa filter." Mockup: kalender mengikuti filter Periode Tanggal Terima Surat halaman (karena memakai data terfilter), jadi tidak sepenuhnya "tanpa filter".
- Keputusan: "Group merchant = PT induk, merchant = sub merchant." Mockup: dua teks bebas wajib (Nama Merchant, Group Merchant) tanpa label "PT induk" / "sub merchant"; tidak ada relasi atau validasi antar keduanya.
- Keputusan: "Dana taktis terpisah dari hold settlement." Sesuai (dua field uang terpisah, keduanya opsional).
- Keputusan: sensor (RRN, nama terlapor) hanya disebut untuk Fraud. Mockup menambah sensor + ikon mata Nama Penyidik dan No. Telepon Penyidik di APH, plus export selalu tersamar; tidak ada di keputusan.
- Keputusan: "Semua file bukti opsional." Halaman APH tidak punya upload file sama sekali.
- Penamaan Departemen: halaman ini tidak memakai kolom unit kerja (hanya "Unit Penyidik"), jadi tidak terkena; PIC dari Master PIC.
- Fitur mockup tanpa padanan di keputusan: status Active/Done, Kasus, Unit Penyidik, Tempat BAP, Tanggal Jadwal Ulang BAP, tanggal surat/jawaban, kartu umur + tabel, donat per kasus, garis surat masuk, tiga alert, opsi Lainnya.

---

## 3. Perizinan & Dokumen Legalitas (menu: Legal > Perizinan & Dokumen Legalitas)

- **Tujuan**: mencatat izin, akta, SK, dan dokumen legalitas perusahaan beserta masa berlakunya, versi sebelumnya, dan mengingatkan sebelum kedaluwarsa.
- **Prasyarat akses**: izin Lihat Legal; tab Dashboard butuh izin Dashboard Legal.
- Modul `perizinan`, file `src/pages/Perizinan.tsx`; noun "Dokumen"; nama data = Nama Dokumen; Periode dashboard = Tanggal Terbit; status batal = **Tidak Berlaku**.

### Tab Dashboard
Filter global: **Periode Tanggal Terbit**. Semua tiga visual memakai `rows` terfilter. "Berlaku/LIVE" = status ≠ Tidak Berlaku dan tidak dibatalkan. Sisa hari S = Tanggal Kedaluwarsa - hari ini (tanpa Tanggal Kedaluwarsa = tidak ada S).

#### Kartu "Izin yang perlu diperpanjang" (judul grup; 1 kartu)
Kartu angka "Izin kedaluwarsa dalam 180 hari": jumlah dokumen LIVE dengan 0 ≤ S ≤ 180 dan status ≠ Kedaluwarsa. Warna: merah bila ada dokumen dengan S ≤ 90; kuning bila ada tapi semua S 91 sampai 180; abu-abu bila nol. Klik = Table terfilter Kelompok Masa Berlaku = "180 hari atau kurang". (i) apa: "Jumlah dokumen yang masih berlaku dengan sisa 0 sampai 180 hari sampai Tanggal Kedaluwarsa dan belum berstatus Kedaluwarsa. Dokumen Tidak Berlaku tidak dihitung." baca: "Merah: ada dokumen dengan sisa 90 hari atau kurang. Kuning: ada dokumen dengan sisa 91 sampai 180 hari. Abu-abu: tidak ada." dan "Klik kartu untuk membuka tab Table terfilter Kelompok Masa Berlaku \"180 hari atau kurang\"."

#### Donat "Dokumen per kategori"
Donat, irisan = Kategori Dokumen (daftar Master Kategori Dokumen Perizinan ditambah kategori lama yang masih ada di data), irisan nol tidak tampil, legenda di bawah, warna palet berurutan. Isi: dokumen LIVE (Tidak Berlaku dikeluarkan, Kedaluwarsa tetap dihitung) dalam Periode. Tooltip default (nama, jumlah). Klik irisan = Table terfilter Kategori.

#### Tabel mini "Daftar izin dan tanggal kedaluwarsa"
Tabel mini 5 baris per halaman. Kolom: No, Nama, Kategori, Kedaluwarsa (dd/mm/yyyy), Sisa hari (lencana). Isi: dokumen LIVE yang punya Tanggal Kedaluwarsa, urut tanggal kedaluwarsa paling awal dulu (yang sudah lewat di atas). Lencana Sisa hari: merah bila S ≤ 90 atau sudah lewat (teks "Lewat N hari"), kuning bila 91 sampai 180 ("N hari"), hijau bila > 180. Klik baris = Detail.

### Tab Table
- **Kolom (urutan)**: Nomor, Kategori, Nama Dokumen, Nomor Dokumen, Penerbit, Kedaluwarsa (dd/mm/yyyy atau "-"), Sisa Hari (lencana seperti di atas; abu-abu "-" bila tanpa tanggal), Status, Versi, Tanggal Dibuat, Aksi.
- **Pencarian** (placeholder "Cari nama dokumen, nomor, penerbit"): `{Nama Dokumen} {Nomor Dokumen} {Penerbit}`.
- **Filter**: Kategori [master + kategori lama dari data]; Status [Aktif, Dalam Perpanjangan, Kedaluwarsa, Tidak Berlaku]; PIC [nilai di data]; Kelompok Masa Berlaku [180 hari atau kurang; Kedaluwarsa; 90 hari atau kurang; 91 sampai 180 hari; Lebih dari 180 hari]. Tidak ada filter periode di Table. "180 hari atau kurang" = 0 sampai 180 hari (gabungan "90 hari atau kurang" dan "91 sampai 180 hari"; tidak termasuk yang sudah lewat). Filter Kelompok Masa Berlaku menghitung berdasarkan Tanggal Kedaluwarsa saja (tidak memeriksa status), sehingga bisa memuat dokumen Dalam Perpanjangan atau Tidak Berlaku, sedangkan kartu dashboard mengecualikan Tidak Berlaku dan Kedaluwarsa.
- **Tombol**: Export Excel, Tambah.
- **Export**: `Perizinan_Legalitas_{YYYY-MM-DD}.xlsx`, sheet "Perizinan & Dokumen Legalitas"; kolom: Nomor, Tanggal Dibuat, Kategori Dokumen, Nama Dokumen, Nomor Dokumen, Penerbit, Tanggal Terbit, Tanggal Berlaku, Tanggal Kedaluwarsa, Tanggal Peninjauan, Kewajiban Pelaporan terkait Izin, PIC, Status, Nomor Versi (angka), File Dokumen (nama), Versi Sebelumnya (teks gabungan "versi | tgl berlaku | tgl kedaluwarsa | file; ..."), Data Pribadi Direksi & Komisaris (teks tetap "Disimpan terpisah, tidak dimasukkan ke dashboard"). Field "Perpanjang izin" TIDAK diekspor. Mengikuti cari + filter. Tercatat di Log.
- **Badge/warna**: lencana status (Aktif hijau, Dalam Perpanjangan kuning, Kedaluwarsa merah, Tidak Berlaku abu-abu); lencana Sisa Hari; baris Tidak Berlaku teks abu-abu.

### Form Tambah
Judul "Tambah Dokumen". Status awal Aktif; Nomor Versi awal 1.
| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
| --- | --- | --- | --- | --- | --- | --- |
| Kategori Dokumen | dropdown | Master Kategori Dokumen Perizinan (tanpa Lainnya) | Wajib | - | Selalu | "Kategori Dokumen wajib diisi" |
| Nama Dokumen | teks | bebas (help: "Mis. Izin QRIS, Izin Transfer Dana.") | Wajib | - | Selalu | "Nama Dokumen wajib diisi" |
| Nomor Dokumen | teks | bebas | Wajib | - | Selalu | "Nomor Dokumen wajib diisi" (tidak dicek unik) |
| Penerbit | teks | bebas | Wajib | - | Selalu | "Penerbit wajib diisi" |
| Tanggal Terbit | tanggal | - | Wajib | - | Selalu | "Tanggal Terbit wajib diisi" |
| Tanggal Berlaku | tanggal | - | Wajib | - | Selalu | "Tanggal Berlaku wajib diisi" |
| Tanggal Kedaluwarsa | tanggal | - | Opsional (help: "Boleh kosong (dokumen tanpa masa berlaku tidak memicu notifikasi kedaluwarsa).") | - | Selalu | "Tanggal Kedaluwarsa tidak boleh sebelum Tanggal Berlaku" |
| Tanggal Peninjauan | tanggal | - | Opsional (help: "Opsional.") | tidak memicu alert | Selalu | - |
| Kewajiban Pelaporan terkait Izin | textarea (lebar penuh) | teks bebas (help: "Teks bebas (tidak ada master Daftar Laporan).") | Opsional | - | Selalu | - |
| PIC | dropdown | Master PIC | Wajib | - | Selalu | "PIC wajib diisi" |
| Status | dropdown | Aktif; Dalam Perpanjangan; Kedaluwarsa | Wajib | Default Aktif. Help: "Kedaluwarsa terisi otomatis bila tanggal kedaluwarsa terlewat dan belum diperpanjang." | Selalu | "Status wajib diisi". "Tidak Berlaku" tidak ada di daftar |
| Nomor Versi | angka | bilangan | Opsional (help: "Boleh kosong.") | Default 1 | Selalu | "Nomor Versi harus berupa angka" |
| Perpanjang izin | Ya/Tidak | Ya; Tidak | - | - | Hanya di form Edit (tidak di Tambah) | lihat bagian Edit |
| File Dokumen | upload | PDF/JPG/JPEG/PNG, 25 MB, 1 file | Opsional | - | Selalu | Pesan A8 |
| Versi Sebelumnya | daftar (Versi, Tanggal Berlaku, Tanggal Kedaluwarsa, File) | - | - | diisi otomatis saat perpanjangan; tidak ada di form | Hanya Detail dan Export | - |
| Data Pribadi Direksi & Komisaris | teks tetap | - | - | Nilai tetap "Disimpan terpisah, tidak dimasukkan ke dashboard"; tidak ada di form | Hanya Detail dan Export | - |
- Status yang tidak bisa dipilih saat tambah: "Tidak Berlaku" (hanya via Batalkan). Aktif, Dalam Perpanjangan, Kedaluwarsa bisa dipilih.
- Data pribadi Direksi dan Komisaris sengaja tidak disimpan di dashboard.

### Edit
- **Siapa boleh**: izin Ubah (A13). Aturan baris: dokumen berstatus Tidak Berlaku tidak bisa diedit oleh siapa pun; peran PIC hanya bila nama PIC dokumen = nama akun (tidak peka huruf besar).
- **Kolom terkunci**: tidak ada kunci per kolom.
- **Alasan perubahan**: opsional.
- **Approval**: tidak ada.
- **Perpanjang izin** (isian hanya ada di form Edit, tipe Ya/Tidak; help: "Pilih Ya untuk memperpanjang: isi tanggal berlaku/kedaluwarsa dan nomor versi baru. Versi lama disimpan."). Bila "Ya":
  - Tanggal Berlaku wajib terisi: "Isi tanggal berlaku baru untuk perpanjangan".
  - Bila dokumen sebelumnya punya Tanggal Kedaluwarsa, Tanggal Kedaluwarsa baru wajib berbeda: "Perpanjangan: Tanggal Kedaluwarsa harus berbeda dari yang lama".
  - Bila Nomor Versi diisi, harus berbeda dari versi lama: "Perpanjangan: Nomor Versi harus versi baru". Nomor Versi kosong tidak diperiksa (panduan: "Harus berbeda dari versi lama").
  - Saat simpan: versi lama (versi, tanggal berlaku, tanggal kedaluwarsa, nama file) ditambahkan ke daftar Versi Sebelumnya; status otomatis menjadi **Aktif**; isian Perpanjang izin dikosongkan. Perubahan Versi Sebelumnya ikut tercatat di Log Perubahan.
  - Bila "Tidak" atau kosong: tidak ada versi tersimpan.

### Lihat Detail
- Isi (urutan): Tanggal Dibuat, Kategori Dokumen, Nama Dokumen, Nomor Dokumen, Penerbit, Tanggal Terbit, Tanggal Berlaku, Tanggal Kedaluwarsa, Tanggal Peninjauan, Kewajiban Pelaporan terkait Izin, PIC, Status (status tampilan), Nomor Versi, Perpanjang izin (selalu "-" karena dikosongkan saat simpan), File Dokumen (nama + ukuran, tidak bisa dibuka), Versi Sebelumnya (tabel: Versi, Tanggal Berlaku, Tanggal Kedaluwarsa, File), Data Pribadi Direksi & Komisaris (teks tetap).
- Lencana alert aktif; Log Perubahan A9. Tidak ada sensor.

### Status dan transisi
- **Status**: Aktif, Dalam Perpanjangan, Kedaluwarsa (form), Tidak Berlaku (hanya via Batalkan). Tidak ada aturan transisi untuk status form.
- **Status otomatis (saat tampil, tidak menulis ke data)**: status tersimpan "Aktif" dengan Tanggal Kedaluwarsa terisi dan sebelum hari ini ditampilkan sebagai "Kedaluwarsa". Dalam Perpanjangan dan lainnya tidak diubah otomatis. Hanya untuk dokumen LIVE.
- **Perpanjang izin** mengubah status menjadi Aktif (lihat Edit).
- **Batalkan**: izin Cancel; alasan wajib; status "Tidak Berlaku"; data keluar dari dashboard, alert, notifikasi, dan tidak bisa diedit. **Kembalikan**: status kembali ke status sebelumnya; alasan wajib.

### Approval
Tidak ada.

### Notifikasi / alert
Hanya dokumen LIVE (bukan Tidak Berlaku, bukan dibatalkan) yang punya Tanggal Kedaluwarsa. S = Tanggal Kedaluwarsa - hari ini.
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul | Pesan | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Izin akan kedaluwarsa | 0 ≤ S ≤ 180 dan status tampilan ≠ Kedaluwarsa (Dalam Perpanjangan tetap ikut) | Kuning bila S 91 sampai 180; merah bila S ≤ 90 | Legal Officer, Head CLRM | "Izin akan kedaluwarsa" | "{Nama Dokumen} kedaluwarsa pada {dd/mm/yyyy} ({N hari lagi / hari ini / besok}). Siapkan perpanjangan." | S > 180, S < 0, status Kedaluwarsa, Tidak Berlaku, atau perpanjangan memajukan Tanggal Kedaluwarsa melebihi 180 hari |
| Izin kedaluwarsa belum diperpanjang | S < 0 dan status ≠ Dalam Perpanjangan | Merah | Legal Officer, Head CLRM, Direksi (token tanpa akun: hanya terlihat Super Admin) | "Izin kedaluwarsa belum diperpanjang" | "{Nama Dokumen} sudah kedaluwarsa {N hari} lalu. Segera proses perpanjangan." (detail "Lewat N hari") | status diubah ke Dalam Perpanjangan, atau Perpanjang izin = Ya dengan tanggal baru, atau Tidak Berlaku |
- Dokumen tanpa Tanggal Kedaluwarsa tidak memicu notifikasi. Tanggal Peninjauan tidak memicu alert apa pun.
- Referensi notifikasi: "{Nama Dokumen} ({Nomor Dokumen})".

### Peran
Matriks bawaan (panduan):
| Peran | Lihat | Tambah | Ubah | Batalkan | Approve | Export | Sensor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | tidak dipakai | Ya | - |
| Head CLRM | Ya | Tidak | Tidak | Ya | - | Ya | - |
| Compliance Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Risk Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Legal Officer | Ya | Ya | Ya | Tidak | - | Ya | - |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| PIC | Ya | Tidak | Milik sendiri (nama PIC = nama akun); dokumen Tidak Berlaku tidak bisa diedit siapa pun | Tidak | - | Ya | - |
| Viewer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
Izin efektif akun: A13.

### Kondisi khusus dan prasyarat
- Perpanjang izin hanya di form Edit, dan hanya berefek bila "Ya"; menyimpan versi lama dan mengubah status ke Aktif.
- Dokumen Tidak Berlaku: tidak bisa diedit, keluar dari dashboard/alert/notifikasi.
- Dokumen tanpa Tanggal Kedaluwarsa: tidak muncul di kartu, tabel mini dashboard, dan notifikasi; tampil "-" di tabel.
- Status tampil "Kedaluwarsa" otomatis bila Aktif dan Tanggal Kedaluwarsa lewat.
- Alert merah "belum diperpanjang" tidak muncul bila Status = Dalam Perpanjangan.
- Penerima "Direksi" tidak punya akun: hanya Super Admin melihat.
- Donat kategori mengecualikan Tidak Berlaku, memasukkan Kedaluwarsa.
- Kategori Dokumen tidak punya opsi Lainnya.
- Tanggal Terbit dan Tanggal Berlaku wajib; Tanggal Kedaluwarsa, Tanggal Peninjauan, Nomor Versi opsional.

### Data contoh
18 dokumen: Kategori Izin 10, Akta + SK 4, Legalitas Lainnya 4. Status tersimpan: Aktif 16, Kedaluwarsa 1, Dalam Perpanjangan 1. 4 dokumen punya Versi Sebelumnya. Beberapa dokumen berjangka sangat panjang tanpa masa dekat (kedaluwarsa jauh); sisa hari tersebar (40, 70, 130, 170, 365 hari dan seterusnya). Penerbit contoh: Bank Indonesia, Kementerian Komunikasi dan Digital, Kemenkumham, Notaris, OSS RBA, DJP, TUV Rheinland, PCI.

### Sumber kode
`src/pages/Perizinan.tsx`: konstanta 19-34, fields 36-58, columns 60-70, filters 72-77, alerts 79-95, seed 97-135, cfg 137-161 (canEditRow 144, normalize 145, beforeSave 146-150, validate 151-161), Dashboard 163-192. `src/guides/perizinan.ts`. Kit: `FormModal.tsx`, `DetailModal.tsx`, `notify.tsx:127-132`.

### Selisih dengan keputusan final
- Keputusan: "Kategori dokumen dari Master Data." Sesuai (tanpa Lainnya).
- Keputusan: "Tanggal terbit dan berlaku wajib; kedaluwarsa, review, nomor versi opsional." Sesuai. Label "review" di mockup: "Tanggal Peninjauan".
- Keputusan: "Edit tanpa approval, dengan alasan perubahan." Mockup: tanpa approval; Alasan perubahan ada tetapi opsional (tidak wajib).
- Fitur mockup tanpa padanan di keputusan: Perpanjang izin dengan penyimpanan Versi Sebelumnya dan status otomatis kembali Aktif; Kewajiban Pelaporan terkait Izin; Penerbit; field Data Pribadi Direksi & Komisaris (catatan tetap); status Dalam Perpanjangan dan Tidak Berlaku; PIC; kartu 180 hari, donat kategori, tabel kedaluwarsa; dua alert (termasuk penerima "Direksi"); filter Kelompok Masa Berlaku; lencana Sisa Hari.
- Kartu dashboard dan filter Table "180 hari atau kurang" tidak identik (kartu mengecualikan Tidak Berlaku dan status Kedaluwarsa; filter tidak).

---

## 4. Permintaan Layanan Hukum (menu: Legal > Permintaan Layanan Hukum)

- **Tujuan**: mencatat permintaan layanan hukum dari unit kerja (review, pendapat hukum, penyusunan dokumen, konsultasi), memantau SLA dan PIC.
- **Prasyarat akses**: izin Lihat Legal; tab Dashboard butuh izin Dashboard Legal.
- Modul `layanan`, file `src/pages/LayananHukum.tsx`; noun "Permintaan"; nama data `{Jenis} - {Unit Kerja}`; Periode dashboard = Tanggal Masuk. Dua istilah batal berbeda: status **Batal** (pilihan di form Edit) dan **Dibatalkan** (aksi Batalkan oleh peran Cancel).

### Tab Dashboard
Filter global: **Periode Tanggal Masuk**. Definisi: OPEN = status Baru atau Proses; Tanggal Batas = Tanggal Masuk + SLA (hari kalender); terlambat = OPEN dan Tanggal Batas < hari ini (jumlah hari terlambat = hari ini - Tanggal Batas); umur = hari ini - Tanggal Masuk. Semua visual memakai data dalam Periode tanpa Dibatalkan (status Batal tetap ikut kecuali dinyatakan lain).

#### Kartu "Status permintaan" (judul grup; 4 kartu)
| Label | Isi | Warna | Klik |
| --- | --- | --- | --- |
| Baru | jumlah status Baru | biru | Table terfilter Status = Baru |
| Proses | jumlah status Proses | kuning | Status = Proses |
| Selesai | jumlah status Selesai | hijau | Status = Selesai |
| Lewat batas waktu | jumlah permintaan OPEN yang Tanggal Batasnya terlewat | merah bila > 0, abu-abu bila 0 | tidak bisa diklik |
Status Batal tidak punya kartu. (i) apa: "Jumlah permintaan layanan hukum menurut status, ditambah jumlah yang sudah lewat Tanggal Batas. Data Dibatalkan tidak dihitung."

#### Donat "Permintaan per jenis"
Donat, irisan = Jenis (Review, Pendapat Hukum, Penyusunan Dokumen, Konsultasi, Lainnya), nol tidak tampil. Isi: semua status kecuali Dibatalkan (Batal tetap dihitung) dalam Periode. Teks bebas dihitung di Lainnya. Tooltip: "{jenis}: {n} permintaan", sub "Per unit kerja", rincian per Unit Kerja. Klik irisan = Table terfilter Jenis.

#### Batang "Belum selesai menurut umur (hari)"
Batang tegak, seri "Jumlah", sumbu horizontal berlabel "Hari" dengan rentang umur "0-7", "8-14", ">14". Isi: permintaan Baru atau Proses menurut umur sejak Tanggal Masuk. Warna batang tetap: amber (#f59e0b) untuk dua rentang pertama, merah (#ef4444) untuk > 14. Tidak bisa diklik.

#### Batang "Permintaan per unit kerja"
Batang mendatar, seri "Jumlah", satu batang per isi Master Unit Kerja (7 unit), tanpa Lainnya. Isi: semua status kecuali Dibatalkan, dalam Periode; Unit Kerja yang tidak lagi ada di master tidak ikut. Klik batang = Table terfilter Unit Kerja.

#### Batang "Rata-rata lama selesai per jenis (hari)"
Batang tegak, seri "Hari", satuan sumbu "Hari" (tooltip "N hari"). Isi: rata-rata (Tanggal Selesai - Tanggal Masuk) per Jenis dari permintaan berstatus Selesai yang punya Tanggal Selesai, dibulatkan ke bilangan bulat; Jenis tanpa data = 0. Teks bebas dihitung di Lainnya. Tidak bisa diklik.

### Tab Table
- **Kolom (urutan)**: Nomor, Unit Kerja, Jenis, Tgl Masuk, Batas (Tanggal Masuk + SLA, dd/mm/yyyy), Prioritas, Status, PIC (atau "-"), Tanggal Dibuat, Aksi. Kolom Jenis menampilkan "Lainnya" untuk teks bebas.
- **Pencarian** (placeholder "Cari nomor, unit kerja, jenis"): `{nomor internal data} {Unit Kerja} {Jenis}`. Nomor internal data bukan kolom Nomor di tabel (posisi baris).
- **Filter**: Periode (Tanggal Masuk) [rentang]; Status [Baru, Proses, Selesai, Batal, Dibatalkan]; PIC [nilai di data]; Unit Kerja [Master Unit Kerja]; Jenis [Review, Pendapat Hukum, Penyusunan Dokumen, Konsultasi, Lainnya]; Prioritas [Tinggi, Sedang, Rendah]. Tanpa simpan filter.
- **Tombol**: Export Excel, Tambah.
- **Export**: `Permintaan_Layanan_Hukum_{YYYY-MM-DD}.xlsx`, sheet "Permintaan Layanan Hukum"; kolom: Nomor, Tanggal Dibuat, Unit Kerja Pemohon, Jenis, Tanggal Masuk, SLA (hari kalender) (angka), Tanggal Batas (hitung), Status, PIC, Prioritas, Tanggal Selesai dan Nomor Memo / Pendapat Hukum (hanya baris Selesai). Mengikuti cari + filter. Tercatat di Log.
- **Badge/warna**: Baru biru, Proses kuning, Selesai hijau, Batal abu-abu, Dibatalkan abu-abu; baris Dibatalkan teks abu-abu.

### Form Tambah
Judul "Tambah Permintaan". Status awal "Baru".
| Label | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
| --- | --- | --- | --- | --- | --- | --- |
| Unit Kerja Pemohon | dropdown | Master Unit Kerja | Wajib | - | Selalu | "Unit Kerja Pemohon wajib diisi" |
| Jenis | dropdown + Lainnya | Review; Pendapat Hukum; Penyusunan Dokumen; Konsultasi; Lainnya (tetap kode, bukan master) | Wajib | - | Selalu | "Jenis wajib diisi" |
| Tanggal Masuk | tanggal | - | Wajib | help: "Mengubah Tanggal Masuk menggeser batas waktu; wajib disertai alasan." | Selalu | "Tanggal Masuk wajib diisi" |
| SLA (hari kalender) | angka | bilangan | Wajib | help: "Mengubah SLA (batas waktu) wajib disertai alasan." | Selalu | "SLA (hari kalender) wajib diisi"; "SLA (hari kalender) harus berupa angka"; "SLA minimal 1 hari" |
| Tanggal Batas | tanggal (hitung) | - | - | Otomatis = Tanggal Masuk + SLA hari kalender; tidak ada di form | Hanya di Detail dan Export | - |
| Status | dropdown | Baru; Proses; Selesai; Batal | Wajib | Default Baru | Selalu | "Status wajib diisi" |
| PIC | dropdown | Master PIC | Opsional (help: "Boleh kosong saat dibuat pemohon.") | - | Selalu | - |
| Prioritas | dropdown | Tinggi; Sedang; Rendah | Wajib | - | Selalu | "Prioritas wajib diisi" |
| Tanggal Selesai | tanggal | - | Wajib bila Status = Selesai | - | Hanya bila Status = Selesai | "Tanggal Selesai wajib diisi"; "Tanggal Selesai tidak boleh sebelum Tanggal Masuk" |
| Nomor Memo / Pendapat Hukum | teks | bebas | Wajib bila Status = Selesai | - | Hanya bila Status = Selesai | "Nomor Memo / Pendapat Hukum wajib diisi" |
- Status yang tidak bisa dipilih saat tambah: tidak ada pembatasan di daftar (Selesai dan Batal bisa dipilih; bila Selesai, Tanggal Selesai dan Nomor Memo muncul dan wajib). "Dibatalkan" tidak ada di daftar.
- Tidak ada upload file di halaman ini.

### Edit
- **Siapa boleh**: izin Ubah (A13: Super Admin, Head CLRM, Legal Officer, PIC efektif). Aturan baris: hanya permintaan berstatus selain **Selesai** dan **Batal** yang bisa diedit; permintaan Selesai/Batal tidak bisa diedit lagi (tombol Edit hilang). Tidak ada aturan "milik sendiri" untuk PIC di kode (panduan menyatakan Edit hanya Legal Officer; lihat selisih).
- **Kolom terkunci**: tidak ada kunci per kolom.
- **Alasan perubahan WAJIB** bila **Tanggal Masuk** atau **SLA (hari kalender)** yang sudah terisi diubah di form Edit: tanda `*` pada "Alasan perubahan" dan error "Alasan wajib diisi jika Tanggal Masuk, SLA (hari kalender) diubah" (hanya label yang berubah yang disebut). Perubahan kolom lain: alasan opsional.
- **Approval**: tidak ada.
- Mengubah Tanggal Masuk atau SLA menggeser Tanggal Batas.

### Lihat Detail
- Isi (urutan): Tanggal Dibuat, Unit Kerja Pemohon, Jenis, Tanggal Masuk, SLA (hari kalender), Tanggal Batas, Status, PIC, Prioritas, Tanggal Selesai (hanya bila Selesai), Nomor Memo / Pendapat Hukum (hanya bila Selesai).
- Lencana alert aktif; Log Perubahan A9 (memuat alasan perubahan Tanggal Masuk/SLA). Tidak ada file dan tidak ada sensor.

### Status dan transisi
- **Daftar status**: Baru, Proses, Selesai, Batal (form), Dibatalkan (aksi Batalkan).
- Tanpa aturan transisi eksplisit untuk sebelum Selesai/Batal. Setelah Selesai atau Batal, data terkunci dari Edit (tidak bisa kembali ke Baru/Proses lewat Edit); hanya Batalkan/Kembalikan yang tersedia.
- Tidak ada status otomatis. Selesai mensyaratkan Tanggal Selesai dan Nomor Memo / Pendapat Hukum.
- **Batalkan**: izin Cancel; alasan wajib; status "Dibatalkan". Status "Batal" tetap dihitung di grafik per jenis dan per unit kerja; "Dibatalkan" tidak. **Kembalikan**: status kembali ke status sebelumnya (mis. Proses atau Selesai); alasan wajib. Tombol Batalkan tidak menunggu aturan Selesai/Batal (tersedia juga untuk data Selesai/Batal bila punya izin).

### Approval
Tidak ada.

### Notifikasi / alert
Hanya status Baru atau Proses (OPEN) dan data tidak dibatalkan. Hari kerja = Senin sampai Jumat, tanpa libur nasional. "Hari kerja antara a dan b" = jumlah hari kerja di (a, b].
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul | Pesan | Berhenti bila |
| --- | --- | --- | --- | --- | --- | --- |
| Lewat batas waktu | OPEN, Tanggal Batas terisi dan sebelum hari ini | Merah | `PIC (nama)` bila PIC terisi, atau semua akun berperan PIC bila PIC kosong; dan Head CLRM | "Permintaan layanan hukum lewat batas waktu" | "Permintaan layanan hukum ({Jenis}) dari {Unit Kerja} belum selesai dan melewati batas waktu {N hari}. Segera selesaikan." | status Selesai/Batal/Dibatalkan, atau Tanggal Batas digeser ke hari ini atau lebih |
| Mendekati batas waktu | OPEN, belum lewat, dan hari kerja dari hari ini sampai Tanggal Batas ≤ 2 | Kuning | PIC permintaan (bentuk sama seperti di atas) | "Permintaan layanan hukum mendekati batas waktu"; berubah menjadi "Permintaan layanan hukum jatuh tempo hari ini" bila hari kerja tersisa 0 (tenggat hari ini) | "Permintaan layanan hukum ({Jenis}) dari {Unit Kerja} jatuh tempo {hari ini / N hari kerja lagi}. Segera selesaikan." | lewat batas (diganti alert merah), selesai, atau Tanggal Batas digeser > 2 hari kerja |
| Belum punya PIC | OPEN, PIC kosong, dan hari kerja dari Tanggal Masuk sampai hari ini > 1 | Kuning | Head CLRM | "Permintaan layanan hukum belum punya PIC" | "Permintaan layanan hukum ({Jenis}) dari {Unit Kerja} sudah {N hari kerja tanpa PIC}. Tetapkan PIC." | PIC diisi, atau selesai/dibatalkan |
- Detail alert: "Lewat N hari", "N hari kerja lagi" (0 menjadi "hari ini" di pesan), "N hari kerja tanpa PIC".

### Peran
Matriks bawaan (panduan):
| Peran | Lihat | Tambah | Ubah | Batalkan | Approve | Export | Sensor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Ya | Ya | Ya | Ya | tidak dipakai | Ya | - |
| Head CLRM | Ya | Tidak | Tidak | Ya | - | Ya | - |
| Compliance Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Risk Officer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Legal Officer | Ya | Ya | Ya | Tidak | - | Ya | - |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | - | Ya | - |
| PIC | Ya | **Ya** | **Tidak** (panduan: "PIC tidak bisa Edit") | Tidak | - | Ya | - |
| Viewer | Ya | Tidak | Tidak | Tidak | - | Ya | - |
Izin efektif akun (A13): PIC dan Head CLRM mendapat Ubah karena izin Legal "update" berlaku untuk semua halaman Legal; satu-satunya batas baris di halaman ini adalah status bukan Selesai/Batal.

### Kondisi khusus dan prasyarat
- Tanggal Selesai dan Nomor Memo / Pendapat Hukum hanya muncul dan wajib bila Status = Selesai.
- Alasan perubahan wajib hanya bila Tanggal Masuk atau SLA yang sudah terisi diubah.
- Permintaan Selesai atau Batal tidak bisa diedit.
- Alert hanya untuk Baru/Proses. "Belum punya PIC" hanya bila PIC kosong dan > 1 hari kerja sejak Tanggal Masuk. "Mendekati batas waktu" hanya bila belum lewat dan ≤ 2 hari kerja. Judul "jatuh tempo hari ini" hanya saat 0 hari kerja tersisa.
- PIC kosong diizinkan saat dibuat (pemohon). Penerima alert yang menyebut PIC saat PIC kosong = semua akun berperan PIC.
- Kartu "Lewat batas waktu" tidak bisa diklik; batang umur dan batang rata-rata tidak bisa diklik.
- Status Batal berbeda dari Dibatalkan dan tetap dihitung di donat jenis dan batang unit kerja.
- SLA dalam hari kalender (bukan hari kerja); hari kerja dipakai hanya untuk alert.

### Data contoh
30 permintaan: Proses 12, Baru 8, Selesai 8, Batal 2. Jenis: Review 6, Penyusunan Dokumen 6, Lainnya 6, Pendapat Hukum 6, Konsultasi 6. Unit Kerja: enam departemen masing-masing 5 (Information Technology, Business, Operation, Finance Accounting Tax & Treasury, Compliance Legal & Risk Management, Support). Prioritas: Tinggi 10, Sedang 10, Rendah 10. 2 permintaan tanpa PIC. Beberapa permintaan sudah lewat batas dan beberapa mendekati batas (untuk uji alert). Setiap permintaan Selesai punya Nomor Memo contoh "MEMO/LGL/NNN/2026".

### Sumber kode
`src/pages/LayananHukum.tsx`: konstanta 15-20, fields 22-33, columns 34-43, filters 45-52, alerts 55-72, seed 74-95, cfg 97-111 (canEditRow 104, validate 105-110), Dashboard 112-152. `src/guides/layanan.ts`. Kit: `kit/dates.ts workDaysBetween`, `FormModal.tsx` (reasonOnChange, baris need), `notify.tsx:133-135, 70-72 (nearTitle)`.

### Selisih dengan keputusan final
- Keputusan: "Permintaan dokumen atau bantuan hukum dari departemen." Sesuai; label "Unit Kerja Pemohon" dan master "Unit Kerja" bukan **Departemen** (keputusan: semua kolom unit kerja bernama Departemen dari Master Data Departemen).
- Keputusan: "Jenis bisa ditambah." Mockup: Jenis daftar tetap di kode (Review, Pendapat Hukum, Penyusunan Dokumen, Konsultasi) + Lainnya teks bebas; tidak ada Master Data Jenis Layanan.
- Keputusan: "SLA hari kalender." Sesuai.
- Keputusan: "Status Selesai wajib tanggal selesai dan nomor memo atau pendapat hukum." Sesuai.
- Keputusan: "Edit tanpa approval." Sesuai. Alasan wajib hanya saat Tanggal Masuk atau SLA diubah (tidak ada di keputusan).
- Fitur mockup tanpa padanan di keputusan: Prioritas; status Batal vs Dibatalkan; Edit terkunci setelah Selesai/Batal; tiga alert (termasuk hari kerja, "jatuh tempo hari ini", "belum punya PIC"); kartu status + "Lewat batas waktu"; donat per jenis, batang umur, batang per unit kerja, rata-rata lama selesai.
- Selisih internal: panduan menyatakan Tambah oleh Legal Officer dan PIC, Edit oleh Legal Officer saja; izin efektif akun memungkinkan PIC dan Head CLRM mengedit.

---

## 5. Rekap temuan lintas halaman (untuk penyusun PRD)

1. **Izin per kategori, bukan per halaman (A13)**: perilaku efektif beda dari panduan di tiga tempat: Head CLRM bisa Ubah; Legal Officer dan PIC bisa Batalkan/Kembalikan; PIC bisa Tambah di Kontrak/APH/Perizinan. Matriks bawaan di panduan hanya relevan sebagai nilai awal.
2. **Penamaan "Unit Kerja" vs keputusan "Departemen"**: Kontrak (Unit Pemilik (Unit Kerja)) dan Layanan (Unit Kerja Pemohon, Unit Kerja) memakai "Unit Kerja"; Master Data bernama "Unit Kerja".
3. **Kalender APH mengikuti Periode halaman** meski keputusan menyebut tanpa filter.
4. **Teks alert Kontrak menyebut tahap H-90/60/30/7** tetapi kode memicu terus tiap hari selama 0 sampai 90 hari.
5. **Klik drill dari dashboard tidak membawa Periode halaman** ke filter Table (angka kartu dan hasil Table bisa berbeda saat Periode diisi).
6. **Tidak ada upload file di APH dan Layanan**; Kontrak dan Perizinan punya satu field file opsional; file hanya metadata (tidak ada unduhan/pratinjau).
7. **Tidak ada approval, tidak ada simpan filter, tidak ada tombol Import** di keempat halaman. `docs/keputusan-desain.md` poin 10 dan poin 12 (sort per kolom; Import Excel) usang terhadap kode.
8. **Alasan perubahan opsional** kecuali Layanan (Tanggal Masuk / SLA).
9. **Status otomatis tidak ditulis ke data tersimpan** (Kontrak, Perizinan): hanya tampilan; Log Perubahan tidak mencatat perubahan otomatis.
10. **Daftar tetap di kode (bukan Master Data)**: Jenis Hubungan, Bidang Usaha, Perpanjangan, Perihal, Kasus, Unit Penyidik, Jenis Layanan, Prioritas.
