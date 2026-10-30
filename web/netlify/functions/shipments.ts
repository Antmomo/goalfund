import type { Config } from "@netlify/functions";
import { DEPARTURE_AIRPORTS, CATEGORIES } from "../../src/lib/catalog";
import { getTier } from "../../src/lib/pricing";
import type { Shipment } from "../../src/lib/types";
import { ValidationError, email, fail, files, json, phone, termsAcceptance, text } from "../lib/http";
import { saveFiles, shipmentPhotos, shipments } from "../lib/store";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Metodo non consentito.", 405);

  try {
    const form = await req.formData();

    const age = Number(form.get("age"));
    if (!Number.isInteger(age) || age < 18 || age > 120) throw new ValidationError("Devi avere almeno 18 anni.");

    const categories = form.getAll("categories").map(String);
    if (categories.length === 0 || categories.some((c) => !CATEGORIES.some((k) => k.id === c))) {
      throw new ValidationError("Seleziona cosa vuoi spedire.");
    }

    const tier = getTier(String(form.get("tierId")));
    if (!tier) throw new ValidationError("Seleziona la fascia di peso.");

    const departureAirport = String(form.get("departureAirport"));
    if (!DEPARTURE_AIRPORTS.some((a) => a.iata === departureAirport)) {
      throw new ValidationError("Seleziona l'aeroporto di partenza.");
    }


    const photos = files(form, "photos", {
      min: 1,
      max: 10,
      maxBytes: 1.5 * 1024 * 1024,
      types: ["image/"],
      label: "Foto dell'oggetto",
    });

    const terms = termsAcceptance(form);
    const id = crypto.randomUUID();
    const shipment: Shipment = {
      id,
      createdAt: new Date().toISOString(),
      status: "in_attesa",
      client: {
        firstName: text(form, "firstName", "Nome", 80),
        lastName: text(form, "lastName", "Cognome", 80),
        age,
        address: text(form, "address", "Indirizzo", 200),
        postalCode: text(form, "postalCode", "CAP", 12),
        city: text(form, "city", "Città", 80),
        country: text(form, "country", "Paese", 80),
        email: email(form, "email"),
        phone: phone(form, "phone"),
      },
      categories,
      goodsType: text(form, "goodsType", "Tipo di merce precisa", 120),
      description: text(form, "description", "Descrizione", 2000),
      tierId: tier.id,
      departureAirport,
      photoKeys: [],
      terms,
    };

    shipment.photoKeys = await saveFiles(shipmentPhotos(), id, photos);
    await shipments().setJSON(id, shipment);

    return json({ id, tierId: tier.id, departureAirport, goodsType: shipment.goodsType }, 201);
  } catch (err) {
    if (err instanceof ValidationError) return fail(err.message);
    console.error(err);
    return fail("Errore durante il salvataggio. Riprova.", 500);
  }
};

export const config: Config = { path: "/api/shipments" };
