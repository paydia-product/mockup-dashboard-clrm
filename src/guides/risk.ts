import type { GuideItem } from '../kit/PageGuide'

export const RiskGuide: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol>
<li>Buka tab <b>Dashboard</b>. Atur <b>Periode Tanggal Register</b> bila perlu.</li>
<li>Klik kartu, kotak heatmap, atau batang grafik untuk melihat risikonya. Sebagian membuka tab <b>Table</b> terfilter.</li>
<li>Di tab <b>Table</b>, cari atau filter risiko.</li>
<li>Klik <b>Tambah</b>. Isi field wajib, pilih Skor Dampak dan Skor Kemungkinan, lalu <b>Simpan</b>. Skor, Level, dan Posisi RAS-RT terhitung otomatis.</li>
<li>Klik <b>Edit</b>. Bila Level Risiko berubah dan Anda bukan Risk Officer, perubahan skor menunggu <b>approval Risk Officer</b>.</li>
<li>Head CLRM dapat <b>Batalkan</b> dan <b>Kembalikan</b>.</li>
<li>Klik <b>Export Excel</b>.</li>
</ol>` },
  { h: 'Dashboard', b: `<ul>
<li><b>Periode Tanggal Register</b>: kosong = semua data.</li>
<li>4 kartu: High, Medium, Low, dan Breach (RAS-RT). Klik kartu untuk membuka Table terfilter.</li>
<li><b>Heatmap</b> 3 x 3 (Dampak x Kemungkinan). Klik satu kotak untuk menampilkan daftar risiko di bawahnya. Klik baris untuk membuka Detail.</li>
<li>3 grafik batang: risiko per domain menurut level, risiko per unit kerja pemilik, dan Dalam Toleransi serta Breach per domain.</li>
<li>Klik batang domain atau unit kerja untuk membuka Table terfilter.</li>
<li>Risiko yang <b>Dibatalkan</b> tidak dihitung.</li>
</ul>` },
  { h: 'Rumus Level Risiko & RAS-RT', b: `<ul>
<li><b>Skor Total</b> = Skor Dampak x Skor Kemungkinan (masing-masing 1-3).</li>
<li><b>Level Risiko Awal (Inherent)</b>: skor 1-2 = <b>Low</b>, skor 3-4 = <b>Medium</b>, skor 6-9 = <b>High</b>.</li>
<li><b>Posisi RAS-RT</b> otomatis dari Level: Low = <b>Dalam Appetite</b>, Medium = <b>Dalam Toleransi</b>, High = <b>Breach (wajib eskalasi)</b>.</li>
<li>Di Detail muncul rujukan baca-saja per domain: <b>Risk Appetite</b> (Low, target ideal), <b>Risk Tolerance</b> (Medium, batas maksimum diterima), dan <b>Breach</b> (High, wajib eskalasi). Rujukan ini tidak ikut di Export.</li>
<li>Tombol heatmap <b>Setelah kontrol (residual)</b> belum dipakai.</li>
</ul>` },
  { h: 'Tabel, cari, filter', b: `<ul>
<li>Kolom <b>Nomor</b> adalah urutan baris, bukan ID data.</li>
<li>Urutan tabel mengikuti <b>Tanggal Dibuat</b>, terbaru di atas.</li>
<li><b>Pencarian</b> mencari di nomor internal, Risk Event, dan Kontrol / Mitigasi.</li>
<li><b>Filter</b>: Periode Register (rentang tanggal), Domain, Level, Unit Kerja, Respon, Produk, Vendor / Mitra, dan Posisi RAS-RT.</li>
<li><b>Pagination</b>: 10, 25, atau 50 baris per halaman.</li>
<li>Risiko yang dibatalkan tetap tampil di Table dengan teks abu-abu.</li>
</ul>` },
  { h: 'Tambah & Edit', b: `<p><b>Field wajib</b>: Konteks, Risk Event, Domain Risiko, Skor Dampak, Skor Kemungkinan, Respon, Kontrol / Mitigasi, Unit Pemilik Risiko, dan Tanggal Register. <b>Produk</b> dan <b>Vendor / Mitra</b> boleh kosong.</p>
