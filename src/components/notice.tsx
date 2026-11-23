export function Notice({ hinweis, art }: { hinweis?: string; art?: string }) {
  if (!hinweis) return null;
  return (
    <p className={art === "fehler" ? "notice bad" : "notice ok"} role="status">
      {hinweis}
    </p>
  );
}
