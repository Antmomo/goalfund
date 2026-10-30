import type { Config } from "@netlify/functions";
import { isLang } from "../../src/i18n/types";
import { isValidRoute } from "../../src/lib/catalog";
import { messengerStatus, type Messenger } from "../../src/lib/types";
import {
  ValidationError,
  email,
  fail,
  failFrom,
  files,
  isoDate,
  json,
  phone,
  termsAcceptance,
  text,
  todayIso,
} from "../lib/http";
import { listAll, messengerDocuments, messengers, saveFiles, toPublic } from "../lib/store";

async function list(url: URL): Promise<Response> {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const date = url.searchParams.get("date");
  const all = await listAll<Messenger>(messengers());

  const today = todayIso();
  const result = all
    .filter((m) => m.flight.date >= today && m.availableKg > 0)
    .filter((m) => messengerStatus(m) !== "rifiutato")
    .filter((m) => !from || m.flight.from === from)
    .filter((m) => !to || m.flight.to === to)
    .filter((m) => !date || m.flight.date === date)
    .sort((a, b) => a.flight.date.localeCompare(b.flight.date))
    .map(toPublic);

  return json({ messengers: result });
}

async function create(req: Request): Promise<Response> {
  const form = await req.formData();

  const from = String(form.get("from"));
  const to = String(form.get("to"));
  if (!isValidRoute(from, to)) throw new ValidationError("invalidRoute");

  const date = isoDate(String(form.get("date")), "flightDate");
  if (date < todayIso()) throw new ValidationError("pastDate");

  const availableKg = Number(form.get("availableKg"));
  if (!Number.isFinite(availableKg) || availableKg < 1 || availableKg > 50) throw new ValidationError("availableKg");

  const documents = files(form, "documents", {
    min: 1,
    max: 3,
    maxBytes: 2 * 1024 * 1024,
    types: ["image/", "application/pdf"],
  });

  const flightNumber = String(form.get("flightNumber") ?? "").trim().toUpperCase().slice(0, 10);
  const messenger: Messenger = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    firstName: text(form, "firstName", 80),
    lastName: text(form, "lastName", 80),
    phone: phone(form, "phone"),
    email: email(form, "email"),
    documentKeys: [],
    flight: { from, to, date, flightNumber: flightNumber || undefined },
    availableKg,
    verified: false,
    status: "in_verifica",
    terms: termsAcceptance(form),
    lang: isLang(form.get("lang")) ? String(form.get("lang")) : undefined,
  };

  messenger.documentKeys = await saveFiles(messengerDocuments(), messenger.id, documents);
  await messengers().setJSON(messenger.id, messenger);

  return json({ messenger: toPublic(messenger) }, 201);
}

export default async (req: Request) => {
  try {
    if (req.method === "GET") return await list(new URL(req.url));
    if (req.method === "POST") return await create(req);
    return fail("methodNotAllowed", 405);
  } catch (err) {
    if (err instanceof ValidationError) return failFrom(err);
    console.error(err);
    return fail("serverError", 500);
  }
};

export const config: Config = { path: "/api/messengers" };
