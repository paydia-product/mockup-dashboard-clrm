import { ReactNode, useMemo, useSyncExternalStore } from 'react'
import { nowStr, todayStr } from '../lib'
import { fmtValue } from './fmt'
import { DEFAULT_PERMS, MODULE_LABEL, can as canPerm } from './perms'
import type { Account, Action, ApprovalReq, ApprovalRule, BaseRec, Ctx, LogEntry, ModuleApi, ModuleId, NewRec, PageConfig, PermKey, Role, Session, Store } from './types'

export type { ModuleApi }
export const APP_KEY = 'clrm.app.v1'
export const SESSION_KEY = 'clrm.session'
export const DEFAULT_PASSWORD = 'Paydia123!'
export const DEFAULT_PIN = '123456'

const acc = (n: number, name: string, role: Role, departemen: string, email?: string): Account => ({
  id: `a${n}`, name, email: email ?? `${name.toLowerCase().replace(/ /g, '.')}@paydia.id`, role, departemen, status: 'Aktif', lastLogin: '', password: DEFAULT_PASSWORD, pin: DEFAULT_PIN,
})
const ACCOUNTS: Account[] = [
  acc(1, 'Super Admin', 'Super Admin', 'IT', 'admin@paydia.id'), acc(2, 'Dewi Anggraini', 'Head CLRM', 'Compliance'), acc(3, 'Rina Kartika', 'Compliance Officer', 'Compliance'),
  acc(4, 'Arief Nugraha', 'Compliance Officer', 'Compliance'), acc(5, 'Rudi Hartono', 'Risk Officer', 'Compliance'), acc(6, 'Lina Marlina', 'Legal Officer', 'Compliance'),
  acc(7, 'Fajar Ramadhan', 'Fraud Investigator', 'Operations'), acc(8, 'Yusuf Hakim', 'Ketua SMKI', 'IT'), acc(9, 'Bima Pratama', 'PIC', 'Business'), acc(10, 'Tono Santoso', 'Viewer', 'Finance'),
]
const defaults = (): Store => ({
  modules: {}, saved: {}, approvals: [], log: [], accounts: ACCOUNTS, perms: DEFAULT_PERMS, seq: {},
  master: {
    departemen: ['IT', 'Business', 'Operations', 'Finance', 'Compliance', 'Support'], produk: ['UE', 'QRIS', 'Biller'],
    pihakPelapor: ['Konsumen', 'Merchant', 'Bank Mitra', 'Switching', 'Kepolisian', 'Bank Indonesia', 'Internal'],
  },
})

// ---- Singleton + subscribe (readModule/addRecord dipanggil di luar komponen) ----
let store: Store = (() => { try { const s = localStorage.getItem(APP_KEY); if (s) return { ...defaults(), ...JSON.parse(s) } as Store } catch { /* abaikan */ } return defaults() })()
let session: Session | null = (() => { try { const s = localStorage.getItem(SESSION_KEY); if (s) return JSON.parse(s) as Session } catch { /* abaikan */ } return null })()
let ver = 0
const subs = new Set<() => void>()
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
const emit = () => { ver++; subs.forEach((f) => f()) }
const persist = () => { try { localStorage.setItem(APP_KEY, JSON.stringify(store)) } catch { /* abaikan */ } }
export const getStore = () => store
export function setStore(u: Store | ((s: Store) => Store)) { store = typeof u === 'function' ? u(store) : u; persist(); emit() }
export function setSession(s: Session | null) {
  session = s
  try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY) } catch { /* abaikan */ }
  emit()
}
export function useSession() { useSyncExternalStore(subscribe, () => ver); return session }
export const AppProvider = ({ children }: { children: ReactNode }) => <>{children}</> // store berupa singleton; provider hanya untuk kontrak

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
export const mkLog = (u: Account, module: string, aksi: string, nomor: string | number = '', ket = ''): LogEntry => ({ id: `l${uid()}`, time: nowStr(), user: u.name, role: u.role, module, aksi, nomor: String(nomor), keterangan: ket })
export const withLogs = (s: Store, ...e: LogEntry[]): Store => ({ ...s, log: [...e.reverse(), ...s.log].slice(0, 3000) })
export function pushLog(u: Account, module: string, aksi: string, nomor: string | number = '', ket = '') { setStore((s) => withLogs(s, mkLog(u, module, aksi, nomor, ket))) }
const currentAccount = () => store.accounts.find((a) => a.id === session?.accountId) ?? store.accounts[0]
const makeCtx = (): Ctx => ({ role: currentAccount().role, user: currentAccount(), today: todayStr(), master: store.master, all: (m) => store.modules[m] ?? [] })

