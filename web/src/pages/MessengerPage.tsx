import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import ConsentFields from "../components/ConsentFields";
import FilePicker from "../components/FilePicker";
import { api } from "../lib/api";
import { DEPARTURE_AIRPORTS, EUROPE_AIRPORTS } from "../lib/catalog";
import { compressImage } from "../lib/image";
import { formatDate, tomorrowIso } from "../lib/session";
import type { PublicMessenger } from "../lib/types";

export default function MessengerPage() {
  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<PublicMessenger | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (documents.length === 0) return setError("Carica il tuo documento d'identità o passaporto.");

    const form = new FormData(e.currentTarget);
    setSending(true);
    try {
      const prepared = await Promise.all(
        documents.map((d) => (d.type.startsWith("image/") ? compressImage(d, 2000, 0.85) : d)),
      );
      prepared.forEach((d) => form.append("documents", d));
      const { messenger } = await api.createMessenger(form);
      setCreated(messenger);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore.");
    } finally {
      setSending(false);
    }
  }

  if (created) {
    return (
      <section className="section">
        <div className="container narrow center">
          <div className="success-icon">✈️</div>
          <h1 className="page-title">Benvenuto tra i Messenger, {created.displayName}!</h1>
          <p>
            Sei visibile per il volo {created.flight.from} → {created.flight.to} del {formatDate(created.flight.date)} con{" "}
            {created.availableKg} kg disponibili. I tuoi contatti restano privati: il cliente li riceve solo dopo aver
            pagato.
          </p>
          <Link to={`/voli?from=${created.flight.from}&date=${created.flight.date}`} className="btn btn-primary">
            Vedi la tabella dei voli
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow dark">Passeggero Messenger 😉</p>
        <h1 className="page-title">Viaggi verso l'Europa? Guadagna con lo spazio in valigia.</h1>
        <p className="section-sub left">
          Ricevi il 50% di ogni spedizione. Il tuo numero di cellulare e i tuoi dati non vengono mostrati ai clienti
          finché non completano il pagamento su Stripe.
        </p>

        <form className="form card" onSubmit={onSubmit}>
          <fieldset>
            <legend>I tuoi dati</legend>
            <div className="grid-2">
              <label>
                Nome
                <input name="firstName" required autoComplete="given-name" />
              </label>
              <label>
                Cognome
                <input name="lastName" required autoComplete="family-name" />
              </label>
              <label>
                Cellulare (WhatsApp)
                <input name="phone" type="tel" required autoComplete="tel" placeholder="+20 ..." />
              </label>
              <label>
                Email
                <input name="email" type="email" required autoComplete="email" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Documento d'identità</legend>
            <FilePicker
              files={documents}
              onChange={setDocuments}
              max={3}
              accept="image/*,application/pdf"
              hint="passaporto o carta d'identità, foto o PDF (max 2 MB per PDF)"
            />
            <p className="hint">🔒 I documenti sono conservati in modo privato e servono solo alla verifica.</p>
          </fieldset>

          <fieldset>
            <legend>Disponibilità per il volo</legend>
            <div className="grid-2">
              <label>
                Partenza
                <select name="from" required defaultValue="CAI">
                  {DEPARTURE_AIRPORTS.map((a) => (
                    <option key={a.iata} value={a.iata}>
                      {a.city} ({a.iata})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Arrivo
                <select name="to" required defaultValue="FCO">
                  {EUROPE_AIRPORTS.map((a) => (
                    <option key={a.iata} value={a.iata}>
                      {a.city} ({a.iata})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data del volo
                <input name="date" type="date" required min={tomorrowIso()} defaultValue={tomorrowIso()} />
              </label>
              <label>
                Numero del volo <small>(facoltativo)</small>
                <input name="flightNumber" placeholder="Es. MS 791" maxLength={10} />
              </label>
              <label>
                Kg disponibili
                <input name="availableKg" type="number" min={1} max={50} step={0.5} required defaultValue={10} />
              </label>
            </div>
          </fieldset>

          <ConsentFields role="messenger" />

          {error && <p className="alert alert-error">{error}</p>}

          <button className="btn btn-primary btn-block" disabled={sending}>
            {sending ? "Registrazione in corso…" : "Registrati come Messenger"}
          </button>
        </form>
      </div>
    </section>
  );
}
