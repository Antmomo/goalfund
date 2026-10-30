import type { Config } from "@netlify/functions";
import { CATEGORIES, isValidRoute } from "../../src/lib/catalog";
import { isLang } from "../../src/i18n/types";
import { getTier } from "../../src/lib/pricing";
import type { Shipment } from "../../src/lib/types";
import { ValidationError, email, fail, failFrom, files, json, phone, termsAcceptance, text } from "../lib/http";
import { saveFiles, shipmentPhotos, shipments } from "../lib/store";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("methodNotAllowed", 405);

  try {
    const form = await req.formData();

    const age = Number(form.get("age"));
    if (!Number.isInteger(age) || age < 18 || age > 120) throw new ValidationError("minAge");

    const categories = form.getAll("categories").map(String);
    if (categories.length === 0 || categories.some((c) => !CATEGORIES.some((k) => k.id === c))) {
      throw new ValidationError("selectCategories");
    }

    const tier = getTier(String(form.get("tierId")));
    if (!tier) throw new ValidationError("selectTier");

    const departureAirport = String(form.get("departureAirport"));
    const arrivalAirport = String(form.get("arrivalAirport"));
    if (!isValidRoute(departureAirport, arrivalAirport)) throw new ValidationError("invalidRoute");

    const photos = files(form, "photos", { min: 1, max: 10, maxBytes: 1.5 * 1024 * 1024, types: ["image/"] });

    const shipment: Shipment = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "in_attesa",
      client: {
        firstName: text(form, "firstName", 80),
        lastName: text(form, "lastName", 80),
        age,
        address: text(form, "address", 200),
        postalCode: text(form, "postalCode", 12),
        city: text(form, "city", 80),
        country: text(form, "country", 80),
        email: email(form, "email"),
        phone: phone(form, "phone"),
      },
      categories,
      goodsType: text(form, "goodsType", 120),
      description: text(form, "description", 2000),
      tierId: tier.id,
      departureAirport,
      arrivalAirport,
      photoKeys: [],
      terms: termsAcceptance(form),
      lang: isLang(form.get("lang")) ? String(form.get("lang")) : undefined,
    };

    shipment.photoKeys = await saveFiles(shipmentPhotos(), shipment.id, photos);
    await shipments().setJSON(shipment.id, shipment);

    const { id, goodsType } = shipment;
    return json({ id, tierId: tier.id, departureAirport, arrivalAirport, goodsType }, 201);
  } catch (err) {
    if (err instanceof ValidationError) return failFrom(err);
    console.error(err);
    return fail("saveFailed", 500);
  }
};

export const config: Config = { path: "/api/shipments" };
