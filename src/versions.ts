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
    v: '1.2.0',
    date: '2026-10-29',
    deployed: true,
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
