import { REGULATORS, addDays, diffDays, fmtDate, fmtTime } from '../lib'
import { CAT, Item, itemOf, nearest, periodeOf } from './laporan.shared'
import PageShell from '../kit/PageShell'
import { REPORTING_GUIDE } from '../guides/reporting'
import { BarCard, CalendarCard, LineCard, MiniTable, useMonthRange } from '../kit/charts'
import type { ChartInfo } from '../kit/charts'
import { monthKey } from '../kit/dates'
import { StatusPill, statusTone } from '../kit/fmt'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'
import type { FileMeta } from '../kit/types'

// Regulatory Reporting (C1). Jadwal otomatis tidak dibuat: setiap laporan ditambah manual (A9).
interface Laporan extends BaseRec {
  nama: string; regulator: string; jenis: string; periode: string; batas: string
  siber: string; waktuKejadian: string; waktuNotif: string
  tglSubmit: string; picPenyusun: string; picReviewer: string
  bukti: FileMeta | null; noTerima: string; dasar: string; alasan: string
}
// Teks info (i) tiap kartu dashboard
const INFO: Record<string, ChartInfo> = {
  kalender: {
    apa: 'Kalender laporan menurut Batas Waktu. Tiap titik adalah satu laporan pada tanggal Batas Waktunya (laporan Dibatalkan tidak ditampilkan).',
    baca: [
      'Ganti tampilan Hari, Minggu, atau Bulan dengan tombol di kanan atas, dan geser dengan tanda panah. Hari ini diberi warna biru.',
      'Warna titik mengikuti Status: hijau Terkirim; kuning Belum Disiapkan, Disusun, atau Review; merah Terlambat.',
      'Arahkan kursor ke titik untuk melihat nama laporan. Klik titik untuk membuka Detail laporan.',
      'Tampilan Bulan menampilkan 3 titik per hari, sisanya tertulis "+N lagi".',
    ],
  },
  tepat: {
    apa: 'Persentase laporan Terkirim yang dikirim tepat waktu, per jenis periode dan per regulator. Hanya laporan Terkirim yang punya Tanggal Submit yang dihitung. Tepat waktu berarti tanggal submit tidak melewati Batas Waktu.',
    baca: [
      'Sumbu Y: kelompok ("Jenis: ..." berwarna biru, "Regulator: ..." berwarna hijau). Sumbu X: persen tepat waktu (0 sampai 100).',
      'Batang kosong (0) bisa berarti belum ada laporan Terkirim di kelompok itu atau semuanya terlambat. Cek rinciannya di hover.',
      'Arahkan kursor untuk melihat persen dan rincian "tepat/total".',
      'Klik batang untuk membuka tab Table terfilter menurut jenis periode atau regulator yang diklik.',
    ],
  },
  beban: {
    apa: 'Jumlah laporan per Jenis Periode menurut kondisinya: Terkirim, Dalam proses (belum Terkirim dan belum Terlambat), dan Terlambat.',
    baca: [
      'Sumbu X: Jenis Periode (Harian sampai Insidental). Sumbu Y: jumlah laporan.',
      'Hijau = Terkirim. Kuning = Dalam proses. Merah = Terlambat. Tinggi tumpukan = total laporan jenis itu.',
      'Klik batang (warna mana pun) untuk membuka tab Table terfilter menurut jenis periode tersebut.',
    ],
  },
  tren: {
    apa: 'Jumlah laporan yang terlambat per bulan Batas Waktu. Dihitung laporan berstatus Terlambat atau yang Tanggal Submit-nya melewati Batas Waktu. Memakai semua data, tidak ikut Periode Batas Waktu.',
    baca: [
      'Sumbu X: bulan Batas Waktu. Sumbu Y: jumlah laporan terlambat.',
      'Garis naik berarti makin banyak laporan terlambat pada bulan itu.',
      'Filter bulan di atas grafik berlaku untuk kartu ini saja (default 12 bulan terakhir).',
      'Arahkan kursor ke titik untuk melihat angkanya. Titik tidak bisa diklik.',
    ],
  },
  soon: {
    apa: 'Laporan yang belum Terkirim dan belum Terlambat dengan Batas Waktu dari hari ini sampai 7 hari ke depan, diurutkan dari yang paling dekat.',
    baca: [
      'Kolom: Nama Laporan, Batas, PIC (penyusun), dan Status. Kolom No adalah urutan baris.',
      'Klik satu baris untuk membuka Detail laporan.',
      'Tabel dibagi per 5 baris. Bila kosong, tidak ada laporan jatuh tempo dalam 7 hari.',
    ],
  },
}

