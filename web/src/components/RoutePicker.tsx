import { useI18n } from "../i18n";
import { getAirport, oppositeRegion } from "../lib/catalog";
import AirportSelect from "./AirportSelect";

type Props = {
  from: string;
  to: string;
  onChange: (route: { from: string; to: string }) => void;
  fromLabel: string;
  toLabel: string;
  names?: { from: string; to: string };
};

export const DEFAULT_DESTINATION = { africa: "CAI", europe: "FCO" } as const;

/** Due caselle: "da dove" (Africa o Europa) e "verso dove" (sempre l'altro continente). */
export default function RoutePicker({ from, to, onChange, fromLabel, toLabel, names }: Props) {
  const { t } = useI18n();
  const fromRegion = getAirport(from)?.region ?? "africa";
  const toRegion = oppositeRegion(fromRegion);

  const changeFrom = (next: string) => {
    const nextRegion = getAirport(next)?.region ?? "africa";
    const keepTo = getAirport(to)?.region === oppositeRegion(nextRegion);
    onChange({ from: next, to: keepTo ? to : DEFAULT_DESTINATION[oppositeRegion(nextRegion)] });
  };

  return (
    <div className="grid-2 route">
      <label>
        {fromLabel}
        <AirportSelect name={names?.from} value={from} onChange={changeFrom} regions={["africa", "europe"]} />
      </label>
      <label>
        <span>
          {toLabel} <small className="muted">({t.regions[toRegion]})</small>
        </span>
        <AirportSelect name={names?.to} value={to} onChange={(next) => onChange({ from, to: next })} regions={[toRegion]} />
      </label>
    </div>
  );
}
