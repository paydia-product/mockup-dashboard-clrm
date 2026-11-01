import type { Account, Action, ModuleId, PermKey, PermMatrix, Role } from './types'

export const ROLES: Role[] = ['Super Admin', 'Head CLRM', 'Compliance Officer', 'Risk Officer', 'Legal Officer', 'Fraud Investigator', 'Ketua SMKI', 'PIC', 'Viewer']
export const ACTIONS: Action[] = ['Lihat', 'Tambah', 'Ubah', 'Cancel', 'Approve', 'Export', 'Import']
export const PERM_KEYS: { key: PermKey; label: string }[] = [
  { key: 'tracker', label: 'Regulatory Findings Tracker' }, { key: 'reporting', label: 'Regulatory Reporting' }, { key: 'regchange', label: 'Regulatory Change' },
  { key: 'sop', label: 'SOP & Dokumen Kontrol' }, { key: 'risk', label: 'Risk Register' }, { key: 'kajian', label: 'Kajian Risiko' },
  { key: 'fraud', label: 'Fraud Case Monitoring' }, { key: 'kontrak', label: 'Kontrak' }, { key: 'aph', label: 'Permintaan APH' },
  { key: 'perizinan', label: 'Perizinan & Dokumen Legalitas' }, { key: 'layanan', label: 'Permintaan Layanan Hukum' },
  { key: 'approval', label: 'Approval' }, { key: 'master', label: 'Master Data' }, { key: 'admin', label: 'Admin' }, { key: 'log', label: 'Log' },
]
export const MODULE_LABEL = Object.fromEntries(PERM_KEYS.map((p) => [p.key, p.label])) as Record<PermKey, string>

const CO: Role = 'Compliance Officer', RO: Role = 'Risk Officer', LO: Role = 'Legal Officer', FI: Role = 'Fraud Investigator'
const ADD: Record<ModuleId, Role[]> = { tracker: [CO], reporting: [CO], regchange: [CO], sop: [CO, 'PIC'], risk: [RO, 'PIC'], kajian: [RO], fraud: [FI, CO], kontrak: [LO], aph: [LO], perizinan: [LO], layanan: [LO, 'PIC'] }
const EDIT: Record<ModuleId, Role[]> = { tracker: [CO, 'PIC'], reporting: [CO, 'PIC'], regchange: [CO, 'PIC'], sop: [CO, 'PIC'], risk: [RO, 'PIC'], kajian: [RO, 'PIC'], fraud: [FI, CO, 'PIC'], kontrak: [LO, 'PIC'], aph: [LO, 'PIC'], perizinan: [LO, 'PIC'], layanan: [LO] }
const APPROVE: Partial<Record<ModuleId, Role[]>> = { tracker: ['Head CLRM'], fraud: ['Head CLRM'], regchange: ['Ketua SMKI'], risk: [RO] }

