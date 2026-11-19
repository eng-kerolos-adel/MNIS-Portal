"use client";

import { useMemo } from "react";
import { Printer, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, pick } from "@/lib/utils/format";
import { rxCode } from "@/lib/data/service";
import type { LabSample, Prescription } from "@/types/domain";

function QrVerifyMatrix({ value, size = 88 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const dim = 21;
    const grid: boolean[] = Array(dim * dim).fill(false);

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[(r0 + r) * dim + (c0 + c)] = border || center;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, dim - 7);
    drawFinder(dim - 7, 0);

    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= dim - 8) || (r >= dim - 8 && c < 8);
        if (inFinder) continue;
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619) >>> 0;
        grid[r * dim + c] = (hash & 1) === 1;
      }
    }
    return { dim, grid };
  }, [value]);

  const cellSize = size / cells.dim;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-lg border border-outline-variant/50 bg-white p-1"
      aria-label="QR Verification Code"
    >
      {cells.grid.map((on, idx) => {
        if (!on) return null;
        const r = Math.floor(idx / cells.dim);
        const c = idx % cells.dim;
        return (
          <rect
            key={idx}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#0b1f3a"
          />
        );
      })}
    </svg>
  );
}

export function OfficialPrintModal({
  rx,
  sample,
  onClose,
}: {
  rx?: Prescription | null;
  sample?: LabSample | null;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const open = !!rx || !!sample;
  const patient = rx?.patient ?? sample?.patient;

  const qrPayload = rx
    ? `MNIS-RX|${rxCode(rx)}|${rx.patient.mti}|${rx.signatureHash ?? rx.id}`
    : sample
      ? `MNIS-LAB|${sample.barcode}|${sample.patient.mti}|${sample.id}`
      : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        rx
          ? ar
            ? "الروشتة الإلكترونية الرسمية المعتمدة"
            : "Official Verified E-Prescription"
          : ar
            ? "التقرير المعملي الرسمي المعتمد"
            : "Official Verified Laboratory Report"
      }
    >
      {patient && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border-2 border-primary/25 bg-surface-container-lowest p-4 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/40 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {ar ? "جمهورية مصر العربية • وزارة الصحة والسكان" : "Arab Republic of Egypt • Ministry of Health & Population"}
                </p>
                <h3 className="text-base font-black text-primary">
                  {ar ? "منظومة الهوية الطبية الوطنية الموحدة (MNIS)" : "Unified National Medical Identity System (MNIS)"}
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {rx
                    ? `${ar ? "كود الروشتة:" : "Rx Code:"} #${rxCode(rx)} • ${formatDate(rx.createdAt, locale)}`
                    : sample
                      ? `${ar ? "باركود العينة:" : "Barcode:"} ${sample.barcode} • ${formatDate(sample.collectedAt, locale)}`
                      : ""}
                </p>
              </div>
              <QrVerifyMatrix value={qrPayload} size={76} />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-3 text-xs">
              <div>
                <span className="text-on-surface-variant">{ar ? "اسم المواطن:" : "Citizen Name:"}</span>
                <p className="font-bold text-on-surface">{pick(patient.fullName, locale)}</p>
              </div>
              <div>
                <span className="text-on-surface-variant">{ar ? "الهوية الطبية الموحدة:" : "Medical Token (MTI):"}</span>
                <p className="font-mono font-bold text-primary">{patient.mti}</p>
              </div>
              {patient.nationalId && (
                <div>
                  <span className="text-on-surface-variant">{ar ? "الرقم القومي:" : "National ID:"}</span>
                  <p className="font-mono font-semibold text-on-surface">{patient.nationalId}</p>
                </div>
              )}
              <div>
                <span className="text-on-surface-variant">{ar ? "فصيلة الدم:" : "Blood Type:"}</span>
                <p className="font-bold text-error">{patient.bloodType}</p>
              </div>
            </div>

            {rx && (
              <>
                <div className="text-xs space-y-1">
                  <p>
                    <span className="text-on-surface-variant">{ar ? "التشخيص:" : "Diagnosis:"}</span>{" "}
                    <strong className="text-on-surface">
                      {pick(rx.diagnosis, locale)} {rx.icd10 ? `(${rx.icd10})` : ""}
                    </strong>
                  </p>
                  <p>
                    <span className="text-on-surface-variant">{ar ? "الطبيب المعالج:" : "Prescribing Physician:"}</span>{" "}
                    <strong className="text-on-surface">
                      {rx.physician.en || rx.physician.ar ? pick(rx.physician, locale) : ar ? "طبيب معتمد بالمنظومة" : "Attending Physician"}
                    </strong>
                    {rx.physicianLicense ? ` (${ar ? "ترخيص:" : "Lic:"} ${rx.physicianLicense})` : ""}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-outline-variant/40">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-surface-container text-on-surface-variant">
                      <tr>
                        <th className="p-2 text-start">{ar ? "الدواء" : "Medication"}</th>
                        <th className="p-2 text-start">{ar ? "الجرعة والتكرار" : "Dose & Freq"}</th>
                        <th className="p-2 text-start">{ar ? "المدة / الكمية" : "Duration / Qty"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {rx.medications.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2 font-bold">{pick(m.name, locale)}</td>
                          <td className="p-2">
                            {m.dose} • {pick(m.frequency, locale)}
                          </td>
                          <td className="p-2 font-mono">
                            {m.durationDays} {ar ? "يوم" : "d"} • ×{m.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rx.signatureHash && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      HMAC-SHA256 SEAL: {rx.signatureHash}
                    </span>
                  </div>
                )}
              </>
            )}

            {sample && (
              <>
                <div className="text-xs space-y-1">
                  <p>
                    <span className="text-on-surface-variant">{ar ? "الفحص المعملي:" : "Lab Panel:"}</span>{" "}
                    <strong className="text-on-surface">{pick(sample.testPanel, locale)}</strong>
                  </p>
                  <p>
                    <span className="text-on-surface-variant">{ar ? "طلب بواسطة:" : "Ordered By:"}</span>{" "}
                    <strong className="text-on-surface">
                      {sample.orderedBy.en || sample.orderedBy.ar ? pick(sample.orderedBy, locale) : ar ? "الطبيب المعالج" : "Attending Physician"}
                    </strong>
                    {sample.verifiedBy && (
                      <>
                        {" • "}
                        <span className="text-on-surface-variant">{ar ? "اعتماد:" : "Verified By:"}</span>{" "}
                        <strong>{pick(sample.verifiedBy, locale)}</strong>
                      </>
                    )}
                  </p>
                </div>

                {sample.results && sample.results.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-outline-variant/40">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-surface-container text-on-surface-variant">
                        <tr>
                          <th className="p-2 text-start">{ar ? "المؤشر" : "Analyte"}</th>
                          <th className="p-2 text-start">{ar ? "النتيجة" : "Result"}</th>
                          <th className="p-2 text-start">{ar ? "المعدل المرجعي" : "Reference"}</th>
                          <th className="p-2 text-start">{ar ? "التقييم" : "Flag"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {sample.results.map((r) => (
                          <tr key={r.id}>
                            <td className="p-2 font-semibold">{pick(r.analyte, locale)}</td>
                            <td className="p-2 font-mono font-bold">
                              {r.value} {r.unit}
                            </td>
                            <td className="p-2 font-mono text-on-surface-variant">
                              {r.refLow}–{r.refHigh} {r.unit}
                            </td>
                            <td className="p-2">
                              <Badge
                                tone={
                                  r.flag === "normal"
                                    ? "success"
                                    : r.flag === "critical"
                                      ? "error"
                                      : "warning"
                                }
                              >
                                {r.flag.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={onClose}>
              {ar ? "إغلاق" : "Close"}
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              {ar ? "طباعة المستند الرسمي" : "Print Official Document"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
