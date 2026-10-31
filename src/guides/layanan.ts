import type { GuideItem } from '../kit/PageGuide'

export const LayananGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Lihat jumlah permintaan Baru, Proses, Selesai, dan yang lewat batas, serta grafik umur dan unit kerja.</li>
<li>Atur <b>Periode Tanggal Masuk</b> bila perlu. Kosongkan kedua tanggal untuk melihat semua data.</li>
<li>Klik kartu atau grafik untuk membuka tab <b>Table</b> yang sudah terfilter. Atau buka tab <b>Table</b> langsung.</li>
<li>Klik <b>Tambah</b>, lengkapi isian wajib, lalu <b>Simpan</b>. Tanggal Batas terhitung otomatis.</li>
<li>Legal Officer klik <b>Edit</b> untuk mengisi PIC dan mengubah status. Saat Selesai, isi Tanggal Selesai dan Nomor Memo.</li>
<li>Head CLRM dapat <b>Batalkan</b> permintaan yang salah (alasan wajib) dan <b>Kembalikan</b> bila perlu.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang tampil di tabel.</li>
</ol>` },
  { h: 'Dashboard', b: `<p>Dashboard menghitung permintaan yang tidak <b>Dibatalkan</b>. Filter <b>Periode Tanggal Masuk</b> membatasi data menurut Tanggal Masuk. Kosong berarti semua data.</p>
