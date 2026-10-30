import { useState } from 'react'
import { addDays, fmtDate } from '../lib'
import PageShell from '../kit/PageShell'
import { BarCard, Card, MiniTable, StatCards, TONE_HEX } from '../kit/charts'
import { StatusPill } from '../kit/fmt'
import { diffDays } from '../kit/dates'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'
import type { Tone } from '../ui'
import { DOMAINS, rasOf } from './risk.ras'

interface Risk extends BaseRec {
  konteks: string; event: string; domain: string; dampak: number | ''; kemungkinan: number | ''
  respon: string; kontrol: string; dept: string; tglRegister: string; produk: string; vendor: string
  levelAt: string // tanggal level inherent terakhir naik / register (pengganti pembacaan Log, lihat usulan kit)
}
const RESPON = ['Avoid', 'Control', 'Transfer', 'Accept']
const SKOR3 = ['1', '2', '3']
const LEVELS = ['High', 'Medium', 'Low']
const LV_TONE: Record<string, Tone> = { High: 'red', Medium: 'yellow', Low: 'green' }
const RANK: Record<string, number> = { Low: 1, Medium: 2, High: 3 }

const skor = (r: Risk) => (r.dampak !== '' && r.kemungkinan !== '' ? Number(r.dampak) * Number(r.kemungkinan) : 0)
const levelOf = (s: number) => (!s ? '' : s <= 2 ? 'Low' : s <= 4 ? 'Medium' : 'High')
const level = (r: Risk) => levelOf(skor(r))
// RAS-RT otomatis dari Level Inherent (sheet "3. RAS-RT Sederhana"): Low = Risk Appetite, Medium = Risk Tolerance, High = Breach.
const APPETITE = 'Dalam Appetite'
const TOLERANSI = 'Dalam Toleransi'
const BREACH = 'Breach (wajib eskalasi)'
const POS: Record<string, string> = { Low: APPETITE, Medium: TOLERANSI, High: BREACH }
export const rasrt = (r: Risk): string => POS[level(r)] ?? ''
const RAS_TONE: Record<string, Tone> = { [APPETITE]: 'green', [TOLERANSI]: 'yellow', [BREACH]: 'red' }
const AXIS: Record<number, string> = { 3: 'Tinggi', 2: 'Sedang', 1: 'Rendah' }

