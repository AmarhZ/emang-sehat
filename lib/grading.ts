// Logika penilaian. Acuan: lampiran Kepmenkes HK.01.07/MENKES/301/2026 (adaptasi).
export type Pemanis = 'none' | 'alami' | 'buatan';
export const GRADES = ['A', 'B', 'C', 'D'] as const;
export type Grade = (typeof GRADES)[number];

export interface Minuman {
  nama: string;
  merek: string;
  ukuran_ml: number;
  gula_g: number;
  natrium_mg: number;
  lemak_jenuh_g: number;
  kalori: number;
  pemanis: Pemanis;
  komposisi: string;
}

export interface ParamResult {
  key: 'gula' | 'garam' | 'lemak' | 'pemanis';
  label: string;
  value: number | null; // per 100 ml; null untuk pemanis
  unit: string;
  grade: number; // 0..3
  note: string;
}

export interface Hasil {
  grade: number; // 0..3
  params: ParamResult[];
  kalori100: number;
  alasan: string[];
  rekomendasi: string;
}

export const PEMANIS_LABEL: Record<Pemanis, string> = {
  none: 'Tanpa pemanis tambahan',
  alami: 'Pemanis alami',
  buatan: 'Pemanis buatan',
};
const PEMANIS_MIN: Record<Pemanis, number> = { none: 0, alami: 1, buatan: 2 };

// Batas atas grade A, B, C. Di atas batas C = D.
export const THRESHOLDS = {
  gula: [1, 5, 10], // g/100 ml
  garam: [5, 120, 500], // mg/100 ml
  lemak: [0.7, 1.2, 2.8], // g/100 ml
} as const;

const REKOMENDASI = [
  'Aman diminum setiap hari sebagai pilihan utama.',
  'Boleh diminum sesekali. Batasi sekitar 1 porsi per hari dan perhatikan total gula dari makanan lain.',
  'Konsumsi sesekali saja, misalnya beberapa kali seminggu. Pilih ukuran kecil atau bagi dengan orang lain.',
  'Sebaiknya dihindari sebagai minuman harian. Jika ingin, minum sangat jarang dan dalam porsi kecil.',
];

export const gradeOf = (v: number, t: readonly number[]) => (v <= t[0] ? 0 : v <= t[1] ? 1 : v <= t[2] ? 2 : 3);

export const fmt = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');

export function analyze(p: Minuman): Hasil {
  const k = 100 / p.ukuran_ml;
  const gula = p.gula_g * k;
  const garam = p.natrium_mg * 2.5 * k; // garam = natrium x 2,5
  const lemak = p.lemak_jenuh_g * k;
  const kalori100 = p.kalori * k;

  const params: ParamResult[] = [
    { key: 'gula', label: 'Gula', value: gula, unit: 'g/100 ml', grade: gradeOf(gula, THRESHOLDS.gula), note: 'Batas grade A ≤ 1 g' },
    { key: 'garam', label: 'Garam', value: garam, unit: 'mg/100 ml', grade: gradeOf(garam, THRESHOLDS.garam), note: 'Dari natrium × 2,5' },
    { key: 'lemak', label: 'Lemak jenuh', value: lemak, unit: 'g/100 ml', grade: gradeOf(lemak, THRESHOLDS.lemak), note: 'Batas grade A ≤ 0,7 g' },
    {
      key: 'pemanis', label: 'Pemanis', value: null, unit: PEMANIS_LABEL[p.pemanis],
      grade: PEMANIS_MIN[p.pemanis], note: 'Grade terendah yang dapat diberikan: ' + GRADES[PEMANIS_MIN[p.pemanis]],
    },
  ];

  const grade = Math.max(...params.map((x) => x.grade));
  const alasan = params.map((x) =>
    x.key === 'pemanis'
      ? x.grade === 0
        ? 'Tidak memakai pemanis tambahan.'
        : `Memakai ${PEMANIS_LABEL[p.pemanis].toLowerCase()}, sehingga grade terbaiknya hanya ${GRADES[x.grade]}.`
      : `${x.label} ${fmt(x.value!)} ${x.unit} masuk grade ${GRADES[x.grade]}.`,
  );
  return { grade, params, kalori100, alasan, rekomendasi: REKOMENDASI[grade] };
}

export const worstParams = (h: Hasil) => h.params.filter((x) => x.grade === h.grade);

const n = (v: unknown) => {
  const x = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};

// Membersihkan data dari form/JSON menjadi Minuman yang valid. Mengembalikan string jika tidak valid.
export function parseMinuman(raw: Record<string, unknown>): Minuman | string {
  const p: Minuman = {
    nama: String(raw.nama ?? '').trim().slice(0, 120),
    merek: String(raw.merek ?? '').trim().slice(0, 80),
    ukuran_ml: n(raw.ukuran_ml),
    gula_g: n(raw.gula_g),
    natrium_mg: n(raw.natrium_mg),
    lemak_jenuh_g: n(raw.lemak_jenuh_g),
    kalori: n(raw.kalori),
    pemanis: (['none', 'alami', 'buatan'] as const).includes(raw.pemanis as Pemanis) ? (raw.pemanis as Pemanis) : 'none',
    komposisi: String(raw.komposisi ?? '').trim().slice(0, 1000),
  };
  if (!p.nama) return 'Nama produk wajib diisi.';
  if (p.ukuran_ml <= 0) return 'Ukuran kemasan harus lebih dari 0 ml.';
  if ([p.gula_g, p.natrium_mg, p.lemak_jenuh_g, p.kalori].some((v) => v < 0)) return 'Nilai gizi tidak boleh negatif.';
  return p;
}