<ul>
<li><b>Kartu status</b>: Baru, Proses, Selesai (klik untuk membuka Table terfilter Status), dan <b>Lewat batas</b> (permintaan Baru atau Proses yang melewati Tanggal Batas, tanpa klik). Permintaan berstatus Batal tidak punya kartu.</li>
<li><b>Permintaan per jenis</b>: diagram donat. Arahkan kursor untuk rincian per unit kerja. Klik irisan untuk membuka Table terfilter Jenis.</li>
<li><b>Belum selesai menurut umur (hari)</b>: permintaan Baru dan Proses menurut umur sejak Tanggal Masuk (0 sampai 7, 8 sampai 14, lebih dari 14 hari).</li>
<li><b>Permintaan per unit kerja</b>: batang mendatar. Klik batang untuk membuka Table terfilter Unit Kerja.</li>
<li><b>Rata-rata lama selesai per jenis (hari)</b>: dari permintaan Selesai yang punya Tanggal Selesai.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah posisi baris (1, 2, 3, ...), bukan ID data. Nomor berlanjut antar halaman.</li>
<li>Urutan tabel: <b>Tanggal Dibuat</b> terbaru dulu. Tabel tidak bisa diurutkan per kolom.</li>
<li><b>Pencarian</b> mencari di nomor internal permintaan (bukan kolom Nomor tabel), Unit Kerja, dan Jenis.</li>
<li><b>Filter</b>: Periode (Tanggal Masuk), Status, PIC, Unit Kerja, Jenis, dan Prioritas. Pilihan Status memuat juga <b>Dibatalkan</b>.</li>
<li>Tabel menampilkan data Dibatalkan (teks abu-abu). Dashboard dan alert tidak menghitungnya.</li>
<li>Pagination: 10, 25, atau 50 baris per halaman. Mengubah pencarian atau filter mengembalikan ke halaman 1.</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib</b> (bertanda *): Unit Kerja Pemohon (dropdown master Unit Kerja), Jenis, Tanggal Masuk, SLA (hari kalender), Status, dan Prioritas.</p>
<ul>
<li><b>PIC</b> boleh kosong saat dibuat. PIC yang kosong lebih dari 1 hari kerja memicu alert.</li>
<li><b>Tanggal Batas</b> terisi otomatis: Tanggal Masuk ditambah SLA hari kalender.</li>
<li><b>Tanggal Selesai</b> dan <b>Nomor Memo / Pendapat Hukum</b> hanya tampil dan wajib bila Status = Selesai. Tanggal Selesai tidak boleh sebelum Tanggal Masuk.</li>
<li>SLA minimal 1 hari.</li>
<li><b>Alasan wajib</b>: bila <b>Tanggal Masuk</b> atau <b>SLA</b> yang sudah terisi diubah di form Edit, kolom Alasan perubahan wajib diisi.</li>
<li><b>Lainnya</b>: pada Jenis, memilih Lainnya memunculkan isian teks bebas yang wajib diisi. Tabel menampilkan "Lainnya", Detail dan Export menampilkan teks aslinya. Teks bebas pada Jenis dihitung di irisan Lainnya pada grafik per jenis.</li>
<li>Permintaan berstatus <b>Selesai</b> atau <b>Batal</b> tidak bisa diedit lagi.</li>
<li>Halaman ini tidak memakai approval. Perubahan langsung tersimpan.</li>
<li><b>Siapa boleh</b>: Tambah oleh Legal Officer dan PIC. Edit oleh Legal Officer saja.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib diisi.</li>
<li>Status berubah menjadi <b>Dibatalkan</b>. Data tidak bisa diedit, tidak masuk dashboard, dan tidak memicu alert.</li>
<li>Status <b>Batal</b> (pilihan di form Edit) berbeda dari <b>Dibatalkan</b> (aksi Head CLRM). Permintaan Batal tetap dihitung di grafik per jenis dan per unit kerja.</li>
<li>Tombol <b>Kembalikan</b> mengembalikan status sebelum dibatalkan. Alasan wajib diisi.</li>
<li>Pembatalan dan pengembalian tercatat di Log Perubahan dan menu Log.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk melihat semua isian, termasuk Tanggal Batas. Badge alert yang sedang aktif tampil di atas Detail.</li>
<li>Bagian <b>Log Perubahan</b> mencatat: data dibuat, perubahan data (kolom sebelum dan sesudah), pembatalan, dan pengembalian. Setiap entri memuat siapa, kapan, dan alasan bila diisi.</li>
<li>Terbaru di atas.</li>
</ul>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung. Notifikasi hanya muncul untuk permintaan berstatus Baru atau Proses. Hari kerja dihitung Senin sampai Jumat, tanpa libur nasional.</p>
<ul>
<li><b>Lewat batas waktu</b>: muncul bila Tanggal Batas sudah terlewat. <b>Merah</b>. Penerima: PIC permintaan dan Head CLRM.</li>
<li><b>Hampir jatuh tempo</b>: muncul bila Tanggal Batas tinggal 2 hari kerja atau kurang (belum lewat). <b>Kuning</b>. Penerima: PIC permintaan.</li>
<li><b>Belum ada PIC</b>: muncul bila PIC masih kosong lebih dari 1 hari kerja sejak Tanggal Masuk. <b>Kuning</b>. Penerima: Head CLRM.</li>
</ul>` },
  { h: 'Export Excel', b: `<ul>
<li>Tombol <b>Export Excel</b> mengekspor baris yang tampil di tabel, sesuai pencarian dan filter saat itu. Baris Dibatalkan ikut terekspor bila tampil.</li>
<li>Kolom: Nomor (posisi baris), Tanggal Dibuat, lalu semua isian yang tampil di Detail, termasuk Tanggal Batas.</li>
<li>Nama file: <b>Permintaan_Layanan_Hukum_[tanggal hari ini].xlsx</b>.</li>
<li>Setiap export tercatat di menu Log beserta jumlah barisnya.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<p>Berikut matriks bawaan. Super Admin dapat mengubahnya di Admin &gt; Permission.</p>
<ul>
<li><b>Super Admin</b>: Lihat, Tambah, Ubah, Batalkan/Kembalikan, Export.</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Export.</li>
<li><b>Legal Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Tambah, Export. PIC tidak bisa Edit.</li>
<li><b>Compliance Officer, Risk Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
<li>Approve tidak dipakai di halaman ini.</li>
</ul>` },
]
