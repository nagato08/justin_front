const configured = import.meta.env.VITE_API_URL as string | undefined;
export const API_URL = (configured || "http://localhost:3000/api/v1").replace(/\/$/, "");
export const SOCKET_URL = API_URL.replace(/\/api\/v1$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new ApiError(message || "Une erreur est survenue.", response.status);
  }
  return body as T;
}

export const money = (value: string | number) => `${new Intl.NumberFormat("fr-FR").format(Number(value))} FCFA`;
export const dateTime = (value: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function assetUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  return `${SOCKET_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}
