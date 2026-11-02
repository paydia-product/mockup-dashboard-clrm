import { addDays, diffDays, fmtDate } from '../lib'
import { showLainnya, withLainnya } from '../kit/Lainnya'
import { getStore } from '../kit/store'
import PageShell from '../kit/PageShell'
import { AphGuide } from '../guides/aph'
import { sameName } from '../kit/perms'
import { BarCard, Breakdown, CalendarCard, countBy, DonutCard, LineCard, MiniTable, StatCards, Card, useMonthRange } from '../kit/charts'
import { ageBucket, ageBuckets, monthKey } from '../kit/dates'
import { StatusPill } from '../kit/fmt'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, PageConfig } from '../kit/types'

interface Aph extends BaseRec {
  tglTerima: string; nomorSurat: string; tglSurat: string; pengirim: string
  perihalJenis: string; perihalTeks: string; kasus: string; merchant: string; groupMerchant: string
  unit: string; namaPenyidik: string; noTelp: string
  bapTgl: string; bapUlang: string; bapTempat: string
  hold: number | ''; danaTaktis: number | ''
  tglBatas: string; pic: string; tglJawab: string
}
// Pengirim dan Kategori = master Instansi Pengirim APH + Lainnya (teks bebas)
const pengirimOpts = (c?: Ctx) => withLainnya((c?.master ?? getStore().master).instansiAph)
const SEED_PENGIRIM = ['Bareskrim', 'Polda', 'Polres', 'PPATK', 'Kejaksaan']
const PERIHAL = ['Permintaan Data Identitas', 'Permintaan Keterangan', 'Pemblokiran', 'Lainnya']
const KASUS = ['Judi Online', 'Pencucian Uang', 'Penipuan', 'Lainnya']
const UNIT = ['Dittipidsiber', 'Ditreskrimsus', 'Lainnya']
const ACTIVE = (r: Aph) => r.status === 'Active'
const bapDate = (r: Aph) => r.bapUlang || r.bapTgl
const age = (r: Aph, today: string) => diffDays(today, r.tglTerima)
const late = (r: Aph, today: string) => ACTIVE(r) && !!r.tglBatas && r.tglBatas < today
const toLO = ['Legal Officer']
// Nama dan telepon penyidik: peran di luar Super Admin, Head CLRM, Legal Officer selalu tersamar tanpa tombol mata; ketiganya melihat tersamar dulu dan membuka lewat ikon mata (Detail, form Ubah). Export selalu tersamar.
const isMasked = (c: Ctx) => !['Super Admin', 'Head CLRM', 'Legal Officer'].includes(c.role)
const canReveal = (c: Ctx) => !isMasked(c)

