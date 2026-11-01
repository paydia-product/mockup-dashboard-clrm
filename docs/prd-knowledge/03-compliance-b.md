# Pengetahuan mockup CLRM v2.14.4: Compliance B (Regulatory Change, SOP & Dokumen Kontrol)

Sumber kebenaran adalah kode di `src/`. Bila panduan (`src/guides/regchange.ts`, `src/guides/sop.ts`) berbeda dari kode, kode yang dipakai dan perbedaannya dicatat dengan tanda `[SELISIH PANDUAN]`. Perilaku yang berasal dari kit bersama (`src/kit/*`) berlaku sama untuk kedua halaman dan dijelaskan sekali di bagian "Perilaku kit bersama" di bawah, lalu dirujuk dari tiap halaman.

Istilah: "Unit Kerja" adalah label di mockup untuk daftar Master Data yang di keputusan final disebut "Departemen". Lihat bagian Selisih.

---

## Perilaku kit bersama (berlaku untuk kedua halaman)

### Kerangka halaman
- Tombol Panduan Halaman di samping judul. Dua tab: `Dashboard` (tab pertama) dan `Table`.
- Tab Dashboard hanya tampil bila akun punya izin `Dashboard` (kategori Compliance). Tanpa izin itu hanya tab Table yang tampil dan halaman langsung membuka Table.
- Filter global Dashboard: "Periode {label tanggal}" dengan dua input tanggal, teks "sampai", tombol `Reset`, dan keterangan "{n} data (tanpa yang dibatalkan)". Kosong berarti semua data. Baris dengan tanggal kosong tidak ikut bila periode diisi.
- Dashboard hanya menghitung data yang tidak Dibatalkan (`cancelled` kosong). Data yang dibatalkan juga tidak memicu notifikasi.
- Klik visual tertentu memanggil "drill": filter Table diisi, kotak cari dikosongkan, tab pindah ke Table.

### Tab Table (kit)
- Kolom yang tampil: `Nomor` (urutan baris 1..n, lanjut antar halaman, kembali ke 1 saat cari atau filter berubah; bukan ID), kolom khusus halaman, `Tanggal Dibuat` (format dd/mm/yyyy HH:mm), `Aksi`.
- Urutan tetap: Tanggal Dibuat terbaru dulu. Tidak ada sort kolom.
- Pagination: "Baris per halaman" 10, 25, atau 50 (bawaan 10). Teks "{awal} sampai {akhir} dari {total} data", tombol `<` dan `>`, nomor halaman (maksimum 7 tombol terlihat). Kosong: "Tidak ada data".
- Baris yang dibatalkan tetap tampil dengan teks abu-abu.
- Pencarian: satu kotak teks, cocok sebagian, tidak peka huruf besar kecil.
- Filter: tombol `Filter` membuka popover, satu isian per filter (select satu nilai, atau rentang tanggal), semua filter digabung dengan AND. Tombol `Clear All` dan `Apply Filters`. Tidak ada filter tersimpan (dihapus sejak v9 store).
- Tombol atas kanan: `Export Excel` (izin Export), `Tambah` (izin Tambah). Tombol `Import Excel` ada di kode tetapi dimatikan (`SHOW_IMPORT = false`), tidak tampil untuk peran apa pun.
- Tombol Aksi per baris:
  - `Lihat Detail` (selalu).
  - `Edit`: bila izin Ubah, baris tidak dibatalkan, tidak ada approval Menunggu, dan aturan `canEditRow` halaman lolos.
  - `Batalkan` (merah): bila izin Cancel, baris tidak dibatalkan, tidak ada approval Menunggu.
  - `Kembalikan` (hijau): bila izin Cancel dan baris sedang dibatalkan.
- Batalkan dan Kembalikan membuka modal "Alasan" dengan isian wajib (pesan "Alasan wajib diisi."), tombol `Batal` dan `Konfirmasi`. Judul modal: "Batalkan {noun} {nama}" dan "Kembalikan {noun} {nama}".
- Batalkan menyimpan `cancelled = {prev, reason, by, at}` dan mengubah status ke status batal halaman. Kembalikan memulihkan status ke `prev` dan menghapus `cancelled`. Tidak ada penghapusan permanen. Keduanya tercatat di log.

### Upload file (kit)
- Format PDF, JPG, JPEG, PNG. Ekstensi dan MIME harus cocok. Maksimal 25 MB. Satu file per isian ("Hanya boleh 1 file" bila lebih). Bisa seret dan lepas.
- Pesan: "File kosong"; "Format file harus PDF, JPG, JPEG, atau PNG"; "Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG"; "Ukuran file maksimal 25 MB".
- Teks bantu di kotak: "PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file." Tombol "Pilih file" atau "Ganti file", tombol hapus (X).
- Mockup hanya menyimpan metadata (nama, ukuran, tipe). Isi file tidak disimpan.

### Form Tambah dan Edit (kit)
- Modal lebar. Judul "Tambah {noun}" atau "Ubah {noun} {nama}". Tombol `Batal` dan `Simpan`.
- Isian wajib diberi tanda `*` pada label. Pesan wajib: "{Label} wajib diisi". Isian bertipe persen: "{Label} harus berupa angka" dan "{Label} harus 0 sampai 100".
- Pilihan yang memuat "Lainnya": memilih Lainnya memunculkan isian teks (placeholder "Sebutkan lainnya", maks 255 karakter). Teks itulah yang disimpan. Kosong menolak simpan dengan pesan "Wajib diisi jika memilih Lainnya". Di Table nilai di luar daftar tampil sebagai "Lainnya"; Detail dan Export memakai teks asli.
- Mode Edit menambah isian "Alasan perubahan" (textarea). Opsional di kedua halaman ini (tidak ada isian `reasonOnChange`). Alasan ikut ke log dan ke pengajuan approval.
- Simpan tanpa perubahan apa pun tidak membuat log.

### Lihat Detail (kit)
- Modal "Detail". Isi: badge alert aktif (bentuk "{label alert}: {detail}", tooltip memuat penerima notifikasi; tidak ada untuk data dibatalkan), kotak kuning "Menunggu persetujuan {approver}" dengan tautan "Lihat di menu Approval" bila ada approval Menunggu, kotak abu-abu pembatalan ("Dibatalkan oleh {siapa}, {tanggal}. Alasan: ... Status sebelumnya: ..."), grid "Tanggal Dibuat" (dd/mm/yyyy HH:mm:ss) dan semua isian yang kondisi tampilnya terpenuhi (kosong tampil "-"), lalu bagian "Log Perubahan".
- File tampil sebagai nama dan ukuran. Tidak ada tautan buka atau unduh di mockup (hanya teks).
- Log Perubahan (urut kronologis): "Data dibuat" (pembuat, waktu), "Perubahan data" (kolom, sebelum, sesudah, alasan), "Dibatalkan" (alasan), "Dikembalikan" (alasan), "Pengajuan approval: {jenis}" (pengaju, approver, perubahan), "Approval: Approve atau Reject" (pemutus, catatan).
- Membuka Detail tidak dicatat di log.
- Tautan notifikasi `#/{route}?open={id}` membuka halaman dan langsung membuka Detail data itu.

### Export Excel (kit)
- Mengekspor baris yang sedang tampil di Table (sesuai cari dan filter, termasuk baris dibatalkan bila lolos filter), urut sama dengan Table.
- Kolom: `Nomor` (urutan baris), `Tanggal Dibuat` (dd/mm/yyyy HH:mm:ss), lalu semua isian halaman sesuai urutan definisi isian, termasuk isian otomatis; isian yang kondisi tampilnya tidak terpenuhi pada baris itu dilewati. Tanggal dd/mm/yyyy; multi pilihan dipisah ", " (multiselect) atau "; " (multidrop); file = nama file; angka tetap angka.
- Nama sheet = judul halaman. Tidak ada isian yang disensor di dua halaman ini.
- Setiap export mencatat satu entri log: modul = judul halaman, aksi "Export", keterangan "{n} baris".

### Notifikasi (kit)
- Semua alert hanya berupa notifikasi dalam dashboard (ikon lonceng di header, badge jumlah belum dibaca, "99+" bila lebih dari 99). Tidak ada email atau Telegram.
- Dihitung langsung dari data setiap render. Status baca dan waktu pertama muncul disimpan di browser per akun demo. Notifikasi hilang sendiri saat kondisinya tidak terpenuhi lagi.
- Panel: judul "Notifikasi (n belum dibaca)", tombol "Tandai semua dibaca", item bertepi merah atau kuning, "Tidak ada notifikasi" bila kosong. Klik item membuka halaman dan Detail data.
- Penerima dicocokkan ke akun: nama peran cocok dengan peran akun; `PIC (nama)` hanya akun dengan nama itu; token `PIC`, `PIC Dokumen`, `PIC unit terdampak` cocok dengan SEMUA akun berperan PIC (tidak dicocokkan ke departemen atau ke PIC data); token tanpa akun (mis. `Direktur terkait`) hanya terlihat Super Admin. Super Admin melihat semua notifikasi. Syarat tambahan: peran akun punya izin Lihat modul menurut matriks peran default (`store.perms`), bukan izin per akun.

