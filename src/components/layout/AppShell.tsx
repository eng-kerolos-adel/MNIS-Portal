"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Filter, Loader2, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RemoteConfigBanner } from "./RemoteConfigBanner";
import { portalNav, portalMeta, homeFor, ROLE_PORTAL, type PortalKey } from "@/lib/nav";

const PageSearchContext = createContext<{ pageQuery: string; setPageQuery: (q: string) => void }>({
  pageQuery: "",
  setPageQuery: () => {},
});

export function usePageSearch() {
  return useContext(PageSearchContext);
}

const FACILITY: Record<PortalKey, { en: string; ar: string }> = {
  doctor: { en: "Internal Medicine & Cardiology Clinic", ar: "عيادة الباطنة والقلب" },
  pharmacy: { en: "UHIA Pharmacy", ar: "صيدلية التأمين الصحي" },
  lab: { en: "Diagnostic & Radiology Laboratory", ar: "المعمل التشخيصي والأشعة" },
  hospital: { en: "Hospital Operations Center", ar: "مركز عمليات المستشفى" },
  analytics: { en: "Command & Analytics Center", ar: "مركز القيادة والتحليلات" },
  reception: { en: "Reception Desk", ar: "مكتب الاستقبال" },
  admin: { en: "System Administration", ar: "إدارة النظام" },
};

const ROLE_LABEL: Record<string, { en: string; ar: string }> = {
  DOCTOR: { en: "Physician", ar: "طبيب" },
  PHARMACIST: { en: "Pharmacist", ar: "صيدلي" },
  LAB_TECH: { en: "Lab specialist", ar: "أخصائي معمل" },
  HOSPITAL_STAFF: { en: "Hospital staff", ar: "طاقم المستشفى" },
  EXECUTIVE: { en: "Executive", ar: "قيادة تنفيذية" },
  RECEPTIONIST: { en: "Receptionist", ar: "موظف استقبال" },
  ADMIN: { en: "Administrator", ar: "مدير النظام" },
};

const PAGES_WITH_DEDICATED_SEARCH = new Set([
  "/admin/users",
  "/reception/citizens",
  "/reception/register",
  "/search",
]);

