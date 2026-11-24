"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Eye,
  HeartPulse,
  Hospital,
  Loader2,
  LogOut,
  Menu,
  Pill,
  Plus,
  ScanLine,
  Search,
  Siren,
  Stethoscope,
  TestTubes,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { api, patientId } from "@/lib/data/service";
import type { NationalIdentity } from "@/types/domain";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { NotificationsDropdown } from "@/components/ui/NotificationsDropdown";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { pick } from "@/lib/utils/format";
import { BRAND_LOGO_URL } from "@/lib/assets";

export function Header({
  title,
  subtitle,
  staffName,
  staffRole,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  staffName: string;
  staffRole: string;
  onMenu: () => void;
}) {
  const { t, locale } = useLocale();
  const { push } = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();
  const ar = locale === "ar";
  const role = user?.role ?? "";
  const spec = (user?.specialityEn ?? "").toUpperCase();
  const isClinicAst = spec === "CLINIC_ASSISTANT";
  const isLabRec = spec === "LAB_RECEPTION";
  const isRadRec = spec === "RADIOLOGY_RECEPTION";
  const isRadiology = role === "LAB_TECH" && spec.startsWith("RADIOLOGY");
  // Strictly hide citizen search from non-clinical admin/executive and sub-receptionists
  const showCitizenSearch =
    Boolean(user) &&
    role !== "ADMIN" &&
    role !== "EXECUTIVE" &&
    !isClinicAst &&
    !isLabRec &&
    !isRadRec;

  // Strict per-role visibility: Quick Medical File, Consult, and Queue ONLY for Physician Doctor!
  const isPhysicianDoctor = role === "DOCTOR" && !isClinicAst;
  const canEmergencyAlert = Boolean(user) && role !== "ADMIN";

  const [query, setQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [results, setResults] = useState<NationalIdentity[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyPatientId, setBusyPatientId] = useState<string | null>(null);
  const [quickModalPatient, setQuickModalPatient] = useState<NationalIdentity | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyBusy, setEmergencyBusy] = useState(false);
  const [emSeverity, setEmSeverity] = useState<"CRITICAL" | "URGENT">("CRITICAL");
  const [emLocation, setEmLocation] = useState("");
  const [emMti, setEmMti] = useState("");
  const [emDetails, setEmDetails] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmLocation((ar ? user?.facilityAr : user?.facilityEn) || subtitle || "");
  }, [user?.facilityAr, user?.facilityEn, subtitle, ar]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    }
    function handleShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setOpenDropdown(true);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    if (!openDropdown) return;
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchPatients(query.trim());
        if (!cancelled) setResults(res.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, openDropdown]);

  async function quickAddToQueue(p: NationalIdentity) {
    const pid = patientId(p);
    setBusyPatientId(pid);
    try {
      const tk = await api.createTicket({
        patientId: pid,
        reasonEn: "Clinical evaluation & consultation",
        reasonAr: "كشف طبي وفحص سريري بالعيادة",
        isEmergency: false,
      });
      push(
        "success",
        ar ? `تم إدراج ${pick(p.fullName, locale)} في طابور العيادة` : `Added ${pick(p.fullName, locale)} to clinic queue`,
        (tk as { ticketNo?: string })?.ticketNo ?? p.mti
      );
      setOpenDropdown(false);
    } catch {
      push("error", ar ? "تعذر الإدراج في الطابور" : "Could not add to queue");
    } finally {
      setBusyPatientId(null);
    }
  }

  async function handleEmergencySubmit(e: FormEvent) {
    e.preventDefault();
    if (!emLocation.trim() || emDetails.trim().length < 3) return;
    setEmergencyBusy(true);
    try {
      const res = await api.triggerEmergencyAlert({
        severity: emSeverity,
        location: emLocation.trim(),
        patientMti: emMti.trim() || undefined,
        details: emDetails.trim(),
      });
      push(
        "success",
        ar ? "تم إطلاق نداء الطوارئ الفوري بنجاح" : "Emergency Alert Dispatched",
        ar
          ? `تم إشعار ${res.dispatchedCount} من الأطباء وفرق الطوارئ بالمنظومة`
          : `Notified ${res.dispatchedCount} clinical & ER responders`
      );
      setEmergencyOpen(false);
      setEmDetails("");
      setEmMti("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mnis:refresh-notifs"));
      }
    } catch {
      push("error", ar ? "تعذر إرسال نداء الطوارئ حالياً" : "Failed to dispatch emergency alert");
    } finally {
      setEmergencyBusy(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container-lowest/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image src={BRAND_LOGO_URL} alt="MNIS" width={32} height={32} className="hidden h-8 w-8 rounded-md object-contain sm:block" unoptimized />
          <div className="min-w-0 flex flex-col leading-tight">
            <span className="truncate text-sm font-bold text-primary">{title}</span>
            {subtitle && <span className="truncate text-[11px] text-on-surface-variant">{subtitle}</span>}
          </div>
        </div>

        {/* Citizen Existence & Identity Verification Search (strictly role-scoped; hidden for Admin/Executive & sub-reception) */}
        {showCitizenSearch ? (
        <div ref={containerRef} className="relative hidden flex-1 max-w-md md:block">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute start-3 h-4 w-4 text-on-surface-variant" />
            <input
              ref={searchInputRef}
              value={query}
              onFocus={() => setOpenDropdown(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpenDropdown(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  setOpenDropdown(true);
                }
              }}
              placeholder={
                ar
                  ? "التحقق من وجود مواطن (الاسم / الرقم القومي / MTI)..."
                  : "Verify Citizen in Registry (Name, National ID, MTI)..."
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low py-2 ps-9 pe-16 text-xs sm:text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute end-2.5 rounded-md p-0.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute end-2.5 hidden sm:inline-block rounded border border-outline-variant/50 bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                Ctrl+K
              </kbd>
            )}
          </div>

          {openDropdown && (
            <div className="absolute inset-x-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3 shadow-2xl z-50">
              <div className="mb-2 flex items-center justify-between border-b border-outline-variant/30 pb-2 px-1">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-secondary" />
                  {isPhysicianDoctor
                    ? (ar ? "السجل الوطني للمرضى (وصول طبي كامل)" : "National Patient Registry (Clinical Access)")
                    : (ar ? "التحقق من وجود المواطن بالسجل الوطني" : "Citizen Registry Existence Check")}
                </span>
                {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary" />}
              </div>

              {!searching && results.length === 0 && (
                <p className="py-6 text-center text-xs text-on-surface-variant">
                  {ar ? "لا يوجد مواطن مطابق لهذا الاسم أو الرقم القومي أو كود MTI" : "No citizen matches this Name, National ID, or MTI"}
                </p>
              )}

              <div className="flex flex-col gap-2">
                {results.map((p) => {
                  const pid = patientId(p);
                  const maskedNid = p.nationalId ? (role === "DOCTOR" || role === "RECEPTIONIST" || role === "HOSPITAL_STAFF" ? p.nationalId : `••••••••••${p.nationalId.slice(-4)}`) : null;
                  return (
                    <div
                      key={pid || p.mti}
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-low/60 p-2.5 transition-colors hover:bg-surface-container-low"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-10 w-10 shrink-0">
                            <Image src={p.photoUrl} alt="" fill sizes="40px" className="rounded-lg object-cover" unoptimized />
                            {(isPhysicianDoctor || role === "HOSPITAL_STAFF") && (
                              <span className="absolute -bottom-1 -end-1 rounded bg-primary px-1 text-[9px] font-bold text-on-primary">
                                {p.bloodType}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isPhysicianDoctor ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickModalPatient(p);
                                    setOpenDropdown(false);
                                  }}
                                  className="truncate text-xs font-bold text-on-surface hover:text-primary hover:underline text-start"
                                >
                                  {pick(p.fullName, locale)}
                                </button>
                              ) : (
                                <span className="truncate text-xs font-bold text-on-surface text-start">
                                  {pick(p.fullName, locale)}
                                </span>
                              )}
                              <Badge tone="secondary">
                                {p.sex === "male" ? t("common.male") : t("common.female")} • {p.age}
                              </Badge>
                              {p.insuranceActive && (
                                <Badge tone="success">
                                  <BadgeCheck className="h-3 w-3 inline me-0.5" />
                                  {ar ? "مؤمن" : "Insured"}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-on-surface-variant font-mono">
                              <span>
                                MTI: <strong className="text-primary">{p.mti}</strong>
                              </span>
                              {maskedNid && (
                                <span>
                                  {ar ? "قومي:" : "NID:"} <strong className="text-on-surface">{maskedNid}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {(isPhysicianDoctor || role === "PHARMACIST" || role === "HOSPITAL_STAFF") && p.allergies[0] && (
                          <span className="shrink-0 rounded-md bg-error-container px-1.5 py-0.5 text-[10px] font-bold text-on-error-container flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {pick(p.allergies[0], locale)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-outline-variant/25 pt-2">
                        {isPhysicianDoctor && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickModalPatient(p);
                                setOpenDropdown(false);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                            >
                              <Eye className="h-3 w-3" />
                              {ar ? "الملف الطبي السريع" : "Quick File"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(false);
                                router.push(`/doctor/consultation?patientId=${encodeURIComponent(pid)}`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2.5 py-1 text-[11px] font-bold text-on-secondary-container hover:opacity-90"
                            >
                              <Stethoscope className="h-3 w-3" />
                              {ar ? "بدء الكشف" : "Consult"}
                            </button>
                            <button
                              type="button"
                              disabled={busyPatientId === pid}
                              onClick={() => quickAddToQueue(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                            >
                              <Plus className="h-3 w-3 text-tertiary" />
                              {ar ? "+ للطابور" : "+ Queue"}
                            </button>
                          </>
                        )}

                        {role === "RECEPTIONIST" && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(false);
                              router.push(`/reception/citizens?q=${encodeURIComponent(p.mti)}`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                          >
                            <UserCheck className="h-3 w-3" />
                            {ar ? "عرض بملف الاستقبال" : "Open in Reception"}
                          </button>
                        )}

                        {role === "PHARMACIST" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(false);
                                router.push("/pharmacy/dispensing-queue");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                            >
                              <Pill className="h-3 w-3" />
                              {ar ? "طابور الصرف" : "Dispensing Queue"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(false);
                                router.push(`/pharmacy/chronic-allowances?patientId=${encodeURIComponent(pid)}`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-high"
                            >
                              <Pill className="h-3 w-3 text-secondary" />
                              {ar ? "حصص المزمن" : "Chronic"}
                            </button>
                          </>
                        )}

                        {role === "LAB_TECH" && !isRadiology && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(false);
                                router.push("/lab/sample-intake");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                            >
                              <TestTubes className="h-3 w-3" />
                              {ar ? "استلام العينات" : "Sample Intake"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(false);
                                router.push("/lab/results");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-high"
                            >
                              <TestTubes className="h-3 w-3 text-secondary" />
                              {ar ? "نتائج التحاليل" : "Lab Results"}
                            </button>
                          </>
                        )}

                        {role === "LAB_TECH" && isRadiology && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(false);
                              router.push(`/lab/radiology?patientId=${encodeURIComponent(pid)}`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                          >
                            <ScanLine className="h-3 w-3" />
                            {ar ? "ملف الأشعة والتصوير الطبي" : "Open Radiology Studies"}
                          </button>
                        )}

                        {role === "HOSPITAL_STAFF" && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(false);
                              router.push("/hospital/er-triage");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary hover:opacity-90"
                          >
                            <Hospital className="h-3 w-3" />
                            {ar ? "فرز الطوارئ والاستقبال" : "ER Triage Desk"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 lg:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {ar ? "مزامنة حية" : "Live Sync"}
          </span>
          {canEmergencyAlert && (
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-error px-2.5 sm:px-3 py-2 text-xs font-bold text-on-error shadow-level-1 transition-opacity hover:opacity-90"
            >
              <Siren className="h-4 w-4" />
              <span className="hidden sm:inline">{t("common.emergencyCall")}</span>
            </button>
          )}
          <NotificationsDropdown />
          <ThemeToggle />
          <LanguageToggle />
          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:text-error"
            aria-label={ar ? "تسجيل الخروج" : "Sign out"}
            title={ar ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
          <div className="hidden items-center gap-2 border-s border-outline-variant/50 ps-3 sm:flex">
            <div className="flex flex-col text-end leading-tight">
              <span className="text-xs font-bold text-on-surface">{staffName}</span>
              <span className="text-[10px] text-on-surface-variant">{staffRole}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Instant Emergency Dispatch Modal */}
      <Modal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        title={ar ? "🚨 إطلاق نداء طوارئ فوري للمستشفيات والأطباء" : "🚨 Instant Emergency Dispatch Alert"}
      >
        <form onSubmit={handleEmergencySubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEmSeverity("CRITICAL")}
              className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                emSeverity === "CRITICAL"
                  ? "border-error bg-error text-on-error"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {ar ? "🔴 حرج جداً (تدخل فوري)" : "🔴 CRITICAL (Code Blue)"}
            </button>
            <button
              type="button"
              onClick={() => setEmSeverity("URGENT")}
              className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                emSeverity === "URGENT"
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {ar ? "🟠 عاجل (استدعاء فريق)" : "🟠 URGENT Dispatch"}
            </button>
          </div>
          <input
            required
            minLength={2}
            value={emLocation}
            onChange={(e) => setEmLocation(e.target.value)}
            placeholder={ar ? "الموقع / القسم / العيادة..." : "Location / Department / Facility..."}
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-error/50"
          />
          <input
            value={emMti}
            onChange={(e) => setEmMti(e.target.value)}
            dir="ltr"
            placeholder={ar ? "كود المواطن MTI (اختياري)" : "Citizen MTI code (optional)"}
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-error/50"
          />
          <textarea
            required
            minLength={3}
            rows={3}
            value={emDetails}
            onChange={(e) => setEmDetails(e.target.value)}
            placeholder={ar ? "اكتب تفاصيل الحالة الطارئة المطلوب الاستجابة لها فوراً..." : "Describe emergency details requiring immediate medical response..."}
            className="w-full rounded-lg bg-surface-container-low p-3 text-sm outline-none focus:ring-2 focus:ring-error/50"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEmergencyOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" variant="danger" loading={emergencyBusy} icon={<Siren className="h-4 w-4" />}>
              {ar ? "إرسال النداء الفوري" : "Dispatch Alert Now"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-Place Citizen Quick Medical Summary Modal — STRICTLY PHYSICIAN DOCTOR ONLY */}
      {isPhysicianDoctor && (
      <Modal
        open={!!quickModalPatient}
        onClose={() => setQuickModalPatient(null)}
        title={quickModalPatient ? pick(quickModalPatient.fullName, locale) : ""}
      >
        {quickModalPatient && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0">
                <Image src={quickModalPatient.photoUrl} alt="" fill sizes="64px" className="rounded-xl object-cover" unoptimized />
                <span className="absolute -bottom-1 -end-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                  {quickModalPatient.bloodType}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="secondary">
                    {quickModalPatient.sex === "male" ? t("common.male") : t("common.female")}، {quickModalPatient.age} {t("common.years")}
                  </Badge>
                  {quickModalPatient.insuranceActive && (
                    <Badge tone="success">{ar ? "تأمين صحي شامل سارٍ" : "UHIA Active"}</Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-on-surface">
                  MTI: <strong className="text-primary">{quickModalPatient.mti}</strong>
                </p>
                {quickModalPatient.nationalId && (
                  <p className="text-xs font-mono text-on-surface">
                    {ar ? "الرقم القومي:" : "National ID:"} <strong>{quickModalPatient.nationalId}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs font-bold text-on-surface-variant mb-1.5">
                  {ar ? "الأمراض المزمنة المسجلة" : "Chronic Conditions"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {quickModalPatient.chronicConditions.length === 0 ? (
                    <span className="text-xs text-on-surface-variant">{ar ? "لا يوجد" : "None"}</span>
                  ) : (
                    quickModalPatient.chronicConditions.map((c, i) => (
                      <Badge key={i} tone="warning">
                        {pick(c, locale)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-xs font-bold text-on-surface-variant mb-1.5">
                  {ar ? "الحساسية الدوائية والغذائية" : "Documented Allergies"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {quickModalPatient.allergies.length === 0 ? (
                    <span className="text-xs text-on-surface-variant">{ar ? "لا يوجد" : "None"}</span>
                  ) : (
                    quickModalPatient.allergies.map((a, i) => (
                      <Badge key={i} tone="error">
                        {pick(a, locale)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                icon={<Stethoscope className="h-4 w-4" />}
                onClick={() => {
                  const pid = patientId(quickModalPatient);
                  setQuickModalPatient(null);
                  router.push(`/doctor/consultation?patientId=${encodeURIComponent(pid)}`);
                }}
              >
                {ar ? "فتح غرفة الكشف الطبي" : "Open Consultation"}
              </Button>
              <Button
                variant="outline"
                icon={<Plus className="h-4 w-4" />}
                onClick={async () => {
                  await quickAddToQueue(quickModalPatient);
                  setQuickModalPatient(null);
                }}
              >
                {ar ? "إدراج في طابور العيادة" : "Add to Clinic Queue"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      )}
    </>
  );
}
