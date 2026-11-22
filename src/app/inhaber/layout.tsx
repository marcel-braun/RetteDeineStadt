import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("OWNER");
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
