// Judul halaman admin. Menu ada di app/admin/layout.tsx.
export default function AdminBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bar-head">
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
    </div>
  );
}
