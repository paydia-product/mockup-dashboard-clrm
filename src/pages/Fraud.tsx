import { addDays, diffDays, fmtDate, nowStr } from '../lib'
import { showLainnya, withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { BarCard, ComboCard, DonutCard, LineCard, StatCards, useMonthRange } from '../kit/charts'
import { addWorkDays, ageBucket, ageBuckets, monthKey, workDaysBetween } from '../kit/dates'
import { StatusPill, fmtMoney, maskStr } from '../kit/fmt'
import { sameName } from '../kit/perms'
import { FraudGuide } from '../guides/fraud'
import type { AlertDef, BaseRec, Column, Ctx, Field, FileMeta, FilterDef, PageConfig } from '../kit/types'

// Fraud Case Monitoring (C6). Asumsi: kolom "K" (kondisional) diwajibkan saat status Closed saja,
// supaya kasus Open yang belum lengkap tetap bisa dicatat dan alert punya arti (lihat A3).
type Money = number | ''
interface Fraud extends BaseRec {
  noLaporan: string; tglTerima: string; pelapor: string; kategori: string; media: string
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
const JENIS = ['Fraud', 'Judi Online', 'Transaksi Anomali']
const HASIL = ['Tidak Respon', 'Kirim Bukti', 'Email Bouncing', 'Judi Online', 'Lainnya']
const TINDAKAN = ['Blokir', 'Watchlist', 'Hold Settlement', 'Released', 'Terminasi', 'Blokir IP', 'Tidak Ada Tindak Lanjut', 'Redundant', 'EDD 1', 'EDD 2'] // seed memakai 8 pertama (indeks k % 8)
const PENGGUNA = ['Merchant', 'User']
const LAPOR_MAX = { Komdigi: 7, BI: 14, PPATK: 30 } // hari sejak blokir
const OPEN = (r: Fraud) => r.status === 'Open'
const num = (v: Money) => (v === '' ? 0 : Number(v))
const age = (r: Fraud, today: string) => diffDays(today, r.tglTerima)
// "Rumus sementara": EDD1 = terima + 3 hari kerja; EDD2 = EDD1 + 7 hari. Batas aktif = EDD1 bila belum terisi, selain itu EDD2.
const batasEdd1 = (r: Fraud) => (r.tglTerima ? addWorkDays(r.tglTerima, 3) : '')
const batasEdd = (r: Fraud) => (r.edd1 ? addDays(r.edd1, 7) : batasEdd1(r))
const holdAge = (r: Fraud, today: string) => (r.holdTgl ? diffDays(today, r.holdTgl) : 0)
// Terlapor dan RRN: peran lain selalu tersamar (tanpa tombol mata). Head CLRM dan Fraud Investigator boleh membuka sensor lewat tombol mata;
// bawaan tampilan (tabel, Detail, form Ubah) tetap tersamar sampai tombol dibuka. c.reveal[key] diisi permukaan tampilan.
const isMasked = (c: Ctx) => c.role !== 'Head CLRM' && c.role !== 'Fraud Investigator'
const canReveal = (c: Ctx) => !isMasked(c)
const mask = (s: string, c: Ctx, key?: string) => (s && (isMasked(c) || !(key && c.reveal?.[key])) ? maskStr(s) : s)
const laporList = (r: Fraud): [string, string, number][] => [['Komdigi', r.lapKomdigi, LAPOR_MAX.Komdigi], ['BI', r.lapBi, LAPOR_MAX.BI], ['PPATK', r.lapPpatk, LAPOR_MAX.PPATK]]
const laporLate = (r: Fraud, today: string) => (r.tglBlokir ? laporList(r).filter(([, d, max]) => !d && diffDays(today, r.tglBlokir) > max).map(([n]) => n) : [])
const firstLapor = (r: Fraud) => [r.lapKomdigi, r.lapBi, r.lapPpatk].filter(Boolean).sort()[0] ?? ''
const isClosed = (r: Fraud) => r.status === 'Closed'
// ponytail: Jenis Data dihapus; field EDD selalu tampil untuk semua kasus
const needEdd = (r: Fraud) => r.asesmen === 'Dilanjutkan'
// No Laporan EDD: EDD/YYYY/MM/NNNN. YYYY/MM dari Tanggal Dibuat; NNNN urut 4 digit yang mulai lagi dari 0001 tiap bulan-tahun. Dibuat saat Tambah, tidak berubah saat Ubah.
const eddNo = (createdAt: string, all: Fraud[]) => {
  const pre = `EDD/${createdAt.slice(0, 4)}/${createdAt.slice(5, 7)}/`
  const max = all.reduce((m, r) => (r.noLaporan?.startsWith(pre) ? Math.max(m, Number(r.noLaporan.slice(pre.length)) || 0) : m), 0)
  return `${pre}${String(max + 1).padStart(4, '0')}`
}
const blokirClosed = (r: Fraud) => r.tindakan === 'Blokir' && isClosed(r)

const fields: Field<Fraud>[] = [
  { key: 'noLaporan', label: 'No Laporan EDD', type: 'text', readOnly: true, noImport: true, help: 'Otomatis (EDD/tahun/bulan/nomor urut), terisi saat disimpan dan tidak berubah.' },
  { key: 'tglTerima', label: 'Tanggal Terima Tugas', type: 'date', required: true, reasonOnChange: true },
  { key: 'kategori', label: 'Kategori Pelapor', type: 'select', options: (c) => c.master.kategoriPelapor, required: true },
  { key: 'media', label: 'Media', type: 'select', options: (c) => withLainnya(c.master.mediaPelapor), required: true },
  { key: 'terlapor', label: 'Nama Terlapor', type: 'text', required: true, mask: isMasked, reveal: canReveal },
  { key: 'jenisPengguna', label: 'Jenis Pengguna', type: 'select', options: PENGGUNA, required: true },
  { key: 'jenis', label: 'Jenis Dugaan', type: 'select', options: JENIS, required: true },
  { key: 'rincian', label: 'Rincian Dugaan', type: 'text' },
  { key: 'uraian', label: 'Uraian', type: 'textarea', required: isClosed, wide: true },
  { key: 'bukti', label: 'Bukti', type: 'file' },
  { key: 'korban', label: 'Nominal Korban', type: 'money', required: isClosed, reasonOnChange: true },
  { key: 'rrn', label: 'RRN', type: 'text', mask: isMasked, reveal: canReveal },
  { key: 'tglTrx', label: 'Tanggal Transaksi', type: 'date', reasonOnChange: true },
  { key: 'asesmen', label: 'Hasil Asesmen Awal', type: 'select', options: ['Dilanjutkan', 'Tidak Dilanjutkan'], required: true },
  { key: 'alasanAsesmen', label: 'Alasan Asesmen', type: 'text', required: true },
  { key: 'holdTgl', label: 'Tanggal Hold Settlement', type: 'date', reasonOnChange: true },
  { key: 'holdNom', label: 'Nominal Hold Settlement', type: 'money', reasonOnChange: true },
  { key: 'tglPpatk', label: 'Tanggal Email PPATK', type: 'date', reasonOnChange: true },
  { key: 'edd1', label: 'Tanggal EDD 1', type: 'date', required: (r) => needEdd(r) && isClosed(r), reasonOnChange: true },
  { key: 'edd2', label: 'Tanggal EDD 2', type: 'date', reasonOnChange: true },
  { key: 'batasEdd', label: 'Batas Waktu EDD (rumus sementara)', type: 'date', auto: (r) => batasEdd(r), help: 'Rumus sementara: EDD 1 = terima + 3 hari kerja, EDD 2 = EDD 1 + 7 hari.' },
  { key: 'hasilEdd', label: 'Hasil EDD', type: 'select', options: HASIL, required: (r) => isClosed(r) && (!!r.edd1 || !!r.edd2) },
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
  { label: 'No Laporan EDD', get: (r) => r.noLaporan || '-' },
  { label: 'Tgl Terima', get: (r) => r.tglTerima, render: (r) => fmtDate(r.tglTerima) },
  { label: 'Kategori Pelapor', get: (r) => r.kategori },
  { label: 'Terlapor', get: (r, c) => mask(r.terlapor, c, 'terlapor'), revealKey: 'terlapor' },
  { label: 'RRN', get: (r, c) => mask(r.rrn, c, 'rrn') || '-', revealKey: 'rrn' },
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
  { key: 'jenis', label: 'Jenis Dugaan', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'tindakan', label: 'Tindakan', type: 'select', options: TINDAKAN, match: (r, v) => r.tindakan === v },
  { key: 'kategori', label: 'Sumber (Kategori Pelapor)', type: 'select', options: (_, c) => c.master.kategoriPelapor, match: (r, v) => r.kategori === v },
  { key: 'group', label: 'Group Merchant', type: 'select', options: (rows) => uniq(rows, (r) => r.group), match: (r, v) => r.group === v },
  { key: 'produk', label: 'Produk', type: 'select', options: (_, c) => c.master.produk, match: (r, v) => r.produk === v },
  { key: 'channel', label: 'Channel', type: 'select', options: (rows) => uniq(rows, (r) => r.channel), match: (r, v) => r.channel === v },
]

const toPic = (r: Fraud) => (r.pic ? `PIC (${r.pic})` : 'PIC')
const alerts: AlertDef<Fraud>[] = [
  {
    key: 'nopic', label: 'Belum ada PIC / tanpa EDD atau tindakan', rule: 'Kasus Open lebih dari 2 hari kerja sejak terima tugas dan belum punya PIC, atau belum ada Tindakan dan Tanggal EDD 1.',
    check: (r, c) => {
      const d = workDaysBetween(r.tglTerima, c.today)
      if (!OPEN(r) || d <= 2) return null
      if (!r.pic.trim()) return { color: 'red', detail: `${d} hari kerja tanpa PIC`, to: ['Head CLRM', 'Fraud Investigator'] }
      return !r.edd1 && !r.tindakan ? { color: 'red', detail: `${d} hari kerja tanpa EDD/tindakan`, to: ['Head CLRM', 'Fraud Investigator'] } : null
    },
  },
  {
    key: 'edd', label: 'EDD lewat batas waktu', rule: 'Batas Waktu EDD terlewat dan Hasil EDD masih kosong pada kasus Open yang dilanjutkan.',
    check: (r, c) => {
      if (!OPEN(r) || !needEdd(r) || r.hasilEdd || !batasEdd(r)) return null
      const d = diffDays(c.today, batasEdd(r))
      return d > 0 ? { color: 'red', detail: `Lewat batas EDD ${d} hari`, to: [toPic(r), 'Head CLRM'] } : null
    },
  },
  {
    key: 'hold', label: 'Hold > 30 hari', rule: 'Hold Settlement lebih dari 30 hari tanpa Released atau Blokir pada kasus Open.',
    check: (r, c) => (OPEN(r) && r.holdTgl && !r.relTgl && !r.tglBlokir && holdAge(r, c.today) > 30 ? { color: 'yellow', detail: `Hold ${holdAge(r, c.today)} hari`, to: [toPic(r), 'Head CLRM'] } : null),
  },
  {
    key: 'lapor', label: 'Lapor regulator terlambat', rule: 'Setelah blokir, tanggal lapor masih kosong melewati batas Komdigi 7 hari, BI 14 hari, atau PPATK 30 hari.',
    check: (r, c) => { const l = laporLate(r, c.today); return l.length && r.status !== 'Dibatalkan' ? { color: 'red', detail: `Belum lapor ${l.join(', ')} (blokir ${diffDays(c.today, r.tglBlokir)} hari lalu)`, to: ['Compliance Officer', 'Head CLRM'] } : null },
  },
  {
    key: 'old', label: 'Open > 90 hari', rule: 'Kasus berstatus Open lebih dari 90 hari sejak terima tugas.',
    check: (r, c) => (OPEN(r) && age(r, c.today) > 90 ? { color: 'yellow', detail: `Open ${age(r, c.today)} hari`, to: [toPic(r), 'Head CLRM'] } : null),
  },
  {
    key: 'kosong', label: 'Data penting kosong', rule: 'Kasus Open belum punya Uraian, Nominal Korban, Jenis Dugaan, atau Kategori Pelapor.',
    check: (r) => {
      if (!OPEN(r)) return null
      const miss = [!r.uraian.trim() && 'Uraian', r.korban === '' && 'Nominal Korban', !r.jenis && 'Jenis Dugaan', !r.kategori && 'Kategori Pelapor'].filter(Boolean)
      return miss.length ? { color: 'yellow', detail: `Kosong: ${miss.join(', ')}`, to: ['Compliance Officer'] } : null
    },
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
      id: `fraud-${i + 1}`, no: i + 1, status: 'Open', createdAt: tglTerima, createdBy: 'Fakhri', tglTerima, noLaporan: '',
      pelapor: PIHAK[i % 7], kategori: KATEGORI[(i * 3) % KATEGORI.length], media: MEDIA[(i * 2) % 5],
      terlapor: NAMA[i % 8], jenisPengguna: PENGGUNA[i % 2], jenis: JENIS[i % 3], rincian: ['Phishing', 'Akun palsu', 'Pemain judi', 'Pola transaksi tidak wajar'][i % 4],
      uraian: `Laporan dugaan ${JENIS[i % 3].toLowerCase()} melalui ${GROUPS[i % 12]}.`, bukti: FILE, korban: (1 + (i % 9)) * 5_000_000,
      rrn: `4021${String(100000 + i * 7919).slice(0, 6)}`, tglTrx: addDays(tglTerima, -2),
      asesmen: 'Dilanjutkan', alasanAsesmen: 'Indikasi kuat', holdTgl: '', holdNom: '', tglPpatk: '',
      edd1: '', edd2: '', hasilEdd: '', tindakan: '', tglBlokir: '', relTgl: '', relNom: '', saldo: '', tglQris: '', tglTutup: '',
      lapKomdigi: '', lapBi: '', lapPpatk: '', tglResolved: '', pic: PICS[i % 4], group: GROUPS[i % 12], produk: PRODUK[i % 3], channel: CHANNEL[(i + 1) % 4], kerugian: i % 5 === 0 ? 2_000_000 : '',
    }
  }
  special.forEach(({ age: a, ...o }, i) => rows.push({ ...base(i, a), ...o }))
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
    rows.push(r)
  }
  rows[rows.length - 1].status = 'Dibatalkan'
  rows[rows.length - 1].cancelled = { prev: 'Closed', reason: 'Kasus duplikat', by: 'Dewi Anggraini', at: `${addDays(today, -30)}T10:15:00` }
  // No Laporan EDD: urut per bulan-tahun menurut Tanggal Dibuat (terlama dulu)
  const seq = new Map<string, number>()
  for (const r of [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.no - b.no)) {
    const k = r.createdAt.slice(0, 7)
    const n = (seq.get(k) ?? 0) + 1
    seq.set(k, n)
    r.noLaporan = `EDD/${k.slice(0, 4)}/${k.slice(5, 7)}/${String(n).padStart(4, '0')}`
  }
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
  name: (r) => r.noLaporan || `${r.kategori}, ${fmtDate(r.tglTerima)}`,
  guide: FraudGuide,
  seed, fields, columns, filters,
  blank: () => ({
    noLaporan: '', tglTerima: '', pelapor: '', kategori: '', media: '', terlapor: '', jenisPengguna: '', jenis: '', rincian: '', uraian: '', bukti: null, korban: '', rrn: '', tglTrx: '',
    asesmen: '', alasanAsesmen: '', holdTgl: '', holdNom: '', tglPpatk: '', edd1: '', edd2: '', hasilEdd: '', tindakan: '', tglBlokir: '', relTgl: '', relNom: '', saldo: '',
    tglQris: '', tglTutup: '', lapKomdigi: '', lapBi: '', lapPpatk: '', tglResolved: '', status: 'Open', pic: '', group: '', produk: '', channel: '', kerugian: '',
  }),
  // terlapor dicari lewat nilai yang sudah disamarkan
  search: (r, c) => `${r.noLaporan} ${isMasked(c) ? maskStr(r.terlapor) : r.terlapor} ${r.group} ${r.kategori}`, searchPlaceholder: 'Cari no laporan EDD, terlapor/merchant, kategori pelapor',
  // No Laporan EDD dibuat saat Tambah (urut per bulan-tahun dari Tanggal Dibuat) dan tidak pernah berubah saat Ubah
  beforeSave: (old, next, c) => ({ ...next, noLaporan: old?.noLaporan || eddNo(next.createdAt || nowStr(), (c.all('fraud') as Fraud[]).filter((x) => x.id !== next.id)) }),
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
    const spans = [['Terima ke EDD 1', span((r) => r.edd1)], ['Terima ke Blokir', span((r) => r.tglBlokir)], ['Terima ke Lapor', span(firstLapor)]] as const
    const blokir = rows.filter((r) => r.tglBlokir)
    const lapor = (['Komdigi', 'BI', 'PPATK'] as const).map((name) => {
      const got = (r: Fraud) => (name === 'Komdigi' ? r.lapKomdigi : name === 'BI' ? r.lapBi : r.lapPpatk)
      const late = blokir.filter((r) => !got(r) && diffDays(c.today, r.tglBlokir) > LAPOR_MAX[name]).length
      return { name, 'Sudah Lapor': blokir.filter((r) => got(r)).length, 'Belum Lapor': blokir.filter((r) => !got(r)).length - late, Terlambat: late }
    })
    return (
      <div className="space-y-3">
        <StatCards info={{ apa: 'Ringkasan kasus pada Periode Tanggal Terima yang dipilih (kasus Dibatalkan tidak dihitung).', baca: ['Total Kasus: semua kasus pada periode.', 'Open: kasus berstatus Open (merah bila ada kasus Open lebih dari 90 hari, biru bila tidak). Klik untuk membuka Table terfilter Open.', 'Closed: kasus berstatus Closed. Klik untuk membuka Table terfilter Closed.', 'Dana Ditahan (Hold): jumlah Nominal Hold Settlement semua kasus.', 'Dana Dikembalikan (Released): jumlah Nominal Released Settlement semua kasus.'] }} items={[
          { label: 'Total Kasus', value: rows.length },
          { label: 'Open', value: n('Open'), tone: old ? 'red' : 'blue', onClick: () => drill({ status: 'Open' }) },
          { label: 'Closed', value: n('Closed'), tone: 'green', onClick: () => drill({ status: 'Closed' }) },
          { label: 'Dana Ditahan (Hold)', value: fmtMoney(hold), tone: 'yellow' },
          { label: 'Dana Dikembalikan (Released)', value: fmtMoney(rel), tone: 'green' },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <LineCard info={{ apa: 'Jumlah kasus yang diterima tiap bulan (menurut Tanggal Terima). Memakai semua kasus tidak Dibatalkan dan tidak terpengaruh Periode halaman.', baca: ['Sumbu X: bulan. Sumbu Y: jumlah kasus.', 'Filter Periode di atas grafik: Seluruh Waktu, 3, 6, 9, 12 bulan terakhir (standar 12), atau Custom. Filter ini hanya berlaku untuk grafik ini.', 'Bulan tanpa kasus tampil sebagai nol.'] }} title="Kasus per bulan" toolbar={rgKasus.toolbar} data={monthsKasus.map((m) => ({ name: m.name, Kasus: inM(m.key).length }))} keys={['Kasus']} />
          <DonutCard info={{ apa: 'Komposisi kasus menurut Jenis Dugaan: Fraud, Judi Online, dan Transaksi Anomali.', baca: ['Tiap irisan = satu jenis dugaan; ukuran irisan = jumlah kasus.', 'Arahkan kursor ke irisan untuk melihat jumlah dan rincian per Kategori Pelapor.', 'Klik irisan untuk membuka Table terfilter jenis dugaan tersebut.'] }} title="Jenis dugaan" data={JENIS.map((j) => ({ name: j, value: rows.filter((r) => r.jenis === j).length }))} onClick={(name) => drill({ jenis: name })} tip={(name, value) => <Breakdown title={`${name}: ${value} kasus`} sub="Per kategori pelapor" items={countBy(rows.filter((r) => r.jenis === name), (r) => r.kategori)} />} />
          <BarCard info={{ apa: 'Jumlah kasus per Kategori Pelapor, ditumpuk menurut Media penerimaan laporan (daftar dari Master Data). Media yang diketik bebas di luar daftar dihitung sebagai Lainnya.', baca: ['Sumbu X: kategori pelapor. Sumbu Y: jumlah kasus.', 'Warna tumpukan = media (lihat legenda di bawah grafik).', 'Klik batang untuk membuka Table terfilter kategori pelapor tersebut.'] }} title="Kategori pelapor x media" stacked data={c.master.kategoriPelapor.map((k) => ({ name: k, ...Object.fromEntries(withLainnya(c.master.mediaPelapor).map((m) => [m, rows.filter((r) => r.kategori === k && showLainnya(r.media, c.master.mediaPelapor) === m).length])) }))} keys={withLainnya(c.master.mediaPelapor)} onClick={(row) => drill({ kategori: row.name })} />
          <BarCard info={{ apa: 'Untuk tiap Tindakan: jumlah kasus dan total Saldo Tertahan (dalam juta rupiah).', baca: ['Sumbu X: jenis tindakan. Dua batang per tindakan: Kasus (jumlah kasus) dan Saldo Tertahan (juta), memakai sumbu angka yang sama.', 'Arahkan kursor ke batang untuk melihat nilainya.', 'Klik batang untuk membuka Table terfilter tindakan tersebut.'] }} title="Kasus per tindakan dan saldo tertahan (juta Rp)" data={TINDAKAN.map((x) => ({ name: x, Kasus: rows.filter((r) => r.tindakan === x).length, 'Saldo Tertahan (juta)': juta(sum(rows.filter((r) => r.tindakan === x), (r) => r.saldo)) }))} keys={['Kasus', 'Saldo Tertahan (juta)']} onClick={(row) => drill({ tindakan: row.name })} />
          <BarCard info={{ apa: 'Sepuluh Group Merchant dengan kasus terbanyak pada periode yang dipilih.', baca: ['Sumbu Y: group merchant. Sumbu X: jumlah kasus.', 'Arahkan kursor ke batang untuk melihat rincian per Jenis Dugaan.', 'Klik batang untuk membuka Table terfilter group tersebut.'] }} title="Top 10 merchant / group" horizontal data={top} keys={['Kasus']} onClick={(row) => drill({ group: row.name })} tip={(row) => <Breakdown title={`${row.name}: ${row.Kasus} kasus`} sub="Per jenis dugaan" items={countBy(rows.filter((r) => r.group === row.name), (r) => r.jenis)} />} />
          <ComboCard info={{ apa: 'Nilai uang kasus per bulan, dalam juta rupiah. Tiap nilai dihitung pada bulan Tanggal Terima kasusnya. Memakai semua kasus tidak Dibatalkan dan tidak terpengaruh Periode halaman.', baca: ['Sumbu X: bulan. Sumbu Y: juta rupiah.', 'Batang: Korban (Nominal Korban), Hold (Nominal Hold Settlement), dan Released (Nominal Released Settlement). Garis: Saldo Tertahan.', 'Filter Periode di atas grafik berlaku hanya untuk grafik ini (standar 12 bulan terakhir).', 'Arahkan kursor untuk melihat nilai tiap bulan.'] }} title="Nilai uang per bulan (juta Rp)" toolbar={rgUang.toolbar} bars={['Korban', 'Hold', 'Released']} lines={['Saldo Tertahan']} data={monthsUang.map((m) => { const x = inM(m.key); return { name: m.name, Korban: juta(sum(x, (r) => r.korban)), Hold: juta(sum(x, (r) => r.holdNom)), Released: juta(sum(x, (r) => r.relNom)), 'Saldo Tertahan': juta(sum(x, (r) => r.saldo)) } })} />
          <BarCard info={{ apa: 'Lama proses dalam hari kalender sejak Tanggal Terima: sampai EDD 1, sampai Tanggal Blokir, dan sampai laporan regulator pertama (tanggal Lapor paling awal).', baca: ['Sumbu X: tahap proses. Sumbu Y: hari.', 'Rata-rata = rata-rata (dibulatkan) kasus yang tahap itu sudah terisi. Terlama = nilai terbesar.', 'Batang nol berarti belum ada data tahap itu. Grafik ini tidak bisa diklik.'] }} title="Lama proses (hari): rata-rata dan terlama" data={spans.map(([name, v]) => ({ name, 'Rata-rata': avg(v), Terlama: v.length ? Math.max(...v) : 0 }))} keys={['Rata-rata', 'Terlama']} unit="Hari" />
          <BarCard info={{ apa: 'Umur kasus yang masih Open, dihitung dari Tanggal Terima sampai hari ini, dalam hari kalender.', baca: ['Sumbu X: kelompok umur 0-30, 31-60, 61-90, dan lebih dari 90 hari. Sumbu Y: jumlah kasus.', 'Warna: hijau = 0-30 hari, kuning = 31-90 hari, merah = lebih dari 90 hari.', 'Grafik ini tidak bisa diklik.'] }} title="Umur kasus Open (hari)" data={ageBuckets(edges).map((name) => ({ name, Jumlah: open.filter((r) => ageBucket(age(r, c.today), edges) === name).length }))} keys={['Jumlah']} catLabel="Hari" cellColors={['#22c55e', '#f59e0b', '#f59e0b', '#ef4444']} />
          <BarCard info={{ apa: 'Status pelaporan ke tiap regulator untuk kasus yang sudah punya Tanggal Blokir. Batas lapor sejak blokir: Komdigi 7 hari, BI 14 hari, PPATK 30 hari.', baca: ['Sumbu X: regulator. Sumbu Y: jumlah kasus.', 'Hijau = Sudah Lapor (tanggal lapor terisi). Kuning = Belum Lapor tetapi belum lewat batas. Merah = Terlambat (belum lapor dan batas terlewat).', 'Grafik ini tidak bisa diklik.'] }} title="Lapor regulator setelah blokir" stacked data={lapor} keys={['Sudah Lapor', 'Belum Lapor', 'Terlambat']} colors={{ 'Sudah Lapor': '#10b981', 'Belum Lapor': '#f59e0b', Terlambat: '#ef4444' }} />
        </div>
      </div>
    )
  },
}
export default function FraudPage() { return <PageShell config={cfg} /> }
export { cfg as config } // dipakai pusat notifikasi (kit/notify.tsx)
