import { Link } from "react-router-dom";
import PricingTable from "../components/PricingTable";
import { DISCLAIMER_SHORT } from "../lib/terms";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Il Cairo · Alessandria → Europa</p>
          <h1>Ciò che ami del tuo paese, portato fino a te.</h1>
          <p className="lead">
            Documenti, vestiti, dolci, valigie e oggetti personali: Amanah ti mette in contatto con passeggeri
            verificati che volano dall'Egitto verso l'Europa. Come Uber, ma per le tue cose.
          </p>
          <div className="hero-actions">
            <Link to="/spedisci" className="btn btn-gold">
              Voglio ricevere qualcosa
            </Link>
            <Link to="/messenger" className="btn btn-outline-light">
              Sono un passeggero Messenger 😉
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Come funziona</h2>
          <div className="steps-columns">
            <div className="card">
              <h3>🧑‍💼 Per chi vive in Europa</h3>
              <ol className="steps">
                <li>
                  <strong>Registrati</strong> con i tuoi dati e il tuo indirizzo.
                </li>
                <li>
                  <strong>Descrivi l'oggetto</strong> e carica fino a 10 foto.
                </li>
                <li>
                  <strong>Scegli il volo e il Messenger</strong> dalla tabella dei voli.
                </li>
                <li>
                  <strong>Paga in sicurezza</strong> con Stripe e ricevi subito il contatto del Messenger.
                </li>
              </ol>
            </div>
            <div className="card">
              <h3>✈️ Per i passeggeri Messenger</h3>
              <ol className="steps">
                <li>
                  <strong>Registrati</strong> e carica il tuo documento d'identità.
                </li>
                <li>
                  <strong>Indica il volo</strong> e quanti chili hai disponibili.
                </li>
                <li>
                  <strong>Vieni scelto</strong>: i tuoi contatti restano privati fino al pagamento.
                </li>
                <li>
                  <strong>Guadagna</strong> il 50% di ogni spedizione che porti.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <h2 className="section-title">Prezzi chiari</h2>
          <p className="section-sub">Paghi in base al peso. Metà va al passeggero, metà copre il servizio.</p>
          <PricingTable />
        </div>
      </section>

      <section className="section">
        <div className="container trust">
          <div>
            <span className="trust-icon">🔒</span>
            <h3>Dati protetti</h3>
            <p>Telefono e contatti del Messenger vengono rivelati solo dopo il pagamento.</p>
          </div>
          <div>
            <span className="trust-icon">🪪</span>
            <h3>Passeggeri identificati</h3>
            <p>Ogni Messenger carica un documento d'identità al momento della registrazione.</p>
          </div>
          <div>
            <span className="trust-icon">💳</span>
            <h3>Pagamento sicuro</h3>
            <p>I pagamenti passano da Stripe: il sito non vede mai i dati della tua carta.</p>
          </div>
        </div>
        <div className="container">
          <p className="alert alert-info home-disclaimer">
            ⚖️ {DISCLAIMER_SHORT} <Link to="/condizioni">Leggi le condizioni del servizio</Link>
          </p>
        </div>
      </section>
    </>
  );
}
