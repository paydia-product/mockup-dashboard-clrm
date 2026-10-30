import { addDays, diffDays, fmtDate, todayStr } from '../lib'
import PageShell from '../kit/PageShell'
import { sameName } from '../kit/perms'
import { DonutCard, MiniTable, StatCards } from '../kit/charts'
import { StatusPill } from '../kit/fmt'
import { Badge } from '../ui'
import type { Tone } from '../ui'
import type { AlertDef, BaseRec, Column, Ctx, Field, FileMeta, FilterDef, PageConfig } from '../kit/types'

interface VersiLama { versi: number; tglBerlaku: string; tglKedaluwarsa: string; file: string }
interface Izin extends BaseRec {
  kategori: string; nama: string; nomor: string; penerbit: string
  tglTerbit: string; tglBerlaku: string; tglKedaluwarsa: string; tglReview: string
  kewajiban: string; pic: string; versi: number | ''; file: FileMeta | null
  perpanjang: string; versiLama: VersiLama[]
}
const KAT = ['Akta + SK', 'Izin', 'Legalitas Lainnya']
const STATUS = ['Aktif', 'Dalam Perpanjangan', 'Kedaluwarsa']
const SOON180 = '180 hari atau kurang'
const GRUP = ['Kedaluwarsa', '90 hari atau kurang', '91 sampai 180 hari', 'Lebih dari 180 hari']
const LIVE = (r: Izin) => r.status !== 'Tidak Berlaku' && !r.cancelled
const sisa = (r: Izin, today: string) => (r.tglKedaluwarsa ? diffDays(r.tglKedaluwarsa, today) : null)
const sisaTone = (d: number | null): Tone => (d === null ? 'gray' : d <= 90 ? 'red' : d <= 180 ? 'yellow' : 'green')
const SisaBadge = ({ r, today }: { r: Izin; today: string }) => {
  const d = sisa(r, today)
  return d === null ? <span className="text-slate-300">-</span> : <Badge tone={sisaTone(d)}>{d < 0 ? `Lewat ${-d} hari` : `${d} hari`}</Badge>
}
const grup = (r: Izin, today: string) => {
  const d = sisa(r, today)
  return d === null ? '' : d < 0 ? GRUP[0] : d <= 90 ? GRUP[1] : d <= 180 ? GRUP[2] : GRUP[3]
}

const fields: Field<Izin>[] = [
  { key: 'kategori', label: 'Kategori Dokumen', type: 'select', options: KAT, required: true },
  { key: 'nama', label: 'Nama Dokumen', type: 'text', required: true, help: 'Mis. Izin QRIS, Izin Transfer Dana.' },
  { key: 'nomor', label: 'Nomor Dokumen', type: 'text', required: true },
  { key: 'penerbit', label: 'Penerbit', type: 'text', required: true },
  { key: 'tglTerbit', label: 'Tanggal Terbit', type: 'date', required: true },
  { key: 'tglBerlaku', label: 'Tanggal Berlaku', type: 'date', required: true },
  { key: 'tglKedaluwarsa', label: 'Tanggal Kedaluwarsa', type: 'date', required: true },
  { key: 'tglReview', label: 'Tanggal Review', type: 'date', help: 'Opsional.' },
  { key: 'kewajiban', label: 'Kewajiban Pelaporan terkait Izin', type: 'textarea', wide: true, help: 'Teks bebas (tidak ada master Daftar Laporan).' },
  { key: 'pic', label: 'PIC', type: 'select', options: (c) => c.master.pic, required: true },
  { key: 'status', label: 'Status', type: 'select', options: STATUS, required: true, help: 'Kedaluwarsa terisi otomatis bila tanggal kedaluwarsa terlewat dan belum diperpanjang.' },
  { key: 'versi', label: 'Nomor Versi', type: 'number', required: true },
  { key: 'perpanjang', label: 'Perpanjang izin', type: 'yesno', inForm: 'edit', noImport: true, noExport: true, help: 'Pilih Ya untuk memperpanjang: isi tanggal berlaku/kedaluwarsa dan nomor versi baru. Versi lama disimpan.' },
  { key: 'file', label: 'File Dokumen', type: 'file', required: true },
  { key: 'versiLama', label: 'Versi Sebelumnya', type: 'list', inForm: 'none', noImport: true, wide: true, sub: [
    { key: 'versi', label: 'Versi', type: 'number' },
    { key: 'tglBerlaku', label: 'Tanggal Berlaku', type: 'date' },
    { key: 'tglKedaluwarsa', label: 'Tanggal Kedaluwarsa', type: 'date' },
    { key: 'file', label: 'File', type: 'text' },
  ] },
  { key: 'dataPribadi', label: 'Data Pribadi Direksi & Komisaris', type: 'text', inForm: 'none', noImport: true, auto: () => 'Disimpan terpisah, tidak dimasukkan ke dashboard' },
]

