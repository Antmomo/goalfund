import type { Config } from "@netlify/functions";
import { DEPARTURE_AIRPORTS, EUROPE_AIRPORTS, EUROPE_COUNTRY_CODES, europeAirportCity } from "../../src/lib/catalog";
import type { Flight, FlightsResponse } from "../../src/lib/types";
import { fail, json } from "../lib/http";

const RAPIDAPI_HOST = "aerodatabox.p.rapidapi.com";
const EUROPE_IATA = new Set<string>(EUROPE_AIRPORTS.map((a) => a.iata));

type AdbAirport = { iata?: string; name?: string; shortName?: string; municipalityName?: string; countryCode?: string };
type AdbMovement = { airport?: AdbAirport; scheduledTime?: { local?: string }; scheduledTimeLocal?: string };
type AdbFlight = {
  number?: string;
  status?: string;
  airline?: { name?: string };
  movement?: AdbMovement;
  arrival?: AdbMovement;
  departure?: AdbMovement;
};

/** Orari reali delle partenze, in due finestre da 12 ore (limite dell'API). */
async function fetchLive(from: string, date: string, apiKey: string): Promise<Flight[]> {
  const windows = [
    [`${date}T00:00`, `${date}T11:59`],
    [`${date}T12:00`, `${date}T23:59`],
  ];
  const responses = await Promise.all(
    windows.map(async ([start, end]) => {
      const url =
        `https://${RAPIDAPI_HOST}/flights/airports/iata/${from}/${start}/${end}` +
        "?direction=Departure&withLeg=false&withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false";
      const res = await fetch(url, { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": RAPIDAPI_HOST } });
      if (res.status === 204) return [];
      if (!res.ok) throw new Error(`AeroDataBox ${res.status}`);
      const data = (await res.json()) as { departures?: AdbFlight[] };
      return data.departures ?? [];
    }),
  );

  return responses
    .flat()
    .map((f): Flight | null => {
      const dest = f.movement ?? f.arrival;
      const iata = dest?.airport?.iata ?? "";
      const country = dest?.airport?.countryCode ?? "";
      if (!EUROPE_IATA.has(iata) && !EUROPE_COUNTRY_CODES.has(country)) return null;
      const time = f.departure?.scheduledTime?.local ?? dest?.scheduledTime?.local ?? dest?.scheduledTimeLocal ?? "";
      return {
        flightNumber: (f.number ?? "").replace(/\s+/g, " "),
        airline: f.airline?.name ?? "",
        from,
        to: iata,
        toName: europeAirportCity(iata) ?? dest?.airport?.municipalityName ?? dest?.airport?.name ?? iata,
        departureLocal: time.slice(0, 16).replace(" ", "T"),
        status: f.status,
      };
    })
    .filter((f): f is Flight => !!f && !!f.departureLocal)
    .sort((a, b) => a.departureLocal.localeCompare(b.departureLocal));
}

/** Orario dimostrativo, usato finché non è configurata la chiave dell'API voli. */
const DEMO_ROUTES: Record<string, [string, string, string, string, number[]][]> = {
  // [volo, compagnia, destinazione, orario, giorni della settimana (0 = domenica)]
  CAI: [
    ["MS 791", "EgyptAir", "FCO", "09:15", [0, 1, 2, 3, 4, 5, 6]],
    ["MS 703", "EgyptAir", "MXP", "10:05", [0, 2, 4, 6]],
    ["MS 799", "EgyptAir", "CDG", "08:40", [0, 1, 2, 3, 4, 5, 6]],
    ["MS 785", "EgyptAir", "FRA", "07:55", [0, 1, 2, 3, 4, 5, 6]],
    ["MS 777", "EgyptAir", "LHR", "10:30", [0, 1, 2, 3, 4, 5, 6]],
    ["MS 757", "EgyptAir", "AMS", "09:50", [1, 3, 5]],
    ["MS 767", "EgyptAir", "BCN", "11:20", [2, 4, 6]],
    ["MS 753", "EgyptAir", "MAD", "10:45", [1, 4, 6]],
    ["MS 747", "EgyptAir", "ATH", "13:10", [0, 1, 2, 3, 4, 5, 6]],
    ["MS 789", "EgyptAir", "MUC", "08:25", [0, 3, 5]],
    ["MS 793", "EgyptAir", "VIE", "09:35", [1, 3, 5, 0]],
    ["MS 783", "EgyptAir", "BRU", "12:00", [2, 5]],
    ["AZ 895", "ITA Airways", "FCO", "15:40", [0, 1, 2, 3, 4, 5, 6]],
    ["LH 585", "Lufthansa", "FRA", "04:05", [0, 1, 2, 3, 4, 5, 6]],
    ["AF 503", "Air France", "CDG", "14:15", [0, 1, 2, 3, 4, 5, 6]],
    ["KL 554", "KLM", "AMS", "15:00", [1, 3, 5, 6]],
    ["BA 154", "British Airways", "LHR", "15:25", [0, 1, 2, 3, 4, 5, 6]],
    ["LX 237", "SWISS", "ZRH", "14:35", [0, 2, 4, 6]],
    ["OS 864", "Austrian", "VIE", "16:30", [1, 3, 5]],
    ["A3 935", "Aegean", "ATH", "17:50", [0, 1, 2, 3, 4, 5, 6]],
  ],
  HBE: [
    ["E5 471", "Air Arabia Egypt", "FCO", "06:30", [1, 4]],
    ["E5 481", "Air Arabia Egypt", "MXP", "07:10", [2, 5]],
    ["E5 491", "Air Arabia Egypt", "BGY", "06:50", [0, 3, 6]],
    ["MS 869", "EgyptAir", "ATH", "11:40", [1, 3, 5]],
    ["NP 381", "Nile Air", "CDG", "09:00", [2, 6]],
    ["E5 461", "Air Arabia Egypt", "NAP", "07:30", [4]],
    ["NP 391", "Nile Air", "FRA", "08:15", [0, 3]],
  ],
};

function demoFlights(from: string, date: string): Flight[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return (DEMO_ROUTES[from] ?? [])
    .filter(([, , , , days]) => days.includes(weekday))
    .map(([flightNumber, airline, to, time]) => ({
      flightNumber,
      airline,
      from,
      to,
      toName: europeAirportCity(to) ?? to,
      departureLocal: `${date}T${time}`,
      status: "Programmato",
    }))
    .sort((a, b) => a.departureLocal.localeCompare(b.departureLocal));
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "CAI";
  const date = url.searchParams.get("date") ?? "";
  if (!DEPARTURE_AIRPORTS.some((a) => a.iata === from)) return fail("Aeroporto non supportato.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Data non valida.");

  const apiKey = process.env.AERODATABOX_API_KEY;
  const cache = { "Netlify-CDN-Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" };

  if (apiKey) {
    try {
      const body: FlightsResponse = { source: "live", flights: await fetchLive(from, date, apiKey) };
      return json(body, 200, cache);
    } catch (err) {
      console.error(err);
      const body: FlightsResponse = {
        source: "demo",
        notice: "Orari in tempo reale non disponibili al momento: mostriamo un orario indicativo.",
        flights: demoFlights(from, date),
      };
      return json(body);
    }
  }

  const body: FlightsResponse = {
    source: "demo",
    notice: "Orario indicativo a scopo dimostrativo. Verifica sempre il volo con la compagnia aerea.",
    flights: demoFlights(from, date),
  };
  return json(body, 200, cache);
};

export const config: Config = { path: "/api/flights" };
