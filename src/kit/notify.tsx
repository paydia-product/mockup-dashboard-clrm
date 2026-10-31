import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, Bell, CheckCheck } from 'lucide-react'
import { DB, alertsFor, diffDays, findingLabel, fmtDate, fmtTime, nowStr } from '../lib'
import { config as aph } from '../pages/Aph'
import { config as fraud } from '../pages/Fraud'
import { config as kajian } from '../pages/Kajian'
import { config as kontrak } from '../pages/Kontrak'
import { config as layanan } from '../pages/LayananHukum'
import { config as perizinan } from '../pages/Perizinan'
import { config as regchange } from '../pages/RegChange'
import { config as reporting } from '../pages/Reporting'
import { config as risk } from '../pages/RiskRegister'
import { config as sop } from '../pages/Sop'
import { can as canPerm, sameName } from './perms'
import { readModule, useApp } from './store'
import type { Account, BaseRec, Ctx, ModuleId, PageConfig } from './types'

// Pusat notifikasi: dihitung langsung dari data + aturan alert tiap halaman (AlertDef.check). Tidak ada data notifikasi yang disimpan
// selain status baca dan waktu pertama muncul (localStorage, per akun demo).
export interface Notif {
  id: string; module: ModuleId | 'tracker'; route: string; page: string; recordId: string; ref: string
  color: 'yellow' | 'red'; title: string; message: string; to: string[]
}

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const SOURCES: { route: string; cfg: PageConfig<any>; ref?: (r: R) => string }[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
  { route: 'compliance/regulatory-reporting', cfg: reporting, ref: (r) => `${r.nama} (${r.jenis === 'Insidental' ? String(r.periode).replace(/^Insiden /i, '') : r.periode})` },
  { route: 'compliance/regulatory-change', cfg: regchange },
  { route: 'compliance/sop-dokumen-kontrol', cfg: sop, ref: (r) => `${r.noDok} - ${r.judul}` },
  { route: 'risk/risk-register', cfg: risk },
  { route: 'risk/kajian-risiko', cfg: kajian },
  { route: 'fraud/fraud-case-monitoring', cfg: fraud },
  { route: 'legal/kontrak', cfg: kontrak },
  { route: 'legal/permintaan-aph', cfg: aph },
  { route: 'legal/perizinan', cfg: perizinan, ref: (r) => `${r.nama} (${r.nomor})` },
  { route: 'legal/layanan-hukum', cfg: layanan },
]
export const TRACKER_ROUTE = 'compliance/regulatory-findings-tracker'

