// Mengubah teks hasil OCR label gizi (bahasa Indonesia/Inggris) menjadi data form.
import type { Pemanis } from './grading';

export interface ParsedLabel {
  data: Partial<{ ukuran_ml: number; kalori: number; gula_g: number; natrium_mg: number; lemak_jenuh_g: number; pemanis: Pemanis; komposisi: string }>;
  found: string[]; // kunci data yang berhasil dibaca
  notes: string[]; // catatan untuk pengguna
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const toNum = (s: string) => parseFloat(s.replace(',', '.'));

function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[|;:_=~]+/g, ' ')
    .replace(/[‘’´`]/g, "'")
    .replace(/(\d)\s*[oO](?=\s*(?:g|mg|gr|kkal|kcal|ml)\b)/g, '$10') // 1O g -> 10 g
    .replace(/\b[oO](?=\s*(?:g|mg|gr|gram)\b)/g, '0') // O g -> 0 g
    .replace(/[ \t]+/g, ' ');
}

function first(text: string, re: RegExp): number | null {
  const m = re.exec(text);
  return m ? toNum(m[1]) : null;
}

const ARTIFICIAL = /aspartam|aspartame|sukralosa|sucralose|asesulfam|acesulfame|sakarin|saccharin|siklamat|cyclamate|neotam|neotame|advantam|pemanis\s*buatan|artificial\s*sweetener/;
const NATURAL = /stevia|steviol|glikosida|monk\s*fruit|luo\s*han|pemanis\s*alami|\bmadu\b|\bhoney\b/;

export function parseLabel(raw: string): ParsedLabel {
  const t = normalize(raw);
  const data: ParsedLabel['data'] = {};
  const notes: string[] = [];

  // Ukuran: takaran saji lebih dulu (angka gizi biasanya per sajian), lalu isi bersih/volume.
  const per100 = /per\s*100\s*ml|\/\s*100\s*ml|per\s*100\s*g\b/.test(t);
  const unit = String.raw`\s*(ml|l|liter|cc)\b`;
  const sizeRes = [
    new RegExp(String.raw`(?:takaran\s*saji|ukuran\s*sajian|ukuran\s*saji|serving\s*size)[^\d\n]{0,20}` + NUM + unit),
    new RegExp(String.raw`(?:isi\s*bersih|berat\s*bersih|netto|net\s*(?:vol|volume)?|volume|vol\.?)[^\d\n]{0,12}` + NUM + unit),
    new RegExp(NUM + String.raw`\s*(ml)\b`),
  ];
  for (const re of sizeRes) {
    const m = re.exec(t);
    if (m) {
      const v = toNum(m[1]);
      data.ukuran_ml = /^l|liter/.test(m[2]) ? v * 1000 : v;
      break;
    }
  }
  if (per100) {
    data.ukuran_ml = 100;
    notes.push('Label memuat kolom “per 100 ml”, jadi angka dibaca sebagai per 100 ml. Pastikan kolom yang terbaca benar.');
  } else if (data.ukuran_ml) {
    notes.push('Angka gizi diasumsikan per takaran saji yang terbaca. Jika label memuat “sajian per kemasan” lebih dari 1, ubah ukuran sesuai angka yang kamu masukkan.');
  }

  const g = String.raw`\s*(?:g|gr|gram)\b`;
  const gula = first(t, new RegExp(String.raw`(?:gula(?:\s*total)?|total\s*sugars?|sugars?)[^\d\n]{0,15}` + NUM + g));
  if (gula !== null) data.gula_g = gula;

  const lemak = first(t, new RegExp(String.raw`(?:lemak\s*jenuh|saturated\s*fat|sat\.?\s*fat)[^\d\n]{0,15}` + NUM + g));
  if (lemak !== null) data.lemak_jenuh_g = lemak;

  const mg = String.raw`\s*mg\b`;
  const natrium = first(t, new RegExp(String.raw`(?:natri[a-z]{1,4}|sodium)[^\d\n]{0,15}` + NUM + mg));
  if (natrium !== null) data.natrium_mg = natrium;
  else {
    const garam = first(t, new RegExp(String.raw`garam[^\d\n]{0,15}` + NUM + mg));
    if (garam !== null) { data.natrium_mg = Math.round((garam / 2.5) * 10) / 10; notes.push('Nilai “garam” dikonversi ke natrium (garam ÷ 2,5).'); }
  }

  // Energi: utamakan kkal; jika hanya kJ, konversi.
  const energyLine = /(?:energi(?:\s*total)?|kalori|energy|calories)[^\n]*/.exec(t)?.[0];
  if (energyLine) {
    const kkal = first(energyLine, new RegExp(NUM + String.raw`\s*(?:kkal|kcal|cal)\b`));
    const kj = first(energyLine, new RegExp(NUM + String.raw`\s*kj\b`));
    if (kkal !== null) data.kalori = kkal;
    else if (kj !== null) data.kalori = Math.round(kj / 4.184);
  }

  // Pemanis dari teks keseluruhan (komposisi biasanya memuatnya).
  if (ARTIFICIAL.test(t)) data.pemanis = 'buatan';
  else if (NATURAL.test(t)) data.pemanis = 'alami';

  // Komposisi: dari kata kunci sampai bagian berikutnya.
  const k = /(?:komposisi|ingredients?|bahan)\s*[^\n\w]?\s*([\s\S]{8,400}?)(?=informasi\s*nilai|nilai\s*gizi|mengandung|diproduksi|produksi|kadaluarsa|kedaluwarsa|exp\b|simpan|nomor|bpom|isi\s*bersih|takaran\s*saji|\b(?:energi|lemak(?:\s*(?:total|jenuh))?|gula|protein|karbohidrat(?:\s*total)?|natrium|garam)[^\n\d]{0,12}\d|$)/.exec(t);
  if (k) {
    const kom = k[1].replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim().replace(/^[,.\-\s]+|[,\s]+$/g, '');
    if (kom.length >= 8) (data as Record<string, unknown>).komposisi = kom.charAt(0).toUpperCase() + kom.slice(1);
  }

  return { data, found: Object.keys(data), notes };
}
