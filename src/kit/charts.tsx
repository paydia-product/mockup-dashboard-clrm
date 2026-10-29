import { ReactNode, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, fmtDate, todayStr } from '../lib'
import type { Tone } from '../ui'

export const PALETTE = ['#1f2ab5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']
export const TONE_HEX: Record<Tone, string> = { red: '#ef4444', yellow: '#f59e0b', green: '#10b981', blue: '#3b82f6', gray: '#94a3b8' }
const TILE: Record<Tone, string> = { red: 'border-l-red-500 text-red-600', yellow: 'border-l-yellow-400 text-yellow-700', green: 'border-l-green-500 text-green-600', blue: 'border-l-blue-500 text-blue-600', gray: 'border-l-slate-300 text-slate-700' }
type Row = Record<string, string | number>
type Colors = string[] | Record<string, string>
const colorOf = (colors: Colors | undefined, key: string, i: number) => (Array.isArray(colors) ? colors[i] : colors?.[key]) ?? PALETTE[i % PALETTE.length]

export const Card = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
    {title && <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>}
    {children}
  </div>
)
const Empty = () => <div className="py-10 text-center text-xs text-slate-400">Tidak ada data</div>
const hasData = (data: Row[], keys: string[]) => data.some((d) => keys.some((k) => Number(d[k]) > 0))

