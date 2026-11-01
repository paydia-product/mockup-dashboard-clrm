import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, RefreshCw, Plus, Search } from 'lucide-react'
import { DEFAULT_PASSWORD, DEFAULT_PIN, setStore, useApp } from '../kit/store'
import { ALL_PERM_IDS, PERM_ACTION_LABEL, PERM_CATEGORIES } from '../kit/perms'
import type { Account, AdminStatus } from '../kit/types'
import { Badge, Modal, Tone } from '../ui'
import { usePaged } from './Pager'
import PageGuide from '../kit/PageGuide'
import { ADMIN_GUIDE } from '../guides/shared'

const STATUSES: AdminStatus[] = ['Active', 'Inactive', 'Archive', 'Suspend']
const TONE: Record<AdminStatus, Tone> = { Active: 'green', Suspend: 'orange', Inactive: 'gray', Archive: 'gray' }
const Row = ({ label, req = true, err, children }: { label: string; req?: boolean; err?: string; children: React.ReactNode }) => (
  <div className="grid items-start gap-x-3 gap-y-1 md:grid-cols-[150px_1fr]">
    <label className="pt-1.5 text-[13px] text-slate-700 md:text-right">{req && <span className="mr-1 text-red-500">*</span>}{label} :</label>
    <div>{children}{err && <p className="err">{err}</p>}</div>
  </div>
)
function Secret({ value, onChange, label, max }: { value: string; onChange: (v: string) => void; label: string; max?: number }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input className="inp !pr-9" type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" aria-label={`${show ? 'Sembunyikan' : 'Tampilkan'} ${label}`} className="absolute right-2.5 top-2 text-slate-500" onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    </div>
  )
}

// Manage Permissions: kategori (abu-abu) + Select All + checkbox 3 kolom, dengan pencarian nama kategori
function PermissionPicker({ value, onChange, locked }: { value: string[]; onChange: (v: string[]) => void; locked?: boolean }) {
  const [q, setQ] = useState('')
  const cats = PERM_CATEGORIES.filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase()))
  const flip = (ids: string[], on: boolean) => onChange(on ? [...new Set([...value, ...ids])] : value.filter((x) => !ids.includes(x)))
  return (
    <div>
      <div className="my-5 flex items-center gap-4"><div className="h-px w-6 bg-slate-200" /><h4 className="text-lg font-medium text-slate-800">Manage Permissions</h4><div className="h-px flex-1 bg-slate-200" /></div>
      {locked && <p className="mb-2 text-xs text-slate-400">Super Admin selalu punya semua izin dan tidak dapat diubah.</p>}
      <div className="relative mb-4"><input className="inp !pr-9" placeholder="Cari permission berdasarkan nama kategori..." value={q} onChange={(e) => setQ(e.target.value)} /><Search size={15} className="absolute right-2.5 top-2.5 text-slate-500" /></div>
      <div className="space-y-4">
        {cats.map((c) => {
          const ids = c.actions.map((a) => `${c.id}.${a}`)
          const all = ids.every((i) => value.includes(i))
          return (
            <div key={c.id} className="rounded border border-slate-200">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-3">
                <div className="text-sm font-semibold text-slate-700">{c.label} <span className="ml-1 text-xs font-normal text-slate-500">({ids.length} permissions)</span></div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" disabled={locked} checked={all} onChange={(e) => flip(ids, e.target.checked)} />Select All</label>
              </div>
              <div className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                {c.actions.map((a) => (
                  <label key={a} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-0.5" disabled={locked} checked={value.includes(`${c.id}.${a}`)} onChange={(e) => flip([`${c.id}.${a}`], e.target.checked)} />{PERM_ACTION_LABEL[a]}</label>
                ))}
              </div>
            </div>
          )
        })}
        {!cats.length && <p className="p-4 text-center text-sm text-slate-400">Kategori tidak ditemukan</p>}
      </div>
    </div>
  )
}

