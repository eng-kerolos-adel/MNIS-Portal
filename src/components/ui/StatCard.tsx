import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  invertDelta,
  tone = "primary",
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  invertDelta?: boolean;
  tone?: "primary" | "secondary" | "success" | "warning" | "error";
}) {
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;
  const toneClasses: Record<string, string> = {
    primary: "bg-primary text-on-primary",
    secondary: "bg-secondary text-on-secondary",
    success: "bg-success text-on-success",
    warning: "bg-warning text-on-warning",
    error: "bg-error text-on-error",
  };
  return (
    <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-container-low p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tabular-nums text-on-surface">{value}</span>
        {typeof delta === "number" && (
          <span
            className={cn(
              "mb-0.5 flex items-center gap-0.5 text-xs font-bold tabular-nums",
              good ? "text-success" : "text-error"
            )}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <span className="text-[11px] text-on-surface-variant">{sub}</span>}
    </div>
  );
}
