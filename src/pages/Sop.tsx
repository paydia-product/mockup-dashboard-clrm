import { addDays, diffDays, fmtDate, todayStr } from '../lib'
import { withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { BarCard, DonutCard, MiniTable, StatCards } from '../kit/charts'
import { StatusPill } from '../kit/fmt'
import { sameName } from '../kit/perms'
import type { AlertDef, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'
import { SopRec, seedSop } from './sop.shared'

const STATUS = ['Aktif', 'Dalam Review', 'Dicabut']
const UMUR = ['< 1 tahun', '1-2 tahun', '> 2 tahun']
const REVIEW_WINDOW = 30 // hari sebelum tanggal review untuk alert kuning

const live = (r: SopRec) => r.status !== 'Dicabut'
// umur dokumen dihitung dari Tanggal Berlaku
const umurBucket = (r: SopRec, today: string) => {
  if (!r.tglBerlaku) return ''
  const d = diffDays(today, r.tglBerlaku)
  return d < 365 ? UMUR[0] : d <= 730 ? UMUR[1] : UMUR[2]
}
const daysToReview = (r: SopRec, today: string) => (r.tglReview ? diffDays(r.tglReview, today) : null)
const isOverdue = (r: SopRec, today: string) => live(r) && (daysToReview(r, today) ?? 0) < 0
const isDue = (r: SopRec, today: string) => { const d = live(r) ? daysToReview(r, today) : null; return d !== null && d >= 0 && d <= REVIEW_WINDOW }
const incomplete = (r: SopRec) => !r.tglReview || !r.status || !r.pic.trim()
const toPic = (r: SopRec) => (r.pic ? `PIC (${r.pic})` : 'PIC Dokumen')

// Import boleh membawa baris tanpa Tanggal Review / Status / PIC (jadi alert "Data belum lengkap"); form Tambah/Ubah tetap mewajibkan
const notImport = (_r: SopRec, _c: Ctx, mode?: string) => mode !== 'import'
const fields: Field<SopRec>[] = [
  { key: 'noDok', label: 'No Dokumen', type: 'text', required: true, help: 'Unik, contoh SOP-077-PAY.' },
  { key: 'judul', label: 'Judul', type: 'text', required: true, wide: true },
  { key: 'ringkasan', label: 'Ringkasan (Key Point)', type: 'textarea', required: true, wide: true },
  { key: 'pemilik', label: 'Pemilik Dokumen', type: 'select', options: (c) => withLainnya(c.master.unitKerja), required: true },
  { key: 'tglBerlaku', label: 'Tanggal Berlaku', type: 'date', required: true },
  { key: 'revisiBaru', label: 'Revisi dokumen', type: 'yesno', inForm: 'edit', noExport: true, noImport: true, help: 'Pilih Ya bila dokumen direvisi: No Revisi dan Tanggal Perubahan wajib baru, revisi lama tersimpan di daftar revisi.' },
  { key: 'tglUbah', label: 'Tanggal Perubahan Terakhir', type: 'date', required: true },
  { key: 'noRevisi', label: 'No Revisi', type: 'text', required: true, help: 'Contoh Rev.1, 2.1.' },
  { key: 'retensi', label: 'Retensi', type: 'select', options: ['5 Tahun', '10 Tahun', 'Permanen'], required: true },
  { key: 'klasifikasi', label: 'Klasifikasi', type: 'select', options: ['Publik', 'Internal', 'Rahasia'], required: true },
  { key: 'file', label: 'File PDF', type: 'file', required: true, wide: true },
  { key: 'tglReview', label: 'Tanggal Review Berikutnya', type: 'date', required: notImport },
  { key: 'status', label: 'Status', type: 'select', options: STATUS, required: notImport },
  { key: 'pic', label: 'PIC Dokumen', type: 'select', options: (c) => c.master.pic, required: notImport },
  {
    key: 'revisi', label: 'Daftar Revisi', type: 'list', inForm: 'none', wide: true,
    sub: [
      { key: 'no', label: 'No Revisi', type: 'text' },
      { key: 'tgl', label: 'Tanggal', type: 'date' },
      { key: 'file', label: 'File PDF', type: 'file' },
    ],
  },
]

const columns: Column<SopRec>[] = [
  { label: 'No Dokumen', get: (r) => r.noDok },
  { label: 'Judul', get: (r) => r.judul },
  { label: 'Pemilik', get: (r) => r.pemilik },
  { label: 'Revisi', get: (r) => r.noRevisi },
  { label: 'Tgl Perubahan', get: (r) => r.tglUbah, render: (r) => fmtDate(r.tglUbah) },
  { label: 'Review Berikutnya', get: (r) => r.tglReview, render: (r) => (r.tglReview ? fmtDate(r.tglReview) : '-') },
  { label: 'Status', get: (r) => r.status || '-', render: (r) => (r.status ? <StatusPill s={r.status} /> : <span>-</span>) },
]

const years = (rows: SopRec[]) => [...new Set(rows.map((r) => r.tglBerlaku.slice(0, 4)).filter(Boolean))].sort().reverse()
const filters: FilterDef<SopRec>[] = [
  { key: 'pemilik', label: 'Pemilik Dokumen', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.pemilik === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS], match: (r, v) => r.status === v },
  { key: 'tahun', label: 'Tahun Berlaku', type: 'select', options: (rows) => years(rows), match: (r, v) => r.tglBerlaku.slice(0, 4) === v },
  { key: 'umur', label: 'Umur Dokumen', type: 'select', options: UMUR, match: (r, v) => umurBucket(r, todayStr()) === v },
]

const mk = (c: Ctx, o: Partial<SopRec>): SopRec => ({
  id: 'sample', no: 99, status: 'Aktif', createdAt: c.today, createdBy: '-', noDok: 'SOP-099-PAY', judul: 'Contoh SOP', ringkasan: 'Contoh', pemilik: 'IT',
  tglBerlaku: addDays(c.today, -400), tglUbah: addDays(c.today, -400), noRevisi: 'Rev.1', retensi: '5 Tahun', klasifikasi: 'Internal', file: null,
  tglReview: addDays(c.today, 15), pic: 'Regie', revisi: [], ...o,
})
const alerts: AlertDef<SopRec>[] = [
  {
    key: 'due', label: 'Review mendekat', rule: `Tanggal review berikutnya ${REVIEW_WINDOW} hari lagi atau kurang.`,
    check: (r, c) => (isDue(r, c.today) ? { color: 'yellow', detail: `Review ${daysToReview(r, c.today)} hari lagi (${fmtDate(r.tglReview)})`, to: [toPic(r), 'Compliance Officer'] } : null),
    sample: (c) => mk(c, { tglReview: addDays(c.today, 20) }),
  },
  {
    key: 'overdue', label: 'Review terlewat', rule: 'Tanggal review berikutnya sudah lewat dan dokumen belum dicabut.',
    check: (r, c) => (isOverdue(r, c.today) ? { color: 'red', detail: `Lewat review ${-(daysToReview(r, c.today) as number)} hari`, to: [toPic(r), 'Head CLRM'] } : null),
    sample: (c) => mk(c, { tglReview: addDays(c.today, -12) }),
  },
  {
    key: 'incomplete', label: 'Data belum lengkap', rule: 'Tanggal review, status, atau PIC Dokumen kosong (biasanya dari data impor).',
    check: (r) => {
      if (!incomplete(r)) return null
      const miss = [!r.tglReview && 'tanggal review', !r.status && 'status', !r.pic.trim() && 'PIC'].filter(Boolean).join(', ')
      return { color: 'yellow', detail: `Belum diisi: ${miss}`, to: ['Compliance Officer'] }
    },
    sample: (c) => mk(c, { tglReview: '', pic: '' }),
  },
]

const cfg: PageConfig<SopRec> = {
  module: 'sop', title: 'SOP & Dokumen Kontrol', noun: 'SOP', exportPrefix: 'Daftar_SOP',
  name: (r) => r.judul,
  seed: seedSop, fields, columns, filters, alerts, cancelStatus: 'Dicabut',
  blank: () => ({ noDok: '', judul: '', ringkasan: '', pemilik: '', tglBerlaku: '', tglUbah: '', noRevisi: '', retensi: '', klasifikasi: '', file: null, tglReview: '', pic: '', revisi: [], status: 'Aktif' }),
  search: (r) => `${r.noDok} ${r.judul} ${r.ringkasan}`, searchPlaceholder: 'Cari no dokumen, judul, ringkasan',
  // Dicabut lewat Cancel diblokir shell (r.cancelled); Dicabut manual tetap bisa diedit/dipulihkan. PIC hanya PIC Dokumen miliknya.
  canEditRow: (r, c) => c.role !== 'PIC' || sameName(r.pic, c.user.name),
  validate: (r, mode, c) => {
    const e: Record<string, string> = {}
    const dup = (c.all('sop') as SopRec[]).find((x) => x.id !== r.id && x.noDok.trim().toLowerCase() === r.noDok.trim().toLowerCase())
    if (r.noDok.trim() && dup) e.noDok = `No Dokumen sudah dipakai SOP ${dup.judul}`
    if (r.tglBerlaku && r.tglUbah && r.tglUbah < r.tglBerlaku) e.tglUbah = 'Tanggal Perubahan tidak boleh sebelum Tanggal Berlaku'
    if (mode === 'edit' && (r as SopRec & { revisiBaru?: string }).revisiBaru === 'Ya') {
      const old = (c.all('sop') as SopRec[]).find((x) => x.id === r.id)
      if (old && r.noRevisi === old.noRevisi) e.noRevisi = 'Revisi dokumen: No Revisi harus berbeda dari revisi sebelumnya'
      if (old && r.tglUbah === old.tglUbah) e.tglUbah = 'Revisi dokumen: Tanggal Perubahan harus tanggal baru'
    }
    return e
  },
  // revisi lama (no, tanggal, file) dipindah ke daftar revisi; penanda revisiBaru tidak disimpan
  beforeSave: (old, next) => {
    const { revisiBaru, ...rest } = next as SopRec & { revisiBaru?: string }
    if (old && revisiBaru === 'Ya') return { ...rest, revisi: [...(old.revisi ?? []), { no: old.noRevisi, tgl: old.tglUbah, file: old.file }] }
    return rest as SopRec
  },
  Dashboard: ({ rows, c, open, drill }) => {
    const due = rows.filter((r) => isDue(r, c.today))
    const over = rows.filter((r) => isOverdue(r, c.today))
    const review = [...over, ...due].sort((a, b) => a.tglReview.localeCompare(b.tglReview))
    const statusData = [...STATUS, ''].map((s) => ({ name: s || 'Belum diisi', value: rows.filter((r) => r.status === s).length })).filter((d) => d.value)
    return (
      <div className="space-y-3">
        <StatCards items={[
          { label: 'Total SOP', value: rows.length, tone: 'blue' },
          { label: 'Aktif', value: rows.filter((r) => r.status === 'Aktif').length, tone: 'green', onClick: () => drill({ status: 'Aktif' }) },
          { label: 'Harus direview (<= 30 hari)', value: due.length, tone: due.length ? 'yellow' : 'gray' },
          { label: 'Review terlewat', value: over.length, tone: over.length ? 'red' : 'gray' },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="SOP per unit kerja pemilik" horizontal data={c.master.unitKerja.map((d) => ({ name: d, Jumlah: rows.filter((r) => r.pemilik === d).length }))} keys={['Jumlah']} onClick={(row) => drill({ pemilik: row.name })} />
          <DonutCard title="SOP per status" data={statusData} onClick={(name) => name !== 'Belum diisi' && drill({ status: name })} />
          <BarCard title="Umur dokumen (sejak Tanggal Berlaku)" data={UMUR.map((u) => ({ name: u, Jumlah: rows.filter((r) => umurBucket(r, c.today) === u).length }))} keys={['Jumlah']} cellColors={['#22c55e', '#f59e0b', '#ef4444']} onClick={(row) => drill({ umur: row.name })} />
          <MiniTable<SopRec> title="SOP yang harus direview (<= 30 hari atau lewat)" rows={review} onRow={(r) => open(r.id)}
            cols={[
              { label: 'No Dokumen', get: (r) => r.noDok },
              { label: 'Judul', get: (r) => r.judul },
              { label: 'Review', get: (r) => fmtDate(r.tglReview) },
              { label: 'Sisa', get: (r) => { const d = daysToReview(r, c.today) as number; return <span className={d < 0 ? 'font-semibold text-red-600' : 'text-amber-600'}>{d < 0 ? `Lewat ${-d} hari` : `${d} hari`}</span> } },
            ]} />
        </div>
      </div>
    )
  },
}
export default function Sop() { return <PageShell config={cfg} /> }
