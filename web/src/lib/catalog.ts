export const CATEGORIES = [
  { id: "documenti", label: "Documenti", emoji: "📄" },
  { id: "vestiti", label: "Vestiti", emoji: "👗" },
  { id: "dolci", label: "Dolci e alimenti", emoji: "🍯" },
  { id: "valigia", label: "Valigia / effetti personali", emoji: "🧳" },
  { id: "altro", label: "Altra merce", emoji: "📦" },
] as const;

export const DEPARTURE_AIRPORTS = [
  { iata: "CAI", city: "Il Cairo", name: "Cairo International" },
  { iata: "HBE", city: "Alessandria", name: "Borg El Arab" },
] as const;

export const EUROPE_AIRPORTS = [
  { iata: "FCO", city: "Roma Fiumicino", country: "IT" },
  { iata: "MXP", city: "Milano Malpensa", country: "IT" },
  { iata: "BGY", city: "Bergamo", country: "IT" },
  { iata: "LIN", city: "Milano Linate", country: "IT" },
  { iata: "VCE", city: "Venezia", country: "IT" },
  { iata: "BLQ", city: "Bologna", country: "IT" },
  { iata: "TRN", city: "Torino", country: "IT" },
  { iata: "NAP", city: "Napoli", country: "IT" },
  { iata: "PSA", city: "Pisa", country: "IT" },
  { iata: "CTA", city: "Catania", country: "IT" },
  { iata: "CDG", city: "Parigi CDG", country: "FR" },
  { iata: "ORY", city: "Parigi Orly", country: "FR" },
  { iata: "MRS", city: "Marsiglia", country: "FR" },
  { iata: "FRA", city: "Francoforte", country: "DE" },
  { iata: "MUC", city: "Monaco di Baviera", country: "DE" },
  { iata: "BER", city: "Berlino", country: "DE" },
  { iata: "DUS", city: "Düsseldorf", country: "DE" },
  { iata: "AMS", city: "Amsterdam", country: "NL" },
  { iata: "BRU", city: "Bruxelles", country: "BE" },
  { iata: "LHR", city: "Londra Heathrow", country: "GB" },
  { iata: "LGW", city: "Londra Gatwick", country: "GB" },
  { iata: "MAD", city: "Madrid", country: "ES" },
  { iata: "BCN", city: "Barcellona", country: "ES" },
  { iata: "LIS", city: "Lisbona", country: "PT" },
  { iata: "ATH", city: "Atene", country: "GR" },
  { iata: "VIE", city: "Vienna", country: "AT" },
  { iata: "ZRH", city: "Zurigo", country: "CH" },
  { iata: "GVA", city: "Ginevra", country: "CH" },
  { iata: "CPH", city: "Copenaghen", country: "DK" },
  { iata: "ARN", city: "Stoccolma", country: "SE" },
  { iata: "WAW", city: "Varsavia", country: "PL" },
  { iata: "PRG", city: "Praga", country: "CZ" },
] as const;

export const EUROPE_COUNTRY_CODES = new Set([
  "AL", "AT", "BA", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR",
  "HR", "HU", "IE", "IS", "IT", "LT", "LU", "LV", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO",
  "RS", "SE", "SI", "SK",
]);

export function europeAirportCity(iata: string): string | undefined {
  return EUROPE_AIRPORTS.find((a) => a.iata === iata)?.city;
}

export function normalizeFlightNumber(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}
