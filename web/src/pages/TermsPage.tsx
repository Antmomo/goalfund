import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TERMS_VERSION } from "../lib/terms";

export default function TermsPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView();
  }, [hash]);

  return (
    <section className="section">
      <div className="container narrow terms">
        <p className="eyebrow dark">Condizioni del servizio</p>
        <h1 className="page-title">Regole e responsabilità</h1>
        <p className="muted">Versione del {TERMS_VERSION.split("-").reverse().join("/")}</p>

        <div className="terms-highlight">
          <strong>In breve:</strong> Amanah è solo una piattaforma che mette in contatto chi ha bisogno di ricevere
          qualcosa (il <em>cliente</em>) con un passeggero che viaggia (il <em>Messenger</em>). Amanah non trasporta,
          non controlla e non custodisce la merce, e <strong>non è legalmente responsabile</strong> del tipo di merce
          né di qualsiasi evento che avvenga al di fuori della messa in contatto tra cliente e Messenger.
        </div>

        <h2>1. Cosa fa Amanah</h2>
        <p>
          Amanah offre un servizio tecnologico di messa in contatto: permette al cliente di pubblicare una richiesta e
          di scegliere un Messenger, e, dopo il pagamento, comunica al cliente i contatti del Messenger. Il servizio di
          Amanah si conclude con la comunicazione dei contatti.
        </p>
        <p>
          Amanah <strong>non è</strong> un vettore, uno spedizioniere, un corriere né un agente doganale. Non entra mai
          in possesso degli oggetti, non li ispeziona, non li imballa e non partecipa alla consegna. Gli accordi su
          ritiro, consegna, orari e modalità sono presi direttamente e liberamente tra cliente e Messenger.
        </p>

        <h2>2. Ruolo del cliente e del Messenger</h2>
        <p>
          Il trasporto avviene sulla base di un accordo diretto tra cliente e Messenger, che agiscono come privati e
          in piena autonomia. Il Messenger ha sempre il diritto di vedere, aprire e controllare il contenuto prima di
          accettarlo, e di rifiutarlo senza dover dare spiegazioni.
        </p>

        <h2 id="responsabilita">3. Responsabilità sulla merce</h2>
        <p>
          <strong>Il cliente</strong> è l'unico responsabile del contenuto, della descrizione, della provenienza e
          della legalità degli oggetti, e del rispetto delle leggi del paese di partenza e di quello di arrivo
          (dogana, dazi, limiti di importazione).
        </p>
        <p>
          <strong>Il Messenger</strong> è l'unico responsabile di ciò che decide di trasportare nel proprio bagaglio e
          di quanto dichiara alle autorità doganali e alla compagnia aerea.
        </p>

        <h2>4. Merci vietate</h2>
        <p>È vietato chiedere o accettare il trasporto di, a titolo di esempio:</p>
        <ul>
          <li>droghe, medicinali senza prescrizione, sostanze stupefacenti o psicotrope;</li>
          <li>armi, munizioni, esplosivi, fuochi d'artificio, oggetti affilati non consentiti in aereo;</li>
          <li>denaro contante, oro, gioielli di valore, titoli o carte di pagamento di terzi;</li>
          <li>carne, latte, latticini e altri prodotti di origine animale (vietati per i privati in ingresso nell'UE),
            piante, semi e terra;</li>
          <li>sostanze infiammabili, gas, batterie al litio sciolte e merci pericolose;</li>
          <li>merci contraffatte, oggetti rubati, beni culturali o reperti archeologici;</li>
          <li>qualsiasi oggetto vietato dalla compagnia aerea o dalle leggi egiziane o del paese di arrivo;</li>
          <li>pacchi chiusi di cui il Messenger non può verificare il contenuto.</li>
        </ul>
        <p>Amanah può sospendere o cancellare gli account di chi viola queste regole e collaborare con le autorità.</p>

        <h2>5. Limitazione di responsabilità</h2>
        <p>Nei limiti massimi consentiti dalla legge, Amanah non è responsabile, in nessun caso, per:</p>
        <ul>
          <li>il tipo, il contenuto, il valore, la qualità o la legalità della merce;</li>
          <li>smarrimento, furto, danneggiamento, deterioramento o mancata consegna degli oggetti;</li>
          <li>ritardi, cancellazioni o modifiche dei voli e regole sul bagaglio delle compagnie aeree;</li>
          <li>controlli, sequestri, multe, dazi o tasse applicati dalle autorità doganali o di polizia;</li>
          <li>comportamenti, dichiarazioni, inadempimenti o accordi tra cliente e Messenger;</li>
          <li>qualsiasi altro evento che avvenga al di fuori della messa in contatto tra cliente e Messenger.</li>
        </ul>
        <p>
          La verifica dei documenti dei Messenger riguarda solo l'identità dichiarata e non costituisce una garanzia
          sul loro comportamento. Gli orari dei voli mostrati sul sito sono indicativi: vanno sempre confermati con la
          compagnia aerea. Restano salvi i casi di dolo o colpa grave di Amanah e i diritti che la legge riconosce al
          consumatore e che non possono essere esclusi.
        </p>

        <h2>6. Pagamento</h2>
        <p>
          Il cliente paga tramite Stripe il prezzo indicato in base al peso. L'importo comprende il compenso del
          Messenger e la commissione di Amanah per il servizio di messa in contatto. Amanah non conserva i dati della
          carta di pagamento.
        </p>

        <h2>7. Dati personali</h2>
        <p>
          I contatti del Messenger vengono comunicati al cliente solo dopo il pagamento. I documenti d'identità e le
          foto degli oggetti sono conservati in modo riservato e usati solo per la gestione del servizio e le
          verifiche.
        </p>

        <h2>8. Accettazione</h2>
        <p>
          Registrandosi come cliente o come Messenger, l'utente accetta queste condizioni e, ai sensi degli artt. 1341
          e 1342 del Codice Civile, approva specificamente le clausole 3, 4 e 5.
        </p>
      </div>
    </section>
  );
}