function build(): PermMatrix {
  const out = {} as PermMatrix
  for (const role of ROLES) {
    const m: Partial<Record<PermKey, Action[]>> = {}
    for (const { key } of PERM_KEYS) {
      if (role === 'Super Admin') { m[key] = [...ACTIONS]; continue }
      const a: Action[] = []
      if (key === 'admin') { m[key] = a; continue }
      if (key === 'log') { if (role === 'Head CLRM') a.push('Lihat', 'Export'); m[key] = a; continue }
      if (key === 'master') { a.push('Lihat'); if (role === 'Head CLRM') a.push('Tambah', 'Ubah'); m[key] = a; continue }
      a.push('Lihat')
      if (key === 'approval') { if (Object.values(APPROVE).some((r) => r?.includes(role))) a.push('Approve'); m[key] = a; continue }
      a.push('Export')
      if (ADD[key].includes(role)) a.push('Tambah', 'Import')
      if (EDIT[key].includes(role)) a.push('Ubah')
      if (role === 'Head CLRM') a.push('Cancel')
      if (APPROVE[key]?.includes(role)) a.push('Approve')
      m[key] = a
    }
    out[role] = m
  }
  return out
}
export const DEFAULT_PERMS: PermMatrix = build()
export const can = (perms: PermMatrix, role: Role, m: PermKey, a: Action) => !!perms[role]?.[m]?.includes(a)
export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// ---- Izin per admin (halaman Admin): kategori = 4 modul + halaman pendukung ----
// Aksi lama dipetakan: Update = Ubah + Cancel (edit dan hapus), Dashboard = tab Dashboard. Import tidak ada (tombol Import disembunyikan di semua halaman).
export type PermAction = 'view' | 'create' | 'update' | 'export' | 'approve' | 'dashboard'
export const PERM_ACTION_LABEL: Record<PermAction, string> = { view: 'View', create: 'Create', update: 'Update', export: 'Export', approve: 'Approve', dashboard: 'Dashboard' }
const ACTION_OF: Record<PermAction, Action[]> = { view: ['Lihat'], create: ['Tambah'], update: ['Ubah', 'Cancel'], export: ['Export'], approve: ['Approve'], dashboard: ['Dashboard'] }
export interface PermCategory { id: string; label: string; keys: PermKey[]; actions: PermAction[] }
export const PERM_CATEGORIES: PermCategory[] = [
  { id: 'compliance', label: 'Compliance', keys: ['tracker', 'reporting', 'regchange', 'sop'], actions: ['view', 'create', 'update', 'export', 'approve', 'dashboard'] },
  { id: 'risk', label: 'Risk', keys: ['risk', 'kajian'], actions: ['view', 'create', 'update', 'export', 'approve', 'dashboard'] },
  { id: 'fraud', label: 'Fraud', keys: ['fraud'], actions: ['view', 'create', 'update', 'export', 'approve', 'dashboard'] },
  { id: 'legal', label: 'Legal', keys: ['kontrak', 'aph', 'perizinan', 'layanan'], actions: ['view', 'create', 'update', 'export', 'dashboard'] },
  { id: 'approval', label: 'Approval', keys: ['approval'], actions: ['view', 'update', 'approve'] },
  { id: 'master', label: 'Master Data', keys: ['master'], actions: ['view', 'create', 'update'] },
  { id: 'log', label: 'Log', keys: ['log'], actions: ['view', 'update', 'export'] },
  { id: 'admin', label: 'Admin', keys: ['admin'], actions: ['view', 'create', 'update'] },
]
export const ALL_PERM_IDS = PERM_CATEGORIES.flatMap((c) => c.actions.map((a) => `${c.id}.${a}`))
const catOf = (m: PermKey) => PERM_CATEGORIES.find((c) => c.keys.includes(m))
// Izin awal admin = turunan matriks peran: kategori memberi aksi bila salah satu halamannya memberi salah satu aksi lama yang dipetakan (Update = Ubah atau Cancel)
const grants = (role: Role, matrix: PermMatrix, c: PermCategory, a: PermAction) => {
  if (c.id === 'approval' && a === 'update') return PERM_KEYS.some((k) => matrix[role]?.[k.key]?.includes('Approve')) // Update di Approval = hak memutuskan (Approve/Reject)
  if (a === 'dashboard') return c.keys.some((k) => matrix[role]?.[k]?.includes('Lihat'))
  return c.keys.some((k) => ACTION_OF[a].some((x) => matrix[role]?.[k]?.includes(x)))
}
export const permsOf = (role: Role, matrix: PermMatrix = DEFAULT_PERMS): string[] =>
  PERM_CATEGORIES.flatMap((c) => c.actions.filter((a) => role === 'Super Admin' || grants(role, matrix, c, a)).map((a) => `${c.id}.${a}`))
// can() untuk akun yang punya daftar izin: ada izin kategori untuk salah satu aksi lama yang dipetakan
export const canAccount = (acc: Pick<Account, 'permissions'>, m: PermKey, a: Action): boolean => {
  const c = catOf(m)
  const pa = (Object.keys(ACTION_OF) as PermAction[]).find((x) => ACTION_OF[x].includes(a))
  return !!c && !!pa && acc.permissions.includes(`${c.id}.${pa}`)
}