### Peran dan izin (kit, v2.14)
Dua lapis. Penting untuk PRD karena hasilnya berbeda.

1. Matriks peran default (`src/kit/perms.ts`, baris 14-42). Dipakai sebagai nilai awal dan oleh pusat notifikasi.
2. Izin per akun (Admin > Manage Permissions, sejak v2.14). Perilaku tombol di halaman memakai izin akun, bukan matriks peran. Izin akun berbentuk kategori dan aksi: `compliance.view|create|update|export|approve|dashboard`. Kategori Compliance mencakup empat halaman sekaligus (Tracker, Reporting, Regulatory Change, SOP), jadi izin tidak bisa dibedakan per halaman. `update` berarti Ubah DAN Batalkan/Kembalikan sekaligus. Izin awal akun diturunkan dari matriks peran: sebuah kategori memberi aksi bila salah satu halaman di kategori itu memberi aksinya. Akibatnya perilaku efektif akun bawaan berbeda dari matriks peran. Hasil saya hitung dari `permsOf` + `canAccount` (lihat tabel Peran tiap halaman).
3. Super Admin selalu mendapat semua izin. Untuk memutuskan approval, syaratnya: status Menunggu, peran akun = approver (atau Super Admin), izin Approve modul, dan izin `approval.update` (`src/shared/Approval.tsx:18`).

---

## Regulatory Change (menu: Compliance > Regulatory Change)

Rute: `compliance/regulatory-change`. Kunci izin: `regchange`. Kata benda halaman: "Peraturan". Awalan file export: `Daftar_Peraturan`.

**Ringkasan tujuan.** Mencatat peraturan dan surat dari regulator (PBI, PADG, UU, Permen, Peraturan BSSN, Surat Edaran, Surat Imbauan), menilai dampaknya bagi Paydia, memantau pemenuhan per unit kerja, dan menghubungkan peraturan ke SOP yang harus diperbarui.

**Prasyarat akses.** Lihat halaman: izin Lihat. Tab Dashboard: izin Dashboard (kategori Compliance). Tab Table: izin Lihat. Semua peran default punya Lihat dan Dashboard. Rincian per tombol ada di bagian Peran.

### Tab Dashboard

Filter global: "Periode Tanggal Dicatat" (dua tanggal, Reset). Menyaring semua kartu KECUALI kartu Tren (memakai semua data tidak dibatalkan). Dibatalkan tidak dihitung. Hanya data yang `Status Peraturan` Dicabut atau Diubah tetap dihitung (tidak dikecualikan). Tata letak: grid dua kolom, kartu agenda satu baris penuh di bawah. Setiap visual punya ikon info (i) berisi "apa" dan "cara membaca" (teks pokok disalin di bawah).

1. **Peraturan per regulator dan jenis perubahan**
   - Bentuk: bar bertumpuk (vertikal). Sumbu X: enam regulator tetap `BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya`. Sumbu Y: jumlah. Legenda 4 seri.
   - Aturan hitung: jumlah peraturan (periode terpilih) per regulator dan per Jenis Perubahan. Regulator yang diketik bebas di luar daftar dihitung "Lainnya".
   - Warna: Baru biru `#3b82f6`, Perubahan kuning `#f59e0b`, Pencabutan merah `#ef4444`, Imbauan ungu `#8b5cf6`.
   - Klik batang: ke Table dengan filter Regulator = nama batang (klik pada segmen mana pun membuka filter regulator, bukan filter jenis perubahan).
   - Info (i): "Jumlah peraturan per regulator, dipisah menurut Jenis Perubahan. Regulator yang diketik bebas di luar daftar dihitung sebagai Lainnya." Cara baca: sumbu, warna, klik membuka Table terfilter.
   - Kosong: "Tidak ada data" bila semua nol.

2. **Tren peraturan baru dan perubahan per bulan**
   - Bentuk: garis dua seri (Baru biru `#3b82f6`, Perubahan kuning `#f59e0b`), titik bulat, legenda, tooltip bawaan. Titik tidak bisa diklik.
   - Aturan hitung: jumlah per bulan menurut Tanggal Dicatat, hanya Jenis Perubahan Baru dan Perubahan. Pencabutan dan Imbauan tidak dihitung. Memakai semua data (mengabaikan Periode halaman).
   - Filter sendiri di atas grafik: label "Periode", pilihan "Seluruh Waktu", "3 bulan terakhir", "6 bulan terakhir", "9 bulan terakhir", "12 bulan terakhir" (bawaan), "Custom" (dua input bulan "dari" dan "sampai"; kosong = bulan data tertua / bulan ini). N bulan terakhir = tepat N bulan termasuk bulan berjalan. Bulan tanpa data tetap tampil sebagai nol.
   - Info (i): menjelaskan butir di atas.

3. **Status kepatuhan**
   - Bentuk: donut. Irisan = Status Kepatuhan: Comply hijau `#10b981`, Partial kuning `#f59e0b`, Gap merah `#ef4444`, Belum Dinilai abu-abu `#94a3b8`. Irisan bernilai 0 disembunyikan.
   - Rumus Status Kepatuhan dari Pemenuhan (%): kosong = Belum Dinilai; 100 atau lebih = Comply; 70 sampai 99 = Partial; di bawah 70 = Gap.
   - Klik irisan: ke Table dengan filter Status Kepatuhan = nama irisan. Tooltip bawaan (jumlah).

4. **Rata-rata pemenuhan per kategori (%)**
   - Bentuk: bar tunggal vertikal (warna bawaan palet `#1f2ab5`). Sumbu X: daftar Master Data "Kategori Regulasi" ditambah "Lainnya" (seed master: APU PPT, QRIS, SNAP, Pelindungan Konsumen, Ketahanan Siber). Sumbu Y: rata-rata Pemenuhan dibulatkan.
   - Aturan: rata-rata hanya dari peraturan yang Pemenuhannya terisi. Kategori tanpa peraturan ternilai tampil 0. Kategori teks bebas di luar master dihitung "Lainnya".
   - Tooltip: nama kategori dan "Rata-rata pemenuhan: N%". Batang tidak bisa diklik.

5. **Belum dinilai menurut lama sejak dicatat (hari)**
   - Bentuk: bar tiga batang oranye `#f59e0b`: "0-10", "11-20", ">20". Label sumbu X "Hari".
   - Isi: peraturan yang Tingkat Dampak-nya kosong, dikelompokkan menurut hari kalender sejak Tanggal Dicatat (hari ini dikurangi Tanggal Dicatat).
   - Catatan di info: notifikasi "Belum dinilai" memakai hari KERJA lebih dari 10 sehingga bisa sedikit berbeda dari grafik ini. Batang tidak bisa diklik.

6. **Peraturan belum dinilai** (tabel mini)
   - Kolom: `No`, `Peraturan`, `Dicatat` (dd/mm/yyyy), `Umur (hari)` (hari kalender). Isi sama dengan kartu 5. Paginasi 5 baris per halaman (tanpa pilihan ukuran), No melanjut antar halaman. Kosong: "Semua sudah dinilai". Klik baris membuka Detail.

7. **Peraturan Partial dan Gap per unit kerja terdampak**
   - Bentuk: bar horizontal bertumpuk. Sumbu Y: semua Unit Kerja di Master Data (seed 7: Internal Audit, Business, Operation, Information Technology, Compliance Legal & Risk Management, Support, Finance, Accounting, Tax & Treasury), termasuk yang nol. Seri Partial kuning `#f59e0b`, Gap merah `#ef4444`.
   - Aturan: satu peraturan dihitung di setiap unit yang tercantum pada Unit Kerja Terdampak. Panjang batang = Partial + Gap.
   - Klik batang: ke Table dengan filter Unit Kerja Terdampak = nama unit.

8. **Berlaku dalam 90 hari dan imbauan perlu dijawab** (tabel mini, satu baris penuh)
   - Kolom: `No`, `Tanggal`, `Jenis`, `Peraturan`, `Tentang`, `Sisa waktu`. Urut Tanggal terawal dulu. Paginasi 5 baris. Kosong: "Tidak ada agenda". Klik baris membuka Detail.
   - Sumber baris 1, Jenis "Berlaku": Tanggal Berlaku >= hari ini dan <= 90 hari lagi (semua Status Peraturan dan Jenis Perubahan, asal tidak dibatalkan). Tanggal = Tanggal Berlaku.
   - Sumber baris 2, Jenis "Imbauan": `Perlu Dijawab ke Regulator?` = Ya, Tanggal Dijawab kosong, Batas Waktu Jawaban terisi (termasuk yang batasnya sudah lewat). Tanggal = Batas Waktu Jawaban. Rumus tidak membatasi Jenis Perubahan = Imbauan; pembatasan hanya terjadi karena data (lihat Kondisi khusus).
   - Sisa waktu: "N hari lagi" atau "Lewat N hari". Merah bila Berlaku tinggal 7 hari atau kurang, atau Imbauan tinggal 1 hari atau kurang atau sudah lewat; selain itu kuning.

### Tab Table

