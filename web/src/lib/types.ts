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
  photoKeys: string[];
  messengerId?: string;
  stripeSessionId?: string;
  paidAt?: string;
};

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
  toName: string;
  departureLocal: string;
  status?: string;
};

export type FlightsResponse = {
  source: "live" | "demo";
  notice?: string;
  flights: Flight[];
};

/** Riepilogo salvato nel browser del cliente dopo la registrazione della spedizione. */
export type ShipmentSummary = {
  id: string;
  tierId: string;
  departureAirport: string;
  goodsType: string;
};
