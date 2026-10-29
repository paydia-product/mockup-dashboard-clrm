import { useState } from 'react'
import { AREAS, Finding, REGULATORS, RISKS, ROOT_TYPES, UNITS, fmtDate } from './lib'
import { FileField, Modal } from './ui'

type Errs = Partial<Record<string, string>>
const ADD_STATUS = ['Open', 'Proses', 'Menunggu Validasi']
const EDIT_STATUS = [...ADD_STATUS, 'Selesai']

export function validate(f: Finding, alasan = '', needAlasan = false): Errs {
  const e: Errs = {}
  const req = (k: keyof Finding, label: string) => { if (!String(f[k] ?? '').trim()) e[k] = `${label} wajib diisi` }
  req('regulator', 'Regulator'); req('tglTemuan', 'Tanggal Temuan'); req('area', 'Area Temuan'); req('rootCause', 'Penyebab Utama'); req('rootType', 'Jenis Penyebab')
  req('pic', 'PIC'); req('dueDate', 'Batas Waktu'); req('unit', 'Unit Kerja'); req('risiko', 'Tingkat Risiko'); req('status', 'Status')
  if (f.status === 'Selesai') { req('validasi', 'Validasi Ulang'); req('validasiOleh', 'Nama Validator') }
  if (f.dueDate && f.tglTemuan && f.dueDate < f.tglTemuan) e.dueDate = 'Batas Waktu tidak boleh sebelum Tanggal Temuan'
  if (!f.tindak.trim()) e.tindak = 'Rencana Tindak Lanjut wajib diisi'
  if (!f.tindakFile) e.tindakFile = 'File bukti tindak lanjut wajib diunggah'
  if (!f.suratFile) e.suratFile = 'Bukti Surat Regulator wajib diunggah'
  if (needAlasan && !alasan.trim()) e.alasan = 'Alasan wajib diisi jika batas waktu diubah'
  return e
}

const Sum = ({ l, children }: { l: string; children: React.ReactNode }) => <div><div className="text-xs text-slate-400">{l}</div><div className="text-slate-800">{children}</div></div>

export default function Form({ init, mode, prevReason = null, onSave, onClose }: { init: Finding; mode: 'add' | 'edit'; prevReason?: { alasan: string; tgl: string } | null; onSave: (f: Finding, alasan: string) => void; onClose: () => void }) {
  const [f, setF] = useState<Finding>(init)
  const [alasan, setAlasan] = useState(prevReason?.alasan ?? '')
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
    if (dueChanged && !e.alasan && prevReason && alasan.trim() === prevReason.alasan.trim()) e.alasan = 'Isi alasan baru untuk perubahan Batas Waktu'
    setErrs(e)
    if (!Object.keys(e).length) onSave(f, dueChanged ? alasan.trim() : '')
  }
  const files = (
    <>
      <div className="mt-4">
        <label className="lbl">Rencana Tindak Lanjut *</label>
        <textarea className="inp" rows={3} placeholder="Rencana tindak lanjut" value={f.tindak} onChange={(e) => set('tindak', e.target.value)} />
        {errs.tindak && <p className="err">{errs.tindak}</p>}
        <div className="mt-2"><FileField label="File bukti *" value={f.tindakFile} onChange={(m) => set('tindakFile', m)} error={errs.tindakFile} /></div>
      </div>
      <div className="mt-4"><FileField label="Bukti Surat Regulator *" value={f.suratFile} onChange={(m) => set('suratFile', m)} error={errs.suratFile} /></div>
    </>
  )
  const onStatus = (v: string) => setF((p) => ({ ...p, status: v as Finding['status'], ...(v === 'Selesai' ? { validasi: '' as never, validasiOleh: '' } : { validasi: init.validasi, validasiOleh: init.validasiOleh }) }))
  const statusField = (opts: string[]) => (
    <div>
      <label className="lbl">Status *</label>
      <select className="inp" value={f.status} onChange={(e) => onStatus(e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
      {errs.status && <p className="err">{errs.status}</p>}
    </div>
  )
  return (
    <Modal wide title={mode === 'add' ? 'Tambah Temuan Regulator' : `Ubah Temuan ${f.no}`} onClose={onClose}>
      {edit ? (
        <>
          <div className="grid grid-cols-2 gap-3 rounded bg-slate-50 p-3 text-xs sm:grid-cols-5">
            <Sum l="Nomor">{init.no}</Sum><Sum l="Regulator">{init.regulator}</Sum><Sum l="Area">{init.area}</Sum><Sum l="PIC">{init.pic}</Sum><Sum l="Status">{init.status}</Sum>
          </div>
          <p className="mt-2 text-xs text-slate-500">Perubahan lain tersimpan langsung. Mengubah status ke Selesai mengajukan penutupan temuan yang menunggu persetujuan Head CLRM.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {statusField(EDIT_STATUS)}
            {date('dueDate', 'Batas Waktu (Due Date)')}
          </div>
          {f.status === 'Selesai' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="lbl">Validasi Ulang *</label>
                <select className="inp" value={f.validasi} onChange={(e) => set('validasi', e.target.value as never)}><option value="">Pilih...</option>{['Belum', 'Valid', 'Tidak Valid'].map((o) => <option key={o}>{o}</option>)}</select>
                {errs.validasi && <p className="err">{errs.validasi}</p>}
              </div>
              <div>
                <label className="lbl">Nama Validator *</label>
                <input className="inp" value={f.validasiOleh} onChange={(e) => set('validasiOleh', e.target.value)} />
                {errs.validasiOleh && <p className="err">{errs.validasiOleh}</p>}
              </div>
            </div>
          )}
          <div className="mt-3">
            <label className="lbl">Alasan perubahan Batas Waktu{dueChanged ? ' *' : ''}</label>
            <textarea className="inp" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
            {errs.alasan && <p className="err">{errs.alasan}</p>}
            {prevReason && <p className="mt-1 text-xs text-slate-400">Alasan terakhir: {fmtDate(prevReason.tgl)}</p>}
            {dueChanged && <p className="mt-1 text-xs text-slate-400">Batas waktu dari {fmtDate(init.dueDate)} menjadi {fmtDate(f.dueDate)}</p>}
          </div>
          {files}
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {sel('regulator', 'Regulator', REGULATORS)}
            {date('tglTemuan', 'Tanggal Temuan')}
            {sel('area', 'Area Temuan', AREAS)}
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_180px]">
              <div><label className="lbl">Penyebab Utama (Root Cause) *</label><input className="inp" value={f.rootCause} onChange={(e) => set('rootCause', e.target.value)} />{errs.rootCause && <p className="err">{errs.rootCause}</p>}</div>
              {sel('rootType', 'Jenis Penyebab', ROOT_TYPES)}
            </div>
            <div>
              <label className="lbl">PIC *</label>
              <input className="inp" value={f.pic} onChange={(e) => set('pic', e.target.value)} />
              {errs.pic && <p className="err">{errs.pic}</p>}
            </div>
            {date('dueDate', 'Batas Waktu (Due Date)')}
            {statusField(ADD_STATUS)}
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
