export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export class ValidationError extends Error {}

export function text(form: FormData, name: string, label: string, maxLength = 200): string {
  const value = String(form.get(name) ?? "").trim();
  if (!value) throw new ValidationError(`Il campo "${label}" è obbligatorio.`);
  if (value.length > maxLength) throw new ValidationError(`Il campo "${label}" è troppo lungo.`);
  return value;
}

export function email(form: FormData, name: string): string {
  const value = text(form, name, "Email", 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError("Indirizzo email non valido.");
  return value;
}

export function phone(form: FormData, name: string): string {
  const value = text(form, name, "Cellulare", 30);
  if (!/^\+?[0-9 ()-]{7,20}$/.test(value)) throw new ValidationError("Numero di cellulare non valido.");
  return value;
}

export function isoDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${label}: data non valida.`);
  }
  return value;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function files(
  form: FormData,
  name: string,
  opts: { min: number; max: number; maxBytes: number; types: string[]; label: string },
): File[] {
  const list = form.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
  if (list.length < opts.min) throw new ValidationError(`Carica almeno ${opts.min} file per "${opts.label}".`);
  if (list.length > opts.max) throw new ValidationError(`Puoi caricare al massimo ${opts.max} file per "${opts.label}".`);
  for (const f of list) {
    if (!opts.types.some((t) => f.type.startsWith(t))) throw new ValidationError(`Formato non supportato: ${f.name}`);
    if (f.size > opts.maxBytes) throw new ValidationError(`File troppo grande: ${f.name}`);
  }
  return list;
}
