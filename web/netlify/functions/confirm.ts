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
  if (!stripe) return fail("paymentsNotConfigured", 503);

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return fail("missingSession");

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session) return fail("sessionNotFound", 404);
  if (session.payment_status !== "paid") return fail("notPaid", 402);

  const { shipmentId, messengerId } = session.metadata ?? {};
  const [shipment, messenger] = await Promise.all([getShipment(shipmentId ?? ""), getMessenger(messengerId ?? "")]);
  if (!shipment || !messenger) return fail("shipmentNotFound", 404);

  if (shipment.status !== "pagata") {
    const tier = getTier(shipment.tierId);
    shipment.status = "pagata";
    shipment.messengerId = messenger.id;
    shipment.stripeSessionId = session.id;
    shipment.paidAt = new Date().toISOString();
    messenger.availableKg = Math.max(0, messenger.availableKg - (tier?.maxKg ?? 0));
    await Promise.all([shipments().setJSON(shipment.id, shipment), messengers().setJSON(messenger.id, messenger)]);
  } else if (shipment.stripeSessionId !== session.id) {
    return fail("sessionMismatch", 403);
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
