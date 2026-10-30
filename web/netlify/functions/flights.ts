import type { Config } from "@netlify/functions";
import { getAirport, oppositeRegion, regionOfCountry, type Region } from "../../src/lib/catalog";
import type { Flight, FlightsResponse } from "../../src/lib/types";
import { fail, json } from "../lib/http";

const RAPIDAPI_HOST = "aerodatabox.p.rapidapi.com";

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

function destinationRegion(airport: AdbAirport | undefined): Region | undefined {
  return getAirport(airport?.iata)?.region ?? regionOfCountry(airport?.countryCode ?? "");
}

/** Orari reali delle partenze, in due finestre da 12 ore (limite dell'API). */
async function fetchLive(from: string, date: string, target: Region, apiKey: string): Promise<Flight[]> {
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
      if (destinationRegion(dest?.airport) !== target) return null;
      const time = f.departure?.scheduledTime?.local ?? dest?.scheduledTime?.local ?? dest?.scheduledTimeLocal ?? "";
      const iata = dest?.airport?.iata ?? "";
      return {
        flightNumber: (f.number ?? "").replace(/\s+/g, " "),
        airline: f.airline?.name ?? "",
        from,
        to: iata,
        toName: dest?.airport?.municipalityName ?? dest?.airport?.name ?? iata,
        departureLocal: time.slice(0, 16).replace(" ", "T"),
        status: f.status,
      };
    })
    .filter((f): f is Flight => !!f && !!f.departureLocal)
    .sort((a, b) => a.departureLocal.localeCompare(b.departureLocal));
}

/** Orario dimostrativo, usato finché non è configurata la chiave dell'API voli. */
type DemoRoute = [flight: string, airline: string, from: string, to: string, time: string, days: number[]];
const DAILY = [0, 1, 2, 3, 4, 5, 6];

const DEMO_ROUTES: DemoRoute[] = [
  ["MS 791", "EgyptAir", "CAI", "FCO", "09:15", DAILY],
  ["MS 703", "EgyptAir", "CAI", "MXP", "10:05", [0, 2, 4, 6]],
  ["MS 799", "EgyptAir", "CAI", "CDG", "08:40", DAILY],
  ["MS 785", "EgyptAir", "CAI", "FRA", "07:55", DAILY],
  ["MS 777", "EgyptAir", "CAI", "LHR", "10:30", DAILY],
  ["MS 757", "EgyptAir", "CAI", "AMS", "09:50", [1, 3, 5]],
  ["MS 767", "EgyptAir", "CAI", "BCN", "11:20", [2, 4, 6]],
  ["MS 753", "EgyptAir", "CAI", "MAD", "10:45", [1, 4, 6]],
  ["MS 747", "EgyptAir", "CAI", "ATH", "13:10", DAILY],
  ["MS 789", "EgyptAir", "CAI", "MUC", "08:25", [0, 3, 5]],
  ["MS 793", "EgyptAir", "CAI", "VIE", "09:35", [0, 1, 3, 5]],
  ["MS 783", "EgyptAir", "CAI", "BRU", "12:00", [2, 5]],
  ["AZ 895", "ITA Airways", "CAI", "FCO", "15:40", DAILY],
  ["LH 585", "Lufthansa", "CAI", "FRA", "04:05", DAILY],
  ["AF 503", "Air France", "CAI", "CDG", "14:15", DAILY],
  ["KL 554", "KLM", "CAI", "AMS", "15:00", [1, 3, 5, 6]],
  ["BA 154", "British Airways", "CAI", "LHR", "15:25", DAILY],
  ["LX 237", "SWISS", "CAI", "ZRH", "14:35", [0, 2, 4, 6]],
  ["E5 471", "Air Arabia Egypt", "HBE", "FCO", "06:30", [1, 4]],
  ["E5 481", "Air Arabia Egypt", "HBE", "MXP", "07:10", [2, 5]],
  ["E5 491", "Air Arabia Egypt", "HBE", "BGY", "06:50", [0, 3, 6]],
  ["MS 869", "EgyptAir", "HBE", "ATH", "11:40", [1, 3, 5]],
  ["NP 381", "Nile Air", "HBE", "CDG", "09:00", [2, 6]],
  ["AT 950", "Royal Air Maroc", "CMN", "CDG", "07:30", DAILY],
  ["AT 940", "Royal Air Maroc", "CMN", "FCO", "10:15", [1, 3, 5]],
  ["AT 960", "Royal Air Maroc", "CMN", "MXP", "11:00", [0, 2, 4, 6]],
  ["AT 970", "Royal Air Maroc", "CMN", "MAD", "08:45", DAILY],
  ["AT 980", "Royal Air Maroc", "CMN", "BRU", "09:30", [1, 4, 6]],
  ["AT 810", "Royal Air Maroc", "CMN", "AMS", "12:20", [2, 5]],
  ["AH 1000", "Air Algérie", "ALG", "CDG", "08:00", DAILY],
  ["AH 1010", "Air Algérie", "ALG", "MRS", "09:20", DAILY],
  ["AH 1022", "Air Algérie", "ALG", "FCO", "12:40", [1, 4]],
  ["TU 712", "Tunisair", "TUN", "CDG", "07:45", DAILY],
  ["TU 754", "Tunisair", "TUN", "FCO", "10:00", [0, 2, 4]],
  ["TU 846", "Tunisair", "TUN", "MXP", "11:30", [1, 3, 5]],
  ["TU 744", "Tunisair", "TUN", "FRA", "08:30", [2, 5]],
  ["HF 520", "Air Côte d'Ivoire", "ABJ", "CDG", "23:10", [1, 3, 5]],
  ["SN 202", "Brussels Airlines", "DSS", "BRU", "00:40", [2, 4, 6]],
  ["AF 719", "Air France", "DSS", "CDG", "11:05", DAILY],
  ["ET 726", "Ethiopian Airlines", "ADD", "FCO", "23:55", [0, 2, 4, 5]],
  ["ET 706", "Ethiopian Airlines", "ADD", "FRA", "00:20", DAILY],
  ["KQ 116", "Kenya Airways", "NBO", "AMS", "23:45", DAILY],
  ["AT 554", "Royal Air Maroc", "ACC", "CMN", "23:20", [1, 3, 6]],
  ["BA 74", "British Airways", "LOS", "LHR", "22:50", DAILY],
  ["SA 234", "South African Airways", "JNB", "FRA", "19:30", [1, 3, 5]],
];

