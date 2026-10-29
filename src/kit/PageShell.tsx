import { ReactNode, useState } from 'react'
import { Bell, Download, Eye, Pencil, Plus, RotateCcw, Search, Upload, XCircle } from 'lucide-react'
import { ReasonModal } from '../ui'
import DataTable from './DataTable'
import DetailModal from './DetailModal'
import EmailSim, { alertHits } from './EmailSim'
import { exportRows } from './exportXlsx'
import FilterPopover from './FilterPopover'
import FormModal from './FormModal'
import ImportExcel from './ImportExcel'
import { useApp, useModule, setStore } from './store'
import type { BaseRec, PageConfig } from './types'

type Modal_ = { k: 'detail' | 'edit' | 'cancel' | 'restore'; id: string } | { k: 'add' | 'sim' | 'import' } | { k: 'extra'; node: ReactNode } | null
type Filt = Record<string, unknown>
const hasVal = (v: unknown) => (Array.isArray(v) ? !!(v[0] || v[1]) : !!v)

export default function PageShell<T extends BaseRec>({ config: cfg }: { config: PageConfig<T> }) {
  const api = useModule(cfg)
  const { ctx: c, can, log, store } = useApp()
  const m = cfg.module
  const [tab, setTab] = useState<'dashboard' | 'table'>('dashboard')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filt>({})
  const [modal, setModal] = useState<Modal_>(null)
  const close = () => setModal(null)
  const live = api.rows.filter((r) => !r.cancelled)
  const saved = store.saved[m] ?? []
  const setSaved = (f: (l: typeof saved) => typeof saved) => setStore((s) => ({ ...s, saved: { ...s.saved, [m]: f(s.saved[m] ?? []) } }))

  const shown = api.rows.filter((r) => {
    if (q.trim() && !cfg.search(r, c).toLowerCase().includes(q.trim().toLowerCase())) return false
    return cfg.filters.every((d) => { const v = filter[d.key]; return !hasVal(v) || d.match(r, v as string | [string, string]) })
  })
  const row = (id: string) => api.rows.find((r) => r.id === id)
  const drill = (f: Filt) => { setFilter(f); setQ(''); setTab('table') }
  const hits = alertHits(cfg, live, c)
  const D = cfg.Dashboard
  const detail = modal && modal.k === 'detail' ? row(modal.id) : undefined
  const editing = modal && modal.k === 'edit' ? api.stored(modal.id) : undefined // form Edit mulai dari record tersimpan, bukan hasil normalize
  const cancelling = modal && modal.k === 'cancel' ? row(modal.id) : undefined
  const restoring = modal && modal.k === 'restore' ? row(modal.id) : undefined
  const canEdit = (r: T) => can(m, 'Ubah') && !r.cancelled && !api.pendingFor(r.id) && (cfg.canEditRow?.(r, c) ?? true)
  const openDetail = (id: string) => setModal({ k: 'detail', id })

  const actions = (r: T) => (
    <>
      <button className="btn !px-2 !py-1" onClick={() => openDetail(r.id)}><Eye size={13} />Lihat Detail</button>
      {canEdit(r) && <button className="btn !px-2 !py-1" onClick={() => setModal({ k: 'edit', id: r.id })}><Pencil size={13} />Edit</button>}
      {can(m, 'Cancel') && !r.cancelled && !api.pendingFor(r.id) && <button className="btn !px-2 !py-1 text-red-600" onClick={() => setModal({ k: 'cancel', id: r.id })}><XCircle size={13} />Batalkan</button>}
      {can(m, 'Cancel') && r.cancelled && <button className="btn !px-2 !py-1 text-green-700" onClick={() => setModal({ k: 'restore', id: r.id })}><RotateCcw size={13} />Kembalikan</button>}
      {!r.cancelled && can(m, 'Ubah') && cfg.rowActions?.filter((a) => a.show(r, c)).map((a) => (
        <button key={a.label} className="btn !px-2 !py-1" onClick={() => { const out = a.run(r, api, close); if (out) setModal({ k: 'extra', node: out }) }}>{a.icon && <a.icon size={13} />}{a.label}</button>
      ))}
    </>
  )

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        {(['dashboard', 'table'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500'}`}>{t === 'table' ? 'Table' : 'Dashboard'}</button>
        ))}
      </div>

      {tab === 'dashboard' ? <D rows={live} c={c} open={openDetail} drill={drill} /> : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative w-64"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input className="inp !pl-8" placeholder={cfg.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <FilterPopover defs={cfg.filters} rows={api.rows} c={c} value={filter} saved={saved}
              onApply={setFilter} onClear={() => setFilter({})}
              onSave={(name, v) => setSaved((l) => [...l.filter((x) => x.name !== name), { name, filter: v }])}
              onDelete={(name) => setSaved((l) => l.filter((x) => x.name !== name))} />
            <div className="ml-auto flex flex-wrap gap-2">
              <button className="btn" onClick={() => setModal({ k: 'sim' })}><Bell size={14} />Simulasi notifikasi ({hits.length})</button>
              {can(m, 'Import') && <button className="btn" onClick={() => setModal({ k: 'import' })}><Upload size={14} />Import Excel</button>}
              {can(m, 'Export') && <button className="btn" onClick={() => { const n = exportRows(cfg, shown, c, c.today); log(cfg.title, 'Export', '', `${n} baris`) }}><Download size={14} />Export Excel</button>}
              {can(m, 'Tambah') && <button className="btn btn-primary" onClick={() => setModal({ k: 'add' })}><Plus size={14} />Tambah</button>}
            </div>
          </div>
          <DataTable cfg={cfg} rows={shown} c={c} actions={actions} />
        </div>
      )}

      {detail && <DetailModal cfg={cfg} r={detail} c={c} pending={api.pendingFor(detail.id)} onClose={close}
        alerts={detail.cancelled ? [] : cfg.alerts.flatMap((a) => { const hit = a.check(detail, c); return hit ? [{ a, hit }] : [] })} />}
      {modal?.k === 'add' && <FormModal cfg={cfg} mode="add" init={{ ...cfg.blank() }} c={c} onClose={close} onSave={(r) => { api.add(r as never); close() }} />}
      {editing && <FormModal cfg={cfg} mode="edit" init={editing} norm={row(editing.id)} c={c} onClose={close} onSave={(r, alasan) => { api.update(editing.id, r as Partial<T>, alasan); close() }} />}
      {cancelling && <ReasonModal danger title={`Batalkan ${cfg.noun} ${cancelling.no}`} onClose={close} onConfirm={(reason) => { api.cancel(cancelling.id, reason); close() }} />}
      {restoring && <ReasonModal title={`Kembalikan ${cfg.noun} ${restoring.no}`} onClose={close} onConfirm={(reason) => { api.restore(restoring.id, reason); close() }} />}
      {modal?.k === 'sim' && <EmailSim cfg={cfg} rows={live} c={c} onClose={close} />}
      {modal?.k === 'import' && <ImportExcel cfg={cfg} c={c} api={api} onClose={close} onDone={(ok, fail) => log(cfg.title, 'Import', '', `${ok} baris berhasil, ${fail} gagal`)} />}
      {modal?.k === 'extra' && modal.node}
    </div>
  )
}
