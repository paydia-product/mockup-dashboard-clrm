# Plan halaman Dashboard Monitoring CLRM (sisa 10 halaman + fitur pendukung)

Sumber: CR 6 Okt 2026 (acuan kolom/visual/alert/aturan), rencana kerja tambahan 29 Okt (menimpa rencana lama), prompt revisi (Bagian 1 C, Bagian 2), keputusan user yang sudah diterapkan di Regulatory Findings Tracker (menang atas MD). Konflik: bagian E.

## Aturan dasar semua halaman (dari keputusan user di tracker)
1. Tab **Dashboard** pertama (default), lalu **Table**.
2. Filter = popover di tombol "Filter": field filter CR, simpan filter bernama, tombol **Clear All** / **Apply Filters**; kotak cari terpisah di kiri.
3. Kolom **Aksi**: Lihat Detail (semua) + Edit (sesuai permission & aturan baris) + Batalkan / Kembalikan (Head CLRM, alasan wajib, tanpa approval, bisa dikembalikan ke status sebelum batal).
4. Detail = Modal read-only berjudul "Detail" tanpa nomor urut kolom, tanpa Riwayat, tanpa tombol Ubah/Ajukan.
5. "Simulasi notifikasi (n)" = modal email (From noreply-clrm@paydia.co.id, To, Subject `[CLRM] <alert>: <noun> <no>`, isi, alasan notifikasi, badge Kuning/Merah). Maksimal 3 email contoh per jenis alert CR: pakai data yang cocok hari ini, lalu contoh statis berlabel "Contoh statis" kalau datanya kurang.
6. Upload pakai `FileField` (PDF/JPG/JPEG/PNG, ≤25 MB, tepat 1 file, hanya metadata). Wajib di kolom yang di CR berisi file dan wajib.
7. Nomor data = angka urut biasa (`no`), terisi otomatis, tidak muncul di form, tampil di tabel/detail/export.
8. PIC = teks bebas (bukan dropdown user). Departemen dari Master Data (G3).
9. Export Excel = baris hasil filter dan cari, nama file `<Prefix>_YYYY-MM-DD.xlsx` dari CR, dicatat di Log.
10. Pagination 10/25/50, "x sampai y dari z data", sort per kolom.
11. Setiap visual dalam kartu sendiri, jumlah dan bentuk sesuai CR (G11). Merchant/mitra/vendor/PT = teks (G5/G6).
12. Import Excel (G7) di tab Table: unduh template, unggah, pratinjau dengan validasi per baris, impor baris valid, unduh baris gagal, dicatat di Log.

## A. Arsitektur (page kit)

Prinsip: hanya mengabstraksi yang dipakai ≥2 halaman. Visual dashboard tetap kode per halaman (beda semua); yang dibagi hanya pembungkus chart.

### Penyimpanan
- Tracker tetap di `clrm.db.v4` (tidak dimigrasi).
- Key baru `clrm.app.v1`:
  `{ modules: Partial<Record<ModuleId, BaseRec[]>>, saved: Partial<Record<ModuleId, SavedFilter[]>>, approvals: ApprovalReq[], log: LogEntry[], master: { departemen: string[]; produk: string[]; pihakPelapor: string[] }, accounts: Account[], perms: PermMatrix, seq: Record<string, number> }`
- Tiap slice modul di-seed saat pertama dibaca (`cfg.seed()`), jadi foundation tidak perlu tahu seed per halaman. Tombol Reset menghapus dua key lalu reload.
- Sesi mock login di `clrm.session` (`{ accountId, verified2fa }`).

### Tracker: tidak dimigrasi ke kit (tidak murah, beda bentuk data dan alur). Penyesuaian kecil saja:
- Tombol mengikuti `can('tracker', aksi)` dari matriks permission (ganti cek `role === ...`); aturan PIC-pemilik tetap.
- Request perubahan tracker (`db.requests`) tampil di menu Approval lewat adapter. Logika approve/reject dipindah dari `Tracker.tsx` ke fungsi murni `applyTrackerRequest(db, reqId, userName, approve, note)` di `lib.ts`, dipakai Tracker dan Approval.
- Menu Log menggabungkan `db.audit` tracker (dipetakan ke LogEntry, modul "Regulatory Findings Tracker") dengan `app.log`.
- `ROLE_USER` / role tracker diturunkan dari akun sesi (lihat B).

### Struktur file
```
src/kit/
  types.ts        ModuleId, BaseRec, Field, Column, FilterDef, AlertDef, PageConfig, ApprovalReq, LogEntry, Account, Action, Role
  store.tsx       AppProvider, useApp(), useModule(cfg)
  dates.ts        re-export iso/addDays/diffDays/fmtDate dari lib + addWorkDays, workDaysBetween, monthKey, ageBucket
  perms.ts        ROLES, ACTIONS, DEFAULT_PERMS, can()
  PageShell.tsx   tab Dashboard/Table + toolbar + modal-modal; satu-satunya komponen yang dirender halaman
  DataTable.tsx   tabel + sort + pagination + kolom Aksi
  FilterPopover.tsx
  DetailModal.tsx render read-only dari cfg.fields
  FormModal.tsx   form dari cfg.fields (add/edit), validasi wajib/kondisional, alasan saat field reasonOnChange berubah
  EmailSim.tsx
  ImportExcel.tsx
  exportXlsx.ts
  charts.tsx      Card, StatCards, BarCard (stacked/horizontal), DonutCard, LineCard, ComboCard (bar+garis), CalendarCard (grid bulan + titik), MiniTable
src/shared/  Approval.tsx, MasterData.tsx, Admin.tsx (Akun + Permission), Log.tsx, Login.tsx (login, 2FA, reset), Profile.tsx (password, PIN)
src/pages/   index.ts (registry), Reporting.tsx, RegChange.tsx, Sop.tsx, RiskRegister.tsx, Kajian.tsx, Fraud.tsx, Kontrak.tsx, Aph.tsx, Perizinan.tsx, LayananHukum.tsx, sop.shared.ts
```

