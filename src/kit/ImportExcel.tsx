import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload } from 'lucide-react'
import { Modal } from '../ui'
import { downloadXlsx } from './exportXlsx'
import { fieldsFor, isReq, numericOpts, validateRecord } from './FormModal'
import type { BaseRec, Ctx, Field, ModuleApi, PageConfig } from './types'

type R = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const SKIP = ['file', 'list', 'checklist', 'multidrop']
const optsOf = (f: Field<any>, c: Ctx) => { const o = f.importOptions ?? f.options; return f.type === 'yesno' ? ['Ya', 'Tidak'] : typeof o === 'function' ? o(c) : o ?? [] } // eslint-disable-line @typescript-eslint/no-explicit-any
export const importFields = <T extends BaseRec>(cfg: PageConfig<T>) => fieldsFor(cfg, 'add').filter((f) => !f.noImport && !SKIP.includes(f.type))

export function toDate(raw: unknown): string {
  if (raw instanceof Date) return new Date(raw.getTime() + 43200000).toISOString().slice(0, 10) // toleransi zona waktu SheetJS
  const s = String(raw).trim()
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s.slice(0, 10)
}
// Tanggal kalender nyata: bulan 1-12, hari 1..jumlah hari bulan itu (tahun kabisat dihitung)
export const realDate = (d: string) => { const [y, mo, dd] = d.split('-').map(Number); return mo >= 1 && mo <= 12 && dd >= 1 && dd <= new Date(y, mo, 0).getDate() }
// Teks angka ketat: "Rp 1.000.000", "1,000,000", "12,5" diterima; teks lain jadi NaN (bukan 0). Sel angka Excel dipakai apa adanya.
function toNum(raw: unknown, s: string, percent: boolean): number {
  if (typeof raw === 'number') return raw
  let t = s.replace(/^Rp\.?/i, '').replace(/\s/g, '')
  if (!/^-?[\d.,]+$/.test(t) || !/\d/.test(t)) return NaN
  const d = t.lastIndexOf('.'), k = t.lastIndexOf(',')
  if (d >= 0 && k >= 0) t = d > k ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.')
  else if (!percent && /^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  else if (!percent && /^-?\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, '')
  else t = t.replace(',', '.')
  return Number(t)
}
function conv(f: Field<any>, raw: unknown, c: Ctx): { v: unknown; err?: string } { // eslint-disable-line @typescript-eslint/no-explicit-any
  const s = raw instanceof Date ? '1' : String(raw ?? '').trim()
  if (!s) return { v: f.type === 'multiselect' ? [] : '' }
  if (['number', 'money', 'percent'].includes(f.type)) { const n = raw instanceof Date ? NaN : toNum(raw, s, f.type === 'percent'); return isNaN(n) ? { v: '', err: `${f.label}: bukan angka` } : { v: n } }
  if (f.type === 'date') { const d = toDate(raw); if (/^\d{4}-\d{2}-\d{2}$/.test(d) && !realDate(d)) return { v: '', err: `${f.label}: format tanggal tidak valid` }; return /^\d{4}-\d{2}-\d{2}$/.test(d) ? { v: d } : { v: '', err: `${f.label}: format tanggal harus YYYY-MM-DD` } }
  if (f.type === 'datetime') { const d = raw instanceof Date ? new Date(raw.getTime() + 43200000).toISOString().slice(0, 10) + 'T00:00' : s.replace(' ', 'T').slice(0, 16); if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d) && !realDate(d.slice(0, 10))) return { v: '', err: `${f.label}: format tanggal tidak valid` }; return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d) ? { v: d } : { v: '', err: `${f.label}: format harus YYYY-MM-DD HH:mm` } }
  if (f.type === 'select' || f.type === 'yesno') { const o = optsOf(f, c).find((x) => x.toLowerCase() === s.toLowerCase()); return o ? { v: numericOpts(optsOf(f, c)) ? Number(o) : o } : { v: '', err: `${f.label}: "${s}" tidak ada dalam pilihan` } }
  if (f.type === 'multiselect') {
    const parts = s.split(/[;,]/).map((x) => x.trim()).filter(Boolean), o = optsOf(f, c)
    const bad = parts.filter((p) => !o.some((x) => x.toLowerCase() === p.toLowerCase()))
    return bad.length ? { v: [], err: `${f.label}: "${bad.join(', ')}" tidak ada dalam pilihan` } : { v: parts.map((p) => o.find((x) => x.toLowerCase() === p.toLowerCase())!) }
  }
  return { v: s }
}

