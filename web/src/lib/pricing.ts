export type WeightTier = {
  id: string;
  label: string;
  minKg: number;
  maxKg: number;
  /** Prezzo totale pagato dal cliente (EUR). */
  total: number;
  /** Quota che va al passeggero Messenger (EUR). */
  messengerShare: number;
  /** Commissione del sito (EUR). */
  platformFee: number;
};

export const WEIGHT_TIERS: WeightTier[] = [
  { id: "0-5", label: "0 – 5 kg", minKg: 0, maxKg: 5, total: 10, messengerShare: 5, platformFee: 5 },
  { id: "5-15", label: "5 – 15 kg", minKg: 5, maxKg: 15, total: 18, messengerShare: 9, platformFee: 9 },
  { id: "15-20", label: "15 – 20 kg", minKg: 15, maxKg: 20, total: 25, messengerShare: 12.5, platformFee: 12.5 },
  { id: "20-25", label: "20 – 25 kg", minKg: 20, maxKg: 25, total: 30, messengerShare: 15, platformFee: 15 },
];

export function getTier(id: string | null | undefined): WeightTier | undefined {
  return WEIGHT_TIERS.find((t) => t.id === id);
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}
