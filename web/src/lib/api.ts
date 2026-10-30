import { ApiError } from "../i18n";
import type { ErrParams, ErrorCode } from "../i18n/types";
import type { FlightsResponse, OrderView, PublicMessenger, ShipmentSummary } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Network error", "network");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: ErrorCode; params?: ErrParams };
  if (!res.ok) throw new ApiError(data.error ?? `HTTP ${res.status}`, data.code ?? "generic", data.params);
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

  checkout: (shipmentId: string, messengerId: string, lang: string) =>
    request<{ url: string }>("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentId, messengerId, lang }),
    }),

  getOrder: (id: string, k: string) => request<OrderView>(`/api/order?${new URLSearchParams({ id, k })}`),

  orderAction: (body: Record<string, unknown> & { id: string; k: string; action: string }) =>
    request<OrderView>("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  confirm: (sessionId: string) =>
    request<{
      shipmentId: string;
      amountPaid: number;
      orderUrl: string;
      emailSent: boolean;
      messenger: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        flight: PublicMessenger["flight"];
      };
    }>(`/api/confirm?${new URLSearchParams({ session_id: sessionId })}`),
};
