import { useEffect, useState } from 'react'

export const LAINNYA = 'Lainnya'
export const withLainnya = (l: string[]) => (l.includes(LAINNYA) ? l : [...l, LAINNYA])
export const OTHER_ERR = 'Wajib diisi jika memilih Lainnya'
// onPending(true) = Lainnya dipilih tetapi teks masih kosong; induk menolak simpan dan menampilkan OTHER_ERR.
type Pending = (empty: boolean) => void

function useReport(onPending: Pending | undefined, empty: boolean) {
  useEffect(() => { onPending?.(empty); return () => onPending?.(false) }, [empty]) // eslint-disable-line react-hooks/exhaustive-deps
}

const OtherInput = ({ v, set, off }: { v: string; set: (v: string) => void; off?: boolean }) =>
  <input className="inp mt-1.5" placeholder="Sebutkan lainnya" value={v} disabled={off} maxLength={255} onChange={(e) => set(e.target.value)} />

// Select: bila opsi memuat "Lainnya", memilihnya memunculkan teks; nilai yang disimpan adalah teksnya.
export function SelectOther({ value, options, set, onPending, off, extra }: { value: unknown; options: string[]; set: (v: string) => void; onPending?: Pending; off?: boolean; extra?: boolean }) {
  const v = value == null ? '' : String(value)
  const has = options.includes(LAINNYA)
  const [other, setOther] = useState(has && v !== '' && !options.includes(v))
  const on = has && other
  useReport(onPending, on && !v.trim())
  const shown = on ? LAINNYA : v
  const opts = !has && extra && v && !options.includes(v) ? [...options, v] : options // nilai lama di luar master tetap tampil
  return (
    <>
      <select className="inp" value={shown} disabled={off} onChange={(e) => { const x = e.target.value; if (x === LAINNYA) { setOther(true); set('') } else { setOther(false); set(x) } }}>
        <option value="">Pilih...</option>{opts.map((x) => <option key={x}>{x}</option>)}
      </select>
      {on && <OtherInput v={v} set={set} off={off} />}
    </>
  )
}

// Multiselect: centang "Lainnya" memunculkan teks; teksnya masuk ke array menggantikan "Lainnya".
export function MultiOther({ value, options, set, onPending, off }: { value: string[]; options: string[]; set: (v: string[]) => void; onPending?: Pending; off?: boolean }) {
  const arr = value ?? []
  const has = options.includes(LAINNYA)
  const known = arr.filter((x) => options.includes(x) && x !== LAINNYA)
  const custom = arr.find((x) => !options.includes(x) || x === LAINNYA) ?? ''
  const [other, setOther] = useState(has && arr.some((x) => !options.includes(x)))
  const on = has && other
  useReport(onPending, on && !custom.trim())
  const toggle = (x: string, c: boolean) => set(c ? [...arr, x] : arr.filter((y) => y !== x))
  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map((x) => x === LAINNYA
          ? <label key={x} className="flex items-center gap-1.5"><input type="checkbox" disabled={off} checked={on} onChange={(e) => { setOther(e.target.checked); if (!e.target.checked) set(known) }} />{x}</label>
          : <label key={x} className="flex items-center gap-1.5"><input type="checkbox" disabled={off} checked={arr.includes(x)} onChange={(e) => toggle(x, e.target.checked)} />{x}</label>)}
        {!options.length && <span className="text-slate-400">Belum ada pilihan</span>}
      </div>
      {on && <OtherInput v={custom} set={(t) => set(t.trim() ? [...known, t] : known)} off={off} />}
    </div>
  )
}