<ul>
<li><b>Domain Risiko</b>: 10 domain RAS-RT. <b>Respon</b>: Avoid, Control, Transfer, atau Accept.</li>
<li><b>Skor Dampak</b>: 1 Rendah, 2 Sedang, 3 Tinggi. <b>Skor Kemungkinan</b>: 1-3.</li>
<li>Unit Kerja, Produk, dan Vendor / Mitra dipilih dari Master Data.</li>
<li><b>Field otomatis</b> (tidak diisi manual): Skor Total, Level Risiko Awal, Posisi RAS-RT, dan tiga rujukan RAS-RT.</li>
<li>Saat Edit ada kolom <b>Alasan perubahan</b>. Kolom ini tidak wajib, tetapi sebaiknya diisi bila skor berubah (alasan ikut ke Risk Officer).</li>
<li>Tanggal naik level dicatat otomatis. Dipakai oleh alert High.</li>
<li>Yang boleh <b>Tambah</b>: Risk Officer, PIC, Super Admin. Yang boleh <b>Edit</b>: Risk Officer, PIC, Super Admin. PIC hanya dapat mengedit risiko milik Unit Kerjanya sendiri.</li>
</ul>` },
  { h: 'Approval', b: `<ul>
<li>Jenis: <b>Perubahan Level Risiko</b>. Approver: <b>Risk Officer</b>.</li>
<li>Diajukan otomatis saat Edit oleh peran selain Risk Officer yang membuat <b>Level</b> berubah (naik atau turun). Hanya perubahan Skor Dampak dan Skor Kemungkinan yang ikut diajukan. Perubahan kolom lain langsung tersimpan.</li>
<li>Risk Officer mengedit tanpa approval.</li>
<li><b>Menunggu</b>: risiko terkunci. Tombol Edit dan Batalkan hilang, dan Detail menampilkan banner menunggu persetujuan.</li>
<li><b>Disetujui</b>: skor baru berlaku dan Level serta Posisi RAS-RT ikut berubah. <b>Ditolak</b>: skor lama tetap.</li>
<li>Keputusan dibuat di menu <b>Approval</b> oleh Risk Officer atau Super Admin.</li>
</ul>` },
  { h: 'Batalkan & Kembalikan', b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang melihat tombol <b>Batalkan</b>. Alasan wajib. Tidak bisa dibatalkan saat Menunggu approval.</li>
<li>Risiko yang dibatalkan berstatus <b>Dibatalkan</b> dan tidak masuk dashboard maupun alert.</li>
<li><b>Kembalikan</b> memulihkan status sebelumnya. Alasan wajib.</li>
</ul>` },
  { h: 'Detail & Log Perubahan', b: `<p><b>Lihat Detail</b> menampilkan semua isian, termasuk skor, level, posisi RAS-RT, rujukan Appetite / Tolerance / Breach, dan badge alert aktif.</p>
<p><b>Log Perubahan</b> mencatat: data dibuat, perubahan data (sebelum dan sesudah, siapa, kapan, alasan), pengajuan approval (pengaju, approver, perubahan, alasan), keputusan Approve atau Reject beserta catatan, pembatalan, dan pengembalian.</p>` },
  { h: 'Simulasi notifikasi email', b: `<p>Angka di tombol <b>Simulasi notifikasi</b> = jumlah alert aktif. Maksimal 3 email per jenis alert. Bila tidak ada data cocok, tampil <b>contoh statis</b>.</p>
<ul>
<li><b>Risiko High baru / naik ke High</b> (merah): Level High dan tanggal register atau kenaikan level dalam 7 hari terakhir. Penerima: Risk Officer, Head CLRM, Risk Owner (Unit Kerja risiko).</li>
<li><b>Breach RAS-RT</b> (merah): Posisi RAS-RT Breach (Level High), wajib eskalasi. Penerima: Head CLRM, Direksi.</li>
<li><b>Dalam Toleransi RAS-RT</b> (kuning): Posisi RAS-RT Dalam Toleransi (Level Medium). Penerima: Head CLRM, Direksi.</li>
</ul>
<p>Risiko Low (Dalam Appetite) tidak memicu alert.</p>` },
  { h: 'Export Excel', b: `<ul>
<li>Mengekspor baris yang tampil di Table, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor, Tanggal Dibuat, semua isian, plus Skor Total, Level, dan Posisi RAS-RT. Tiga rujukan Appetite / Tolerance / Breach tidak diekspor.</li>
<li>Nama file: <b>Risk_Register_[tanggal hari ini].xlsx</b>.</li>
<li>Export tercatat di menu Log.</li>
</ul>` },
  { h: 'Hak akses per peran', b: `<ul>
<li><b>Super Admin</b>: semua aksi.</li>
<li><b>Head CLRM</b>: Lihat, Export, Batalkan.</li>
<li><b>Risk Officer</b>: Lihat, Tambah, Ubah, Approve, Export.</li>
<li><b>PIC</b>: Lihat, Tambah, Ubah (hanya Unit Kerjanya), Export.</li>
<li><b>Compliance Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer</b>: Lihat dan Export.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di Admin &gt; Permission.</p>` },
]
