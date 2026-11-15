/** Shared domain types for the MNIS mock data layer.
 * Bilingual fields carry both an English and Arabic string so every screen
 * renders fully localized data, not just localized UI chrome. */

export type Bilingual = { en: string; ar: string };

export type Sex = "male" | "female";

export type AcuityLevel = 1 | 2 | 3 | 4 | 5; // 1 = most critical (ESI-style)

export interface NationalIdentity {
  mti: string; // Medical Identity Token, e.g. 01-05-2001-347-9
  nationalId: string; // 14-digit Egyptian national ID
  fullName: Bilingual;
  sex: Sex;
  age: number;
  bloodType: string;
  photoUrl: string;
  address: Bilingual;
  insuranceActive: boolean;
  chronicConditions: Bilingual[];
  allergies: Bilingual[];
  organDonor: boolean;
}

export interface QueueTicket {
  id: string;
  patient: NationalIdentity;
  ticketNo: string;
  arrivalTime: string; // ISO
  reason: Bilingual;
  status: "waiting" | "in-consultation" | "completed" | "no-show";
  isEmergency: boolean;
  waitMinutes: number;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  weightKg?: number;
  heightCm?: number;
}

export interface Medication {
  id: string;
  name: Bilingual;
  form: Bilingual;
  dose: string;
  frequency: Bilingual;
  durationDays: number;
  quantity: number;
  substitutionAllowed: boolean;
  stockStatus: "in-stock" | "low" | "out-of-stock";
  unitPrice: number;
}

export interface Prescription {
  id: string;
  patient: NationalIdentity;
  physician: Bilingual;
  physicianLicense: string;
  createdAt: string;
  diagnosis: Bilingual;
  icd10: string;
  medications: Medication[];
  signed: boolean;
  status: "draft" | "signed" | "verified" | "dispensed" | "partially-dispensed" | "rejected";
}

export interface LabSample {
  id: string;
  barcode: string;
  patient: NationalIdentity;
  testPanel: Bilingual;
  sampleType: Bilingual;
  orderedBy: Bilingual;
  collectedAt: string;
  priority: "routine" | "urgent" | "stat";
  status: "awaiting-collection" | "in-transit" | "received" | "processing" | "results-entered" | "verified" | "rejected";
  results?: LabResultRow[];
}

export interface LabResultRow {
  id: string;
  analyte: Bilingual;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  flag: "normal" | "low" | "high" | "critical";
}

export interface LabResultPanel {
  id: string;
  sample: LabSample;
  rows: LabResultRow[];
  verified: boolean;
  entered?: boolean;
  verifiedBy?: Bilingual;
}

export interface Bed {
  id: string;
  ward: Bilingual;
  bedNumber: string;
  status: "available" | "occupied" | "cleaning" | "reserved" | "maintenance";
  patient?: NationalIdentity;
  acuity?: AcuityLevel;
  admittedAt?: string;
  equipment: Bilingual[];
}

export interface ERCase {
  id: string;
  patient: NationalIdentity;
  arrivalMode: Bilingual;
  arrivedAt: string;
  chiefComplaint: Bilingual;
  acuity: AcuityLevel;
  vitals: VitalSigns;
  status: "triage" | "in-treatment" | "awaiting-bed" | "admitted" | "discharged" | "referred";
  assignedArea: Bilingual;
}

export interface KPI {
  id: string;
  label: Bilingual;
  value: number;
  unit?: string;
  delta: number; // percentage change
  trend: number[]; // sparkline data
  status?: "good" | "warning" | "critical";
}

export interface GovernorateCoverage {
  id: string;
  name: Bilingual;
  coveragePct: number;
  population: number;
  facilities: number;
  alert: boolean;
}
