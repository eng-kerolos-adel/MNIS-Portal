/**
 * Data layer: talks to the MNIS API and maps its flat/UPPER_CASE responses into the
 * bilingual domain types the screens already use. Screens never see raw API shapes.
 */
import { request } from "@/lib/api/client";
import { PORTRAITS } from "@/lib/assets";
import type {
  Bed, Bilingual, ERCase, LabResultPanel, LabResultRow, LabSample, Medication,
  NationalIdentity, Prescription, QueueTicket,
} from "@/types/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

const b = (en?: string | null, ar?: string | null): Bilingual => ({ en: en ?? ar ?? "", ar: ar ?? en ?? "" });
const kebab = (s: string) => s.toLowerCase().replace(/_/g, "-");
const upper = (s: string) => s.toUpperCase().replace(/-/g, "_");
const minutesSince = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
const ageOf = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 31_557_600_000));

function avatar(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PORTRAITS[h % PORTRAITS.length]!;
}

const bilingualList = (v: unknown): Bilingual[] =>
  Array.isArray(v) ? v.map((x: Raw) => b(x?.en, x?.ar)) : [];

export function mapPatient(p: Raw): NationalIdentity {
  return {
    mti: p.mti,
    nationalId: p.nationalId ?? "",
    fullName: b(p.fullNameEn, p.fullNameAr),
    sex: p.sex === "MALE" ? "male" : "female",
    age: p.birthDate ? ageOf(p.birthDate) : 0,
    bloodType: p.bloodType ?? "—",
    photoUrl: p.photoUrl ?? avatar(p.id ?? p.mti),
    address: b(p.addressEn, p.addressAr),
    insuranceActive: !!p.insuranceActive,
    chronicConditions: bilingualList(p.chronicConditions),
    allergies: bilingualList(p.allergies),
    organDonor: !!p.organDonor,
    // keep the id so actions can reference the patient
    ...({ id: p.id } as object),
  } as NationalIdentity;
}
export const patientId = (p: NationalIdentity): string => (p as unknown as { id: string }).id;

const mapVisit = (v: Raw): QueueTicket => ({
  id: v.id,
  patient: mapPatient(v.patient),
  ticketNo: v.ticketNo,
  arrivalTime: v.arrivedAt,
  reason: b(v.reasonEn, v.reasonAr),
  status: kebab(v.status) as QueueTicket["status"],
  isEmergency: !!v.isEmergency,
  waitMinutes: minutesSince(v.arrivedAt),
});

const mapMedication = (i: Raw): Medication => ({
  id: i.id,
  name: b(i.nameEn, i.nameAr),
  form: b(i.form, i.form),
  dose: i.dose,
  frequency: b(i.frequencyEn, i.frequencyAr),
  durationDays: i.durationDays,
  quantity: i.quantity,
  substitutionAllowed: !!i.substitutionAllowed,
  stockStatus: "in-stock", // the API does not track stock yet — UI must not display this field
  unitPrice: 0,
});

const mapRx = (r: Raw): Prescription => ({
  id: r.id,
  patient: mapPatient(r.patient),
  physician: b("", ""),
  physicianLicense: "",
  createdAt: r.createdAt,
  diagnosis: b(r.diagnosisEn, r.diagnosisAr),
  icd10: r.icd10 ?? "",
  medications: (r.items ?? []).map(mapMedication),
  signed: r.status !== "DRAFT",
  status: kebab(r.status) as Prescription["status"],
});
export const rxCode = (r: Prescription) => r.id.slice(0, 8).toUpperCase();

const mapSample = (s: Raw): LabSample => ({
  id: s.id,
  barcode: s.barcode,
  patient: mapPatient(s.patient),
  testPanel: b(s.panelEn, s.panelAr),
  sampleType: b(s.sampleTypeEn, s.sampleTypeAr),
  orderedBy: b("", ""),
  collectedAt: s.collectedAt,
  priority: String(s.priority).toLowerCase() as LabSample["priority"],
  status: kebab(s.status) as LabSample["status"],
  results: Array.isArray(s.results) ? s.results.map(mapRow) : [],
});

