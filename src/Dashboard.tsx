import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Audit, EMPTY_FILTER, Filter, Finding, REGULATORS, RISKS, STATUSES, fmtDate, lateDays, userName } from './lib'
import { RiskBadge, StatusBadge } from './ui'

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
const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
    <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
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
  const data = useMemo(() => findings.filter((f) => f.status !== 'Dibatalkan' && (!filter.from || f.tglTemuan >= filter.from) && (!filter.to || f.tglTemuan <= filter.to)), [findings, filter.from, filter.to])
  const open = data.filter((f) => f.status !== 'Selesai')
  const done = data.filter((f) => f.status === 'Selesai')
  const overdue = data.filter((f) => lateDays(f) > 0).sort((a, b) => lateDays(b) - lateDays(a))
  const pct = data.length ? Math.round((done.length / data.length) * 100) : 0

  const byReg = REGULATORS.map((r) => ({ name: r, Open: open.filter((f) => f.regulator === r).length, Selesai: done.filter((f) => f.regulator === r).length }))
  const unitM = count(data, (f) => f.unit)
  const byUnit = [...unitM].map(([name, v]) => { const selesai = data.filter((f) => f.unit === name && f.status === 'Selesai').length; return { name, v, selesai, open: v - selesai } }).sort((a, b) => b.v - a.v)
  const byArea = [...count(data, (f) => f.area)].map(([name, value]) => ({ name, value }))
  const byBucket = BUCKETS.map((b) => ({ name: b.name, v: overdue.filter((f) => lateDays(f) >= b.min && lateDays(f) <= b.max).length }))
  const bucketOf = (f: Finding) => BUCKETS.find((b) => lateDays(f) >= b.min && lateDays(f) <= b.max)?.name
  const byRisk = RISKS.map((r) => {
    const row: Record<string, string | number> = { name: r }
    STATUSES.filter((s) => s !== 'Dibatalkan').forEach((s) => (row[s] = data.filter((f) => f.risiko === r && f.status === s).length))
    return row
  })
  const trend = useMemo(() => {
    const m = new Map<string, { bulan: string; Masuk: number; Selesai: number }>()
    const row = (k: string) => { if (!m.has(k)) m.set(k, { bulan: k, Masuk: 0, Selesai: 0 }); return m.get(k)! }
    data.forEach((f) => {
      row(f.tglTemuan.slice(0, 7)).Masuk++
      if (f.status === 'Selesai') {
        const e = audit.filter((a) => a.fid === f.id && a.kolom === 'Status' && a.baru === 'Selesai').sort((a, b) => b.time.localeCompare(a.time))[0]
        row((e?.time ?? f.persetujuanTgl).slice(0, 7)).Selesai++
      }
    })
    return [...m.values()].sort((a, b) => a.bulan.localeCompare(b.bulan))
  }, [data, audit])

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: 'Open (belum selesai)', v: open.length, red: false },
          { l: 'Selesai', v: done.length, red: false },
          { l: 'Lewat Batas Waktu', v: overdue.length, red: overdue.length > 0 },
          { l: '% Selesai', v: `${pct}%`, red: false },
        ].map((c) => (
          <div key={c.l} className={`rounded-lg border p-4 ${c.red ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-white'}`}>
            <div className="text-xs font-medium opacity-80">{c.l}</div>
            <div className="mt-1 text-3xl font-semibold">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Temuan per Regulator">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byReg}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
              <Bar dataKey="Open" stackId="a" fill="#3b82f6" /><Bar dataKey="Selesai" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Unit Kerja">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byUnit} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" width={130} fontSize={12} /><Tooltip content={<UnitTip />} />
              <Bar dataKey="v" name="Temuan" fill="#1f2ab5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Area">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={byArea} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label={(p) => p.value}>
              {byArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Temuan per Tingkat Risiko (menurut status)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byRisk}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
              {STATUSES.filter((s) => s !== 'Dibatalkan').map((s) => <Bar key={s} dataKey={s} stackId="r" fill={statusColor[s]} />)}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Temuan Lewat Batas Waktu" className="border-red-200">
        <div className="grid gap-4 lg:grid-cols-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byBucket}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
              <Bar dataKey="v" name="Temuan" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
          <div className="max-h-[220px] overflow-auto lg:col-span-2">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr>{['Nomor', 'PIC', 'Batas Waktu', 'Terlambat', 'Kelompok', 'Status', 'Risiko'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {overdue.map((f) => (
                  <tr key={f.id} onClick={() => onOpen(f.id)} className="cursor-pointer border-t hover:bg-red-50">
                    <td className="px-2 py-1.5 font-medium text-brand">{f.no}</td><td className="px-2">{userName(f.pic)}</td><td className="px-2">{fmtDate(f.dueDate)}</td>
                    <td className="px-2 font-medium text-red-600">{lateDays(f)} hari</td><td className="px-2">{bucketOf(f)}</td><td className="px-2"><StatusBadge s={f.status} /></td><td className="px-2"><RiskBadge r={f.risiko} /></td>
                  </tr>
                ))}
                {!overdue.length && <tr><td colSpan={7} className="p-4 text-center text-slate-400">Tidak ada temuan lewat batas waktu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="Tren Penyelesaian (per bulan)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bulan" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend />
            <Line type="monotone" dataKey="Masuk" name="Temuan masuk" stroke="#1f2ab5" strokeWidth={2} /><Line type="monotone" dataKey="Selesai" name="Temuan selesai" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
