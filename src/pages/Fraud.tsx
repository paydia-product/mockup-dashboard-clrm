import { addDays, diffDays, fmtDate } from '../lib'
import { withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { BarCard, ComboCard, DonutCard, LineCard, StatCards, useMonthRange } from '../kit/charts'
import { addWorkDays, ageBucket, ageBuckets, monthKey, workDaysBetween } from '../kit/dates'
import { StatusPill, fmtMoney, maskStr } from '../kit/fmt'
import { sameName } from '../kit/perms'
import type { AlertDef, BaseRec, Column, Ctx, Field, FileMeta, FilterDef, PageConfig } from '../kit/types'

// Fraud Case Monitoring (C6). Asumsi: kolom "K" (kondisional) diwajibkan saat status Closed saja,
// supaya kasus Open yang belum lengkap tetap bisa dicatat dan alert punya arti (lihat A3).
type Money = number | ''
interface Fraud extends BaseRec {
  tglTerima: string; jenisData: string; pelapor: string; kategori: string; media: string
  terlapor: string; jenisPengguna: string; jenis: string; rincian: string
  uraian: string; bukti: FileMeta | null; korban: Money
  rrn: string; tglTrx: string
  asesmen: string; alasanAsesmen: string
  holdTgl: string; holdNom: Money; tglPpatk: string
  edd1: string; edd2: string; hasilEdd: string
  tindakan: string; tglBlokir: string; relTgl: string; relNom: Money; saldo: Money
  tglQris: string; tglTutup: string
  lapKomdigi: string; lapBi: string; lapPpatk: string
  tglResolved: string; pic: string; group: string; produk: string; channel: string; kerugian: Money
}

const KATEGORI = ['Departemen Internal', 'Konsumen', 'Switching', 'PJP/Bank', 'Institusi Berwenang Lainnya', 'Kepolisian', 'Bank Indonesia', 'Asosiasi'] // sheet "2. Daftar Pihak Pelapor EDD"
const MEDIA = ['Email', 'IASC', 'GO AML', 'WhatsApp', 'Lainnya']
const JENIS_DATA = ['Fraud', 'EDD']
const JENIS = ['Fraud', 'Judi Online', 'Transaksi Anomali']
const HASIL = ['Tidak Respon', 'Kirim Bukti', 'Email Bouncing', 'Judi Online', 'Lainnya']
const TINDAKAN = ['Blokir', 'Watchlist', 'Hold Settlement', 'Released', 'Terminasi', 'Blokir IP', 'Tidak Ada Tindak Lanjut', 'Redundant']
const PENGGUNA = ['Merchant', 'User']
const LAPOR_MAX = { Komdigi: 7, BI: 14, PPATK: 30 } // hari sejak blokir
const OPEN = (r: Fraud) => r.status === 'Open'
const num = (v: Money) => (v === '' ? 0 : Number(v))
const age = (r: Fraud, today: string) => diffDays(today, r.tglTerima)
// "Rumus sementara": EDD1 = terima + 3 hari kerja; EDD2 = EDD1 + 7 hari. Batas aktif = EDD1 bila belum terisi, selain itu EDD2.
const batasEdd1 = (r: Fraud) => (r.tglTerima ? addWorkDays(r.tglTerima, 3) : '')
const batasEdd = (r: Fraud) => (r.edd1 ? addDays(r.edd1, 7) : batasEdd1(r))
const holdAge = (r: Fraud, today: string) => (r.holdTgl ? diffDays(today, r.holdTgl) : 0)
const isMasked = (c: Ctx) => c.role !== 'Head CLRM' && c.role !== 'Fraud Investigator'
const mask = (s: string, c: Ctx) => (s && isMasked(c) ? maskStr(s) : s)
const laporList = (r: Fraud): [string, string, number][] => [['Komdigi', r.lapKomdigi, LAPOR_MAX.Komdigi], ['BI', r.lapBi, LAPOR_MAX.BI], ['PPATK', r.lapPpatk, LAPOR_MAX.PPATK]]
const laporLate = (r: Fraud, today: string) => (r.tglBlokir ? laporList(r).filter(([, d, max]) => !d && diffDays(today, r.tglBlokir) > max).map(([n]) => n) : [])
const firstLapor = (r: Fraud) => [r.lapKomdigi, r.lapBi, r.lapPpatk].filter(Boolean).sort()[0] ?? ''
const isClosed = (r: Fraud) => r.status === 'Closed'
// ponytail: field EDD hanya untuk Jenis Data = EDD (disembunyikan, tidak wajib, tidak diekspor untuk Fraud); data lama tanpa jenisData dianggap Fraud
const isEdd = (r: Fraud) => r.jenisData === 'EDD'
const needEdd = (r: Fraud) => isEdd(r) && r.asesmen === 'Dilanjutkan'
const blokirClosed = (r: Fraud) => r.tindakan === 'Blokir' && isClosed(r)

const fields: Field<Fraud>[] = [
  { key: 'tglTerima', label: 'Tanggal Terima Tugas', type: 'date', required: true, reasonOnChange: true },
  { key: 'jenisData', label: 'Jenis Data', type: 'select', options: JENIS_DATA, required: true },
  { key: 'kategori', label: 'Kategori Pelapor', type: 'select', options: (c) => c.master.kategoriPelapor, required: true },
  { key: 'media', label: 'Media', type: 'select', options: (c) => withLainnya(c.master.mediaPelapor), required: true },
  { key: 'terlapor', label: 'Nama Terlapor', type: 'text', required: true, mask: isMasked },
  { key: 'jenisPengguna', label: 'Jenis Pengguna', type: 'select', options: PENGGUNA, required: true },
  { key: 'jenis', label: 'Jenis Dugaan', type: 'select', options: JENIS, required: true },
  { key: 'rincian', label: 'Rincian Dugaan', type: 'text' },
  { key: 'uraian', label: 'Uraian', type: 'textarea', required: isClosed, wide: true },
  { key: 'bukti', label: 'Bukti', type: 'file', required: true },
  { key: 'korban', label: 'Nominal Korban', type: 'money', required: isClosed, reasonOnChange: true },
  { key: 'rrn', label: 'RRN', type: 'text', mask: isMasked },
  { key: 'tglTrx', label: 'Tanggal Transaksi', type: 'date', reasonOnChange: true },
  { key: 'asesmen', label: 'Hasil Asesmen Awal', type: 'select', options: ['Dilanjutkan', 'Tidak Dilanjutkan'], required: true },
  { key: 'alasanAsesmen', label: 'Alasan Asesmen', type: 'text', required: true },
  { key: 'holdTgl', label: 'Tanggal Hold Settlement', type: 'date', reasonOnChange: true },
  { key: 'holdNom', label: 'Nominal Hold Settlement', type: 'money', reasonOnChange: true },
  { key: 'tglPpatk', label: 'Tanggal Email PPATK', type: 'date', reasonOnChange: true },
  { key: 'edd1', label: 'Tanggal EDD 1', type: 'date', required: (r) => needEdd(r) && isClosed(r), showIf: isEdd, reasonOnChange: true },
  { key: 'edd2', label: 'Tanggal EDD 2', type: 'date', showIf: isEdd, reasonOnChange: true },
  { key: 'batasEdd', label: 'Batas Waktu EDD (rumus sementara)', type: 'date', auto: (r) => batasEdd(r), showIf: isEdd, help: 'Rumus sementara: EDD 1 = terima + 3 hari kerja, EDD 2 = EDD 1 + 7 hari.' },
  { key: 'hasilEdd', label: 'Hasil EDD', type: 'select', options: HASIL, showIf: isEdd, required: (r) => isEdd(r) && isClosed(r) && (!!r.edd1 || !!r.edd2) },
  { key: 'tindakan', label: 'Tindakan', type: 'select', options: TINDAKAN, required: isClosed },
  { key: 'tglBlokir', label: 'Tanggal Blokir', type: 'date', reasonOnChange: true },
  { key: 'relTgl', label: 'Tanggal Released Settlement', type: 'date', reasonOnChange: true },
  { key: 'relNom', label: 'Nominal Released Settlement', type: 'money', reasonOnChange: true },
  { key: 'saldo', label: 'Saldo Tertahan', type: 'money', required: (r) => r.tindakan === 'Blokir', reasonOnChange: true },
  { key: 'tglQris', label: 'Tanggal Hapus QRIS', type: 'date', reasonOnChange: true },
  { key: 'tglTutup', label: 'Tanggal Email Tutup Akun', type: 'date', reasonOnChange: true },
  { key: 'lapKomdigi', label: 'Tanggal Lapor Komdigi', type: 'date', required: blokirClosed, reasonOnChange: true },
  { key: 'lapBi', label: 'Tanggal Lapor BI', type: 'date', required: blokirClosed, reasonOnChange: true },
  { key: 'lapPpatk', label: 'Tanggal Lapor PPATK', type: 'date', required: blokirClosed, reasonOnChange: true },
  { key: 'tglResolved', label: 'Tanggal Email Resolved', type: 'date', required: isClosed, reasonOnChange: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'], required: true, inForm: 'edit', help: 'Menutup kasus (Closed) menunggu persetujuan Head CLRM; selama menunggu status tetap Open.' },
  { key: 'pic', label: 'PIC Investigator', type: 'select', options: (c) => c.master.pic, required: isClosed },
  { key: 'group', label: 'Group Merchant', type: 'text' },
  { key: 'produk', label: 'Produk', type: 'select', options: (c) => c.master.produk },
  { key: 'channel', label: 'Channel', type: 'text' },
  { key: 'kerugian', label: 'Kerugian Paydia', type: 'money', reasonOnChange: true },
]

const columns: Column<Fraud>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Tgl Terima', get: (r) => r.tglTerima, render: (r) => fmtDate(r.tglTerima) },
  { label: 'Jenis Data', get: (r) => r.jenisData || '-' },
  { label: 'Kategori Pelapor', get: (r) => r.kategori },
  { label: 'Terlapor', get: (r, c) => mask(r.terlapor, c) },
  { label: 'Jenis Dugaan', get: (r) => r.jenis },
  { label: 'Nominal', get: (r) => num(r.korban), render: (r) => (r.korban === '' ? '-' : fmtMoney(r.korban)) },
  { label: 'Tindakan', get: (r) => r.tindakan || '-' },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'PIC', get: (r) => r.pic || '-' },
]

