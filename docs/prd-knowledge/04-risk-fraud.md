# Knowledge mockup CLRM v2.14.4: Risk (Risk Register, Kajian Risiko) dan Fraud (Fraud Case Monitoring)

Sumber: kode di `/Users/dionscholus/Documents/claude/Paydia/dashboard CLRM/src` (HEAD main, v2.14.4, 2026-11-01). Panduan halaman (`src/guides/*.ts`) dibaca sebagai pembanding. Bila panduan dan kode berbeda, kode yang menang dan perbedaannya dicatat. Semua teks UI, rumus, dan pesan di bawah dikutip dari kode.

## 0. Konvensi umum yang berlaku di ketiga halaman (dari kit bersama `src/kit`)

Bagian ini dipakai oleh tiga halaman. Isinya tidak diulang per halaman, hanya dirujuk.

### 0.1 Kerangka halaman (`kit/PageShell.tsx`)
- Judul halaman = nama menu. Tombol Panduan Halaman ada di samping judul (isi dari `guides/*.ts`).
- Dua tab: **Dashboard** dan **Table**. Tab pertama yang aktif saat halaman dibuka = Dashboard, bila akun punya izin Dashboard; bila tidak, Table. Tab Table selalu tampil. (PageShell.tsx:23, 81)
- Tab Dashboard: di atas visual ada bar filter global **"Periode {label tanggal}"**: dua input tanggal ("dari", teks "sampai", "sampai"), tombol **Reset**, dan teks kanan `{n} data (tanpa yang dibatalkan)`. Kosong = semua data. Data berstatus Dibatalkan (field `cancelled`) tidak pernah masuk dashboard. (PageShell.tsx:88-97)
- Klik visual yang punya drill akan pindah ke tab Table dengan filter terpasang dan kolom cari dikosongkan (`drill`, PageShell.tsx:39).
- Tab Table: kolom cari (placeholder per halaman), tombol **Filter** (popover), lalu di kanan: **Export Excel** (bila izin Export), **Tambah** (bila izin Tambah). Tombol **Import Excel** disembunyikan di semua halaman (`SHOW_IMPORT = false`, PageShell.tsx:16). Sesuai keputusan: tidak ada import di UI.
- Popover **Filter** (`kit/FilterPopover.tsx`): tiap filter = satu dropdown "Pilih {label}" atau satu rentang tanggal (dua input tanggal); semua filter digabung dengan AND; tombol **Clear All** dan **Apply Filters**. Tidak ada fitur simpan filter (state `saved` dibuang di `store.tsx:80`).
- Tabel (`kit/DataTable.tsx`): kolom pertama **Nomor** = posisi baris (1..n, lanjut antar halaman, mulai lagi dari 1 saat cari/filter berubah), bukan ID data. Kolom konfigurasi bernama "No" tidak ditampilkan. Setelah kolom halaman ada kolom **Tanggal Dibuat** (format dd/mm/yyyy HH:mm) dan **Aksi**. Urutan baris tetap: Tanggal Dibuat terbaru dulu, tanpa sort kolom. Baris Dibatalkan tetap tampil dengan teks abu-abu. Kosong: "Tidak ada data".
- Pagination tabel: **Baris per halaman** 10 / 25 / 50 (awal 10); teks `{a} sampai {b} dari {n} data`; tombol `<` `>` dan nomor halaman (maksimal 7 tombol angka). (DataTable.tsx:57-70)
- Tabel mini di dashboard (`MiniTable`): kolom pertama **No** (posisi baris), 5 baris per halaman dengan pager sendiri (`useDashPaged(list, 5, [5])`, Pager.tsx:30). Klik baris membuka Detail (bila ada `onRow`).
- Tombol aksi per baris (PageShell.tsx:65-75): **Lihat Detail** (semua); **Edit** (izin Ubah, bukan Dibatalkan, tidak sedang Menunggu approval, dan lolos `canEditRow` halaman); **Batalkan** (izin Cancel, belum Dibatalkan, tidak Menunggu approval); **Kembalikan** (izin Cancel, sudah Dibatalkan); aksi baris tambahan halaman (hanya bila izin Ubah dan belum Dibatalkan).
- Modal Batalkan: judul `Batalkan {noun} {nama data}`, label **Alasan \*** (textarea), error `Alasan wajib diisi.`, tombol **Batal** / **Konfirmasi**. Modal Kembalikan: judul `Kembalikan {noun} {nama data}`, sama (alasan wajib). Hasil: status menjadi `Dibatalkan`, `cancelled = {prev: status lama, reason, by, at}`. Kembalikan memulihkan `prev`. Data tidak dihapus. (ui.tsx:82-96, store.tsx:197-208)
- Form Tambah/Edit (`kit/FormModal.tsx`): judul `Tambah {noun}` / `Ubah {noun} {nama data}`; grid 2 kolom; tombol **Batal** / **Simpan**. Bintang `*` di label = wajib pada kondisi saat ini. Field bertipe `auto` (rumus) TIDAK tampil di form Tambah maupun Edit; ia hanya tampil di Detail dan Export (`fieldsFor` memfilter `!f.auto`, FormModal.tsx:17-18). Pesan error generik: `{Label} wajib diisi`; angka: `{Label} harus berupa angka`. Di mode Edit ada kolom **Alasan perubahan** (textarea); bertanda `*` dan wajib hanya bila ada field ber-`reasonOnChange` yang sebelumnya sudah terisi lalu diubah; pesannya `Alasan wajib diisi jika {Label1}, {Label2} diubah`.
- Select dengan opsi "Lainnya": memilih Lainnya memunculkan input teks (placeholder `Sebutkan lainnya`, maksimal 255 karakter), pesan error `Wajib diisi jika memilih Lainnya`. Tabel menampilkan teks bebas sebagai "Lainnya"; Detail dan Export menampilkan teks aslinya. (`kit/Lainnya.tsx`)
- Upload file (`ui.tsx` FileField, `lib.ts:298-312`): PDF, JPG, JPEG, PNG; maksimal 25 MB; 1 file. Pesan: `Hanya boleh 1 file`, `File kosong`, `Format file harus PDF, JPG, JPEG, atau PNG`, `Tipe file tidak terbaca. Format file harus PDF, JPG, JPEG, atau PNG`, `Ukuran file maksimal 25 MB`. Teks bantu: "PDF, JPG, JPEG, PNG. Maks 25 MB, 1 file." Ekstensi DAN MIME harus cocok. File hanya disimpan sebagai metadata (nama, ukuran, tipe); di Detail tampil sebagai teks `{nama} ({ukuran})`, tidak ada tautan buka/unduh.
- Detail (`kit/DetailModal.tsx`): judul "Detail"; badge alert aktif di atas (teks `{label alert}: {detail}`, tooltip berisi aturan dan penerima); banner kuning "Menunggu persetujuan {approver}" + `{jenis}, diajukan oleh {pengaju}, {waktu}` + tautan "Lihat di menu Approval" bila ada request Menunggu; banner abu-abu pembatalan `Dibatalkan oleh {nama}, {tanggal}. Alasan: {alasan}. Status sebelumnya: {status}.`; lalu "Tanggal Dibuat" (dd/mm/yyyy HH:mm:ss) dan semua field (termasuk field otomatis; field `showIf` hanya bila kondisinya terpenuhi; nilai kosong tampil "-"); lalu **Log Perubahan**; tombol **Tutup**. Detail tidak tampil alert untuk data Dibatalkan.
- Log Perubahan di Detail mencatat: data dibuat, perubahan data (sebelum, sesudah, siapa, kapan, alasan), pengajuan approval, keputusan Approve/Reject beserta catatan, pembatalan, pengembalian (`store.tsx` `mkLog`, `kit/history.tsx`).
- Export Excel (`kit/exportXlsx.ts`): baris = baris yang tampil di Table (mengikuti cari dan filter, TERMASUK baris Dibatalkan karena `shown` dari `api.rows`); urutan Tanggal Dibuat terbaru dulu; kolom: `Nomor` (posisi), `Tanggal Dibuat` (dd/mm/yyyy HH:mm:ss), lalu semua field halaman berurutan seperti definisi (termasuk field otomatis; field `showIf` yang tidak terpenuhi dilewati); angka (number/money/percent) tetap angka; tanggal diformat dd/mm/yyyy; nama file `{prefix}_{YYYY-MM-DD hari ini}.xlsx`; nama sheet = judul halaman. Tercatat di Log: modul = judul halaman, aksi `Export`, keterangan `{n} baris`. (PageShell.tsx:108)
- Notifikasi (`kit/notify.tsx`): semua alert muncul sebagai notifikasi di ikon lonceng header, dihitung langsung dari data (tidak disimpan), tanpa email dan tanpa Telegram. Hanya penerima yang tercantum yang melihatnya; **Super Admin melihat semua**; syarat tambahan: akun harus punya izin Lihat pada modul itu. Cocok penerima: token `to` = nama peran persis; `PIC (Nama)` cocok ke akun bernama itu; token `PIC` cocok ke semua akun berperan PIC; `Risk Owner (Departemen)` cocok ke akun dengan departemen itu. Penerima tanpa akun demo hanya terlihat Super Admin. Data Dibatalkan tidak memicu notifikasi. Status baca per akun di localStorage; tombol "Tandai semua dibaca". Klik notifikasi membuka halaman dan Detail data. Notifikasi berhenti (hilang) otomatis saat kondisi pemicu tidak lagi benar; tidak ada pengulangan/pengingat berkala.
- Master Data default (`store.tsx:26-35`): `unitKerja` (label menu "Unit Kerja") = Internal Audit, Business, Operation, Information Technology, Compliance Legal & Risk Management, Support, Finance, Accounting, Tax & Treasury (7 item; dikutip dari `UNITS` di lib.ts:13); `pic` (label di menu belum dicek) = Regie, Fakhri, Osama; `produk` = UE, QRIS, Biller; `mitra` (label "Mitra Vendor") = 16 nama PT/Bank/CV; `kategoriPelapor` = Departemen Internal, Konsumen, Switching, PJP/Bank, Institusi Berwenang Lainnya, Kepolisian, Bank Indonesia, Asosiasi; `mediaPelapor` = Email, IASC, GO AML, WhatsApp. "Lainnya" tidak disimpan di master; dropdown menambahkannya otomatis bila halaman memakai `withLainnya`.
- Approval (`store.tsx:170-196`, `shared/Approval.tsx:18`): bila `needs()` benar saat Edit, kolom yang masuk `keys` (atau semua kolom yang berubah bila `keys` kosong) tidak disimpan langsung melainkan dibuat request berstatus Menunggu; kolom lain yang berubah langsung tersimpan. Selama Menunggu data terkunci (tombol Edit dan Batalkan hilang). Setuju = nilai baru diterapkan; Tolak = nilai lama tetap (`rejectPatch` tidak ada untuk Risk dan Fraud). Yang boleh memutuskan (`canDecide`): status Menunggu, DAN (peran = approver ATAU Super Admin), DAN izin Approve pada modul, DAN izin Ubah pada kategori Approval. Keputusan tercatat di Log Perubahan dan menu Log.

### 0.2 Izin per peran, dua lapis (PENTING untuk PRD)

