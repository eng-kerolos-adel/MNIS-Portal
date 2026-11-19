"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Headset,
  Stethoscope,
  Pill,
  FlaskConical,
  Hospital,
  BarChart3,
  UserCheck,
  Shield,
  Siren,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/lib/nav";

const SECTOR_LINKS = [
  { href: "/doctor/queue", icon: Stethoscope, ar: "العيادة والطبيب", en: "Doctor" },
  { href: "/pharmacy/dispensing-queue", icon: Pill, ar: "الصيدلية", en: "Pharmacy" },
  { href: "/lab/sample-intake", icon: FlaskConical, ar: "المعمل والأشعة", en: "Lab & PACS" },
  { href: "/hospital/er-triage", icon: Hospital, ar: "المستشفى والطوارئ", en: "Hospital & ER" },
  { href: "/reception/citizens", icon: UserCheck, ar: "الاستقبال والمواطنين", en: "Reception" },
  { href: "/analytics/ministries", icon: BarChart3, ar: "استراتيجية وزارة الصحة", en: "MoHP Strategy" },
  { href: "/admin/users", icon: Shield, ar: "الأمن والإدارة", en: "Admin & SOC" },
  { href: "/emergency", icon: Siren, ar: "طوارئ NFC", en: "NFC Emergency" },
  { href: "/presentation", icon: ShieldCheck, ar: "العرض الشامل والفلو", en: "Presentation & Flows" },
];

export function Sidebar({
  items,
  brandLabelKey,
  open,
  onClose,
}: {
  items: NavItem[];
  brandLabelKey: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const ar = locale === "ar";
  const showSectorSwitcher = !user || user.role === "ADMIN" || user.role === "EXECUTIVE";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col justify-between border-e border-outline-variant/40 bg-surface-container-lowest shadow-level-2 transition-transform lg:translate-x-0!",
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex flex-col overflow-y-auto">
          <div className="flex h-16 items-center gap-2 bg-surface-container-low px-4">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-tertiary" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-primary">{t("brand.name")} — {t(brandLabelKey)}</span>
              <span className="text-[11px] text-on-surface-variant">{t("brand.clinicalEdition")}</span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary-container text-on-primary-container shadow-level-1"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sovereign Cross-Sector Switcher (Admin / Executive) vs Strict Facility Isolation Card (Staff) */}
          {showSectorSwitcher ? (
            <div className="mx-2 mt-1 border-t border-outline-variant/40 pt-2 pb-2">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {ar ? "التنقل السريع بين قطاعات المنظومة" : "Sovereign Sector Switcher"}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {SECTOR_LINKS.map((sec) => {
                  const Icon = sec.icon;
                  const activeSector = pathname.startsWith("/" + sec.href.split("/")[1]);
                  return (
                    <Link
                      key={sec.href}
                      href={sec.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors",
                        activeSector
                          ? "bg-secondary-container text-on-secondary-container font-bold"
                          : "bg-surface-container-low/60 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{ar ? sec.ar : sec.en}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-2 mt-2 border-t border-outline-variant/40 pt-3 pb-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {ar ? "المنشأة الطبية التابع لها" : "Assigned Medical Facility"}
                </p>
                <p className="text-xs font-bold text-on-surface leading-snug">
                  {(ar ? user.facilityAr : user.facilityEn) || (ar ? "منشأة طبية معتمدة بالشبكة" : "Registered National Facility")}
                </p>
                {(user.specialityAr || user.specialityEn) && (
                  <p className="text-[11px] text-secondary font-semibold">
                    {ar ? (user.specialityAr ?? user.specialityEn) : (user.specialityEn ?? user.specialityAr)}
                  </p>
                )}
                {user.licenseNo && (
                  <p className="text-[10px] font-mono text-on-surface-variant" dir="ltr">
                    ID: {user.licenseNo}
                  </p>
                )}
                <p className="text-[10px] text-on-surface-variant pt-0.5">
                  {ar
                    ? "الوصول مقصور على مهام وصلاحيات هذه المنشأة فقط."
                    : "Access strictly scoped to this facility & role."}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="m-2 flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-[18px] w-[18px] text-tertiary" />
              <span className="text-xs font-semibold text-on-surface">{t("brand.cloud")}</span>
            </div>
            <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-[10px] font-bold text-tertiary">
              {t("brand.cloudSecure")}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Headset className="h-3.5 w-3.5" />
              {t("brand.supportLine")}
            </span>
            <span className="font-bold text-primary">15344</span>
          </div>
        </div>
      </aside>
    </>
  );
}
