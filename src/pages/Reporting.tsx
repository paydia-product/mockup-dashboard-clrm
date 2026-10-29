import { useState } from 'react'
import { usePaged } from '../shared/Pager'
import { addDays, diffDays, fmtDate, fmtTime } from '../lib'
import PageShell from '../kit/PageShell'
import { BarCard, CalendarCard, LineCard, MiniTable } from '../kit/charts'
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
const REG = ['BI', 'PPATK', 'Komdigi', 'BSSN']
const JENIS = ['Harian', 'Mingguan', 'Bulanan', 'Triwulanan', 'Tahunan', '3 Tahun Sekali', 'Insidental']
const STATUS = ['Belum Disiapkan', 'Disusun', 'Review', 'Terkirim'] // Terlambat otomatis (normalize), tidak bisa dipilih manual
const SENT = (r: Laporan) => r.status === 'Terkirim'
const dOf = (s: string) => s.slice(0, 10)
const isSiber = (r: Laporan) => r.jenis === 'Insidental' && r.siber === 'Ya'
const hasBukti = (r: Laporan) => !!r.bukti || !!r.noTerima.trim()
// Selisih hari submit terhadap batas (positif = terlambat)
const lateBy = (r: Laporan) => (r.tglSubmit && r.batas && r.tglSubmit > r.batas ? Math.max(1, diffDays(dOf(r.tglSubmit), dOf(r.batas))) : 0)
const tepat = (r: Laporan) => (!r.tglSubmit || !r.batas ? '-' : lateBy(r) ? `Terlambat (+${lateBy(r)} hari)` : 'Tepat Waktu')
const wasLate = (r: Laporan) => r.status === 'Terlambat' || lateBy(r) > 0
const pad = (n: number) => String(n).padStart(2, '0')
const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const agoLocal = (minutes: number) => fmtLocal(new Date(Date.now() - minutes * 60000))
const dur = (ms: number) => { const m = Math.round(Math.abs(ms) / 60000); return m >= 120 ? `${Math.floor(m / 60)} jam` : `${m} menit` }

