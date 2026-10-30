import type { Config } from "@netlify/functions";
import { orderStage, type OrderView, type Review, type Shipment } from "../../src/lib/types";
import { fail, json } from "../lib/http";
import { orderCode, roleFor } from "../lib/order";
import { getMessenger, getShipment, messengers, shipments } from "../lib/store";

type Body = {
  id?: string;
  k?: string;
  action?: "accept" | "pickup" | "deliver" | "review";
  requirementsRead?: boolean;
  dutyToShow?: boolean;
  checkedPacked?: boolean;
  received?: boolean;
  rating?: number;
  comment?: string;
};

async function view(shipment: Shipment, role: "client" | "messenger"): Promise<OrderView | null> {
  const messenger = await getMessenger(shipment.messengerId ?? "");
  if (!messenger || !shipment.order) return null;
  const order = shipment.order;
  const counterpart =
    role === "client"
      ? { name: `${messenger.firstName} ${messenger.lastName}`, phone: messenger.phone, email: messenger.email }
      : {
          name: `${shipment.client.firstName} ${shipment.client.lastName}`,
          phone: shipment.client.phone,
          email: shipment.client.email,
          address: `${shipment.client.address}, ${shipment.client.postalCode} ${shipment.client.city} (${shipment.client.country})`,
        };
  return {
    role,
    code: orderCode(shipment),
    stage: orderStage(order),
    goodsType: shipment.goodsType,
    description: shipment.description,
    categories: shipment.categories,
    tierId: shipment.tierId,
    route: messenger.flight,
    counterpart,
    order: {
      clientAcceptedAt: order.clientAcceptedAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      payout: order.payout,
    },
    myReview: role === "client" ? order.reviews.byClient : order.reviews.byMessenger,
    theirReview: role === "client" ? order.reviews.byMessenger : order.reviews.byClient,
  };
}

async function load(id: string, token: string) {
  const shipment = await getShipment(id);
  if (!shipment?.order || shipment.status !== "pagata") return null;
  const role = roleFor(shipment.order, token);
  return role ? { shipment, role } : null;
}

export default async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const found = await load(url.searchParams.get("id") ?? "", url.searchParams.get("k") ?? "");
    if (!found) return fail("invalidOrderLink", 404);
    return json(await view(found.shipment, found.role));
  }
  if (req.method !== "POST") return fail("methodNotAllowed", 405);

  const body = (await req.json().catch(() => ({}))) as Body;
  const found = await load(body.id ?? "", body.k ?? "");
  if (!found) return fail("invalidOrderLink", 404);
  const { shipment, role } = found;
  const order = shipment.order!;
  const now = new Date().toISOString();

  switch (body.action) {
    case "accept":
      if (role !== "client" || order.clientAcceptedAt) return fail("stepNotAllowed", 409);
      if (!body.requirementsRead || !body.dutyToShow) return fail("confirmationsRequired");
      order.clientAcceptedAt = now;
      break;
    case "pickup":
      if (role !== "messenger" || !order.clientAcceptedAt || order.pickedUpAt) return fail("stepNotAllowed", 409);
      if (!body.checkedPacked) return fail("confirmationsRequired");
      order.pickedUpAt = now;
      break;
    case "deliver":
      if (role !== "client" || !order.pickedUpAt || order.deliveredAt) return fail("stepNotAllowed", 409);
      if (!body.received) return fail("confirmationsRequired");
      order.deliveredAt = now;
      order.payout = "da_pagare";
      break;
    case "review": {
      if (!order.deliveredAt) return fail("stepNotAllowed", 409);
      const key = role === "client" ? "byClient" : "byMessenger";
      if (order.reviews[key]) return fail("alreadyReviewed", 409);
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("invalidRating");
      const review: Review = { rating, comment: (body.comment ?? "").trim().slice(0, 1000) || undefined, createdAt: now };
      order.reviews[key] = review;
      if (role === "client") {
        const messenger = await getMessenger(shipment.messengerId ?? "");
        if (messenger) {
          messenger.ratingTotal = (messenger.ratingTotal ?? 0) + rating;
          messenger.ratingCount = (messenger.ratingCount ?? 0) + 1;
          await messengers().setJSON(messenger.id, messenger);
        }
      }
      break;
    }
    default:
      return fail("invalidRequest");
  }

  await shipments().setJSON(shipment.id, shipment);
  return json(await view(shipment, role));
};

export const config: Config = { path: "/api/order" };
