import { useState } from 'react'

export function usePaged<T>(list: T[]) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const pages = Math.max(1, Math.ceil(list.length / size))
  const cur = Math.min(page, pages)
  return { slice: list.slice((cur - 1) * size, cur * size), pager: <Pager total={list.length} cur={cur} pages={pages} size={size} setPage={setPage} setSize={(n) => { setSize(n); setPage(1) }} />, reset: () => setPage(1) }
}
function Pager({ total, cur, pages, size, setPage, setSize }: { total: number; cur: number; pages: number; size: number; setPage: (n: number) => void; setSize: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-xs">
      <label className="flex items-center gap-2">Baris per halaman
        <select className="inp !w-auto" value={size} onChange={(e) => setSize(Number(e.target.value))}>{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select></label>
      <div className="flex items-center gap-3">
        <span>{total ? (cur - 1) * size + 1 : 0} sampai {Math.min(cur * size, total)} dari {total} data</span>
        <div className="flex gap-1">
          <button className="btn !px-2 !py-1" disabled={cur === 1} onClick={() => setPage(cur - 1)}>&lt;</button>
          {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, cur - 4), Math.max(0, cur - 4) + 7).map((n) => (
            <button key={n} className={`btn !px-2.5 !py-1 ${n === cur ? '!border-brand !bg-brand !text-white' : ''}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="btn !px-2 !py-1" disabled={cur === pages} onClick={() => setPage(cur + 1)}>&gt;</button>
        </div>
      </div>
    </div>
  )
}
