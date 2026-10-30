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
  messengerPayouts: number;
};
