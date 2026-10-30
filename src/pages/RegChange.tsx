import { addDays, diffDays, fmtDate, todayStr } from '../lib'
import { withLainnya } from '../kit/Lainnya'
import PageShell from '../kit/PageShell'
import { REGCHANGE_GUIDE } from '../guides/regchange'
import { BarCard, DonutCard, LineCard, MiniTable, useMonthRange } from '../kit/charts'
import type { ChartInfo } from '../kit/charts'
import { ageBucket, ageBuckets, monthKey, workDaysBetween } from '../kit/dates'
import { StatusPill } from '../kit/fmt'
import { readModule } from '../kit/store'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'
import { SopRec, seedSop, sopLabel } from './sop.shared'

// Regulatory Change (Compliance Bab 3). status (BaseRec) = Status Peraturan: Berlaku / Diubah / Dicabut (+ Dibatalkan dari cancel).
// Tindak Lanjut = satu teks; sopList = daftar label SOP (No Dokumen - Judul - Unit Kerja) yang harus diperbarui. Hanya CO dan Super Admin yang mengubah (PIC tidak punya kepemilikan per item lagi).
interface Reg extends BaseRec {
  jenis: string; nomor: string; tahun: string; regulator: string; tentang: string; kategori: string; jp: string
  tglTerbit: string; tglBerlaku: string; tglDicatat: string; diubah: string
  dampak: string; dampakUraian: string; dept: string[]; pemenuhan: number | ''
  tindak: string; perluJawab: string; jawabBatas: string; jawabTgl: string; tglSosialisasi: string
  sopList: string[]; lampiran: { name: string; size: number; type: string } | null
}

// Teks info (i) tiap kartu dashboard
const INFO: Record<string, ChartInfo> = {
  regulator: {
    apa: 'Jumlah peraturan per regulator, dipisah menurut Jenis Perubahan. Regulator yang diketik bebas di luar daftar dihitung sebagai Lainnya.',
    baca: [
      'Sumbu X: regulator. Sumbu Y: jumlah peraturan.',
      'Warna = Jenis Perubahan: biru Baru, kuning Perubahan, merah Pencabutan, ungu Imbauan. Tinggi tumpukan = total peraturan regulator itu.',
      'Klik batang untuk membuka tab Table terfilter menurut regulator tersebut.',
    ],
  },
  tren: {
    apa: 'Jumlah peraturan Baru dan Perubahan yang dicatat per bulan (menurut Tanggal Dicatat). Jenis Pencabutan dan Imbauan tidak masuk grafik ini. Memakai semua data, tidak ikut Periode Tanggal Dicatat.',
    baca: [
      'Sumbu X: bulan Tanggal Dicatat. Sumbu Y: jumlah peraturan.',
      'Garis biru = Baru. Garis kuning = Perubahan.',
      'Filter bulan di atas grafik berlaku untuk kartu ini saja (default 12 bulan terakhir).',
      'Arahkan kursor ke titik untuk melihat angkanya. Titik tidak bisa diklik.',
    ],
  },
  kepatuhan: {
    apa: 'Pembagian peraturan menurut Status Kepatuhan, yang dihitung dari Pemenuhan (%): Comply (100 atau lebih), Partial (70 sampai 99), Gap (di bawah 70), Belum Dinilai (Pemenuhan kosong).',
    baca: [
      'Tiap irisan adalah satu status. Hijau Comply, kuning Partial, merah Gap, abu-abu Belum Dinilai.',
      'Makin besar irisan, makin banyak peraturan di status itu. Status tanpa data tidak ditampilkan.',
      'Arahkan kursor untuk melihat jumlahnya. Klik irisan untuk membuka tab Table terfilter menurut Status Kepatuhan itu.',
    ],
  },
  pemenuhan: {
    apa: 'Rata-rata Pemenuhan (%) per Kategori, dihitung hanya dari peraturan yang sudah punya nilai Pemenuhan. Kategori tanpa peraturan yang dinilai tampil 0.',
    baca: [
      'Sumbu X: Kategori (dari Master Data). Sumbu Y: rata-rata Pemenuhan dalam persen, dibulatkan.',
      'Makin tinggi batang, makin patuh kategori itu. Angka 0 bisa berarti belum ada yang dinilai.',
      'Arahkan kursor untuk melihat nama kategori dan rata-ratanya. Batang tidak bisa diklik.',
    ],
  },
  umur: {
    apa: 'Jumlah peraturan yang Tingkat Dampaknya masih kosong (belum dinilai), dikelompokkan menurut lama sejak Tanggal Dicatat dalam hari kalender.',
    baca: [
      'Sumbu X (Hari): kelompok lama sejak dicatat, yaitu 0-10, 11-20, dan lebih dari 20 hari. Sumbu Y: jumlah peraturan.',
      'Makin banyak di kelompok kanan, makin lama peraturan menunggu penilaian.',
      'Alert email "Belum dinilai" memakai hari kerja lebih dari 10, sehingga angkanya bisa sedikit berbeda dari grafik ini.',
      'Batang tidak bisa diklik.',
    ],
  },
  belum: {
    apa: 'Daftar peraturan yang Tingkat Dampaknya masih kosong (belum dinilai).',
    baca: [
      'Kolom: No (urutan baris), Peraturan, Dicatat (Tanggal Dicatat), dan Umur (hari kalender sejak dicatat).',
      'Klik satu baris untuk membuka Detail peraturan. Tabel dibagi per 5 baris.',
    ],
  },
  unit: {
    apa: 'Jumlah peraturan berstatus Partial dan Gap per unit kerja terdampak. Satu peraturan dihitung di setiap unit yang tercantum pada Unit Kerja Terdampak.',
    baca: [
      'Sumbu Y: unit kerja. Sumbu X: jumlah peraturan.',
      'Kuning = Partial. Merah = Gap. Panjang batang = total Partial ditambah Gap unit itu.',
      'Klik batang untuk membuka tab Table terfilter menurut Unit Kerja Terdampak tersebut.',
    ],
  },
  agenda: {
    apa: 'Agenda tanggal penting: peraturan dengan Tanggal Berlaku dalam 90 hari ke depan (jenis Berlaku), dan imbauan yang perlu dijawab tetapi belum ada Tanggal Dijawab (jenis Imbauan, termasuk yang batasnya sudah lewat).',
    baca: [
      'Diurutkan dari tanggal paling awal. Kolom Tanggal = Tanggal Berlaku atau Batas Waktu Jawaban.',
      'Kolom Sisa waktu: kuning atau merah. Merah bila Berlaku tinggal 7 hari atau kurang, atau Imbauan tinggal 1 hari atau kurang atau sudah lewat.',
      'Klik satu baris untuk membuka Detail peraturan. Tabel dibagi per 5 baris.',
    ],
  },
}

