import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await readFile(path.join(process.cwd(), "docs/openapi.yaml"), "utf8");
  return new Response(body, {
    headers: { "Content-Type": "application/yaml; charset=utf-8" },
  });
}
