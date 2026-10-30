import type { Config } from "@netlify/functions";
import { getTier } from "../../src/lib/pricing";
import { messengerStatus, type AdminShipment, type AdminStats, type Messenger, type Shipment } from "../../src/lib/types";
import { requireAdmin } from "../lib/auth";
import { fail, json } from "../lib/http";
import { listAll, messengers, shipments } from "../lib/store";

export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
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
  const sum = (pick: (t: NonNullable<ReturnType<typeof getTier>>) => number) =>
    paid.reduce((acc, s) => acc + (getTier(s.tierId) ? pick(getTier(s.tierId)!) : 0), 0);

  const stats: AdminStats = {
    messengersPending: allMessengers.filter((m) => messengerStatus(m) === "in_verifica").length,
    messengersVerified: allMessengers.filter((m) => messengerStatus(m) === "verificato").length,
    shipmentsWaiting: allShipments.length - paid.length,
    shipmentsPaid: paid.length,
    revenueTotal: sum((t) => t.total),
    platformFees: sum((t) => t.platformFee),
    messengerPayouts: sum((t) => t.messengerShare),
  };

  return json({ shipments: result, stats });
};

export const config: Config = { path: "/api/admin/shipments" };