/** Volo di ritorno dimostrativo: numero successivo, partenza circa 4 ore dopo l'andata. */
function returnLeg([flight, airline, from, to, time, days]: DemoRoute): DemoRoute {
  const num = flight.replace(/\d+$/, (n) => String(Number(n) + 1));
  const [h, m] = time.split(":").map(Number);
  const back = `${String((h + 4) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return [num, airline, to, from, back, days];
}

const ALL_DEMO_ROUTES = [...DEMO_ROUTES, ...DEMO_ROUTES.filter(([, , from]) => from !== "ACC").map(returnLeg)];

function demoFlights(from: string, date: string): Flight[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return ALL_DEMO_ROUTES.filter(([, , origin, to, , days]) => origin === from && days.includes(weekday) && getAirport(to)?.region !== getAirport(from)?.region)
    .map(([flightNumber, airline, , to, time]) => ({
      flightNumber,
      airline,
      from,
      to,
      toName: to,
      departureLocal: `${date}T${time}`,
    }))
    .sort((a, b) => a.departureLocal.localeCompare(b.departureLocal));
}

function demoResponse(from: string, date: string, notice: FlightsResponse["notice"]): FlightsResponse {
  const flights = demoFlights(from, date);
  const hasRoutes = ALL_DEMO_ROUTES.some(([, , origin]) => origin === from);
  return { source: "demo", notice: hasRoutes ? notice : "demoMissing", flights };
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "CAI";
  const date = url.searchParams.get("date") ?? "";
  const origin = getAirport(from);
  if (!origin) return fail("unsupportedAirport");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("invalidDate", 400, { field: "flightDate" });

  const apiKey = process.env.AERODATABOX_API_KEY;
  const cache = { "Netlify-CDN-Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" };

  if (apiKey) {
    try {
      const flights = await fetchLive(from, date, oppositeRegion(origin.region), apiKey);
      return json({ source: "live", flights } satisfies FlightsResponse, 200, cache);
    } catch (err) {
      console.error(err);
      return json(demoResponse(from, date, "liveUnavailable"));
    }
  }

  return json(demoResponse(from, date, "demo"), 200, cache);
};

export const config: Config = { path: "/api/flights" };
