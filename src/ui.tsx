import { ReactNode, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { AlertInfo, FILE_ACCEPT, FileMeta, Status, fmtSize, validateFile } from './lib'

const TONE = {
  red: 'border-red-300 text-red-600 bg-red-50',
  yellow: 'border-yellow-300 text-yellow-700 bg-yellow-50',
  blue: 'border-blue-300 text-blue-600 bg-blue-50',
  green: 'border-green-300 text-green-600 bg-green-50',
  gray: 'border-slate-300 text-slate-600 bg-slate-50',
  orange: 'border-orange-300 text-orange-600 bg-orange-50',
}
export type Tone = keyof typeof TONE
export const Badge = ({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) => (
  <span title={title} className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>
)
const ST: Record<Status, Tone> = { Open: 'blue', Proses: 'yellow', 'Menunggu Validasi': 'yellow', Selesai: 'green', Dibatalkan: 'gray' }
export const StatusBadge = ({ s }: { s: Status }) => <Badge tone={ST[s]}>{s}</Badge>
export const RiskBadge = ({ r }: { r: string }) => <Badge tone={r === 'High' ? 'red' : r === 'Medium' ? 'yellow' : 'green'}>{r}</Badge>
export const AlertBadges = ({ list }: { list: AlertInfo[] }) =>
  list.length ? (
    <div className="flex flex-col items-start gap-1">
      {list.map((a) => (
        <Badge key={a.key} tone={a.color} title={`${a.label} (${a.detail}). Penerima notifikasi: ${a.to.join(', ')}`}>{a.label}</Badge>
      ))}
    </div>
  ) : <span className="text-slate-300">-</span>

// Satu file saja: pilih baru = ganti, tombol x = hapus, drop >1 file ditolak. Hanya metadata yang disimpan.
export function FileField({ label, value, onChange, error }: { label: string; value: FileMeta | null; onChange: (m: FileMeta | null) => void; error?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState('')
  const [drag, setDrag] = useState(false)
  const take = (files: FileList | File[] | null | undefined) => {
    if (!files || !files.length) return
    if (files.length > 1) return setLocal('Hanya boleh 1 file')
    const f = files[0]
    const err = validateFile(f)
    setLocal(err ?? '')
    if (!err) onChange({ name: f.name, size: f.size, type: f.type })
  }
  const msg = local || error
  return (
    <div>
      <label className="lbl">{label}</label>
      <div
        className={`rounded border border-dashed p-2 text-xs ${drag ? 'border-brand bg-blue-50' : 'border-slate-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files) }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn !py-1" onClick={() => ref.current?.click()}><Upload size={13} />{value ? 'Ganti file' : 'Pilih file'}</button>
          {value && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5">
              {value.name} ({fmtSize(value.size)})
              <button type="button" className="text-red-500" aria-label="Hapus file" onClick={() => { onChange(null); setLocal('') }}><X size={12} /></button>
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-400">PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file.</p>
        <input ref={ref} type="file" className="hidden" accept={FILE_ACCEPT} onChange={(e) => { take(e.target.files); e.target.value = '' }} />
      </div>
      {msg && <p className="err">{msg}</p>}
    </div>
  )
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className={`max-h-[90vh] w-full overflow-auto rounded-lg bg-white shadow-xl ${wide ? 'max-w-3xl' : 'max-w-md'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ReasonModal({ title, label = 'Alasan', onConfirm, onClose, danger }: { title: string; label?: string; onConfirm: (reason: string) => void; onClose: () => void; danger?: boolean }) {
  const [v, setV] = useState('')
  const [err, setErr] = useState(false)
  return (
    <Modal title={title} onClose={onClose}>
      <label className="lbl">{label} *</label>
      <textarea className="inp" rows={3} value={v} onChange={(e) => { setV(e.target.value); setErr(false) }} autoFocus />
      {err && <p className="err">{label} wajib diisi.</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Batal</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => (v.trim() ? onConfirm(v.trim()) : setErr(true))}>Konfirmasi</button>
      </div>
    </Modal>
  )
}
