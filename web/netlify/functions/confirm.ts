import type { Config } from "@netlify/functions";
import { getTier } from "../../src/lib/pricing";
import { fail, json } from "../lib/http";
import { getMessenger, getShipment, messengers, shipments } from "../lib/store";
import { getStripe } from "../lib/stripe";

/**
 * Verifica il pagamento su Stripe e, solo se riuscito, rivela al cliente
 * i contatti del Messenger scelto.
 */
export default async (req: Request) => {
  const stripe = getStripe();
  if (!stripe) return fail("I pagamenti non sono configurati.", 503);

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return fail("Sessione di pagamento mancante.");

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session) return fail("Sessione di pagamento non trovata.", 404);
  if (session.payment_status !== "paid") return fail("Il pagamento non risulta completato.", 402);

  const { shipmentId, messengerId } = session.metadata ?? {};
  const [shipment, messenger] = await Promise.all([getShipment(shipmentId ?? ""), getMessenger(messengerId ?? "")]);
  if (!shipment || !messenger) return fail("Spedizione o Messenger non trovati.", 404);

  if (shipment.status !== "pagata") {
    const tier = getTier(shipment.tierId);
    shipment.status = "pagata";
    shipment.messengerId = messenger.id;
    shipment.stripeSessionId = session.id;
    shipment.paidAt = new Date().toISOString();
    messenger.availableKg = Math.max(0, messenger.availableKg - (tier?.maxKg ?? 0));
    await Promise.all([shipments().setJSON(shipment.id, shipment), messengers().setJSON(messenger.id, messenger)]);
  } else if (shipment.stripeSessionId !== session.id) {
    return fail("Questa sessione non corrisponde alla spedizione.", 403);
  }

  return json({
    shipmentId: shipment.id,
    amountPaid: (session.amount_total ?? 0) / 100,
    messenger: {
      firstName: messenger.firstName,
      lastName: messenger.lastName,
      phone: messenger.phone,
      email: messenger.email,
      flight: messenger.flight,
    },
  });
};

export const config: Config = { path: "/api/confirm" };
