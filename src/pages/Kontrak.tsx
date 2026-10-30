import { addDays, diffDays, fmtDate, todayStr } from '../lib'
import { showLainnya } from '../kit/Lainnya'
import { monthKey } from '../kit/dates'
import { sameName } from '../kit/perms'
import PageShell from '../kit/PageShell'
import { KontrakGuide } from '../guides/kontrak'
import { BarCard, LineCard, MiniTable, StatCards, useMonthRange } from '../kit/charts'
import { StatusPill } from '../kit/fmt'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'

interface Kontrak extends BaseRec {
  jenisHubungan: string; mitra: string; merchant: string; nomor: string; jenisDok: string; mulai: string; berakhir: string
  perpanjangan: string; lamaBulan: number | ''; bidang: string; pic: string; dept: string; induk: string
  kelengkapan: Record<string, boolean>; file: { name: string; size: number; type: string } | null
}
const HUBUNGAN = ['Merchant', 'Partner-Vendor', 'Paybuddy', 'NDA', 'Lainnya']
const JENIS_DOK = ['PKS QRIS', 'Biller Gateway', 'Account Linkage', 'Payout', 'Program Peningkatan Transaksi', 'NDA', 'Amandemen', 'Lainnya']
const PERPANJANGAN = ['Otomatis', 'Manual', 'Sampai Diputus', 'Tidak Diperpanjang']
const STATUS = ['Draft', 'Review', 'Aktif', 'Akan Berakhir', 'Expired', 'Diperpanjang', 'Berakhir']
const BIDANG = ['F&B', 'Retail', 'Jasa', 'Pendidikan', 'Lainnya']
const isMerchant = (r: Kontrak) => r.jenisHubungan === 'Merchant'
const nm = (r: Kontrak) => (isMerchant(r) ? r.merchant : r.mitra) // Merchant = teks bebas; selain itu = master Mitra Vendor
const LIVE = (r: Kontrak) => r.status === 'Aktif' || r.status === 'Akan Berakhir'
const G = { d30: '≤30 hari', d60: '30–60 hari', d90: '60–90 hari', over: '>90 hari', exp: 'Expired', empty: 'Kosong' }
const GROUPS = [G.d30, G.d60, G.d90, G.over, G.exp, G.empty]

const sisa = (r: Kontrak, today: string) => (r.berakhir ? diffDays(r.berakhir, today) : null)
// Kelompok masa berlaku: hanya kontrak berjalan (Aktif / Akan Berakhir), ditambah Expired dan Kosong.
const grup = (r: Kontrak, today: string) => {
  if (!r.berakhir) return r.status === 'Berakhir' || r.status === 'Dibatalkan' || r.cancelled ? '' : G.empty // sama dengan alert "Tanggal berakhir kosong"
  if (r.status === 'Expired') return G.exp
  if (!LIVE(r)) return ''
  const s = sisa(r, today)!
  return s <= 30 ? G.d30 : s <= 60 ? G.d60 : s <= 90 ? G.d90 : G.over
}
const others = (c: Ctx) => c.all('kontrak') as Kontrak[]
const notPic = (c: Ctx) => c.role !== 'PIC' // PIC hanya boleh ubah status, tanggal berakhir, perpanjangan
const isAmd = (r: Kontrak) => r.jenisDok === 'Amandemen'
const needsLama = (r: Kontrak) => r.perpanjangan === 'Otomatis' || r.perpanjangan === 'Manual'