const fields: Field<Aph>[] = [
  { key: 'tglTerima', label: 'Tanggal Terima Surat', type: 'date', required: true, help: 'Awal hitungan batas waktu jawaban.' },
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true },
  { key: 'tglSurat', label: 'Tanggal Surat', type: 'date', required: true },
  { key: 'pengirim', label: 'Pengirim dan Kategori', type: 'select', options: (c) => pengirimOpts(c), required: true },
  { key: 'perihalJenis', label: 'Perihal Permintaan (Jenis)', type: 'select', options: PERIHAL, required: true },
  { key: 'perihalTeks', label: 'Perihal Permintaan (Uraian)', type: 'text', required: true },
  { key: 'kasus', label: 'Kasus', type: 'select', options: KASUS, required: true },
  { key: 'merchant', label: 'Nama Merchant', type: 'text', required: true },
  { key: 'groupMerchant', label: 'Group Merchant', type: 'text', required: true },
  { key: 'unit', label: 'Unit Penyidik', type: 'select', options: UNIT, required: true },
  { key: 'namaPenyidik', label: 'Nama Penyidik', type: 'text', mask: isMasked, reveal: canReveal },
  { key: 'noTelp', label: 'No. Telepon Penyidik', type: 'text', mask: isMasked, reveal: canReveal },
  { key: 'bapTgl', label: 'Tanggal BAP', type: 'date' },
  { key: 'bapUlang', label: 'Tanggal Jadwal Ulang BAP', type: 'date', help: 'Perubahan jadwal BAP tercatat di Log.' },
  { key: 'bapTempat', label: 'Tempat BAP', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Done'], required: true },
  { key: 'hold', label: 'Nominal Hold Settlement (Rp)', type: 'money' },
  { key: 'danaTaktis', label: 'Dana Taktis (Rp)', type: 'money' },
  { key: 'tglBatas', label: 'Batas Waktu Jawaban', type: 'date', help: 'Boleh kosong; tanpa batas waktu tidak ada notifikasi keterlambatan.' },
  { key: 'pic', label: 'PIC', type: 'select', options: (c) => c.master.pic, required: true },
  { key: 'tglJawab', label: 'Tanggal Jawaban Dikirim', type: 'date', required: (r) => r.status === 'Done' },
]
const columns: Column<Aph>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Tgl Terima', get: (r) => r.tglTerima, render: (r) => fmtDate(r.tglTerima) },
  { label: 'Nomor Surat', get: (r) => r.nomorSurat },
  { label: 'Pengirim', get: (r) => r.pengirim },
  { label: 'Kasus', get: (r) => r.kasus },
  { label: 'Merchant', get: (r) => `${r.merchant} (${r.groupMerchant})` },
  { label: 'Batas Jawaban', get: (r) => r.tglBatas, render: (r) => fmtDate(r.tglBatas) },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'PIC', get: (r) => r.pic || '-' },
]
const uniq = (rows: Aph[], g: (r: Aph) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Aph>[] = [
  { key: 'periode', label: 'Periode (Tanggal Terima)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglTerima >= a) && (!b || r.tglTerima <= b) } },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Done', 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'pengirim', label: 'Pengirim', type: 'select', options: (_, c) => pengirimOpts(c), match: (r, v) => showLainnya(r.pengirim, pengirimOpts()) === v },
  { key: 'kasus', label: 'Kasus', type: 'select', options: KASUS, match: (r, v) => showLainnya(r.kasus, KASUS) === v },
  { key: 'unit', label: 'Unit Penyidik', type: 'select', options: UNIT, match: (r, v) => showLainnya(r.unit, UNIT) === v },
  { key: 'groupMerchant', label: 'Group Merchant', type: 'select', options: (rows) => uniq(rows, (r) => r.groupMerchant), match: (r, v) => r.groupMerchant === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => uniq(rows, (r) => r.pic), match: (r, v) => r.pic === v },
]

const alerts: AlertDef<Aph>[] = [
  {
    key: 'bap', label: 'Jadwal BAP akan tiba', rule: 'BAP tinggal 7 hari atau kurang (kuning), 2 hari atau kurang (merah).',
    check: (r, c) => {
      const b = bapDate(r)
      if (!ACTIVE(r) || !b) return null
      const d = diffDays(b, c.today)
      if (d < 0 || d > 7) return null
      return { color: d <= 2 ? 'red' : 'yellow', detail: `BAP ${d} hari lagi (${fmtDate(b)})`, to: [...toLO, 'Head CLRM'] }
    },
  },
  {
    key: 'overdue', label: 'Jawaban APH lewat batas waktu', rule: 'Status Active dan batas waktu jawaban terlewat.',
    check: (r, c) => (late(r, c.today) ? { color: 'red', detail: `Lewat ${diffDays(c.today, r.tglBatas)} hari`, to: [...toLO, 'Head CLRM'] } : null),
  },
  {
    key: 'kosong', label: 'Data permintaan APH belum lengkap', rule: 'PIC, nama penyidik, atau nomor telepon penyidik masih kosong pada permintaan Active.',
    check: (r) => {
      if (!ACTIVE(r)) return null
      const k = [!r.pic.trim() && 'PIC', !r.namaPenyidik.trim() && 'Nama Penyidik', !r.noTelp.trim() && 'No. Telepon'].filter(Boolean)
      return k.length ? { color: 'yellow', detail: `Kosong: ${k.join(', ')}`, to: toLO } : null
    },
  },
]

function seed(today: string): Aph[] {
  const MERCH: [string, string][] = [['PT Gemilang Bayar', 'Gemilang Group'], ['CV Surya Digital', 'Surya Group'], ['PT Nusa Kreasi', 'Nusa Group'], ['PT Bintang Lestari', 'Bintang Group'], ['PT Garuda Niaga', 'Gemilang Group'], ['CV Cahaya Prima', 'Cahaya Group'], ['PT Mitra Cepat', 'Surya Group'], ['PT Lintas Dana', 'Nusa Group']]
  const PICS = ['Regie', 'Fakhri', 'Osama'] // master PIC
  const TEMPAT = ['Bareskrim, Jakarta', 'Polda Metro Jaya', 'Polres Jakarta Selatan', 'Kejaksaan Negeri Jakarta']
  // [umur hari, status, hari ke batas dari tglTerima, bap offset dari hari ini | null]
  const sc: [number, string, number, number | null][] = [
    [12, 'Active', 7, 1], [10, 'Active', 14, 2], [9, 'Active', 14, 5], [15, 'Active', 14, 7], [20, 'Active', 10, null], [30, 'Active', 14, null], // 4 and 5 lewat batas
    [3, 'Active', 14, 20], [6, 'Active', 14, null], [18, 'Active', 21, 12], [45, 'Active', 30, 28], [2, 'Active', 14, null], [7, 'Active', 14, null],
    [40, 'Done', 14, null], [55, 'Done', 14, null], [70, 'Done', 14, null], [85, 'Done', 14, null], [100, 'Done', 14, null], [120, 'Done', 14, null],
    [35, 'Done', 14, null], [60, 'Done', 14, null], [75, 'Done', 14, null], [95, 'Done', 14, null], [110, 'Done', 14, null], [130, 'Done', 14, null],
    [25, 'Done', 14, null], [50, 'Done', 14, null], [65, 'Done', 14, null], [80, 'Done', 14, null], [140, 'Done', 14, null], [150, 'Done', 14, null],
  ]
  return sc.map(([umur, status, sla, bap], i) => {
    const tglTerima = addDays(today, -umur)
    const done = status === 'Done'
    const [merchant, groupMerchant] = MERCH[i % 8]
    return {
      id: `aph-${i + 1}`, no: i + 1, status, createdAt: tglTerima, createdBy: 'Regie',
      tglTerima, nomorSurat: `B/${1200 + i * 7}/${(i % 12) + 1}/2026/${['Siber', 'Reskrimsus', 'PPATK', 'Kejari'][i % 4]}`, tglSurat: addDays(tglTerima, -2),
      pengirim: SEED_PENGIRIM[[0, 1, 0, 3, 2, 4][i % 6]], perihalJenis: PERIHAL[i % 4], perihalTeks: ['Data identitas pemilik rekening merchant', 'Keterangan alur transaksi merchant', 'Pemblokiran rekening settlement merchant', 'Salinan dokumen onboarding'][i % 4],
      kasus: KASUS[[0, 0, 1, 2, 0, 3][i % 6]], merchant, groupMerchant, unit: UNIT[i % 3],
      namaPenyidik: i === 7 ? '' : `AKP Penyidik ${i + 1}`, noTelp: i === 7 || i === 10 ? '' : `0812-55${String(1000 + i * 13)}`,
      bapTgl: bap !== null ? addDays(today, bap) : done && i % 3 === 0 ? addDays(tglTerima, 5) : '', bapUlang: i === 1 ? addDays(today, 2) : '', bapTempat: bap !== null || (done && i % 3 === 0) ? TEMPAT[i % 4] : '',
      hold: i % 4 === 0 ? 25_000_000 + i * 1_500_000 : '', danaTaktis: i % 6 === 0 ? 5_000_000 + i * 500_000 : '',
      tglBatas: addDays(tglTerima, sla), pic: PICS[i % 3], tglJawab: done ? addDays(tglTerima, Math.min(sla, 5 + (i % 7))) : '',
    }
  })
}

const cfg: PageConfig<Aph> = {
  module: 'aph', title: 'Permintaan APH', noun: 'Permintaan', exportPrefix: 'Permintaan_APH',
  name: (r) => r.nomorSurat,
  canEditRow: (r, c) => c.role !== 'PIC' || sameName(r.pic, c.user.name),
  seed, fields, columns, filters,
  blank: () => ({ tglTerima: '', nomorSurat: '', tglSurat: '', pengirim: '', perihalJenis: '', perihalTeks: '', kasus: '', merchant: '', groupMerchant: '', unit: '', namaPenyidik: '', noTelp: '', bapTgl: '', bapUlang: '', bapTempat: '', status: 'Active', hold: '', danaTaktis: '', tglBatas: '', pic: '', tglJawab: '' }),
  search: (r) => `${r.nomorSurat} ${r.merchant} ${r.groupMerchant} ${r.perihalJenis} ${r.perihalTeks}`, searchPlaceholder: 'Cari nomor surat, merchant, group, perihal',
  alerts, cancelStatus: 'Dibatalkan', guide: AphGuide,
  validate: (r) => {
    const e: Record<string, string> = {}
    if (r.tglBatas && r.tglTerima && r.tglBatas < r.tglTerima) e.tglBatas = 'Batas waktu tidak boleh sebelum tanggal terima'
    if (r.tglJawab && r.tglTerima && r.tglJawab < r.tglTerima) e.tglJawab = 'Tanggal jawaban tidak boleh sebelum tanggal terima'
    if (r.bapUlang && r.bapTgl && r.bapUlang < r.bapTgl) e.bapUlang = 'Jadwal ulang tidak boleh sebelum tanggal BAP'
    return e
  },
  dashDate: { get: (r) => r.tglTerima, label: 'Tanggal Terima Surat' },
  Dashboard: ({ rows, allRows, c, open }) => {
    const act = rows.filter(ACTIVE)
    const done = rows.filter((r) => r.status === 'Done').length
    const rg = useMonthRange('12') // filter bulan kartu ini, independen dari filter halaman
    const months = rg.months(allRows.map((r) => monthKey(r.tglTerima)))
    const count = (g: (r: Aph) => string, names: string[]) => names.map((name) => ({ name, Jumlah: rows.filter((r) => g(r) === name).length }))
    const top = (g: (r: Aph) => string, n: number) => count(g, uniq(rows, g)).sort((a, b) => b.Jumlah - a.Jumlah).slice(0, n)
    const events = act.filter((r) => bapDate(r) && bapDate(r) >= c.today && bapDate(r) < addDays(c.today, 30)).map((r) => {
      const d = diffDays(bapDate(r), c.today)
      return { date: bapDate(r), label: `BAP ${r.merchant}`, tone: (d <= 2 ? 'red' : d <= 7 ? 'yellow' : 'blue') as 'red' | 'yellow' | 'blue', id: r.id }
    })
    const edges = [7, 14, 30]
    const umur = ageBuckets(edges).map((name) => {
      const x = act.filter((r) => ageBucket(age(r, c.today), edges) === name)
      return { name, Jumlah: x.length, merah: x.some((r) => late(r, c.today)) }
    })
    return (
      <div className="space-y-3">
        <StatCards title="Status permintaan" info={{
          apa: 'Jumlah permintaan APH menurut status. Data Dibatalkan tidak dihitung.',
          baca: ['Active (kuning bila ada, abu-abu bila nol): permintaan yang masih berjalan.', 'Done (hijau): permintaan yang sudah dijawab.'],
        }} items={[
          { label: 'Active', value: act.length, tone: act.length ? 'yellow' : 'gray' },
          { label: 'Done', value: done, tone: 'green' },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          <LineCard title="Surat masuk per bulan" info={{
            apa: 'Jumlah surat permintaan menurut bulan Tanggal Terima Surat, semua status kecuali Dibatalkan. Tidak ikut filter Periode halaman.',
            baca: ['Sumbu horizontal: bulan (tahun-bulan). Sumbu vertikal: jumlah surat.', 'Filter Periode di atas grafik mengatur rentang bulan: 3, 6, 9, 12 bulan terakhir, Seluruh Waktu, atau Custom. Bawaan 12 bulan terakhir.', 'Arahkan kursor ke titik untuk melihat jumlah surat dan rinciannya per instansi pengirim.'],
          }} toolbar={rg.toolbar} data={months.map((m) => ({ name: m, Surat: allRows.filter((r) => monthKey(r.tglTerima) === m).length }))} keys={['Surat']}
            tip={(d) => <Breakdown title={`${d.name}: ${d.Surat} surat`} sub="Per instansi pengirim" items={countBy(allRows.filter((r) => monthKey(r.tglTerima) === d.name), (r) => r.pengirim)} />} />
          <BarCard title="Instansi pengirim terbanyak" info={{
            apa: 'Jumlah permintaan menurut instansi pengirim (Active dan Done, tanpa Dibatalkan), dalam Periode Tanggal Terima yang dipilih.',
            baca: ['Sumbu vertikal: instansi pengirim, urut terbanyak di atas. Sumbu horizontal: jumlah permintaan.', 'Isian teks bebas di luar daftar dihitung di batang Lainnya.'],
          }} horizontal data={count((r) => showLainnya(r.pengirim, pengirimOpts(c)), pengirimOpts(c)).sort((a, b) => b.Jumlah - a.Jumlah)} keys={['Jumlah']} />
          <DonutCard title="Permintaan per kasus" info={{
            apa: 'Proporsi permintaan menurut Kasus (Active dan Done, tanpa Dibatalkan), dalam Periode Tanggal Terima yang dipilih.',
            baca: ['Tiap irisan adalah satu Kasus. Makin besar irisan, makin banyak permintaan. Kasus tanpa data tidak tampil.', 'Arahkan kursor ke irisan untuk melihat jumlah dan rinciannya per instansi pengirim.', 'Isian teks bebas di luar daftar dihitung di irisan Lainnya.'],
          }} data={KASUS.map((k) => ({ name: k, value: rows.filter((r) => showLainnya(r.kasus, KASUS) === k).length }))}
            tip={(name, value) => <Breakdown title={`${name}: ${value} permintaan`} sub="Per instansi pengirim" items={countBy(rows.filter((r) => showLainnya(r.kasus, KASUS) === name), (r) => r.pengirim)} />} />
          <BarCard title="Top 5 Group merchant paling banyak disebut" info={{
            apa: 'Lima Group Merchant yang paling sering muncul pada permintaan (Active dan Done, tanpa Dibatalkan), dalam Periode Tanggal Terima yang dipilih.',
            baca: ['Sumbu horizontal: Group Merchant, urut terbanyak di kiri. Sumbu vertikal: jumlah permintaan.'],
          }} data={top((r) => r.groupMerchant, 5)} keys={['Jumlah']} />
          <CalendarCard title="Jadwal BAP 30 hari ke depan" info={{
            apa: 'Kalender 30 hari mulai hari ini. Menampilkan jadwal BAP permintaan berstatus Active. Bila ada Tanggal Jadwal Ulang BAP, tanggal itu yang dipakai.',
            baca: ['Tiap sel adalah satu hari. Titik berwarna dengan nama "BAP [merchant]" adalah satu jadwal.', 'Merah: BAP 2 hari atau kurang dari hari ini. Kuning: 3 sampai 7 hari. Biru: lebih dari 7 hari.', 'Sel hari ini diberi warna biru muda. Sel dengan lebih dari 3 jadwal menampilkan "+N lagi".', 'Klik jadwal untuk membuka Detail permintaan.'],
          }} rangeDays={30} events={events} onEvent={open} />
          <Card title="Permintaan Active menurut umur sejak surat diterima (hari)" info={{
            apa: 'Permintaan berstatus Active dikelompokkan menurut umur sejak Tanggal Terima Surat. Tabel di bawah batang mendaftar permintaan Active.',
            baca: ['Sumbu horizontal: rentang umur dalam hari (0-7, 8-14, 15-30, lebih dari 30). Sumbu vertikal: jumlah permintaan.', 'Batang merah: ada permintaan di rentang itu yang sudah lewat Batas Waktu Jawaban. Batang kuning: belum ada yang lewat.', 'Tabel: tertua dulu, 5 baris per halaman. Tanggal Batas merah berarti sudah lewat.', 'Klik baris tabel untuk membuka Detail.'],
          }}>
            <BarCard title="" data={umur.map(({ name, Jumlah }) => ({ name, Jumlah }))} keys={['Jumlah']} catLabel="Hari" cellColors={umur.map((u) => (u.merah ? '#ef4444' : '#f59e0b'))} />
            <MiniTable cols={[
              { label: 'Nomor Surat', get: (r: Aph) => r.nomorSurat },
              { label: 'Merchant', get: (r: Aph) => r.merchant },
              { label: 'Umur (hari)', get: (r: Aph) => age(r, c.today) },
              { label: 'Batas', get: (r: Aph) => <span className={late(r, c.today) ? 'font-semibold text-red-600' : ''}>{fmtDate(r.tglBatas)}</span> },
            ]} rows={[...act].sort((a, b) => age(b, c.today) - age(a, c.today))} onRow={(r) => open(r.id)} />
          </Card>
        </div>
      </div>
    )
  },
}
export default function Aph() { return <PageShell config={cfg} /> }
export { cfg as config } // dipakai pusat notifikasi (kit/notify.tsx)
