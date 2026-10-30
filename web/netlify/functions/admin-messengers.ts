import type { Config } from "@netlify/functions";
import { messengerStatus, type AdminMessenger, type Messenger, type MessengerStatus } from "../../src/lib/types";
import { requireAdmin } from "../lib/auth";
import { fail, json } from "../lib/http";
import { getMessenger, listAll, messengers } from "../lib/store";

async function list(): Promise<Response> {
  const all = await listAll<Messenger>(messengers());
  const result: AdminMessenger[] = all
    .map((m) => ({ ...m, status: messengerStatus(m) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ messengers: result });
}

async function review(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string; reason?: string };
  const next: Record<string, MessengerStatus> = { approve: "verificato", reject: "rifiutato", reset: "in_verifica" };
  const status = next[body.action ?? ""];
  if (!body.id || !status) return fail("Richiesta non valida.");

  const messenger = await getMessenger(body.id);
  if (!messenger) return fail("Messenger non trovato.", 404);

  messenger.status = status;
  messenger.verified = status === "verificato";
  messenger.reviewedAt = new Date().toISOString();
  messenger.rejectionReason = status === "rifiutato" ? (body.reason ?? "").trim().slice(0, 500) || undefined : undefined;
  await messengers().setJSON(messenger.id, messenger);

  return json({ messenger: { ...messenger, status } satisfies AdminMessenger });
}

export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (req.method === "GET") return list();
  if (req.method === "POST") return review(req);
  return fail("Metodo non consentito.", 405);
};

export const config: Config = { path: "/api/admin/messengers" };
