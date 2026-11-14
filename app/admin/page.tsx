import AdminBar from '@/components/AdminBar';
import ProductTable, { type Produk } from '@/components/ProductTable';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Dashboard admin – Emang Sehat?' };
export const dynamic = 'force-dynamic';

export default async function Admin() {
  await requireAdmin();
  const products = await query<Produk>`select id, nama, merek, ukuran_ml, gula_g, natrium_mg, lemak_jenuh_g, kalori, pemanis, komposisi from products order by id`;
  return (
    <>
      <AdminBar title="Dashboard admin" />
      <ProductTable products={products} />
    </>
  );
}
