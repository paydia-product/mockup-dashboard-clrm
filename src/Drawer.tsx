import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Audit, ChangeReq, DB, FileMeta, Finding, Role, alertsFor, createdOf, fmtDate, fmtTimeSec, lastDueReason, fmtSize } from './lib'
import { LogPerubahan, trackerHistory } from './kit/history'
import { AlertBadges, Badge, Modal, RiskBadge, StatusBadge } from './ui'

export interface Acts {
  validate: (v: 'Valid' | 'Tidak Valid', alasan: string) => void
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

const Dl = ({ m, empty }: { m: FileMeta | null; empty: string }) =>
  m ? <span className="inline-flex items-center gap-1 text-brand"><FileText size={12} />{m.name} ({fmtSize(m.size)})</span> : <span className="text-slate-400">{empty}</span>

const Row = ({ l, children }: { l: string; children: React.ReactNode }) => (
  <div><div className="text-xs text-slate-400">{l}</div><div className="mt-0.5 text-slate-800">{children}</div></div>
)

export default function Drawer({ f, audit, db, req, role, acts, onClose }: { f: Finding; audit: Audit[]; db: DB; req?: ChangeReq; role: Role; acts: Acts; onClose: () => void }) {
  const [dlg, setDlg] = useState<'validasi' | null>(null)
  const isCO = role === 'Compliance Officer'
  const isHead = role === 'Head CLRM'
  const alerts = alertsFor(f, audit)
  const dueReason = lastDueReason(f.id, audit)
  return (
    <>
      <Modal wide title="Detail" onClose={onClose}>
        <div className="space-y-5">
          {alerts.length > 0 && <AlertBadges list={alerts} />}
          {req && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
              Menunggu persetujuan Head CLRM (Penutupan Temuan). <a className="font-medium underline" href={`#/approval?id=t-${req.id}`}>Lihat di menu Approval</a>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Row l="Tanggal Dibuat">{fmtTimeSec(createdOf(f))}</Row>
            <Row l="Regulator">{f.regulator}</Row>
            <Row l="Tanggal Temuan">{fmtDate(f.tglTemuan)}</Row>
            <Row l="Area Temuan">{f.area}</Row>
            <Row l="Penyebab Utama (Root Cause)">{f.rootCause} <Badge tone="gray">{f.rootType}</Badge></Row>
            <Row l="PIC">{f.pic}</Row>
            <Row l="Batas Waktu (Due Date)">{fmtDate(f.dueDate)}</Row>
            <Row l="Alasan perubahan Batas Waktu">{dueReason?.alasan ?? '-'}</Row>
            <Row l="Status"><StatusBadge s={f.status} /></Row>
            <Row l="Unit Kerja">{f.unit}</Row>
            <Row l="Tingkat Risiko"><RiskBadge r={f.risiko} /></Row>
            {f.status === 'Selesai' && <>
              <Row l="Validasi Ulang"><Badge tone={f.validasi === 'Valid' ? 'green' : f.validasi === 'Tidak Valid' ? 'red' : 'gray'}>{f.validasi}</Badge></Row>
              <Row l="Nama Validator">{f.validasiOleh || '-'}</Row>
            </>}
            <Row l="Persetujuan Penutupan">
              <Badge tone={f.persetujuan === 'Disetujui' ? 'green' : f.persetujuan === 'Ditolak' ? 'red' : 'gray'}>{f.persetujuan}</Badge>
              <div className="mt-1 text-xs text-slate-500">Oleh: {f.persetujuanOleh || '-'}, Tanggal: {fmtDate(f.persetujuanTgl)}</div>
            </Row>
          </div>
          <div>
            <div className="text-xs text-slate-400">Rencana Tindak Lanjut</div>
            <div className="mt-0.5 rounded border border-slate-200 p-2.5">
              <div className="whitespace-pre-wrap">{f.tindak || '-'}</div>
              <div className="mt-1 text-xs"><Dl m={f.tindakFile} empty="Belum ada file bukti" /></div>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Bukti Surat Regulator</div>
            <div className="mt-0.5 rounded border border-slate-200 p-2.5 text-xs"><Dl m={f.suratFile} empty="Belum ada file" /></div>
          </div>
          <LogPerubahan items={trackerHistory(f, db)} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-3">
          {role === 'Viewer' && <span className="mr-auto self-center text-xs text-slate-400">Viewer: hanya dapat melihat.</span>}
          {f.status === 'Menunggu Validasi' && f.validasi === 'Belum' && isCO && <button className="btn btn-primary" onClick={() => setDlg('validasi')}>Isi Validasi Ulang</button>}
          {isHead && !req && f.status !== 'Dibatalkan' && <button className="btn btn-danger" onClick={acts.cancel}>Batalkan</button>}
          {isHead && f.status === 'Dibatalkan' && <button className="btn btn-primary" onClick={acts.restore}>Kembalikan</button>}
          <button className="btn" onClick={onClose}>Tutup</button>
        </div>
      </Modal>
      {dlg === 'validasi' && <Decision title="Validasi Ulang" opts={['Valid', 'Tidak Valid']} rejectOpt="Tidak Valid" onClose={() => setDlg(null)} onOk={(v, a) => { acts.validate(v as 'Valid' | 'Tidak Valid', a); setDlg(null) }} />}
    </>
  )
}
