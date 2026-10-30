import { useI18n } from "../i18n";
import { flightTrackerUrl } from "../lib/catalog";

/** Link a Flightradar24 per seguire il volo dal vivo. */
export default function TrackFlight({ flightNumber }: { flightNumber?: string }) {
  const { t } = useI18n();
  if (!flightNumber) return null;
  return (
    <a
      className="track-link"
      href={flightTrackerUrl(flightNumber)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {t.flights.track}
    </a>
  );
}
