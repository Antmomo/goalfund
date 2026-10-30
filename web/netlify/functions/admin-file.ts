import type { Config } from "@netlify/functions";
import { requireAdmin } from "../lib/auth";
import { fail } from "../lib/http";
import { messengerDocuments, shipmentPhotos } from "../lib/store";

const STORES = { documento: messengerDocuments, foto: shipmentPhotos };

/** Restituisce un documento o una foto privata, solo all'amministratore. */
export default async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const kind = url.searchParams.get("tipo") as keyof typeof STORES | null;
  const key = url.searchParams.get("key") ?? "";
  if (!kind || !(kind in STORES) || !/^[0-9a-f-]{36}\/\d+$/.test(key)) return fail("Richiesta non valida.");

  const result = await STORES[kind]().getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return fail("File non trovato.", 404);

  return new Response(result.data, {
    headers: {
      "Content-Type": String(result.metadata.contentType ?? "application/octet-stream"),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

export const config: Config = { path: "/api/admin/file" };
