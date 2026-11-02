import { useEffect, useState } from 'react'

// Filter Periode tanggal di atas dashboard: isian hanya mengubah draft, nilai baru berlaku saat klik "Terapkan Filter"
export default function PeriodBar({ label, from, to, onApply }: { label: string; from: string; to: string; onApply: (from: string, to: string) => void }) {
  const [f, setF] = useState(from)
  const [t, setT] = useState(to)
  useEffect(() => { setF(from); setT(to) }, [from, to])
  return (
    <>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input type="date" className="inp !w-auto" value={f} onChange={(e) => setF(e.target.value)} />
      <span>sampai</span>
      <input type="date" className="inp !w-auto" value={t} onChange={(e) => setT(e.target.value)} />
      <button className="btn btn-primary" onClick={() => onApply(f, t)}>Terapkan Filter</button>
      <button className="btn" onClick={() => onApply('', '')}>Reset</button>
    </>
  )
}
