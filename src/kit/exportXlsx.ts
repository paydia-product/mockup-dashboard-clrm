import * as XLSX from 'xlsx'
import { fmtTimeSec } from '../lib'
import { fmtValue, isMasked, maskStr } from './fmt'
import type { BaseRec, Ctx, PageConfig } from './types'

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
export function downloadXlsx(file: string, sheet: string, data: R[], extra?: { sheet: string; data: R[] }) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheet.slice(0, 31))
  if (extra) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(extra.data), extra.sheet.slice(0, 31))
  XLSX.writeFile(wb, file)
}
// Semua kolom Detail (kecuali noExport), nilai tersamar mengikuti mask, file = nama file, angka tetap angka
export function exportRows<T extends BaseRec>(cfg: PageConfig<T>, rows: T[], c: Ctx, today: string) {
  // ponytail: urutan sama dengan DataTable (Tanggal Dibuat terbaru dulu); Nomor = posisi baris, bukan r.no
  const sorted = [...rows].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.no - a.no)
  const data = sorted.map((r, i) => {
    const o: R = { Nomor: i + 1, 'Tanggal Dibuat': fmtTimeSec(r.createdAt) }
    for (const f of cfg.fields) {
      if (f.key === 'no' || f.noExport || (f.showIf && !f.showIf(r))) continue
      const v = f.auto ? f.auto(r, c) : (r as R)[f.key]
      o[f.label] = isMasked(f, c) && v ? maskStr(String(v)) : ['number', 'money', 'percent'].includes(f.type) && typeof v === 'number' ? v : fmtValue(f, v, c)
    }
    return o
  })
  downloadXlsx(`${cfg.exportPrefix}_${today}.xlsx`, cfg.title, data)
  return data.length
}