const uniq = (rows: Fraud[], g: (r: Fraud) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Fraud>[] = [
  { key: 'periode', label: 'Periode (Tanggal Terima)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglTerima >= a) && (!b || r.tglTerima <= b) } },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed', 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => uniq(rows, (r) => r.pic), match: (r, v) => r.pic === v },
  { key: 'jenisData', label: 'Jenis Data', type: 'select', options: JENIS_DATA, match: (r, v) => r.jenisData === v },
  { key: 'jenis', label: 'Jenis Dugaan', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'tindakan', label: 'Tindakan', type: 'select', options: TINDAKAN, match: (r, v) => r.tindakan === v },
  { key: 'kategori', label: 'Sumber (Kategori Pelapor)', type: 'select', options: (_, c) => c.master.kategoriPelapor, match: (r, v) => r.kategori === v },
  { key: 'group', label: 'Group Merchant', type: 'select', options: (rows) => uniq(rows, (r) => r.group), match: (r, v) => r.group === v },
  { key: 'produk', label: 'Produk', type: 'select', options: (_, c) => c.master.produk, match: (r, v) => r.produk === v },
  { key: 'channel', label: 'Channel', type: 'select', options: (rows) => uniq(rows, (r) => r.channel), match: (r, v) => r.channel === v },
]

const toPic = (r: Fraud) => (r.pic ? `PIC (${r.pic})` : 'PIC')
const mk = (c: Ctx, o: Partial<Fraud>): Fraud => ({
  id: 'sample', no: 99, status: 'Open', createdAt: c.today, createdBy: '-',
  tglTerima: addDays(c.today, -10), jenisData: 'Fraud', pelapor: 'Konsumen', kategori: 'Konsumen', media: 'Email', terlapor: 'Budi Santoso', jenisPengguna: 'Merchant', jenis: 'Fraud', rincian: 'Phishing',
  uraian: 'Dugaan penipuan melalui merchant.', bukti: null, korban: 25_000_000, rrn: '', tglTrx: '', asesmen: 'Dilanjutkan', alasanAsesmen: 'Indikasi kuat',
  holdTgl: '', holdNom: '', tglPpatk: '', edd1: '', edd2: '', hasilEdd: '', tindakan: '', tglBlokir: '', relTgl: '', relNom: '', saldo: '', tglQris: '', tglTutup: '',
  lapKomdigi: '', lapBi: '', lapPpatk: '', tglResolved: '', pic: 'Regie', group: 'Toko Sejahtera', produk: 'QRIS', channel: 'Mobile', kerugian: '', ...o,
})
const alerts: AlertDef<Fraud>[] = [
  {
    key: 'nopic', label: 'Belum ada PIC / tanpa EDD atau tindakan', rule: 'Kasus Open belum punya PIC, atau belum ada tindakan (dan EDD 1 untuk Jenis Data EDD) setelah 2 hari kerja sejak terima tugas.',
    check: (r, c) => {
      const d = workDaysBetween(r.tglTerima, c.today)
      if (!OPEN(r) || d <= 2) return null
      if (!r.pic.trim()) return { color: 'red', detail: `${d} hari kerja tanpa PIC`, to: ['Head CLRM', 'Fraud Investigator'] }
      return (!isEdd(r) || !r.edd1) && !r.tindakan ? { color: 'red', detail: `${d} hari kerja tanpa EDD/tindakan`, to: ['Head CLRM', 'Fraud Investigator'] } : null
    },
    sample: (c) => mk(c, { pic: '', tglTerima: addDays(c.today, -6) }),
  },
  {
    key: 'edd', label: 'EDD lewat batas', rule: 'Jenis Data EDD: Batas Waktu EDD terlewat dan Hasil EDD masih kosong pada kasus Open yang dilanjutkan.',
    check: (r, c) => {
      if (!OPEN(r) || !isEdd(r) || !needEdd(r) || r.hasilEdd || !batasEdd(r)) return null
      const d = diffDays(c.today, batasEdd(r))
      return d > 0 ? { color: 'red', detail: `Lewat batas EDD ${d} hari`, to: [toPic(r), 'Head CLRM'] } : null
    },
    sample: (c) => mk(c, { jenisData: 'EDD', tglTerima: addDays(c.today, -15), edd1: addDays(c.today, -12), tindakan: 'Watchlist' }),
  },
  {
    key: 'hold', label: 'Hold > 30 hari', rule: 'Hold Settlement lebih dari 30 hari tanpa Released atau Blokir pada kasus Open.',
    check: (r, c) => (OPEN(r) && r.holdTgl && !r.relTgl && !r.tglBlokir && holdAge(r, c.today) > 30 ? { color: 'yellow', detail: `Hold ${holdAge(r, c.today)} hari`, to: [toPic(r), 'Head CLRM'] } : null),
    sample: (c) => mk(c, { tglTerima: addDays(c.today, -45), holdTgl: addDays(c.today, -40), holdNom: 30_000_000, tindakan: 'Hold Settlement' }),
  },
  {
    key: 'lapor', label: 'Lapor regulator terlambat', rule: 'Setelah blokir, tanggal lapor masih kosong melewati batas Komdigi 7 hari, BI 14 hari, atau PPATK 30 hari.',
    check: (r, c) => { const l = laporLate(r, c.today); return l.length && r.status !== 'Dibatalkan' ? { color: 'red', detail: `Belum lapor ${l.join(', ')} (blokir ${diffDays(c.today, r.tglBlokir)} hari lalu)`, to: ['Compliance Officer', 'Head CLRM'] } : null },
    sample: (c) => mk(c, { tglTerima: addDays(c.today, -30), tindakan: 'Blokir', tglBlokir: addDays(c.today, -20), saldo: 18_000_000, lapKomdigi: addDays(c.today, -18) }),
  },
  {
    key: 'old', label: 'Open > 90 hari', rule: 'Kasus berstatus Open lebih dari 90 hari sejak terima tugas.',
    check: (r, c) => (OPEN(r) && age(r, c.today) > 90 ? { color: 'yellow', detail: `Open ${age(r, c.today)} hari`, to: [toPic(r), 'Head CLRM'] } : null),
    sample: (c) => mk(c, { tglTerima: addDays(c.today, -110), tindakan: 'Watchlist' }),
  },
  {
    key: 'kosong', label: 'Data penting kosong', rule: 'Kasus Open belum punya Uraian, Nominal Korban, Jenis Dugaan, atau Kategori Pelapor.',
    check: (r) => {
      if (!OPEN(r)) return null
      const miss = [!r.uraian.trim() && 'Uraian', r.korban === '' && 'Nominal Korban', !r.jenis && 'Jenis Dugaan', !r.kategori && 'Kategori Pelapor'].filter(Boolean)
      return miss.length ? { color: 'yellow', detail: `Kosong: ${miss.join(', ')}`, to: ['Compliance Officer'] } : null
    },
    sample: (c) => mk(c, { uraian: '', korban: '', tglTerima: addDays(c.today, -2), tindakan: 'Watchlist' }),
  },
]

// --- seed: ~45 kasus dalam 12 bulan, beberapa sengaja memicu tiap alert ---
const PIHAK = ['Konsumen', 'Merchant', 'Bank Mitra', 'Switching', 'Kepolisian', 'Bank Indonesia', 'Internal']
const NAMA = ['Budi Santoso', 'Siti Rahayu', 'Agus Wijaya', 'Dewi Lestari', 'Rudi Hartono', 'Maya Putri', 'Hendra Gunawan', 'Lia Permata']
const GROUPS = ['Toko Sejahtera', 'Warung Digital', 'Mitra Jaya', 'Kopi Nusantara', 'Gamezone', 'Fashion Hub', 'Lotus Retail', 'Bintang Pay', 'Sinar Mart', 'Cahaya Group', 'Sumber Rejeki', 'Pasar Online']
const PRODUK = ['UE', 'QRIS', 'Biller'] // = master Produk
const CHANNEL = ['Mobile', 'Web', 'Offline EDC', 'API']
const PICS = ['Regie', 'Fakhri', 'Osama', 'Fakhri'] // master PIC
const FILE: FileMeta = { name: 'bukti-kasus.pdf', size: 245_000, type: 'application/pdf' }

function seed(today: string): Fraud[] {
  const d = (n: number) => addDays(today, -n)
  // Skenario terkontrol (umur hari): memicu alert 1-6
  type O = Partial<Fraud> & { age: number }
  const special: O[] = [
    { age: 6, pic: '', tindakan: '' }, // 1: tanpa PIC
    { age: 5, tindakan: '' }, // 1: tanpa EDD/tindakan
    { age: 16, edd1: d(13), tindakan: 'Watchlist' }, // 2: EDD2 lewat batas, hasil kosong
    { age: 12, tindakan: 'Watchlist' }, // 2: EDD1 lewat batas
    { age: 45, holdTgl: d(40), holdNom: 30_000_000, tindakan: 'Hold Settlement', edd1: d(41), hasilEdd: 'Kirim Bukti' }, // 3
    { age: 30, tindakan: 'Blokir', tglBlokir: d(20), saldo: 18_000_000, edd1: d(26), hasilEdd: 'Tidak Respon' }, // 4: Komdigi+BI terlambat
    { age: 60, tindakan: 'Blokir', tglBlokir: d(45), saldo: 40_000_000, edd1: d(55), hasilEdd: 'Tidak Respon', lapKomdigi: d(40), lapBi: d(33) }, // 4: PPATK terlambat
    { age: 100, tindakan: 'Watchlist', edd1: d(95), hasilEdd: 'Kirim Bukti' }, // 5
    { age: 130, tindakan: 'Terminasi', edd1: d(125), hasilEdd: 'Lainnya' }, // 5
    { age: 20, uraian: '', korban: '', tindakan: 'Watchlist', edd1: d(16), hasilEdd: 'Kirim Bukti' }, // 6
    { age: 8, tindakan: 'Watchlist', edd1: d(5), hasilEdd: 'Kirim Bukti' }, // open sehat
    { age: 3, tindakan: '', pic: 'Fakhri' }, // baru masuk
  ]
  const rows: Fraud[] = []
  const base = (i: number, ageDays: number): Fraud => {
    const tglTerima = d(ageDays)
    return {
      id: `fraud-${i + 1}`, no: i + 1, status: 'Open', createdAt: tglTerima, createdBy: 'Fakhri', tglTerima, jenisData: 'EDD',
      pelapor: PIHAK[i % 7], kategori: KATEGORI[(i * 3) % KATEGORI.length], media: MEDIA[(i * 2) % 5],
      terlapor: NAMA[i % 8], jenisPengguna: PENGGUNA[i % 2], jenis: JENIS[i % 3], rincian: ['Phishing', 'Akun palsu', 'Pemain judi', 'Pola transaksi tidak wajar'][i % 4],
      uraian: `Laporan dugaan ${JENIS[i % 3].toLowerCase()} melalui ${GROUPS[i % 12]}.`, bukti: FILE, korban: (1 + (i % 9)) * 5_000_000,
      rrn: `4021${String(100000 + i * 7919).slice(0, 6)}`, tglTrx: addDays(tglTerima, -2),
      asesmen: 'Dilanjutkan', alasanAsesmen: 'Indikasi kuat', holdTgl: '', holdNom: '', tglPpatk: '',
      edd1: '', edd2: '', hasilEdd: '', tindakan: '', tglBlokir: '', relTgl: '', relNom: '', saldo: '', tglQris: '', tglTutup: '',
      lapKomdigi: '', lapBi: '', lapPpatk: '', tglResolved: '', pic: PICS[i % 4], group: GROUPS[i % 12], produk: PRODUK[i % 3], channel: CHANNEL[(i + 1) % 4], kerugian: i % 5 === 0 ? 2_000_000 : '',
    }
  }
  const FRAUD_SPECIAL = [0, 4, 6, 9, 11] // sisanya EDD
  special.forEach(({ age: a, ...o }, i) => rows.push({ ...base(i, a), ...o, ...(FRAUD_SPECIAL.includes(i) ? { jenisData: 'Fraud' } : {}) }))
  // Sisanya: kasus lama, hampir semuanya Closed dan lengkap
  const rest = 45 - rows.length
  for (let k = 0; k < rest; k++) {
    const i = rows.length
    const a = 34 + Math.round((k * 330) / rest) // sebar sampai ~12 bulan
    const r = base(i, a)
    const t = TINDAKAN[k % 8]
    r.tindakan = t
    if (k % 8 === 6 || k % 11 === 5) { r.asesmen = 'Tidak Dilanjutkan'; r.alasanAsesmen = 'Bukti tidak cukup'; r.tindakan = k % 2 ? 'Tidak Ada Tindak Lanjut' : 'Redundant' }
    else {
      r.edd1 = addWorkDays(r.tglTerima, 3); r.edd2 = addDays(r.edd1, 7); r.hasilEdd = HASIL[k % 5]
      if (t === 'Blokir' || t === 'Blokir IP') {
        r.tglBlokir = addDays(r.edd2, 2); r.saldo = (2 + (k % 7)) * 7_500_000
        r.lapKomdigi = addDays(r.tglBlokir, 3); r.lapBi = addDays(r.tglBlokir, 8); r.lapPpatk = addDays(r.tglBlokir, 20); r.tglPpatk = addDays(r.tglBlokir, 1)
        if (k % 3 === 0) { r.tglQris = addDays(r.tglBlokir, 4); r.tglTutup = addDays(r.tglBlokir, 5) }
      }
      if (t === 'Hold Settlement' || t === 'Released' || k % 4 === 1) {
        r.holdTgl = addDays(r.tglTerima, 2); r.holdNom = (1 + (k % 5)) * 6_000_000
        if (t !== 'Hold Settlement' || k % 2) { r.relTgl = addDays(r.holdTgl, 12); r.relNom = Math.round(num(r.holdNom) * 0.6) }
      }
    }
    if (a > 45) { r.status = 'Closed'; r.tglResolved = addDays(r.tglTerima, 20 + (k % 15)) }
    if (a > 140 && k % 9 === 4) r.kerugian = 3_500_000
    if (k % 3 === 0) r.jenisData = 'Fraud'
    rows.push(r)
  }
  for (const r of rows) if (r.jenisData === 'Fraud') { r.edd1 = ''; r.edd2 = ''; r.hasilEdd = '' } // field EDD hanya untuk Jenis Data EDD
  rows[rows.length - 1].status = 'Dibatalkan'
  rows[rows.length - 1].cancelled = { prev: 'Closed', reason: 'Kasus duplikat', by: 'Dewi Anggraini', at: `${addDays(today, -30)}T10:15:00` }
  return rows
}

const countBy = (x: Fraud[], g: (r: Fraud) => string): [string, number][] => { const m = new Map<string, number>(); x.forEach((r) => { const k = g(r) || '-'; m.set(k, (m.get(k) ?? 0) + 1) }); return [...m].sort((a, b) => b[1] - a[1]) }
const Breakdown = ({ title, sub, items }: { title: string; sub: string; items: [string, number][] }) => (
  <div><div className="font-semibold">{title}</div><div className="mb-1 text-slate-500">{sub}</div>{items.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><span>{k}</span><span className="font-medium">{v}</span></div>)}{!items.length && <div className="text-slate-400">Tidak ada data</div>}</div>
)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0)
const juta = (n: number) => Math.round(n / 1_000_000)

