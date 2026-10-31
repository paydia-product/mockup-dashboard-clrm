import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { addDays, diffDays, fmtDate } from '../lib'
import PageShell from '../kit/PageShell'
import { BarCard, DonutCard, MiniTable, Card } from '../kit/charts'
import { todayStr, workDaysBetween } from '../kit/dates'
import { StatusPill } from '../kit/fmt'
import { Modal } from '../ui'
import { sameName } from '../kit/perms'
import { KajianGuide } from '../guides/kajian'
import type { AlertDef, BaseRec, Column, Ctx, Field, FilterDef, ModuleApi, PageConfig } from '../kit/types'

interface Kajian extends BaseRec {
  jenis: string; judul: string; dept: string; tglMasuk: string; sla: number | ''; pic: string
  tglSelesai: string; hasil: string; klasifikasi: string
  namaMitra: string; konteks: string; statusMitra: string; adaPks: string; tglPks: string
  aksesSistem: string; aksesData: string; aksesKeuangan: string; pantau: string; tglDD: string
}
const JENIS = ['CR', 'Vendor', 'Produk', 'Regulasi', 'Proyek']
const STATUS = ['Baru', 'Proses', 'Review', 'Selesai', 'Batal']
const HASIL = ['Tidak Direkomendasikan', 'Direkomendasikan Dengan Syarat', 'Direkomendasikan', 'Risk Acceptance']
const KLAS = ['Izin', 'Lapor', 'Tidak Perlu']
const isV = (r: Kajian) => r.jenis === 'Vendor'
const OPEN = (r: Kajian) => !['Selesai', 'Batal'].includes(r.status)
const batas = (r: Kajian) => (r.tglMasuk && r.sla !== '' ? addDays(r.tglMasuk, Number(r.sla)) : '')
const lateDays = (r: Kajian, today: string) => (OPEN(r) && batas(r) ? Math.max(0, diffDays(today, batas(r))) : 0)
const ddDays = (r: Kajian, today: string) => (isV(r) && r.tglDD ? diffDays(r.tglDD, today) : null) // >0 = masih ke depan
const lamaSelesai = (r: Kajian) => diffDays(r.tglSelesai, r.tglMasuk)

