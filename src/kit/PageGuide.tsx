import { ReactNode, createContext, useContext, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, ChevronDown, X } from 'lucide-react'

// b = HTML statis buatan sendiri (bukan input pengguna): boleh <b>, <br>, <ol>, <ul>, <li>
export interface GuideItem { h: string; b: string }

// App menyediakan dua titik tempel: tombol di samping judul halaman, panel tepat di bawah judul.
export const GuideSlots = createContext<{ btn: HTMLElement | null; panel: HTMLElement | null }>({ btn: null, panel: null })

export default function PageGuide({ name, items }: { name: string; items: GuideItem[] }) {
  const { btn, panel } = useContext(GuideSlots)
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState<Record<number, boolean>>({})
  const pid = useId()
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [open])
  if (!btn || !panel || !items.length) return null
  const button: ReactNode = (
    <button type="button" className="btn !py-1" aria-expanded={open} aria-controls={pid} aria-label={`Panduan Halaman ${name}`} onClick={() => setOpen(!open)}>
      <BookOpen size={14} />Panduan Halaman
    </button>
  )
  const body: ReactNode = open && (
    <section id={pid} role="region" aria-label={`Panduan Halaman ${name}`} className="mb-4 rounded-lg border border-blue-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-brand"><BookOpen size={15} />Panduan Halaman {name}</span>
        <button type="button" aria-label="Tutup panduan" className="rounded p-1 text-slate-500 hover:bg-white" onClick={() => setOpen(false)}><X size={16} /></button>
      </div>
      <p className="px-4 pt-2 text-xs text-slate-500">Klik tiap item untuk melihat penjelasannya.</p>
      <div className="max-h-[60vh] space-y-1.5 overflow-auto p-3">
        {items.map((it, i) => (
          <div key={it.h} className="rounded-md border border-slate-200">
            <button type="button" aria-expanded={!!opened[i]} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] font-medium text-slate-800 hover:bg-slate-50" onClick={() => setOpened({ ...opened, [i]: !opened[i] })}>
              <span>{it.h}</span><ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${opened[i] ? 'rotate-180' : ''}`} />
            </button>
            {opened[i] && <div className="guide-body border-t px-3 py-2.5 text-[13px] leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: it.b }} />}
          </div>
        ))}
      </div>
    </section>
  )
  return <>{createPortal(button, btn)}{body && createPortal(body, panel)}</>
}
