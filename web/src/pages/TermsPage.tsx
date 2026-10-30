import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { TERMS_VERSION } from "../lib/terms";

export default function TermsPage() {
  const { t, lang } = useI18n();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView();
  }, [hash, lang]);

  const terms = t.terms;
  return (
    <section className="section">
      <div className="container narrow terms">
        <p className="eyebrow dark">{terms.eyebrow}</p>
        <h1 className="page-title">{terms.title}</h1>
        <p className="muted">{terms.version(TERMS_VERSION.split("-").reverse().join("/"))}</p>
        {terms.prevailing && <p className="alert alert-info">{terms.prevailing}</p>}

        <div className="terms-highlight">
          <strong>{terms.summaryLabel}</strong> {terms.summary}
        </div>

        {terms.sections.map((s) => (
          <div key={s.title}>
            <h2 id={s.id}>{s.title}</h2>
            {s.paras?.map((p) => <p key={p}>{p}</p>)}
            {s.list && (
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {s.after?.map((p) => <p key={p}>{p}</p>)}
          </div>
        ))}
      </div>
    </section>
  );
}