- Kolom urut (setelah Nomor): `Peraturan / Surat` (format "{Jenis} {Nomor}/{Tahun}", mis. "PBI 23/2025"), `Regulator`, `Tentang`, `Jenis Perubahan`, `Status Peraturan` (pil), `Dampak` (pil, "-" bila kosong), `Pemenuhan` ("N%" atau "-"), `Status Kepatuhan` (pil), lalu `Tanggal Dibuat`, `Aksi`.
- Warna pil: Status Peraturan Berlaku hijau, Diubah kuning, Dicabut abu-abu, Dibatalkan abu-abu. Dampak Tinggi merah, Sedang kuning, Rendah hijau. Status Kepatuhan Comply hijau, Partial kuning, Gap merah, Belum Dinilai abu-abu.
- Paginasi, aksi baris, perilaku baris dibatalkan: lihat kit.
- Cari: placeholder "Cari nama/nomor peraturan, tentang, kategori". Mencari di nomor internal (`no`), nama peraturan ("Jenis Nomor/Tahun"), Tentang, Kategori.
- Filter (semua `select` satu nilai kecuali periode):
  1. "Periode (Tanggal Dicatat)" rentang tanggal; salah satu ujung boleh kosong.
  2. "Regulator": BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya. "Lainnya" mencakup teks bebas di luar daftar.
  3. "Jenis Perubahan": Baru, Perubahan, Pencabutan, Imbauan.
  4. "Status Kepatuhan": Comply, Partial, Gap, Belum Dinilai.
  5. "Unit Kerja Terdampak": daftar Master Data Unit Kerja.
  6. "Status Peraturan": Berlaku, Diubah, Dicabut, Dibatalkan.
- Tombol: `Filter`, `Export Excel`, `Tambah`. Siapa melihat: lihat bagian Peran.
- Export: nama file `Daftar_Peraturan_YYYY-MM-DD.xlsx`, sheet "Regulatory Change". Kolom (setelah Nomor dan Tanggal Dibuat) sesuai urutan form di bawah, ditambah "Status Kepatuhan" di antara "Pemenuhan (%)" dan "Tindak Lanjut", dan kolom bersyarat hanya terisi bila kondisinya terpenuhi. Tercatat di log. Tidak ada sensor.

### Form Tambah

Urutan isian persis seperti di form. Isian `Status Kepatuhan` tidak tampil di form (otomatis, hanya tampil di Table, Detail, Export).

| Label persis | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
|---|---|---|---|---|---|---|
| Jenis Peraturan / Surat | select | PBI, PADG, UU, Permen, Peraturan BSSN, Surat Edaran, Surat Imbauan (daftar tetap di kode) | Wajib | - | Selalu | "Jenis Peraturan / Surat wajib diisi" |
| Nomor Peraturan | text | - | Wajib | - | Selalu | "Nomor Peraturan wajib diisi". Unik: "{Jenis} {Nomor}/{Tahun} sudah ada" (kunci pada isian Nomor) |
| Tahun | text | - | Wajib | - | Selalu | "Tahun wajib diisi" |
| Regulator / Penerbit | select + Lainnya | BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya (daftar tetap di kode, BUKAN Master Data) | Wajib | - | Selalu | "Regulator / Penerbit wajib diisi"; Lainnya kosong: "Wajib diisi jika memilih Lainnya" |
| Tentang | textarea | - | Wajib | - | Selalu | "Tentang wajib diisi" |
| Kategori (Perihal / Fitur) | select + Lainnya | Master Data "Kategori Regulasi" + Lainnya | Wajib | - | Selalu | "Kategori (Perihal / Fitur) wajib diisi"; Lainnya kosong: "Wajib diisi jika memilih Lainnya" |
| Jenis Perubahan | select | Baru, Perubahan, Pencabutan, Imbauan | Wajib | - | Selalu | "Jenis Perubahan wajib diisi" |
| Status Peraturan | select | Berlaku, Diubah, Dicabut | Wajib | Nilai awal "Berlaku" | Selalu | "Status Peraturan wajib diisi". "Dibatalkan" tidak ada di pilihan (hanya lewat Batalkan) |
| Tanggal Terbit | date | - | Wajib | - | Selalu | "Tanggal Terbit wajib diisi" |
| Tanggal Berlaku | date | - | Wajib kecuali Jenis Perubahan = Imbauan | - | Selalu (bantuan: "Boleh kosong untuk Imbauan.") | "Tanggal Berlaku wajib diisi"; "Tanggal Berlaku tidak boleh sebelum Tanggal Terbit" |
| Tanggal Dicatat CLRM | date | - | Wajib | Nilai awal hari ini (bisa diubah) | Selalu | "Tanggal Dicatat CLRM wajib diisi" |
| Peraturan yang Diubah / Dicabut | select | Peraturan lain yang tidak dibatalkan, format "{Jenis} {Nomor}/{Tahun}" (dari data halaman ini sendiri) | Wajib | - | Hanya bila Jenis Perubahan = Perubahan atau Pencabutan | "Peraturan yang Diubah / Dicabut wajib diisi"; "Tidak boleh memilih peraturan itu sendiri" |
| Tingkat Dampak bagi Paydia | select | Tinggi, Sedang, Rendah | Wajib | - | Selalu (bantuan: "Wajib dinilai; Tanggal Sosialisasi hanya boleh diisi setelah dampak dinilai.") | "Tingkat Dampak bagi Paydia wajib diisi" |
| Uraian Dampak | textarea | - | Wajib | - | Selalu | "Uraian Dampak wajib diisi" |
| Unit Kerja Terdampak | multiselect (kotak centang) | Master Data "Unit Kerja" (tanpa Lainnya) | Wajib (minimal satu) | - | Selalu | "Unit Kerja Terdampak wajib diisi" |
| Pemenuhan (%) | persen (angka + "%") | 0 sampai 100 | Opsional | Bantuan: "Kosong = belum dinilai." | Selalu | "Pemenuhan (%) harus berupa angka"; "Pemenuhan (%) harus 0 sampai 100" |
| Tindak Lanjut | textarea (lebar) | - | Wajib bila Status Kepatuhan (dihitung dari Pemenuhan) Partial atau Gap, selain itu opsional | Bantuan: "Wajib bila Status Kepatuhan Partial atau Gap." | Selalu | "Tindak Lanjut wajib diisi" |
| Perlu Dijawab ke Regulator? | yesno (Ya/Tidak) | Ya, Tidak | Wajib bila Jenis Perubahan = Imbauan | - | Selalu (tampil juga untuk jenis non-Imbauan) | "Perlu Dijawab ke Regulator? wajib diisi" |
| Batas Waktu Jawaban | date | - | Wajib bila Perlu Dijawab = Ya | - | Hanya bila Perlu Dijawab = Ya | "Batas Waktu Jawaban wajib diisi" |
| Tanggal Dijawab | date | - | Opsional | - | Hanya bila Perlu Dijawab = Ya | "Tanggal Dijawab tidak boleh sebelum Tanggal Dicatat" (hanya diperiksa bila Batas Waktu Jawaban juga terisi) |
| Tanggal Sosialisasi Internal | date | - | Wajib | - | Selalu | "Tanggal Sosialisasi Internal wajib diisi" |
| SOP / Kebijakan yang Harus Diperbarui | multidrop (dropdown pilih banyak, chip dengan tombol hapus) | Semua SOP dari halaman SOP & Dokumen Kontrol, format "{No Dokumen} - {Judul} - {Pemilik Dokumen}" | Opsional, tidak memblokir simpan | Bantuan: "Opsional. Pilih satu atau lebih SOP dari daftar SOP; hapus dari daftar bila sudah diperbarui." | Selalu | Pilihan yang sudah dipilih hilang dari dropdown (tidak bisa ganda). Placeholder "Pilih..."; "Belum ada pilihan" bila SOP kosong |
| Lampiran / Bukti | file | PDF, JPG, JPEG, PNG, maks 25 MB, 1 file | Opsional | - | Selalu | Pesan upload kit |

Aturan lain:
- Keunikan: kombinasi Jenis + Nomor + Tahun tidak boleh sama (tidak peka huruf besar kecil) dengan peraturan lain yang tidak dibatalkan. Hanya diperiksa bila ketiganya terisi. Berlaku di Tambah dan Edit.
- Status yang tidak bisa dipilih saat tambah: "Dibatalkan" (tidak ada dalam daftar). "Dicabut" dan "Diubah" tetap bisa dipilih saat tambah (tidak ada pembatasan di kode).
- Tidak ada approval saat Tambah. Log: modul "Regulatory Change", aksi "Tambah", nomor = nama peraturan.
- [SELISIH PANDUAN] Panduan menyebut "Lampiran / Bukti" dalam daftar isian wajib, lalu menulis "tidak wajib" di paragraf upload. Kode: opsional.

### Edit