export function useApp() {
  useSyncExternalStore(subscribe, () => ver)
  const ctx = useMemo(makeCtx, [ver]) // eslint-disable-line react-hooks/exhaustive-deps
  const user = ctx.user
  return {
    store, setStore, ctx, session,
    can: (m: PermKey, a: Action) => canPerm(store.perms, user.role, m, a),
    log: (module: string, aksi: string, nomor: string | number = '', ket = '') => pushLog(user, module, aksi, nomor, ket),
    logout: () => { pushLog(user, 'Sesi', 'Logout'); setSession(null) },
  }
}

// ---- Seed + baca/tambah lintas modul ----
function ensure<T extends BaseRec>(m: ModuleId, seed: (t: string) => T[]): T[] {
  if (!store.modules[m]) { store.modules[m] = seed(todayStr()); persist() } // seed idempoten: sengaja tanpa emit saat render
  return store.modules[m] as T[]
}
export const readModule = <T extends BaseRec>(m: ModuleId, seed: (t: string) => T[]): T[] => ensure(m, seed)
function insert<T extends BaseRec>(m: ModuleId, title: string, r: NewRec<T>, u: Account, beforeSave?: (n: T) => T, silent?: boolean): T {
  const list = (store.modules[m] ?? []) as T[]
  let rec = { ...r, id: `${m}-${uid()}`, no: list.reduce((a, x) => Math.max(a, x.no), 0) + 1, createdAt: nowStr(), createdBy: u.name } as unknown as T
  if (beforeSave) rec = beforeSave(rec)
  const n = rec
  setStore((s) => { const next = { ...s, modules: { ...s.modules, [m]: [...((s.modules[m] ?? []) as T[]), n] } }; return silent ? next : withLogs(next, mkLog(u, title, 'Tambah', n.no)) })
  return n
}
export function addRecord<T extends BaseRec>(m: ModuleId, r: NewRec<T>, seed: (t: string) => T[]): T {
  ensure(m, seed)
  return insert<T>(m, MODULE_LABEL[m], r, currentAccount())
}

// ---- useModule ----
type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '')