export function StatCards({ items }: { items: { label: string; value: string | number; tone?: Tone; onClick?: () => void }[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 6)}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <div key={it.label} onClick={it.onClick} className={`rounded-lg border border-l-4 border-slate-200 bg-white p-4 ${TILE[it.tone ?? 'gray']} ${it.onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
          <div className="text-xs text-slate-500">{it.label}</div>
          <div className="mt-1 text-2xl font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  )
}

// data: [{ name, <key1>, <key2> ... }]; cellColors mewarnai tiap batang (hanya untuk satu seri)
export function BarCard({ title, data, keys, stacked, horizontal, colors, cellColors, xKey = 'name', onClick, height = 240, className, tip }: {
  title: string; data: Row[]; keys: string[]; stacked?: boolean; horizontal?: boolean; colors?: Colors; cellColors?: string[]; xKey?: string; tip?: (row: Row) => ReactNode
  onClick?: (row: Row, key: string) => void; height?: number; className?: string
}) {
  return (
    <Card title={title} className={className}>
      {!hasData(data, keys) ? <Empty /> : (
        <ResponsiveContainer width="100%" height={horizontal ? Math.max(height, data.length * 28 + 40) : height}>
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 20 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
            {horizontal ? <><XAxis type="number" allowDecimals={false} fontSize={11} /><YAxis type="category" dataKey={xKey} width={110} fontSize={11} /></> : <><XAxis dataKey={xKey} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /></>}
            {tip ? <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="rounded border border-slate-200 bg-white p-2 text-xs shadow">{tip(payload[0].payload as Row)}</div> : null)} /> : <Tooltip />}
            {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} stackId={stacked ? 's' : undefined} fill={colorOf(colors, k, i)} cursor={onClick ? 'pointer' : undefined} onClick={onClick ? (d) => onClick(d.payload as Row, k) : undefined}>
                {cellColors && keys.length === 1 && data.map((_, j) => <Cell key={j} fill={cellColors[j % cellColors.length]} />)}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

export function DonutCard({ title, data, onClick, className }: { title: string; data: { name: string; value: number; color?: string }[]; onClick?: (name: string) => void; className?: string }) {
  const d = data.filter((x) => x.value > 0)
  return (
    <Card title={title} className={className}>
      {!d.length ? <Empty /> : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={d} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2} cursor={onClick ? 'pointer' : undefined} onClick={onClick ? (e) => onClick(e.name) : undefined}>
              {d.map((x, i) => <Cell key={x.name} fill={x.color ?? PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

export function LineCard({ title, data, keys, colors, xKey = 'name', height = 240, className }: { title: string; data: Row[]; keys: string[]; colors?: Colors; xKey?: string; height?: number; className?: string }) {
  return (
    <Card title={title} className={className}>
      {!hasData(data, keys) ? <Empty /> : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" /><XAxis dataKey={xKey} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip />
            {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={colorOf(colors, k, i)} strokeWidth={2} dot={{ r: 3 }} />)}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

export function ComboCard({ title, data, bars, lines, colors, xKey = 'name', height = 260, className }: { title: string; data: Row[]; bars: string[]; lines: string[]; colors?: Colors; xKey?: string; height?: number; className?: string }) {
  const all = [...bars, ...lines]
  return (
    <Card title={title} className={className}>
      {!hasData(data, all) ? <Empty /> : (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" /><XAxis dataKey={xKey} fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
            {bars.map((k, i) => <Bar key={k} dataKey={k} fill={colorOf(colors, k, i)} />)}
            {lines.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={colorOf(colors, k, bars.length + i)} strokeWidth={2} />)}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

export function MiniTable<T>({ title, cols, rows, onRow, empty = 'Tidak ada data', className }: { title?: string; cols: { label: string; get: (r: T) => ReactNode }[]; rows: T[]; onRow?: (r: T) => void; empty?: string; className?: string }) {
  const body = (
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-600"><tr>{cols.map((c) => <th key={c.label} className="px-2.5 py-2 font-semibold">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i} onClick={onRow ? () => onRow(r) : undefined} className={`border-t ${onRow ? 'cursor-pointer hover:bg-slate-50' : ''}`}>{cols.map((c) => <td key={c.label} className="px-2.5 py-2">{c.get(r)}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={cols.length} className="p-6 text-center text-slate-400">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
  return title ? <Card title={title} className={className}>{body}</Card> : body
}

// Kalender: tampilan hari/minggu/bulan, titik berwarna per event
type View = 'hari' | 'minggu' | 'bulan'
// rangeDays: tampilan rentang tetap mulai hari ini (tanpa paging), mis. 30 hari ke depan
export function CalendarCard({ title, events, views = ['bulan'], onEvent, className, rangeDays }: { title: string; events: { date: string; label: string; tone: Tone; id?: string }[]; views?: View[]; onEvent?: (id: string) => void; className?: string; rangeDays?: number }) {
  const [view, setView] = useState<View>(views[0])
  const [anchor, setAnchor] = useState(todayStr)
  const dayOf = (s: string) => new Date(s + 'T00:00:00').getDay()
  const move = (n: number) => {
    const d = new Date(anchor + 'T00:00:00')
    if (view === 'bulan') d.setMonth(d.getMonth() + n); else d.setDate(d.getDate() + n * (view === 'minggu' ? 7 : 1))
    setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const first = rangeDays ? anchor : view === 'bulan' ? addDays(anchor.slice(0, 8) + '01', -dayOf(anchor.slice(0, 8) + '01')) : view === 'minggu' ? addDays(anchor, -dayOf(anchor)) : anchor
  const n = rangeDays ?? (view === 'bulan' ? 42 : view === 'minggu' ? 7 : 1)
  const days = Array.from({ length: n }, (_, i) => addDays(first, i))
  const pad = rangeDays ? dayOf(first) : 0
  const today = todayStr()
  const ev = (d: string) => events.filter((e) => e.date.slice(0, 10) === d)
  const head = rangeDays ? `${fmtDate(days[0])} - ${fmtDate(days[n - 1])}` : view === 'bulan' ? new Date(anchor + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : view === 'minggu' ? `${fmtDate(days[0])} - ${fmtDate(days[6])}` : fmtDate(anchor)
  return (
    <Card title={title} className={className}>
      <div className="mb-2 flex items-center gap-2 text-xs">
        {!rangeDays && <button className="btn !px-1.5 !py-1" onClick={() => move(-1)} aria-label="Sebelumnya"><ChevronLeft size={14} /></button>}
        <span className="min-w-[130px] text-center font-medium capitalize">{head}</span>
        {!rangeDays && <button className="btn !px-1.5 !py-1" onClick={() => move(1)} aria-label="Berikutnya"><ChevronRight size={14} /></button>}
        {!rangeDays && views.length > 1 && <div className="ml-auto flex gap-1">{views.map((v) => <button key={v} className={`btn !px-2 !py-1 capitalize ${v === view ? '!border-brand !bg-brand !text-white' : ''}`} onClick={() => setView(v)}>{v}</button>)}</div>}
      </div>
      <div className={view === 'hari' && !rangeDays ? '' : 'grid grid-cols-7 gap-px rounded border bg-slate-200 text-[11px]'}>
        {(view === 'bulan' || !!rangeDays) && ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => <div key={d} className="bg-slate-100 p-1 text-center font-semibold text-slate-500">{d}</div>)}
        {Array.from({ length: pad }, (_, i) => <div key={`p${i}`} className="bg-slate-50" />)}
        {days.map((d) => (
          <div key={d} className={`p-1 ${d === today ? 'bg-blue-100 ring-1 ring-inset ring-blue-500' : 'bg-white'} ${view === 'bulan' || rangeDays ? 'min-h-[64px]' : 'min-h-[90px]'} ${view === 'bulan' && !rangeDays && d.slice(5, 7) !== anchor.slice(5, 7) ? 'opacity-40' : ''}`}>
            <div className={d === today ? 'font-bold text-blue-600' : 'text-slate-400'}>{view === 'bulan' || rangeDays ? `${Number(d.slice(8))}${rangeDays && (d === first || d.slice(8) === '01') ? ' ' + new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' }) : ''}` : fmtDate(d)}</div>
            {ev(d).slice(0, view === 'bulan' || rangeDays ? 3 : 20).map((e, i) => (
              <div key={i} title={e.label} onClick={e.id && onEvent ? () => onEvent(e.id!) : undefined} className={`mt-0.5 flex items-center gap-1 truncate ${e.id && onEvent ? 'cursor-pointer' : ''}`}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TONE_HEX[e.tone] }} /><span className="truncate">{e.label}</span>
              </div>
            ))}
            {(view === 'bulan' || !!rangeDays) && ev(d).length > 3 && <div className="text-slate-400">+{ev(d).length - 3} lagi</div>}
          </div>
        ))}
      </div>
    </Card>
  )
}
