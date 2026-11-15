"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { QrCode, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, rxCode } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { pick, formatDate } from "@/lib/utils/format";

type Shared = Awaited<ReturnType<typeof api.redeemShare>>;

export default function SharedRecordPage() {
  const { locale, t } = useLocale();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Shared | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setData(await api.redeemShare(code));
      setCode("");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={QrCode}
        title={ar ? "الملف المشارَك من المريض" : "Patient-shared record"}
        badge={ar ? "كود لمرة واحدة" : "One-time code"}
      />
      <Card>
        <CardContent className="p-5">
          <form
            onSubmit={submit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold">
              {ar
                ? "الكود الظاهر في تطبيق المريض (10 أحرف)"
                : "Code shown in the patient's app (10 characters)"}
              <input
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
                maxLength={10}
                dir="ltr"
                autoComplete="off"
                className="h-12 rounded-lg bg-surface-container-low px-3 font-mono text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-secondary/50"
              />
            </label>
            <Button
              type="submit"
              size="lg"
              loading={busy}
              disabled={code.length !== 10}
            >
              {ar ? "فتح الملف" : "Open record"}
            </Button>
          </form>
          <p className="mt-3 flex items-center gap-1 text-xs text-on-surface-variant">
            <ShieldCheck className="h-4 w-4 text-tertiary" />
            {ar
              ? "الكود صالح 10 دقائق ويعمل مرة واحدة، ويُسجَّل اسمك عند الاستخدام."
              : "The code lasts 10 minutes, works once, and your name is logged when used."}
          </p>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src={data.patient.photoUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="rounded-xl object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">
                  {pick(data.patient.fullName, locale)}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  MTI {data.patient.mti} •{" "}
                  {data.patient.sex === "male"
                    ? t("common.male")
                    : t("common.female")}
                  ، {data.patient.age} {t("common.years")} •{" "}
                  {ar ? "فصيلة الدم" : "Blood"} {data.patient.bloodType}
                </p>
                {data.patient.allergies.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    {data.patient.allergies.map((a, i) => (
                      <Badge key={i} tone="error">
                        {pick(a, locale)}
                      </Badge>
                    ))}
                  </div>
                )}
                {data.patient.chronicConditions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {data.patient.chronicConditions.map((a, i) => (
                      <Badge key={i} tone="warning">
                        {pick(a, locale)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {ar ? "الروشتات" : "Prescriptions"} (
                  {data.prescriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.prescriptions.length === 0 && (
                  <p className="text-sm text-on-surface-variant">—</p>
                )}
                {data.prescriptions.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-surface-container-low p-3 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {pick(r.diagnosis, locale)}
                      </span>
                      <span className="font-mono text-xs text-secondary">
                        {rxCode(r)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {r.medications
                        .map((m) => `${pick(m.name, locale)} ${m.dose}`)
                        .join("، ")}{" "}
                      • {formatDate(r.createdAt, locale)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {ar ? "نتائج المعمل المعتمدة" : "Verified lab results"} (
                  {data.labs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.labs.length === 0 && (
                  <p className="text-sm text-on-surface-variant">—</p>
                )}
                {data.labs.map((l) => (
                  <div
                    key={l.sample.id}
                    className="rounded-lg bg-surface-container-low p-3 text-sm"
                  >
                    <p className="font-semibold">
                      {pick(l.sample.testPanel, locale)}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {l.rows
                        .map(
                          (r: { analyte: any; value: any; unit: any }) =>
                            `${pick(r.analyte, locale)} ${r.value} ${r.unit}`,
                        )
                        .join(" • ")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
