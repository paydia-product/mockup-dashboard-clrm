import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Bell, ChevronDown, ChevronUp, Download, Eye, History, Pencil, Plus, RotateCcw, Save, Search, SlidersHorizontal, Trash2, XCircle } from 'lucide-react'
import {
  Audit, DB, EMPTY_FILTER, Filter, Finding, PIC_USERS, REGULATORS, RISKS, ROLE_USER, Role, STATUSES, UNITS, alertsFor, applyFilter,
  describeFilter, fmtDate, fmtTime, nowStr, todayStr, todoText, userName,
} from './lib'
import Dashboard from './Dashboard'
import Drawer, { Acts } from './Drawer'
import Form from './Form'
import { AlertBadges, Modal, ReasonModal, RiskBadge, StatusBadge } from './ui'

const HEAD = { near: '⏰ TEMUAN HAMPIR JATUH TEMPO', overdue: '🔴 TEMUAN LEWAT BATAS WAKTU', stale: '⏳ MENUNGGU VALIDASI TERLALU LAMA' }
type SortKey = 'no' | 'regulator' | 'tglTemuan' | 'area' | 'pic' | 'dueDate' | 'status' | 'progress' | 'risiko' | 'alert'
const COLS: { k: SortKey; l: string }[] = [
  { k: 'no', l: 'Nomor Temuan' }, { k: 'regulator', l: 'Regulator' }, { k: 'tglTemuan', l: 'Tanggal Temuan' }, { k: 'area', l: 'Area Temuan' },
  { k: 'pic', l: 'PIC' }, { k: 'dueDate', l: 'Batas Waktu' }, { k: 'status', l: 'Status' }, { k: 'progress', l: 'Progress' }, { k: 'risiko', l: 'Tingkat Risiko' }, { k: 'alert', l: 'Alert' },
]
type Pending = { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'reason'; title: string; danger?: boolean; run: (r: string) => void } | { kind: 'sim' } | null

