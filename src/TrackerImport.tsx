import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload } from 'lucide-react'
import { AREAS, Finding, REGULATORS, RISKS, ROOT_TYPES, UNITS } from './lib'
import { downloadXlsx } from './kit/exportXlsx'
import { realDate, toDate } from './kit/ImportExcel'
import { validate } from './Form'
import { Modal } from './ui'

type R = Record<string, unknown>
const STATUS_ADD = ['Open', 'Proses', 'Menunggu Validasi']
// kolom template: tanpa kolom otomatis (Nomor, Validasi, Persetujuan) dan tanpa kolom file
const COLS: { k: keyof Finding; l: string; opts?: string[]; date?: boolean }[] = [
  { k: 'regulator', l: 'Regulator', opts: REGULATORS }, { k: 'tglTemuan', l: 'Tanggal Temuan', date: true }, { k: 'area', l: 'Area Temuan', opts: AREAS },
  { k: 'rootCause', l: 'Penyebab Utama (Root Cause)' }, { k: 'rootType', l: 'Jenis Penyebab', opts: ROOT_TYPES }, { k: 'pic', l: 'PIC' },
  { k: 'dueDate', l: 'Batas Waktu', date: true }, { k: 'status', l: 'Status', opts: STATUS_ADD }, { k: 'unit', l: 'Unit Kerja', opts: UNITS },
  { k: 'risiko', l: 'Tingkat Risiko', opts: [...RISKS] }, { k: 'tindak', l: 'Rencana Tindak Lanjut' },
]

export default function TrackerImport({ blank, onImport, onClose }: { blank: () => Finding; onImport: (rows: Finding[]) => void; onClose: () => void }) {
  const [parsed, setParsed] = useState<{ raw: R; rec: Finding; errs: string[] }[] | null>(null)
  const [msg, setMsg] = useState('')
  const template = () => downloadXlsx('Template_Temuan_Regulator.xlsx', 'Data', [Object.fromEntries(COLS.map((c) => [c.l, '']))], {
    sheet: 'Petunjuk', data: COLS.map((c) => ({ Kolom: c.l, Pilihan: c.opts?.join(' ; ') ?? '', Catatan: c.date ? 'YYYY-MM-DD' : '' })),
  })
  const read = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const rows = XLSX.utils.sheet_to_json<R>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
      setMsg(rows.length ? '' : 'File kosong')
      setParsed(rows.map((raw) => {
        const rec = blank() as unknown as Record<string, unknown>
        const errs: string[] = [], convBad: string[] = []
        COLS.forEach((c) => {
          const v = raw[c.l]
          if (v === undefined || String(v).trim() === '') return
          if (c.date) { const d = toDate(v); const iso = /^\d{4}-\d{2}-\d{2}$/.test(d); if (iso && realDate(d)) rec[c.k] = d; else { convBad.push(c.k); errs.push(iso ? `${c.l}: format tanggal tidak valid` : `${c.l}: format tanggal harus YYYY-MM-DD`) } }
          else if (c.opts) { const o = c.opts.find((x) => x.toLowerCase() === String(v).trim().toLowerCase()); if (o) rec[c.k] = o; else convBad.push(c.k), errs.push(`${c.l}: "${String(v)}" tidak ada dalam pilihan`) }
          else rec[c.k] = String(v).trim()
        })
        { const e = validate(rec as unknown as Finding) as Record<string, string>; delete e.tindakFile; delete e.suratFile; convBad.forEach((k) => delete e[k]); errs.push(...Object.values(e)) } // file diisi belakangan lewat Edit
        return { raw, rec: rec as unknown as Finding, errs }
      }))
    } catch { setMsg('File tidak bisa dibaca. Pakai file .xlsx dari template.'); setParsed(null) }
  }
  const good = parsed?.filter((p) => !p.errs.length) ?? []
  const bad = parsed?.filter((p) => p.errs.length) ?? []
  const dlBad = () => downloadXlsx('Gagal_Impor_Temuan_Regulator.xlsx', 'Gagal', bad.map((p) => ({ ...p.raw, 'Alasan gagal': p.errs.join('; ') })))
  const peek = COLS.slice(0, 4)
  return (
    <Modal wide title="Import Excel: Temuan Regulator" onClose={onClose}>
      <p className="text-xs text-slate-500">Unduh template, isi, lalu unggah. Kolom file tidak ikut diimpor dan dapat diisi lewat Edit. Nomor terisi otomatis.</p>
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
              <thead className="bg-slate-100"><tr><th className="px-2 py-1.5">#</th>{peek.map((c) => <th key={c.k} className="px-2 py-1.5">{c.l}</th>)}<th className="px-2 py-1.5">Validasi</th></tr></thead>
              <tbody>{parsed.map((p, i) => (
                <tr key={i} className="border-t align-top"><td className="px-2 py-1.5">{i + 1}</td>{peek.map((c) => <td key={c.k} className="px-2 py-1.5">{String(p.raw[c.l] ?? '')}</td>)}
                  <td className={`px-2 py-1.5 ${p.errs.length ? 'text-red-600' : 'text-green-600'}`}>{p.errs.length ? p.errs.join('; ') : 'OK'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {bad.length > 0 && <button className="btn" onClick={dlBad}><Download size={14} />Unduh baris gagal</button>}
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={!good.length} onClick={() => { onImport(good.map((p) => p.rec)); onClose() }}>Impor {good.length} baris valid</button>
      </div>
    </Modal>
  )
}
