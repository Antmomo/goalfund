import type { Config } from "@netlify/functions";
import { feeVat, getTier } from "../../src/lib/pricing";
import { messengerStatus, type AdminShipment, type AdminStats, type Messenger, type Shipment } from "../../src/lib/types";
import { requireAdmin } from "../lib/auth";
import { fail, json } from "../lib/http";
import { sendOrderEmails } from "../lib/order";
import { deleteFiles, getMessenger, getShipment, listAll, messengers, shipmentPhotos, shipments } from "../lib/store";

/** Elimina definitivamente una spedizione e le sue foto (per i dati di prova). */
async function remove(url: URL): Promise<Response> {
  const shipment = await getShipment(url.searchParams.get("id") ?? "");
  if (!shipment) return fail("shipmentNotFound", 404);
  await deleteFiles(shipmentPhotos(), shipment.photoKeys);
  await shipments().delete(shipment.id);
  return json({ deleted: shipment.id });
}

/** Azioni dell'admin su un ordine pagato: segnare la quota del Messenger come pagata o reinviare le email. */
async function action(req: Request): Promise<Response> {
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  const shipment = await getShipment(id ?? "");
  if (!shipment?.order) return fail("shipmentNotFound", 404);

  if (action === "payoutPaid") {
    if (shipment.order.payout !== "da_pagare") return fail("stepNotAllowed", 409);
    shipment.order.payout = "pagato";
    shipment.order.payoutPaidAt = new Date().toISOString();
  } else if (action === "resendEmails") {
    const messenger = await getMessenger(shipment.messengerId ?? "");
    if (!messenger) return fail("messengerNotFound", 404);
    const baseUrl = process.env.URL ?? new URL(req.url).origin;
    if (!(await sendOrderEmails(shipment, messenger, baseUrl).catch(() => false))) return fail("serverError", 502);
    shipment.order.emailsSentAt = new Date().toISOString();
  } else {
    return fail("invalidRequest");
  }

  await shipments().setJSON(shipment.id, shipment);
  return json({ ok: true });
}

export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (req.method === "DELETE") return remove(new URL(req.url));
  if (req.method === "POST") return action(req);
  if (req.method !== "GET") return fail("methodNotAllowed", 405);

  const [allShipments, allMessengers] = await Promise.all([
    listAll<Shipment>(shipments()),
    listAll<Messenger>(messengers()),
  ]);
  const byId = new Map(allMessengers.map((m) => [m.id, m]));

  const result: AdminShipment[] = allShipments
    .map((s) => {
      const m = s.messengerId ? byId.get(s.messengerId) : undefined;
      return { ...s, messengerName: m ? `${m.firstName} ${m.lastName}` : undefined };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const paid = allShipments.filter((s) => s.status === "pagata");
  // Somme in centesimi per evitare errori di arrotondamento.
  type Pick = (t: NonNullable<ReturnType<typeof getTier>>) => number;
  const sumWhere = (keep: (s: Shipment) => boolean, pick: Pick) =>
    paid.filter(keep).reduce((acc, s) => acc + (getTier(s.tierId) ? Math.round(pick(getTier(s.tierId)!) * 100) : 0), 0) / 100;
  const sum = (pick: Pick) => sumWhere(() => true, pick);

  const stats: AdminStats = {
    messengersPending: allMessengers.filter((m) => messengerStatus(m) === "in_verifica").length,
    messengersVerified: allMessengers.filter((m) => messengerStatus(m) === "verificato").length,
    shipmentsWaiting: allShipments.length - paid.length,
    shipmentsPaid: paid.length,
    revenueTotal: sum((t) => t.total),
    platformFees: sum((t) => t.platformFee),
    platformFeesNet: sum((t) => feeVat(t.platformFee).net),
    vatDue: sum((t) => feeVat(t.platformFee).vat),
    messengerPayouts: sumWhere((s) => s.order?.payout === "da_pagare", (t) => t.messengerShare),
    messengerPaidOut: sumWhere((s) => s.order?.payout === "pagato", (t) => t.messengerShare),
  };

  return json({ shipments: result, stats });
};

export const config: Config = { path: "/api/admin/shipments" };
