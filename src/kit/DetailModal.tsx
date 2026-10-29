import { FileText } from 'lucide-react'
import { fmtDate, fmtSize, fmtTime } from '../lib'
import { Badge, Modal } from '../ui'
import { fmtValue, isMasked, maskStr } from './fmt'
import type { AlertDef, ApprovalReq, BaseRec, Ctx, Field, FileMeta, PageConfig } from './types'

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const Row = ({ l, wide, children }: { l: string; wide?: boolean; children: React.ReactNode }) => (
  <div className={wide ? 'col-span-2' : ''}><div className="text-xs text-slate-400">{l}</div><div className="mt-0.5 whitespace-pre-wrap text-slate-800">{children}</div></div>
)
const Dash = <span className="text-slate-400">-</span>

function Value({ f, r, c }: { f: Field<any>; r: R; c: Ctx }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const v = f.auto ? f.auto(r, c) : r[f.key]
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return Dash
  if (isMasked(f, c)) return <>{maskStr(String(v))}</>
  if (f.type === 'file') { const m = v as FileMeta; return <span className="inline-flex items-center gap-1 text-brand"><FileText size={12} />{m.name} ({fmtSize(m.size)})</span> }
  if (f.type === 'list' && f.sub) {
    return (
      <table className="w-full text-xs"><thead className="bg-slate-100"><tr>{f.sub.map((s) => <th key={s.key} className="px-2 py-1 text-left font-semibold">{s.label}</th>)}</tr></thead>
        <tbody>{(v as R[]).map((it, i) => <tr key={i} className="border-t">{f.sub!.map((s) => <td key={s.key} className="px-2 py-1">{s.type === 'file' ? (it[s.key] as FileMeta | null)?.name ?? '-' : fmtValue(s, it[s.key], c) || '-'}</td>)}</tr>)}</tbody></table>
    )
  }
  if (f.type === 'checklist') return <>{(f.sub ?? []).map((s) => <div key={s.key}>{v[s.key] ? '✓' : '✗'} {s.label}</div>)}</>
  return <>{fmtValue(f, v, c)}</>
}

export default function DetailModal<T extends BaseRec>({ cfg, r, c, alerts, pending, onClose }: { cfg: PageConfig<T>; r: T; c: Ctx; alerts: { a: AlertDef<T>; hit: { color: 'yellow' | 'red'; detail: string; to: string[] } }[]; pending?: ApprovalReq; onClose: () => void }) {
  return (
    <Modal wide title="Detail" onClose={onClose}>
      <div className="space-y-4">
        {alerts.length > 0 && <div className="flex flex-wrap gap-1.5">{alerts.map(({ a, hit }) => <Badge key={a.key} tone={hit.color} title={`${a.label} (${hit.detail}). Dikirim ke: ${hit.to.join(', ')}`}>{a.label}: {hit.detail}</Badge>)}</div>}
        {pending && (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-xs">
            <div className="font-semibold text-yellow-800">Menunggu persetujuan {pending.approver}</div>
            <div className="text-slate-600">{pending.jenis}, diajukan oleh {pending.by}, {fmtTime(pending.time)}. <a className="text-brand underline" href={`#/approval?id=${pending.id}`}>Lihat di menu Approval</a></div>
          </div>
        )}
        {r.cancelled && (
          <div className="rounded border border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
            Dibatalkan oleh {r.cancelled.by}, {fmtDate(r.cancelled.at.slice(0, 10))}. Alasan: {r.cancelled.reason}. Status sebelumnya: {r.cancelled.prev}.
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Row l="No">{r.no}</Row>
          {cfg.fields.filter((f) => f.key !== 'no' && (!f.showIf || f.showIf(r))).map((f) => (
            <Row key={f.key} l={f.label} wide={f.wide ?? ['textarea', 'list', 'checklist', 'multiselect'].includes(f.type)}><Value f={f} r={r} c={c} /></Row>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-end border-t pt-3"><button className="btn" onClick={onClose}>Tutup</button></div>
    </Modal>
  )
}
