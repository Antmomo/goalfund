import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { airportName } from "../lib/catalog";
import { DICTS } from "./dicts";
import type { Dict } from "./it";
import { LANGS, isLang, type ErrParams, type ErrorCode, type Lang } from "./types";

export { LANGS, type Lang };

/** Errore restituito dalle API, con un codice traducibile. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: ErrorCode,
    readonly params: ErrParams = {},
  ) {
    super(message);
  }
}

export function errorText(err: unknown, t: Dict): string {
  if (err instanceof ApiError && err.code && t.errors[err.code]) return t.errors[err.code](err.params);
  if (err instanceof Error && err.message) return err.message;
  return t.errors.generic({});
}

const STORAGE_KEY = "amanah:lang";

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // memoria locale non disponibile
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "it";
}

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
  dir: "ltr" | "rtl";
  fmt: {
    eur: (amount: number) => string;
    date: (iso: string) => string;
    airport: (iata: string) => string;
  };
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const info = LANGS.find((l) => l.code === lang)!;
  const t = DICTS[lang];

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // la scelta vale solo per questa visita
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = info.dir;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description);
  }, [lang, info.dir, t]);

  const value = useMemo<I18n>(() => {
    const eur = new Intl.NumberFormat(info.locale, { style: "currency", currency: "EUR" });
    const date = new Intl.DateTimeFormat(info.locale, { weekday: "short", day: "numeric", month: "long" });
    return {
      lang,
      setLang,
      t,
      dir: info.dir,
      fmt: {
        eur: (n) => eur.format(n),
        date: (iso) => date.format(new Date(`${iso}T12:00:00`)),
        airport: (iata) => airportName(iata, lang),
      },
    };
  }, [lang, setLang, t, info]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n deve essere usato dentro I18nProvider");
  return ctx;
}
