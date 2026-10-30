import type { FlightsResponse, PublicMessenger, ShipmentSummary } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error("Connessione non riuscita. Controlla la rete e riprova.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Si è verificato un errore.");
  return data as T;
}

export const api = {
  createShipment: (form: FormData) => request<ShipmentSummary>("/api/shipments", { method: "POST", body: form }),

  createMessenger: (form: FormData) =>
    request<{ messenger: PublicMessenger }>("/api/messengers", { method: "POST", body: form }),

  listMessengers: (params: { from: string; date?: string }) =>
    request<{ messengers: PublicMessenger[] }>(`/api/messengers?${new URLSearchParams(params)}`),

  flights: (from: string, date: string) =>
    request<FlightsResponse>(`/api/flights?${new URLSearchParams({ from, date })}`),

  checkout: (shipmentId: string, messengerId: string) =>
    request<{ url: string }>("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentId, messengerId }),
    }),

  confirm: (sessionId: string) =>
    request<{
      shipmentId: string;
      amountPaid: number;
      messenger: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        flight: PublicMessenger["flight"];
      };
    }>(`/api/confirm?${new URLSearchParams({ session_id: sessionId })}`),
};
