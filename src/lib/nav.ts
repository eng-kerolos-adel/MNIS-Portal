import {
  Users, Stethoscope, FileText, FlaskConical, Send, CalendarClock,
  PackageCheck, ShieldCheck, ReceiptText, PackageSearch, HeartPulse, Wallet,
  TestTubes, ScanEye, Radar, Beaker, LineChart,
  Siren, BedDouble, Scissors, Ambulance, Droplets, ClipboardCheck,
  Gauge, Map, Pill, Search as SearchIcon, FileBarChart, Building2,
  UserPlus, CalendarCheck, UsersRound, RefreshCw, QrCode,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  live?: boolean; // true = fully built screen, false = placeholder module
};

export type PortalKey = "doctor" | "pharmacy" | "lab" | "hospital" | "analytics" | "reception" | "admin";

export const portalNav: Record<PortalKey, NavItem[]> = {
  doctor: [
    { href: "/doctor/consultation", icon: Stethoscope, labelKey: "nav.doctor.consultation", live: true },
    { href: "/doctor/schedule", icon: CalendarClock, labelKey: "nav.doctor.schedule", live: true },
    { href: "/doctor/appointments", icon: CalendarCheck, labelKey: "nav.doctor.appointments", live: true },
    { href: "/doctor/queue", icon: Users, labelKey: "nav.doctor.queue", live: true },
    { href: "/doctor/renewals", icon: RefreshCw, labelKey: "nav.doctor.renewals", live: true },
    { href: "/doctor/shared-record", icon: QrCode, labelKey: "nav.doctor.sharedRecord", live: true },
    { href: "/doctor/e-prescriptions", icon: FileText, labelKey: "nav.doctor.ePrescriptions", live: true },
    { href: "/doctor/lab-orders", icon: FlaskConical, labelKey: "nav.doctor.labOrders", live: true },
    { href: "/doctor/referrals", icon: Send, labelKey: "nav.doctor.referrals", live: true },
  ],
  pharmacy: [
    { href: "/pharmacy/dispensing-queue", icon: PackageCheck, labelKey: "nav.pharmacy.dispensingQueue", live: true },
    { href: "/pharmacy/rx-verification", icon: ShieldCheck, labelKey: "nav.pharmacy.rxVerification", live: true },
    { href: "/pharmacy/insurance-claims", icon: ReceiptText, labelKey: "nav.pharmacy.insuranceClaims", live: true },
    { href: "/pharmacy/inventory", icon: PackageSearch, labelKey: "nav.pharmacy.inventory", live: true },
    { href: "/pharmacy/chronic-allowances", icon: HeartPulse, labelKey: "nav.pharmacy.chronicAllowances", live: true },
    { href: "/pharmacy/financial-settlement", icon: Wallet, labelKey: "nav.pharmacy.financialSettlement", live: true },
  ],
  lab: [
    { href: "/lab/appointments", icon: CalendarCheck, labelKey: "nav.lab.appointments", live: true },
    { href: "/lab/sample-intake", icon: TestTubes, labelKey: "nav.lab.sampleIntake", live: true },
    { href: "/lab/results", icon: ClipboardCheck, labelKey: "nav.lab.resultsEntry", live: true },
    { href: "/lab/radiology", icon: ScanEye, labelKey: "nav.lab.radiology", live: true },
    { href: "/lab/qc-calibration", icon: Radar, labelKey: "nav.lab.qcCalibration", live: true },
    { href: "/lab/reagents", icon: Beaker, labelKey: "nav.lab.reagents", live: true },
    { href: "/lab/analytics", icon: LineChart, labelKey: "nav.lab.analyticsReports", live: true },
  ],
  hospital: [
    { href: "/hospital/er-triage", icon: Siren, labelKey: "nav.hospital.erTriage", live: true },
    { href: "/hospital/beds-icu", icon: BedDouble, labelKey: "nav.hospital.bedsIcu", live: true },
    { href: "/hospital/surgical", icon: Scissors, labelKey: "nav.hospital.surgical", live: true },
    { href: "/hospital/ems-transfers", icon: Ambulance, labelKey: "nav.hospital.ems", live: true },
    { href: "/hospital/blood-bank", icon: Droplets, labelKey: "nav.hospital.bloodBank", live: true },
    { href: "/hospital/compliance", icon: ClipboardCheck, labelKey: "nav.hospital.compliance", live: true },
  ],
  analytics: [
    { href: "/analytics/ministries", icon: Building2, labelKey: "nav.analytics.ministries", live: true },
    { href: "/analytics/overview", icon: Gauge, labelKey: "nav.analytics.overview", live: true },
    { href: "/analytics/uhia-coverage", icon: ShieldCheck, labelKey: "nav.analytics.uhia", live: true },
    { href: "/analytics/facility-capacity", icon: BedDouble, labelKey: "nav.analytics.facility", live: true },
    { href: "/analytics/gis-epidemiology", icon: Map, labelKey: "nav.analytics.gis", live: true },
    { href: "/analytics/drug-intelligence", icon: Pill, labelKey: "nav.analytics.drugIntel", live: true },
    { href: "/analytics/fraud-detection", icon: SearchIcon, labelKey: "nav.analytics.fraud", live: true },
    { href: "/analytics/reports", icon: FileBarChart, labelKey: "nav.analytics.reports", live: true },
  ],
  reception: [
    { href: "/reception/citizens", icon: UserPlus, labelKey: "nav.reception.citizens", live: true },
  ],
  admin: [
    { href: "/admin/users", icon: UsersRound, labelKey: "nav.admin.users", live: true },
  ],
};

export const portalMeta: Record<PortalKey, { icon: LucideIcon; titleKey: string }> = {
  doctor: { icon: Stethoscope, titleKey: "home.roles.doctor.title" },
  pharmacy: { icon: PackageCheck, titleKey: "home.roles.pharmacy.title" },
  lab: { icon: TestTubes, titleKey: "home.roles.lab.title" },
  hospital: { icon: Siren, titleKey: "home.roles.hospital.title" },
  analytics: { icon: Gauge, titleKey: "home.roles.analytics.title" },
  reception: { icon: UserPlus, titleKey: "home.roles.reception.title" },
  admin: { icon: UsersRound, titleKey: "home.roles.admin.title" },
};

/** Which portal each API role works in. Citizens (PATIENT) use the mobile app, not this portal. */
export const ROLE_PORTAL: Record<string, PortalKey | null> = {
  DOCTOR: "doctor",
  PHARMACIST: "pharmacy",
  LAB_TECH: "lab",
  HOSPITAL_STAFF: "hospital",
  EXECUTIVE: "analytics",
  RECEPTIONIST: "reception",
  ADMIN: "admin",
  PATIENT: null,
};

export function homeFor(role: string, specialityEn?: string | null): string {
  if (role === "DOCTOR") return "/doctor/consultation";
  if (role === "RECEPTIONIST" && specialityEn === "CLINIC_ASSISTANT") return "/doctor/appointments";
  if (role === "LAB_TECH" && specialityEn === "LAB_RECEPTION") return "/lab/appointments";
  const portal = ROLE_PORTAL[role];
  if (!portal) return "/login";
  const items = portalNav[portal];
  return (items.find((i) => i.live) ?? items[0]!).href;
}