// ---- Redaksi per jenis alert: [judul, pesan(subjek, detail alert, rekaman, hari ini)] ----
const lc = (s: string) => (/^(?!High|Open|Hold|Comply|Dicabut)[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s) // singkatan (BAP, EDD) dibiarkan
// "0 hari lagi" -> "hari ini", "1 hari lagi" -> "besok", "1 hari lalu" -> "kemarin" (hari kerja tidak jadi "besok": 1 hari kerja bisa jatuh di Senin)
const zero = (d: string) => d.replace(/\b0 hari( kerja)? (lagi|lalu)/, 'hari ini').replace(/\b1 hari lagi/, 'besok').replace(/\b1 hari lalu/, 'kemarin')
const list = (a: string[]) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')}${a.length > 2 ? ',' : ''} dan ${a[a.length - 1]}`) // "a", "a dan b", "a, b, dan c"
const fields = (d: string) => list(d.replace(/^(Belum diisi|Kosong): /, '').split(', ')) // daftar kolom kosong dari detail alert
const lewat = (d: string) => d.replace(/^lewat /i, '') // "Lewat 5 hari" -> "5 hari"
const subj = (noun: string, name: string) => (name.toLowerCase().startsWith(noun.toLowerCase()) ? name : `${noun} ${name}`.trim())
const insiden = (r: R) => String(r.periode).replace(/^Insiden /i, '')
const lap = (r: R) => `${subj('Laporan', r.nama)} (${r.jenis === 'Insidental' ? insiden(r) : `periode ${r.periode}`})` // mis. "Laporan Dana Float (periode 28/10/2026)"
const when = (n: number) => (n === 0 ? 'hari ini' : n === 1 ? 'besok' : `${n} hari lagi`)
// Judul 'near' harus cocok dengan isi: 0 hari = jatuh tempo hari ini, selain itu mendekati batas waktu
// Judul diturunkan dari label alert halaman (AlertDef.label) supaya tidak bisa berbeda: judul = kata benda + label ("Temuan" + "Mendekati batas waktu").
const withNoun = (noun: string) => (_d: string, label: string) => `${noun} ${lc(label)}`
const nearTitle = (noun: string) => (d: string, label: string) => (/^(H-0 |0 hari)/.test(d) ? `${noun} jatuh tempo hari ini` : withNoun(noun)(d, label))
const sameLabel = (_d: string, label: string) => label // judul persis sama dengan label halaman
const sopTitle = (d: string, label: string) => (/^Peninjauan 0 hari/.test(d) ? 'Peninjauan SOP jatuh tempo hari ini' : label.replace(/^Peninjauan/, 'Peninjauan SOP'))
const nearTxt = (d: string) => d.replace(/^0 hari( kerja)? lagi$/, 'hari ini')
type Word = [string | ((d: string, label: string) => string), (s: string, d: string, r: R, today: string) => string]
const WORDS: Record<string, Word> = {
  'tracker.near': [nearTitle('Temuan'), (s, d) => `${s} jatuh tempo ${nearTxt(d)}. Segera selesaikan tindak lanjutnya.`],
  'tracker.overdue': [withNoun('Temuan'), (s, d) => `${s} melewati batas waktu ${lewat(d)}. Segera tindak lanjuti.`],
  'tracker.stale': ['Menunggu validasi terlalu lama', (s, d) => `${s} menunggu validasi ulang selama ${d.replace(/ menunggu$/, '')} (batas 7 hari). Segera validasi.`],
  'reporting.near': [nearTitle('Laporan'), (_s, d, r) => {
    const m = d.match(/^H-(\d+) batas waktu \((.+)\)$/)
    return m ? `${lap(r)} belum terkirim. Batas waktu ${m[2]} (${when(Number(m[1]))}). Siapkan dan kirim tepat waktu.` : `${lap(r)} belum terkirim (${d}). Siapkan dan kirim tepat waktu.`
  }],
  'reporting.late': [withNoun('Laporan'), (_s, _d, r, t) => `${lap(r)} belum terkirim dan terlambat ${diffDays(t, String(r.batas).slice(0, 10))} hari dari batas waktu. Segera kirim dan isi alasan keterlambatan.`],
  'reporting.siber': [sameLabel, (_s, d, r) => {
    const m = d.match(/^Kejadian (.+?): notifikasi awal (.+?); laporan lengkap (.+)$/)
    const low = (x: string) => x.replace(/TERLEWAT/g, 'terlewat')
    return m ? `Insiden siber "${insiden(r)}" terjadi pada ${m[1]}. Notifikasi awal: ${low(m[2])}. Laporan lengkap: ${low(m[3])}.` : `Insiden siber "${insiden(r)}": ${low(d)}.`
  }],
  'reporting.nobukti': [withNoun('Laporan'), (_s, _d, r) => `${lap(r)} berstatus Terkirim, tetapi file bukti dan nomor tanda terima belum diisi. Lengkapi bukti pengiriman.`],
  'regchange.unrated': ['Peraturan belum dinilai', (s, d) => `${s} belum dinilai dampaknya, sudah ${d}. Segera lakukan penilaian dampak.`],
  'regchange.effective': ['Peraturan akan berlaku, kepatuhan belum terpenuhi', (s, d) => {
    const m = d.match(/^Berlaku (.+?)(?: \(tahap [^)]+\))?, status kepatuhan (.+)$/)
    return `${s} ${m ? `berlaku ${m[1]}, tetapi status kepatuhan masih ${m[2]}` : lc(d)}. Percepat pemenuhan sebelum tanggal berlaku.`
  }],
  'regchange.reply': ['Imbauan harus dijawab', (s, d) => {
    const a = d.match(/^(.+?) sampai batas jawaban$/), b = d.match(/^Lewat (.+) dari batas jawaban$/)
    return `${s}: ${a ? `batas jawaban ${a[1]}` : b ? `batas jawaban sudah lewat ${b[1]}` : lc(d)}. Segera siapkan jawaban.`
  }],
  'regchange.sop': [sameLabel, (s, _d, r) => `${s} dicabut sejak ${fmtDate(r.tglBerlaku)}. Ada ${r.sopList.length} SOP terkait yang perlu diperbarui. Perbarui SOP tersebut, lalu hapus dari daftar SOP terkait pada peraturan ini.`],
  'regchange.high': ['Peraturan baru berdampak Tinggi', (s, d) => {
    const m = d.match(/^Dampak (.+), dicatat (.+)$/)
    return `${s} ${m ? `berdampak ${m[1]}, dicatat ${m[2]}` : lc(d)}. Perlu perhatian segera.`
  }],
  'sop.due': [sopTitle, (s, _d, r, t) => {
    const n = diffDays(r.tglReview, t)
    return n === 0 ? `${s} harus ditinjau hari ini (${fmtDate(r.tglReview)}). Segera lakukan peninjauan.` : `${s} perlu ditinjau sebelum ${fmtDate(r.tglReview)} (${when(n)}). Jadwalkan peninjauan.`
  }],
  'sop.overdue': [sopTitle, (s, _d, r, t) => `${s} melewati batas peninjauan ${fmtDate(r.tglReview)} selama ${diffDays(t, r.tglReview)} hari. Segera lakukan peninjauan.`],
  'sop.incomplete': ['Data SOP belum lengkap', (s, d) => `${s} belum lengkap: ${fields(d)} belum diisi. Lengkapi datanya.`],
  'risk.high': ['Risiko High baru', (s, d) => {
    const m = d.match(/^High sejak (.+?) \(skor (\d+)\)$/)
    return `${s} ${m ? `dengan level High sejak ${m[1]} (skor ${m[2]})` : lc(d)}. Perlu rencana mitigasi dan eskalasi.`
  }],
  'kajian.overdue': [withNoun('Kajian'), (s, d) => `${s} belum selesai dan melewati batas waktu ${lewat(d)}. Segera selesaikan.`],
  'kajian.near': [nearTitle('Kajian'), (s, d) => `${s} jatuh tempo ${nearTxt(d)}. Segera selesaikan.`],
  'kajian.nohasil': ['Kajian selesai tanpa hasil', (s) => `${s} berstatus Selesai, tetapi Hasil / Opini belum diisi. Lengkapi hasilnya.`],
  'kajian.mitra': [(d: string, label: string) => `${label} ${/^Lewat/i.test(d) ? 'terlewat' : 'akan tiba'}`, (s, d) => (/^Lewat/i.test(d) ? `${s}: jadwal evaluasi mitra terlewat ${lewat(d)}. Segera jadwalkan ulang.` : `${s}: jadwal evaluasi mitra jatuh tempo ${d}. Siapkan evaluasinya.`)],
  'fraud.nopic': ['Kasus belum ditangani', (s, d, r) => {
    const noPic = !String(r.pic ?? '').trim(), noAct = !r.edd1 && !r.tindakan
    const days = d.replace(/ tanpa .*$/, '')
    return noPic && noAct ? `${s} masih Open dan sudah ${days} tanpa PIC, tindakan, atau EDD. Segera tetapkan PIC dan tentukan tindakan.` : noPic ? `${s} masih Open dan sudah ${days} tanpa PIC. Segera tetapkan PIC.` : `${s} masih Open dan sudah ${days} tanpa tindakan atau EDD. Segera tentukan tindakan.`
  }],
  'fraud.edd': ['EDD lewat batas waktu', (s, d) => `${s} melewati batas waktu ${lewat(d.replace(/^lewat batas EDD /i, ''))} dan hasil belum diisi. Segera lengkapi.`],
  'fraud.hold': ['Hold settlement lebih dari 30 hari', (s, d) => `${s} berstatus Hold ${d.replace(/^Hold /, 'selama ')} dan belum dilepas (Released) atau diblokir. Tinjau kelanjutannya.`],
  'fraud.lapor': ['Lapor regulator terlambat', (s, d) => {
    const m = d.match(/^Belum lapor (.+?) \((.+)\)$/)
    return `${s} ${m ? `belum dilaporkan ke ${list(m[1].split(', '))} (${m[2]})` : lc(d)}. Segera laporkan ke regulator.`
  }],
  'fraud.old': ['Kasus Open lebih dari 90 hari', (s, d) => `${s} sudah ${d.replace(/^Open /, 'Open selama ')}. Tinjau dan percepat penyelesaian.`],
  'fraud.kosong': ['Data kasus belum lengkap', (s, d) => `${s} belum lengkap: ${fields(d)} belum diisi. Lengkapi datanya.`],
  'kontrak.hmin': [sameLabel, (s, d) => {
    const m = d.match(/^Berakhir (.+) \((.+)\)$/)
    return `${s} ${m ? `berakhir pada ${m[2]} (${m[1]})` : lc(d)}. Siapkan perpanjangan atau penggantian.`
  }],
  'kontrak.expired': ['Kontrak kedaluwarsa belum diperpanjang', (s, d) => `${s} sudah kedaluwarsa ${d.replace(/^expired /i, '')}. Segera perpanjang atau tutup kontrak.`],
  'kontrak.kosong': ['Tanggal berakhir kontrak belum diisi', (s) => `${s} belum memiliki Tanggal Berakhir. Lengkapi datanya.`],
  'aph.bap': [sameLabel, (s, d) => {
    const m = d.match(/^BAP (.+) \((.+)\)$/)
    return `${s}: ${m ? `BAP dijadwalkan ${m[1]} (${m[2]})` : lc(d)}. Siapkan kehadiran dan dokumen.`
  }],
  'aph.overdue': ['Jawaban APH lewat batas waktu', (s, d) => `${s} belum dijawab dan melewati batas waktu jawaban ${lewat(d)}. Segera kirim jawaban.`],
  'aph.kosong': ['Data permintaan APH belum lengkap', (s, d) => `${s} belum lengkap: ${fields(d)} belum diisi. Lengkapi datanya.`],
  'perizinan.akan': ['Izin akan kedaluwarsa', (s, d) => {
    const m = d.match(/^Kedaluwarsa (.+) \((.+)\)$/)
    return `${s} ${m ? `kedaluwarsa pada ${m[2]} (${m[1]})` : lc(d)}. Siapkan perpanjangan.`
  }],
  'perizinan.lewat': ['Izin kedaluwarsa belum diperpanjang', (s, d) => `${s} sudah kedaluwarsa ${lewat(d)} lalu. Segera proses perpanjangan.`],
  'layanan.overdue': [withNoun('Permintaan layanan hukum'), (s, d) => `${s} belum selesai dan melewati batas waktu ${lewat(d)}. Segera selesaikan.`],
  'layanan.near': [nearTitle('Permintaan layanan hukum'), (s, d) => `${s} jatuh tempo ${nearTxt(d)}. Segera selesaikan.`],
  'layanan.nopic': ['Permintaan layanan hukum belum punya PIC', (s, d) => `${s} sudah ${d}. Tetapkan PIC.`],
}
// Subjek kalimat per modul: nama data dirangkai dengan kata benda yang wajar ("Kontrak X dengan Y", bukan "Kontrak Y - X")
const SUBJ: Record<string, (r: R, name: string, noun: string) => string> = {
  regchange: (_r, n) => n,
  perizinan: (_r, n) => n,
  kajian: (_r, n, noun) => subj(noun, lc(n)),
  risk: (_r, n) => `Risiko "${n}"`,
  kontrak: (r, n) => `Kontrak ${r.nomor} dengan ${n.slice(0, n.length - String(r.nomor).length - 3)}`,
  layanan: (r) => `Permintaan layanan hukum (${r.jenis}) dari ${r.dept}`,
}

