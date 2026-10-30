import { useI18n } from "../i18n";
import { VAT_RATE, WEIGHT_TIERS, feeVat } from "../lib/pricing";

export default function PricingTable() {
  const { t, fmt } = useI18n();
  return (
    <div className="pricing-grid">
      {WEIGHT_TIERS.map((tier) => (
        <div key={tier.id} className="price-card">
          <div className="price-weight">
            <bdi>{tier.label}</bdi>
          </div>
          <div className="price-total">{fmt.eur(tier.total)}</div>
          <ul>
            <li>
              <span>{t.pricing.toMessenger}</span> <strong>{fmt.eur(tier.messengerShare)}</strong>
            </li>
            <li>
              <span>{t.pricing.platformFee}</span> <strong>{fmt.eur(tier.platformFee)}</strong>
            </li>
            <li className="vat-row">
              <span>{t.pricing.vat(VAT_RATE * 100)}</span> <span>{fmt.eur(feeVat(tier.platformFee).vat)}</span>
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
}