Lapis A, matriks default berbasis peran (`kit/perms.ts` DEFAULT_PERMS; sama dengan panduan halaman):
- Semua peran: Lihat dan Export pada tiap halaman modul. Super Admin: semua aksi.
- Tambah: Risk Register = Risk Officer, PIC. Kajian Risiko = Risk Officer. Fraud = Fraud Investigator, Compliance Officer.
- Ubah: Risk Register = Risk Officer, PIC. Kajian Risiko = Risk Officer, PIC. Fraud = Fraud Investigator, Compliance Officer, PIC.
- Cancel (Batalkan dan Kembalikan): hanya Head CLRM (dan Super Admin).
- Approve: Risk Register = Risk Officer. Fraud = Head CLRM. Kajian = tidak ada.
- "Import" ikut pada peran yang boleh Tambah, tetapi tombolnya disembunyikan.

Lapis B, yang benar-benar dipakai UI sejak v2.14 (`store.tsx:115`: `can` memakai `canAccount` bila akun punya `permissions`, dan semua akun seed punya `permissions = permsOf(role)`):
- Izin per akun dipecah per KATEGORI (`perms.ts:52-61`): kategori **Risk** menaungi Risk Register DAN Kajian Risiko sekaligus; kategori **Fraud** menaungi Fraud Case Monitoring. Aksi per kategori: View, Create, Update, Export, Approve, Dashboard.
- Aksi lama dipetakan: View=Lihat, Create=Tambah, **Update = Ubah + Cancel** (satu saklar untuk Edit, Batalkan, Kembalikan, dan aksi baris seperti Selesai), Export, Approve, Dashboard=tab Dashboard (default turunan dari Lihat).
- Izin awal akun = turunan matriks peran: kategori memberi aksi bila SALAH SATU halaman dalam kategori memberinya (`permsOf`/`grants`, perms.ts:65-71).
- Akibat efektif pada default (diverifikasi 1 November 2026 dengan menjalankan `permsOf` lalu `canAccount` dari `src/kit/perms.ts` untuk 9 peran; matriks lengkap ada di `00-index.md` bagian E): 
  - Risk Register dan Kajian Risiko memakai izin yang sama. Risk Officer: View, Create, Update, Export, Approve, Dashboard. PIC: View, Create, Update, Export, Dashboard (jadi PIC melihat tombol Tambah di Kajian Risiko juga, walau panduan Kajian menyatakan PIC tidak dapat menambah). Head CLRM: View, Update, Export, Dashboard (jadi Head CLRM juga melihat tombol Edit dan aksi Selesai, bukan hanya Batalkan/Kembalikan). Risk Officer dan PIC juga melihat Batalkan/Kembalikan (karena Update = Ubah + Cancel), padahal panduan menyatakan hanya Head CLRM. Compliance Officer, Legal Officer, Fraud Investigator, Ketua SMKI, Viewer: View, Export, Dashboard.
  - Fraud: Head CLRM: View, Update, Export, Approve, Dashboard (melihat Edit dan Batalkan). Fraud Investigator dan Compliance Officer: View, Create, Update, Export, Dashboard (melihat Batalkan/Kembalikan juga). PIC: View, Update, Export, Dashboard. Risk Officer, Legal Officer, Ketua SMKI, Viewer: View, Export, Dashboard. Super Admin: semua.
  - Pembatas tambahan per baris (`canEditRow`) tetap berlaku di atas izin ini (lihat per halaman).
- Admin > Manage Permissions (Super Admin) dapat mengubah izin per akun; ini menimpa default di atas. Kategori `approval` aksi Update menentukan tombol Approve/Reject.
- Selisih panduan vs kode: panduan masih menulis matriks Lapis A. Sebagai kebenaran perilaku, PRD sebaiknya meminta konfirmasi mana yang menjadi kebutuhan (lihat Selisih di tiap halaman).

---

## Risk Register (menu: Risk > Risk Register)

- Ringkasan: mencatat daftar risiko (risk event) dengan skor inherent Dampak x Kemungkinan (skala 1-3) dan kontrol/mitigasinya, lalu memantau sebaran lewat heatmap 3 x 3, kartu level, dan grafik per domain dan unit.
- Prasyarat akses: butuh izin Lihat modul Risk (semua peran punya). Tab Dashboard butuh izin Dashboard kategori Risk. Detail izin lihat bagian Peran di bawah. Rute: `risk/risk-register`.

### Tab Dashboard
Filter global halaman: **Periode Tanggal Register** (dua tanggal + Reset). Memfilter semua visual berdasarkan `Tanggal Register`. Kosong = semua data. Risiko Dibatalkan tidak dihitung.

**Kartu angka (judul grup "Ringkasan", ada ikon (i))**: 3 kartu, bentuk kartu angka, urutan High, Medium, Low.
- `High` (warna merah), `Medium` (kuning), `Low` (hijau). Isi = jumlah risiko pada periode dengan Level inherent tersebut. Level = fungsi skor: skor 1-2 Low, skor 3-4 Medium, skor 6-9 High (`levelOf`: skor kosong/0 -> '', `<=2` Low, `<=4` Medium, selain itu High).
- Klik kartu: buka tab Table dengan filter Level = nilai kartu.
- Info (i): apa = "Jumlah risiko per Level (inherent) pada Periode yang dipilih." baca = "High: skor 6-9. Medium: skor 3-4. Low: skor 1-2. Skor = Dampak x Kemungkinan." dan "Klik kartu untuk membuka Table terfilter Level tersebut."

**Heatmap risiko (Dampak x Kemungkinan)** (kartu sendiri, ada (i))
- Bentuk: grid 3 x 3 berisi tombol. Sumbu horizontal: label bawah "Dampak Rendah / Dampak Sedang / Dampak Tinggi" (skor 1,2,3 kiri ke kanan). Sumbu vertikal: label kiri "Kemungkinan Tinggi / Kemungkinan Sedang / Kemungkinan Rendah" (skor 3 di atas, 1 di bawah).
- Isi tiap kotak: baris 1 `{Level} (Skor {Dampak x Kemungkinan})`, baris 2 `Jumlah risiko: {n}`. n = jumlah risiko (pada periode) dengan Dampak dan Kemungkinan persis itu.
- Warna kotak = level skor kotak (bukan isi): hijau Low (skor 1,2), kuning Medium (skor 3,4), merah High (skor 6,9). Seluruh sembilan kotak selalu tampil walau n = 0.
- Interaksi: klik kotak menandai kotak (ring biru) dan menampilkan tabel mini di bawah heatmap berjudul `Risiko: Dampak {Rendah|Sedang|Tinggi}, Kemungkinan {Rendah|Sedang|Tinggi} ({n})`. Kolom: No, Risk Event, Domain, Unit Kerja. 5 baris per halaman. Klik baris membuka Detail risiko. Sebelum ada kotak dipilih tampil teks "Klik kotak untuk melihat daftar risiko." Tidak ada aksi untuk membatalkan pilihan kotak.
- Info (i): apa = "Peta 3 x 3 yang menempatkan tiap risiko menurut Skor Dampak dan Skor Kemungkinan (level awal / inherent), pada Periode yang dipilih." baca = sumbu horizontal Dampak (Rendah, Sedang, Tinggi), vertikal Kemungkinan; isi kotak Level, Skor, jumlah; warna hijau Low (1-2), kuning Medium (3-4), merah High (6-9); klik kotak menampilkan daftar di bawah heatmap.

**Risiko per domain menurut level** (bar vertikal bertumpuk, ada (i))
- Sumbu X: 10 Domain Risiko, selalu semua tampil, urutan tetap: Operasional, Likuiditas, Keuangan, Kredit, Kepatuhan, Hukum, Strategis, Reputasi, Pelindungan Konsumen, Ketahanan dan Keamanan Siber. Sumbu Y: jumlah. Tumpukan: High (merah), Medium (kuning), Low (hijau). Tooltip standar menampilkan jumlah per level.
- Klik batang (bagian mana pun): tab Table terfilter Domain tersebut.
- Info (i): apa = "Jumlah risiko di tiap Domain Risiko (10 domain), ditumpuk menurut Level inherent."
- Bila tidak ada data semua nol: tampil "Tidak ada data".

**Risiko per unit kerja pemilik** (bar horizontal, ada (i))
- Sumbu Y: Unit Kerja pemilik; HANYA unit yang punya risiko pada periode ini; urut jumlah terbanyak ke sedikit. Sumbu X: jumlah. Satu seri `Jumlah`. Tooltip kustom: `{Unit}: {total}` lalu baris `High: n`, `Medium: n`, `Low: n`.
- Klik batang: tab Table terfilter Unit Kerja tersebut.
- Info (i): apa = "Jumlah risiko per Unit Pemilik Risiko. Hanya Unit Kerja yang punya risiko pada periode ini yang tampil, urut dari terbanyak."

### Tab Table
- Kolom (urutan): Nomor, **Risk Event**, **Domain**, **Skor Dampak**, **Skor Kemungkinan**, **Skor Total**, **Level** (pill: High merah, Medium kuning, Low hijau), **Unit Kerja**, **Respon**, Tanggal Dibuat, Aksi. Kolom "No" internal disembunyikan.
- Pagination: 10/25/50 (lihat 0.1).
- Cari: placeholder "Cari nomor, risk event, kontrol"; mencari di `{nomor internal} {Risk Event} {Kontrol / Mitigasi}` (case-insensitive, substring). Catatan: nomor yang dicari adalah nomor internal (`no`), bukan kolom Nomor yang tampil (posisi baris).
- Filter (7, semua dropdown kecuali periode, digabung AND): **Periode Register** (rentang tanggal, terhadap Tanggal Register), **Domain** (10 domain), **Level** (High, Medium, Low; terhadap level hasil hitung), **Unit Kerja** (Master Unit Kerja), **Respon** (Avoid, Control, Transfer, Accept), **Produk** (Master Produk), **Vendor / Mitra** (Master Mitra Vendor). Tidak ada simpan filter.
- Tombol: **Export Excel**, **Tambah**, aksi baris (lihat 0.1). Tidak ada aksi baris khusus.
- Export: nama file `Risk_Register_{tanggal}.xlsx`, sheet "Risk Register". Kolom setelah Nomor dan Tanggal Dibuat, berurutan: Konteks (Proses / Aktivitas); Risk Event; Domain Risiko; Skor Dampak (1 Rendah, 2 Sedang, 3 Tinggi); Skor Kemungkinan (1-3); Skor Total; Level Risiko Awal (Inherent); Respon; Kontrol / Mitigasi; Unit Pemilik Risiko (Unit Kerja); Tanggal Register; Produk; Vendor / Mitra. Tidak ada kolom status (Risk Register tidak punya field status di form; status internal `Aktif`/`Dibatalkan`). Tidak ada masking. Data mengikuti cari dan filter. Tercatat di Log (`{n} baris`).
- Badge/warna baris: pill Level (High merah, Medium kuning, Low hijau); baris Dibatalkan abu-abu.

### Form Tambah
Tombol **Tambah** muncul bila akun punya izin Tambah (default: Risk Officer, PIC, Super Admin).

