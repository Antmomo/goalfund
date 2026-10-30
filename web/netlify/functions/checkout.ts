import type { Config } from "@netlify/functions";
import type Stripe from "stripe";
import { getDict } from "../../src/i18n/dicts";
import { getAirport } from "../../src/lib/catalog";
import { VAT_RATE, feeVat, getTier } from "../../src/lib/pricing";
import { messengerStatus } from "../../src/lib/types";
import { fail, json, todayIso } from "../lib/http";
import { getMessenger, getShipment } from "../lib/store";
import { getStripe } from "../lib/stripe";

const STRIPE_LOCALES: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
  it: "it",
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
};

export default async (req: Request) => {
  if (req.method !== "POST") return fail("methodNotAllowed", 405);

  const stripe = getStripe();
  if (!stripe) return fail("paymentsNotConfigured", 503);

  const body = (await req.json().catch(() => ({}))) as { shipmentId?: string; messengerId?: string; lang?: string };
  if (!body.shipmentId || !body.messengerId) return fail("missingIds");

  const [shipment, messenger] = await Promise.all([getShipment(body.shipmentId), getMessenger(body.messengerId)]);
  if (!shipment) return fail("shipmentNotFound", 404);
  if (!messenger) return fail("messengerNotFound", 404);
  if (messengerStatus(messenger) === "rifiutato") return fail("messengerUnavailable", 409);
  if (shipment.status === "pagata") return fail("alreadyPaid", 409);

  const tier = getTier(shipment.tierId);
  if (!tier) return fail("invalidTier", 500);
  if (messenger.flight.date < todayIso()) return fail("flightDeparted", 409);
  if (messenger.flight.from !== shipment.departureAirport) return fail("airportMismatch", 409);
  if (
    shipment.arrivalAirport &&
    getAirport(shipment.arrivalAirport)?.country !== getAirport(messenger.flight.to)?.country
  ) {
    return fail("destinationMismatch", 409);
  }
  if (messenger.availableKg < tier.maxKg) return fail("notEnoughSpace", 409);

  const origin = process.env.URL ?? new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: STRIPE_LOCALES[body.lang ?? ""] ?? "auto",
    customer_email: shipment.client.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(tier.total * 100),
          product_data: {
            name: `Amanah · ${tier.label} · ${messenger.flight.from} → ${messenger.flight.to}`,
            description: `${shipment.goodsType} · ${messenger.flight.date}`,
          },
        },
      },
    ],
    custom_text: {
      submit: { message: getDict(body.lang).disclaimer },
    },
    metadata: {
      shipmentId: shipment.id,
      messengerId: messenger.id,
      tierId: tier.id,
      messengerShare: String(tier.messengerShare),
      platformFee: String(tier.platformFee),
      platformFeeNet: String(feeVat(tier.platformFee).net),
      platformFeeVat: String(feeVat(tier.platformFee).vat),
      vatRate: String(VAT_RATE),
    },
    success_url: `${origin}/pagamento/successo?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/voli?pagamento=annullato`,
  });

  return json({ url: session.url });
};

export const config: Config = { path: "/api/checkout" };
