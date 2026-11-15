"use client";

import { ClipboardList } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Card } from "./Card";

/** Used for the sidebar sections that exist in the navigation but do not yet
 * have a bespoke, fully designed screen in this delivery — keeps every nav
 * link alive with an honest, on-brand placeholder instead of a dead end. */
export function EmptyModule({ title, description }: { title: string; description?: string }) {
  const { t } = useLocale();
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center sm:p-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
        <ClipboardList className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        <p className="max-w-md text-sm text-on-surface-variant">{description ?? t("common.moduleComingSoonTitle")}</p>
      </div>
      <p className="max-w-lg text-xs leading-relaxed text-on-surface-variant/80">
        {t("common.moduleComingSoonBody")}
      </p>
    </Card>
  );
}
