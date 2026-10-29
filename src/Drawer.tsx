import { useState } from 'react'
import { FileText, X } from 'lucide-react'
import { Audit, Finding, Role, ROLE_USER, alertsFor, fmtDate, fmtTime, userName } from './lib'
import { AlertBadges, Badge, Modal, RiskBadge, StatusBadge } from './ui'

export interface Acts {
  edit: () => void
  submit: () => void
  validate: (v: 'Valid' | 'Tidak Valid', alasan: string) => void
  approve: (v: 'Disetujui' | 'Ditolak', alasan: string) => void
  cancel: () => void
  restore: () => void
}

function Decision({ title, opts, rejectOpt, onOk, onClose }: { title: string; opts: string[]; rejectOpt: string; onOk: (v: string, a: string) => void; onClose: () => void }) {
  const [v, setV] = useState(opts[0])
  const [a, setA] = useState('')
  const [err, setErr] = useState(false)
  return (
    <Modal title={title} onClose={onClose}>
      <label className="lbl">Hasil *</label>
      <select className="inp" value={v} onChange={(e) => setV(e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
      <label className="lbl mt-3">Catatan / alasan{v === rejectOpt ? ' *' : ''}</label>
      <textarea className="inp" rows={3} value={a} onChange={(e) => { setA(e.target.value); setErr(false) }} />
      {err && <p className="err">Alasan wajib diisi untuk hasil {rejectOpt}.</p>}
      <div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" onClick={() => (v === rejectOpt && !a.trim() ? setErr(true) : onOk(v, a.trim()))}>Simpan</button></div>
    </Modal>
  )
}

const Row = ({ l, children }: { l: string; children: React.ReactNode }) => (
  <div><div className="text-xs text-slate-400">{l}</div><div className="mt-0.5 text-slate-800">{children}</div></div>
)

export default function Drawer({ f, audit, role, acts, onClose }: { f: Finding; audit: Audit[]; role: Role; acts: Acts; onClose: () => void }) {
  const [tab, setTab] = useState<'detail' | 'riwayat'>('detail')
  const [dlg, setDlg] = useState<'validasi' | 'setuju' | null>(null)
  const [msg, setMsg] = useState('')
  const me = ROLE_USER[role]
  const isCO = role === 'Compliance Officer'
  const isHead = role === 'Head CLRM'
  const own = role === 'PIC' && f.pic === me.id
  const live = f.status !== 'Dibatalkan' && f.status !== 'Selesai'
  const hist = audit.filter((a) => a.fid === f.id).sort((a, b) => b.time.localeCompare(a.time))
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={onClose}>
      <div className="flex h-full w-full max-w-[760px] flex-col bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{f.no}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2"><StatusBadge s={f.status} /><RiskBadge r={f.risiko} /><AlertBadges list={alertsFor(f, audit)} /></div>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="flex gap-1 border-b px-5">
          {(['detail', 'riwayat'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500'}`}>{t === 'detail' ? 'Detail' : `Riwayat (${hist.length})`}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-5">
          {msg && <p className="mb-3 rounded bg-slate-100 p-2 text-xs">{msg}</p>}
          {tab === 'detail' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Row l="1. Nomor Temuan">{f.no}</Row>
                <Row l="2. Regulator">{f.regulator}</Row>
                <Row l="3. Tanggal Temuan">{fmtDate(f.tglTemuan)}</Row>
                <Row l="4. Area Temuan">{f.area}</Row>
                <Row l="5. Penyebab Utama (Root Cause)">{f.rootCause} <Badge tone="gray">{f.rootType}</Badge></Row>
                <Row l="6. PIC">{userName(f.pic)}</Row>
                <Row l="7. Batas Waktu (Due Date)">{fmtDate(f.dueDate)}</Row>
                <Row l="8. Status"><StatusBadge s={f.status} /></Row>
                <Row l="9. Persentase Progress">
                  <div className="flex items-center gap-2"><div className="h-2 w-32 rounded bg-slate-200"><div className="h-2 rounded bg-brand" style={{ width: `${f.progress}%` }} /></div>{f.progress}%</div>
                </Row>
                <Row l="12. Unit Kerja">{f.unit}</Row>
                <Row l="13. Tingkat Risiko"><RiskBadge r={f.risiko} /></Row>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-semibold text-slate-500">10. VALIDASI ULANG</div>
                  <Badge tone={f.validasi === 'Valid' ? 'green' : f.validasi === 'Tidak Valid' ? 'red' : 'gray'}>{f.validasi}</Badge>
                  <div className="mt-2 text-xs text-slate-500">Validator: {f.validasiOleh || '-'}<br />Tanggal: {fmtDate(f.validasiTgl)}</div>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-semibold text-slate-500">11. PERSETUJUAN PENUTUPAN</div>
                  <Badge tone={f.persetujuan === 'Disetujui' ? 'green' : f.persetujuan === 'Ditolak' ? 'red' : 'gray'}>{f.persetujuan}</Badge>
                  <div className="mt-2 text-xs text-slate-500">Oleh: {f.persetujuanOleh || '-'}<br />Tanggal: {fmtDate(f.persetujuanTgl)}</div>
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">14. RENCANA TINDAK LANJUT & BUKTI</div>
                <ol className="space-y-2">
                  {f.tindak.map((t, i) => (
                    <li key={t.id} className="rounded border border-slate-200 p-2.5">
                      <div>{i + 1}. {t.text}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs">
                        {t.files.length ? t.files.map((n) => (
                          <a key={n} href="#" className="inline-flex items-center gap-1 text-brand hover:underline" onClick={(e) => { e.preventDefault(); setMsg(`File bukti dummy: ${n} (tidak ada file nyata di mockup)`) }}><FileText size={12} />{n}</a>
                        )) : <span className="text-slate-400">Belum ada file bukti</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500"><tr>{['Waktu', 'User', 'Aksi', 'Kolom', 'Nilai Lama', 'Nilai Baru', 'Alasan'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>{hist.map((a) => (
                  <tr key={a.id} className="border-t align-top"><td className="whitespace-nowrap px-2 py-2">{fmtTime(a.time)}</td><td className="px-2">{a.user}</td><td className="px-2">{a.aksi}</td><td className="px-2">{a.kolom || '-'}</td><td className="px-2">{a.lama || '-'}</td><td className="px-2">{a.baru || '-'}</td><td className="px-2">{a.alasan || '-'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">
          {role === 'Viewer' && <span className="mr-auto self-center text-xs text-slate-400">Viewer: hanya dapat melihat.</span>}
          {live && (isCO || own) && <button className="btn" onClick={acts.edit}>Ubah</button>}
          {(f.status === 'Open' || f.status === 'Proses') && (isCO || own) && <button className="btn btn-primary" onClick={acts.submit}>Ajukan Penutupan</button>}
          {f.status === 'Menunggu Validasi' && f.validasi === 'Belum' && isCO && <button className="btn btn-primary" onClick={() => setDlg('validasi')}>Isi Validasi Ulang</button>}
          {f.status === 'Menunggu Validasi' && f.validasi === 'Valid' && isHead && <button className="btn btn-primary" onClick={() => setDlg('setuju')}>Persetujuan Penutupan</button>}
          {isHead && f.status !== 'Dibatalkan' && <button className="btn btn-danger" onClick={acts.cancel}>Batalkan</button>}
          {isHead && f.status === 'Dibatalkan' && <button className="btn btn-primary" onClick={acts.restore}>Kembalikan</button>}
        </div>
      </div>
      {dlg === 'validasi' && <Decision title="Validasi Ulang" opts={['Valid', 'Tidak Valid']} rejectOpt="Tidak Valid" onClose={() => setDlg(null)} onOk={(v, a) => { acts.validate(v as 'Valid' | 'Tidak Valid', a); setDlg(null) }} />}
      {dlg === 'setuju' && <Decision title="Persetujuan Penutupan" opts={['Disetujui', 'Ditolak']} rejectOpt="Ditolak" onClose={() => setDlg(null)} onOk={(v, a) => { acts.approve(v as 'Disetujui' | 'Ditolak', a); setDlg(null) }} />}
    </div>
  )
}
