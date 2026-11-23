import { VariantFields } from "./variant-fields";
import { minorToInput } from "@/ui/format";

type Field = {
  key: string;
  label: string;
  type: "text" | "boolean" | "select" | "tokens";
  required: boolean;
  options?: { value: string; label: string }[];
};

type ProductInput = {
  id: string;
  name: string;
  description: string;
  categoryKey: string;
  axisLabel: string | null;
  attributes: Record<string, string | boolean | string[]>;
  variants: { id: string; label: string; priceCents: number; stock: number }[];
};

export function ProductForm({
  industry,
  product,
}: {
  industry: { label: string; categories: { key: string; label: string }[]; fields: Field[] };
  product?: ProductInput | null;
}) {
  const attributes = product?.attributes ?? {};
  return (
    <form className="stack" action="/api/v1/inhaber/produkte" method="post">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <label>
        Name
        <input name="name" required defaultValue={product?.name ?? ""} />
      </label>
      <label>
        Beschreibung
        <textarea name="description" defaultValue={product?.description ?? ""} />
      </label>
      <div className="two">
        <label>
          Kategorie
          <select name="categoryKey" defaultValue={product?.categoryKey ?? industry.categories[0]?.key} required>
            {industry.categories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Variantenachse
          <input name="axis" defaultValue={product?.axisLabel ?? ""} placeholder="leer bei nur einer Variante" />
        </label>
      </div>
      <fieldset>
        <legend>Angaben der Branche {industry.label}</legend>
        <div className="stack">
          {industry.fields.map((field) => {
            const current = attributes[field.key];
            if (field.type === "boolean") {
              return (
                <label className="check" key={field.key}>
                  <input type="checkbox" name={`attr_${field.key}`} defaultChecked={current === true} /> {field.label}
                </label>
              );
            }
            if (field.type === "select") {
              return (
                <label key={field.key}>
                  {field.label}
                  <select name={`attr_${field.key}`} defaultValue={typeof current === "string" ? current : ""} required={field.required}>
                    <option value="">Bitte wählen</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            if (field.type === "tokens") {
              const chosen = Array.isArray(current) ? current : [];
              return (
                <fieldset key={field.key}>
                  <legend>{field.label}</legend>
                  {(field.options ?? []).map((option) => (
                    <label className="check" key={option.value}>
                      <input type="checkbox" name={`attr_${field.key}`} value={option.value} defaultChecked={chosen.includes(option.value)} />{" "}
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              );
            }
            return (
              <label key={field.key}>
                {field.label}
                <input name={`attr_${field.key}`} defaultValue={typeof current === "string" ? current : ""} required={field.required} />
              </label>
            );
          })}
        </div>
      </fieldset>
      <VariantFields
        rows={(product?.variants ?? []).map((variant) => ({
          id: variant.id,
          label: variant.label,
          price: minorToInput(variant.priceCents),
          stock: String(variant.stock),
        }))}
      />
      <button type="submit">Speichern</button>
    </form>
  );
}
