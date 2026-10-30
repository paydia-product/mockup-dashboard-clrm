import { useState } from 'react'
import { addDays, diffDays, fmtDate, todayStr } from '../lib'
import { withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { BarCard, DonutCard, LineCard, MiniTable } from '../kit/charts'
import { ageBucket, ageBuckets, workDaysBetween } from '../kit/dates'
import { StatusPill } from '../kit/fmt'
import { addRecord, readModule, useApp } from '../kit/store'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'
import { sameName } from '../kit/perms'
import { Modal } from '../ui'
import { SopRec, seedSop, sopLabel } from './sop.shared'

// Regulatory Change (Compliance Bab 3). status (BaseRec) = Status Peraturan: Berlaku / Diubah / Dicabut (+ Dibatalkan dari cancel).
interface Tindak { uraian: string; pic: string; batas: string; status: string }
interface SopItem { sop: string; done: string }
interface Reg extends BaseRec {
  jenis: string; nomor: string; tahun: string; regulator: string; tentang: string; kategori: string; jp: string
  tglTerbit: string; tglBerlaku: string; tglDicatat: string; diubah: string
  dampak: string; dampakUraian: string; dept: string[]; pemenuhan: number | ''
  tindak: Tindak[]; perluJawab: string; jawabBatas: string; jawabTgl: string; tglSosialisasi: string
  sopList: SopItem[]; lampiran: { name: string; size: number; type: string } | null
}

const JENIS = ['PBI', 'PADG', 'UU', 'Permen', 'Peraturan BSSN', 'Surat Edaran', 'Surat Imbauan']
const REGULATOR = ['BI', 'PPATK', 'Komdigi', 'BSSN', 'Pemerintah-DPR', 'Lainnya']
const KATEGORI = ['APU PPT', 'QRIS', 'SNAP', 'Pelindungan Konsumen', 'Ketahanan Siber', 'Lainnya']
const JP = ['Baru', 'Perubahan', 'Pencabutan', 'Imbauan']
const STATUS = ['Berlaku', 'Diubah', 'Dicabut']
const DAMPAK = ['Tinggi', 'Sedang', 'Rendah']
const KEP = ['Comply', 'Partial', 'Gap', 'Belum Dinilai']
const KEP_COLOR: Record<string, string> = { Comply: '#10b981', Partial: '#f59e0b', Gap: '#ef4444', 'Belum Dinilai': '#94a3b8' }

const kep = (r: Reg) => (r.pemenuhan === '' ? 'Belum Dinilai' : r.pemenuhan >= 100 ? 'Comply' : r.pemenuhan >= 70 ? 'Partial' : 'Gap')
const label = (r: Reg) => `${r.jenis} ${r.nomor}/${r.tahun}`
const unrated = (r: Reg) => !r.dampak
const openTindak = (r: Reg) => r.tindak.filter((t) => t.status !== 'Selesai')
const lateTindak = (r: Reg, today: string) => r.tindak.filter((t) => t.status !== 'Selesai' && t.batas && t.batas < today)
const needReply = (r: Reg) => r.perluJawab === 'Ya' && !r.jawabTgl && !!r.jawabBatas
const dampakTone = (s: string) => (s === 'Tinggi' ? 'red' : s === 'Sedang' ? 'yellow' : s === 'Rendah' ? 'green' : 'gray') as 'red' | 'yellow' | 'green' | 'gray'
const picTo = (r: Reg) => { const n = [...new Set(openTindak(r).map((t) => t.pic).filter(Boolean))]; return n.length ? n.map((p) => `PIC (${p})`) : ['PIC unit terdampak'] }
const IDENT = ['jenis', 'nomor', 'tahun', 'regulator', 'tentang', 'kategori', 'jp', 'status', 'tglTerbit', 'tglBerlaku', 'diubah']
const isPic = (c: Ctx) => c.role === 'PIC'

const fields: Field<Reg>[] = [
  { key: 'jenis', label: 'Jenis Peraturan / Surat', type: 'select', options: JENIS, required: true, editableBy: (c) => !isPic(c) },
  { key: 'nomor', label: 'Nomor', type: 'text', required: true, editableBy: (c) => !isPic(c) },
  { key: 'tahun', label: 'Tahun', type: 'text', required: true, editableBy: (c) => !isPic(c) },
  { key: 'regulator', label: 'Regulator / Penerbit', type: 'select', options: (c) => withLainnya(c.master.regulator), required: true, editableBy: (c) => !isPic(c) },
  { key: 'tentang', label: 'Tentang', type: 'textarea', required: true, editableBy: (c) => !isPic(c) },
  { key: 'kategori', label: 'Kategori (Perihal / Fitur)', type: 'select', options: (c) => withLainnya(c.master.kategoriRegulasi), required: true, editableBy: (c) => !isPic(c) },
  { key: 'jp', label: 'Jenis Perubahan', type: 'select', options: JP, required: true, editableBy: (c) => !isPic(c) },
  { key: 'status', label: 'Status Peraturan', type: 'select', options: STATUS, required: true, editableBy: (c) => !isPic(c) },
  { key: 'tglTerbit', label: 'Tanggal Terbit', type: 'date', required: true, editableBy: (c) => !isPic(c) },
  { key: 'tglBerlaku', label: 'Tanggal Berlaku', type: 'date', required: (r) => r.jp !== 'Imbauan', help: 'Boleh kosong untuk Imbauan.', editableBy: (c) => !isPic(c) },
  { key: 'tglDicatat', label: 'Tanggal Dicatat CLRM', type: 'date', required: true, editableBy: (c) => !isPic(c) },
  {
    key: 'diubah', label: 'Peraturan yang Diubah / Dicabut', type: 'select', required: (r) => r.jp === 'Perubahan' || r.jp === 'Pencabutan', showIf: (r) => r.jp === 'Perubahan' || r.jp === 'Pencabutan',
    options: (c) => (c.all('regchange') as Reg[]).filter((x) => !x.cancelled).map(label), editableBy: (c) => !isPic(c),
  },
  { key: 'dampak', label: 'Tingkat Dampak bagi Paydia', type: 'select', options: DAMPAK, required: (r) => !!r.tglSosialisasi, help: 'Wajib dinilai sebelum Tanggal Sosialisasi diisi.', editableBy: (c) => !isPic(c) },
  { key: 'dampakUraian', label: 'Uraian Dampak', type: 'textarea', required: (r) => !!r.tglSosialisasi, editableBy: (c) => !isPic(c) },
  { key: 'dept', label: 'Unit Kerja Terdampak', type: 'multiselect', options: (c) => withLainnya(c.master.unitKerja), required: true, editableBy: (c) => !isPic(c) },
  { key: 'pemenuhan', label: 'Pemenuhan (%)', type: 'percent', help: 'Kosong = belum dinilai.', editableBy: (c) => !isPic(c) },
  { key: 'kepatuhan', label: 'Status Kepatuhan', type: 'text', auto: (r) => kep(r) },
  {
    key: 'tindak', label: 'Tindak Lanjut', type: 'list', required: (r) => kep(r) === 'Partial' || kep(r) === 'Gap', wide: true,
    listLocked: isPic, itemEditableBy: (c, it) => !isPic(c) || sameName(String(it.pic ?? ''), c.user.name), // PIC: hanya item miliknya, tanpa tambah/hapus
    sub: [
      { key: 'uraian', label: 'Uraian', type: 'text', required: true },
      { key: 'pic', label: 'PIC', type: 'text', required: true, editableBy: (c) => !isPic(c) },
      { key: 'batas', label: 'Batas Waktu', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Proses', 'Selesai'], required: true },
    ],
  },
  { key: 'perluJawab', label: 'Perlu Dijawab ke Regulator?', type: 'yesno', required: (r) => r.jp === 'Imbauan', editableBy: (c) => !isPic(c) },
  { key: 'jawabBatas', label: 'Batas Waktu Jawaban', type: 'date', required: (r) => r.perluJawab === 'Ya', showIf: (r) => r.perluJawab === 'Ya', editableBy: (c) => !isPic(c) },
  { key: 'jawabTgl', label: 'Tanggal Dijawab', type: 'date', showIf: (r) => r.perluJawab === 'Ya', editableBy: (c) => !isPic(c) },
  { key: 'tglSosialisasi', label: 'Tanggal Sosialisasi Internal', type: 'date', help: 'Boleh diisi belakangan, setelah dampak dinilai.', editableBy: (c) => !isPic(c) },
  {
    key: 'sopList', label: 'SOP / Kebijakan yang Harus Diperbarui', type: 'list', wide: true, help: 'Opsional; kosong tidak memblokir simpan. Gunakan aksi "+ SOP cepat" di tabel untuk SOP baru.',
    sub: [
      { key: 'sop', label: 'SOP (No Dokumen - Judul - Unit Kerja)', type: 'select', options: () => readModule<SopRec>('sop', seedSop).map(sopLabel), required: true },
      { key: 'done', label: 'Sudah diperbarui?', type: 'yesno', required: true },
    ],
    editableBy: (c) => !isPic(c),
  },
  { key: 'lampiran', label: 'Lampiran / Bukti', type: 'file', required: true, editableBy: (c) => !isPic(c) },
]

const columns: Column<Reg>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Peraturan / Surat', get: (r) => label(r) },
  { label: 'Regulator', get: (r) => r.regulator },
  { label: 'Tentang', get: (r) => r.tentang },
  { label: 'Jenis Perubahan', get: (r) => r.jp },
  { label: 'Status Peraturan', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'Dampak', get: (r) => r.dampak || '-', render: (r) => <StatusPill s={r.dampak} tone={dampakTone(r.dampak)} /> },
  { label: 'Pemenuhan', get: (r) => (r.pemenuhan === '' ? '-' : `${r.pemenuhan}%`) },
  { label: 'Status Kepatuhan', get: (r) => kep(r), render: (r) => <StatusPill s={kep(r)} /> },
]

const uniq = (rows: Reg[], g: (r: Reg) => string[]) => [...new Set(rows.flatMap(g).filter(Boolean))].sort()
const filters: FilterDef<Reg>[] = [
  { key: 'periode', label: 'Periode (Tanggal Dicatat)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglDicatat >= a) && (!b || r.tglDicatat <= b) } },
  { key: 'regulator', label: 'Regulator', type: 'select', options: (_, c) => c.master.regulator, match: (r, v) => r.regulator === v },
  { key: 'jp', label: 'Jenis Perubahan', type: 'select', options: JP, match: (r, v) => r.jp === v },
  { key: 'kepatuhan', label: 'Status Kepatuhan', type: 'select', options: KEP, match: (r, v) => kep(r) === v },
  { key: 'dept', label: 'Unit Kerja Terdampak', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.dept.includes(v as string) },
  { key: 'pic', label: 'PIC Tindak Lanjut', type: 'select', options: (rows) => uniq(rows, (r) => r.tindak.map((t) => t.pic)), match: (r, v) => r.tindak.some((t) => t.pic === v) },
  { key: 'status', label: 'Status Peraturan', type: 'select', options: [...STATUS, 'Dibatalkan'], match: (r, v) => r.status === v },
]

// ---- Alert ----
const mk = (c: Ctx, o: Partial<Reg>): Reg => ({
  id: 'sample', no: 99, status: 'Berlaku', createdAt: c.today, createdBy: '-', jenis: 'PBI', nomor: '99', tahun: '2026', regulator: 'BI', tentang: 'Contoh peraturan', kategori: 'QRIS', jp: 'Baru',
  tglTerbit: addDays(c.today, -20), tglBerlaku: addDays(c.today, 30), tglDicatat: addDays(c.today, -20), diubah: '', dampak: '', dampakUraian: '', dept: ['Compliance'], pemenuhan: '',
  tindak: [], perluJawab: 'Tidak', jawabBatas: '', jawabTgl: '', tglSosialisasi: '', sopList: [], lampiran: null, ...o,
})
const MILE = [7, 30, 60, 90]
const mile = (r: Reg, today: string) => { if (!r.tglBerlaku) return null; const d = diffDays(r.tglBerlaku, today); if (d < 0 || d > 90) return null; return { d, m: MILE.find((m) => d <= m) as number } }
const alerts: AlertDef<Reg>[] = [
  {
    key: 'unrated', label: 'Belum dinilai > 10 hari kerja', rule: 'Peraturan atau imbauan baru belum dinilai (dampak kosong) lebih dari 10 hari kerja sejak dicatat.',
    check: (r, c) => { const d = workDaysBetween(r.tglDicatat, c.today); return unrated(r) && d > 10 ? { color: 'yellow', detail: `${d} hari kerja sejak dicatat`, to: ['Compliance Officer', 'Head CLRM'] } : null },
    sample: (c) => mk(c, { tglDicatat: addDays(c.today, -18) }),
  },
  {
    key: 'effective', label: 'Akan berlaku, tindak lanjut belum selesai', rule: 'Tindak lanjut belum selesai pada H-90, 60, 30, dan 7 sebelum Tanggal Berlaku. Kuning, merah saat H-7.',
    check: (r, c) => { const x = mile(r, c.today); return x && openTindak(r).length ? { color: x.m === 7 ? 'red' : 'yellow', detail: `Berlaku ${x.d} hari lagi (tahap H-${x.m}), ${openTindak(r).length} tindak lanjut belum selesai`, to: [...picTo(r), 'Head CLRM'] } : null },
    sample: (c) => mk(c, { tglBerlaku: addDays(c.today, 28), pemenuhan: 50, tindak: [{ uraian: 'Penyesuaian sistem', pic: 'Bima Pratama', batas: addDays(c.today, 20), status: 'Proses' }] }),
  },
  {
    key: 'reply', label: 'Imbauan harus dijawab', rule: 'Batas jawaban imbauan kurang dari 7 hari (H-7, H-3, H-1), kuning. Merah hanya bila batas terlewat.',
    check: (r, c) => {
      if (!needReply(r)) return null
      const d = diffDays(r.jawabBatas, c.today)
      return d <= 7 ? { color: d < 0 ? 'red' : 'yellow', detail: d < 0 ? `Lewat ${-d} hari dari batas jawaban` : `${d} hari lagi sampai batas jawaban`, to: ['Compliance Officer', 'Head CLRM'] } : null
    },
    sample: (c) => mk(c, { jenis: 'Surat Imbauan', jp: 'Imbauan', tglBerlaku: '', perluJawab: 'Ya', jawabBatas: addDays(c.today, 3) }),
  },
  {
    key: 'sop', label: 'Pencabutan berlaku, SOP belum diperbarui', rule: 'Tanggal pencabutan terlewat dan SOP terkait belum diperbarui.',
    check: (r, c) => {
      const n = r.sopList.filter((s) => s.done !== 'Ya').length
      return r.jp === 'Pencabutan' && r.tglBerlaku && r.tglBerlaku < c.today && n ? { color: 'yellow', detail: `${n} SOP belum diperbarui sejak pencabutan ${fmtDate(r.tglBerlaku)}`, to: [...picTo(r), 'Compliance Officer'] } : null
    },
    sample: (c) => mk(c, { jp: 'Pencabutan', status: 'Dicabut', tglBerlaku: addDays(c.today, -15), sopList: [{ sop: 'SOP-073-PAY - Manajemen Akses Sistem - IT', done: 'Tidak' }] }),
  },
  {
    key: 'high', label: 'Peraturan baru berdampak Tinggi', rule: 'Peraturan atau surat (jenis apa pun) dengan tingkat dampak Tinggi yang baru dicatat dalam 7 hari terakhir.',
    check: (r, c) => (r.dampak === 'Tinggi' && diffDays(c.today, r.tglDicatat) <= 7 ? { color: 'yellow', detail: `Dampak Tinggi, dicatat ${fmtDate(r.tglDicatat)}`, to: ['Head CLRM', 'Direktur terkait'] } : null),
    sample: (c) => mk(c, { dampak: 'Tinggi', dampakUraian: 'Perubahan proses utama', tglDicatat: addDays(c.today, -5) }),
  },
]

// ---- Seed ----
function seed(today: string): Reg[] {
  const sop = seedSop(today).map(sopLabel)
  const f = (name: string) => ({ name, size: 180 * 1024, type: 'application/pdf' })
  const T = (uraian: string, pic: string, off: number, status: string): Tindak => ({ uraian, pic, batas: addDays(today, off), status })
  type S = [string, string, string, string, string, string, string, string, number, number | null, number, number | null, string, number | '', Tindak[], string, number | null, number | null, number | null, string[], boolean[]?]
  // [jenis, nomor, tahun, regulator, tentang, kategori, jp, status, terbit, berlaku, dicatat, diubah(idx 1-based)|null, dampak, pemenuhan, tindak, perluJawab, jawabBatas, jawabTgl, sosialisasi, dept, sopDone]
  const D = 'Dampak penyesuaian proses dan sistem'
  const rows: S[] = [
    ['PBI', '23/2025', '2025', 'BI', 'Pemrosesan transaksi pembayaran', 'QRIS', 'Baru', 'Diubah', -350, -320, -340, null, 'Sedang', 100, [], 'Tidak', null, null, -330, ['Operation', 'IT']],
    ['PADG', '14/2025', '2025', 'BI', 'Perubahan standar QRIS', 'QRIS', 'Perubahan', 'Berlaku', -300, -270, -290, 1, 'Sedang', 100, [], 'Tidak', null, null, -280, ['Business', 'IT'], [true]],
    ['UU', '4/2025', '2025', 'Pemerintah-DPR', 'Pelindungan data konsumen sektor keuangan', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -280, -240, -270, null, 'Tinggi', 85, [T('Revisi kebijakan privasi', 'Arief Nugraha', -15, 'Proses'), T('Pelatihan staf', 'Lina Marlina', 40, 'Open')], 'Tidak', null, null, -250, ['Compliance', 'Support (HRD & GA)']],
    ['Peraturan BSSN', '2/2025', '2025', 'BSSN', 'Standar ketahanan siber penyelenggara', 'Ketahanan Siber', 'Baru', 'Berlaku', -250, -200, -240, null, 'Tinggi', 40, [T('Uji penetrasi tahunan', 'Bima Pratama', -30, 'Proses'), T('Pemantauan SOC 24 jam', 'Bima Pratama', -5, 'Open')], 'Tidak', null, null, -215, ['IT', 'Operation']],
    ['Surat Edaran', '3/2025', '2025', 'PPATK', 'Pelaporan transaksi mencurigakan', 'APU PPT', 'Baru', 'Berlaku', -230, -190, -220, null, 'Sedang', 75, [T('Perbarui parameter pemantauan', 'Rina Kartika', -10, 'Proses')], 'Tidak', null, null, -200, ['Compliance', 'Finance, Accounting, Tax & Treasury']],
    ['Permen', '8/2025', '2025', 'Komdigi', 'Penyelenggaraan sistem elektronik', 'Ketahanan Siber', 'Baru', 'Berlaku', -210, -180, -200, null, 'Rendah', 100, [], 'Tidak', null, null, -190, ['IT']],
    ['PBI', '9/2025', '2025', 'BI', 'Perlindungan konsumen sistem pembayaran', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -190, -150, -180, null, 'Sedang', 90, [T('Standar penanganan keluhan', 'Lina Marlina', -3, 'Proses')], 'Tidak', null, null, -160, ['Support (HRD & GA)', 'Operation']],
    ['PADG', '21/2025', '2025', 'BI', 'Interkoneksi SNAP', 'SNAP', 'Baru', 'Berlaku', -170, -140, -160, null, 'Sedang', 100, [], 'Tidak', null, null, -150, ['IT', 'Business']],
    ['Surat Imbauan', '12/2025', '2025', 'BI', 'Imbauan peningkatan mitigasi fraud QRIS', 'QRIS', 'Imbauan', 'Berlaku', -150, null, -140, null, 'Rendah', 100, [], 'Ya', -100, -105, -130, ['Operation']],
    ['PBI', '5/2026', '2026', 'BI', 'Pencabutan ketentuan uang elektronik lama', 'Lainnya', 'Pencabutan', 'Dicabut', -140, -100, -130, 1, 'Sedang', 60, [T('Sesuaikan SOP terkait', 'Arief Nugraha', -20, 'Proses')], 'Tidak', null, null, -120, ['Operation', 'Finance, Accounting, Tax & Treasury'], [false]],
    ['UU', '1/2026', '2026', 'Pemerintah-DPR', 'Perubahan UU pelindungan konsumen', 'Pelindungan Konsumen', 'Perubahan', 'Berlaku', -120, -80, -110, 3, 'Tinggi', 70, [T('Gap analysis kebijakan', 'Rina Kartika', -2, 'Proses')], 'Tidak', null, null, -90, ['Compliance', 'Support (HRD & GA)', 'Business'], [true, false]],
    ['Peraturan BSSN', '1/2026', '2026', 'BSSN', 'Pelaporan insiden siber', 'Ketahanan Siber', 'Perubahan', 'Berlaku', -100, -60, -95, 4, 'Sedang', 55, [T('Prosedur pelaporan insiden', 'Bima Pratama', 10, 'Proses')], 'Tidak', null, null, -70, ['IT', 'Compliance']],
    ['Surat Edaran', '7/2026', '2026', 'PPATK', 'Penerapan prinsip mengenali pengguna jasa', 'APU PPT', 'Perubahan', 'Berlaku', -85, -40, -80, 5, 'Sedang', 95, [T('Perbarui formulir KYC', 'Rina Kartika', 5, 'Proses')], 'Tidak', null, null, -50, ['Compliance', 'Business']],
    ['PADG', '3/2026', '2026', 'BI', 'Biaya merchant discount rate QRIS', 'QRIS', 'Perubahan', 'Berlaku', -70, -30, -65, 2, 'Rendah', 100, [], 'Tidak', null, null, -40, ['Finance, Accounting, Tax & Treasury', 'Business']],
    ['Permen', '2/2026', '2026', 'Komdigi', 'Tata kelola data pribadi', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -60, -20, -55, null, 'Sedang', 100, [], 'Tidak', null, null, -30, ['IT']],
    ['Surat Imbauan', '4/2026', '2026', 'BI', 'Imbauan pelaporan data merchant', 'QRIS', 'Imbauan', 'Berlaku', -50, null, -45, null, 'Rendah', '', [], 'Ya', 2, null, null, ['Business']],
    ['Surat Imbauan', '6/2026', '2026', 'PPATK', 'Imbauan peningkatan kualitas LTKM', 'APU PPT', 'Imbauan', 'Berlaku', -40, null, -35, null, 'Rendah', '', [], 'Ya', 6, null, null, ['Compliance']],
    ['Surat Imbauan', '8/2026', '2026', 'BSSN', 'Imbauan kerentanan perangkat lunak', 'Ketahanan Siber', 'Imbauan', 'Berlaku', -30, null, -25, null, 'Rendah', '', [], 'Ya', -3, null, null, ['IT']],
    ['PBI', '10/2026', '2026', 'BI', 'Penguatan tata kelola sistem pembayaran', 'SNAP', 'Baru', 'Berlaku', -12, 5, -10, null, 'Tinggi', 45, [T('Pemetaan kontrol tata kelola', 'Arief Nugraha', 3, 'Proses')], 'Tidak', null, null, null, ['Operation', 'IT']],
    ['PADG', '12/2026', '2026', 'BI', 'Pembatasan transaksi lintas negara', 'SNAP', 'Baru', 'Berlaku', -15, 25, -12, null, 'Sedang', 30, [T('Penyesuaian aturan routing', 'Bima Pratama', 15, 'Open')], 'Tidak', null, null, null, ['IT', 'Finance, Accounting, Tax & Treasury']],
    ['Surat Edaran', '9/2026', '2026', 'PPATK', 'Pelaporan transaksi tunai lintas batas', 'APU PPT', 'Baru', 'Berlaku', -8, 55, -7, null, 'Sedang', 50, [T('Modul pelaporan LTKT', 'Rina Kartika', 40, 'Open')], 'Tidak', null, null, null, ['Compliance', 'Finance, Accounting, Tax & Treasury']],
    ['UU', '5/2026', '2026', 'Pemerintah-DPR', 'Pengamanan transaksi elektronik', 'Ketahanan Siber', 'Baru', 'Berlaku', -6, 85, -5, null, 'Sedang', 20, [T('Asesmen kesiapan', 'Bima Pratama', 70, 'Open')], 'Tidak', null, null, null, ['IT', 'Operation']],
    ['Permen', '9/2026', '2026', 'Komdigi', 'Ketentuan layanan finansial digital', 'Lainnya', 'Baru', 'Berlaku', -45, -35, -30, null, '', '', [], 'Tidak', null, null, null, ['Support (HRD & GA)']],
    ['Surat Edaran', '10/2026', '2026', 'Lainnya', 'Pedoman pelaporan keluhan konsumen', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -22, 20, -15, null, '', '', [], 'Tidak', null, null, null, ['Support (HRD & GA)']],
    ['PBI', '11/2026', '2026', 'BI', 'Pencabutan standar pembayaran lama', 'Lainnya', 'Pencabutan', 'Dicabut', -35, -12, -25, 9, 'Rendah', 80, [T('Hapus rujukan standar lama', 'Lina Marlina', 7, 'Proses')], 'Tidak', null, null, -18, ['Operation', 'IT'], [false, false]],
    ['PADG', '15/2026', '2026', 'BI', 'Pembaruan interkoneksi QRIS', 'QRIS', 'Perubahan', 'Berlaku', -4, 14, -3, 8, '', '', [], 'Tidak', null, null, null, ['IT']],
    ['PBI', '12/2026', '2026', 'BI', 'Penguatan pengawasan penyelenggara jasa pembayaran', 'SNAP', 'Baru', 'Berlaku', -55, -20, -50, null, 'Rendah', 100, [], 'Tidak', null, null, -30, ['Operation']],
    ['Surat Edaran', '11/2026', '2026', 'PPATK', 'Pembaruan daftar pantauan transaksi', 'APU PPT', 'Perubahan', 'Berlaku', -20, 10, -18, 13, 'Sedang', 60, [T('Perbarui daftar pantauan', 'Rina Kartika', 6, 'Proses')], 'Tidak', null, null, -10, ['Compliance']],
    ['Surat Imbauan', '9/2026', '2026', 'Komdigi', 'Imbauan keamanan aplikasi pembayaran', 'Ketahanan Siber', 'Imbauan', 'Berlaku', -18, null, -14, null, 'Rendah', 100, [], 'Ya', 9, null, -8, ['IT']],
    ['Permen', '10/2026', '2026', 'Komdigi', 'Standar layanan pelindungan pengguna', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -10, 40, -6, null, 'Sedang', 35, [T('Gap analysis standar layanan', 'Bima Pratama', 25, 'Open')], 'Tidak', null, null, -3, ['Support (HRD & GA)', 'Business']],
  ]
  const ids = (n: number) => `regchange-${n}`
  return rows.map((x, i) => {
    const [jenis, nn, tahun, regulator, tentang, kategori, jp, status, terbit, berlaku, dicatat, diubah, dampak, pem, tindak, perlu, jb, jt, sos, dept, done] = x
    const [nomor] = nn.split('/')
    const sopList = jp === 'Perubahan' || jp === 'Pencabutan' ? (done ?? [false]).map((d, k) => ({ sop: sop[(i * 3 + k * 5) % sop.length], done: d ? 'Ya' : 'Tidak' })) : []
    return {
      id: ids(i + 1), no: i + 1, status, createdAt: addDays(today, dicatat), createdBy: 'Rina Kartika',
      jenis, nomor, tahun, regulator, tentang, kategori, jp,
      tglTerbit: addDays(today, terbit), tglBerlaku: berlaku === null ? '' : addDays(today, berlaku), tglDicatat: addDays(today, dicatat),
      diubah: diubah ? `${rows[diubah - 1][0]} ${rows[diubah - 1][1].split('/')[0]}/${rows[diubah - 1][2]}` : '',
      dampak, dampakUraian: dampak ? `${D}: ${tentang.toLowerCase()}.` : '', dept, pemenuhan: pem, tindak,
      perluJawab: jp === 'Imbauan' ? perlu : '', jawabBatas: jb === null ? '' : addDays(today, jb), jawabTgl: jt === null ? '' : addDays(today, jt),
      tglSosialisasi: sos === null ? '' : addDays(today, sos), sopList, lampiran: f(`${jenis.replace(/ /g, '')}-${nomor}-${tahun}.pdf`),
    }
  })
}

// ---- SOP cepat (RowAction) ----
function SopQuick({ r, add, close }: { r: Reg; add: (s: SopItem) => void; close: () => void }) {
  const { ctx } = useApp()
  const [no, setNo] = useState('')
  const [judul, setJudul] = useState('')
  const [dept, setDept] = useState('')
  const [err, setErr] = useState('')
  const save = () => {
    if (!no.trim() || !judul.trim() || !dept) return setErr('No Dokumen, Judul, dan Unit Kerja wajib diisi.')
    const s = addRecord<SopRec>('sop', {
      status: 'Dalam Review', noDok: no.trim(), judul: judul.trim(), ringkasan: '', pemilik: dept, tglBerlaku: '', tglUbah: ctx.today, noRevisi: 'Rev.1',
      retensi: '', klasifikasi: '', file: null, tglReview: '', pic: '', revisi: [],
    }, seedSop)
    add({ sop: sopLabel(s), done: 'Tidak' })
    close()
  }
  return (
    <Modal title={`+ SOP cepat untuk ${label(r)}`} onClose={close}>
      <div className="space-y-3">
        <div><label className="lbl">No Dokumen *</label><input className="inp" value={no} onChange={(e) => setNo(e.target.value)} /></div>
        <div><label className="lbl">Judul *</label><input className="inp" value={judul} onChange={(e) => setJudul(e.target.value)} /></div>
        <div><label className="lbl">Unit Kerja *</label><select className="inp" value={dept} onChange={(e) => setDept(e.target.value)}><option value="">Pilih...</option>{ctx.master.unitKerja.map((d) => <option key={d}>{d}</option>)}</select></div>
        <p className="text-xs text-slate-400">SOP dibuat dengan status Dalam Review dan ditambahkan ke daftar SOP peraturan ini.</p>
        {err && <p className="err">{err}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn" onClick={close}>Batal</button><button className="btn btn-primary" onClick={save}>Simpan</button></div>
    </Modal>
  )
}

const cfg: PageConfig<Reg> = {
  module: 'regchange', title: 'Regulatory Change', noun: 'Peraturan', exportPrefix: 'Daftar_Peraturan',
  seed, fields, columns, filters, alerts, cancelStatus: 'Dibatalkan',
  blank: () => ({
    status: 'Berlaku', jenis: '', nomor: '', tahun: '', regulator: '', tentang: '', kategori: '', jp: '', tglTerbit: '', tglBerlaku: '', tglDicatat: todayStr(), diubah: '',
    dampak: '', dampakUraian: '', dept: [], pemenuhan: '', tindak: [], perluJawab: '', jawabBatas: '', jawabTgl: '', tglSosialisasi: '', sopList: [], lampiran: null,
  }),
  search: (r) => `${r.no} ${label(r)} ${r.tentang} ${r.kategori}`, searchPlaceholder: 'Cari nama/nomor peraturan, tentang, kategori',
  canEditRow: (r, c) => (isPic(c) ? r.tindak.some((t) => sameName(t.pic, c.user.name)) : true),
  approvals: [{ jenis: 'Perubahan Daftar Peraturan', approver: 'Ketua SMKI', needs: () => true, keys: IDENT }],
  validate: (r, _m, c) => {
    const e: Record<string, string> = {}
    if (r.tglBerlaku && r.tglTerbit && r.tglBerlaku < r.tglTerbit) e.tglBerlaku = 'Tanggal Berlaku tidak boleh sebelum Tanggal Terbit'
    if (r.diubah && r.diubah === label(r)) e.diubah = 'Tidak boleh memilih peraturan itu sendiri'
    const dup = (c.all('regchange') as Reg[]).find((x) => x.id !== r.id && !x.cancelled && label(x).toLowerCase() === label(r).toLowerCase())
    if (r.jenis && r.nomor && r.tahun && dup) e.nomor = `${label(r)} sudah ada (No ${dup.no})`
    if (r.perluJawab === 'Ya' && r.jawabTgl && r.jawabBatas && r.jawabTgl < r.tglDicatat) e.jawabTgl = 'Tanggal Dijawab tidak boleh sebelum Tanggal Dicatat'
    return e
  },
  rowActions: [{
    label: '+ SOP cepat', show: (_r, c) => c.role === 'Compliance Officer' || c.role === 'Super Admin',
    run: (r, api, close) => <SopQuick r={r} close={close} add={(s) => api.update(r.id, { sopList: [...r.sopList, s] })} />,
  }],
  Dashboard: ({ rows, c, drill, open }) => {
    const n = (k: string) => rows.filter((r) => kep(r) === k).length
    const mons = Array.from({ length: 12 }, (_, i) => { const d = new Date(c.today + 'T00:00:00'); d.setDate(1); d.setMonth(d.getMonth() - (11 - i)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
    const rated = rows.filter((r) => r.pemenuhan !== '')
    const edges = [10, 20]
    const un = rows.filter(unrated)
    const age = (r: Reg) => diffDays(c.today, r.tglDicatat)
    const lateByDept = c.master.unitKerja.map((d) => ({ name: d, Terlambat: rows.filter((r) => r.dept.includes(d)).reduce((a, r) => a + lateTindak(r, c.today).length, 0) }))
    const soon = rows.filter((r) => r.tglBerlaku && r.tglBerlaku >= c.today && diffDays(r.tglBerlaku, c.today) <= 90).map((r) => ({ r, tgl: r.tglBerlaku, jenis: 'Berlaku', d: diffDays(r.tglBerlaku, c.today) }))
    const reply = rows.filter(needReply).map((r) => ({ r, tgl: r.jawabBatas, jenis: 'Jawab imbauan', d: diffDays(r.jawabBatas, c.today) }))
    const agenda = [...soon, ...reply].sort((a, b) => a.tgl.localeCompare(b.tgl))
    const warn = (x: { d: number; jenis: string }) => (x.d <= (x.jenis === 'Berlaku' ? 7 : 1) ? 'red' : 'yellow') as 'red' | 'yellow'
    return (
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Peraturan per regulator dan jenis perubahan" stacked data={c.master.regulator.map((g) => ({ name: g, ...Object.fromEntries(JP.map((j) => [j, rows.filter((r) => r.regulator === g && r.jp === j).length])) }))} keys={JP} colors={['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']} onClick={(row) => drill({ regulator: row.name })} />
          <LineCard title="Tren peraturan baru dan perubahan per bulan" data={mons.map((m) => ({ name: m, Baru: rows.filter((r) => r.tglDicatat.startsWith(m) && r.jp === 'Baru').length, Perubahan: rows.filter((r) => r.tglDicatat.startsWith(m) && r.jp === 'Perubahan').length }))} keys={['Baru', 'Perubahan']} colors={['#3b82f6', '#f59e0b']} />
          <DonutCard title="Status kepatuhan" data={KEP.map((k) => ({ name: k, value: n(k), color: KEP_COLOR[k] }))} onClick={(name) => drill({ kepatuhan: name })} />
          <BarCard title="Rata-rata pemenuhan per kategori (%)" data={c.master.kategoriRegulasi.map((k) => { const x = rated.filter((r) => r.kategori === k); return { name: k, Pemenuhan: x.length ? Math.round(x.reduce((a, r) => a + Number(r.pemenuhan), 0) / x.length) : 0 } })} keys={['Pemenuhan']} />
          <div className="space-y-3">
            <BarCard title="Belum dinilai menurut lama sejak dicatat (hari)" data={ageBuckets(edges).map((b) => ({ name: b, Jumlah: un.filter((r) => ageBucket(age(r), edges) === b).length }))} keys={['Jumlah']} colors={['#f59e0b']} />
            <MiniTable title="Peraturan belum dinilai" rows={un} onRow={(r) => open(r.id)} empty="Semua sudah dinilai"
              cols={[{ label: 'No', get: (r) => r.no }, { label: 'Peraturan', get: label }, { label: 'Dicatat', get: (r) => fmtDate(r.tglDicatat) }, { label: 'Umur (hari)', get: (r) => age(r) }]} />
          </div>
          <BarCard title="Tindak lanjut lewat batas per unit kerja" horizontal data={lateByDept} keys={['Terlambat']} colors={['#ef4444']} onClick={(row) => drill({ dept: row.name })} />
        </div>
        <MiniTable title="Berlaku dalam 90 hari dan imbauan perlu dijawab" rows={agenda} onRow={(x) => open(x.r.id)} empty="Tidak ada agenda"
          cols={[
            { label: 'Tanggal', get: (x) => fmtDate(x.tgl) }, { label: 'Jenis', get: (x) => x.jenis }, { label: 'Peraturan', get: (x) => label(x.r) }, { label: 'Tentang', get: (x) => x.r.tentang },
            { label: 'Sisa waktu', get: (x) => <StatusPill s={x.d < 0 ? `Lewat ${-x.d} hari` : `${x.d} hari lagi`} tone={warn(x)} /> },
          ]} />
      </div>
    )
  },
}
export default function RegChange() { return <PageShell config={cfg} /> }
