import type { GuideItem } from '../kit/PageGuide'

export const KontrakGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Lihat enam kartu masa berlaku kontrak, grafik, dan daftar kontrak yang segera berakhir.</li>
<li>Atur <b>Periode Tanggal Mulai</b> bila perlu. Kosongkan kedua tanggal untuk melihat semua data.</li>
<li>Klik kartu atau batang grafik untuk membuka tab <b>Table</b> yang sudah terfilter. Atau buka tab <b>Table</b> langsung.</li>
<li>Klik <b>Tambah</b>, lalu isi semua isian bertanda *. <b>File Perjanjian</b> boleh dikosongkan. Klik <b>Simpan</b>.</li>
<li>Klik <b>Edit</b> pada baris untuk mengubah data. Alasan perubahan boleh diisi untuk dicatat di Log Perubahan.</li>
<li>Head CLRM dapat <b>Batalkan</b> kontrak yang salah (alasan wajib) dan <b>Kembalikan</b> bila perlu.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang tampil di tabel.</li>
</ol>` },
  { h: 'Dashboard', b: `<p>Dashboard menghitung kontrak yang tidak <b>Dibatalkan</b>. Filter <b>Periode Tanggal Mulai</b> di atas dashboard membatasi data menurut Tanggal Mulai kontrak. Kosong berarti semua data.</p>
