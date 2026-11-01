import { useEffect, useState } from 'react'

// ---- Konstanta yang mudah diubah ----
export const WAIT_VALIDATION_DAYS = 7 // usulan: Menunggu Validasi > 7 hari memicu alert
export const NEAR_DUE_DAYS = 7
export const DIRECTOR_DAYS = 7

export const REGULATORS = ['BI', 'PPATK', 'Komdigi', 'BSSN', 'Pemerintah-DPR'] // 'Lainnya' tidak ada di master; ditambahkan otomatis oleh withLainnya di dropdown
export const AREAS = ['APU PPT', 'QRIS', 'SNAP', 'Pelindungan Konsumen', 'Ketahanan Siber']
export const ROOT_TYPES = ['Orang', 'Proses', 'Sistem', 'Kebijakan', 'Pihak Ketiga']
export const STATUSES = ['Open', 'Proses', 'Menunggu Validasi', 'Selesai', 'Dibatalkan'] as const
export const RISKS = ['High', 'Medium', 'Low'] as const
export const UNITS = ['Internal Audit', 'Business', 'Operation', 'Information Technology', 'Compliance Legal & Risk Management', 'Support', 'Finance, Accounting, Tax & Treasury'] // ponytail: sheet "4. Daftar Departemen Paydia" tanpa nomor
const VALIDATORS = ['Rina Kartika', 'Arief Nugraha']
export const ROLES = ['Compliance Officer', 'PIC', 'Head CLRM', 'Viewer'] as const

export type Role = (typeof ROLES)[number]
export type Status = (typeof STATUSES)[number]
export type Risk = (typeof RISKS)[number]

export interface User { id: string; name: string; role: Role }
export const USERS: User[] = [
  { id: 'u1', name: 'Rina Kartika', role: 'Compliance Officer' },
  { id: 'u2', name: 'Arief Nugraha', role: 'Compliance Officer' },
  { id: 'u3', name: 'Dewi Anggraini', role: 'Head CLRM' },
  { id: 'u4', name: 'Regie', role: 'PIC' },
  { id: 'u5', name: 'Fakhri', role: 'PIC' },
  { id: 'u6', name: 'Osama', role: 'PIC' },
  { id: 'u7', name: 'Tono Santoso', role: 'Viewer' },
]
export const PIC_USERS = USERS.filter((u) => u.role === 'PIC')
// Pengguna aktif untuk tiap peran demo
export const ROLE_USER: Record<Role, User> = {
  'Compliance Officer': USERS[0],
  PIC: USERS[3],
  'Head CLRM': USERS[2],
  Viewer: USERS[6],
}
export const userName = (id: string) => USERS.find((u) => u.id === id)?.name ?? id

export interface FileMeta { name: string; size: number; type: string } // hanya metadata, isi file tidak disimpan
export interface Finding {
  id: string
  createdAt: string // waktu data masuk sistem (ISO). Data lama tanpa field ini: lihat createdOf()
  no: number // 1 Nomor Temuan (urutan 1, 2, 3 ...)
  regulator: string // 2
  tglTemuan: string // 3
  area: string // 4
  rootCause: string // 5 (teks)
  rootType: string // 5 (pilihan)
  pic: string // 6 (nama PIC, teks bebas)
  dueDate: string // 7
  status: Status // 8
  validasi: 'Belum' | 'Valid' | 'Tidak Valid' // 10 (tampil di detail hanya jika Selesai)
  validasiOleh: string // nama validator
  validasiTgl: string
  persetujuan: 'Menunggu' | 'Disetujui' | 'Ditolak' // 11
  persetujuanOleh: string
  persetujuanTgl: string
  unit: string // 12
  risiko: Risk // 13
  tindak: string // 14 (teks rencana tindak lanjut)
  tindakFile: FileMeta | null // 14 (satu file bukti)
  suratFile: FileMeta | null // Bukti Surat Regulator
}
export interface Audit { id: string; fid: string; time: string; user: string; aksi: string; kolom: string; lama: string; baru: string; alasan: string }
export interface Filter { q: string; from: string; to: string; status: string; pic: string; unit: string; regulator: string; risiko: string }
export const EMPTY_FILTER: Filter = { q: '', from: '', to: '', status: '', pic: '', unit: '', regulator: '', risiko: '' }
export interface ChangeReq { id: string; no?: number; status?: 'Menunggu' | 'Disetujui' | 'Ditolak'; decidedBy?: string; decidedAt?: string; catatan?: string; fid: string; by: string; time: string; alasan: string; changes: { key: keyof Finding; label: string; lama: string; baru: string; value: unknown }[] }
export const findingLabel = (f: Pick<Finding, 'regulator' | 'area'>) => `${f.regulator} - ${f.area}` // pengganti nomor internal di teks
export const isPendingReq = (r: ChangeReq) => (r.status ?? 'Menunggu') === 'Menunggu' // data lama tanpa status = Menunggu
export interface DB { requests: ChangeReq[]; findings: Finding[]; audit: Audit[] }

