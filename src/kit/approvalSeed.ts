import { addDays, todayStr } from '../lib'
import { config as fraud } from '../pages/Fraud'
import { config as regchange } from '../pages/RegChange'
import { config as risk } from '../pages/RiskRegister'
import { fmtValue } from './fmt'
import { getStore, readModule, setStore } from './store'
import type { ApprovalReq, BaseRec, Ctx, PageConfig, Role } from './types'

// Seed approval untuk modul yang punya alur approval selain Tracker (Tracker punya seed sendiri di lib.ts):
// Fraud (Penutupan Kasus), Regulatory Change (Perubahan Daftar Peraturan), Risk Register (Perubahan Level Risiko).
// Bentuk sama dengan request live (useModule.mkReq): changes {key,label,lama,baru,value}, extra bila ada, status Menunggu/Disetujui/Ditolak.
// Disetujui: nilai baru sudah ada di record (sama seperti decideApproval). Menunggu: record tetap bernilai lama sampai diputuskan di halaman Approval.
// Dipanggil sekali saat aplikasi dimuat (flag seq.approvalSeed), bukan saat render.
type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
export function seedApprovals() {
  const s0 = getStore()
  if (s0.seq.approvalSeed) return
  const today = todayStr()
  const c: Ctx = { role: 'Super Admin', user: s0.accounts[0], today, master: s0.master, all: (m) => getStore().modules[m] ?? [] }
  const nameOf = (role: Role) => s0.accounts.find((a) => a.role === role && a.status === 'Active')?.name ?? role
  const reqs: ApprovalReq[] = []
  let no = Math.max(s0.seq.approval ?? 0, 20) // nomor request Tracker seed 1..9
  const add = <T extends BaseRec>(cfg: PageConfig<T>, id: string, jenis: string, approver: Role, byRole: Role, by: string, ago: number, alasan: string,
    patch: (r: T) => R, status: ApprovalReq['status'], extra?: R, catatan?: string, before?: R) => {
    const rec = readModule(cfg.module, cfg.seed).find((x) => x.id === id) as T | undefined
    if (!rec) return
    const p = patch(rec)
    const time = `${addDays(today, -ago)}T09:${String((no * 7) % 60).padStart(2, '0')}:00`
    const show = (k: string, v: unknown) => { const f = cfg.fields.find((x) => x.key === k); return f ? fmtValue(f, v, c) : String(v ?? '') }
    const changes = Object.keys(p).map((k) => ({ key: k, label: cfg.fields.find((x) => x.key === k)?.label ?? k, lama: show(k, before && k in before ? before[k] : (rec as R)[k]), baru: show(k, p[k]), value: p[k] }))
    no += 1
    reqs.push({
      id: `ap-seed-${no}`, no, module: cfg.module, jenis, recordId: rec.id, recordNo: rec.no, recordLabel: cfg.name?.(rec) ?? '', by, byRole, time, alasan, approver,
      changes, extra: extra && Object.keys(extra).length ? extra : undefined, status,
      ...(status === 'Menunggu' ? {} : { decidedBy: nameOf(approver), decidedAt: `${addDays(today, -Math.max(0, ago - 1))}T14:20:00`, catatan: catatan ?? '' }),
    })
    if (status === 'Disetujui') Object.assign(rec, p, extra) // sama seperti decideApproval
  }

  // Fraud: penutupan kasus (approver Head CLRM). Kasus yang diajukan tetap Open; kasus Closed yang disetujui sudah Closed.
  const close = (r: { tglTerima: string }, d: number) => ({ status: 'Closed', tglResolved: addDays(r.tglTerima, d) > today ? today : addDays(r.tglTerima, d) })
  const closedId = (readModule(fraud.module, fraud.seed) as { id: string; status: string; cancelled?: unknown }[]).find((r) => r.status === 'Closed' && !r.cancelled)?.id
  add(fraud, 'fraud-8', 'Penutupan Kasus', 'Head CLRM', 'Fraud Investigator', 'Fakhri', 2, 'EDD selesai, tindakan Watchlist sudah dijalankan', (r) => close(r as never, 90), 'Menunggu')
  add(fraud, 'fraud-11', 'Penutupan Kasus', 'Head CLRM', 'Fraud Investigator', 'Fakhri', 1, 'Tidak ada tindak lanjut tambahan', (r) => close(r as never, 6), 'Menunggu')
  if (closedId) add(fraud, closedId, 'Penutupan Kasus', 'Head CLRM', 'Fraud Investigator', 'Fakhri', 14, 'Kasus selesai dan dokumen lengkap', (r) => ({ status: 'Closed', tglResolved: (r as R).tglResolved }), 'Disetujui', undefined, 'Disetujui, dokumen lengkap', { status: 'Open', tglResolved: '' }) // record sudah Closed: nilai lama = sebelum penutupan
  add(fraud, 'fraud-9', 'Penutupan Kasus', 'Head CLRM', 'Fraud Investigator', 'Fakhri', 9, 'Kasus ditutup karena tidak ada respons', (r) => close(r as never, 100), 'Ditolak', undefined, 'Bukti pelaporan ke regulator belum lengkap')

  // Regulatory Change: perubahan data identitas peraturan (approver Ketua SMKI)
  add(regchange, 'regchange-3', 'Perubahan Daftar Peraturan', 'Ketua SMKI', 'Compliance Officer', 'Rina Kartika', 2, 'Judul peraturan perlu dilengkapi sesuai naskah resmi', (r) => ({ tentang: `${(r as R).tentang} (termasuk data pribadi sensitif)` }), 'Menunggu')
  add(regchange, 'regchange-19', 'Perubahan Daftar Peraturan', 'Ketua SMKI', 'Compliance Officer', 'Arief Nugraha', 1, 'Tanggal berlaku mundur sesuai surat BI', (r) => ({ tglBerlaku: addDays((r as R).tglBerlaku || today, 14) }), 'Menunggu')
  add(regchange, 'regchange-7', 'Perubahan Daftar Peraturan', 'Ketua SMKI', 'Compliance Officer', 'Rina Kartika', 20, 'Cakupan peraturan diperluas ke penyelenggara non-bank', (r) => ({ tentang: `${(r as R).tentang} dan penyelenggara non-bank` }), 'Disetujui', undefined, 'Sesuai naskah resmi')
  add(regchange, 'regchange-13', 'Perubahan Daftar Peraturan', 'Ketua SMKI', 'Compliance Officer', 'Arief Nugraha', 11, 'Perbaikan judul peraturan', (r) => ({ tentang: `${(r as R).tentang} (revisi)` }), 'Ditolak', undefined, 'Judul tidak sesuai naskah resmi')

  // Risk Register: perubahan level risiko oleh peran selain Risk Officer (approver Risk Officer). levelAt ikut sebagai extra bila level naik.
  add(risk, 'risk-2', 'Perubahan Level Risiko', 'Risk Officer', 'PIC', 'Regie', 2, 'Dampak meningkat setelah insiden bulan ini', () => ({ dampak: 3 }), 'Menunggu', { levelAt: today })
  add(risk, 'risk-14', 'Perubahan Level Risiko', 'Risk Officer', 'Compliance Officer', 'Arief Nugraha', 1, 'Kemungkinan naik karena temuan regulator', () => ({ kemungkinan: 3 }), 'Menunggu', { levelAt: today })
  add(risk, 'risk-5', 'Perubahan Level Risiko', 'Risk Officer', 'PIC', 'Regie', 12, 'Dampak naik karena volume transaksi bertambah', () => ({ dampak: 2 }), 'Disetujui', { levelAt: addDays(today, -11) }, 'Disetujui, sesuai hasil asesmen')
  add(risk, 'risk-12', 'Perubahan Level Risiko', 'Risk Officer', 'PIC', 'Regie', 7, 'Kemungkinan dinaikkan', () => ({ kemungkinan: 3 }), 'Ditolak', undefined, 'Dasar penilaian belum memadai')

  setStore((s) => ({ ...s, approvals: [...reqs.reverse(), ...s.approvals], seq: { ...s.seq, approval: no, approvalSeed: 1 } }))
}
