import { useEffect, useState } from 'react'

// ---- Konstanta yang mudah diubah ----
export const WAIT_VALIDATION_DAYS = 7 // usulan: Menunggu Validasi > 7 hari memicu alert
export const NEAR_DUE_DAYS = 7
export const DIRECTOR_DAYS = 7

export const REGULATORS = ['BI', 'PPATK', 'Komdigi', 'BSSN', 'Lainnya']
export const AREAS = ['APU PPT', 'QRIS', 'SNAP', 'Pelindungan Konsumen', 'Ketahanan Siber', 'Lainnya']
export const ROOT_TYPES = ['Orang', 'Proses', 'Sistem', 'Kebijakan', 'Pihak Ketiga']
export const STATUSES = ['Open', 'Proses', 'Menunggu Validasi', 'Selesai', 'Dibatalkan'] as const
export const RISKS = ['High', 'Medium', 'Low'] as const
export const UNITS = ['Operasional', 'Teknologi Informasi', 'Produk & Bisnis', 'Layanan Merchant', 'Keuangan', 'Keamanan Informasi']
export const ROLES = ['Compliance Officer', 'PIC', 'Head CLRM', 'Viewer'] as const

export type Role = (typeof ROLES)[number]
export type Status = (typeof STATUSES)[number]
export type Risk = (typeof RISKS)[number]

export interface User { id: string; name: string; role: Role }
export const USERS: User[] = [
  { id: 'u1', name: 'Rina Kartika', role: 'Compliance Officer' },
  { id: 'u2', name: 'Arief Nugraha', role: 'Compliance Officer' },
  { id: 'u3', name: 'Dewi Anggraini', role: 'Head CLRM' },
  { id: 'u4', name: 'Bima Pratama', role: 'PIC' },
  { id: 'u5', name: 'Sari Wulandari', role: 'PIC' },
  { id: 'u6', name: 'Hendra Wijaya', role: 'PIC' },
  { id: 'u7', name: 'Maya Lestari', role: 'PIC' },
  { id: 'u8', name: 'Tono Santoso', role: 'Viewer' },
]
export const PIC_USERS = USERS.filter((u) => u.role === 'PIC')
// Pengguna aktif untuk tiap peran demo
export const ROLE_USER: Record<Role, User> = {
  'Compliance Officer': USERS[0],
  PIC: USERS[3],
  'Head CLRM': USERS[2],
  Viewer: USERS[7],
}
export const userName = (id: string) => USERS.find((u) => u.id === id)?.name ?? id

export interface Todo { id: string; text: string; files: string[] }
export interface Finding {
  id: string
  no: string // 1 Nomor Temuan
  regulator: string // 2
  tglTemuan: string // 3
  area: string // 4
  rootCause: string // 5 (teks)
  rootType: string // 5 (pilihan)
  pic: string // 6 (id user)
  dueDate: string // 7
  status: Status // 8
  progress: number // 9
  validasi: 'Belum' | 'Valid' | 'Tidak Valid' // 10
  validasiOleh: string
  validasiTgl: string
  persetujuan: 'Menunggu' | 'Disetujui' | 'Ditolak' // 11
  persetujuanOleh: string
  persetujuanTgl: string
  unit: string // 12
  risiko: Risk // 13
  tindak: Todo[] // 14
}
export interface Audit { id: string; fid: string; time: string; user: string; aksi: string; kolom: string; lama: string; baru: string; alasan: string }
export interface Filter { q: string; from: string; to: string; status: string; pic: string; unit: string; regulator: string; risiko: string }
export const EMPTY_FILTER: Filter = { q: '', from: '', to: '', status: '', pic: '', unit: '', regulator: '', risiko: '' }
export interface ExportLog { id: string; time: string; user: string; filter: string; rows: number; file: string }
export interface DB { findings: Finding[]; audit: Audit[]; saved: { name: string; filter: Filter; showCancelled: boolean }[]; exports: ExportLog[] }

