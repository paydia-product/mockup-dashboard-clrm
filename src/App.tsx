import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown, ChevronRight, ClipboardCheck, Database, FileSignature, FileText, Gavel, GitBranch, History, KeyRound, LayoutDashboard, ListChecks, LogOut, Menu, RotateCcw,
  Scale, ScrollText, ShieldAlert, ShieldCheck, Siren, Tag, UserCog,
} from 'lucide-react'
import { KEY as DB_KEY, Role as TrackerRole, useDB } from './lib'
import { GuideSlots } from './kit/PageGuide'
import NotifBell from './kit/notify'
import { seedApprovals } from './kit/approvalSeed'
import { APP_KEY, pushLog, setSession, useApp, useSession } from './kit/store'
import type { PermKey, Role } from './kit/types'
import Tracker from './Tracker'
import { PAGES } from './pages'
import Admin from './shared/Admin'
import Approval, { pendingCount } from './shared/Approval'
import Log from './shared/Log'
import MasterData, { MASTER_LISTS } from './shared/MasterData'
import Profile from './shared/Profile'
import { versions } from './versions'

type Item = { id: string; label: string; icon: React.ElementType; perm: PermKey }
type Group = { id: string; label: string; icon: React.ElementType; items: Item[] }
const TRACKER = 'compliance/regulatory-findings-tracker'
const GROUPS: Group[] = [
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, items: [
    { id: TRACKER, label: 'Regulatory Findings Tracker', icon: ListChecks, perm: 'tracker' },
    { id: 'compliance/regulatory-reporting', label: 'Regulatory Reporting', icon: FileText, perm: 'reporting' },
    { id: 'compliance/regulatory-change', label: 'Regulatory Change', icon: GitBranch, perm: 'regchange' },
    { id: 'compliance/sop-dokumen-kontrol', label: 'SOP & Dokumen Kontrol', icon: ClipboardCheck, perm: 'sop' },
  ] },
  { id: 'risk', label: 'Risk', icon: ShieldAlert, items: [
    { id: 'risk/risk-register', label: 'Risk Register', icon: ScrollText, perm: 'risk' },
    { id: 'risk/kajian-risiko', label: 'Kajian Risiko', icon: LayoutDashboard, perm: 'kajian' },
  ] },
  { id: 'fraud', label: 'Fraud', icon: Siren, items: [{ id: 'fraud/fraud-case-monitoring', label: 'Fraud Case Monitoring', icon: Siren, perm: 'fraud' }] },
  { id: 'legal', label: 'Legal', icon: Scale, items: [
    { id: 'legal/kontrak', label: 'Kontrak', icon: FileSignature, perm: 'kontrak' },
    { id: 'legal/permintaan-aph', label: 'Permintaan APH', icon: Gavel, perm: 'aph' },
    { id: 'legal/perizinan', label: 'Perizinan & Dokumen Legalitas', icon: FileText, perm: 'perizinan' },
    { id: 'legal/layanan-hukum', label: 'Permintaan Layanan Hukum', icon: Scale, perm: 'layanan' },
  ] },
]
const APPROVAL: Item = { id: 'approval', label: 'Approval', icon: ClipboardCheck, perm: 'approval' }
const LOG: Item = { id: 'log', label: 'Log', icon: History, perm: 'log' }
const ADMIN: Item = { id: 'admin', label: 'Admin', icon: UserCog, perm: 'admin' } // satu halaman: akun + Manage Permissions (dulu sub-menu Akun dan Permission)
const LOWER: Group[] = [
  { id: 'master', label: 'Master Data', icon: Database, items: [
    ...MASTER_LISTS.map((m) => ({ id: `master/${m.slug}`, label: m.label, icon: Database, perm: 'master' as const })),
  ] },
]
const PROFIL: Item[] = [
  { id: 'profil/password', label: 'Ganti Password', icon: KeyRound, perm: 'approval' },
  { id: 'profil/pin', label: 'Ganti PIN', icon: KeyRound, perm: 'approval' },
]
const ITEMS = [...GROUPS, ...LOWER].flatMap((g) => g.items).concat(APPROVAL, ADMIN, LOG, PROFIL)
const labelOf = (id: string) => ITEMS.find((i) => i.id === id)?.label ?? id
const groupOf = (id: string) => [...GROUPS, ...LOWER].find((g) => g.items.some((i) => i.id === id))?.label
// peran sesi -> peran tracker (dipakai Drawer tracker)
const trackerRole = (r: Role): TrackerRole => (r === 'Head CLRM' || r === 'Super Admin' ? 'Head CLRM' : r === 'Compliance Officer' ? 'Compliance Officer' : r === 'PIC' ? 'PIC' : 'Viewer')

