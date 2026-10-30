import { FormEvent, useCallback, useEffect, useState } from "react";
import PrivateFile from "../components/PrivateFile";
import { UnauthorizedError, adminApi, loadToken, logout } from "../lib/adminApi";
import { CATEGORIES, airportName } from "../lib/catalog";
import { formatEur, getTier } from "../lib/pricing";
import { formatDate } from "../lib/session";
import { orderStage, type AdminMessenger, type AdminShipment, type AdminStats, type MessengerStatus, type OrderStage, type Review } from "../lib/types";

const STATUS_LABEL: Record<MessengerStatus, string> = {
  in_verifica: "In verifica",
  verificato: "Verificato",
  rifiutato: "Rifiutato",
};

const STAGE_LABEL: Record<OrderStage, string> = {
  pagato: "Pagata – attende conferma del cliente",
  confermato: "Confermata dal cliente – attende il ritiro",
  ritirato: "Ritirata dal Messenger – in viaggio",
  consegnato: "Consegnata",
};

const PAYOUT_LABEL = { in_attesa: "in attesa della consegna", da_pagare: "DA PAGARE", pagato: "pagato" } as const;

const stars = (r?: Review) => (r ? `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}${r.comment ? ` – “${r.comment}”` : ""}` : "—");

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(loadToken);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const signOut = useCallback(() => {
    logout();
    setToken(null);
  }, []);

  return token ? <Dashboard token={token} onSignOut={signOut} /> : <Login onLogin={setToken} />;
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(await adminApi.login(String(new FormData(e.currentTarget).get("password"))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accesso non riuscito.");
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="container login-box">
        <form className="form card" onSubmit={onSubmit}>
          <p className="eyebrow dark">Area riservata</p>
          <h1 className="page-title">Pannello admin</h1>
          <label>
            Password
            <input name="password" type="password" required autoFocus autoComplete="current-password" />
          </label>
          {error && <p className="alert alert-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Accesso…" : "Accedi"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Dashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<"messenger" | "spedizioni">("messenger");
  const [filter, setFilter] = useState<MessengerStatus | "tutti">("in_verifica");
  const [messengers, setMessengers] = useState<AdminMessenger[]>([]);
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) onSignOut();
      else setError(err instanceof Error ? err.message : "Errore.");
    },
    [onSignOut],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, s] = await Promise.all([adminApi.messengers(token), adminApi.shipments(token)]);
      setMessengers(m.messengers);
      setShipments(s.shipments);
      setStats(s.stats);
    } catch (err) {
      handle(err);
    } finally {
      setLoading(false);
    }
  }, [token, handle]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(m: AdminMessenger, action: "approve" | "reject" | "reset") {
    let reason: string | undefined;
    if (action === "reject") {
      const answer = window.prompt(`Motivo del rifiuto per ${m.firstName} ${m.lastName} (facoltativo):`, "");
      if (answer === null) return;
      reason = answer;
    }
    try {
      const { messenger } = await adminApi.review(token, m.id, action, reason);
      setMessengers((list) => list.map((x) => (x.id === messenger.id ? messenger : x)));
      setStats((s) =>
        s && {
          ...s,
          messengersPending: s.messengersPending + (m.status === "in_verifica" ? -1 : 0) + (messenger.status === "in_verifica" ? 1 : 0),
          messengersVerified: s.messengersVerified + (m.status === "verificato" ? -1 : 0) + (messenger.status === "verificato" ? 1 : 0),
        },
      );
    } catch (err) {
      handle(err);
    }
  }

  async function removeMessenger(m: AdminMessenger) {
    if (!window.confirm(`Eliminare definitivamente ${m.firstName} ${m.lastName} e i suoi documenti? L'operazione non si può annullare.`)) return;
    try {
      await adminApi.deleteMessenger(token, m.id);
      await load();
    } catch (err) {
      handle(err);
    }
  }

  async function markPaidOut(s: AdminShipment) {
    if (!window.confirm(`Confermi di aver pagato al Messenger ${s.messengerName ?? ""} la sua quota?`)) return;
    try {
      await adminApi.orderAction(token, s.id, "payoutPaid");
      await load();
    } catch (err) {
      handle(err);
    }
  }

  async function resendEmails(s: AdminShipment) {
    try {
      await adminApi.orderAction(token, s.id, "resendEmails");
      window.alert("Email inviate al cliente e al Messenger.");
      await load();
    } catch (err) {
      if (err instanceof UnauthorizedError) handle(err);
      else window.alert("Invio non riuscito: controlla SMTP_USER e SMTP_PASS su Netlify.");
    }
  }

  async function removeShipment(s: AdminShipment) {
    const warning = s.status === "pagata" ? "\n\nATTENZIONE: questa spedizione risulta PAGATA. Il pagamento resta su Stripe." : "";
    if (!window.confirm(`Eliminare definitivamente la spedizione "${s.goodsType}" e le sue foto?${warning}`)) return;
    try {
      await adminApi.deleteShipment(token, s.id);
      await load();
    } catch (err) {
      handle(err);
    }
  }

  const visible = filter === "tutti" ? messengers : messengers.filter((m) => m.status === filter);
  const count = (s: MessengerStatus) => messengers.filter((m) => m.status === s).length;

  return (
    <section className="section">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="eyebrow dark">Area riservata</p>
            <h1 className="page-title">Pannello admin</h1>
          </div>
          <div className="admin-actions">
            <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
              ↻ Aggiorna
            </button>
            <button className="btn btn-outline btn-sm" onClick={onSignOut}>
              Esci
            </button>
          </div>
        </div>

        {stats && (
          <div className="stats-grid">
            <Stat label="Messenger da verificare" value={String(stats.messengersPending)} highlight={stats.messengersPending > 0} />
            <Stat label="Messenger verificati" value={String(stats.messengersVerified)} />
            <Stat label="Spedizioni pagate" value={String(stats.shipmentsPaid)} sub={`${stats.shipmentsWaiting} in attesa`} />
            <Stat label="Incassato" value={formatEur(stats.revenueTotal)} sub={`${formatEur(stats.platformFees)} commissioni`} />
            <Stat label="IVA da versare (22%)" value={formatEur(stats.vatDue)} sub={`${formatEur(stats.platformFeesNet)} commissioni nette`} />
            <Stat
              label="Da pagare ai Messenger"
              value={formatEur(stats.messengerPayouts)}
              sub={`${formatEur(stats.messengerPaidOut)} già pagati`}
              highlight={stats.messengerPayouts > 0}
            />
          </div>
        )}

        <div className="tabs">
          <button className={tab === "messenger" ? "active" : ""} onClick={() => setTab("messenger")}>
            Messenger
          </button>
          <button className={tab === "spedizioni" ? "active" : ""} onClick={() => setTab("spedizioni")}>
            Spedizioni
          </button>
        </div>

        {error && <p className="alert alert-error">{error}</p>}
        {loading && <p className="empty">Caricamento…</p>}

        {!loading && tab === "messenger" && (
          <>
            <div className="segmented filter-bar">
              {(["in_verifica", "verificato", "rifiutato"] as const).map((s) => (
                <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>
                  {STATUS_LABEL[s]} <small>{count(s)}</small>
                </button>
              ))}
              <button className={filter === "tutti" ? "active" : ""} onClick={() => setFilter("tutti")}>
                Tutti <small>{messengers.length}</small>
              </button>
            </div>
            {visible.length === 0 && <p className="empty card">Nessun Messenger in questa sezione.</p>}
            <div className="admin-list">
              {visible.map((m) => (
                <MessengerRow key={m.id} m={m} token={token} onReview={review} onDelete={removeMessenger} />
              ))}
            </div>
          </>
        )}

        {!loading && tab === "spedizioni" && (
          <div className="admin-list">
            {shipments.length === 0 && <p className="empty card">Nessuna spedizione registrata.</p>}
            {shipments.map((s) => (
              <ShipmentRow key={s.id} s={s} token={token} onDelete={removeShipment} onPaidOut={markPaidOut} onResend={resendEmails} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "stat card highlight" : "stat card"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function MessengerRow({
  m,
  token,
  onReview,
  onDelete,
}: {
  m: AdminMessenger;
  token: string;
  onReview: (m: AdminMessenger, action: "approve" | "reject" | "reset") => void;
  onDelete: (m: AdminMessenger) => void;
}) {
  return (
    <article className="card admin-row">
      <div className="admin-row-head">
        <div>
          <h3>
            {m.firstName} {m.lastName}
          </h3>
          <span className={`status status-${m.status}`}>{STATUS_LABEL[m.status]}</span>
          <span className="muted small"> · registrato {formatDateTime(m.createdAt)}</span>
        </div>
        <div className="admin-actions">
          {m.status !== "verificato" && (
            <button className="btn btn-primary btn-sm" onClick={() => onReview(m, "approve")}>
              ✓ Approva
            </button>
          )}
          {m.status !== "rifiutato" && (
            <button className="btn btn-outline btn-sm" onClick={() => onReview(m, "reject")}>
              ✕ Rifiuta
            </button>
          )}
          {m.status !== "in_verifica" && (
            <button className="link-btn" onClick={() => onReview(m, "reset")}>
              Rimetti in verifica
            </button>
          )}
          <button className="link-btn danger" onClick={() => onDelete(m)}>
            🗑 Elimina
          </button>
        </div>
      </div>

      <div className="admin-row-body">
        <dl className="facts">
          <div>
            <dt>Cellulare</dt>
            <dd>
              <a href={`tel:${m.phone}`}>{m.phone}</a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${m.email}`}>{m.email}</a>
            </dd>
          </div>
          <div>
            <dt>Volo</dt>
            <dd>
              {m.flight.flightNumber ?? "—"} · {airportName(m.flight.from)} → {airportName(m.flight.to)}
            </dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{formatDate(m.flight.date)}</dd>
          </div>
          <div>
            <dt>Spazio</dt>
            <dd>{m.availableKg} kg</dd>
          </div>
          {m.rejectionReason && (
            <div>
              <dt>Motivo rifiuto</dt>
              <dd>{m.rejectionReason}</dd>
            </div>
          )}
        </dl>
        <div>
          <p className="small muted">Documenti d'identità (clic per ingrandire)</p>
          <div className="doc-grid">
            {m.documentKeys.map((k, i) => (
              <PrivateFile key={k} token={token} tipo="documento" fileKey={k} label={`documento ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ShipmentRow({
  s,
  token,
  onDelete,
  onPaidOut,
  onResend,
}: {
  s: AdminShipment;
  token: string;
  onDelete: (s: AdminShipment) => void;
  onPaidOut: (s: AdminShipment) => void;
  onResend: (s: AdminShipment) => void;
}) {
  const origin = window.location.origin;
  const [open, setOpen] = useState(false);
  const tier = getTier(s.tierId);
  const categories = s.categories.map((c) => CATEGORIES.find((k) => k.id === c)?.emoji ?? "").join(" ");

  return (
    <article className="card admin-row">
      <div className="admin-row-head">
        <div>
          <h3>
            {categories} {s.goodsType}
          </h3>
          <span className={s.status === "pagata" ? "status status-verificato" : "status status-in_verifica"}>
            {s.status === "pagata" ? "Pagata" : "In attesa di pagamento"}
          </span>
          <span className="muted small">
            {" "}
            · {tier?.label} · {tier && formatEur(tier.total)} · {airportName(s.departureAirport)}
            {s.arrivalAirport && ` → ${airportName(s.arrivalAirport)}`} · {formatDateTime(s.createdAt)}
          </span>
        </div>
        <div className="admin-actions">
          <button className="link-btn" onClick={() => setOpen(!open)}>
            {open ? "Chiudi" : "Dettagli e foto"}
          </button>
          <button className="link-btn danger" onClick={() => onDelete(s)}>
            🗑 Elimina
          </button>
        </div>
      </div>

      {open && (
        <div className="admin-row-body">
          <dl className="facts">
            <div>
              <dt>Cliente</dt>
              <dd>
                {s.client.firstName} {s.client.lastName}, {s.client.age} anni
              </dd>
            </div>
            <div>
              <dt>Contatti</dt>
              <dd>
                <a href={`tel:${s.client.phone}`}>{s.client.phone}</a> · <a href={`mailto:${s.client.email}`}>{s.client.email}</a>
              </dd>
            </div>
            <div>
              <dt>Indirizzo</dt>
              <dd>
                {s.client.address}, {s.client.postalCode} {s.client.city} ({s.client.country})
              </dd>
            </div>
            <div>
              <dt>Messenger</dt>
              <dd>{s.messengerName ?? "—"}</dd>
            </div>
            {s.paidAt && (
              <div>
                <dt>Pagata il</dt>
                <dd>{formatDateTime(s.paidAt)}</dd>
              </div>
            )}
            <div className="full">
              <dt>Descrizione</dt>
              <dd className="pre">{s.description}</dd>
            </div>
            {s.order && (
              <>
                <div>
                  <dt>Ordine</dt>
                  <dd>{STAGE_LABEL[orderStage(s.order)]}</dd>
                </div>
                <div>
                  <dt>Quota Messenger</dt>
                  <dd>
                    {tier && formatEur(tier.messengerShare)} · {PAYOUT_LABEL[s.order.payout]}
                    {s.order.payout === "da_pagare" && (
                      <>
                        {" "}
                        <button className="btn btn-primary btn-sm" onClick={() => onPaidOut(s)}>
                          Segna come pagato
                        </button>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    {s.order.emailsSentAt ? `inviate ${formatDateTime(s.order.emailsSentAt)}` : "non inviate"}{" "}
                    <button className="btn btn-outline btn-sm" onClick={() => onResend(s)}>
                      ✉️ {s.order.emailsSentAt ? "Reinvia email" : "Invia email"}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Link cliente</dt>
                  <dd className="small">{`${origin}/ordine/${s.id}?k=${s.order.clientToken}`}</dd>
                </div>
                <div>
                  <dt>Link Messenger</dt>
                  <dd className="small">{`${origin}/ordine/${s.id}?k=${s.order.messengerToken}`}</dd>
                </div>
                <div>
                  <dt>Recensione cliente</dt>
                  <dd>{stars(s.order.reviews.byClient)}</dd>
                </div>
                <div>
                  <dt>Recensione Messenger</dt>
                  <dd>{stars(s.order.reviews.byMessenger)}</dd>
                </div>
              </>
            )}
          </dl>
          <div>
            <p className="small muted">Foto dell'oggetto</p>
            <div className="doc-grid">
              {s.photoKeys.map((k, i) => (
                <PrivateFile key={k} token={token} tipo="foto" fileKey={k} label={`foto ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