// ---- Tanggal ----
const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => iso(new Date())
export const addDays = (s: string, n: number) => {
  const d = new Date((s ?? '') + 'T00:00:00')
  if (isNaN(d.getTime())) return '' // tanggal kosong/rusak: jangan error
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const diffDays = (a: string, b: string) => Math.round((Date.parse((a ?? '').slice(0, 10) + 'T00:00:00Z') - Date.parse((b ?? '').slice(0, 10) + 'T00:00:00Z')) / 864e5) // a - b
export const fmtDate = (s: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '-')
export const fmtTime = (s: string) => (s ? `${fmtDate(s.slice(0, 10))} ${s.slice(11, 16)}` : '-')
export const fmtTimeSec = (s: string) => (s ? `${fmtDate(s.slice(0, 10))} ${(s.slice(11, 19) || '00:00:00').padEnd(8, ':00').slice(0, 8)}` : '-') // dd/mm/yyyy HH:mm:ss
export const nowStr = () => {
  const d = new Date()
  return `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ---- Alert ----
export interface AlertInfo { key: 'near' | 'overdue' | 'stale'; color: 'yellow' | 'red'; label: string; to: string[]; detail: string }
export const isOpenish = (f: Finding) => f.status !== 'Selesai' && f.status !== 'Dibatalkan'
export function waitingSince(f: Finding, audit: Audit[]): string | null {
  const e = audit.filter((a) => a.fid === f.id && a.kolom === 'Status' && a.baru === 'Menunggu Validasi').sort((a, b) => b.time.localeCompare(a.time))[0]
  return e ? e.time.slice(0, 10) : null
}
export function lastDueReason(fid: string, audit: Audit[]): { alasan: string; tgl: string } | null {
  const e = audit.filter((a) => a.fid === fid && a.kolom === 'Batas Waktu' && a.alasan.trim()).sort((a, b) => b.time.localeCompare(a.time))[0]
  return e ? { alasan: e.alasan, tgl: e.time.slice(0, 10) } : null
}
export function alertsFor(f: Finding, audit: Audit[], today = todayStr()): AlertInfo[] {
  if (!isOpenish(f)) return []
  const out: AlertInfo[] = []
  const d = diffDays(f.dueDate, today)
  if (d < 0) {
    const late = -d
    const to = ['PIC', 'Head CLRM']
    if (late > DIRECTOR_DAYS) to.push('Direktur terkait')
    out.push({ key: 'overdue', color: 'red', label: 'Lewat batas waktu', to, detail: `Lewat ${late} hari` })
  } else if (d <= NEAR_DUE_DAYS) {
    out.push({ key: 'near', color: 'yellow', label: 'Mendekati batas waktu', to: ['PIC'], detail: `${d} hari lagi` })
  }
  if (f.status === 'Menunggu Validasi') {
    const since = waitingSince(f, audit)
    if (since) {
      const w = diffDays(today, since)
      if (w > WAIT_VALIDATION_DAYS) out.push({ key: 'stale', color: 'yellow', label: 'Menunggu validasi terlalu lama', to: ['Compliance Officer', 'Head CLRM'], detail: `${w} hari menunggu` })
    }
  }
  return out
}
export const createdOf = (f: Pick<Finding, 'createdAt' | 'tglTemuan'>) => f.createdAt || `${f.tglTemuan}T00:00:00` // data lama: jatuh ke Tanggal Temuan
export const lateDays = (f: Finding, today = todayStr()) => (isOpenish(f) ? Math.max(0, diffDays(today, f.dueDate)) : 0)

// ---- Seed ----
let seedN = 0
const sid = () => `s${++seedN}`
function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const ROOT_TEXT = [
  'Prosedur verifikasi merchant belum diperbarui', 'Monitoring transaksi mencurigakan belum otomatis', 'Pelatihan staf belum merata',
  'Konfigurasi sistem tidak sesuai standar', 'Vendor tidak memenuhi SLA pelaporan', 'Kebijakan internal belum selaras dengan regulasi terbaru',
  'Dokumentasi uji penetrasi tidak lengkap', 'Penanganan keluhan konsumen melewati batas waktu',
]
const TODO_TEXT = [
  'Perbarui SOP', 'Lakukan pelatihan ulang staf', 'Konfigurasi ulang sistem monitoring', 'Susun laporan perbaikan untuk regulator',
  'Audit internal atas perbaikan', 'Revisi kebijakan', 'Koordinasi dengan vendor', 'Uji coba sistem pasca perbaikan',
]

export function makeSeed(): DB {
  seedN = 0
  const t = todayStr()
  const r = rng(42)
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  const findings: Finding[] = []
  const audit: Audit[] = []
  // request approval contoh Tracker (Menunggu / Disetujui / Ditolak); audit ditambah tanpa rng agar seed lain tidak bergeser
  const requests: ChangeReq[] = []
  const req = (f: Finding, status: 'Menunggu' | 'Disetujui' | 'Ditolak', time: string, alasan: string, decided?: { by: string; at: string; catatan: string }) => {
    const cs: ChangeReq['changes'] = [{ key: 'status', label: 'Status', lama: f.status, baru: 'Selesai', value: 'Selesai' }, { key: 'validasi', label: 'Validasi Ulang', lama: 'Belum', baru: 'Valid', value: 'Valid' }, { key: 'validasiOleh', label: 'Nama Validator', lama: '', baru: VALIDATORS[requests.length % VALIDATORS.length], value: VALIDATORS[requests.length % VALIDATORS.length] }]
    requests.push({ id: `rs${f.id}`, no: requests.length + 1, status, fid: f.id, by: f.pic, time, alasan, changes: cs, ...(decided ? { decidedBy: decided.by, decidedAt: decided.at, catatan: decided.catatan } : {}) })
  }
  let approved = 0
  let rejected = false
  const log = (f: Finding, date: string, user: string, aksi: string, kolom = '', lama = '', baru = '', alasan = '') =>
    audit.push({ id: sid(), fid: f.id, time: `${date}T09:${pad(ri(0, 59))}:00`, user, aksi, kolom, lama, baru, alasan })

  // [due offset, status, extra]
  type Sc = { due: number; status: Status; wait?: number }
  const sc: Sc[] = []
  for (const d of [1, 3, 5, 7, 2]) sc.push({ due: d, status: sc.length % 2 ? 'Proses' : 'Open' }) // hampir jatuh tempo
  for (const d of [-1, -3, -5, -7, -2]) sc.push({ due: d, status: sc.length % 2 ? 'Proses' : 'Open' }) // lewat 1-7
  for (const d of [-9, -20, -45, -100]) sc.push({ due: d, status: 'Proses' }) // lewat >7 (semua bucket)
  sc.push({ due: 30, status: 'Menunggu Validasi', wait: 9 }, { due: -4, status: 'Menunggu Validasi', wait: 12 }, { due: 15, status: 'Menunggu Validasi', wait: 20 }) // menunggu >7
  sc.push({ due: 20, status: 'Menunggu Validasi', wait: 2 }, { due: 40, status: 'Menunggu Validasi', wait: 4 })
  for (let i = 0; i < 10; i++) sc.push({ due: ri(-90, 30), status: 'Selesai' })
  for (let i = 0; i < 9; i++) sc.push({ due: ri(14, 120), status: i % 3 === 0 ? 'Open' : 'Proses' })
  sc.push({ due: 25, status: 'Dibatalkan' }, { due: -15, status: 'Dibatalkan' })

  sc.forEach((s, i) => {
    const due = addDays(t, s.due)
    let tgl = addDays(due, -ri(30, 150))
    if (diffDays(tgl, t) > -5) tgl = addDays(t, -ri(10, 60))
    if (s.status === 'Selesai' && diffDays(due, tgl) < 10) tgl = addDays(due, -30)
    const no = i + 1
    const pic = PIC_USERS[i % PIC_USERS.length].name // PIC = master PIC (Regie/Fakhri/Osama)
    const tindak = pick(TODO_TEXT)
    const tindakFile: FileMeta = { name: `bukti_temuan-${no}.pdf`, size: ri(80, 900) * 1024, type: 'application/pdf' }
    const regulator = i < 8 ? REGULATORS[i % REGULATORS.length] : pick(REGULATORS)
    const suratFile: FileMeta = { name: `surat-${regulator}-${String(i + 1).padStart(3, '0')}.pdf`, size: ri(100, 1500) * 1024, type: 'application/pdf' }
    const f: Finding = {
      id: `f${i + 1}`, createdAt: '', no, regulator, tglTemuan: tgl, area: i < 6 ? AREAS[i % AREAS.length] : pick(AREAS),
      rootCause: pick(ROOT_TEXT), rootType: pick(ROOT_TYPES), pic, dueDate: due, status: s.status,
      validasi: 'Belum', validasiOleh: '', validasiTgl: '', persetujuan: 'Menunggu', persetujuanOleh: '', persetujuanTgl: '',
      unit: i < 6 ? UNITS[i] : pick(UNITS), risiko: pick(RISKS), tindak, tindakFile, suratFile,
    }
    log(f, tgl, 'Rina Kartika', 'Tambah temuan', 'Temuan', '', findingLabel(f))
    f.createdAt = audit[audit.length - 1].time // sama dengan waktu audit 'Tambah temuan'
    const start = addDays(tgl, 3)
    if (s.status === 'Proses' || s.status === 'Dibatalkan') {
      log(f, start, pic, 'Ubah temuan', 'Status', 'Open', 'Proses')
    }
    if (s.status === 'Proses' && i >= 10 && !rejected) { // satu pengajuan ditolak: status temuan tetap, Persetujuan Penutupan = Ditolak
      rejected = true
      const at = addDays(t, -6)
      req(f, 'Ditolak', `${addDays(t, -8)}T09:20:00`, 'Perbaikan diklaim selesai', { by: 'Dewi Anggraini', at: `${at}T11:05:00`, catatan: 'Bukti tindak lanjut belum lengkap' })
      f.persetujuan = 'Ditolak'; f.persetujuanOleh = 'Dewi Anggraini'; f.persetujuanTgl = at
      audit.push({ id: sid(), fid: f.id, time: `${at}T11:05:00`, user: 'Dewi Anggraini', aksi: 'Tolak penutupan', kolom: 'Status', lama: 'Proses', baru: 'Selesai', alasan: 'Bukti tindak lanjut belum lengkap' })
    }
    if (s.status === 'Menunggu Validasi') {
      log(f, start, pic, 'Ubah temuan', 'Status', 'Open', 'Proses')
      log(f, addDays(t, -(s.wait ?? 3)), pic, 'Ajukan penutupan', 'Status', 'Proses', 'Menunggu Validasi')
      req(f, 'Menunggu', `${addDays(t, -(s.wait ?? 3))}T09:30:00`, 'Bukti perbaikan sudah lengkap dan divalidasi')
    }
    if (s.status === 'Selesai') {
      const closeAt = addDays(tgl, Math.min(ri(15, 100), Math.max(15, diffDays(t, tgl) - 1)))
      const close = diffDays(closeAt, t) > 0 ? t : closeAt
      f.validasi = 'Valid'; f.validasiOleh = pick(VALIDATORS); f.validasiTgl = addDays(close, -2)
      f.persetujuan = 'Disetujui'; f.persetujuanOleh = 'Dewi Anggraini'; f.persetujuanTgl = close
      log(f, addDays(close, -5), pic, 'Ajukan penutupan', 'Status', 'Proses', 'Menunggu Validasi')
      log(f, f.validasiTgl, f.validasiOleh, 'Validasi ulang', 'Validasi Ulang', 'Belum', 'Valid')
      log(f, close, 'Dewi Anggraini', 'Persetujuan penutupan', 'Status', 'Menunggu Validasi', 'Selesai')
      if (approved++ < 3) req({ ...f, status: 'Menunggu Validasi' }, 'Disetujui', `${addDays(close, -5)}T09:40:00`, 'Perbaikan selesai, bukti terlampir', { by: 'Dewi Anggraini', at: `${close}T10:15:00`, catatan: 'Bukti memadai' })
    }
    if (s.status === 'Dibatalkan') log(f, addDays(t, -3), 'Dewi Anggraini', 'Batalkan temuan', 'Status', 'Proses', 'Dibatalkan', 'Temuan duplikat dengan laporan regulator sebelumnya')
    findings.push(f)
  })
  return { requests, findings, audit }
}

// ---- Penyimpanan ----
// ponytail: v5 = seed punya createdAt dan tanpa 'Lainnya' di daftar; data v4 lama tetap aman dibaca (createdOf) tetapi direset agar seed baru dipakai
export const KEY = 'clrm.db.v9' // ponytail: v9 = seed request approval Tracker (Menunggu/Disetujui/Ditolak), seed lama dibuang karena kunci naik; v8 = Unit Kerja seed dari sheet Departemen, Pemerintah-DPR di daftar regulator, filter tersimpan dihapus; v7 = teks audit tanpa nomor internal; v6 = PIC seed Regie/Fakhri/Osama; v5 seed lama tidak dibaca lagi (key beda), load() tetap aman membaca bentuk lama
const ROLE_KEY = 'clrm.role'
function load(): DB {
  try {
    const s = localStorage.getItem(KEY)
    if (s) { const { saved: _saved, ...d } = JSON.parse(s); return { requests: [], ...d } as DB } // `saved` (filter tersimpan) sudah dihapus: dibuang dari data lama
  } catch { /* abaikan */ }
  return makeSeed()
}
export function useDB() {
  const [db, setDb] = useState<DB>(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* abaikan */ }
  }, [db])
  const reset = () => setDb(makeSeed())
  return { db, setDb, reset }
}
export function useRole() {
  const [role, setRole] = useState<Role>(() => {
    try { const r = localStorage.getItem(ROLE_KEY) as Role; if (ROLES.includes(r)) return r } catch { /* abaikan */ }
    return 'Compliance Officer'
  })
  useEffect(() => { try { localStorage.setItem(ROLE_KEY, role) } catch { /* abaikan */ } }, [role])
  return [role, setRole] as const
}

// ---- Request perubahan tracker: dipakai Tracker (Drawer) dan menu Approval ----
// Setuju: terapkan changes ke temuan + audit 'Setujui perubahan'. Tolak: audit 'Tolak perubahan' (note = alasan).
// Request tidak dihapus: ditandai Disetujui/Ditolak supaya tetap tampil di menu Approval.
export function applyTrackerRequest(db: DB, reqId: string, userName: string, approve: boolean, note = ''): DB {
  const r = db.requests.find((x) => x.id === reqId)
  if (!r || !isPendingReq(r)) return db
  const f = db.findings.find((x) => x.id === r.fid)
  const ok = approve && !!f
  const requests = db.requests.map((x) => (x.id === reqId ? { ...x, status: ok ? ('Disetujui' as const) : ('Ditolak' as const), decidedBy: userName, decidedAt: nowStr(), catatan: note } : x))
  const mk = (aksi: string, alasan: string): Audit[] => r.changes.map((c, i) => ({ id: `${r.fid}-${Date.now()}-${i}`, fid: r.fid, time: nowStr(), user: userName, aksi, kolom: c.label, lama: c.lama, baru: c.baru, alasan }))
  if (!ok || !f) {
    const rej = f ? { ...f, persetujuan: 'Ditolak' as const, persetujuanOleh: userName, persetujuanTgl: todayStr() } : null
    return { ...db, requests, findings: rej ? db.findings.map((x) => (x.id === f!.id ? rej : x)) : db.findings, audit: [...db.audit, ...mk('Tolak penutupan', note)] }
  }
  const next = { ...f } as Record<string, unknown>
  r.changes.forEach((c) => { next[c.key] = c.value })
  if (next.status === 'Selesai' && f.status !== 'Selesai') { next.validasiTgl = todayStr(); next.persetujuan = 'Disetujui'; next.persetujuanOleh = userName; next.persetujuanTgl = todayStr() }
  return { ...db, requests, findings: db.findings.map((x) => (x.id === f.id ? (next as unknown as Finding) : x)), audit: [...db.audit, ...mk('Setujui penutupan', r.alasan)] }
}

// ---- Filter ----
export function applyFilter(list: Finding[], f: Filter): Finding[] {
  const q = f.q.trim().toLowerCase()
  return list.filter((x) => {
    if (q && !`${x.no} ${x.regulator} ${x.area} ${x.pic}`.toLowerCase().includes(q)) return false
    if (f.from && x.tglTemuan < f.from) return false
    if (f.to && x.tglTemuan > f.to) return false
    if (f.status && x.status !== f.status) return false
    if (f.pic && x.pic !== f.pic) return false
    if (f.unit && x.unit !== f.unit) return false
    if (f.regulator && (f.regulator === 'Lainnya' ? REGULATORS.includes(x.regulator) : x.regulator !== f.regulator)) return false // 'Lainnya' = teks bebas di luar daftar
    if (f.risiko && x.risiko !== f.risiko) return false
    return true
  })
}
export const describeFilter = (f: Filter) => {
  const p = [f.q && `cari="${f.q}"`, f.from && `dari ${f.from}`, f.to && `sampai ${f.to}`, f.status && `status=${f.status}`, f.pic && `PIC=${f.pic}`, f.unit && `unit=${f.unit}`, f.regulator && `regulator=${f.regulator}`, f.risiko && `risiko=${f.risiko}`].filter(Boolean)
  return p.length ? p.join('; ') : 'Tanpa filter'
}

// ---- Upload file ----
export const MAX_FILE_BYTES = 25 * 1024 * 1024
export const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const EXT_MIME: Record<string, string> = { pdf: 'application/pdf', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' }
const OK_EXT = Object.keys(EXT_MIME)
export const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)
// Mengembalikan pesan error (Indonesia) atau null jika valid. Ekstensi DAN MIME harus valid.
export function validateFile(file: { name: string; size: number; type: string }): string | null {
  if (file.size === 0) return 'File kosong'
  const dot = file.name.lastIndexOf('.')
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : ''
  if (!OK_EXT.includes(ext)) return 'Format file harus PDF, JPG, JPEG, atau PNG'
  if (!file.type) return 'Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG'
  if (EXT_MIME[ext] !== file.type.toLowerCase()) return 'Format file harus PDF, JPG, JPEG, atau PNG'
  if (file.size > MAX_FILE_BYTES) return 'Ukuran file maksimal 25 MB'
  return null
}