const fields: Field<Risk>[] = [
  { key: 'konteks', label: 'Konteks (Proses / Aktivitas)', type: 'text', required: true },
  { key: 'event', label: 'Risk Event', type: 'textarea', required: true, wide: true },
  { key: 'domain', label: 'Domain Risiko', type: 'select', options: DOMAINS, required: true },
  { key: 'dampak', label: 'Skor Dampak (1 Rendah, 2 Sedang, 3 Tinggi)', type: 'select', options: SKOR3, required: true },
  { key: 'kemungkinan', label: 'Skor Kemungkinan (1-3)', type: 'select', options: SKOR3, required: true },
  { key: 'skor', label: 'Skor Total', type: 'number', auto: (r) => skor(r) || '' },
  { key: 'level', label: 'Level Risiko Awal (Inherent)', type: 'text', auto: (r) => level(r) },
  { key: 'respon', label: 'Respon', type: 'select', options: RESPON, required: true },
  { key: 'kontrol', label: 'Kontrol / Mitigasi', type: 'textarea', required: true, wide: true },
  { key: 'dept', label: 'Unit Pemilik Risiko (Unit Kerja)', type: 'select', options: (c) => c.master.unitKerja, required: true },
  { key: 'tglRegister', label: 'Tanggal Register', type: 'date', required: true },
  { key: 'produk', label: 'Produk', type: 'select', options: (c) => c.master.produk },
  { key: 'vendor', label: 'Vendor / Mitra', type: 'select', options: (c) => c.master.mitra },
  { key: 'rasrt', label: 'Posisi RAS-RT (otomatis dari Level Inherent)', type: 'text', auto: (r) => rasrt(r) },
  // Rujukan baca-saja dari tabel RAS-RT domain terpilih (tidak diekspor)
  { key: 'rasAppetite', label: 'Risk Appetite (Low - target ideal)', type: 'textarea', wide: true, noExport: true, auto: (r) => rasOf(r.domain)?.appetite ?? '' },
  { key: 'rasTolerance', label: 'Risk Tolerance (Medium - batas maksimum diterima)', type: 'textarea', wide: true, noExport: true, auto: (r) => rasOf(r.domain)?.tolerance ?? '' },
  { key: 'rasBreach', label: 'Breach (High - wajib eskalasi)', type: 'textarea', wide: true, noExport: true, auto: (r) => rasOf(r.domain)?.breach ?? '' },
]
const columns: Column<Risk>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Risk Event', get: (r) => r.event },
  { label: 'Domain', get: (r) => r.domain },
  { label: 'D', get: (r) => r.dampak },
  { label: 'K', get: (r) => r.kemungkinan },
  { label: 'Skor', get: (r) => skor(r) },
  { label: 'Level', get: (r) => level(r), render: (r) => <StatusPill s={level(r)} tone={LV_TONE[level(r)]} /> },
  { label: 'Posisi RAS-RT', get: (r) => rasrt(r), render: (r) => <StatusPill s={rasrt(r)} tone={RAS_TONE[rasrt(r)]} /> },
  { label: 'Unit Kerja', get: (r) => r.dept },
  { label: 'Respon', get: (r) => r.respon },
]
const uniq = (rows: Risk[], g: (r: Risk) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Risk>[] = [
  { key: 'periode', label: 'Periode Register', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglRegister >= a) && (!b || r.tglRegister <= b) } },
  { key: 'domain', label: 'Domain', type: 'select', options: DOMAINS, match: (r, v) => r.domain === v },
  { key: 'level', label: 'Level', type: 'select', options: LEVELS, match: (r, v) => level(r) === v },
  { key: 'dept', label: 'Unit Kerja', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.dept === v },
  { key: 'respon', label: 'Respon', type: 'select', options: RESPON, match: (r, v) => r.respon === v },
  { key: 'produk', label: 'Produk', type: 'select', options: (_, c) => c.master.produk, match: (r, v) => r.produk === v },
  { key: 'vendor', label: 'Vendor / Mitra', type: 'select', options: (rows) => uniq(rows, (r) => r.vendor), match: (r, v) => r.vendor === v },
  { key: 'rasrt', label: 'Posisi RAS-RT', type: 'select', options: [APPETITE, TOLERANSI, BREACH], match: (r, v) => rasrt(r) === v },
]

const mk = (c: Ctx, o: Partial<Risk>): Risk => ({ id: 'sample', no: 99, status: 'Aktif', createdAt: c.today, createdBy: '-', konteks: 'Settlement merchant', event: 'Settlement ke merchant terlambat', domain: 'Operasional', dampak: 3, kemungkinan: 3, respon: 'Control', kontrol: 'Rekonsiliasi harian', dept: 'Operation', tglRegister: addDays(c.today, -2), produk: 'QRIS', vendor: '', levelAt: addDays(c.today, -2), ...o })
const alerts: AlertDef<Risk>[] = [
  {
    key: 'high', label: 'Risiko High baru / naik ke High', rule: 'Level inherent High dan register atau kenaikan level terjadi dalam 7 hari terakhir.',
    check: (r, c) => (level(r) === 'High' && r.levelAt && diffDays(c.today, r.levelAt) <= 7 ? { color: 'red', detail: `High sejak ${fmtDate(r.levelAt)} (skor ${skor(r)})`, to: ['Risk Officer', 'Head CLRM', `Risk Owner (${r.dept})`] } : null),
    sample: (c) => mk(c, {}),
  },
  {
    key: 'rasrt', label: 'Breach / Dalam Toleransi (RAS-RT)', rule: 'Posisi RAS-RT Breach (merah, level inherent High, wajib eskalasi) atau Dalam Toleransi (kuning, level inherent Medium).',
    check: (r) => { const p = rasrt(r); return p === BREACH ? { color: 'red', detail: 'Breach RAS-RT, wajib eskalasi', to: ['Head CLRM', 'Direksi'] } : p === TOLERANSI ? { color: 'yellow', detail: 'Dalam Toleransi RAS-RT', to: ['Head CLRM', 'Direksi'] } : null },
    sample: (c) => mk(c, { domain: 'Ketahanan dan Keamanan Siber', dampak: 2, kemungkinan: 3, event: 'Akses tidak sah ke sistem pembayaran' }),
  },
]

