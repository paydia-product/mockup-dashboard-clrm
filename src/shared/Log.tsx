import { useMemo, useState } from 'react'
import { FileSpreadsheet, Filter } from 'lucide-react'
import { DB, findingLabel, fmtTimeSec, todayStr } from '../lib'
import { downloadXlsx } from '../kit/exportXlsx'
import { useApp } from '../kit/store'
import type { ActivityLog } from '../kit/types'
import { usePaged } from './Pager'
import PageGuide from '../kit/PageGuide'
import { LOG_GUIDE } from '../guides/shared'

const TRACKER = 'Regulatory Findings Tracker'
// Modul (judul menu) -> container. Entri live memakai judul modul; seed memakai container langsung.
const CONTAINER: Record<string, string> = {
  [TRACKER]: 'regulatory-findings-tracker', 'Regulatory Reporting': 'regulatory-reporting', 'Regulatory Change': 'regulatory-change', 'SOP & Dokumen Kontrol': 'sop-dokumen-kontrol',
  'Risk Register': 'risk-register', 'Kajian Risiko': 'kajian-risiko', 'Fraud Case Monitoring': 'fraud-case-monitoring', Kontrak: 'kontrak', 'Permintaan APH': 'permintaan-aph',
  'Perizinan & Dokumen Legalitas': 'perizinan', 'Permintaan Layanan Hukum': 'layanan-hukum', 'Master Data': 'master-data', Admin: 'admin', Log: 'log', Sesi: 'clrm-auth', Profil: 'clrm-auth',
}
// Aksi live (Indonesia) -> type (urutan penting: pola pertama yang cocok)
const TYPES: [RegExp, string][] = [
  [/^tambah akun/i, 'admin-create'], [/^ubah (status )?akun/i, 'admin-update'], [/^ubah permission/i, 'permission-update'], [/^ganti akun/i, 'switch-account'],
  [/^ganti password/i, 'password-change'], [/^ganti pin/i, 'pin-change'], [/^logout/i, 'logout'], [/^ajukan/i, 'submit-approval'], [/^approve|^persetujuan|^setujui/i, 'approve'], [/^reject|^tolak/i, 'reject'],
  [/^export/i, 'export'], [/^import/i, 'import'], [/^batalkan|^cancel/i, 'cancel'], [/^kembalikan/i, 'restore'], [/^validasi/i, 'validate'], [/^hapus/i, 'delete'], [/^tambah/i, 'create'], [/^ubah/i, 'update'],
]
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const ipOf = (key: string) => { let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `182.253.${(h % 200) + 20}.${((h >>> 8) % 230) + 10}` } // IP demo tetap per pengguna untuk entri live
const dmy = (t: string) => fmtTimeSec(t).replace(/\//g, '-') // DD-MM-YYYY HH:mm:ss

// Entri live (store.log dan audit Tracker) dipetakan ke bentuk tabel: Container, Type, Detail (baris kunci: nilai), IP
export function useAllLogs(tdb: DB): ActivityLog[] {
  const { store } = useApp()
  return useMemo(() => {
    const acct = (n: string) => store.accounts.find((a) => a.name === n)
    const kv = (user: string, nomor: string, ket: string) => {
      const a = acct(user)
      return [`email: ${a?.email ?? user}`, `user_type: ${a?.role ?? '-'}`, nomor && `data: ${nomor}`, ...ket.replace(/^(\d+) baris$/, 'Jumlah baris: $1').split(/;\s|\.\s(?=Alasan|Catatan)/).filter(Boolean)].filter(Boolean).join('\n')
    }
    const typeOf = (aksi: string, module: string) => (module === 'Master Data' ? `master-${aksi.toLowerCase() === 'tambah' ? 'create' : aksi.toLowerCase() === 'ubah' ? 'update' : 'delete'}` : TYPES.find(([r]) => r.test(aksi))?.[1] ?? slug(aksi))
    const live: ActivityLog[] = store.log.map((l) => {
      const type = typeOf(l.aksi, l.module)
      return { id: l.id, time: l.time, container: type === 'approve' || type === 'reject' ? 'approval' : CONTAINER[l.module] ?? slug(l.module), type, detail: kv(l.user, l.nomor, l.keterangan), ip: ipOf(acct(l.user)?.email ?? l.user) }
    })
    const no = new Map(tdb.findings.map((f) => [f.id, findingLabel(f)]))
    const t: ActivityLog[] = tdb.audit.map((a) => ({
      id: a.id, time: a.time, container: CONTAINER[TRACKER], type: typeOf(a.aksi, TRACKER), ip: ipOf(acct(a.user)?.email ?? a.user),
      detail: kv(a.user, no.get(a.fid) ?? '', `${a.kolom ? `${a.kolom}: ${a.lama || '-'} -> ${a.baru || '-'}` : ''}${a.alasan ? `. Alasan: ${a.alasan}` : ''}`),
    }))
    return [...live, ...t, ...store.activity].sort((a, b) => b.time.localeCompare(a.time))
  }, [store.log, store.activity, store.accounts, tdb.audit, tdb.findings])
}

const EMPTY = { container: '', type: '', from: '', to: '', detail: '', ip: '' }
export default function Log({ tdb }: { tdb: DB }) {
  const { can, log } = useApp()
  const all = useAllLogs(tdb)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY)
  const [f, setF] = useState(EMPTY) // filter yang sudah diterapkan
  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase())
  const list = all.filter((x) => has(x.container, f.container) && has(x.type, f.type) && (!f.from || x.time.slice(0, 10) >= f.from) && (!f.to || x.time.slice(0, 10) <= f.to) && has(x.detail, f.detail) && has(x.ip, f.ip))
  const { slice, pager, reset } = usePaged(list)
  const uniq = (k: 'container' | 'type') => [...new Set(all.map((x) => x[k]))].sort()
  const set = (p: Partial<typeof EMPTY>) => setDraft({ ...draft, ...p })
  const exp = () => {
    downloadXlsx(`Log_Aktivitas_${todayStr()}.xlsx`, 'Log', list.map((x) => ({ Tanggal: dmy(x.time), Container: x.container, Type: x.type, Detail: x.detail, IP: x.ip })))
    log('Log', 'Export', '', `${list.length} baris`)
  }
  const col = 'min-w-0 border-l border-slate-100 px-4 first:border-l-0 first:pl-0'
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <PageGuide name="Log" items={LOG_GUIDE} />
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button className="btn btn-primary" onClick={() => setOpen(!open)}><Filter size={14} />Filter</button>
        {can('log', 'Export') && <button className="btn !border-green-700 !bg-green-700 !text-white hover:!bg-green-800" onClick={exp}><FileSpreadsheet size={14} />Export</button>}
      </div>
      {open && (
        <div className="border-y bg-white px-3 pb-4 pt-3">
          <div className="mb-4 flex gap-2">
            <button className="btn !rounded-full !px-4 !py-2" onClick={() => { setDraft(EMPTY); setF(EMPTY); reset() }}>Clear All</button>
            <button className="btn btn-primary !rounded-full !px-4 !py-2" onClick={() => { setF(draft); reset() }}>Apply Filters</button>
          </div>
          <div className="grid gap-4 md:grid-cols-[2fr_2fr_2.2fr_1.6fr_1.6fr] md:gap-0">
            <div className={col}><label className="lbl !text-sm !font-semibold">Container</label><input className="inp" list="log-containers" placeholder="Cari dan pilih container" value={draft.container} onChange={(e) => set({ container: e.target.value })} /><datalist id="log-containers">{uniq('container').map((o) => <option key={o} value={o} />)}</datalist></div>
            <div className={col}><label className="lbl !text-sm !font-semibold">Type</label><input className="inp" list="log-types" placeholder="Cari dan pilih tipe" value={draft.type} onChange={(e) => set({ type: e.target.value })} /><datalist id="log-types">{uniq('type').map((o) => <option key={o} value={o} />)}</datalist></div>
            <div className={col}><label className="lbl !text-sm !font-semibold">Tanggal</label><div className="flex items-center gap-1.5"><input type="date" className="inp" aria-label="Start date" value={draft.from} onChange={(e) => set({ from: e.target.value })} /><span className="text-slate-400">&rarr;</span><input type="date" className="inp" aria-label="End date" value={draft.to} onChange={(e) => set({ to: e.target.value })} /></div></div>
            <div className={col}><label className="lbl !text-sm !font-semibold">Detail</label><input className="inp" placeholder="detail" value={draft.detail} onChange={(e) => set({ detail: e.target.value })} /></div>
            <div className={col}><label className="lbl !text-sm !font-semibold">IP</label><input className="inp" placeholder="ip address" value={draft.ip} onChange={(e) => set({ ip: e.target.value })} /></div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[13px] text-slate-600"><tr>{['Tanggal', 'Container', 'Type', 'Detail', 'IP'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {slice.map((x) => (
              <tr key={x.id} className="border-t align-middle">
                <td className="whitespace-nowrap px-4 py-3">{dmy(x.time)}</td><td className="whitespace-nowrap px-4 py-3">{x.container}</td><td className="whitespace-nowrap px-4 py-3">{x.type}</td>
                <td className="whitespace-pre-line px-4 py-3 leading-6">{x.detail || '-'}</td><td className="whitespace-nowrap px-4 py-3">{x.ip}</td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
    </div>
  )
}
