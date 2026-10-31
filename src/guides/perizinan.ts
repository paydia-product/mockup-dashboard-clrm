import type { GuideItem } from '../kit/PageGuide'

export const PerizinanGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Lihat jumlah izin yang kedaluwarsa dalam 180 hari, dokumen per kategori, dan daftar tanggal kedaluwarsa.</li>
<li>Atur <b>Periode Tanggal Terbit</b> bila perlu. Kosongkan kedua tanggal untuk melihat semua data.</li>
<li>Klik kartu atau irisan untuk membuka tab <b>Table</b> yang sudah terfilter. Atau buka tab <b>Table</b> langsung.</li>
<li>Klik <b>Tambah</b>, lengkapi isian wajib, lalu <b>Simpan</b>. <b>File Dokumen</b> boleh dikosongkan.</li>
<li>Untuk memperbarui data, klik <b>Edit</b>. Untuk izin yang diperpanjang, pilih <b>Perpanjang izin = Ya</b> di form Edit.</li>
<li>Head CLRM dapat <b>Batalkan</b> dokumen (status menjadi Tidak Berlaku, alasan wajib) dan <b>Kembalikan</b> bila perlu.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang tampil di tabel.</li>
</ol>` },
  { h: 'Dashboard', b: `<p>Dashboard menghitung dokumen yang tidak <b>Dibatalkan</b> dan tidak berstatus <b>Tidak Berlaku</b>. Filter <b>Periode Tanggal Terbit</b> membatasi data menurut Tanggal Terbit. Kosong berarti semua data.</p>
<ul>
<li><b>Izin kedaluwarsa dalam 180 hari</b>: kartu jumlah dokumen yang sisa harinya 0 sampai 180 dan belum berstatus Kedaluwarsa. Merah bila ada yang 90 hari atau kurang, kuning bila ada yang 91 sampai 180 hari, abu-abu bila nol. Klik kartu untuk membuka Table terfilter 180 hari atau kurang.</li>
<li><b>Dokumen per kategori</b>: diagram donat Akta + SK, Izin, dan Legalitas Lainnya. Klik irisan untuk membuka Table terfilter Kategori.</li>
<li><b>Daftar izin dan tanggal kedaluwarsa</b>: tabel kecil, kedaluwarsa terdekat dulu (yang sudah lewat paling atas), 5 baris per halaman. Klik baris untuk membuka Detail.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah posisi baris (1, 2, 3, ...), bukan ID data. Nomor berlanjut antar halaman.</li>
<li>Urutan tabel: <b>Tanggal Dibuat</b> terbaru dulu. Tabel tidak bisa diurutkan per kolom.</li>
<li>Kolom <b>Sisa Hari</b> berwarna: merah bila 90 hari atau kurang (atau sudah lewat), kuning bila 91 sampai 180 hari, hijau bila lebih dari 180 hari.</li>
<li><b>Pencarian</b> mencari di Nama Dokumen, Nomor Dokumen, dan Penerbit.</li>
<li><b>Filter</b>: Kategori, Status (memuat juga <b>Tidak Berlaku</b>), PIC, dan Kelompok Masa Berlaku (180 hari atau kurang, Kedaluwarsa, 90 hari atau kurang, 91 sampai 180 hari, lebih dari 180 hari).</li>
<li>Tabel menampilkan data Tidak Berlaku (teks abu-abu bila dibatalkan). Dashboard dan alert tidak menghitungnya.</li>
<li>Pagination: 10, 25, atau 50 baris per halaman. Mengubah pencarian atau filter mengembalikan ke halaman 1.</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib</b> (bertanda *): Kategori Dokumen, Nama Dokumen, Nomor Dokumen, Penerbit, Tanggal Terbit, Tanggal Berlaku, PIC, dan Status. <b>Tanggal Kedaluwarsa</b>, <b>Nomor Versi</b>, dan <b>File Dokumen</b> boleh dikosongkan (dokumen tanpa Tanggal Kedaluwarsa tidak muncul di kartu dan notifikasi kedaluwarsa).</p>
<p><b>Kategori Dokumen</b> dipilih dari Master Data <b>Kategori Dokumen Perizinan</b>.</p>
<ul>
<li>Field opsional: Tanggal Review dan Kewajiban Pelaporan terkait Izin (teks bebas).</li>
<li>Tanggal Kedaluwarsa tidak boleh sebelum Tanggal Berlaku.</li>
<li><b>Status</b> pilihan: Aktif, Dalam Perpanjangan, Kedaluwarsa. Dokumen Aktif yang Tanggal Kedaluwarsa-nya terlewat otomatis tampil <b>Kedaluwarsa</b>.</li>
<li><b>File Dokumen</b>: PDF, JPG, JPEG, atau PNG. Maksimal 25 MB, satu file.</li>
<li><b>Data Pribadi Direksi &amp; Komisaris</b> tidak disimpan di dashboard. Detail hanya menampilkan catatan tetap.</li>
<li>Halaman ini tidak memakai approval dan tidak ada field yang wajib alasan. Alasan perubahan bersifat opsional.</li>
<li><b>Siapa boleh</b>: Tambah oleh Legal Officer. Edit oleh Legal Officer dan PIC. PIC hanya boleh mengedit dokumen yang PIC-nya namanya sendiri. Dokumen Tidak Berlaku tidak bisa diedit.</li>
</ul>` },
  { h: 'Perpanjang izin', b: `<p>Field <b>Perpanjang izin</b> hanya ada di form Edit. Pilih <b>Ya</b> untuk memperpanjang.</p>
