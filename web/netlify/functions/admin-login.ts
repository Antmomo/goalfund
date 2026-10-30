import type { Config } from "@netlify/functions";
import { adminConfigured, checkPassword, issueToken } from "../lib/auth";
import { fail, json } from "../lib/http";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Metodo non consentito.", 405);
  if (!adminConfigured()) return fail("Pannello admin non configurato (manca ADMIN_PASSWORD).", 503);

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !checkPassword(password)) {
    // Rallenta i tentativi di indovinare la password.
    await new Promise((r) => setTimeout(r, 800));
    return fail("Password errata.", 401);
  }
  return json(issueToken());
};

export const config: Config = { path: "/api/admin/login" };
