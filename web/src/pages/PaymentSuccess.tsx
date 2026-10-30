import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { europeAirportCity } from "../lib/catalog";
import { formatEur } from "../lib/pricing";
import { clearShipment, formatDate } from "../lib/session";

type Result = Awaited<ReturnType<typeof api.confirm>>;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Sessione di pagamento mancante.");
      return;
    }
    api
      .confirm(sessionId)
      .then((r) => {
        setResult(r);
        clearShipment();
      })
      .catch((err: Error) => setError(err.message));
  }, [sessionId]);

  if (error) {
    return (
      <section className="section">
        <div className="container narrow center">
          <h1 className="page-title">Qualcosa non va</h1>
          <p className="alert alert-error">{error}</p>
          <Link to="/voli" className="btn btn-primary">
            Torna ai voli
          </Link>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="section">
        <div className="container narrow center">
          <p>Verifica del pagamento in corso…</p>
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
          <p className="eyebrow dark">Passo 3 di 3</p>
          <div className="success-icon">✅</div>
          <h1 className="page-title">Pagamento riuscito, al hamdulillah!</h1>
          <p>Hai pagato {formatEur(result.amountPaid)}. Ecco i contatti del tuo Messenger.</p>
        </div>

        <div className="card contact-card">
          <h2>
            {messenger.firstName} {messenger.lastName}
          </h2>
          <p className="muted">
            Volo {messenger.flight.flightNumber ?? ""} {messenger.flight.from} →{" "}
            {europeAirportCity(messenger.flight.to) ?? messenger.flight.to} · {formatDate(messenger.flight.date)}
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={`tel:${messenger.phone}`}>
              📞 {messenger.phone}
            </a>
            <a className="btn btn-gold" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn btn-outline" href={`mailto:${messenger.email}`}>
              ✉️ {messenger.email}
            </a>
          </div>
          <p className="hint">
            Contatta il Messenger per accordarvi su dove consegnare l'oggetto in Egitto e dove ritirarlo in Europa.
            Codice spedizione: <span className="mono">{result.shipmentId.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
