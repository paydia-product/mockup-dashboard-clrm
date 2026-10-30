import { addDays, iso } from '../lib'

// Daftar kewajiban pelaporan Paydia (sheet "1. Daftar Pelaporan Paydia"). Nama tanpa sufiks "- batas waktu"; batas waktu dipakai membentuk jadwal seed.
export type Sched =
  | { u: 'd' }
  | { u: 'w'; wd: number } // hari dalam minggu (0 Minggu ... 5 Jumat)
  | { u: 'm'; day: number } // tanggal tiap bulan
  | { u: 'q'; day: number } // tanggal di bulan Jan/Apr/Jul/Okt (setelah triwulan berakhir)
  | { u: 'y'; mo: number; day: number; every?: number } // mo 1-12; every = tiap n tahun (tahun % n === 2 untuk 3 tahun sekali)
export type Item = { nama: string; regulator: string; jenis: string; dasar: string; s: Sched }

const DASAR: Record<string, string> = { BI: 'Ketentuan pelaporan Bank Indonesia', PPATK: 'UU 8/2010 TPPU', Komdigi: 'Ketentuan Komdigi' }
const it = (nama: string, regulator: string, jenis: string, s: Sched, dasar?: string): Item => ({ nama, regulator, jenis, dasar: dasar ?? DASAR[regulator] ?? '', s })
// HK (hari kerja) dihampiri ke hari kalender: 5 HK = tgl 7, 10 HK = tgl 14. "Belum ditentukan" memakai tgl 30 / 31 Maret sebagai asumsi seed.
export const CAT: Item[] = [
  it('Dana Float', 'BI', 'Harian', { u: 'd' }),
  it('QRIS Transaksi', 'BI', 'Mingguan', { u: 'w', wd: 5 }),
  it('Cyber Patrol', 'Komdigi', 'Mingguan', { u: 'w', wd: 4 }),
  it('Tindak Lanjut Akun Uang Elektronik Judi Online', 'Komdigi', 'Mingguan', { u: 'w', wd: 5 }),
  it('Top 10 Merchant QRIS', 'BI', 'Mingguan', { u: 'w', wd: 5 }, 'Pelaporan perdana 17 April 2026'),
  it('QRIS Transaksi', 'BI', 'Bulanan', { u: 'm', day: 5 }),
  it('Pengguna QRIS', 'BI', 'Bulanan', { u: 'm', day: 5 }),
  it('Availability Sistem', 'BI', 'Bulanan', { u: 'm', day: 10 }),
  it('Laporan Fasilitasi Aset Kripto', 'BI', 'Bulanan', { u: 'm', day: 15 }),
  it('Laporan LTDBB', 'BI', 'Bulanan', { u: 'm', day: 7 }, 'Batas 5 hari kerja'),
  it('Form 302-306', 'BI', 'Bulanan', { u: 'm', day: 15 }),
  it('Laporan Data Fraud Transaksi Sistem Pembayaran', 'BI', 'Bulanan', { u: 'm', day: 15 }),
  it('Laporan Implementasi SNAP Bulanan', 'BI', 'Bulanan', { u: 'm', day: 5 }),
  it('Laporan Keuangan UnAudited', 'BI', 'Triwulanan', { u: 'q', day: 15 }),
  it('Laporan Realisasi, Pemeliharaan, serta Realisasi Penyediaan Dana SK SP bagi SDM yang Menduduki Jabatan Sebelum PBI SK SP Berlaku', 'BI', 'Triwulanan', { u: 'q', day: 14 }, 'Batas 10 hari kerja'),
  it('Laporan Realisasi, Pemeliharaan, serta Realisasi Penyediaan Dana SK SP bagi Seluruh SDM', 'BI', 'Triwulanan', { u: 'q', day: 14 }, 'Batas 10 hari kerja'),
  it('SiPesat', 'BI', 'Triwulanan', { u: 'q', day: 15 }),
  it('Complaint Handling (Form 309-313)', 'BI', 'Triwulanan', { u: 'q', day: 15 }),
  it('siPendar', 'BI', 'Triwulanan', { u: 'q', day: 33 }, 'Batas 20 hari setelah tanggal 13'),
  it('Laporan Implementasi SNAP Triwulan', 'BI', 'Triwulanan', { u: 'q', day: 15 }),
  it('Laporan Pos-Pos / Rasio Keuangan Tertentu', 'BI', 'Triwulanan', { u: 'q', day: 30 }, 'Batas waktu belum ditentukan'),
  it('Laporan RBSP', 'BI', 'Tahunan', { u: 'y', mo: 11, day: 30 }),
  it('Laporan Keuangan Audited', 'BI', 'Tahunan', { u: 'y', mo: 6, day: 30 }),
  it('Laporan Pelaksanaan Edukasi Plan', 'BI', 'Tahunan', { u: 'y', mo: 2, day: 28 }),
  it('Laporan Rencana Edukasi Plan', 'BI', 'Tahunan', { u: 'y', mo: 11, day: 30 }),
  it('Laporan APU PPT', 'PPATK', 'Tahunan', { u: 'y', mo: 1, day: 31 }, 'Batas Januari'),
  it('Audit IT', 'BI', 'Tahunan', { u: 'y', mo: 3, day: 31 }, 'Batas 10 hari setelah Audit IT final'),
  it('Pentest', 'BI', 'Tahunan', { u: 'y', mo: 4, day: 30 }, 'Batas 10 hari setelah Pentest final'),
  it('Kewajiban Permodalan (KPSP)', 'BI', 'Tahunan', { u: 'y', mo: 7, day: 31 }),
  it('Laporan Sertifikat ISO', 'BI', 'Tahunan', { u: 'y', mo: 9, day: 30 }, 'Batas 10 hari setelah final'),
  it('Laporan Rencana Realisasi, Pemeliharaan, serta Rencana Penyediaan Dana SK SP bagi SDM yang Menduduki Jabatan Sebelum PBI SK SP Berlaku', 'BI', 'Tahunan', { u: 'y', mo: 12, day: 15 }),
  it('Laporan Rencana Realisasi, Pemeliharaan, serta Rencana Penyediaan Dana bagi Seluruh SDM', 'BI', 'Tahunan', { u: 'y', mo: 12, day: 15 }),
  it('Laporan Realisasi Penyediaan Dana SK SP Tahun Sebelumnya', 'BI', 'Tahunan', { u: 'y', mo: 3, day: 31 }, 'Batas waktu belum ditentukan'),
  it('Self Assessment APU PPT', 'PPATK', 'Tahunan', { u: 'y', mo: 1, day: 31 }, 'Batas Januari'),
  it('Laporan Tahunan KKS', 'BI', 'Tahunan', { u: 'y', mo: 1, day: 31 }),
  it('Laporan Tahunan SP', 'BI', 'Tahunan', { u: 'y', mo: 12, day: 15 }),
  it('SBP', 'BI', '3 Tahun Sekali', { u: 'y', mo: 11, day: 30, every: 3 }),
]
export const LAPORAN_NAMES = [...new Set(CAT.map((x) => x.nama))]
export const itemOf = (nama: string, jenis: string) => CAT.find((x) => x.nama === nama && x.jenis === jenis) as Item