// ponytail: slug master 'mitra' berganti 'mitra-vendor' (v2.10.0); tautan lama dialihkan agar tidak crash
const hashRoute = () => (location.hash.replace(/^#\/?/, '').split('?')[0] || TRACKER).replace(/^master\/mitra$/, 'master/mitra-vendor').replace(/^admin\/(akun|permission)$/, 'admin')

function VersionPicker() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"><Tag size={13} /><span className="hidden sm:inline">v{versions[0].v}</span><ChevronDown size={12} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-2 top-12 z-50 max-h-[70vh] w-[380px] max-w-[calc(100vw-16px)] overflow-auto sm:absolute sm:right-0 sm:top-9 rounded-lg border bg-white p-2 text-slate-700 shadow-xl">
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

seedApprovals() // seed approval Fraud/Regulatory Change/Risk Register sekali per data baru (flag seq.approvalSeed)

export default function App() {
  const session = useSession()
  const { store } = useApp()
  const ok = session?.verified2fa && store.accounts.some((a) => a.id === session.accountId && a.status === 'Active')
  // ponytail: gate server sudah cukup; tanpa sesi, langsung masuk sebagai akun aktif pertama (Super Admin)
  useEffect(() => { if (!ok) { const a = store.accounts.find((x) => x.status === 'Active'); if (a) setSession({ accountId: a.id, verified2fa: true }) } }, [ok, store.accounts])
  return ok ? <Shell /> : null
}

function Shell() {
  const { db, setDb } = useDB()
  const { ctx, store, can, logout } = useApp()
  const [route, setRoute] = useState(hashRoute)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [side, setSide] = useState(() => innerWidth >= 768) // mobile: sidebar tertutup, dibuka sebagai overlay
  const [menu, setMenu] = useState(false)
  const [btnEl, setBtnEl] = useState<HTMLElement | null>(null)
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null)
  const [actEl, setActEl] = useState<HTMLElement | null>(null) // slot tombol aksi halaman di baris judul (Admin)
  const slots = useMemo(() => ({ btn: btnEl, panel: panelEl }), [btnEl, panelEl])
  useEffect(() => {
    const h = () => { setRoute(hashRoute()); if (innerWidth < 768) setSide(false) }
    addEventListener('hashchange', h)
    return () => removeEventListener('hashchange', h)
  }, [])
  const user = ctx.user
  const pending = pendingCount(store, db, user.role, can)
  const reset = () => {
    if (!confirm('Kembalikan semua data ke data contoh awal?')) return
    try { localStorage.removeItem(DB_KEY); localStorage.removeItem(APP_KEY) } catch { /* abaikan */ }
    location.reload()
  }
  const demo = (() => {
    const per = store.accounts.filter((a) => a.status === 'Active').filter((a, i, l) => l.findIndex((x) => x.role === a.role) === i)
    return per.some((a) => a.id === user.id) ? per : [...per, user]
  })()
  const switchTo = (id: string) => {
    const to = store.accounts.find((a) => a.id === id)
    if (!to) return
    pushLog(user, 'Sesi', 'Ganti akun demo', '', `${user.name} -> ${to.name}`)
    setSession({ accountId: id, verified2fa: true })
  }
  const nav = (i: Item) => (
    <a key={i.id} href={`#/${i.id}`} className={`flex items-center gap-2.5 rounded px-3 py-2 text-[13px] ${route === i.id ? 'bg-blue-50 font-medium text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
      <i.icon size={16} /><span className="flex-1">{i.label}</span>
      {i.id === 'approval' && pending > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">{pending}</span>}
    </a>
  )
  const group = (g: Group) => {
    const items = g.items.filter((i) => can(i.perm, 'Lihat'))
    return items.length > 0 && (
      <div key={g.id}>
        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50" onClick={() => setCollapsed({ ...collapsed, [g.id]: !collapsed[g.id] })}>
          <g.icon size={16} /><span className="flex-1 text-left">{g.label}</span>{collapsed[g.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        {!collapsed[g.id] && <div className="ml-3 space-y-0.5 border-l pl-2">{items.map(nav)}</div>}
      </div>
    )
  }
  const item = ITEMS.find((i) => i.id === route)
  const Page = PAGES[route]
  const content = !item ? <div className="rounded-lg border border-slate-200 bg-white p-16 text-center text-slate-400">Halaman tidak ditemukan</div>
    : !can(item.perm, 'Lihat') ? <div className="rounded-lg border border-slate-200 bg-white p-16 text-center text-slate-400">Anda tidak memiliki akses ke halaman ini</div>
    : route === TRACKER ? <Tracker db={db} setDb={setDb} role={trackerRole(user.role)} user={user} can={(a) => can('tracker', a)} />
    : route === 'approval' ? <Approval tdb={db} setTdb={setDb} />
    : route === 'log' ? <Log tdb={db} />
    : route.startsWith('master/') ? <MasterData key={route} kind={MASTER_LISTS.find((m) => `master/${m.slug}` === route)!.kind} />
    : route === 'admin' ? <Admin actEl={actEl} />
    : route === 'profil/password' ? <Profile key="password" kind="password" />
    : route === 'profil/pin' ? <Profile key="pin" kind="pin" />
    : Page ? <Page key={route} /> : null
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-[#1f2ab5] px-3 text-white md:px-4">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="text-xl font-bold tracking-tight">paydia</span>
          <button onClick={() => setSide(!side)} aria-label="Menu"><Menu size={20} /></button>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <select aria-label="Akun demo" className="w-24 rounded md:w-auto border border-white/30 bg-white/10 px-2 py-1 text-xs text-white" value={user.id} onChange={(e) => switchTo(e.target.value)}>
            {demo.map((a) => <option key={a.id} value={a.id} className="text-slate-800">Akun demo: {a.name} ({a.role})</option>)}
          </select>
          <NotifBell db={db} />
          <VersionPicker />
          <button title="Reset data contoh" onClick={reset} className="rounded bg-white/10 p-1.5 hover:bg-white/20"><RotateCcw size={14} /></button>
          <div className="relative">
            <button className="flex items-center gap-2" onClick={() => setMenu(!menu)}><div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">{user.name[0]}</div><span className="hidden text-sm md:inline">{user.name}</span><ChevronDown size={12} /></button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border bg-white py-1 text-[13px] text-slate-700 shadow-xl">
                  <a href="#/profil/password" className="block px-3 py-2 hover:bg-slate-50" onClick={() => setMenu(false)}>Ganti Password</a>
                  <a href="#/profil/pin" className="block px-3 py-2 hover:bg-slate-50" onClick={() => setMenu(false)}>Ganti PIN</a>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setMenu(false); logout() }}><LogOut size={13} />Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {side && <div className="fixed inset-0 top-14 z-30 bg-black/30 md:hidden" onClick={() => setSide(false)} />}
        {side && (
          <aside className="fixed bottom-0 left-0 top-14 z-40 w-[216px] shrink-0 overflow-y-auto border-r bg-white shadow-xl md:static md:z-auto md:overflow-visible md:shadow-none">
            <div className="flex items-center gap-2.5 border-b p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-brand">{user.name[0]}</div>
              <div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{user.name}</div><div className="truncate text-[11px] text-slate-400">{user.email}</div></div>
            </div>
            <div className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Menu</div>
            <nav className="space-y-0.5 px-2 pb-6">
              {GROUPS.map(group)}
              <div className="my-2 border-t" />
              {can('approval', 'Lihat') && nav(APPROVAL)}
              {LOWER.map(group)}
              {can('admin', 'Lihat') && nav(ADMIN)}
              {can('log', 'Lihat') && nav(LOG)}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 bg-page p-3 md:p-6">
          <div className="mb-1 text-xs text-slate-400">home / {groupOf(route) ? `${groupOf(route)} / ` : ''}{labelOf(route)}</div>
          <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="text-xl font-semibold text-slate-800">{labelOf(route)}</h1><div ref={setBtnEl} /><div ref={setActEl} className="ml-auto" /></div>
          <div ref={setPanelEl} />
          <GuideSlots.Provider value={slots}>{content}</GuideSlots.Provider>
        </main>
      </div>
    </div>
  )
}
