import { useEffect, useState } from 'react'
import {
  Bell, ChevronDown, ChevronRight, ClipboardCheck, FileSignature, FileText, Gavel, GitBranch, History, LayoutDashboard, ListChecks, LogOut, Menu, RotateCcw,
  Scale, ScrollText, ShieldAlert, ShieldCheck, Siren, Tag, UserCog,
} from 'lucide-react'
import { ROLES, Role, ROLE_USER, useDB, useRole } from './lib'
import Tracker from './Tracker'
import { versions } from './versions'

type Item = { id: string; label: string; icon: React.ElementType }
type Group = { id: string; label: string; icon: React.ElementType; items: Item[] }
const TRACKER = 'compliance/regulatory-findings-tracker'
const GROUPS: Group[] = [
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, items: [
    { id: TRACKER, label: 'Regulatory Findings Tracker', icon: ListChecks },
    { id: 'compliance/regulatory-reporting', label: 'Regulatory Reporting', icon: FileText },
    { id: 'compliance/regulatory-change', label: 'Regulatory Change', icon: GitBranch },
    { id: 'compliance/sop-dokumen-kontrol', label: 'SOP & Dokumen Kontrol', icon: ClipboardCheck },
  ] },
  { id: 'risk', label: 'Risk', icon: ShieldAlert, items: [
    { id: 'risk/risk-register', label: 'Risk Register', icon: ScrollText },
    { id: 'risk/kajian-risiko', label: 'Kajian Risiko', icon: LayoutDashboard },
  ] },
  { id: 'fraud', label: 'Fraud', icon: Siren, items: [{ id: 'fraud/fraud-case-monitoring', label: 'Fraud Case Monitoring', icon: Siren }] },
  { id: 'legal', label: 'Legal', icon: Scale, items: [
    { id: 'legal/kontrak', label: 'Kontrak', icon: FileSignature },
    { id: 'legal/permintaan-aph', label: 'Permintaan APH', icon: Gavel },
    { id: 'legal/perizinan', label: 'Perizinan & Dokumen Legalitas', icon: FileText },
    { id: 'legal/layanan-hukum', label: 'Permintaan Layanan Hukum', icon: Scale },
  ] },
]
const SINGLES: Item[] = [
  { id: 'approval', label: 'Approval', icon: ClipboardCheck },
  { id: 'admin', label: 'Admin', icon: UserCog },
  { id: 'log', label: 'Log', icon: History },
]
const labelOf = (id: string) => [...GROUPS.flatMap((g) => g.items), ...SINGLES].find((i) => i.id === id)?.label ?? id
const groupOf = (id: string) => GROUPS.find((g) => g.items.some((i) => i.id === id))?.label

const hashRoute = () => location.hash.replace(/^#\/?/, '') || TRACKER

function VersionPicker() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"><Tag size={13} />v{versions[0].v}<ChevronDown size={12} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 max-h-[70vh] w-[380px] overflow-auto rounded-lg border bg-white p-2 text-slate-700 shadow-xl">
            {versions.map((v, i) => (
              <div key={v.v} className="rounded border-b p-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">v{v.v}</span>
                  {i === 0 && <span className="rounded border border-blue-300 bg-blue-50 px-1.5 text-[11px] text-blue-600">Latest</span>}
                  {v.deployed && <span className="rounded border border-green-300 bg-green-50 px-1.5 text-[11px] text-green-600">Deployed</span>}
                  <span className="ml-auto text-xs text-slate-400">{v.date}</span>
                </div>
                <div className="mt-1 text-[13px] font-medium">{v.title}</div>
                <p className="mt-1 text-xs text-slate-500">Prompt: {v.prompt}</p>
                <p className="text-xs text-slate-500">~{Math.round(v.tokens / 1000)}k token</p>
                <ul className="mt-1 list-disc pl-4 text-xs">{v.changes.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const { db, setDb, reset } = useDB()
  const [role, setRole] = useRole()
  const [route, setRoute] = useState(hashRoute)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [side, setSide] = useState(true)
  useEffect(() => {
    const h = () => setRoute(hashRoute())
    addEventListener('hashchange', h)
    return () => removeEventListener('hashchange', h)
  }, [])
  const logout = async () => {
    try { await fetch('/api/logout', { method: 'POST' }) } catch { /* abaikan */ }
    location.href = '/login.html'
  }
  const nav = (i: Item) => (
    <a key={i.id} href={`#/${i.id}`} className={`flex items-center gap-2.5 rounded px-3 py-2 text-[13px] ${route === i.id ? 'bg-blue-50 font-medium text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
      <i.icon size={16} />{i.label}
    </a>
  )
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#1f2ab5] px-4 text-white">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">paydia</span>
          <button onClick={() => setSide(!side)} aria-label="Menu"><Menu size={20} /></button>
        </div>
        <div className="flex items-center gap-3">
          <select aria-label="Peran demo" className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs text-white" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => <option key={r} value={r} className="text-slate-800">Peran demo: {r}</option>)}
          </select>
          <VersionPicker />
          <button title="Reset data contoh" onClick={() => { if (confirm('Kembalikan semua data ke data contoh awal?')) reset() }} className="rounded bg-white/10 p-1.5 hover:bg-white/20"><RotateCcw size={14} /></button>
          <Bell size={18} />
          <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">O</div><span className="text-sm">Officer</span></div>
          <button title="Logout" onClick={logout} className="rounded bg-white/10 p-1.5 hover:bg-white/20"><LogOut size={14} /></button>
        </div>
      </header>
      <div className="flex flex-1">
        {side && (
          <aside className="w-[216px] shrink-0 border-r bg-white">
            <div className="flex items-center gap-2.5 border-b p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-brand">O</div>
              <div className="min-w-0"><div className="text-sm font-semibold text-slate-800">Officer</div><div className="truncate text-[11px] text-slate-400">{ROLE_USER[role].name.toLowerCase().replace(' ', '.')}@paydia.id</div></div>
            </div>
            <div className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Menu</div>
            <nav className="space-y-0.5 px-2 pb-6">
              {GROUPS.map((g) => (
                <div key={g.id}>
                  <button className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50" onClick={() => setCollapsed({ ...collapsed, [g.id]: !collapsed[g.id] })}>
                    <g.icon size={16} /><span className="flex-1 text-left">{g.label}</span>{collapsed[g.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {!collapsed[g.id] && <div className="ml-3 space-y-0.5 border-l pl-2">{g.items.map(nav)}</div>}
                </div>
              ))}
              <div className="my-2 border-t" />
              {SINGLES.map(nav)}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 bg-page p-6">
          <div className="mb-1 text-xs text-slate-400">home / {groupOf(route) ? `${groupOf(route)} / ` : ''}{labelOf(route)}</div>
          <h1 className="mb-4 text-xl font-semibold text-slate-800">{labelOf(route)}</h1>
          {route === TRACKER ? <Tracker db={db} setDb={setDb} role={role} /> : (
            <div className="rounded-lg border border-slate-200 bg-white p-16 text-center text-slate-400">Segera hadir</div>
          )}
        </main>
      </div>
    </div>
  )
}
