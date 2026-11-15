import type { Locale } from "@/lib/i18n/translations";

/** Format a number using tabular, locale-aware digits. Arabic uses Western
 * (Latin) numerals throughout the app on purpose — this mirrors how national
 * ID numbers, dosages and lab values are actually rendered in Egyptian
 * clinical systems for cross-script scannability. */
export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US").format(value);
}

export function formatDate(value: Date | string, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatTime(value: Date | string, locale: Locale) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Renders a bilingual field, choosing the string for the active locale. */
export function pick<T extends { en: string; ar: string }>(field: T, locale: Locale): string {
  return field[locale];
}

/**
 * Universal patient search matcher: matches by Arabic name, English name,
 * National Medical Identity Token (MTI), 14-digit National ID (full or partial),
 * and any additional identifiers (ticketNo, barcode, rxCode, etc.).
 */
export function matchesPatientQuery(
  patient: { fullName?: { en?: string; ar?: string }; mti?: string; nationalId?: string } | null | undefined,
  query: string,
  ...extraFields: (string | undefined | null)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks: string[] = [
    patient?.fullName?.ar ?? "",
    patient?.fullName?.en ?? "",
    patient?.mti ?? "",
    patient?.nationalId ?? "",
    ...extraFields.map((x) => x ?? ""),
  ];
  return haystacks.some((h) => h.toLowerCase().includes(q));
}