const REG = [...REGULATORS] // BI, PPATK, Komdigi, BSSN, Pemerintah-DPR
const JENIS = ['Harian', 'Mingguan', 'Bulanan', 'Triwulanan', 'Tahunan', '3 Tahun Sekali', 'Insidental']
const STATUS = ['Belum Disiapkan', 'Disusun', 'Review', 'Terkirim', 'Terlambat'] // Terlambat otomatis (normalize) dan boleh dipilih manual hanya bila Batas Waktu sudah lewat (validate)
const SENT = (r: Laporan) => r.status === 'Terkirim'
const dOf = (s: string) => s.slice(0, 10)
const isSiber = (r: Laporan) => r.jenis === 'Insidental' && r.siber === 'Ya'
const hasBukti = (r: Laporan) => !!r.bukti || !!r.noTerima.trim()
// Selisih hari submit terhadap batas (positif = terlambat)
const lateBy = (r: Laporan) => (r.tglSubmit && r.batas && dOf(r.tglSubmit) > dOf(r.batas) ? diffDays(dOf(r.tglSubmit), dOf(r.batas)) : 0) // Batas Waktu = tanggal saja: submit di hari yang sama tepat waktu
const tepat = (r: Laporan) => (!r.tglSubmit || !r.batas ? '-' : lateBy(r) ? `Terlambat (+${lateBy(r)} hari)` : 'Tepat Waktu')
const wasLate = (r: Laporan) => r.status === 'Terlambat' || lateBy(r) > 0
const pad = (n: number) => String(n).padStart(2, '0')
const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const agoLocal = (minutes: number) => fmtLocal(new Date(Date.now() - minutes * 60000))
const dur = (ms: number) => { const m = Math.round(Math.abs(ms) / 60000); return m >= 120 ? `${Math.floor(m / 60)} jam` : `${m} menit` }

