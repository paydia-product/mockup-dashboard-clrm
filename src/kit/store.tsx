import { ReactNode, useMemo, useSyncExternalStore } from 'react'
import { AREAS, UNITS, addDays, nowStr, todayStr } from '../lib'
import { LAPORAN_NAMES } from '../pages/laporan.shared'
import { fmtValue } from './fmt'
import { DEFAULT_PERMS, MODULE_LABEL, can as canPerm } from './perms'
import type { Account, Action, ApprovalReq, ApprovalRule, BaseRec, Ctx, LogEntry, ModuleApi, ModuleId, NewRec, PageConfig, PermKey, Role, Session, Store } from './types'

export type { ModuleApi }
export const APP_KEY = 'clrm.app.v13' // ponytail: v13 = master Mitra Vendor tanpa nama merchant, load() membuang slice modul rusak; v12 = seed Kontrak (Merchant teks bebas, Mitra dari master) + seed Perizinan dengan tiga tanggal; v11 = master Mitra Vendor (seed + PT Jaringan Nusa/PT Data Aman), seed Fraud dengan Jenis Data dan Produk master, tanpa No. Rekening; v10 = seed Regulatory Change (dampak Tinggi baru, sosialisasi terisi) dan PIC seed APH terisi; v9 = master Unit Kerja/Kategori Pelapor/Laporan dari Request Product.xlsx, Regulatory Change tindak lanjut teks + SOP daftar nama, filter tersimpan dihapus (load() membuang `saved` dan mengubah bentuk lama bila ada); v8 = seed tanpa nomor internal di teks, approval simpan nama data; v7 = master PIC (Regie/Fakhri/Osama) menggantikan master Regulator, seed PIC/regulator disesuaikan, akun demo PIC = Regie; v6 = tanggal batal seed Fraud tetap; v5 = pembatal seed Fraud nama orang; v4 = createdBy nama orang + createdAt seed masa lalu + seed Fraud valid; v3 = seed tanpa 'Lainnya' + createdAt datetime; data v2 direset (load() tetap aman membaca data lama)
export const SESSION_KEY = 'clrm.session'
export const DEFAULT_PASSWORD = 'Paydia123!'
export const DEFAULT_PIN = '123456'

const acc = (n: number, name: string, role: Role, departemen: string, email?: string): Account => ({
  id: `a${n}`, name, email: email ?? `${name.toLowerCase().replace(/ /g, '.')}@paydia.id`, role, departemen, status: 'Aktif', lastLogin: '', password: DEFAULT_PASSWORD, pin: DEFAULT_PIN,
})
const ACCOUNTS: Account[] = [
  acc(1, 'Super Admin', 'Super Admin', 'Information Technology', 'admin@paydia.id'), acc(2, 'Dewi Anggraini', 'Head CLRM', 'Compliance Legal & Risk Management'), acc(3, 'Rina Kartika', 'Compliance Officer', 'Compliance Legal & Risk Management'),
  acc(4, 'Arief Nugraha', 'Compliance Officer', 'Compliance Legal & Risk Management'), acc(5, 'Rudi Hartono', 'Risk Officer', 'Compliance Legal & Risk Management'), acc(6, 'Lina Marlina', 'Legal Officer', 'Compliance Legal & Risk Management'),
  acc(7, 'Fakhri', 'Fraud Investigator', 'Operation'), acc(8, 'Yusuf Hakim', 'Ketua SMKI', 'Information Technology'), acc(9, 'Regie', 'PIC', 'Business'), acc(10, 'Tono Santoso', 'Viewer', 'Finance, Accounting, Tax & Treasury'),
]
const defaults = (): Store => ({
  modules: {}, approvals: [], log: [], accounts: ACCOUNTS, perms: DEFAULT_PERMS, seq: {},
  master: {
    laporan: [...LAPORAN_NAMES],
    pic: ['Regie', 'Fakhri', 'Osama'],
    kategoriRegulasi: [...AREAS], unitKerja: [...UNITS], produk: ['UE', 'QRIS', 'Biller'],
    mitra: ['PT Telkom Biller', 'Bank Mitra Utama', 'CV Digital Kreasi', 'PT Logistik Cepat', 'PT Nusa Cloud', 'PT Data Prima', 'PT Aman Jaya Logistik', 'PT Mitra Bayar', 'PT Sentra Verifikasi', 'PT Cipta Layanan', 'PT Biller Nusantara', 'PT Arta Teknologi', 'PT Kirim Cepat', 'PT Sigma Analitik', 'PT Jaringan Nusa', 'PT Data Aman'],
    kategoriPelapor: ['Departemen Internal', 'Konsumen', 'Switching', 'PJP/Bank', 'Institusi Berwenang Lainnya', 'Kepolisian', 'Bank Indonesia', 'Asosiasi'], mediaPelapor: ['Email', 'IASC', 'GO AML', 'WhatsApp'],
  },
})

