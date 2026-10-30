import { DB, Finding, createdOf, fmtDate, fmtTimeSec } from '../lib'
import { Badge, Tone } from '../ui'
import type { BaseRec, ModuleId, Store } from './types'

// Log Perubahan di modal Detail. Dibangun dari data yang sudah tersimpan:
// kit = store.log (entri terstruktur: recordId, kind, changes, by, time) + store.approvals; tracker = db.audit + db.requests.
// ponytail: riwayat sebelum versi ini mungkin tidak lengkap. Entri log lama tanpa struktur ditampilkan sebagai teks;
// perubahan yang dulu dicatat per kolom tidak digabung, dan "Data dibuat" diambil dari createdAt/createdBy record.
export interface HItem { key: string; time: string; title: string; tone: Tone; by: string; requester?: string; approver?: string; lines?: { label: string; before: string; after: string }[]; note?: string; noteLabel?: string; text?: string }

const dash = (s: string | undefined) => (s && s.trim() ? s : '-')
// ponytail: tanggal ISO murni (entri lama tersimpan ISO) diformat saat tampil
const dmy = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? fmtDate(s.trim()) : dash(s))
const LEGACY_SKIP = ['Tambah', 'Ajukan approval', 'Approve', 'Reject', 'Import', 'Export'] // Tambah = Data dibuat (dari record); approval dari store.approvals

export function kitHistory(r: BaseRec, moduleId: ModuleId, title: string, store: Store): HItem[] {
  const out: HItem[] = [{ key: 'created', time: r.createdAt, title: 'Data dibuat', tone: 'blue', by: r.createdBy || '-' }]
  const kindTitle: Record<string, [string, Tone]> = { edit: ['Perubahan data', 'gray'], cancel: ['Dibatalkan', 'red'], restore: ['Dikembalikan', 'green'] }
  for (const l of [...store.log].reverse()) { // log tersimpan terbaru di depan; balik agar kronologis
    if (l.recordId === r.id && l.kind && kindTitle[l.kind]) {
      const [t, tone] = kindTitle[l.kind]
      out.push({ key: l.id, time: l.time, title: t, tone, by: l.user, lines: l.changes, note: l.alasan, noteLabel: 'Alasan' })
    } else if (!l.recordId && l.module === title && l.nomor === String(r.no) && !LEGACY_SKIP.includes(l.aksi)) {
      out.push({ key: l.id, time: l.time, title: l.aksi, tone: 'gray', by: l.user, text: l.keterangan })
    }
  }
  for (const a of store.approvals) {
    if (a.module !== moduleId || a.recordId !== r.id) continue
    out.push({ key: `${a.id}-req`, time: a.time, title: `Pengajuan approval: ${a.jenis}`, tone: 'yellow', by: a.by, requester: `${a.by} (${a.byRole})`, approver: a.approver, lines: a.changes.map((c) => ({ label: c.label, before: dash(c.lama), after: dash(c.baru) })), note: a.alasan, noteLabel: 'Alasan' })
    if (a.status !== 'Menunggu') out.push({ key: `${a.id}-dec`, time: a.decidedAt ?? a.time, title: `Approval ${a.status === 'Disetujui' ? 'disetujui' : 'ditolak'}: ${a.jenis}`, tone: a.status === 'Disetujui' ? 'green' : 'red', by: a.decidedBy ?? '-', requester: `${a.by} (${a.byRole})`, approver: a.decidedBy ?? a.approver, note: a.catatan, noteLabel: 'Catatan' })
  }
  return out
}

