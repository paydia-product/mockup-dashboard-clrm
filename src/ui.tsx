import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'
import { AlertInfo, Status } from './lib'

const TONE = {
  red: 'border-red-300 text-red-600 bg-red-50',
  yellow: 'border-yellow-300 text-yellow-700 bg-yellow-50',
  blue: 'border-blue-300 text-blue-600 bg-blue-50',
  green: 'border-green-300 text-green-600 bg-green-50',
  gray: 'border-slate-300 text-slate-600 bg-slate-50',
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
        <Badge key={a.key} tone={a.color} title={`${a.label} (${a.detail}). Dikirim ke: ${a.to.join(', ')}`}>{a.label}</Badge>
      ))}
    </div>
  ) : <span className="text-slate-300">-</span>

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
