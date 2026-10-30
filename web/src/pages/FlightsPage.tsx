import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { DEPARTURE_AIRPORTS, europeAirportCity, normalizeFlightNumber } from "../lib/catalog";
import { formatEur, getTier } from "../lib/pricing";
import { formatDate, loadShipment, tomorrowIso } from "../lib/session";
import type { FlightsResponse, PublicMessenger } from "../lib/types";

export default function FlightsPage() {
  const [params, setParams] = useSearchParams();
  const shipment = useMemo(loadShipment, []);
  const tier = getTier(shipment?.tierId);

  const from = params.get("from") ?? shipment?.departureAirport ?? "CAI";
  const date = params.get("date") ?? tomorrowIso();
  const [destination, setDestination] = useState<string | null>(null);

  const [flights, setFlights] = useState<FlightsResponse | null>(null);
  const [messengers, setMessengers] = useState<PublicMessenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.delete("pagamento");
    setParams(next, { replace: true });
    setDestination(null);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([api.flights(from, date), api.listMessengers({ from, date })])
      .then(([f, m]) => {
        if (cancelled) return;
        setFlights(f);
        setMessengers(m.messengers);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, date]);

  const countFor = (flightNumber: string, to: string) =>
    messengers.filter((m) =>
      m.flight.flightNumber
        ? normalizeFlightNumber(m.flight.flightNumber) === normalizeFlightNumber(flightNumber)
        : m.flight.to === to,
    ).length;

  const visibleMessengers = destination ? messengers.filter((m) => m.flight.to === destination) : messengers;

  async function choose(m: PublicMessenger) {
    if (!shipment) return;
    setPaying(m.id);
    setError("");
    try {
      const { url } = await api.checkout(shipment.id, m.id);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pagamento non avviato.");
      setPaying(null);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow dark">Passo 2 di 3</p>
        <h1 className="page-title">Voli dall'Egitto verso l'Europa</h1>

        {params.get("pagamento") === "annullato" && (
          <p className="alert alert-info">Pagamento annullato. Puoi scegliere di nuovo quando vuoi.</p>
        )}

        {shipment && tier ? (
          <div className="shipment-banner">
            <span>
              📦 La tua spedizione: <strong>{shipment.goodsType}</strong> · {tier.label}
            </span>
            <strong>{formatEur(tier.total)}</strong>
          </div>
        ) : (
          <div className="shipment-banner muted">
            <span>Per scegliere un Messenger devi prima registrare la tua spedizione.</span>
            <Link to="/spedisci" className="btn btn-primary btn-sm">
              Registra spedizione
            </Link>
          </div>
        )}

        <div className="filters card">
          <div className="segmented">
            {DEPARTURE_AIRPORTS.map((a) => (
              <button key={a.iata} className={a.iata === from ? "active" : ""} onClick={() => update("from", a.iata)}>
                {a.city} <small>{a.iata}</small>
              </button>
            ))}
          </div>
          <label className="inline">
            Giorno
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && update("date", e.target.value)} />
          </label>
        </div>

        {error && <p className="alert alert-error">{error}</p>}
        {flights?.notice && <p className="alert alert-info">ℹ️ {flights.notice}</p>}

        <div className="card table-card">
          <div className="table-head">
            <h2>Partenze del {formatDate(date)}</h2>
            {destination && (
              <button className="link-btn" onClick={() => setDestination(null)}>
                Mostra tutte le destinazioni
              </button>
            )}
          </div>
          {loading ? (
            <p className="empty">Caricamento voli…</p>
          ) : flights && flights.flights.length > 0 ? (
            <div className="table-scroll">
              <table className="flights">
                <thead>
                  <tr>
                    <th>Orario</th>
                    <th>Volo</th>
                    <th>Compagnia</th>
                    <th>Destinazione</th>
                    <th>Messenger</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.flights.map((f) => {
                    const count = countFor(f.flightNumber, f.to);
                    return (
                      <tr
                        key={`${f.flightNumber}-${f.departureLocal}`}
                        className={destination === f.to ? "selected" : ""}
                        onClick={() => setDestination(f.to)}
                      >
                        <td className="mono">{f.departureLocal.slice(11, 16)}</td>
                        <td className="mono">{f.flightNumber}</td>
                        <td>{f.airline}</td>
                        <td>
                          {f.toName} <small className="muted">{f.to}</small>
                        </td>
                        <td>
                          {count > 0 ? <span className="pill pill-ok">{count} {count === 1 ? "disponibile" : "disponibili"}</span> : <span className="pill">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">Nessun volo trovato per questo giorno.</p>
          )}
        </div>

        <h2 className="section-title left">
          Messenger in partenza {destination ? `per ${europeAirportCity(destination) ?? destination}` : ""}
        </h2>
        {!loading && visibleMessengers.length === 0 && (
          <p className="empty card">
            Nessun Messenger registrato per questo giorno. Prova un'altra data o{" "}
            <Link to="/messenger">diventa tu un Messenger</Link>.
          </p>
        )}
        <div className="messenger-grid">
          {visibleMessengers.map((m) => {
            const fits = !tier || m.availableKg >= tier.maxKg;
            return (
              <div key={m.id} className="card messenger-card">
                <div className="messenger-top">
                  <div className="avatar">{m.displayName.charAt(0)}</div>
                  <div>
                    <strong>{m.displayName}</strong>
                    <div className={m.verified ? "badge badge-ok" : "badge"}>
                      {m.verified ? "✓ Verificato" : "🪪 Documento caricato"}
                    </div>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Tratta</dt>
                    <dd>
                      {m.flight.from} → {europeAirportCity(m.flight.to) ?? m.flight.to}
                    </dd>
                  </div>
                  <div>
                    <dt>Volo</dt>
                    <dd>{m.flight.flightNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Spazio</dt>
                    <dd>{m.availableKg} kg</dd>
                  </div>
                </dl>
                <p className="hint">📵 Contatti visibili dopo il pagamento</p>
                {shipment && tier ? (
                  <button className="btn btn-primary btn-block" disabled={!fits || paying !== null} onClick={() => choose(m)}>
                    {paying === m.id ? "Apertura Stripe…" : fits ? `Scegli e paga ${formatEur(tier.total)}` : "Spazio insufficiente"}
                  </button>
                ) : (
                  <Link to="/spedisci" className="btn btn-outline btn-block">
                    Registra la spedizione
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
