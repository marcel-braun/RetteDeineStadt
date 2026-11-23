import { requireActor } from "@/api/http";
import { productForm } from "@/core/desk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireActor("OWNER");
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? undefined;
  const form = await productForm(user.id, id);
  if (!form) return Response.json({ error: "Produkt nicht gefunden." }, { status: 404 });
  return Response.json(form);
}
