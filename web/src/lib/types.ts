import type { TermsAcceptance } from "./terms";

export type ShipmentStatus = "in_attesa" | "pagata";

export type Shipment = {
  id: string;
  createdAt: string;
  status: ShipmentStatus;
  client: {
    firstName: string;
    lastName: string;
    age: number;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    email: string;
    phone: string;
  };
  categories: string[];
  goodsType: string;
  description: string;
  tierId: string;
  departureAirport: string;
  /** Assente nelle spedizioni registrate prima delle tratte Africa ⇄ Europa. */
  arrivalAirport?: string;
  photoKeys: string[];
  terms?: TermsAcceptance;
  messengerId?: string;
  stripeSessionId?: string;
  paidAt?: string;
  /** Lingua del cliente, per le email. */
  lang?: string;
  /** Avanzamento dell'ordine dopo il pagamento. */
  order?: Order;
};

export type Review = { rating: number; comment?: string; createdAt: string };

export type PayoutStatus = "in_attesa" | "da_pagare" | "pagato";

export type Order = {
  /** Link segreti personali, inviati per email a cliente e Messenger. */
  clientToken: string;
  messengerToken: string;
  /** Il cliente conferma i requisiti e il dovere di mostrare la merce. */
  clientAcceptedAt?: string;
  /** Il Messenger ha controllato e imballato la merce in presenza del cliente e l'ha ritirata. */
  pickedUpAt?: string;
  /** Il cliente conferma di aver ricevuto la merce: il pagamento al Messenger viene sbloccato. */
  deliveredAt?: string;
  payout: PayoutStatus;
  payoutPaidAt?: string;
  reviews: { byClient?: Review; byMessenger?: Review };
  emailsSentAt?: string;
};

export type OrderStage = "pagato" | "confermato" | "ritirato" | "consegnato";

export function orderStage(order: Order): OrderStage {
  if (order.deliveredAt) return "consegnato";
  if (order.pickedUpAt) return "ritirato";
  if (order.clientAcceptedAt) return "confermato";
  return "pagato";
}

/** Ciò che vede chi apre il link personale dell'ordine (cliente o Messenger). */
export type OrderView = {
  role: "client" | "messenger";
  code: string;
  stage: OrderStage;
  goodsType: string;
  description: string;
  categories: string[];
  tierId: string;
  route: { from: string; to: string; date: string; flightNumber?: string };
  counterpart: { name: string; phone: string; email: string; address?: string };
  order: Pick<Order, "clientAcceptedAt" | "pickedUpAt" | "deliveredAt" | "payout">;
  myReview?: Review;
  theirReview?: Review;
};

export type MessengerStatus = "in_verifica" | "verificato" | "rifiutato";

export type Messenger = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  documentKeys: string[];
  flight: { from: string; to: string; date: string; flightNumber?: string };
  availableKg: number;
  verified: boolean;
  terms?: TermsAcceptance;
  lang?: string;
  /** Somma e numero dei voti ricevuti dai clienti. */
  ratingTotal?: number;
  ratingCount?: number;
  /** Assente nei Messenger registrati prima del pannello admin: vedi messengerStatus(). */
  status?: MessengerStatus;
  reviewedAt?: string;
  rejectionReason?: string;
};

/** Dati del Messenger visibili a tutti: niente telefono, email o documenti. */
export type PublicMessenger = {
  id: string;
  displayName: string;
  flight: Messenger["flight"];
  availableKg: number;
  verified: boolean;
  rating?: { average: number; count: number };
};

export type Flight = {
  flightNumber: string;
  airline: string;
  from: string;
  to: string;
  /** Nome fornito dall'API voli, usato se l'aeroporto non è nel catalogo. */
  toName: string;
  departureLocal: string;
  status?: string;
};

export type FlightsResponse = {
  source: "live" | "demo";
  notice?: "demo" | "liveUnavailable" | "demoMissing";
  flights: Flight[];
};

/** Riepilogo salvato nel browser del cliente dopo la registrazione della spedizione. */
export type ShipmentSummary = {
  id: string;
  tierId: string;
  departureAirport: string;
  arrivalAirport?: string;
  goodsType: string;
};

export function messengerStatus(m: Pick<Messenger, "status" | "verified">): MessengerStatus {
  return m.status ?? (m.verified ? "verificato" : "in_verifica");
}

/** Messenger con tutti i dati, visibile solo all'amministratore. */
export type AdminMessenger = Messenger & { status: MessengerStatus };

export type AdminShipment = Shipment & { messengerName?: string };

export type AdminStats = {
  messengersPending: number;
  messengersVerified: number;
  shipmentsWaiting: number;
  shipmentsPaid: number;
  revenueTotal: number;
  platformFees: number;
  /** Commissioni al netto dell'IVA. */
  platformFeesNet: number;
  /** IVA contenuta nelle commissioni, da versare. */
  vatDue: number;
  /** Quote dei Messenger con consegna confermata, ancora da pagare. */
  messengerPayouts: number;
  /** Quote dei Messenger già pagate. */
  messengerPaidOut: number;
};
