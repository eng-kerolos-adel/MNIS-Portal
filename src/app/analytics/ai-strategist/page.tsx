"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Compass,
  Flame,
  Navigation,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AiStrategistPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";

  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGov, setSelectedGov] = useState<string>("");

  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string; ts: string }>>([]);

  const [dirOpen, setDirOpen] = useState(false);
  const [dirBusy, setDirBusy] = useState(false);
  const [dirGov, setDirGov] = useState("CAIRO");
  const [dirSeverity, setDirSeverity] = useState<"ELEVATED" | "CRITICAL">("CRITICAL");
  const [dirTitle, setDirTitle] = useState("");
  const [dirMessage, setDirMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getStrategicForecast();
      setForecast(data);
      if (data?.regions?.length && !selectedGov) {
        setSelectedGov(data.regions[0].code);
        setDirGov(data.regions[0].code);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedGov]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeRegion = useMemo(() => {
    const regs = (forecast?.regions ?? []) as any[];
    return regs.find((r) => r.code === selectedGov) ?? regs[0] ?? null;
  }, [forecast, selectedGov]);

  async function askAssistant(customPrompt?: string) {
    const q = (customPrompt ?? prompt).trim();
    if (q.length < 2) return;
    setAsking(true);
    try {
      const res = await api.askStrategicAssistant({
        prompt: q,
        locale: ar ? "ar" : "en",
        focusGovernorate: selectedGov || undefined,
      });
      setChatHistory((prev) => [
        { q, a: res.answer, ts: new Date().toLocaleTimeString(ar ? "ar-EG" : "en-US") },
        ...prev,
      ]);
      if (!customPrompt) setPrompt("");
    } catch (e) {
      handleError(e);
    } finally {
      setAsking(false);
    }
  }

  async function sendDirective(e: FormEvent) {
    e.preventDefault();
    if (dirTitle.trim().length < 3 || dirMessage.trim().length < 5) return;
    setDirBusy(true);
    try {
      await api.dispatchStrategicDirective({
        governorate: dirGov,
        severity: dirSeverity,
        titleAr: dirTitle.trim(),
        titleEn: dirTitle.trim(),
        messageAr: dirMessage.trim(),
        messageEn: dirMessage.trim(),
      });
      setDirOpen(false);
      setDirTitle("");
      setDirMessage("");
      push(
        "success",
        ar ? "تم تعميم التوجيه الاستراتيجي وإرساله لحظياً للمستشفيات والمديرين" : "Strategic directive broadcast to facilities",
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mnis:refresh-notifs"));
      }
    } catch (err) {
      handleError(err);
    } finally {
      setDirBusy(false);
    }
  }

  const seir = (activeRegion?.seir14d ?? []) as Array<{
    day: number;
    dateLabel: string;
    exposed: number;
    infectious: number;
    projectedIcuNeed: number;
  }>;
  const maxInf = Math.max(10, ...seir.map((p) => p.infectious));

  const presets = ar
    ? [
        "حلل التوقعات الوبائية للجمهورية خلال الـ 14 يوم القادمة وأعلى المحافظات خطورة",
        "ما هي ممرات الانتشار الجغرافي الحرجة (Spatial Spillover) وخطة الاحتواء؟",
        "هل يوجد عجز في المخزون الدوائي أو ضغط على أسرة العناية المركزة؟",
        "اقترح خطة استراتيجية شاملة لتوزيع القوافل الطبية والمستلزمات",
      ]
    : [
        "Analyze the 14-day SEIR outbreak projection and top-risk governorates",
        "Show critical spatial spillover corridors and containment priorities",
        "Evaluate ICU capacity stress and critical drug shortages",
        "Recommend a strategic resource & medical convoy allocation plan",
      ];

  const sum = forecast?.nationalSummary ?? {};

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={BrainCircuit}
        title={ar ? "المساعد الشخصي الاستراتيجي ومحرك التنبؤ الوبائي للوزارة" : "Ministry AI Strategist & Outbreak Forecasting Engine"}
        badge="SEIR + EARS-C2 + Spatial Gravity"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
              {ar ? "تحديث النماذج" : "Recompute Models"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<ShieldAlert className="h-4 w-4" />}
              onClick={() => setDirOpen(true)}
            >
              {ar ? "إصدار توجيه استراتيجي طارئ" : "Broadcast Ministry Directive"}
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-s-4 border-s-error">
          <div className="flex items-center gap-2 text-xs font-bold text-error mb-1">
            <Flame className="h-4 w-4" />
            {ar ? "مؤشر الخطورة الوبائية القومي (NORI)" : "National Outbreak Risk Index"}
          </div>
          <div className="text-2xl font-black text-on-surface">{loading ? "—" : `${sum.nationalRiskIndex ?? 0}/100`}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? `إشارات إكلينيكية محللة: ${sum.totalSignalsAnalyzed ?? 0}`
              : `Analyzed clinical signals: ${sum.totalSignalsAnalyzed ?? 0}`}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-amber-600">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            {ar ? "متوسط معامل التكاثر اللحظي (Rt)" : "Mean Effective Reproduction (Rt)"}
          </div>
          <div className="text-2xl font-black text-on-surface">{loading ? "—" : sum.meanRt ?? "1.00"}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar ? "محسوب بفترة تسلسل τ = 4.2 يوم" : "Computed with serial interval τ = 4.2d"}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-blue-600">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Activity className="h-4 w-4" />
            {ar ? "ضغط الأسرة والجاهزية الحرجة" : "Hospital Bed Occupancy"}
          </div>
          <div className="text-2xl font-black text-on-surface">{loading ? "—" : `${sum.bedOccupancyPct ?? 0}%`}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? `${sum.occupiedBeds ?? 0}/${sum.totalBeds ?? 0} سرير • ${sum.availableBloodUnits ?? 0} كيس دم`
              : `${sum.occupiedBeds ?? 0}/${sum.totalBeds ?? 0} beds • ${sum.availableBloodUnits ?? 0} blood units`}
          </p>
        </Card>

        <Card className="p-4 border-s-4 border-s-purple-600">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            {ar ? "ضغط الإمداد الدوائي الاستراتيجي" : "Supply & Antimicrobial Stress"}
          </div>
          <div className="text-2xl font-black text-on-surface">{loading ? "—" : `${sum.supplyStressPct ?? 0}%`}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {ar
              ? `أصناف عند حد إعادة الطلب: ${sum.lowStockDrugsCount ?? 0}`
              : `Items below safety threshold: ${sum.lowStockDrugsCount ?? 0}`}
          </p>
        </Card>
      </div>

      {/* Personal AI Strategic Advisor Interactive Console */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            {ar ? "المستشار الشخصي الذكي لوزير الصحة — اسأل أي سؤال استراتيجي" : "Personal Strategic AI Advisor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => askAssistant(p)}
                disabled={asking}
                className="rounded-lg border border-primary/25 bg-surface-container-lowest px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition text-start"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void askAssistant();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                ar
                  ? "اكتب استفسارك الاستراتيجي للوزارة (مثلاً: ما خطة الطوارئ لمحافظة الأقصر خلال أسبوعين؟)..."
                  : "Ask a strategic MoHP outbreak / capacity question..."
              }
              className="h-11 flex-1 rounded-xl border border-primary/30 bg-surface-container-lowest px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" loading={asking} icon={<Send className="h-4 w-4" />}>
              {ar ? "تحليل استراتيجي فوري" : "Run Analysis"}
            </Button>
          </form>

          {chatHistory.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-secondary">
                    <span>❓ {item.q}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{item.ts}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-on-surface whitespace-pre-line leading-relaxed">
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 14-Day SEIR Simulation Chart & Spatial Gravity Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-secondary" />
                {ar ? "محاكاة SEIR للـ 14 يوم القادمة حسب المحافظة" : "14-Day Compartmental SEIR Outbreak Simulation"}
              </CardTitle>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {activeRegion
                  ? ar
                    ? `${activeRegion.ar} • المتلازمة السائدة: ${activeRegion.dominantSyndrome?.ar} • الذروة المتوقعة: ${activeRegion.projectedDay14Active} حالة`
                    : `${activeRegion.en} • Syndrome: ${activeRegion.dominantSyndrome?.en} • Day-14 Active: ${activeRegion.projectedDay14Active}`
                  : ""}
              </p>
            </div>
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="h-9 rounded-lg bg-surface-container-low px-3 text-xs font-semibold outline-none"
            >
              {(forecast?.regions ?? []).map((r: any) => (
                <option key={r.code} value={r.code}>
                  {ar ? `${r.ar} (${r.riskScore}/100)` : `${r.en} (${r.riskScore}/100)`}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {seir.length > 1 ? (
              <div className="space-y-3">
                <svg viewBox="0 0 600 180" className="w-full h-44 rounded-xl bg-surface-container-low/50 p-2">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                    points={seir
                      .map((p, idx) => {
                        const x = (idx / (seir.length - 1)) * 560 + 20;
                        const y = 160 - (p.infectious / maxInf) * 130;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ")}
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="text-error"
                    points={seir
                      .map((p, idx) => {
                        const x = (idx / (seir.length - 1)) * 560 + 20;
                        const y = 160 - (p.projectedIcuNeed / maxInf) * 130;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ")}
                  />
                  {seir.map((p, idx) => {
                    const x = (idx / (seir.length - 1)) * 560 + 20;
                    const y = 160 - (p.infectious / maxInf) * 130;
                    return <circle key={p.day} cx={x} cy={y} r="3.2" className="fill-primary" />;
                  })}
                </svg>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant">
                  <span>{ar ? "الخط الأزرق: الحالات النشطة المتوقعة (I)" : "Solid Line: Projected Active Cases (I)"}</span>
                  <span className="text-error font-semibold">
                    {ar ? "الخط الأحمر المتقطع: الاحتياج المتوقع لأسرة ICU" : "Dashed Red: Projected ICU Need"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                {ar ? "لا توجد بيانات كافية بعد للمحاكاة" : "Insufficient telemetry for simulation"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-error" />
              {ar ? "ممرات الانتشار المكاني (Spatial Gravity)" : "Spatial Gravity Spillover Corridors"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(forecast?.spilloverCorridors ?? []).slice(0, 6).map((c: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low/40 px-3 py-2 text-xs"
              >
                <span className="font-bold text-on-surface">
                  {ar ? `${c.fromAr} ← ${c.toAr}` : `${c.fromEn} → ${c.toEn}`}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-on-surface-variant">{c.distanceKm} {ar ? "كم" : "km"}</span>
                  <Badge tone={c.spilloverIndex > 40 ? "error" : "warning"}>{c.spilloverIndex}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Regional Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>{ar ? "مصفوفة المخاطر الوبائية للمحافظات (EARS-C2 + CUSUM + Rt)" : "Governorate Risk Matrix"}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="p-3 text-start">{ar ? "المحافظة" : "Governorate"}</th>
                <th className="p-3 text-start">{ar ? "المؤشر" : "Risk"}</th>
                <th className="p-3 text-start">Z-Score</th>
                <th className="p-3 text-start">CUSUM</th>
                <th className="p-3 text-start">Rt</th>
                <th className="p-3 text-start">{ar ? "المتلازمة السائدة" : "Dominant Syndrome"}</th>
                <th className="p-3 text-start">{ar ? "توقع يوم 14 (نشط / ICU)" : "Day-14 (Active / ICU)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {(forecast?.regions ?? []).map((r: any) => (
                <tr
                  key={r.code}
                  onClick={() => setSelectedGov(r.code)}
                  className="cursor-pointer hover:bg-surface-container-low/50"
                >
                  <td className="p-3 font-bold text-primary">{ar ? r.ar : r.en}</td>
                  <td className="p-3">
                    <Badge tone={r.alertLevel === "CRITICAL" ? "error" : r.alertLevel === "WATCH" ? "warning" : "success"}>
                      {r.riskScore}/100
                    </Badge>
                  </td>
                  <td className="p-3 font-mono">{r.zScore}</td>
                  <td className="p-3 font-mono">{r.cusumScore}</td>
                  <td className="p-3 font-mono font-bold">{r.effectiveRt}</td>
                  <td className="p-3">{ar ? r.dominantSyndrome?.ar : r.dominantSyndrome?.en}</td>
                  <td className="p-3 font-mono">
                    {r.projectedDay14Active} / <strong className="text-error">{r.projectedDay14Icu}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Strategic Directive Modal */}
      <Modal
        open={dirOpen}
        onClose={() => setDirOpen(false)}
        title={ar ? "إصدار وتعميم توجيه استراتيجي فوري للوزارة" : "Broadcast Ministry Strategic Directive"}
      >
        <form onSubmit={sendDirective} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={dirGov}
              onChange={(e) => setDirGov(e.target.value)}
              className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            >
              <option value="NATIONAL">{ar ? "عموم الجمهورية (NATIONAL)" : "Nationwide"}</option>
              {(forecast?.regions ?? []).map((r: any) => (
                <option key={r.code} value={r.code}>
                  {ar ? r.ar : r.en}
                </option>
              ))}
            </select>
            <select
              value={dirSeverity}
              onChange={(e) => setDirSeverity(e.target.value as "ELEVATED" | "CRITICAL")}
              className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            >
              <option value="CRITICAL">{ar ? "حرج (استنفار طوارئ)" : "CRITICAL"}</option>
              <option value="ELEVATED">{ar ? "مرتفع (استعداد متقدم)" : "ELEVATED"}</option>
            </select>
          </div>
          <input
            required
            minLength={3}
            value={dirTitle}
            onChange={(e) => setDirTitle(e.target.value)}
            placeholder={ar ? "عنوان التوجيه الاستراتيجي..." : "Directive Headline..."}
            className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
          />
          <textarea
            required
            minLength={5}
            rows={3}
            value={dirMessage}
            onChange={(e) => setDirMessage(e.target.value)}
            placeholder={ar ? "تفاصيل الإجراء المطلوب من المستشفيات والأطباء..." : "Required operational steps..."}
            className="rounded-lg bg-surface-container-low p-3 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDirOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" variant="danger" loading={dirBusy} icon={<Send className="h-4 w-4" />}>
              {ar ? "تعميم التوجيه الآن" : "Broadcast Now"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
