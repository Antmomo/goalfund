import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

/** Sostituisce "{link}" nel testo tradotto con il link vero, ovunque cada nella frase. */
function withLink(template: string, link: ReactNode): ReactNode {
  const [before, after = ""] = template.split("{link}");
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

/** Le due accettazioni obbligatorie: condizioni generali e approvazione specifica delle clausole di responsabilità. */
export default function ConsentFields({ role }: { role: "cliente" | "messenger" }) {
  const { t } = useI18n();
  const c = t.consent;
  return (
    <>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          {role === "cliente" ? c.client : c.messenger}{" "}
          {withLink(
            c.accept,
            <Link to="/condizioni" target="_blank">
              {c.termsLink}
            </Link>,
          )}
        </span>
      </label>
      <label className="consent consent-strong">
        <input type="checkbox" name="liabilityConsent" required />
        <span>
          {withLink(
            c.liability,
            <Link to="/condizioni#responsabilita" target="_blank">
              {c.liabilityLink}
            </Link>,
          )}{" "}
          <strong>{c.liabilityBold}</strong>
        </span>
      </label>
    </>
  );
}
