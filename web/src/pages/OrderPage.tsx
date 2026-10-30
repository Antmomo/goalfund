import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import TrackFlight from "../components/TrackFlight";
import { errorText, useI18n } from "../i18n";
import { api } from "../lib/api";
import { getTier } from "../lib/pricing";
import type { OrderStage, OrderView, Review } from "../lib/types";

const STAGES: OrderStage[] = ["pagato", "confermato", "ritirato", "consegnato"];

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="stars" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" className={n <= value ? "on" : ""} onClick={() => onChange(n)} aria-label={`${n}`}>
            ★
          </button>
        ) : (
          <span key={n} className={n <= value ? "on" : ""}>
            ★
          </span>
        ),
      )}
    </span>
  );
}

function ReviewText({ review }: { review: Review }) {
  return (
    <p>
      <Stars value={review.rating} /> {review.comment && <em>“{review.comment}”</em>}
    </p>
  );
}

function Check({ checked, onChange, children, big }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; big?: boolean }) {
  return (
    <label className={big ? "order-check duty-box" : "order-check"}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export default function OrderPage() {
  const { t, fmt, lang } = useI18n();
  const o = t.order;
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const k = params.get("k") ?? "";

  const [view, setView] = useState<OrderView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState({ requirementsRead: false, dutyToShow: false, checkedPacked: false, received: false });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    api.getOrder(id, k).then(setView).catch(setError);
  }, [id, k]);

  const set = (key: keyof typeof checks) => (v: boolean) => setChecks((c) => ({ ...c, [key]: v }));
  const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" }) : "");

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      setView(await api.orderAction({ id, k, action, ...checks, ...extra }));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (!view) {
    return (
      <section className="section">
        <div className="container narrow center">
          {error ? <p className="alert alert-error">{errorText(error, t)}</p> : <p>{o.loading}</p>}
        </div>
      </section>
    );
  }

  const isClient = view.role === "client";
  const stageIndex = STAGES.indexOf(view.stage);
  const tier = getTier(view.tierId);
  const done = (text: string, iso?: string) => (
    <p className="step-done">
      ✓ {text} <small className="muted">{when(iso)}</small>
    </p>
  );
  const whatsapp = `https://wa.me/${view.counterpart.phone.replace(/[^0-9]/g, "")}`;

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow dark">
          {o.code} <span className="mono">{view.code}</span>
        </p>
        <h1 className="page-title">{isClient ? o.titleClient : o.titleMessenger}</h1>

        <ol className="timeline">
          {STAGES.map((s, i) => (
            <li key={s} className={i <= stageIndex ? "reached" : ""}>
              <span className="dot">{i <= stageIndex ? "✓" : i + 1}</span>
              <span>{o.stages[s]}</span>
            </li>
          ))}
        </ol>

        <div className="card order-info">
          <dl className="facts">
            <div>
              <dt>{o.goods}</dt>
              <dd>
                <strong>{view.goodsType}</strong> · <bdi>{tier?.label}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t.send.descriptionLabel}</dt>
              <dd className="pre">{view.description}</dd>
            </div>
            <div>
              <dt>{o.route}</dt>
              <dd>
                {fmt.airport(view.route.from)} {t.arrow} {fmt.airport(view.route.to)} · {fmt.date(view.route.date)}{" "}
                {view.route.flightNumber && <span dir="ltr">{view.route.flightNumber}</span>}{" "}
                <TrackFlight flightNumber={view.route.flightNumber} />
              </dd>
            </div>
          </dl>
          <h3>{isClient ? o.messengerContact : o.clientContact}</h3>
          <p>
            <strong>{view.counterpart.name}</strong>
            {view.counterpart.address && (
              <>
                <br />
                {view.counterpart.address}
              </>
            )}
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary btn-sm" href={`tel:${view.counterpart.phone}`} dir="ltr">
              📞 {view.counterpart.phone}
            </a>
            <a className="btn btn-gold btn-sm" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn btn-outline btn-sm" href={`mailto:${view.counterpart.email}`} dir="ltr">
              ✉️ {view.counterpart.email}
            </a>
          </div>
        </div>

        {error != null && <p className="alert alert-error">{errorText(error, t)}</p>}

        <div className="card order-step">
          <h2>1 · {o.acceptTitle}</h2>
          {view.order.clientAcceptedAt ? (
            <>
              {done(o.requirementsRead, view.order.clientAcceptedAt)}
              {done(o.dutyToShow, view.order.clientAcceptedAt)}
            </>
          ) : isClient ? (
            <>
              <Check checked={checks.requirementsRead} onChange={set("requirementsRead")}>
                {o.requirementsRead} <Link to="/condizioni" target="_blank">{t.readTerms}</Link>
              </Check>
              <Check checked={checks.dutyToShow} onChange={set("dutyToShow")} big>
                {o.dutyToShow}
              </Check>
              <button
                className="btn btn-primary btn-block"
                disabled={busy || !checks.requirementsRead || !checks.dutyToShow}
                onClick={() => act("accept")}
              >
                {o.acceptButton}
              </button>
            </>
          ) : (
            <p className="muted">⏳ {o.waitingClient}</p>
          )}
        </div>

        <div className={view.order.clientAcceptedAt ? "card order-step" : "card order-step locked"}>
          <h2>2 · {o.pickupTitle}</h2>
          {view.order.pickedUpAt ? (
            done(o.checkedPacked, view.order.pickedUpAt)
          ) : !isClient && view.order.clientAcceptedAt ? (
            <>
              <Check checked={checks.checkedPacked} onChange={set("checkedPacked")}>
                {o.checkedPacked}
              </Check>
              <button className="btn btn-primary btn-block" disabled={busy || !checks.checkedPacked} onClick={() => act("pickup")}>
                {o.pickupButton}
              </button>
            </>
          ) : (
            <p className="muted">⏳ {view.order.clientAcceptedAt ? o.waitingPickup : o.waitingClient}</p>
          )}
        </div>

        <div className={view.order.pickedUpAt ? "card order-step" : "card order-step locked"}>
          <h2>3 · {o.deliveryTitle}</h2>
          {view.order.deliveredAt ? (
            <>
              {done(o.deliveredCheck, view.order.deliveredAt)}
              <p className="alert alert-info">💶 {o.payoutReleased}</p>
            </>
          ) : isClient && view.order.pickedUpAt ? (
            <>
              <Check checked={checks.received} onChange={set("received")}>
                {o.deliveredCheck}
              </Check>
              <button className="btn btn-primary btn-block" disabled={busy || !checks.received} onClick={() => act("deliver")}>
                {o.deliveredButton}
              </button>
            </>
          ) : (
            <p className="muted">⏳ {view.order.pickedUpAt ? o.waitingDelivery : o.waitingPickup}</p>
          )}
        </div>

        <div className={view.order.deliveredAt ? "card order-step" : "card order-step locked"}>
          <h2>4 · {o.reviewTitle}</h2>
          {!view.order.deliveredAt ? (
            <p className="muted">⏳ {o.waitingDelivery}</p>
          ) : view.myReview ? (
            <>
              <p>✓ {o.reviewThanks}</p>
              <ReviewText review={view.myReview} />
            </>
          ) : (
            <>
              <p>{o.reviewOf(view.counterpart.name)}</p>
              <Stars value={rating} onChange={setRating} />
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={o.reviewPlaceholder} />
              <button className="btn btn-primary btn-block" disabled={busy || rating === 0} onClick={() => act("review", { rating, comment })}>
                {o.reviewSend}
              </button>
            </>
          )}
          {view.theirReview && (
            <div className="their-review">
              <h3>{o.theirReview}</h3>
              <ReviewText review={view.theirReview} />
            </div>
          )}
        </div>

        <p className="hint center">⚖️ {t.disclaimer}</p>
      </div>
    </section>
  );
}