const fields: Field<Kontrak>[] = [
  { key: 'jenisHubungan', label: 'Jenis Hubungan', type: 'select', options: HUBUNGAN, required: true, editableBy: notPic },
  { key: 'mitra', label: 'Nama Mitra', type: 'select', options: (c) => c.master.mitra, required: true, editableBy: notPic, showIf: (r) => !!r.jenisHubungan && !isMerchant(r) },
  { key: 'merchant', label: 'Nama Merchant', type: 'text', required: true, editableBy: notPic, showIf: (r) => !!r.jenisHubungan && isMerchant(r) },
  { key: 'nomor', label: 'Nomor PKS / NDA', type: 'text', required: true, editableBy: notPic, help: 'Harus unik.' },
  { key: 'jenisDok', label: 'Jenis Dokumen', type: 'select', options: JENIS_DOK, required: true, editableBy: notPic },
  { key: 'mulai', label: 'Tanggal Mulai', type: 'date', required: true, editableBy: notPic },
  { key: 'berakhir', label: 'Tanggal Berakhir', type: 'date', help: 'Boleh kosong (masuk kartu "Kontrak Tanggal Berakhir Kosong").' },
  { key: 'perpanjangan', label: 'Perpanjangan', type: 'select', options: PERPANJANGAN, required: true },
  { key: 'lamaBulan', label: 'Lama Perpanjangan (bulan)', type: 'number', required: needsLama, showIf: needsLama },
  { key: 'status', label: 'Status', type: 'select', options: STATUS, required: true, help: 'Aktif otomatis menjadi Akan Berakhir (≤90 hari) atau Expired menurut Tanggal Berakhir.' },
  { key: 'bidang', label: 'Bidang Usaha', type: 'select', options: BIDANG, editableBy: notPic },
  { key: 'pic', label: 'PIC', type: 'select', options: (c) => c.master.pic, required: (r) => !r.dept, editableBy: notPic, help: 'Isi PIC atau Unit Pemilik, salah satu wajib.' },
  { key: 'dept', label: 'Unit Pemilik (Unit Kerja)', type: 'select', options: (c) => c.master.unitKerja, required: (r) => !r.pic, editableBy: notPic },
  {
    key: 'induk', label: 'Dokumen Induk', type: 'select', required: isAmd, editableBy: notPic, help: 'Wajib untuk Amandemen.',
    options: (c) => others(c).filter((k) => !k.cancelled && k.jenisDok !== 'Amandemen').map((k) => k.nomor),
  },
  { key: 'kelengkapan', label: 'Kelengkapan', type: 'checklist', sub: [{ key: 'hardcopy', label: 'Hardcopy diterima', type: 'yesno' }, { key: 'ttd', label: 'Tanda tangan lengkap', type: 'yesno' }], editableBy: notPic },
  { key: 'file', label: 'File Perjanjian', type: 'file', required: true, editableBy: notPic },
  { key: 'sisaHari', label: 'Sisa Hari', type: 'number', auto: (r, c) => sisa(r, c.today) ?? '' },
]

const columns: Column<Kontrak>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Jenis Hubungan', get: (r) => r.jenisHubungan },
  { label: 'Mitra / Merchant', get: nm },
  { label: 'Nomor PKS / NDA', get: (r) => r.nomor },
  { label: 'Jenis Dokumen', get: (r) => r.jenisDok },
  { label: 'Mulai', get: (r) => r.mulai, render: (r) => fmtDate(r.mulai) },
  { label: 'Berakhir', get: (r) => r.berakhir, render: (r) => (r.berakhir ? fmtDate(r.berakhir) : '-') },
  { label: 'Sisa hari', get: (r, c) => sisa(r, c.today) ?? '-' },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
]

