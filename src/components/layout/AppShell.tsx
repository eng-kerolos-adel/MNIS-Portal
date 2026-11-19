"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { portalNav, portalMeta, homeFor, ROLE_PORTAL, type PortalKey } from "@/lib/nav";

const FACILITY: Record<PortalKey, { en: string; ar: string }> = {
  doctor: { en: "Internal Medicine & Cardiology Clinic", ar: "عيادة الباطنة والقلب" },
  pharmacy: { en: "UHIA Pharmacy", ar: "صيدلية التأمين الصحي" },
  lab: { en: "Central Reference Laboratory", ar: "المعمل المرجعي المركزي" },
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

export function AppShell({ portal, children }: { portal: PortalKey; children: ReactNode }) {
  const { locale, t } = useLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isClinicAssistant =
    !!user &&
    (user.specialityEn === "CLINIC_ASSISTANT" ||
      (portal === "doctor" && user.role === "RECEPTIONIST"));
  const isDoctorOnly = !!user && user.role === "DOCTOR" && portal === "doctor";
  const isLabReception =
    !!user &&
    user.role === "LAB_TECH" &&
    user.specialityEn === "LAB_RECEPTION" &&
    portal === "lab";

  const subRoleBlocked =
    (isClinicAssistant && pathname !== "/doctor/appointments" && pathname !== "/doctor/queue") ||
    (isLabReception && pathname !== "/lab/appointments" && pathname !== "/lab/sample-intake");

  const allowed =
    !!user &&
    !user.mustChangePassword &&
    (user.role === "ADMIN" ||
      user.role === "EXECUTIVE" ||
      (isClinicAssistant && portal === "doctor") ||
      (!isClinicAssistant && ROLE_PORTAL[user.role] === portal));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
    else if (!allowed) router.replace(homeFor(user.role, user.specialityEn));
    else if (isClinicAssistant && pathname !== "/doctor/appointments" && pathname !== "/doctor/queue") {
      router.replace("/doctor/appointments");
    } else if (isLabReception && pathname !== "/lab/appointments" && pathname !== "/lab/sample-intake") {
      router.replace("/lab/appointments");
    }
  }, [user, loading, allowed, router, isClinicAssistant, isLabReception, pathname]);

  if (loading || !allowed || !user || subRoleBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const items = portalNav[portal].filter((item) => {
    if (user.role === "ADMIN" || user.role === "EXECUTIVE") return true;
    if (isClinicAssistant) {
      return item.href === "/doctor/appointments" || item.href === "/doctor/queue";
    }
    if (isDoctorOnly) {
      return item.href !== "/doctor/appointments" && item.href !== "/doctor/queue";
    }
    if (isLabReception) {
      return item.href === "/lab/appointments" || item.href === "/lab/sample-intake";
    }
    return true;
  });

  const roleLabel =
    user.specialityEn === "CLINIC_ASSISTANT"
      ? (locale === "ar" ? "مساعد عيادة الطبيب" : "Clinic Assistant")
      : user.specialityEn === "LAB_RECEPTION"
        ? (locale === "ar" ? "استقبال المعمل" : "Lab Reception")
        : (ROLE_LABEL[user.role]?.[locale] ?? user.role);
  const subtitle = (locale === "ar" ? user.facilityAr : user.facilityEn) || FACILITY[portal][locale];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={items} brandLabelKey={portalMeta[portal].titleKey} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col ps-0 lg:ps-72">
        <Header
          title={`${t("brand.name")} — ${t(portalMeta[portal].titleKey)}`}
          subtitle={subtitle}
          staffName={locale === "ar" ? user.fullNameAr : user.fullNameEn}
          staffRole={roleLabel}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
