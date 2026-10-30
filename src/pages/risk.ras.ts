// Risk Appetite & Risk Tolerance per domain risiko (sheet "3. RAS-RT Sederhana", Request Product.xlsx). Hanya rujukan baca-saja di Detail Risk Register.
// Appetite = Low (target ideal), Tolerance = Medium (batas maksimum diterima), Breach = High (wajib eskalasi).
export interface RasRt { domain: string; definisi: string; event: string; appetite: string; tolerance: string; breach: string }
export const RAS_RT: RasRt[] = [
  {
    "domain": "Operasional",
    "definisi": "Risiko rugi karena proses internal, SDM, sistem/IT, atau kejadian dari luar yang mengganggu layanan Sistem Pembayaran.",
    "event": "Sistem Paydia terganggu karena proses, SDM, sistem, atau kejadian dari luar yang mengganggu operasional.",
    "appetite": "Dampak (ambil yang terburuk):\n- Sistem utama mati <1 jam\n- Pengguna terdampak ≤1%\n- Transaksi gagal ≤2% dari volume harian\n- Produktivitas karyawan turun ≤20%/tahun\n- SLA vendor tercapai ≥98%\n\nFrekuensi: ≤10x/tahun",
    "tolerance": "Dampak (ambil yang terburuk):\n- Sistem utama mati 1-5 jam\n- Pengguna terdampak 1%-5%\n- Transaksi gagal 2%-5%\n- Produktivitas karyawan turun 20-50%/tahun\n- SLA vendor 95%-98%\n\nFrekuensi: 10-50x/tahun",
    "breach": "Dampak (ambil yang terburuk):\n- Sistem utama mati >5 jam\n- Pengguna terdampak >5%\n- Transaksi gagal >5%\n- Produktivitas karyawan turun >50%/tahun\n- SLA vendor <95%\n\nFrekuensi: >50x/tahun"
  },
  {
    "domain": "Likuiditas",
    "definisi": "Risiko tidak mampu bayar kewajiban keuangan atau transaksi Sistem Pembayaran tepat waktu, baik saat kondisi normal maupun tertekan.",
    "event": "Paydia gagal bayar, kekurangan dana settlement, atau kejadian lain yang membuat kewajiban keuangan tidak terbayar tepat waktu.",
    "appetite": "Dampak: kurang bayar settlement ≤1% dari dana float/operasional harian\n\nFrekuensi: 0x/tahun",
    "tolerance": "Dampak: kurang bayar settlement 1%-5% dari dana float/operasional harian\n\nFrekuensi: 1-2x/tahun",
    "breach": "Dampak: kurang bayar settlement >5% dari dana float/operasional harian\n\nFrekuensi: >2x/tahun"
  },
  {
    "domain": "Keuangan",
    "definisi": "Risiko rugi keuangan akibat layanan Sistem Pembayaran, yang bisa memengaruhi kondisi keuangan dan keberlangsungan usaha Paydia.",
    "event": "Dana hilang, saldo bank kurang dari pencatatan, salah hitung pendapatan/biaya, biaya akibat fraud, atau kejadian lain yang merugikan Paydia secara finansial.",
    "appetite": "Dampak: dana hilang/selisih saldo/salah catat/denda ≤0,01% dari rata-rata pendapatan bersih 12 bulan terakhir\n\nFrekuensi: ≤1x/tahun",
    "tolerance": "Dampak: 0,01%-0,05% dari rata-rata pendapatan bersih 12 bulan terakhir\n\nFrekuensi: 1-2x/tahun",
    "breach": "Dampak: >0,05% dari rata-rata pendapatan bersih 12 bulan terakhir\n\nFrekuensi: >2x/tahun"
  },
  {
    "domain": "Kredit",
    "definisi": "Risiko rugi karena pihak lain (mitra, bank settlement, dll) gagal memenuhi kewajiban keuangan ke Paydia, termasuk dana prefunding, settlement, float, escrow, dan piutang.",
    "event": "Switching gagal atau telat bayar dana settlement, dispute transaksi, atau kejadian lain yang membuat Paydia rugi karena pihak lain tidak memenuhi kewajiban.",
    "appetite": "Dampak: kurang bayar ≤1% dari total settlement merchant/dana masuk e-money/representment/refund deposit per bulan\n\nFrekuensi: ≤1x/tahun",
    "tolerance": "Dampak: 1%-5% dari total settlement merchant/dana masuk e-money/representment/refund deposit per bulan\n\nFrekuensi: 1-5x/tahun",
    "breach": "Dampak: >5% dari total settlement merchant/dana masuk e-money/representment/refund deposit per bulan\n\nFrekuensi: >5x/tahun"
  },
  {
    "domain": "Kepatuhan",
    "definisi": "Risiko akibat Paydia tidak patuh pada peraturan, ketentuan BI, atau aturan lain yang berlaku (termasuk APU PPT PPPSPM).",
    "event": "Kena sanksi regulator, laporan ke regulator telat/tidak lengkap/salah, atau kejadian lain akibat tidak patuh aturan.",
    "appetite": "Dampak (ambil yang terburuk):\n- Diminta klarifikasi/perbaikan laporan-data-dokumen\n- Denda regulator ≤0,01% dari pendapatan bruto tahun berjalan\n\nFrekuensi: ≤1x/tahun",
    "tolerance": "Dampak (ambil yang terburuk):\n- Dapat surat komitmen/teguran/peringatan regulator\n- Denda regulator 0,01%-0,05% dari pendapatan bruto tahun berjalan\n\nFrekuensi: 1-2x/tahun",
    "breach": "Dampak (ambil yang terburuk):\n- Usaha dibatasi (sementara/permanen), diawasi khusus, sampai izin dicabut\n- Denda regulator >0,05% dari pendapatan bruto tahun berjalan\n\nFrekuensi: >2x/tahun"
  },
  {
    "domain": "Hukum",
    "definisi": "Risiko akibat lemahnya sisi hukum: kontrak tidak sesuai, sengketa hukum, tidak patuh aturan, perlindungan hukum aset/data lemah, atau potensi dituntut.",
    "event": "Dituntut perdata/pidana, kontrak tidak sah/kedaluwarsa, pelanggaran perjanjian, atau kejadian lain akibat sisi hukum yang lemah.",
    "appetite": "Dampak:\n- Revisi kontrak/dokumen/data legalitas\n- Diminta klarifikasi instansi berwenang\n- Biaya hukum/denda ≤1% dari nilai kontrak yang disengketakan\n\nFrekuensi: ≤1x/tahun",
    "tolerance": "Dampak:\n- Dapat somasi\n- Renegosiasi sampai batal kontrak kerja sama non-strategis\n- Biaya hukum/denda 1%-10% dari nilai kontrak yang disengketakan\n\nFrekuensi: 1-3x/tahun",
    "breach": "Dampak:\n- Digugat perdata, diproses pidana, arbitrase, sampai kalah di pengadilan\n- Renegosiasi sampai batal kontrak kerja sama strategis\n- Biaya hukum/denda >10% dari nilai kontrak yang disengketakan\n- Diduga ada fraud terorganisir yang melibatkan orang internal\n\nFrekuensi: >3x/tahun"
  },
  {
    "domain": "Strategis",
    "definisi": "Risiko akibat strategi bisnis yang salah, tidak sesuai kapasitas operasional dan profil risiko PSP, lambat merespons perubahan pasar, atau terlalu bergantung pada pihak/infrastruktur tertentu.",
    "event": "Target tidak tercapai, strategi bisnis dibuat tanpa kajian, atau kejadian lain yang menghambat tujuan Paydia.",
    "appetite": "Dampak:\n- Pendapatan/nilai transaksi/akuisisi merchant-pengguna baru meleset ≤10% dari target\n- Produk/kerja sama strategis molor <1 bulan dari target\n\nFrekuensi: ≤1 bulan miss-target/tahun",
    "tolerance": "Dampak:\n- Meleset 10%-20% dari target\n- Molor 1-3 bulan dari target\n\nFrekuensi: 2-3 bulan miss-target/tahun (boleh tidak berturut-turut)",
    "breach": "Dampak:\n- Meleset >20% dari target\n- Molor >3 bulan dari target\n\nFrekuensi: >3 bulan miss-target/tahun"
  },
  {
    "domain": "Reputasi",
    "definisi": "Risiko turunnya kepercayaan publik, pengguna, merchant, mitra, dan pemangku kepentingan lain akibat gangguan layanan, insiden keamanan, fraud, pelanggaran aturan, lemahnya perlindungan konsumen, berita negatif, atau komunikasi yang kurang tepat.",
    "event": "Muncul berita/ulasan negatif, jadi viral, atau kejadian lain yang menurunkan kepercayaan stakeholder ke Paydia.",
    "appetite": "Dampak: hanya di kanal resmi (medsos/ulasan aplikasi), belum jadi trending topic\n\nFrekuensi: ≤20x/tahun (medsos/ulasan aplikasi)",
    "tolerance": "Dampak: jadi trending topic di 1 platform medsos, atau dimuat media online lokal, butuh penanganan lintas fungsi\n\nFrekuensi: 20-50x/tahun (medsos/ulasan aplikasi), atau 1-5x trending topic/media lokal per tahun",
    "breach": "Dampak: diliput media nasional besar, viral di banyak platform, atau jadi perhatian resmi BI/otoritas lain; sampai mengakhiri kerja sama\n\nFrekuensi: >50x/tahun (medsos/ulasan aplikasi), atau >5x trending/media lokal per tahun, atau ≥1x liputan nasional/viral/perhatian resmi BI per tahun"
  },
  {
    "domain": "Pelindungan Konsumen",
    "definisi": "Risiko akibat hak dan kepentingan konsumen tidak terpenuhi: informasi tidak transparan, layanan tidak andal, pengaduan/sengketa tidak ditangani baik, data dan dana konsumen tidak terlindungi, sampai konsumen rugi.",
    "event": "Ada hard complaint, penanganan keluhan lewat SLA, layanan tidak ramah penyandang disabilitas, atau kejadian lain akibat perlindungan konsumen tidak terpenuhi.",
    "appetite": "Dampak: keluhan konsumen (hard/soft complaint sesuai SOP pengaduan) lewat Customer Service, bukan dugaan fraud/penyalahgunaan\n\nFrekuensi: <150 tiket/bulan",
    "tolerance": "Dampak: SLA tidak tercapai, ada dugaan fraud/penyalahgunaan layanan, atau perlu penanganan lintas fungsi\n\nFrekuensi: 150-300 tiket/bulan",
    "breach": "Dampak: keluhan gagal diselesaikan, atau eskalasi ke BI/instansi berwenang\n\nFrekuensi: >300 tiket/bulan"
  },
  {
    "domain": "Ketahanan dan Keamanan Siber",
    "definisi": "Risiko terganggunya kerahasiaan, keutuhan, dan ketersediaan data dan/atau sistem informasi Paydia akibat serangan siber, sampai mengganggu kelangsungan bisnis.",
    "event": "Data bocor/dicuri, ada akses tidak sah ke sistem/data, celah keamanan dieksploitasi, atau kejadian lain akibat serangan siber.",
    "appetite": "Dampak: serangan berhasil dicegah atau terdeteksi dan ditangani kontrol keamanan sebelum berdampak ke layanan/data\n\nFrekuensi: ≤1x/tahun",
    "tolerance": "Dampak: ada insiden keamanan yang memengaruhi layanan, tapi masih bisa pulih sesuai target waktu\n\nFrekuensi: 1-3x/tahun",
    "breach": "Dampak: data bocor atau akses tidak sah ke sistem, layanan terganggu melebihi target waktu pulih; jadi perhatian resmi BI/mitra/pemegang saham/media; wajib lapor ke BI/instansi sesuai aturan\n\nFrekuensi: >3x/tahun"
  }
]
export const DOMAINS = RAS_RT.map((x) => x.domain)
export const rasOf = (domain: string) => RAS_RT.find((x) => x.domain === domain)