<ol>
<li>Isi <b>Tanggal Berlaku</b> baru dan <b>Tanggal Kedaluwarsa</b> baru. Tanggal Kedaluwarsa harus berbeda dari yang lama.</li>
<li>Isi <b>Nomor Versi</b> baru. Harus berbeda dari versi lama.</li>
<li>Klik <b>Simpan</b>. Status otomatis menjadi <b>Aktif</b>.</li>
</ol>
<p>Data versi lama (versi, tanggal berlaku, tanggal kedaluwarsa, nama file) disimpan di <b>Versi Sebelumnya</b> dan tampil di Detail.</p>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib diisi.</li>
<li>Status berubah menjadi <b>Tidak Berlaku</b>. Data tidak bisa diedit, tidak masuk dashboard, dan tidak memicu alert.</li>
<li>Tombol <b>Kembalikan</b> mengembalikan status sebelum dibatalkan. Alasan wajib diisi.</li>
<li>Pembatalan dan pengembalian tercatat di Log Perubahan dan menu Log.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk melihat semua field, termasuk Versi Sebelumnya. Badge alert yang sedang aktif tampil di atas Detail.</li>
<li>Bagian <b>Log Perubahan</b> mencatat: data dibuat, perubahan data (kolom sebelum dan sesudah), pembatalan, dan pengembalian. Setiap entri memuat siapa, kapan, dan alasan bila diisi.</li>
<li>Terbaru di atas.</li>
</ul>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung. Notifikasi hanya muncul untuk dokumen yang statusnya bukan Tidak Berlaku dan yang punya Tanggal Kedaluwarsa.</p>
<ul>
<li><b>Izin akan kedaluwarsa</b>: muncul bila sisa 0 sampai 180 hari dan status belum Kedaluwarsa. <b>Kuning</b> bila 91 sampai 180 hari, <b>merah</b> bila 90 hari atau kurang. Penerima: Legal Officer dan Head CLRM.</li>
<li><b>Izin kedaluwarsa belum diperpanjang</b>: muncul bila Tanggal Kedaluwarsa sudah lewat dan status bukan Dalam Perpanjangan. <b>Merah</b>. Penerima: Legal Officer, Head CLRM, dan Direksi.</li>
</ul>` },
  { h: 'Export Excel', b: `<ul>
<li>Tombol <b>Export Excel</b> mengekspor baris yang tampil di tabel, sesuai pencarian dan filter saat itu. Baris Tidak Berlaku ikut terekspor bila tampil.</li>
<li>Kolom: Nomor (posisi baris), Tanggal Dibuat, lalu semua field yang tampil di Detail. Field <b>Perpanjang izin</b> tidak diekspor.</li>
<li>Nama file: <b>Perizinan_Legalitas_[tanggal hari ini].xlsx</b>.</li>
<li>Setiap export tercatat di menu Log beserta jumlah barisnya.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<p>Berikut matriks bawaan. Super Admin dapat mengubahnya di Admin &gt; Permission.</p>
<ul>
<li><b>Super Admin</b>: Lihat, Tambah, Ubah, Batalkan/Kembalikan, Export.</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Export.</li>
<li><b>Legal Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Ubah (hanya dokumen miliknya), Export.</li>
<li><b>Compliance Officer, Risk Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
<li>Approve tidak dipakai di halaman ini.</li>
</ul>` },
]
