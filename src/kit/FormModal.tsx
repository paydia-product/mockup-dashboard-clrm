import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { FileField, Modal } from '../ui'
import { maskStr } from './fmt'
import { MultiOther, OTHER_ERR, SelectOther } from './Lainnya'
import Reveal from './Reveal'
import type { BaseRec, Ctx, Field, PageConfig } from './types'

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Mode = 'add' | 'edit'
export const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)
export const isReq = (f: Field<any>, r: R, c: Ctx, mode?: 'add' | 'edit' | 'import') => (typeof f.required === 'function' ? f.required(r, c, mode) : !!f.required) // eslint-disable-line @typescript-eslint/no-explicit-any
const opts = (f: Field<any>, c: Ctx) => (typeof f.options === 'function' ? f.options(c) : f.options ?? []) // eslint-disable-line @typescript-eslint/no-explicit-any
// select dengan semua opsi angka (mis. skor 1-3) disimpan sebagai number
export const numericOpts = (o: string[]) => o.length > 0 && o.every((x) => x.trim() !== '' && !isNaN(Number(x)))
const WIDE = ['textarea', 'list', 'checklist', 'multiselect', 'multidrop', 'file']
export const fieldsFor = <T extends BaseRec>(cfg: PageConfig<T>, mode: Mode) =>
  cfg.fields.filter((f) => f.key !== 'no' && !f.auto && (f.inForm ?? 'both') !== 'none' && ((f.inForm ?? 'both') === 'both' || f.inForm === mode))

// Validasi bersama form dan import. skipFile: import tidak membawa file.
export function validateRecord<T extends BaseRec>(cfg: PageConfig<T>, r: R, mode: Mode, c: Ctx, skipFile = false, skipKeys: string[] = [], imp = false): Record<string, string> {
  const rm = imp ? 'import' : mode
  const e: Record<string, string> = {}
  for (const f of fieldsFor(cfg, mode)) {
    if (f.showIf && !f.showIf(r as T)) continue
    if (skipKeys.includes(f.key)) continue
    const v = r[f.key]
    if (skipFile && f.type === 'file') continue
    if (isReq(f, r, c, rm) && isEmpty(v)) e[f.key] = `${f.label} wajib diisi`
    else if (['number', 'money', 'percent'].includes(f.type) && !isEmpty(v) && (typeof v !== 'number' || isNaN(v))) e[f.key] = `${f.label} harus berupa angka`
    else if (f.type === 'percent' && !isEmpty(v) && (v < 0 || v > 100)) e[f.key] = `${f.label} harus 0 sampai 100`
    if (f.type === 'list') (v ?? []).forEach((it: R, i: number) => f.sub?.forEach((s) => { if (isReq(s, it, c) && isEmpty(it[s.key])) e[`${f.key}.${i}.${s.key}`] = `${s.label} wajib diisi` }))
  }
  for (const [k, m] of Object.entries(cfg.validate?.(r as T, mode, c) ?? {})) if (!e[k] && !skipKeys.includes(k.split('.')[0])) e[k] = m
  return e
}

// Mode Edit: item list yang terkunci dikembalikan ke nilai tersimpan (penegakan saat simpan)
function lockList(f: Field<any>, cur: R[], base: R[], c: Ctx): R[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const ed = (it: R) => !f.itemEditableBy || f.itemEditableBy(c, it)
  const frozen = (b: R) => (f.sub ?? []).filter((s) => s.editableBy && !s.editableBy(c, b)).map((s) => s.key)
  let out: R[]
  if (f.listLocked?.(c)) out = base.map((b, i) => (cur[i] && ed(b) ? { ...cur[i], ...Object.fromEntries(frozen(b).map((k) => [k, b[k]])) } : b))
  else {
    out = cur.slice()
    base.filter((b) => !ed(b)).forEach((b) => { if (!out.some((x) => JSON.stringify(x) === JSON.stringify(b))) out.push(b) })
  }
  return out
}

