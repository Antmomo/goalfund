import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import ConsentFields from "../components/ConsentFields";
import FilePicker from "../components/FilePicker";
import RoutePicker from "../components/RoutePicker";
import { errorText, useI18n } from "../i18n";
import { api } from "../lib/api";
import { compressImage } from "../lib/image";
import { tomorrowIso } from "../lib/session";
import type { PublicMessenger } from "../lib/types";

export default function MessengerPage() {
  const { t, fmt, lang } = useI18n();
  const m = t.messenger;
  const [route, setRoute] = useState({ from: "CAI", to: "FCO" });
  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<PublicMessenger | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (documents.length === 0) return setError(t.errors.documentRequired({}));

    const form = new FormData(e.currentTarget);
    form.set("lang", lang);
    setSending(true);
    try {
      const prepared = await Promise.all(
        documents.map((d) => (d.type.startsWith("image/") ? compressImage(d, 2000, 0.85) : d)),
      );
      prepared.forEach((d) => form.append("documents", d));
      const result = await api.createMessenger(form);
      setCreated(result.messenger);
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setSending(false);
    }
  }

  if (created) {
    const { flight } = created;
    const routeText = `${fmt.airport(flight.from)} ${t.arrow} ${fmt.airport(flight.to)}`;
    return (
      <section className="section">
        <div className="container narrow center">
          <div className="success-icon">✈️</div>
          <h1 className="page-title">{m.welcome(created.displayName)}</h1>
          <p>{m.visible(routeText, fmt.date(flight.date), created.availableKg)}</p>
          <Link to={`/voli?${new URLSearchParams({ from: flight.from, to: flight.to, date: flight.date })}`} className="btn btn-primary">
            {m.seeFlights}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow dark">{m.eyebrow}</p>
        <h1 className="page-title">{m.title}</h1>
        <p className="section-sub left">{m.sub}</p>

        <form className="form card" onSubmit={onSubmit}>
          <fieldset>
            <legend>{m.yourData}</legend>
            <div className="grid-2">
              <label>
                {t.fields.firstName}
                <input name="firstName" required autoComplete="given-name" />
              </label>
              <label>
                {t.fields.lastName}
                <input name="lastName" required autoComplete="family-name" />
              </label>
              <label>
                {m.phoneWhatsapp}
                <input name="phone" type="tel" required autoComplete="tel" placeholder="+…" dir="ltr" />
              </label>
              <label>
                {t.fields.email}
                <input name="email" type="email" required autoComplete="email" dir="ltr" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{m.docTitle}</legend>
            <FilePicker files={documents} onChange={setDocuments} max={3} accept="image/*,application/pdf" hint={m.docHint} />
            <p className="hint">{m.docPrivacy}</p>
          </fieldset>

          <fieldset>
            <legend>{m.flightTitle}</legend>
            <RoutePicker
              from={route.from}
              to={route.to}
              onChange={setRoute}
              fromLabel={m.from}
              toLabel={m.to}
              names={{ from: "from", to: "to" }}
            />
            <div className="grid-2">
              <label>
                {t.fields.flightDate}
                <input name="date" type="date" required min={tomorrowIso()} defaultValue={tomorrowIso()} />
              </label>
              <label>
                {m.flightNumber} <small>{m.optional}</small>
                <input name="flightNumber" placeholder={m.flightNumberPlaceholder} maxLength={10} dir="ltr" />
              </label>
              <label>
                {m.kg}
                <input name="availableKg" type="number" min={1} max={50} step={0.5} required defaultValue={10} />
              </label>
            </div>
          </fieldset>

          <ConsentFields role="messenger" />

          {error && <p className="alert alert-error">{error}</p>}

          <button className="btn btn-primary btn-block" disabled={sending}>
            {sending ? m.sending : m.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
