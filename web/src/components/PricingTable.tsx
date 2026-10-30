import { useI18n } from "../i18n";
import { WEIGHT_TIERS } from "../lib/pricing";

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
          </ul>
        </div>
      ))}
    </div>
  );
}
