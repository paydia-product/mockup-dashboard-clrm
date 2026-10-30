import type { GuideItem } from '../kit/PageGuide'

export const APPROVAL_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka menu <b>Approval</b>. Daftar berisi semua pengajuan dari modul yang memakai approval.</li><li>Cari atau filter berdasarkan <b>status</b> dan <b>modul</b>.</li><li>Klik <b>Lihat Detail</b> pada baris.</li><li>Periksa kolom, nilai lama, nilai baru, dan alasan pengaju.</li><li>Klik <b>Approve</b> atau <b>Reject</b> (hanya tampil jika Anda berhak memutuskan).</li><li>Isi catatan, lalu klik <b>Konfirmasi</b>.</li></ol>` },
  { h: 'Tabel, cari, filter', b: `<ul><li>Kolom: Nomor Request (nomor urut baris), Modul, Jenis Request, Data, Pengaju, Tanggal Ajuan, Status, Aksi.</li><li>Urutan: pengajuan <b>terbaru</b> di atas.</li><li>Kotak cari mencari pada <b>jenis request, data, pengaju, dan nama modul</b>.</li><li>Filter <b>Semua status</b>: Menunggu, Disetujui, Ditolak.</li><li>Filter <b>Semua modul</b>: hanya modul yang punya pengajuan.</li><li>Pagination 10, 25, atau 50 baris per halaman.</li></ul>` },
  { h: 'Siapa yang bisa Approve / Reject', b: `<ul><li>Tombol muncul hanya bila status <b>Menunggu</b>, peran Anda sama dengan <b>Approver</b> pengajuan (atau Anda <b>Super Admin</b>), dan peran Anda punya izin <b>Approve</b> pada modul itu.</li><li>Approver bawaan: <b>Head CLRM</b> untuk Regulatory Findings Tracker dan Fraud Case Monitoring, <b>Ketua SMKI</b> untuk Regulatory Change, <b>Risk Officer</b> untuk Risk Register.</li><li>Peran lain hanya dapat melihat detail.</li></ul>` },
  { h: 'Catatan saat memutuskan', b: `<ul><li><b>Approve</b>: catatan boleh kosong.</li><li><b>Reject</b>: catatan <b>wajib</b>. Tanpa catatan muncul pesan "Catatan wajib diisi saat Reject".</li><li>Setelah Approve, perubahan yang diajukan diterapkan ke data. Setelah Reject, data tidak berubah.</li><li>Keputusan hanya bisa dibuat sekali. Pengajuan yang sudah Disetujui atau Ditolak tidak bisa diputuskan lagi.</li></ul>` },
  { h: 'Isi Detail pengajuan', b: `<p>Detail menampilkan Modul, Jenis request, Data, Pengaju (beserta peran), Tanggal ajuan, Approver, dan Alasan. Tabel di bawahnya membandingkan <b>nilai lama</b> (merah) dan <b>nilai baru</b> (hijau) per kolom. Baris status menampilkan siapa yang memutuskan, kapan, dan catatannya.</p>` },
  { h: 'Notifikasi dan buka langsung', b: `<p>Alamat dengan parameter <b>?id=</b> membuka detail pengajuan tertentu secara langsung. Angka pengajuan yang menunggu keputusan Anda dihitung dari pengajuan berstatus Menunggu yang boleh Anda putuskan.</p>` },
  { h: 'Hak akses per peran', b: `<ul><li><b>Lihat</b>: semua peran.</li><li><b>Approve</b>: Head CLRM, Ketua SMKI, Risk Officer, dan Super Admin.</li><li>Super Admin dapat mengubah matriks di Admin &gt; Permission.</li></ul>` },
]

export const masterGuide = (nama: string): GuideItem[] => [
  { h: 'Alur penggunaan', b: `<ol><li>Buka Master Data &gt; <b>${nama}</b>.</li><li>Cari nilai di kotak cari bila perlu.</li><li>Klik <b>Tambah</b>, isi <b>Nama</b>, klik <b>Simpan</b> (atau tekan Enter).</li><li>Untuk mengubah, klik <b>Edit</b> pada baris, ubah nama, lalu <b>Simpan</b>.</li><li>Untuk menghapus, klik <b>Hapus</b>, lalu konfirmasi pada dialog.</li></ol>` },
  { h: `Fungsi master ${nama}`, b: `<p>Daftar <b>${nama}</b> ini menjadi sumber pilihan dropdown di form modul yang memakainya. Nilai baru langsung tersedia sebagai pilihan.</p>` },
  { h: 'Aturan nama', b: `<ul><li>Nama <b>wajib</b> diisi, minimal <b>2</b> karakter, maksimal <b>255</b> karakter.</li><li>Hanya huruf, angka, spasi, dan karakter <b>\` ' - &amp;</b>.</li><li>Nama tidak boleh sama dengan nama lain (huruf besar atau kecil dianggap sama): "Nama sudah ada".</li><li><b>Lainnya</b> tidak boleh dipakai sebagai nama master, karena sudah disediakan otomatis di dropdown form sebagai isian teks bebas.</li><li>Saat Edit, nama lama yang belum diganti tidak diperiksa ulang karakternya.</li></ul>` },
  { h: 'Dampak Edit dan Hapus', b: `<p><b>Edit</b> atau <b>Hapus</b> tidak mengubah data lama yang sudah memakai nilai tersebut. Hanya pilihan dropdown berikutnya yang berubah.</p>` },
  { h: 'Tabel dan cari', b: `<ul><li>Kolom: No (urutan dalam daftar master), nama, dan Aksi.</li><li>Kotak cari menyaring nama pada daftar ini.</li><li>Daftar kosong menampilkan "Belum ada data".</li></ul>` },
  { h: 'Log', b: `<p>Setiap Tambah, Ubah, dan Hapus tercatat di menu <b>Log</b> (modul Master Data), lengkap dengan nama master dan nilainya.</p>` },
  { h: 'Hak akses master', b: `<ul><li><b>Lihat</b>: semua peran.</li><li><b>Tambah</b> dan <b>Ubah</b> (termasuk Edit dan Hapus): <b>Head CLRM</b> dan <b>Super Admin</b>.</li><li>Peran lain tidak melihat tombol Tambah, Edit, dan Hapus.</li></ul>` },
]

