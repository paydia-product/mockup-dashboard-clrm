import { ReactNode, useEffect, useMemo, useState } from 'react'
import { fmtTime } from '../lib'
import { LAINNYA } from './Lainnya'
import Reveal from './Reveal'
import type { BaseRec, Ctx, PageConfig } from './types'

// Tabel menampilkan "Lainnya" untuk teks bebas dari field pilihan ber-"Lainnya"; Detail dan Export tetap memakai teks aslinya.
const lain = (v: string | number, custom: Set<string>) => {
  if (typeof v !== 'string' || !custom.size) return v
  if (custom.has(v)) return LAINNYA
  return v.includes(', ') ? [...new Set(v.split(', ').map((x) => (custom.has(x) ? LAINNYA : x)))].join(', ') : v
}

// Tabel utama: tanpa sort kolom. Urutan tetap Tanggal Dibuat terbaru dulu; "Nomor" = posisi baris (1..n, lanjut antar halaman).
// Kolom 'No' bawaan konfigurasi (nomor internal) tidak ditampilkan; no tetap dipakai untuk log/approval.
export default function DataTable<T extends BaseRec>({ cfg, rows, c: c0, actions, resetKey }: { cfg: PageConfig<T>; rows: T[]; c: Ctx; actions: (r: T) => ReactNode; resetKey?: string }) {
  const [rev, setRev] = useState<Record<string, boolean>>({}) // tombol mata di header kolom (hanya kolom revealKey yang boleh dibuka peran ini)
  const c: Ctx = { ...c0, reveal: rev }
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  useEffect(() => setPage(1), [resetKey]) // cari/filter berubah: kembali ke halaman 1, nomor mulai dari 1
  const sorted = useMemo(() => [...rows].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.no - a.no), [rows])
  const cols = cfg.columns.filter((col) => col.label !== 'No')
  const lainFields = cfg.fields.filter((f) => f.type === 'select' || f.type === 'multiselect').map((f) => ({ key: f.key, o: typeof f.options === 'function' ? f.options(c) : f.options ?? [] })).filter((x) => x.o.includes(LAINNYA))
  const customOf = (r: T) => { const s = new Set<string>(); for (const { key, o } of lainFields) for (const x of [(r as Record<string, unknown>)[key]].flat()) if (typeof x === 'string' && x && !o.includes(x)) s.add(x); return s }
  const pages = Math.max(1, Math.ceil(sorted.length / size))
  const cur = Math.min(page, pages)
  const slice = sorted.slice((cur - 1) * size, cur * size)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Nomor</th>
              {cols.map((col) => { const f = col.revealKey ? cfg.fields.find((x) => x.key === col.revealKey) : undefined; return <th key={col.label} className="whitespace-nowrap px-3 py-2.5 font-semibold">{col.label}{f && !f.mask?.(c) && f.reveal?.(c) && <Reveal on={!!rev[f.key]} toggle={() => setRev((p) => ({ ...p, [f.key]: !p[f.key] }))} label={col.label} />}</th> })}
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Tanggal Dibuat</th>
              <th className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => {
              const cu = customOf(r)
              return (
              <tr key={r.id} className={`border-t align-top hover:bg-slate-50 ${r.cancelled ? 'text-slate-400' : ''}`}>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium">{(cur - 1) * size + i + 1}</td>
                {cols.map((col) => <td key={col.label} className="px-3 py-2.5">{col.render ? col.render(r, c) : lain(col.get(r, c), cu)}</td>)}
                <td className="whitespace-nowrap px-3 py-2.5">{fmtTime(r.createdAt)}</td>
                <td className="px-3 py-2.5"><div className="flex gap-1">{actions(r)}</div></td>
              </tr>
              )
            })}
            {!slice.length && <tr><td colSpan={cols.length + 3} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-xs">
        <label className="flex items-center gap-2">Baris per halaman
          <select className="inp !w-auto" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1) }}>{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select></label>
        <div className="flex items-center gap-3">
          <span>{sorted.length ? (cur - 1) * size + 1 : 0} sampai {Math.min(cur * size, sorted.length)} dari {sorted.length} data</span>
          <div className="flex gap-1">
            <button className="btn !px-2 !py-1" disabled={cur === 1} onClick={() => setPage(cur - 1)}>&lt;</button>
            {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, cur - 4), Math.max(0, cur - 4) + 7).map((n) => (
              <button key={n} className={`btn !px-2.5 !py-1 ${n === cur ? '!border-brand !bg-brand !text-white' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="btn !px-2 !py-1" disabled={cur === pages} onClick={() => setPage(cur + 1)}>&gt;</button>
          </div>
        </div>
      </div>
    </>
  )
}
