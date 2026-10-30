import { useState } from 'react'
import { setStore, useApp } from '../kit/store'
import PageGuide from '../kit/PageGuide'
import { PASSWORD_GUIDE, PIN_GUIDE } from '../guides/shared'

export default function Profile({ kind }: { kind: 'password' | 'pin' }) {
  const { ctx, log } = useApp()
  const pw = kind === 'password'
  const [f, setF] = useState({ old: '', next: '', conf: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const label = pw ? 'Password' : 'PIN'
  const save = () => {
    setOk(false)
    if (f.old !== (pw ? ctx.user.password : ctx.user.pin)) return setErr(`${label} lama salah`)
    if (pw ? f.next.length < 8 : !/^\d{6}$/.test(f.next)) return setErr(pw ? 'Password baru minimal 8 karakter' : 'PIN baru harus 6 digit angka')
    if (f.next !== f.conf) return setErr(`Konfirmasi ${label} tidak sama`)
    setStore((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === ctx.user.id ? { ...a, [kind]: f.next } : a)) }))
    log('Profil', pw ? 'Ganti password' : 'Ganti PIN')
    setErr(''); setOk(true); setF({ old: '', next: '', conf: '' })
  }
  const row = (k: keyof typeof f, l: string) => <div><label className="lbl">{l} *</label><input type="password" className="inp" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} maxLength={pw ? undefined : 6} /></div>
  return (
    <div className="max-w-md space-y-3 rounded-lg border border-slate-200 bg-white p-5">
      <PageGuide name={pw ? 'Ganti Password' : 'Ganti PIN'} items={pw ? PASSWORD_GUIDE : PIN_GUIDE} />
      {row('old', `${label} lama`)}{row('next', `${label} baru`)}{row('conf', `Konfirmasi ${label} baru`)}
      {err && <p className="err">{err}</p>}
      {ok && <p className="text-xs text-green-700">{label} berhasil diganti.</p>}
      <button className="btn btn-primary" onClick={save}>Simpan</button>
    </div>
  )
}