// Dropdown pilih banyak: pilihan yang dipilih tampil sebagai chip dengan tombol hapus
function MultiDrop({ value, options, set, off }: { value: string[]; options: string[]; set: (v: string[]) => void; off?: boolean }) {
  const arr = value ?? []
  return (
    <div>
      <select className="inp" value="" disabled={off} onChange={(e) => e.target.value && set([...arr, e.target.value])}>
        <option value="">{options.length ? 'Pilih...' : 'Belum ada pilihan'}</option>{options.filter((x) => !arr.includes(x)).map((x) => <option key={x}>{x}</option>)}
      </select>
      {arr.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {arr.map((x) => (
            <span key={x} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-300 bg-slate-50 py-0.5 pl-2.5 pr-1 text-xs">
              <span className="truncate">{x}</span>
              {!off && <button type="button" className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200" aria-label={`Hapus ${x}`} onClick={() => set(arr.filter((y) => y !== x))}><X size={12} /></button>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Input({ f, v, set, c, err, off, pend }: { f: Field<any>; v: any; set: (v: unknown) => void; c: Ctx; err?: string; off?: boolean; pend?: (b: boolean) => void }) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      if (f.type === 'select' && !numericOpts(o)) return <SelectOther value={v} options={o} off={off} extra set={set} onPending={pend} />
      return <select className="inp" value={v ?? ''} disabled={off} onChange={(e) => set(numericOpts(o) && e.target.value !== '' ? Number(e.target.value) : e.target.value)}><option value="">Pilih...</option>{(f.type === 'yesno' ? ['Ya', 'Tidak'] : o).map((x) => <option key={x}>{x}</option>)}</select>
    case 'multidrop': return <MultiDrop value={v ?? []} options={o} off={off} set={set} />
    case 'multiselect': return <MultiOther value={v ?? []} options={o} off={off} set={set} onPending={pend} />
    case 'checklist':
      return <div className="flex flex-wrap gap-x-4 gap-y-1">{(f.sub ?? []).map((s) => <label key={s.key} className="flex items-center gap-1.5"><input type="checkbox" disabled={off} checked={!!v?.[s.key]} onChange={(e) => set({ ...(v ?? {}), [s.key]: e.target.checked })} />{s.label}</label>)}</div>
    case 'file': return <FileField label="" value={v ?? null} onChange={set} error={err} />
    default: return <input className="inp" value={v ?? ''} disabled={off} onChange={(e) => set(e.target.value)} />
  }
}

export default function FormModal<T extends BaseRec>({ cfg, mode, init, norm, c, onSave, onClose }: { cfg: PageConfig<T>; mode: Mode; init: R; norm?: R; c: Ctx; onSave: (r: R, alasan: string) => void; onClose: () => void }) {
  const [r, setR] = useState<R>(init)
  const [alasan, setAlasan] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [rev, setRev] = useState<Record<string, boolean>>({}) // tombol mata: field reveal yang sensornya dibuka
  const pend = (k: string) => (b: boolean) => setPending((p) => (!!p[k] === b ? p : { ...p, [k]: b }))
  const edit = mode === 'edit'
  const fields = fieldsFor(cfg, mode)
  const need = edit ? fields.filter((f) => f.reasonOnChange && !isEmpty(init[f.key]) && JSON.stringify(init[f.key]) !== JSON.stringify(r[f.key])) : []
  const set = (k: string, v: unknown) => setR((p) => { const n = { ...p, [k]: v }; return cfg.onChange ? (cfg.onChange(n as T, k, p as T) as R) : n })
  const editable = (f: Field<any>) => !edit || !f.editableBy || f.editableBy(c, init as T) // eslint-disable-line @typescript-eslint/no-explicit-any
  const masked = (f: Field<any>) => edit && !!f.mask?.(c) // eslint-disable-line @typescript-eslint/no-explicit-any
  const locked = (f: Field<any>) => masked(f) || !editable(f) // eslint-disable-line @typescript-eslint/no-explicit-any
  const canRev = (f: Field<any>) => edit && !f.mask?.(c) && !!f.reveal?.(c) && editable(f) // eslint-disable-line @typescript-eslint/no-explicit-any
  const soft = (f: Field<any>) => canRev(f) && !rev[f.key] // eslint-disable-line @typescript-eslint/no-explicit-any
  const lockedKeys = fields.filter(locked).map((f) => f.key)
  const submit = () => {
    const e = validateRecord(cfg, r, mode, c, false, lockedKeys)
    for (const [k, b] of Object.entries(pending)) if (b) e[k] = OTHER_ERR
    if (need.length && !alasan.trim()) e.alasanUbah = `Alasan wajib diisi jika ${need.map((f) => f.label).join(', ')} diubah`
    setErrs(e)
    if (Object.keys(e).length) return
    const out: R = { ...r, ...Object.fromEntries(lockedKeys.map((k) => [k, init[k]])) }
    if (edit) for (const f of fields) if (f.type === 'list' && (f.itemEditableBy || f.listLocked) && !lockedKeys.includes(f.key)) out[f.key] = lockList(f, r[f.key] ?? [], init[f.key] ?? [], c)
    onSave(out, alasan.trim()) // field terkunci/disamarkan tidak pernah ditulis ulang
  }
  return (
    <Modal wide title={edit ? `Ubah ${cfg.noun}${cfg.name?.(init as T) ? ` ${cfg.name(init as T)}` : ''}` : `Tambah ${cfg.noun}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.filter((f) => !f.showIf || f.showIf(r as T)).map((f) => {
          const req = isReq(f, r, c)
          const wide = f.wide ?? WIDE.includes(f.type)
          const list = r[f.key] as R[] | undefined
          return (
            <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
              {locked(f) && (f.type === 'file' || f.type === 'list') ? (
                <>
                  <label className="lbl">{f.label}</label>
                  <div className="text-sm text-slate-600">{f.type === 'file' ? (r[f.key]?.name ?? '-') : `${list?.length ?? 0} item`} <span className="text-xs text-slate-400">(tidak dapat diubah)</span></div>
                </>
              ) : f.type === 'file' ? <FileField label={f.label + (req ? ' *' : '')} value={r[f.key] ?? null} onChange={(m) => set(f.key, m)} error={errs[f.key]} /> : (
                <>
                  <label className="lbl">{f.label}{req ? ' *' : ''}{canRev(f) && <Reveal on={!!rev[f.key]} toggle={() => setRev((p) => ({ ...p, [f.key]: !p[f.key] }))} label={f.label} />}</label>
                  {f.type === 'list' ? (
                    <div className="space-y-2">
                      {(list ?? []).map((it, i) => {
                        const itOff = edit && !!f.itemEditableBy && !f.itemEditableBy(c, it)
                        return (
                        <div key={i} className="rounded border border-slate-200 p-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {f.sub?.map((s) => (
                              <div key={s.key} className={s.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                <label className="lbl">{s.label}{isReq(s, it, c) ? ' *' : ''}</label>
                                <Input f={s} v={it[s.key]} c={c} pend={pend(`${f.key}.${i}.${s.key}`)} off={itOff || (edit && !!s.editableBy && !s.editableBy(c, it))} set={(v) => set(f.key, (list ?? []).map((x, j) => (j === i ? { ...x, [s.key]: v } : x)))} />
                                {errs[`${f.key}.${i}.${s.key}`] && <p className="err">{errs[`${f.key}.${i}.${s.key}`]}</p>}
                              </div>
                            ))}
                          </div>
                          {!itOff && !(edit && f.listLocked?.(c)) && <button type="button" className="btn mt-2 !py-1 text-red-600" onClick={() => set(f.key, (list ?? []).filter((_, j) => j !== i))}><Trash2 size={13} />Hapus item</button>}
                          {itOff && <p className="mt-2 text-xs text-slate-400">Item ini tidak dapat diubah oleh Anda.</p>}
                        </div>
                        )
                      })}
                      {!(edit && f.listLocked?.(c)) && <button type="button" className="btn !py-1" onClick={() => set(f.key, [...(list ?? []), Object.fromEntries((f.sub ?? []).map((s) => [s.key, s.type === 'multiselect' ? [] : s.type === 'checklist' ? {} : s.type === 'file' ? null : '']))])}><Plus size={13} />Tambah item</button>}
                    </div>
                  ) : <Input f={f} v={masked(f) || soft(f) ? maskStr(String(r[f.key] ?? '')) : r[f.key]} c={c} pend={pend(f.key)} set={(v) => set(f.key, v)} off={locked(f) || soft(f) || !!f.readOnly} />}
                  {edit && f.key === 'status' && cfg.normalize && norm && norm.status !== init.status && <p className="mt-0.5 text-xs text-amber-600">Status saat ini (otomatis): {String(norm.status)}</p>}
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
          {errs.alasanUbah && <p className="err">{errs.alasanUbah}</p>}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={submit}>Simpan</button></div>
    </Modal>
  )
}
