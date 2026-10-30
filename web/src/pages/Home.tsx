import { Link } from "react-router-dom";
import PricingTable from "../components/PricingTable";
import { useI18n } from "../i18n";

export default function Home() {
  const { t } = useI18n();
  const h = t.home;
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">{h.eyebrow}</p>
          <h1>{h.title}</h1>
          <p className="lead">{h.lead}</p>
          <div className="hero-actions">
            <Link to="/spedisci" className="btn btn-gold">
              {h.ctaClient}
            </Link>
            <Link to="/messenger" className="btn btn-outline-light">
              {h.ctaMessenger}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">{h.howTitle}</h2>
          <div className="steps-columns">
            {[
              [h.clientTitle, h.clientSteps],
              [h.messengerTitle, h.messengerSteps],
            ].map(([title, steps]) => (
              <div className="card" key={title as string}>
                <h3>{title as string}</h3>
                <ol className="steps">
                  {(steps as string[][]).map(([bold, rest]) => (
                    <li key={bold}>
                      <strong>{bold}</strong> {rest}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <h2 className="section-title">{h.pricingTitle}</h2>
          <p className="section-sub">{h.pricingSub}</p>
          <PricingTable />
        </div>
      </section>

      <section className="section">
        <div className="container trust">
          {h.trust.map(([icon, title, text]) => (
            <div key={title}>
              <span className="trust-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className="container">
          <p className="alert alert-info home-disclaimer">
            ⚖️ {t.disclaimer} <Link to="/condizioni">{t.readTerms}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
