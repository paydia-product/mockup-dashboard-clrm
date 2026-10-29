export interface Version {
  v: string
  date: string
  deployed: boolean
  title: string
  prompt: string
  tokens: number // estimasi token untuk prompt pembuat versi
  changes: string[]
}

// Terbaru di atas. Tiap pengerjaan: tambah entri di sini + CHANGELOG.md + VERSION.
export const versions: Version[] = [
  {
    v: '1.4.0',
    date: '2026-10-29',
    deployed: true,
    title: 'Nomor angka, PIC teks, status Selesai dengan validasi, tanpa progress',
    prompt: 'Nomor angka biasa + Lihat Detail, unit kerja baru, label Rencana Tindak Lanjut, PIC teks, status, validasi ulang, alasan, hapus progress',
    tokens: 80000,
    changes: [
      'Nomor Temuan jadi angka urut, tidak ada di form; tombol Lihat Detail di Aksi',
      'Pilihan Unit Kerja baru',
      'Label jadi Rencana Tindak Lanjut',
      'PIC jadi isian teks',
      'Status di Tambah: Open sampai Menunggu Validasi; Edit bisa ke Selesai dengan Validasi Ulang + Nama Validator, wajib persetujuan Head CLRM',
      'Field Alasan di Edit, wajib jika Batas Waktu diubah',
      'Progress dihapus dari tabel, form, detail, dan export',
    ],
  },
  {
    v: '1.3.1',
    date: '2026-10-29',
    deployed: false,
    title: 'File bukti tindak lanjut wajib',
    prompt: 'Jadikan wajib',
    tokens: 15000,
    changes: ['File bukti Rencana Tindak Lanjut wajib diunggah di Tambah dan Edit'],
  },
  {
    v: '1.3.0',
    date: '2026-10-29',
    deployed: false,
    title: 'Upload tervalidasi, edit terbatas, notifikasi email',
    prompt: 'Tooltip unit kerja, data dibatalkan default, hapus kolom alert, simulasi email, edit terbatas, upload tindak lanjut dan surat regulator',
    tokens: 90000,
    changes: [
      'Tooltip Temuan per Unit Kerja menampilkan Total, Selesai, Open',
      'Data Dibatalkan selalu tampil; checkbox dihapus',
      'Kolom Alert dihapus; simulasi notifikasi jadi 3 contoh email sesuai aturan alert',
      'Edit hanya Progress, Batas Waktu (wajib alasan), Tindak Lanjut & Bukti, Bukti Surat Regulator',
      'Rencana Tindak Lanjut & Bukti jadi teks + 1 file; field baru Bukti Surat Regulator',
      'Upload: PDF/JPG/JPEG/PNG, ekstensi harus cocok dengan MIME, maks 25 MB, 1 file',
    ],
  },
  {
    v: '1.2.0',
    date: '2026-10-29',
    deployed: false,
    title: 'Filter modal, notifikasi gaya Telegram, aksi Edit/Batalkan',
    prompt: 'Ubah filter jadi modal, hapus Riwayat Export, notifikasi gaya Telegram, aksi Edit/Batalkan, tab Dashboard duluan',
    tokens: 120000,
    changes: [
      'Filter menjadi popover di bawah tombol Filter (Clear All / Apply Filters)',
      'Tombol Riwayat Export dihapus',
      'Simulasi notifikasi tampil sebagai bubble pesan Telegram',
      'Kolom Aksi: tombol Edit / Batalkan / Kembalikan; detail hanya lewat link Nomor Temuan',
      'Tab Dashboard jadi default dan di urutan pertama',
    ],
  },
  {
    v: '1.1.1',
    date: '2026-10-29',
    deployed: false,
    title: 'Menu Risk, Fraud, Legal kembali',
    prompt: 'Kembalikan menu placeholder Risk, Fraud, Legal',
    tokens: 40000,
    changes: ['Menu placeholder Risk, Fraud, dan Legal dikembalikan ke sidebar'],
  },
  {
    v: '1.1.0',
    date: '2026-10-29',
    deployed: false,
    title: 'Perbaikan temuan QA & pentest',
    prompt: 'Perbaikan temuan QA & pentest prod',
    tokens: 180000,
    changes: [
      'Sidebar hanya Compliance, Approval, Admin, Log',
      'Edit temuan butuh persetujuan Head CLRM (permintaan perubahan + diff)',
      'Info pagination "x sampai y dari z data"',
      'Login: input nonaktif saat proses, tanpa sisa error',
      'Rate limit /api/login: 5 gagal per IP per 15 menit',
      'xlsx pindah ke tarball resmi SheetJS 0.20.3, @vercel/functions dihapus; npm audit 0 high',
    ],
  },
  {
    v: '1.0.0',
    date: '2026-10-29',
    deployed: false,
    title: 'Rilis awal: shell dashboard + Regulatory Findings Tracker',
    prompt: 'Bangun mockup klik Dashboard Monitoring CLRM: shell bergaya admin Paydia, halaman Regulatory Findings Tracker lengkap, login gate Vercel.',
    tokens: 450000,
    changes: [
      'Shell dashboard: header, sidebar, menu placeholder "Segera hadir"',
      'Tracker: tabel, cari, filter gabungan, filter tersimpan, pagination, sort, export xlsx',
      'Drawer detail dengan 14 kolom dan tab Riwayat audit',
      'Add/Edit/Cancel/Kembalikan, alur penutupan, modal alasan Batas Waktu',
      'Dashboard 7 visual, badge alert, simulasi notifikasi',
      'Login gate Vercel Routing Middleware, pemilih versi',
    ],
  },
]