| Label persis | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
|---|---|---|---|---|---|---|
| Konteks (Proses / Aktivitas) | teks 1 baris | bebas | Wajib | - | selalu | `Konteks (Proses / Aktivitas) wajib diisi` |
| Risk Event | textarea (lebar penuh) | bebas | Wajib | - | selalu | `Risk Event wajib diisi` |
| Domain Risiko | select | 10 domain tetap (daftar kode, bukan Master Data) | Wajib | - | selalu | `Domain Risiko wajib diisi` |
| Skor Dampak (1 Rendah, 2 Sedang, 3 Tinggi) | select angka | 1, 2, 3 | Wajib | - | selalu | `Skor Dampak (1 Rendah, 2 Sedang, 3 Tinggi) wajib diisi` |
| Skor Kemungkinan (1-3) | select angka | 1, 2, 3 | Wajib | - | selalu | `Skor Kemungkinan (1-3) wajib diisi` |
| Respon | select | Avoid, Control, Transfer, Accept | Wajib | - | selalu | `Respon wajib diisi` |
| Kontrol / Mitigasi | textarea (lebar penuh) | bebas | Wajib | - | selalu | `Kontrol / Mitigasi wajib diisi` |
| Unit Pemilik Risiko (Unit Kerja) | select | Master Data Unit Kerja | Wajib | - | selalu | `Unit Pemilik Risiko (Unit Kerja) wajib diisi` |
| Tanggal Register | date | - | Wajib | - | selalu | `Tanggal Register wajib diisi` (tidak ada batas tanggal) |
| Produk | select | Master Data Produk (UE, QRIS, Biller) | Opsional | - | selalu | - |
| Vendor / Mitra | select | Master Data Mitra Vendor | Opsional | - | selalu | - |

- Field otomatis (tidak ada di form, hanya di Detail dan Export): **Skor Total** = Skor Dampak x Skor Kemungkinan (kosong bila salah satu kosong); **Level Risiko Awal (Inherent)** = Low/Medium/High dari skor. Pengguna tidak melihat pratinjau skor saat mengisi form.
- Field internal `levelAt` (tanggal level inherent terakhir naik): diisi otomatis `hari ini` saat simpan Tambah (BUKAN dari Tanggal Register) dan saat Edit membuat level naik (rank Low<Medium<High). Dipakai alert High. Tidak tampil di UI.
- Status awal internal: `Aktif`.
- Tidak ada upload file di halaman ini.
- Status yang tidak bisa dipilih saat tambah: tidak ada field status.

### Edit
- Siapa boleh: izin Ubah (default Risk Officer, PIC, Super Admin). `canEditRow`: PIC hanya bila `Unit Kerja risiko = departemen akun` (mis. akun PIC "Regie" departemen Business hanya risiko Unit Kerja Business). Tombol Edit hilang bila risiko Dibatalkan atau Menunggu approval.
- Kolom terkunci: tidak ada (semua field form dapat diubah).
- Alasan perubahan: kolom ada, TIDAK pernah wajib (tidak ada field `reasonOnChange`); panduan menyarankan diisi bila skor berubah karena ikut ke approver.
- Perubahan yang memicu approval: aturan **Perubahan Level Risiko**, approver **Risk Officer**: terpicu bila peran pengubah BUKAN Risk Officer (Super Admin juga terpicu) DAN Level inherent lama berbeda dengan Level baru (naik atau turun). Hanya `Skor Dampak` dan `Skor Kemungkinan` yang masuk request; perubahan kolom lain di save yang sama langsung tersimpan. Bila skor berubah tetapi level sama, tidak ada approval (langsung tersimpan). Risk Officer mengedit tanpa approval.

### Lihat Detail
- Isi: Tanggal Dibuat; seluruh 13 field (termasuk Skor Total dan Level Risiko Awal), badge alert aktif (alert High), banner Menunggu approval, banner pembatalan, Log Perubahan.
- Tidak ada file, tidak ada sensor/ikon mata.

### Status dan transisi
- Status internal: `Aktif` (awal), `Dibatalkan`. Tidak ada status lain; tidak ditampilkan sebagai kolom.
- Status otomatis: tidak ada (Level adalah rumus, bukan status).
- Batalkan: tombol hanya bila izin Cancel (default Head CLRM, Super Admin); alasan wajib; tidak bisa saat Menunggu approval; hasil status `Dibatalkan`, keluar dari dashboard dan alert, tetap tampil di Table dan ikut Export. Kembalikan: izin Cancel, alasan wajib, status kembali ke `Aktif`.

### Approval
- Pemicu: Edit yang mengubah Level oleh non-Risk Officer (lihat Edit). Jenis: `Perubahan Level Risiko`. Approver: Risk Officer (Super Admin juga dapat memutuskan).
- Isi request: label field "Skor Dampak (1 Rendah, 2 Sedang, 3 Tinggi)" / "Skor Kemungkinan (1-3)" lama -> baru; alasan pengaju; `levelAt` baru ikut sebagai data tambahan bila level naik.
- Setuju: skor baru berlaku, Level ikut berubah, `levelAt` terpasang (bila naik). Tolak: skor lama tetap.
- Selama Menunggu: risiko terkunci (tanpa Edit dan Batalkan), Detail menampilkan banner.
- Seed: 4 request (risk-2 dan risk-14 Menunggu; risk-5 Disetujui; risk-12 Ditolak).

### Notifikasi / alert
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul notifikasi | Berhenti |
|---|---|---|---|---|---|
| Risiko High baru / naik ke High | Level inherent = High DAN `levelAt` terisi DAN `hari ini - levelAt <= 7` hari kalender (`diffDays(today, levelAt) <= 7`) | merah | Risk Officer, Head CLRM, `Risk Owner ({Unit Kerja risiko})` (akun yang departemennya sama dengan Unit Kerja) | "Risiko High baru / naik ke High" | Setelah 7 hari sejak `levelAt`, bila level turun dari High, atau risiko Dibatalkan |
- Detail alert: `High sejak {dd/mm/yyyy} (skor {n})`. Teks notifikasi: `Risiko "{Risk Event}" dengan level High sejak {tanggal} (skor {n}). Perlu rencana mitigasi dan eskalasi.`
- Risiko Low/Medium tidak memicu alert. Tidak ada filter status "Aktif" eksplisit selain Dibatalkan dikecualikan.

### Peran
Matriks default (Lapis A) untuk Risk Register:

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Sensor |
|---|---|---|---|---|---|---|---|
| Super Admin | ya | ya | ya | ya | ya | ya | n/a |
| Head CLRM | ya | tidak | tidak | ya | tidak | ya | n/a |
| Compliance Officer | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Risk Officer | ya | ya | ya | tidak | ya (Perubahan Level Risiko) | ya | n/a |
| Legal Officer | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Fraud Investigator | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Ketua SMKI | ya | tidak | tidak | tidak | tidak | ya | n/a |
| PIC | ya | ya | ya (hanya Unit Kerja = departemen akun) | tidak | tidak | ya | n/a |
| Viewer | ya | tidak | tidak | tidak | tidak | ya | n/a |
- "Milik sendiri": PIC hanya Edit risiko Unit Kerja miliknya; Tambah tidak dibatasi unit.
- Sejak v2.14 izin per akun (Admin > Manage Permissions) mengubah default ini; efektif Update = Ubah + Cancel dan kategori Risk dipakai bersama Kajian Risiko (lihat 0.2 Lapis B).

### Kondisi khusus dan prasyarat
- Alert High hanya untuk Level High dan `levelAt` <= 7 hari; Medium/Low tidak pernah.
- `levelAt` hanya diperbarui saat Tambah atau saat level NAIK; turun atau tetap tidak mengubahnya.
- Approval hanya muncul bila pengubah bukan Risk Officer dan level berubah.
- Edit/Batalkan hilang selama Menunggu approval.
- Edit PIC dibatasi Unit Kerja = departemen akun.
- Kotak heatmap: daftar risiko muncul hanya setelah klik kotak.
- Grafik per unit kerja hanya menampilkan unit yang punya risiko; grafik per domain selalu 10 domain.
- Kartu High/Medium/Low dan heatmap mengikuti Periode Tanggal Register.
- Field Skor Total dan Level tidak tampil di form; hanya Detail/Export/Table.

### Data contoh (bukan requirement)
35 risiko, dibuat oleh "Rudi Hartono", semua 9 sel heatmap terisi (jumlah per sel: D1K1=3, D1K2=3, D1K3=4, D2K1=3, D2K2=5, D2K3=4, D3K1=4, D3K2=4, D3K3=5); level: High 13, Medium 13, Low 9. Register 1 sampai 91 hari lalu; sebagian High baru (1-6 hari) memicu alert. Unit Kerja seed memakai 6 dari 7 departemen (tanpa Internal Audit). Produk UE/QRIS/Biller/kosong dan vendor bergantian.

### Sumber kode
- `src/pages/RiskRegister.tsx`: konstanta 16-26; fields 28-42; columns 43-53; filters 55-63; alerts 65-70; seed 72-96; Heatmap 100-130; cfg 132-166 (canEditRow 139, normalize 140, beforeSave 141, approvals 142-145, dashDate 146, Dashboard 147-165).
- `src/guides/risk.ts`; `src/kit/PageShell.tsx`, `FormModal.tsx`, `DataTable.tsx`, `DetailModal.tsx`, `store.tsx:170-196`, `kit/approvalSeed.ts` (risk-2, 14, 5, 12), `kit/notify.tsx:94-97`, `kit/perms.ts`.

### Selisih dengan keputusan final
Cocok dengan keputusan: Konteks (proses bisnis) teks bebas; Residual tidak dipakai; kolom/posisi RAS-RT dihapus seluruhnya; heatmap 3x3 (dampak x kemungkinan) tetap; tidak ada kolom/visual "Skor Lengkap"; skor wajib; Batalkan wajib alasan, data tidak dihapus; tab Dashboard tab pertama; Produk dan Vendor/Mitra dari Master Data.
Berbeda atau tambahan (dicatat, tidak dipilih):
1. Penamaan unit kerja: keputusan "Semua kolom unit kerja bernama Departemen, pilihan dari Master Data Departemen". Mockup memakai label "Unit Pemilik Risiko (Unit Kerja)", kolom/filter "Unit Kerja", Master Data "Unit Kerja". Daftar nilainya mengikuti dokumen HR (7 departemen).
2. Approval Risk Register ("Perubahan Level Risiko", approver Risk Officer) tidak tercantum di daftar approval keputusan (hanya tutup temuan Tracker dan close case Fraud + "persetujuan lain yang ada di CR"). Mockup menambahkannya. [tidak pasti: apakah ada di CR].
3. Alert "Risiko High baru / naik ke High" (7 hari, penerima Risk Officer, Head CLRM, Risk Owner) tidak ada di keputusan; tambahan mockup.
4. Domain Risiko 10 nilai tetap di kode (bukan Master Data); keputusan tidak membahas daftar domain.
5. Kolom "Skor Dampak", "Skor Kemungkinan", "Skor Total", "Level" di tabel dan Export: keputusan hanya bilang "Skor Lengkap" tidak dipakai; kolom skor sendiri adalah tambahan mockup.
6. Dashboard: kartu level, grafik per domain, grafik per unit kerja: bukan bagian keputusan; mengikuti CR [tidak pasti].
7. Alasan perubahan Edit tidak wajib; keputusan tidak menyebut aturan ini untuk Risk.
8. Izin: lihat 0.2; kode efektif berbeda dari panduan.

