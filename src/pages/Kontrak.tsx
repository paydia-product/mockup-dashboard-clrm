// STUB: ganti dengan config penuh sesuai docs/plan-halaman.md (bagian C). Default export tetap `() => <PageShell config={cfg} />`.
import PageShell from '../kit/PageShell'
import type { BaseRec, PageConfig } from '../kit/types'

interface Rec extends BaseRec { nama: string }

const cfg: PageConfig<Rec> = {
  module: 'kontrak', title: 'Kontrak', noun: 'Kontrak', exportPrefix: 'Kontrak',
  seed: (today) => ['Contoh A', 'Contoh B', 'Contoh C'].map((nama, i) => ({ id: 'kontrak-' + (i + 1), no: i + 1, status: 'Aktif', createdAt: today, createdBy: 'Seed', nama })),
  blank: () => ({ nama: '', status: 'Aktif' }),
  fields: [{ key: 'nama', label: 'Nama', type: 'text', required: true }, { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Selesai'], required: true }],
  columns: [{ label: 'No', get: (r) => r.no }, { label: 'Nama', get: (r) => r.nama }, { label: 'Status', get: (r) => r.status }],
  filters: [{ key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Selesai', 'Dibatalkan'], match: (r, v) => r.status === v }],
  search: (r) => `${r.no} ${r.nama}`, searchPlaceholder: 'Cari nomor, nama',
  alerts: [],
  Dashboard: () => <div className="rounded-lg border border-slate-200 bg-white p-16 text-center text-slate-400">Segera hadir</div>,
}
export default function Kontrak() { return <PageShell config={cfg} /> }