const columns: Column<Izin>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Kategori', get: (r) => r.kategori },
  { label: 'Nama Dokumen', get: (r) => r.nama },
  { label: 'Nomor Dokumen', get: (r) => r.nomor },
  { label: 'Penerbit', get: (r) => r.penerbit },
  { label: 'Kedaluwarsa', get: (r) => r.tglKedaluwarsa, render: (r) => fmtDate(r.tglKedaluwarsa) || '-' },
  { label: 'Sisa Hari', get: (r, c) => sisa(r, c.today) ?? '', render: (r, c) => <SisaBadge r={r} today={c.today} /> },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'Versi', get: (r) => r.versi },
]
const uniq = (rows: Izin[], g: (r: Izin) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Izin>[] = [
  { key: 'kategori', label: 'Kategori', type: 'select', options: KAT, match: (r, v) => r.kategori === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS, 'Tidak Berlaku'], match: (r, v) => r.status === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => uniq(rows, (r) => r.pic), match: (r, v) => r.pic === v },
  { key: 'masa', label: 'Kelompok Masa Berlaku', type: 'select', options: [SOON180, ...GRUP], match: (r, v) => (v === SOON180 ? [GRUP[1], GRUP[2]].includes(grup(r, todayStr())) : grup(r, todayStr()) === v) },
]

const mk = (c: Ctx, o: Partial<Izin>): Izin => ({
  id: 'sample', no: 99, status: 'Aktif', createdAt: c.today, createdBy: '-', kategori: 'Izin', nama: 'Izin QRIS', nomor: 'PJSP/0001/2024', penerbit: 'Bank Indonesia',
  tglTerbit: addDays(c.today, -700), tglBerlaku: addDays(c.today, -700), tglKedaluwarsa: addDays(c.today, 150), tglReview: '', kewajiban: '', pic: 'Regie',
  versi: 1, file: null, perpanjang: '', versiLama: [], ...o,
})
const alerts: AlertDef<Izin>[] = [
  {
    key: 'akan', label: 'Izin akan kedaluwarsa', rule: 'Kuning bila sisa 180 hari atau kurang; merah bila 90 hari atau kurang.',
    check: (r, c) => {
      const d = sisa(r, c.today)
      if (!LIVE(r) || d === null || d < 0 || d > 180 || r.status === 'Kedaluwarsa') return null
      return { color: d <= 90 ? 'red' : 'yellow', detail: `Kedaluwarsa ${d} hari lagi (${fmtDate(r.tglKedaluwarsa)})`, to: ['Legal Officer', 'Head CLRM'] }
    },
    sample: (c) => mk(c, { tglKedaluwarsa: addDays(c.today, 75) }),
  },
  {
    key: 'lewat', label: 'Izin kedaluwarsa belum diperpanjang', rule: 'Tanggal kedaluwarsa terlewat dan status belum Dalam Perpanjangan.',
    check: (r, c) => {
      const d = sisa(r, c.today)
      return LIVE(r) && d !== null && d < 0 && r.status !== 'Dalam Perpanjangan' ? { color: 'red', detail: `Lewat ${-d} hari`, to: ['Legal Officer', 'Head CLRM', 'Direksi'] } : null
    },
    sample: (c) => mk(c, { tglKedaluwarsa: addDays(c.today, -20), status: 'Kedaluwarsa' }),
  },
]

