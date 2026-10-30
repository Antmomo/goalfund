import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { errorText, useI18n } from "../i18n";
import { api } from "../lib/api";
import { clearShipment } from "../lib/session";

type Result = Awaited<ReturnType<typeof api.confirm>>;

export default function PaymentSuccess() {
  const { t, fmt } = useI18n();
  const s = t.success;
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!sessionId) {
      setError(new Error(t.errors.missingSession({})));
      return;
    }
    api
      .confirm(sessionId)
      .then((r) => {
        setResult(r);
        clearShipment();
      })
      .catch(setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (error) {
    return (
      <section className="section">
        <div className="container narrow center">
          <h1 className="page-title">{s.problem}</h1>
          <p className="alert alert-error">{errorText(error, t)}</p>
          <Link to="/voli" className="btn btn-primary">
            {s.back}
          </Link>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="section">
        <div className="container narrow center">
          <p>{s.verifying}</p>
        </div>
      </section>
    );
  }

  const { messenger } = result;
  const whatsapp = `https://wa.me/${messenger.phone.replace(/[^0-9]/g, "")}`;

  return (
    <section className="section">
      <div className="container narrow">
        <div className="center">
          <p className="eyebrow dark">{s.step}</p>
          <div className="success-icon">✅</div>
          <h1 className="page-title">{s.title}</h1>
          <p>{s.paid(fmt.eur(result.amountPaid))}</p>
        </div>

        <div className="card contact-card">
          <h2>
            {messenger.firstName} {messenger.lastName}
          </h2>
          <p className="muted">
            {s.flight} <span dir="ltr">{messenger.flight.flightNumber ?? ""}</span> {fmt.airport(messenger.flight.from)}{" "}
            {t.arrow} {fmt.airport(messenger.flight.to)} · {fmt.date(messenger.flight.date)}
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={`tel:${messenger.phone}`} dir="ltr">
              📞 {messenger.phone}
            </a>
            <a className="btn btn-gold" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn btn-outline" href={`mailto:${messenger.email}`} dir="ltr">
              ✉️ {messenger.email}
            </a>
          </div>
          <p className="hint">
            {s.hint} {s.code} <span className="mono">{result.shipmentId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p className="hint">
            {s.after} <Link to="/condizioni">{s.terms}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
