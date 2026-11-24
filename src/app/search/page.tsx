"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Scan, Pill, AlertTriangle, Stethoscope, TestTubes, Hospital, UserCheck, Loader2, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId } from "@/lib/data/service";
import { AppShell } from "@/components/layout/AppShell";
import { homeFor, ROLE_PORTAL } from "@/lib/nav";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pick } from "@/lib/utils/format";
import type { NationalIdentity } from "@/types/domain";

function SearchResults() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const { locale } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const handleError = useApiError();
  const router = useRouter();
  const ar = locale === "ar";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<NationalIdentity[]>([]);
  const [loading, setLoading] = useState(false);

  const role = user?.role ?? "";
  const spec = (user?.specialityEn ?? "").toUpperCase();
  const isBlocked =
    !user ||
    role === "ADMIN" ||
    role === "EXECUTIVE" ||
    role === "PATIENT" ||
    spec === "CLINIC_ASSISTANT" ||
    spec === "LAB_RECEPTION" ||
    spec === "RADIOLOGY_RECEPTION";
  const isPhysicianDoctor = role === "DOCTOR" && spec !== "CLINIC_ASSISTANT";
  const isRadiology = role === "LAB_TECH" && spec.startsWith("RADIOLOGY");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (isBlocked) {
      router.replace(homeFor(user.role, user.specialityEn));
    }
  }, [user, authLoading, isBlocked, router]);

  const load = useCallback(async (qStr: string) => {
    if (isBlocked) return;
    setLoading(true);
    try {
      const res = await api.searchPatients(qStr.trim());
      setResults(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError, isBlocked]);

  useEffect(() => {
    setQuery(initialQ);
    if (!isBlocked) void load(initialQ);
  }, [initialQ, load, isBlocked]);

  if (authLoading || isBlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const portal = ROLE_PORTAL[role] ?? "reception";

  return (
    <AppShell portal={portal}>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon={Search}
          title={
            isPhysicianDoctor
              ? (ar ? "البحث الطبي في سجل المواطنين" : "Clinical Patient Registry Search")
              : (ar ? "التحقق من وجود المواطن بالسجل الوطني" : "Citizen Registry Verification")
          }
          meta={
            <span className="text-xs font-semibold text-on-surface-variant">
              {isPhysicianDoctor
                ? (ar ? "بحث بالرقم القومي أو كود MTI أو الاسم مع كامل الإجراءات الطبية" : "Search by National ID, MTI, or Name")
                : (ar ? "تحقق من تسجيل المواطن بالمنظومة وعرض الإجراءات المخصصة لدورك الوظيفي فقط" : "Verify citizen registration with role-scoped actions only")}
            </span>
          }
        />

        <Card className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(query);
            }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                void load(e.target.value);
              }}
              placeholder={ar ? "ابحث بالاسم، كود الهوية الطبية (MTI-...)، أو الرقم القومي (14 رقماً)..." : "Search by Name, MTI-..., or 14-digit National ID..."}
              className="h-11 flex-1 rounded-xl bg-surface-container-low px-4 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </form>
        </Card>

        {loading && <p className="text-center text-sm py-8 text-on-surface-variant">{ar ? "جاري البحث في السجل الوطني..." : "Searching national registry..."}</p>}

        {!loading && results.length === 0 && (
          <p className="text-center text-sm py-8 text-on-surface-variant">
            {ar ? "لم يتم العثور على أي مواطنين يطابقون بحثك." : "No citizens found matching your query."}
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => {
              const pid = patientId(p);
              const maskedNid = p.nationalId
                ? (isPhysicianDoctor || role === "RECEPTIONIST" || role === "HOSPITAL_STAFF"
                    ? p.nationalId
                    : `••••••••••${p.nationalId.slice(-4)}`)
                : null;
              return (
                <Card key={p.mti} data-searchable-item>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0">
                        <Image src={p.photoUrl} alt="" fill sizes="56px" className="rounded-lg object-cover" unoptimized />
                        {(isPhysicianDoctor || role === "HOSPITAL_STAFF") && (
                          <span className="absolute -bottom-1 -end-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {p.bloodType}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{pick(p.fullName, locale)}</p>
                        <p className="text-xs font-mono font-semibold text-primary">MTI: {p.mti}</p>
                        {maskedNid && <p className="text-xs font-mono text-on-surface-variant">NID: {maskedNid}</p>}
                      </div>
                    </div>

                    {(isPhysicianDoctor || role === "PHARMACIST" || role === "HOSPITAL_STAFF") && p.allergies.length > 0 && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.allergies.map((a) => pick(a, locale)).join("، ")}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
                      <Badge tone={p.insuranceActive ? "success" : "neutral"}>
                        <BadgeCheck className="w-3 h-3 inline me-1" />
                        {p.insuranceActive ? (ar ? "تأمين شامل سارٍ" : "UHIA Active") : ar ? "بدون تأمين" : "Uninsured"}
                      </Badge>
                      {isPhysicianDoctor && p.chronicConditions.length > 0 && (
                        <Badge tone="warning">
                          {p.chronicConditions.length} {ar ? "أمراض مزمنة" : "Chronic"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/30 text-xs">
                      {isPhysicianDoctor && (
                        <Link
                          href={`/doctor/consultation?patientId=${encodeURIComponent(pid)}`}
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                        >
                          <Stethoscope className="w-3 h-3" />
                          {ar ? "بدء الكشف الطبي" : "Consult"}
                        </Link>
                      )}
                      {role === "RECEPTIONIST" && (
                        <Link
                          href={`/reception/citizens?q=${encodeURIComponent(p.mti)}`}
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          {ar ? "ملف الاستقبال" : "Reception Profile"}
                        </Link>
                      )}
                      {role === "PHARMACIST" && (
                        <>
                          <Link
                            href="/pharmacy/dispensing-queue"
                            className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                          >
                            <Pill className="w-3 h-3" />
                            {ar ? "طابور الصرف" : "Dispensing"}
                          </Link>
                          <Link
                            href={`/pharmacy/chronic-allowances?patientId=${encodeURIComponent(pid)}`}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container font-semibold flex items-center gap-1"
                          >
                            <Pill className="w-3 h-3 text-secondary" />
                            {ar ? "حصص المزمن" : "Allowances"}
                          </Link>
                        </>
                      )}
                      {role === "LAB_TECH" && !isRadiology && (
                        <Link
                          href="/lab/sample-intake"
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                        >
                          <TestTubes className="w-3 h-3" />
                          {ar ? "استلام العينات" : "Sample Intake"}
                        </Link>
                      )}
                      {role === "LAB_TECH" && isRadiology && (
                        <Link
                          href={`/lab/radiology?patientId=${encodeURIComponent(pid)}`}
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                        >
                          <Scan className="w-3 h-3" />
                          {ar ? "ملف الأشعة" : "Radiology"}
                        </Link>
                      )}
                      {role === "HOSPITAL_STAFF" && (
                        <Link
                          href="/hospital/er-triage"
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold flex items-center gap-1"
                        >
                          <Hospital className="w-3 h-3" />
                          {ar ? "فرز الطوارئ" : "ER Triage"}
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SearchResults />
    </Suspense>
  );
}
