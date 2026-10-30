import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

// Isi popover info grafik. apa = apa yang ditampilkan; baca = cara membaca (string atau daftar poin).
export interface ChartInfo { apa: string; baca: string | string[] }

// Ikon ⓘ: hover membuka, klik mengunci (berfungsi di layar sentuh), Esc / klik di luar menutup.
export default function InfoTip({ info, label }: { info: ChartInfo; label: string }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()
  const open = hover || pinned
  // Jepit popover di dalam viewport: lebar maks 288px / (lebar layar - 32px), geser kiri bila meluap kanan.
  const [pos, setPos] = useState<{ left: number; width: number }>({ left: 0, width: 288 })
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const vw = document.documentElement.clientWidth
      const width = Math.min(288, vw - 32)
      const x = Math.min(Math.max(r.left, 16), vw - 16 - width)
      setPos({ left: x - r.left, width })
    }
    place()
    addEventListener('resize', place)
    return () => removeEventListener('resize', place)
  }, [open])
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPinned(false); setHover(false) } }
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setPinned(false); setHover(false) } }
    addEventListener('keydown', key); addEventListener('mousedown', down)
    return () => { removeEventListener('keydown', key); removeEventListener('mousedown', down) }
  }, [open])
  const baca = Array.isArray(info.baca) ? info.baca : [info.baca]
  return (
    <span ref={ref} className="relative inline-flex align-middle font-normal" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button type="button" aria-label={`Info ${label}`} aria-expanded={open} aria-describedby={open ? id : undefined}
        className={`rounded-full p-0.5 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${pinned ? 'text-brand' : 'text-slate-400'}`}
        onClick={(e) => { e.stopPropagation(); setPinned(!pinned) }}><Info size={14} /></button>
      {open && (
        <span id={id} role="tooltip" className="absolute top-full z-40 block pt-1.5 text-left" style={{ left: pos.left, width: pos.width }}>
          <span className="block rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-xl">
            <span className="block font-semibold text-slate-800">Apa yang ditampilkan</span>
            <span className="block">{info.apa}</span>
            <span className="mt-2 block font-semibold text-slate-800">Cara membaca</span>
            {baca.length === 1 ? <span className="block">{baca[0]}</span> : <ul className="list-disc space-y-0.5 pl-4">{baca.map((b) => <li key={b}>{b}</li>)}</ul>}
          </span>
        </span>
      )}
    </span>
  )
}
