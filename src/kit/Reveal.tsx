import { Eye, EyeOff } from 'lucide-react'

// Tombol mata untuk membuka/menutup sensor nilai (hanya ditampilkan bagi peran yang boleh membuka, lihat Field.reveal)
export default function Reveal({ on, toggle, label }: { on: boolean; toggle: () => void; label: string }) {
  return (
    <button type="button" onClick={toggle} title={on ? `Sembunyikan ${label}` : `Tampilkan ${label}`} aria-label={on ? `Sembunyikan ${label}` : `Tampilkan ${label}`} aria-pressed={on} className="ml-1 inline-flex items-center align-middle text-slate-400 hover:text-brand">
      {on ? <EyeOff size={13} /> : <Eye size={13} />}
    </button>
  )
}
