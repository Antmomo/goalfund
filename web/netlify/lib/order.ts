import { randomBytes, timingSafeEqual } from "node:crypto";
import { getDict } from "../../src/i18n/dicts";
import { airportName } from "../../src/lib/catalog";
import { getTier } from "../../src/lib/pricing";
import type { Messenger, Order, Shipment } from "../../src/lib/types";
import { escapeHtml, sendEmail } from "./email";

export function orderCode(shipment: Shipment): string {
  return shipment.id.slice(0, 8).toUpperCase();
}

export function newOrder(): Order {
  return {
    clientToken: randomBytes(24).toString("base64url"),
    messengerToken: randomBytes(24).toString("base64url"),
    payout: "in_attesa",
    reviews: {},
  };
}

export function orderPath(shipment: Shipment, token: string): string {
  return `/ordine/${shipment.id}?k=${token}`;
}

/** Chi sta aprendo l'ordine, in base al link segreto. */
export function roleFor(order: Order, token: string): "client" | "messenger" | null {
  const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  if (token && same(token, order.clientToken)) return "client";
  if (token && same(token, order.messengerToken)) return "messenger";
  return null;
}

function emailHtml(opts: { intro: string; details: string; boxes?: string; button: string; url: string; footer: string; rtl: boolean }) {
  return `<!doctype html><html dir="${opts.rtl ? "rtl" : "ltr"}"><body style="margin:0;background:#fbf7f3;font-family:Arial,Helvetica,sans-serif;color:#2a1a1f">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#3e0617;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;font-size:22px;font-weight:bold"><span style="color:#c9a24d">✦</span> Amanah</div>
  <div style="background:#fff;border:1px solid #ead9dd;border-top:0;border-radius:0 0 12px 12px;padding:22px">
    <p style="margin-top:0">${opts.intro}</p>
    <div style="background:#f6ebee;border-radius:10px;padding:14px 16px;margin:16px 0">${opts.details}</div>
    ${opts.boxes ?? ""}
    <p style="text-align:center;margin:24px 0"><a href="${opts.url}" style="background:#6d0f2b;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;display:inline-block">${opts.button}</a></p>
    <p style="font-size:12px;color:#7a6167">${opts.footer}</p>
  </div>
</div></body></html>`;
}

/** Email di conferma al cliente e di nuova missione al Messenger, ognuna con il proprio link personale. */
export async function sendOrderEmails(shipment: Shipment, messenger: Messenger, baseUrl: string): Promise<boolean> {
  const order = shipment.order!;
  const code = orderCode(shipment);
  const tier = getTier(shipment.tierId);
  const flight = messenger.flight;
  const route = (lang: string) =>
    `${escapeHtml(airportName(flight.from, lang))} → ${escapeHtml(airportName(flight.to, lang))} · ${flight.date}${flight.flightNumber ? ` · ${escapeHtml(flight.flightNumber)}` : ""}`;
  const details = (lang: string, t = getDict(lang)) =>
    `<b>${t.order.code}:</b> ${code}<br><b>${t.order.goods}:</b> ${escapeHtml(shipment.goodsType)} (${tier?.label ?? ""})<br><b>${t.order.route}:</b> ${route(lang)}`;

  const c = getDict(shipment.lang);
  const box = (text: string, purple = false) =>
    purple
      ? `<div style="background:#5b2a86;color:#fff;border-radius:12px;padding:18px;margin:10px 0;font-size:17px;font-weight:bold">☐ ${text}</div>`
      : `<div style="border:1px solid #ead9dd;border-radius:10px;padding:12px 14px;margin:10px 0">☐ ${text}</div>`;
  const clientSent = await sendEmail({
    to: shipment.client.email,
    subject: c.email.clientSubject(code),
    html: emailHtml({
      intro: c.email.clientIntro,
      details: details(shipment.lang ?? "it", c),
      boxes: box(c.order.requirementsRead) + box(c.order.dutyToShow, true),
      button: c.email.buttonClient,
      url: baseUrl + orderPath(shipment, order.clientToken),
      footer: c.email.footer,
      rtl: shipment.lang === "ar",
    }),
  });

  const m = getDict(messenger.lang);
  const messengerSent = await sendEmail({
    to: messenger.email,
    subject: m.email.messengerSubject(code),
    html: emailHtml({
      intro: m.email.messengerIntro,
      details: details(messenger.lang ?? "it", m),
      boxes: box(m.order.checkedPacked),
      button: m.email.buttonMessenger,
      url: baseUrl + orderPath(shipment, order.messengerToken),
      footer: m.email.footer,
      rtl: messenger.lang === "ar",
    }),
  });

  return clientSent && messengerSent;
}
