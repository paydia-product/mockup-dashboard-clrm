import { useState } from 'react'
import { nowStr } from '../lib'
import { pushLog, setSession, setStore, useApp } from '../kit/store'

const CODE = '123456' // kode 2FA mock
type Step = 'login' | '2fa' | 'forgot' | 'sent'

export default function Login() {
  const { store } = useApp()
  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const acct = store.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  const go = (s: Step) => { setStep(s); setErr('') }
  const login = () => {
    if (!acct || acct.password !== pw) return setErr('Email atau password salah')
    if (acct.status !== 'Aktif') return setErr('Akun nonaktif. Hubungi admin.')
    go('2fa')
  }
  const verify = () => {
    if (!acct) return
    if (code.trim() !== CODE) return setErr('Kode 2FA salah')
    setStore((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === acct.id ? { ...a, lastLogin: nowStr() } : a)) }))
    pushLog(acct, 'Sesi', 'Login')
    setSession({ accountId: acct.id, verified2fa: true })
  }
  const forgot = () => {
    if (!email.trim()) return setErr('Email wajib diisi')
    if (acct) pushLog(acct, 'Sesi', 'Reset password', '', 'Link reset dikirim ke email')
    go('sent')
  }
  const exitMock = async () => { try { await fetch('/api/logout', { method: 'POST' }) } catch { /* abaikan */ } location.href = '/login.html' }
  const onEnter = (f: () => void) => (e: React.KeyboardEvent) => e.key === 'Enter' && f()
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-2xl font-bold tracking-tight text-brand">paydia</div>
        {step === 'login' && (
          <div className="space-y-3" onKeyDown={onEnter(login)}>
            <h1 className="text-base font-semibold text-slate-800">Masuk ke Dashboard CLRM</h1>
            <div><label className="lbl">Email</label><input className="inp" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
            <div><label className="lbl">Password</label><input type="password" className="inp" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-primary w-full justify-center" onClick={login}>Lanjut</button>
            <button className="text-xs text-brand underline" onClick={() => go('forgot')}>Lupa password</button>
          </div>
        )}
        {step === '2fa' && (
          <div className="space-y-3" onKeyDown={onEnter(verify)}>
            <h1 className="text-base font-semibold text-slate-800">Verifikasi 2FA</h1>
            <p className="text-xs text-slate-500">Masukkan kode 6 digit. Kode contoh: {CODE}.</p>
            <input className="inp" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            {err && <p className="err">{err}</p>}
            <button className="btn btn-primary w-full justify-center" onClick={verify}>Masuk</button>
            <button className="text-xs text-brand underline" onClick={() => { setCode(''); go('login') }}>Kembali</button>
          </div>
        )}
        {step === 'forgot' && (
          <div className="space-y-3" onKeyDown={onEnter(forgot)}>
            <h1 className="text-base font-semibold text-slate-800">Lupa password</h1>
            <div><label className="lbl">Email</label><input className="inp" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-primary w-full justify-center" onClick={forgot}>Kirim link reset</button>
            <button className="text-xs text-brand underline" onClick={() => go('login')}>Kembali</button>
          </div>
        )}
        {step === 'sent' && (
          <div className="space-y-3">
            <p className="rounded border border-green-300 bg-green-50 p-3 text-xs text-green-700">Link reset dikirim ke email.</p>
            <button className="text-xs text-brand underline" onClick={() => go('login')}>Kembali ke login</button>
          </div>
        )}
        <div className="mt-6 border-t pt-3 text-center"><button className="text-[11px] text-slate-400 underline" onClick={exitMock}>Keluar dari mockup</button></div>
      </div>
    </div>
  )
}