- Siapa boleh: tombol Edit tampil bila izin Ubah, baris tidak dibatalkan, tidak ada approval Menunggu, dan peran BUKAN PIC (`canEditRow`: PIC dikecualikan dari halaman ini). Tidak ada konsep "milik sendiri" di halaman ini.
- Kolom terkunci: tidak ada (semua isian bisa diubah), kecuali Status Kepatuhan yang otomatis.
- Alasan perubahan: isian opsional (textarea). Ikut tercatat di log dan di pengajuan approval.
- Perubahan yang memicu approval: perubahan pada isian identitas berikut membuat pengajuan "Perubahan Daftar Peraturan" ke Ketua SMKI: Jenis Peraturan / Surat, Nomor Peraturan, Tahun, Regulator / Penerbit, Tentang, Kategori, Jenis Perubahan, Status Peraturan, Tanggal Terbit, Tanggal Berlaku, Peraturan yang Diubah / Dicabut. Perubahan pada isian lain (Tanggal Dicatat CLRM, Tingkat Dampak, Uraian Dampak, Unit Kerja Terdampak, Pemenuhan, Tindak Lanjut, Perlu Dijawab, Batas Waktu Jawaban, Tanggal Dijawab, Tanggal Sosialisasi Internal, SOP, Lampiran) tersimpan langsung. Bila satu simpan memuat keduanya, isian non-identitas langsung berlaku dan isian identitas masuk approval.
- Selama approval Menunggu: nilai lama identitas tetap berlaku; tombol Edit dan Batalkan hilang untuk baris itu; Detail menampilkan kotak kuning dengan tautan ke menu Approval.

### Lihat Detail

- Perilaku kit. Semua isian ditampilkan sesuai kondisi tampil (Peraturan yang Diubah / Dicabut hanya untuk Perubahan/Pencabutan; Batas Waktu Jawaban dan Tanggal Dijawab hanya bila Perlu Dijawab = Ya), termasuk Status Kepatuhan (hasil hitung). SOP tampil sebagai daftar berpoin. Lampiran tampil sebagai nama dan ukuran (tidak bisa dibuka di mockup). Badge alert aktif di bagian atas. Tidak ada sensor atau tombol mata di halaman ini.

### Status dan transisi

- Status Peraturan (isian manual, bebas diganti saat Edit): Berlaku, Diubah, Dicabut. Tidak ada urutan transisi yang dipaksakan. Status berubah sebagai isian, bukan alur otomatis.
- Status otomatis: tidak ada perubahan Status Peraturan otomatis. Yang otomatis hanya Status Kepatuhan (rumus di kartu 3). Saat jenis = Pencabutan, status tidak otomatis menjadi Dicabut.
- Batalkan: dilakukan oleh peran dengan izin Cancel (lihat Peran), alasan wajib, status menjadi "Dibatalkan", status sebelumnya disimpan. Tidak bisa saat ada approval Menunggu. Data dibatalkan tidak dihitung di Dashboard, tidak memicu notifikasi, dan tidak bisa diedit.
- Kembalikan: peran dengan izin Cancel, alasan wajib, status kembali ke nilai sebelum dibatalkan.
- Peraturan dibatalkan tidak muncul sebagai pilihan "Peraturan yang Diubah / Dicabut" dan tidak dihitung dalam cek keunikan.

### Approval

- Pemicu: edit isian identitas (daftar di Edit). Jenis: "Perubahan Daftar Peraturan". Berlaku untuk semua perubahan identitas, tanpa syarat nilai.
- Approver: Ketua SMKI. Super Admin juga dapat memutuskan. Keputusan di menu Approval; wajib punya izin Approve modul dan `approval.update`.
- Setuju: nilai baru identitas diterapkan ke data. Tolak: catatan wajib ("Catatan wajib diisi saat Reject"); data tetap nilai lama dan bisa diedit lagi.
- Dicatat di log: "Ajukan approval" dengan perubahan lama -> baru dan alasan; keputusan "Approve" atau "Reject" dengan catatan.
- Tambah dan Batalkan tidak memerlukan approval.
- Seed approval: 4 pengajuan (2 Menunggu, 1 Disetujui, 1 Ditolak).

### Notifikasi / alert

Semua berbentuk notifikasi dalam dashboard. Data Dibatalkan tidak memicu. Format pesan memakai nama peraturan "{Jenis} {Nomor}/{Tahun}" sebagai subjek. "0 hari lagi" ditulis "hari ini", "1 hari lagi" ditulis "besok".

| Label alert di halaman | Judul notifikasi persis | Kondisi pemicu (rumus) | Warna | Penerima | Berhenti bila |
|---|---|---|---|---|---|
| Belum dinilai lebih dari 10 hari kerja | "Peraturan belum dinilai lebih dari 10 hari kerja" | Tingkat Dampak kosong DAN hari kerja (Senin-Jumat, tanpa libur nasional) dari Tanggal Dicatat ke hari ini > 10. Berlaku untuk semua Status Peraturan dan Jenis Perubahan | Kuning | Compliance Officer, Head CLRM | Tingkat Dampak diisi, atau data dibatalkan |
| Akan berlaku, kepatuhan belum terpenuhi | "Peraturan akan berlaku, kepatuhan belum terpenuhi" | Tanggal Berlaku terisi, selisih (Tanggal Berlaku - hari ini) antara 0 dan 90 hari, DAN Status Kepatuhan bukan Comply (Pemenuhan < 100 atau kosong). Aktif setiap hari dalam jendela 90 hari; "tahap" = pita terkecil dari 7, 30, 60, 90 yang memuat sisa hari | Kuning; merah bila sisa <= 7 hari (pita H-7) | PIC unit terdampak, Head CLRM | Pemenuhan mencapai 100, atau Tanggal Berlaku lewat, atau dibatalkan |
| Imbauan harus dijawab | "Imbauan harus dijawab" | Perlu Dijawab = Ya, Tanggal Dijawab kosong, Batas Waktu Jawaban terisi, DAN (Batas Waktu - hari ini) <= 7 hari (termasuk yang sudah lewat) | Kuning; merah bila batas sudah lewat (selisih < 0) | Compliance Officer, Head CLRM | Tanggal Dijawab diisi, atau Perlu Dijawab diubah, atau dibatalkan |
| Peraturan dicabut, SOP terkait perlu diperbarui | "Peraturan dicabut, SOP terkait perlu diperbarui" | Status Peraturan = Dicabut DAN Tanggal Berlaku < hari ini DAN daftar SOP / Kebijakan yang Harus Diperbarui masih berisi | Kuning | PIC unit terdampak, Compliance Officer | Semua SOP dihapus dari daftar, atau status bukan Dicabut, atau dibatalkan |
| Peraturan baru berdampak Tinggi | "Peraturan baru berdampak Tinggi" | Tingkat Dampak = Tinggi DAN (hari ini - Tanggal Dicatat) <= 7 hari, untuk jenis perubahan apa pun | Kuning | Head CLRM, Direktur terkait | Lewat 7 hari sejak Tanggal Dicatat, atau dampak diubah, atau dibatalkan |

Teks pesan persis (contoh pola):
- Belum dinilai: "{Peraturan} belum dinilai dampaknya, sudah {N} hari kerja sejak dicatat. Segera lakukan penilaian dampak."
- Akan berlaku: "{Peraturan} berlaku {N hari lagi | besok | hari ini}, tetapi status kepatuhan masih {Status}. Percepat pemenuhan sebelum tanggal berlaku." (detail badge: "Berlaku N hari lagi (tahap H-x), status kepatuhan {Status}")
- Imbauan: "{Peraturan}: batas jawaban {N hari lagi} . Segera siapkan jawaban." atau "{Peraturan}: batas jawaban sudah lewat {N hari}. Segera kirim jawaban." (detail badge: "N hari lagi sampai batas jawaban" atau "Lewat N hari dari batas jawaban")
- SOP: "{Peraturan} dicabut sejak {dd/mm/yyyy}. Ada {n} SOP terkait yang perlu diperbarui. Perbarui SOP tersebut, lalu hapus dari daftar SOP terkait pada peraturan ini."
- Tinggi: "{Peraturan} berdampak Tinggi, dicatat {dd/mm/yyyy}. Perlu perhatian segera."

Catatan penerima (kode): "PIC unit terdampak" dicocokkan ke SEMUA akun berperan PIC, tidak ke departemen peraturan. "Direktur terkait" tidak punya akun di mockup, hanya terlihat Super Admin. [SELISIH PANDUAN] Panduan dan teks `rule` alert menyebut tahap "H-90, 60, 30, 7" dan imbauan "H-7, H-3, H-1" seolah pemicu pada titik tertentu; kode memicu setiap hari dalam jendela, hanya warna dan label tahap yang berubah.

### Peran

Matriks default (`perms.ts`) dan perilaku efektif akun bawaan (izin per akun v2.14 turunan peran; hasil hitung kode). "Efektif" adalah apa yang benar-benar terlihat di mockup.

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Dashboard |
|---|---|---|---|---|---|---|---|
| Super Admin | Ya | Ya | Ya | Ya | Ya (semua) | Ya | Ya |
| Head CLRM | Ya | Tidak | Matriks Tidak; efektif Ya | Ya | Matriks Tidak; izin efektif ada, tetapi bukan approver jadi tidak bisa memutuskan | Ya | Ya |
| Compliance Officer | Ya | Ya | Ya | Matriks Tidak; efektif Ya | Tidak | Ya | Ya |
| Risk Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Legal Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | Ya (approver Perubahan Daftar Peraturan) | Ya | Ya |
| PIC | Ya | Matriks Tidak; efektif Ya | Matriks Ya, tetapi tombol Edit disembunyikan di halaman ini (efektif Tidak) | Matriks Tidak; efektif Ya | Tidak | Ya | Ya |
| Viewer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |

