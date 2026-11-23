export function parseCsv(text: string) {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const headerLine = source.split("\n").find((line) => line.trim().length > 0) ?? "";
  const semis = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  const delimiter = semis > commas ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((column) => column.length > 0));
}

export function csvObjects(text: string) {
  const table = parseCsv(text);
  if (table.length === 0) return { header: [] as string[], rows: [] as Record<string, string>[] };
  const header = table[0].map((column) => column.trim());
  const rows = table.slice(1).map((columns) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = columns[index] ?? "";
    });
    return record;
  });
  return { header, rows };
}

export const CSV_BASE = ["produkt_schluessel", "name", "beschreibung", "kategorie", "achse", "variante", "preis", "bestand"] as const;
