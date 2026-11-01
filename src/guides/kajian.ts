import type { GuideItem } from '../kit/PageGuide'

export const KajianGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Atur <b>Periode Tanggal Masuk</b> bila perlu.</li>
<li>Klik grafik untuk membuka tab <b>Table</b> terfilter, atau klik baris tabel dashboard untuk membuka Detail.</li>
<li>Di tab <b>Table</b>, cari atau filter kajian.</li>
<li>Klik <b>Tambah</b>. Pilih Jenis, lengkapi isian wajib, lalu <b>Simpan</b>. Bila Jenis = Vendor, isi juga data mitra.</li>
<li>Klik <b>Edit</b> untuk mengubah data. Mengubah Tanggal Masuk atau SLA wajib disertai alasan.</li>
<li>Bila kajian sudah beres, klik <b>Selesai</b> pada baris, isi Tanggal Selesai dan Hasil / Opini.</li>
<li>Head CLRM dapat <b>Batalkan</b> dan <b>Kembalikan</b>.</li>
<li>Klik <b>Export Excel</b>.</li>
</ol>` },
  { h: 'Dashboard', b: `<ul>
<li><b>Periode Tanggal Masuk</b>: kosong = semua data.</li>
<li>8 kartu: Kajian per jenis, Kajian per status, Lewat batas waktu, Kajian per unit kerja, Rata-rata lama masuk sampai selesai, Kajian per hasil / opini, jadwal evaluasi mitra akan tiba / terlewat, dan Mitra Eksisting vs Rencana.</li>
<li>Klik irisan jenis, batang status, batang unit kerja, atau irisan hasil untuk membuka Table terfilter.</li>
<li>Klik baris di tabel Lewat batas waktu atau Jadwal evaluasi mitra untuk membuka Detail.</li>
<li>Kajian yang <b>Dibatalkan</b> tidak dihitung.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah urutan baris, bukan ID data.</li>
<li>Urutan tabel mengikuti <b>Tanggal Dibuat</b>, terbaru di atas.</li>
<li><b>Pencarian</b> mencari di nomor internal, Judul, dan Nama Mitra.</li>
<li><b>Filter</b>: Periode (Tanggal Masuk), Jenis, Status (termasuk Dibatalkan), PIC, Unit Kerja, dan Hasil.</li>
<li><b>Pagination</b>: 10, 25, atau 50 baris per halaman.</li>
<li>Kolom <b>Batas</b> = Tanggal Masuk + SLA (hari kalender).</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib</b>: Jenis, Judul / Objek, Unit Kerja Pengusul, Tanggal Masuk, SLA (hari kalender, minimal 1), Status, dan PIC.</p>
<p><b>Wajib bersyarat (Jenis = Vendor)</b>: Nama Mitra, Status Mitra (Eksisting atau Rencana), Ada PKS?, Akses ke Sistem?, Akses Data Pengguna / Karyawan?, Akses Data Keuangan?, dan Pemantauan Berjalan?. <b>Tanggal PKS</b> muncul dan wajib hanya bila Ada PKS? = Ya. Konteks Kerja Sama dan Tanggal Due Diligence / Evaluasi boleh kosong. Isian vendor tersembunyi untuk jenis lain.</p>
<ul>
<li>Klasifikasi Regulasi (Izin, Lapor, Tidak Perlu) boleh kosong.</li>
<li><b>Status</b> di form: Baru, Proses, Review, atau Batal. Status <b>Selesai</b> hanya lewat tombol Selesai pada baris.</li>
<li><b>Tanggal Selesai</b> dan <b>Hasil / Opini</b> tidak ada di form. Keduanya diisi lewat tombol Selesai.</li>
<li><b>Alasan perubahan</b> wajib bila Tanggal Masuk atau SLA yang sudah terisi diubah, karena batas waktu bergeser.</li>
<li><b>Tanggal Batas</b> terhitung otomatis dan tidak diisi manual.</li>
<li>Unit Kerja, PIC, dan Nama Mitra dipilih dari Master Data. Tidak ada pilihan Lainnya di halaman ini.</li>
<li>Kajian berstatus Selesai atau Batal tidak bisa diedit.</li>
<li>Yang boleh <b>Tambah</b>: Risk Officer dan Super Admin. Yang boleh <b>Edit</b>: Risk Officer, PIC, dan Super Admin. PIC hanya dapat mengedit kajian yang PIC-nya adalah dirinya.</li>
</ul>` },
  { h: 'Aksi baris Selesai', b: `<ul>
