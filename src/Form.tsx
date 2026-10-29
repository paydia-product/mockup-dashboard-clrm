import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AREAS, Finding, PIC_USERS, REGULATORS, RISKS, ROOT_TYPES, Role, UNITS, Todo, fmtDate } from './lib'
import { Modal } from './ui'

type Errs = Partial<Record<string, string>>
const OPEN_STATUS = ['Open', 'Proses']

export function validate(f: Finding): Errs {
  const e: Errs = {}
  const req = (k: keyof Finding, label: string) => { if (!String(f[k] ?? '').trim()) e[k] = `${label} wajib diisi` }
  req('regulator', 'Regulator'); req('tglTemuan', 'Tanggal Temuan'); req('area', 'Area Temuan'); req('rootCause', 'Penyebab Utama'); req('rootType', 'Jenis Penyebab')
  req('pic', 'PIC'); req('dueDate', 'Batas Waktu'); req('unit', 'Unit Kerja'); req('risiko', 'Tingkat Risiko'); req('status', 'Status')
  if (f.dueDate && f.tglTemuan && f.dueDate < f.tglTemuan) e.dueDate = 'Batas Waktu tidak boleh sebelum Tanggal Temuan'
  if (!(f.progress >= 0 && f.progress <= 100) || Number.isNaN(f.progress)) e.progress = 'Progress harus 0 sampai 100'
  if (!f.tindak.length || f.tindak.some((t) => !t.text.trim())) e.tindak = 'Minimal satu Rencana Tindak Lanjut, semua wajib diisi'
  return e
}

export default function Form({ init, mode, role, onSave, onClose }: { init: Finding; mode: 'add' | 'edit'; role: Role; onSave: (f: Finding) => void; onClose: () => void }) {
  const [f, setF] = useState<Finding>(init)
  const [errs, setErrs] = useState<Errs>({})
  const picOnly = role === 'PIC'
  const lock = (k: string) => picOnly && k !== 'progress' && k !== 'tindak'
  const set = <K extends keyof Finding>(k: K, v: Finding[K]) => setF((p) => ({ ...p, [k]: v }))
  const sel = (k: keyof Finding, label: string, opts: string[]) => (
    <div>
      <label className="lbl">{label} *</label>
      <select className="inp" disabled={lock(k)} value={String(f[k])} onChange={(e) => set(k, e.target.value as never)}>
        <option value="">Pilih...</option>{opts.map((o) => <option key={o}>{o}</option>)}
      </select>
      {errs[k] && <p className="err">{errs[k]}</p>}
    </div>
  )
  const date = (k: 'tglTemuan' | 'dueDate', label: string) => (
    <div>
      <label className="lbl">{label} *</label>
      <input type="date" className="inp" disabled={lock(k)} value={f[k]} onChange={(e) => set(k, e.target.value)} />
      {errs[k] && <p className="err">{errs[k]}</p>}
    </div>
  )
  const setTodo = (i: number, t: Partial<Todo>) => set('tindak', f.tindak.map((x, j) => (j === i ? { ...x, ...t } : x)))
  const submit = () => {
    const e = validate(f)
    setErrs(e)
    if (!Object.keys(e).length) onSave({ ...f, progress: Number(f.progress) })
  }
  return (
    <Modal wide title={mode === 'add' ? 'Tambah Temuan Regulator' : `Ubah Temuan ${f.no}`} onClose={onClose}>
      {picOnly && <p className="mb-3 rounded bg-blue-50 p-2 text-xs text-blue-700">Sebagai PIC, Anda hanya dapat mengubah Persentase Progress dan Rencana Tindak Lanjut & Bukti.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="lbl">Nomor Temuan *</label><input className="inp" disabled value={f.no} /></div>
        {sel('regulator', 'Regulator', REGULATORS)}
        {date('tglTemuan', 'Tanggal Temuan')}
        {sel('area', 'Area Temuan', AREAS)}
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_180px]">
          <div><label className="lbl">Penyebab Utama (Root Cause) *</label><input className="inp" disabled={lock('rootCause')} value={f.rootCause} onChange={(e) => set('rootCause', e.target.value)} />{errs.rootCause && <p className="err">{errs.rootCause}</p>}</div>
          {sel('rootType', 'Jenis Penyebab', ROOT_TYPES)}
        </div>
        <div>
          <label className="lbl">PIC *</label>
          <select className="inp" disabled={lock('pic')} value={f.pic} onChange={(e) => set('pic', e.target.value)}><option value="">Pilih...</option>{PIC_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          {errs.pic && <p className="err">{errs.pic}</p>}
        </div>
        {date('dueDate', 'Batas Waktu (Due Date)')}
        {sel('status', 'Status', mode === 'add' || OPEN_STATUS.includes(init.status) ? OPEN_STATUS : [init.status])}
        <div><label className="lbl">Persentase Progress (0-100) *</label><input type="number" min={0} max={100} className="inp" disabled={lock('progress')} value={f.progress} onChange={(e) => set('progress', e.target.value === '' ? NaN : Number(e.target.value))} />{errs.progress && <p className="err">{errs.progress}</p>}</div>
        {sel('unit', 'Unit Kerja', UNITS)}
        {sel('risiko', 'Tingkat Risiko', [...RISKS])}
        <div><label className="lbl">Validasi Ulang *</label><input className="inp" disabled value={f.validasi === 'Belum' ? 'Belum (diisi saat alur penutupan)' : `${f.validasi} - ${f.validasiOleh}, ${fmtDate(f.validasiTgl)}`} /></div>
        <div><label className="lbl">Persetujuan Penutupan *</label><input className="inp" disabled value={f.persetujuan === 'Menunggu' && !f.persetujuanOleh ? 'Menunggu (diisi Head CLRM)' : `${f.persetujuan} - ${f.persetujuanOleh}, ${fmtDate(f.persetujuanTgl)}`} /></div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between"><label className="lbl !mb-0">Rencana Tindak Lanjut & Bukti *</label>
          <button className="btn !py-1" onClick={() => set('tindak', [...f.tindak, { id: crypto.randomUUID(), text: '', files: [] }])}><Plus size={14} />Tambah item</button></div>
        <div className="space-y-2">
          {f.tindak.map((t, i) => (
            <div key={t.id} className="rounded border border-slate-200 p-2">
              <div className="flex gap-2">
                <input className="inp" placeholder="Rencana tindak lanjut" value={t.text} onChange={(e) => setTodo(i, { text: e.target.value })} />
                <button className="btn !px-2" aria-label="Hapus item" onClick={() => set('tindak', f.tindak.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                {t.files.map((n) => <span key={n} className="rounded bg-slate-100 px-2 py-0.5">{n} <button className="text-red-500" onClick={() => setTodo(i, { files: t.files.filter((x) => x !== n) })}>x</button></span>)}
                <label className="cursor-pointer text-brand">+ File bukti<input type="file" className="hidden" onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) setTodo(i, { files: [...t.files, n] }); e.target.value = '' }} /></label>
              </div>
            </div>
          ))}
        </div>
        {errs.tindak && <p className="err">{errs.tindak}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={submit}>Simpan</button></div>
    </Modal>
  )
}