function seed(today: string): Izin[] {
  const f = (n: string): FileMeta => ({ name: n, size: 240000, type: 'application/pdf' } as FileMeta)
  const PIC = ['Regie', 'Fakhri', 'Osama'] // master PIC
  // [kategori, nama, nomor, penerbit, sisaHari|null (null = berlaku lama, kedaluwarsa jauh), status, -, versiLama?]
  type S = [string, string, string, string, number | null, string, boolean?, number?]
  const sc: S[] = [
    ['Izin', 'Izin Penyelenggara Uang Elektronik', 'PJSP/0101/2023', 'Bank Indonesia', 40, 'Aktif'],
    ['Izin', 'Izin QRIS', 'PJSP/0102/2023', 'Bank Indonesia', 70, 'Aktif'],
    ['Izin', 'Izin Transfer Dana', 'PJSP/0103/2024', 'Bank Indonesia', 130, 'Aktif', false, 1],
    ['Izin', 'Izin Payment Gateway', 'PJSP/0104/2024', 'Bank Indonesia', 170, 'Aktif'],
    ['Izin', 'Izin Pengelolaan Dana Nasabah', 'PJSP/0105/2022', 'Bank Indonesia', 600, 'Aktif', false, 2],
    ['Izin', 'Izin Remitansi', 'PJSP/0106/2022', 'Bank Indonesia', 900, 'Aktif'],
    ['Izin', 'Izin Penyelenggara Agregator', 'PJSP/0107/2021', 'Bank Indonesia', -25, 'Kedaluwarsa'],
    ['Izin', 'Izin Kartu Prabayar', 'PJSP/0108/2021', 'Bank Indonesia', -60, 'Dalam Perpanjangan', false, 1],
    ['Izin', 'Izin Penyimpanan Data Offshore', 'KOMINFO/0109/2024', 'Kementerian Komunikasi dan Digital', null, 'Aktif', true],
    ['Izin', 'Tanda Daftar PSE', 'KOMINFO/0110/2023', 'Kementerian Komunikasi dan Digital', null, 'Aktif', true],
    ['Akta + SK', 'Akta Pendirian PT', 'AKTA/01/2018', 'Notaris Hendra Gunawan', null, 'Aktif'],
    ['Akta + SK', 'Akta Perubahan Anggaran Dasar', 'AKTA/22/2023', 'Notaris Hendra Gunawan', null, 'Aktif', false, 1],
    ['Akta + SK', 'SK Kemenkumham Pengesahan Badan Hukum', 'AHU-0012345.AH.01.01', 'Kemenkumham', null, 'Aktif'],
    ['Akta + SK', 'SK Perubahan Direksi', 'AHU-AH.01.09-0456', 'Kemenkumham', null, 'Aktif'],
    ['Legalitas Lainnya', 'NIB dan Perizinan Berusaha', 'NIB-8120001234567', 'OSS RBA', 365, 'Aktif'],
    ['Legalitas Lainnya', 'NPWP Perusahaan', '01.234.567.8-012.000', 'Direktorat Jenderal Pajak', null, 'Aktif'],
    ['Legalitas Lainnya', 'Sertifikat ISO 27001', 'ISO/27001/PAY/2024', 'TUV Rheinland', 110, 'Aktif'],
    ['Legalitas Lainnya', 'Sertifikat PCI DSS', 'PCI/DSS/PAY/2024', 'PCI Security Standards Council', 800, 'Aktif'],
  ]
  return sc.map(([kategori, nama, nomor, penerbit, s, status, , nLama], i) => {
    const exp = addDays(today, s ?? 3000 + i * 10) // semua dokumen wajib punya tiga tanggal
    const berlaku = s === null ? addDays(today, -400 - i * 10) : addDays(exp, -730)
    const versi = (nLama ?? 0) + 1
    return {
      id: `perizinan-${i + 1}`, no: i + 1, status, createdAt: addDays(today, -300 + i * 5), createdBy: 'Regie',
      kategori, nama, nomor, penerbit, tglTerbit: berlaku, tglBerlaku: berlaku, tglKedaluwarsa: exp,
      tglReview: i % 3 === 0 ? addDays(today, 30 + i) : '',
      kewajiban: kategori === 'Izin' ? 'Laporan berkala triwulanan ke regulator' : '',
      pic: PIC[i % 3], versi, file: f(`${nomor.replace(/[^A-Za-z0-9]/g, '_')}.pdf`), perpanjang: '',
      versiLama: Array.from({ length: nLama ?? 0 }, (_, k) => ({ versi: k + 1, tglBerlaku: addDays(berlaku, -730 * (nLama! - k)), tglKedaluwarsa: addDays(berlaku, -730 * (nLama! - k - 1)), file: `${nomor.replace(/[^A-Za-z0-9]/g, '_')}_v${k + 1}.pdf` })),
    }
  })
}

