import type { ElementType, ReactNode } from 'react'
import type { FileMeta } from '../lib'

export type { FileMeta }
export type ModuleId = 'tracker' | 'reporting' | 'regchange' | 'sop' | 'risk' | 'kajian' | 'fraud' | 'kontrak' | 'aph' | 'perizinan' | 'layanan'
export type PermKey = ModuleId | 'approval' | 'master' | 'admin' | 'log' // kunci matriks permission
export type Role = 'Super Admin' | 'Head CLRM' | 'Compliance Officer' | 'Risk Officer' | 'Legal Officer' | 'Fraud Investigator' | 'Ketua SMKI' | 'PIC' | 'Viewer'
export type Action = 'Lihat' | 'Tambah' | 'Ubah' | 'Cancel' | 'Approve' | 'Export' | 'Import'
export interface Cancelled { prev: string; reason: string; by: string; at: string }
export interface BaseRec { id: string; no: number; status: string; createdAt: string; createdBy: string; cancelled?: Cancelled }
// Data baru = semua kolom kecuali id/no/createdAt/createdBy/cancelled (status ikut, karena status adalah isian form)
export type NewRec<T> = Omit<T, Exclude<keyof BaseRec, 'status'>>
// Nilai per FieldType: text/textarea/select/date/datetime/yesno ('Ya'|'Tidak'|'') = string; number/money/percent = number | ''; multiselect = string[];
// checklist = Record<subKey, boolean>; file = FileMeta | null; list = Record<string, unknown>[]
export type FieldType = 'text' | 'textarea' | 'number' | 'money' | 'percent' | 'date' | 'datetime' | 'select' | 'multiselect' | 'yesno' | 'checklist' | 'file' | 'list'
export interface Master { departemen: string[]; produk: string[]; pihakPelapor: string[] }
export interface Account { id: string; name: string; email: string; role: Role; departemen: string; status: 'Aktif' | 'Nonaktif'; lastLogin: string; password: string; pin: string }
export interface Ctx { role: Role; user: Account; today: string; master: Master; all: (m: ModuleId) => BaseRec[] }
export interface Field<T> {
  key: string // boleh kunci kolom otomatis yang tidak ada di T. Kunci 'no' diabaikan (kit selalu menampilkan No)
  label: string; type: FieldType
  options?: string[] | ((c: Ctx) => string[])
  required?: boolean | ((r: T, c: Ctx) => boolean)
  auto?: (r: T, c: Ctx) => unknown
  inForm?: 'add' | 'edit' | 'both' | 'none'
  editableBy?: (c: Ctx, r: T) => boolean
  reasonOnChange?: boolean
  sub?: Field<any>[]
  mask?: (c: Ctx) => boolean // true = nilai disamarkan untuk pengguna ini (tabel, detail, export)
  noExport?: boolean; noImport?: boolean
  showIf?: (r: T) => boolean; help?: string; wide?: boolean
}
export interface Column<T> { label: string; get: (r: T, c: Ctx) => string | number; render?: (r: T, c: Ctx) => ReactNode }
export interface FilterDef<T> {
  key: string; label: string; type: 'select' | 'daterange'
  options?: string[] | ((rows: T[], c: Ctx) => string[])
  match: (r: T, v: string | [string, string]) => boolean // daterange: salah satu ujung boleh ''
}
export interface AlertDef<T> {
  key: string; label: string; rule: string
  check: (r: T, c: Ctx) => null | { color: 'yellow' | 'red'; detail: string; to: string[] }
  sample: (c: Ctx) => T
}
export interface ApprovalRule<T> {
  jenis: string; approver: Role
  needs: (old: T, next: T, c: Ctx) => boolean
  keys?: string[] // opsional: hanya kolom ini yang masuk approval; kolom lain yang berubah langsung diterapkan
  pendingPatch?: (old: T) => Partial<T>
  rejectPatch?: (old: T) => Partial<T>
}
export interface RowAction<T> {
  label: string; icon?: ElementType; show: (r: T, c: Ctx) => boolean
  run: (r: T, api: ModuleApi<T>, close: () => void) => void | ReactNode // ReactNode = modal yang dirender shell; close menutupnya
}
export interface PageConfig<T extends BaseRec> {
  module: ModuleId; title: string; noun: string; exportPrefix: string // title harus sama dengan label menu
  seed: (today: string) => T[]
  blank: () => NewRec<T>
  fields: Field<T>[]; columns: Column<T>[]; filters: FilterDef<T>[]
  search: (r: T, c: Ctx) => string; searchPlaceholder: string
  alerts: AlertDef<T>[]
  cancelStatus?: string
  normalize?: (r: T, c: Ctx) => T
  beforeSave?: (old: T | null, next: T, c: Ctx) => T // hook saat tambah/ubah (mis. simpan revisi lama)
  validate?: (r: T, mode: 'add' | 'edit', c: Ctx) => Record<string, string>
  canEditRow?: (r: T, c: Ctx) => boolean
  approvals?: ApprovalRule<T>[]
  rowActions?: RowAction<T>[]
  Dashboard: (p: { rows: T[]; c: Ctx; open: (id: string) => void; drill: (filter: Record<string, unknown>) => void }) => JSX.Element
}
export interface ApprovalReq {
  id: string; no: number; module: ModuleId; jenis: string; recordId: string; recordNo: number
  by: string; byRole: Role; time: string; alasan: string; approver: Role
  changes: { key: string; label: string; lama: string; baru: string; value: unknown }[]
  rejectPatch?: Record<string, unknown>
  extra?: Record<string, unknown> // kolom turunan beforeSave (mis. levelAt) yang ikut diterapkan saat disetujui
  status: 'Menunggu' | 'Disetujui' | 'Ditolak'; decidedBy?: string; decidedAt?: string; catatan?: string
}
export interface LogEntry { id: string; time: string; user: string; role: Role; module: string; aksi: string; nomor: string; keterangan: string }
export interface SavedFilter { name: string; filter: Record<string, unknown> }
export type PermMatrix = Record<Role, Partial<Record<PermKey, Action[]>>>
export interface Store {
  modules: Partial<Record<ModuleId, BaseRec[]>>; saved: Partial<Record<ModuleId, SavedFilter[]>>
  approvals: ApprovalReq[]; log: LogEntry[]; master: Master; accounts: Account[]; perms: PermMatrix; seq: Record<string, number>
}
export interface Session { accountId: string; verified2fa: boolean }
export interface ModuleApi<T> {
  rows: T[]
  add(r: NewRec<T>, silent?: boolean): T
  update(id: string, patch: Partial<T>, alasan?: string): void
  cancel(id: string, reason: string): void
  restore(id: string, reason?: string): void
  stored(id: string): T | undefined // record tersimpan (tanpa normalize), awal form Edit
  requestApproval(id: string, jenis: string, approver: Role, changes: Partial<T>, alasan: string, rejectPatch?: Partial<T>): void
  pendingFor(id: string): ApprovalReq | undefined
}