---

## Kajian Risiko (menu: Risk > Kajian Risiko)

- Ringkasan: mencatat permintaan kajian risiko (CR, Vendor, Produk, Regulasi, Proyek) dengan SLA hari kalender, PIC, hasil/opini Risk Management, dan data due diligence mitra untuk Jenis Vendor.
- Prasyarat akses: izin Lihat modul Kajian (semua peran). Tab Dashboard butuh izin Dashboard kategori Risk. Rute `risk/kajian-risiko`.

### Tab Dashboard
Filter global: **Periode Tanggal Masuk** (dua tanggal + Reset). Memfilter semua visual berdasarkan Tanggal Masuk. Kajian Dibatalkan (oleh Head CLRM) tidak dihitung; status manual `Batal` tetap dihitung.

Delapan kartu, urutan dan judul persis:
1. **Kajian per jenis** (donut, ada (i)): irisan per Jenis (CR, Vendor, Produk, Regulasi, Proyek); irisan bernilai 0 tidak digambar; palet warna bawaan chart. Klik irisan: Table terfilter Jenis. Info: "Komposisi kajian menurut Jenis (CR, Vendor, Produk, Regulasi, Proyek) pada Periode Tanggal Masuk yang dipilih."
2. **Kajian per status** (bar vertikal, satu seri `Jumlah`): 5 batang Baru, Proses, Review, Selesai, Batal (status manual, bukan "Dibatalkan"). Klik batang: Table terfilter Status. Info: "Jumlah kajian di tiap Status: Baru, Proses, Review, Selesai, dan Batal."
3. **Lewat batas waktu ({n})** (kartu dengan angka merah besar + tabel mini): kajian dengan `lateDays > 0`, yaitu status BUKAN Selesai dan BUKAN Batal, Tanggal Batas ada, dan `hari ini - Tanggal Batas > 0`. Tanggal Batas = Tanggal Masuk + SLA (hari kalender). Kolom tabel: No, Judul, PIC, Batas, Lewat (merah, `{n} hari`). 5 baris per halaman; klik baris buka Detail; kosong: "Tidak ada kajian lewat batas". Info: "Kajian yang Tanggal Batas-nya (Tanggal Masuk + SLA hari kalender) sudah lewat dan statusnya belum Selesai atau Batal."
4. **Kajian per unit kerja** (bar horizontal): SEMUA Unit Kerja dari Master Data tampil termasuk yang nol; satu seri `Jumlah`. Klik batang: Table terfilter Unit Kerja. Info: "Jumlah kajian per Unit Kerja pengusul. Semua Unit Kerja dari Master Data ditampilkan, termasuk yang berjumlah nol."
5. **Rata-rata lama masuk sampai selesai per jenis (hari)** (bar vertikal, sumbu "Hari", seri `Hari`): per Jenis, rata-rata `Tanggal Selesai - Tanggal Masuk` (hari kalender) hanya untuk kajian status Selesai yang punya Tanggal Selesai, dibulatkan (`Math.round`); jenis tanpa data = 0. Tidak bisa diklik. Info: "Rata-rata hari kalender dari Tanggal Masuk sampai Tanggal Selesai, per Jenis, hanya untuk kajian berstatus Selesai yang punya Tanggal Selesai. Dibulatkan ke hari terdekat."
6. **Kajian per hasil / opini** (donut): irisan per Hasil (Tidak Direkomendasikan, Direkomendasikan Dengan Syarat, Direkomendasikan, Risk Acceptance); hanya kajian yang punya hasil. Klik irisan: Table terfilter Hasil. Info: "Komposisi Hasil / Opini Risk Management. Hanya kajian yang sudah punya hasil (diisi lewat aksi Selesai) yang dihitung."
7. **Jadwal evaluasi mitra akan tiba / terlewat (≤ 30 hari)** (tabel mini): kajian Jenis Vendor dengan Tanggal Due Diligence / Evaluasi terisi dan `jadwal - hari ini <= 30` (termasuk yang sudah lewat), urut jadwal paling awal; TIDAK memfilter status. Kolom: No, Mitra, Status (Status Mitra), Jadwal, Sisa (merah `Lewat {n} hari` bila lewat; teks oranye `{n} hari lagi`). Klik baris buka Detail; kosong "Tidak ada jadwal dekat". 
8. **Mitra Eksisting vs Rencana** (bar vertikal, dua batang Eksisting dan Rencana, seri `Jumlah`): jumlah kajian Jenis Vendor yang Tanggal Due Diligence / Evaluasi-nya terisi, per Status Mitra. Tidak bisa diklik.

### Tab Table
- Kolom: Nomor, **Jenis**, **Judul / Objek**, **Unit Kerja**, **Tgl Masuk**, **Batas** (otomatis), **Status** (pill: Baru biru; Proses kuning; Review kuning; Selesai hijau; Batal abu-abu), **PIC** ("-" bila kosong), **Hasil** ("-" bila kosong), Tanggal Dibuat, Aksi.
- Pagination: 10/25/50.
- Cari: placeholder "Cari nomor, judul, nama mitra"; mencari di `{nomor internal} {Judul} {Nama Mitra}`.
- Filter (6): **Periode (Tanggal Masuk)** (rentang), **Jenis** (CR, Vendor, Produk, Regulasi, Proyek), **Status** (Baru, Proses, Review, Selesai, Batal, Dibatalkan), **PIC** (nilai unik dari data), **Unit Kerja** (Master Unit Kerja), **Hasil** (4 hasil). Tidak ada simpan filter.
- Tombol: Export Excel, Tambah, per baris: Lihat Detail, Edit, Batalkan, Kembalikan, dan aksi baris **Selesai** (ikon centang).
- Export: `Kajian_Risiko_{tanggal}.xlsx`, sheet "Kajian Risiko". Kolom berurutan: Nomor, Tanggal Dibuat, Jenis, Judul / Objek, Unit Kerja Pengusul, Tanggal Masuk, SLA (hari kalender), Tanggal Batas, Status, PIC, Tanggal Selesai, Hasil / Opini Risk Management, Klasifikasi Regulasi, lalu kolom vendor (Nama Mitra, Konteks Kerja Sama, Status Mitra, Ada PKS?, Tanggal PKS, Akses ke Sistem?, Akses Data Pengguna / Karyawan?, Akses Data Keuangan?, Pemantauan Berjalan?, Tanggal Due Diligence / Evaluasi) yang dilewati pada baris non-Vendor (Tanggal PKS juga dilewati bila Ada PKS? bukan Ya). [tidak pasti: apakah kolom vendor tetap muncul sebagai header kosong untuk baris non-Vendor; bergantung perilaku pembuat sheet]. Mengikuti cari dan filter. Tidak ada masking. Tercatat di Log.

### Form Tambah
Tombol Tambah: default hanya Risk Officer dan Super Admin (Lapis A); efektif juga PIC (Lapis B, lihat 0.2).

| Label persis | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
|---|---|---|---|---|---|---|
| Jenis | select | CR, Vendor, Produk, Regulasi, Proyek (tetap, bukan master) | Wajib | - | selalu | `Jenis wajib diisi` |
| Judul / Objek | teks (lebar penuh) | bebas | Wajib | - | selalu | `Judul / Objek wajib diisi` |
| Unit Kerja Pengusul | select | Master Data Unit Kerja | Wajib | - | selalu | `Unit Kerja Pengusul wajib diisi` |
| Tanggal Masuk | date | - | Wajib | - | selalu | `Tanggal Masuk wajib diisi`. Edit: ubah nilai yang sudah ada wajib alasan. Teks bantu: "Mengubah Tanggal Masuk menggeser batas waktu; wajib disertai alasan." |
| SLA (hari kalender) | number | - | Wajib | - | selalu | `SLA (hari kalender) wajib diisi`; `SLA (hari kalender) harus berupa angka`; bila < 1: `SLA minimal 1 hari`. Teks bantu: "Mengubah SLA (batas waktu) wajib disertai alasan." |
| Tanggal Batas | date (rumus) | - | - | Otomatis = Tanggal Masuk + SLA hari kalender; tidak ada di form | hanya Detail/Table/Export | - |
| Status | select | Baru, Proses, Review, Batal (TANPA Selesai) | Wajib | awal `Baru` | selalu | `Status wajib diisi`; teks bantu: `Status Selesai diisi lewat aksi baris "Selesai".` |
| PIC | select | Master Data PIC | Wajib | - | selalu | `PIC wajib diisi` |
| Klasifikasi Regulasi | select | Izin, Lapor, Tidak Perlu | Opsional | - | selalu (semua Jenis) | - |
| Tanggal Selesai | date | - | - | tidak ada di form | diisi lewat aksi Selesai | - |
| Hasil / Opini Risk Management | select | Tidak Direkomendasikan, Direkomendasikan Dengan Syarat, Direkomendasikan, Risk Acceptance | - | tidak ada di form | diisi lewat aksi Selesai | - |
| Nama Mitra | select | Master Data Mitra Vendor | Wajib bila Jenis = Vendor | - | hanya bila Jenis = Vendor | `Nama Mitra wajib diisi` |
| Konteks Kerja Sama | textarea (lebar penuh) | bebas | Opsional | - | hanya Vendor | - |
| Status Mitra | select | Eksisting, Rencana | Wajib bila Vendor | - | hanya Vendor | `Status Mitra wajib diisi` |
| Ada PKS? | select Ya/Tidak | Ya, Tidak | Wajib bila Vendor | - | hanya Vendor | `Ada PKS? wajib diisi` |
| Tanggal PKS | date | - | Wajib bila Vendor DAN Ada PKS? = Ya | - | hanya bila Vendor DAN Ada PKS? = Ya | `Tanggal PKS wajib diisi` |
| Akses ke Sistem? | Ya/Tidak | Ya, Tidak | Wajib bila Vendor | - | hanya Vendor | `Akses ke Sistem? wajib diisi` |
| Akses Data Pengguna / Karyawan? | Ya/Tidak | Ya, Tidak | Wajib bila Vendor | - | hanya Vendor | `Akses Data Pengguna / Karyawan? wajib diisi` |
| Akses Data Keuangan? | Ya/Tidak | Ya, Tidak | Wajib bila Vendor | - | hanya Vendor | `Akses Data Keuangan? wajib diisi` |
| Pemantauan Berjalan? | Ya/Tidak | Ya, Tidak | Wajib bila Vendor | - | hanya Vendor | `Pemantauan Berjalan? wajib diisi` |
| Tanggal Due Diligence / Evaluasi | date | - | Opsional | - | hanya Vendor | - |

- Tidak ada upload file. Tidak ada opsi "Lainnya" di halaman ini.
- Status yang tidak bisa dipilih saat tambah (dan Edit): **Selesai** (hanya lewat aksi baris "Selesai"). `Batal` bisa dipilih manual.
- Jika Jenis diubah dari Vendor ke jenis lain, field vendor disembunyikan dan dilewati validasinya, tetapi nilainya TIDAK dikosongkan (tidak ada `onChange`). [tidak pasti: efek pada data tersimpan dan alert mitra].

