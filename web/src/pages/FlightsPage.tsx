import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AirportSelect from "../components/AirportSelect";
import { errorText, useI18n } from "../i18n";
import { api } from "../lib/api";
import { getAirport, normalizeFlightNumber, oppositeRegion } from "../lib/catalog";
import { getTier } from "../lib/pricing";
import { loadShipment, tomorrowIso } from "../lib/session";
import type { Flight, FlightsResponse, PublicMessenger } from "../lib/types";

const NOTICE_KEY = { demo: "demoNotice", liveUnavailable: "liveUnavailable", demoMissing: "demoMissing" } as const;

export default function FlightsPage() {
  const { t, fmt, lang } = useI18n();
  const ft = t.flights;
  const [params, setParams] = useSearchParams();
  const shipment = useMemo(loadShipment, []);
  const tier = getTier(shipment?.tierId);

  const from = params.get("from") ?? shipment?.departureAirport ?? "CAI";
  const to = params.get("to") ?? shipment?.arrivalAirport ?? "";
  const date = params.get("date") ?? tomorrowIso();
  const fromRegion = getAirport(from)?.region ?? "africa";
  const toCountry = getAirport(to)?.country;

  const [flights, setFlights] = useState<FlightsResponse | null>(null);
  const [messengers, setMessengers] = useState<PublicMessenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => next.set(k, v));
    next.delete("pagamento");
    setParams(next, { replace: true });
  };

  const changeFrom = (next: string) => {
    const keepTo = getAirport(to)?.region === oppositeRegion(getAirport(next)?.region ?? "africa");
    update({ from: next, to: keepTo ? to : "" });
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
      .catch((err) => !cancelled && setError(errorText(err, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // t cambia solo con la lingua: non serve ricaricare i dati
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, date]);

  const matchesDestination = (iata: string) => !toCountry || getAirport(iata)?.country === toCountry;
  const visibleFlights = (flights?.flights ?? []).filter((f) => matchesDestination(f.to));
  const visibleMessengers = messengers.filter((m) => matchesDestination(m.flight.to));

  const destinationName = (f: Flight) => (getAirport(f.to) ? fmt.airport(f.to) : f.toName);
  const countFor = (f: Flight) =>
    messengers.filter((m) =>
      m.flight.flightNumber
        ? normalizeFlightNumber(m.flight.flightNumber) === normalizeFlightNumber(f.flightNumber)
        : m.flight.to === f.to,
    ).length;

  /** Motivo per cui il Messenger non può portare questa spedizione, oppure null. */
  function blocker(m: PublicMessenger): string | null {
    if (!shipment || !tier) return null;
    if (m.flight.from !== shipment.departureAirport) return t.errors.airportMismatch({});
    if (shipment.arrivalAirport && getAirport(m.flight.to)?.country !== getAirport(shipment.arrivalAirport)?.country) {
      return t.errors.destinationMismatch({});
    }
    if (m.availableKg < tier.maxKg) return ft.notEnoughSpace;
    return null;
  }

  async function choose(m: PublicMessenger) {
    if (!shipment) return;
    setPaying(m.id);
    setError("");
    try {
      const { url } = await api.checkout(shipment.id, m.id, lang);
      window.location.href = url;
    } catch (err) {
      setError(errorText(err, t));
      setPaying(null);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow dark">{ft.step}</p>
        <h1 className="page-title">{ft.title}</h1>

        {params.get("pagamento") === "annullato" && <p className="alert alert-info">{ft.cancelled}</p>}

        {shipment && tier ? (
          <div className="shipment-banner">
            <span>
              📦 {ft.yourShipment} <strong>{shipment.goodsType}</strong> · <bdi>{tier.label}</bdi> ·{" "}
              {fmt.airport(shipment.departureAirport)}
              {shipment.arrivalAirport && ` ${t.arrow} ${fmt.airport(shipment.arrivalAirport)}`}
            </span>
            <strong>{fmt.eur(tier.total)}</strong>
          </div>
        ) : (
          <div className="shipment-banner muted">
            <span>{ft.needShipment}</span>
            <Link to="/spedisci" className="btn btn-primary btn-sm">
              {ft.registerShipment}
            </Link>
          </div>
        )}

        <div className="filters card">
          <label>
            {ft.from}
            <AirportSelect value={from} onChange={changeFrom} regions={["africa", "europe"]} />
          </label>
          <label>
            <span>
              {ft.to} <small className="muted">({t.regions[oppositeRegion(fromRegion)]})</small>
            </span>
            <AirportSelect
              value={to}
              onChange={(next) => update({ to: next })}
              regions={[oppositeRegion(fromRegion)]}
              emptyLabel={ft.allDestinations}
            />
          </label>
          <label>
            {ft.day}
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => e.target.value && update({ date: e.target.value })}
            />
          </label>
        </div>

        {error && <p className="alert alert-error">{error}</p>}
        {flights?.notice && <p className="alert alert-info">ℹ️ {ft[NOTICE_KEY[flights.notice]]}</p>}

        <div className="card table-card">
          <div className="table-head">
            <h2>{ft.departuresOf(fmt.date(date))}</h2>
            {to && (
              <button className="link-btn" onClick={() => update({ to: "" })}>
                {ft.showAll}
              </button>
            )}
          </div>
          {loading ? (
            <p className="empty">{ft.loading}</p>
          ) : visibleFlights.length > 0 ? (
            <div className="table-scroll">
              <table className="flights">
                <thead>
                  <tr>
                    <th>{ft.cols.time}</th>
                    <th>{ft.cols.flight}</th>
                    <th>{ft.cols.airline}</th>
                    <th>{ft.cols.destination}</th>
                    <th>{ft.cols.messengers}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFlights.map((f) => {
                    const count = countFor(f);
                    return (
                      <tr
                        key={`${f.flightNumber}-${f.departureLocal}`}
                        className={to === f.to ? "selected" : ""}
                        onClick={() => getAirport(f.to) && update({ to: f.to })}
                      >
                        <td className="mono" dir="ltr">
                          {f.departureLocal.slice(11, 16)}
                        </td>
                        <td className="mono" dir="ltr">
                          {f.flightNumber}
                        </td>
                        <td>{f.airline}</td>
                        <td>
                          {destinationName(f)} <small className="muted">{f.to}</small>
                        </td>
                        <td>
                          {count > 0 ? <span className="pill pill-ok">{ft.available(count)}</span> : <span className="pill">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">{ft.none}</p>
          )}
        </div>

        <h2 className="section-title left">{to ? ft.messengersTo(fmt.airport(to)) : ft.messengersTitle}</h2>
        {!loading && visibleMessengers.length === 0 && (
          <p className="empty card">
            {ft.noMessengers} <Link to="/messenger">{ft.becomeMessenger}</Link>.
          </p>
        )}
        <p className="alert alert-info">
          ⚖️ {t.disclaimer} <Link to="/condizioni">{t.readTerms}</Link>
        </p>
        <div className="messenger-grid">
          {visibleMessengers.map((m) => {
            const reason = blocker(m);
            return (
              <div key={m.id} className="card messenger-card">
                <div className="messenger-top">
                  <div className="avatar">{m.displayName.charAt(0)}</div>
                  <div>
                    <strong>{m.displayName}</strong>
                    <div className={m.verified ? "badge badge-ok" : "badge"}>{m.verified ? ft.verified : ft.docUploaded}</div>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>{ft.route}</dt>
                    <dd>
                      {fmt.airport(m.flight.from)} {t.arrow} {fmt.airport(m.flight.to)}
                    </dd>
                  </div>
                  <div>
                    <dt>{ft.flight}</dt>
                    <dd dir="ltr">{m.flight.flightNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{ft.space}</dt>
                    <dd>
                      <bdi>{m.availableKg} kg</bdi>
                    </dd>
                  </div>
                </dl>
                <p className="hint">{ft.contactsAfter}</p>
                {shipment && tier ? (
                  <>
                    <button className="btn btn-primary btn-block" disabled={!!reason || paying !== null} onClick={() => choose(m)}>
                      {paying === m.id ? ft.openingStripe : ft.choosePay(fmt.eur(tier.total))}
                    </button>
                    {reason && <p className="hint">{reason}</p>}
                  </>
                ) : (
                  <Link to="/spedisci" className="btn btn-outline btn-block">
                    {ft.registerShipment}
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