<li>Tombol <b>Selesai</b> tampil bagi yang boleh Ubah, pada kajian yang belum Batal dan belum Selesai (atau Selesai tetapi Hasil kosong). PIC hanya untuk kajian miliknya.</li>
<li>Isi <b>Tanggal Selesai</b> (tidak boleh sebelum Tanggal Masuk) dan <b>Hasil / Opini Risk Management</b>: Tidak Direkomendasikan, Direkomendasikan Dengan Syarat, Direkomendasikan, atau Risk Acceptance. Keduanya wajib.</li>
<li>Setelah disimpan, status menjadi Selesai dan perubahan tercatat di Log Perubahan.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib.</li>
<li>Kajian yang dibatalkan berstatus <b>Dibatalkan</b> dan tidak masuk dashboard maupun alert.</li>
<li><b>Kembalikan</b> memulihkan status sebelumnya. Alasan wajib.</li>
<li>Status <b>Batal</b> (pilihan di form) berbeda: itu status manual, bukan pembatalan oleh Head CLRM.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<p><b>Lihat Detail</b> menampilkan semua isian (isian vendor hanya untuk Jenis Vendor), badge alert aktif, dan keterangan pembatalan.</p>
<p><b>Log Perubahan</b> mencatat: data dibuat, perubahan data (sebelum dan sesudah, siapa, kapan, alasan), penyelesaian lewat aksi Selesai, pembatalan, dan pengembalian.</p>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung.</p>
<ul>
<li><b>Lewat batas waktu</b> (merah): Tanggal Batas terlewat dan status belum Selesai atau Batal. Penerima: PIC, Head CLRM.</li>
<li><b>Mendekati batas waktu</b> (kuning): Tanggal Batas tinggal 2 hari kerja atau kurang (Senin-Jumat) dan belum Selesai atau Batal — judul notifikasi berubah menjadi "Kajian jatuh tempo hari ini" bila tenggatnya hari ini. Penerima: PIC.</li>
<li><b>Selesai tanpa hasil</b> (kuning): status Selesai tetapi Hasil / Opini kosong. Penerima: PIC, Risk Officer.</li>
<li><b>Jadwal evaluasi mitra akan tiba / terlewat</b>: hanya Jenis Vendor yang punya Tanggal Due Diligence. Kuning bila 30 hari lagi atau kurang, merah bila sudah lewat. Penerima: PIC, Risk Officer.</li>
</ul>` },
  { h: 'Export Excel', b: `<ul>
<li>Mengekspor baris yang tampil di Table, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor, Tanggal Dibuat, lalu semua isian (isian vendor hanya terisi untuk Jenis Vendor), termasuk Tanggal Batas.</li>
<li>Nama file: <b>Kajian_Risiko_[tanggal hari ini].xlsx</b>.</li>
<li>Export tercatat di menu Log.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<ul>
<li><b>Super Admin</b>: semua aksi.</li>
<li><b>Head CLRM</b>: Lihat, Export, Batalkan.</li>
<li><b>Risk Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Ubah (hanya kajian miliknya), Export. PIC tidak dapat menambah kajian.</li>
<li><b>Compliance Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
<li>Halaman ini tidak memakai approval.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di menu <b>Admin</b> (Manage Permissions).</p>` },
]
