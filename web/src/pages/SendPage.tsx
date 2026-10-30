import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConsentFields from "../components/ConsentFields";
import FilePicker from "../components/FilePicker";
import RoutePicker from "../components/RoutePicker";
import { errorText, useI18n } from "../i18n";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/catalog";
import { compressImage } from "../lib/image";
import { VAT_RATE, WEIGHT_TIERS, feeVat, getTier } from "../lib/pricing";
import { saveShipment } from "../lib/session";

export default function SendPage() {
  const { t, fmt } = useI18n();
  const s = t.send;
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [tierId, setTierId] = useState(WEIGHT_TIERS[0].id);
  const [route, setRoute] = useState({ from: "CAI", to: "FCO" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const tier = getTier(tierId)!;

  const toggleCategory = (id: string) =>
    setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (categories.length === 0) return setError(t.errors.selectCategories({}));
    if (photos.length === 0) return setError(t.errors.photoRequired({}));

    const form = new FormData(e.currentTarget);
    categories.forEach((c) => form.append("categories", c));
    form.set("tierId", tierId);

    setSending(true);
    try {
      const compressed = await Promise.all(photos.map((p) => compressImage(p)));
      compressed.forEach((p) => form.append("photos", p));
      const summary = await api.createShipment(form);
      saveShipment(summary);
      navigate(`/voli?${new URLSearchParams({ from: summary.departureAirport, to: summary.arrivalAirport ?? "" })}`);
    } catch (err) {
      setError(errorText(err, t));
      setSending(false);
    }
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow dark">{s.step}</p>
        <h1 className="page-title">{s.title}</h1>
        <p className="section-sub left">{s.sub}</p>

        <form className="form card" onSubmit={onSubmit}>
          <fieldset>
            <legend>{s.weightTitle}</legend>
            <RoutePicker
              from={route.from}
              to={route.to}
              onChange={setRoute}
              fromLabel={s.fromLabel}
              toLabel={s.toLabel}
              names={{ from: "departureAirport", to: "arrivalAirport" }}
            />
            <div className="choice-grid tiers">
              {WEIGHT_TIERS.map((w) => (
                <label key={w.id} className={w.id === tierId ? "choice selected" : "choice"}>
                  <input type="radio" name="tier" checked={w.id === tierId} onChange={() => setTierId(w.id)} />
                  <strong>
                    <bdi>{w.label}</bdi>
                  </strong>
                  <span className="choice-price">{fmt.eur(w.total)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{s.yourData}</legend>
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
                {t.fields.age}
                <input name="age" type="number" min={18} max={120} required />
              </label>
              <label>
                {t.fields.phone}
                <input name="phone" type="tel" required autoComplete="tel" placeholder="+…" dir="ltr" />
              </label>
              <label className="span-2">
                {t.fields.email}
                <input name="email" type="email" required autoComplete="email" dir="ltr" />
              </label>
              <label className="span-2">
                {t.fields.address}
                <input name="address" required autoComplete="street-address" placeholder={s.addressPlaceholder} />
              </label>
              <label>
                {t.fields.postalCode}
                <input name="postalCode" required autoComplete="postal-code" />
              </label>
              <label>
                {t.fields.city}
                <input name="city" required autoComplete="address-level2" />
              </label>
              <label className="span-2">
                {t.fields.country}
                <input name="country" required autoComplete="country-name" defaultValue={s.defaultCountry} />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{s.whatToSend}</legend>
            <div className="choice-grid">
              {CATEGORIES.map((c) => (
                <label key={c.id} className={categories.includes(c.id) ? "choice selected" : "choice"}>
                  <input type="checkbox" checked={categories.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  <span className="choice-emoji">{c.emoji}</span>
                  {t.categories[c.id]}
                </label>
              ))}
            </div>
            <label>
              {s.goodsTypeLabel}
              <input name="goodsType" required placeholder={s.goodsTypePlaceholder} />
            </label>
            <label>
              {s.descriptionLabel}
              <textarea name="description" required rows={4} placeholder={s.descriptionPlaceholder} />
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.fields.photos}</legend>
            <FilePicker files={photos} onChange={setPhotos} max={10} accept="image/*" hint={s.photosHint} />
          </fieldset>

          <div className="summary">
            <div>
              <span>{s.total}</span>
              <strong>{fmt.eur(tier.total)}</strong>
            </div>
            <small>
              {s.split(fmt.eur(tier.messengerShare), fmt.eur(tier.platformFee))}{" "}
              ({t.pricing.platformFee}: {t.pricing.vat(VAT_RATE * 100)} {fmt.eur(feeVat(tier.platformFee).vat)})
            </small>
          </div>

          <ConsentFields role="cliente" />

          {error && <p className="alert alert-error">{error}</p>}

          <button className="btn btn-primary btn-block" disabled={sending}>
            {sending ? s.sending : s.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
