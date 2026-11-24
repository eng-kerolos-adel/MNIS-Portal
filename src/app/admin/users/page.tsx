"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  UsersRound,
  UserPlus,
  KeyRound,
  Power,
  ShieldCheck,
  Lock,
  Database,
  Activity,
  FileSpreadsheet,
  RefreshCw,
  Building2,
  Stethoscope,
  FlaskConical,
  Hospital as HospitalIcon,
  Pill,
  ScanEye,
  Copy,
  CheckCircle2,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { useAuth } from "@/lib/auth/AuthProvider";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CredentialModal } from "@/components/ui/CredentialModal";

/* eslint-disable @typescript-eslint/no-explicit-any */
type FacilityItem = Awaited<ReturnType<typeof api.getFacilities>>[number];
type FacilityStaffMember = FacilityItem["staff"][number];
type BundleCreds = Awaited<ReturnType<typeof api.createFacilityBundle>>;

const ROLES: Record<string, { en: string; ar: string }> = {
  DOCTOR: { en: "Physician", ar: "طبيب" },
  PHARMACIST: { en: "Pharmacist", ar: "صيدلي" },
  LAB_TECH: { en: "Lab / Radiology Tech", ar: "أخصائي معمل / أشعة" },
  HOSPITAL_STAFF: { en: "Hospital Staff", ar: "طاقم المستشفى" },
  EXECUTIVE: { en: "Executive", ar: "قيادة تنفيذية" },
  RECEPTIONIST: { en: "Receptionist / Assistant", ar: "استقبال / مساعد عيادة" },
  ADMIN: { en: "Administrator", ar: "مدير النظام" },
};

const FACILITY_LABELS: Record<
  string,
  { en: string; ar: string; tone: "secondary" | "success" | "warning" | "neutral" }
> = {
  CLINIC: { en: "Doctor Clinic", ar: "عيادة طبية", tone: "secondary" },
  LAB: { en: "Analysis Lab", ar: "معمل تحاليل", tone: "warning" },
  RADIOLOGY: { en: "Radiology Center", ar: "معمل / مركز أشعة", tone: "secondary" },
  HOSPITAL: { en: "Hospital", ar: "مستشفى", tone: "success" },
  PHARMACY: { en: "Pharmacy", ar: "صيدلية", tone: "neutral" },
  RECEPTION: { en: "Citizen Reception Desk", ar: "مكتب استقبال مواطنين", tone: "neutral" },
  COMMAND: { en: "Command & System Admin", ar: "الإدارة والقيادة التنفيذية", tone: "neutral" },
};

const field =
  "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

function staffSubRoleLabel(st: FacilityStaffMember, ar: boolean): string {
  const spec = (st.specialityEn ?? "").toUpperCase();
  if (spec === "CLINIC_ASSISTANT") return ar ? "مساعد عيادة الطبيب" : "Clinic Assistant";
  if (spec === "RADIOLOGY_RECEPTION") return ar ? "استقبال مركز الأشعة" : "Radiology Reception";
  if (spec === "RADIOLOGY_DIRECTOR") return ar ? "مدير مركز الأشعة" : "Radiology Director";
  if (spec.startsWith("RADIOLOGY")) return ar ? "أخصائي أشعة تشخيصية" : "Radiology Specialist";
  if (spec === "LAB_RECEPTION") return ar ? "استقبال معمل التحاليل" : "Lab Reception";
  if (spec.includes("DIRECTOR")) return ar ? "مدير معمل ومعتمد نتائج" : "Lab Director & Verifier";
  return ROLES[st.role]?.[ar ? "ar" : "en"] ?? st.role;
}

