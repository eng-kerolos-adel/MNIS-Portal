"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Headset } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/lib/nav";

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

          {/* Strict Facility & Role Scope Isolation Card */}
          {user && (
            <div className="mx-2 mt-2 border-t border-outline-variant/40 pt-3 pb-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {user.role === "ADMIN" || user.role === "EXECUTIVE"
                    ? (ar ? "النطاق الإداري المخصص" : "Assigned Sovereign Scope")
                    : (ar ? "المنشأة الطبية التابع لها" : "Assigned Medical Facility")}
                </p>
                <p className="text-xs font-bold text-on-surface leading-snug">
                  {(ar ? user.facilityAr : user.facilityEn) || (ar ? "منظومة الهوية الطبية الموحدة" : "Unified MNIS Facility")}
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
                    ? "الوصول مقصور على مهام وصلاحيات حسابك فقط."
                    : "Access strictly scoped to your assigned role & portal."}
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
