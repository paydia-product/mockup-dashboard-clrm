import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FileField, Modal } from '../ui'
import type { BaseRec, Ctx, Field, PageConfig } from './types'

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Mode = 'add' | 'edit'
export const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)
const isReq = (f: Field<any>, r: R, c: Ctx) => (typeof f.required === 'function' ? f.required(r, c) : !!f.required) // eslint-disable-line @typescript-eslint/no-explicit-any
const opts = (f: Field<any>, c: Ctx) => (typeof f.options === 'function' ? f.options(c) : f.options ?? []) // eslint-disable-line @typescript-eslint/no-explicit-any
const WIDE = ['textarea', 'list', 'checklist', 'multiselect', 'file']
export const fieldsFor = <T extends BaseRec>(cfg: PageConfig<T>, mode: Mode) =>
  cfg.fields.filter((f) => f.key !== 'no' && !f.auto && (f.inForm ?? 'both') !== 'none' && ((f.inForm ?? 'both') === 'both' || f.inForm === mode))

// Validasi bersama form dan import. skipFile: import tidak membawa file.
export function validateRecord<T extends BaseRec>(cfg: PageConfig<T>, r: R, mode: Mode, c: Ctx, skipFile = false): Record<string, string> {
  const e: Record<string, string> = {}
  for (const f of fieldsFor(cfg, mode)) {
    if (f.showIf && !f.showIf(r as T)) continue
    const v = r[f.key]
    if (skipFile && f.type === 'file') continue
    if (isReq(f, r, c) && isEmpty(v)) e[f.key] = `${f.label} wajib diisi`
    else if (['number', 'money', 'percent'].includes(f.type) && !isEmpty(v) && (typeof v !== 'number' || isNaN(v))) e[f.key] = `${f.label} harus berupa angka`
    else if (f.type === 'percent' && !isEmpty(v) && (v < 0 || v > 100)) e[f.key] = `${f.label} harus 0 sampai 100`
    if (f.type === 'list') (v ?? []).forEach((it: R, i: number) => f.sub?.forEach((s) => { if (isReq(s, it, c) && isEmpty(it[s.key])) e[`${f.key}.${i}.${s.key}`] = `${s.label} wajib diisi` }))
  }
  for (const [k, m] of Object.entries(cfg.validate?.(r as T, mode, c) ?? {})) if (!e[k]) e[k] = m
  return e
}

function Input({ f, v, set, c, err, off }: { f: Field<any>; v: any; set: (v: unknown) => void; c: Ctx; err?: string; off?: boolean }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const o = opts(f, c)
  switch (f.type) {
    case 'textarea': return <textarea className="inp" rows={3} value={v ?? ''} disabled={off} onChange={(e) => set(e.target.value)} />
    case 'number': case 'money': case 'percent':
      return (
        <div className="flex items-center gap-1">
          {f.type === 'money' && <span className="text-xs text-slate-500">Rp</span>}
          <input type="number" className="inp" value={v ?? ''} disabled={off} min={f.type === 'percent' ? 0 : undefined} onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))} />
          {f.type === 'percent' && <span className="text-xs text-slate-500">%</span>}
        </div>
      )
    case 'date': return <input type="date" className="inp" value={v ?? ''} disabled={off} onChange={(e) => set(e.target.value)} />
    case 'datetime': return <input type="datetime-local" className="inp" value={(v ?? '').slice(0, 16)} disabled={off} onChange={(e) => set(e.target.value)} />
    case 'select': case 'yesno':
      return <select className="inp" value={v ?? ''} disabled={off} onChange={(e) => set(e.target.value)}><option value="">Pilih...</option>{(f.type === 'yesno' ? ['Ya', 'Tidak'] : o).map((x) => <option key={x}>{x}</option>)}</select>
    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {o.map((x) => <label key={x} className="flex items-center gap-1.5"><input type="checkbox" disabled={off} checked={(v ?? []).includes(x)} onChange={(e) => set(e.target.checked ? [...(v ?? []), x] : (v ?? []).filter((y: string) => y !== x))} />{x}</label>)}
          {!o.length && <span className="text-slate-400">Belum ada pilihan</span>}
        </div>
      )
    case 'checklist':
      return <div className="flex flex-wrap gap-x-4 gap-y-1">{(f.sub ?? []).map((s) => <label key={s.key} className="flex items-center gap-1.5"><input type="checkbox" disabled={off} checked={!!v?.[s.key]} onChange={(e) => set({ ...(v ?? {}), [s.key]: e.target.checked })} />{s.label}</label>)}</div>
    case 'file': return <FileField label="" value={v ?? null} onChange={set} error={err} />
    default: return <input className="inp" value={v ?? ''} disabled={off} onChange={(e) => set(e.target.value)} />
  }
}

