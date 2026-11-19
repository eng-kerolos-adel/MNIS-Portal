"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { UsersRound, UserPlus, KeyRound, Power, ShieldCheck, Lock, Database, Activity, FileSpreadsheet, RefreshCw, Building2, Stethoscope, FlaskConical, Hospital as HospitalIcon, Copy, CheckCircle2 } from "lucide-react";
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
type U = Awaited<ReturnType<typeof api.listUsers>>[number];
type FacilityItem = Awaited<ReturnType<typeof api.getFacilities>>[number];
type BundleCreds = Awaited<ReturnType<typeof api.createFacilityBundle>>;
const ROLES: Record<string, { en: string; ar: string }> = {
  DOCTOR: { en: "Physician", ar: "طبيب" },
  PHARMACIST: { en: "Pharmacist", ar: "صيدلي" },
  LAB_TECH: { en: "Lab specialist", ar: "أخصائي معمل" },
  HOSPITAL_STAFF: { en: "Hospital staff", ar: "طاقم المستشفى" },
  EXECUTIVE: { en: "Executive", ar: "قيادة تنفيذية" },
  RECEPTIONIST: { en: "Receptionist / Assistant", ar: "استقبال / مساعد عيادة" },
  ADMIN: { en: "Administrator", ar: "مدير النظام" },
  PATIENT: { en: "Citizen", ar: "مواطن" },
};
const FACILITY_LABELS: Record<string, { en: string; ar: string; tone: "secondary" | "success" | "warning" | "neutral" }> = {
  CLINIC: { en: "Doctor Clinic", ar: "عيادة طبيب", tone: "secondary" },
  LAB: { en: "Diagnostic Lab", ar: "معمل تحاليل", tone: "warning" },
  HOSPITAL: { en: "Hospital", ar: "مستشفى", tone: "success" },
  PHARMACY: { en: "Pharmacy", ar: "صيدلية", tone: "neutral" },
  COMMAND: { en: "Command Center", ar: "مركز قيادة", tone: "neutral" },
};
const field = "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export default function StaffUsersPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const { user: me } = useAuth();
  const ar = locale === "ar";
  const [users, setUsers] = useState<U[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [posture, setPosture] = useState<any>(null);
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");
  const [open, setOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleCreds, setBundleCreds] = useState<BundleCreds | null>(null);
  const [bundleForm, setBundleForm] = useState<{
    facilityType: "CLINIC" | "LAB" | "HOSPITAL";
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
  const [sessionsCount, setSessionsCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [uList, facList, logs, pos, sessions] = await Promise.all([
        api.listUsers(),
        api.getFacilities().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getSecurityPosture().catch(() => null),
        api.getActiveSessions().catch(() => []),
      ]);
      setUsers(uList);
      setFacilities(facList);
      setAuditLogs(logs);
      setPosture(pos);
      setSessionsCount(sessions.length);
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

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
      setF({ email: "", role: "DOCTOR", fullNameEn: "", fullNameAr: "", licenseNo: "", specialityEn: "", specialityAr: "", facilityEn: "", facilityAr: "" });
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
            : "doctor";
      const secEmail =
        rawSec && rawSec !== priEmail
          ? rawSec
          : `${rolePrefix}.${localPart || "staff"}@${domainPart || "mnis.eg"}`;

      const res = await api.createFacilityBundle({
        facilityType: bundleForm.facilityType,
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
          ? `تم إنشاء المنشأة الطبية (${res.facilityAr}) وتفعيل حسابات فريق العمل بنجاح`
          : `Facility (${res.facilityEn}) & staff team provisioned`
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
      fac.facilityType === "LAB"
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
      specialityEn: fac.facilityType === "CLINIC" ? "CLINIC_ASSISTANT" : fac.facilityType === "LAB" ? "LAB_RECEPTION" : "",
      specialityAr: fac.facilityType === "CLINIC" ? "مساعد طبيب وإدارة عيادة" : fac.facilityType === "LAB" ? "استقبال وسحب عينات المعمل" : "",
      facilityEn: fac.facilityEn,
      facilityAr: fac.facilityAr,
    });
    setOpen(true);
  }

  async function toggle(u: U) {
    if (u.id === me?.id) return;
    try {
      await api.setUserActive(u.id, !u.isActive);
      push("success", ar ? "تم تحديث صلاحية الحساب وإلغاء الجلسات النشطة عند الإيقاف" : "Account status updated");
      await load();
    } catch (e) {
      handleError(e);
    }
  }

  async function reset(u: U) {
    if (!window.confirm(ar ? "إعادة تعيين كلمة المرور؟ ستُنهى جميع جلسات المستخدم النشطة فوراً." : "Reset password? All active sessions for this user will be revoked.")) return;
    try {
      setPw((await api.resetUserPassword(u.id)).temporaryPassword);
      await load();
    } catch (e) {
      handleError(e);
    }
  }

  const filteredLogs = auditLogs.filter((l) => resourceFilter === "ALL" || (l.resourceType ?? "SYSTEM") === resourceFilter);
  const filteredFacilities = facilities.filter((fac) => facilityFilter === "ALL" || fac.facilityType === facilityFilter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UsersRound}
        title={ar ? "حوكمة النظام، حسابات الموظفين، ومركز الأمن الرقمي" : "National Security, Audit Trail & Staff Governance"}
        badge={ar ? "منصة الحوكمة والرقابة الوطنية" : "National Governance Portal"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {sessionsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const r = await api.revokeAllSessions();
                    push("success", ar ? `تم إنهاء ${r.revoked} جلسة نشطة` : `Revoked ${r.revoked} active sessions`);
                    await load();
                  } catch (e) {
                    handleError(e);
                  }
                }}
              >
                {ar ? `إنهاء الجلسات النشطة (${sessionsCount})` : `Revoke Sessions (${sessionsCount})`}
              </Button>
            )}
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
              {ar ? "تحديث السجلات" : "Refresh"}
            </Button>
            <Button variant="secondary" icon={<Building2 className="h-4 w-4" />} onClick={() => setBundleOpen(true)}>
              {ar ? "إضافة عيادة / معمل / مستشفى بالموظفين" : "Add Clinic / Lab / Hospital + Staff"}
            </Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              {ar ? "موظف جديد" : "New staff member"}
            </Button>
          </div>
        }
      />

      {/* Sovereign Security & 120M Scale Posture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-s-4 border-s-emerald-600">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-1">
            <Lock className="w-4 h-4" />
            {ar ? "حماية وأمن البيانات الشخصية" : "Data Privacy & Encryption"}
          </div>
          <div className="text-base font-black text-on-surface">{ar ? "تشفير طبي معتمد" : "Certified Medical Encryption"}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? "حماية مشفرة لأرقام المواطنين القومية مع فحص وبحث فوري مؤمَّن على مستوى الجمهورية"
              : "Encrypted citizen national IDs with secure instant nationwide directory lookup"}
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
            {ar ? "نطاق التغطية القومية الموحدة" : "Unified National Coverage"}
          </div>
          <div className="text-base font-black text-on-surface">{ar ? "27 محافظة مترابطة" : "27 Governorates Linked"}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? "تكامل شامل عبر عيادات ومعامل ومستشفيات المحافظات مع مؤشرات إحصائية لحظية"
              : "Unified integration across governorate clinics, labs, and hospitals with real-time reporting"}
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
              ? `الجلسات النشطة: ${posture?.activeSessions ?? 1} • محاولات مرفوضة: ${posture?.failedRequests ?? 0}`
              : `Active Sessions: ${posture?.activeSessions ?? 1} • Blocked/Failed: ${posture?.failedRequests ?? 0}`}
          </p>
        </Card>
      </div>

      {/* Nationwide Registered Medical Facilities Directory */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {ar
                ? `دليل المنشآت الطبية المسجلة بالجمهورية (${facilities.length})`
                : `Nationwide Registered Medical Facilities (${facilities.length})`}
            </CardTitle>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {ar
                ? "عيادات الأطباء المستقلة، المعامل التشخيصية، المستشفيات، والصيدليات مع فرق العمل المخصصة لكل منشأة"
                : "Doctor clinics, diagnostic laboratories, hospitals, and pharmacies with their dedicated staff teams"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "CLINIC", "LAB", "HOSPITAL", "PHARMACY"] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setFacilityFilter(tp)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  facilityFilter === tp
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {tp === "ALL" ? (ar ? "الكل" : "All") : FACILITY_LABELS[tp]?.[locale] ?? tp}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredFacilities.map((fac) => {
            const meta = FACILITY_LABELS[fac.facilityType] ?? FACILITY_LABELS.COMMAND!;
            return (
              <div key={fac.key} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {ar ? fac.facilityAr : fac.facilityEn}
                      </span>
                      <Badge tone={meta.tone}>{meta[locale]}</Badge>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5" dir="ltr">
                      {fac.facilityEn}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<UserPlus className="h-3.5 w-3.5" />}
                    onClick={() => openAddStaffForFacility(fac)}
                  >
                    {ar ? "+ موظف" : "+ Staff"}
                  </Button>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-outline-variant/30 pt-2">
                  {fac.staff.map((st) => (
                    <div key={st.id} className="flex items-center justify-between text-xs bg-surface-container-low/70 rounded-lg px-2.5 py-1.5">
                      <div className="min-w-0">
                        <span className="font-semibold text-on-surface">
                          {ar ? st.fullNameAr : st.fullNameEn}
                        </span>
                        <span className="text-[11px] text-on-surface-variant ms-2 font-mono" dir="ltr">
                          {st.email}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-secondary">
                        {st.specialityEn === "CLINIC_ASSISTANT"
                          ? (ar ? "مساعد الطبيب" : "Clinic Assistant")
                          : st.specialityEn === "LAB_RECEPTION"
                            ? (ar ? "استقبال المعمل" : "Lab Reception")
                            : (ROLES[st.role]?.[locale] ?? st.role)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Staff Accounts Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {ar ? "حسابات الكوادر الطبية والإدارية (RBAC)" : "Medical & Administrative Staff Accounts"} ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">{locale === "ar" ? u.fullNameAr : u.fullNameEn}</p>
                <p dir="ltr" className="text-start text-xs text-on-surface-variant">
                  {u.email} {u.licenseNo ? `• Lic: ${u.licenseNo}` : ""}
                </p>
                {(u.specialityAr || u.specialityEn || u.facilityAr || u.facilityEn) && (
                  <p className="text-[11px] text-secondary font-semibold mt-0.5">
                    {[ar ? (u.specialityAr ?? u.specialityEn) : (u.specialityEn ?? u.specialityAr), ar ? (u.facilityAr ?? u.facilityEn) : (u.facilityEn ?? u.facilityAr)].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary">{ROLES[u.role]?.[locale] ?? u.role}</Badge>
                <Badge tone={u.isActive ? "success" : "error"}>
                  {u.isActive ? (ar ? "نشط" : "Active") : ar ? "موقوف" : "Disabled"}
                </Badge>
                {u.mustChangePassword && <Badge tone="warning">{ar ? "كلمة مؤقتة" : "Temp password"}</Badge>}
                <Button size="sm" variant="outline" icon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => reset(u)}>
                  {ar ? "كلمة جديدة" : "Reset"}
                </Button>
                <Button size="sm" variant="ghost" icon={<Power className="h-3.5 w-3.5" />} disabled={u.id === me?.id} onClick={() => toggle(u)}>
                  {u.isActive ? (ar ? "إيقاف" : "Disable") : ar ? "تفعيل" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Immutable Security Audit Trail */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {ar ? "سجل الرقابة الجنائية والأمن السيادي غير القابل للتعديل (Immutable Audit Trail)" : "Sovereign Immutable Security Audit Log"}
            </CardTitle>
            <p className="text-xs text-on-surface-variant mt-1">
              {ar
                ? "يتم توثيق كافة عمليات الاطلاع أو التعديل على ملفات المواطنين والروشتات والتحاليل والقرارات الإدارية تلقائياً"
                : "Every read/write action across patient records, prescriptions, labs, and analytics is automatically logged"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "PATIENT", "PRESCRIPTION", "LAB_SAMPLE", "NFC_CARD", "ANALYTICS", "USER"].map((res) => (
              <button
                key={res}
                onClick={() => setResourceFilter(res)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  resourceFilter === res ? "bg-primary text-on-primary" : "bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                {res}
              </button>
            ))}
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
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold me-1.5 ${
                      l.method === "POST" ? "bg-emerald-500/15 text-emerald-600" :
                      l.method === "PATCH" || l.method === "DELETE" ? "bg-amber-500/15 text-amber-600" :
                      "bg-blue-500/15 text-blue-600"
                    }`}>
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

      <Modal open={open} onClose={() => setOpen(false)} title={ar ? "موظف جديد" : "New staff member"}>
        <form onSubmit={create} className="flex flex-col gap-3">
          <input className={field} type="email" dir="ltr" required placeholder="email@hospital.gov.eg" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <select className={field} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {Object.entries(ROLES).filter(([k]) => k !== "PATIENT").map(([k, v]) => (
              <option key={k} value={k}>{v[locale]}</option>
            ))}
          </select>
          <input className={field} dir="ltr" required minLength={2} maxLength={120} placeholder="Full name (English)" value={f.fullNameEn} onChange={(e) => setF({ ...f, fullNameEn: e.target.value })} />
          <input className={field} required minLength={2} maxLength={120} placeholder="الاسم بالعربية" value={f.fullNameAr} onChange={(e) => setF({ ...f, fullNameAr: e.target.value })} />
          <input className={field} dir="ltr" maxLength={60} placeholder={ar ? "رقم الترخيص المهني (اختياري)" : "License no. (optional)"} value={f.licenseNo} onChange={(e) => setF({ ...f, licenseNo: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} dir="ltr" maxLength={120} placeholder="Specialty (EN)" value={f.specialityEn} onChange={(e) => setF({ ...f, specialityEn: e.target.value })} />
            <input className={field} maxLength={120} placeholder="التخصص (عربي)" value={f.specialityAr} onChange={(e) => setF({ ...f, specialityAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={field} dir="ltr" maxLength={160} placeholder="Facility / Hospital (EN)" value={f.facilityEn} onChange={(e) => setF({ ...f, facilityEn: e.target.value })} />
            <input className={field} maxLength={160} placeholder="المنشأة الطبية (عربي)" value={f.facilityAr} onChange={(e) => setF({ ...f, facilityAr: e.target.value })} />
          </div>
          <Button type="submit" loading={busy}>{ar ? "إنشاء الحساب" : "Create account"}</Button>
        </form>
      </Modal>

      {/* 1-Click Facility + Staff Bundle Onboarding Modal */}
      <Modal
        open={bundleOpen}
        onClose={() => setBundleOpen(false)}
        title={ar ? "تسجيل منشأة طبية جديدة بطاقمها الكامل بالشبكة القومية" : "Onboard New Medical Facility + Dedicated Staff Team"}
      >
        <form onSubmit={createBundle} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
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
              {ar ? "عيادة طبيب + مساعد" : "Doctor Clinic"}
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
              {ar ? "معمل + موظفوه" : "Diagnostic Lab"}
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
              {ar ? "مستشفى + طاقمه" : "Hospital + Beds"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className={field}
              required
              minLength={2}
              placeholder={
                bundleForm.facilityType === "CLINIC"
                  ? "اسم العيادة بالعربية (مثلاً: عيادة د. شريف للقلب - المعادي)"
                  : bundleForm.facilityType === "LAB"
                    ? "اسم المعمل بالعربية (مثلاً: معمل رويال لاب - مدينة نصر)"
                    : "اسم المستشفى بالعربية (مثلاً: مستشفى السلام الدولي - المعادي)"
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
                    ? "Laboratory Name (EN)"
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
                ? (ar ? "1️⃣ بيانات الطبيب صاحب العيادة (تُفتح له المواعيد والكشف تلقائياً)" : "1️⃣ Clinic Physician Account (Doctor + Schedule)")
                : bundleForm.facilityType === "LAB"
                  ? (ar ? "1️⃣ موظف استقبال المعمل (يستقبل حجوزات المواطنين من التطبيق ويؤكدها)" : "1️⃣ Lab Receptionist Account (Receives Mobile Bookings)")
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
                ? (ar ? "2️⃣ الموظف المساعد للطبيب (يدير حجوزات العيادة وطابور الدخول بدون ملف طبي)" : "2️⃣ Doctor's Clinic Assistant (Manages Appointments & Queue Only)")
                : bundleForm.facilityType === "LAB"
                  ? (ar ? "2️⃣ أخصائي التحاليل الطبية (يدخل ويعتمد نتائج التحاليل في نفس المعمل)" : "2️⃣ Diagnostic Lab Specialist (Enters/Verifies Results)")
                  : (ar ? "2️⃣ طبيب أخصائي بالمستشفى (+ تجهيز 2 سرير رعاية وتنويم فوراً)" : "2️⃣ Hospital Specialist Physician (+ 2 Initial Beds)")}
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
        title={ar ? "تم تسجيل المنشأة الطبية وتفعيل حسابات فريق العمل" : "Facility & Staff Team Credentials Provisioned"}
      >
        {bundleCreds && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {ar
                  ? `المنشأة (${bundleCreds.facilityAr}) أصبحت فعالة فوراً وتظهر في تطبيق المواطن وبوابات الأطباء والمعامل.`
                  : `${bundleCreds.facilityEn} is now live across the Citizen App and Web Portal.`}
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