// ---- Tanggal ----
const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => iso(new Date())
export const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const diffDays = (a: string, b: string) => Math.round((Date.parse(a.slice(0, 10) + 'T00:00:00Z') - Date.parse(b.slice(0, 10) + 'T00:00:00Z')) / 864e5) // a - b
export const fmtDate = (s: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '-')
export const fmtTime = (s: string) => `${fmtDate(s.slice(0, 10))} ${s.slice(11, 16)}`
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
    out.push({ key: 'near', color: 'yellow', label: 'Hampir jatuh tempo', to: ['PIC'], detail: `${d} hari lagi` })
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
    const year = tgl.slice(0, 4)
    const no = `TR-${year}-${String(i + 1).padStart(4, '0')}`
    const pic = PIC_USERS[i < 12 ? (i % 4 === 0 ? 0 : i % 4) : i % 4].id
    const nTodo = i % 5 === 0 ? ri(3, 4) : i % 3 === 0 ? 2 : 1
    const tindak: Todo[] = Array.from({ length: nTodo }, (_, k) => ({
      id: sid(), text: pick(TODO_TEXT),
      files: k === 0 || r() > 0.5 ? [`bukti_${no.toLowerCase()}_${k + 1}.pdf`] : [],
    }))
    const f: Finding = {
      id: `f${i + 1}`, no, regulator: i < 8 ? REGULATORS[i % 5] : pick(REGULATORS), tglTemuan: tgl, area: i < 6 ? AREAS[i % 6] : pick(AREAS),
      rootCause: pick(ROOT_TEXT), rootType: pick(ROOT_TYPES), pic, dueDate: due, status: s.status, progress: 0,
      validasi: 'Belum', validasiOleh: '', validasiTgl: '', persetujuan: 'Menunggu', persetujuanOleh: '', persetujuanTgl: '',
      unit: i < 6 ? UNITS[i] : pick(UNITS), risiko: pick(RISKS), tindak,
    }
    log(f, tgl, 'Rina Kartika', 'Tambah temuan', 'Nomor Temuan', '', no)
    const start = addDays(tgl, 3)
    if (s.status === 'Open') f.progress = ri(0, 25)
    if (s.status === 'Proses' || s.status === 'Dibatalkan') {
      f.progress = ri(20, 80)
      log(f, start, userName(pic), 'Ubah temuan', 'Status', 'Open', 'Proses')
      log(f, addDays(start, 5), userName(pic), 'Ubah temuan', 'Persentase Progress', '0', String(f.progress))
    }
    if (s.status === 'Menunggu Validasi') {
      f.progress = 100
      log(f, start, userName(pic), 'Ubah temuan', 'Status', 'Open', 'Proses')
      log(f, addDays(t, -(s.wait ?? 3)), userName(pic), 'Ajukan penutupan', 'Status', 'Proses', 'Menunggu Validasi')
    }
    if (s.status === 'Selesai') {
      f.progress = 100
      const closeAt = addDays(tgl, Math.min(ri(15, 100), Math.max(15, diffDays(t, tgl) - 1)))
      const close = diffDays(closeAt, t) > 0 ? t : closeAt
      f.validasi = 'Valid'; f.validasiOleh = 'Rina Kartika'; f.validasiTgl = addDays(close, -2)
      f.persetujuan = 'Disetujui'; f.persetujuanOleh = 'Dewi Anggraini'; f.persetujuanTgl = close
      log(f, addDays(close, -5), userName(pic), 'Ajukan penutupan', 'Status', 'Proses', 'Menunggu Validasi')
      log(f, f.validasiTgl, 'Rina Kartika', 'Validasi ulang', 'Validasi Ulang', 'Belum', 'Valid')
      log(f, close, 'Dewi Anggraini', 'Persetujuan penutupan', 'Status', 'Menunggu Validasi', 'Selesai')
    }
    if (s.status === 'Dibatalkan') log(f, addDays(t, -3), 'Dewi Anggraini', 'Batalkan temuan', 'Status', 'Proses', 'Dibatalkan', 'Temuan duplikat dengan laporan regulator sebelumnya')
    findings.push(f)
  })
  return { findings, audit, saved: [], exports: [] }
}

// ---- Penyimpanan ----
const KEY = 'clrm.db.v1'
const ROLE_KEY = 'clrm.role'
function load(): DB {
  try {
    const s = localStorage.getItem(KEY)
    if (s) return JSON.parse(s) as DB
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

// ---- Filter ----
export function applyFilter(list: Finding[], f: Filter, showCancelled: boolean): Finding[] {
  const q = f.q.trim().toLowerCase()
  return list.filter((x) => {
    if (x.status === 'Dibatalkan' && !showCancelled && f.status !== 'Dibatalkan') return false
    if (q && !`${x.no} ${x.regulator} ${x.area} ${userName(x.pic)}`.toLowerCase().includes(q)) return false
    if (f.from && x.tglTemuan < f.from) return false
    if (f.to && x.tglTemuan > f.to) return false
    if (f.status && x.status !== f.status) return false
    if (f.pic && x.pic !== f.pic) return false
    if (f.unit && x.unit !== f.unit) return false
    if (f.regulator && x.regulator !== f.regulator) return false
    if (f.risiko && x.risiko !== f.risiko) return false
    return true
  })
}
export const describeFilter = (f: Filter, showCancelled: boolean) => {
  const p = [f.q && `cari="${f.q}"`, f.from && `dari ${f.from}`, f.to && `sampai ${f.to}`, f.status && `status=${f.status}`, f.pic && `PIC=${userName(f.pic)}`, f.unit && `unit=${f.unit}`, f.regulator && `regulator=${f.regulator}`, f.risiko && `risiko=${f.risiko}`, showCancelled && 'termasuk dibatalkan'].filter(Boolean)
  return p.length ? p.join('; ') : 'Tanpa filter'
}
export const todoText = (t: Todo[]) => t.map((x) => x.text + (x.files.length ? ` [${x.files.join(', ')}]` : '')).join(' | ')
