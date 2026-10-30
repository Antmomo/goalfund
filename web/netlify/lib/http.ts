import { it } from "../../src/i18n/it";
import type { ErrParams, ErrorCode, FieldKey } from "../../src/i18n/types";
import { TERMS_VERSION, type TermsAcceptance } from "../../src/lib/terms";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

/**
 * Risposta di errore con un codice traducibile dal sito (`code`, `params`)
 * e il testo italiano in `error` per chi legge direttamente l'API.
 */
export function fail(code: ErrorCode, status = 400, params: ErrParams = {}): Response {
  return json({ error: it.errors[code](params), code, params }, status);
}

export class ValidationError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly params: ErrParams = {},
  ) {
    super(it.errors[code](params));
  }
}

export function failFrom(err: ValidationError): Response {
  return fail(err.code, 400, err.params);
}

export function text(form: FormData, field: FieldKey, maxLength = 200): string {
  const value = String(form.get(field) ?? "").trim();
  if (!value) throw new ValidationError("required", { field });
  if (value.length > maxLength) throw new ValidationError("tooLong", { field });
  return value;
}

export function email(form: FormData, field: FieldKey): string {
  const value = text(form, field, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError("invalidEmail");
  return value;
}

export function phone(form: FormData, field: FieldKey): string {
  const value = text(form, field, 30);
  if (!/^\+?[0-9 ()-]{7,20}$/.test(value)) throw new ValidationError("invalidPhone");
  return value;
}

export function isoDate(value: string, field: FieldKey): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError("invalidDate", { field });
  }
  return value;
}

/** Verifica le due accettazioni obbligatorie e restituisce la prova da salvare. */
export function termsAcceptance(form: FormData): TermsAcceptance {
  if (form.get("consent") !== "on") throw new ValidationError("terms");
  if (form.get("liabilityConsent") !== "on") throw new ValidationError("liability");
  return { version: TERMS_VERSION, acceptedAt: new Date().toISOString() };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function files(
  form: FormData,
  field: FieldKey,
  opts: { min: number; max: number; maxBytes: number; types: string[] },
): File[] {
  const list = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (list.length < opts.min) throw new ValidationError("minFiles", { n: opts.min, field });
  if (list.length > opts.max) throw new ValidationError("maxFiles", { n: opts.max, field });
  for (const f of list) {
    if (!opts.types.some((t) => f.type.startsWith(t))) throw new ValidationError("badFormat", { name: f.name });
    if (f.size > opts.maxBytes) throw new ValidationError("fileTooLarge", { name: f.name });
  }
  return list;
}
