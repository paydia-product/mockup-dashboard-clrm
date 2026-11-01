import { addDays } from '../lib'
import type { Account, ActivityLog, Role } from './types'

// Seed halaman Log: 120 baris selama 30 hari terakhir, memakai email akun demo dan IP IPv4/IPv6 yang tetap per pengguna.
// Deterministik (tanpa Math.random) agar seed sama tiap muat. Isi Detail = baris "kunci: nilai".
const V4 = ['182.253.233.250', '124.158.189.126', '36.71.140.22', '114.122.8.77', '103.28.12.201', '139.194.77.5', '180.244.133.18', '36.85.216.90', '202.80.217.34', '110.138.151.64']
const V6 = ['2404:c0:d401:9ec3:3c', '2405:8180:201:669f:8', '2001:448a:1050:2f1b:a1', '2400:9800:6c:3d20:7e', '2404:c0:d401:9ec3:c5']
const OPS: Role[] = ['Compliance Officer', 'Head CLRM', 'PIC', 'Super Admin']
// container -> peran yang masuk akal melakukannya
const WHO: Record<string, Role[]> = {
  'clrm-auth': ['Super Admin', 'Head CLRM', 'Compliance Officer', 'Risk Officer', 'Legal Officer', 'Fraud Investigator', 'Ketua SMKI', 'PIC', 'Viewer'],
  'regulatory-findings-tracker': ['Compliance Officer', 'PIC', 'Head CLRM'], 'regulatory-reporting': ['Compliance Officer', 'PIC'], 'regulatory-change': ['Compliance Officer', 'Ketua SMKI'],
  'sop-dokumen-kontrol': ['Compliance Officer', 'PIC'], 'risk-register': ['Risk Officer', 'PIC'], 'kajian-risiko': ['Risk Officer'],
  'fraud-case-monitoring': ['Fraud Investigator', 'Head CLRM', 'Compliance Officer'], kontrak: ['Legal Officer', 'PIC'], 'permintaan-aph': ['Legal Officer', 'Head CLRM'],
  perizinan: ['Legal Officer'], 'layanan-hukum': ['Legal Officer', 'PIC'], approval: ['Head CLRM', 'Ketua SMKI', 'Risk Officer'], 'master-data': ['Head CLRM', 'Super Admin'],
  admin: ['Super Admin'], notification: OPS, log: ['Head CLRM', 'Super Admin'],
}
type Spec = [container: string, type: string, lines: string[]]
const S: Spec[] = [
  ['clrm-auth', 'login', ['email: {email}', 'user_type: {ut}']],
  ['clrm-auth', '2fa-verify', ['email: {email}', 'method: PIN', 'result: success']],
  ['clrm-auth', 'login-failed', ['email: {email}', 'reason: password salah', 'attempt: 1']],
  ['clrm-auth', 'login-failed', ['email: {email}', 'reason: PIN salah', 'attempt: 2']],
  ['clrm-auth', 'logout', ['email: {email}', 'user_type: {ut}']],
  ['clrm-auth', 'password-change', ['email: {email}', 'result: success']],
  ['clrm-auth', 'pin-change', ['email: {email}', 'result: success']],
  ['clrm-auth', 'login', ['email: {email}', 'user_type: {ut}']],
  ['regulatory-findings-tracker', 'view-detail', ['Temuan: BI - QRIS', 'Status: Proses', 'PIC: Regie', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'create', ['Temuan: OJK - Pelindungan Konsumen', 'Batas Waktu: 30-11-2026', 'PIC: Fakhri', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'update', ['Temuan: BI - SNAP', 'Kolom: Batas Waktu', 'Lama: 15-11-2026', 'Baru: 30-11-2026', 'Alasan: menunggu data mitra', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'upload-file', ['Temuan: PPATK - APU PPT', 'File: bukti-tindak-lanjut.pdf', 'Ukuran: 482 KB', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'submit-approval', ['Temuan: BI - QRIS', 'Jenis: Penutupan Temuan', 'Approver: Head CLRM', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'cancel', ['Temuan: Komdigi - Ketahanan Siber', 'Status: Open -> Dibatalkan', 'Alasan: temuan duplikat', 'Admin: {name} ({email})']],
  ['regulatory-findings-tracker', 'export', ['Jumlah baris: 34', 'File: Regulatory_Findings_Tracker.xlsx', 'Admin: {name} ({email})']],
  ['regulatory-reporting', 'view-detail', ['Laporan: Laporan Bulanan PJP', 'Regulator: BI', 'Periode: Oktober 2026', 'Admin: {name} ({email})']],
  ['regulatory-reporting', 'update', ['Laporan: Laporan Transaksi Keuangan Mencurigakan', 'Status: Disusun -> Terkirim', 'Admin: {name} ({email})']],
  ['regulatory-reporting', 'create', ['Laporan: Laporan Insiden Siber', 'Regulator: BSSN', 'Batas: 02-11-2026', 'Admin: {name} ({email})']],
  ['regulatory-reporting', 'upload-file', ['Laporan: Laporan Bulanan PJP', 'File: bukti-kirim-bi.pdf', 'Ukuran: 215 KB', 'Admin: {name} ({email})']],
  ['regulatory-reporting', 'export', ['Jumlah baris: 58', 'File: Laporan_Regulator.xlsx', 'Admin: {name} ({email})']],
  ['regulatory-change', 'view-detail', ['Peraturan: PADG 14/2025', 'Dampak: Sedang', 'Admin: {name} ({email})']],
  ['regulatory-change', 'create', ['Peraturan: PBI 12/2026', 'Regulator: BI', 'Jenis: Baru', 'Admin: {name} ({email})']],
  ['regulatory-change', 'submit-approval', ['Peraturan: UU 4/2025', 'Jenis: Perubahan Daftar Peraturan', 'Approver: Ketua SMKI', 'Kolom: Tentang', 'Admin: {name} ({email})']],
  ['regulatory-change', 'update', ['Peraturan: PBI 9/2025', 'Kolom: Pemenuhan', 'Lama: 80%', 'Baru: 90%', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'view-detail', ['Dokumen: SOP Penanganan Keluhan Merchant', 'Status: Aktif', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'create', ['Dokumen: SOP Rekonsiliasi Harian', 'Klasifikasi: Internal', 'Retensi: 5 Tahun', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'upload-file', ['Dokumen: SOP Onboarding Merchant', 'File: sop-onboarding-v3.pdf', 'Ukuran: 1.2 MB', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'update', ['Dokumen: SOP Manajemen Akses', 'Status: Aktif -> Dalam Review', 'Admin: {name} ({email})']],
  ['risk-register', 'view-detail', ['Risk Event: Gangguan sistem pembayaran', 'Level: High', 'Admin: {name} ({email})']],
  ['risk-register', 'create', ['Risk Event: Gagal bayar mitra', 'Dampak: 2', 'Kemungkinan: 2', 'Admin: {name} ({email})']],
  ['risk-register', 'update', ['Risk Event: Keluhan merchant meluas', 'Kolom: Kontrol', 'Admin: {name} ({email})']],
  ['risk-register', 'submit-approval', ['Risk Event: Dana settlement kurang likuid', 'Jenis: Perubahan Level Risiko', 'Skor: 3 -> 6', 'Approver: Risk Officer', 'Admin: {name} ({email})']],
  ['risk-register', 'export', ['Jumlah baris: 25', 'File: Risk_Register.xlsx', 'Admin: {name} ({email})']],
  ['kajian-risiko', 'view-detail', ['Kajian: Kajian vendor PT Mitra Bayar', 'Jenis: Vendor', 'Admin: {name} ({email})']],
  ['kajian-risiko', 'create', ['Kajian: Kajian produk QRIS Tap', 'Jenis: Produk', 'SLA: 14 hari', 'Admin: {name} ({email})']],
  ['kajian-risiko', 'update', ['Kajian: Kajian regulasi PBI 23/2025', 'Status: Proses -> Selesai', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'view-detail', ['No Laporan: EDD/2026/10/0004', 'Status: Open', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'create', ['No Laporan: EDD/2026/10/0011', 'Kategori Pelapor: Kepolisian', 'Jenis Dugaan: Judi Online', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'update', ['No Laporan: EDD/2026/09/0017', 'Kolom: Tindakan', 'Lama: Watchlist', 'Baru: Blokir', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'reveal-data', ['No Laporan: EDD/2026/10/0004', 'Field: Nama Terlapor', 'Aksi: tampilkan', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'reveal-data', ['No Laporan: EDD/2026/10/0006', 'Field: RRN', 'Aksi: tampilkan', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'submit-approval', ['No Laporan: EDD/2026/09/0012', 'Jenis: Penutupan Kasus', 'Approver: Head CLRM', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'cancel', ['No Laporan: EDD/2026/08/0009', 'Status: Closed -> Dibatalkan', 'Alasan: kasus duplikat', 'Admin: {name} ({email})']],
  ['fraud-case-monitoring', 'export', ['Jumlah baris: 45', 'File: Kasus_Fraud_EDD.xlsx', 'Kolom sensor: Terlapor, RRN (tersamar)', 'Admin: {name} ({email})']],
  ['kontrak', 'view-detail', ['Kontrak: PKS QRIS - PT Mitra Bayar', 'Status: Aktif', 'Admin: {name} ({email})']],
  ['kontrak', 'create', ['Kontrak: Biller Gateway - PT Biller Nusantara', 'Jenis PKS: Biller Gateway', 'Admin: {name} ({email})']],
  ['kontrak', 'update', ['Kontrak: Payout - PT Arta Teknologi', 'Kolom: Tanggal Berakhir', 'Lama: 31-12-2026', 'Baru: 31-12-2027', 'Admin: {name} ({email})']],
  ['kontrak', 'upload-file', ['Kontrak: NDA - PT Sigma Analitik', 'File: nda-sigma-signed.pdf', 'Ukuran: 640 KB', 'Admin: {name} ({email})']],
  ['kontrak', 'import', ['File: kontrak-batch-okt.xlsx', 'Berhasil: 12', 'Gagal: 1', 'Admin: {name} ({email})']],
  ['kontrak', 'export', ['Jumlah baris: 30', 'File: Kontrak.xlsx', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'view-detail', ['Nomor Surat: B/1205/3/2026/Siber', 'Status: Active', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'reveal-data', ['Nomor Surat: B/1198/2/2026/PPATK', 'Field: Nama Penyidik', 'Aksi: tampilkan', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'reveal-data', ['Nomor Surat: B/1198/2/2026/PPATK', 'Field: No. Telepon Penyidik', 'Aksi: tampilkan', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'create', ['Nomor Surat: B/1240/10/2026/Reskrimsus', 'Pengirim: Polda', 'Kasus: Judi Online', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'update', ['Nomor Surat: B/1219/6/2026/Kejari', 'Status: Active -> Done', 'Admin: {name} ({email})']],
  ['permintaan-aph', 'export', ['Jumlah baris: 30', 'File: Permintaan_APH.xlsx', 'Kolom sensor: Nama Penyidik, No. Telepon Penyidik (tersamar)', 'Admin: {name} ({email})']],
  ['perizinan', 'view-detail', ['Dokumen: Izin PJP BI', 'Status: Aktif', 'Admin: {name} ({email})']],
  ['perizinan', 'create', ['Dokumen: Akta Perubahan Direksi', 'Kategori: Akta + SK', 'Admin: {name} ({email})']],
  ['perizinan', 'upload-file', ['Dokumen: Izin PJP BI', 'File: izin-pjp-perpanjangan.pdf', 'Ukuran: 890 KB', 'Admin: {name} ({email})']],
  ['perizinan', 'update', ['Dokumen: SK Kemenkumham', 'Status: Aktif -> Dalam Perpanjangan', 'Admin: {name} ({email})']],
  ['layanan-hukum', 'view-detail', ['Permintaan: Review perjanjian vendor cloud', 'Prioritas: Tinggi', 'Admin: {name} ({email})']],
  ['layanan-hukum', 'create', ['Permintaan: Opini hukum program cashback', 'Departemen: Business', 'Admin: {name} ({email})']],
  ['layanan-hukum', 'update', ['Permintaan: Draft addendum mitra', 'Status: Proses -> Selesai', 'Admin: {name} ({email})']],
  ['approval', 'view-detail', ['Request: Penutupan Kasus', 'Data: EDD/2026/09/0012', 'Pengaju: Fakhri', 'Admin: {name} ({email})']],
  ['approval', 'approve', ['Request: Perubahan Daftar Peraturan', 'Data: PADG 14/2025', 'Catatan: sesuai dokumen resmi', 'Admin: {name} ({email})']],
  ['approval', 'approve', ['Request: Penutupan Temuan', 'Data: BI - QRIS', 'Admin: {name} ({email})']],
  ['approval', 'reject', ['Request: Perubahan Level Risiko', 'Data: Keluhan merchant meluas', 'Catatan: dasar penilaian belum lengkap', 'Admin: {name} ({email})']],
  ['master-data', 'master-create', ['Master: Unit Kerja', 'Nama: Customer Success', 'Admin: {name} ({email})']],
  ['master-data', 'master-update', ['Master: Mitra Vendor', 'Lama: PT Data Aman', 'Baru: PT Data Aman Nusantara', 'Admin: {name} ({email})']],
  ['master-data', 'master-create', ['Master: Instansi Pengirim APH', 'Nama: Polda Jawa Barat', 'Admin: {name} ({email})']],
  ['admin', 'admin-create', ['email: bima.prakoso@paydia.id', 'status: Inactive', 'Admin: {name} ({email})']],
  ['admin', 'admin-update', ['email: arief.nugraha@paydia.id', 'Status: Active -> Suspend', 'Admin: {name} ({email})']],
  ['admin', 'permission-update', ['email: tono.santoso@paydia.id', 'Kategori: Fraud', 'Izin: fraud.export dicabut', 'Admin: {name} ({email})']],
  ['notification', 'notif-open', ['Notifikasi: Kontrak akan berakhir', 'Tujuan: #/legal/kontrak', 'Admin: {name} ({email})']],
  ['notification', 'notif-open', ['Notifikasi: Jawaban APH lewat batas waktu', 'Tujuan: #/legal/permintaan-aph', 'Admin: {name} ({email})']],
  ['clrm-auth', 'switch-account', ['email: {email}', 'Ganti akun demo: Super Admin -> Rina Kartika']],
  ['kontrak', 'restore', ['Kontrak: Amandemen - PT Cipta Layanan', 'Status: Dibatalkan -> Aktif', 'Alasan: pembatalan keliru', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'delete', ['Dokumen: SOP lama Rekonsiliasi Manual', 'Alasan: diganti SOP versi baru', 'Admin: {name} ({email})']],
  ['master-data', 'master-delete', ['Master: Kategori Pelapor', 'Nama: Asosiasi Lama', 'Admin: {name} ({email})']],
  ['regulatory-change', 'export', ['Jumlah baris: 31', 'File: Daftar_Peraturan.xlsx', 'Admin: {name} ({email})']],
  ['sop-dokumen-kontrol', 'export', ['Jumlah baris: 25', 'File: SOP_Dokumen_Kontrol.xlsx', 'Admin: {name} ({email})']],
  ['kajian-risiko', 'export', ['Jumlah baris: 20', 'File: Kajian_Risiko.xlsx', 'Admin: {name} ({email})']],
  ['perizinan', 'export', ['Jumlah baris: 18', 'File: Perizinan.xlsx', 'Admin: {name} ({email})']],
  ['layanan-hukum', 'export', ['Jumlah baris: 22', 'File: Layanan_Hukum.xlsx', 'Admin: {name} ({email})']],
  ['log', 'export', ['Jumlah baris: 120', 'File: Log_Aktivitas.xlsx', 'Admin: {name} ({email})']],
]

const pad = (n: number) => String(n).padStart(2, '0')
export function seedActivity(accounts: Account[], today: string): ActivityLog[] {
  let seed = 20261101
  const rnd = (n: number) => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n }
  const rows: ActivityLog[] = []
  for (let i = 0; i < 120; i++) {
    const [container, type, lines] = S[(i * 7) % S.length] // 7 saling prima dengan jumlah spec: semua spec terpakai, urutan berbaur
    const pool = accounts.filter((a) => a.status === 'Active' && (WHO[container] ?? OPS).includes(a.role))
    const u = pool.length ? pool[rnd(pool.length)] : accounts[0]
    const ui = accounts.indexOf(u)
    const day = 1 + Math.floor(i / 4) // 1..30 hari lalu
    const time = `${addDays(today, -day)}T${pad(7 + rnd(12))}:${pad(rnd(60))}:${pad(rnd(60))}`
    const ip = ui % 3 === 2 ? V6[(ui + rnd(2)) % V6.length] : V4[(ui * 2 + rnd(2)) % V4.length]
    const detail = lines.map((l) => l.replace('{email}', u.email).replace('{name}', u.name).replace('{ut}', u.role === 'Super Admin' ? 'admin' : 'staff')).join('\n')
    rows.push({ id: `seed-log-${i + 1}`, time, container, type, detail, ip })
  }
  return rows.sort((a, b) => b.time.localeCompare(a.time))
}
