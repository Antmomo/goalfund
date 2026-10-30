import { ar } from "./ar";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it, type Dict } from "./it";
import { isLang, type Lang } from "./types";

export const DICTS: Record<Lang, Dict> = { it, en, ar, es, fr, de };

export function getDict(lang: unknown): Dict {
  return isLang(lang) ? DICTS[lang] : it;
}
