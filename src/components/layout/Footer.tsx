"use client";

import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="flex flex-col items-center justify-between gap-2 border-t border-outline-variant/40 bg-surface-container-low px-4 py-3 text-[11px] text-on-surface-variant sm:flex-row sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>{t("brand.ministry")}</span>
        <span className="hidden sm:inline">{t("brand.ministry2")}</span>
        <span className="hidden sm:inline">{t("brand.portalFooter")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>{t("brand.rights")} © 2026</span>
        <ShieldCheck className="h-3.5 w-3.5 text-tertiary" />
      </div>
    </footer>
  );
}
