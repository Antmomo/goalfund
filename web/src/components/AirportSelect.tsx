import { useI18n } from "../i18n";
import { airportsIn, countryFlag, type Region } from "../lib/catalog";

type Props = {
  name?: string;
  value: string;
  onChange: (iata: string) => void;
  regions: Region[];
  /** Testo della prima opzione vuota (es. "Tutte le destinazioni"); se assente la scelta è obbligatoria. */
  emptyLabel?: string;
};

export default function AirportSelect({ name, value, onChange, regions, emptyLabel }: Props) {
  const { t, fmt } = useI18n();
  return (
    <select name={name} value={value} required={!emptyLabel} onChange={(e) => onChange(e.target.value)}>
      {emptyLabel && <option value="">{emptyLabel}</option>}
      {regions.map((region) => (
        <optgroup key={region} label={t.regions[region]}>
          {airportsIn(region).map((a) => (
            <option key={a.iata} value={a.iata}>
              {countryFlag(a.country)} {fmt.airport(a.iata)} ({a.iata})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
