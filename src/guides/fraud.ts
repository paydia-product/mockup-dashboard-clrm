import type { GuideItem } from '../kit/PageGuide'

export const FraudGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Atur <b>Periode Tanggal Terima</b> bila perlu.</li>
<li>Klik kartu atau grafik untuk membuka tab <b>Table</b> terfilter.</li>
<li>Di tab <b>Table</b>, cari atau filter kasus.</li>
<li>Klik <b>Tambah</b>. Lengkapi isian wajib. Bukti boleh dikosongkan. Kasus baru selalu berstatus Open. Klik <b>Simpan</b>.</li>
<li>Klik <b>Edit</b> untuk melengkapi kasus (tindakan, hold, blokir, laporan regulator). Perubahan data yang sudah terisi wajib disertai alasan.</li>
<li>Untuk menutup kasus, ubah Status menjadi <b>Closed</b>. Penutupan menunggu <b>approval Head CLRM</b>.</li>
<li>Head CLRM dapat <b>Batalkan</b> dan <b>Kembalikan</b>.</li>
<li>Klik <b>Export Excel</b>.</li>
</ol>` },
  { h: 'Dashboard', b: `<ul>
<li><b>Periode Tanggal Terima</b>: kosong = semua data.</li>
<li>5 kartu ringkasan dan 9 grafik. Kartu <b>Open</b> dan <b>Closed</b> bisa diklik untuk membuka Table terfilter.</li>
<li>Klik irisan Jenis dugaan, batang Kategori pelapor, Tindakan, atau Top 10 merchant untuk membuka Table terfilter.</li>
<li>Grafik <b>Kasus per bulan</b> dan <b>Nilai uang per bulan</b> punya <b>filter bulan sendiri</b> (Seluruh Waktu, 3, 6, 9, 12 bulan terakhir, atau Custom). Standar 12 bulan terakhir. Dua grafik ini tidak terpengaruh Periode halaman.</li>
<li>Kasus yang <b>Dibatalkan</b> tidak dihitung.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah urutan baris, bukan ID data.</li>
<li>Urutan tabel mengikuti <b>Tanggal Dibuat</b>, terbaru di atas.</li>
<li><b>Pencarian</b> mencari di No Laporan EDD, Terlapor (nilai yang tampil, bisa tersamar), Group Merchant, dan Kategori Pelapor.</li>
<li><b>Filter</b>: Periode (Tanggal Terima), Status (Open, Closed, Dibatalkan), PIC, Jenis Dugaan, Tindakan, Sumber (Kategori Pelapor), Group Merchant, Produk, dan Channel.</li>
<li><b>Pagination</b>: 10, 25, atau 50 baris per halaman.</li>
<li>Nama Terlapor dan RRN <b>disamarkan</b> (contoh B*** S******) di tabel, Detail, dan form Edit. Head CLRM dan Fraud Investigator melihat <b>ikon mata</b> (di header kolom tabel, di samping label pada Detail, dan di samping label pada form Edit): klik untuk membuka nilai asli, klik lagi untuk menyamarkan lagi. Bawaan selalu tersamar. Peran lain tidak punya tombol mata dan nilainya tetap tersamar (juga di Export).</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib saat Tambah</b>: Tanggal Terima Tugas, Kategori Pelapor, Media, Nama Terlapor, Jenis Pengguna, Jenis Dugaan, Hasil Asesmen Awal, dan Alasan Asesmen. Bukti tidak wajib. Status Open diberikan otomatis.</p>
<p><b>Wajib bersyarat saat status Closed</b>: Uraian, Nominal Korban, Tindakan, Tanggal Email Resolved, dan PIC Investigator.</p>
<ul>
<li>Bila Tindakan = <b>Blokir</b>: Saldo Tertahan wajib. Saat Closed, Tanggal Lapor Komdigi, BI, dan PPATK juga wajib.</li>
<li>Field <b>Tanggal EDD 1</b>, <b>Tanggal EDD 2</b>, <b>Batas Waktu EDD</b> (otomatis), dan <b>Hasil EDD</b> selalu tampil sejak awal. Saat Closed dan asesmen Dilanjutkan, EDD 1 wajib. Hasil EDD wajib saat Closed bila EDD 1 atau EDD 2 terisi.</li>
<li><b>No Laporan EDD</b> dibuat otomatis saat kasus disimpan dengan format <b>EDD/tahun/bulan/nomor</b> (contoh EDD/2026/10/0001). Tahun dan bulan mengikuti Tanggal Dibuat, nomor urut 4 digit mulai lagi dari 0001 tiap bulan. Field ini nonaktif dan tidak berubah saat Edit.</li>
<li><b>Tindakan</b> memuat juga pilihan <b>EDD 1</b> dan <b>EDD 2</b>.</li>
<li><b>Media</b>: pilihan dari Master Data ditambah <b>Lainnya</b>. Memilih Lainnya memunculkan isian teks bebas yang wajib diisi (tabel menampilkan "Lainnya").</li>
<li><b>Upload Bukti</b> (tidak wajib): PDF, JPG, JPEG, atau PNG. Maksimal 25 MB, 1 file.</li>
<li><b>Alasan perubahan</b> (saat Edit) wajib bila salah satu field berikut yang sudah terisi diubah: Tanggal Terima Tugas, Nominal Korban, Tanggal Transaksi, data Hold, Tanggal Email PPATK, Tanggal EDD, Tanggal Blokir, data Released, Saldo Tertahan, Tanggal Hapus QRIS, Tanggal Email Tutup Akun, tanggal Lapor, Tanggal Email Resolved, dan Kerugian Paydia.</li>
<li><b>Batas Waktu EDD</b> otomatis (rumus sementara): EDD 1 = Tanggal Terima + 3 hari kerja, EDD 2 = EDD 1 + 7 hari.</li>
<li>Aturan tanggal: EDD 2 tidak boleh sebelum EDD 1. Tanggal Resolved dan Tanggal Blokir tidak boleh sebelum Tanggal Terima.</li>
<li>Kasus <b>Closed</b> tidak bisa diedit.</li>
<li>Yang boleh <b>Tambah</b>: Fraud Investigator, Compliance Officer, Super Admin. Yang boleh <b>Edit</b>: Fraud Investigator, Compliance Officer, PIC, Super Admin. PIC dan Fraud Investigator hanya mengedit kasus yang PIC Investigator-nya dirinya.</li>
<li>Nama Terlapor dan RRN yang tersamar bagi Anda tidak dapat diubah. Bagi Head CLRM dan Fraud Investigator, buka dulu lewat ikon mata di samping label untuk mengubahnya.</li>
</ul>` },
  { h: 'Approval', b: `<ul>