// Spec: PIC dan CO hanya mengubah status, tanggal submit, bukti, dan alasan terlambat; Super Admin semua kolom.
const full = (c: Ctx) => c.role === 'Super Admin'
const fields: Field<Laporan>[] = [
  { key: 'nama', label: 'Nama Laporan', type: 'text', required: true, editableBy: full },
  { key: 'regulator', label: 'Regulator', type: 'select', options: REG, required: true, editableBy: full },
  { key: 'jenis', label: 'Jenis Periode', type: 'select', options: JENIS, required: true, editableBy: full },
  { key: 'waktuKejadian', label: 'Waktu Kejadian', type: 'datetime', required: isSiber, help: 'Opsional; wajib untuk laporan insiden siber (jam berjalan dihitung dari waktu kejadian).', editableBy: full },
  { key: 'siber', label: 'Laporan Insiden Siber?', type: 'yesno', showIf: (r) => r.jenis === 'Insidental', help: 'Jam berjalan insiden siber dihitung dari waktu kejadian.', editableBy: full },
  { key: 'waktuNotif', label: 'Waktu Notifikasi Awal', type: 'datetime', showIf: isSiber, help: 'Paling lambat 1 jam sejak kejadian.', editableBy: full },
  { key: 'periode', label: 'Periode yang Dilaporkan', type: 'text', required: true, help: 'Diisi manual, mis. "Oktober 2026" atau "Q3 2026".', editableBy: full },
  { key: 'batas', label: 'Batas Waktu (Due Date)', type: 'date', required: true, editableBy: full },
  { key: 'tglSubmit', label: 'Tanggal Submit', type: 'datetime', required: (r) => SENT(r) },
  { key: 'status', label: 'Status', type: 'select', options: STATUS, required: true, help: 'Terlambat terisi otomatis bila Batas Waktu lewat dan belum Terkirim; dapat dipilih manual hanya jika Batas Waktu sudah lewat.' },
  { key: 'tepat', label: 'Tepat Waktu?', type: 'text', auto: (r) => tepat(r) },
  { key: 'picPenyusun', label: 'PIC Penyusun', type: 'select', options: (c) => c.master.pic, required: true, editableBy: full },
  { key: 'picReviewer', label: 'PIC Reviewer', type: 'select', options: (c) => c.master.pic, required: true, editableBy: full },
  { key: 'bukti', label: 'Bukti Submit (file)', type: 'file', help: 'Wajib file atau Nomor Tanda Terima bila status Terkirim.' },
  { key: 'noTerima', label: 'Nomor Tanda Terima', type: 'text' },
  { key: 'dasar', label: 'Dasar Ketentuan', type: 'text', editableBy: full },
  { key: 'alasan', label: 'Alasan Terlambat', type: 'textarea', wide: true, required: (r, c) => r.status === 'Terlambat' || lateBy(r) > 0 || (!SENT(r) && !!r.batas && dOf(r.batas) < c.today) },
]
const columns: Column<Laporan>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Nama Laporan', get: (r) => r.nama },
  { label: 'Regulator', get: (r) => r.regulator },
  { label: 'Jenis Periode', get: (r) => r.jenis },
  { label: 'Periode', get: (r) => r.periode },
  { label: 'Batas Waktu', get: (r) => r.batas, render: (r) => fmtDate(dOf(r.batas)) },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'Tepat Waktu?', get: (r) => tepat(r), render: (r) => { const t = tepat(r); return t === '-' ? <span className="text-slate-300">-</span> : <StatusPill s={t} /> } },
  { label: 'Penyusun', get: (r) => r.picPenyusun },
]
const picOpts = (rows: Laporan[]) => [...new Set(rows.flatMap((r) => [r.picPenyusun, r.picReviewer]).filter(Boolean))].sort()
const filters: FilterDef<Laporan>[] = [
  { key: 'periode', label: 'Periode (Batas Waktu)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || dOf(r.batas) >= a) && (!b || dOf(r.batas) <= b) } },
  { key: 'jenis', label: 'Jenis Periode', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS, 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'regulator', label: 'Regulator', type: 'select', options: REG, match: (r, v) => r.regulator === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => picOpts(rows), match: (r, v) => r.picPenyusun === v || r.picReviewer === v },
]

const toPic = (r: Laporan) => (r.picPenyusun ? `PIC (${r.picPenyusun})` : 'PIC')
const mk = (c: Ctx, o: Partial<Laporan>): Laporan => ({
  id: 'sample', no: 99, status: 'Disusun', createdAt: c.today, createdBy: '-', nama: 'Laporan RBSP', regulator: 'BI', jenis: 'Triwulanan', periode: 'Q3 2026',
  batas: `${addDays(c.today, 3)}`, siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', picPenyusun: 'Regie', picReviewer: 'Fakhri',
  bukti: null, noTerima: '', dasar: 'PBI 23/6/PBI/2021', alasan: '', ...o,
})
const alerts: AlertDef<Laporan>[] = [
  {
    key: 'near', label: 'Hampir jatuh tempo', rule: 'Batas waktu tinggal 7, 3, atau 1 hari (H-7/H-3/H-1, paling lama 7 hari) dan laporan belum Terkirim.',
    check: (r, c) => {
      if (SENT(r) || r.status === 'Terlambat' || !r.batas) return null
      const d = diffDays(dOf(r.batas), c.today)
      return d >= 0 && d <= 7 ? { color: 'yellow', detail: `H-${d} batas waktu (${fmtDate(dOf(r.batas))})`, to: [toPic(r), 'Compliance Officer'] } : null
    },
    sample: (c) => mk(c, { batas: `${addDays(c.today, 3)}` }),
  },
  {
    key: 'late', label: 'Laporan terlambat', rule: 'Batas waktu terlewat dan laporan belum Terkirim.',
    check: (r) => (r.status === 'Terlambat' ? { color: 'red', detail: `Terlambat sejak ${fmtDate(dOf(r.batas))}`, to: [toPic(r), 'Head CLRM'] } : null),
    sample: (c) => mk(c, { status: 'Terlambat', batas: `${addDays(c.today, -3)}`, alasan: 'Menunggu data dari tim terkait.' }),
  },
  {
    key: 'siber', label: 'Insiden siber (jam berjalan)', rule: 'Laporan insiden siber belum Terkirim: notifikasi awal paling lambat 1 jam dan laporan lengkap paling lambat 3 hari kalender sejak waktu kejadian.',
    check: (r) => {
      if (!isSiber(r) || SENT(r) || !r.waktuKejadian) return null
      const t0 = new Date(r.waktuKejadian).getTime(), now = Date.now()
      const notifDue = t0 + 3600000, fullDue = t0 + 3 * 86400000
      const notif = r.waktuNotif ? `notifikasi awal sudah dikirim ${fmtTime(r.waktuNotif)}` : now > notifDue ? `notifikasi awal TERLEWAT ${dur(now - notifDue)}` : `notifikasi awal sisa ${dur(notifDue - now)}`
      const full = now > fullDue ? `laporan lengkap TERLEWAT ${dur(now - fullDue)}` : `laporan lengkap sisa ${dur(fullDue - now)}`
      return { color: 'red', detail: `Kejadian ${fmtTime(r.waktuKejadian)}: ${notif}; ${full}`, to: ['Head CLRM', 'CISO'] }
    },
    sample: (c) => mk(c, { nama: 'Laporan Insiden Siber', regulator: 'BSSN', jenis: 'Insidental', siber: 'Ya', periode: 'Insiden siber', waktuKejadian: agoLocal(40), batas: `${addDays(c.today, 3)}` }),
  },
  {
    key: 'nobukti', label: 'Terkirim tanpa bukti', rule: 'Status Terkirim tetapi file bukti dan nomor tanda terima kosong.',
    check: (r) => (SENT(r) && !hasBukti(r) ? { color: 'yellow', detail: 'Bukti submit belum diisi', to: [toPic(r)] } : null),
    sample: (c) => mk(c, { status: 'Terkirim', tglSubmit: `${addDays(c.today, -1)}T10:00` }),
  },
]

const PEN = ['Regie', 'Fakhri', 'Osama'] // master PIC; reviewer selalu orang lain (REV bergeser satu)
const REV = ['Fakhri', 'Osama', 'Regie']
// Insiden siber tidak ada di sheet pelaporan rutin; dua baris seed ini tetap ada untuk memperlihatkan alert jam berjalan
const SIBER: Item = { nama: 'Laporan Insiden Siber', regulator: 'BSSN', jenis: 'Insidental', dasar: 'Perban BSSN 8/2020', s: { u: 'd' } }

function seed(today: string): Laporan[] {
  const out: Laporan[] = []
  const push = (it: Item, o: Partial<Laporan>) => {
    const i = out.length
    const { nama, regulator, jenis, dasar } = it
    const batas = o.batas ?? `${today}`
    const dibuat = addDays(dOf(batas), -14) // dibuat 2 minggu sebelum batas (maks hari ini); jam diberi store.stamp
    out.push({
      id: `reporting-${i + 1}`, no: i + 1, status: 'Terkirim', createdAt: dibuat >= today ? addDays(today, -1) : dibuat, createdBy: 'Rina Kartika', nama, regulator, jenis, periode: periodeOf(it, batas), batas: `${today}`,
      siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', picPenyusun: PEN[i % 3], picReviewer: REV[i % 3], bukti: null, noTerima: '', dasar, alasan: '', ...o,
    })
  }
  const by = (nama: string, jenis: string) => itemOf(nama, jenis)
  // 12 bulan ke belakang: Terkirim, tiap 5 laporan satu terlambat (alasan terisi). Batas = jatuh tempo jadwal terdekat dengan tanggal target
  for (let i = 0; i < 34; i++) {
    const it = CAT[(i * 7) % CAT.length] // langkah 7 (7 dan 38 saling prima): 34 laporan berbeda dengan jenis periode bervariasi
    const batasD = nearest(it.s, today, addDays(today, -(12 + i * 10)))
    const late = i % 5 === 3
    const sub = late ? `${addDays(batasD, 1 + (i % 3))}T10:30` : `${addDays(batasD, -1)}T14:00`
    push(it, { batas: `${batasD}`, tglSubmit: sub, noTerima: `TT-${String(2026000 + i)}`, alasan: late ? 'Data pendukung terlambat diterima dari unit terkait.' : '' })
  }
  // H-7, H-3, H-1
  push(by('Laporan Keuangan UnAudited', 'Triwulanan'), { status: 'Review', batas: `${addDays(today, 7)}`, periode: 'Triwulan 3 2026' })
  push(by('Pengguna QRIS', 'Bulanan'), { status: 'Disusun', batas: `${addDays(today, 3)}`, periode: 'Bulan berjalan' })
  push(by('QRIS Transaksi', 'Mingguan'), { status: 'Belum Disiapkan', batas: `${addDays(today, 1)}`, periode: 'Minggu berjalan' })
  // jatuh tempo jauh
  push(by('Laporan Rencana Edukasi Plan', 'Tahunan'), { status: 'Belum Disiapkan', batas: `${addDays(today, 25)}`, periode: 'Tahun 2026' })
  push(by('Laporan Tahunan SP', 'Tahunan'), { status: 'Belum Disiapkan', batas: `${addDays(today, 40)}`, periode: 'Tahun 2026' })
  // terlambat (status dihitung normalize)
  push(by('Dana Float', 'Harian'), { status: 'Disusun', batas: `${addDays(today, -3)}`, periode: 'Hari lalu', alasan: 'Menunggu rekonsiliasi saldo dari Finance.' })
  push(by('Laporan Keuangan Audited', 'Tahunan'), { status: 'Review', batas: `${addDays(today, -6)}`, periode: 'Tahun 2025', alasan: 'Review internal belum selesai.' })
  // terkirim tanpa bukti
  push(by('Laporan Data Fraud Transaksi Sistem Pembayaran', 'Bulanan'), { batas: `${addDays(today, -2)}`, tglSubmit: `${addDays(today, -3)}T15:00`, periode: 'Bulan lalu' })
  // insiden siber dengan jam berjalan
  push(SIBER, { status: 'Disusun', jenis: 'Insidental', siber: 'Ya', waktuKejadian: agoLocal(30 * 60), waktuNotif: agoLocal(29 * 60), batas: `${addDays(today, 2)}`, periode: 'Insiden akses tidak sah' })
  push(SIBER, { status: 'Belum Disiapkan', jenis: 'Insidental', siber: 'Ya', waktuKejadian: agoLocal(50), batas: `${addDays(today, 3)}`, periode: 'Insiden DDoS' })
  return out
}

function TrenTerlambat({ rows }: { rows: Laporan[] }) {
  const rg = useMonthRange('12')
  const late = rows.filter((r) => wasLate(r) && r.batas)
  const tren = rg.months(late.map((r) => monthKey(r.batas))).map((m) => ({ name: m, Terlambat: late.filter((r) => monthKey(r.batas) === m).length }))
  return <LineCard title="Tren laporan terlambat per bulan" data={tren} keys={['Terlambat']} colors={{ Terlambat: '#ef4444' }} toolbar={rg.toolbar} info={INFO.tren} />
}
function SoonTable({ rows, open }: { rows: Laporan[]; open: (id: string) => void }) {
  // MiniTable sudah punya pager sendiri (5 baris); jangan paging dua kali dan jangan beri warna khusus
  return (
    <MiniTable title="Jatuh tempo 7 hari ke depan" info={INFO.soon} rows={rows} onRow={(r) => open(r.id)}
      cols={[{ label: 'Nama Laporan', get: (r) => r.nama }, { label: 'Batas', get: (r) => fmtDate(dOf(r.batas)) }, { label: 'PIC', get: (r) => r.picPenyusun }, { label: 'Status', get: (r) => <StatusPill s={r.status} /> }]} />
  )
}

const cfg: PageConfig<Laporan> = {
  module: 'reporting', title: 'Regulatory Reporting', noun: 'Laporan', exportPrefix: 'Pelaporan_Regulator',
  name: (r) => `${r.nama} ${r.periode}`,
  seed, fields, columns, filters,
  blank: () => ({ nama: '', regulator: '', jenis: '', periode: '', batas: '', siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', status: 'Belum Disiapkan', picPenyusun: '', picReviewer: '', bukti: null, noTerima: '', dasar: '', alasan: '' }),
  search: (r) => `${r.no} ${r.nama} ${r.regulator} ${r.picPenyusun} ${r.picReviewer}`, searchPlaceholder: 'Cari nama laporan, regulator, PIC',
  alerts, cancelStatus: 'Dibatalkan', guide: REPORTING_GUIDE,
  normalize: (r, c) => {
    if (r.cancelled) return r
    const past = !!r.batas && dOf(r.batas) < c.today
    if (past && !SENT(r) && r.status !== 'Terlambat') return { ...r, status: 'Terlambat' }
    if (!past && r.status === 'Terlambat') return { ...r, status: 'Belum Disiapkan' }
    return r
  },
  // PIC hanya boleh mengubah laporan yang namanya tertulis sebagai penyusun/reviewer; CO bebas.
  canEditRow: (r, c) => c.role !== 'PIC' || [r.picPenyusun, r.picReviewer].some((n) => n.trim().toLowerCase() === c.user.name.toLowerCase()),
  validate: (r, _m, c) => {
    const e: Record<string, string> = {}
    if (r.status === 'Terlambat' && !(r.batas && dOf(r.batas) < c.today)) e.status = 'Status Terlambat hanya bisa dipilih jika Batas Waktu sudah lewat'
    if (r.picPenyusun.trim() && r.picPenyusun.trim().toLowerCase() === r.picReviewer.trim().toLowerCase()) e.picReviewer = 'PIC Penyusun dan Reviewer harus orang yang berbeda'
    if (SENT(r) && !hasBukti(r)) e.bukti = 'Isi file bukti atau Nomor Tanda Terima (minimal salah satu)'
    if (r.waktuNotif && r.waktuKejadian && r.waktuNotif < r.waktuKejadian) e.waktuNotif = 'Waktu notifikasi tidak boleh sebelum waktu kejadian'
    return e
  },
  dashDate: { get: (r) => r.batas, label: 'Batas Waktu' },
  Dashboard: ({ rows, allRows, c, open, drill }) => {
    const pct = (xs: Laporan[]) => { const s = xs.filter((r) => SENT(r) && r.tglSubmit); const ok = s.filter((r) => !lateBy(r)).length; return { 'Tepat Waktu (%)': s.length ? Math.round((ok / s.length) * 100) : 0, ok, total: s.length } }
    const tepatData = [
      ...JENIS.map((j) => ({ name: `Jenis: ${j}`, ...pct(rows.filter((r) => r.jenis === j)) })),
      ...REG.map((g) => ({ name: `Regulator: ${g}`, ...pct(rows.filter((r) => r.regulator === g)) })),
    ]
    const tepatColors = tepatData.map((d) => (d.name.startsWith('Jenis') ? '#3b82f6' : '#10b981'))
    const beban = JENIS.map((j) => {
      const x = rows.filter((r) => r.jenis === j)
      return { name: j, Terkirim: x.filter(SENT).length, 'Dalam proses': x.filter((r) => !SENT(r) && r.status !== 'Terlambat').length, Terlambat: x.filter((r) => r.status === 'Terlambat').length }
    })
    const soon = rows.filter((r) => !SENT(r) && r.status !== 'Terlambat' && r.batas && dOf(r.batas) >= c.today && dOf(r.batas) <= addDays(c.today, 7)).sort((a, b) => a.batas.localeCompare(b.batas))
    return (
      <div className="space-y-3">
        <CalendarCard title="Kalender pelaporan (batas waktu)" info={INFO.kalender} views={['hari', 'minggu', 'bulan']} onEvent={open}
          events={rows.map((r) => ({ date: dOf(r.batas), label: r.nama, tone: statusTone(r.status), id: r.id }))} />
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Ketepatan waktu: jenis periode dan regulator (% tepat waktu)" info={INFO.tepat} horizontal data={tepatData} keys={['Tepat Waktu (%)']} cellColors={tepatColors}
            tip={(d) => <><div className="mb-1 font-semibold text-slate-800">{String(d.name)}</div><div>Tepat waktu %: {d['Tepat Waktu (%)']}</div><div>Rincian: {d.ok}/{d.total}</div></>}
            onClick={(row) => { const n = String(row.name); if (n.startsWith('Jenis: ')) drill({ jenis: n.slice(7) }); else drill({ regulator: n.slice(11) }) }} />
          <BarCard title="Beban laporan per jenis periode" info={INFO.beban} stacked data={beban} keys={['Terkirim', 'Dalam proses', 'Terlambat']} colors={{ Terkirim: '#10b981', 'Dalam proses': '#f59e0b', Terlambat: '#ef4444' }}
            onClick={(row) => drill({ jenis: String(row.name) })} />
          <TrenTerlambat rows={allRows} />
          <SoonTable rows={soon} open={open} />
        </div>
      </div>
    )
  },
}
export default function Reporting() { return <PageShell config={cfg} /> }
