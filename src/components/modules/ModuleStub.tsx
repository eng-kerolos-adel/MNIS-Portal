"use client";

import type { LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyModule } from "@/components/ui/EmptyModule";

export function ModuleStub({ icon, labelKey }: { icon: LucideIcon; labelKey: string }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={icon} title={t(labelKey)} badge={t("common.moduleComingSoonTitle")} />
      <EmptyModule title={t(labelKey)} />
    </div>
  );
}
