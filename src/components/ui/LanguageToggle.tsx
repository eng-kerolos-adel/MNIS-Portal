"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();
  return (
    <button
      onClick={toggleLocale}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface"
      aria-label="Toggle language"
      title="EN / AR"
    >
      <Languages className="h-4 w-4" />
      {locale === "ar" ? "EN" : "ع"}
    </button>
  );
}
