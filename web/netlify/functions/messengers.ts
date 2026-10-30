import type { Config } from "@netlify/functions";
import { DEPARTURE_AIRPORTS, EUROPE_AIRPORTS } from "../../src/lib/catalog";
import { messengerStatus, type Messenger } from "../../src/lib/types";
import { ValidationError, email, fail, files, isoDate, json, phone, text, todayIso } from "../lib/http";
import { listAll, messengerDocuments, messengers, saveFiles, toPublic } from "../lib/store";

async function list(url: URL): Promise<Response> {
  const from = url.searchParams.get("from");
  const date = url.searchParams.get("date");
  const all = await listAll<Messenger>(messengers());

  const today = todayIso();
  const result = all
    .filter((m) => m.flight.date >= today && m.availableKg > 0)
    .filter((m) => messengerStatus(m) !== "rifiutato")
    .filter((m) => !from || m.flight.from === from)
    .filter((m) => !date || m.flight.date === date)
    .sort((a, b) => a.flight.date.localeCompare(b.flight.date))
    .map(toPublic);

  return json({ messengers: result });
}

async function create(req: Request): Promise<Response> {
  const form = await req.formData();

  const from = String(form.get("from"));
  if (!DEPARTURE_AIRPORTS.some((a) => a.iata === from)) throw new ValidationError("Seleziona l'aeroporto di partenza.");
  const to = String(form.get("to"));
  if (!EUROPE_AIRPORTS.some((a) => a.iata === to)) throw new ValidationError("Seleziona l'aeroporto di arrivo.");

  const date = isoDate(String(form.get("date")), "Data del volo");
  if (date < todayIso()) throw new ValidationError("La data del volo non può essere nel passato.");

  const availableKg = Number(form.get("availableKg"));
  if (!Number.isFinite(availableKg) || availableKg < 1 || availableKg > 50) {
    throw new ValidationError("Indica i kg disponibili (da 1 a 50).");
  }

  if (form.get("consent") !== "on") throw new ValidationError("Devi accettare le condizioni del servizio.");

  const documents = files(form, "documents", {
    min: 1,
    max: 3,
    maxBytes: 2 * 1024 * 1024,
    types: ["image/", "application/pdf"],
    label: "Documenti",
  });

  const id = crypto.randomUUID();
  const flightNumber = String(form.get("flightNumber") ?? "").trim().toUpperCase().slice(0, 10);
  const messenger: Messenger = {
    id,
    createdAt: new Date().toISOString(),
    firstName: text(form, "firstName", "Nome", 80),
    lastName: text(form, "lastName", "Cognome", 80),
    phone: phone(form, "phone"),
    email: email(form, "email"),
    documentKeys: [],
    flight: { from, to, date, flightNumber: flightNumber || undefined },
    availableKg,
    verified: false,
    status: "in_verifica",
  };

  messenger.documentKeys = await saveFiles(messengerDocuments(), id, documents);
  await messengers().setJSON(id, messenger);

  return json({ messenger: toPublic(messenger) }, 201);
}

export default async (req: Request) => {
  try {
    if (req.method === "GET") return await list(new URL(req.url));
    if (req.method === "POST") return await create(req);
    return fail("Metodo non consentito.", 405);
  } catch (err) {
    if (err instanceof ValidationError) return fail(err.message);
    console.error(err);
    return fail("Errore del server. Riprova.", 500);
  }
};

export const config: Config = { path: "/api/messengers" };
