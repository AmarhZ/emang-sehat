// OCR di browser memakai Tesseract.js (open source, Apache-2.0). Tanpa API key dan tanpa kirim gambar ke server.
import type { Worker } from 'tesseract.js';

type Progress = (percent: number, label: string) => void;

let workerPromise: Promise<Worker> | null = null;
let report: Progress | null = null;

const LABEL: Record<string, string> = {
  'loading tesseract core': 'Memuat mesin OCR…',
  'initializing tesseract': 'Menyiapkan mesin OCR…',
  'loading language traineddata': 'Mengunduh data bahasa (hanya saat pertama kali)…',
  'initializing api': 'Menyiapkan…',
  'recognizing text': 'Membaca teks pada label…',
};

// Worker dibuat sekali lalu dipakai ulang agar scan berikutnya cepat.
function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const w = await createWorker(['ind', 'eng'], 1, {
        logger: (m) => report?.(Math.round((m.progress ?? 0) * 100), LABEL[m.status] ?? 'Memproses…'),
      });
      // Mode blok tunggal menjaga nama zat gizi dan angkanya tetap satu baris pada tabel.
      await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1' });
      return w;
    })().catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

// Perbesar, ubah ke abu-abu, dan regangkan kontras agar teks kecil pada kemasan lebih mudah dibaca.
function preprocess(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(2.5, Math.max(1, 2000 / Math.max(img.width, img.height)));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const gray = new Uint8ClampedArray(c.width * c.height);
      const hist = new Uint32Array(256);
      for (let i = 0, p = 0; i < d.data.length; i += 4, p++) {
        const v = Math.round(0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]);
        gray[p] = v; hist[v]++;
      }
      const total = gray.length;
      let lo = 0, hi = 255, acc = 0;
      for (; lo < 255; lo++) { acc += hist[lo]; if (acc > total * 0.02) break; }
      acc = 0;
      for (; hi > 0; hi--) { acc += hist[hi]; if (acc > total * 0.02) break; }
      const range = Math.max(1, hi - lo);
      for (let i = 0, p = 0; i < d.data.length; i += 4, p++) {
        const v = Math.max(0, Math.min(255, ((gray[p] - lo) * 255) / range));
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      }
      ctx.putImageData(d, 0, 0);
      resolve(c);
    };
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
    img.src = src;
  });
}

export async function readLabelText(image: string, onProgress?: Progress): Promise<string> {
  report = onProgress ?? null;
  try {
    const [canvas, worker] = await Promise.all([preprocess(image), getWorker()]);
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    report = null;
  }
}
