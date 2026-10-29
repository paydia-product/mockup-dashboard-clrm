import { useEffect, useState } from 'react'
import { Save, SlidersHorizontal, Trash2 } from 'lucide-react'
import type { Ctx, FilterDef, SavedFilter } from './types'

type V = Record<string, unknown>
export default function FilterPopover<T>({ defs, rows, c, value, onApply, onClear, saved, onSave, onDelete }: {
  defs: FilterDef<T>[]; rows: T[]; c: Ctx; value: V; onApply: (v: V) => void; onClear: () => void
  saved: SavedFilter[]; onSave: (name: string, v: V) => void; onDelete: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<V>(value)
  const [name, setName] = useState('')
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [open])
  const range = (k: string): [string, string] => (draft[k] as [string, string]) ?? ['', '']
  return (
    <div className="relative">
      <button className="btn btn-primary" onClick={() => { setDraft(value); setOpen(!open) }}><SlidersHorizontal size={14} />Filter</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-50 max-h-[80vh] w-[380px] max-w-[92vw] overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="space-y-4">
              {defs.map((d) => (
                <div key={d.key}>
                  <label className="lbl">{d.label}</label>
                  {d.type === 'daterange' ? (
                    <div className="flex items-center gap-2">
                      <input type="date" className="inp" value={range(d.key)[0]} onChange={(e) => setDraft({ ...draft, [d.key]: [e.target.value, range(d.key)[1]] })} /><span>-</span>
                      <input type="date" className="inp" value={range(d.key)[1]} onChange={(e) => setDraft({ ...draft, [d.key]: [range(d.key)[0], e.target.value] })} />
                    </div>
                  ) : (
                    <select className="inp" value={(draft[d.key] as string) ?? ''} onChange={(e) => setDraft({ ...draft, [d.key]: e.target.value })}>
                      <option value="">Pilih {d.label}</option>
                      {(typeof d.options === 'function' ? d.options(rows, c) : d.options ?? []).map((o) => <option key={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3">
              <div className="flex gap-2">
                <input className="inp" placeholder="Nama filter" value={name} onChange={(e) => setName(e.target.value)} />
                <button className="btn whitespace-nowrap" disabled={!name.trim()} onClick={() => { onSave(name.trim(), draft); setName('') }}><Save size={14} />Simpan Filter</button>
              </div>
              {saved.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {saved.map((sv) => (
                    <span key={sv.name} className="inline-flex items-center overflow-hidden rounded border border-slate-300 text-xs">
                      <button className="px-2 py-1 hover:bg-slate-50" onClick={() => { setDraft(sv.filter); onApply(sv.filter); setOpen(false) }}>{sv.name}</button>
                      <button className="border-l px-1.5 py-1 text-red-500 hover:bg-red-50" aria-label={`Hapus ${sv.name}`} onClick={() => onDelete(sv.name)}><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => { setDraft({}); onClear() }}>Clear All</button>
              <button className="flex-1 rounded-full bg-[#1f2ab5] py-2 text-sm font-medium text-white hover:bg-[#18228f]" onClick={() => { onApply(draft); setOpen(false) }}>Apply Filters</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