// ---- Penerima: token `to` pada alert dicocokkan ke akun demo ----
// Super Admin melihat semua notifikasi (pengawas); penerima tanpa akun demo (Direksi, CISO, Direktur terkait) hanya terlihat oleh Super Admin.
export function isRecipient(to: string[], u: Account): boolean {
  if (u.role === 'Super Admin') return true
  return to.some((t) => {
    if (t === u.role) return true
    const p = t.match(/^PIC \((.+)\)$/)
    if (p) return sameName(p[1], u.name)
    if (t === 'PIC' || t === 'PIC Dokumen' || t === 'PIC unit terdampak') return u.role === 'PIC'
    const o = t.match(/^Risk Owner \((.+)\)$/)
    return !!o && u.departemen === o[1]
  })
}

export function buildNotifs(ctx: Ctx, db: DB, perms: Parameters<typeof canPerm>[0]): Notif[] {
  const out: Notif[] = []
  const add = (n: Notif) => { if (isRecipient(n.to, ctx.user)) out.push(n) }
  if (canPerm(perms, ctx.role, 'tracker', 'Lihat')) {
    for (const f of db.findings) {
      for (const a of alertsFor(f, db.audit, ctx.today)) {
        const w = WORDS[`tracker.${a.key}`]
        const label = findingLabel(f)
        add({
          id: `tracker:${f.id}:${a.key}`, module: 'tracker', route: TRACKER_ROUTE, page: 'Regulatory Findings Tracker', recordId: f.id, ref: label, color: a.color,
          title: typeof w[0] === 'function' ? w[0](a.detail, a.label) : w[0], message: w[1](subj('Temuan', label), zero(a.detail), f as unknown as R, ctx.today), to: a.to.map((t) => (t === 'PIC' ? `PIC (${f.pic})` : t)),
        })
      }
    }
  }
  for (const { route, cfg, ref } of SOURCES) {
    if (!canPerm(perms, ctx.role, cfg.module, 'Lihat')) continue
    const raw = readModule<BaseRec>(cfg.module, cfg.seed as never)
    for (const r0 of raw) {
      const r = (cfg.normalize ? cfg.normalize(r0, ctx) : r0) as R
      if (r.cancelled) continue // data Dibatalkan tidak memicu notifikasi
      const name = cfg.name?.(r as never) ?? ''
      for (const a of cfg.alerts) {
        const hit = a.check(r as never, ctx)
        if (!hit) continue
        const w = WORDS[`${cfg.module}.${a.key}`] ?? [a.label, (s: string, d: string) => `${s}: ${lc(d)}`]
        add({ id: `${cfg.module}:${r.id}:${a.key}`, module: cfg.module, route, page: cfg.title, recordId: r.id, ref: ref?.(r) ?? name, color: hit.color, title: typeof w[0] === 'function' ? w[0](hit.detail, a.label) : w[0], message: w[1]((SUBJ[cfg.module] ?? ((_r, n, noun) => subj(noun, n)))(r, name, cfg.noun), zero(hit.detail), r, ctx.today), to: hit.to })
      }
    }
  }
  return out
}

