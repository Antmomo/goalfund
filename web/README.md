# Amanah – sito web

Piattaforma che mette in contatto chi vive in Europa con passeggeri ("Messenger") che volano dal Cairo (CAI)
o da Alessandria (HBE) verso l'Europa e portano documenti, vestiti, dolci e oggetti personali.

## Flusso

1. **Cliente** (`/spedisci`): dati personali (18+), indirizzo e CAP, categorie, merce precisa, descrizione,
   1–10 foto, fascia di peso e aeroporto di partenza.
2. **Voli & Messenger** (`/voli`): tabella delle partenze del giorno verso l'Europa e Messenger disponibili.
   Il cliente sceglie un Messenger e paga con Stripe Checkout.
3. **Pagamento riuscito** (`/pagamento/successo`): il server verifica il pagamento su Stripe e solo allora
   mostra telefono, WhatsApp ed email del Messenger.
4. **Messenger** (`/messenger`): dati, documento d'identità (privato), volo, data e kg disponibili.

## Tariffe (`src/lib/pricing.ts`)

| Peso     | Totale | Messenger | Sito   |
|----------|--------|-----------|--------|
| 0–5 kg   | 10 €   | 5 €       | 5 €    |
| 5–15 kg  | 18 €   | 9 €       | 9 €    |
| 15–20 kg | 25 €   | 12,50 €   | 12,50 €|
| 20–25 kg | 30 €   | 15 €      | 15 €   |

## Architettura

- Frontend: React + Vite + TypeScript (`src/`).
- Backend: Netlify Functions (`netlify/functions/`), dati e file in Netlify Blobs (foto e documenti privati,
  mai esposti pubblicamente).
- Pagamenti: Stripe Checkout. Prezzo calcolato lato server.
- Voli: AeroDataBox (RapidAPI) se è impostata `AERODATABOX_API_KEY`, altrimenti un orario dimostrativo.

## Variabili d'ambiente

Vedi `.env.example`: `STRIPE_SECRET_KEY` (obbligatoria per i pagamenti), `AERODATABOX_API_KEY` (facoltativa).

## Sviluppo locale

```bash
cd web
npm install
npx netlify-cli dev   # dalla radice del repository: sito + funzioni su http://localhost:8888
```

## Deploy

Collegare il repository a Netlify: il file `netlify.toml` nella radice imposta `web/` come base,
`npm run build` come comando e `dist` come cartella pubblicata.