const fields: Field<Kajian>[] = [
  { key: 'jenis', label: 'Jenis', type: 'select', options: JENIS, required: true },
  { key: 'judul', label: 'Judul / Objek', type: 'text', required: true, wide: true },
  { key: 'dept', label: 'Unit Kerja Pengusul', type: 'select', options: (c) => c.master.unitKerja, required: true },
  { key: 'tglMasuk', label: 'Tanggal Masuk', type: 'date', required: true, reasonOnChange: true, help: 'Mengubah Tanggal Masuk menggeser batas waktu; wajib disertai alasan.' },
  { key: 'sla', label: 'SLA (hari kalender)', type: 'number', required: true, reasonOnChange: true, help: 'Mengubah SLA (batas waktu) wajib disertai alasan.' },
  { key: 'batas', label: 'Tanggal Batas', type: 'date', auto: (r) => batas(r) },
  { key: 'status', label: 'Status', type: 'select', options: STATUS.filter((s) => s !== 'Selesai'), importOptions: STATUS, required: true, help: 'Status Selesai diisi lewat aksi baris "Selesai".' },
  { key: 'pic', label: 'PIC', type: 'select', options: (c) => c.master.pic, required: true },
  { key: 'tglSelesai', label: 'Tanggal Selesai', type: 'date', inForm: 'none' },
  { key: 'hasil', label: 'Hasil / Opini Risk Management', type: 'select', options: HASIL, inForm: 'none' },
  { key: 'klasifikasi', label: 'Klasifikasi Regulasi', type: 'select', options: KLAS },
  { key: 'namaMitra', label: 'Nama Mitra', type: 'select', options: (c) => c.master.mitra, required: isV, showIf: isV },
  { key: 'konteks', label: 'Konteks Kerja Sama', type: 'textarea', wide: true, showIf: isV },
  { key: 'statusMitra', label: 'Status Mitra', type: 'select', options: ['Eksisting', 'Rencana'], required: isV, showIf: isV },
  { key: 'adaPks', label: 'Ada PKS?', type: 'yesno', required: isV, showIf: isV },
  { key: 'tglPks', label: 'Tanggal PKS', type: 'date', required: (r) => isV(r) && r.adaPks === 'Ya', showIf: (r) => isV(r) && r.adaPks === 'Ya' },
  { key: 'aksesSistem', label: 'Akses ke Sistem?', type: 'yesno', required: isV, showIf: isV },
  { key: 'aksesData', label: 'Akses Data Pengguna / Karyawan?', type: 'yesno', required: isV, showIf: isV },
  { key: 'aksesKeuangan', label: 'Akses Data Keuangan?', type: 'yesno', required: isV, showIf: isV },
  { key: 'pantau', label: 'Pemantauan Berjalan?', type: 'yesno', required: isV, showIf: isV },
  { key: 'tglDD', label: 'Tanggal Due Diligence / Evaluasi', type: 'date', showIf: isV },
]
const columns: Column<Kajian>[] = [
  { label: 'No', get: (r) => r.no },
  { label: 'Jenis', get: (r) => r.jenis },
  { label: 'Judul / Objek', get: (r) => r.judul },
  { label: 'Unit Kerja', get: (r) => r.dept },
  { label: 'Tgl Masuk', get: (r) => r.tglMasuk, render: (r) => fmtDate(r.tglMasuk) },
  { label: 'Batas', get: (r) => batas(r), render: (r) => fmtDate(batas(r)) },
  { label: 'Status', get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  { label: 'PIC', get: (r) => r.pic || '-' },
  { label: 'Hasil', get: (r) => r.hasil || '-' },
]
const uniq = (rows: Kajian[], g: (r: Kajian) => string) => [...new Set(rows.map(g).filter(Boolean))].sort()
const filters: FilterDef<Kajian>[] = [
  { key: 'periode', label: 'Periode (Tanggal Masuk)', type: 'daterange', match: (r, v) => { const [a, b] = v as [string, string]; return (!a || r.tglMasuk >= a) && (!b || r.tglMasuk <= b) } },
  { key: 'jenis', label: 'Jenis', type: 'select', options: JENIS, match: (r, v) => r.jenis === v },
  { key: 'status', label: 'Status', type: 'select', options: [...STATUS, 'Dibatalkan'], match: (r, v) => r.status === v },
  { key: 'pic', label: 'PIC', type: 'select', options: (rows) => uniq(rows, (r) => r.pic), match: (r, v) => r.pic === v },
  { key: 'dept', label: 'Unit Kerja', type: 'select', options: (_, c) => c.master.unitKerja, match: (r, v) => r.dept === v },
  { key: 'hasil', label: 'Hasil', type: 'select', options: HASIL, match: (r, v) => r.hasil === v },
]

const toPic = (r: Kajian) => (r.pic ? `PIC (${r.pic})` : 'PIC')
const alerts: AlertDef<Kajian>[] = [
  {
    key: 'overdue', label: 'Lewat batas waktu', rule: 'Batas waktu terlewat dan kajian belum Selesai.',
    check: (r, c) => { const d = lateDays(r, c.today); return d > 0 ? { color: 'red', detail: `Lewat ${d} hari`, to: [toPic(r), 'Head CLRM'] } : null },
  },
  {
    key: 'near', label: 'Mendekati batas waktu', rule: 'Batas waktu tinggal 2 hari kerja atau kurang dan kajian belum Selesai.',
    check: (r, c) => {
      if (!OPEN(r) || !batas(r) || lateDays(r, c.today) > 0) return null
      const d = workDaysBetween(c.today, batas(r))
      return d <= 2 ? { color: 'yellow', detail: `${d} hari kerja lagi`, to: [toPic(r)] } : null
    },
  },
  {
    key: 'nohasil', label: 'Selesai tanpa hasil', rule: 'Status Selesai tetapi Hasil / Opini kosong (umumnya dari import).',
    check: (r) => (r.status === 'Selesai' && !r.hasil ? { color: 'yellow', detail: 'Hasil / Opini kosong', to: [toPic(r), 'Risk Officer'] } : null),
  },
  {
    key: 'mitra', label: 'Jadwal evaluasi mitra', rule: 'Vendor: jadwal due diligence/evaluasi H-30 (kuning) atau sudah lewat (merah).',
    check: (r, c) => {
      const d = ddDays(r, c.today)
      if (d === null) return null
      if (d < 0) return { color: 'red', detail: `Lewat ${-d} hari`, to: [toPic(r), 'Risk Officer'] }
      return d <= 30 ? { color: 'yellow', detail: `${d} hari lagi`, to: [toPic(r), 'Risk Officer'] } : null
    },
  },
]

function SelesaiModal({ r, api, close }: { r: Kajian; api: ModuleApi<Kajian>; close: () => void }) {
  const [tgl, setTgl] = useState(r.tglSelesai || todayStr())
  const [hasil, setHasil] = useState(r.hasil)
  const [err, setErr] = useState<{ tgl?: string; hasil?: string }>({})
  const save = () => {
    const e: { tgl?: string; hasil?: string } = {}
    if (!tgl) e.tgl = 'Tanggal Selesai wajib diisi.'
    else if (tgl < r.tglMasuk) e.tgl = 'Tanggal Selesai tidak boleh sebelum Tanggal Masuk.'
    if (!hasil) e.hasil = 'Hasil / Opini wajib diisi.'
    setErr(e)
    if (e.tgl || e.hasil) return
    api.update(r.id, { status: 'Selesai', tglSelesai: tgl, hasil })
    close()
  }
  return (
    <Modal title={`Selesaikan Kajian ${r.judul}`} onClose={close}>
      <div className="space-y-3">
        <div><label className="lbl">Tanggal Selesai *</label><input type="date" className="inp" value={tgl} onChange={(e) => setTgl(e.target.value)} />{err.tgl && <p className="err">{err.tgl}</p>}</div>
        <div><label className="lbl">Hasil / Opini Risk Management *</label>
          <select className="inp" value={hasil} onChange={(e) => setHasil(e.target.value)}><option value="">Pilih hasil</option>{HASIL.map((h) => <option key={h}>{h}</option>)}</select>
          {err.hasil && <p className="err">{err.hasil}</p>}</div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={close}>Batal</button><button className="btn btn-primary" onClick={save}>Simpan</button></div>
    </Modal>
  )
}

function seed(today: string): Kajian[] {
  const DEPT = ['Information Technology', 'Business', 'Operation', 'Finance, Accounting, Tax & Treasury', 'Compliance Legal & Risk Management', 'Support']
  const PICS = ['Regie', 'Fakhri', 'Osama', 'Regie'] // master PIC
  const MITRA = ['PT Nusa Cloud', 'PT Data Prima', 'PT Aman Jaya Logistik', 'PT Mitra Bayar', 'PT Sentra Verifikasi', 'PT Cipta Layanan', 'PT Biller Nusantara', 'PT Arta Teknologi', 'PT Kirim Cepat', 'PT Sigma Analitik']
  // [jenis, umur, sla, status, hasil (index atau -1), jadwal DD relatif hari (vendor)]
  const sc: [string, number, number, string, number, number?][] = [
    ['Vendor', 12, 7, 'Proses', -1, -9], ['Vendor', 20, 14, 'Review', -1, 12], ['Vendor', 40, 14, 'Selesai', 1, 25], ['Vendor', 30, 21, 'Selesai', 2, 80],
    ['Vendor', 6, 14, 'Baru', -1, 28], ['Vendor', 55, 30, 'Selesai', 3, -20], ['Vendor', 4, 21, 'Proses', -1, 150], ['Vendor', 70, 30, 'Selesai', 0, 200], ['Vendor', 9, 10, 'Proses', -1, 5], ['Vendor', 15, 30, 'Batal', -1, 60],
    ['CR', 10, 7, 'Proses', -1], ['CR', 5, 6, 'Proses', -1], ['CR', 3, 14, 'Baru', -1], ['CR', 35, 14, 'Selesai', 2], ['CR', 28, 10, 'Selesai', 1],
    ['Produk', 14, 10, 'Review', -1], ['Produk', 45, 21, 'Selesai', 2], ['Produk', 25, 14, 'Selesai', 1], ['Produk', 2, 30, 'Baru', -1], ['Produk', 8, 5, 'Proses', -1],
    ['Regulasi', 22, 14, 'Proses', -1], ['Regulasi', 50, 21, 'Selesai', 3], ['Regulasi', 33, 14, 'Selesai', 0], ['Regulasi', 6, 7, 'Baru', -1], ['Regulasi', 18, 30, 'Review', -1],
    ['Proyek', 16, 14, 'Proses', -1], ['Proyek', 60, 30, 'Selesai', 1], ['Proyek', 21, 21, 'Selesai', -1], ['Proyek', 11, 30, 'Baru', -1], ['Proyek', 26, 14, 'Batal', -1],
  ]
  return sc.map(([jenis, umur, sla, status, h, dd], i) => {
    const tglMasuk = addDays(today, -umur)
    const done = status === 'Selesai'
    const v = jenis === 'Vendor'
    const exist = v && i % 3 !== 0
    return {
      id: `kajian-${i + 1}`, no: i + 1, status, createdAt: tglMasuk, createdBy: 'Regie',
      jenis, judul: v ? `Due diligence ${MITRA[i % 10]}` : `${jenis === 'CR' ? 'Change request' : jenis === 'Produk' ? 'Produk baru' : jenis === 'Regulasi' ? 'Regulasi' : 'Proyek'} ${MITRA[i % 10]}`,
      dept: DEPT[i % 6], tglMasuk, sla, pic: PICS[i % 4],
      tglSelesai: done ? addDays(tglMasuk, Math.max(3, Math.round(sla * (0.5 + (i % 5) * 0.2)))) : '', hasil: done && h >= 0 ? HASIL[h] : '',
      klasifikasi: KLAS[i % 3],
      namaMitra: v ? MITRA[i % 10] : '', konteks: v ? 'Kerja sama layanan pendukung operasional Paydia' : '', statusMitra: v ? (exist ? 'Eksisting' : 'Rencana') : '',
      adaPks: v ? (exist ? 'Ya' : 'Tidak') : '', tglPks: v && exist ? addDays(today, -200 + i * 5) : '',
      aksesSistem: v ? (i % 2 ? 'Ya' : 'Tidak') : '', aksesData: v ? (i % 3 ? 'Ya' : 'Tidak') : '', aksesKeuangan: v ? (i % 4 ? 'Tidak' : 'Ya') : '',
      pantau: v ? (exist ? 'Ya' : 'Tidak') : '', tglDD: v && dd !== undefined ? addDays(today, dd) : '',
    }
  })
}

const cfg: PageConfig<Kajian> = {
  module: 'kajian', title: 'Kajian Risiko', noun: 'Kajian', exportPrefix: 'Kajian_Risiko',
  name: (r) => r.judul,
  guide: KajianGuide,
  seed, fields, columns, filters,
  blank: () => ({ jenis: '', judul: '', dept: '', tglMasuk: '', sla: '', status: 'Baru', pic: '', tglSelesai: '', hasil: '', klasifikasi: '', namaMitra: '', konteks: '', statusMitra: '', adaPks: '', tglPks: '', aksesSistem: '', aksesData: '', aksesKeuangan: '', pantau: '', tglDD: '' }),
  search: (r) => `${r.no} ${r.judul} ${r.namaMitra}`, searchPlaceholder: 'Cari nomor, judul, nama mitra',
  alerts, cancelStatus: 'Dibatalkan',
  canEditRow: (r, c) => r.status !== 'Selesai' && r.status !== 'Batal' && (c.role !== 'PIC' || sameName(r.pic, c.user.name)),
  validate: (r, mode) => {
    const e: Record<string, string> = {}
    if (r.sla !== '' && Number(r.sla) < 1) e.sla = 'SLA minimal 1 hari'
    if (mode === 'edit' && r.status === 'Selesai' && !r.tglSelesai) e.status = 'Gunakan aksi baris "Selesai" untuk menyelesaikan kajian.'
    return e
  },
  rowActions: [{
    label: 'Selesai', icon: CheckCircle2,
    show: (r, c) => r.status !== 'Batal' && (r.status !== 'Selesai' || !r.hasil) && (c.role !== 'PIC' || sameName(r.pic, c.user.name)),
    run: (r, api, close) => <SelesaiModal r={r} api={api} close={close} />,
  }],
  dashDate: { get: (r) => r.tglMasuk, label: 'Tanggal Masuk' },
  Dashboard: ({ rows, c, drill, open }) => {
    const n = (s: string) => rows.filter((r) => r.status === s).length
    const late = rows.filter((r) => lateDays(r, c.today) > 0)
    const done = rows.filter((r) => r.status === 'Selesai' && r.tglSelesai)
    const vendors = rows.filter((r) => isV(r) && r.tglDD)
    const jadwal = vendors.filter((r) => (ddDays(r, c.today) ?? 999) <= 30).sort((a, b) => a.tglDD.localeCompare(b.tglDD))
    const ex = (s: string) => vendors.filter((r) => r.statusMitra === s).length
    return (
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <DonutCard info={{ apa: 'Komposisi kajian menurut Jenis (CR, Vendor, Produk, Regulasi, Proyek) pada Periode Tanggal Masuk yang dipilih.', baca: ['Tiap irisan = satu jenis; ukuran irisan = jumlah kajian.', 'Arahkan kursor ke irisan untuk melihat jumlahnya.', 'Klik irisan untuk membuka Table terfilter jenis tersebut.'] }} title="Kajian per jenis" data={JENIS.map((j) => ({ name: j, value: rows.filter((r) => r.jenis === j).length }))} onClick={(name) => drill({ jenis: name })} />
          <BarCard info={{ apa: 'Jumlah kajian di tiap Status: Baru, Proses, Review, Selesai, dan Batal.', baca: ['Sumbu X: status. Sumbu Y: jumlah kajian.', 'Klik batang untuk membuka Table terfilter status tersebut.'] }} title="Kajian per status" data={STATUS.map((s) => ({ name: s, Jumlah: n(s) }))} keys={['Jumlah']} onClick={(row) => drill({ status: row.name })} />
          <Card title={`Lewat batas waktu (${late.length})`} info={{ apa: 'Kajian yang Tanggal Batas-nya (Tanggal Masuk + SLA hari kalender) sudah lewat dan statusnya belum Selesai atau Batal.', baca: ['Angka merah besar = jumlah kajian yang lewat batas.', 'Kolom Lewat = jumlah hari kalender sejak Tanggal Batas.', 'Klik baris untuk membuka Detail kajian. Tabel menampilkan 5 baris per halaman.'] }}>
            <div className="mb-2 text-3xl font-bold text-red-600">{late.length}</div>
            <MiniTable cols={[
              { label: 'No', get: (r: Kajian) => r.no }, { label: 'Judul', get: (r) => r.judul }, { label: 'PIC', get: (r) => r.pic },
              { label: 'Batas', get: (r) => fmtDate(batas(r)) }, { label: 'Lewat', get: (r) => <span className="font-semibold text-red-600">{lateDays(r, c.today)} hari</span> },
            ]} rows={late} onRow={(r) => open(r.id)} empty="Tidak ada kajian lewat batas" />
          </Card>
          <BarCard info={{ apa: 'Jumlah kajian per Unit Kerja pengusul. Semua Unit Kerja dari Master Data ditampilkan, termasuk yang berjumlah nol.', baca: ['Sumbu Y: Unit Kerja. Sumbu X: jumlah kajian.', 'Klik batang untuk membuka Table terfilter Unit Kerja tersebut.'] }} title="Kajian per unit kerja" horizontal data={c.master.unitKerja.map((d) => ({ name: d, Jumlah: rows.filter((r) => r.dept === d).length }))} keys={['Jumlah']} onClick={(row) => drill({ dept: row.name })} />
          <BarCard info={{ apa: 'Rata-rata hari kalender dari Tanggal Masuk sampai Tanggal Selesai, per Jenis, hanya untuk kajian berstatus Selesai yang punya Tanggal Selesai. Dibulatkan ke hari terdekat.', baca: ['Sumbu X: jenis kajian. Sumbu Y: rata-rata lama dalam hari.', 'Batang nol berarti belum ada kajian Selesai pada jenis itu.', 'Grafik ini tidak bisa diklik.'] }} title="Rata-rata lama masuk sampai selesai per jenis (hari)" data={JENIS.map((j) => { const x = done.filter((r) => r.jenis === j); return { name: j, Hari: x.length ? Math.round(x.reduce((a, r) => a + lamaSelesai(r), 0) / x.length) : 0 } })} keys={['Hari']} unit="Hari" />
          <DonutCard info={{ apa: 'Komposisi Hasil / Opini Risk Management. Hanya kajian yang sudah punya hasil (diisi lewat aksi Selesai) yang dihitung.', baca: ['Tiap irisan = satu hasil: Tidak Direkomendasikan, Direkomendasikan Dengan Syarat, Direkomendasikan, atau Risk Acceptance.', 'Arahkan kursor ke irisan untuk melihat jumlahnya.', 'Klik irisan untuk membuka Table terfilter hasil tersebut.'] }} title="Kajian per hasil / opini" data={HASIL.map((h) => ({ name: h, value: rows.filter((r) => r.hasil === h).length }))} onClick={(name) => drill({ hasil: name })} />
          <Card title="Mitra: jadwal due diligence / evaluasi ≤30 hari atau lewat" info={{ apa: 'Kajian Jenis Vendor yang punya Tanggal Due Diligence / Evaluasi dan jadwalnya 30 hari lagi atau kurang, atau sudah lewat. Urut dari jadwal paling awal.', baca: ['Kolom Sisa: merah "Lewat N hari" bila jadwal terlewat, kuning "N hari lagi" bila masih akan datang.', 'Klik baris untuk membuka Detail kajian. Tabel menampilkan 5 baris per halaman.'] }}>
            <MiniTable cols={[
              { label: 'Mitra', get: (r: Kajian) => r.namaMitra }, { label: 'Status', get: (r) => r.statusMitra }, { label: 'Jadwal', get: (r) => fmtDate(r.tglDD) },
              { label: 'Sisa', get: (r) => { const d = ddDays(r, c.today)!; return d < 0 ? <span className="font-semibold text-red-600">Lewat {-d} hari</span> : <span className="text-amber-600">{d} hari lagi</span> } },
            ]} rows={jadwal} onRow={(r) => open(r.id)} empty="Tidak ada jadwal dekat" />
          </Card>
          <BarCard info={{ apa: 'Jumlah kajian Jenis Vendor yang Tanggal Due Diligence / Evaluasi-nya terisi, dibagi menurut Status Mitra: Eksisting atau Rencana.', baca: ['Sumbu X: Status Mitra. Sumbu Y: jumlah kajian.', 'Grafik ini tidak bisa diklik.'] }} title="Mitra Eksisting vs Rencana" data={[{ name: 'Eksisting', Jumlah: ex('Eksisting') }, { name: 'Rencana', Jumlah: ex('Rencana') }]} keys={['Jumlah']} />
        </div>
      </div>
    )
  },
}
export default function Kajian() { return <PageShell config={cfg} /> }
export { cfg as config } // dipakai pusat notifikasi (kit/notify.tsx)
