import { diffDays } from '../lib'

export { iso, todayStr, nowStr, addDays, diffDays, fmtDate, fmtTime } from '../lib'
const dow = (s: string) => new Date(s.slice(0, 10) + 'T00:00:00').getDay()
const step = (s: string, n: number) => { const d = new Date(s.slice(0, 10) + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
// Hari kerja = Senin-Jumat, tanpa libur nasional (asumsi A5)
export function addWorkDays(d: string, n: number): string {
  let cur = d.slice(0, 10), left = Math.abs(n)
  const s = n < 0 ? -1 : 1
  while (left > 0) { cur = step(cur, s); if (dow(cur) !== 0 && dow(cur) !== 6) left-- }
  return cur
}
// Jumlah hari kerja di (a, b]; negatif kalau b sebelum a
export function workDaysBetween(a: string, b: string): number {
  if (a.slice(0, 10) === b.slice(0, 10)) return 0
  if (b < a) return -workDaysBetween(b, a)
  let n = 0, cur = a.slice(0, 10)
  const end = b.slice(0, 10)
  while (cur < end) { cur = step(cur, 1); if (dow(cur) !== 0 && dow(cur) !== 6) n++ }
  return n
}
export const monthKey = (d: string) => d.slice(0, 7)
// edges [7,14,30] -> '0-7' | '8-14' | '15-30' | '>30'
export function ageBucket(days: number, edges: number[]): string {
  for (let i = 0; i < edges.length; i++) if (days <= edges[i]) return `${i === 0 ? 0 : edges[i - 1] + 1}-${edges[i]}`
  return `>${edges[edges.length - 1]}`
}
export const ageBuckets = (edges: number[]) => [...edges.map((e, i) => `${i === 0 ? 0 : edges[i - 1] + 1}-${e}`), `>${edges[edges.length - 1]}`]
export const daysSince = (d: string, today: string) => diffDays(today, d)