export default function FormModal<T extends BaseRec>({ cfg, mode, init, c, onSave, onClose }: { cfg: PageConfig<T>; mode: Mode; init: R; c: Ctx; onSave: (r: R, alasan: string) => void; onClose: () => void }) {
  const [r, setR] = useState<R>(init)
  const [alasan, setAlasan] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const edit = mode === 'edit'
  const fields = fieldsFor(cfg, mode)
  const need = edit ? fields.filter((f) => f.reasonOnChange && !isEmpty(init[f.key]) && JSON.stringify(init[f.key]) !== JSON.stringify(r[f.key])) : []
  const set = (k: string, v: unknown) => setR((p) => ({ ...p, [k]: v }))
  const submit = () => {
    const e = validateRecord(cfg, r, mode, c)
    if (need.length && !alasan.trim()) e.alasan = `Alasan wajib diisi jika ${need.map((f) => f.label).join(', ')} diubah`
    setErrs(e)
    if (!Object.keys(e).length) onSave(r, alasan.trim())
  }
  const editable = (f: Field<any>) => !edit || !f.editableBy || f.editableBy(c, init as T) // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <Modal wide title={edit ? `Ubah ${cfg.noun} ${init.no}` : `Tambah ${cfg.noun}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.filter((f) => !f.showIf || f.showIf(r as T)).map((f) => {
          const req = isReq(f, r, c)
          const wide = f.wide ?? WIDE.includes(f.type)
          const list = r[f.key] as R[] | undefined
          return (
            <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
              {f.type === 'file' ? <FileField label={f.label + (req ? ' *' : '')} value={r[f.key] ?? null} onChange={(m) => set(f.key, m)} error={errs[f.key]} /> : (
                <>
                  <label className="lbl">{f.label}{req ? ' *' : ''}</label>
                  {f.type === 'list' ? (
                    <div className="space-y-2">
                      {(list ?? []).map((it, i) => (
                        <div key={i} className="rounded border border-slate-200 p-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {f.sub?.map((s) => (
                              <div key={s.key} className={s.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                <label className="lbl">{s.label}{isReq(s, it, c) ? ' *' : ''}</label>
                                <Input f={s} v={it[s.key]} c={c} set={(v) => set(f.key, (list ?? []).map((x, j) => (j === i ? { ...x, [s.key]: v } : x)))} />
                                {errs[`${f.key}.${i}.${s.key}`] && <p className="err">{errs[`${f.key}.${i}.${s.key}`]}</p>}
                              </div>
                            ))}
                          </div>
                          <button type="button" className="btn mt-2 !py-1 text-red-600" onClick={() => set(f.key, (list ?? []).filter((_, j) => j !== i))}><Trash2 size={13} />Hapus item</button>
                        </div>
                      ))}
                      <button type="button" className="btn !py-1" onClick={() => set(f.key, [...(list ?? []), Object.fromEntries((f.sub ?? []).map((s) => [s.key, s.type === 'multiselect' ? [] : s.type === 'checklist' ? {} : s.type === 'file' ? null : '']))])}><Plus size={13} />Tambah item</button>
                    </div>
                  ) : <Input f={f} v={r[f.key]} c={c} set={(v) => set(f.key, v)} off={!editable(f)} />}
                  {f.help && <p className="mt-0.5 text-xs text-slate-400">{f.help}</p>}
                  {errs[f.key] && <p className="err">{errs[f.key]}</p>}
                </>
              )}
            </div>
          )
        })}
      </div>
      {edit && (
        <div className="mt-3">
          <label className="lbl">Alasan perubahan{need.length ? ' *' : ''}</label>
          <textarea className="inp" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
          {errs.alasan && <p className="err">{errs.alasan}</p>}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={submit}>Simpan</button></div>
    </Modal>
  )
}