const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const at = (y: number, m0: number, d: number) => iso(new Date(y, m0, d)) // m0/d boleh meluap, Date menormalkan
// Seluruh jatuh tempo dari 5 tahun lalu sampai 1 tahun ke depan, urut naik
export function occurrences(s: Sched, today: string): string[] {
  const y0 = Number(today.slice(0, 4)), out: string[] = []
  if (s.u === 'd') for (let i = -400; i <= 30; i++) out.push(addDays(today, i))
  else if (s.u === 'w') for (let i = -400; i <= 30; i++) { const d = addDays(today, i); if (new Date(d + 'T00:00:00').getDay() === s.wd) out.push(d) }
  else for (let y = y0 - 5; y <= y0 + 1; y++) {
    if (s.u === 'y') { if (!s.every || y % s.every === 2) out.push(at(y, s.mo - 1, s.day)) }
    else for (let m = 0; m < 12; m++) if (s.u === 'm' || m % 3 === 0) out.push(at(y, m, s.day))
  }
  return out.sort()
}
// Jatuh tempo (sebelum hari ini) terdekat dengan tanggal target
export const nearest = (s: Sched, today: string, target: string) => occurrences(s, today).filter((d) => d < today).reduce((a, b) => (Math.abs(Date.parse(b) - Date.parse(target)) < Math.abs(Date.parse(a) - Date.parse(target)) ? b : a))
// Periode yang dilaporkan untuk satu jatuh tempo
export function periodeOf(it: Item, due: string): string {
  const y = Number(due.slice(0, 4)), m = Number(due.slice(5, 7)) - 1, p = (n: number) => String(n).padStart(2, '0')
  switch (it.jenis) {
    case 'Harian': return `${p(Number(due.slice(8)))}/${p(m + 1)}/${y}`
    case 'Mingguan': return `Minggu s.d. ${due.slice(8)}/${p(m + 1)}/${y}`
    case 'Bulanan': return `${MON[(m + 11) % 12]} ${m === 0 ? y - 1 : y}`
    case 'Triwulanan': { const r = addDays(due, -35); return `Triwulan ${Math.floor((Number(r.slice(5, 7)) - 1) / 3) + 1} ${r.slice(0, 4)}` }
    case 'Tahunan': return `Tahun ${m + 1 <= 7 ? y - 1 : y}`
    default: return `${y - 2}-${y}`
  }
}
