import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { DB, findingLabel, fmtTime, todayStr } from '../lib'
import { downloadXlsx } from '../kit/exportXlsx'
import { useApp } from '../kit/store'
import type { LogEntry } from '../kit/types'
import { usePaged } from './Pager'

const TRACKER = 'Regulatory Findings Tracker'
export function useAllLogs(tdb: DB): LogEntry[] {
  const { store } = useApp()
  return useMemo(() => {
    const role = (n: string) => store.accounts.find((a) => a.name === n)?.role ?? 'PIC'
    const no = new Map(tdb.findings.map((f) => [f.id, findingLabel(f)]))
    const t: LogEntry[] = tdb.audit.map((a) => ({ id: a.id, time: a.time, user: a.user, role: role(a.user), module: TRACKER, aksi: a.aksi, nomor: no.get(a.fid) ?? '', keterangan: `${a.kolom ? `${a.kolom}: ${a.lama || '-'} -> ${a.baru || '-'}` : ''}${a.alasan ? `. Alasan: ${a.alasan}` : ''}` }))
    return [...store.log, ...t].sort((a, b) => b.time.localeCompare(a.time))
  }, [store.log, store.accounts, tdb.audit, tdb.findings])
}

export default function Log({ tdb }: { tdb: DB }) {
  const { can, log } = useApp()
  const all = useAllLogs(tdb)
  const [f, setF] = useState({ from: '', to: '', user: '', module: '', aksi: '' })
  const uniq = (k: 'user' | 'module' | 'aksi') => [...new Set(all.map((x) => x[k]))].sort()
  const list = all.filter((x) => (!f.from || x.time.slice(0, 10) >= f.from) && (!f.to || x.time.slice(0, 10) <= f.to) && (!f.user || x.user === f.user) && (!f.module || x.module === f.module) && (!f.aksi || x.aksi === f.aksi))
  const { slice, pager, reset } = usePaged(list)
  const upd = (p: Partial<typeof f>) => { setF({ ...f, ...p }); reset() }
  const sel = (k: 'user' | 'module' | 'aksi', ph: string) => <select className="inp !w-auto" value={f[k]} onChange={(e) => upd({ [k]: e.target.value })}><option value="">{ph}</option>{uniq(k).map((o) => <option key={o}>{o}</option>)}</select>
  const exp = () => {
    downloadXlsx(`Log_Aktivitas_${todayStr()}.xlsx`, 'Log', list.map((x) => ({ Waktu: fmtTime(x.time), User: x.user, Peran: x.role, Modul: x.module, Aksi: x.aksi, Data: x.nomor, Keterangan: x.keterangan })))
    log('Log', 'Export', '', `${list.length} baris`)
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <input type="date" className="inp !w-auto" aria-label="Dari" value={f.from} onChange={(e) => upd({ from: e.target.value })} /><span>-</span>
        <input type="date" className="inp !w-auto" aria-label="Sampai" value={f.to} onChange={(e) => upd({ to: e.target.value })} />
        {sel('user', 'Semua user')}{sel('module', 'Semua modul')}{sel('aksi', 'Semua aksi')}
        <button className="btn" onClick={() => { setF({ from: '', to: '', user: '', module: '', aksi: '' }); reset() }}>Clear All</button>
        {can('log', 'Export') && <button className="btn ml-auto" onClick={exp}><Download size={14} />Export Excel</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs text-slate-600"><tr>{['Waktu', 'User', 'Peran', 'Modul', 'Aksi', 'Data', 'Keterangan'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {slice.map((x) => (
              <tr key={x.id} className="border-t align-top">
                <td className="whitespace-nowrap px-3 py-2">{fmtTime(x.time)}</td><td className="whitespace-nowrap px-3 py-2">{x.user}</td><td className="whitespace-nowrap px-3 py-2">{x.role}</td>
                <td className="px-3 py-2">{x.module}</td><td className="whitespace-nowrap px-3 py-2">{x.aksi}</td><td className="px-3 py-2">{x.nomor || '-'}</td><td className="px-3 py-2">{x.keterangan || '-'}</td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
    </div>
  )
}
