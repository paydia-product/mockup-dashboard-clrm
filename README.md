# Dashboard Monitoring CLRM (mockup)

Mockup klik untuk Dashboard Monitoring CLRM (Compliance, Legal & Risk Management). Halaman lengkap saat ini: **Compliance > Regulatory Findings Tracker**. Tidak ada backend; data contoh disimpan di `localStorage` (tombol reset di header).

Stack: React + Vite + TypeScript + Tailwind + Recharts + lucide-react + xlsx. Source "dashboard admin" Paydia tidak ada di workspace, jadi tampilan meniru gayanya (header biru royal, sidebar putih, tabel dengan badge outline).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173 (tanpa login gate)
npm run build      # cek TypeScript + build ke dist/
npm run preview
```

Login gate hanya aktif di Vercel (atau `vercel dev`), karena dijalankan oleh `middleware.js`.

## Variabel environment (Vercel)

| Nama | Fungsi |
| --- | --- |
| `MOCKUP_PASSWORD` | Password login. Tidak ada di repo. |
| `AUTH_SECRET` | Kunci HMAC untuk cookie `clrm_auth`. Pakai string acak panjang. |

Jika salah satu belum diset, `/api/login` dan middleware membalas 500 (tanpa nilai bawaan). Cookie: `clrm_auth=<expiryMs>.<hex HMAC-SHA256>`, HttpOnly, Secure, SameSite=Strict, berlaku 24 jam.

Halaman publik: `/login.html` (+ `login.js`, `login.css`), `/api/login`, `/api/logout`, `/favicon.svg`. Sisanya butuh cookie valid.

## Asumsi (bagian G dan tambahan)

- Format Nomor Temuan `TR-YYYY-NNNN`.
- Validasi Ulang diisi oleh Compliance Officer.
- Semua peran boleh export (CR belum mengatur).
- Kelompok keterlambatan: 1-7, 8-30, 31-90, >90 hari.
- Area Temuan: lima contoh CR + "Lainnya".
- Alert "Menunggu Validasi terlalu lama": > 7 hari (`WAIT_VALIDATION_DAYS` di `src/lib.ts`). Lama menunggu dihitung dari riwayat audit.
- Di Dashboard, "Open" berarti semua temuan belum Selesai (Open, Proses, Menunggu Validasi); yang Dibatalkan tidak dihitung.
- Peran demo memetakan ke satu pengguna: PIC = Bima Pratama. Temuan PIC lain tidak bisa diubah oleh peran PIC.
- "Edit dengan persetujuan Head CLRM": di mockup perubahan langsung berlaku dan dicatat di Riwayat; belum ada antrean persetujuan edit. Persetujuan Head hanya untuk penutupan.
- "Ajukan Penutupan" otomatis mengisi progress 100%.
- Batalkan/Kembalikan: status sebelum batal dibaca dari Riwayat (tidak ada kolom tambahan).
- Pencarian, filter, dan export memakai data yang sama; export mencakup semua halaman hasil filter.

## Placeholder ("Segera hadir")

Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol, Risk Register, Kajian Risiko, Fraud Case Monitoring, Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum, Approval, Admin, Log. File bukti hanya nama dummy. Notifikasi Telegram hanya simulasi.

## Ritual rilis

Tiap pengerjaan wajib:

1. Tambah entri di `CHANGELOG.md` (termasuk estimasi token) dan di `src/versions.ts` (newest-first; `prompt` dan `tokens`).
2. Bump `VERSION` (dan `version` di `package.json`).
3. Commit, lalu tag `vX.Y.Z`.
4. Deploy. Tandai `deployed: true` di `src/versions.ts` pada versi yang sudah rilis.
