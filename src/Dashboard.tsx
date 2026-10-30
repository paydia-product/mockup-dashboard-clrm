import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Audit, EMPTY_FILTER, Filter, Finding, REGULATORS, RISKS, STATUSES, fmtDate, lateDays } from './lib'
import { monthKey } from './kit/dates'
import { RiskBadge, StatusBadge } from './ui'
import { useDashPaged } from './shared/Pager'
import { useMonthRange } from './kit/charts'
import InfoTip from './kit/InfoTip'
import { useApp } from './kit/store'
import type { ChartInfo } from './kit/InfoTip'

// Teks info (i) tiap kartu dashboard
const INFO: Record<string, ChartInfo> = {
  ringkasan: {
    apa: 'Empat angka ringkas dari temuan pada Periode Tanggal Temuan yang dipilih. Temuan Dibatalkan tidak dihitung.',
    baca: [
      'Open (belum selesai): semua temuan yang statusnya bukan Selesai (Open, Proses, Menunggu Validasi).',
      'Selesai: temuan berstatus Selesai.',
      'Lewat Batas Waktu: temuan belum Selesai yang Batas Waktunya sudah lewat. Kotak menjadi merah bila lebih dari 0.',
      '% Selesai: Selesai dibagi total temuan, dibulatkan. Arahkan kursor ke kotak ini untuk melihat hitungannya.',
      'Kotak angka tidak bisa diklik.',
    ],
  },
  regulator: {
    apa: 'Jumlah temuan per regulator, dipisah menjadi belum selesai dan selesai. Regulator yang diketik bebas di luar daftar masuk ke Lainnya.',
    baca: [
      'Sumbu X: regulator (BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya). Sumbu Y: jumlah temuan.',
      'Biru = Open (semua yang belum Selesai). Hijau = Selesai. Tinggi batang gabungan = total temuan regulator itu.',
      'Arahkan kursor ke batang untuk melihat angka per warna. Batang tidak bisa diklik.',
    ],
  },
  unit: {
    apa: 'Jumlah temuan per Unit Kerja, diurutkan dari yang terbanyak.',
    baca: [
      'Sumbu Y: Unit Kerja. Sumbu X: jumlah temuan. Satu batang = total temuan unit itu.',
      'Arahkan kursor untuk melihat Total, Selesai, dan Open unit tersebut.',
      'Batang tidak bisa diklik.',
    ],
  },
  area: {
    apa: 'Pembagian temuan menurut Area Temuan (kategori peraturan). Area yang diketik bebas di luar daftar dihitung sebagai Lainnya.',
    baca: [
      'Tiap irisan adalah satu Area Temuan. Angka di irisan adalah jumlah temuannya.',
      'Makin besar irisan, makin banyak temuan di area itu. Warna hanya pembeda, nama area ada di legenda.',
      'Arahkan kursor ke irisan untuk melihat nama dan jumlahnya. Irisan tidak bisa diklik.',
    ],
  },
  risiko: {
    apa: 'Jumlah temuan per Tingkat Risiko, ditumpuk menurut status temuan (tanpa Dibatalkan).',
    baca: [
      'Sumbu X: Tingkat Risiko (High, Medium, Low). Sumbu Y: jumlah temuan.',
      'Warna = status: biru Open, kuning Proses, ungu Menunggu Validasi, hijau Selesai. Tinggi tumpukan = total temuan pada risiko itu.',
      'Arahkan kursor untuk melihat angka per status. Batang tidak bisa diklik.',
    ],
  },
  lewat: {
    apa: 'Temuan yang belum Selesai dan Batas Waktunya sudah lewat. Grafik mengelompokkan lama keterlambatan, tabel merinci temuannya.',
    baca: [
      'Grafik batang: sumbu X = kelompok lama terlambat dalam hari (1-7, 8-30, 31-90, lebih dari 90). Sumbu Y = jumlah temuan.',
      'Tabel: diurutkan dari yang paling lama terlambat. Kolom Terlambat = jumlah hari lewat Batas Waktu, Kelompok = kelompok pada grafik.',
      'Klik satu baris tabel untuk membuka Detail temuan. Tabel dibagi per 5 baris.',
    ],
  },
  tren: {
    apa: 'Jumlah temuan masuk (menurut bulan Tanggal Temuan) dan temuan selesai (menurut bulan status berubah menjadi Selesai) per bulan. Temuan Dibatalkan tidak dihitung.',
    baca: [
      'Sumbu X: bulan. Sumbu Y: jumlah temuan. Garis biru = temuan masuk. Garis hijau = temuan selesai.',
      'Bila garis hijau di bawah garis biru, temuan masuk lebih cepat daripada yang diselesaikan.',
      'Filter bulan di atas grafik berlaku untuk kartu ini saja (default 12 bulan terakhir) dan tidak ikut Periode Tanggal Temuan.',
      'Arahkan kursor ke titik untuk melihat angka bulan itu.',
    ],
  },
}