export default function ImportExcel<T extends BaseRec>({ cfg, c, api, onDone, onClose }: { cfg: PageConfig<T>; c: Ctx; api: ModuleApi<T>; onDone: (ok: number, fail: number) => void; onClose: () => void }) {
  const cols = importFields(cfg)
  const [parsed, setParsed] = useState<{ raw: R; rec: R; errs: string[] }[] | null>(null)
  const [msg, setMsg] = useState('')
  const template = () => downloadXlsx(`Template_${cfg.exportPrefix}.xlsx`, 'Data', [Object.fromEntries(cols.map((f) => [f.label, '']))], {
    sheet: 'Petunjuk', data: cols.map((f) => ({ Kolom: f.label, Tipe: f.type, Wajib: f.required ? (typeof f.required === 'function' ? 'Kondisional' : 'Ya') : 'Tidak', Pilihan: optsOf(f, c).join(' ; '), Catatan: f.type === 'date' ? 'YYYY-MM-DD' : f.type === 'datetime' ? 'YYYY-MM-DD HH:mm' : f.type === 'multiselect' ? 'Pisahkan dengan titik koma' : '' })),
  })
  const read = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const rows = XLSX.utils.sheet_to_json<R>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
      setMsg(rows.length ? '' : 'File kosong')
      setParsed(rows.map((raw) => {
        const rec: R = { ...cfg.blank() }
        const errs: string[] = []
        cols.forEach((f) => {
          if (raw[f.label] !== undefined && String(raw[f.label]).trim() !== '') { const x = conv(f, raw[f.label], c); rec[f.key] = x.v; if (x.err) errs.push(x.err) }
          // kolom yang dilonggarkan khusus import dan dikosongkan di file: jangan terisi default blank() (mis. Status 'Aktif')
          else if (typeof f.required === 'function' && isReq(f, rec, c, 'add') && !isReq(f, rec, c, 'import')) rec[f.key] = f.type === 'multiselect' ? [] : ''
        })
        // kolom yang gagal konversi tidak divalidasi ulang (hindari pesan ganda); sisanya tetap dicek agar semua kesalahan baris tampil
        const convBad = cols.filter((f) => errs.some((m) => m.startsWith(`${f.label}:`))).map((f) => f.key)
        errs.push(...Object.values(validateRecord(cfg, rec, 'add', c, true, convBad, true)))
        return { raw, rec, errs }
      }))
    } catch { setMsg('File tidak bisa dibaca. Pakai file .xlsx dari template.'); setParsed(null) }
  }
  const good = parsed?.filter((p) => !p.errs.length) ?? []
  const bad = parsed?.filter((p) => p.errs.length) ?? []
  const commit = () => { good.forEach((p) => api.add(p.rec as never, true)); onDone(good.length, bad.length); onClose() }
  const dlBad = () => downloadXlsx(`Gagal_Impor_${cfg.exportPrefix}.xlsx`, 'Gagal', bad.map((p) => ({ ...p.raw, 'Alasan gagal': p.errs.join('; ') })))
  const peek = cols.slice(0, 4)
  return (
    <Modal wide title={`Import Excel: ${cfg.title}`} onClose={onClose}>
      <p className="text-xs text-slate-500">Unduh template, isi, lalu unggah. Kolom file tidak ikut diimpor. Nomor terisi otomatis.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn" onClick={template}><Download size={14} />Unduh template</button>
        <label className="btn cursor-pointer"><Upload size={14} />Unggah file .xlsx<input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = '' }} /></label>
      </div>
      {msg && <p className="err">{msg}</p>}
      {parsed && (
        <div className="mt-4">
          <div className="mb-2 text-xs"><b>{good.length}</b> baris valid, <b className="text-red-600">{bad.length}</b> baris gagal</div>
          <div className="max-h-72 overflow-auto rounded border">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100"><tr><th className="px-2 py-1.5">#</th>{peek.map((f) => <th key={f.key} className="px-2 py-1.5">{f.label}</th>)}<th className="px-2 py-1.5">Validasi</th></tr></thead>
              <tbody>{parsed.map((p, i) => (
                <tr key={i} className="border-t align-top"><td className="px-2 py-1.5">{i + 1}</td>{peek.map((f) => <td key={f.key} className="px-2 py-1.5">{p.raw[f.label] instanceof Date ? toDate(p.raw[f.label]) : String(p.raw[f.label] ?? '')}</td>)}
                  <td className={`px-2 py-1.5 ${p.errs.length ? 'text-red-600' : 'text-green-600'}`}>{p.errs.length ? p.errs.join('; ') : 'OK'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {bad.length > 0 && <button className="btn" onClick={dlBad}><Download size={14} />Unduh baris gagal</button>}
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={!good.length} onClick={commit}>Impor {good.length} baris valid</button>
      </div>
    </Modal>
  )
}