- "Milik sendiri": tidak berlaku di halaman ini.
- Buka sensor: tidak ada isian tersensor.
- Sejak v2.14, Super Admin dapat mengubah izin per akun di Admin > Manage Permissions. Izin berbentuk kategori (Compliance: view, create, update, export, approve, dashboard) dan berlaku sama untuk empat halaman Compliance. `update` mencakup Ubah dan Batalkan/Kembalikan sekaligus. Dengan izin akun bawaan: Head CLRM efektif bisa Ubah (karena memiliki Cancel di halaman Compliance mana pun), Compliance Officer dan PIC efektif bisa Batalkan (karena memiliki Ubah), PIC efektif bisa Tambah (karena PIC boleh Tambah di SOP). Ini berbeda dari panduan halaman.
- [SELISIH PANDUAN] Panduan: Head CLRM "Lihat, Batalkan/Kembalikan, Export"; Compliance Officer "Lihat, Tambah, Ubah, Export"; PIC "Lihat dan Export". Kode efektif berbeda seperti tabel. Agar PRD tidak ambigu, perlu keputusan: matriks default PRD sebaiknya merujuk matriks peran, bukan perilaku efektif ini.
- Tombol `Import Excel`: tidak tampil untuk siapa pun.

### Kondisi khusus dan prasyarat

- Kolom "Peraturan yang Diubah / Dicabut" hanya muncul (dan wajib) bila Jenis Perubahan = Perubahan atau Pencabutan. Pilihannya hanya peraturan lain yang tidak dibatalkan.
- "Tanggal Berlaku" wajib kecuali Jenis Perubahan = Imbauan.
- "Batas Waktu Jawaban" dan "Tanggal Dijawab" hanya muncul bila "Perlu Dijawab ke Regulator?" = Ya. "Perlu Dijawab" wajib hanya bila Jenis Perubahan = Imbauan, tetapi tampil untuk semua jenis. Agenda dan alert "Imbauan harus dijawab" tidak memeriksa Jenis Perubahan, hanya Perlu Dijawab = Ya. Seed hanya mengisi Perlu Dijawab untuk Imbauan.
- "Tindak Lanjut" wajib hanya bila Status Kepatuhan Partial atau Gap. Status Kepatuhan hanya bisa Partial/Gap bila Pemenuhan terisi di bawah 100.
- "Regulator" dan "Kategori" punya opsi Lainnya yang memunculkan isian teks wajib.
- Kartu dashboard Tren memakai semua data, tidak mengikuti Periode halaman.
- Alert "Akan berlaku" tidak aktif untuk peraturan tanpa Tanggal Berlaku (Imbauan).
- Alert "Peraturan dicabut, SOP..." hanya untuk Status Peraturan = Dicabut dengan Tanggal Berlaku sudah lewat dan daftar SOP tidak kosong.
- Notifikasi dan kartu agenda tidak membedakan Status Peraturan (Dicabut atau Diubah tetap bisa memicu alert "Akan berlaku" bila Tanggal Berlaku di masa depan).
- Tombol Edit/Batalkan hilang selama approval Menunggu. Baris dibatalkan tidak bisa diedit.
- Rujukan SOP disimpan sebagai teks label ("No - Judul - Pemilik"), bukan ID. Bila SOP diubah nomor, judul, atau pemiliknya, label di peraturan tidak ikut berubah. Pilihan dropdown mencakup semua SOP di halaman SOP, termasuk SOP berstatus Dicabut dan SOP yang dibatalkan (tidak difilter). Tidak ada tautan balik dari halaman SOP ke peraturan.
- Unit Kerja, Kategori Regulasi, dan PIC berasal dari Master Data; Regulator dan Jenis Peraturan bukan Master Data (daftar tetap di kode, regulator bisa Lainnya).

### Data contoh

30 peraturan. Regulator: BI 13, PPATK 5, Komdigi 5, Pemerintah-DPR 3, BSSN 3, Lainnya 1. Jenis Perubahan: Baru 16, Perubahan 7, Imbauan 5, Pencabutan 2. Status Peraturan: Berlaku 27, Diubah 1, Dicabut 2. Status Kepatuhan: Comply 9, Partial 6, Gap 10, Belum Dinilai 5. Dampak: Sedang 14, Rendah 9, Tinggi 5, kosong 2. Kategori: QRIS 6, Pelindungan Konsumen 6, Ketahanan Siber 6, APU PPT 5, SNAP 4, Lainnya 3. 9 peraturan punya daftar SOP (total 11 rujukan). Semua punya lampiran PDF contoh. Dibuat oleh "Rina Kartika". Seed bergantung pada tanggal hari ini (offset hari).

### Sumber kode

- `src/pages/RegChange.tsx`: INFO 24-90; konstanta dan aturan 92-108; isian 110-138; kolom 140-150; filter 152-159; alert 161-189; seed 191-245; konfigurasi, approval, validasi 247-266; Dashboard 268-303.
- `src/kit/PageShell.tsx`: tombol dan kondisi 45-75, filter periode 88-96. `src/kit/FormModal.tsx`: validasi 21-36, form 99-185. `src/kit/DataTable.tsx`, `DetailModal.tsx`, `exportXlsx.ts` 14-28, `notify.tsx` 74-83 dan 148-158.
- `src/kit/perms.ts` 14-77; `src/kit/store.tsx` update/approval 170-196, cancel/restore 197-208, `decideApproval` 219; `src/shared/Approval.tsx` 18.
- `src/guides/regchange.ts`.

### Selisih dengan keputusan final

Dibandingkan dengan bagian "Regulatory Change" dan "Umum" di file keputusan. Hanya dicatat, tidak dipilih.

1. Keputusan: "Dampak bagi Paydia memakai tingkat dampak saja." Mockup: Tingkat Dampak (Tinggi/Sedang/Rendah) PLUS isian wajib "Uraian Dampak" (textarea). Isian uraian tidak ada di keputusan.
2. Keputusan: Pemenuhan diisi manual dan opsional. Mockup: sama (persen 0-100, opsional), tetapi Status Kepatuhan (Comply/Partial/Gap/Belum Dinilai) dihitung otomatis dari Pemenuhan, dan "Tindak Lanjut" wajib bila Partial/Gap. Status Kepatuhan, ambang 70/100, dan Tindak Lanjut tidak disebut di keputusan.
3. Keputusan: "Departemen terdampak bisa lebih dari satu" dan semua kolom unit kerja bernama Departemen. Mockup: multi pilih sesuai, tetapi label "Unit Kerja Terdampak" dan Master Data bernama "Unit Kerja" (seed 7 nilai, termasuk "Internal Audit" dan "Business"). Nama "Departemen" belum dipakai.
4. Keputusan: SOP dipilih dari halaman SOP, format "Nomor SOP - Judul SOP - Departemen", bisa lebih dari satu, tidak memblokir simpan. Mockup: sesuai (format `{No Dokumen} - {Judul} - {Pemilik Dokumen}`), dropdown pilih banyak, opsional. Tambahan di mockup: alert "Peraturan dicabut, SOP terkait perlu diperbarui" dan perilaku "hapus dari daftar bila sudah diperbarui".
5. Keputusan: "Upload dokumen peraturan." Mockup: isian "Lampiran / Bukti", satu file, opsional; tidak bernama "Dokumen Peraturan". File tidak bisa dibuka di mockup.
6. Keputusan Umum: "Approval hanya untuk edit yang menurut CR butuh persetujuan: menutup temuan di Tracker, close case di Fraud, dan persetujuan lain yang ada di CR." Bagian Regulatory Change tidak menyebut approval. Mockup memiliki approval "Perubahan Daftar Peraturan" oleh Ketua SMKI untuk edit isian identitas. [Perlu konfirmasi apakah ini ada di CR.]
7. Fitur mockup yang tidak ada di keputusan: Jenis Perubahan (Baru/Perubahan/Pencabutan/Imbauan); Status Peraturan (Berlaku/Diubah/Dicabut); isian Peraturan yang Diubah / Dicabut; Tanggal Terbit, Tanggal Berlaku, Tanggal Dicatat CLRM; Tanggal Sosialisasi Internal (wajib); alur jawaban Imbauan (Perlu Dijawab, Batas Waktu Jawaban, Tanggal Dijawab); keunikan Jenis+Nomor+Tahun; Regulator/Kategori "Lainnya" teks bebas; daftar regulator tetap di kode (bukan Master Data); filter bulan khusus kartu Tren; kartu agenda; lima alert dan penerimanya (termasuk "Direktur terkait" tanpa akun); aturan Batalkan oleh Head CLRM dengan kembalikan.
8. Keputusan Umum: Master Data mencakup kategori regulasi, PIC, Departemen. Mockup: sesuai (Kategori Regulasi, Unit Kerja, PIC). Regulator dan Jenis Peraturan bukan bagian Master Data. PIC tidak dipakai sebagai isian halaman ini (tidak ada kolom PIC di Regulatory Change).
9. Keputusan Umum: "Setiap halaman punya tab Dashboard (tab pertama) dan tab Table." Mockup: sesuai, tetapi tab Dashboard tersembunyi bila akun tidak punya izin Dashboard.
10. Keputusan Umum: "Tidak ada fitur import di dashboard." Mockup: tombol Import Excel ada di kode tetapi dimatikan (tidak tampil). Matriks izin default masih memuat aksi "Import".
11. Keputusan Umum: file bukti opsional, PDF/JPG/JPEG/PNG, maks 25 MB, satu file. Mockup: sesuai.
12. Keputusan Umum: Batalkan wajib alasan, data tidak dihapus permanen. Mockup: sesuai, juga Kembalikan wajib alasan.
13. Keputusan Umum: Relasi antar halaman hanya Regulatory Change ke SOP. Mockup: sesuai (satu-satunya relasi lintas halaman yang saya temukan di dua halaman ini). Relasi satu arah: peraturan menyimpan label SOP; SOP tidak menampilkan peraturan terkait.