const mapRow = (r: Raw): LabResultRow => ({
  id: r.id, analyte: b(r.analyteEn, r.analyteAr), value: r.value, unit: r.unit,
  refLow: r.refLow, refHigh: r.refHigh, flag: String(r.flag).toLowerCase() as LabResultRow["flag"],
});

const mapBed = (x: Raw): Bed => ({
  id: x.id,
  ward: b(x.wardEn, x.wardAr),
  bedNumber: x.bedNumber,
  status: String(x.status).toLowerCase() as Bed["status"],
  patient: x.patient ? mapPatient(x.patient) : undefined,
  acuity: x.acuity ?? undefined,
  admittedAt: x.admittedAt ?? undefined,
  equipment: [],
});

const mapEr = (c: Raw): ERCase => ({
  id: c.id,
  patient: mapPatient(c.patient),
  arrivalMode: b(c.arrivalEn, c.arrivalAr),
  arrivedAt: c.arrivedAt,
  chiefComplaint: b(c.complaintEn, c.complaintAr),
  acuity: c.acuity,
  vitals: (c.vitals ?? {}) as ERCase["vitals"],
  status: kebab(c.status) as ERCase["status"],
  assignedArea: b(c.areaEn, c.areaAr),
});

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body });

export const api = {
  /* ---------------- queue & patients ---------------- */
  getQueue: async () => (await request<Raw[]>("/queue")).map(mapVisit),
  callNext: async () => mapVisit(await post<Raw>("/queue/call-next")),
  setVisitStatus: async (id: string, status: QueueTicket["status"]) => mapVisit(await patch<Raw>(`/queue/${id}/status`, { status: upper(status) })),
  createTicket: (body: { patientId: string; reasonEn: string; reasonAr: string; isEmergency?: boolean }) => post<Raw>("/queue", body),
  searchPatients: async (q: string) => (await request<Raw[]>(`/patients?q=${encodeURIComponent(q)}`)).map(mapPatient),
  getPatient: async (id: string) => mapPatient(await request<Raw>(`/patients/${id}`)),

  /* ---------------- prescriptions ---------------- */
  getPrescriptions: async () => (await request<Raw[]>("/prescriptions")).map(mapRx),
  createAndSignPrescription: async (body: {
    patientId: string; diagnosisEn: string; diagnosisAr: string; icd10?: string; isChronic?: boolean;
    items: { nameEn: string; nameAr: string; form?: string; dose: string; frequencyEn: string; frequencyAr: string; durationDays: number; quantity: number; substitutionAllowed?: boolean; isChronic?: boolean; monthlyAllowance?: number }[];
  }) => {
    const created = await post<Raw>("/prescriptions", body);
    return mapRx(await post<Raw>(`/prescriptions/${created.id}/sign`));
  },
  verifyRx: async (id: string) => mapRx(await post<Raw>(`/prescriptions/${id}/verify`)),
  dispenseRx: async (id: string) => mapRx(await post<Raw>(`/prescriptions/${id}/dispense`)),
  rejectRx: async (id: string, reason: string) => mapRx(await post<Raw>(`/prescriptions/${id}/reject`, { reason })),

  /* ---------------- lab ---------------- */
  getLabSamples: async () => (await request<Raw[]>("/lab/samples")).map(mapSample),
  getLabResultPanels: async (): Promise<LabResultPanel[]> =>
    (await request<Raw[]>("/lab/samples"))
      .filter((s) => ["PROCESSING", "RESULTS_ENTERED", "VERIFIED"].includes(s.status))
      .map((s) => ({ id: s.id, sample: mapSample(s), rows: (s.results ?? []).map(mapRow), verified: s.status === "VERIFIED", entered: s.status !== "PROCESSING" } as LabResultPanel)),
  setSampleStatus: async (id: string, status: LabSample["status"], rejectReason?: string) =>
    mapSample(await patch<Raw>(`/lab/samples/${id}/status`, { status: upper(status), rejectReason })),
  enterResults: (id: string, rows: { analyteEn: string; analyteAr: string; value: number; unit: string; refLow: number; refHigh: number }[]) =>
    post<Raw>(`/lab/samples/${id}/results`, { rows }),
  verifyLab: (id: string) => post<Raw>(`/lab/samples/${id}/verify`),

  /* ---------------- hospital ---------------- */
  getBeds: async () => (await request<Raw[]>("/hospital/beds")).map(mapBed),
  setBedStatus: async (id: string, status: Bed["status"]) => mapBed(await patch<Raw>(`/hospital/beds/${id}/status`, { status: upper(status) })),
  getErCases: async () => (await request<Raw[]>("/hospital/er")).map(mapEr),
  admitEr: async (id: string, bedId: string) => mapEr(await post<Raw>(`/hospital/er/${id}/admit`, { bedId })),

  /* ---------------- analytics ---------------- */
  getKpis: () => request<{
    beds: { total: number; occupied: number; occupancyPct: number };
    er: { open: number; critical: number };
    prescriptions: Record<string, number>;
    lab: { openSamples: number };
    clinics: { waiting: number };
    generatedAt: string;
  }>("/analytics/kpis"),

  /* ---------------- reception ---------------- */
  openCitizenAccount: (body: { nationalId: string; fullNameEn: string; fullNameAr: string; sex: "MALE" | "FEMALE"; birthDate: string; bloodType?: string; insuranceActive?: boolean; governorate?: string; district?: string; chronicConditions?: {en:string,ar:string}[]; allergies?: {en:string,ar:string}[] }) =>
    post<{ patientId: string; mti: string; loginId: string; temporaryPassword: string; nfcToken?: string }>("/reception/citizens", body),
  resetCitizenPassword: (patientId: string) => post<{ temporaryPassword: string }>(`/reception/citizens/${patientId}/reset-password`),
  getAppointments: async () =>
    (await request<Raw[]>("/appointments")).map((a) => ({
      id: a.id as string, patient: mapPatient(a.patient), preferredDate: a.preferredDate as string, reason: a.reason as string,
      status: a.status as "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED", scheduledAt: (a.scheduledAt ?? null) as string | null,
      doctorId: (a.doctorId ?? null) as string | null,
    })),
  getDoctors: () => request<{ id: string; fullNameEn: string; fullNameAr: string; specialityEn?: string; specialityAr?: string }[]>("/doctors"),
  getDoctorSlots: (doctorId: string, date: string) => request<{ slotStart: string; slotEnd: string }[]>(`/schedule/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`),
  confirmAppointment: (id: string, body: { scheduledAt: string; doctorId?: string; note?: string }) => post<Raw>(`/appointments/${id}/confirm`, body),
  rejectAppointment: (id: string, note?: string) => post<Raw>(`/appointments/${id}/reject`, { note }),
  setAppointmentStatus: (id: string, status: string) => patch<Raw>(`/appointments/${id}/status`, { status }),

  /* ---------------- doctor: schedule & referrals ---------------- */
  getMySchedule: () => request<Raw[]>("/schedule/my"),
  upsertSchedule: (body: any) => post<Raw>("/schedule/my", body),
  deleteSchedule: (id: string) => request<Raw>(`/schedule/my/${id}`, { method: "DELETE" }),
  getRenewals: async () => (await request<Raw[]>("/renewals")).map((r) => ({ id: r.id as string, patient: mapPatient(r.patient), createdAt: r.createdAt as string })),
  approveRenewal: (id: string) => post<{ renewalId: string; draftPrescriptionId: string }>(`/renewals/${id}/approve`),
  rejectRenewal: (id: string, note?: string) => post<Raw>(`/renewals/${id}/reject`, { note }),
  redeemShare: async (code: string) => {
    const r = await post<Raw>("/shares/redeem", { code: code.trim().toUpperCase() });
    return {
      patient: mapPatient(r.patient),
      prescriptions: (r.prescriptions as Raw[]).map((x) => mapRx({ ...x, patient: r.patient })),
      labs: (r.labs as Raw[]).map((s) => ({ sample: mapSample({ ...s, patient: r.patient }), rows: (s.results ?? []).map(mapRow) })),
      visits: (r.visits as Raw[]).map((v) => mapVisit({ ...v, patient: r.patient })),
    };
  },

  /* ---------------- admin ---------------- */
  listUsers: () => request<{ id: string; email: string | null; role: string; fullNameEn: string; fullNameAr: string; licenseNo: string | null; isActive: boolean; mustChangePassword: boolean }[]>("/admin/users"),
  getAuditLogs: () => request<Raw[]>("/admin/users/audit-logs"),
  getSecurityPosture: () => request<Raw>("/admin/users/security-posture"),
  createStaff: (body: { email: string; role: string; fullNameEn: string; fullNameAr: string; licenseNo?: string }) =>
    post<{ user: { id: string }; temporaryPassword: string }>("/admin/users", body),
  setUserActive: (id: string, isActive: boolean) => patch<Raw>(`/admin/users/${id}/active`, { isActive }),
  resetUserPassword: (id: string) => post<{ temporaryPassword: string }>(`/admin/users/${id}/reset-password`),

  /* ---------------- NEW: Pharmacy ---------------- */
  getPharmacyClaims: () => request<Raw[]>("/pharmacy/claims"),
  createPharmacyClaim: (body: { prescriptionId: string; coveragePct: number }) => post<Raw>("/pharmacy/claims", body),
  submitClaim: (id: string) => patch<Raw>(`/pharmacy/claims/${id}/submit`, {}),
  getPharmacySettlements: () => request<Raw[]>("/pharmacy/settlements"),
  runPharmacySettlement: (year: number, month: number) => post<Raw>("/pharmacy/settlements/run", { year, month }),
  getPharmacyInventory: () => request<Raw[]>("/pharmacy/inventory"),
  createDrug: (body: any) => post<Raw>("/pharmacy/inventory", body),
  updateDrug: (id: string, body: any) => patch<Raw>(`/pharmacy/inventory/${id}`, body),
  getChronicAllowances: (patientId: string) => request<Raw[]>(`/pharmacy/allowances/patient/${patientId}`),
  dispenseAllowance: (allowanceId: string, quantity: number) => post<Raw>("/pharmacy/allowances/dispense", { allowanceId, quantity }),

  /* ---------------- NEW: Referrals ---------------- */
  getReferrals: () => request<Raw[]>("/referrals"),
  createReferral: (body: any) => post<Raw>("/referrals", body),
  actOnReferral: (id: string, status: string, responseNoteEn?: string, responseNoteAr?: string) => 
    patch<Raw>(`/referrals/${id}/status`, { status, responseNoteEn, responseNoteAr }),
  cancelReferral: (id: string) => request<Raw>(`/referrals/${id}`, { method: "DELETE" }),

  /* ---------------- NEW: Advanced Lab ---------------- */
  orderLabSample: (body: { patientId: string; panelEn: string; panelAr: string; sampleTypeEn: string; sampleTypeAr: string; priority?: "ROUTINE" | "URGENT" | "STAT" }) => post<Raw>("/lab/samples", body),
  getLabReagents: () => request<Raw[]>("/lab/reagents"),
  createLabReagent: (body: any) => post<Raw>("/lab/reagents", body),
  updateLabReagent: (id: string, body: any) => patch<Raw>(`/lab/reagents/${id}`, body),
  deleteLabReagent: (id: string) => request<Raw>(`/lab/reagents/${id}`, { method: "DELETE" }),
  getLabInstruments: () => request<Raw[]>("/lab/instruments"),
  createLabInstrument: (body: any) => post<Raw>("/lab/instruments", body),
  addLabCalibration: (id: string, body: { result: string; notes?: string }) => post<Raw>(`/lab/instruments/${id}/calibrations`, body),
  getLabCalibrations: (id: string) => request<Raw[]>(`/lab/instruments/${id}/calibrations`),
  getLabAnalytics: () => request<Raw>("/lab/analytics"),
  getRadiologyUploads: (patientId: string) => request<Raw[]>(`/lab/radiology?patientId=${patientId}`),
  getRadiologyOne: (id: string) => request<Raw>(`/lab/radiology/${id}`),
  uploadRadiology: (body: any) => post<Raw>("/lab/radiology", body),
  deleteRadiology: (id: string) => request<Raw>(`/lab/radiology/${id}`, { method: "DELETE" }),

  /* ---------------- NEW: Advanced Hospital ---------------- */
  createErIntake: (body: { patientId: string; arrivalEn: string; arrivalAr: string; complaintEn: string; complaintAr: string; acuity: number; areaEn: string; areaAr: string; vitals?: any }) => post<Raw>("/hospital/er", body),
  setErStatus: (id: string, status: string) => patch<Raw>(`/hospital/er/${id}/status`, { status }),
  getBloodBank: () => request<Raw[]>("/hospital/blood-bank"),
  createBloodUnit: (body: any) => post<Raw>("/hospital/blood-bank", body),
  updateBloodUnit: (id: string, body: any) => patch<Raw>(`/hospital/blood-bank/${id}`, body),
  getOrCases: () => request<Raw[]>("/hospital/or-cases"),
  createOrCase: (body: any) => post<Raw>("/hospital/or-cases", body),
  updateOrCase: (id: string, body: any) => patch<Raw>(`/hospital/or-cases/${id}`, body),
  getHospitalCompliance: () => request<Raw>("/hospital/compliance"),

  /* ---------------- NEW: Advanced Analytics ---------------- */
  getAnalyticsOverview: () => request<Raw>("/analytics/overview"),
  getAnalyticsUhia: () => request<Raw>("/analytics/uhia"),
  getAnalyticsGis: () => request<Raw>("/analytics/gis"),
  getAnalyticsFraud: () => request<Raw>("/analytics/fraud"),
  getAnalyticsDrugIntel: () => request<Raw>("/analytics/drug-intelligence"),
  getAnalyticsFacility: () => request<Raw>("/analytics/facility-capacity"),
  getQuadMinistries: () => request<Raw>("/analytics/quad-ministries"),
  checkFamilySubsidy: (body: { headMti: string; headNameAr: string; governorate: string; currentMembersCount: number; newMemberNameAr?: string }) =>
    post<Raw>("/analytics/quad-ministries/family-check", body),

  /* ---------------- NEW: NFC Emergency Verification ---------------- */
  verifyNfcCard: (token: string) => post<Raw>("/nfc-cards/verify", { token }),
  printNfcCard: (patientId: string) => post<{ cardId: string; token: string }>("/nfc-cards/print", { patientId }),
  replaceNfcCard: (patientId: string) => post<{ cardId: string; token: string }>("/nfc-cards/replace", { patientId }),
  getPatientNfcCards: (patientId: string) => request<Raw[]>(`/nfc-cards/patient/${patientId}`),
  revokeNfcCard: (id: string, revokeReason: string) => patch<Raw>(`/nfc-cards/${id}/revoke`, { revokeReason }),

  getNotifications: () => request<Raw[]>("/notifications"),
  markNotificationRead: (id: string) => request<Raw>(`/notifications/${id}/read`, { method: "PATCH" }),
};
