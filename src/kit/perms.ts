import type { Action, ModuleId, PermKey, PermMatrix, Role } from './types'

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
