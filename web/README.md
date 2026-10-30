# Amanah – sito web

Piattaforma che mette in contatto clienti e passeggeri ("Messenger") che volano tra l'Africa e l'Europa,
in entrambi i sensi, e portano documenti, vestiti, dolci e oggetti personali.

Lingue: arabo (da destra a sinistra), tedesco, inglese, spagnolo, francese e italiano. La lingua si sceglie
dal menu in alto, viene ricordata nel browser e all'inizio segue quella del dispositivo.

## Flusso

1. **Cliente** (`/spedisci`): tratta ("da dove" in Africa o in Europa, "verso dove" nell'altro continente),
   fascia di peso, dati personali (18+), indirizzo e CAP, categorie, merce precisa, descrizione, 1–10 foto.
2. **Voli & Messenger** (`/voli`): tabella delle partenze del giorno verso l'altro continente e Messenger
   disponibili. Si può pagare solo un Messenger con la stessa partenza e lo stesso paese di arrivo.
   Il cliente sceglie un Messenger e paga con Stripe Checkout.
3. **Pagamento riuscito** (`/pagamento/successo`): il server verifica il pagamento su Stripe e solo allora
   mostra telefono, WhatsApp ed email del Messenger.
4. **Messenger** (`/messenger`): dati, documento d'identità (privato), volo, data e kg disponibili.
5. **Admin** (`/admin`, non collegato dal menu): accesso con password, verifica dei Messenger
   (documenti, approva / rifiuta con motivo / rimetti in verifica), elenco spedizioni con foto e dati cliente,
   riepilogo incassi, commissioni e quote da pagare ai Messenger.
   I Messenger rifiutati spariscono dall'elenco pubblico e non possono essere pagati.

## Tariffe (`src/lib/pricing.ts`)

| Peso     | Totale  | Messenger | Sito    |
|----------|---------|-----------|---------|
| 0–5 kg   | 9,99 €  | 5 €       | 4,99 €  |
| 5–15 kg  | 17,99 € | 9 €       | 8,99 €  |
| 15–20 kg | 24,99 € | 12,50 €   | 12,49 € |
| 20–25 kg | 29,99 € | 15 €      | 14,99 € |

La commissione del sito è IVA inclusa (22%, `VAT_RATE`). `feeVat()` la scorpora al centesimo:
0,90 € · 1,62 € · 2,25 € · 2,70 € di IVA per fascia. Imponibile e IVA sono salvati nei metadati
di ogni pagamento Stripe e sommati nel pannello admin ("IVA da versare").

## Traduzioni

I testi sono in `src/i18n/` (un file per lingua). `it.ts` è il riferimento: TypeScript segnala ogni testo
mancante nelle altre lingue. Il server risponde agli errori con un codice (`code`) che il sito traduce.
Il pannello admin resta in italiano. Aeroporti e nomi delle città sono in `src/lib/catalog.ts`.

## Architettura

- Frontend: React + Vite + TypeScript (`src/`).
- Backend: Netlify Functions (`netlify/functions/`), dati e file in Netlify Blobs (foto e documenti privati,
  mai esposti pubblicamente).
- Pagamenti: Stripe Checkout. Prezzo calcolato lato server.
- Voli: AeroDataBox (RapidAPI) se è impostata `AERODATABOX_API_KEY`, altrimenti un orario dimostrativo.

## Variabili d'ambiente

Vedi `.env.example`: `STRIPE_SECRET_KEY` (obbligatoria per i pagamenti), `ADMIN_PASSWORD` (obbligatoria per
`/admin`), `ADMIN_SESSION_SECRET` e `AERODATABOX_API_KEY` (facoltative).

## Sviluppo locale

```bash
cd web
npm install
npx netlify-cli dev   # dalla radice del repository: sito + funzioni su http://localhost:8888
```

## Deploy

Collegare il repository a Netlify: il file `netlify.toml` nella radice imposta `web/` come base,
`npm run build` come comando e `dist` come cartella pubblicata.