const uniq = (rows: Kontrak[], g: (r: Kontrak) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const picOf = (r: Kontrak) => r.pic || r.dept
const filters: FilterDef<Kontrak>[] = [
  { key: 'periode', label: 'Periode (Tanggal Mulai)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.mulai >= a) && (!b || r.mulai <= b) } },
  { key: 'jenisHubungan', label: 'Jenis Hubungan', type: 'select', options: HUBUNGAN, match: (r, v) => showLainnya(r.jenisHubungan, HUBUNGAN) === v },
  { key: 'jenisDok', label: 'Jenis Dokumen', type: 'select', options: JENIS_DOK, match: (r, v) => showLainnya(r.jenisDok, JENIS_DOK) === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS, 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'pic', label: 'PIC / Unit', type: 'select', options: (rows) => uniq(rows, picOf), match: (r, v) => picOf(r) === v },
  { key: 'bidang', label: 'Bidang Usaha', type: 'select', options: BIDANG, match: (r, v) => showLainnya(r.bidang, BIDANG) === v },
  { key: 'kelompok', label: 'Kelompok masa berlaku', type: 'select', options: GROUPS, match: (r, v) => grup(r, todayStr()) === v },
]

const toPic = (r: Kontrak) => (r.pic ? `PIC (${r.pic})` : 'PIC')
const mk = (c: Ctx, o: Partial<Kontrak>): Kontrak => ({
  id: 'sample', no: 99, status: 'Aktif', createdAt: c.today, createdBy: '-', jenisHubungan: 'Merchant', mitra: '', merchant: 'Kopi Senja', nomor: 'PKS/CLRM/099/2026', jenisDok: 'PKS QRIS',
  mulai: addDays(c.today, -300), berakhir: addDays(c.today, 60), perpanjangan: 'Manual', lamaBulan: 12, bidang: 'F&B', pic: 'Regie', dept: '', induk: '',
  kelengkapan: { hardcopy: true, ttd: true }, file: { name: 'PKS-099.pdf', size: 120000, type: 'application/pdf' }, ...o,
})
const alerts: AlertDef<Kontrak>[] = [
  {
    key: 'hmin', label: 'Kontrak hampir berakhir', rule: 'Pengingat H-90, H-60, H-30, H-7 sebelum Tanggal Berakhir. Kuning, merah mulai ≤30 hari.',
    check: (r, c) => {
      const s = sisa(r, c.today)
      if (!LIVE(r) || s === null || s < 0 || s > 90) return null
      return { color: s <= 30 ? 'red' : 'yellow', detail: `Berakhir ${s} hari lagi (${fmtDate(r.berakhir)})`, to: ['Legal Officer', toPic(r)] }
    },
    sample: (c) => mk(c, { berakhir: addDays(c.today, 25), status: 'Akan Berakhir' }),
  },
  {
    key: 'expired', label: 'Kontrak expired belum diperpanjang', rule: 'Tanggal Berakhir terlewat dan kontrak belum diperpanjang. Merah.',
    check: (r, c) => {
      const s = sisa(r, c.today)
      const lewat = r.status === 'Expired' || (LIVE(r) && s !== null && s < 0)
      return lewat ? { color: 'red', detail: `Expired ${s !== null ? Math.abs(s) : '?'} hari lalu`, to: ['Legal Officer', 'Head CLRM'] } : null
    },
    sample: (c) => mk(c, { berakhir: addDays(c.today, -12), status: 'Expired' }),
  },
  {
    key: 'kosong', label: 'Tanggal berakhir kosong', rule: 'Tanggal Berakhir belum diisi. Kuning.',
    check: (r) => (!r.berakhir && r.status !== 'Berakhir' && r.status !== 'Dibatalkan' && !r.cancelled ? { color: 'yellow', detail: 'Tanggal Berakhir belum diisi', to: ['Legal Officer'] } : null),
    sample: (c) => mk(c, { berakhir: '', status: 'Aktif' }),
  },
]

function seed(today: string): Kontrak[] {
  const MERCH = ['Kopi Senja', 'Toko Maju Jaya', 'Bimbel Cerdas', 'Warung Nusantara', 'Apotek Sehat', 'Resto Padang Raya', 'Laundry Kilat', 'Sekolah Harapan', 'Minimarket 24', 'Salon Cantika'] // nama merchant (teks bebas, tidak harus ada di master)
  const VEND = ['PT Telkom Biller', 'Bank Mitra Utama', 'PT Logistik Cepat', 'PT Nusa Cloud', 'PT Data Prima', 'PT Mitra Bayar', 'PT Biller Nusantara', 'PT Arta Teknologi'] // semua ada di master Mitra Vendor
  const PICS = ['Regie', 'Fakhri', 'Osama', 'Regie'] // master PIC
  const DEPT = ['Business', 'Operation', 'Finance, Accounting, Tax & Treasury', 'Information Technology']
  // [hubungan, jenisDok, mulai (hari lalu), sisa hari (null = kosong), status, perpanjangan, indukIdx]
  type S = [string, string, number, number | null, string, string, number?]
  const sc: S[] = [
    ['Merchant', 'PKS QRIS', 400, 400, 'Aktif', 'Otomatis'], ['Merchant', 'PKS QRIS', 350, 250, 'Aktif', 'Manual'], ['Partner-Vendor', 'Biller Gateway', 500, 180, 'Aktif', 'Otomatis'],
    ['Merchant', 'Payout', 300, 130, 'Aktif', 'Manual'], ['Partner-Vendor', 'Account Linkage', 600, 95, 'Aktif', 'Sampai Diputus'], ['Merchant', 'PKS QRIS', 280, 200, 'Aktif', 'Otomatis'],
    ['Merchant', 'PKS QRIS', 330, 85, 'Akan Berakhir', 'Manual'], ['Partner-Vendor', 'Biller Gateway', 450, 70, 'Akan Berakhir', 'Otomatis'], ['Merchant', 'Program Peningkatan Transaksi', 200, 62, 'Akan Berakhir', 'Manual'],
    ['Merchant', 'PKS QRIS', 320, 55, 'Akan Berakhir', 'Manual'], ['Partner-Vendor', 'Payout', 380, 45, 'Akan Berakhir', 'Otomatis'], ['Paybuddy', 'Account Linkage', 360, 35, 'Akan Berakhir', 'Manual'],
    ['Merchant', 'PKS QRIS', 340, 28, 'Akan Berakhir', 'Manual'], ['NDA', 'NDA', 700, 15, 'Akan Berakhir', 'Tidak Diperpanjang'], ['Partner-Vendor', 'Biller Gateway', 355, 6, 'Akan Berakhir', 'Otomatis'],
    ['Merchant', 'PKS QRIS', 400, -20, 'Aktif', 'Manual'], ['Paybuddy', 'Payout', 500, -45, 'Expired', 'Manual'], ['Merchant', 'PKS QRIS', 420, -8, 'Expired', 'Tidak Diperpanjang'],
    ['Merchant', 'PKS QRIS', 100, null, 'Aktif', 'Sampai Diputus'], ['Partner-Vendor', 'Lainnya', 60, null, 'Review', 'Manual'],
    ['NDA', 'NDA', 90, 400, 'Aktif', 'Tidak Diperpanjang'], ['NDA', 'NDA', 150, 330, 'Aktif', 'Tidak Diperpanjang'], ['Lainnya', 'Lainnya', 40, 500, 'Aktif', 'Otomatis'],
    ['Merchant', 'PKS QRIS', 15, 350, 'Draft', 'Manual'], ['Partner-Vendor', 'Biller Gateway', 20, 700, 'Review', 'Otomatis'], ['Merchant', 'Program Peningkatan Transaksi', 520, -150, 'Berakhir', 'Tidak Diperpanjang'],
    ['Merchant', 'PKS QRIS', 700, 300, 'Diperpanjang', 'Otomatis'], ['Paybuddy', 'Account Linkage', 610, 220, 'Diperpanjang', 'Manual'], ['Merchant', 'PKS QRIS', 30, 360, 'Aktif', 'Otomatis'],
    ['Merchant', 'Amandemen', 120, 400, 'Aktif', 'Manual', 0], ['Partner-Vendor', 'Amandemen', 180, 170, 'Aktif', 'Manual', 2], ['Merchant', 'Amandemen', 250, 80, 'Akan Berakhir', 'Manual', 6],
    ['Merchant', 'Amandemen', 70, 260, 'Aktif', 'Manual', 3], ['Partner-Vendor', 'Payout', 10, 540, 'Aktif', 'Sampai Diputus'], ['Merchant', 'PKS QRIS', 5, 365, 'Aktif', 'Otomatis'],
  ]
  const nomor = (i: number, jd: string) => `${jd === 'NDA' ? 'NDA' : jd === 'Amandemen' ? 'AMD' : 'PKS'}/CLRM/${String(i + 1).padStart(3, '0')}/2026`
  const nameOf = (i: number) => (sc[i][0] === 'Merchant' ? MERCH[i % MERCH.length] : VEND[i % VEND.length])
  return sc.map(([hub, jd, ago, sisaHari, status, perp, indukIdx], i) => {
    const mulai = addDays(today, -ago)
    const induk = indukIdx !== undefined ? nomor(indukIdx, sc[indukIdx][1]) : ''
    return {
      id: `kontrak-${i + 1}`, no: i + 1, status, createdAt: mulai, createdBy: 'Rudi Hartono',
      jenisHubungan: hub, mitra: hub === 'Merchant' ? '' : nameOf(indukIdx ?? i), merchant: hub === 'Merchant' ? nameOf(indukIdx ?? i) : '', nomor: nomor(i, jd), jenisDok: jd, mulai,
      berakhir: sisaHari === null ? '' : addDays(today, sisaHari), perpanjangan: perp, lamaBulan: perp === 'Otomatis' || perp === 'Manual' ? (i % 2 ? 12 : 24) : '',
      bidang: hub === 'Merchant' ? BIDANG[i % 5] : '', pic: i % 5 === 4 ? '' : PICS[i % 4], dept: i % 5 === 4 ? DEPT[i % 4] : '', induk,
      kelengkapan: { hardcopy: i % 3 !== 0, ttd: i % 4 !== 0 },
      file: { name: `${nomor(i, jd).replace(/\//g, '-')}.pdf`, size: 200000 + i * 5000, type: 'application/pdf' },
    }
  })
}


const cfg: PageConfig<Kontrak> = {
  module: 'kontrak', title: 'Kontrak', noun: 'Kontrak', exportPrefix: 'Kontrak',
  name: (r) => `${nm(r)} - ${r.nomor}`,
  seed, fields, columns, filters,
  blank: () => ({ jenisHubungan: '', mitra: '', merchant: '', nomor: '', jenisDok: '', mulai: '', berakhir: '', perpanjangan: '', lamaBulan: '', status: 'Draft', bidang: '', pic: '', dept: '', induk: '', kelengkapan: {}, file: null }),
  search: (r) => `${nm(r)} ${r.nomor} ${r.jenisDok}`, searchPlaceholder: 'Cari mitra, nomor, jenis dokumen',
  alerts, cancelStatus: 'Dibatalkan', guide: KontrakGuide,
  normalize: (r, c) => {
    if (!LIVE(r) || !r.berakhir) return r
    const s = diffDays(r.berakhir, c.today)
    const status = s < 0 ? 'Expired' : s <= 90 ? 'Akan Berakhir' : 'Aktif'
    return status === r.status ? r : { ...r, status }
  },
  // ganti Jenis Hubungan: kosongkan isian nama yang tidak lagi cocok (Merchant = teks bebas, lainnya = dropdown master)
  onChange: (n, k) => (k !== 'jenisHubungan' ? n : isMerchant(n) ? { ...n, mitra: '' } : { ...n, merchant: '' }),
  canEditRow: (r, c) => c.role !== 'PIC' || sameName(r.pic, c.user.name) || (!!r.dept && r.dept === c.user.departemen),
  validate: (r, _mode, c) => {
    const e: Record<string, string> = {}
    const n = r.nomor.trim().toLowerCase()
    if (n && others(c).some((k) => k.id !== r.id && !k.cancelled && k.nomor.trim().toLowerCase() === n)) e.nomor = 'Nomor PKS / NDA sudah dipakai'
    if (r.berakhir && r.mulai && r.berakhir < r.mulai) e.berakhir = 'Tanggal Berakhir tidak boleh sebelum Tanggal Mulai'
    if (r.induk && r.induk.trim().toLowerCase() === n) e.induk = 'Dokumen Induk tidak boleh dirinya sendiri'
    if (r.lamaBulan !== '' && Number(r.lamaBulan) < 1) e.lamaBulan = 'Minimal 1 bulan'
    return e
  },
  dashDate: { get: (r) => r.mulai, label: 'Tanggal Mulai' },
  Dashboard: ({ rows, allRows, c, open, drill }) => {
    const cnt = (g: string) => rows.filter((r) => grup(r, c.today) === g).length
    const card = (label: string, g: string, tone: 'green' | 'yellow' | 'red') => ({ label, value: cnt(g), tone, onClick: () => drill({ kelompok: g }) })
    const dekat = rows.filter((r) => LIVE(r) && r.berakhir && (sisa(r, c.today) as number) >= 0 && (sisa(r, c.today) as number) <= 90).sort((a, b) => a.berakhir.localeCompare(b.berakhir))
    const rg = useMonthRange('12') // filter bulan kartu ini, independen dari filter halaman
    const bulan = rg.months(allRows.map((r) => monthKey(r.mulai)))
    return (
      <div className="space-y-3">
        <StatCards title="Masa berlaku kontrak" info={{
          apa: 'Enam kartu yang mengelompokkan kontrak menurut sisa hari sampai Tanggal Berakhir. Hanya kontrak berstatus Aktif atau Akan Berakhir yang masuk kelompok hari. Data Dibatalkan tidak dihitung.',
          baca: [
            'Aktif > 90 hari (hijau): sisa lebih dari 90 hari.',
            'Berakhir 60 sampai 90 hari (kuning): sisa 61 sampai 90 hari. Berakhir 30 sampai 60 hari (kuning): sisa 31 sampai 60 hari.',
            'Berakhir < 30 hari (merah): sisa 0 sampai 30 hari.',
            'Expired (merah): status Expired, Tanggal Berakhir sudah lewat.',
            'Tanggal Berakhir Kosong (kuning): kontrak tanpa Tanggal Berakhir, kecuali status Berakhir atau Dibatalkan.',
            'Kontrak berstatus Draft, Review, Diperpanjang, atau Berakhir yang punya Tanggal Berakhir tidak masuk kartu mana pun.',
            'Klik kartu untuk membuka tab Table dengan filter Kelompok masa berlaku yang sama.',
          ],
        }} items={[
          card('Kontrak Aktif > 90 hari', G.over, 'green'), card('Kontrak Berakhir 60–90 hari', G.d90, 'yellow'), card('Kontrak Berakhir 30–60 hari', G.d60, 'yellow'),
          card('Kontrak Berakhir < 30 hari', G.d30, 'red'), card('Kontrak Expired', G.exp, 'red'), card('Kontrak Tanggal Berakhir Kosong', G.empty, 'yellow'),
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <BarCard title="Kontrak per jenis dokumen" info={{
            apa: 'Jumlah kontrak menurut Jenis Dokumen, semua status kecuali Dibatalkan, dalam Periode Tanggal Mulai yang dipilih.',
            baca: ['Sumbu vertikal: Jenis Dokumen. Sumbu horizontal: jumlah kontrak.', 'Arahkan kursor ke batang untuk melihat jumlahnya.', 'Klik batang untuk membuka tab Table terfilter Jenis Dokumen.', 'Isian teks bebas di luar daftar dihitung di batang Lainnya, sehingga jumlah semua batang sama dengan jumlah kontrak.'],
          }} horizontal data={JENIS_DOK.map((j) => ({ name: j, Jumlah: rows.filter((r) => showLainnya(r.jenisDok, JENIS_DOK) === j).length }))} keys={['Jumlah']} onClick={(row) => drill({ jenisDok: row.name })} />
          <LineCard title="Kontrak baru per bulan" info={{
            apa: 'Jumlah kontrak baru menurut bulan Tanggal Mulai, semua status kecuali Dibatalkan. Tidak ikut filter Periode halaman.',
            baca: ['Sumbu horizontal: bulan (tahun-bulan). Sumbu vertikal: jumlah kontrak.', 'Filter Periode di atas grafik mengatur rentang bulan: 3, 6, 9, 12 bulan terakhir, Seluruh Waktu, atau Custom. Bawaan 12 bulan terakhir.', 'Bulan tanpa kontrak tampil sebagai nol.', 'Arahkan kursor ke titik untuk melihat bulan dan jumlahnya.'],
          }} toolbar={rg.toolbar} data={bulan.map((m) => ({ name: m, 'Kontrak baru': allRows.filter((r) => monthKey(r.mulai) === m).length }))} keys={['Kontrak baru']} />
        </div>
        <MiniTable
          title="Kontrak berakhir dalam 90 hari (terdekat dulu)" info={{
            apa: 'Daftar kontrak Aktif atau Akan Berakhir yang Tanggal Berakhirnya 0 sampai 90 hari dari hari ini, dalam Periode Tanggal Mulai yang dipilih.',
            baca: ['Urutan: Tanggal Berakhir terdekat paling atas.', 'Kolom Sisa hari menunjukkan hari sampai berakhir.', 'Tabel menampilkan 5 baris per halaman. Gunakan pager di bawah tabel.', 'Klik baris untuk membuka Detail kontrak.'],
          }} rows={dekat} onRow={(r) => open(r.id)}
          cols={[
            { label: 'Mitra / Merchant', get: nm }, { label: 'Nomor PKS / NDA', get: (r) => r.nomor }, { label: 'Jenis Dokumen', get: (r) => r.jenisDok },
            { label: 'Berakhir', get: (r) => fmtDate(r.berakhir) }, { label: 'Sisa hari', get: (r) => sisa(r, c.today) },
            { label: 'PIC / Unit', get: (r) => picOf(r) },
          ]}
        />
      </div>
    )
  },
}
export default function KontrakPage() { return <PageShell config={cfg} /> }
