import { useEffect, useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { ChangeReq, DB, applyTrackerRequest, findingLabel, fmtTime } from '../lib'
import { MODULE_LABEL } from '../kit/perms'
import { decideApproval, useApp } from '../kit/store'
import type { Action, ApprovalReq, ModuleId, PermKey, Role, Store } from '../kit/types'
import { Badge, Modal } from '../ui'
import { usePaged } from './Pager'

// Adapter: request perubahan tracker tampil sebagai ApprovalReq
const adapt = (r: ChangeReq, db: DB, store: Store): ApprovalReq => {
  const f = db.findings.find((x) => x.id === r.fid)
  return { id: `t-${r.id}`, no: r.no ?? 0, module: 'tracker', jenis: 'Penutupan Temuan', recordId: r.fid, recordNo: f?.no ?? 0, recordLabel: f ? findingLabel(f) : '-', by: r.by, byRole: store.accounts.find((a) => a.name === r.by)?.role ?? 'PIC', time: r.time, alasan: r.alasan, approver: 'Head CLRM', changes: r.changes.map((c) => ({ key: c.key, label: c.label, lama: c.lama, baru: c.baru, value: c.value })), status: r.status ?? 'Menunggu', decidedBy: r.decidedBy, decidedAt: r.decidedAt, catatan: r.catatan }
}
export const allApprovals = (store: Store, db: DB): ApprovalReq[] => [...db.requests.map((r) => adapt(r, db, store)), ...store.approvals]
export const canDecide = (a: ApprovalReq, role: Role, can: (m: PermKey, x: Action) => boolean) => a.status === 'Menunggu' && (a.approver === role || role === 'Super Admin') && can(a.module as ModuleId, 'Approve')
export const pendingCount = (store: Store, db: DB, role: Role, can: (m: PermKey, x: Action) => boolean) => allApprovals(store, db).filter((a) => canDecide(a, role, can)).length

export default function Approval({ tdb, setTdb }: { tdb: DB; setTdb: React.Dispatch<React.SetStateAction<DB>> }) {
  const { store, ctx, can } = useApp()
  const all = useMemo(() => allApprovals(store, tdb), [store, tdb])
  const [f, setF] = useState({ q: '', status: '', module: '' })
  const [openId, setOpenId] = useState<string | null>(() => new URLSearchParams(location.hash.split('?')[1] ?? '').get('id'))
  const [decide, setDecide] = useState<{ req: ApprovalReq; approve: boolean } | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { const h = () => setOpenId(new URLSearchParams(location.hash.split('?')[1] ?? '').get('id')); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  const list = all.filter((a) => (!f.status || a.status === f.status) && (!f.module || a.module === f.module) && `${a.jenis} ${a.recordLabel ?? ''} ${a.by} ${MODULE_LABEL[a.module]}`.toLowerCase().includes(f.q.toLowerCase())).sort((a, b) => b.time.localeCompare(a.time))
  const { slice, pager, reset, offset } = usePaged(list)
  const open = all.find((a) => a.id === openId)
  const tone = (s: string) => (s === 'Disetujui' ? 'green' : s === 'Ditolak' ? 'red' : 'yellow')
  const upd = (p: Partial<typeof f>) => { setF({ ...f, ...p }); reset() }
  const confirm = () => {
    if (!decide) return
    if (!decide.approve && !note.trim()) return setErr('Catatan wajib diisi saat Reject')
    const { req, approve } = decide
    if (req.module === 'tracker') {
      setTdb((d) => applyTrackerRequest(d, req.id.slice(2), ctx.user.name, approve, note.trim()))
    } else decideApproval(req.id, approve, note.trim(), ctx.user)
    setDecide(null); setNote(''); setErr(''); setOpenId(null)
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative w-64"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input className="inp !pl-8" placeholder="Cari jenis, data, pengaju" value={f.q} onChange={(e) => upd({ q: e.target.value })} /></div>
        <select className="inp !w-auto" value={f.status} onChange={(e) => upd({ status: e.target.value })}><option value="">Semua status</option>{['Menunggu', 'Disetujui', 'Ditolak'].map((s) => <option key={s}>{s}</option>)}</select>
        <select className="inp !w-auto" value={f.module} onChange={(e) => upd({ module: e.target.value })}><option value="">Semua modul</option>{[...new Set(all.map((a) => a.module))].map((m) => <option key={m} value={m}>{MODULE_LABEL[m]}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs text-slate-600"><tr>{['Nomor Request', 'Modul', 'Jenis Request', 'Data', 'Pengaju', 'Tanggal Ajuan', 'Status', 'Aksi'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {slice.map((a, i) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2.5">{offset + i + 1}</td><td className="px-3 py-2.5">{MODULE_LABEL[a.module]}</td><td className="px-3 py-2.5">{a.jenis}</td><td className="px-3 py-2.5">{a.recordLabel || '-'}</td>
                <td className="px-3 py-2.5">{a.by}</td><td className="whitespace-nowrap px-3 py-2.5">{fmtTime(a.time)}</td><td className="px-3 py-2.5"><Badge tone={tone(a.status)}>{a.status}</Badge></td>
                <td className="px-3 py-2.5"><button className="btn !px-2 !py-1" onClick={() => setOpenId(a.id)}><Eye size={13} />Lihat Detail</button></td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={8} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
      {open && (
        <Modal wide title="Detail" onClose={() => setOpenId(null)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {([['Modul', MODULE_LABEL[open.module]], ['Jenis request', open.jenis], ['Data', open.recordLabel || '-'], ['Pengaju', `${open.by} (${open.byRole})`], ['Tanggal ajuan', fmtTime(open.time)], ['Approver', open.approver], ['Alasan', open.alasan || '-']] as [string, string | number][]).map(([l, v]) => (
              <div key={l}><div className="text-xs text-slate-400">{l}</div><div className="text-slate-800">{v}</div></div>
            ))}
          </div>
          <table className="mt-4 w-full text-left text-xs"><thead className="bg-slate-100"><tr><th className="px-2 py-1.5">Kolom</th><th className="px-2 py-1.5">Nilai lama</th><th className="px-2 py-1.5">Nilai baru</th></tr></thead>
            <tbody>{open.changes.map((c) => <tr key={c.key} className="border-t"><td className="px-2 py-1.5">{c.label}</td><td className="px-2 py-1.5 text-red-600">{c.lama || '-'}</td><td className="px-2 py-1.5 text-green-700">{c.baru || '-'}</td></tr>)}</tbody></table>
          <div className="mt-3 text-xs">Status: <Badge tone={tone(open.status)}>{open.status}</Badge>{open.decidedBy && ` oleh ${open.decidedBy}, ${fmtTime(open.decidedAt!)}`}{open.catatan && `. Catatan: ${open.catatan}`}</div>
          <div className="mt-5 flex justify-end gap-2 border-t pt-3">
            {canDecide(open, ctx.role, can) && <><button className="btn btn-primary" onClick={() => { setDecide({ req: open, approve: true }); setNote(''); setErr('') }}>Approve</button><button className="btn btn-danger" onClick={() => { setDecide({ req: open, approve: false }); setNote(''); setErr('') }}>Reject</button></>}
            <button className="btn" onClick={() => setOpenId(null)}>Tutup</button>
          </div>
        </Modal>
      )}
      {decide && (
        <Modal title={decide.approve ? 'Approve request' : 'Reject request'} onClose={() => setDecide(null)}>
          <label className="lbl">Catatan{decide.approve ? '' : ' *'}</label>
          <textarea className="inp" rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr('') }} autoFocus />
          {err && <p className="err">{err}</p>}
          <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={() => setDecide(null)}>Batal</button><button className={`btn ${decide.approve ? 'btn-primary' : 'btn-danger'}`} onClick={confirm}>Konfirmasi</button></div>
        </Modal>
      )}
    </div>
  )
}