const JENIS = ['PBI', 'PADG', 'UU', 'Permen', 'Peraturan BSSN', 'Surat Edaran', 'Surat Imbauan']
const REGULATOR = ['BI', 'PPATK', 'Komdigi', 'BSSN', 'Pemerintah-DPR', 'Lainnya']
const regB = (r: Reg) => (REGULATOR.includes(r.regulator) ? r.regulator : 'Lainnya') // teks bebas di luar daftar dihitung 'Lainnya'
const KATEGORI = ['APU PPT', 'QRIS', 'SNAP', 'Pelindungan Konsumen', 'Ketahanan Siber', 'Lainnya']
const JP = ['Baru', 'Perubahan', 'Pencabutan', 'Imbauan']
const STATUS = ['Berlaku', 'Diubah', 'Dicabut']
const DAMPAK = ['Tinggi', 'Sedang', 'Rendah']
const KEP = ['Comply', 'Partial', 'Gap', 'Belum Dinilai']
const KEP_COLOR: Record<string, string> = { Comply: '#10b981', Partial: '#f59e0b', Gap: '#ef4444', 'Belum Dinilai': '#94a3b8' }

const kep = (r: Reg) => (r.pemenuhan === '' ? 'Belum Dinilai' : r.pemenuhan >= 100 ? 'Comply' : r.pemenuhan >= 70 ? 'Partial' : 'Gap')
const label = (r: Reg) => `${r.jenis} ${r.nomor}/${r.tahun}`
const unrated = (r: Reg) => !r.dampak
const needReply = (r: Reg) => r.perluJawab === 'Ya' && !r.jawabTgl && !!r.jawabBatas
const dampakTone = (s: string) => (s === 'Tinggi' ? 'red' : s === 'Sedang' ? 'yellow' : s === 'Rendah' ? 'green' : 'gray') as 'red' | 'yellow' | 'green' | 'gray'
const IDENT = ['jenis', 'nomor', 'tahun', 'regulator', 'tentang', 'kategori', 'jp', 'status', 'tglTerbit', 'tglBerlaku', 'diubah']
const isPic = (c: Ctx) => c.role === 'PIC'