export function trackerHistory(f: Finding, db: DB): HItem[] {
  const mine = db.audit.filter((a) => a.fid === f.id)
  const added = mine.find((a) => a.aksi === 'Tambah temuan' || a.aksi === 'Import Excel')
  const out: HItem[] = [{ key: 'created', time: added?.time ?? createdOf(f), title: 'Data dibuat', tone: 'blue', by: added?.user ?? '-' }]
  const reqs = db.requests.filter((q) => q.fid === f.id)
  const groups = new Map<string, HItem>()
  for (const a of mine) {
    if (a === added) continue
    const k = `${a.aksi}|${a.user}|${a.time}`
    let g = groups.get(k)
    if (!g) {
      const asked = reqs.find((q) => q.time === a.time && a.aksi.startsWith('Ajukan penutupan'))
      const decided = reqs.find((q) => q.decidedAt === a.time && q.decidedBy === a.user)
      const base = { key: k, time: a.time, by: a.user }
      if (a.aksi.startsWith('Ajukan penutupan')) g = { ...base, title: 'Pengajuan approval: Penutupan Temuan', tone: 'yellow', requester: a.user, approver: 'Head CLRM', lines: [], note: asked?.alasan ?? a.alasan, noteLabel: 'Alasan' }
      else if (a.aksi === 'Setujui penutupan' || a.aksi === 'Persetujuan penutupan') g = { ...base, title: 'Approval disetujui: Penutupan Temuan', tone: 'green', requester: decided?.by, approver: a.user, lines: [], note: decided?.catatan, noteLabel: 'Catatan' }
      else if (a.aksi === 'Tolak penutupan') g = { ...base, title: 'Approval ditolak: Penutupan Temuan', tone: 'red', requester: decided?.by, approver: a.user, lines: [], note: decided?.catatan || a.alasan, noteLabel: 'Catatan' }
      else if (a.aksi === 'Batalkan temuan') g = { ...base, title: 'Dibatalkan', tone: 'red', lines: [], note: a.alasan, noteLabel: 'Alasan' }
      else if (a.aksi === 'Kembalikan temuan') g = { ...base, title: 'Dikembalikan', tone: 'green', lines: [], note: a.alasan, noteLabel: 'Alasan' }
      else if (a.aksi === 'Ubah temuan') g = { ...base, title: 'Perubahan data', tone: 'gray', lines: [], note: a.alasan, noteLabel: 'Alasan' }
      else g = { ...base, title: a.aksi, tone: 'gray', lines: [], note: a.alasan, noteLabel: 'Alasan' }
      groups.set(k, g)
      out.push(g)
    }
    if (!g.note && a.alasan) g.note = a.alasan
    if (a.kolom) g.lines!.push({ label: a.kolom, before: dmy(a.lama), after: dmy(a.baru) })
  }
  for (const h of out) { // approval seed tanpa request: pengaju = pengajuan terakhir sebelum keputusan
    if (h.title.startsWith('Approval') && !h.requester) h.requester = out.filter((x) => x.title.startsWith('Pengajuan') && x.time <= h.time).sort((a, b) => b.time.localeCompare(a.time))[0]?.by
  }
  return out
}

export function LogPerubahan({ items }: { items: HItem[] }) {
  const sorted = items.map((x, i) => ({ x, i })).sort((a, b) => (b.x.time || '').localeCompare(a.x.time || '') || b.i - a.i).map((e) => e.x)
  return (
    <div className="mt-5 border-t pt-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Log Perubahan</h4>
      <ol className="max-h-72 space-y-2 overflow-auto pr-1">
        {sorted.map((h) => (
          <li key={h.key} className="rounded border border-slate-200 p-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={h.tone}>{h.title}</Badge><span className="text-slate-500">{fmtTimeSec(h.time)}</span></div>
            <div className="mt-1 text-slate-600">
              {h.requester || h.approver ? <>{h.requester && <>Pengaju: <b>{h.requester}</b>. </>}{h.approver && <>Approver: <b>{h.approver}</b>.</>}</> : <>Oleh: <b>{h.by}</b></>}
            </div>
            {h.lines && h.lines.length > 0 && (
              <table className="mt-1.5 w-full text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-2 py-1 font-medium">Kolom</th><th className="px-2 py-1 font-medium">Sebelum</th><th className="px-2 py-1 font-medium">Sesudah</th></tr></thead>
                <tbody>{h.lines.map((l, i) => <tr key={i} className="border-t"><td className="px-2 py-1">{l.label}</td><td className="px-2 py-1 text-red-600">{l.before}</td><td className="px-2 py-1 text-green-700">{l.after}</td></tr>)}</tbody></table>
            )}
            {h.text && <div className="mt-1 whitespace-pre-wrap text-slate-700">{h.text}</div>}
            {h.note && <div className="mt-1 text-slate-700">{h.noteLabel}: {h.note}</div>}
          </li>
        ))}
      </ol>
    </div>
  )
}
