import type { GuideItem } from '../kit/PageGuide'

export const REGCHANGE_GUIDE: GuideItem[] = [
  {
    h: 'Alur penggunaan',
    b: `<ol>
<li>Buka tab <b>Dashboard</b> (tab awal). Atur <b>Periode Tanggal Dicatat</b> bila perlu. Kosong berarti semua.</li>
<li>Buka tab <b>Table</b>. Cari atau saring peraturan lewat pencarian dan tombol <b>Filter</b>.</li>
<li>Klik <b>Tambah</b>. Isi field bertanda <b>*</b> lalu klik <b>Simpan</b>.</li>
<li>Klik <b>Edit</b> untuk memperbarui penilaian dampak, Pemenuhan (%), tindak lanjut, jawaban imbauan, sosialisasi, atau daftar SOP.</li>
<li>Mengubah data identitas peraturan (jenis, nomor, tahun, regulator, dan sejenisnya) membuat <b>pengajuan ke Ketua SMKI</b>. Lihat item Approval.</li>
<li>Head CLRM dapat <b>Batalkan</b> data yang salah, lalu <b>Kembalikan</b> bila perlu. Alasan wajib.</li>
<li>Klik <b>Export Excel</b> untuk mengunduh baris yang sedang tampil.</li>
</ol>`,
  },
  {
    h: 'Dashboard',
    b: `<ul>
<li>Isi: peraturan per regulator dan jenis perubahan, tren peraturan baru dan perubahan, status kepatuhan, rata-rata pemenuhan per kategori, peraturan belum dinilai (grafik dan tabel), Partial dan Gap per unit kerja, dan agenda peraturan berlaku 90 hari serta imbauan perlu dijawab.</li>
<li>Filter <b>Periode Tanggal Dicatat</b> (dua tanggal) menyaring semua kartu, kecuali Tren yang memakai semua data. Tombol <b>Reset</b> mengosongkannya.</li>
<li><b>Tren peraturan baru dan perubahan</b> punya filter bulan sendiri (3, 6, 9, 12 bulan terakhir, Seluruh Waktu, atau Custom).</li>
<li><b>Klik grafik</b> membuka tab Table yang sudah terfilter: batang regulator (filter Regulator), irisan Status kepatuhan (filter Status Kepatuhan), dan batang Partial/Gap per unit kerja (filter Unit Kerja Terdampak).</li>
<li>Klik <b>baris</b> pada tabel belum dinilai atau tabel agenda untuk membuka Detail peraturan.</li>
<li>Data Dibatalkan tidak dihitung di dashboard.</li>
<li>Klik ikon info (i) pada tiap kartu untuk melihat cara membacanya.</li>
</ul>`,
  },
  {
    h: 'Tabel, cari, filter',
    b: `<ul>
<li>Kolom <b>Nomor</b> adalah nomor urut baris, bukan ID. Nomor berlanjut antar halaman dan kembali ke 1 saat cari atau filter berubah.</li>
<li>Urutan: <b>Tanggal Dibuat</b> terbaru dulu.</li>
<li>Kolom: Peraturan / Surat, Regulator, Tentang, Jenis Perubahan, Status Peraturan, Dampak, Pemenuhan, Status Kepatuhan, Tanggal Dibuat, dan Aksi.</li>
<li><b>Pencarian</b> mencari di nomor internal, nama peraturan (jenis, nomor, tahun), Tentang, dan Kategori.</li>
<li><b>Filter</b>: Periode (Tanggal Dicatat), Regulator, Jenis Perubahan, Status Kepatuhan, Unit Kerja Terdampak, dan Status Peraturan (termasuk Dibatalkan).</li>
<li>Regulator atau kategori yang diketik bebas tampil sebagai <b>Lainnya</b> di tabel. Filter Regulator Lainnya menampilkan regulator di luar daftar.</li>
<li>Pagination: 10, 25, atau 50 baris per halaman. Data Dibatalkan tetap tampil di tabel (teks abu-abu).</li>
</ul>`,
  },
  {
    h: 'Tambah & Edit',
    b: `<p><b>Field wajib</b>: Jenis Peraturan / Surat, Nomor, Tahun, Regulator / Penerbit, Tentang, Kategori, Jenis Perubahan, Status Peraturan, Tanggal Terbit, Tanggal Dicatat CLRM, Tingkat Dampak, Uraian Dampak, Unit Kerja Terdampak, Tanggal Sosialisasi Internal, dan Lampiran / Bukti.</p>
<p><b>Wajib bersyarat</b>:</p>
<ul>
<li><b>Tanggal Berlaku</b>: wajib kecuali Jenis Perubahan <b>Imbauan</b>.</li>
<li><b>Peraturan yang Diubah / Dicabut</b>: muncul dan wajib bila Jenis Perubahan <b>Perubahan</b> atau <b>Pencabutan</b>. Pilihannya daftar peraturan lain yang tidak Dibatalkan.</li>
<li><b>Tindak Lanjut</b>: wajib bila Status Kepatuhan <b>Partial</b> atau <b>Gap</b>.</li>
<li><b>Perlu Dijawab ke Regulator?</b>: wajib bila Jenis Perubahan Imbauan. Bila <b>Ya</b>, muncul <b>Batas Waktu Jawaban</b> (wajib) dan <b>Tanggal Dijawab</b>.</li>
</ul>
<p><b>Aturan</b>:</p>
<ul>
<li>Tanggal Berlaku tidak boleh sebelum Tanggal Terbit.</li>
<li>Peraturan tidak boleh memilih dirinya sendiri sebagai yang diubah.</li>
<li>Kombinasi Jenis, Nomor, dan Tahun harus unik (tidak boleh sama dengan peraturan lain yang belum Dibatalkan).</li>
<li>Tanggal Dijawab tidak boleh sebelum Tanggal Dicatat.</li>
<li><b>Pemenuhan (%)</b> berisi 0 sampai 100, boleh kosong (belum dinilai).</li>
</ul>
<p><b>Field otomatis</b>: <b>Status Kepatuhan</b> dihitung dari Pemenuhan. 100 atau lebih = Comply, 70 sampai 99 = Partial, di bawah 70 = Gap, kosong = Belum Dinilai.</p>
<p><b>Lainnya</b>: dropdown <b>Regulator</b> dan <b>Kategori</b> punya opsi Lainnya. Bila dipilih, muncul isian teks bebas yang wajib diisi.</p>
<p><b>Daftar SOP</b>: field opsional. Pilih SOP dari modul SOP, dan hapus dari daftar bila sudah diperbarui.</p>
<p><b>Upload</b>: PDF, JPG, JPEG, atau PNG. Maksimal 25 MB dan 1 file.</p>
<p><b>Siapa boleh</b>: Tambah oleh Compliance Officer dan Super Admin. Edit oleh Compliance Officer dan Super Admin. Peran PIC tidak dapat mengedit di halaman ini. Kolom <b>Alasan perubahan</b> di form Edit bersifat opsional dan ikut tercatat.</p>`,
  },
  {
    h: 'Approval',
    b: `<ul>
<li>Yang diajukan: perubahan pada <b>data identitas</b> peraturan, yaitu Jenis, Nomor, Tahun, Regulator, Tentang, Kategori, Jenis Perubahan, Status Peraturan, Tanggal Terbit, Tanggal Berlaku, dan Peraturan yang Diubah / Dicabut. Jenis pengajuan: <b>Perubahan Daftar Peraturan</b>.</li>
<li>Perubahan pada kolom lain (dampak, Pemenuhan, tindak lanjut, dan seterusnya) <b>tersimpan langsung</b>, tanpa approval.</li>
<li><b>Approver</b>: Ketua SMKI (Super Admin juga dapat memutuskan). Keputusan di menu <b>Approval</b>.</li>
<li>Saat <b>Menunggu</b>: data terkunci. Tombol <b>Edit</b> dan <b>Batalkan</b> hilang, dan Detail menampilkan kotak kuning dengan tautan ke menu Approval. Nilai lama tetap berlaku.</li>
<li>Setelah <b>Disetujui</b>: perubahan diterapkan ke data.</li>
<li>Setelah <b>Ditolak</b> (catatan wajib): data tetap seperti semula dan bisa diedit lagi.</li>
<li>Menambah data baru tidak memerlukan approval.</li>
</ul>`,
  },
  {
    h: 'Batalkan & Kembalikan',
    b: `<ul>
<li>Hanya <b>Head CLRM</b> (dan Super Admin) yang punya aksi <b>Batalkan</b>.</li>
<li>Klik Batalkan di baris tabel. <b>Alasan wajib</b> diisi. Status menjadi Dibatalkan.</li>
<li>Data yang sedang menunggu approval tidak bisa dibatalkan.</li>
<li>Data Dibatalkan <b>tidak dihitung di dashboard</b> dan <b>tidak memicu alert</b>.</li>
<li><b>Kembalikan</b> memulihkan status sebelumnya. <b>Alasan wajib</b>.</li>
<li>Keduanya tercatat di Log Perubahan.</li>
</ul>`,
  },
  {
    h: 'Detail & Log Perubahan',
    b: `<ul>
<li>Klik <b>Lihat Detail</b> untuk melihat semua field peraturan dan badge alert yang aktif.</li>
<li><b>Log Perubahan</b> memuat riwayat dari terbaru: data dibuat, perubahan data, pengajuan dan keputusan approval, pembatalan, dan pengembalian.</li>
<li>Tiap entri mencatat <b>siapa</b>, <b>kapan</b>, kolom yang berubah (<b>sebelum</b> dan <b>sesudah</b>), <b>alasan</b>, dan untuk approval juga pengaju serta approver.</li>
</ul>`,
  },
  {
    h: 'Simulasi notifikasi email',
    b: `<p>Tombol <b>Simulasi notifikasi</b> menampilkan contoh email. Angka di tombol adalah <b>jumlah alert aktif</b> (data Dibatalkan tidak dihitung). Tiap jenis menampilkan maksimal 3 email.</p>
<ul>
<li><b>Belum dinilai &gt; 10 hari kerja</b> (kuning). Tingkat Dampak masih kosong dan sudah lebih dari 10 hari kerja sejak Tanggal Dicatat. Penerima: <b>Compliance Officer</b> dan <b>Head CLRM</b>.</li>
<li><b>Akan berlaku, kepatuhan belum Comply</b> (kuning, merah saat 7 hari atau kurang). Tanggal Berlaku dalam 90 hari ke depan dan Status Kepatuhan bukan Comply. Tahapnya H-90, H-60, H-30, dan H-7. Penerima: <b>PIC unit terdampak</b> dan <b>Head CLRM</b>.</li>
<li><b>Imbauan harus dijawab</b> (kuning, merah bila terlewat). Imbauan perlu dijawab, belum ada Tanggal Dijawab, dan Batas Waktu Jawaban 7 hari atau kurang (termasuk yang sudah lewat). Penerima: <b>Compliance Officer</b> dan <b>Head CLRM</b>.</li>
<li><b>Dicabut, SOP terkait perlu ditinjau</b> (kuning). Status Peraturan Dicabut, Tanggal Berlaku sudah lewat, dan daftar SOP masih berisi. Penerima: <b>PIC unit terdampak</b> dan <b>Compliance Officer</b>.</li>
<li><b>Peraturan baru berdampak Tinggi</b> (kuning). Tingkat Dampak Tinggi dan dicatat dalam 7 hari terakhir. Penerima: <b>Head CLRM</b> dan <b>Direktur terkait</b>.</li>
</ul>
<p>Bila tidak ada data yang cocok, ditampilkan <b>contoh statis</b> (diberi tanda).</p>`,
  },
  {
    h: 'Export Excel',
    b: `<ul>
<li>Mengekspor <b>baris yang sedang tampil</b> di tabel, sesuai pencarian dan filter.</li>
<li>Kolom: Nomor (urutan baris), Tanggal Dibuat, lalu semua field peraturan yang terisi (termasuk Status Kepatuhan). Lampiran diekspor sebagai nama file.</li>
<li>Nama file: <b>Daftar_Peraturan_&lt;tanggal hari ini&gt;.xlsx</b>.</li>
<li>Setiap export tercatat di menu <b>Log</b> beserta jumlah barisnya.</li>
</ul>`,
  },
  {
    h: 'Hak akses per peran',
    b: `<p>Default matriks untuk modul ini:</p>
<ul>
<li><b>Super Admin</b>: semua aksi.</li>
<li><b>Head CLRM</b>: Lihat, Batalkan/Kembalikan, Export.</li>
<li><b>Compliance Officer</b>: Lihat, Tambah, Ubah, Export.</li>
<li><b>Ketua SMKI</b>: Lihat, Approve perubahan daftar peraturan, Export.</li>
<li><b>PIC</b>: Lihat dan Export. Hak Ubah ada di matriks tetapi tombol Edit disembunyikan di halaman ini.</li>
<li><b>Risk Officer, Legal Officer, Fraud Investigator, Viewer</b>: Lihat dan Export.</li>
</ul>
<p>Super Admin dapat mengubah matriks ini di <b>Admin &gt; Permission</b>.</p>`,
  },
]