### Kontrak (foundation wajib menyediakan persis ini)
```ts
// kit/types.ts
export type ModuleId = 'tracker'|'reporting'|'regchange'|'sop'|'risk'|'kajian'|'fraud'|'kontrak'|'aph'|'perizinan'|'layanan'
export type Role = 'Super Admin'|'Head CLRM'|'Compliance Officer'|'Risk Officer'|'Legal Officer'|'Fraud Investigator'|'Ketua SMKI'|'PIC'|'Viewer'
export type Action = 'Lihat'|'Tambah'|'Ubah'|'Cancel'|'Approve'|'Export'|'Import'
export interface Cancelled { prev: string; reason: string; by: string; at: string }
export interface BaseRec { id: string; no: number; status: string; createdAt: string; createdBy: string; cancelled?: Cancelled }
export type FieldType = 'text'|'textarea'|'number'|'money'|'percent'|'date'|'datetime'|'select'|'multiselect'|'yesno'|'checklist'|'file'|'list'
export interface Ctx { role: Role; user: Account; today: string; master: Master; all: (m: ModuleId) => BaseRec[] }
export interface Field<T> {
  key: keyof T & string; label: string; type: FieldType
  options?: string[] | ((c: Ctx) => string[])          // master: c => c.master.departemen
  required?: boolean | ((r: T, c: Ctx) => boolean)      // wajib kondisional
  auto?: (r: T, c: Ctx) => unknown                       // kolom otomatis: tidak ada di form, tampil di detail/tabel/export
  inForm?: 'add'|'edit'|'both'|'none'                    // default 'both'
  editableBy?: (c: Ctx, r: T) => boolean                 // default true kalau boleh Ubah
  reasonOnChange?: boolean                               // ubah nilai yang sudah terisi -> alasan wajib
  sub?: Field<any>[]                                     // type 'list' (daftar item) / 'checklist' item
  mask?: (c: Ctx) => boolean; noExport?: boolean; noImport?: boolean
  showIf?: (r: T) => boolean; help?: string; wide?: boolean
}
export interface Column<T> { label: string; get: (r: T, c: Ctx) => string | number; render?: (r: T, c: Ctx) => React.ReactNode }
export interface FilterDef<T> { key: string; label: string; type: 'select'|'daterange'; options?: string[] | ((rows: T[], c: Ctx) => string[]); match: (r: T, v: string | [string, string]) => boolean }
export interface AlertDef<T> {
  key: string; label: string; rule: string
  check: (r: T, c: Ctx) => null | { color: 'yellow'|'red'; detail: string; to: string[] }   // to: nama peran / 'PIC (<nama>)'
  sample: (c: Ctx) => T                                  // contoh statis
}
export interface ApprovalRule<T> {                       // dipanggil saat simpan edit
  jenis: string; approver: Role
  needs: (old: T, next: T, c: Ctx) => boolean
  pendingPatch?: (old: T) => Partial<T>                  // mis. status tetap / tanda menunggu
  rejectPatch?: (old: T) => Partial<T>
}
export interface RowAction<T> { label: string; icon?: React.ElementType; show: (r: T, c: Ctx) => boolean; run: (r: T, api: ModuleApi<T>) => void | React.ReactNode /* modal */ }
export interface PageConfig<T extends BaseRec> {
  module: ModuleId; title: string; noun: string; exportPrefix: string
  seed: (today: string) => T[]
  blank: () => Omit<T, keyof BaseRec>
  fields: Field<T>[]; columns: Column<T>[]; filters: FilterDef<T>[]
  search: (r: T) => string; searchPlaceholder: string
  alerts: AlertDef<T>[]
  cancelStatus?: string                                  // default 'Dibatalkan'
  normalize?: (r: T, c: Ctx) => T                        // status otomatis saat baca/simpan (mis. Terlambat)
  validate?: (r: T, mode: 'add'|'edit', c: Ctx) => Record<string, string>   // unik, penyusun≠reviewer, dst.
  canEditRow?: (r: T, c: Ctx) => boolean                 // aturan baris (PIC pemilik, status final)
  approvals?: ApprovalRule<T>[]
  rowActions?: RowAction<T>[]                            // mis. Kajian "Selesai"
  Dashboard: (p: { rows: T[]; c: Ctx; open: (id: string) => void; drill: (filter: Record<string, unknown>) => void }) => JSX.Element
}
export interface ApprovalReq {
  id: string; no: number; module: ModuleId; jenis: string; recordId: string; recordNo: number
  by: string; byRole: Role; time: string; alasan: string; approver: Role
  changes: { key: string; label: string; lama: string; baru: string; value: unknown }[]
  rejectPatch?: Record<string, unknown>
  status: 'Menunggu'|'Disetujui'|'Ditolak'; decidedBy?: string; decidedAt?: string; catatan?: string
}
export interface LogEntry { id: string; time: string; user: string; role: Role; module: string; aksi: string; nomor: string; keterangan: string }
export interface Account { id: string; name: string; email: string; role: Role; departemen: string; status: 'Aktif'|'Nonaktif'; lastLogin: string; password: string; pin: string }

// kit/store.tsx
export function useApp(): { store; setStore; ctx: Ctx; can: (m: ModuleId, a: Action) => boolean; log: (module: string, aksi: string, nomor?: string|number, ket?: string) => void; logout: () => void }
export interface ModuleApi<T> {
  rows: T[]                                              // sudah normalize
  add(r: Omit<T, keyof BaseRec>): T                      // no otomatis = max+1, log "Tambah"
  update(id: string, patch: Partial<T>, alasan?: string) // cek cfg.approvals: kalau needs -> buat ApprovalReq, kalau tidak -> langsung; log per kolom
  cancel(id: string, reason: string); restore(id: string)
  requestApproval(id: string, jenis: string, approver: Role, changes: Partial<T>, alasan: string, rejectPatch?: Partial<T>)
  pendingFor(id: string): ApprovalReq | undefined
}
export function useModule<T extends BaseRec>(cfg: PageConfig<T>): ModuleApi<T>
export function readModule<T extends BaseRec>(m: ModuleId, seed: (t: string) => T[]): T[]   // baca modul lain (RegChange -> SOP)
export function addRecord<T extends BaseRec>(m: ModuleId, r: Omit<T, keyof BaseRec>, seed: (t: string) => T[]): T

// kit/PageShell.tsx
export default function PageShell<T extends BaseRec>({ config }: { config: PageConfig<T> }): JSX.Element
// kit/charts.tsx (semua menerima title, data, onClick?)
Card, StatCards({ items: { label; value; tone? }[] }), BarCard({ data, keys, stacked?, horizontal?, colors? }), DonutCard({ data: { name; value; color? }[] }), LineCard, ComboCard, CalendarCard({ events: { date; label; tone }[]; views?: ('hari'|'minggu'|'bulan')[] }), MiniTable({ cols, rows, onRow })
// kit/dates.ts
addWorkDays(d, n), workDaysBetween(a, b), ageBucket(days, edges: number[]): string
```
- Saat approval disetujui, `Approval.tsx` menerapkan `changes[].value` ke `store.modules[module]`. Saat ditolak, menerapkan `rejectPatch`. Keduanya ditulis ke Log. Patch berupa data (bukan fungsi), aman di localStorage.
- Selama ada request Menunggu, baris tidak bisa diedit. Detail menampilkan "Menunggu persetujuan <peran>" + link `#/approval?id=`.
- Kolom `file` disimpan sebagai `FileMeta | null`, di export ditulis nama filenya.
- Kolom `list` (daftar item) dirender sebagai sub-form yang bisa tambah/hapus item.

