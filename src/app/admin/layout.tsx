import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="stack">
      <nav className="nav" aria-label="Verwaltung">
        <Link href="/admin">Übersicht</Link>
        <Link href="/admin/mandanten">Mandanten</Link>
        <Link href="/admin/versand">Versandpreise</Link>
      </nav>
      {children}
    </div>
  );
}
