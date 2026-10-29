import { useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import { setStore, useApp } from '../kit/store'
import type { Master } from '../kit/types'

const TITLE: Record<keyof Master, string> = { departemen: 'Departemen', produk: 'Produk', pihakPelapor: 'Pihak Pelapor' }

export default function MasterData({ kind }: { kind: keyof Master }) {
  const { store, can, log } = useApp()
  const list = store.master[kind]
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [edit, setEdit] = useState<{ i: number; v: string } | null>(null)
  const [err, setErr] = useState('')
  const set = (next: string[]) => setStore((s) => ({ ...s, master: { ...s.master, [kind]: next } }))
  const add = () => {
    const v = name.trim()
    if (!v) return setErr('Nama wajib diisi')
    if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return setErr('Nama sudah ada')
    set([...list, v]); log('Master Data', 'Tambah', '', `${TITLE[kind]}: ${v}`); setName(''); setErr('')
  }
  const rename = () => {
    if (!edit) return
    const v = edit.v.trim()
    if (!v || list.some((x, i) => i !== edit.i && x.toLowerCase() === v.toLowerCase())) return setErr('Nama kosong atau sudah ada')
    set(list.map((x, i) => (i === edit.i ? v : x))); log('Master Data', 'Ubah', '', `${TITLE[kind]}: ${list[edit.i]} -> ${v}`); setEdit(null); setErr('')
  }
  return (
    <div className="max-w-xl rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative w-56"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input className="inp !pl-8" placeholder={`Cari ${TITLE[kind].toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {can('master', 'Tambah') && <div className="ml-auto flex gap-2"><input className="inp !w-44" placeholder={`${TITLE[kind]} baru`} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><button className="btn btn-primary" onClick={add}><Plus size={14} />Tambah</button></div>}
      </div>
      {err && <p className="err px-3 pt-2">{err}</p>}
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="px-3 py-2.5">No</th><th className="px-3 py-2.5">{TITLE[kind]}</th><th className="px-3 py-2.5">Aksi</th></tr></thead>
        <tbody>
          {list.map((x, i) => ({ x, i })).filter(({ x }) => x.toLowerCase().includes(q.toLowerCase())).map(({ x, i }) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2">{edit?.i === i ? <input className="inp" value={edit.v} autoFocus onChange={(e) => setEdit({ i, v: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && rename()} /> : x}</td>
              <td className="px-3 py-2">
                {can('master', 'Ubah') && (edit?.i === i
                  ? <div className="flex gap-1"><button className="btn !px-2 !py-1 btn-primary" onClick={rename}>Simpan</button><button className="btn !px-2 !py-1" onClick={() => { setEdit(null); setErr('') }}>Batal</button></div>
                  : <button className="btn !px-2 !py-1" onClick={() => setEdit({ i, v: x })}><Pencil size={13} />Ubah nama</button>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t p-3 text-xs text-slate-400">Ubah nama tidak mengubah data lama.</p>
    </div>
  )
}