// ---- Status baca + waktu pertama muncul (per akun demo) ----
const NKEY = 'clrm.notif.v1'
interface Acct { read: string[]; seen: Record<string, string> }
const readAll = (): Record<string, Acct> => {
  try { const v = JSON.parse(localStorage.getItem(NKEY) ?? 'null'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} } catch { return {} }
}
const acctOf = (all: Record<string, Acct>, id: string): Acct => {
  const a = all[id] as Partial<Acct> | undefined
  return { read: Array.isArray(a?.read) ? a!.read.filter((x) => typeof x === 'string') : [], seen: a?.seen && typeof a.seen === 'object' && !Array.isArray(a.seen) ? a.seen : {} }
}
const writeAcct = (id: string, a: Acct) => { try { localStorage.setItem(NKEY, JSON.stringify({ ...readAll(), [id]: a })) } catch { /* abaikan */ } }

export function useNotifications(db: DB) {
  const { ctx, store } = useApp()
  const uid = ctx.user.id
  const items = useMemo(() => buildNotifs(ctx, db, store.perms), [ctx, db, store.perms])
  const [st, setSt] = useState<Acct>(() => acctOf(readAll(), uid))
  useEffect(() => setSt(acctOf(readAll(), uid)), [uid]) // ganti akun demo: muat status akun itu
  const ids = items.map((n) => n.id).join('|')
  useEffect(() => { // catat waktu pertama muncul; buang status notifikasi yang sudah tidak aktif
    const cur = acctOf(readAll(), uid)
    const live = new Set(items.map((n) => n.id))
    const seen: Record<string, string> = {}
    const now = nowStr()
    for (const n of items) seen[n.id] = cur.seen[n.id] ?? now
    const next: Acct = { read: cur.read.filter((x) => live.has(x)), seen }
    if (JSON.stringify(next) !== JSON.stringify(cur)) { writeAcct(uid, next); setSt(next) }
  }, [ids, uid]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => {
    const now = nowStr()
    return items.map((n) => ({ ...n, at: st.seen[n.id] ?? now, read: st.read.includes(n.id) }))
      .sort((a, b) => b.at.localeCompare(a.at) || (a.color === b.color ? 0 : a.color === 'red' ? -1 : 1) || a.ref.localeCompare(b.ref))
  }, [items, st])
  const save = (read: string[]) => { const next = { ...st, read }; writeAcct(uid, next); setSt(next) }
  return {
    list, unread: list.filter((n) => !n.read).length,
    markRead: (id: string) => { if (!st.read.includes(id)) save([...st.read, id]) },
    markAll: () => save([...new Set([...st.read, ...items.map((n) => n.id)])]),
  }
}