### Edit
- Siapa boleh: izin Ubah; `canEditRow`: status bukan Selesai dan bukan Batal; PIC hanya bila `sameName(PIC kajian, nama akun)` (tanpa membedakan huruf besar/kecil). Kajian Selesai atau Batal tidak bisa diedit sama sekali. Tombol hilang untuk yang Dibatalkan.
- Kolom terkunci: tidak ada selain Tanggal Selesai dan Hasil (tidak ada di form) dan Status Selesai (tidak ada di opsi).
- Alasan perubahan: wajib bila Tanggal Masuk atau SLA yang sudah terisi diubah; pesan `Alasan wajib diisi jika Tanggal Masuk, SLA (hari kalender) diubah` (hanya label yang berubah). Selain itu opsional.
- Validasi mode Edit: bila status Selesai tanpa Tanggal Selesai: `Gunakan aksi baris "Selesai" untuk menyelesaikan kajian.` (praktis tidak terjangkau karena Selesai tidak ada di opsi).
- Tidak ada approval.

### Aksi baris Selesai
- Tombol **Selesai** tampil bila: izin Ubah, belum Dibatalkan, status BUKAN Batal, (status BUKAN Selesai ATAU Hasil masih kosong), dan PIC hanya untuk kajian miliknya. Jadi kajian Selesai tanpa hasil masih dapat dilengkapi, dan kajian Selesai berhasil terisi menyembunyikan tombol.
- Modal: judul `Selesaikan Kajian {Judul}`. Field: **Tanggal Selesai \*** (date; bawaan = Tanggal Selesai tersimpan atau hari ini; tanggal bisa dipilih bebas, tidak dibatasi ke masa depan) dan **Hasil / Opini Risk Management \*** (select, placeholder "Pilih hasil", 4 pilihan). Tombol **Batal** / **Simpan**.
- Error persis: `Tanggal Selesai wajib diisi.`; `Tanggal Selesai tidak boleh sebelum Tanggal Masuk.`; `Hasil / Opini wajib diisi.`
- Hasil simpan: status `Selesai`, Tanggal Selesai dan Hasil tersimpan; tercatat di Log Perubahan sebagai perubahan data (Status, Tanggal Selesai, Hasil). Tidak ada kolom alasan di modal.

### Lihat Detail
- Isi: Tanggal Dibuat; semua field (field vendor hanya untuk Jenis Vendor; Tanggal PKS hanya bila Ada PKS? = Ya); Tanggal Batas; Tanggal Selesai; Hasil; badge alert aktif; banner pembatalan; Log Perubahan. Tidak ada file dan tidak ada sensor.

### Status dan transisi
- Status: **Baru, Proses, Review, Selesai, Batal**; plus `Dibatalkan` (pembatalan oleh Head CLRM, status terpisah dari `Batal`).
- Transisi: bebas lewat Edit antar Baru/Proses/Review/Batal (tidak ada aturan urutan); ke Selesai hanya lewat aksi Selesai; dari Selesai/Batal tidak ada jalan kembali lewat Edit (tidak bisa diedit).
- Status otomatis: tidak ada. Tanggal Batas adalah rumus, bukan status.
- Batalkan: izin Cancel (default Head CLRM, Super Admin; lihat 0.2), alasan wajib; status `Dibatalkan`, keluar dari dashboard dan alert. Kembalikan: alasan wajib, memulihkan status sebelumnya. Panduan: "Status Batal (pilihan di form) berbeda: itu status manual, bukan pembatalan oleh Head CLRM."

### Approval
Tidak ada approval di halaman ini.

### Notifikasi / alert
| Label alert persis | Kondisi pemicu | Warna | Penerima | Judul notifikasi | Berhenti |
|---|---|---|---|---|---|
| Lewat batas waktu | Status bukan Selesai/Batal DAN Tanggal Batas ada DAN `hari ini - Tanggal Batas > 0` (hari kalender) | merah | `PIC ({nama PIC})` (atau semua PIC bila PIC kosong), Head CLRM | "Kajian lewat batas waktu" | Saat status Selesai/Batal, atau Tanggal Batas bergeser, atau Dibatalkan |
| Mendekati batas waktu | OPEN (bukan Selesai/Batal), Tanggal Batas ada, belum lewat, DAN `workDaysBetween(hari ini, Tanggal Batas) <= 2` (hari kerja Senin-Jumat, tanpa libur nasional) | kuning | `PIC ({nama PIC})` saja | "Kajian mendekati batas waktu"; bila 0 hari kerja (jatuh tempo hari ini): "Kajian jatuh tempo hari ini" | Saat lewat batas (pindah ke alert merah), Selesai/Batal, Dibatalkan |
| Selesai tanpa hasil | Status = Selesai DAN Hasil kosong | kuning | `PIC ({nama PIC})`, Risk Officer | "Kajian selesai tanpa hasil" | Saat Hasil terisi (lewat aksi Selesai) |
| Jadwal evaluasi mitra akan tiba / terlewat | Jenis Vendor DAN Tanggal Due Diligence / Evaluasi terisi DAN (`jadwal - hari ini < 0` merah, atau `<= 30` kuning); TIDAK memeriksa status | merah bila lewat; kuning bila <= 30 hari | `PIC ({nama PIC})`, Risk Officer | "Jadwal evaluasi mitra terlewat" (lewat) atau "Jadwal evaluasi mitra akan tiba" (<= 30 hari) | Saat tanggal diubah ke > 30 hari ke depan, jenis berubah (nilai vendor tetap tersimpan, [tidak pasti]), atau Dibatalkan |
- Detail teks: `Lewat {n} hari`; `{n} hari kerja lagi` ("hari ini" bila 0, "besok" untuk `1 hari lagi`); `Hasil / Opini kosong`; `Lewat {n} hari` / `{n} hari lagi`.
- Teks notifikasi: lewat: `Kajian {judul} belum selesai dan melewati batas waktu {n} hari. Segera selesaikan.`; mendekati: `Kajian {judul} jatuh tempo {n hari kerja lagi | hari ini}. Segera selesaikan.`; tanpa hasil: `Kajian {judul} berstatus Selesai, tetapi Hasil / Opini belum diisi. Lengkapi hasilnya.`; mitra terlewat: `...: jadwal evaluasi mitra terlewat {n} hari. Segera jadwalkan ulang.`; mitra akan tiba: `...: jadwal evaluasi mitra jatuh tempo {n hari lagi}. Siapkan evaluasinya.`
- Catatan: alert "Selesai tanpa hasil" disebut "umumnya dari import" di kode, tetapi import dimatikan; hanya terjadi pada data seed.

### Peran
Default Lapis A:

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve | Export | Sensor |
|---|---|---|---|---|---|---|---|
| Super Admin | ya | ya | ya | ya | n/a (tidak ada approval) | ya | n/a |
| Head CLRM | ya | tidak | tidak | ya | tidak | ya | n/a |
| Compliance Officer | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Risk Officer | ya | ya | ya | tidak | tidak | ya | n/a |
| Legal Officer | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Fraud Investigator | ya | tidak | tidak | tidak | tidak | ya | n/a |
| Ketua SMKI | ya | tidak | tidak | tidak | tidak | ya | n/a |
| PIC | ya | tidak | ya (hanya kajian dengan PIC = nama akun) | tidak | tidak | ya | n/a |
| Viewer | ya | tidak | tidak | tidak | tidak | ya | n/a |
- Aksi baris Selesai mengikuti izin Ubah dan batas "milik sendiri" PIC. Catatan 0.2 Lapis B berlaku (kategori Risk dipakai bersama Risk Register: efektif PIC dapat Tambah, Head CLRM dapat Edit/Selesai, Risk Officer dan PIC dapat Batalkan). Sejak v2.14 izin per akun menimpa default.

### Kondisi khusus dan prasyarat
- Kolom/isian vendor hanya muncul bila Jenis = Vendor; Tanggal PKS hanya bila Ada PKS? = Ya (dan wajib saat itu).
- Status Selesai tidak ada di opsi form; tombol Selesai muncul hanya sesuai syarat di atas.
- Modal Selesai: Tanggal Selesai tidak boleh sebelum Tanggal Masuk.
- Kajian Selesai/Batal tidak bisa diedit.
- Alasan perubahan wajib hanya saat Tanggal Masuk atau SLA yang sudah terisi diubah.
- Alert "Mendekati batas waktu" hanya untuk status terbuka; "Lewat batas waktu" mengambil alih saat batas terlewat.
- Alert mitra tidak memeriksa status (kajian Selesai pun tetap memicu bila jadwal evaluasi dekat/terlewat).
- Dashboard: kartu "Rata-rata lama" hanya kajian Selesai bertanggal selesai; donut Hasil hanya kajian ber-hasil; tabel jadwal hanya Vendor ber-tanggal DD.
- Tombol Tambah hanya untuk peran dengan izin Tambah.

### Data contoh (bukan requirement)
30 kajian dibuat oleh "Regie": Vendor 10, CR 5, Produk 5, Regulasi 5, Proyek 5. Status: Selesai 12, Proses 8, Baru 5, Review 3, Batal 2. Satu kajian Selesai tanpa hasil (Proyek) memicu alert. 10 mitra seed dengan jadwal DD dari -20 sampai +200 hari. PIC seed bergantian Regie, Fakhri, Osama.

### Sumber kode
- `src/pages/Kajian.tsx`: konstanta 19-28; fields 30-52; columns 53-63; filters 65-72; alerts 75-101; SelesaiModal 103-128; seed 130-160; cfg 162-216 (canEditRow 170, validate 171-176, rowActions 177-181, Dashboard 183-215).
- `src/guides/kajian.ts`; `kit/notify.tsx:98-101`; `kit/dates.ts` (`workDaysBetween`).

### Selisih dengan keputusan final
Cocok: Mitra dari Master Data (Mitra Vendor); kolom/isian vendor muncul bila Jenis = Vendor; aksi Selesai membuka modal Tanggal Selesai (bisa dipilih) dan Hasil/Opini (wajib); tidak ada approval; Batalkan wajib alasan.
Berbeda atau tambahan:
1. Penamaan: "Unit Kerja Pengusul" / "Unit Kerja" vs keputusan "Departemen".
2. Isian vendor lebih banyak dari keputusan: Konteks Kerja Sama, Status Mitra, Ada PKS?, Tanggal PKS, Akses ke Sistem?, Akses Data Pengguna / Karyawan?, Akses Data Keuangan?, Pemantauan Berjalan?, Tanggal Due Diligence / Evaluasi. Keputusan hanya menyebut "kolom vendor muncul bila jenis Vendor". Mockup tambahan.
3. Jenis (5 nilai), SLA hari kalender, Tanggal Batas, Klasifikasi Regulasi, status manual `Batal` (selain Dibatalkan oleh Head CLRM), dan 4 alert: tidak disebut di keputusan; tambahan mockup.
4. Dua status pembatalan (`Batal` manual dan `Dibatalkan`): keputusan hanya "Batalkan wajib alasan, data tidak dihapus".
5. Izin efektif vs panduan (0.2).
6. Dashboard 8 visual: bukan bagian keputusan (mengikuti CR [tidak pasti]).

---

## Fraud Case Monitoring (menu: Fraud > Fraud Case Monitoring)

