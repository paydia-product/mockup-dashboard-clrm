import { useState } from 'react'
import { Pencil, Plus, Power, Search } from 'lucide-react'
import { fmtTime } from '../lib'
import { DEFAULT_PASSWORD, DEFAULT_PIN, setStore, useApp } from '../kit/store'
import { ACTIONS, PERM_KEYS, ROLES } from '../kit/perms'
import type { Account, Action, PermKey, Role } from '../kit/types'
import { Badge, Modal } from '../ui'
import { usePaged } from './Pager'
import PageGuide from '../kit/PageGuide'
import { AKUN_GUIDE, PERMISSION_GUIDE } from '../guides/shared'

function AccountForm({ init, onClose }: { init: Account | null; onClose: () => void }) {
  const { store, log } = useApp()
  const [a, setA] = useState<Account>(init ?? { id: '', name: '', email: '', role: 'Viewer', departemen: store.master.unitKerja[0] ?? '', status: 'Aktif', lastLogin: '', password: DEFAULT_PASSWORD, pin: DEFAULT_PIN })
  const [err, setErr] = useState('')
  const save = () => {
    if (!a.name.trim() || !/^\S+@\S+\.\S+$/.test(a.email)) return setErr('Nama dan email yang valid wajib diisi')
    if (store.accounts.some((x) => x.id !== a.id && x.email.toLowerCase() === a.email.toLowerCase())) return setErr('Email sudah dipakai')
    if (init) setStore((s) => ({ ...s, accounts: s.accounts.map((x) => (x.id === a.id ? a : x)) }))
    else setStore((s) => ({ ...s, accounts: [...s.accounts, { ...a, id: `a${Date.now()}` }] }))
    log('Admin', init ? 'Ubah akun' : 'Tambah akun', '', a.email)
    onClose()
  }
  const set = (k: keyof Account, v: string) => setA({ ...a, [k]: v })
  return (
    <Modal title={init ? 'Ubah Akun' : 'Tambah Akun'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="lbl">Nama *</label><input className="inp" value={a.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="lbl">Email *</label><input className="inp" value={a.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className="lbl">Peran *</label><select className="inp" value={a.role} onChange={(e) => set('role', e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div><label className="lbl">Unit Kerja *</label><select className="inp" value={a.departemen} onChange={(e) => set('departemen', e.target.value)}>{(store.master.unitKerja.includes(a.departemen) || !a.departemen ? store.master.unitKerja : [...store.master.unitKerja, a.departemen]).map((d) => <option key={d}>{d}</option>)}</select></div>
        <div><label className="lbl">Status</label><select className="inp" value={a.status} onChange={(e) => set('status', e.target.value)}><option>Aktif</option><option>Nonaktif</option></select></div>
        {!init && <p className="text-xs text-slate-400">Password awal {DEFAULT_PASSWORD}, PIN awal {DEFAULT_PIN}.</p>}
        {err && <p className="err">{err}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={save}>Simpan</button></div>
    </Modal>
  )
}

export function Akun() {
  const { store, can, log } = useApp()
  const [q, setQ] = useState('')
  const [form, setForm] = useState<Account | 'new' | null>(null)
  const list = store.accounts.filter((a) => `${a.name} ${a.email} ${a.role} ${a.departemen}`.toLowerCase().includes(q.toLowerCase()))
  const { slice, pager, reset } = usePaged(list)
  const edit = can('admin', 'Ubah')
  const toggle = (a: Account) => {
    const status = a.status === 'Aktif' ? 'Nonaktif' : 'Aktif'
    setStore((s) => ({ ...s, accounts: s.accounts.map((x) => (x.id === a.id ? { ...x, status } : x)) }))
    log('Admin', 'Ubah status akun', '', `${a.email}: ${a.status} -> ${status}`)
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <PageGuide name="Akun" items={AKUN_GUIDE} />
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative w-64"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input className="inp !pl-8" placeholder="Cari nama, email, peran" value={q} onChange={(e) => { setQ(e.target.value); reset() }} /></div>
        {can('admin', 'Tambah') && <button className="btn btn-primary ml-auto" onClick={() => setForm('new')}><Plus size={14} />Tambah</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs text-slate-600"><tr>{['Nama', 'Email', 'Peran', 'Unit Kerja', 'Status', 'Terakhir Login', 'Aksi'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {slice.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2.5 font-medium">{a.name}</td><td className="px-3 py-2.5">{a.email}</td><td className="px-3 py-2.5">{a.role}</td><td className="px-3 py-2.5">{a.departemen}</td>
                <td className="px-3 py-2.5"><Badge tone={a.status === 'Aktif' ? 'green' : 'gray'}>{a.status}</Badge></td>
                <td className="whitespace-nowrap px-3 py-2.5">{a.lastLogin ? fmtTime(a.lastLogin) : '-'}</td>
                <td className="px-3 py-2.5">{edit && <div className="flex gap-1"><button className="btn !px-2 !py-1" onClick={() => setForm(a)}><Pencil size={13} />Edit</button><button className="btn !px-2 !py-1" onClick={() => toggle(a)}><Power size={13} />{a.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button></div>}</td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
      {form && <AccountForm init={form === 'new' ? null : form} onClose={() => setForm(null)} />}
    </div>
  )
}

export function Permission() {
  const { store, can, log } = useApp()
  const [role, setRole] = useState<Role>('Head CLRM')
  const edit = can('admin', 'Ubah') && role !== 'Super Admin' // Super Admin dikunci agar tidak terkunci keluar
  const toggle = (k: PermKey, a: Action) => {
    const cur = store.perms[role][k] ?? []
    const on = cur.includes(a)
    setStore((s) => ({ ...s, perms: { ...s.perms, [role]: { ...s.perms[role], [k]: on ? cur.filter((x) => x !== a) : [...cur, a] } } }))
    log('Admin', 'Ubah permission', '', `${role} / ${PERM_KEYS.find((p) => p.key === k)?.label} / ${a}: ${on ? 'dicabut' : 'diberi'}`)
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <PageGuide name="Permission" items={PERMISSION_GUIDE} />
      <div className="flex items-center gap-3 border-b p-3">
        <label className="lbl !mb-0">Peran</label>
        <select className="inp !w-56" value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        {!edit && <span className="text-xs text-slate-400">{role === 'Super Admin' ? 'Super Admin selalu punya semua izin.' : 'Hanya baca.'}</span>}
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left">
        <thead className="bg-slate-100 text-xs text-slate-600"><tr><th className="px-3 py-2.5 font-semibold">Menu</th>{ACTIONS.map((a) => <th key={a} className="px-3 py-2.5 text-center font-semibold">{a}</th>)}</tr></thead>
        <tbody>
          {PERM_KEYS.map(({ key, label }) => (
            <tr key={key} className="border-t">
              <td className="px-3 py-2">{label}</td>
              {ACTIONS.map((a) => <td key={a} className="px-3 py-2 text-center"><input type="checkbox" aria-label={`${label} ${a}`} disabled={!edit} checked={store.perms[role][key]?.includes(a) ?? false} onChange={() => toggle(key, a)} /></td>)}
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}
