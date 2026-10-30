import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConsentFields from "../components/ConsentFields";
import FilePicker from "../components/FilePicker";
import { api } from "../lib/api";
import { CATEGORIES, DEPARTURE_AIRPORTS } from "../lib/catalog";
import { compressImage } from "../lib/image";
import { WEIGHT_TIERS, formatEur, getTier } from "../lib/pricing";
import { saveShipment } from "../lib/session";

export default function SendPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [tierId, setTierId] = useState(WEIGHT_TIERS[0].id);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const tier = getTier(tierId)!;

  const toggleCategory = (id: string) =>
    setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (categories.length === 0) return setError("Seleziona cosa vuoi spedire.");
    if (photos.length === 0) return setError("Carica almeno una foto dell'oggetto.");

    const form = new FormData(e.currentTarget);
    categories.forEach((c) => form.append("categories", c));
    form.set("tierId", tierId);

    setSending(true);
    try {
      const compressed = await Promise.all(photos.map((p) => compressImage(p)));
      compressed.forEach((p) => form.append("photos", p));
      const summary = await api.createShipment(form);
      saveShipment(summary);
      navigate(`/voli?from=${summary.departureAirport}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si è verificato un errore.");
      setSending(false);
    }
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow dark">Passo 1 di 3</p>
        <h1 className="page-title">Cosa vuoi farti portare?</h1>
        <p className="section-sub left">
          Registrati e descrivi l'oggetto. Subito dopo potrai scegliere il volo e il Messenger.
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
                Età
                <input name="age" type="number" min={18} max={120} required />
              </label>
              <label>
                Cellulare
                <input name="phone" type="tel" required autoComplete="tel" placeholder="+39 ..." />
              </label>
              <label className="span-2">
                Email
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label className="span-2">
                Indirizzo
                <input name="address" required autoComplete="street-address" placeholder="Via, numero civico" />
              </label>
              <label>
                CAP
                <input name="postalCode" required autoComplete="postal-code" />
              </label>
              <label>
                Città
                <input name="city" required autoComplete="address-level2" />
              </label>
              <label className="span-2">
                Paese
                <input name="country" required autoComplete="country-name" defaultValue="Italia" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Cosa vuoi spedire?</legend>
            <div className="choice-grid">
              {CATEGORIES.map((c) => (
                <label key={c.id} className={categories.includes(c.id) ? "choice selected" : "choice"}>
                  <input type="checkbox" checked={categories.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  <span className="choice-emoji">{c.emoji}</span>
                  {c.label}
                </label>
              ))}
            </div>
            <label>
              Tipo di merce precisa: quale?
              <input name="goodsType" required placeholder="Es. certificato di nascita, 2 galabeya, kahk della nonna…" />
            </label>
            <label>
              Descrizione precisa dell'oggetto
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Dimensioni, quantità, chi lo consegna al Messenger e dove (città/quartiere)…"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Foto dell'oggetto</legend>
            <FilePicker files={photos} onChange={setPhotos} max={10} accept="image/*" hint="massimo 10 foto" />
          </fieldset>

          <fieldset>
            <legend>Peso e partenza</legend>
            <div className="choice-grid tiers">
              {WEIGHT_TIERS.map((t) => (
                <label key={t.id} className={t.id === tierId ? "choice selected" : "choice"}>
                  <input type="radio" name="tier" checked={t.id === tierId} onChange={() => setTierId(t.id)} />
                  <strong>{t.label}</strong>
                  <span className="choice-price">{formatEur(t.total)}</span>
                </label>
              ))}
            </div>
            <label>
              Da dove parte l'oggetto?
              <select name="departureAirport" required defaultValue="CAI">
                {DEPARTURE_AIRPORTS.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.city} ({a.iata}) – {a.name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <div className="summary">
            <div>
              <span>Totale da pagare</span>
              <strong>{formatEur(tier.total)}</strong>
            </div>
            <small>
              {formatEur(tier.messengerShare)} al Messenger · {formatEur(tier.platformFee)} commissione del sito. Paghi
              solo dopo aver scelto il Messenger.
            </small>
          </div>

          <ConsentFields role="cliente" />

          {error && <p className="alert alert-error">{error}</p>}

          <button className="btn btn-primary btn-block" disabled={sending}>
            {sending ? "Invio in corso…" : "Continua: scegli volo e Messenger →"}
          </button>
        </form>
      </div>
    </section>
  );
}