---

## SOP & Dokumen Kontrol (menu: Compliance > SOP & Dokumen Kontrol)

Rute: `compliance/sop-dokumen-kontrol`. Kunci izin: `sop`. Kata benda: "SOP". Awalan file export: `Daftar_SOP`. Status batal: "Dicabut" (bukan "Dibatalkan").

**Ringkasan tujuan.** Daftar SOP dan dokumen kontrol Paydia dengan pemilik, revisi, klasifikasi, retensi, file dokumen, dan jadwal peninjauan tahunan otomatis. Dipakai juga sebagai sumber pilihan SOP di Regulatory Change.

**Prasyarat akses.** Lihat halaman: izin Lihat. Dashboard: izin Dashboard. Table: izin Lihat. Detail per tombol di bagian Peran.

### Tab Dashboard

Filter global: "Periode Tanggal Berlaku" (dua tanggal, Reset). Menyaring semua kartu. SOP yang dibatalkan lewat Batalkan tidak dihitung. SOP berstatus "Dicabut" yang dipilih manual lewat Edit TETAP ikut kartu Total SOP, grafik per unit, per status, dan umur; tidak ikut hitungan peninjauan. Baris tanpa Tanggal Berlaku tidak ikut bila periode diisi.

1. **Ringkasan** (empat kartu angka, judul grup "Ringkasan", ikon info (i))
   - "Total SOP" (biru): jumlah SOP pada periode, apa pun statusnya.
   - "Aktif" (hijau): SOP berstatus Aktif. Klik membuka Table dengan filter Status = Aktif.
   - "Peninjauan akan tiba (≤ 30 hari)" (kuning bila > 0, abu-abu bila 0): SOP belum Dicabut dengan Tanggal Peninjauan Berikutnya 0 sampai 30 hari dari hari ini.
   - "Peninjauan terlewat" (merah bila > 0, abu-abu bila 0): SOP belum Dicabut dengan Tanggal Peninjauan Berikutnya sebelum hari ini.
   - Dua kartu terakhir tidak bisa diklik.
   - Info (i): "Empat angka ringkas dari SOP pada Periode yang dipilih (SOP Dibatalkan tidak dihitung)." plus penjelasan tiap kartu.

2. **SOP per unit kerja pemilik**
   - Bentuk: bar horizontal, satu seri "Jumlah". Sumbu Y: SEMUA Unit Kerja di Master Data, termasuk yang nol. Sumbu X: jumlah.
   - Isi: jumlah SOP per Pemilik Dokumen. Klik batang: ke Table dengan filter Pemilik Dokumen = unit itu. Tooltip bawaan.

3. **SOP per status**
   - Bentuk: donut. Irisan: Aktif, Dalam Review, Dicabut, dan "Belum diisi" bila Status kosong. Irisan nol disembunyikan. Warna memakai palet bawaan berdasarkan urutan irisan yang tampil (tidak tetap per status).
   - Tooltip: "{status}: {jumlah}" dan rincian jumlah per Unit Kerja pemilik, urut terbanyak.
   - Klik irisan: ke Table dengan filter Status = status itu. Irisan "Belum diisi" tidak bisa diklik.

4. **Umur dokumen (sejak Tanggal Berlaku)**
   - Bentuk: bar tiga batang: "< 1 tahun" hijau `#22c55e`, "1-2 tahun" kuning `#f59e0b`, "> 2 tahun" merah `#ef4444`.
   - Rumus: selisih hari (hari ini - Tanggal Berlaku). Di bawah 365 = "< 1 tahun"; 365 sampai 730 = "1-2 tahun"; di atas 730 = "> 2 tahun". Tanggal Berlaku kosong: tidak masuk kelompok mana pun. Tanggal Berlaku di masa depan masuk "< 1 tahun".
   - Tooltip: rincian per Unit Kerja pemilik. Klik batang: ke Table dengan filter Umur Dokumen = kelompok itu.

5. **SOP yang harus ditinjau (<= 30 hari atau lewat)** (tabel mini)
   - Kolom: `No`, `No Dokumen`, `Judul`, `Peninjauan` (dd/mm/yyyy), `Sisa`. Paginasi 5 baris. Urut Tanggal Peninjauan terawal. Kosong: "Tidak ada data".
   - Isi: gabungan SOP terlewat dan akan tiba (sama dengan dua kartu ringkasan). Sisa: merah tebal "Lewat N hari" bila terlewat; kuning "N hari" bila akan tiba. Klik baris membuka Detail SOP.

### Tab Table

- Kolom urut (setelah Nomor): `No Dokumen`, `Judul`, `Pemilik`, `Revisi`, `Tgl Perubahan` (dd/mm/yyyy), `Peninjauan Berikutnya` (dd/mm/yyyy atau "-"), `Status` (pil; "-" bila kosong), lalu `Tanggal Dibuat`, `Aksi`. Warna pil: Aktif hijau, Dalam Review kuning, Dicabut abu-abu.
- Cari: placeholder "Cari no dokumen, judul, ringkasan"; mencari di No Dokumen, Judul, Ringkasan.
- Filter (satu nilai, AND): "Pemilik Dokumen" (Master Data Unit Kerja), "Status" (Aktif, Dalam Review, Dicabut), "Tahun Berlaku" (daftar tahun yang ada di data, terbaru dulu), "Umur Dokumen" (< 1 tahun, 1-2 tahun, > 2 tahun).
- Filter Status = Dicabut mencakup SOP Dicabut manual dan SOP yang dibatalkan.
- Tombol: `Filter`, `Export Excel`, `Tambah`.
- Export: `Daftar_SOP_YYYY-MM-DD.xlsx`, sheet "SOP & Dokumen Kontrol". Kolom setelah Nomor dan Tanggal Dibuat: No Dokumen, Judul, Ringkasan (Key Point), Pemilik Dokumen, Tanggal Berlaku, Tanggal Perubahan Terakhir, No Revisi, Retensi, Klasifikasi, File Dokumen (nama file), Tanggal Peninjauan Berikutnya, Status, PIC Dokumen. Tercatat di log. Tidak ada sensor.

### Form Tambah

Urutan isian persis seperti di form.

| Label persis | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
|---|---|---|---|---|---|---|
| No Dokumen | text | - | Wajib | Bantuan: "Unik, contoh SOP-077-PAY." | Selalu | "No Dokumen wajib diisi"; unik (tidak peka huruf besar kecil, spasi pinggir diabaikan, dibandingkan dengan SOP lain termasuk yang dibatalkan): "No Dokumen sudah dipakai SOP {judul SOP lain}" |
| Judul | text (lebar) | - | Wajib | - | Selalu | "Judul wajib diisi" |
| Ringkasan (Key Point) | textarea (lebar) | - | Wajib | - | Selalu | "Ringkasan (Key Point) wajib diisi" |
| Pemilik Dokumen | select | Master Data "Unit Kerja" (tanpa Lainnya) | Wajib | - | Selalu | "Pemilik Dokumen wajib diisi" |
| Tanggal Berlaku | date | - | Wajib | Mengubahnya langsung mengisi ulang Tanggal Peninjauan Berikutnya | Selalu | "Tanggal Berlaku wajib diisi" |
| Tanggal Perubahan Terakhir | date | - | Wajib | - | Selalu | "Tanggal Perubahan Terakhir wajib diisi"; "Tanggal Perubahan tidak boleh sebelum Tanggal Berlaku" (kunci pada isian ini) |
| No Revisi | text | - | Wajib | Bantuan: "Contoh Rev.1, 2.1." | Selalu | "No Revisi wajib diisi" |
| Retensi | select | 5 Tahun, 10 Tahun (tanpa Permanen) | Wajib | - | Selalu | "Retensi wajib diisi" |
| Klasifikasi | select | Publik, Internal, Rahasia, Sangat Rahasia | Wajib | - | Selalu | "Klasifikasi wajib diisi" |
| File Dokumen | file (lebar) | PDF, JPG, JPEG, PNG, maks 25 MB, 1 file | Opsional | - | Selalu | Pesan upload kit |
| Tanggal Peninjauan Berikutnya | date, nonaktif | - | - | Otomatis = Tanggal Berlaku + 1 tahun kalender (29 Feb menjadi 28 Feb tahun berikutnya); bantuan "Otomatis: Tanggal Berlaku + 1 tahun."; dihitung ulang saat simpan apa pun isi form | Selalu | Tidak bisa diketik |
| Status | select | Aktif, Dalam Review, Dicabut | Wajib | Nilai awal "Aktif" | Selalu | "Status wajib diisi" |
| PIC Dokumen | select | Master Data "PIC" (seed: Regie, Fakhri, Osama) | Wajib | - | Selalu | "PIC Dokumen wajib diisi" |

