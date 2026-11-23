import { industryChoices } from "@/core/desk";

export function GET() {
  return Response.json({ industries: industryChoices() });
}
