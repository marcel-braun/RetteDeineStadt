import Link from "next/link";
import { redirect } from "next/navigation";
import { apiGet } from "@/ui/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await apiGet<{ user: { role: string } | null }>("/api/v1/sitzung");
  if (session.user?.role !== "ADMIN") redirect("/anmelden?next=/admin");
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