const cfg: PageConfig<Fraud> = {
  module: 'fraud', title: 'Fraud Case Monitoring', noun: 'Kasus', exportPrefix: 'Kasus_Fraud_EDD',
  name: (r) => `${r.kategori}, ${fmtDate(r.tglTerima)}`,
  seed, fields, columns, filters,
  blank: () => ({
    tglTerima: '', jenisData: '', pelapor: '', kategori: '', media: '', terlapor: '', jenisPengguna: '', jenis: '', rincian: '', uraian: '', bukti: null, korban: '', rrn: '', tglTrx: '',
    asesmen: '', alasanAsesmen: '', holdTgl: '', holdNom: '', tglPpatk: '', edd1: '', edd2: '', hasilEdd: '', tindakan: '', tglBlokir: '', relTgl: '', relNom: '', saldo: '',
    tglQris: '', tglTutup: '', lapKomdigi: '', lapBi: '', lapPpatk: '', tglResolved: '', status: 'Open', pic: '', group: '', produk: '', channel: '', kerugian: '',
  }),
  // terlapor dicari lewat nilai yang sudah disamarkan
  search: (r, c) => `${r.no} ${mask(r.terlapor, c)} ${r.group} ${r.kategori}`, searchPlaceholder: 'Cari nomor, terlapor/merchant, kategori pelapor',
  alerts, cancelStatus: 'Dibatalkan',
  // PIC/Fraud Investigator hanya boleh mengubah kasus yang PIC Investigator-nya dirinya; Head CLRM, CO, Super Admin bebas
  canEditRow: (r, c) => r.status !== 'Closed' && (!['PIC', 'Fraud Investigator'].includes(c.role) || sameName(r.pic, c.user.name)),
  // tanpa keys: seluruh perubahan ikut request saat penutupan, record tetap Open sampai disetujui
  approvals: [{ jenis: 'Penutupan Kasus', approver: 'Head CLRM', needs: (old, next) => old.status !== 'Closed' && next.status === 'Closed' }],
  validate: (r, mode) => {
    const e: Record<string, string> = {}
    if (mode === 'add' && r.status !== 'Open') e.status = 'Kasus baru harus berstatus Open; penutupan lewat Edit dengan persetujuan Head CLRM'
    if (r.edd1 && r.edd2 && r.edd2 < r.edd1) e.edd2 = 'EDD 2 tidak boleh sebelum EDD 1'
    if (r.tglResolved && r.tglTerima && r.tglResolved < r.tglTerima) e.tglResolved = 'Tanggal Resolved tidak boleh sebelum Tanggal Terima'
    if (r.tglBlokir && r.tglTerima && r.tglBlokir < r.tglTerima) e.tglBlokir = 'Tanggal Blokir tidak boleh sebelum Tanggal Terima'
    return e
  },
  dashDate: { get: (r) => r.tglTerima, label: 'Tanggal Terima' },
  Dashboard: ({ rows, allRows, c, drill }) => {
    const n = (s: string) => rows.filter((r) => r.status === s).length
    const old = rows.filter((r) => OPEN(r) && age(r, c.today) > 90).length
    const hold = rows.reduce((a, r) => a + num(r.holdNom), 0)
    const rel = rows.reduce((a, r) => a + num(r.relNom), 0)
    // filter bulan per kartu (independen satu sama lain dan dari filter halaman)
    const rgKasus = useMonthRange('12')
    const rgUang = useMonthRange('12')
    const keys = allRows.map((r) => monthKey(r.tglTerima))
    const mk = (rg: typeof rgKasus) => rg.months(keys).map((key) => ({ key, name: `${MON[Number(key.slice(5)) - 1]} ${key.slice(2, 4)}` }))
    const monthsKasus = mk(rgKasus)
    const monthsUang = mk(rgUang)
    const inM = (k: string) => allRows.filter((r) => monthKey(r.tglTerima) === k)
    const sum = (x: Fraud[], g: (r: Fraud) => Money) => x.reduce((a, r) => a + num(g(r)), 0)
    const edges = [30, 60, 90]
    const open = rows.filter(OPEN)
    const group = new Map<string, number>()
    rows.forEach((r) => r.group && group.set(r.group, (group.get(r.group) ?? 0) + 1))
    const top = [...group].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, Kasus]) => ({ name, Kasus }))
    const span = (g: (r: Fraud) => string) => rows.map((r) => (g(r) && r.tglTerima ? diffDays(g(r), r.tglTerima) : NaN)).filter((x) => !isNaN(x))
    const spans = [['Terima ke EDD 1', span((r) => (isEdd(r) ? r.edd1 : ''))], ['Terima ke Blokir', span((r) => r.tglBlokir)], ['Terima ke Lapor', span(firstLapor)]] as const
    const blokir = rows.filter((r) => r.tglBlokir)
    const lapor = (['Komdigi', 'BI', 'PPATK'] as const).map((name) => {
      const got = (r: Fraud) => (name === 'Komdigi' ? r.lapKomdigi : name === 'BI' ? r.lapBi : r.lapPpatk)
      const late = blokir.filter((r) => !got(r) && diffDays(c.today, r.tglBlokir) > LAPOR_MAX[name]).length
      return { name, 'Sudah Lapor': blokir.filter((r) => got(r)).length, 'Belum Lapor': blokir.filter((r) => !got(r)).length - late, Terlambat: late }
    })
    return (
      <div className="space-y-3">
        <StatCards items={[
          { label: 'Total Kasus', value: rows.length },
          { label: 'Open', value: n('Open'), tone: old ? 'red' : 'blue', onClick: () => drill({ status: 'Open' }) },
          { label: 'Closed', value: n('Closed'), tone: 'green', onClick: () => drill({ status: 'Closed' }) },
          { label: 'Dana Ditahan (Hold)', value: fmtMoney(hold), tone: 'yellow' },
          { label: 'Dana Dikembalikan (Released)', value: fmtMoney(rel), tone: 'green' },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <LineCard title="Kasus per bulan" toolbar={rgKasus.toolbar} data={monthsKasus.map((m) => ({ name: m.name, Kasus: inM(m.key).length }))} keys={['Kasus']} />
          <DonutCard title="Jenis dugaan" data={JENIS.map((j) => ({ name: j, value: rows.filter((r) => r.jenis === j).length }))} onClick={(name) => drill({ jenis: name })} tip={(name, value) => <Breakdown title={`${name}: ${value} kasus`} sub="Per kategori pelapor" items={countBy(rows.filter((r) => r.jenis === name), (r) => r.kategori)} />} />
          <BarCard title="Kategori pelapor x media" stacked data={c.master.kategoriPelapor.map((k) => ({ name: k, ...Object.fromEntries(c.master.mediaPelapor.map((m) => [m, rows.filter((r) => r.kategori === k && r.media === m).length])) }))} keys={c.master.mediaPelapor} onClick={(row) => drill({ kategori: row.name })} />
          <BarCard title="Kasus per tindakan dan saldo tertahan (juta Rp)" data={TINDAKAN.map((x) => ({ name: x, Kasus: rows.filter((r) => r.tindakan === x).length, 'Saldo Tertahan (juta)': juta(sum(rows.filter((r) => r.tindakan === x), (r) => r.saldo)) }))} keys={['Kasus', 'Saldo Tertahan (juta)']} onClick={(row) => drill({ tindakan: row.name })} />
          <BarCard title="Top 10 merchant / group" horizontal data={top} keys={['Kasus']} onClick={(row) => drill({ group: row.name })} tip={(row) => <Breakdown title={`${row.name}: ${row.Kasus} kasus`} sub="Per jenis dugaan" items={countBy(rows.filter((r) => r.group === row.name), (r) => r.jenis)} />} />
          <ComboCard title="Nilai uang per bulan (juta Rp)" toolbar={rgUang.toolbar} bars={['Korban', 'Hold', 'Released']} lines={['Saldo Tertahan']} data={monthsUang.map((m) => { const x = inM(m.key); return { name: m.name, Korban: juta(sum(x, (r) => r.korban)), Hold: juta(sum(x, (r) => r.holdNom)), Released: juta(sum(x, (r) => r.relNom)), 'Saldo Tertahan': juta(sum(x, (r) => r.saldo)) } })} />
          <BarCard title="Lama proses (hari): rata-rata dan terlama" data={spans.map(([name, v]) => ({ name, 'Rata-rata': avg(v), Terlama: v.length ? Math.max(...v) : 0 }))} keys={['Rata-rata', 'Terlama']} unit="Hari" />
          <BarCard title="Umur kasus Open (hari)" data={ageBuckets(edges).map((name) => ({ name, Jumlah: open.filter((r) => ageBucket(age(r, c.today), edges) === name).length }))} keys={['Jumlah']} catLabel="Hari" cellColors={['#22c55e', '#f59e0b', '#f59e0b', '#ef4444']} />
          <BarCard title="Lapor regulator setelah blokir" stacked data={lapor} keys={['Sudah Lapor', 'Belum Lapor', 'Terlambat']} colors={{ 'Sudah Lapor': '#10b981', 'Belum Lapor': '#f59e0b', Terlambat: '#ef4444' }} />
        </div>
      </div>
    )
  },
}
export default function FraudPage() { return <PageShell config={cfg} /> }
