import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { fail } from "./http";

const SESSION_HOURS = 12;

function secret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(password, expected);
}

/** Token firmato "scadenza.firma", valido per SESSION_HOURS ore. */
export function issueToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return { token: `${expiresAt}.${sign(String(expiresAt), secret()!)}`, expiresAt };
}

function validToken(token: string): boolean {
  const key = secret();
  const [exp, sig] = token.split(".");
  if (!key || !exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp, key));
}

/** Restituisce una risposta di errore se la richiesta non è autorizzata, altrimenti null. */
export function requireAdmin(req: Request): Response | null {
  if (!adminConfigured()) return fail("adminNotConfigured", 503);
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return validToken(token) ? null : fail("sessionExpired", 401);
}