### Kontrak sebenarnya (hasil Task 0, menimpa tanda tangan di atas bila beda)
Sumber kebenaran: `src/kit/types.ts`. Perbedaan dari draf di atas:
- `Field.key: string` (bukan `keyof T`), supaya kolom otomatis tidak perlu properti di T. Key `'no'` diabaikan (kit selalu menampilkan No di tabel/detail/export, jangan buat kolom form untuk no).
- `NewRec<T> = Omit<T, 'id'|'no'|'createdAt'|'createdBy'|'cancelled'>` (status ikut). `cfg.blank(): NewRec<T>` dan `api.add(r, silent?)` memakai tipe ini. `add` mengembalikan T dan mencatat Log "Tambah" (kecuali `silent`).
- Nilai per FieldType: text/textarea/select/date/datetime/yesno = string (yesno `'Ya'|'Tidak'|''`; datetime `YYYY-MM-DDTHH:mm`); number/money/percent = `number | ''`; multiselect = `string[]`; checklist = `Record<subKey, boolean>` (sub: item bercentang, hanya `key`/`label` dipakai); file = `FileMeta | null`; list = array objek (kolom dari `sub`). Field `list` dengan `inForm: 'none'` hanya tampil di Detail/Export (mis. revisi SOP).
- `Field.mask(c)` mengembalikan true bila nilai HARUS disamarkan untuk pengguna ini. Kit menerapkannya di Detail dan Export; di kolom tabel Anda sendiri yang memanggil `maskStr` dari `kit/fmt` (mis. `get: (r, c) => c.role === ... ? r.x : maskStr(r.x)`).
- `FilterDef.match` untuk `daterange` menerima `[from, to]`, salah satu boleh `''`. Nilai filter di `drill()` memakai `key` filter yang sama (select = string, daterange = `[from, to]`).
- `RowAction.run(r, api, close)`: argumen ketiga menutup modal yang Anda kembalikan. Kembalikan ReactNode (pakai `Modal` dari `src/ui`) untuk dirender shell.
- `ApprovalRule.keys?: string[]`: hanya kolom ini yang masuk request, kolom lain yang berubah langsung diterapkan. Tanpa `keys`, seluruh diff masuk request.
- `PageConfig.beforeSave?(old|null, next, c) => T`: hook saat tambah/ubah (mis. memindahkan revisi lama ke `revisi[]`). `cfg.title` harus sama dengan label menu (dipakai Log).
- `can(m, a)` menerima `PermKey` (ModuleId + 'approval'|'master'|'admin'|'log'). Signature di `kit/perms.ts`: `can(perms, role, m, a)`; komponen memakai `useApp().can(m, a)`.
- `Dashboard` menerima `rows` tanpa baris dibatalkan. `drill(filter)` pindah ke tab Table dengan filter terpasang. `open(id)` membuka Detail.
- Chart (`kit/charts.tsx`): `BarCard({title, data:[{name, ...keys}], keys, stacked?, horizontal?, colors?, cellColors?, onClick?(row,key)})`, `DonutCard({title, data, onClick?(name)})`, `LineCard({title, data, keys, colors?})`, `ComboCard({title, data, bars, lines, colors?})`, `StatCards({items:[{label,value,tone?,onClick?}]})`, `CalendarCard({title, events:[{date,label,tone,id?}], views?, onEvent?(id)})`, `MiniTable({title?, cols:[{label,get(r)=>ReactNode}], rows, onRow?})`, `Card({title?, children})`. Semua mendukung `className`. Warna: `TONE_HEX`, `PALETTE`.
- Helper lain: `kit/fmt.tsx` (`StatusPill`, `statusTone`, `fmtMoney`, `maskStr`), `kit/dates.ts` (`workDaysBetween(a,b)` = hari kerja di (a, b], `addWorkDays`, `ageBucket(days, edges)`, `ageBuckets(edges)`, `monthKey`, plus `todayStr/addDays/diffDays/fmtDate/fmtTime`). Contoh lengkap: `src/pages/LayananHukum.tsx`.

## B. Fitur pendukung (dikerjakan foundation)

**Sidebar**: Compliance (Regulatory Findings Tracker, Regulatory Reporting, Regulatory Change, SOP & Dokumen Kontrol) / Risk (Risk Register, Kajian Risiko) / Fraud (Fraud Case Monitoring) / Legal (Kontrak, Permintaan APH, Perizinan & Dokumen Legalitas, Permintaan Layanan Hukum) / garis pemisah / Approval (badge jumlah Menunggu yang bisa diputus peran aktif) / Master Data (Departemen, Produk, Pihak Pelapor) / Admin (Akun, Permission) / Log. Menu tanpa izin Lihat disembunyikan. Avatar header: menu Ganti Password, Ganti PIN, Logout.

**Route (hash)**: id yang sudah ada di `App.tsx` dipertahankan (`compliance/regulatory-reporting`, `compliance/regulatory-change`, `compliance/sop-dokumen-kontrol`, `risk/risk-register`, `risk/kajian-risiko`, `fraud/fraud-case-monitoring`, `legal/kontrak`, `legal/permintaan-aph`, `legal/perizinan`, `legal/layanan-hukum`), ditambah `approval`, `master/departemen`, `master/produk`, `master/pihak-pelapor`, `admin/akun`, `admin/permission`, `log`, `profil/password`, `profil/pin`. App merender `PAGES[route]` dari `src/pages/index.ts`.

**Login mock (layar kedua, di dalam app)**: gate server (`middleware.js`, `/login.html`, `/api/login`, password saja) tetap ada dan tidak diubah. Setelah lolos gate, kalau sesi belum ada, App menampilkan `Login.tsx`: email + password → layar 2FA kode 6 digit (contoh `123456`) → masuk, update `lastLogin`, log "Login". Akun Nonaktif ditolak. Link "Lupa password" → form email → pesan "Link reset dikirim ke email" (log). Logout = hapus sesi → layar login mock (log "Logout"). Di layar login ada link kecil "Keluar dari mockup" yang memanggil `/api/logout` → `/login.html`. Akun contoh (password `Paydia123!`, PIN `123456`) ditulis di README.

**Pemilih peran demo** di header: daftar akun aktif (satu per peran) untuk ganti akun tanpa login ulang (log "Ganti akun demo").

**Akun seed**: Super Admin (admin@paydia.id), Dewi Anggraini (Head CLRM), Rina Kartika dan Arief Nugraha (Compliance Officer), Rudi Hartono (Risk Officer), Lina Marlina (Legal Officer), Fajar Ramadhan (Fraud Investigator), Yusuf Hakim (Ketua SMKI), Bima Pratama (PIC), Tono Santoso (Viewer). Nama tracker yang sudah ada dipertahankan.

**Admin**:
- Akun: list + cari + pagination (nama, email, peran, departemen, status, terakhir login); tambah/edit dalam modal; toggle Aktif/Nonaktif (log).
- Permission: pilih peran → matriks baris modul (11 halaman + Approval, Master Data, Admin, Log) × kolom Lihat/Tambah/Ubah/Cancel/Approve/Export/Import, checkbox, langsung tersimpan dan langsung mengubah tombol (log).
- DEFAULT_PERMS mengikuti kolom "Siapa yang Boleh" di CR:
  - Tambah: tracker/reporting/regchange = CO; sop = CO + PIC; risk = Risk Officer + PIC (Risk Owner); kajian = Risk Officer; fraud = Fraud Investigator + CO; kontrak/aph/perizinan = Legal Officer; layanan = Legal Officer + PIC.
  - Ubah: + PIC di setiap modul yang di CR menyebut PIC.
  - Cancel: Head CLRM di semua modul.
  - Approve: Head CLRM (tracker, fraud), Ketua SMKI (regchange), Risk Officer (risk).
  - Export: semua peran. Import: peran yang boleh Tambah.
  - Super Admin: semua centang. Viewer: Lihat + Export.

**Approval**: list + pagination + filter status (Menunggu/Disetujui/Ditolak) + filter modul + cari; kolom Nomor request, Modul, Jenis request, Nomor data, Pengaju, Tanggal ajuan, Status. Detail: ringkasan data, tabel kolom/nilai lama/nilai baru, alasan, keputusan. Approve/Reject hanya untuk `approver === role` (atau Super Admin) yang punya `can(module,'Approve')`; Reject wajib catatan. Tracker tampil lewat adapter.

**Master Data**: tiga list (tambah, ubah nama, cari). Seed:
- Departemen: IT, Business, Operations, Finance, Compliance, Support.
- Produk: UE, QRIS, Biller.
- Pihak Pelapor: Konsumen, Merchant, Bank Mitra, Switching, Kepolisian, Bank Indonesia, Internal.

Rename tidak mengubah data lama (asumsi). Semua perubahan dicatat di Log.

**Log**: gabungan semua aksi (login, logout, tambah, ubah per kolom, cancel, kembalikan, ajukan approval, approve, reject, export, import, ubah permission, ubah akun, ubah master, ganti password/PIN, reset password). Kolom waktu, user, peran, modul, aksi, nomor data, keterangan. Filter periode/user/modul/aksi, pagination, export `Log_Aktivitas_YYYY-MM-DD.xlsx`.

