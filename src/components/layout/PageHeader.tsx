import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  icon: Icon,
  title,
  badge,
  meta,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  badge?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-level-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="pointer-events-none absolute -top-12 start-[-3rem] h-48 w-48 rounded-full bg-secondary-container/20 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-level-1">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-primary sm:text-xl">{title}</h1>
            {badge && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                {badge}
              </span>
            )}
          </div>
          {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">{meta}</div>}
        </div>
      </div>
      {actions && <div className="relative flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
