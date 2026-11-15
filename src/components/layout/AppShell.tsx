"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowed = !!user && !user.mustChangePassword && (ROLE_PORTAL[user.role] === portal || !!ROLE_PORTAL[user.role]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
    else if (!allowed) router.replace(homeFor(user.role));
  }, [user, loading, allowed, router]);

  if (loading || !allowed || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const items = portalNav[portal];
  const roleLabel = ROLE_LABEL[user.role]?.[locale] ?? user.role;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={items} brandLabelKey={portalMeta[portal].titleKey} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col ps-0 lg:ps-72">
        <Header
          title={`${t("brand.name")} — ${t(portalMeta[portal].titleKey)}`}
          subtitle={FACILITY[portal][locale]}
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
