// STUB: ganti dengan config penuh sesuai docs/plan-halaman.md (bagian C3). Tipe dan seed ada di sop.shared.ts.
import PageShell from '../kit/PageShell'
import type { PageConfig } from '../kit/types'
import { SopRec, seedSop } from './sop.shared'

const cfg: PageConfig<SopRec> = {
  module: 'sop', title: 'SOP & Dokumen Kontrol', noun: 'SOP', exportPrefix: 'Daftar_SOP',
  seed: seedSop,
  blank: () => ({ noDok: '', judul: '', ringkasan: '', pemilik: '', tglBerlaku: '', tglUbah: '', noRevisi: '', retensi: '', klasifikasi: '', file: null, tglReview: '', pic: '', revisi: [], status: 'Aktif' }),
  fields: [{ key: 'noDok', label: 'No Dokumen', type: 'text', required: true }, { key: 'judul', label: 'Judul', type: 'text', required: true }],
  columns: [{ label: 'No Dokumen', get: (r) => r.noDok }, { label: 'Judul', get: (r) => r.judul }, { label: 'Status', get: (r) => r.status }],
  filters: [{ key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Dalam Review', 'Dicabut'], match: (r, v) => r.status === v }],
  search: (r) => `${r.noDok} ${r.judul} ${r.ringkasan}`, searchPlaceholder: 'Cari no dokumen, judul, ringkasan',
  alerts: [],
  Dashboard: () => <div className="rounded-lg border border-slate-200 bg-white p-16 text-center text-slate-400">Segera hadir</div>,
}
export default function Sop() { return <PageShell config={cfg} /> }
