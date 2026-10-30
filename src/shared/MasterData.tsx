import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { setStore, useApp } from '../kit/store'
import type { Master } from '../kit/types'
import { Modal } from '../ui'

// Urutan = urutan submenu Master Data.
export const MASTER_LISTS: { kind: keyof Master; slug: string; label: string }[] = [
  { kind: 'laporan', slug: 'laporan', label: 'Laporan' },
  { kind: 'regulator', slug: 'regulator', label: 'Regulator' },
  { kind: 'kategoriRegulasi', slug: 'kategori-regulasi', label: 'Kategori Regulasi' },
  { kind: 'unitKerja', slug: 'unit-kerja', label: 'Unit Kerja' },
  { kind: 'produk', slug: 'produk', label: 'Produk' },
  { kind: 'mitra', slug: 'mitra', label: 'Mitra' },
  { kind: 'kategoriPelapor', slug: 'kategori-pelapor', label: 'Kategori Pelapor' },
  { kind: 'mediaPelapor', slug: 'media-pelapor', label: 'Media Pelapor' },
]

// Validasi tambah/ubah. Hanya berlaku untuk input pengguna; nilai seed lama tidak diperiksa ulang.
// currentName: nama yang sedang diubah (boleh sama dengan dirinya sendiri).
export function validateMasterName(name: string, existing: string[], currentName?: string): string {
  const v = name.trim()
  if (!v) return 'Nama wajib diisi'
  if (v.length < 2) return 'Minimal 2 karakter'
  if (v.length > 255) return 'Maksimal 255 karakter'
  if (!/^[\p{L}\p{N} ]+$/u.test(v)) return 'Hanya huruf, angka, dan spasi'
  const low = v.toLowerCase()
  if (existing.some((x) => x.toLowerCase() === low && x !== currentName)) return 'Nama sudah ada'
  return ''
}

export default function MasterData({ kind }: { kind: keyof Master }) {
  const { store, can, log } = useApp()
  const title = MASTER_LISTS.find((m) => m.kind === kind)!.label
  const list = store.master[kind]
  const [q, setQ] = useState('')
  const [dlg, setDlg] = useState<{ mode: 'add' } | { mode: 'edit'; i: number } | { mode: 'del'; i: number } | null>(null)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const set = (next: string[]) => setStore((s) => ({ ...s, master: { ...s.master, [kind]: next } }))
  const close = () => { setDlg(null); setErr('') }
  const open = (d: NonNullable<typeof dlg>) => { setName(d.mode === 'edit' ? list[d.i] : ''); setErr(''); setDlg(d) }
  const save = () => {
    if (!dlg || dlg.mode === 'del') return
    const cur = dlg.mode === 'edit' ? list[dlg.i] : undefined
    const e = validateMasterName(name, list, cur)
    if (e) return setErr(e)
    const v = name.trim()
    if (dlg.mode === 'add') { set([...list, v]); log('Master Data', 'Tambah', '', `${title}: ${v}`) }
    else { set(list.map((x, i) => (i === dlg.i ? v : x))); log('Master Data', 'Ubah', '', `${title}: ${cur} -> ${v}`) }
    close()
  }
  const del = () => {
    if (!dlg || dlg.mode !== 'del') return
    const v = list[dlg.i]
    set(list.filter((_, i) => i !== dlg.i)); log('Master Data', 'Hapus', '', `${title}: ${v}`); close()
  }
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative w-56"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input className="inp !pl-8" placeholder={`Cari ${title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {can('master', 'Tambah') && <button className="btn btn-primary ml-auto" onClick={() => open({ mode: 'add' })}><Plus size={14} />Tambah</button>}
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="w-16 px-3 py-2.5">No</th><th className="px-3 py-2.5">{title}</th><th className="px-3 py-2.5">Aksi</th></tr></thead>
        <tbody>
          {list.map((x, i) => ({ x, i })).filter(({ x }) => x.toLowerCase().includes(q.toLowerCase())).map(({ x, i }) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2 break-all">{x}</td>
              <td className="px-3 py-2">
                {can('master', 'Ubah') && <div className="flex gap-1"><button className="btn !px-2 !py-1" onClick={() => open({ mode: 'edit', i })}><Pencil size={13} />Edit</button><button className="btn !px-2 !py-1 text-red-600" onClick={() => open({ mode: 'del', i })}><Trash2 size={13} />Hapus</button></div>}
              </td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Belum ada data</td></tr>}
        </tbody>
      </table>
      <p className="border-t p-3 text-xs text-slate-400">Ubah atau hapus tidak mengubah data lama yang sudah memakai nilai ini.</p>
      {dlg && dlg.mode !== 'del' && (
        <Modal title={`${dlg.mode === 'add' ? 'Tambah' : 'Edit'} ${title}`} onClose={close}>
          <label className="lbl">Nama *</label>
          <input className="inp" autoFocus value={name} onChange={(e) => { setName(e.target.value); setErr('') }} onKeyDown={(e) => e.key === 'Enter' && save()} />
          {err && <p className="err">{err}</p>}
          <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={close}>Batal</button><button className="btn btn-primary" onClick={save}>Simpan</button></div>
        </Modal>
      )}
      {dlg?.mode === 'del' && (
        <Modal title={`Hapus ${title}`} onClose={close}>
          <p>Hapus {list[dlg.i]}? Data lama yang memakai nilai ini tidak berubah.</p>
          <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={close}>Batal</button><button className="btn btn-danger" onClick={del}>Hapus</button></div>
        </Modal>
      )}
    </div>
  )
}