**Profil**: Ganti Password (lama, baru min 8, konfirmasi) dan Ganti PIN (lama, baru 6 digit, konfirmasi), dicek ke akun dan disimpan.

## C. Halaman
Notasi: W = wajib, K = wajib kondisional, D = disarankan (opsional), A = otomatis. "Kolom tabel" = kolom di list; semua kolom tampil di Detail dan Export. Seed: buat data agar setiap alert terpicu minimal 1 kali dan setiap kelompok/bucket visual terisi.

### C1. Regulatory Reporting — Compliance — `Reporting.tsx` — export `Pelaporan_Regulator`
Kolom:
1. Nama Laporan: teks W (C: bukan dropdown; seed memakai nama dari daftar tim: Pelaporan Dana Floating, Laporan RBSP, SiPesat, LTKM, LTKT, Laporan Insiden Siber, dll).
2. Regulator: select BI/PPATK/Komdigi/BSSN, W.
3. Jenis Periode: select Harian/Mingguan/Bulanan/Triwulanan/Tahunan/3 Tahun Sekali/Insidental, W.
4. Periode yang Dilaporkan: teks W (diisi manual; jadwal otomatis tidak dibuat, lihat C).
5. Batas Waktu: datetime W. Kalau Insidental: field tambahan "Waktu kejadian" lalu batas waktu diisi manual.
6. Tanggal Submit: datetime, K bila status Terkirim.
7. Status: Belum Disiapkan/Disusun/Review/Terkirim/Terlambat, W. **Terlambat otomatis** lewat `normalize`: hari ini > batas waktu dan status ≠ Terkirim. Terlambat tidak bisa dipilih manual.
8. Tepat Waktu?: A, "Tepat Waktu" atau "Terlambat (+n hari)" dari submit vs batas; kalau belum submit "-".
9. PIC Penyusun dan PIC Reviewer: dua teks W, harus beda (validate).
10. Bukti Submit: file ATAU nomor tanda terima (teks), K bila Terkirim (minimal salah satu).
11. Dasar Ketentuan: teks, opsional.
12. Alasan Terlambat: textarea, K bila Terlambat atau Tepat Waktu? = Terlambat.

- Kolom tabel: No, Nama Laporan, Regulator, Jenis Periode, Periode, Batas Waktu, Status, Tepat Waktu?, Penyusun.
- Cari: nama laporan, regulator, PIC. Filter: periode (batas waktu), jenis periode, status, regulator, PIC.
- Tambah: CO, manual. Ubah: PIC penyusun/reviewer (nama sama dengan user) + CO: status, tanggal submit, bukti, alasan terlambat. Tidak ada approval. Cancel: Head CLRM → Dibatalkan.
- Dashboard (5):
  1. Kalender pelaporan (CalendarCard, pilihan tampilan hari/minggu/bulan, warna per status).
  2. Bar ketepatan waktu: % tepat waktu per jenis periode dan per regulator (dua seri atau toggle).
  3. Bar bertumpuk beban laporan per jenis periode.
  4. Garis jumlah terlambat per bulan.
  5. Tabel jatuh tempo 7 hari ke depan (nama, PIC, status), kuning.
- Alert (4):
  1. Hampir jatuh tempo, H-7/H-3/H-1 (≤7 hari) belum Terkirim, kuning → PIC penyusun; CO.
  2. Terlambat (lewat batas, belum Terkirim), merah → PIC penyusun; Head CLRM.
  3. Insiden siber: laporan bernama "Laporan Insiden Siber" (flag `siber: boolean` di form untuk Insidental). Jam berjalan dari waktu kejadian: notifikasi awal ≤1 jam, laporan lengkap ≤3 hari kalender; field "Waktu notifikasi awal". Merah → Head CLRM; CISO.
  4. Terkirim tetapi bukti kosong, kuning → PIC penyusun.
- Seed: ~45 (12 bulan terakhir, berbagai periode, 2 insiden siber).

### C2. Regulatory Change — Compliance — `RegChange.tsx` — export `Daftar_Peraturan`
Kolom:
1. No: A.
2. Peraturan/Surat: tiga field Jenis (PBI, PADG, UU, Permen, Peraturan BSSN, Surat Edaran, Surat Imbauan), Nomor, Tahun; W.
3. Regulator/Penerbit: BI/PPATK/Komdigi/BSSN/Pemerintah-DPR/Lainnya, W.
4. Tentang: teks W.
5. Kategori: APU PPT/QRIS/SNAP/Pelindungan Konsumen/Ketahanan Siber/Lainnya, W.
6. Jenis Perubahan: Baru/Perubahan/Pencabutan/Imbauan, W.
7. Status Peraturan: Berlaku/Diubah/Dicabut, W.
8. Tanggal Terbit (W) dan Tanggal Berlaku (W kecuali Imbauan).
9. Tanggal Dicatat CLRM: date W (default hari ini).
10. Peraturan yang Diubah/Dicabut: select dari record RegChange lain, K bila Perubahan/Pencabutan.
11. Dampak: tingkat Tinggi/Sedang/Rendah + uraian, W (C: tanpa Berlaku/Tidak Berlaku/Perlu Dikaji). Boleh kosong selama belum dinilai, tetapi wajib sebelum Tanggal Sosialisasi diisi (CR Tambah No 1).
12. Departemen Terdampak: multiselect master, W.
13. Pemenuhan %: percent, manual, boleh kosong = belum dinilai.
14. Status Kepatuhan: A (100 Comply, 70–99 Partial, <70 Gap, kosong Belum Dinilai; warna hijau/kuning/merah).
15. Tindak Lanjut: list {uraian, PIC teks, batas waktu, status Open/Proses/Selesai}, K bila Partial/Gap.
16. Perlu Dijawab ke Regulator?: Ya/Tidak + batas waktu + tanggal dijawab, K untuk Imbauan.
17. Tanggal Sosialisasi Internal: date (W menurut CR, praktisnya boleh diisi belakangan, asumsi E).
18. SOP yang Harus Diperbarui: multiselect dari SOP berformat "No Dokumen - Judul - Departemen", tiap item punya centang "sudah diperbarui". K bila Perubahan/Pencabutan, tetapi kosong tidak memblokir simpan (C menang). Ada tombol "+ SOP cepat" (modal: No Dokumen, Judul, Departemen; sisanya default, status Dalam Review) yang menulis ke modul sop lewat `addRecord`.
19. Lampiran/Bukti: file W.

- Kolom tabel: No, Peraturan (Jenis Nomor/Tahun), Regulator, Tentang, Jenis Perubahan, Status Peraturan, Dampak, Pemenuhan, Status Kepatuhan.
- Cari: nama/nomor peraturan, tentang, kategori. Filter: periode (tgl dicatat), regulator, jenis perubahan, status kepatuhan, departemen terdampak, PIC (PIC tindak lanjut).
- Tambah: CO. Ubah: CO (penilaian 11, 13, 16–18 dan identitas), PIC (hanya item tindak lanjut yang PIC-nya dia).
- Approval: perubahan identitas peraturan (kolom 2–8, 10) pada record yang sudah ada → request "Perubahan Daftar Peraturan" ke Ketua SMKI (asumsi E).
- Cancel: Head CLRM.
- Dashboard (7):
  1. Bar bertumpuk per regulator × jenis perubahan.
  2. Garis Baru + Perubahan per bulan.
  3. Donut status kepatuhan (hijau/kuning/merah/abu).
  4. Bar rata-rata pemenuhan per kategori.
  5. Bar + tabel belum dinilai menurut umur sejak dicatat (0–10, 11–20, >20 hari), kuning.
  6. Bar mendatar tindak lanjut lewat batas per departemen, merah.
  7. Tabel/timeline: berlaku dalam 90 hari + imbauan perlu dijawab (kuning/merah).
