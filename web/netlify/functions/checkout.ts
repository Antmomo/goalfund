import type { Config } from "@netlify/functions";
import { getTier } from "../../src/lib/pricing";
import { messengerStatus } from "../../src/lib/types";
import { fail, json, todayIso } from "../lib/http";
import { getMessenger, getShipment } from "../lib/store";
import { getStripe } from "../lib/stripe";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Metodo non consentito.", 405);

  const stripe = getStripe();
  if (!stripe) return fail("I pagamenti non sono ancora configurati (manca STRIPE_SECRET_KEY).", 503);

  const body = (await req.json().catch(() => ({}))) as { shipmentId?: string; messengerId?: string };
  if (!body.shipmentId || !body.messengerId) return fail("Spedizione o Messenger mancante.");

  const [shipment, messenger] = await Promise.all([getShipment(body.shipmentId), getMessenger(body.messengerId)]);
  if (!shipment) return fail("Spedizione non trovata.", 404);
  if (!messenger) return fail("Messenger non trovato.", 404);
  if (messengerStatus(messenger) === "rifiutato") return fail("Questo Messenger non è disponibile.", 409);
  if (shipment.status === "pagata") return fail("Questa spedizione è già stata pagata.", 409);

  const tier = getTier(shipment.tierId);
  if (!tier) return fail("Fascia di peso non valida.", 500);
  if (messenger.flight.date < todayIso()) return fail("Il volo di questo Messenger è già partito.", 409);
  if (messenger.flight.from !== shipment.departureAirport) {
    return fail("Questo Messenger parte da un aeroporto diverso da quello della tua spedizione.", 409);
  }
  if (messenger.availableKg < tier.maxKg) return fail("Il Messenger non ha abbastanza spazio per questa fascia di peso.", 409);

  const origin = process.env.URL ?? new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: shipment.client.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(tier.total * 100),
          product_data: {
            name: `Spedizione ${tier.label} · ${messenger.flight.from} → ${messenger.flight.to}`,
            description: `${shipment.goodsType} · volo del ${messenger.flight.date}`,
          },
        },
      },
    ],
    metadata: {
      shipmentId: shipment.id,
      messengerId: messenger.id,
      tierId: tier.id,
      messengerShare: String(tier.messengerShare),
      platformFee: String(tier.platformFee),
    },
    success_url: `${origin}/pagamento/successo?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/voli?pagamento=annullato`,
  });

  return json({ url: session.url });
};

export const config: Config = { path: "/api/checkout" };
