import { Link } from "react-router-dom";

/** Le due accettazioni obbligatorie: condizioni generali e approvazione specifica delle clausole di responsabilità. */
export default function ConsentFields({ role }: { role: "cliente" | "messenger" }) {
  return (
    <>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          {role === "cliente"
            ? "Dichiaro che l'oggetto non contiene merci vietate o pericolose. "
            : "Mi impegno a controllare il contenuto di ogni oggetto prima di accettarlo e a non trasportare merci vietate. "}
          Ho letto e accetto le{" "}
          <Link to="/condizioni" target="_blank">
            condizioni del servizio
          </Link>{" "}
          e il trattamento dei miei dati.
        </span>
      </label>
      <label className="consent consent-strong">
        <input type="checkbox" name="liabilityConsent" required />
        <span>
          Ai sensi degli artt. 1341 e 1342 del Codice Civile approvo specificamente le clausole{" "}
          <Link to="/condizioni#responsabilita" target="_blank">
            3 (responsabilità sulla merce), 4 (merci vietate) e 5 (limitazione di responsabilità)
          </Link>
          : <strong>Amanah mette solo in contatto cliente e Messenger e non è responsabile del tipo di merce né di
          qualsiasi evento successivo alla messa in contatto.</strong>
        </span>
      </label>
    </>
  );
}
