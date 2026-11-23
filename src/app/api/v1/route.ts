export function GET() {
  return Response.json({
    name: "RetteDeineStadt",
    version: "v1",
    openapi: "/api/openapi",
  });
}