- Ringkasan: satu halaman untuk mencatat laporan dugaan fraud/judi online/transaksi anomali, menilai lewat Hasil Asesmen Awal, menjalankan EDD 1 dan EDD 2, mencatat tindakan (blokir, hold, dll.), laporan ke regulator, dan menutup kasus dengan persetujuan Head CLRM.
- Prasyarat akses: izin Lihat modul Fraud (semua peran). Tab Dashboard butuh izin Dashboard kategori Fraud. Nama Terlapor dan RRN disamarkan; semua peran dapat membuka sensor lewat ikon mata. Rute `fraud/fraud-case-monitoring`.

### Tab Dashboard
Filter global: **Periode Tanggal Terima** (dua tanggal + Reset); berlaku untuk kartu angka dan visual kecuali dua grafik bulanan (lihat masing-masing). Kasus Dibatalkan tidak dihitung.

**Filter produk pada visual (UE dan QRIS): TIDAK ADA di kode.** Tidak ada satu pun kontrol atau logika Produk di Dashboard. Produk hanya ada sebagai field form (opsional, Master Produk: UE, QRIS, Biller) dan filter di tab Table. Lihat Selisih.

**Kartu angka (grup "Ringkasan", ada (i))**, 5 kartu (grid 2 kolom di HP):
1. `Total Kasus`: jumlah kasus pada periode. Tanpa klik, nada abu-abu.
2. `Open`: jumlah status Open. Biru; MERAH bila ada minimal 1 kasus Open dengan umur > 90 hari (hari ini - Tanggal Terima). Klik: Table terfilter Status = Open.
3. `Closed`: jumlah status Closed. Hijau. Klik: Table terfilter Status = Closed.
4. `Dana Ditahan (Hold)`: jumlah Nominal Hold Settlement semua kasus pada periode (format `Rp 1.000.000`). Kuning. Tanpa klik.
5. `Dana Dikembalikan (Released)`: jumlah Nominal Released Settlement semua kasus pada periode. Hijau. Tanpa klik.
- Info: "Ringkasan kasus pada Periode Tanggal Terima yang dipilih (kasus Dibatalkan tidak dihitung)." dengan baca per kartu.

