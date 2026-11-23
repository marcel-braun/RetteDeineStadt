import { cookies } from "next/headers";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const jar = await cookies();
  const header = jar
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const origin = process.env.INTERNAL_API_ORIGIN ?? "http://127.0.0.1:3000";
  const response = await fetch(`${origin}${path}`, {
    headers: { accept: "application/json", cookie: header },
    cache: "no-store",
  });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return (await response.json()) as T;
}