<ul>
<li><b>Enam kartu masa berlaku</b>: Aktif lebih dari 90 hari, berakhir 60 sampai 90 hari, berakhir 30 sampai 60 hari, berakhir 30 hari atau kurang, Expired, dan Tanggal Berakhir kosong. Klik kartu untuk membuka Table dengan filter <b>Kelompok masa berlaku</b>.</li>
<li>Kontrak berstatus Draft, Review, Diperpanjang, atau Berakhir yang punya Tanggal Berakhir tidak masuk kartu mana pun.</li>
<li><b>Kontrak per jenis dokumen</b>: batang mendatar, klik batang untuk membuka Table terfilter Jenis Dokumen.</li>
<li><b>Kontrak baru per bulan</b>: garis jumlah kontrak menurut bulan Tanggal Mulai. Grafik ini punya filter <b>Periode</b> sendiri (bawaan 12 bulan terakhir) dan tidak ikut Periode halaman.</li>
<li><b>Kontrak berakhir dalam 90 hari</b>: tabel kecil, terdekat dulu, 5 baris per halaman. Klik baris untuk membuka Detail.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah posisi baris (1, 2, 3, ...), bukan ID data. Nomor berlanjut antar halaman.</li>
<li>Urutan tabel: <b>Tanggal Dibuat</b> terbaru dulu. Tabel tidak bisa diurutkan per kolom.</li>
<li><b>Pencarian</b> mencari di Nama Mitra / Merchant, Nomor PKS / NDA, dan Jenis Dokumen.</li>
<li><b>Filter</b>: Periode (Tanggal Mulai), Jenis Hubungan, Jenis Dokumen, Status, PIC / Unit, Bidang Usaha, dan Kelompok masa berlaku. Pilihan Status memuat juga <b>Dibatalkan</b>.</li>
<li>Tabel menampilkan data Dibatalkan (teks abu-abu). Dashboard dan alert tidak menghitungnya.</li>
<li>Pagination: 10, 25, atau 50 baris per halaman. Mengubah pencarian atau filter mengembalikan ke halaman 1.</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib</b> (bertanda *): Jenis Hubungan, Nomor PKS / NDA, Jenis Dokumen, Tanggal Mulai, Perpanjangan, dan Status. <b>File Perjanjian</b> boleh dikosongkan.</p>
<ul>
<li><b>Nama Mitra</b> tampil bila Jenis Hubungan bukan Merchant. Isinya dropdown dari master Mitra Vendor.</li>
<li><b>Nama Merchant</b> tampil bila Jenis Hubungan = Merchant. Isinya teks bebas.</li>
<li>Mengganti Jenis Hubungan mengosongkan isian nama yang tidak cocok lagi.</li>
<li><b>Lama Perpanjangan (bulan)</b> tampil dan wajib bila Perpanjangan = Otomatis atau Manual. Minimal 1 bulan.</li>
<li><b>PIC</b> atau <b>Unit Pemilik</b>: salah satu wajib diisi.</li>
<li><b>Dokumen Induk</b> berupa isian teks bebas (mis. nomor PKS induk), wajib bila Jenis Dokumen = Amandemen. Tidak boleh sama dengan Nomor PKS / NDA kontrak itu sendiri.</li>
<li><b>Nomor PKS / NDA</b> harus unik (huruf besar atau kecil dianggap sama, kontrak dibatalkan diabaikan).</li>
<li><b>Tanggal Berakhir</b> boleh kosong, tetapi muncul di kartu dan alert "Tanggal berakhir kontrak belum diisi". Tidak boleh sebelum Tanggal Mulai.</li>
<li><b>Jenis Dokumen</b> dipilih dari Master Data <b>Jenis PKS Kontrak</b> (ditambah Lainnya).</li>
<li><b>Lainnya</b>: pada Jenis Hubungan, Jenis Dokumen, dan Bidang Usaha, memilih Lainnya memunculkan isian teks bebas yang wajib diisi. Tabel menampilkan "Lainnya", Detail dan Export menampilkan teks aslinya. Grafik per Jenis Dokumen menghitung teks bebas sebagai Lainnya.</li>
<li><b>File Perjanjian</b>: PDF, JPG, JPEG, atau PNG. Maksimal 25 MB, satu file.</li>
<li><b>Sisa Hari</b> terisi otomatis dari Tanggal Berakhir. <b>Status</b> Aktif atau Akan Berakhir berubah otomatis: lewat tanggal menjadi Expired, sisa 90 hari atau kurang menjadi Akan Berakhir, selebihnya Aktif. Status lain (Draft, Review, Diperpanjang, Berakhir, Expired) tidak diubah otomatis.</li>
<li><b>Alasan perubahan</b> di form Edit bersifat opsional pada halaman ini.</li>
<li>Halaman ini tidak memakai approval. Perubahan langsung tersimpan.</li>
<li><b>Siapa boleh</b>: Tambah oleh Legal Officer. Edit oleh Legal Officer dan PIC. PIC hanya boleh mengedit kontrak yang PIC-nya namanya sendiri atau Unit Pemilik-nya sama dengan unitnya, dan hanya isian <b>Tanggal Berakhir, Perpanjangan, Lama Perpanjangan, dan Status</b>. Isian lain terkunci.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib diisi.</li>
<li>Status berubah menjadi <b>Dibatalkan</b>. Data tidak bisa diedit, tidak masuk dashboard, dan tidak memicu alert.</li>
<li>Tombol <b>Kembalikan</b> mengembalikan status sebelum dibatalkan. Alasan wajib diisi.</li>
<li>Pembatalan dan pengembalian tercatat di Log Perubahan dan menu Log.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk melihat semua isian, termasuk Sisa Hari dan Kelengkapan. Badge alert yang sedang aktif tampil di atas Detail.</li>
<li>Bagian <b>Log Perubahan</b> mencatat: data dibuat, perubahan data (kolom sebelum dan sesudah), pembatalan, dan pengembalian. Setiap entri memuat siapa, kapan, dan alasan bila diisi.</li>
<li>Terbaru di atas.</li>
</ul>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung.</p>
<ul>
<li><b>Kontrak akan berakhir</b>: muncul bila kontrak Aktif atau Akan Berakhir punya sisa 0 sampai 90 hari. <b>Kuning</b> bila sisa lebih dari 30 hari, <b>merah</b> bila 30 hari atau kurang. Penerima: Legal Officer dan PIC kontrak. Pengingat berlaku pada tahap H-90, H-60, H-30, dan H-7.</li>
<li><b>Kontrak kedaluwarsa belum diperpanjang</b>: muncul bila status Expired, atau Tanggal Berakhir sudah lewat. <b>Merah</b>. Penerima: Legal Officer dan Head CLRM.</li>
<li><b>Tanggal berakhir kontrak belum diisi</b>: muncul bila Tanggal Berakhir belum diisi (kecuali status Berakhir atau Dibatalkan). <b>Kuning</b>. Penerima: Legal Officer.</li>
</ul>` },
  { h: 'Export Excel', b: `<ul>
<li>Tombol <b>Export Excel</b> mengekspor baris yang tampil di tabel, sesuai pencarian dan filter saat itu. Baris Dibatalkan ikut terekspor bila tampil.</li>
<li>Kolom: Nomor (posisi baris), Tanggal Dibuat, lalu semua isian yang tampil di Detail, termasuk Sisa Hari.</li>
<li>Nama file: <b>Kontrak_[tanggal hari ini].xlsx</b>.</li>
<li>Setiap export tercatat di menu Log beserta jumlah barisnya.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<p>Berikut matriks bawaan. Super Admin dapat mengubahnya di Admin &gt; Permission.</p>
<ul>
<li><b>Super Admin</b>: Lihat, Tambah, Ubah, Batalkan/Kembalikan, Export.</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Export.</li>
<li><b>Legal Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Ubah (terbatas, lihat bagian Tambah &amp; Edit), Export.</li>
<li><b>Compliance Officer, Risk Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
<li>Approve tidak dipakai di halaman ini.</li>
</ul>` },
]