function seed(today: string): Risk[] {
  const EV = ['Gangguan sistem pembayaran', 'Dana settlement kurang likuid', 'Salah pencatatan biaya', 'Gagal bayar mitra', 'Pelanggaran ketentuan regulator', 'Sengketa kontrak vendor', 'Target produk tidak tercapai', 'Keluhan merchant meluas', 'Data konsumen tidak terlindungi', 'Serangan siber ke API']
  const KON = ['Settlement merchant', 'Onboarding merchant', 'Rekonsiliasi harian', 'Pengelolaan vendor', 'Pelaporan regulator', 'Layanan pelanggan', 'Pengembangan produk', 'Manajemen akses']
  const DEPT = ['Information Technology', 'Business', 'Operation', 'Finance, Accounting, Tax & Treasury', 'Compliance Legal & Risk Management', 'Support']
  const PRD = ['UE', 'QRIS', 'Biller', '']
  const VEN = ['PT Mitra Bayar', 'PT Jaringan Nusa', '', 'PT Data Aman', '']
  // [dampak, kemungkinan, jumlah]: semua 9 sel heatmap terisi
  const cells: [number, number, number][] = [[1, 1, 3], [1, 2, 3], [1, 3, 4], [2, 1, 3], [2, 2, 5], [2, 3, 4], [3, 1, 4], [3, 2, 4], [3, 3, 5]]
  const out: Risk[] = []
  let i = 0
  for (const [d, k, n] of cells) {
    for (let j = 0; j < n; j++, i++) {
      const hi = d * k >= 6
      const ago = hi && i % 3 === 0 ? 1 + (i % 6) : 12 + ((i * 7) % 80)
      const tgl = addDays(today, -ago)
      out.push({
        id: `risk-${i + 1}`, no: i + 1, status: 'Aktif', createdAt: tgl, createdBy: 'Rudi Hartono',
        konteks: KON[i % 8], event: EV[(i + j) % 10], domain: DOMAINS[(i + j) % 10], dampak: d, kemungkinan: k,
        respon: RESPON[i % 4], kontrol: `Kontrol berkala dan review ${DEPT[i % 6]}`, dept: DEPT[(i * 5) % 6], tglRegister: tgl,
        produk: PRD[i % 4], vendor: VEN[i % 5], levelAt: tgl,
      })
    }
  }
  return out
}

const CELL_BG: Record<string, string> = { High: 'bg-red-100 border-red-300 text-red-800', Medium: 'bg-yellow-100 border-yellow-300 text-yellow-800', Low: 'bg-green-100 border-green-300 text-green-800' }

function Heatmap({ rows, open }: { rows: Risk[]; open: (id: string) => void }) {
  const [sel, setSel] = useState<[number, number] | null>(null)
  const list = sel ? rows.filter((r) => r.dampak === sel[0] && r.kemungkinan === sel[1]) : []
  return (
    <Card title="Heatmap risiko (Dampak x Kemungkinan)">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <button className="rounded border border-blue-600 bg-blue-600 px-2.5 py-1 text-white">Awal (inherent)</button>
        <button disabled title="belum dipakai" className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-400">Setelah kontrol (residual)</button>
        <span className="text-slate-400">Setelah kontrol: belum dipakai</span>
      </div>
      <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1.5">
        {[3, 2, 1].map((k) => [
          <div key={`l${k}`} className="flex items-center pr-2 text-xs text-slate-500">Kemungkinan {AXIS[k]}</div>,
          ...[1, 2, 3].map((d) => {
            const n = rows.filter((r) => r.dampak === d && r.kemungkinan === k).length
            const lv = levelOf(d * k)
            const on = sel?.[0] === d && sel?.[1] === k
            return (
              <button key={`${d}${k}`} onClick={() => setSel([d, k])} className={`rounded border p-3 text-left ${CELL_BG[lv]} ${on ? 'ring-2 ring-blue-600' : ''}`}>
                <div className="text-sm font-semibold">{lv} (Skor {d * k})</div>
                <div className="text-xs">Jumlah risiko: {n}</div>
              </button>
            )
          }),
        ])}
        <div />
        {[1, 2, 3].map((d) => <div key={d} className="text-center text-xs text-slate-500">Dampak {AXIS[d]}</div>)}
      </div>
      {sel && (
        <MiniTable className="mt-3" title={`Risiko: Dampak ${AXIS[sel[0]]}, Kemungkinan ${AXIS[sel[1]]} (${list.length})`} rows={list} onRow={(r) => open(r.id)}
          cols={[{ label: 'No', get: (r) => r.no }, { label: 'Risk Event', get: (r) => r.event }, { label: 'Domain', get: (r) => r.domain }, { label: 'Unit Kerja', get: (r) => r.dept }]} />
      )}
      {!sel && <div className="mt-3 text-xs text-slate-400">Klik kotak untuk melihat daftar risiko.</div>}
    </Card>
  )
}

