import type { GuideItem } from '../kit/PageGuide'

export const REPORTING_GUIDE: GuideItem[] = [
  {
    h: 'Alur penggunaan',
    b: `<ol>
<li>Buka tab <b>Dashboard</b> (tab awal). Atur <b>Periode Batas Waktu</b> bila perlu, lalu klik <b>Terapkan Filter</b>. Kosong berarti semua.</li>
<li>Buka tab <b>Table</b>. Cari atau saring laporan lewat pencarian dan tombol <b>Filter</b>.</li>
<li>Klik <b>Tambah</b>. Isi isian bertanda <b>*</b> lalu klik <b>Simpan</b>. Jadwal laporan tidak dibuat otomatis, setiap laporan ditambah manual.</li>
<li>Saat laporan dikirim, klik <b>Edit</b>: ubah Status ke <b>Terkirim</b>, isi Tanggal Pengiriman, lalu file Bukti Pengiriman atau Nomor Tanda Terima.</li>
<li>Bila laporan telat, isi <b>Alasan Terlambat</b> lewat Edit.</li>
<li>Head CLRM dapat <b>Batalkan</b> laporan yang salah, lalu <b>Kembalikan</b> bila perlu. Alasan wajib.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang sedang tampil.</li>
</ol>`,
  },
  {
    h: 'Dashboard',
    b: `<ul>
<li>Isi: <b>Kalender pelaporan</b>, <b>Ketepatan waktu</b> (% tepat waktu per jenis periode dan regulator), <b>Beban laporan per jenis periode</b>, <b>Tren laporan terlambat</b>, dan tabel <b>Jatuh tempo 7 hari ke depan</b>.</li>
<li>Filter <b>Periode Batas Waktu</b> (dua tanggal) menyaring semua kartu, kecuali Tren yang memakai semua data. Tanggal baru berlaku setelah klik <b>Terapkan Filter</b>. Tombol <b>Reset</b> mengosongkannya.</li>
<li><b>Tren laporan terlambat</b> punya filter bulan sendiri (3, 6, 9, 12 bulan terakhir, Seluruh Waktu, atau Custom). Klik <b>Terapkan Filter</b> agar pilihan berlaku.</li>
<li>Klik <b>titik pada kalender</b> atau <b>baris</b> tabel jatuh tempo untuk membuka Detail laporan.</li>
<li>Laporan Dibatalkan tidak dihitung di dashboard.</li>
<li>Klik ikon info (i) pada tiap kartu untuk melihat cara membacanya.</li>
</ul>`,
  },
  {
    h: 'Tabel, cari, filter',
    b: `<ul>
<li>Kolom <b>Nomor</b> adalah nomor urut baris, bukan ID. Nomor berlanjut antar halaman dan kembali ke 1 saat cari atau filter berubah.</li>
<li>Urutan: <b>Tanggal Dibuat</b> terbaru dulu.</li>
<li>Kolom: Nama Laporan, Regulator, Jenis Periode, Periode, Batas Waktu, Status, Tepat Waktu?, Penyusun, Tanggal Dibuat, dan Aksi.</li>
<li><b>Pencarian</b> mencari di nomor internal, Nama Laporan, Regulator, PIC Penyusun, dan PIC Reviewer.</li>
<li><b>Filter</b>: Periode (Batas Waktu), Jenis Periode, Status (termasuk Dibatalkan), Regulator, dan PIC (penyusun atau reviewer).</li>
<li>Pagination: 10, 25, atau 50 baris per halaman.</li>
<li>Laporan Dibatalkan tetap tampil di tabel (teks abu-abu).</li>
</ul>`,
  },
  {
    h: 'Tambah & Edit',
    b: `<p><b>Isian wajib</b>: Nama Laporan, Regulator, Jenis Periode, Periode yang Dilaporkan, Batas Waktu, Status, PIC Penyusun, PIC Reviewer.</p>
<p><b>Wajib bersyarat</b>:</p>
<ul>
<li><b>Tanggal Pengiriman</b>: wajib bila Status <b>Terkirim</b>.</li>
<li><b>Bukti Pengiriman</b> (file) dan <b>Nomor Tanda Terima</b> boleh dikosongkan. Bila Status Terkirim tanpa keduanya, muncul notifikasi pengingat "Terkirim tanpa bukti".</li>
<li><b>Alasan Terlambat</b>: wajib bila Status Terlambat, bila Tanggal Pengiriman melewati Batas Waktu, atau bila Batas Waktu sudah lewat dan laporan belum Terkirim.</li>
<li><b>Laporan Insiden Siber?</b> muncul bila Jenis Periode <b>Insidental</b>. Bila dijawab <b>Ya</b>, muncul <b>Waktu Notifikasi Awal</b> dan <b>Waktu Kejadian</b> menjadi wajib.</li>
</ul>
<p><b>Aturan</b>:</p>
<ul>
<li>PIC Penyusun dan PIC Reviewer harus orang yang berbeda.</li>
<li>Waktu Notifikasi Awal tidak boleh sebelum Waktu Kejadian.</li>
<li>Status <b>Terlambat</b> hanya bisa dipilih bila Batas Waktu sudah lewat.</li>
</ul>
<p><b>Isian otomatis</b>:</p>
<ul>
<li><b>Status Terlambat</b> terisi sendiri bila Batas Waktu lewat dan laporan belum Terkirim. Bila Batas Waktu diundur ke depan, status Terlambat kembali menjadi Belum Disiapkan.</li>
<li><b>Tepat Waktu?</b> dihitung dari Tanggal Pengiriman dan Batas Waktu. Pengiriman pada hari Batas Waktu dianggap tepat waktu.</li>
</ul>
<p><b>Upload</b> (tidak wajib): PDF, JPG, JPEG, atau PNG. Maksimal 25 MB dan 1 file.</p>
<p><b>Siapa boleh</b>:</p>
<ul>
<li><b>Tambah</b>: Compliance Officer dan Super Admin.</li>
<li><b>Edit</b>: Compliance Officer, PIC, dan Super Admin. CO dan PIC hanya dapat mengubah <b>Status, Tanggal Pengiriman, Bukti Pengiriman, Nomor Tanda Terima, dan Alasan Terlambat</b>. Isian lain hanya dapat diubah Super Admin.</li>
<li><b>PIC</b> hanya dapat mengedit laporan yang namanya tertulis sebagai penyusun atau reviewer.</li>
<li>Saat Edit ada kolom <b>Alasan perubahan</b> (opsional) yang ikut masuk ke Log Perubahan.</li>
</ul>`,
  },
  {
    h: 'Batalkan & Kembalikan',
    b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang punya aksi <b>Batalkan</b>.</li>
<li>Klik Batalkan di baris tabel. <b>Alasan wajib</b> diisi. Status menjadi Dibatalkan.</li>
<li>Laporan Dibatalkan <b>tidak dihitung di dashboard</b> dan <b>tidak memicu alert</b>.</li>
<li><b>Kembalikan</b> memulihkan status sebelumnya. <b>Alasan wajib</b>.</li>
<li>Keduanya tercatat di Log Perubahan.</li>
</ul>`,
  },
  {
    h: 'Detail & Log Perubahan',
    b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk melihat semua isian laporan dan badge alert yang aktif.</li>
<li><b>Log Perubahan</b> di bawah Detail memuat riwayat dari terbaru: data dibuat, perubahan data, pembatalan, dan pengembalian.</li>
<li>Tiap entri mencatat <b>siapa</b>, <b>kapan</b>, kolom yang berubah (<b>sebelum</b> dan <b>sesudah</b>), serta <b>alasan</b>.</li>
</ul>`,
  },
  {
    h: 'Notifikasi',
    b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung.</p>
<ul>
<li><b>Mendekati batas waktu</b> (kuning). Laporan belum Terkirim dan Batas Waktu tinggal 0 sampai 7 hari — judul notifikasi berubah menjadi "Laporan jatuh tempo hari ini" bila tenggatnya hari ini. Penerima: <b>PIC</b> penyusun dan <b>Compliance Officer</b>.</li>
<li><b>Lewat batas waktu</b> (merah). Status Terlambat, yaitu Batas Waktu terlewat dan belum Terkirim. Penerima: <b>PIC</b> penyusun dan <b>Head CLRM</b>.</li>
<li><b>Tenggat pelaporan insiden siber sedang berjalan</b> (merah). Laporan insiden siber belum Terkirim dan Waktu Kejadian terisi. Notifikasi awal paling lambat 1 jam dan laporan lengkap paling lambat 3 hari kalender sejak kejadian. Penerima: <b>Head CLRM</b> dan <b>CISO</b>.</li>
<li><b>Terkirim tanpa bukti</b> (kuning). Status Terkirim tetapi file bukti dan Nomor Tanda Terima kosong. Penerima: <b>PIC</b> penyusun.</li>
</ul>
`,
  },
  {
    h: 'Export Excel',
    b: `<ul>
<li>Mengekspor <b>baris yang sedang tampil</b> di tabel, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor (urutan baris), Tanggal Dibuat, lalu semua isian laporan yang terisi (termasuk Tepat Waktu?). File bukti diekspor sebagai nama file.</li>
<li>Nama file: <b>Pelaporan_Regulator_&lt;tanggal hari ini&gt;.xlsx</b>.</li>
<li>Setiap export tercatat di menu <b>Log</b> beserta jumlah barisnya.</li>
</ul>`,
  },
  {
    h: 'Hak akses per peran',
    b: `<p>Default matriks untuk modul ini (halaman ini tidak memakai approval):</p>
<ul>
<li><b>Super Admin</b>: semua aksi.</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Export.</li>
<li><b>Compliance Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Ubah (hanya laporan miliknya), Export.</li>
<li><b>Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di menu <b>Admin</b> (Manage Permissions).</p>`,
  },
]
