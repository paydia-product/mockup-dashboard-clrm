import { fmtDate, fmtTime } from '../lib'
import { Badge, Tone } from '../ui'
import type { Ctx, Field } from './types'

// Samarkan teks: "Budi Santoso" -> "B*** S******"
export const maskStr = (s: string) => s.split(' ').map((w) => (w ? w[0] + '*'.repeat(Math.max(2, w.length - 1)) : w)).join(' ')
export const isMasked = (f: Field<any>, c: Ctx) => !!f.mask?.(c) // eslint-disable-line @typescript-eslint/no-explicit-any
export const fmtMoney = (n: number | string) => `Rp ${Number(n).toLocaleString('id-ID')}`

// Teks tampilan satu nilai field (detail ringkas, log approval, export non-numerik)
export function fmtValue(f: Field<any>, v: unknown, c: Ctx): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (v === undefined || v === null || v === '') return ''
  if (isMasked(f, c)) return maskStr(String(v))
  switch (f.type) {
    case 'date': return fmtDate(String(v))
    case 'datetime': return fmtTime(String(v).replace(' ', 'T'))
    case 'money': return fmtMoney(v as number)
    case 'percent': return `${v}%`
    case 'multiselect': return (v as string[]).join(', ')
    case 'multidrop': return (v as string[]).join('; ') // label dapat memuat koma
    case 'file': return (v as { name: string }).name
    case 'checklist': return (f.sub ?? []).filter((s) => (v as Record<string, boolean>)[s.key]).map((s) => s.label).join(', ')
    case 'list': return (v as Record<string, unknown>[]).map((it) => (f.sub ?? []).map((s) => fmtValue(s, it[s.key], c)).filter(Boolean).join(' | ')).join('; ')
    default: return String(v)
  }
}

const TONES: [RegExp, Tone][] = [
  [/^(selesai|aktif|disetujui|closed|done|tepat waktu|direkomendasikan|terkirim|diperpanjang|valid|comply|berlaku)$/i, 'green'],
  [/^(proses|review|dalam |disusun|partial|akan berakhir|menunggu|belum disiapkan|diubah|perlu)/i, 'yellow'],
  [/^(baru|open|draft|active|rencana|eksisting)$/i, 'blue'],
  [/(terlambat|expired|kedaluwarsa|gap|melewati|tidak direkomendasikan|ditolak|lewat)/i, 'red'],
]
export const statusTone = (s: string): Tone => TONES.find(([re]) => re.test(s))?.[1] ?? 'gray'
export const StatusPill = ({ s, tone }: { s: string; tone?: Tone }) => (s ? <Badge tone={tone ?? statusTone(s)}>{s}</Badge> : <span className="text-slate-300">-</span>)