function AdminForm({ init, onClose }: { init: Account | null; onClose: () => void }) {
  const { store, log } = useApp()
  const [a, setA] = useState({ name: init?.name ?? '', email: init?.email ?? '', password: '', cpw: '', pin: '', cpin: '', status: (init?.status ?? '') as AdminStatus | '' })
  const [perms, setPerms] = useState<string[]>(init?.permissions ?? [])
  const [err, setErr] = useState<Record<string, string>>({})
  const locked = init?.role === 'Super Admin'
  const set = (k: keyof typeof a, v: string) => setA({ ...a, [k]: v })
  const save = () => {
    const e: Record<string, string> = {}
    if (!a.name.trim()) e.name = 'Name wajib diisi'
    if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = 'Email wajib berformat valid'
    else if (store.accounts.some((x) => x.id !== init?.id && x.email.toLowerCase() === a.email.toLowerCase())) e.email = 'Email sudah dipakai'
    if (!a.status) e.status = 'Status wajib dipilih'
    if (!init) {
      if (!a.password) e.password = 'Password wajib diisi'
      else if (a.password.length < 8) e.password = 'Password minimal 8 karakter'
      if (!a.cpw) e.cpw = 'Confirm Password wajib diisi'
      else if (a.cpw !== a.password) e.cpw = 'Confirm Password tidak sama dengan Password'
      if (!a.pin) e.pin = 'PIN wajib diisi'
      else if (!/^\d{6}$/.test(a.pin)) e.pin = 'PIN harus 6 digit angka'
      if (!a.cpin) e.cpin = 'Confirm PIN wajib diisi'
      else if (a.cpin !== a.pin) e.cpin = 'Confirm PIN tidak sama dengan PIN'
    }
    setErr(e)
    if (Object.keys(e).length) return
    const status = a.status as AdminStatus
    if (init) {
      const permChanged = perms.length !== init.permissions.length || perms.some((p) => !init.permissions.includes(p))
      setStore((s) => ({ ...s, accounts: s.accounts.map((x) => (x.id === init.id ? { ...x, name: a.name.trim(), email: a.email.trim(), status, permissions: perms } : x)) }))
      const diff = [init.name !== a.name.trim() && `Nama: ${init.name} -> ${a.name.trim()}`, init.status !== status && `Status: ${init.status} -> ${status}`].filter(Boolean).join('; ')
      log('Admin', 'Ubah akun', '', `email: ${a.email.trim()}${diff ? `; ${diff}` : ''}`)
      if (permChanged) log('Admin', 'Ubah permission', '', `email: ${a.email.trim()}; Izin: ${init.permissions.length} -> ${perms.length}`)
    } else {
      setStore((s) => ({ ...s, accounts: [...s.accounts, { id: `a${Date.now()}`, name: a.name.trim(), email: a.email.trim(), role: 'Viewer', departemen: s.master.unitKerja[0] ?? '', status, lastLogin: '', password: a.password, pin: a.pin, permissions: perms }] }))
      log('Admin', 'Tambah akun', '', `email: ${a.email.trim()}; Status: ${status}; Izin: ${perms.length}`)
    }
    onClose()
  }
  return (
    <Modal wide title={init ? 'Edit Admin' : 'Add New Admin'} onClose={onClose}>
      <div className="space-y-3">
        <Row label="Name" err={err.name}><input className="inp" value={a.name} onChange={(e) => set('name', e.target.value)} /></Row>
        <Row label="Email" err={err.email}><input className="inp" value={a.email} onChange={(e) => set('email', e.target.value)} /></Row>
        {!init && <>
          <Row label="Password" err={err.password}><Secret label="Password" value={a.password} onChange={(v) => set('password', v)} /></Row>
          <Row label="Confirm Password" err={err.cpw}><Secret label="Confirm Password" value={a.cpw} onChange={(v) => set('cpw', v)} /></Row>
          <Row label="PIN" err={err.pin}><Secret label="PIN" max={6} value={a.pin} onChange={(v) => set('pin', v.replace(/\D/g, ''))} /></Row>
          <Row label="Confirm PIN" err={err.cpin}><Secret label="Confirm PIN" max={6} value={a.cpin} onChange={(v) => set('cpin', v.replace(/\D/g, ''))} /></Row>
        </>}
        <Row label="Select Status" err={err.status}>
          <select className="inp" value={a.status} onChange={(e) => set('status', e.target.value)}><option value="" />{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </Row>
        {!init && <p className="text-xs text-slate-400 md:pl-[162px]">Contoh password awal demo: {DEFAULT_PASSWORD}, PIN: {DEFAULT_PIN}.</p>}
      </div>
      <PermissionPicker value={perms} onChange={setPerms} locked={locked} />
      <div className="mt-5 flex justify-end gap-2 border-t pt-3"><button className="btn" onClick={onClose}>Batal</button><button className="btn btn-primary" onClick={save}>Simpan</button></div>
    </Modal>
  )
}

export default function Admin({ actEl }: { actEl: HTMLElement | null }) {
  const { store, can, log } = useApp()
  const [form, setForm] = useState<Account | 'new' | null>(null)
  const [msg, setMsg] = useState('')
  const { slice, pager, offset } = usePaged(store.accounts)
  // Refresh Permissions: buang id izin yang tidak ada lagi di katalog; Super Admin disegarkan ke semua izin
  const refresh = () => {
    setStore((s) => ({ ...s, accounts: s.accounts.map((x) => ({ ...x, permissions: x.role === 'Super Admin' ? [...ALL_PERM_IDS] : x.permissions.filter((p) => ALL_PERM_IDS.includes(p)) })) }))
    log('Admin', 'Ubah permission', '', `Refresh permissions: ${store.accounts.length} admin`)
    setMsg(`Permissions diperbarui untuk ${store.accounts.length} admin.`)
    setTimeout(() => setMsg(''), 4000)
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <PageGuide name="Admin" items={ADMIN_GUIDE} />
      {actEl && createPortal(
        <div className="ml-auto flex gap-2">
          {can('admin', 'Ubah') && <button className="btn" onClick={refresh}><RefreshCw size={14} />Refresh Permissions</button>}
          {can('admin', 'Tambah') && <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={14} />Add</button>}
        </div>, actEl)}
      {msg && <p className="border-b bg-green-50 px-3 py-2 text-xs text-green-700">{msg}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[13px] text-slate-600"><tr>{['No', 'Email', 'Nama', 'Status', 'Action'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {slice.map((a, i) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2.5">{offset + i + 1}</td><td className="px-4 py-2.5">{a.email}</td><td className="px-4 py-2.5">{a.name}</td>
                <td className="px-4 py-2.5"><Badge tone={TONE[a.status] ?? 'gray'}>{a.status}</Badge></td>
                <td className="px-4 py-2.5">{can('admin', 'Ubah') && <button className="btn btn-primary !px-3 !py-1" onClick={() => setForm(a)}>Edit</button>}</td>
              </tr>
            ))}
            {!slice.length && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
      {form && <AdminForm key={form === 'new' ? 'new' : form.id} init={form === 'new' ? null : form} onClose={() => setForm(null)} />}
    </div>
  )
}