// createdAt harus datetime lengkap: seed/data lama yang hanya tanggal diberi jam yang naik mengikuti no (urutan Tanggal Dibuat stabil)
const stamp = <T extends BaseRec>(r: T): T => {
  if (!r || typeof r.createdAt !== 'string' || r.createdAt.length !== 10) return r
  const t = `${r.createdAt}T${new Date((8 * 3600 + ((r.no || 0) * 300) % 43200) * 1000).toISOString().slice(11, 19)}`
  const now = nowStr()
  return { ...r, createdAt: t > now ? `${addDays(now.slice(0, 10), -1)}${t.slice(10)}` : t } // jangan di masa depan/saat load: mundur 1 hari
}

// Regulatory Change lama: Tindak Lanjut berupa daftar item -> satu teks (uraian digabung); SOP berupa {sop, done} -> daftar nama SOP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrateReg = (r: any) => ({
  ...r,
  tindak: Array.isArray(r.tindak) ? r.tindak.map((t: { uraian?: string }) => t?.uraian).filter(Boolean).join('; ') : typeof r.tindak === 'string' ? r.tindak : '',
  sopList: Array.isArray(r.sopList) ? r.sopList.map((x: string | { sop?: string }) => (typeof x === 'string' ? x : x?.sop)).filter(Boolean) : [],
})

// ---- Singleton + subscribe (readModule/addRecord dipanggil di luar komponen) ----
// Migrasi master lama: departemen -> unitKerja (nilai lama dipakai), pihakPelapor dibuang, list baru diisi seed.
function load(): Store {
  const d = defaults()
  const s = JSON.parse(localStorage.getItem(APP_KEY) ?? 'null')
  if (!s || typeof s !== 'object') return d
  const m = { ...(s.master ?? {}) }
  if (!Array.isArray(m.unitKerja) && Array.isArray(m.departemen)) m.unitKerja = m.departemen
  delete m.departemen; delete m.pihakPelapor; delete m.regulator // ponytail: master Regulator dihapus (dropdown regulator kini daftar tetap per halaman); data lama yang masih punya key ini tidak error
  for (const k of Object.keys(d.master)) if (!Array.isArray(m[k])) delete m[k]
  // "Lainnya" tidak disimpan di master; dropdown menambahkannya otomatis (withLainnya)
  for (const k of Object.keys(m)) if (Array.isArray(m[k])) m[k] = m[k].filter((x: unknown) => String(x).trim().toLowerCase() !== 'lainnya')
  // data rusak: slice modul yang bukan array dibuang (seed dipakai ulang), rekaman bukan objek dibuang
  const raw = s.modules && typeof s.modules === 'object' && !Array.isArray(s.modules) ? s.modules : {}
  const modules = Object.fromEntries(Object.entries(raw).filter(([, l]) => Array.isArray(l)).map(([k, l]) => [k, (l as unknown[]).filter((x) => x && typeof x === 'object').map((x) => stamp(x as BaseRec)).map(k === 'regchange' ? migrateReg : (x) => x)]))
  delete s.saved // filter tersimpan sudah dihapus
  return { ...d, ...s, modules, master: { ...d.master, ...m } } as Store
}
let store: Store = (() => { try { return load() } catch { return defaults() } })()
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
export const mkLog = (u: Account, module: string, aksi: string, nomor: string | number = '', ket = '', extra: Partial<LogEntry> = {}): LogEntry => ({ id: `l${uid()}`, time: nowStr(), user: u.name, role: u.role, module, aksi, nomor: String(nomor), keterangan: ket, ...extra })
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
    logout: async () => { pushLog(user, 'Sesi', 'Logout'); setSession(null); try { await fetch('/api/logout', { method: 'POST' }) } catch { /* abaikan */ } location.href = '/login.html' },
  }
}