Aturan lain:
- Status yang tidak bisa dipilih saat tambah: tidak ada pembatasan di kode (Dicabut dan Dalam Review boleh dipilih). Beda dengan Tracker.
- Tidak ada pilihan "Lainnya" di halaman ini. Tidak ada approval. Log "Tambah" memakai Judul sebagai nama.
- Isian "Status", "Tanggal Peninjauan Berikutnya", dan "PIC Dokumen" dulu boleh kosong lewat import (logika `notImport`); import sekarang dimatikan, jadi form selalu mewajibkan Status dan PIC.

### Edit

- Siapa boleh: izin Ubah, SOP tidak dibatalkan, dan (bila peran PIC) nama akun sama dengan PIC Dokumen SOP itu (tanpa peka huruf besar kecil). Peran lain dengan izin Ubah bisa mengedit SOP mana pun.
- Kolom terkunci: Tanggal Peninjauan Berikutnya (selalu nonaktif, diturunkan dari Tanggal Berlaku). Isian lain bisa diubah, termasuk No Dokumen dan Status.
- Alasan perubahan: opsional.
- Tidak ada perubahan yang memicu approval (halaman ini tidak memakai approval).
- Mengubah Tanggal Berlaku menghitung ulang Tanggal Peninjauan Berikutnya. Itulah satu-satunya cara memperbarui jadwal peninjauan di mockup (tidak ada tombol "tandai sudah ditinjau").
- SOP yang dibatalkan lewat Batalkan tidak bisa diedit sampai dikembalikan. SOP Dicabut manual masih bisa diedit.

### Lihat Detail

- Perilaku kit. Semua 13 isian ditampilkan (File Dokumen sebagai nama dan ukuran, tidak bisa dibuka). Badge alert aktif. Keterangan pembatalan (siapa, kapan, alasan, status sebelumnya) bila dibatalkan. Log Perubahan. Tidak ada sensor atau tombol mata.

### Status dan transisi

- Status (isian manual): Aktif, Dalam Review, Dicabut. Tidak ada urutan transisi yang dipaksakan. Kosong hanya mungkin pada data seed/lama.
- Status otomatis: tidak ada. Yang otomatis hanya Tanggal Peninjauan Berikutnya.
- "Dicabut" dari Edit: SOP masih bisa diedit, tetap masuk Total SOP, grafik, dan filter; tidak memicu alert peninjauan dan tidak masuk kartu, tabel peninjauan.
- Batalkan: peran dengan izin Cancel, alasan wajib. Status menjadi "Dicabut", `cancelled` terisi, SOP tidak bisa diedit, tidak masuk dashboard dan tidak memicu alert apa pun. Tombol Batalkan tidak tampil bila ada approval Menunggu (tidak relevan di sini).
- Kembalikan: peran dengan izin Cancel, alasan wajib, status kembali ke nilai sebelum dibatalkan (bukan otomatis Aktif).
- Pembedaan: Dicabut manual (Edit) berbeda dari Dicabut karena Batalkan. Di tabel keduanya tampil "Dicabut"; hanya yang dibatalkan berteks abu-abu dan punya tombol Kembalikan.

### Approval

- Tidak ada approval di halaman ini (tidak ada aturan approval; izin Approve tidak berdampak). Semua Tambah, Ubah, Batalkan, Kembalikan langsung berlaku.

### Notifikasi / alert

Semua berbentuk notifikasi dalam dashboard. SOP dibatalkan tidak memicu. SOP berstatus Dicabut (manual) tidak memicu alert "Peninjauan akan tiba" dan "Peninjauan terlewat", dan tidak memicu "Tanggal Peninjauan kosong" pada alert data tidak lengkap, tetapi tetap bisa memicu data tidak lengkap karena Status atau PIC kosong. Subjek pesan: "SOP {Judul}" (awalan "SOP" tidak digandakan bila judul sudah berawalan SOP). Referensi item: "{No Dokumen} - {Judul}".

| Label alert di halaman | Judul notifikasi persis | Kondisi pemicu (rumus) | Warna | Penerima | Berhenti bila |
|---|---|---|---|---|---|
| Peninjauan akan tiba | "Peninjauan SOP akan tiba"; bila sisa 0 hari: "Peninjauan SOP jatuh tempo hari ini" | Status bukan Dicabut DAN 0 <= (Tanggal Peninjauan Berikutnya - hari ini) <= 30 hari | Kuning | PIC Dokumen (`PIC (nama)`; bila PIC kosong: token `PIC Dokumen` yang cocok ke semua akun PIC), Compliance Officer | Tanggal Berlaku diubah sehingga peninjauan > 30 hari lagi, atau status Dicabut, atau dibatalkan |
| Peninjauan terlewat | "Peninjauan SOP terlewat" | Status bukan Dicabut DAN Tanggal Peninjauan Berikutnya < hari ini | Merah | PIC Dokumen (sama seperti di atas), Head CLRM | Tanggal Berlaku diubah sehingga peninjauan di masa depan, atau status Dicabut, atau dibatalkan |
| Data belum lengkap | "Data SOP belum lengkap" | (Status bukan Dicabut DAN Tanggal Peninjauan Berikutnya kosong) ATAU Status kosong ATAU PIC Dokumen kosong | Kuning | Compliance Officer | Semua isian terisi, atau dibatalkan |

Pesan persis:
- Akan tiba: "SOP {Judul} perlu ditinjau sebelum {dd/mm/yyyy} ({N hari lagi | besok}). Jadwalkan peninjauan." Bila hari ini: "SOP {Judul} harus ditinjau hari ini ({dd/mm/yyyy}). Segera lakukan peninjauan." Detail badge: "Peninjauan N hari lagi ({dd/mm/yyyy})".
- Terlewat: "SOP {Judul} melewati batas peninjauan {dd/mm/yyyy} selama {N} hari. Segera lakukan peninjauan." Detail badge: "Lewat peninjauan N hari".
- Tidak lengkap: "SOP {Judul} belum lengkap: {daftar kolom} belum diisi. Lengkapi datanya." Daftar kolom: "Tanggal Peninjauan", "Status", "PIC", dirangkai "a, b, dan c". Detail badge: "Belum diisi: ...".
- Jendela peringatan 30 hari adalah konstanta `REVIEW_WINDOW` = 30.

[SELISIH PANDUAN] Panduan SOP konsisten dengan kode untuk tiga alert ini. Catatan penerima: token `PIC (nama)` cocok ke akun dengan nama persis itu (mis. "Regie"), bukan ke semua PIC.

### Peran

Matriks default dan perilaku efektif akun bawaan (hasil hitung kode):

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Dashboard |
|---|---|---|---|---|---|---|---|
| Super Admin | Ya | Ya | Ya | Ya | Ya (tanpa dampak, tidak ada approval) | Ya | Ya |
| Head CLRM | Ya | Tidak | Matriks Tidak; efektif Ya | Ya | Tidak berdampak | Ya | Ya |
| Compliance Officer | Ya | Ya | Ya | Matriks Tidak; efektif Ya | Tidak | Ya | Ya |
| Risk Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Legal Officer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Fraud Investigator | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |
| Ketua SMKI | Ya | Tidak | Tidak | Tidak | Tidak berdampak | Ya | Ya |
| PIC | Ya | Ya | Milik sendiri (hanya SOP dengan PIC Dokumen = nama akun) | Matriks Tidak; efektif Ya | Tidak | Ya | Ya |
| Viewer | Ya | Tidak | Tidak | Tidak | Tidak | Ya | Ya |

- "Milik sendiri": hanya untuk Ubah oleh PIC. Cek berupa kecocokan nama akun dengan nilai PIC Dokumen (tidak peka huruf besar kecil). Tambah oleh PIC tidak dibatasi (bisa memilih PIC Dokumen siapa pun).
- Buka sensor: tidak ada.
- Sejak v2.14 izin per akun dapat diubah di Admin > Manage Permissions (kategori Compliance, lihat bagian kit). `update` mencakup Ubah dan Batalkan/Kembalikan sekaligus, sehingga Head CLRM efektif bisa Ubah, Compliance Officer dan PIC efektif bisa Batalkan.
- [SELISIH PANDUAN] Panduan: Head CLRM "Lihat, Export, Batalkan"; Compliance Officer "Lihat, Tambah, Ubah, Export"; PIC "Lihat, Tambah, Ubah (hanya SOP miliknya), Export". Perilaku efektif menambah Ubah untuk Head CLRM dan Batalkan untuk Compliance Officer dan PIC.
- Tombol Import tidak tampil untuk siapa pun.

### Kondisi khusus dan prasyarat