const cfg: PageConfig<Izin> = {
  module: 'perizinan', title: 'Perizinan & Dokumen Legalitas', noun: 'Dokumen', exportPrefix: 'Perizinan_Legalitas',
  name: (r) => r.nama,
  seed, fields, columns, filters,
  blank: () => ({ kategori: '', nama: '', nomor: '', penerbit: '', tglTerbit: '', tglBerlaku: '', tglKedaluwarsa: '', tglReview: '', kewajiban: '', pic: '', status: 'Aktif', versi: 1, file: null, perpanjang: '', versiLama: [] }),
  search: (r) => `${r.nama} ${r.nomor} ${r.penerbit}`, searchPlaceholder: 'Cari nama dokumen, nomor, penerbit',
  alerts, cancelStatus: 'Tidak Berlaku',
  canEditRow: (r, c) => r.status !== 'Tidak Berlaku' && (c.role !== 'PIC' || sameName(r.pic, c.user.name)),
  normalize: (r, c) => (LIVE(r) && r.status === 'Aktif' && r.tglKedaluwarsa && r.tglKedaluwarsa < c.today ? { ...r, status: 'Kedaluwarsa' } : r),
  beforeSave: (old, next) => {
    if (!old || next.perpanjang !== 'Ya') return { ...next, perpanjang: '' }
    const lama: VersiLama = { versi: Number(old.versi), tglBerlaku: old.tglBerlaku, tglKedaluwarsa: old.tglKedaluwarsa, file: old.file?.name ?? '' }
    return { ...next, perpanjang: '', status: 'Aktif', versiLama: [...(old.versiLama ?? []), lama] }
  },
  validate: (r, mode, c) => {
    const e: Record<string, string> = {}
    if (r.tglBerlaku && r.tglKedaluwarsa && r.tglKedaluwarsa < r.tglBerlaku) e.tglKedaluwarsa = 'Tanggal Kedaluwarsa tidak boleh sebelum Tanggal Berlaku'
    if (mode === 'edit' && r.perpanjang === 'Ya') {
      if (!r.tglBerlaku) e.tglBerlaku = 'Isi tanggal berlaku baru untuk perpanjangan'
      const old = (c.all('perizinan') as Izin[]).find((x) => x.id === r.id)
      if (old && r.tglKedaluwarsa === old.tglKedaluwarsa) e.tglKedaluwarsa = 'Perpanjangan: Tanggal Kedaluwarsa harus berbeda dari yang lama'
      if (old && Number(r.versi) === Number(old.versi)) e.versi = 'Perpanjangan: Nomor Versi harus versi baru'
    }
    return e
  },
  dashDate: { get: (r) => r.tglTerbit, label: 'Tanggal Terbit' },
  Dashboard: ({ rows, c, open, drill }) => {
    const live = rows.filter(LIVE)
    const withExp = live.filter((r) => r.tglKedaluwarsa)
    const soon = live.filter((r) => { const d = sisa(r, c.today); return d !== null && d >= 0 && d <= 180 && r.status !== 'Kedaluwarsa' })
    const red = soon.filter((r) => sisa(r, c.today)! <= 90).length
    const list = [...withExp].sort((a, b) => a.tglKedaluwarsa.localeCompare(b.tglKedaluwarsa))
    return (
      <div className="space-y-3">
        <StatCards items={[{ label: 'Izin kedaluwarsa dalam 180 hari', value: soon.length, tone: red ? 'red' : soon.length ? 'yellow' : 'gray', onClick: () => drill({ masa: SOON180 }) }]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <DonutCard title="Dokumen per kategori" data={KAT.map((k) => ({ name: k, value: live.filter((r) => r.kategori === k).length }))} onClick={(name) => drill({ kategori: name })} />
          <MiniTable<Izin> title="Daftar izin dan tanggal kedaluwarsa" rows={list} onRow={(r) => open(r.id)} cols={[
            { label: 'Nama', get: (r) => r.nama },
            { label: 'Kategori', get: (r) => r.kategori },
            { label: 'Kedaluwarsa', get: (r) => fmtDate(r.tglKedaluwarsa) },
            { label: 'Sisa hari', get: (r) => <SisaBadge r={r} today={c.today} /> },
          ]} />
        </div>
      </div>
    )
  },
}
export default function Perizinan() { return <PageShell config={cfg} /> }