const cfg: PageConfig<Risk> = {
  module: 'risk', title: 'Risk Register', noun: 'Risiko', exportPrefix: 'Risk_Register',
  name: (r) => r.event,
  seed, fields, columns, filters, alerts, cancelStatus: 'Dibatalkan',
  blank: () => ({ konteks: '', event: '', domain: '', dampak: '', kemungkinan: '', respon: '', kontrol: '', dept: '', tglRegister: '', produk: '', vendor: '', levelAt: '', status: 'Aktif' }),
  search: (r) => `${r.no} ${r.event} ${r.kontrol}`, searchPlaceholder: 'Cari nomor, risk event, kontrol',
  canEditRow: (r, c) => c.role !== 'PIC' || r.dept === c.user.departemen, // PIC hanya risiko unit kerjanya
  normalize: (r) => ({ ...r, dampak: r.dampak === '' ? '' : Number(r.dampak), kemungkinan: r.kemungkinan === '' ? '' : Number(r.kemungkinan) }),
  beforeSave: (old, next, c) => (!old || RANK[level(next)] > (RANK[level(old)] ?? 0) ? { ...next, levelAt: c.today } : next),
  approvals: [{
    jenis: 'Perubahan Level Risiko', approver: 'Risk Officer', keys: ['dampak', 'kemungkinan'],
    needs: (old, next, c) => c.role !== 'Risk Officer' && level(old) !== level(next),
  }],
  Dashboard: ({ rows, open, drill }) => {
    const cnt = (lv: string) => rows.filter((r) => level(r) === lv).length
    const over = rows.filter((r) => rasrt(r) === BREACH).length
    const depts = [...new Set(rows.map((r) => r.dept))]
    return (
      <div className="space-y-3">
        <StatCards items={[
          { label: 'High', value: cnt('High'), tone: 'red', onClick: () => drill({ level: 'High' }) },
          { label: 'Medium', value: cnt('Medium'), tone: 'yellow', onClick: () => drill({ level: 'Medium' }) },
          { label: 'Low', value: cnt('Low'), tone: 'green', onClick: () => drill({ level: 'Low' }) },
          { label: 'Breach (RAS-RT)', value: over, tone: over ? 'red' : 'gray', onClick: () => drill({ rasrt: BREACH }) },
        ]} />
        <Heatmap rows={rows} open={open} />
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Risiko per domain menurut level" stacked data={DOMAINS.map((d) => ({ name: d, High: rows.filter((r) => r.domain === d && level(r) === 'High').length, Medium: rows.filter((r) => r.domain === d && level(r) === 'Medium').length, Low: rows.filter((r) => r.domain === d && level(r) === 'Low').length }))} keys={LEVELS} colors={{ High: TONE_HEX.red, Medium: TONE_HEX.yellow, Low: TONE_HEX.green }} onClick={(row) => drill({ domain: row.name })} />
          <BarCard title="Risiko per unit kerja pemilik" horizontal data={depts.map((d) => ({ name: d, Jumlah: rows.filter((r) => r.dept === d).length, ...Object.fromEntries(LEVELS.map((l) => [l, rows.filter((r) => r.dept === d && level(r) === l).length])) })).sort((a, b) => b.Jumlah - a.Jumlah)} keys={['Jumlah']}
            tip={(d) => <><div className="mb-1 font-semibold text-slate-800">{String(d.name)}: {d.Jumlah}</div>{LEVELS.map((l) => <div key={l}>{l}: {d[l]}</div>)}</>} onClick={(row) => drill({ dept: row.name })} />
          <BarCard title="Dalam Toleransi dan Breach (RAS-RT) per domain" stacked className="lg:col-span-2" data={DOMAINS.map((d) => ({ name: d, 'Dalam Toleransi': rows.filter((r) => r.domain === d && rasrt(r) === TOLERANSI).length, Breach: rows.filter((r) => r.domain === d && rasrt(r) === BREACH).length }))} keys={['Dalam Toleransi', 'Breach']} colors={{ 'Dalam Toleransi': TONE_HEX.yellow, Breach: TONE_HEX.red }} />
        </div>
      </div>
    )
  },
}
export default function RiskRegister() { return <PageShell config={cfg} /> }
