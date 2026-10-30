import type { AdminMessenger, AdminShipment, AdminStats } from "./types";

const KEY = "amanah:admin";

export function loadToken(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number };
    return expiresAt > Date.now() ? token : null;
  } catch {
    return null;
  }
}

function saveToken(token: string, expiresAt: number) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ token, expiresAt }));
  } catch {
    // La sessione resta valida finché la pagina è aperta.
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignorato
  }
}

export class UnauthorizedError extends Error {}

async function call<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new UnauthorizedError((data as { error?: string }).error ?? "Accesso richiesto.");
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Si è verificato un errore.");
  return data as T;
}

export const adminApi = {
  async login(password: string): Promise<string> {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: string; expiresAt?: number; error?: string };
    if (!res.ok || !data.token) throw new Error(data.error ?? "Accesso non riuscito.");
    saveToken(data.token, data.expiresAt!);
    return data.token;
  },

  messengers: (token: string) => call<{ messengers: AdminMessenger[] }>(token, "/api/admin/messengers"),

  review: (token: string, id: string, action: "approve" | "reject" | "reset", reason?: string) =>
    call<{ messenger: AdminMessenger }>(token, "/api/admin/messengers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    }),

  deleteMessenger: (token: string, id: string) =>
    call<{ deleted: string }>(token, `/api/admin/messengers?${new URLSearchParams({ id })}`, { method: "DELETE" }),

  deleteShipment: (token: string, id: string) =>
    call<{ deleted: string }>(token, `/api/admin/shipments?${new URLSearchParams({ id })}`, { method: "DELETE" }),

  markPaidOut: (token: string, id: string) =>
    call<{ ok: boolean }>(token, "/api/admin/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }),

  shipments: (token: string) => call<{ shipments: AdminShipment[]; stats: AdminStats }>(token, "/api/admin/shipments"),

  /** Scarica un file privato e restituisce un URL locale (blob:) da mostrare o aprire. */
  async file(token: string, tipo: "documento" | "foto", key: string): Promise<{ url: string; type: string }> {
    const res = await fetch(`/api/admin/file?${new URLSearchParams({ tipo, key })}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new UnauthorizedError("Sessione scaduta.");
    if (!res.ok) throw new Error("File non disponibile.");
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), type: blob.type };
  },
};