export function AppShell({ portal, children }: { portal: PortalKey; children: ReactNode }) {
  const { locale, t } = useLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ar = locale === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageQuery, setPageQuery] = useState("");
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const spec = (user?.specialityEn ?? "").toUpperCase();
  const isClinicAssistant =
    !!user && (spec === "CLINIC_ASSISTANT" || (portal === "doctor" && user.role === "RECEPTIONIST"));
  const isDoctorOnly = !!user && user.role === "DOCTOR" && portal === "doctor";
  const isRadiologyStaff = !!user && user.role === "LAB_TECH" && spec.startsWith("RADIOLOGY");
  const isRadiologyReception = isRadiologyStaff && spec === "RADIOLOGY_RECEPTION";
  const isAnalysisLabReception = !!user && user.role === "LAB_TECH" && spec === "LAB_RECEPTION";
  const isAnalysisLabStaff = !!user && user.role === "LAB_TECH" && !isRadiologyStaff;

  const subRoleBlocked =
    (isClinicAssistant && pathname !== "/doctor/appointments" && pathname !== "/doctor/queue") ||
    (isRadiologyReception && pathname !== "/lab/appointments" && pathname !== "/lab/radiology") ||
    (isRadiologyStaff && !isRadiologyReception && pathname !== "/lab/radiology" && pathname !== "/lab/appointments") ||
    (isAnalysisLabReception && pathname !== "/lab/appointments" && pathname !== "/lab/sample-intake") ||
    (isAnalysisLabStaff && pathname === "/lab/radiology");

  // Strict per-role & per-facility isolation: NO superuser bypass even for ADMIN or EXECUTIVE
  const allowed =
    !!user &&
    !user.mustChangePassword &&
    ((isClinicAssistant && portal === "doctor") ||
      (!isClinicAssistant && ROLE_PORTAL[user.role] === portal));

  useEffect(() => {
    setPageQuery("");
    setMatchCount(null);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
    else if (!allowed || subRoleBlocked) router.replace(homeFor(user.role, user.specialityEn));
  }, [user, loading, allowed, subRoleBlocked, router]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const resetAll = () => {
      container.querySelectorAll("[data-page-filter-hidden]").forEach((el) => {
        el.removeAttribute("data-page-filter-hidden");
      });
    };

    const q = pageQuery.trim().toLowerCase();
    if (!q || PAGES_WITH_DEDICATED_SEARCH.has(pathname)) {
      resetAll();
      setMatchCount(null);
      return;
    }

    const targets = container.querySelectorAll<HTMLElement>(
      "tbody tr, [data-searchable-item], [data-search-card]"
    );
    let shown = 0;
    targets.forEach((el) => {
      const text = (el.textContent ?? "").toLowerCase();
      if (text.includes(q)) {
        el.removeAttribute("data-page-filter-hidden");
        shown++;
      } else {
        el.setAttribute("data-page-filter-hidden", "true");
      }
    });
    setMatchCount(shown);
  }, [pageQuery, pathname, children]);

  if (loading || !allowed || !user || subRoleBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const items = portalNav[portal].filter((item) => {
    if (isClinicAssistant) {
      return item.href === "/doctor/appointments" || item.href === "/doctor/queue";
    }
    if (isDoctorOnly) {
      return item.href !== "/doctor/appointments" && item.href !== "/doctor/queue";
    }
    if (isRadiologyReception) {
      return item.href === "/lab/appointments" || item.href === "/lab/radiology";
    }
    if (isRadiologyStaff) {
      return item.href === "/lab/radiology" || item.href === "/lab/appointments";
    }
    if (isAnalysisLabReception) {
      return item.href === "/lab/appointments" || item.href === "/lab/sample-intake";
    }
    if (isAnalysisLabStaff) {
      return item.href !== "/lab/radiology";
    }
    return true;
  });

  const roleLabel =
    spec === "CLINIC_ASSISTANT"
      ? (ar ? "مساعد عيادة الطبيب" : "Clinic Assistant")
      : spec === "RADIOLOGY_RECEPTION"
        ? (ar ? "استقبال مركز الأشعة" : "Radiology Reception")
        : spec === "RADIOLOGY_SPECIALIST" || spec === "RADIOLOGY_DIRECTOR"
          ? (ar ? "أخصائي أشعة تشخيصية" : "Radiology Specialist")
          : spec === "LAB_RECEPTION"
            ? (ar ? "استقبال معمل التحاليل" : "Lab Reception")
            : (ROLE_LABEL[user.role]?.[locale] ?? user.role);
  const subtitle = (ar ? user.facilityAr : user.facilityEn) || FACILITY[portal][locale];
  const showPageFilterBar = !PAGES_WITH_DEDICATED_SEARCH.has(pathname);

  return (
    <PageSearchContext.Provider value={{ pageQuery, setPageQuery }}>
      <style>{`[data-page-filter-hidden="true"] { display: none !important; }`}</style>
      <div className="min-h-screen bg-background">
        <Sidebar items={items} brandLabelKey={portalMeta[portal].titleKey} open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-h-screen flex-col ps-0 lg:ps-72">
          <Header
            title={`${t("brand.name")} — ${t(portalMeta[portal].titleKey)}`}
            subtitle={subtitle}
            staffName={ar ? user.fullNameAr : user.fullNameEn}
            staffRole={roleLabel}
            onMenu={() => setMobileOpen(true)}
          />
          <RemoteConfigBanner />
          <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
            {showPageFilterBar && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 shadow-xs">
                <Filter className="h-4 w-4 shrink-0 text-secondary" />
                <input
                  value={pageQuery}
                  onChange={(e) => setPageQuery(e.target.value)}
                  placeholder={
                    ar
                      ? "تصفية وبحث سريع داخل محتوى هذه الصفحة (اسم، كود، دواء، عينة، سجل)..."
                      : "Filter items inside this page (name, code, drug, sample, record)..."
                  }
                  className="h-8 min-w-[220px] flex-1 bg-transparent text-xs sm:text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
                {pageQuery && matchCount !== null && (
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-bold text-secondary">
                    {ar ? `${matchCount} نتيجة` : `${matchCount} match(es)`}
                  </span>
                )}
                {pageQuery && (
                  <button
                    type="button"
                    onClick={() => setPageQuery("")}
                    className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    aria-label="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <div ref={contentRef}>{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </PageSearchContext.Provider>
  );
}