const COLORS = ['#1f2ab5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6']
const BUCKETS = [
  { name: '1-7 hari', min: 1, max: 7 },
  { name: '8-30 hari', min: 8, max: 30 },
  { name: '31-90 hari', min: 31, max: 90 },
  { name: '>90 hari', min: 91, max: 99999 },
]
const count = <T,>(arr: T[], key: (x: T) => string) => {
  const m = new Map<string, number>()
  arr.forEach((x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1))
  return m
}
const Card = ({ title, children, className = '', info }: { title: string; children: React.ReactNode; className?: string; info?: ChartInfo }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">{title}{info && <InfoTip info={info} label={title} />}</h3>
    {children}
  </div>
)

const UnitTip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; v: number; selesai: number; open: number } }[] }) => {
  const d = active && payload?.length ? payload[0].payload : null
  return d ? (
    <div className="rounded border border-slate-200 bg-white p-2 text-xs shadow">
      <div className="mb-1 font-semibold text-slate-800">{d.name}</div>
      <div>Total: {d.v}</div><div>Selesai: {d.selesai}</div><div>Open: {d.open}</div>
    </div>
  ) : null
}

export default function Dashboard({ findings, audit, filter, setFilter, onOpen }: { findings: Finding[]; audit: Audit[]; filter: Filter; setFilter: (f: Filter) => void; onOpen: (id: string) => void }) {
  const areas = useApp().store.master.kategoriRegulasi
  const data = useMemo(() => findings.filter((f) => f.status !== 'Dibatalkan' && (!filter.from || f.tglTemuan >= filter.from) && (!filter.to || f.tglTemuan <= filter.to)), [findings, filter.from, filter.to])
  const open = data.filter((f) => f.status !== 'Selesai')
  const done = data.filter((f) => f.status === 'Selesai')
  const overdue = data.filter((f) => lateDays(f) > 0).sort((a, b) => lateDays(b) - lateDays(a))
  const overduePage = useDashPaged(overdue)
  const pct = data.length ? Math.round((done.length / data.length) * 100) : 0

  // CR tracker: BI, PPATK, Komdigi, BSSN, Pemerintah-DPR, Lainnya (teks bebas di luar daftar masuk 'Lainnya')
  const regOf = (f: Finding) => (REGULATORS.includes(f.regulator) ? f.regulator : 'Lainnya')
  const byReg = [...REGULATORS, 'Lainnya'].map((r) => ({ name: r, Open: open.filter((f) => regOf(f) === r).length, Selesai: done.filter((f) => regOf(f) === r).length }))
  const unitM = count(data, (f) => f.unit)
  const byUnit = [...unitM].map(([name, v]) => { const selesai = data.filter((f) => f.unit === name && f.status === 'Selesai').length; return { name, v, selesai, open: v - selesai } }).sort((a, b) => b.v - a.v)
  const byArea = [...count(data, (f) => (areas.includes(f.area) ? f.area : 'Lainnya'))].map(([name, value]) => ({ name, value }))
  const byBucket = BUCKETS.map((b) => ({ name: b.name, v: overdue.filter((f) => lateDays(f) >= b.min && lateDays(f) <= b.max).length }))
  const bucketOf = (f: Finding) => BUCKETS.find((b) => lateDays(f) >= b.min && lateDays(f) <= b.max)?.name
  const byRisk = RISKS.map((r) => {
    const row: Record<string, string | number> = { name: r }
    STATUSES.filter((s) => s !== 'Dibatalkan').forEach((s) => (row[s] = data.filter((f) => f.risiko === r && f.status === s).length))
    return row
  })
  const range = useMonthRange('12') // filter bulan milik kartu ini, independen dari filter halaman
  const trend = useMemo(() => {
    const all = findings.filter((f) => f.status !== 'Dibatalkan')
    const m = new Map<string, { bulan: string; Masuk: number; Selesai: number }>()
    const row = (k: string) => { if (!m.has(k)) m.set(k, { bulan: k, Masuk: 0, Selesai: 0 }); return m.get(k)! }
    all.forEach((f) => {
      row(monthKey(f.tglTemuan)).Masuk++
      if (f.status === 'Selesai') {
        const e = audit.filter((a) => a.fid === f.id && a.kolom === 'Status' && a.baru === 'Selesai').sort((a, b) => b.time.localeCompare(a.time))[0]
        row(monthKey(e?.time ?? f.persetujuanTgl)).Selesai++
      }
    })
    return range.months([...m.keys()]).map((k) => m.get(k) ?? { bulan: k, Masuk: 0, Selesai: 0 })
  }, [findings, audit, range.months]) // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor: Record<string, string> = { Open: '#3b82f6', Proses: '#f59e0b', 'Menunggu Validasi': '#8b5cf6', Selesai: '#10b981' }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <span className="text-xs font-medium text-slate-500">Periode Tanggal Temuan</span>
        <input type="date" className="inp !w-auto" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
        <span>sampai</span>
        <input type="date" className="inp !w-auto" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
        <button className="btn" onClick={() => setFilter({ ...EMPTY_FILTER })}>Reset</button>
        <span className="ml-auto text-xs text-slate-400">{data.length} temuan (tanpa yang dibatalkan)</span>
      </div>

      <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">Ringkasan<InfoTip info={INFO.ringkasan} label="Ringkasan" /></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: 'Open (belum selesai)', v: open.length, red: false, tip: '' },
          { l: 'Selesai', v: done.length, red: false, tip: '' },
          { l: 'Lewat Batas Waktu', v: overdue.length, red: overdue.length > 0, tip: '' },
          { l: '% Selesai', v: `${pct}%`, red: false, tip: `Selesai ${done.length} dari ${data.length} temuan (${pct}%)` },
        ].map((c) => (
          <div key={c.l} title={c.tip || undefined} className={`rounded-lg border p-4 ${c.red ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-white'}`}>
            <div className="text-xs font-medium opacity-80">{c.l}</div>
            <div className="mt-1 text-3xl font-semibold">{c.v}</div>
          </div>
        ))}
      </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Temuan per Regulator" info={INFO.regulator}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byReg}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
              <Bar dataKey="Open" stackId="a" fill="#3b82f6" /><Bar dataKey="Selesai" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Unit Kerja" info={INFO.unit}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byUnit} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" width={170} fontSize={12} /><Tooltip content={<UnitTip />} />
              <Bar dataKey="v" name="Temuan" fill="#1f2ab5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Area" info={INFO.area}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={byArea} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label={(p) => p.value}>
              {byArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Tingkat Risiko (menurut status)" info={INFO.risiko}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byRisk}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
              {STATUSES.filter((s) => s !== 'Dibatalkan').map((s) => <Bar key={s} dataKey={s} stackId="r" fill={statusColor[s]} />)}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Temuan Lewat Batas Waktu" className="border-red-200" info={INFO.lewat}>
        <div className="grid gap-4 lg:grid-cols-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byBucket}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} height={40} label={{ value: 'Hari', position: 'insideBottom', offset: -2, fontSize: 11 }} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
              <Bar dataKey="v" name="Temuan" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto lg:col-span-2">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr>{['No', 'PIC', 'Batas Waktu', 'Terlambat', 'Kelompok', 'Status', 'Risiko'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {overduePage.slice.map((f, i) => (
                  <tr key={f.id} onClick={() => onOpen(f.id)} className="cursor-pointer border-t hover:bg-red-50">
                    <td className="px-2 py-1.5">{overduePage.offset + i + 1}</td><td className="px-2">{f.pic}</td><td className="px-2">{fmtDate(f.dueDate)}</td>
                    <td className="px-2 font-medium text-red-600">{lateDays(f)} hari</td><td className="px-2">{bucketOf(f)}</td><td className="px-2"><StatusBadge s={f.status} /></td><td className="px-2"><RiskBadge r={f.risiko} /></td>
                  </tr>
                ))}
                {!overdue.length && <tr><td colSpan={7} className="p-4 text-center text-slate-400">Tidak ada temuan lewat batas waktu</td></tr>}
              </tbody>
            </table>
            {overduePage.pager}
          </div>
        </div>
      </Card>

      <Card title="Tren Penyelesaian (per bulan)" info={INFO.tren}>
        <div className="mb-3">{range.toolbar}</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bulan" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
            <Line type="monotone" dataKey="Masuk" name="Temuan masuk" stroke="#1f2ab5" strokeWidth={2} /><Line type="monotone" dataKey="Selesai" name="Temuan selesai" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