- Alert (5):
  1. Belum dinilai >10 hari kerja sejak dicatat, kuning → CO; Head CLRM.
  2. Akan berlaku dan tindak lanjut belum selesai: H-90/60/30/7, kuning, merah saat ≤7 → PIC tindak lanjut; Head CLRM.
  3. Imbauan harus dijawab: H-7/3/1 kuning, lewat merah → CO; Head CLRM.
  4. Dicabut dan SOP terkait belum dicentang setelah tanggal berlaku/pencabutan, kuning → PIC unit; CO.
  5. Dampak Tinggi baru dicatat (≤7 hari sejak dicatat), kuning → Head CLRM; Direktur terkait.
- Seed: ~30, merujuk SOP dari `sop.shared.ts`.

### C3. SOP & Dokumen Kontrol — Compliance — `Sop.tsx` — export `Daftar_SOP`
- Tipe dan seed ada di `sop.shared.ts` (dibuat foundation, dipakai juga RegChange).
- Kolom:
  1. No Dokumen: teks W, unik (validate), mis. SOP-077-PAY. Kolom `no` urut tetap ada.
  2. Judul: W.
  3. Ringkasan: textarea W.
  4. Pemilik Dokumen: Departemen W.
  5. Tanggal Berlaku: W.
  6. Tanggal Perubahan Terakhir: W.
  7. No Revisi: teks W.
  8. Retensi dan Klasifikasi: dua select (Retensi 5/10 Tahun/Permanen; Klasifikasi Publik/Internal/Rahasia), W.
  9. File PDF: file W (G8).
  10. Tanggal Review Berikutnya: W.
  11. Status: Aktif/Dalam Review/Dicabut, W.
  12. PIC Dokumen: teks W.
- Kolom tabel: No Dokumen, Judul, Pemilik, Revisi, Tgl Perubahan, Review Berikutnya, Status.
- Cari: no dokumen, judul, ringkasan. Filter: pemilik, status, tahun berlaku, umur dokumen (<1 th, 1–2 th, >2 th).
- Tambah dan Ubah: PIC Dokumen + CO. Saat edit ada tombol/toggle "Revisi dokumen" yang mewajibkan No Revisi dan Tanggal Perubahan baru; revisi lama tersimpan sebagai `revisi: {no, tgl, file}[]` dan tampil sebagai daftar revisi di Detail (bukan Riwayat).
- Cancel: Head CLRM → status "Dicabut" (`cancelStatus: 'Dicabut'`) dengan alasan, bisa dikembalikan.
- Dashboard (5):
  1. StatCards: total, aktif, harus direview (kuning/merah).
  2. Bar mendatar per departemen.
  3. Donut per status.
  4. Bar umur dokumen.
  5. Tabel SOP yang harus direview (≤30 hari atau lewat).
- Alert (3):
  1. ≤30 hari sebelum review, kuning → PIC Dokumen; CO.
  2. Lewat tanggal review, merah → PIC Dokumen; Head CLRM.
  3. Data belum lengkap (tanpa tgl review/status/PIC; muncul dari data import), kuning → CO.
- Seed: ~25 (2–3 sengaja tidak lengkap).

### C4. Risk Register — Risk — `RiskRegister.tsx` — export `Risk_Register`
- Kolom:
  1. No: A.
  2. Konteks: teks W (C).
  3. Risk Event: textarea W.
  4. Domain: 10 pilihan CR, W.
  5. Skor Dampak 1–3, W.
  6. Skor Kemungkinan 1–3, W.
  7. Skor Total: A (D×K).
  8. Level Inherent: A (≤2 Low, 3–4 Medium, 6–9 High).
  9. Residual: disembunyikan (C).
  10. Respon: Avoid/Control/Transfer/Accept, W.
  11. Kontrol/Mitigasi: W.
  12. Departemen Pemilik: W.
  13. Tanggal Register: W.
  14. Produk: Master Produk, D.
  15. Vendor/Mitra: teks D.
  16. Posisi RAS-RT: A dengan label "logika sementara" (skor 9 atau High di domain Kepatuhan/Hukum/Siber → Melewati Batas; skor 6 → Perlu Perhatian; lainnya Dalam Batas). Fungsi `rasrt()` diisolasi di file supaya mudah diganti.
  17. Skor Lengkap?: dihapus (C).
- Kolom tabel: No, Risk Event, Domain, D, K, Skor, Level, Posisi RAS-RT, Departemen, Respon.
- Cari: no, risk event, kontrol. Filter: periode register, domain, level, departemen, respon, produk, vendor.
- Tambah: Risk Owner (PIC) + Risk Officer. Ubah: sama.
- Approval: edit oleh non-Risk Officer yang mengubah level inherent → request "Perubahan Level Risiko" ke Risk Officer. Edit lain langsung.
- Cancel: Head CLRM.
- Dashboard (5; visual 6 tidak ditampilkan):
  1. StatCards High/Medium/Low/Melewati Batas.
  2. **Heatmap 3×3**: baris Kemungkinan 3→1, kolom Dampak 1→3; isi sel "Level (skor)" + "Jumlah risiko: n"; warna sesuai level; klik sel membuka MiniTable daftar risikonya (klik baris → Detail). Toggle Awal/Setelah kontrol, dengan "Setelah kontrol" disabled dan keterangan "belum dipakai".
  3. Bar bertumpuk domain × level.
  4. Bar mendatar per departemen.
  5. Bar Perlu Perhatian/Melewati Batas per domain (kuning/merah).
- Alert (2):
  1. High baru atau naik ke High (≤7 hari sejak register / perubahan level, dari Log), merah → Risk Officer; Head CLRM; Risk Owner.
  2. RAS-RT Melewati Batas merah / Perlu Perhatian kuning → Head CLRM; Direksi.
- Seed: ~35 tersebar di semua sel heatmap.

### C5. Kajian Risiko — Risk — `Kajian.tsx` — export `Kajian_Risiko`
- Kolom:
  1. No: A.
  2. Jenis: CR/Vendor/Produk/Regulasi/Proyek, W.
  3. Judul/Objek: W.
  4. Departemen Pengusul: W.
  5. Tanggal Masuk: W.
  6. SLA: jumlah hari W + Tanggal Batas A (masuk + SLA hari kalender).
  7. Status: Baru/Proses/Review/Selesai/Batal, W.
  8. PIC: teks W.
  9. Tanggal Selesai dan 10. Hasil/Opini (Tidak Direkomendasikan/Direkomendasikan Dengan Syarat/Direkomendasikan/Risk Acceptance): tidak ada di form tambah; diisi lewat aksi baris **"Selesai"** (modal: tanggal bebas dipilih, hasil wajib) yang membuat status Selesai.
  11. Klasifikasi Regulasi: Izin/Lapor/Tidak Perlu, D.
  12–16 (hanya tampil bila Jenis = Vendor, K):
     - Nama Mitra (teks) + Konteks kerja sama.
     - Status Mitra Eksisting/Rencana.
     - Ada PKS? + tanggal.
     - Tiga Ya/Tidak akses (sistem, data pengguna/karyawan, data keuangan).
     - Pemantauan berjalan? + tanggal due diligence/evaluasi.
