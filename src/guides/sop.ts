import type { GuideItem } from '../kit/PageGuide'

export const SopGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Atur <b>Periode Tanggal Berlaku</b> bila perlu.</li>
<li>Klik kartu atau grafik untuk membuka tab <b>Table</b> dengan filter yang sudah terpasang.</li>
<li>Di tab <b>Table</b>, cari atau filter SOP.</li>
<li>Klik <b>Tambah</b>. Isi semua isian bertanda * (No Dokumen harus unik). File boleh dikosongkan. Klik <b>Simpan</b>.</li>
<li>Klik <b>Edit</b> untuk mengubah data. Kolom Alasan perubahan boleh diisi.</li>
<li>Head CLRM dapat <b>Batalkan</b> SOP (status menjadi Dicabut) dan <b>Kembalikan</b> bila perlu.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh daftar yang tampil.</li>
</ol>` },
  { h: 'Dashboard', b: `<p>Dashboard memuat 4 kartu ringkasan, 3 grafik, dan 1 tabel SOP yang harus ditinjau.</p>
<ul>
<li><b>Periode Tanggal Berlaku</b>: isi tanggal awal dan akhir untuk membatasi data. Kosong = semua data. Tombol Reset mengosongkan periode.</li>
<li>Klik kartu <b>Aktif</b>, batang unit kerja, irisan status, atau batang umur dokumen untuk membuka Table terfilter.</li>
<li>Klik baris tabel peninjauan untuk membuka Detail SOP.</li>
<li>SOP yang <b>Dibatalkan</b> tidak dihitung di dashboard.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah urutan baris (1, 2, 3, ...), bukan ID data.</li>
<li>Urutan tabel mengikuti <b>Tanggal Dibuat</b>, terbaru di atas.</li>
<li><b>Pencarian</b> mencari di No Dokumen, Judul, dan Ringkasan.</li>
<li><b>Filter</b>: Pemilik Dokumen, Status, Tahun Berlaku, dan Umur Dokumen (&lt; 1 tahun, 1-2 tahun, &gt; 2 tahun). Klik Apply Filters untuk memakai, Clear All untuk menghapus.</li>
<li><b>Pagination</b>: pilih 10, 25, atau 50 baris per halaman.</li>
<li>SOP yang dibatalkan tetap tampil di Table dengan teks abu-abu.</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Isian wajib</b> (bertanda *): No Dokumen, Judul, Ringkasan (Key Point), Pemilik Dokumen, Tanggal Berlaku, Tanggal Perubahan Terakhir, No Revisi, Retensi, Klasifikasi, Status, dan PIC Dokumen. <b>File Dokumen</b> boleh dikosongkan.</p>
<ul>
<li><b>No Dokumen</b> harus unik. Sistem menolak nomor yang sudah dipakai SOP lain.</li>
<li><b>Tanggal Perubahan Terakhir</b> tidak boleh sebelum Tanggal Berlaku.</li>
<li><b>Pemilik Dokumen</b> dan <b>PIC Dokumen</b> dipilih dari Master Data (Unit Kerja dan PIC).</li>
<li><b>Retensi</b>: 5 Tahun atau 10 Tahun. <b>Klasifikasi</b> (klasifikasi informasi): Publik, Internal, Rahasia, atau Sangat Rahasia. <b>Status</b>: Aktif, Dalam Review, atau Dicabut.</li>
<li><b>Tanggal Peninjauan Berikutnya</b> terisi otomatis = Tanggal Berlaku + 1 tahun. Isian ini nonaktif (tidak bisa diketik), berubah mengikuti Tanggal Berlaku, dan dihitung ulang saat disimpan. SOP berstatus Dicabut tidak memicu notifikasi peninjauan.</li>
<li><b>Upload file</b> (kolom <b>File Dokumen</b>, tidak wajib): format PDF, JPG, JPEG, atau PNG. Maksimal 25 MB, 1 file.</li>
<li>Saat Edit ada kolom <b>Alasan perubahan</b>. Kolom ini tidak wajib di halaman ini.</li>
<li>Tidak ada pilihan Lainnya di halaman ini.</li>
<li>Yang boleh <b>Tambah</b>: Compliance Officer, PIC, Super Admin. Yang boleh <b>Edit</b>: Compliance Officer, PIC, Super Admin. PIC hanya dapat mengedit SOP yang PIC Dokumen-nya adalah dirinya.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib diisi.</li>
<li>SOP yang dibatalkan berstatus <b>Dicabut</b>, tidak bisa diedit, dan tidak masuk dashboard maupun alert.</li>
<li><b>Kembalikan</b> memulihkan status sebelum dibatalkan. Alasan wajib diisi.</li>
<li>Status Dicabut yang dipilih manual lewat Edit berbeda dengan Batalkan: data masih bisa diedit dan masuk hitungan dashboard.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<p>Klik <b>Lihat Detail</b> untuk melihat semua isian, badge alert yang aktif, dan keterangan pembatalan (siapa, kapan, alasan, status sebelumnya).</p>
<p>Bagian <b>Log Perubahan</b> mencatat: data dibuat (siapa dan kapan), perubahan data (nilai sebelum dan sesudah, siapa, kapan, alasan), pembatalan, dan pengembalian beserta alasannya.</p>` },
  { h: 'Notifikasi', b: `<p>Alert halaman ini muncul sebagai notifikasi di ikon <b>lonceng</b> pada header (kanan atas), dengan angka jumlah yang belum dibaca. Notifikasi hanya tampil bagi penerima yang tercantum di bawah. Super Admin melihat semua. Klik notifikasi untuk membuka halaman ini dan Detail datanya. Gunakan "Tandai semua dibaca" untuk mengosongkan penghitung.</p>
<ul>
<li><b>Peninjauan akan tiba</b> (kuning): Tanggal Peninjauan Berikutnya 30 hari lagi atau kurang, dan SOP belum Dicabut. Penerima: PIC Dokumen, Compliance Officer.</li>
<li><b>Peninjauan terlewat</b> (merah): Tanggal Peninjauan Berikutnya sudah lewat dan SOP belum Dicabut. Penerima: PIC Dokumen, Head CLRM.</li>
<li><b>Data belum lengkap</b> (kuning): Tanggal Peninjauan (SOP belum Dicabut), Status, atau PIC Dokumen kosong. Penerima: Compliance Officer.</li>
</ul>
<p>Contoh pesan: "SOP [judul] perlu ditinjau sebelum [tanggal] (30 hari lagi)". SOP berstatus <b>Dicabut</b> tidak memicu notifikasi peninjauan dan tidak dihitung di angka, grafik, maupun tabel peninjauan.</p>` },
  { h: 'Export Excel', b: `<ul>
<li>Mengekspor baris yang tampil di Table, sesuai pencarian dan filter yang aktif.</li>
<li>Kolom: Nomor, Tanggal Dibuat, lalu semua isian SOP. Kolom file berisi nama file.</li>
<li>Nama file: <b>Daftar_SOP_[tanggal hari ini].xlsx</b>.</li>
<li>Setiap export tercatat di menu Log.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<ul>
<li><b>Super Admin</b>: semua aksi.</li>
<li><b>Head CLRM</b>: Lihat, Export, Batalkan.</li>
<li><b>Compliance Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>PIC</b>: Lihat, Tambah, Ubah (hanya SOP miliknya), Export.</li>
<li><b>Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
<li>Halaman ini tidak memakai approval.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di Admin &gt; Permission.</p>` },
]
