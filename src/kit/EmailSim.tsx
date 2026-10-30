import { fmtDate } from '../lib'
import { Modal } from '../ui'
import type { AlertDef, BaseRec, Ctx, PageConfig } from './types'

type Hit = { color: 'yellow' | 'red'; detail: string; to: string[] }
export function alertHits<T extends BaseRec>(cfg: PageConfig<T>, rows: T[], c: Ctx) {
  return cfg.alerts.flatMap((a) => rows.flatMap((r) => { const hit = a.check(r, c); return hit ? [{ a, r, hit }] : [] }))
}

export default function EmailSim<T extends BaseRec>({ cfg, rows, c, onClose }: { cfg: PageConfig<T>; rows: T[]; c: Ctx; onClose: () => void }) {
  // Maks 3 email per jenis alert: data yang cocok dulu, lalu satu contoh statis kalau kurang dari 3
  const mails = cfg.alerts.flatMap((a: AlertDef<T>) => {
    const real = rows.flatMap((r) => { const hit = a.check(r, c); return hit ? [{ a, r, hit, sample: false }] : [] }).slice(0, 3)
    if (real.length >= 3) return real
    const s = a.sample(c)
    return [...real, { a, r: s, hit: (a.check(s, c) ?? { color: 'yellow', detail: '', to: [] }) as Hit, sample: true }]
  })
  return (
    <Modal wide title={`Simulasi notifikasi email, hari ini ${fmtDate(c.today)}`} onClose={onClose}>
      <div className="max-h-[65vh] space-y-3 overflow-auto rounded-lg bg-slate-100 p-3">
        {mails.map((m, i) => (
          <div key={i} className={`rounded border border-slate-200 border-l-4 bg-white p-4 text-xs leading-relaxed text-slate-800 shadow-sm ${m.hit.color === 'red' ? '!border-l-red-500' : '!border-l-yellow-400'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`rounded px-2 py-0.5 font-medium ${m.hit.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>{m.hit.color === 'red' ? 'Merah' : 'Kuning'}</span>
              {m.sample && <span className="text-slate-400">Contoh statis (tidak ada data yang cocok hari ini)</span>}
            </div>
            <div><b>From:</b> noreply-clrm@paydia.co.id</div>
            <div><b>To:</b> {m.hit.to.join('; ') || '-'}</div>
            <div className="mb-2"><b>Subject:</b> [CLRM] {m.a.label}: {cfg.noun} {cfg.name?.(m.r)}</div>
            <div className="space-y-0.5 border-t pt-2">
              {cfg.columns.filter((col) => col.label !== 'No').slice(0, 6).map((col) => <div key={col.label}>{col.label}: {col.get(m.r, c) || '-'}</div>)}
              {m.hit.detail && <div>Keterangan: {m.hit.detail}</div>}
              <div className="pt-1 text-slate-500">Alasan notifikasi: {m.a.rule}</div>
            </div>
          </div>
        ))}
        {!mails.length && <div className="p-6 text-center text-slate-400">Halaman ini belum punya alert</div>}
      </div>
    </Modal>
  )
}
