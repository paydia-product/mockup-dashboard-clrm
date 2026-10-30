import { addDays, diffDays, fmtDate } from '../lib'
import { withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { BarCard, DonutCard, StatCards } from '../kit/charts'
import { ageBuckets, ageBucket, workDaysBetween } from '../kit/dates'
import { StatusPill } from '../kit/fmt'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'

// Halaman referensi untuk page kit: SLA, hari kerja, Unit Kerja master, alert, saved filter, export, import.
interface Layanan extends BaseRec {
  dept: string; jenis: string; tglMasuk: string; sla: number | ''; pic: string; prioritas: string
  tglSelesai: string; memo: string
}
const JENIS = ['Review', 'Pendapat Hukum', 'Penyusunan Dokumen', 'Konsultasi', 'Lainnya']
const PRIO = ['Tinggi', 'Sedang', 'Rendah']
const OPEN = (r: Layanan) => r.status === 'Baru' || r.status === 'Proses'
const batas = (r: Layanan) => (r.tglMasuk && r.sla !== '' ? addDays(r.tglMasuk, Number(r.sla)) : '')
const lateDays = (r: Layanan, today: string) => (OPEN(r) && batas(r) ? Math.max(0, diffDays(today, batas(r))) : 0)
const age = (r: Layanan, today: string) => diffDays(today, r.tglMasuk)

const fields: Field<Layanan>[] = [
  { key: 'dept', label: 'Unit Kerja Pemohon', type: 'select', options: (c) => withLainnya(c.master.unitKerja), required: true },
  { key: 'jenis', label: 'Jenis', type: 'select', options: JENIS, required: true },
  { key: 'tglMasuk', label: 'Tanggal Masuk', type: 'date', required: true, reasonOnChange: true, help: 'Mengubah Tanggal Masuk menggeser batas waktu; wajib disertai alasan.' },
  { key: 'sla', label: 'SLA (hari kalender)', type: 'number', required: true, reasonOnChange: true, help: 'Mengubah SLA (batas waktu) wajib disertai alasan.' },
  { key: 'batas', label: 'Tanggal Batas', type: 'date', auto: (r) => batas(r) },
  { key: 'status', label: 'Status', type: 'select', options: ['Baru', 'Proses', 'Selesai', 'Batal'], required: true },
  { key: 'pic', label: 'PIC', type: 'select', options: (c) => c.master.pic, help: 'Boleh kosong saat dibuat pemohon.' },
  { key: 'prioritas', label: 'Prioritas', type: 'select', options: PRIO, required: true },
  { key: 'tglSelesai', label: 'Tanggal Selesai', type: 'date', required: (r) => r.status === 'Selesai', showIf: (r) => r.status === 'Selesai' },
  { key: 'memo', label: 'Nomor Memo / Pendapat Hukum', type: 'text', required: (r) => r.status === 'Selesai', showIf: (r) => r.status === 'Selesai' },
]
const columns: Column<Layanan>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Unit Kerja', get: (r) => r.dept },
  { label: 'Jenis', get: (r) => r.jenis },
  { label: 'Tgl Masuk', get: (r) => r.tglMasuk, render: (r) => fmtDate(r.tglMasuk) },
  { label: 'Batas', get: (r) => batas(r), render: (r) => fmtDate(batas(r)) },
  { label: 'Prioritas', get: (r) => r.prioritas },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'PIC', get: (r) => r.pic || '-' },
]
const uniq = (rows: Layanan[], g: (r: Layanan) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Layanan>[] = [
  { key: 'periode', label: 'Periode (Tanggal Masuk)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglMasuk >= a) && (!b || r.tglMasuk <= b) } },
  { key: 'status', label: 'Status', type: 'select', options: ['Baru', 'Proses', 'Selesai', 'Batal', 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => uniq(rows, (r) => r.pic), match: (r, v) => r.pic === v },
  { key: 'dept', label: 'Unit Kerja', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.dept === v },
  { key: 'jenis', label: 'Jenis', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'prioritas', label: 'Prioritas', type: 'select', options: PRIO, match: (r, v) => r.prioritas === v },
]

const toPic = (r: Layanan) => (r.pic ? `PIC (${r.pic})` : 'PIC')
const mk = (c: Ctx, o: Partial<Layanan>): Layanan => ({ id: 'sample', no: 99, status: 'Proses', createdAt: c.today, createdBy: '-', dept: 'IT', jenis: 'Review', tglMasuk: addDays(c.today, -10), sla: 7, pic: 'Osama', prioritas: 'Sedang', tglSelesai: '', memo: '', ...o })
const alerts: AlertDef<Layanan>[] = [
  {
    key: 'overdue', label: 'Lewat batas waktu', rule: 'Batas waktu terlewat dan permintaan belum Selesai.',
    check: (r, c) => { const d = lateDays(r, c.today); return d > 0 ? { color: 'red', detail: `Lewat ${d} hari`, to: [toPic(r), 'Head CLRM'] } : null },
    sample: (c) => mk(c, { tglMasuk: addDays(c.today, -10), sla: 7 }),
  },
  {
    key: 'near', label: 'Hampir jatuh tempo', rule: 'Batas waktu tinggal 2 hari kerja atau kurang dan permintaan belum Selesai.',
    check: (r, c) => {
      if (!OPEN(r) || !batas(r) || lateDays(r, c.today) > 0) return null
      const d = workDaysBetween(c.today, batas(r))
      return d <= 2 ? { color: 'yellow', detail: `${d} hari kerja lagi`, to: [toPic(r)] } : null
    },
    sample: (c) => mk(c, { tglMasuk: addDays(c.today, -5), sla: 6 }),
  },
  {
    key: 'nopic', label: 'Belum ada PIC', rule: 'PIC masih kosong lebih dari 1 hari kerja sejak tanggal masuk.',
    check: (r, c) => (OPEN(r) && !r.pic.trim() && workDaysBetween(r.tglMasuk, c.today) > 1 ? { color: 'yellow', detail: `${workDaysBetween(r.tglMasuk, c.today)} hari kerja tanpa PIC`, to: ['Head CLRM'] } : null),
    sample: (c) => mk(c, { pic: '', status: 'Baru', tglMasuk: addDays(c.today, -4), sla: 14 }),
  },
]

function seed(today: string): Layanan[] {
  const DEPT = ['IT', 'Business', 'Operation', 'Finance, Accounting, Tax & Treasury', 'Compliance', 'Support (HRD & GA)']
  const PICS = ['Osama', 'Osama', 'Fakhri', 'Regie'] // master PIC
  // [umur hari, sla, status, pic kosong?]
  const sc: [number, number, string, boolean?][] = [
    [12, 7, 'Proses'], [20, 14, 'Proses'], [9, 5, 'Baru'], [3, 14, 'Baru', true], [5, 14, 'Baru', true], // lewat batas + tanpa PIC
    [5, 6, 'Proses'], [4, 5, 'Proses'], [6, 7, 'Baru'], // hampir jatuh tempo
    [2, 14, 'Proses'], [3, 21, 'Baru'], [8, 30, 'Proses'], [16, 30, 'Proses'], [1, 10, 'Baru'], [18, 40, 'Proses'],
    [40, 14, 'Selesai'], [35, 10, 'Selesai'], [28, 21, 'Selesai'], [60, 30, 'Selesai'], [22, 7, 'Selesai'], [50, 14, 'Selesai'], [45, 20, 'Selesai'], [33, 14, 'Selesai'],
    [25, 14, 'Batal'], [15, 7, 'Batal'], [7, 14, 'Proses'], [10, 21, 'Proses'], [11, 30, 'Baru'], [14, 21, 'Proses'], [30, 45, 'Proses'], [4, 30, 'Baru'],
  ]
  return sc.map(([umur, sla, status, noPic], i) => {
    const tglMasuk = addDays(today, -umur)
    const done = status === 'Selesai'
    const selesai = done ? addDays(tglMasuk, Math.max(2, Math.round(sla * (0.5 + (i % 5) * 0.2)))) : ''
    return {
      id: `layanan-${i + 1}`, no: i + 1, status, createdAt: tglMasuk, createdBy: 'Regie',
      dept: DEPT[i % 6], jenis: JENIS[(i * 2) % 5], tglMasuk, sla, pic: noPic ? '' : PICS[i % 4], prioritas: PRIO[i % 3],
      tglSelesai: selesai, memo: done ? `MEMO/LGL/${String(i + 1).padStart(3, '0')}/2026` : '',
    }
  })
}

const cfg: PageConfig<Layanan> = {
  module: 'layanan', title: 'Permintaan Layanan Hukum', noun: 'Permintaan', exportPrefix: 'Permintaan_Layanan_Hukum',
  seed, fields, columns, filters,
  blank: () => ({ dept: '', jenis: '', tglMasuk: '', sla: '', status: 'Baru', pic: '', prioritas: '', tglSelesai: '', memo: '' }),
  search: (r) => `${r.no} ${r.dept} ${r.jenis}`, searchPlaceholder: 'Cari nomor, unit kerja, jenis',
  alerts, cancelStatus: 'Dibatalkan',
  canEditRow: (r) => r.status !== 'Selesai' && r.status !== 'Batal',
  validate: (r) => {
    const e: Record<string, string> = {}
    if (r.sla !== '' && Number(r.sla) < 1) e.sla = 'SLA minimal 1 hari'
    if (r.status === 'Selesai' && r.tglSelesai && r.tglMasuk && r.tglSelesai < r.tglMasuk) e.tglSelesai = 'Tanggal Selesai tidak boleh sebelum Tanggal Masuk'
    return e
  },
  Dashboard: ({ rows, c, drill }) => {
    const n = (s: string) => rows.filter((r) => r.status === s).length
    const late = rows.filter((r) => lateDays(r, c.today) > 0).length
    const open = rows.filter(OPEN)
    const edges = [7, 14]
    const buckets = ageBuckets(edges)
    const umur = buckets.map((name) => ({ name, Jumlah: open.filter((r) => ageBucket(age(r, c.today), edges) === name).length }))
    const done = rows.filter((r) => r.status === 'Selesai' && r.tglSelesai)
    return (
      <div className="space-y-3">
        <StatCards items={[
          { label: 'Baru', value: n('Baru'), tone: 'blue', onClick: () => drill({ status: 'Baru' }) },
          { label: 'Proses', value: n('Proses'), tone: 'yellow', onClick: () => drill({ status: 'Proses' }) },
          { label: 'Selesai', value: n('Selesai'), tone: 'green', onClick: () => drill({ status: 'Selesai' }) },
          { label: 'Lewat batas', value: late, tone: late ? 'red' : 'gray' },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <DonutCard title="Permintaan per jenis" data={JENIS.map((j) => ({ name: j, value: rows.filter((r) => r.jenis === j).length }))} onClick={(name) => drill({ jenis: name })} />
          <BarCard title="Belum selesai menurut umur (hari)" data={umur} keys={['Jumlah']} cellColors={['#f59e0b', '#f59e0b', '#ef4444']} />
          <BarCard title="Permintaan per unit kerja" horizontal data={c.master.unitKerja.map((d) => ({ name: d, Jumlah: rows.filter((r) => r.dept === d).length }))} keys={['Jumlah']} onClick={(row) => drill({ dept: row.name })} />
          <BarCard title="Rata-rata lama selesai per jenis (hari)" data={JENIS.map((j) => { const x = done.filter((r) => r.jenis === j); return { name: j, Hari: x.length ? Math.round(x.reduce((a, r) => a + diffDays(r.tglSelesai, r.tglMasuk), 0) / x.length) : 0 } })} keys={['Hari']} />
        </div>
      </div>
    )
  },
}
export default function LayananHukum() { return <PageShell config={cfg} /> }