- Tanggal Peninjauan Berikutnya selalu = Tanggal Berlaku + 1 tahun, tidak bisa diketik, dihitung ulang saat Tanggal Berlaku berubah dan saat simpan. Kosong bila Tanggal Berlaku kosong (hanya seed).
- Alert peninjauan hanya untuk SOP yang status bukan "Dicabut" dan tidak dibatalkan.
- Tombol Edit untuk peran PIC hanya muncul di SOP dengan PIC Dokumen = namanya.
- Tombol Kembalikan hanya muncul pada SOP yang dibatalkan lewat Batalkan.
- Kartu "Peninjauan akan tiba" menjadi kuning hanya bila > 0; "Peninjauan terlewat" menjadi merah hanya bila > 0.
- Irisan "Belum diisi" pada donut status muncul hanya bila ada SOP dengan Status kosong.
- Tooltip rincian per Unit Kerja ada di donut status dan bar umur, tidak di bar unit kerja.
- Pilihan Pemilik Dokumen dan PIC Dokumen berasal dari Master Data; nilai yang dihapus dari master tetap tersimpan di data lama.
- SOP dengan Retensi lama "Permanen" dipetakan ke "10 Tahun" saat data dimuat. Klasifikasi di luar empat pilihan dipetakan ke "Internal" saat data dimuat.
- Daftar SOP ini menjadi sumber dropdown di Regulatory Change, termasuk SOP yang Dicabut atau dibatalkan.

### Data contoh

25 SOP. Status: Aktif 19, Dalam Review 4, Dicabut 1, kosong 1. Pemilik: Compliance Legal & Risk Management 6, Information Technology 6, Operation 5, Support 3, Finance 3, Business 2. Retensi: 5 Tahun 14, 10 Tahun 11. Klasifikasi: Internal 9, Publik 9, Rahasia 5, Sangat Rahasia 2. PIC: Regie 9, Fakhri 8, Osama 7, kosong 1. Tiga SOP sengaja tidak lengkap (satu tanpa Tanggal Berlaku dan peninjauan, satu tanpa PIC, satu tanpa Status) untuk alert "Data belum lengkap". Tanggal Peninjauan seed tersebar dari lewat 40 hari sampai 360 hari ke depan. Nomor: SOP-071-PAY sampai SOP-095-PAY.

### Sumber kode

- `src/pages/Sop.tsx`: helper dan aturan 10-33; isian 36-50; kolom 52-60; filter 62-68; alert 70-87; konfigurasi, izin baris, onChange/beforeSave, validasi 89-106; Dashboard 108-135.
- `src/pages/sop.shared.ts`: tipe 4-10; `addYear` 12-18; `sopLabel` 20; seed 22-71.
- `src/kit/notify.tsx` 56 (`sopTitle`), 88-93, 148-158. `src/kit/store.tsx` 54-58 (migrasi retensi dan klasifikasi). `src/kit/perms.ts` 14-77.
- `src/guides/sop.ts`.

### Selisih dengan keputusan final

Dibandingkan dengan bagian "SOP & Dokumen Kontrol" dan "Umum".

1. Keputusan: "Dokumen SOP diunggah, bukan link." Mockup: sesuai (isian "File Dokumen", file); tetapi OPSIONAL, bukan wajib, dan file tidak bisa dibuka di mockup.
2. Keputusan: "Klasifikasi dari SOP dokumen kontrol (ISO); saat ini semua Internal." Mockup: isian wajib "Klasifikasi" dengan empat pilihan (Publik, Internal, Rahasia, Sangat Rahasia), seed bercampur (bukan semua Internal). Pilihan tidak dikunci ke Internal.
3. Keputusan: "Retensi 5 atau 10 tahun, tanpa permanen." Mockup: sesuai (5 Tahun, 10 Tahun; Permanen dihapus dan data lama dipetakan ke 10 Tahun).
4. Keputusan: "Tanggal review berikutnya otomatis tanggal berlaku + 1 tahun, berubah bila tanggal berlaku diedit. Alert 30 hari sebelumnya." Mockup: sesuai (otomatis, nonaktif, 30 hari, kuning). Label mockup: "Tanggal Peninjauan Berikutnya" (istilah "peninjauan", bukan "review"; status "Dalam Review" tetap memakai kata review).
5. Fitur mockup di luar keputusan: alert "Peninjauan terlewat" (merah, penerima PIC Dokumen dan Head CLRM); alert "Data belum lengkap"; isian Ringkasan (Key Point), No Revisi, Tanggal Perubahan Terakhir, PIC Dokumen, Status (Aktif/Dalam Review/Dicabut); grafik Umur dokumen, SOP per status, SOP per unit pemilik; filter Tahun Berlaku dan Umur Dokumen; aturan PIC hanya mengedit SOP miliknya; keunikan No Dokumen.
6. Keputusan Umum: "Semua kolom unit kerja bernama Departemen." Mockup: "Pemilik Dokumen" dan filter dipilih dari Master Data bernama "Unit Kerja" (7 nilai). Judul kolom/isian "Departemen" tidak dipakai. Format rujukan di Regulatory Change memakai nama Pemilik Dokumen sebagai bagian ketiga ("Nomor SOP - Judul SOP - Departemen" di keputusan).
7. Keputusan Umum: "Approval hanya untuk edit yang butuh persetujuan." Mockup SOP: tanpa approval (sejalan).
8. Keputusan Umum: Batalkan wajib alasan, data tidak dihapus permanen. Mockup: sesuai; status hasil Batalkan bernama "Dicabut" (sama dengan nilai status manual "Dicabut", dibedakan hanya lewat penanda dibatalkan).
9. Keputusan Umum: "Tidak ada fitur import." Mockup: tombol Import dimatikan; sisa logika "import boleh membawa baris tidak lengkap" masih ada di kode (alasan alert "Data belum lengkap").
10. Keputusan Umum: file bukti opsional, format PDF/JPG/JPEG/PNG, 25 MB, satu file. Mockup: sesuai.
11. Keputusan Umum: Relasi antar halaman hanya Regulatory Change ke SOP. Mockup: sesuai; SOP adalah sisi sumber, tanpa tampilan balik peraturan terkait.
12. Keputusan Umum: Master Data mencakup PIC dan Departemen. Mockup: sesuai (PIC dan Unit Kerja); "Klasifikasi" dan "Retensi" adalah daftar tetap di kode, bukan Master Data.

---

## Relasi Regulatory Change ke SOP (ringkasan lintas halaman)

- Arah: Regulatory Change memilih SOP dari halaman SOP. SOP tidak menyimpan atau menampilkan peraturan terkait.
- Sumber pilihan: semua SOP di modul SOP saat form dibuka (tanpa filter status), diformat "{No Dokumen} - {Judul} - {Pemilik Dokumen}", mis. "SOP-071-PAY - Penerimaan Merchant QRIS - Business".
- Penyimpanan: daftar teks label pada isian "SOP / Kebijakan yang Harus Diperbarui". Tidak ada ID, jadi label bisa usang bila SOP diubah. Tidak diperiksa saat simpan; tidak memblokir simpan; tidak ada validasi bahwa SOP masih ada.
- Siapa mengisi: pengguna yang bisa Tambah/Edit peraturan (praktis Compliance Officer, Super Admin; lihat Peran). Isian ini tidak masuk approval; tersimpan langsung.
- Efek: alert "Peraturan dicabut, SOP terkait perlu diperbarui" (Status Peraturan = Dicabut, Tanggal Berlaku sudah lewat, daftar SOP masih berisi). Penghapusan SOP dari daftar oleh pengguna menandai "sudah diperbarui" dan mematikan alert. Tidak ada status "sudah diperbarui" per SOP, dan tidak ada pemicu otomatis pada halaman SOP.
- Seed: hanya peraturan Perubahan/Pencabutan yang diberi daftar SOP; pasangan peraturan-SOP deterministik dari indeks.

---

## Catatan ketidakpastian dan hal untuk dikonfirmasi

- [tidak pasti: versi] `package.json` mencatat versi 2.12.1, sedangkan riwayat git terbaru menyebut v2.14.4. Dokumen ini mengikuti kode di branch saat dibaca.
- [tidak pasti: tujuan] Perilaku efektif izin per akun (Head CLRM bisa Ubah, Compliance Officer dan PIC bisa Batalkan, PIC bisa Tambah di Regulatory Change) sudah diverifikasi dengan menjalankan `permsOf` dan `canAccount` (lihat `00-index.md` bagian E). Yang tidak pasti hanya tujuannya: perilaku ini tampak sebagai akibat pemetaan kategori Compliance, bukan keputusan desain eksplisit. Panduan halaman masih memakai matriks peran lama. PRD perlu memilih salah satu sebagai default.
- Pusat notifikasi memeriksa Lihat memakai matriks peran default, sedangkan tombol halaman memakai izin akun. Bila izin akun diubah, keduanya bisa tidak sinkron.
- Log aktivitas nyata mencatat Tambah, Ubah, Batalkan, Kembalikan, Export, pengajuan dan keputusan approval. Membuka Detail tidak dicatat, walau data seed halaman Log memuat contoh "view-detail". Perlu cek halaman Log (di luar scope) bila PRD membutuhkannya.
