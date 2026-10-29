import { useState } from 'react'
import { AREAS, Finding, PIC_USERS, REGULATORS, RISKS, ROOT_TYPES, UNITS, fmtDate, userName } from './lib'
import { FileField, Modal } from './ui'

type Errs = Partial<Record<string, string>>
const OPEN_STATUS = ['Open', 'Proses']

export function validate(f: Finding, alasan = '', needAlasan = false): Errs {
  const e: Errs = {}
  const req = (k: keyof Finding, label: string) => { if (!String(f[k] ?? '').trim()) e[k] = `${label} wajib diisi` }
  req('regulator', 'Regulator'); req('tglTemuan', 'Tanggal Temuan'); req('area', 'Area Temuan'); req('rootCause', 'Penyebab Utama'); req('rootType', 'Jenis Penyebab')
  req('pic', 'PIC'); req('dueDate', 'Batas Waktu'); req('unit', 'Unit Kerja'); req('risiko', 'Tingkat Risiko'); req('status', 'Status')
  if (f.dueDate && f.tglTemuan && f.dueDate < f.tglTemuan) e.dueDate = 'Batas Waktu tidak boleh sebelum Tanggal Temuan'
  if (!(f.progress >= 0 && f.progress <= 100) || Number.isNaN(f.progress)) e.progress = 'Progress harus 0 sampai 100'
  if (!f.tindak.trim()) e.tindak = 'Rencana Tindak Lanjut wajib diisi'
  if (!f.suratFile) e.suratFile = 'Bukti Surat Regulator wajib diunggah'
  if (needAlasan && !alasan.trim()) e.alasan = 'Alasan perubahan batas waktu wajib diisi'
  return e
}

const Sum = ({ l, children }: { l: string; children: React.ReactNode }) => <div><div className="text-xs text-slate-400">{l}</div><div className="text-slate-800">{children}</div></div>

export default function Form({ init, mode, onSave, onClose }: { init: Finding; mode: 'add' | 'edit'; onSave: (f: Finding, alasan: string) => void; onClose: () => void }) {
  const [f, setF] = useState<Finding>(init)
  const [alasan, setAlasan] = useState('')
  const [errs, setErrs] = useState<Errs>({})
  const edit = mode === 'edit'
  const dueChanged = edit && f.dueDate !== init.dueDate
  const set = <K extends keyof Finding>(k: K, v: Finding[K]) => setF((p) => ({ ...p, [k]: v }))
  const sel = (k: keyof Finding, label: string, opts: string[]) => (
    <div>
      <label className="lbl">{label} *</label>
      <select className="inp" value={String(f[k])} onChange={(e) => set(k, e.target.value as never)}>
        <option value="">Pilih...</option>{opts.map((o) => <option key={o}>{o}</option>)}
      </select>
      {errs[k] && <p className="err">{errs[k]}</p>}
    </div>
  )
  const date = (k: 'tglTemuan' | 'dueDate', label: string) => (
    <div>
      <label className="lbl">{label} *</label>
      <input type="date" className="inp" value={f[k]} onChange={(e) => set(k, e.target.value)} />
      {errs[k] && <p className="err">{errs[k]}</p>}
    </div>
  )
  const submit = () => {
    const e = validate(f, alasan, dueChanged)
    setErrs(e)
    if (!Object.keys(e).length) onSave({ ...f, progress: Number(f.progress) }, dueChanged ? alasan.trim() : '')
  }
  const files = (
    <>
      <div className="mt-4">
        <label className="lbl">Rencana Tindak Lanjut & Bukti *</label>
        <textarea className="inp" rows={3} placeholder="Rencana tindak lanjut" value={f.tindak} onChange={(e) => set('tindak', e.target.value)} />
        {errs.tindak && <p className="err">{errs.tindak}</p>}
        <div className="mt-2"><FileField label="File bukti" value={f.tindakFile} onChange={(m) => set('tindakFile', m)} /></div>
      </div>
      <div className="mt-4"><FileField label="Bukti Surat Regulator *" value={f.suratFile} onChange={(m) => set('suratFile', m)} error={errs.suratFile} /></div>
    </>
  )
  const progress = (
    <div><label className="lbl">Persentase Progress (0-100) *</label><input type="number" min={0} max={100} className="inp" value={f.progress} onChange={(e) => set('progress', e.target.value === '' ? NaN : Number(e.target.value))} />{errs.progress && <p className="err">{errs.progress}</p>}</div>
  )
  return (
    <Modal wide title={mode === 'add' ? 'Tambah Temuan Regulator' : `Ubah Temuan ${f.no}`} onClose={onClose}>
      {edit ? (
        <>
          <div className="grid grid-cols-2 gap-3 rounded bg-slate-50 p-3 text-xs sm:grid-cols-5">
            <Sum l="Nomor">{init.no}</Sum><Sum l="Regulator">{init.regulator}</Sum><Sum l="Area">{init.area}</Sum><Sum l="PIC">{userName(init.pic)}</Sum><Sum l="Status">{init.status}</Sum>
          </div>
          <p className="mt-2 text-xs text-slate-500">Menutup temuan butuh Validasi Ulang dan persetujuan Head CLRM.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {progress}
            {date('dueDate', 'Batas Waktu (Due Date)')}
          </div>
          {dueChanged && (
            <div className="mt-3">
              <label className="lbl">Alasan perubahan batas waktu *</label>
              <textarea className="inp" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
              {errs.alasan && <p className="err">{errs.alasan}</p>}
              <p className="mt-1 text-xs text-slate-400">Dari {fmtDate(init.dueDate)} menjadi {fmtDate(f.dueDate)}</p>
            </div>
          )}
          {files}
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="lbl">Nomor Temuan *</label><input className="inp" disabled value={f.no} /></div>
            {sel('regulator', 'Regulator', REGULATORS)}
            {date('tglTemuan', 'Tanggal Temuan')}
            {sel('area', 'Area Temuan', AREAS)}
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_180px]">
              <div><label className="lbl">Penyebab Utama (Root Cause) *</label><input className="inp" value={f.rootCause} onChange={(e) => set('rootCause', e.target.value)} />{errs.rootCause && <p className="err">{errs.rootCause}</p>}</div>
              {sel('rootType', 'Jenis Penyebab', ROOT_TYPES)}
            </div>
            <div>
              <label className="lbl">PIC *</label>
              <select className="inp" value={f.pic} onChange={(e) => set('pic', e.target.value)}><option value="">Pilih...</option>{PIC_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              {errs.pic && <p className="err">{errs.pic}</p>}
            </div>
            {date('dueDate', 'Batas Waktu (Due Date)')}
            {sel('status', 'Status', OPEN_STATUS)}
            {progress}
            {sel('unit', 'Unit Kerja', UNITS)}
            {sel('risiko', 'Tingkat Risiko', [...RISKS])}
          </div>
          {files}
        </>
      )}
      <div className="mt-5 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={submit}>Simpan</button></div>
    </Modal>
  )
}