export const AKUN_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka Admin &gt; <b>Akun</b>.</li><li>Cari akun lewat kotak cari bila perlu.</li><li>Klik <b>Tambah</b>, isi Nama, Email, Peran, Unit Kerja, dan Status.</li><li>Klik <b>Simpan</b>.</li><li>Untuk mengubah akun, klik <b>Edit</b>. Untuk menutup atau membuka akses, klik <b>Nonaktifkan</b> atau <b>Aktifkan</b>.</li></ol>` },
  { h: 'Tabel, cari, filter', b: `<ul><li>Kolom: Nama, Email, Peran, Unit Kerja, Status, Terakhir Login, Aksi.</li><li>Kotak cari mencari pada <b>nama, email, peran, dan unit kerja</b>.</li><li>Pagination 10, 25, atau 50 baris per halaman.</li></ul>` },
  { h: 'Tambah dan Edit akun', b: `<ul><li><b>Nama</b> wajib diisi.</li><li><b>Email</b> wajib berformat valid dan <b>tidak boleh sama</b> dengan email akun lain.</li><li><b>Peran</b> dipilih dari 9 peran: Super Admin, Head CLRM, Compliance Officer, Risk Officer, Legal Officer, Fraud Investigator, Ketua SMKI, PIC, Viewer.</li><li><b>Unit Kerja</b> dipilih dari master Unit Kerja.</li><li><b>Status</b>: Aktif atau Nonaktif.</li><li>Akun baru memakai password dan PIN awal (tertera di form). Pengguna dapat menggantinya lewat menu profil.</li></ul>` },
  { h: 'Batasan', b: `<ul><li>Akun <b>tidak dapat dihapus</b>. Untuk menutup akses, gunakan <b>Nonaktifkan</b>.</li><li>Tombol Edit dan Nonaktifkan hanya tampil bila peran Anda punya izin <b>Ubah</b> pada Admin. Tombol Tambah butuh izin <b>Tambah</b>.</li></ul>` },
  { h: 'Log', b: `<p>Tambah akun, Ubah akun, dan perubahan status akun tercatat di menu <b>Log</b> (modul Admin) dengan email akun terkait.</p>` },
  { h: 'Hak akses per peran', b: `<ul><li>Menu Admin hanya untuk <b>Super Admin</b> pada pengaturan bawaan.</li><li>Super Admin dapat mengubah matriks di Admin &gt; Permission.</li></ul>` },
]

export const PERMISSION_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka Admin &gt; <b>Permission</b>.</li><li>Pilih <b>Peran</b> pada dropdown.</li><li>Centang atau hapus centang pada kolom aksi untuk tiap menu.</li><li>Perubahan langsung berlaku dan tersimpan.</li></ol>` },
  { h: 'Isi matriks', b: `<ul><li>Baris = menu (11 modul, Approval, Master Data, Admin, Log).</li><li>Kolom = aksi: <b>Lihat, Tambah, Ubah, Cancel, Approve, Export, Import</b>.</li><li><b>Cancel</b> berarti hak Batalkan data. <b>Approve</b> berarti hak memutuskan pengajuan.</li></ul>` },
  { h: 'Batasan', b: `<ul><li>Peran <b>Super Admin</b> selalu punya semua izin dan matriksnya <b>dikunci</b>, agar tidak terkunci keluar.</li><li>Hanya peran dengan izin <b>Ubah</b> pada Admin yang dapat mengubah centang. Peran lain melihat matriks dalam mode baca ("Hanya baca").</li></ul>` },
  { h: 'Log', b: `<p>Setiap centang atau pencabutan tercatat di menu <b>Log</b> (modul Admin, aksi Ubah permission) dengan peran, menu, aksi, dan keterangan diberi atau dicabut.</p>` },
]

