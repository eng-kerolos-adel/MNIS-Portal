"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const defaultPlaceholder =
    locale === "ar"
      ? "ابحث بالاسم أو الرقم القومي (14 رقم) أو كود MTI..."
      : "Search by Name, National ID (14 digits), or MTI...";
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="pointer-events-none absolute start-3 h-4 w-4 text-on-surface-variant" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? defaultPlaceholder}
        className="w-full rounded-lg bg-surface-container-low py-2.5 ps-9 pe-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:bg-surface-container focus:ring-2 focus:ring-secondary/50"
      />
    </div>
  );
}
