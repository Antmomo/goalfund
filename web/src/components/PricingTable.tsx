import { WEIGHT_TIERS, formatEur } from "../lib/pricing";

export default function PricingTable() {
  return (
    <div className="pricing-grid">
      {WEIGHT_TIERS.map((t) => (
        <div key={t.id} className="price-card">
          <div className="price-weight">{t.label}</div>
          <div className="price-total">{formatEur(t.total)}</div>
          <ul>
            <li>
              <span>Al Messenger</span> <strong>{formatEur(t.messengerShare)}</strong>
            </li>
            <li>
              <span>Commissione sito</span> <strong>{formatEur(t.platformFee)}</strong>
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
}