export function useModule<T extends BaseRec>(cfg: PageConfig<T>): ModuleApi<T> {
  const { ctx } = useApp()
  const raw = ensure(cfg.module, cfg.seed)
  const rows = useMemo(() => (cfg.normalize ? raw.map((r) => cfg.normalize!(r, ctx)) : raw), [raw, ctx]) // eslint-disable-line react-hooks/exhaustive-deps
  const u = ctx.user
  const fld = (k: string) => cfg.fields.find((f) => f.key === k)
  const label = (k: string) => fld(k)?.label ?? k
  const show = (k: string, v: unknown) => { const f = fld(k); return f ? fmtValue(f, v, ctx) : String(v ?? '') }
  const cur = (id: string) => ((getStore().modules[cfg.module] ?? []) as T[]).find((x) => x.id === id)
  const put = (s: Store, id: string, patch: R): Store => ({ ...s, modules: { ...s.modules, [cfg.module]: ((s.modules[cfg.module] ?? []) as T[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } })
  const changedKeys = (old: R, next: R) => cfg.fields.filter((f) => !f.auto && f.key !== 'no' && !same(old[f.key], next[f.key])).map((f) => f.key)
  const mkReq = (s: Store, old: T, jenis: string, approver: Role, keys: string[], next: R, alasan: string, rejectPatch?: R): [Store, ApprovalReq] => {
    const no = (s.seq.approval ?? 0) + 1
    const req: ApprovalReq = {
      id: `ap${uid()}`, no, module: cfg.module, jenis, recordId: old.id, recordNo: old.no, by: u.name, byRole: u.role, time: nowStr(), alasan, approver,
      changes: keys.map((k) => ({ key: k, label: label(k), lama: show(k, (old as R)[k]), baru: show(k, next[k]), value: next[k] })), rejectPatch, status: 'Menunggu',
    }
    return [{ ...s, seq: { ...s.seq, approval: no }, approvals: [req, ...s.approvals] }, req]
  }
  const reqLog = (req: ApprovalReq, alasan: string) => mkLog(u, cfg.title, 'Ajukan approval', req.recordNo, `${req.jenis} (${req.approver}): ${req.changes.map((c) => `${c.label} ${c.lama || '-'} -> ${c.baru || '-'}`).join('; ')}${alasan ? `. Alasan: ${alasan}` : ''}`)

  return {
    rows,
    add: (r, silent) => insert<T>(cfg.module, cfg.title, r, u, cfg.beforeSave ? (n) => cfg.beforeSave!(null, n, ctx) : undefined, silent),
    update(id, patch, alasan = '') {
      const old = cur(id)
      if (!old) return
      let next = { ...old, ...patch } as T
      if (cfg.beforeSave) next = cfg.beforeSave(old, next, ctx)
      const diff = changedKeys(old as R, next as R)
      if (!diff.length) return
      const rule: ApprovalRule<T> | undefined = cfg.approvals?.find((a) => a.needs(old, next, ctx))
      const askKeys = rule ? diff.filter((k) => !rule.keys || rule.keys.includes(k)) : []
      const direct = diff.filter((k) => !askKeys.includes(k))
      const row: R = Object.fromEntries(direct.map((k) => [k, (next as R)[k]]))
      if (rule && askKeys.length) Object.assign(row, rule.pendingPatch?.(old))
      setStore((s) => {
        let n = put(s, id, row)
        const logs = direct.map((k) => mkLog(u, cfg.title, 'Ubah', old.no, `${label(k)}: ${show(k, (old as R)[k]) || '-'} -> ${show(k, (next as R)[k]) || '-'}${alasan ? `. Alasan: ${alasan}` : ''}`))
        if (rule && askKeys.length) { const [s2, req] = mkReq(n, old, rule.jenis, rule.approver, askKeys, next as R, alasan, rule.rejectPatch?.(old) as R | undefined); n = s2; logs.push(reqLog(req, alasan)) }
        return withLogs(n, ...logs)
      })
    },
    cancel(id, reason) {
      const old = cur(id)
      if (!old) return
      const status = cfg.cancelStatus ?? 'Dibatalkan'
      setStore((s) => withLogs(put(s, id, { status, cancelled: { prev: old.status, reason, by: u.name, at: nowStr() } }), mkLog(u, cfg.title, 'Cancel', old.no, `${old.status} -> ${status}. Alasan: ${reason}`)))
    },
    restore(id) {
      const old = cur(id)
      if (!old?.cancelled) return
      const prev = old.cancelled.prev
      setStore((s) => withLogs(put(s, id, { status: prev, cancelled: undefined }), mkLog(u, cfg.title, 'Kembalikan', old.no, `${old.status} -> ${prev}`)))
    },
    requestApproval(id, jenis, approver, changes, alasan, rejectPatch) {
      const old = cur(id)
      if (!old) return
      setStore((s) => { const [n, req] = mkReq(s, old, jenis, approver, Object.keys(changes), changes as R, alasan, rejectPatch as R | undefined); return withLogs(n, reqLog(req, alasan)) })
    },
    pendingFor: (id) => getStore().approvals.find((a) => a.module === cfg.module && a.recordId === id && a.status === 'Menunggu'),
  }
}

// ---- Keputusan approval (dipakai halaman Approval) ----
export function decideApproval(reqId: string, approve: boolean, catatan: string, by: Account) {
  setStore((s) => {
    const req = s.approvals.find((a) => a.id === reqId)
    if (!req || req.status !== 'Menunggu') return s
    const patch = approve ? Object.fromEntries(req.changes.map((c) => [c.key, c.value])) : req.rejectPatch
    const list = s.modules[req.module]
    const modules = patch && list ? { ...s.modules, [req.module]: list.map((r) => (r.id === req.recordId ? { ...r, ...patch } : r)) } : s.modules
    const approvals = s.approvals.map((a) => (a.id === reqId ? { ...a, status: approve ? ('Disetujui' as const) : ('Ditolak' as const), decidedBy: by.name, decidedAt: nowStr(), catatan } : a))
    return withLogs({ ...s, modules, approvals }, mkLog(by, MODULE_LABEL[req.module], approve ? 'Approve' : 'Reject', req.recordNo, `${req.jenis}${catatan ? `. Catatan: ${catatan}` : ''}`))
  })
}
