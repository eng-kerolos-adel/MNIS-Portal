import type { Medication } from "@/types/domain";

/** A small catalogue used when a screen lets staff add a new line item
 * (e-prescription, dispensing) — cycled through for the mock demo. */
export const medicationSeed: Omit<Medication, "id">[] = [
  { name: { en: "Losartan", ar: "لوسارتان" }, form: { en: "Tablet", ar: "أقراص" }, dose: "50mg", frequency: { en: "Once daily", ar: "مرة يومياً" }, durationDays: 30, quantity: 30, substitutionAllowed: true, stockStatus: "in-stock", unitPrice: 4.1 },
  { name: { en: "Paracetamol", ar: "باراسيتامول" }, form: { en: "Tablet", ar: "أقراص" }, dose: "500mg", frequency: { en: "Every 6 hours as needed", ar: "كل 6 ساعات عند اللزوم" }, durationDays: 5, quantity: 20, substitutionAllowed: true, stockStatus: "in-stock", unitPrice: 0.9 },
  { name: { en: "Omeprazole", ar: "أوميبرازول" }, form: { en: "Capsule", ar: "كبسولات" }, dose: "20mg", frequency: { en: "Once daily before breakfast", ar: "مرة يومياً قبل الإفطار" }, durationDays: 14, quantity: 14, substitutionAllowed: true, stockStatus: "low", unitPrice: 3.4 },
  { name: { en: "Clopidogrel", ar: "كلوبيدوجريل" }, form: { en: "Tablet", ar: "أقراص" }, dose: "75mg", frequency: { en: "Once daily", ar: "مرة يومياً" }, durationDays: 30, quantity: 30, substitutionAllowed: false, stockStatus: "in-stock", unitPrice: 6.2 },
];
