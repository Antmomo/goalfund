export const CATEGORIES = [
  { id: "documenti", emoji: "📄" },
  { id: "vestiti", emoji: "👗" },
  { id: "dolci", emoji: "🍯" },
  { id: "valigia", emoji: "🧳" },
  { id: "altro", emoji: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type Region = "africa" | "europe";

type Names = { it: string; en: string; ar: string; fr?: string; es?: string; de?: string };
export type Airport = { iata: string; country: string; region: Region; names: Names };

// [IATA, paese, it, en, ar, fr?, es?, de?]
type Row = [string, string, string, string, string, string?, string?, string?];

const AFRICA: Row[] = [
  ["CAI", "EG", "Il Cairo", "Cairo", "القاهرة", "Le Caire", "El Cairo", "Kairo"],
  ["HBE", "EG", "Alessandria", "Alexandria", "الإسكندرية", "Alexandrie", "Alejandría", "Alexandria"],
  ["HRG", "EG", "Hurghada", "Hurghada", "الغردقة"],
  ["SSH", "EG", "Sharm el-Sheikh", "Sharm el-Sheikh", "شرم الشيخ"],
  ["LXR", "EG", "Luxor", "Luxor", "الأقصر", "Louxor"],
  ["ASW", "EG", "Assuan", "Aswan", "أسوان", "Assouan", "Asuán", "Assuan"],
  ["CMN", "MA", "Casablanca", "Casablanca", "الدار البيضاء"],
  ["RAK", "MA", "Marrakech", "Marrakech", "مراكش", "Marrakech", "Marrakech", "Marrakesch"],
  ["RBA", "MA", "Rabat", "Rabat", "الرباط"],
  ["TNG", "MA", "Tangeri", "Tangier", "طنجة", "Tanger", "Tánger", "Tanger"],
  ["FEZ", "MA", "Fès", "Fez", "فاس", "Fès", "Fez", "Fès"],
  ["AGA", "MA", "Agadir", "Agadir", "أكادير"],
  ["NDR", "MA", "Nador", "Nador", "الناظور"],
  ["OUD", "MA", "Oujda", "Oujda", "وجدة"],
  ["ALG", "DZ", "Algeri", "Algiers", "الجزائر", "Alger", "Argel", "Algier"],
  ["ORN", "DZ", "Orano", "Oran", "وهران", "Oran", "Orán", "Oran"],
  ["CZL", "DZ", "Costantina", "Constantine", "قسنطينة", "Constantine", "Constantina", "Constantine"],
  ["TUN", "TN", "Tunisi", "Tunis", "تونس", "Tunis", "Túnez", "Tunis"],
  ["NBE", "TN", "Enfidha", "Enfidha", "النفيضة"],
  ["MIR", "TN", "Monastir", "Monastir", "المنستير"],
  ["DJE", "TN", "Djerba", "Djerba", "جربة", "Djerba", "Yerba", "Djerba"],
  ["SFA", "TN", "Sfax", "Sfax", "صفاقس"],
  ["MJI", "LY", "Tripoli", "Tripoli", "طرابلس", "Tripoli", "Trípoli", "Tripolis"],
  ["BEN", "LY", "Bengasi", "Benghazi", "بنغازي", "Benghazi", "Bengasi", "Bengasi"],
  ["PZU", "SD", "Port Sudan", "Port Sudan", "بورتسودان", "Port-Soudan", "Puerto Sudán", "Port Sudan"],
  ["ADD", "ET", "Addis Abeba", "Addis Ababa", "أديس أبابا", "Addis-Abeba", "Adís Abeba", "Addis Abeba"],
  ["ASM", "ER", "Asmara", "Asmara", "أسمرة"],
  ["MGQ", "SO", "Mogadiscio", "Mogadishu", "مقديشو", "Mogadiscio", "Mogadiscio", "Mogadischu"],
  ["NBO", "KE", "Nairobi", "Nairobi", "نيروبي"],
  ["DAR", "TZ", "Dar es Salaam", "Dar es Salaam", "دار السلام"],
  ["EBB", "UG", "Entebbe", "Entebbe", "عنتيبي"],
  ["KGL", "RW", "Kigali", "Kigali", "كيغالي"],
  ["DSS", "SN", "Dakar", "Dakar", "داكار"],
  ["BJL", "GM", "Banjul", "Banjul", "بانجول"],
  ["NKC", "MR", "Nouakchott", "Nouakchott", "نواكشوط"],
  ["BKO", "ML", "Bamako", "Bamako", "باماكو"],
  ["OUA", "BF", "Ouagadougou", "Ouagadougou", "واغادوغو", "Ouagadougou", "Uagadugú", "Ouagadougou"],
  ["NIM", "NE", "Niamey", "Niamey", "نيامي"],
  ["CKY", "GN", "Conakry", "Conakry", "كوناكري"],
  ["ABJ", "CI", "Abidjan", "Abidjan", "أبيدجان"],
  ["ACC", "GH", "Accra", "Accra", "أكرا"],
  ["LFW", "TG", "Lomé", "Lomé", "لومي"],
  ["COO", "BJ", "Cotonou", "Cotonou", "كوتونو"],
  ["LOS", "NG", "Lagos", "Lagos", "لاغوس"],
  ["ABV", "NG", "Abuja", "Abuja", "أبوجا"],
  ["DLA", "CM", "Douala", "Douala", "دوالا"],
  ["NSI", "CM", "Yaoundé", "Yaoundé", "ياوندي"],
  ["LBV", "GA", "Libreville", "Libreville", "ليبرفيل"],
  ["BZV", "CG", "Brazzaville", "Brazzaville", "برازافيل"],
  ["FIH", "CD", "Kinshasa", "Kinshasa", "كينشاسا"],
  ["RAI", "CV", "Praia", "Praia", "برايا"],
  ["JNB", "ZA", "Johannesburg", "Johannesburg", "جوهانسبرغ", "Johannesburg", "Johannesburgo", "Johannesburg"],
  ["CPT", "ZA", "Città del Capo", "Cape Town", "كيب تاون", "Le Cap", "Ciudad del Cabo", "Kapstadt"],
  ["MRU", "MU", "Mauritius", "Mauritius", "موريشيوس", "Maurice", "Mauricio", "Mauritius"],
  ["TNR", "MG", "Antananarivo", "Antananarivo", "أنتاناناريفو"],
];

const EUROPE: Row[] = [
  ["FCO", "IT", "Roma Fiumicino", "Rome Fiumicino", "روما فيوميتشينو", "Rome Fiumicino", "Roma Fiumicino", "Rom Fiumicino"],
  ["MXP", "IT", "Milano Malpensa", "Milan Malpensa", "ميلانو مالبينسا", "Milan Malpensa", "Milán Malpensa", "Mailand Malpensa"],
  ["BGY", "IT", "Bergamo", "Bergamo", "برغامو", "Bergame", "Bérgamo", "Bergamo"],
  ["LIN", "IT", "Milano Linate", "Milan Linate", "ميلانو ليناتي", "Milan Linate", "Milán Linate", "Mailand Linate"],
  ["VCE", "IT", "Venezia", "Venice", "البندقية", "Venise", "Venecia", "Venedig"],
  ["BLQ", "IT", "Bologna", "Bologna", "بولونيا", "Bologne", "Bolonia", "Bologna"],
  ["TRN", "IT", "Torino", "Turin", "تورينو", "Turin", "Turín", "Turin"],
  ["NAP", "IT", "Napoli", "Naples", "نابولي", "Naples", "Nápoles", "Neapel"],
  ["PSA", "IT", "Pisa", "Pisa", "بيزا", "Pise", "Pisa", "Pisa"],
  ["CTA", "IT", "Catania", "Catania", "كاتانيا", "Catane", "Catania", "Catania"],
  ["PMO", "IT", "Palermo", "Palermo", "باليرمو", "Palerme", "Palermo", "Palermo"],
  ["CDG", "FR", "Parigi CDG", "Paris CDG", "باريس شارل ديغول", "Paris CDG", "París CDG", "Paris CDG"],
  ["ORY", "FR", "Parigi Orly", "Paris Orly", "باريس أورلي", "Paris Orly", "París Orly", "Paris Orly"],
  ["MRS", "FR", "Marsiglia", "Marseille", "مرسيليا", "Marseille", "Marsella", "Marseille"],
  ["LYS", "FR", "Lione", "Lyon", "ليون", "Lyon", "Lyon", "Lyon"],
  ["NCE", "FR", "Nizza", "Nice", "نيس", "Nice", "Niza", "Nizza"],
  ["FRA", "DE", "Francoforte", "Frankfurt", "فرانكفورت", "Francfort", "Fráncfort", "Frankfurt"],
  ["MUC", "DE", "Monaco di Baviera", "Munich", "ميونخ", "Munich", "Múnich", "München"],
  ["BER", "DE", "Berlino", "Berlin", "برلين", "Berlin", "Berlín", "Berlin"],
  ["DUS", "DE", "Düsseldorf", "Düsseldorf", "دوسلدورف"],
  ["HAM", "DE", "Amburgo", "Hamburg", "هامبورغ", "Hambourg", "Hamburgo", "Hamburg"],
  ["AMS", "NL", "Amsterdam", "Amsterdam", "أمستردام", "Amsterdam", "Ámsterdam", "Amsterdam"],
  ["BRU", "BE", "Bruxelles", "Brussels", "بروكسل", "Bruxelles", "Bruselas", "Brüssel"],
  ["LHR", "GB", "Londra Heathrow", "London Heathrow", "لندن هيثرو", "Londres Heathrow", "Londres Heathrow", "London Heathrow"],
  ["LGW", "GB", "Londra Gatwick", "London Gatwick", "لندن غاتويك", "Londres Gatwick", "Londres Gatwick", "London Gatwick"],
  ["MAN", "GB", "Manchester", "Manchester", "مانشستر"],
  ["MAD", "ES", "Madrid", "Madrid", "مدريد"],
  ["BCN", "ES", "Barcellona", "Barcelona", "برشلونة", "Barcelone", "Barcelona", "Barcelona"],
  ["LIS", "PT", "Lisbona", "Lisbon", "لشبونة", "Lisbonne", "Lisboa", "Lissabon"],
  ["ATH", "GR", "Atene", "Athens", "أثينا", "Athènes", "Atenas", "Athen"],
  ["VIE", "AT", "Vienna", "Vienna", "فيينا", "Vienne", "Viena", "Wien"],
  ["ZRH", "CH", "Zurigo", "Zurich", "زيورخ", "Zurich", "Zúrich", "Zürich"],
  ["GVA", "CH", "Ginevra", "Geneva", "جنيف", "Genève", "Ginebra", "Genf"],
  ["CPH", "DK", "Copenaghen", "Copenhagen", "كوبنهاغن", "Copenhague", "Copenhague", "Kopenhagen"],
  ["ARN", "SE", "Stoccolma", "Stockholm", "ستوكهولم", "Stockholm", "Estocolmo", "Stockholm"],
  ["OSL", "NO", "Oslo", "Oslo", "أوسلو"],
  ["DUB", "IE", "Dublino", "Dublin", "دبلن", "Dublin", "Dublín", "Dublin"],
  ["WAW", "PL", "Varsavia", "Warsaw", "وارسو", "Varsovie", "Varsovia", "Warschau"],
  ["PRG", "CZ", "Praga", "Prague", "براغ", "Prague", "Praga", "Prag"],
];

const toAirport =
  (region: Region) =>
  ([iata, country, it, en, ar, fr, es, de]: Row): Airport => ({ iata, country, region, names: { it, en, ar, fr, es, de } });

export const AIRPORTS: Airport[] = [...AFRICA.map(toAirport("africa")), ...EUROPE.map(toAirport("europe"))];

const BY_IATA = new Map(AIRPORTS.map((a) => [a.iata, a]));

export function getAirport(iata: string | null | undefined): Airport | undefined {
  return iata ? BY_IATA.get(iata) : undefined;
}

export function airportsIn(region: Region): Airport[] {
  return AIRPORTS.filter((a) => a.region === region);
}

export function oppositeRegion(region: Region): Region {
  return region === "africa" ? "europe" : "africa";
}

/** Nome della città nella lingua scelta (in mancanza, in inglese; per aeroporti sconosciuti, il codice). */
export function airportName(iata: string, lang = "it"): string {
  const a = BY_IATA.get(iata);
  return a ? (a.names[lang as keyof Names] ?? a.names.en) : iata;
}

/** Una tratta valida va dall'Africa all'Europa o dall'Europa all'Africa. */
export function isValidRoute(from: string, to: string): boolean {
  const a = BY_IATA.get(from);
  const b = BY_IATA.get(to);
  return !!a && !!b && a.region !== b.region;
}

export const EUROPE_COUNTRY_CODES = new Set([
  "AL", "AT", "BA", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR",
  "HR", "HU", "IE", "IS", "IT", "LT", "LU", "LV", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO",
  "RS", "SE", "SI", "SK",
]);

export const AFRICA_COUNTRY_CODES = new Set([
  "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EG", "ER", "ET",
  "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU",
  "MW", "MZ", "NA", "NE", "NG", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG",
  "TN", "TZ", "UG", "ZA", "ZM", "ZW",
]);

export function regionOfCountry(country: string): Region | undefined {
  if (EUROPE_COUNTRY_CODES.has(country)) return "europe";
  if (AFRICA_COUNTRY_CODES.has(country)) return "africa";
  return undefined;
}

export function normalizeFlightNumber(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}