// ---- Lonceng di header ----
export default function NotifBell({ db }: { db: DB }) {
  const { list, unread, markRead, markAll } = useNotifications(db)
  const [open, setOpen] = useState(false)
  const go = (n: (typeof list)[number]) => {
    markRead(n.id)
    setOpen(false)
    location.hash = `#/${n.route}?open=${encodeURIComponent(n.recordId)}` // halaman membuka Detail data lalu membersihkan parameter
  }
  return (
    <div className="relative">
      <button title="Notifikasi" aria-label={`Notifikasi, ${unread} belum dibaca`} onClick={() => setOpen(!open)} className="relative rounded bg-white/10 p-1.5 hover:bg-white/20">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-2 top-12 z-50 flex max-h-[75vh] w-[400px] max-w-[calc(100vw-16px)] flex-col rounded-lg border bg-white text-slate-700 shadow-xl sm:absolute sm:right-0 sm:top-10">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
              <div className="text-sm font-semibold text-slate-800">Notifikasi{unread > 0 ? ` (${unread} belum dibaca)` : ''}</div>
              <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-brand hover:bg-slate-50 disabled:text-slate-300" disabled={!unread} onClick={markAll}><CheckCheck size={13} />Tandai semua dibaca</button>
            </div>
            <div className="overflow-auto">
              {list.map((n) => (
                <button key={n.id} onClick={() => go(n)} className={`flex w-full gap-2.5 border-b border-l-4 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50 ${n.color === 'red' ? 'border-l-red-500' : 'border-l-yellow-400'} ${n.read ? '' : 'bg-blue-50/40'}`}>
                  {n.color === 'red' ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-500" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-[13px] ${n.read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>{n.title}</div>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Belum dibaca" />}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">{n.message}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{n.page} · {n.ref} · {fmtTime(n.at)}</div>
                  </div>
                </button>
              ))}
              {!list.length && <div className="p-8 text-center text-sm text-slate-400">Tidak ada notifikasi</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