<li>Jenis: <b>Penutupan Kasus</b>. Approver: <b>Head CLRM</b>.</li>
<li>Diajukan saat Edit mengubah Status dari Open ke <b>Closed</b>. Semua perubahan pada Edit tersebut ikut diajukan.</li>
<li><b>Menunggu</b>: kasus tetap Open dengan data lama, terkunci, tanpa Edit dan Batalkan. Detail menampilkan banner menunggu persetujuan.</li>
<li><b>Disetujui</b>: semua perubahan berlaku dan kasus menjadi Closed. <b>Ditolak</b>: kasus tetap Open dengan data lama.</li>
<li>Keputusan dibuat di menu <b>Approval</b> oleh Head CLRM atau Super Admin.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib. Tidak bisa dibatalkan saat Menunggu approval.</li>
<li>Kasus yang dibatalkan berstatus <b>Dibatalkan</b> dan tidak masuk dashboard maupun alert.</li>
<li><b>Kembalikan</b> memulihkan status sebelumnya (Open atau Closed). Alasan wajib.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<p><b>Lihat Detail</b> menampilkan semua isian, badge alert aktif, dan keterangan pembatalan.</p>
<p><b>Log Perubahan</b> mencatat: data dibuat, perubahan data (sebelum dan sesudah, siapa, kapan, alasan), pengajuan penutupan (pengaju, approver, perubahan, alasan), keputusan Approve atau Reject beserta catatan, pembatalan, dan pengembalian.</p>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung.</p>
<ul>
<li><b>Belum ada PIC / tanpa EDD atau tindakan</b> (merah): kasus Open lebih dari 2 hari kerja sejak Tanggal Terima, dengan PIC kosong atau dengan Tindakan dan Tanggal EDD 1 sama-sama kosong. Penerima: Head CLRM, Fraud Investigator.</li>
<li><b>EDD lewat batas waktu</b> (merah): asesmen Dilanjutkan, kasus Open, Hasil EDD kosong, dan Batas Waktu EDD terlewat. Penerima: PIC, Head CLRM.</li>
<li><b>Hold &gt; 30 hari</b> (kuning): kasus Open dengan Tanggal Hold lebih dari 30 hari lalu, belum dilepas (Released) dan tidak diblokir. Penerima: PIC, Head CLRM.</li>
<li><b>Lapor regulator terlambat</b> (merah): setelah Tanggal Blokir, Tanggal Lapor masih kosong melewati batas Komdigi 7 hari, BI 14 hari, atau PPATK 30 hari. Penerima: Compliance Officer, Head CLRM.</li>
<li><b>Open &gt; 90 hari</b> (kuning): kasus Open lebih dari 90 hari sejak Tanggal Terima. Penerima: PIC, Head CLRM.</li>
<li><b>Data penting kosong</b> (kuning): kasus Open tanpa Uraian, Nominal Korban, Jenis Dugaan, atau Kategori Pelapor. Penerima: Compliance Officer.</li>
</ul>` },
  { h: 'Export Excel', b: `<ul>
<li>Mengekspor baris yang tampil di Table, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor, Tanggal Dibuat, lalu semua isian. Kolom pertama setelah Tanggal Dibuat adalah No Laporan EDD. Nominal tetap berupa angka. Nama Terlapor dan RRN diekspor utuh bagi Head CLRM dan Fraud Investigator, dan tersamar bagi peran lain.</li>
<li>Nama file: <b>Kasus_Fraud_EDD_[tanggal hari ini].xlsx</b>.</li>
<li>Export tercatat di menu Log.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<ul>
<li><b>Super Admin</b>: semua aksi (Nama Terlapor dan RRN tetap tersamar, tanpa ikon mata).</li>
<li><b>Head CLRM</b>: Lihat, Export, Batalkan, Approve penutupan. Dapat membuka Terlapor dan RRN lewat ikon mata.</li>
<li><b>Fraud Investigator</b>: Lihat, Tambah, Ubah (kasus miliknya), Export. Dapat membuka Terlapor dan RRN lewat ikon mata.</li>
<li><b>Compliance Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Ubah (kasus miliknya), Export.</li>
<li><b>Risk Officer, Legal Officer, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di Admin &gt; Permission.</p>` },
]
