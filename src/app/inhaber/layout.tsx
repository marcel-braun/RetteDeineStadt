import Link from "next/link";
import { redirect } from "next/navigation";
import { apiGet } from "@/ui/api";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await apiGet<{ user: { role: string } | null }>("/api/v1/sitzung");
  if (session.user?.role !== "OWNER") redirect("/anmelden?next=/inhaber");
  return (
    <div className="stack">
      <nav className="nav" aria-label="Laden">
        <Link href="/inhaber">Übersicht</Link>
        <Link href="/inhaber/laden">Angaben</Link>
        <Link href="/inhaber/produkte/neu">Neues Produkt</Link>
        <Link href="/inhaber/import">CSV</Link>
        <Link href="/inhaber/versand">Versandwege</Link>
      </nav>
      {children}
    </div>
  );
}