// Spec: PIC dan CO hanya mengubah status, tanggal submit, bukti, dan alasan terlambat; Super Admin semua kolom.
const full = (c: Ctx) => c.role === 'Super Admin'
const fields: Field<Laporan>[] = [
  { key: 'nama', label: 'Nama Laporan', type: 'text', required: true, help: 'Teks bebas. Contoh: Pelaporan Dana Floating, Laporan RBSP, SiPesat, LTKM, LTKT, Laporan Insiden Siber.', editableBy: full },
  { key: 'regulator', label: 'Regulator', type: 'select', options: REG, required: true, editableBy: full },
  { key: 'jenis', label: 'Jenis Periode', type: 'select', options: JENIS, required: true, editableBy: full },
  { key: 'siber', label: 'Laporan Insiden Siber?', type: 'yesno', showIf: (r) => r.jenis === 'Insidental', help: 'Jam berjalan insiden siber dihitung dari waktu kejadian.', editableBy: full },
  { key: 'waktuKejadian', label: 'Waktu Kejadian', type: 'datetime', required: (r) => r.jenis === 'Insidental', showIf: (r) => r.jenis === 'Insidental', editableBy: full },
  { key: 'waktuNotif', label: 'Waktu Notifikasi Awal', type: 'datetime', showIf: isSiber, help: 'Paling lambat 1 jam sejak kejadian.', editableBy: full },
  { key: 'periode', label: 'Periode yang Dilaporkan', type: 'text', required: true, help: 'Diisi manual, mis. "Oktober 2026" atau "Q3 2026".', editableBy: full },
  { key: 'batas', label: 'Batas Waktu (Due Date)', type: 'datetime', required: true, help: 'Untuk laporan insidental diisi manual (paling lambat 3 hari kalender untuk insiden siber).', editableBy: full },
  { key: 'tglSubmit', label: 'Tanggal Submit', type: 'datetime', required: (r) => SENT(r) },
  { key: 'status', label: 'Status', type: 'select', options: STATUS, required: true, help: 'Terlambat terisi otomatis bila batas waktu terlewat dan belum Terkirim.' },
  { key: 'tepat', label: 'Tepat Waktu?', type: 'text', auto: (r) => tepat(r) },
  { key: 'picPenyusun', label: 'PIC Penyusun', type: 'text', required: true, editableBy: full },
  { key: 'picReviewer', label: 'PIC Reviewer', type: 'text', required: true, editableBy: full },
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
  { label: 'Batas Waktu', get: (r) => r.batas, render: (r) => fmtTime(r.batas) },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'Tepat Waktu?', get: (r) => tepat(r), render: (r) => { const t = tepat(r); return t === '-' ? <span className="text-slate-300">-</span> : <StatusPill s={t} /> } },
  { label: 'Penyusun', get: (r) => r.picPenyusun },
]
const picOpts = (rows: Laporan[]) => [...new Set(rows.flatMap((r) => [r.picPenyusun, r.picReviewer]).filter(Boolean))].sort()
const filters: FilterDef<Laporan>[] = [
  { key: 'periode', label: 'Periode (Batas Waktu)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || dOf(r.batas) >= a) && (!b || dOf(r.batas) <= b) } },
  { key: 'jenis', label: 'Jenis Periode', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS, 'Terlambat', 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'regulator', label: 'Regulator', type: 'select', options: REG, match: (r, v) => r.regulator === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => picOpts(rows), match: (r, v) => r.picPenyusun === v || r.picReviewer === v },
]

const toPic = (r: Laporan) => (r.picPenyusun ? `PIC (${r.picPenyusun})` : 'PIC')
const mk = (c: Ctx, o: Partial<Laporan>): Laporan => ({
  id: 'sample', no: 99, status: 'Disusun', createdAt: c.today, createdBy: '-', nama: 'Laporan RBSP', regulator: 'BI', jenis: 'Triwulanan', periode: 'Q3 2026',
  batas: `${addDays(c.today, 3)}T17:00`, siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', picPenyusun: 'Rina Kartika', picReviewer: 'Arief Nugraha',
  bukti: null, noTerima: '', dasar: 'PBI 23/6/PBI/2021', alasan: '', ...o,
})
const alerts: AlertDef<Laporan>[] = [
  {
    key: 'near', label: 'Hampir jatuh tempo', rule: 'Batas waktu tinggal 7, 3, atau 1 hari (H-7/H-3/H-1, paling lama 7 hari) dan laporan belum Terkirim.',
    check: (r, c) => {
      if (SENT(r) || r.status === 'Terlambat' || !r.batas) return null
      const d = diffDays(dOf(r.batas), c.today)
      return d >= 0 && d <= 7 ? { color: 'yellow', detail: `H-${d} batas waktu (${fmtTime(r.batas)})`, to: [toPic(r), 'Compliance Officer'] } : null
    },
    sample: (c) => mk(c, { batas: `${addDays(c.today, 3)}T17:00` }),
  },
  {
    key: 'late', label: 'Laporan terlambat', rule: 'Batas waktu terlewat dan laporan belum Terkirim.',
    check: (r) => (r.status === 'Terlambat' ? { color: 'red', detail: `Terlambat sejak ${fmtTime(r.batas)}`, to: [toPic(r), 'Head CLRM'] } : null),
    sample: (c) => mk(c, { status: 'Terlambat', batas: `${addDays(c.today, -3)}T17:00`, alasan: 'Menunggu data dari tim terkait.' }),
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
    sample: (c) => mk(c, { nama: 'Laporan Insiden Siber', regulator: 'BSSN', jenis: 'Insidental', siber: 'Ya', periode: 'Insiden siber', waktuKejadian: agoLocal(40), batas: `${addDays(c.today, 3)}T12:00` }),
  },
  {
    key: 'nobukti', label: 'Terkirim tanpa bukti', rule: 'Status Terkirim tetapi file bukti dan nomor tanda terima kosong.',
    check: (r) => (SENT(r) && !hasBukti(r) ? { color: 'yellow', detail: 'Bukti submit belum diisi', to: [toPic(r)] } : null),
    sample: (c) => mk(c, { status: 'Terkirim', tglSubmit: `${addDays(c.today, -1)}T10:00` }),
  },
]

type Item = [nama: string, regulator: string, jenis: string, dasar: string]
const CAT: Item[] = [
  ['Pelaporan Dana Floating', 'BI', 'Bulanan', 'PBI Uang Elektronik'], ['Laporan RBSP', 'BI', 'Triwulanan', 'PADG RBSP'], ['SiPesat', 'BI', 'Bulanan', 'PADG Pelaporan PJP'],
  ['LTKT', 'PPATK', 'Bulanan', 'UU 8/2010 TPPU'], ['LTKM', 'PPATK', 'Insidental', 'UU 8/2010 TPPU'], ['Laporan Transaksi Harian', 'BI', 'Harian', 'PADG Pelaporan PJP'],
  ['Laporan Fraud Mingguan', 'BI', 'Mingguan', 'PADG Manajemen Risiko'], ['Laporan Tahunan Perlindungan Konsumen', 'BI', 'Tahunan', 'PBI Perlindungan Konsumen'],
  ['Laporan PSE Terdaftar', 'Komdigi', 'Triwulanan', 'Permenkominfo 5/2020'], ['Penilaian Kembali Sertifikasi Keamanan', 'Komdigi', '3 Tahun Sekali', 'PP 71/2019'],
  ['Laporan Keamanan Informasi', 'BSSN', 'Tahunan', 'Perpres 82/2022'], ['Laporan Insiden Siber', 'BSSN', 'Insidental', 'Perban BSSN 8/2020'],
]
const PEN = ['Rina Kartika', 'Arief Nugraha', 'Bima Pratama', 'Dewi Anggraini']
const REV = ['Arief Nugraha', 'Rina Kartika', 'Dewi Anggraini', 'Bima Pratama']
const PERIODE: Record<string, (i: number) => string> = {
  Harian: (i) => `Hari ke-${i + 1}`, Mingguan: (i) => `Minggu ke-${i + 1}`, Bulanan: (i) => `Bulan ke-${i + 1}`, Triwulanan: (i) => `Triwulan ${(i % 4) + 1}`,
  Tahunan: () => 'Tahun 2025', '3 Tahun Sekali': () => '2024-2026', Insidental: (i) => `Kejadian #${i + 1}`,
}

function seed(today: string): Laporan[] {
  const out: Laporan[] = []
  const push = (it: Item, o: Partial<Laporan>) => {
    const i = out.length
    const [nama, regulator, jenis, dasar] = it
    out.push({
      id: `reporting-${i + 1}`, no: i + 1, status: 'Terkirim', createdAt: today, createdBy: 'Rina Kartika', nama, regulator, jenis, periode: PERIODE[jenis](i), batas: `${today}T17:00`,
      siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', picPenyusun: PEN[i % 4], picReviewer: REV[i % 4], bukti: null, noTerima: '', dasar, alasan: '', ...o,
    })
  }
  // 12 bulan ke belakang: Terkirim, tiap 5 laporan satu terlambat (alasan terisi)
  for (let i = 0; i < 34; i++) {
    const batasD = addDays(today, -(12 + i * 10))
    const late = i % 5 === 3
    const sub = late ? `${addDays(batasD, 1 + (i % 3))}T10:30` : `${addDays(batasD, -1)}T14:00`
    push(CAT[i % CAT.length], { batas: `${batasD}T17:00`, tglSubmit: sub, noTerima: `TT-${String(2026000 + i)}`, alasan: late ? 'Data pendukung terlambat diterima dari unit terkait.' : '' })
  }
  // H-7, H-3, H-1
  push(CAT[1], { status: 'Review', batas: `${addDays(today, 7)}T17:00`, periode: 'Triwulan 3' })
  push(CAT[2], { status: 'Disusun', batas: `${addDays(today, 3)}T17:00`, periode: 'Bulan berjalan' })
  push(CAT[6], { status: 'Belum Disiapkan', batas: `${addDays(today, 1)}T12:00`, periode: 'Minggu berjalan' })
  // jatuh tempo jauh
  push(CAT[7], { status: 'Belum Disiapkan', batas: `${addDays(today, 25)}T17:00`, periode: 'Tahun 2026' })
  push(CAT[8], { status: 'Belum Disiapkan', batas: `${addDays(today, 40)}T17:00`, periode: 'Triwulan 4' })
  // terlambat (status dihitung normalize)
  push(CAT[0], { status: 'Disusun', batas: `${addDays(today, -3)}T17:00`, periode: 'Bulan lalu', alasan: 'Menunggu rekonsiliasi saldo dari Finance.' })
  push(CAT[10], { status: 'Review', batas: `${addDays(today, -6)}T17:00`, periode: 'Tahun 2026', alasan: 'Review internal belum selesai.' })
  // terkirim tanpa bukti
  push(CAT[3], { batas: `${addDays(today, -2)}T17:00`, tglSubmit: `${addDays(today, -3)}T15:00`, periode: 'Bulan lalu' })
  // insiden siber dengan jam berjalan
  push(CAT[11], { status: 'Disusun', jenis: 'Insidental', siber: 'Ya', waktuKejadian: agoLocal(30 * 60), waktuNotif: agoLocal(29 * 60), batas: `${addDays(today, 2)}T12:00`, periode: 'Insiden akses tidak sah' })
  push(CAT[11], { status: 'Belum Disiapkan', jenis: 'Insidental', siber: 'Ya', waktuKejadian: agoLocal(50), batas: `${addDays(today, 3)}T12:00`, periode: 'Insiden DDoS' })
  return out
}

const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
function TrenTerlambat({ rows, today }: { rows: Laporan[]; today: string }) {
  const [p, setP] = useState('12')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const cur = today.slice(0, 7)
  const late = rows.filter((r) => wasLate(r) && r.batas)
  let start: string, end = cur
  if (p === 'all') start = late.map((r) => monthKey(r.batas)).sort()[0] ?? cur
  else if (p === 'custom') { start = from || late.map((r) => monthKey(r.batas)).sort()[0] || cur; end = to || cur }
  else { const d = new Date(today + 'T00:00:00'); d.setDate(1); d.setMonth(d.getMonth() - (Number(p) - 1)); start = ym(d) }
  const months: string[] = []
  for (const d = new Date(start + '-01T00:00:00'); ym(d) <= end && months.length < 600; d.setMonth(d.getMonth() + 1)) months.push(ym(d))
  const tren = months.map((m) => ({ name: m, Terlambat: late.filter((r) => monthKey(r.batas) === m).length }))
  const toolbar = (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-slate-500">Periode</span>
        <select className="inp !w-auto" value={p} onChange={(e) => setP(e.target.value)}>
          <option value="all">Seluruh Waktu</option>{[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n} bulan terakhir</option>)}<option value="custom">Custom</option>
        </select>
        {p === 'custom' && <><input type="month" className="inp !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} /><span>sampai</span><input type="month" className="inp !w-auto" value={to} onChange={(e) => setTo(e.target.value)} /></>}
      </div>
  )
  return <LineCard title="Tren laporan terlambat per bulan" data={tren} keys={['Terlambat']} colors={{ Terlambat: '#ef4444' }} toolbar={toolbar} />
}
function SoonTable({ rows, open }: { rows: Laporan[]; open: (id: string) => void }) {
  const { slice, pager } = usePaged(rows, 5, [5])
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50">
      <MiniTable title="Jatuh tempo 7 hari ke depan" className="border-0 bg-transparent" rows={slice} onRow={(r) => open(r.id)}
        cols={[{ label: 'Nama Laporan', get: (r) => r.nama }, { label: 'Batas', get: (r) => fmtDate(dOf(r.batas)) }, { label: 'PIC', get: (r) => r.picPenyusun }, { label: 'Status', get: (r) => <StatusPill s={r.status} /> }]} />
      {pager}
    </div>
  )
}