- Ubah batas waktu (SLA) wajib alasan (`reasonOnChange`).
- Kolom tabel: No, Jenis, Judul, Departemen, Tgl Masuk, Batas, Status, PIC, Hasil.
- Cari: no, judul, nama mitra. Filter: periode, jenis, status, PIC, departemen, hasil.
- Tambah: Risk Officer. Ubah: PIC + Risk Officer. Cancel: Head CLRM → Dibatalkan (beda dari status "Batal" pilihan CR). Tidak ada approval.
- Dashboard (7):
  1. Donut per jenis.
  2. Bar per status.
  3. Kartu + tabel lewat batas, merah.
  4. Bar mendatar per departemen.
  5. Bar rata-rata hari masuk→selesai per jenis.
  6. Donut hasil.
  7. Tabel mitra yang jadwalnya ≤30 hari atau lewat + bar Eksisting vs Rencana.
- Alert (4):
  1. Lewat batas dan belum Selesai, merah → PIC; Head CLRM.
  2. ≤2 hari kerja sebelum batas, kuning → PIC.
  3. Selesai tetapi hasil kosong (dari import), kuning → PIC; Risk Officer.
  4. Due diligence/evaluasi mitra H-30 kuning, lewat merah → PIC; Risk Officer.
- Seed: ~30 (≥8 Vendor).

### C6. Fraud Case Monitoring — Fraud — `Fraud.tsx` — export `Kasus_Fraud_EDD`
- Kolom (26):
  1. No: A (format EDD/.. tidak dipakai, lihat E).
  2. Tanggal Terima Tugas: W.
  3. Pihak Pelapor: Master Pihak Pelapor, W.
  4. Kategori Pelapor (Departemen Internal/Konsumen/Switching/Kepolisian/PJP-Bank/Bank Indonesia/Lainnya) + Media (Email/IASC/GO AML/WhatsApp/Lainnya), W.
  5. Nama Terlapor (teks, `mask`) + Jenis Pengguna Merchant/User, W.
  6. Jenis Dugaan Fraud/Judi Online/Transaksi Anomali + rincian, W.
  7. Uraian (W) + Bukti file (W).
  8. Nominal Korban: money W.
  9. RRN (`mask`, dianggap data rekening/transaksi) + Tanggal Transaksi, opsional. Tambah field "No. Rekening" D (`mask`).
  10. Hasil Asesmen Awal Dilanjutkan/Tidak + alasan, W.
  11. Hold Settlement: tanggal + nominal, opsional.
  12. Tanggal Email PPATK, opsional.
  13. EDD 1 / EDD 2: dua tanggal, K bila Dilanjutkan.
  14. Batas Waktu EDD: A, "rumus sementara" (terima + 3 hari kerja untuk EDD1; EDD2 = EDD1 + 7 hari).
  15. Hasil EDD: Tidak Respon/Kirim Bukti/Email Bouncing/Judi Online/Lainnya, W saat EDD terisi (K).
  16. Tindakan: Blokir/Watchlist/Hold Settlement/Released/Terminasi/Blokir IP/Tidak Ada Tindak Lanjut/Redundant, W.
  17. Tanggal Blokir, opsional.
  18. Released Settlement: tanggal + nominal, opsional.
  19. Saldo Tertahan: K bila Blokir.
  20. Tanggal Hapus QRIS + Tanggal Email Tutup Akun, opsional.
  21. Tanggal Lapor Komdigi/BI/PPATK, K bila Blokir.
  22. Tanggal Email Resolved: K saat Closed.
  23. Status Open/Closed/Dibatalkan, W.
  24. PIC Investigator: teks W.
  25. Group Merchant/Produk/Channel: teks D.
  26. Kerugian Paydia: money D.
- Ubah nominal atau tanggal yang sudah terisi wajib alasan (`reasonOnChange` di semua field money/date).
- Kolom tabel: No, Tgl Terima, Pihak Pelapor, Terlapor (masked), Jenis Dugaan, Nominal, Tindakan, Status, PIC.
- Masking: Nama Terlapor dan rekening/RRN tampil `B*** S****` kecuali untuk Head CLRM dan Fraud Investigator, di tabel, detail dan export.
- Cari: no, terlapor/merchant, pihak pelapor. Filter: periode, status, PIC, jenis dugaan, tindakan, sumber (kategori pelapor), group merchant, produk, channel.
- Tambah: Fraud Investigator + CO. Ubah: PIC Investigator.
- Approval: status → Closed membuat request "Penutupan Kasus" ke Head CLRM (selama menunggu status tetap Open; ditolak → tetap Open).
- Cancel: Head CLRM → Dibatalkan. "Redundant" = nilai Tindakan biasa (via Edit).
- Dashboard (10):
  1. StatCards: total, Open, Closed, dana ditahan (Σ hold), dana dikembalikan (Σ released); merah kalau ada Open >90 hari.
  2. Garis kasus per bulan (12 bulan).
  3. Donut jenis dugaan.
  4. Bar bertumpuk kategori × media.
  5. Bar per tindakan + saldo tertahan.
  6. Bar mendatar top 10 merchant/group.
  7. Combo nilai uang per bulan (bar korban/hold/released, garis saldo tertahan).
  8. Bar rata-rata dan terlama terima→EDD1, →blokir, →lapor.
  9. Bar umur Open 0–30/31–60/61–90/>90 (merah).
  10. Bar bertumpuk sudah/belum lapor per Komdigi/BI/PPATK (merah terlambat).
- Alert (6):
  1. Belum ada PIC, atau tanpa EDD/tindakan dalam 2 hari kerja, merah → Head CLRM; Fraud Investigator.
  2. EDD lewat batas dan hasil kosong, merah → PIC; Head CLRM.
  3. Hold >30 hari tanpa Released/Blokir, kuning → PIC; Head CLRM.
  4. Setelah blokir, tanggal lapor kosong melewati Komdigi 7/BI 14/PPATK 30 hari, merah → CO; Head CLRM.
  5. Open >90 hari, kuning → PIC; Head CLRM.
  6. Data penting kosong, kuning → CO.
- Seed: ~45 dalam 12 bulan.

### C7. Kontrak — Legal — `Kontrak.tsx` — export `Kontrak`
- Kolom:
  1. Jenis Hubungan: Merchant/Partner-Vendor/Paybuddy/NDA/Lainnya, W.
  2. Nama Mitra: teks W.
  3. Nomor PKS/NDA: W, unik.
  4. Jenis Dokumen: PKS QRIS/Biller Gateway/Account Linkage/Payout/Program Peningkatan Transaksi/NDA/Amandemen/Lainnya, W.
  5. Tanggal Mulai: W.
  6. Tanggal Berakhir: W menurut CR, tetapi boleh kosong (untuk kartu "kosong" dan data import; asumsi).
  7. Perpanjangan: Otomatis/Manual/Sampai Diputus/Tidak Diperpanjang + lama bulan, W.
  8. Status: Draft/Review/Aktif/Akan Berakhir/Expired/Diperpanjang/Berakhir, W. Akan Berakhir (≤90 hari) dan Expired otomatis lewat `normalize` dari tanggal berakhir bila status Aktif.
  9. Bidang Usaha: select D (F&B, Retail, Jasa, Pendidikan, Lainnya).
  10. PIC/Unit Pemilik: teks atau Departemen (dua field, salah satu wajib).
  11. Dokumen Induk: select kontrak lain, K untuk Amandemen.
  12. Kelengkapan: checklist Hardcopy diterima / Tanda tangan lengkap, D.
  13. File Perjanjian: file W.
