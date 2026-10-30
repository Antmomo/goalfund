import type { Config } from "@netlify/functions";
import { feeVat, getTier } from "../../src/lib/pricing";
import { messengerStatus, type AdminShipment, type AdminStats, type Messenger, type Shipment } from "../../src/lib/types";
import { requireAdmin } from "../lib/auth";
import { fail, json } from "../lib/http";
import { deleteFiles, getShipment, listAll, messengers, shipmentPhotos, shipments } from "../lib/store";

/** Elimina definitivamente una spedizione e le sue foto (per i dati di prova). */
async function remove(url: URL): Promise<Response> {
  const shipment = await getShipment(url.searchParams.get("id") ?? "");
  if (!shipment) return fail("shipmentNotFound", 404);
  await deleteFiles(shipmentPhotos(), shipment.photoKeys);
  await shipments().delete(shipment.id);
  return json({ deleted: shipment.id });
}

export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (req.method === "DELETE") return remove(new URL(req.url));
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
  // Somma in centesimi per evitare errori di arrotondamento.
  const sum = (pick: (t: NonNullable<ReturnType<typeof getTier>>) => number) =>
    paid.reduce((acc, s) => acc + (getTier(s.tierId) ? Math.round(pick(getTier(s.tierId)!) * 100) : 0), 0) / 100;

  const stats: AdminStats = {
    messengersPending: allMessengers.filter((m) => messengerStatus(m) === "in_verifica").length,
    messengersVerified: allMessengers.filter((m) => messengerStatus(m) === "verificato").length,
    shipmentsWaiting: allShipments.length - paid.length,
    shipmentsPaid: paid.length,
    revenueTotal: sum((t) => t.total),
    platformFees: sum((t) => t.platformFee),
    platformFeesNet: sum((t) => feeVat(t.platformFee).net),
    vatDue: sum((t) => feeVat(t.platformFee).vat),
    messengerPayouts: sum((t) => t.messengerShare),
  };

  return json({ shipments: result, stats });
};

export const config: Config = { path: "/api/admin/shipments" };
