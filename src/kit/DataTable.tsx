import { ReactNode, useMemo, useState } from 'react'
import type { BaseRec, Ctx, PageConfig } from './types'

export default function DataTable<T extends BaseRec>({ cfg, rows, c, actions }: { cfg: PageConfig<T>; rows: T[]; c: Ctx; actions: (r: T) => ReactNode }) {
  const [sort, setSort] = useState<{ i: number; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const sorted = useMemo(() => {
    const out = [...rows]
    if (!sort) return out.sort((a, b) => b.no - a.no)
    const g = cfg.columns[sort.i].get
    return out.sort((a, b) => {
      const x = g(a, c), y = g(b, c)
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'id', { numeric: true })) * sort.dir
    })
  }, [rows, sort]) // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(sorted.length / size))
  const cur = Math.min(page, pages)
  const slice = sorted.slice((cur - 1) * size, cur * size)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              {cfg.columns.map((col, i) => (
                <th key={col.label} className="cursor-pointer whitespace-nowrap px-3 py-2.5 font-semibold" onClick={() => setSort({ i, dir: sort?.i === i ? (-sort.dir as 1 | -1) : 1 })}>
                  {col.label}{sort?.i === i ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} className={`border-t align-top hover:bg-slate-50 ${r.cancelled ? 'text-slate-400' : ''}`}>
                {cfg.columns.map((col) => <td key={col.label} className="px-3 py-2.5">{col.render ? col.render(r, c) : col.get(r, c)}</td>)}
                <td className="px-3 py-2.5"><div className="flex gap-1">{actions(r)}</div></td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={cfg.columns.length + 1} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
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