export default function Tracker({ db, setDb, role }: { db: DB; setDb: React.Dispatch<React.SetStateAction<DB>>; role: Role }) {
  const user = ROLE_USER[role]
  const [tab, setTab] = useState<'table' | 'dashboard'>('dashboard')
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [showCancelled, setShowCancelled] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft] = useState<Filter>(EMPTY_FILTER)
  useEffect(() => {
    if (!showFilters) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setShowFilters(false)
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [showFilters])
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'no', dir: -1 })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [saveName, setSaveName] = useState('')

  const sev = (f: Finding) => { const a = alertsFor(f, db.audit); return a.some((x) => x.color === 'red') ? 2 : a.length ? 1 : 0 }
  const rows = useMemo(() => {
    const val = (f: Finding): string | number => (sort.k === 'pic' ? userName(f.pic) : sort.k === 'alert' ? sev(f) : (f[sort.k] as string | number))
    return applyFilter(db.findings, filter, showCancelled).sort((a, b) => {
      const x = val(a), y = val(b)
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filter, showCancelled, sort])
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const cur = Math.min(page, pages)
  const slice = rows.slice((cur - 1) * size, cur * size)
  const upd = (p: Partial<Filter>) => { setFilter({ ...filter, ...p }); setPage(1) }
  const open = db.findings.find((f) => f.id === openId) ?? null

  // ---- mutasi + audit ----
  type Ent = { aksi: string; kolom?: string; lama?: string; baru?: string; alasan?: string }
  const mkAudit = (fid: string, ents: Ent[]): Audit[] =>
    ents.map((e, i) => ({ id: `${fid}-${Date.now()}-${i}`, fid, time: nowStr(), user: user.name, aksi: e.aksi, kolom: e.kolom ?? '', lama: e.lama ?? '', baru: e.baru ?? '', alasan: e.alasan ?? '' }))
  const commit = (next: Finding, ents: Ent[], dropReq = false) =>
    setDb((d) => {
      const exists = d.findings.some((x) => x.id === next.id)
      return {
        ...d,
        findings: exists ? d.findings.map((x) => (x.id === next.id ? next : x)) : [next, ...d.findings],
        audit: [...d.audit, ...mkAudit(next.id, ents)],
        requests: dropReq ? d.requests.filter((r) => r.fid !== next.id) : d.requests,
      }
    })
  const statusEnt = (aksi: string, from: string, to: string, alasan = ''): Ent => ({ aksi, kolom: 'Status', lama: from, baru: to, alasan })

  const saveForm = (f: Finding, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      const yr = todayStr().slice(0, 4)
      const n = db.findings.filter((x) => x.no.startsWith(`TR-${yr}-`)).length + 1
      const nf = { ...f, no: `TR-${yr}-${String(n).padStart(4, '0')}`, id: `f${Date.now()}` }
      commit(nf, [{ aksi: 'Tambah temuan', kolom: 'Nomor Temuan', baru: nf.no }])
      setPending(null)
      return
    }
    const old = db.findings.find((x) => x.id === f.id)!
    const diffs: [keyof Finding, string, (x: Finding) => string][] = [
      ['regulator', 'Regulator', (x) => x.regulator], ['tglTemuan', 'Tanggal Temuan', (x) => x.tglTemuan], ['area', 'Area Temuan', (x) => x.area],
      ['rootCause', 'Penyebab Utama', (x) => `${x.rootCause} (${x.rootType})`], ['pic', 'PIC', (x) => userName(x.pic)], ['dueDate', 'Batas Waktu', (x) => x.dueDate],
      ['status', 'Status', (x) => x.status], ['progress', 'Persentase Progress', (x) => String(x.progress)], ['unit', 'Unit Kerja', (x) => x.unit],
      ['risiko', 'Tingkat Risiko', (x) => x.risiko], ['tindak', 'Rencana Tindak Lanjut & Bukti', (x) => todoText(x.tindak)],
    ]
    const make = (alasan: string) =>
      diffs.filter(([, , g]) => g(old) !== g(f)).map(([k, l, g]): Ent => ({ aksi: 'Ubah temuan', kolom: l, lama: g(old), baru: g(f), alasan: k === 'dueDate' ? alasan : '' }))
    const doIt = (alasan: string) => {
      const cs = diffs.filter(([, , g]) => g(old) !== g(f)).map(([k, l, g]) => ({ key: k, label: l, lama: g(old), baru: g(f), value: f[k] as unknown }))
      if (cs.length) {
        setDb((d) => ({
          ...d,
          requests: [...d.requests.filter((r) => r.fid !== f.id), { id: `r${Date.now()}`, fid: f.id, by: user.name, time: nowStr(), alasan, changes: cs }],
          audit: [...d.audit, ...mkAudit(f.id, make(alasan).map((e) => ({ ...e, aksi: 'Ajukan perubahan (menunggu Head CLRM)' })))],
        }))
      }
      setPending(null)
    }
    if (old.dueDate !== f.dueDate) setPending({ kind: 'reason', title: 'Alasan perubahan Batas Waktu', run: doIt })
    else doIt('')
  }

  const actsFor = (f: Finding): Acts => ({
    edit: () => setPending({ kind: 'edit', id: f.id }),
    submit: () => {
      const ents = [statusEnt('Ajukan penutupan', f.status, 'Menunggu Validasi')]
      if (f.progress !== 100) ents.push({ aksi: 'Ajukan penutupan', kolom: 'Persentase Progress', lama: String(f.progress), baru: '100' })
      commit({ ...f, status: 'Menunggu Validasi', progress: 100, validasi: 'Belum', validasiOleh: '', validasiTgl: '', persetujuan: 'Menunggu', persetujuanOleh: '', persetujuanTgl: '' }, ents)
    },
    validate: (v, alasan) => {
      const ents: Ent[] = [{ aksi: 'Validasi ulang', kolom: 'Validasi Ulang', lama: f.validasi, baru: v, alasan }]
      const next: Finding = { ...f, validasi: v, validasiOleh: user.name, validasiTgl: todayStr() }
      if (v === 'Tidak Valid') { next.status = 'Proses'; ents.push(statusEnt('Validasi ulang', f.status, 'Proses', alasan)) }
      commit(next, ents)
    },
    approve: (v, alasan) => {
      const ents: Ent[] = [{ aksi: 'Persetujuan penutupan', kolom: 'Persetujuan Penutupan', lama: f.persetujuan, baru: v, alasan }]
      const to = v === 'Disetujui' ? 'Selesai' : 'Proses'
      ents.push(statusEnt('Persetujuan penutupan', f.status, to, alasan))
      commit({ ...f, persetujuan: v, persetujuanOleh: user.name, persetujuanTgl: todayStr(), status: to }, ents)
    },
    cancel: () => setPending({ kind: 'reason', title: `Batalkan ${f.no}`, danger: true, run: (r) => { commit({ ...f, status: 'Dibatalkan' }, [statusEnt('Batalkan temuan', f.status, 'Dibatalkan', r)]); setPending(null) } }),
    reqApprove: () => {
      const r = db.requests.find((x) => x.fid === f.id)
      if (!r) return
      const next = { ...f } as Record<string, unknown>
      r.changes.forEach((c) => { next[c.key] = c.value })
      commit(next as unknown as Finding, r.changes.map((c): Ent => ({ aksi: 'Setujui perubahan', kolom: c.label, lama: c.lama, baru: c.baru, alasan: c.key === 'dueDate' ? r.alasan : '' })), true)
    },
    reqReject: () => setPending({ kind: 'reason', title: `Tolak perubahan ${f.no}`, danger: true, run: (alasan) => {
      const r = db.requests.find((x) => x.fid === f.id)
      if (r) setDb((d) => ({ ...d, requests: d.requests.filter((x) => x.fid !== f.id), audit: [...d.audit, ...mkAudit(f.id, r.changes.map((c): Ent => ({ aksi: 'Tolak perubahan', kolom: c.label, lama: c.lama, baru: c.baru, alasan })))] }))
      setPending(null)
    } }),
    restore: () => {
      const last = db.audit.filter((a) => a.fid === f.id && a.kolom === 'Status' && a.baru === 'Dibatalkan').sort((a, b) => b.time.localeCompare(a.time))[0]
      const to = (last?.lama as Finding['status']) || 'Open'
      commit({ ...f, status: to }, [statusEnt('Kembalikan temuan', 'Dibatalkan', to)])
    },
  })

  const canEdit = (f: Finding) => !db.requests.some((r) => r.fid === f.id) && f.status !== 'Dibatalkan' && f.status !== 'Selesai' && (role === 'Compliance Officer' || (role === 'PIC' && f.pic === user.id))

  const doExport = () => {
    const data = rows.map((f) => ({
      'Nomor Temuan': f.no, Regulator: f.regulator, 'Tanggal Temuan': f.tglTemuan, 'Area Temuan': f.area, 'Penyebab Utama (Root Cause)': `${f.rootCause} (${f.rootType})`,
      PIC: userName(f.pic), 'Batas Waktu': f.dueDate, Status: f.status, 'Persentase Progress': f.progress,
      'Validasi Ulang': f.validasi === 'Belum' ? 'Belum' : `${f.validasi} - ${f.validasiOleh} - ${f.validasiTgl}`,
      'Persetujuan Penutupan': f.persetujuanOleh ? `${f.persetujuan} - ${f.persetujuanOleh} - ${f.persetujuanTgl}` : f.persetujuan,
      'Unit Kerja': f.unit, 'Tingkat Risiko': f.risiko, 'Rencana Tindak Lanjut & Bukti': todoText(f.tindak),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Temuan')
    const file = `Temuan_Regulator_${todayStr()}.xlsx`
    XLSX.writeFile(wb, file)
  }

  const sim = useMemo(() => db.findings.flatMap((f) => alertsFor(f, db.audit).map((a) => ({ f, a }))), [db])
  const dashFilter = (nf: Filter) => setFilter({ ...EMPTY_FILTER, from: nf.from, to: nf.to })
  const editing = pending?.kind === 'edit' ? db.findings.find((f) => f.id === pending.id) : null
  const blank = (): Finding => ({
    id: '', no: `TR-${todayStr().slice(0, 4)}-(otomatis)`, regulator: '', tglTemuan: '', area: '', rootCause: '', rootType: '', pic: '', dueDate: '', status: 'Open', progress: 0,
    validasi: 'Belum', validasiOleh: '', validasiTgl: '', persetujuan: 'Menunggu', persetujuanOleh: '', persetujuanTgl: '', unit: '', risiko: '' as never, tindak: [{ id: crypto.randomUUID(), text: '', files: [] }],
  })
  const sel = (k: keyof Filter, opts: [string, string][], ph: string) => (
    <select className="inp" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}><option value="">{ph}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  )
  const apply = () => { setFilter({ ...draft, q: filter.q }); setPage(1); setShowFilters(false) }
  const clearAll = () => { setDraft({ ...EMPTY_FILTER }); setFilter({ ...EMPTY_FILTER }); setShowCancelled(false); setPage(1) }

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        {(['dashboard', 'table'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500'}`}>{t === 'table' ? 'Table' : 'Dashboard'}</button>
        ))}
      </div>

      {tab === 'dashboard' ? (
        <Dashboard findings={db.findings} audit={db.audit} filter={filter} setFilter={dashFilter} onOpen={setOpenId} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative w-64"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input className="inp !pl-8" placeholder="Cari nomor, regulator, area, PIC" value={filter.q} onChange={(e) => upd({ q: e.target.value })} /></div>
            <div className="relative">
              <button className="btn btn-primary" onClick={() => { setDraft(filter); setShowFilters(!showFilters) }}><SlidersHorizontal size={14} />Filter</button>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute left-0 top-11 z-50 w-[380px] max-w-[92vw] rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                    <div className="space-y-4">
                      <div><label className="lbl">Periode</label>
                        <div className="flex items-center gap-2"><input type="date" className="inp" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /><span>-</span><input type="date" className="inp" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></div></div>
                      <div><label className="lbl">Status</label>{sel('status', STATUSES.map((x) => [x, x]), 'Pilih Status')}</div>
                      <div><label className="lbl">PIC</label>{sel('pic', PIC_USERS.map((u) => [u.id, u.name]), 'Pilih PIC')}</div>
                      <div><label className="lbl">Unit Kerja</label>{sel('unit', UNITS.map((x) => [x, x]), 'Pilih Unit Kerja')}</div>
                      <div><label className="lbl">Regulator</label>{sel('regulator', REGULATORS.map((x) => [x, x]), 'Pilih Regulator')}</div>
                      <div><label className="lbl">Tingkat Risiko</label>{sel('risiko', RISKS.map((x) => [x, x]), 'Pilih Tingkat Risiko')}</div>
                    </div>
                    <div className="mt-4 border-t pt-3">
                      <div className="flex gap-2">
                        <input className="inp" placeholder="Nama filter" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                        <button className="btn whitespace-nowrap" disabled={!saveName.trim()} onClick={() => { const n = saveName.trim(); setDb((d) => ({ ...d, saved: [...d.saved.filter((x) => x.name !== n), { name: n, filter: { ...draft, q: '' }, showCancelled }] })); setSaveName('') }}><Save size={14} />Simpan Filter</button>
                      </div>
                      {db.saved.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {db.saved.map((sv) => (
                            <span key={sv.name} className="inline-flex items-center overflow-hidden rounded border border-slate-300 text-xs">
                              <button className="px-2 py-1 hover:bg-slate-50" onClick={() => { setDraft(sv.filter); setFilter({ ...sv.filter, q: filter.q }); setShowCancelled(sv.showCancelled); setPage(1); setShowFilters(false) }}>{sv.name}</button>
                              <button className="border-l px-1.5 py-1 text-red-500 hover:bg-red-50" aria-label={`Hapus ${sv.name}`} onClick={() => setDb((d) => ({ ...d, saved: d.saved.filter((x) => x.name !== sv.name) }))}><Trash2 size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button className="flex-1 rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={clearAll}>Clear All</button>
                      <button className="flex-1 rounded-full bg-[#1f2ab5] py-2 text-sm font-medium text-white hover:bg-[#18228f]" onClick={apply}>Apply Filters</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={showCancelled} onChange={(e) => { setShowCancelled(e.target.checked); setPage(1) }} />Tampilkan yang dibatalkan</label>
            <div className="ml-auto flex flex-wrap gap-2">
              <button className="btn" onClick={() => setPending({ kind: 'sim' })}><Bell size={14} />Simulasi notifikasi ({sim.length})</button>
              <button className="btn" onClick={doExport}><Download size={14} />Export Excel</button>
              {role === 'Compliance Officer' && <button className="btn btn-primary" onClick={() => setPending({ kind: 'add' })}><Plus size={14} />Tambah</button>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-xs text-slate-600">
                <tr>
                  {COLS.map((c) => (
                    <th key={c.k} className="cursor-pointer whitespace-nowrap px-3 py-2.5 font-semibold" onClick={() => setSort({ k: c.k, dir: sort.k === c.k ? (-sort.dir as 1 | -1) : 1 })}>
                      {c.l}{sort.k === c.k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((f) => (
                  <tr key={f.id} className={`border-t align-top hover:bg-slate-50 ${f.status === 'Dibatalkan' ? 'text-slate-400' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2.5"><button className="font-medium text-brand hover:underline" onClick={() => setOpenId(f.id)}>{f.no}</button></td>
                    <td className="px-3 py-2.5">{f.regulator}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(f.tglTemuan)}</td>
                    <td className="px-3 py-2.5">{f.area}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{userName(f.pic)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(f.dueDate)}</td>
                    <td className="px-3 py-2.5"><StatusBadge s={f.status} /></td>
                    <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded bg-slate-200"><div className="h-1.5 rounded bg-brand" style={{ width: `${f.progress}%` }} /></div><span className="text-xs">{f.progress}%</span></div></td>
                    <td className="px-3 py-2.5"><RiskBadge r={f.risiko} /></td>
                    <td className="px-3 py-2.5"><AlertBadges list={alertsFor(f, db.audit)} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        {canEdit(f) && <button className="btn !px-2 !py-1" onClick={() => setPending({ kind: 'edit', id: f.id })}><Pencil size={13} />Edit</button>}
                        {role === 'Head CLRM' && f.status !== 'Dibatalkan' && <button className="btn !px-2 !py-1 text-red-600" onClick={() => actsFor(f).cancel()}><XCircle size={13} />Batalkan</button>}
                        {role === 'Head CLRM' && f.status === 'Dibatalkan' && <button className="btn !px-2 !py-1 text-green-700" onClick={() => actsFor(f).restore()}><RotateCcw size={13} />Kembalikan</button>}
                        {!canEdit(f) && !(role === 'Head CLRM') && <span className="text-slate-300">-</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!slice.length && <tr><td colSpan={11} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-xs">
            <label className="flex items-center gap-2">Baris per halaman
              <select className="inp !w-auto" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1) }}>{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select></label>
            <div className="flex items-center gap-3">
              <span>{rows.length ? (cur - 1) * size + 1 : 0} sampai {Math.min(cur * size, rows.length)} dari {rows.length} data</span>
              <div className="flex gap-1">
                <button className="btn !px-2 !py-1" disabled={cur === 1} onClick={() => setPage(cur - 1)}>&lt;</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`btn !px-2.5 !py-1 ${n === cur ? '!border-brand !bg-brand !text-white' : ''}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="btn !px-2 !py-1" disabled={cur === pages} onClick={() => setPage(cur + 1)}>&gt;</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && <Drawer f={open} audit={db.audit} req={db.requests.find((r) => r.fid === open.id)} role={role} acts={actsFor(open)} onClose={() => setOpenId(null)} />}
      {pending?.kind === 'add' && <Form mode="add" role={role} init={blank()} onSave={(f) => saveForm(f, 'add')} onClose={() => setPending(null)} />}
      {editing && <Form mode="edit" role={role} init={editing} onSave={(f) => saveForm(f, 'edit')} onClose={() => setPending(null)} />}
      {pending?.kind === 'reason' && <ReasonModal title={pending.title} danger={pending.danger} onClose={() => setPending(null)} onConfirm={pending.run} />}
      {pending?.kind === 'sim' && (
        <Modal wide title={`Simulasi notifikasi Telegram, hari ini ${fmtDate(todayStr())}`} onClose={() => setPending(null)}>
          <div className="max-h-[65vh] space-y-3 overflow-auto rounded-lg bg-[#e7ebf0] p-3">
            {sim.map(({ f, a }) => (
              <div key={f.id + a.key} className="max-w-[520px] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 shadow-sm">
                {`${HEAD[a.key]}\n\nNomor Temuan:   ${f.no}\nRegulator:      ${f.regulator}\nArea Temuan:    ${f.area}\nPIC:            ${userName(f.pic)}\nBatas Waktu:    ${fmtDate(f.dueDate)} (${a.detail.toLowerCase()})\nPenerima:       ${a.to.join(', ')}\n🕐 ${todayStr()} 08:00:00`}
              </div>
            ))}
            {!sim.length && <p className="p-6 text-center text-slate-400">Tidak ada alert hari ini</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}