export const LOG_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka menu <b>Log</b>.</li><li>Atur rentang tanggal <b>Dari</b> dan <b>Sampai</b>, lalu pilih user, modul, atau aksi bila perlu.</li><li>Baca baris log. Terbaru ada di atas.</li><li>Klik <b>Clear All</b> untuk mengosongkan semua filter.</li><li>Klik <b>Export Excel</b> untuk mengunduh hasil filter.</li></ol>` },
  { h: 'Apa yang dicatat', b: `<ul><li>Aktivitas pengguna di modul, antara lain Tambah, Ubah, Batalkan, Kembalikan, Approve, Reject, dan Export.</li><li>Perubahan Master Data (Tambah, Ubah, Hapus).</li><li>Perubahan Admin: tambah atau ubah akun, status akun, dan permission.</li><li>Ganti password dan ganti PIN.</li><li>Riwayat perubahan temuan dari Regulatory Findings Tracker ikut digabung ke daftar ini.</li></ul>` },
  { h: 'Kolom log', b: `<p>Waktu, User, Peran, Modul, Aksi, Data (nomor atau label data), dan Keterangan (misalnya nilai sebelum dan sesudah, alasan, atau catatan). Kolom kosong tampil sebagai "-".</p>` },
  { h: 'Filter', b: `<ul><li><b>Dari</b> dan <b>Sampai</b>: menyaring berdasarkan tanggal log.</li><li><b>Semua user</b>, <b>Semua modul</b>, <b>Semua aksi</b>: pilihan diambil dari isi log yang ada.</li><li>Pagination 10, 25, atau 50 baris per halaman.</li></ul>` },
  { h: 'Export Excel', b: `<ul><li>Mengekspor baris yang lolos filter (bukan hanya halaman yang tampil).</li><li>Nama file <b>Log_Aktivitas_[tanggal].xlsx</b>, sheet "Log".</li><li>Tombol hanya tampil bagi peran dengan izin <b>Export</b> pada Log.</li><li>Export itu sendiri tercatat di Log (modul Log, aksi Export, jumlah baris).</li></ul>` },
  { h: 'Hak akses per peran', b: `<ul><li><b>Head CLRM</b>: Lihat dan Export.</li><li><b>Super Admin</b>: semua aksi.</li><li>Peran lain tidak punya akses pada pengaturan bawaan. Super Admin dapat mengubahnya di Admin &gt; Permission.</li></ul>` },
]

export const PASSWORD_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka menu profil &gt; <b>Ganti Password</b>.</li><li>Isi <b>Password lama</b>.</li><li>Isi <b>Password baru</b> dan <b>Konfirmasi Password baru</b>.</li><li>Klik <b>Simpan</b>. Pesan hijau "Password berhasil diganti." muncul bila berhasil.</li></ol>` },
  { h: 'Aturan', b: `<ul><li>Password lama harus benar: bila salah muncul "Password lama salah".</li><li>Password baru minimal <b>8 karakter</b>.</li><li>Konfirmasi harus sama dengan password baru.</li><li>Semua kolom disembunyikan saat diketik.</li></ul>` },
  { h: 'Catatan', b: `<p>Perubahan hanya berlaku untuk akun Anda sendiri dan tercatat di Log (modul Profil, aksi Ganti password). Isi password tidak ditulis ke Log.</p>` },
]

export const PIN_GUIDE: GuideItem[] = [
  { h: 'Alur penggunaan', b: `<ol><li>Buka menu profil &gt; <b>Ganti PIN</b>.</li><li>Isi <b>PIN lama</b>.</li><li>Isi <b>PIN baru</b> dan <b>Konfirmasi PIN baru</b>.</li><li>Klik <b>Simpan</b>. Pesan hijau "PIN berhasil diganti." muncul bila berhasil.</li></ol>` },
  { h: 'Aturan', b: `<ul><li>PIN lama harus benar: bila salah muncul "PIN lama salah".</li><li>PIN baru harus <b>6 digit angka</b>. Kolom dibatasi 6 karakter.</li><li>Konfirmasi harus sama dengan PIN baru.</li><li>Semua kolom disembunyikan saat diketik.</li></ul>` },
  { h: 'Catatan', b: `<p>Perubahan hanya berlaku untuk akun Anda sendiri dan tercatat di Log (modul Profil, aksi Ganti PIN). Isi PIN tidak ditulis ke Log.</p>` },
]
