import type { Config } from "@netlify/functions";
import { messengerStatus, type AdminMessenger, type Messenger, type MessengerStatus } from "../../src/lib/types";
import { requireAdmin } from "../lib/auth";
import { fail, json } from "../lib/http";
import { deleteFiles, getMessenger, listAll, messengerDocuments, messengers } from "../lib/store";

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
  if (!body.id || !status) return fail("invalidRequest");

  const messenger = await getMessenger(body.id);
  if (!messenger) return fail("messengerNotFound", 404);

  messenger.status = status;
  messenger.verified = status === "verificato";
  messenger.reviewedAt = new Date().toISOString();
  messenger.rejectionReason = status === "rifiutato" ? (body.reason ?? "").trim().slice(0, 500) || undefined : undefined;
  await messengers().setJSON(messenger.id, messenger);

  return json({ messenger: { ...messenger, status } satisfies AdminMessenger });
}

/** Elimina definitivamente un Messenger e i suoi documenti (per i dati di prova). */
async function remove(url: URL): Promise<Response> {
  const messenger = await getMessenger(url.searchParams.get("id") ?? "");
  if (!messenger) return fail("messengerNotFound", 404);
  await deleteFiles(messengerDocuments(), messenger.documentKeys);
  await messengers().delete(messenger.id);
  return json({ deleted: messenger.id });
}

export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (req.method === "GET") return list();
  if (req.method === "POST") return review(req);
  if (req.method === "DELETE") return remove(new URL(req.url));
  return fail("methodNotAllowed", 405);
};

export const config: Config = { path: "/api/admin/messengers" };
