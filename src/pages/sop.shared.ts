import { addDays } from '../lib'
import type { BaseRec, FileMeta } from '../kit/types'

export interface SopRevisi { no: string; tgl: string; file: FileMeta | null }
export interface SopRec extends BaseRec {
  noDok: string; judul: string; ringkasan: string; pemilik: string
  tglBerlaku: string; tglUbah: string; noRevisi: string
  retensi: string; klasifikasi: string; file: FileMeta | null
  tglReview: string; pic: string; revisi: SopRevisi[]
  // status (BaseRec): 'Aktif' | 'Dalam Review' | 'Dicabut'
}
export const sopLabel = (s: SopRec) => `${s.noDok} - ${s.judul} - ${s.pemilik}`

const TITLES: [string, string, string][] = [
  ['Penerimaan Merchant QRIS', 'Business', 'Prosedur onboarding dan verifikasi merchant QRIS.'],
  ['Penanganan Keluhan Konsumen', 'Support (HRD & GA)', 'Alur penerimaan, eskalasi, dan penyelesaian keluhan konsumen.'],
  ['Pemantauan Transaksi Mencurigakan', 'Compliance', 'Kriteria dan alur pelaporan transaksi keuangan mencurigakan.'],
  ['Manajemen Akses Sistem', 'IT', 'Pemberian, peninjauan, dan pencabutan hak akses sistem.'],
  ['Rekonsiliasi Settlement Harian', 'Finance, Accounting, Tax & Treasury', 'Langkah rekonsiliasi dana settlement dengan bank mitra.'],
  ['Penanganan Insiden Siber', 'IT', 'Deteksi, eskalasi, dan pelaporan insiden siber kepada regulator.'],
  ['Prosedur APU PPT', 'Compliance', 'Penerapan prinsip mengenali pengguna jasa dan pelaporan PPATK.'],
  ['Pengelolaan Vendor', 'Operation', 'Seleksi, evaluasi, dan pemutusan kerja sama vendor.'],
  ['Backup dan Pemulihan Data', 'IT', 'Jadwal backup, uji pemulihan, dan penyimpanan salinan data.'],
  ['Penanganan Fraud', 'Operation', 'Investigasi dugaan fraud, EDD, dan tindak lanjut blokir.'],
  ['Hold dan Release Settlement', 'Finance, Accounting, Tax & Treasury', 'Syarat, persetujuan, dan pencatatan penahanan dana merchant.'],
  ['Pengelolaan Dokumen Kontrol', 'Compliance', 'Penomoran, revisi, dan retensi dokumen kontrol.'],
  ['Perubahan Sistem (Change Management)', 'IT', 'Pengajuan, uji, dan persetujuan perubahan sistem produksi.'],
  ['Pelatihan Kepatuhan Tahunan', 'Support (HRD & GA)', 'Rencana, pelaksanaan, dan evaluasi pelatihan kepatuhan.'],
  ['Pengelolaan Risiko Operasional', 'Operation', 'Identifikasi, penilaian, dan mitigasi risiko operasional.'],
  ['Pelindungan Data Pribadi', 'IT', 'Pengumpulan, penyimpanan, dan penghapusan data pribadi pengguna.'],
  ['Biller Gateway Onboarding', 'Business', 'Integrasi dan uji biller baru pada gateway.'],
  ['Penerbitan Laporan Keuangan Mitra', 'Finance, Accounting, Tax & Treasury', 'Penyusunan laporan keuangan dan tagihan mitra.'],
  ['Pengadaan Barang dan Jasa', 'Operation', 'Proses pengadaan dan persetujuan anggaran.'],
  ['Kebijakan Sanksi Merchant', 'Compliance', 'Teguran, penangguhan, dan terminasi merchant.'],
  ['Business Continuity Plan', 'Operation', 'Rencana keberlangsungan layanan saat gangguan besar.'],
  ['Pengelolaan Perangkat Kantor', 'Support (HRD & GA)', 'Inventaris, penggunaan, dan pengembalian perangkat.'],
  ['Pemantauan Kapasitas Sistem', 'IT', 'Ambang kapasitas dan tindakan penambahan sumber daya.'],
  ['Permintaan Layanan Hukum Internal', 'Compliance', 'Alur permintaan review dan pendapat hukum.'],
  ['Pengarsipan Dokumen Legal', 'Compliance', 'Penyimpanan dan akses dokumen legal.'],
]

// ~25 SOP. Tiga baris sengaja tidak lengkap (tanpa tgl review / PIC / status) untuk alert "data belum lengkap"
export function seedSop(today: string): SopRec[] {
  const reviewOff = [20, -12, 400, 15, 300, 200, -40, 25, 150, 90, 500, 10, 60, 350, 120, 28, -5, 180, 240, 75, 330, 45, 0, 0, 0]
  return TITLES.map(([judul, pemilik, ringkasan], i) => {
    const no = i + 1
    const incomplete = i >= 22
    const status = incomplete && i === 24 ? '' : i === 6 ? 'Dalam Review' : i === 11 ? 'Dicabut' : i % 9 === 4 ? 'Dalam Review' : 'Aktif'
    const ubah = addDays(today, -(120 + ((i * 97) % 900)))
    const rev = 1 + (i % 4)
    return {
      id: `sop-${no}`, no, status, createdAt: ubah, createdBy: 'Rina Kartika',
      noDok: `SOP-${String(70 + no).padStart(3, '0')}-PAY`, judul, ringkasan, pemilik,
      tglBerlaku: addDays(ubah, 7), tglUbah: ubah, noRevisi: `Rev.${rev}`,
      retensi: i % 3 === 0 ? '10 Tahun' : i % 7 === 0 ? 'Permanen' : '5 Tahun', klasifikasi: i % 5 === 0 ? 'Rahasia' : i % 2 ? 'Internal' : 'Publik',
      file: { name: `SOP-${String(70 + no).padStart(3, '0')}-PAY.pdf`, size: (200 + i * 37) * 1024, type: 'application/pdf' },
      tglReview: incomplete && i === 22 ? '' : addDays(today, reviewOff[i]),
      pic: incomplete && i === 23 ? '' : ['Regie', 'Fakhri', 'Osama'][i % 3], // master PIC
      revisi: rev > 1 ? Array.from({ length: rev - 1 }, (_, k) => ({ no: `Rev.${k + 1}`, tgl: addDays(ubah, -180 * (rev - 1 - k)), file: { name: `SOP-${String(70 + no).padStart(3, '0')}-Rev${k + 1}.pdf`, size: 150 * 1024, type: 'application/pdf' } })) : [],
    }
  })
}
