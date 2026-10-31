import type { GuideItem } from '../kit/PageGuide'

export const TRACKER_GUIDE: GuideItem[] = [
  {
    h: 'Alur penggunaan',
    b: `<ol>
<li>Buka tab <b>Dashboard</b> (tab awal) untuk melihat ringkasan temuan. Atur <b>Periode Tanggal Temuan</b> bila perlu. Kosong berarti semua tanggal.</li>
<li>Buka tab <b>Table</b> untuk melihat daftar temuan. Cari lewat kotak pencarian atau tombol <b>Filter</b>.</li>
<li>Klik <b>Tambah</b> (hanya peran yang diizinkan). Isi semua field bertanda <b>*</b> lalu klik <b>Simpan</b>. File bukti tidak wajib.</li>
<li>Klik <b>Lihat Detail</b> untuk melihat isi temuan dan Log Perubahan.</li>
<li>Klik <b>Edit</b> untuk mengubah Status, Batas Waktu, Rencana Tindak Lanjut, atau file bukti. Mengubah status ke <b>Selesai</b> membuat pengajuan penutupan ke Head CLRM (lihat item Approval).</li>
<li>Compliance Officer mengisi <b>Validasi Ulang</b> dari Detail untuk temuan berstatus Menunggu Validasi.</li>
<li>Head CLRM dapat <b>Batalkan</b> temuan yang salah, lalu <b>Kembalikan</b> bila perlu. Alasan wajib diisi.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang sedang tampil.</li>
</ol>`,
  },
  {
    h: 'Dashboard',
    b: `<p>Dashboard menampilkan 4 angka ringkasan dan 6 grafik. <b>Temuan Dibatalkan tidak dihitung</b>.</p>
<ul>
<li><b>Periode Tanggal Temuan</b>: dua tanggal (dari dan sampai) pada <b>Tanggal Temuan</b>. Kosong berarti semua. Tombol <b>Reset</b> mengosongkan tanggal dan semua filter di tab Table. Periode ini juga mengisi filter Periode di tab Table.</li>
<li><b>Ringkasan</b>: Open (belum Selesai), Selesai, Lewat Batas Waktu, dan % Selesai.</li>
<li><b>Grafik</b>: Temuan per Regulator, per Unit Kerja, per Area, per Tingkat Risiko (menurut status), Temuan Lewat Batas Waktu, dan Tren Penyelesaian.</li>
<li><b>Tren Penyelesaian</b> punya filter bulan sendiri (3, 6, 9, 12 bulan terakhir, Seluruh Waktu, atau Custom). Filter ini tidak ikut Periode Tanggal Temuan.</li>
<li>Pada tabel <b>Temuan Lewat Batas Waktu</b>, klik satu baris untuk membuka Detail temuan. Grafik lain tidak bisa diklik.</li>
<li>Arahkan kursor atau klik ikon info (i) pada tiap kartu untuk melihat cara membacanya.</li>
</ul>`,
  },
  {
    h: 'Tabel, cari, filter',
    b: `<ul>
<li>Kolom <b>Nomor</b> adalah nomor urut baris (1, 2, 3, ...), bukan ID temuan. Nomor berlanjut antar halaman dan kembali ke 1 saat cari atau filter berubah.</li>
<li>Urutan tabel: <b>Tanggal Dibuat</b> terbaru dulu.</li>
<li>Kolom lain: Regulator, Tanggal Temuan, Area Temuan, PIC, Batas Waktu, Status, Tingkat Risiko, Tanggal Dibuat, dan Aksi.</li>
<li><b>Pencarian</b> mencari di nomor internal temuan, Regulator, Area Temuan, dan PIC.</li>
<li>Tombol <b>Filter</b> membuka popover: <b>Periode</b> (Tanggal Temuan), <b>Status</b>, <b>PIC</b>, <b>Unit Kerja</b>, <b>Regulator</b>, dan <b>Tingkat Risiko</b>. Klik <b>Apply Filters</b> untuk memakai, <b>Clear All</b> untuk menghapus semua.</li>
<li>Filter Regulator <b>Lainnya</b> menampilkan temuan yang regulatornya diketik bebas (di luar daftar BI, PPATK, Komdigi, BSSN, Pemerintah-DPR).</li>
<li>Di tabel, regulator atau area yang diketik bebas tampil sebagai <b>Lainnya</b>. Isi aslinya terlihat di Detail dan Export.</li>
<li>Temuan Dibatalkan tetap ada di tabel (teks abu-abu). Gunakan filter Status <b>Dibatalkan</b> untuk melihatnya.</li>
<li>Pagination: pilih 10, 25, atau 50 baris per halaman.</li>
</ul>`,
  },
  {
    h: 'Tambah & Edit',
    b: `<p><b>Tambah</b> (Compliance Officer dan Super Admin). Semua field wajib kecuali file upload:</p>
<ul>
<li>Regulator, Tanggal Temuan, Area Temuan, Penyebab Utama (Root Cause), Jenis Penyebab, PIC, Batas Waktu, Status, Unit Kerja, Tingkat Risiko.</li>
<li>Rencana Tindak Lanjut. <b>File bukti</b> tindak lanjut dan <b>Bukti Surat Regulator</b> tidak wajib.</li>
<li>Status saat Tambah: Open, Proses, atau Menunggu Validasi.</li>
<li>Batas Waktu tidak boleh sebelum Tanggal Temuan.</li>
</ul>
<p><b>Lainnya</b>: dropdown <b>Regulator</b> dan <b>Area Temuan</b> punya opsi Lainnya. Bila dipilih, muncul isian teks bebas yang wajib diisi.</p>
<p><b>Upload</b> (tidak wajib): format PDF, JPG, JPEG, atau PNG. Maksimal 25 MB per file dan hanya 1 file per field.</p>
<p><b>Edit</b> (Compliance Officer, PIC, Super Admin):</p>
<ul>
<li>Yang bisa diubah: Status (boleh sampai Selesai), Batas Waktu, Rencana Tindak Lanjut, File bukti, dan Bukti Surat Regulator.</li>
<li>Bila <b>Batas Waktu diubah</b>, kolom <b>Alasan perubahan Batas Waktu</b> wajib diisi dan harus berbeda dari alasan terakhir.</li>
<li>Bila Status diubah ke <b>Selesai</b>, field <b>Validasi Ulang</b> dan <b>Nama Validator</b> wajib diisi. Perubahan ini tidak langsung tersimpan, tetapi menjadi pengajuan (lihat Approval).</li>
<li>Perubahan lain tersimpan langsung dan tercatat di Log Perubahan.</li>
<li>Tombol Edit tidak muncul untuk temuan <b>Selesai</b>, <b>Dibatalkan</b>, atau yang sedang menunggu approval.</li>
<li>Peran <b>PIC</b> hanya dapat mengedit temuan dengan PIC sama dengan nama akunnya.</li>
</ul>`,
  },
  {
    h: 'Validasi Ulang',
    b: `<ul>
<li>Tombol <b>Isi Validasi Ulang</b> ada di Detail temuan. Hanya muncul untuk <b>Compliance Officer</b>, saat status <b>Menunggu Validasi</b> dan Validasi Ulang masih Belum.</li>
<li>Hasil: <b>Valid</b> atau <b>Tidak Valid</b>. Catatan wajib bila Tidak Valid.</li>
<li><b>Tidak Valid</b>: status temuan otomatis kembali ke <b>Proses</b>.</li>
<li><b>Valid</b>: hasil dicatat (nama validator dan tanggal). Status tidak berubah otomatis. Untuk menutup temuan, ubah status ke Selesai lewat Edit.</li>
</ul>`,
  },
  {
    h: 'Approval (penutupan temuan)',
    b: `<ul>
<li>Yang diajukan: perubahan yang menutup temuan, yaitu Status diubah ke <b>Selesai</b>. Seluruh perubahan di form (status, Batas Waktu, rencana, file, validasi) ikut dalam satu pengajuan, bernama <b>Penutupan Temuan</b>.</li>
<li><b>Approver</b>: Head CLRM (Super Admin juga dapat memutuskan). Keputusan di menu <b>Approval</b>.</li>
<li>Saat <b>Menunggu</b>: temuan terkunci. Tombol <b>Edit</b> dan <b>Batalkan</b> hilang, dan Detail menampilkan kotak kuning dengan tautan ke menu Approval. Status temuan belum berubah.</li>
<li>Setelah <b>Disetujui</b>: semua perubahan diterapkan, status menjadi Selesai, dan Persetujuan Penutupan terisi (nama dan tanggal).</li>
<li>Setelah <b>Ditolak</b> (catatan wajib): perubahan tidak diterapkan, status tetap seperti semula, Persetujuan Penutupan tertulis Ditolak, dan temuan bisa diedit lagi.</li>
<li>Pengajuan dan keputusan tercatat di Log Perubahan.</li>
</ul>`,
  },
  {
    h: 'Batalkan & Kembalikan',
    b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang punya aksi <b>Batalkan</b>.</li>
<li>Klik Batalkan di tabel atau Detail. <b>Alasan wajib</b> diisi. Status menjadi Dibatalkan.</li>
<li>Temuan yang sedang menunggu approval tidak bisa dibatalkan.</li>
<li>Temuan Dibatalkan <b>tidak dihitung di dashboard</b> dan <b>tidak memicu notifikasi</b>.</li>
<li><b>Kembalikan</b> memulihkan temuan ke status sebelum dibatalkan (bila tidak terbaca, ke Open). <b>Alasan wajib</b>.</li>
<li>Keduanya tercatat di Log Perubahan.</li>
</ul>`,
  },
  {
    h: 'Detail & Log Perubahan',
    b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk membuka semua isi temuan, badge alert yang aktif, dan file bukti.</li>
<li>Bagian <b>Log Perubahan</b> di bawahnya memuat riwayat dari terbaru: data dibuat, perubahan data, pengajuan penutupan, keputusan approval, validasi ulang, pembatalan, dan pengembalian.</li>
<li>Tiap entri mencatat <b>siapa</b>, <b>kapan</b>, kolom yang berubah (<b>sebelum</b> dan <b>sesudah</b>), serta <b>alasan</b> atau catatan. Untuk approval juga tercatat pengaju dan approver.</li>
</ul>`,
  },
  {
    h: 'Notifikasi',
    b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah; Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Tombol "Tandai semua dibaca" menandai semuanya sudah dibaca. Hanya temuan yang belum Selesai dan tidak Dibatalkan yang memicu notifikasi.</p>
<ul>
<li><b>Temuan hampir jatuh tempo</b> (kuning). Muncul bila Batas Waktu tinggal 7 hari atau kurang dan belum terlewat. Penerima: <b>PIC</b> temuan.</li>
<li><b>Temuan lewat batas waktu</b> (merah). Muncul bila Batas Waktu sudah terlewat. Penerima: <b>PIC</b> dan <b>Head CLRM</b>. Bila terlambat lebih dari 7 hari, <b>Direktur terkait</b> ikut menerima.</li>
<li><b>Menunggu validasi terlalu lama</b> (kuning). Muncul bila status Menunggu Validasi lebih dari 7 hari. Penerima: <b>Compliance Officer</b> dan <b>Head CLRM</b>.</li>
</ul>
`,
  },
  {
    h: 'Export Excel',
    b: `<ul>
<li>Mengekspor <b>baris yang sedang tampil</b> di tabel, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor (urutan baris), Tanggal Dibuat, Regulator, Tanggal Temuan, Area Temuan, Penyebab Utama, PIC, Batas Waktu, Status, Validasi Ulang, Persetujuan Penutupan, Unit Kerja, Tingkat Risiko, Rencana Tindak Lanjut, nama file bukti, dan nama file Bukti Surat Regulator.</li>
<li>Nama file: <b>Temuan_Regulator_&lt;tanggal hari ini&gt;.xlsx</b>.</li>
<li>Setiap export tercatat di menu <b>Log</b> beserta jumlah barisnya.</li>
</ul>`,
  },
  {
    h: 'Hak akses per peran',
    b: `<p>Default matriks untuk modul ini:</p>
<ul>
<li><b>Super Admin</b>: semua aksi (Lihat, Tambah, Ubah, Batalkan, Approve, Export).</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Approve penutupan, Export.</li>
<li><b>Compliance Officer</b>: Lihat, Tambah, Ubah, Export. Mengisi Validasi Ulang.</li>
<li><b>PIC</b>: Lihat, Ubah (hanya temuan miliknya), Export.</li>
<li><b>Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di <b>Admin &gt; Permission</b>.</p>`,
  },
]