const fields: Field<Reg>[] = [
  { key: 'jenis', label: 'Jenis Peraturan / Surat', type: 'select', options: JENIS, required: true },
  { key: 'nomor', label: 'Nomor Peraturan', type: 'text', required: true },
  { key: 'tahun', label: 'Tahun', type: 'text', required: true },
  { key: 'regulator', label: 'Regulator / Penerbit', type: 'select', options: REGULATOR, required: true },
  { key: 'tentang', label: 'Tentang', type: 'textarea', required: true },
  { key: 'kategori', label: 'Kategori (Perihal / Fitur)', type: 'select', options: (c) => withLainnya(c.master.kategoriRegulasi), required: true },
  { key: 'jp', label: 'Jenis Perubahan', type: 'select', options: JP, required: true },
  { key: 'status', label: 'Status Peraturan', type: 'select', options: STATUS, required: true },
  { key: 'tglTerbit', label: 'Tanggal Terbit', type: 'date', required: true },
  { key: 'tglBerlaku', label: 'Tanggal Berlaku', type: 'date', required: (r) => r.jp !== 'Imbauan', help: 'Boleh kosong untuk Imbauan.' },
  { key: 'tglDicatat', label: 'Tanggal Dicatat CLRM', type: 'date', required: true },
  {
    key: 'diubah', label: 'Peraturan yang Diubah / Dicabut', type: 'select', required: (r) => r.jp === 'Perubahan' || r.jp === 'Pencabutan', showIf: (r) => r.jp === 'Perubahan' || r.jp === 'Pencabutan',
    options: (c) => (c.all('regchange') as Reg[]).filter((x) => !x.cancelled).map(label),
  },
  { key: 'dampak', label: 'Tingkat Dampak bagi Paydia', type: 'select', options: DAMPAK, required: true, help: 'Wajib dinilai; Tanggal Sosialisasi hanya boleh diisi setelah dampak dinilai.' },
  { key: 'dampakUraian', label: 'Uraian Dampak', type: 'textarea', required: true },
  { key: 'dept', label: 'Unit Kerja Terdampak', type: 'multiselect', options: (c) => c.master.unitKerja, required: true },
  { key: 'pemenuhan', label: 'Pemenuhan (%)', type: 'percent', help: 'Kosong = belum dinilai.' },
  { key: 'kepatuhan', label: 'Status Kepatuhan', type: 'text', auto: (r) => kep(r) },
  { key: 'tindak', label: 'Tindak Lanjut', type: 'textarea', required: (r) => kep(r) === 'Partial' || kep(r) === 'Gap', wide: true, help: 'Wajib bila Status Kepatuhan Partial atau Gap.' },
  { key: 'perluJawab', label: 'Perlu Dijawab ke Regulator?', type: 'yesno', required: (r) => r.jp === 'Imbauan' },
  { key: 'jawabBatas', label: 'Batas Waktu Jawaban', type: 'date', required: (r) => r.perluJawab === 'Ya', showIf: (r) => r.perluJawab === 'Ya' },
  { key: 'jawabTgl', label: 'Tanggal Dijawab', type: 'date', showIf: (r) => r.perluJawab === 'Ya' },
  { key: 'tglSosialisasi', label: 'Tanggal Sosialisasi Internal', type: 'date', required: true },
  { key: 'sopList', label: 'SOP / Kebijakan yang Harus Diperbarui', type: 'multidrop', wide: true, options: () => readModule<SopRec>('sop', seedSop).map(sopLabel), help: 'Opsional. Pilih satu atau lebih SOP dari daftar SOP; hapus dari daftar bila sudah diperbarui.' },
  { key: 'lampiran', label: 'Lampiran / Bukti', type: 'file', required: true },
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

const filters: FilterDef<Reg>[] = [
  { key: 'periode', label: 'Periode (Tanggal Dicatat)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglDicatat >= a) && (!b || r.tglDicatat <= b) } },
  { key: 'regulator', label: 'Regulator', type: 'select', options: REGULATOR, match: (r, v) => regB(r) === v },
  { key: 'jp', label: 'Jenis Perubahan', type: 'select', options: JP, match: (r, v) => r.jp === v },
  { key: 'kepatuhan', label: 'Status Kepatuhan', type: 'select', options: KEP, match: (r, v) => kep(r) === v },
  { key: 'dept', label: 'Unit Kerja Terdampak', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.dept.includes(v as string) },
  { key: 'status', label: 'Status Peraturan', type: 'select', options: [...STATUS, 'Dibatalkan'], match: (r, v) => r.status === v },
]

// ---- Alert ----
const mk = (c: Ctx, o: Partial<Reg>): Reg => ({
  id: 'sample', no: 99, status: 'Berlaku', createdAt: c.today, createdBy: '-', jenis: 'PBI', nomor: '99', tahun: '2026', regulator: 'BI', tentang: 'Contoh peraturan', kategori: 'QRIS', jp: 'Baru',
  tglTerbit: addDays(c.today, -20), tglBerlaku: addDays(c.today, 30), tglDicatat: addDays(c.today, -20), diubah: '', dampak: '', dampakUraian: '', dept: ['Compliance Legal & Risk Management'], pemenuhan: '',
  tindak: '', perluJawab: 'Tidak', jawabBatas: '', jawabTgl: '', tglSosialisasi: '', sopList: [], lampiran: null, ...o,
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
    key: 'effective', label: 'Akan berlaku, kepatuhan belum Comply', rule: 'Status Kepatuhan bukan Comply (Pemenuhan di bawah 100% atau belum dinilai) pada H-90, 60, 30, dan 7 sebelum Tanggal Berlaku. Kuning, merah saat H-7.',
    check: (r, c) => { const x = mile(r, c.today); return x && kep(r) !== 'Comply' ? { color: x.m === 7 ? 'red' : 'yellow', detail: `Berlaku ${x.d} hari lagi (tahap H-${x.m}), status kepatuhan ${kep(r)}`, to: ['PIC unit terdampak', 'Head CLRM'] } : null },
    sample: (c) => mk(c, { tglBerlaku: addDays(c.today, 28), pemenuhan: 50, tindak: 'Penyesuaian sistem' }),
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
    key: 'sop', label: 'Dicabut, SOP terkait perlu ditinjau', rule: 'Status Peraturan Dicabut, Tanggal Berlaku (pencabutan) sudah lewat, dan daftar SOP / Kebijakan yang Harus Diperbarui masih berisi. Hapus SOP dari daftar bila sudah diperbarui.',
    check: (r, c) => (r.status === 'Dicabut' && r.tglBerlaku && r.tglBerlaku < c.today && r.sopList.length ? { color: 'yellow', detail: `${r.sopList.length} SOP terkait sejak pencabutan ${fmtDate(r.tglBerlaku)}`, to: ['PIC unit terdampak', 'Compliance Officer'] } : null),
    sample: (c) => mk(c, { jp: 'Pencabutan', status: 'Dicabut', tglBerlaku: addDays(c.today, -15), sopList: [sopLabel(seedSop(c.today)[3])] }),
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
  type S = [string, string, string, string, string, string, string, string, number, number | null, number, number | null, string, number | '', string[], string, number | null, number | null, number | null, string[], boolean[]?]
  // [jenis, nomor, tahun, regulator, tentang, kategori, jp, status, terbit, berlaku, dicatat, diubah(idx 1-based)|null, dampak, pemenuhan, tindak (uraian saja), perluJawab, jawabBatas, jawabTgl, sosialisasi, dept, sopDone]
  const D = 'Dampak penyesuaian proses dan sistem'
  const rows: S[] = [
    ['PBI', '23/2025', '2025', 'BI', 'Pemrosesan transaksi pembayaran', 'QRIS', 'Baru', 'Diubah', -350, -320, -340, null, 'Sedang', 100, [], 'Tidak', null, null, -330, ['Operation', 'Information Technology']],
    ['PADG', '14/2025', '2025', 'BI', 'Perubahan standar QRIS', 'QRIS', 'Perubahan', 'Berlaku', -300, -270, -290, 1, 'Sedang', 100, [], 'Tidak', null, null, -280, ['Business', 'Information Technology'], [true]],
    ['UU', '4/2025', '2025', 'Pemerintah-DPR', 'Pelindungan data konsumen sektor keuangan', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -280, -240, -270, null, 'Tinggi', 85, ['Revisi kebijakan privasi', 'Pelatihan staf'], 'Tidak', null, null, -250, ['Compliance Legal & Risk Management', 'Support']],
    ['Peraturan BSSN', '2/2025', '2025', 'BSSN', 'Standar ketahanan siber penyelenggara', 'Ketahanan Siber', 'Baru', 'Berlaku', -250, -200, -240, null, 'Tinggi', 40, ['Uji penetrasi tahunan', 'Pemantauan SOC 24 jam'], 'Tidak', null, null, -215, ['Information Technology', 'Operation']],
    ['Surat Edaran', '3/2025', '2025', 'PPATK', 'Pelaporan transaksi mencurigakan', 'APU PPT', 'Baru', 'Berlaku', -230, -190, -220, null, 'Sedang', 75, ['Perbarui parameter pemantauan'], 'Tidak', null, null, -200, ['Compliance Legal & Risk Management', 'Finance, Accounting, Tax & Treasury']],
    ['Permen', '8/2025', '2025', 'Komdigi', 'Penyelenggaraan sistem elektronik', 'Ketahanan Siber', 'Baru', 'Berlaku', -210, -180, -200, null, 'Rendah', 100, [], 'Tidak', null, null, -190, ['Information Technology']],
    ['PBI', '9/2025', '2025', 'BI', 'Perlindungan konsumen sistem pembayaran', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -190, -150, -180, null, 'Sedang', 90, ['Standar penanganan keluhan'], 'Tidak', null, null, -160, ['Support', 'Operation']],
    ['PADG', '21/2025', '2025', 'BI', 'Interkoneksi SNAP', 'SNAP', 'Baru', 'Berlaku', -170, -140, -160, null, 'Sedang', 100, [], 'Tidak', null, null, -150, ['Information Technology', 'Business']],
    ['Surat Imbauan', '12/2025', '2025', 'BI', 'Imbauan peningkatan mitigasi fraud QRIS', 'QRIS', 'Imbauan', 'Berlaku', -150, null, -140, null, 'Rendah', 100, [], 'Ya', -100, -105, -130, ['Operation']],
    ['PBI', '5/2026', '2026', 'BI', 'Pencabutan ketentuan uang elektronik lama', 'Lainnya', 'Pencabutan', 'Dicabut', -140, -100, -130, 1, 'Sedang', 60, ['Sesuaikan SOP terkait'], 'Tidak', null, null, -120, ['Operation', 'Finance, Accounting, Tax & Treasury'], [false]],
    ['UU', '1/2026', '2026', 'Pemerintah-DPR', 'Perubahan UU pelindungan konsumen', 'Pelindungan Konsumen', 'Perubahan', 'Berlaku', -120, -80, -110, 3, 'Tinggi', 70, ['Gap analysis kebijakan'], 'Tidak', null, null, -90, ['Compliance Legal & Risk Management', 'Support', 'Business'], [true, false]],
    ['Peraturan BSSN', '1/2026', '2026', 'BSSN', 'Pelaporan insiden siber', 'Ketahanan Siber', 'Perubahan', 'Berlaku', -100, -60, -95, 4, 'Sedang', 55, ['Prosedur pelaporan insiden'], 'Tidak', null, null, -70, ['Information Technology', 'Compliance Legal & Risk Management']],
    ['Surat Edaran', '7/2026', '2026', 'PPATK', 'Penerapan prinsip mengenali pengguna jasa', 'APU PPT', 'Perubahan', 'Berlaku', -85, -40, -80, 5, 'Sedang', 95, ['Perbarui formulir KYC'], 'Tidak', null, null, -50, ['Compliance Legal & Risk Management', 'Business']],
    ['PADG', '3/2026', '2026', 'BI', 'Biaya merchant discount rate QRIS', 'QRIS', 'Perubahan', 'Berlaku', -70, -30, -65, 2, 'Rendah', 100, [], 'Tidak', null, null, -40, ['Finance, Accounting, Tax & Treasury', 'Business']],
    ['Permen', '2/2026', '2026', 'Komdigi', 'Tata kelola data pribadi', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -60, -20, -55, null, 'Sedang', 100, [], 'Tidak', null, null, -30, ['Information Technology']],
    ['Surat Imbauan', '4/2026', '2026', 'BI', 'Imbauan pelaporan data merchant', 'QRIS', 'Imbauan', 'Berlaku', -50, null, -45, null, 'Rendah', '', [], 'Ya', 2, null, null, ['Business']],
    ['Surat Imbauan', '6/2026', '2026', 'PPATK', 'Imbauan peningkatan kualitas LTKM', 'APU PPT', 'Imbauan', 'Berlaku', -40, null, -35, null, 'Rendah', '', [], 'Ya', 6, null, null, ['Compliance Legal & Risk Management']],
    ['Surat Imbauan', '8/2026', '2026', 'BSSN', 'Imbauan kerentanan perangkat lunak', 'Ketahanan Siber', 'Imbauan', 'Berlaku', -30, null, -25, null, 'Rendah', '', [], 'Ya', -3, null, null, ['Information Technology']],
    ['PBI', '10/2026', '2026', 'BI', 'Penguatan tata kelola sistem pembayaran', 'SNAP', 'Baru', 'Berlaku', -12, 5, -10, null, 'Tinggi', 45, ['Pemetaan kontrol tata kelola'], 'Tidak', null, null, null, ['Operation', 'Information Technology']],
    ['PADG', '12/2026', '2026', 'BI', 'Pembatasan transaksi lintas negara', 'SNAP', 'Baru', 'Berlaku', -15, 25, -12, null, 'Sedang', 30, ['Penyesuaian aturan routing'], 'Tidak', null, null, null, ['Information Technology', 'Finance, Accounting, Tax & Treasury']],
    ['Surat Edaran', '9/2026', '2026', 'PPATK', 'Pelaporan transaksi tunai lintas batas', 'APU PPT', 'Baru', 'Berlaku', -8, 55, -7, null, 'Sedang', 50, ['Modul pelaporan LTKT'], 'Tidak', null, null, null, ['Compliance Legal & Risk Management', 'Finance, Accounting, Tax & Treasury']],
    ['UU', '5/2026', '2026', 'Pemerintah-DPR', 'Pengamanan transaksi elektronik', 'Ketahanan Siber', 'Baru', 'Berlaku', -6, 85, -5, null, 'Tinggi', 20, ['Asesmen kesiapan'], 'Tidak', null, null, null, ['Information Technology', 'Operation']],
    ['Permen', '9/2026', '2026', 'Komdigi', 'Ketentuan layanan finansial digital', 'Lainnya', 'Baru', 'Berlaku', -45, -35, -30, null, '', '', [], 'Tidak', null, null, null, ['Support']],
    ['Surat Edaran', '10/2026', '2026', 'Lainnya', 'Pedoman pelaporan keluhan konsumen', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -22, 20, -15, null, '', '', [], 'Tidak', null, null, null, ['Support']],
    ['PBI', '11/2026', '2026', 'BI', 'Pencabutan standar pembayaran lama', 'Lainnya', 'Pencabutan', 'Dicabut', -35, -12, -25, 9, 'Rendah', 80, ['Hapus rujukan standar lama'], 'Tidak', null, null, -18, ['Operation', 'Information Technology'], [false, false]],
    ['PADG', '15/2026', '2026', 'BI', 'Pembaruan interkoneksi QRIS', 'QRIS', 'Perubahan', 'Berlaku', -4, 14, -3, 8, 'Sedang', 50, ['Uji interkoneksi'], 'Tidak', null, null, null, ['Information Technology']],
    ['PBI', '12/2026', '2026', 'BI', 'Penguatan pengawasan penyelenggara jasa pembayaran', 'SNAP', 'Baru', 'Berlaku', -55, -20, -50, null, 'Rendah', 100, [], 'Tidak', null, null, -30, ['Operation']],
    ['Surat Edaran', '11/2026', '2026', 'PPATK', 'Pembaruan daftar pantauan transaksi', 'APU PPT', 'Perubahan', 'Berlaku', -20, 10, -18, 13, 'Sedang', 60, ['Perbarui daftar pantauan'], 'Tidak', null, null, -10, ['Compliance Legal & Risk Management']],
    ['Surat Imbauan', '9/2026', '2026', 'Komdigi', 'Imbauan keamanan aplikasi pembayaran', 'Ketahanan Siber', 'Imbauan', 'Berlaku', -18, null, -14, null, 'Rendah', 100, [], 'Ya', 9, null, -8, ['Information Technology']],
    ['Permen', '10/2026', '2026', 'Komdigi', 'Standar layanan pelindungan pengguna', 'Pelindungan Konsumen', 'Baru', 'Berlaku', -10, 40, -6, null, 'Sedang', 35, ['Gap analysis standar layanan'], 'Tidak', null, null, -3, ['Support', 'Business']],
  ]
  const ids = (n: number) => `regchange-${n}`
  return rows.map((x, i) => {
    const [jenis, nn, tahun, regulator, tentang, kategori, jp, status, terbit, berlaku, dicatat, diubah, dampak, pem, tindak, perlu, jb, jt, sos, dept, done] = x
    const [nomor] = nn.split('/')
    const sopList = jp === 'Perubahan' || jp === 'Pencabutan' ? (done ?? [false]).map((_, k) => sop[(i * 3 + k * 5) % sop.length]) : []
    return {
      id: ids(i + 1), no: i + 1, status, createdAt: addDays(today, dicatat), createdBy: 'Rina Kartika',
      jenis, nomor, tahun, regulator, tentang, kategori, jp,
      tglTerbit: addDays(today, terbit), tglBerlaku: berlaku === null ? '' : addDays(today, berlaku), tglDicatat: addDays(today, dicatat),
      diubah: diubah ? `${rows[diubah - 1][0]} ${rows[diubah - 1][1].split('/')[0]}/${rows[diubah - 1][2]}` : '',
      dampak, dampakUraian: dampak ? `${D}: ${tentang.toLowerCase()}.` : '', dept, pemenuhan: pem, tindak: tindak.join('; '),
      perluJawab: jp === 'Imbauan' ? perlu : '', jawabBatas: jb === null ? '' : addDays(today, jb), jawabTgl: jt === null ? '' : addDays(today, jt),
      tglSosialisasi: sos === null ? (dampak ? addDays(today, Math.min(0, dicatat + 5)) : '') : addDays(today, sos), sopList, lampiran: f(`${jenis.replace(/ /g, '')}-${nomor}-${tahun}.pdf`),
    }
  })
}

const cfg: PageConfig<Reg> = {
  module: 'regchange', title: 'Regulatory Change', noun: 'Peraturan', exportPrefix: 'Daftar_Peraturan',
  name: (r) => label(r),
  seed, fields, columns, filters, alerts, cancelStatus: 'Dibatalkan', guide: REGCHANGE_GUIDE,
  blank: () => ({
    status: 'Berlaku', jenis: '', nomor: '', tahun: '', regulator: '', tentang: '', kategori: '', jp: '', tglTerbit: '', tglBerlaku: '', tglDicatat: todayStr(), diubah: '',
    dampak: '', dampakUraian: '', dept: [], pemenuhan: '', tindak: '', perluJawab: '', jawabBatas: '', jawabTgl: '', tglSosialisasi: '', sopList: [], lampiran: null,
  }),
  search: (r) => `${r.no} ${label(r)} ${r.tentang} ${r.kategori}`, searchPlaceholder: 'Cari nama/nomor peraturan, tentang, kategori',
  canEditRow: (_r, c) => !isPic(c),
  approvals: [{ jenis: 'Perubahan Daftar Peraturan', approver: 'Ketua SMKI', needs: () => true, keys: IDENT }],
  validate: (r, _m, c) => {
    const e: Record<string, string> = {}
    if (r.tglBerlaku && r.tglTerbit && r.tglBerlaku < r.tglTerbit) e.tglBerlaku = 'Tanggal Berlaku tidak boleh sebelum Tanggal Terbit'
    if (r.diubah && r.diubah === label(r)) e.diubah = 'Tidak boleh memilih peraturan itu sendiri'
    const dup = (c.all('regchange') as Reg[]).find((x) => x.id !== r.id && !x.cancelled && label(x).toLowerCase() === label(r).toLowerCase())
    if (r.jenis && r.nomor && r.tahun && dup) e.nomor = `${label(r)} sudah ada`
    if (r.perluJawab === 'Ya' && r.jawabTgl && r.jawabBatas && r.jawabTgl < r.tglDicatat) e.jawabTgl = 'Tanggal Dijawab tidak boleh sebelum Tanggal Dicatat'
    return e
  },
  dashDate: { get: (r) => r.tglDicatat, label: 'Tanggal Dicatat' },
  Dashboard: ({ rows, allRows, c, drill, open }) => {
    const n = (k: string) => rows.filter((r) => kep(r) === k).length
    const rg = useMonthRange('12') // filter bulan kartu Tren, independen dari filter halaman
    const mons = rg.months(allRows.map((r) => monthKey(r.tglDicatat)))
    const rated = rows.filter((r) => r.pemenuhan !== '')
    const edges = [10, 20]
    const un = rows.filter(unrated)
    const age = (r: Reg) => diffDays(c.today, r.tglDicatat)
    const gapByDept = c.master.unitKerja.map((d) => ({ name: d, Partial: rows.filter((r) => r.dept.includes(d) && kep(r) === 'Partial').length, Gap: rows.filter((r) => r.dept.includes(d) && kep(r) === 'Gap').length }))
    const soon = rows.filter((r) => r.tglBerlaku && r.tglBerlaku >= c.today && diffDays(r.tglBerlaku, c.today) <= 90).map((r) => ({ r, tgl: r.tglBerlaku, jenis: 'Berlaku', d: diffDays(r.tglBerlaku, c.today) }))
    const reply = rows.filter(needReply).map((r) => ({ r, tgl: r.jawabBatas, jenis: 'Imbauan', d: diffDays(r.jawabBatas, c.today) }))
    const agenda = [...soon, ...reply].sort((a, b) => a.tgl.localeCompare(b.tgl))
    const warn = (x: { d: number; jenis: string }) => (x.d <= (x.jenis === 'Berlaku' ? 7 : 1) ? 'red' : 'yellow') as 'red' | 'yellow'
    return (
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Peraturan per regulator dan jenis perubahan" info={INFO.regulator} stacked data={REGULATOR.map((g) => ({ name: g, ...Object.fromEntries(JP.map((j) => [j, rows.filter((r) => regB(r) === g && r.jp === j).length])) }))} keys={JP} colors={['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']} onClick={(row) => drill({ regulator: row.name })} />
          <LineCard title="Tren peraturan baru dan perubahan per bulan" info={INFO.tren} toolbar={rg.toolbar} data={mons.map((m) => ({ name: m, Baru: allRows.filter((r) => r.tglDicatat.startsWith(m) && r.jp === 'Baru').length, Perubahan: allRows.filter((r) => r.tglDicatat.startsWith(m) && r.jp === 'Perubahan').length }))} keys={['Baru', 'Perubahan']} colors={['#3b82f6', '#f59e0b']} />
          <DonutCard title="Status kepatuhan" info={INFO.kepatuhan} data={KEP.map((k) => ({ name: k, value: n(k), color: KEP_COLOR[k] }))} onClick={(name) => drill({ kepatuhan: name })} />
          <BarCard title="Rata-rata pemenuhan per kategori (%)" info={INFO.pemenuhan} data={c.master.kategoriRegulasi.map((k) => { const x = rated.filter((r) => r.kategori === k); const sum = x.reduce((a, r) => a + Number(r.pemenuhan), 0); return { name: k, Pemenuhan: x.length ? Math.round(sum / x.length) : 0 } })} keys={['Pemenuhan']}
            tip={(d) => <><div className="mb-1 font-semibold text-slate-800">{String(d.name)}</div><div>Rata-rata pemenuhan: {d.Pemenuhan}%</div></>} />
          <div className="space-y-3">
            <BarCard title="Belum dinilai menurut lama sejak dicatat (hari)" info={INFO.umur} data={ageBuckets(edges).map((b) => ({ name: b, Jumlah: un.filter((r) => ageBucket(age(r), edges) === b).length }))} keys={['Jumlah']} colors={['#f59e0b']} catLabel="Hari" />
            <MiniTable title="Peraturan belum dinilai" info={INFO.belum} rows={un} onRow={(r) => open(r.id)} empty="Semua sudah dinilai"
              cols={[{ label: 'No', get: (r) => r.no }, { label: 'Peraturan', get: label }, { label: 'Dicatat', get: (r) => fmtDate(r.tglDicatat) }, { label: 'Umur (hari)', get: (r) => age(r) }]} />
          </div>
          <BarCard title="Peraturan Partial dan Gap per unit kerja terdampak" info={INFO.unit} horizontal stacked data={gapByDept} keys={['Partial', 'Gap']} colors={{ Partial: KEP_COLOR.Partial, Gap: KEP_COLOR.Gap }} onClick={(row) => drill({ dept: row.name })} />
        </div>
        <MiniTable title="Berlaku dalam 90 hari dan imbauan perlu dijawab" info={INFO.agenda} rows={agenda} onRow={(x) => open(x.r.id)} empty="Tidak ada agenda"
          cols={[
            { label: 'No', get: () => '' }, { label: 'Tanggal', get: (x) => fmtDate(x.tgl) }, { label: 'Jenis', get: (x) => x.jenis }, { label: 'Peraturan', get: (x) => label(x.r) }, { label: 'Tentang', get: (x) => x.r.tentang },
            { label: 'Sisa waktu', get: (x) => <StatusPill s={x.d < 0 ? `Lewat ${-x.d} hari` : `${x.d} hari lagi`} tone={warn(x)} /> },
          ]} />
      </div>
    )
  },
}
export default function RegChange() { return <PageShell config={cfg} /> }
