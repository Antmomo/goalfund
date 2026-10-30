import { LANGS, useI18n, type Lang } from "../i18n";

export default function LanguageSelect() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="lang-select">
      <span aria-hidden>🌐</span>
      <select aria-label={t.nav.language} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