- Kolom tabel: No, Jenis Hubungan, Mitra, Nomor, Jenis Dokumen, Mulai, Berakhir, Sisa hari, Status.
- Cari: mitra, nomor, jenis dokumen. Filter: periode, jenis hubungan, jenis dokumen, status, PIC, bidang usaha, kelompok masa berlaku (≤30/30–60/60–90/>90/Expired/kosong).
- Tambah: Legal Officer. Ubah: Legal Officer + PIC (status, tgl berakhir, perpanjangan). Cancel: Head CLRM. Tidak ada approval.
- Dashboard (9):
  1–6. Enam kartu: Aktif >90 hari hijau; 60–90 kuning; 30–60 kuning; <30 merah; Expired merah; tanggal kosong kuning.
  7. Bar per jenis dokumen.
  8. Tabel berakhir dalam 90 hari, urut terdekat.
  9. Garis kontrak baru per bulan.
- Alert (3):
  1. H-90/60/30/7, kuning, merah mulai ≤30 → Legal Officer; PIC.
  2. Expired dan belum diperpanjang, merah → Legal Officer; Head CLRM.
  3. Tanggal berakhir kosong, kuning → Legal Officer.
- Seed: ~35 (≥3 amandemen).

### C8. Permintaan APH — Legal — `Aph.tsx` — export `Permintaan_APH`
- Kolom:
  1. No: A.
  2. Tanggal Terima Surat: W.
  3. Nomor dan Tanggal Surat: W.
  4. Pengirim: Bareskrim/Polda/Polres/PPATK/Kejaksaan/Lainnya, W.
  5. Perihal: select (Permintaan Data Identitas/Permintaan Keterangan/Pemblokiran/Lainnya) + teks, W.
  6. Kasus: Judi Online/Pencucian Uang/Penipuan/Lainnya, W.
  7. Merchant dan Group Merchant: teks W.
  8. Unit Penyidik: Dittipidsiber/Ditreskrimsus/Lainnya, W. Plus Nama Penyidik dan No. Telepon (D, `noExport`; tampil di detail, lihat E).
  9. Jadwal BAP: tanggal, tanggal jadwal ulang, tempat; opsional. Perubahan jadwal BAP tercatat di Log.
  10. Status Active/Done, W.
  11. Nominal Hold Settlement dan Dana Taktis, opsional.
  12. Batas Waktu Jawaban (W) + PIC teks (W) + Tanggal Jawaban Dikirim.
- Kolom tabel: No, Tgl Terima, Nomor Surat, Pengirim, Kasus, Merchant, Batas Jawaban, Status, PIC.
- Cari: nomor surat, merchant, group, perihal. Filter: periode, status, pengirim, kasus, unit penyidik, group merchant, PIC.
- Tambah: Legal Officer. Ubah: Legal Officer + PIC. Cancel: Head CLRM. Tidak ada approval.
- Dashboard (7):
  1. StatCards Active/Done (kuning/merah kalau ada yang belum dijawab).
  2. Garis per bulan.
  3. Bar mendatar per pengirim.
  4. Donut per kasus.
  5. Bar per group merchant.
  6. Kalender BAP 30 hari ke depan (kuning ≤7, merah ≤2).
  7. Bar + tabel Active menurut umur (0–7, 8–14, 15–30, >30), merah kalau lewat batas.
- Alert (3):
  1. BAP H-7 kuning, ≤2 hari merah → Legal Officer; Head CLRM.
  2. Active dan batas jawaban lewat, merah → Legal Officer; Head CLRM.
  3. Data penting kosong, kuning → Legal Officer.
- Seed: ~30.

### C9. Perizinan & Dokumen Legalitas — Legal — `Perizinan.tsx` — export `Perizinan_Legalitas`
- Kolom:
  1. Kategori: Akta + SK/Izin/Legalitas Lainnya, W.
  2. Nama Dokumen: W.
  3. Nomor dan Penerbit: W.
  4. Tanggal Terbit/Berlaku/Kedaluwarsa: K bila Izin.
  5. Tanggal Review: opsional.
  6. Kewajiban Pelaporan terkait Izin: teks D (C).
  7. PIC: teks W.
  8. Status Aktif/Dalam Perpanjangan/Kedaluwarsa + nomor versi, W. Kedaluwarsa otomatis lewat normalize.
  9. File dokumen: file W (asumsi: link → upload mengikuti G8, lihat E).
  10. Data pribadi Direksi/Komisaris: tidak ada field. Detail menampilkan catatan "disimpan terpisah, tidak dimasukkan ke dashboard".
- Edit perpanjangan: toggle "Perpanjang izin" mewajibkan tanggal baru + versi baru; versi lama disimpan di `versi[]` dan tampil di Detail.
- Kolom tabel: No, Kategori, Nama, Nomor, Penerbit, Kedaluwarsa, Sisa hari (badge hijau/kuning/merah), Status, Versi.
- Cari: nama, nomor, penerbit. Filter: kategori, status, PIC, kelompok masa berlaku.
- Tambah: Legal Officer. Ubah: Legal Officer + PIC. Cancel: Head CLRM → "Tidak Berlaku" (`cancelStatus`), bisa dikembalikan.
- Dashboard (3):
  1. Tabel berwarna izin + kedaluwarsa + sisa hari.
  2. Kartu jumlah kedaluwarsa ≤180 hari (kuning, merah kalau ada ≤90).
  3. Donut per kategori.
- Alert (3):
  1. ≤180 hari kuning, ≤90 merah → Legal Officer; Head CLRM.
  2. Kedaluwarsa dan belum diperpanjang, merah → Legal Officer; Head CLRM; Direksi.
  3. Izin tanpa tanggal berlaku/kedaluwarsa, kuning → Legal Officer.
- Seed: ~18.

### C10. Permintaan Layanan Hukum — Legal — `LayananHukum.tsx` — export `Permintaan_Layanan_Hukum`
- Kolom:
  1. No: A.
  2. Departemen Pemohon: W.
  3. Jenis: Review/Pendapat Hukum/Penyusunan Dokumen/Konsultasi/Lainnya, W.
  4. Tanggal Masuk: W.
  5. SLA: hari W + Tanggal Batas A.
  6. Status: Baru/Proses/Selesai/Batal, W.
  7. PIC: teks W (boleh kosong saat dibuat pemohon, untuk alert 3; lihat E).
  8. Prioritas: Tinggi/Sedang/Rendah, W.
  9. Tanggal Selesai + nomor memo/pendapat hukum: K bila Selesai.
- Ubah batas waktu wajib alasan.
- Kolom tabel: No, Departemen, Jenis, Tgl Masuk, Batas, Prioritas, Status, PIC.
- Cari: no, departemen, jenis. Filter: periode, status, PIC, departemen, jenis, prioritas.
- Tambah: PIC unit (pemohon) + Legal Officer. Ubah: Legal Officer. Cancel: Head CLRM. Tidak ada approval.
- Dashboard (5):
  1. StatCards Baru/Proses/Selesai/lewat batas (merah).
  2. Donut per jenis.
  3. Bar belum selesai menurut umur 0–7/8–14/>14 (kuning/merah).
  4. Bar mendatar per departemen.
  5. Bar rata-rata lama selesai per jenis.
- Alert (3):
  1. Lewat batas dan belum Selesai, merah → PIC; Head CLRM.
  2. ≤2 hari kerja sebelum batas, kuning → PIC.
  3. Belum ada PIC >1 hari kerja sejak masuk, kuning → Head CLRM.