// ---- Seed + baca/tambah lintas modul ----
function ensure<T extends BaseRec>(m: ModuleId, seed: (t: string) => T[]): T[] {
  if (!store.modules[m]) { store.modules[m] = seed(todayStr()).map(stamp); persist() } // seed idempoten: sengaja tanpa emit saat render
  return store.modules[m] as T[]
}
export const readModule = <T extends BaseRec>(m: ModuleId, seed: (t: string) => T[]): T[] => ensure(m, seed)
function insert<T extends BaseRec>(m: ModuleId, title: string, r: NewRec<T>, u: Account, beforeSave?: (n: T) => T, silent?: boolean, name?: (r: T) => string): T {
  const list = (store.modules[m] ?? []) as T[]
  let rec = { ...r, id: `${m}-${uid()}`, no: list.reduce((a, x) => Math.max(a, x.no), 0) + 1, createdAt: nowStr(), createdBy: u.name } as unknown as T
  if (beforeSave) rec = beforeSave(rec)
  const n = rec
  setStore((s) => { const next = { ...s, modules: { ...s.modules, [m]: [...((s.modules[m] ?? []) as T[]), n] } }; return silent ? next : withLogs(next, mkLog(u, title, 'Tambah', name?.(n) ?? '', '', { recordId: n.id, kind: 'create' })) })
  return n
}
export function addRecord<T extends BaseRec>(m: ModuleId, r: NewRec<T>, seed: (t: string) => T[], name?: (r: T) => string): T {
  ensure(m, seed)
  return insert<T>(m, MODULE_LABEL[m], r, currentAccount(), undefined, undefined, name)
}

// ---- useModule ----
type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '')

