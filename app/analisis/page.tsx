import AnalysisForm from '@/components/AnalysisForm';

export const metadata = { title: 'Analisis minuman – Emang Sehat?' };

export default function Analisis() {
  return (
    <>
      <h2>Input data minuman</h2>
      <p>Salin angka dari tabel informasi nilai gizi. Isi sesuai satu kemasan atau satu sajian, lalu masukkan ukurannya di bawah.</p>
      <AnalysisForm />
    </>
  );
}
