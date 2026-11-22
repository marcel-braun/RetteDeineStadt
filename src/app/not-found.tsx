import Link from "next/link";

export default function NotFound() {
  return (
    <section className="stack">
      <h1>Nicht gefunden</h1>
      <p>Diese Seite gibt es nicht, oder der Laden ist noch nicht freigegeben.</p>
      <Link className="button" href="/">
        Zur Karte
      </Link>
    </section>
  );
}
