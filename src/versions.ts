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
    v: '1.0.0',
    date: '2026-10-29',
    deployed: true,
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
