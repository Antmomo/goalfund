import type { ShipmentSummary } from "./types";

const KEY = "amanah:shipment";

export function loadShipment(): ShipmentSummary | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShipmentSummary) : null;
  } catch {
    return null;
  }
}

export function saveShipment(summary: ShipmentSummary): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(summary));
  } catch {
    // Il browser blocca la memoria locale: l'utente potrà comunque proseguire in questa pagina.
  }
}

export function clearShipment(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorato
  }
}

export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string, locale = "it-IT"): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
