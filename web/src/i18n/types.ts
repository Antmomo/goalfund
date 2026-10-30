export const LANGS = [
  { code: "ar", label: "العربية", locale: "ar-EG-u-nu-latn", dir: "rtl" },
  { code: "de", label: "Deutsch", locale: "de-DE", dir: "ltr" },
  { code: "en", label: "English", locale: "en-GB", dir: "ltr" },
  { code: "es", label: "Español", locale: "es-ES", dir: "ltr" },
  { code: "fr", label: "Français", locale: "fr-FR", dir: "ltr" },
  { code: "it", label: "Italiano", locale: "it-IT", dir: "ltr" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

export function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l.code === value);
}

export const ERROR_CODES = [
  "methodNotAllowed",
  "required",
  "tooLong",
  "invalidEmail",
  "invalidPhone",
  "invalidDate",
  "minFiles",
  "maxFiles",
  "badFormat",
  "fileTooLarge",
  "terms",
  "liability",
  "minAge",
  "selectCategories",
  "selectTier",
  "selectDeparture",
  "selectArrival",
  "pastDate",
  "availableKg",
  "saveFailed",
  "serverError",
  "paymentsNotConfigured",
  "missingIds",
  "shipmentNotFound",
  "messengerNotFound",
  "messengerUnavailable",
  "alreadyPaid",
  "invalidTier",
  "flightDeparted",
  "airportMismatch",
  "destinationMismatch",
  "invalidRoute",
  "notEnoughSpace",
  "missingSession",
  "sessionNotFound",
  "notPaid",
  "sessionMismatch",
  "unsupportedAirport",
  "adminNotConfigured",
  "sessionExpired",
  "wrongPassword",
  "invalidRequest",
  "fileNotFound",
  "network",
  "generic",
  "photoRequired",
  "documentRequired",
  "paymentNotStarted",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Parametri degli errori: `field` è una chiave di FieldKey, tradotta dal dizionario. */
export type ErrParams = { field?: string; n?: number; name?: string };

export type Errors = Record<ErrorCode, (p: ErrParams) => string>;

export type FieldKey =
  | "firstName"
  | "lastName"
  | "age"
  | "address"
  | "postalCode"
  | "city"
  | "country"
  | "email"
  | "phone"
  | "goodsType"
  | "description"
  | "photos"
  | "documents"
  | "flightDate";

export type Fields = Record<FieldKey, string>;

export type TermsSection = { id?: string; title: string; paras?: string[]; list?: string[]; after?: string[] };