export default function StaffUsersPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const { user: me } = useAuth();
  const ar = locale === "ar";

  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [posture, setPosture] = useState<any>(null);
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");
  const [auditQuery, setAuditQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleCreds, setBundleCreds] = useState<BundleCreds | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FacilityStaffMember | null>(null);

  const [bundleForm, setBundleForm] = useState<{
    facilityType: "CLINIC" | "LAB" | "HOSPITAL" | "PHARMACY";
    labSubType: "ANALYSIS" | "RADIOLOGY";
    facilityEn: string;
    facilityAr: string;
    specialityEn: string;
    specialityAr: string;
    licenseNo: string;
    primaryNameEn: string;
    primaryNameAr: string;
    primaryEmail: string;
    secondaryNameEn: string;
    secondaryNameAr: string;
    secondaryEmail: string;
  }>({
    facilityType: "CLINIC",
    labSubType: "ANALYSIS",
    facilityEn: "",
    facilityAr: "",
    specialityEn: "",
    specialityAr: "",
    licenseNo: "",
    primaryNameEn: "",
    primaryNameAr: "",
    primaryEmail: "",
    secondaryNameEn: "",
    secondaryNameAr: "",
    secondaryEmail: "",
  });

  const [f, setF] = useState({
    email: "",
    role: "DOCTOR",
    fullNameEn: "",
    fullNameAr: "",
    licenseNo: "",
    specialityEn: "",
    specialityAr: "",
    facilityEn: "",
    facilityAr: "",
  });

  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [facList, logs, pos] = await Promise.all([
        api.getFacilities().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getSecurityPosture().catch(() => null),
      ]);
      setFacilities(facList);
      setAuditLogs(logs);
      setPosture(pos);
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalStaffCount = useMemo(
    () => facilities.reduce((acc, fac) => acc + fac.staff.length, 0),
    [facilities],
  );

  function toggleFacilityExpand(key: string) {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.createStaff({
        email: f.email,
        role: f.role,
        fullNameEn: f.fullNameEn,
        fullNameAr: f.fullNameAr,
        licenseNo: f.licenseNo.trim() || undefined,
        specialityEn: f.specialityEn.trim() || undefined,
        specialityAr: f.specialityAr.trim() || undefined,
        facilityEn: f.facilityEn.trim() || undefined,
        facilityAr: f.facilityAr.trim() || undefined,
      });
      setOpen(false);
      setF({
        email: "",
        role: "DOCTOR",
        fullNameEn: "",
        fullNameAr: "",
        licenseNo: "",
        specialityEn: "",
        specialityAr: "",
        facilityEn: "",
        facilityAr: "",
      });
      setPw(r.temporaryPassword);
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function createBundle(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const priEmail = bundleForm.primaryEmail.trim().toLowerCase();
      const rawSec = bundleForm.secondaryEmail.trim().toLowerCase();
      const [localPart, domainPart] = priEmail.split("@");
      const rolePrefix =
        bundleForm.facilityType === "CLINIC"
          ? "assistant"
          : bundleForm.facilityType === "LAB"
            ? "specialist"
            : bundleForm.facilityType === "PHARMACY"
              ? "dispensing"
              : "doctor";
      const secEmail =
        rawSec && rawSec !== priEmail
          ? rawSec
          : `${rolePrefix}.${localPart || "staff"}@${domainPart || "mnis.eg"}`;

      const res = await api.createFacilityBundle({
        facilityType: bundleForm.facilityType,
        labSubType: bundleForm.facilityType === "LAB" ? bundleForm.labSubType : undefined,
        facilityEn: bundleForm.facilityEn.trim(),
        facilityAr: bundleForm.facilityAr.trim(),
        primaryEmail: priEmail,
        primaryNameEn: bundleForm.primaryNameEn.trim(),
        primaryNameAr: bundleForm.primaryNameAr.trim(),
        secondaryEmail: secEmail,
        secondaryNameEn: bundleForm.secondaryNameEn.trim() || undefined,
        secondaryNameAr: bundleForm.secondaryNameAr.trim() || undefined,
        specialityEn: bundleForm.specialityEn.trim() || undefined,
        specialityAr: bundleForm.specialityAr.trim() || undefined,
        licenseNo: bundleForm.licenseNo.trim() || undefined,
      });
      setBundleOpen(false);
      setBundleForm({
        facilityType: "CLINIC",
        labSubType: "ANALYSIS",
        facilityEn: "",
        facilityAr: "",
        specialityEn: "",
        specialityAr: "",
        licenseNo: "",
        primaryNameEn: "",
        primaryNameAr: "",
        primaryEmail: "",
        secondaryNameEn: "",
        secondaryNameAr: "",
        secondaryEmail: "",
      });
      setBundleCreds(res);
      push(
        "success",
        ar
          ? `تم إنشاء المنشأة (${res.facilityAr}) وتفعيل حسابات فريق العمل بنجاح`
          : `Facility (${res.facilityEn}) & staff team provisioned`,
      );
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  function openAddStaffForFacility(fac: FacilityItem) {
    const defaultRole =
      fac.facilityType === "LAB" || fac.facilityType === "RADIOLOGY"
        ? "LAB_TECH"
        : fac.facilityType === "HOSPITAL"
          ? "HOSPITAL_STAFF"
          : fac.facilityType === "PHARMACY"
            ? "PHARMACIST"
            : "RECEPTIONIST";
    setF({
      email: "",
      role: defaultRole,
      fullNameEn: "",
      fullNameAr: "",
      licenseNo: "",
      specialityEn:
        fac.facilityType === "CLINIC"
          ? "CLINIC_ASSISTANT"
          : fac.facilityType === "RADIOLOGY"
            ? "RADIOLOGY_SPECIALIST"
            : fac.facilityType === "LAB"
              ? "Diagnostic Lab Specialist"
              : fac.facilityType === "PHARMACY"
                ? "Dispensing Pharmacist"
                : "",
      specialityAr:
        fac.facilityType === "CLINIC"
          ? "مساعد طبيب وإدارة عيادة"
          : fac.facilityType === "RADIOLOGY"
            ? "أخصائي أشعة تشخيصية معتمد"
            : fac.facilityType === "LAB"
              ? "أخصائي تحاليل طبية معتمد"
              : fac.facilityType === "PHARMACY"
                ? "صيدلي صرف الأدوية"
                : "",
      facilityEn: fac.facilityEn,
      facilityAr: fac.facilityAr,
    });
    setOpen(true);
  }

  async function toggle(u: FacilityStaffMember) {
    if (u.id === me?.id) return;
    try {
      await api.setUserActive(u.id, !u.isActive);
      push(
        "success",
        ar
          ? "تم تحديث صلاحية الحساب وإلغاء الجلسات النشطة عند الإيقاف"
          : "Account status updated",
      );
      await load();
    } catch (e) {
      handleError(e);
    }
  }

  async function reset(u: FacilityStaffMember) {
    if (
      !window.confirm(
        ar
          ? `إعادة تعيين كلمة مرور (${u.fullNameAr})؟`
          : `Reset password for ${u.fullNameEn}?`,
      )
    )
      return;
    try {
      setPw((await api.resetUserPassword(u.id)).temporaryPassword);
      await load();
    } catch (e) {
      handleError(e);
    }
  }

  async function confirmDeleteStaff() {
    if (!deleteTarget || deleteTarget.id === me?.id) return;
    setBusy(true);
    try {
      await api.deleteStaff(deleteTarget.id);
      push(
        "success",
        ar
          ? `تم حذف حساب الموظف (${deleteTarget.fullNameAr}) من المنظومة بنجاح`
          : `Staff member (${deleteTarget.fullNameEn}) permanently removed`,
      );
      setDeleteTarget(null);
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((fac) => facilityFilter === "ALL" || fac.facilityType === facilityFilter)
      .map((fac) => {
        if (!normalizedSearch) {
          return { fac, visibleStaff: fac.staff, autoExpand: false };
        }
        const facText = `${fac.facilityAr} ${fac.facilityEn} ${FACILITY_LABELS[fac.facilityType]?.ar ?? ""} ${FACILITY_LABELS[fac.facilityType]?.en ?? ""}`.toLowerCase();
        const facMatches = facText.includes(normalizedSearch);
        const matchingStaff = fac.staff.filter((st) => {
          const stText = [
            st.fullNameAr,
            st.fullNameEn,
            st.email,
            st.licenseNo,
            st.role,
            st.specialityEn,
            st.specialityAr,
            staffSubRoleLabel(st, true),
            staffSubRoleLabel(st, false),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return stText.includes(normalizedSearch);
        });
        if (facMatches || matchingStaff.length > 0) {
          return {
            fac,
            visibleStaff: matchingStaff.length > 0 ? matchingStaff : fac.staff,
            autoExpand: matchingStaff.length > 0 || facMatches,
          };
        }
        return null;
      })
      .filter((x): x is { fac: FacilityItem; visibleStaff: FacilityStaffMember[]; autoExpand: boolean } => x !== null);
  }, [facilities, facilityFilter, normalizedSearch]);

  const filteredLogs = useMemo(() => {
    const aq = auditQuery.trim().toLowerCase();
    return auditLogs.filter((l) => {
      if (resourceFilter !== "ALL" && (l.resourceType ?? "SYSTEM") !== resourceFilter) return false;
      if (!aq) return true;
      const text = [
        l.actor?.fullNameAr,
        l.actor?.fullNameEn,
        l.actor?.email,
        l.role,
        l.resourceType,
        l.method,
        l.path,
        l.ip,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(aq);
    });
  }, [auditLogs, resourceFilter, auditQuery]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UsersRound}
        title={ar ? "إدارة المنشآت الطبية، الموظفين، والأمن السيبراني" : "Facility Directory, Staff Governance & Security Audit"}
        badge={ar ? "منصة إدارة النظام" : "System Administration"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
              {ar ? "تحديث السجلات" : "Refresh"}
            </Button>
            <Button variant="secondary" icon={<Building2 className="h-4 w-4" />} onClick={() => setBundleOpen(true)}>
              {ar ? "إضافة عيادة / معمل / مستشفى / صيدلية" : "Add Clinic / Lab / Hospital / Pharmacy"}
            </Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              {ar ? "موظف جديد" : "New staff member"}
            </Button>
          </div>
        }
      />

      {/* Sovereign Security & Coverage Posture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-s-4 border-s-emerald-600">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-1">
            <Lock className="w-4 h-4" />
            {ar ? "حماية وأمن البيانات الشخصية" : "Data Privacy & Encryption"}
          </div>
          <div className="text-base font-black text-on-surface">{ar ? "تشفير طبي معتمد" : "Certified Medical Encryption"}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? "حماية مشفرة لأرقام المواطنين القومية مع فصل كامل للصلاحيات"
              : "Encrypted national IDs with strict role & portal isolation"}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-blue-600">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            {ar ? "توثيق الهوية والروشتات الرقمية" : "Identity & Digital Verification"}
          </div>
          <div className="text-base font-black text-on-surface">{ar ? "توقيع رقمي موثّق" : "Verified Digital Seal"}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? `الروشتات الموثقة: ${posture?.signedPrescriptions ?? 0} • البطاقات الذكية النشطة: ${posture?.activeNfcCards ?? 0}`
              : `Signed Rx: ${posture?.signedPrescriptions ?? 0} • Active NFC Cards: ${posture?.activeNfcCards ?? 0}`}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-purple-600">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold mb-1">
            <Database className="w-4 h-4" />
            {ar ? "المنشآت والكوادر المسجلة" : "Registered Facilities & Staff"}
          </div>
          <div className="text-base font-black text-on-surface">
            {facilities.length} {ar ? "منشأة" : "Facilities"} • {totalStaffCount} {ar ? "موظف" : "Staff"}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? "اضغط على أي منشأة لاستعراض موظفيها أو إيقاف/حذف أي موظف"
              : "Click any facility below to inspect, reset, disable, or delete its staff"}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-amber-600">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold mb-1">
            <Activity className="w-4 h-4" />
            {ar ? "سجل الرقابة الجنائية الفوري" : "Immutable Audit Telemetry"}
          </div>
          <div className="text-base font-black text-on-surface">
            {posture?.totalAuditLogs ?? auditLogs.length} {ar ? "حدث موثق" : "Logged Events"}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? `محاولات مرفوضة: ${posture?.failedRequests ?? 0} • حسابات مقفلة: ${posture?.lockedAccounts ?? 0}`
              : `Blocked/Failed: ${posture?.failedRequests ?? 0} • Locked: ${posture?.lockedAccounts ?? 0}`}
          </p>
        </Card>
      </div>

      {/* Dedicated Admin Search Bar + Facility-Centric Staff Drill-Down */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {ar
                  ? `المنشآت الطبية وإدارة الموظفين (${facilities.length})`
                  : `Registered Facilities & Staff Drill-Down (${facilities.length})`}
              </CardTitle>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {ar
                  ? "اضغط على أي منشأة لفتح قائمة الموظفين التابعين لها مباشرة، أو ابحث بالاسم/البريد للوصول الفوري للموظف وحذفه أو تعديله"
                  : "Click any facility card to expand and manage its assigned staff, or search by staff name/email below"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "CLINIC", "LAB", "RADIOLOGY", "HOSPITAL", "PHARMACY", "RECEPTION", "COMMAND"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setFacilityFilter(tp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    facilityFilter === tp
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {tp === "ALL" ? (ar ? "الكل" : "All") : FACILITY_LABELS[tp]?.[locale] ?? tp}
                </button>
              ))}
            </div>
          </div>

          {/* Dedicated Staff & Facility Search Bar */}
          <div className="relative flex items-center self-end w-[40%]">
            <Search className="pointer-events-none absolute inset-s-3.5 h-4 w-4 text-primary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                ar
                  ? "ابحث عن موظف بالاسم أو البريد أو رقم الترخيص أو التخصص أو اسم المنشأة لحذفه أو إيقافه فوراً..."
                  : "Search staff by name, email, license number, specialty, or facility name..."
              }
              className="h-11 w-full rounded-xl border border-primary/25 bg-surface-container-low ps-10 pe-10 text-sm text-on-surface outline-none transition focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-e-3 rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Clear staff search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {filteredFacilities.length === 0 && (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {ar ? "لا توجد منشآت أو موظفين مطابقين لعبارة البحث." : "No facilities or staff members match your search."}
            </p>
          )}

          {filteredFacilities.map(({ fac, visibleStaff, autoExpand }) => {
            const meta = FACILITY_LABELS[fac.facilityType] ?? FACILITY_LABELS.COMMAND!;
            const isExpanded = autoExpand || expandedKeys.includes(fac.key);
            return (
              <div
                key={fac.key}
                className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest overflow-hidden transition-shadow hover:shadow-level-1"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleFacilityExpand(fac.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleFacilityExpand(fac.key);
                    }
                  }}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-primary">
                        {ar ? fac.facilityAr : fac.facilityEn}
                      </span>
                      <Badge tone={meta.tone}>{meta[locale]}</Badge>
                      <Badge tone="neutral">
                        {fac.staff.length} {ar ? "موظف" : "Staff"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5" dir="ltr">
                      {fac.facilityEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<UserPlus className="h-3.5 w-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddStaffForFacility(fac);
                      }}
                    >
                      {ar ? "+ موظف" : "+ Staff"}
                    </Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-outline-variant/40 bg-surface-container-low/30 p-3 flex flex-col gap-2">
                    {visibleStaff.map((u) => {
                      const isSelf = u.id === me?.id;
                      const isLocked = Boolean(u.lockedUntil && new Date(u.lockedUntil) > new Date());
                      return (
                        <div
                          key={u.id}
                          className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-on-surface">
                                {ar ? u.fullNameAr : u.fullNameEn}
                              </p>
                              <Badge tone="secondary">{staffSubRoleLabel(u, ar)}</Badge>
                              <Badge tone={u.isActive ? "success" : "error"}>
                                {u.isActive ? (ar ? "نشط" : "Active") : ar ? "موقوف" : "Disabled"}
                              </Badge>
                              {u.mustChangePassword && (
                                <Badge tone="warning">{ar ? "كلمة مؤقتة" : "Temp password"}</Badge>
                              )}
                              {isLocked && (
                                <Badge tone="error">{ar ? "مقفل مؤقتاً" : "Locked"}</Badge>
                              )}
                            </div>
                            <p dir="ltr" className="text-start text-xs text-on-surface-variant mt-0.5 font-mono">
                              {u.email} {u.licenseNo ? `• Lic: ${u.licenseNo}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<KeyRound className="h-3.5 w-3.5" />}
                              onClick={() => reset(u)}
                            >
                              {ar ? "كلمة جديدة" : "Reset"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Power className="h-3.5 w-3.5" />}
                              disabled={isSelf}
                              onClick={() => toggle(u)}
                            >
                              {u.isActive ? (ar ? "إيقاف" : "Disable") : ar ? "تفعيل" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(u)}
                            >
                              {ar ? "حذف" : "Delete"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Immutable Security Audit Trail */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 flex-col self-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                {ar ? "سجل الرقابة الجنائية والأمن السيادي غير القابل للتعديل (Immutable Audit Trail)" : "Sovereign Immutable Security Audit Log"}
              </CardTitle>
              <p className="text-xs text-on-surface-variant mt-1">
                {ar
                  ? "توثيق تلقائي لكافة العمليات الإدارية والوصول عبر القطاعات"
                  : "Every administrative and cross-sector access event is logged automatically"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 self-start">
              {["ALL", "USER", "PATIENT", "PRESCRIPTION", "LAB_SAMPLE", "NFC_CARD", "ANALYTICS"].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResourceFilter(res)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    resourceFilter === res ? "bg-primary text-on-primary" : "bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex items-center self-end w-[40%]">
            <Search className="pointer-events-none absolute inset-s-3.5 h-4 w-4 text-primary" />
            <input
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
              placeholder={ar ? "بحث في سجل المراجعة باسم المنفذ أو المسار أو الدور..." : "Filter audit logs by actor name, path, IP, or role..."}
              className="h-11 w-full rounded-xl border border-primary/25 bg-surface-container-low ps-10 pe-10 text-sm text-on-surface outline-none transition focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
            {auditQuery && (
              <button
                type="button"
                onClick={() => setAuditQuery("")}
                className="absolute inset-e-3 rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant sticky top-0">
              <tr>
                <th className="p-3 text-start">{ar ? "التوقيت" : "Timestamp"}</th>
                <th className="p-3 text-start">{ar ? "المنفذ (Actor)" : "Actor"}</th>
                <th className="p-3 text-start">{ar ? "الدور" : "Role"}</th>
                <th className="p-3 text-start">{ar ? "المورد" : "Resource"}</th>
                <th className="p-3 text-start">{ar ? "العملية والمسار" : "Method & Path"}</th>
                <th className="p-3 text-start">{ar ? "الحالة" : "Status"}</th>
                <th className="p-3 text-end">{ar ? "عنوان IP" : "IP Address"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-surface-container-low/40">
                  <td className="p-3 font-mono text-on-surface-variant">
                    {new Date(l.createdAt).toLocaleTimeString(ar ? "ar-EG" : "en-US")}
                  </td>
                  <td className="p-3 font-semibold">
                    {l.actor ? (ar ? l.actor.fullNameAr : l.actor.fullNameEn) : ar ? "النظام الآلي" : "System"}
                  </td>
                  <td className="p-3">
                    <Badge tone="secondary">{ROLES[l.role]?.[locale] ?? l.role}</Badge>
                  </td>
                  <td className="p-3 font-mono font-bold text-primary">{l.resourceType ?? "API"}</td>
                  <td className="p-3 font-mono" dir="ltr">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold me-1.5 ${
                        l.method === "POST"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : l.method === "PATCH" || l.method === "DELETE"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-blue-500/15 text-blue-600"
                      }`}
                    >
                      {l.method}
                    </span>
                    {l.path}
                  </td>
                  <td className="p-3">
                    <Badge tone={l.statusCode < 400 ? "success" : "error"}>{l.statusCode}</Badge>
                  </td>
                  <td className="p-3 text-end font-mono text-on-surface-variant" dir="ltr">
                    {l.ip ?? "127.0.0.1"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Staff Confirmation Modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={ar ? "تأكيد حذف حساب الموظف نهائياً" : "Confirm Permanent Staff Deletion"}
      >
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error leading-relaxed">
              {ar
                ? `سيتم حذف حساب (${deleteTarget.fullNameAr}) نهائياً وإلغاء جميع صلاحيات دخوله للمنظومة، مع الحفاظ على سلامة السجلات الطبية السابقة.`
                : `This will permanently delete (${deleteTarget.fullNameEn}) and revoke all portal sessions while preserving historical clinical audit integrity.`}
            </div>
            <div className="text-xs font-mono text-on-surface-variant" dir="ltr">
              {deleteTarget.email} • {ROLES[deleteTarget.role]?.[locale] ?? deleteTarget.role}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={busy}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={confirmDeleteStaff}
              >
                {ar ? "تأكيد الحذف النهائي" : "Delete Permanently"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Single Staff Member Onboarding Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={ar ? "إضافة موظف جديد" : "New staff member"}>
        <form onSubmit={create} className="flex flex-col gap-3">
          <input className={field} type="email" dir="ltr" required placeholder="email@hospital.gov.eg" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <select className={field} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>{v[locale]}</option>
            ))}
          </select>

          {f.role === "LAB_TECH" && (
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-2.5 space-y-1.5">
              <span className="text-[11px] font-bold text-primary block">
                {ar ? "تحديد المسار الوظيفي داخل المعمل / مركز الأشعة:" : "Lab vs Radiology Sub-Role:"}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { en: "Diagnostic Lab Specialist", ar: "أخصائي تحاليل طبية", label: ar ? "🧪 أخصائي تحاليل" : "Analysis Specialist" },
                  { en: "LAB_RECEPTION", ar: "استقبال معمل التحاليل", label: ar ? "🧪 استقبال تحاليل" : "Lab Reception" },
                  { en: "RADIOLOGY_SPECIALIST", ar: "أخصائي أشعة تشخيصية", label: ar ? "🩻 أخصائي أشعة" : "Radiology Specialist" },
                  { en: "RADIOLOGY_RECEPTION", ar: "استقبال مركز الأشعة", label: ar ? "🩻 استقبال أشعة" : "Radiology Reception" },
                ].map((opt) => (
                  <button
                    key={opt.en}
                    type="button"
                    onClick={() => setF({ ...f, specialityEn: opt.en, specialityAr: opt.ar })}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition ${
                      f.specialityEn === opt.en
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant/40 bg-surface-container-lowest text-on-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {f.role === "RECEPTIONIST" && (
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { en: "Reception Officer", ar: "موظف استقبال مواطنين", label: ar ? "استقبال مواطنين عام" : "Citizen Desk" },
                { en: "CLINIC_ASSISTANT", ar: "مساعد طبيب وإدارة عيادة", label: ar ? "مساعد عيادة طبيب" : "Clinic Assistant" },
              ].map((opt) => (
                <button
                  key={opt.en}
                  type="button"
                  onClick={() => setF({ ...f, specialityEn: opt.en, specialityAr: opt.ar })}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition ${
                    f.specialityEn === opt.en
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/40 bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <input className={field} dir="ltr" required minLength={2} maxLength={120} placeholder="Full name (English)" value={f.fullNameEn} onChange={(e) => setF({ ...f, fullNameEn: e.target.value })} />
          <input className={field} required minLength={2} maxLength={120} placeholder="الاسم بالعربية" value={f.fullNameAr} onChange={(e) => setF({ ...f, fullNameAr: e.target.value })} />
          <input className={field} dir="ltr" maxLength={60} placeholder={ar ? "رقم الترخيص المهني (اختياري)" : "License no. (optional)"} value={f.licenseNo} onChange={(e) => setF({ ...f, licenseNo: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} dir="ltr" maxLength={120} placeholder="Specialty (EN)" value={f.specialityEn} onChange={(e) => setF({ ...f, specialityEn: e.target.value })} />
            <input className={field} maxLength={120} placeholder="التخصص (عربي)" value={f.specialityAr} onChange={(e) => setF({ ...f, specialityAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={field} dir="ltr" maxLength={160} placeholder="Facility / Hospital / Pharmacy (EN)" value={f.facilityEn} onChange={(e) => setF({ ...f, facilityEn: e.target.value })} />
            <input className={field} maxLength={160} placeholder="المنشأة الطبية / الصيدلية (عربي)" value={f.facilityAr} onChange={(e) => setF({ ...f, facilityAr: e.target.value })} />
          </div>
          <Button type="submit" loading={busy}>{ar ? "إنشاء الحساب" : "Create account"}</Button>
        </form>
      </Modal>

      {/* 1-Click Facility + Staff Bundle Onboarding Modal (Clinic, Analysis/Radiology Lab, Hospital, Pharmacy) */}
      <Modal
        open={bundleOpen}
        onClose={() => setBundleOpen(false)}
        title={ar ? "تسجيل منشأة جديدة (عيادة / معمل تحاليل أو أشعة / مستشفى / صيدلية) بالموظفين" : "Onboard New Facility + Dedicated Staff Team"}
      >
        <form onSubmit={createBundle} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setBundleForm({ ...bundleForm, facilityType: "CLINIC" })}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                bundleForm.facilityType === "CLINIC"
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              {ar ? "عيادة طبيب" : "Clinic"}
            </button>
            <button
              type="button"
              onClick={() => setBundleForm({ ...bundleForm, facilityType: "LAB" })}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                bundleForm.facilityType === "LAB"
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              {ar ? "معمل" : "Lab / Imaging"}
            </button>
            <button
              type="button"
              onClick={() => setBundleForm({ ...bundleForm, facilityType: "HOSPITAL" })}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                bundleForm.facilityType === "HOSPITAL"
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <HospitalIcon className="h-4 w-4" />
              {ar ? "مستشفى" : "Hospital"}
            </button>
            <button
              type="button"
              onClick={() => setBundleForm({ ...bundleForm, facilityType: "PHARMACY" })}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                bundleForm.facilityType === "PHARMACY"
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <Pill className="h-4 w-4" />
              {ar ? "صيدلية" : "Pharmacy"}
            </button>
          </div>

          {/* Lab Sub-Type Selector: Analysis Lab vs Radiology Center */}
          {bundleForm.facilityType === "LAB" && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-2">
              <p className="text-xs font-bold text-on-surface">
                {ar ? "حدد نوع المعمل المطلوب إضافته:" : "Specify Laboratory Specialization:"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBundleForm({ ...bundleForm, labSubType: "ANALYSIS" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition ${
                    bundleForm.labSubType === "ANALYSIS"
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/50 bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <FlaskConical className="h-4 w-4" />
                  {ar ? "معمل تحاليل طبية" : "Medical Analysis Lab"}
                </button>
                <button
                  type="button"
                  onClick={() => setBundleForm({ ...bundleForm, labSubType: "RADIOLOGY" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition ${
                    bundleForm.labSubType === "RADIOLOGY"
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/50 bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <ScanEye className="h-4 w-4" />
                  {ar ? "معمل / مركز أشعة" : "Radiology Center"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className={field}
              required
              minLength={2}
              placeholder={
                bundleForm.facilityType === "CLINIC"
                  ? "اسم العيادة بالعربية (مثلاً: عيادة د. شريف للقلب)"
                  : bundleForm.facilityType === "LAB"
                    ? bundleForm.labSubType === "RADIOLOGY"
                      ? "اسم مركز الأشعة بالعربية (مثلاً: مركز ألفا للأشعة - المهندسين)"
                      : "اسم معمل التحاليل بالعربية (مثلاً: معمل المختبر - المعادي)"
                    : bundleForm.facilityType === "PHARMACY"
                      ? "اسم الصيدلية بالعربية (مثلاً: صيدلية الشفاء - مدينة نصر)"
                      : "اسم المستشفى بالعربية (مثلاً: مستشفى السلام الدولي)"
              }
              value={bundleForm.facilityAr}
              onChange={(e) => setBundleForm({ ...bundleForm, facilityAr: e.target.value })}
            />
            <input
              className={field}
              dir="ltr"
              required
              minLength={2}
              placeholder={
                bundleForm.facilityType === "CLINIC"
                  ? "Clinic Name (EN)"
                  : bundleForm.facilityType === "LAB"
                    ? bundleForm.labSubType === "RADIOLOGY"
                      ? "Radiology Center Name (EN)"
                      : "Analysis Lab Name (EN)"
                    : bundleForm.facilityType === "PHARMACY"
                      ? "Pharmacy Name (EN)"
                      : "Hospital Name (EN)"
              }
              value={bundleForm.facilityEn}
              onChange={(e) => setBundleForm({ ...bundleForm, facilityEn: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              className={field}
              dir="ltr"
              placeholder={ar ? "رقم ترخيص المنشأة" : "Facility License No."}
              value={bundleForm.licenseNo}
              onChange={(e) => setBundleForm({ ...bundleForm, licenseNo: e.target.value })}
            />
            <input
              className={field}
              placeholder={ar ? "التخصص (عربي)" : "Specialty (AR)"}
              value={bundleForm.specialityAr}
              onChange={(e) => setBundleForm({ ...bundleForm, specialityAr: e.target.value })}
            />
            <input
              className={field}
              dir="ltr"
              placeholder="Specialty (EN)"
              value={bundleForm.specialityEn}
              onChange={(e) => setBundleForm({ ...bundleForm, specialityEn: e.target.value })}
            />
          </div>

          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-bold text-primary">
              {bundleForm.facilityType === "CLINIC"
                ? (ar ? "1️⃣ بيانات الطبيب صاحب العيادة (تُفتح له المواعيد والكشف تلقائياً)" : "1️⃣ Clinic Physician Account")
                : bundleForm.facilityType === "LAB"
                  ? bundleForm.labSubType === "RADIOLOGY"
                    ? (ar ? "1️⃣ موظف استقبال مركز الأشعة (يستقبل حجوزات الأشعة من التطبيق)" : "1️⃣ Radiology Receptionist")
                    : (ar ? "1️⃣ موظف استقبال معمل التحاليل (يستقبل حجوزات سحب العينات)" : "1️⃣ Lab Receptionist")
                  : bundleForm.facilityType === "PHARMACY"
                    ? (ar ? "1️⃣ مدير الصيدلية / الصيدلي المسؤول (تحقق وصرف وتحصيل التأمين)" : "1️⃣ Chief Pharmacist")
                    : (ar ? "1️⃣ مسؤول عمليات المستشفى والطوارئ (يستقبل الإحالات والأسرة)" : "1️⃣ Hospital & ER Operations Officer")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={field}
                required
                minLength={2}
                placeholder={ar ? "الاسم بالكامل (عربي)" : "Full Name (AR)"}
                value={bundleForm.primaryNameAr}
                onChange={(e) => setBundleForm({ ...bundleForm, primaryNameAr: e.target.value })}
              />
              <input
                className={field}
                dir="ltr"
                required
                minLength={2}
                placeholder="Full Name (EN)"
                value={bundleForm.primaryNameEn}
                onChange={(e) => setBundleForm({ ...bundleForm, primaryNameEn: e.target.value })}
              />
            </div>
            <input
              className={field}
              type="email"
              name="bundle-primary-email"
              autoComplete="off"
              dir="ltr"
              required
              placeholder="primary.staff@mnis.eg"
              value={bundleForm.primaryEmail}
              onChange={(e) => setBundleForm({ ...bundleForm, primaryEmail: e.target.value })}
            />
          </div>

          <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 space-y-2">
            <p className="text-xs font-bold text-secondary">
              {bundleForm.facilityType === "CLINIC"
                ? (ar ? "2️⃣ الموظف المساعد للطبيب (يدير الحجوزات والطابور بدون ملف طبي)" : "2️⃣ Doctor's Clinic Assistant")
                : bundleForm.facilityType === "LAB"
                  ? bundleForm.labSubType === "RADIOLOGY"
                    ? (ar ? "2️⃣ أخصائي الأشعة التشخيصية (+ توليد حساب مدير مركز الأشعة تلقائياً)" : "2️⃣ Radiology Specialist (+ Director)")
                    : (ar ? "2️⃣ أخصائي التحاليل الطبية (+ توليد حساب مدير ومعتمد المعمل تلقائياً)" : "2️⃣ Lab Specialist (+ Verifier Director)")
                  : bundleForm.facilityType === "PHARMACY"
                    ? (ar ? "2️⃣ صيدلي الصرف المناوب (صرف الروشتات وحصص المزمن)" : "2️⃣ Dispensing Pharmacist")
                    : (ar ? "2️⃣ طبيب أخصائي بالمستشفى (+ تجهيز 2 سرير رعاية وتنويم فوراً)" : "2️⃣ Hospital Specialist Physician (+ 2 Beds)")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={field}
                name="bundle-secondary-name-ar"
                autoComplete="off"
                placeholder={ar ? "اسم الموظف الثاني (عربي) — اختياري" : "Secondary Staff Name (AR)"}
                value={bundleForm.secondaryNameAr}
                onChange={(e) => setBundleForm({ ...bundleForm, secondaryNameAr: e.target.value })}
              />
              <input
                className={field}
                name="bundle-secondary-name-en"
                autoComplete="off"
                dir="ltr"
                placeholder="Secondary Staff Name (EN)"
                value={bundleForm.secondaryNameEn}
                onChange={(e) => setBundleForm({ ...bundleForm, secondaryNameEn: e.target.value })}
              />
            </div>
            <input
              className={field}
              type="email"
              name="bundle-secondary-email"
              autoComplete="off"
              dir="ltr"
              placeholder={ar ? "بريد مختلف أو اتركه فارغاً للتوليد التلقائي" : "Different email (or leave blank to auto-generate)"}
              value={bundleForm.secondaryEmail}
              onChange={(e) => setBundleForm({ ...bundleForm, secondaryEmail: e.target.value })}
            />
          </div>

          <Button type="submit" loading={busy}>
            {ar ? "تسجيل المنشأة وتوليد حسابات الفريق" : "Provision Facility & Staff Accounts"}
          </Button>
        </form>
      </Modal>

      {/* Bundle Created Credentials Modal */}
      <Modal
        open={bundleCreds !== null}
        onClose={() => setBundleCreds(null)}
        title={ar ? "تم تسجيل المنشأة وتفعيل حسابات فريق العمل" : "Facility & Staff Team Credentials Provisioned"}
      >
        {bundleCreds && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {ar
                  ? `المنشأة (${bundleCreds.facilityAr}) أصبحت فعالة فوراً بالشبكة القومية.`
                  : `${bundleCreds.facilityEn} is now active on the MNIS network.`}
              </span>
            </div>
            {bundleCreds.accounts.map((acc, idx) => (
              <div key={idx} className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">
                    {ar ? acc.roleLabelAr : acc.roleLabelEn}
                  </span>
                  <Badge tone="success">{ar ? "جاهز للدخول الفوري" : "Ready"}</Badge>
                </div>
                <p className="text-xs font-semibold text-on-surface">
                  {ar ? String(acc.user.fullNameAr ?? "") : String(acc.user.fullNameEn ?? "")}
                </p>
                <div className="flex items-center justify-between rounded bg-surface-container-lowest px-2.5 py-1.5 text-xs font-mono" dir="ltr">
                  <span>{String(acc.user.email ?? "")}</span>
                  <span className="font-bold text-secondary">{acc.temporaryPassword}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${String(acc.user.email ?? "")} / ${acc.temporaryPassword}`);
                      push("info", ar ? "تم نسخ بيانات الدخول" : "Credentials copied");
                    }}
                    className="p-1 text-on-surface-variant hover:text-primary"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button onClick={() => setBundleCreds(null)}>{ar ? "تم الحفظ" : "Done"}</Button>
          </div>
        )}
      </Modal>

      <CredentialModal open={pw !== null} onClose={() => setPw(null)} password={pw ?? ""} />
    </div>
  );
}