Sembilan grafik, tiap grafik di kartu sendiri dengan (i), urutan grid 2 kolom:
1. **Kasus per bulan** (line, seri `Kasus`): jumlah kasus per bulan menurut Tanggal Terima. Memakai SEMUA kasus tidak Dibatalkan dan TIDAK terpengaruh Periode halaman. Filter sendiri di atas grafik (dropdown): Seluruh Waktu, 3 bulan terakhir, 6, 9, 12 bulan terakhir (bawaan 12), Custom (dua input bulan "sampai"). Bulan tanpa kasus tampil 0. Label sumbu "Jan 26" dst. (bulan Indonesia singkat: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des).
2. **Jenis dugaan** (donut): Fraud, Judi Online, Transaksi Anomali. Tooltip: `{jenis}: {n} kasus` + rincian per Kategori Pelapor. Klik irisan: Table terfilter Jenis Dugaan.
3. **Kategori pelapor x media** (bar bertumpuk): sumbu X = semua Kategori Pelapor dari Master; tumpukan = Media dari Master Media Pelapor + "Lainnya" (media teks bebas dihitung "Lainnya"). Klik batang: Table terfilter Sumber (Kategori Pelapor).
4. **Kasus per tindakan dan saldo tertahan (juta Rp)** (bar berkelompok): untuk tiap dari 10 Tindakan, dua batang: `Kasus` dan `Saldo Tertahan (juta)` (= jumlah Saldo Tertahan dibulatkan ke juta, `Math.round(n/1.000.000)`), satu sumbu angka bersama. Klik batang: Table terfilter Tindakan.
5. **Top 10 merchant / group** (bar horizontal, seri `Kasus`): 10 Group Merchant dengan kasus terbanyak (kasus tanpa Group Merchant tidak dihitung). Tooltip: `{group}: {n} kasus` + rincian per Jenis Dugaan. Klik batang: Table terfilter Group Merchant.
6. **Nilai uang per bulan (juta Rp)** (combo): batang `Korban` (Nominal Korban), `Hold`, `Released`; garis `Saldo Tertahan`; per bulan Tanggal Terima; dibulatkan juta; semua kasus tidak Dibatalkan, tidak terpengaruh Periode halaman; filter bulan sendiri (sama seperti grafik 1, terpisah dari grafik 1).
7. **Lama proses (hari): rata-rata dan terlama** (bar berkelompok, sumbu "Hari"): tiga tahap: `Terima ke EDD 1` (Tanggal EDD 1 - Tanggal Terima), `Terima ke Blokir` (Tanggal Blokir - Tanggal Terima), `Terima ke Lapor` (tanggal lapor paling awal dari Komdigi/BI/PPATK - Tanggal Terima). Dua seri `Rata-rata` (dibulatkan, hanya kasus yang tahapnya terisi) dan `Terlama` (nilai terbesar). Tidak bisa diklik.
8. **Umur kasus Open (hari)** (bar, sumbu kategori "Hari"): kasus Open, umur = hari ini - Tanggal Terima, kelompok `0-30`, `31-60`, `61-90`, `>90`. Warna: hijau (0-30), kuning (31-60 dan 61-90), merah (>90). Tidak bisa diklik.
9. **Lapor regulator setelah blokir** (bar bertumpuk): sumbu X = Komdigi, BI, PPATK; hanya kasus yang punya Tanggal Blokir. Seri: `Sudah Lapor` (hijau #10b981; tanggal lapor terisi), `Belum Lapor` (kuning #f59e0b; belum lapor tetapi belum lewat batas), `Terlambat` (merah #ef4444; belum lapor dan `hari ini - Tanggal Blokir` > batas). Batas: Komdigi 7 hari, BI 14 hari, PPATK 30 hari sejak blokir. Tidak bisa diklik.
- Info (i) tiap kartu memuat "apa" dan "baca"; contoh kartu 3: "Jumlah kasus per Kategori Pelapor, ditumpuk menurut Media penerimaan laporan (daftar dari Master Data). Media yang diketik bebas di luar daftar dihitung sebagai Lainnya."; kartu 9: "Status pelaporan ke tiap regulator untuk kasus yang sudah punya Tanggal Blokir. Batas lapor sejak blokir: Komdigi 7 hari, BI 14 hari, PPATK 30 hari."
- Grafik tanpa data: tampil "Tidak ada data" (kecuali grafik bulanan yang selalu menampilkan bulan nol).

### Tab Table
- Kolom (urutan): Nomor, **No Laporan EDD** ("-" bila kosong), **Tgl Terima**, **Kategori Pelapor**, **Terlapor** (tersamar; ikon mata di header untuk semua peran), **RRN** (tersamar; "-" bila kosong; ikon mata di header), **Jenis Dugaan**, **Nominal** (Nominal Korban, `Rp ...`, "-" bila kosong), **Tindakan** ("-" bila kosong), **Status** (pill: Open biru, Closed hijau, Dibatalkan abu-abu), **PIC** ("-" bila kosong), Tanggal Dibuat, Aksi. Nama merchant/Group Merchant TIDAK ada di tabel.
- Pagination 10/25/50.
- Cari: placeholder "Cari no laporan EDD, terlapor/merchant, kategori pelapor"; mencari di `{No Laporan EDD} {Terlapor} {Group Merchant} {Kategori Pelapor}`. Terlapor yang dicari = nilai aslinya untuk semua peran (terlepas dari keadaan tombol mata). RRN tidak dicari. Tidak ada field "Nama Merchant".
- Filter (9): **Periode (Tanggal Terima)**, **Status** (Open, Closed, Dibatalkan), **PIC** (nilai unik dari data), **Jenis Dugaan**, **Tindakan** (10 nilai), **Sumber (Kategori Pelapor)** (Master), **Group Merchant** (nilai unik dari data), **Produk** (Master: UE, QRIS, Biller), **Channel** (nilai unik dari data). Tidak ada simpan filter.
- Tombol: Export Excel, Tambah, aksi baris Lihat Detail / Edit / Batalkan / Kembalikan. Tidak ada aksi baris khusus.
- Export: `Kasus_Fraud_EDD_{tanggal}.xlsx`, sheet "Fraud Case Monitoring". Kolom: Nomor, Tanggal Dibuat, lalu SEMUA field berurutan: No Laporan EDD (kolom pertama setelah Tanggal Dibuat), Tanggal Terima Tugas, Kategori Pelapor, Media (teks asli), Nama Terlapor, Jenis Pengguna, Jenis Dugaan, Rincian Dugaan, Uraian, Bukti (nama file), Nominal Korban, RRN, Tanggal Transaksi, Hasil Asesmen Awal, Alasan Asesmen, Tanggal Hold Settlement, Nominal Hold Settlement, Tanggal Email PPATK, Tanggal EDD 1, Tanggal EDD 2, Batas Waktu EDD (rumus sementara), Hasil EDD, Tindakan, Tanggal Blokir, Tanggal Released Settlement, Nominal Released Settlement, Saldo Tertahan, Tanggal Hapus QRIS, Tanggal Email Tutup Akun, Tanggal Lapor Komdigi, Tanggal Lapor BI, Tanggal Lapor PPATK, Tanggal Email Resolved, Status, PIC Investigator, Group Merchant, Produk, Channel, Kerugian Paydia. Nominal tetap angka. **Nama Terlapor dan RRN selalu tersamar untuk SEMUA peran**, termasuk yang berhak membuka mata. Data mengikuti cari dan filter (termasuk baris Dibatalkan). Tercatat di Log (`{n} baris`).
- Badge/warna baris: pill Status; baris Dibatalkan abu-abu; tooltip alert hanya di Detail.

### Form Tambah
Tombol Tambah: default Fraud Investigator, Compliance Officer, Super Admin (efektif Lapis B sama).

| Label persis | Tipe | Pilihan / sumber | Wajib/Opsional | Otomatis / read-only | Kondisi tampil | Validasi dan pesan |
|---|---|---|---|---|---|---|
| No Laporan EDD | teks | - | - | READ-ONLY (nonaktif), dibuat otomatis saat simpan, tidak berubah saat Edit. Teks bantu: "Otomatis (EDD/tahun/bulan/nomor urut), terisi saat disimpan dan tidak berubah." | selalu (kosong saat Tambah) | - |
| Tanggal Terima Tugas | date | - | Wajib | - | selalu | `Tanggal Terima Tugas wajib diisi`; Edit: ubah wajib alasan |
| Kategori Pelapor | select | Master Data Kategori Pelapor | Wajib | - | selalu | `Kategori Pelapor wajib diisi` |
| Media | select + Lainnya | Master Data Media Pelapor + "Lainnya" | Wajib | - | selalu; "Lainnya" memunculkan teks "Sebutkan lainnya" | `Media wajib diisi`; `Wajib diisi jika memilih Lainnya` |
| Nama Terlapor | teks | bebas | Wajib | - | selalu (tersamar di Edit untuk peran tertentu) | `Nama Terlapor wajib diisi` |
| Jenis Pengguna | select | Merchant, User | Wajib | - | selalu | `Jenis Pengguna wajib diisi` |
| Jenis Dugaan | select | Fraud, Judi Online, Transaksi Anomali | Wajib | - | selalu | `Jenis Dugaan wajib diisi` |
| Rincian Dugaan | teks | bebas | Opsional | - | selalu | - |
| Uraian | textarea (lebar penuh) | bebas | Opsional; WAJIB bila Status = Closed | - | selalu | `Uraian wajib diisi` |
| Bukti | file | PDF/JPG/JPEG/PNG, 25 MB, 1 file | Opsional | - | selalu | pesan file (0.1) |
| Nominal Korban | money (Rp) | angka | Opsional; WAJIB bila Closed | - | selalu | `Nominal Korban wajib diisi`; `Nominal Korban harus berupa angka`; Edit: ubah wajib alasan |
| RRN | teks | bebas | Opsional | - | selalu (tersamar di Edit) | - |
| Tanggal Transaksi | date | - | Opsional | - | selalu | alasan bila diubah |
| Hasil Asesmen Awal | select | Dilanjutkan, Tidak Dilanjutkan | Wajib | - | selalu | `Hasil Asesmen Awal wajib diisi` |
| Alasan Asesmen | teks | bebas | Wajib (untuk kedua hasil) | - | selalu | `Alasan Asesmen wajib diisi` |
| Tanggal Hold Settlement | date | - | Opsional | - | selalu | alasan bila diubah |
| Nominal Hold Settlement | money | angka | Opsional | - | selalu | alasan bila diubah |
| Tanggal Email PPATK | date | - | Opsional | - | selalu | alasan bila diubah |
| Tanggal EDD 1 | date | - | Opsional; WAJIB bila Closed DAN Hasil Asesmen = Dilanjutkan | - | selalu (sejak awal) | `Tanggal EDD 1 wajib diisi`; alasan bila diubah |
| Tanggal EDD 2 | date | - | Opsional | - | selalu | `EDD 2 tidak boleh sebelum EDD 1` |
| Batas Waktu EDD (rumus sementara) | date (rumus) | - | - | Otomatis; TIDAK ada di form, hanya Detail/Export. Teks bantu di kode: "Rumus sementara: EDD 1 = terima + 3 hari kerja, EDD 2 = EDD 1 + 7 hari." | Detail/Export | - |
| Hasil EDD | select + Lainnya | Tidak Respon, Kirim Bukti, Email Bouncing, Judi Online, Lainnya (memilih Lainnya memunculkan teks bebas "Sebutkan lainnya", wajib) | Opsional; WAJIB bila Closed DAN (Tanggal EDD 1 atau EDD 2 terisi) | - | selalu | `Hasil EDD wajib diisi`; `Wajib diisi jika memilih Lainnya` |
| Tindakan | select | Blokir, Watchlist, Hold Settlement, Released, Terminasi, Blokir IP, Tidak Ada Tindak Lanjut, Redundant, EDD 1, EDD 2 | Opsional; WAJIB bila Closed | - | selalu | `Tindakan wajib diisi` |
| Tanggal Blokir | date | - | Opsional | - | selalu | `Tanggal Blokir tidak boleh sebelum Tanggal Terima`; alasan bila diubah |
| Tanggal Released Settlement | date | - | Opsional | - | selalu | alasan bila diubah |
| Nominal Released Settlement | money | angka | Opsional | - | selalu | alasan bila diubah |
| Saldo Tertahan | money | angka | Opsional; WAJIB bila Tindakan = Blokir (status apa pun, termasuk saat Tambah) | - | selalu | `Saldo Tertahan wajib diisi`; alasan bila diubah |
| Tanggal Hapus QRIS | date | - | Opsional | - | selalu | alasan bila diubah |
| Tanggal Email Tutup Akun | date | - | Opsional | - | selalu | alasan bila diubah |
| Tanggal Lapor Komdigi | date | - | Opsional; WAJIB bila Tindakan = Blokir DAN Closed | - | selalu | `Tanggal Lapor Komdigi wajib diisi` |
| Tanggal Lapor BI | date | - | idem | - | selalu | `Tanggal Lapor BI wajib diisi` |
| Tanggal Lapor PPATK | date | - | idem | - | selalu | `Tanggal Lapor PPATK wajib diisi` |
| Tanggal Email Resolved | date | - | Opsional; WAJIB bila Closed | - | selalu | `Tanggal Email Resolved wajib diisi`; `Tanggal Resolved tidak boleh sebelum Tanggal Terima` |
| Status | select | Open, Closed | Wajib | awal Open; HANYA ada di form Edit (tidak ada di Tambah) | hanya Edit | teks bantu: "Menutup kasus (Closed) menunggu persetujuan Head CLRM; selama menunggu status tetap Open." |
| PIC Investigator | select | Master Data PIC | Opsional; WAJIB bila Closed | - | selalu | `PIC Investigator wajib diisi` |
| Group Merchant | teks | bebas (satu nilai) | Opsional | - | selalu | - |
| Produk | select | Master Data Produk (UE, QRIS, Biller) | Opsional | - | selalu | - |
| Channel | teks | bebas | Opsional | - | selalu | - |
| Kerugian Paydia | money | angka | Opsional | - | selalu | alasan bila diubah |

- Aturan file: format PDF, JPG, JPEG, PNG; maksimal 25 MB; satu file; opsional di status apa pun.
- Status yang tidak bisa dipilih saat tambah: tidak ada pilihan status di form Tambah; kasus baru selalu `Open`. Pesan cadangan (tidak terjangkau UI): "Kasus baru harus berstatus Open; penutupan lewat Edit dengan persetujuan Head CLRM".
- Tidak ada field "Nama Merchant" (uraian, banyak merchant) dan tidak ada field Jenis Data (dihapus; data lama dibersihkan oleh `migrateFraud`). Field `pelapor` ada di struktur data seed tetapi tidak ada di form, kolom, atau Export.
- Penomoran **No Laporan EDD** (kode): format `EDD/{YYYY}/{MM}/{NNNN}` (contoh `EDD/2026/11/0001`). YYYY dan MM dari tanggal dibuat (saat simpan, bukan Tanggal Terima). NNNN = nomor urut 4 digit; dihitung sebagai (nomor tertinggi dengan awalan bulan-tahun yang sama di SEMUA kasus tersimpan, termasuk Dibatalkan) + 1; mulai lagi dari 0001 tiap bulan-tahun. Dibuat saat Tambah; tidak berubah saat Edit (`old.noLaporan` dipertahankan). TIDAK ada segmen tanggal DD.

### Edit
- Siapa boleh: izin Ubah (default Fraud Investigator, Compliance Officer, PIC, Super Admin; efektif juga Head CLRM, lihat 0.2). Pembatas `canEditRow`: kasus berstatus Closed tidak bisa diedit; peran **PIC** dan **Fraud Investigator** hanya bila `sameName(PIC Investigator kasus, nama akun)`; Head CLRM, Compliance Officer, Super Admin bebas. Konsekuensi: kasus tanpa PIC Investigator tidak bisa diedit oleh Fraud Investigator/PIC (termasuk yang membuatnya sendiri) sampai peran lain mengisi PIC.
- Kolom terkunci: No Laporan EDD (read-only). Nama Terlapor dan RRN: nonaktif tersamar sampai ikon mata (di samping label) diklik, lalu dapat diedit oleh peran yang boleh Ubah.
- Alasan perubahan: wajib bila salah satu field berikut yang SUDAH terisi diubah: Tanggal Terima Tugas, Nominal Korban, Tanggal Transaksi, Tanggal Hold Settlement, Nominal Hold Settlement, Tanggal Email PPATK, Tanggal EDD 1, Tanggal EDD 2, Tanggal Blokir, Tanggal Released Settlement, Nominal Released Settlement, Saldo Tertahan, Tanggal Hapus QRIS, Tanggal Email Tutup Akun, Tanggal Lapor Komdigi/BI/PPATK, Tanggal Email Resolved, Kerugian Paydia. Mengisi dari kosong tidak butuh alasan.
- Perubahan yang memicu approval: hanya mengubah **Status dari Open ke Closed** (lihat Approval). Perubahan lain langsung tersimpan.

### Lihat Detail
- Isi: Tanggal Dibuat; semua field termasuk Batas Waktu EDD (rumus sementara); badge alert aktif (label dan detail, tooltip aturan + penerima); banner Menunggu persetujuan Head CLRM; banner pembatalan; Log Perubahan.
- File: Bukti tampil `{nama} ({ukuran})` sebagai teks; tidak ada tautan buka.
- Sensor: Nama Terlapor dan RRN tersamar (`B*** S******`: huruf pertama tiap kata + minimal dua tanda `*`; RRN satu kata) bawaan untuk SEMUA peran. Semua peran punya ikon mata di samping label (toggle tampilkan/sembunyikan, tooltip "Tampilkan {label}" / "Sembunyikan {label}"). Ganti Akun demo menutup lagi sensor yang terbuka. Membuka sensor tidak dicatat di Log (tidak ada pemanggilan log).

### Status dan transisi
- Status: **Open**, **Closed**, plus `Dibatalkan`.
- Transisi: Tambah -> Open. Open -> Closed hanya lewat Edit (Status = Closed) -> request Menunggu -> disetujui Head CLRM -> Closed. Ditolak -> tetap Open dengan data lama. Closed tidak dapat diedit dan tidak dapat dibuka kembali lewat Edit.
- Status otomatis: tidak ada (status tidak berubah otomatis; alert hanya notifikasi).
- Batalkan: izin Cancel (default Head CLRM, Super Admin; efektif juga Fraud Investigator, Compliance Officer, PIC lewat Update, lihat 0.2); alasan wajib; tidak saat Menunggu approval; bisa dari Open atau Closed; status `Dibatalkan`, keluar dashboard dan alert. Kembalikan: alasan wajib, kembali ke Open atau Closed sebelumnya.

### Approval
- Pemicu: Edit yang mengubah Status dari bukan-Closed ke **Closed**. Jenis `Penutupan Kasus`. Approver Head CLRM (Super Admin juga bisa memutuskan).
- Semua perubahan pada Edit tersebut ikut diajukan (aturan tanpa batasan kolom); tidak ada yang tersimpan langsung. Kasus tetap Open dengan data lama, terkunci, selama Menunggu.
- Setuju: semua perubahan berlaku dan status Closed. Tolak: kasus tetap Open dengan data lama.
- Seed: 4 request (fraud-8, fraud-11 Menunggu; satu kasus Closed Disetujui; fraud-9 Ditolak dengan catatan "Bukti pelaporan ke regulator belum lengkap").

### Notifikasi / alert
Penerima berupa peran: seluruh akun berperan itu menerima (bukan hanya yang terkait kasus), kecuali token `PIC ({nama})`.

| Label alert persis | Kondisi pemicu (rumus) | Warna | Penerima | Judul notifikasi | Berhenti |
|---|---|---|---|---|---|
| Kasus belum ditangani | Status Open DAN `workDaysBetween(Tanggal Terima, hari ini) > 2` (hari kerja Senin-Jumat tanpa libur) DAN (PIC Investigator kosong, ATAU Tanggal EDD 1 kosong DAN Tindakan kosong). Detail: `{d} hari kerja tanpa PIC` atau `{d} hari kerja tanpa EDD/tindakan` | merah | Head CLRM, Fraud Investigator | "Kasus belum ditangani" | Saat PIC terisi dan (EDD 1 atau Tindakan terisi), atau status Closed/Dibatalkan |
| EDD lewat batas waktu | Status Open DAN Hasil Asesmen = Dilanjutkan DAN Hasil EDD kosong DAN Batas Waktu EDD ada DAN `hari ini - Batas Waktu EDD > 0`. Batas Waktu EDD (kode) = bila Tanggal EDD 1 terisi: Tanggal EDD 1 + 7 hari kalender; bila kosong: Tanggal Terima + 3 hari kerja. Detail `Lewat batas EDD {n} hari` | merah | `PIC ({PIC Investigator})` (atau semua PIC bila kosong), Head CLRM | "EDD lewat batas waktu" | Saat Hasil EDD terisi, asesmen Tidak Dilanjutkan, Closed/Dibatalkan |
| Hold settlement lebih dari 30 hari | Status Open DAN Tanggal Hold terisi DAN Tanggal Released kosong DAN Tanggal Blokir kosong DAN `hari ini - Tanggal Hold > 30`. Detail `Hold {n} hari` | kuning | `PIC ({PIC})`, Head CLRM | "Hold settlement lebih dari 30 hari" | Saat Released atau Blokir terisi, Closed/Dibatalkan |
| Lapor regulator terlambat | Tanggal Blokir terisi DAN minimal satu dari Komdigi (batas 7 hari), BI (14), PPATK (30) memiliki tanggal lapor kosong DAN `hari ini - Tanggal Blokir > batas`; TIDAK memeriksa Open/Closed (status Dibatalkan dikecualikan). Detail `Belum lapor {Komdigi, BI, PPATK} (blokir {n} hari lalu)` | merah | Compliance Officer, Head CLRM | "Lapor regulator terlambat" | Saat semua tanggal lapor yang lewat batas terisi, atau Dibatalkan |
| Kasus Open lebih dari 90 hari | Status Open DAN `hari ini - Tanggal Terima > 90` hari kalender. Detail `Open {n} hari` | kuning | `PIC ({PIC})`, Head CLRM | "Kasus Open lebih dari 90 hari" | Saat Closed/Dibatalkan |
| Data kasus belum lengkap | Status Open DAN salah satu kosong: Uraian (setelah trim), Nominal Korban, Jenis Dugaan, Kategori Pelapor. Detail `Kosong: {daftar}` | kuning | Compliance Officer | "Data kasus belum lengkap" | Saat semua terisi, Closed/Dibatalkan |
- Teks notifikasi: belum ditangani: `{Kasus EDD/...} masih Open dan sudah {n} hari kerja tanpa PIC, tindakan, atau EDD. Segera tetapkan PIC dan tentukan tindakan.` (varian: hanya tanpa PIC; hanya tanpa tindakan atau EDD); EDD: `... melewati batas waktu {n} hari dan hasil belum diisi. Segera lengkapi.`; hold: `... berstatus Hold selama {n} hari dan belum dilepas (Released) atau diblokir. Tinjau kelanjutannya.`; lapor: `... belum dilaporkan ke Komdigi, BI, dan PPATK (blokir {n} hari lalu). Segera laporkan ke regulator.`; 90 hari: `... sudah Open selama {n} hari. Tinjau dan percepat penyelesaian.`; kosong: `... belum lengkap: {daftar} belum diisi. Lengkapi datanya.`
- Mengenai EDD jatuh tempo: alert mulai muncul pada hari SETELAH Batas Waktu EDD (`> 0`), bukan pada hari jatuh tempo itu sendiri; status kasus tidak berubah (tetap Open).

### Peran
Default Lapis A:

| Peran | Lihat | Tambah | Ubah | Batalkan/Kembalikan | Approve (Penutupan Kasus) | Export | Buka sensor (mata) |
|---|---|---|---|---|---|---|---|
| Super Admin | ya | ya | ya | ya | ya | ya | ya |
| Head CLRM | ya | tidak | tidak | ya | ya | ya | ya |
| Compliance Officer | ya | ya | ya (semua kasus Open) | tidak | tidak | ya | ya |
| Risk Officer | ya | tidak | tidak | tidak | tidak | ya | ya |
| Legal Officer | ya | tidak | tidak | tidak | tidak | ya | ya |
| Fraud Investigator | ya | ya | ya (hanya kasus dengan PIC Investigator = nama akun) | tidak | tidak | ya | ya |
| Ketua SMKI | ya | tidak | tidak | tidak | tidak | ya | ya |
| PIC | ya | tidak | ya (hanya kasus dengan PIC Investigator = nama akun) | tidak | tidak | ya | ya |
| Viewer | ya | tidak | tidak | tidak | tidak | ya | ya |
- Buka sensor: semua peran yang bisa membuka halaman (sejak v2.14.5). Export selalu tersamar untuk semua peran.
- Lapis B (0.2): efektif Head CLRM juga mendapat Edit, Fraud Investigator dan Compliance Officer juga mendapat Batalkan/Kembalikan, PIC juga Batalkan. Sejak v2.14 Admin > Manage Permissions menimpa default.

### Kondisi khusus dan prasyarat
- Ikon mata Nama Terlapor/RRN untuk semua peran; hanya ada di header kolom Table, label Detail, label form Edit (tidak di form Tambah, tempat nilai tidak tersamar).
- Form Tambah tidak punya Status; Status hanya di Edit; Closed butuh approval.
- Kasus Closed tidak bisa diedit; Edit/Batalkan hilang selama Menunggu approval.
- Wajib bersyarat saat Closed: Uraian, Nominal Korban, Tindakan, Tanggal Email Resolved, PIC Investigator; EDD 1 bila asesmen Dilanjutkan; Hasil EDD bila EDD 1/2 terisi; tiga tanggal lapor bila Tindakan = Blokir (Blokir IP tidak termasuk).
- Saldo Tertahan wajib bila Tindakan = Blokir (juga saat Open dan saat Tambah).
- "Lainnya" pada Media dan pada Hasil EDD memunculkan teks wajib.
- Alert EDD hanya untuk asesmen Dilanjutkan; alert Hold hanya bila belum Released dan belum Blokir; alert Lapor hanya bila ada Tanggal Blokir (tidak memeriksa kolom Tindakan, sehingga juga berlaku untuk Blokir IP yang punya Tanggal Blokir).
- Kategori Pelapor x Media: media bebas dihitung "Lainnya".
- Dua grafik bulanan punya filter bulan sendiri dan tidak mengikuti Periode halaman.
- Kartu Open berubah merah bila ada Open > 90 hari.
- Pencarian Terlapor memakai nilai tersamar bagi peran tanpa hak sensor.

### Data contoh (bukan requirement)
45 kasus tersebar ~12 bulan (kasus lama kebanyakan Closed, kasus <= 45 hari Open); 12 kasus skenario sengaja memicu tiap alert; 1 kasus Dibatalkan (alasan "Kasus duplikat", status sebelumnya Closed, oleh Dewi Anggraini). No Laporan EDD seed berurut per bulan dari tanggal dibuat. Tindakan seed memakai 8 dari 10 opsi (tanpa EDD 1 dan EDD 2). Group Merchant: 12 nama; Produk UE/QRIS/Biller; Channel Mobile/Web/Offline EDC/API; PIC Regie, Fakhri, Osama.

### Sumber kode
- `src/pages/Fraud.tsx`: konstanta 28-34; rumus batas EDD 38-40; sensor 42-46 (`isMasked` 44); `eddNo` 54-58; fields 61-101; columns 103-116; filters 118-129; alerts 131-169; seed 180-257; cfg 259-286 (search 268-270, beforeSave 272, canEditRow 275, approvals 277, validate 278-285); Dashboard 287-340.
- `src/guides/fraud.ts`; `kit/fmt.tsx:6` (`maskStr`), `kit/Reveal.tsx`, `kit/DataTable.tsx:36`, `kit/DetailModal.tsx:20,55`, `kit/FormModal.tsx:111-114`, `kit/exportXlsx.ts:22-23`, `kit/notify.tsx:102-114`, `kit/approvalSeed.ts`, `kit/perms.ts`, `kit/Lainnya.tsx`.

### Selisih dengan keputusan final
Cocok: tidak ada kolom Jenis Data dan setiap laporan dicatat lalu dinilai lewat Hasil Asesmen Awal; Tindakan memuat pilihan EDD 1 dan EDD 2; Tanggal EDD 1, EDD 2, dan Hasil EDD tampil sejak awal di form Tambah; RRN dan nama terlapor disensor di tabel, detail, dan edit; membuka sensor tidak dicatat di log; Produk, Group Merchant, Channel, Kerugian, RRN opsional; close case perlu approval Head CLRM; dashboard tab pertama; Batalkan wajib alasan; Kategori Pelapor dan Media dari Master Data.
Berbeda atau tambahan:
1. **Penomoran No. Laporan EDD**: keputusan `EDD/YYYY/MM/DD/NNNN`; mockup `EDD/YYYY/MM/NNNN` (tanpa DD, urutan reset tiap bulan-tahun). Sama-sama otomatis dan tidak bisa diedit.
2. **Batas waktu EDD**: keputusan "tanggal surat EDD + 2 hari kerja, notifikasi saat jatuh tempo, status tetap Open". Mockup: "rumus sementara" (EDD 1 terisi: EDD 1 + 7 hari kalender; kosong: Tanggal Terima + 3 hari kerja), field otomatis "Batas Waktu EDD (rumus sementara)" tidak tampil di form, hanya Detail/Export; alert mulai SETELAH lewat batas (`> 0`) dan hanya bila Hasil EDD kosong, asesmen Dilanjutkan, status Open. Status tetap Open: cocok.
3. **Membuka sensor**: sudah sesuai keputusan sejak v2.14.5 (semua peran). Export selalu tersamar semua peran (tambahan mockup).
4. **Nama merchant**: keputusan "teks uraian, bisa banyak merchant, bisa dicari, tidak tampil di tabel". Mockup tidak punya field Nama Merchant; hanya "Group Merchant" (teks satu nilai, dicari, ada di filter Table dan grafik Top 10) dan "Nama Terlapor".
5. **Filter produk UE dan QRIS pada visual**: keputusan menyebutnya; mockup tidak memilikinya di Dashboard. Produk hanya filter Table (semua nilai Master Produk termasuk Biller).
6. Tambahan mockup (tidak ada di keputusan): field Jenis Pengguna, Rincian Dugaan, Alasan Asesmen (wajib), Hold Settlement, Released, Saldo Tertahan, Tanggal Email PPATK, Tanggal Hapus QRIS, Tanggal Email Tutup Akun, tiga Tanggal Lapor (Komdigi, BI, PPATK dengan batas 7/14/30 hari), Tanggal Email Resolved, PIC Investigator, Tanggal Transaksi; enam alert; 5 kartu dan 9 grafik dashboard; wajib bersyarat saat Closed; pembatas "kasus miliknya" untuk PIC dan Fraud Investigator.
7. Kasus tanpa PIC Investigator tidak dapat diedit oleh Fraud Investigator/PIC (efek samping `canEditRow`); keputusan tidak membahas.
8. Izin efektif vs panduan (0.2), terutama Update = Ubah + Cancel.
9. Upload Bukti: satu file per kasus (single), bukan "satu file per upload, bisa banyak" seperti Tracker; keputusan: satu file per upload. [tidak pasti: apakah kasus boleh punya lebih dari satu bukti].