const cfg: PageConfig<Laporan> = {
  module: 'reporting', title: 'Regulatory Reporting', noun: 'Laporan', exportPrefix: 'Pelaporan_Regulator',
  seed, fields, columns, filters,
  blank: () => ({ nama: '', regulator: '', jenis: '', periode: '', batas: '', siber: '', waktuKejadian: '', waktuNotif: '', tglSubmit: '', status: 'Belum Disiapkan', picPenyusun: '', picReviewer: '', bukti: null, noTerima: '', dasar: '', alasan: '' }),
  search: (r) => `${r.no} ${r.nama} ${r.regulator} ${r.picPenyusun} ${r.picReviewer}`, searchPlaceholder: 'Cari nama laporan, regulator, PIC',
  alerts, cancelStatus: 'Dibatalkan',
  normalize: (r, c) => {
    if (r.cancelled) return r
    const past = !!r.batas && dOf(r.batas) < c.today
    if (past && !SENT(r) && r.status !== 'Terlambat') return { ...r, status: 'Terlambat' }
    if (!past && r.status === 'Terlambat') return { ...r, status: 'Belum Disiapkan' }
    return r
  },
  // PIC hanya boleh mengubah laporan yang namanya tertulis sebagai penyusun/reviewer; CO bebas.
  canEditRow: (r, c) => c.role !== 'PIC' || [r.picPenyusun, r.picReviewer].some((n) => n.trim().toLowerCase() === c.user.name.toLowerCase()),
  validate: (r) => {
    const e: Record<string, string> = {}
    if (r.picPenyusun.trim() && r.picPenyusun.trim().toLowerCase() === r.picReviewer.trim().toLowerCase()) e.picReviewer = 'PIC Penyusun dan Reviewer harus orang yang berbeda'
    if (SENT(r) && !hasBukti(r)) e.bukti = 'Isi file bukti atau Nomor Tanda Terima (minimal salah satu)'
    if (r.waktuNotif && r.waktuKejadian && r.waktuNotif < r.waktuKejadian) e.waktuNotif = 'Waktu notifikasi tidak boleh sebelum waktu kejadian'
    return e
  },
  Dashboard: ({ rows, c, open, drill }) => {
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
        <CalendarCard title="Kalender pelaporan (batas waktu)" views={['hari', 'minggu', 'bulan']} onEvent={open}
          events={rows.map((r) => ({ date: dOf(r.batas), label: r.nama, tone: statusTone(r.status), id: r.id }))} />
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Ketepatan waktu: jenis periode dan regulator (% tepat waktu)" horizontal data={tepatData} keys={['Tepat Waktu (%)']} cellColors={tepatColors}
            tip={(d) => <><div className="mb-1 font-semibold text-slate-800">{String(d.name)}</div><div>Tepat waktu %: {d['Tepat Waktu (%)']}</div><div>Rincian: {d.ok}/{d.total}</div></>}
            onClick={(row) => { const n = String(row.name); if (n.startsWith('Jenis: ')) drill({ jenis: n.slice(7) }); else drill({ regulator: n.slice(11) }) }} />
          <BarCard title="Beban laporan per jenis periode" stacked data={beban} keys={['Terkirim', 'Dalam proses', 'Terlambat']} colors={{ Terkirim: '#10b981', 'Dalam proses': '#f59e0b', Terlambat: '#ef4444' }}
            onClick={(row) => drill({ jenis: String(row.name) })} />
          <TrenTerlambat rows={rows} today={c.today} />
          <SoonTable rows={soon} open={open} />
        </div>
      </div>
    )
  },
}
export default function Reporting() { return <PageShell config={cfg} /> }