export function useModule<T extends BaseRec>(cfg: PageConfig<T>): ModuleApi<T> {
  const { ctx } = useApp()
  const raw = ensure(cfg.module, cfg.seed)
  const rows = useMemo(() => (cfg.normalize ? raw.map((r) => cfg.normalize!(r, ctx)) : raw), [raw, ctx]) // eslint-disable-line react-hooks/exhaustive-deps
  const u = ctx.user
  const nm = (r: T) => cfg.name?.(r) ?? ''
  const fld = (k: string) => cfg.fields.find((f) => f.key === k)
  const label = (k: string) => fld(k)?.label ?? k
  const show = (k: string, v: unknown) => { const f = fld(k); return f ? fmtValue(f, v, ctx) : String(v ?? '') }
  const cur = (id: string) => ((getStore().modules[cfg.module] ?? []) as T[]).find((x) => x.id === id)
  const put = (s: Store, id: string, patch: R): Store => ({ ...s, modules: { ...s.modules, [cfg.module]: ((s.modules[cfg.module] ?? []) as T[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } })
  const changedKeys = (old: R, next: R) => cfg.fields.filter((f) => !f.auto && f.key !== 'no' && !same(old[f.key], next[f.key])).map((f) => f.key)
  const mkReq = (s: Store, old: T, jenis: string, approver: Role, keys: string[], next: R, alasan: string, rejectPatch?: R, extra?: R): [Store, ApprovalReq] => {
    const no = (s.seq.approval ?? 0) + 1
    const req: ApprovalReq = {
      id: `ap${uid()}`, no, module: cfg.module, jenis, recordId: old.id, recordNo: old.no, recordLabel: nm(old), by: u.name, byRole: u.role, time: nowStr(), alasan, approver,
      changes: keys.map((k) => ({ key: k, label: label(k), lama: show(k, (old as R)[k]), baru: show(k, next[k]), value: next[k] })), rejectPatch, extra: extra && Object.keys(extra).length ? extra : undefined, status: 'Menunggu',
    }
    return [{ ...s, seq: { ...s.seq, approval: no }, approvals: [req, ...s.approvals] }, req]
  }
  const reqLog = (req: ApprovalReq, alasan: string) => mkLog(u, cfg.title, 'Ajukan approval', req.recordLabel ?? '', `${req.jenis} (${req.approver}): ${req.changes.map((c) => `${c.label} ${c.lama || '-'} -> ${c.baru || '-'}`).join('; ')}${alasan ? `. Alasan: ${alasan}` : ''}`, { recordId: req.recordId, kind: 'request', approver: req.approver, alasan })

  return {
    rows,
    stored: (id) => cur(id),
    add: (r, silent) => insert<T>(cfg.module, cfg.title, r, u, cfg.beforeSave ? (n) => cfg.beforeSave!(null, n, ctx) : undefined, silent, cfg.name),
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
      const asking = !!rule && askKeys.length > 0
      // kolom turunan beforeSave yang bukan field form (mis. levelAt): ikut tersimpan langsung, atau ikut request bila perubahan menunggu approval
      const extra: R = Object.fromEntries(Object.keys(next).filter((k) => !cfg.fields.some((f) => f.key === k) && !same((old as R)[k], (next as R)[k])).map((k) => [k, (next as R)[k]]))
      const row: R = Object.fromEntries(direct.map((k) => [k, (next as R)[k]]))
      if (!asking) Object.assign(row, extra)
      if (rule && askKeys.length) Object.assign(row, rule.pendingPatch?.(old))
      setStore((s) => {
        let n = put(s, id, row)
        const logs: LogEntry[] = []
        if (direct.length) { // satu entri terstruktur per simpan: dipakai Log Perubahan; keterangan tetap teks untuk halaman Log
          const changes = direct.map((k) => ({ label: label(k), before: show(k, (old as R)[k]) || '-', after: show(k, (next as R)[k]) || '-' }))
          logs.push(mkLog(u, cfg.title, 'Ubah', nm(old), `${changes.map((c) => `${c.label}: ${c.before} -> ${c.after}`).join('; ')}${alasan ? `. Alasan: ${alasan}` : ''}`, { recordId: old.id, kind: 'edit', changes, alasan }))
        }
        if (rule && askKeys.length) { const [s2, req] = mkReq(n, old, rule.jenis, rule.approver, askKeys, next as R, alasan, rule.rejectPatch?.(old) as R | undefined, extra); n = s2; logs.push(reqLog(req, alasan)) }
        return withLogs(n, ...logs)
      })
    },
    cancel(id, reason) {
      const old = cur(id)
      if (!old) return
      const status = cfg.cancelStatus ?? 'Dibatalkan'
      setStore((s) => withLogs(put(s, id, { status, cancelled: { prev: old.status, reason, by: u.name, at: nowStr() } }), mkLog(u, cfg.title, 'Cancel', nm(old), `${old.status} -> ${status}. Alasan: ${reason}`, { recordId: old.id, kind: 'cancel', changes: [{ label: 'Status', before: old.status, after: status }], alasan: reason })))
    },
    restore(id, reason = '') {
      const old = cur(id)
      if (!old?.cancelled) return
      const prev = old.cancelled.prev
      setStore((s) => withLogs(put(s, id, { status: prev, cancelled: undefined }), mkLog(u, cfg.title, 'Kembalikan', nm(old), `${old.status} -> ${prev}${reason ? `. Alasan: ${reason}` : ''}`, { recordId: old.id, kind: 'restore', changes: [{ label: 'Status', before: old.status, after: prev }], alasan: reason })))
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
    const patch = approve ? { ...Object.fromEntries(req.changes.map((c) => [c.key, c.value])), ...req.extra } : req.rejectPatch
    const list = s.modules[req.module]
    const modules = patch && list ? { ...s.modules, [req.module]: list.map((r) => (r.id === req.recordId ? { ...r, ...patch } : r)) } : s.modules
    const approvals = s.approvals.map((a) => (a.id === reqId ? { ...a, status: approve ? ('Disetujui' as const) : ('Ditolak' as const), decidedBy: by.name, decidedAt: nowStr(), catatan } : a))
    return withLogs({ ...s, modules, approvals }, mkLog(by, MODULE_LABEL[req.module], approve ? 'Approve' : 'Reject', req.recordLabel ?? '', `${req.jenis}${catatan ? `. Catatan: ${catatan}` : ''}`, { recordId: req.recordId, kind: 'decision', approver: by.name, alasan: catatan }))
  })
}
