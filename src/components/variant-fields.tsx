"use client";

import { useState } from "react";

type Row = { id: string; label: string; price: string; stock: string };

export function VariantFields({ rows }: { rows: Row[] }) {
  const [items, setItems] = useState<Row[]>(rows.length > 0 ? rows : [{ id: "", label: "", price: "", stock: "" }]);

  return (
    <fieldset>
      <legend>Variante</legend>
      <p className="quiet">Eine Achse, zum Beispiel Gewicht oder Größe. Jede Variante hat Preis und Bestand.</p>
      {items.map((item, index) => (
        <div className="variant-row" key={`${item.id}-${index}`}>
          <input type="hidden" name="variantId" value={item.id} />
          <label>
            Bezeichnung
            <input name="variantLabel" defaultValue={item.label} />
          </label>
          <label>
            Preis in Euro
            <input name="variantPrice" defaultValue={item.price} inputMode="decimal" />
          </label>
          <label>
            Bestand
            <input name="variantStock" defaultValue={item.stock} inputMode="numeric" />
          </label>
          {item.id ? (
            <label className="check">
              <input type="checkbox" name="variantRemove" value={item.id} /> Entfernen
            </label>
          ) : (
            <span />
          )}
        </div>
      ))}
      <button
        className="secondary"
        type="button"
        onClick={() => setItems([...items, { id: "", label: "", price: "", stock: "" }])}
      >
        Weitere Variante
      </button>
    </fieldset>
  );
}