- Seed: ~30.

## D. Pembagian kerja paralel

### Task 0: Foundation (satu agent, selesai dan build hijau sebelum task page dimulai)
Selesaikan semua file berikut:
1. `src/kit/*` sesuai kontrak A. PageShell harus berjalan end-to-end dengan config minimal: tab, tabel, filter popover + simpan filter, Detail, Form tambah/edit dari fields (semua FieldType termasuk `list`, `checklist`, `file` via FileField, multiselect), alasan, cancel/restore, EmailSim (3 per alert, sample), Export + Log, Import Excel (template dari fields non-auto non-file, pratinjau, unduh gagal, Log), approval via `cfg.approvals`.
2. `src/shared/*`: Approval (termasuk adapter tracker), MasterData, Admin (Akun, Permission), Log (gabung audit tracker), Login (login/2FA/reset), Profile.
3. `src/pages/index.ts`: `export const PAGES: Record<string, React.ComponentType>` memetakan route → default export setiap file page. Setiap `src/pages/<X>.tsx` diisi stub yang build: config minimal (2 field, seed 3 baris, Dashboard "Segera hadir") lewat PageShell.
4. `src/pages/sop.shared.ts`: `export interface SopRec extends BaseRec {...12 kolom + revisi[]}`, `export function seedSop(today): SopRec[]` (~25), `export const sopLabel = (s: SopRec) => \`${s.noDok} - ${s.judul} - ${s.pemilik}\``.
5. `App.tsx`: AppProvider, login gate mock, sidebar/route baru, header (pemilih akun, profil, reset kedua key, badge Approval).
6. `lib.ts`: `applyTrackerRequest`. `Tracker.tsx`: `can()` + nama user dari sesi. Perilaku tracker lain tidak diubah.
7. `docs/keputusan-desain.md` (aturan dasar + kontrak), README (akun contoh, kode 2FA, asumsi), CHANGELOG/VERSION/versions.ts (ritual rilis).
8. Satu contoh lengkap kecil untuk acuan: kerjakan **Permintaan Layanan Hukum** penuh di foundation sebagai halaman referensi (terkecil, memakai SLA, hari kerja, Departemen, alert). Sisa task page jadi 9.

### Task 1–9: page (paralel, Sonnet)
Masing-masing hanya menyentuh `src/pages/<X>.tsx` dan boleh menambah file baru berprefix sama (`src/pages/<X>.*.ts(x)`, mis. `Fraud.dash.tsx`, `Fraud.seed.ts`):
Reporting, RegChange, Sop, RiskRegister, Kajian, Fraud, Kontrak, Aph, Perizinan.
- Ganti stub dengan config penuh sesuai bagian C halamannya; default export `() => <PageShell config={cfg} />`.
- Jangan ubah `src/kit`, `src/shared`, `App.tsx`, `lib.ts`, `index.ts`, `sop.shared.ts`, README, versi. Kalau kit kurang, buat helper lokal di file sendiri dan catat di ringkasan akhir sebagai "usulan kit".
- RegChange: baca SOP lewat `readModule('sop', seedSop)`, tambah SOP cepat lewat `addRecord('sop', …, seedSop)`.
- Selesai bila `npx tsc --noEmit` tanpa error di file sendiri, halaman bisa diklik (tambah, edit, approval kalau ada, cancel/restore, export, import, simulasi email), dan semua visual dan alert C muncul dengan seed.
- Integrator terakhir: build penuh, satu entri versi/CHANGELOG, deploy.

## E. Konflik terbuka dan asumsi
Keputusan konflik tracker vs MD:
- C1. SELESAI. Approval hanya untuk penutupan: edit yang mengubah status ke Selesai (dengan Validasi Ulang dan Nama Validator) membuat request "Penutupan Temuan" ke Head CLRM, semua field edit masuk request. Selama menunggu, baris tidak bisa diedit dan tidak bisa dibatalkan. Edit lain tersimpan langsung dengan audit/Log (alasan wajib bila Batas Waktu berubah). Approve/Reject hanya di menu Approval; tombol Setujui/Tolak dan dialog Persetujuan Penutupan di detail tracker dihapus. Approve: status Selesai, Persetujuan Penutupan Disetujui + nama + tanggal. Reject (catatan wajib): status tetap, Persetujuan Penutupan Ditolak + nama + tanggal.
- C2. SELESAI. Detail menampilkan baris kuning "Menunggu persetujuan Head CLRM (Penutupan Temuan)" dengan link `#/approval?id=t-<id request>`; halaman Approval membuka detail request dari query id. Tanpa tombol aksi. Riwayat tetap di menu Log.
- C3. Dipertahankan atas permintaan eksplisit user: `no` urut biasa; No Dokumen SOP dan Nomor PKS tetap teks input karena data bisnis.
- C4. Dipertahankan atas permintaan eksplisit user: 1 file per FileField.
- C5. Dipertahankan atas permintaan eksplisit user: tracker tanpa progress dan memakai unit list sendiri; halaman lain memakai Departemen.
- C6. Dipertahankan atas permintaan eksplisit user: kolom 15 tetap "Bukti Surat Regulator".
- C7. Kanal email: sudah diterapkan, tidak ada konflik.
- C8. SELESAI. Tab Table tracker punya tombol Import Excel (`src/TrackerImport.tsx`): template tanpa kolom otomatis dan file, preview validasi per baris, impor baris valid, unduh baris gagal, entri audit/Log "Import Excel". Nomor urut otomatis; file kosong dan diisi lewat Edit (form Edit tetap mewajibkan file).
- C9. SELESAI. Validasi Ulang dan Nama Validator diisi di form edit saat status Selesai, lalu ikut request penutupan (lihat C1).

Asumsi untuk halaman baru (dicatat di README/PRD):
- A1. Peran Fraud Investigator dan Ketua SMKI ditambah (ada di CR, tidak ada di daftar peran prompt revisi).
- A2. Approval Regulatory Change = edit identitas peraturan (kolom 2–8, 10) pada record lama → Ketua SMKI. Approval Risk Register = edit oleh non-Risk Officer yang mengubah level inherent.
- A3. Kolom wajib CR yang secara alur diisi belakangan (Tanggal Sosialisasi, Pemenuhan, Tanggal Berakhir kontrak, PIC Layanan Hukum) boleh kosong saat tambah, supaya alert "belum dinilai/kosong" punya arti.
- A4. Logika RAS-RT, rumus batas EDD, daftar pihak pelapor, departemen, dan nama laporan adalah data sementara (rencana tambahan bagian E).
- A5. Hari kerja = Senin–Jumat tanpa libur nasional. SLA Kajian/Layanan = hari kalender.
- A6. APH: CR bagian 6 menyebut nama penyidik dan telepon padahal kolomnya tidak ada; ditambah sebagai field opsional yang tidak ikut export. Fraud: RRN dan no rekening disamarkan.
- A7. Link Dokumen Perizinan diperlakukan sebagai upload seperti SOP/Kontrak (G8 tidak menyebut Perizinan); perlu konfirmasi.
- A8. Status "Batal" (pilihan CR di Kajian/Layanan) dan "Dibatalkan" (hasil cancel) dibedakan.
- A9. Reporting: jadwal otomatis dari daftar laporan tidak dibuat (C); Terlambat otomatis; laporan insiden siber ditandai flag.
- A10. Rename master data tidak mengubah record lama.
- A11. Logout mock kembali ke login mock; cookie gate server tetap sampai `/api/logout`.
- A12. Export semua peran (asumsi tracker dipertahankan); diatur lewat matriks permission.
