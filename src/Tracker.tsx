import { useMemo, useState } from 'react'
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

type SortKey = 'no' | 'regulator' | 'tglTemuan' | 'area' | 'pic' | 'dueDate' | 'status' | 'progress' | 'risiko' | 'alert'
const COLS: { k: SortKey; l: string }[] = [
  { k: 'no', l: 'Nomor Temuan' }, { k: 'regulator', l: 'Regulator' }, { k: 'tglTemuan', l: 'Tanggal Temuan' }, { k: 'area', l: 'Area Temuan' },
  { k: 'pic', l: 'PIC' }, { k: 'dueDate', l: 'Batas Waktu' }, { k: 'status', l: 'Status' }, { k: 'progress', l: 'Progress' }, { k: 'risiko', l: 'Tingkat Risiko' }, { k: 'alert', l: 'Alert' },
]
type Pending = { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'reason'; title: string; danger?: boolean; run: (r: string) => void } | { kind: 'sim' } | { kind: 'exports' } | { kind: 'saveFilter' } | null

export default function Tracker({ db, setDb, role }: { db: DB; setDb: React.Dispatch<React.SetStateAction<DB>>; role: Role }) {
  const user = ROLE_USER[role]
  const [tab, setTab] = useState<'table' | 'dashboard'>('table')
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [showCancelled, setShowCancelled] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
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
    setDb((d) => ({ ...d, exports: [{ id: String(Date.now()), time: nowStr(), user: user.name, filter: describeFilter(filter, showCancelled), rows: rows.length, file }, ...d.exports] }))
  }

  const sim = useMemo(() => db.findings.flatMap((f) => alertsFor(f, db.audit).map((a) => ({ f, a }))), [db])
  const dashFilter = (nf: Filter) => setFilter({ ...EMPTY_FILTER, from: nf.from, to: nf.to })
  const editing = pending?.kind === 'edit' ? db.findings.find((f) => f.id === pending.id) : null
  const blank = (): Finding => ({
    id: '', no: `TR-${todayStr().slice(0, 4)}-(otomatis)`, regulator: '', tglTemuan: '', area: '', rootCause: '', rootType: '', pic: '', dueDate: '', status: 'Open', progress: 0,
    validasi: 'Belum', validasiOleh: '', validasiTgl: '', persetujuan: 'Menunggu', persetujuanOleh: '', persetujuanTgl: '', unit: '', risiko: '' as never, tindak: [{ id: crypto.randomUUID(), text: '', files: [] }],
  })
  const sel = (k: keyof Filter, opts: [string, string][], ph: string) => (
    <select className="inp" value={filter[k]} onChange={(e) => upd({ [k]: e.target.value })}><option value="">{ph}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  )

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        {(['table', 'dashboard'] as const).map((t) => (
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
            <button className="btn" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={14} />Filter{showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={showCancelled} onChange={(e) => { setShowCancelled(e.target.checked); setPage(1) }} />Tampilkan yang dibatalkan</label>
            <div className="ml-auto flex flex-wrap gap-2">
              <button className="btn" onClick={() => setPending({ kind: 'sim' })}><Bell size={14} />Simulasi notifikasi ({sim.length})</button>
              <button className="btn" onClick={() => setPending({ kind: 'exports' })}><History size={14} />Riwayat Export</button>
              <button className="btn" onClick={doExport}><Download size={14} />Export Excel</button>
              {role === 'Compliance Officer' && <button className="btn btn-primary" onClick={() => setPending({ kind: 'add' })}><Plus size={14} />Tambah</button>}
            </div>
          </div>

          {showFilters && (
            <div className="space-y-3 border-b bg-slate-50 p-3">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <div><label className="lbl">Tanggal Temuan dari</label><input type="date" className="inp" value={filter.from} onChange={(e) => upd({ from: e.target.value })} /></div>
                <div><label className="lbl">sampai</label><input type="date" className="inp" value={filter.to} onChange={(e) => upd({ to: e.target.value })} /></div>
                <div><label className="lbl">Status</label>{sel('status', STATUSES.map((s) => [s, s]), 'Semua')}</div>
                <div><label className="lbl">PIC</label>{sel('pic', PIC_USERS.map((u) => [u.id, u.name]), 'Semua')}</div>
                <div><label className="lbl">Unit Kerja</label>{sel('unit', UNITS.map((s) => [s, s]), 'Semua')}</div>
                <div><label className="lbl">Regulator</label>{sel('regulator', REGULATORS.map((s) => [s, s]), 'Semua')}</div>
                <div><label className="lbl">Tingkat Risiko</label>{sel('risiko', RISKS.map((s) => [s, s]), 'Semua')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn" onClick={() => { setFilter({ ...EMPTY_FILTER }); setShowCancelled(false); setPage(1) }}><XCircle size={14} />Reset filter</button>
                <button className="btn" onClick={() => { setSaveName(''); setPending({ kind: 'saveFilter' }) }}><Save size={14} />Simpan Filter</button>
                {db.saved.length > 0 && <span className="ml-2 text-xs text-slate-500">Filter tersimpan:</span>}
                {db.saved.map((s) => (
                  <span key={s.name} className="inline-flex items-center overflow-hidden rounded border border-slate-300 bg-white text-xs">
                    <button className="px-2 py-1 hover:bg-slate-50" onClick={() => { setFilter(s.filter); setShowCancelled(s.showCancelled); setPage(1) }}>{s.name}</button>
                    <button className="border-l px-1.5 py-1 text-red-500 hover:bg-red-50" aria-label={`Hapus ${s.name}`} onClick={() => setDb((d) => ({ ...d, saved: d.saved.filter((x) => x.name !== s.name) }))}><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  <tr key={f.id} onClick={() => setOpenId(f.id)} className={`cursor-pointer border-t align-top hover:bg-slate-50 ${f.status === 'Dibatalkan' ? 'text-slate-400' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-brand">{f.no}</td>
                    <td className="px-3 py-2.5">{f.regulator}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(f.tglTemuan)}</td>
                    <td className="px-3 py-2.5">{f.area}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{userName(f.pic)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(f.dueDate)}</td>
                    <td className="px-3 py-2.5"><StatusBadge s={f.status} /></td>
                    <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded bg-slate-200"><div className="h-1.5 rounded bg-brand" style={{ width: `${f.progress}%` }} /></div><span className="text-xs">{f.progress}%</span></div></td>
                    <td className="px-3 py-2.5"><RiskBadge r={f.risiko} /></td>
                    <td className="px-3 py-2.5"><AlertBadges list={alertsFor(f, db.audit)} /></td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button className="btn !px-1.5 !py-1" title="Detail" onClick={() => setOpenId(f.id)}><Eye size={14} /></button>
                        {canEdit(f) && <button className="btn !px-1.5 !py-1" title="Ubah" onClick={() => setPending({ kind: 'edit', id: f.id })}><Pencil size={14} /></button>}
                        {role === 'Head CLRM' && f.status !== 'Dibatalkan' && <button className="btn !px-1.5 !py-1 text-red-600" title="Batalkan" onClick={() => actsFor(f).cancel()}><XCircle size={14} /></button>}
                        {role === 'Head CLRM' && f.status === 'Dibatalkan' && <button className="btn !px-1.5 !py-1 text-green-700" title="Kembalikan" onClick={() => actsFor(f).restore()}><RotateCcw size={14} /></button>}
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
      {pending?.kind === 'saveFilter' && (
        <Modal title="Simpan Filter" onClose={() => setPending(null)}>
          <label className="lbl">Nama filter *</label>
          <input className="inp" autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          <p className="mt-2 text-xs text-slate-500">{describeFilter(filter, showCancelled)}</p>
          <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={() => setPending(null)}>Batal</button>
            <button className="btn btn-primary" disabled={!saveName.trim()} onClick={() => { setDb((d) => ({ ...d, saved: [...d.saved.filter((s) => s.name !== saveName.trim()), { name: saveName.trim(), filter, showCancelled }] })); setPending(null) }}>Simpan</button></div>
        </Modal>
      )}
      {pending?.kind === 'exports' && (
        <Modal wide title="Riwayat Export" onClose={() => setPending(null)}>
          <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Waktu', 'User', 'File', 'Baris', 'Filter aktif'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{db.exports.map((e) => <tr key={e.id} className="border-t"><td className="px-2 py-2">{fmtTime(e.time)}</td><td className="px-2">{e.user}</td><td className="px-2">{e.file}</td><td className="px-2">{e.rows}</td><td className="px-2">{e.filter}</td></tr>)}
              {!db.exports.length && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada export</td></tr>}</tbody></table>
        </Modal>
      )}
      {pending?.kind === 'sim' && (
        <Modal wide title={`Simulasi notifikasi Telegram, hari ini ${fmtDate(todayStr())}`} onClose={() => setPending(null)}>
          <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Temuan', 'Alert', 'Keterangan', 'Penerima'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{sim.map(({ f, a }) => (
              <tr key={f.id + a.key} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => { setPending(null); setOpenId(f.id) }}>
                <td className="px-2 py-2 font-medium text-brand">{f.no}</td><td className="px-2"><span className={a.color === 'red' ? 'text-red-600' : 'text-yellow-700'}>{a.label}</span></td><td className="px-2">{a.detail}</td><td className="px-2">{a.to.join(', ')}</td></tr>
            ))}</tbody></table>
        </Modal>
      )}
    </div>
  )
}

