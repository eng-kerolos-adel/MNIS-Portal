"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Building2, 
  Activity, 
  GraduationCap, 
  ShoppingBag, 
  Briefcase, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Thermometer, 
  Pill, 
  CheckCircle2, 
  AlertOctagon,
  RefreshCw
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type MinistryTab = "mohp" | "mohesr" | "mosit" | "mol";

export default function QuadMinistriesStrategicPage() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [activeTab, setActiveTab] = useState<MinistryTab>("mohp");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simForm, setSimForm] = useState({
    headMti: "EG-2990-4821-77",
    headNameAr: "أحمد محمد عبد الرحمن",
    governorate: "القاهرة",
    currentMembersCount: 5,
    newMemberNameAr: "يوسف أحمد محمد",
  });
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simBusy, setSimBusy] = useState(false);

  const runSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimBusy(true);
    try {
      const res = await api.checkFamilySubsidy(simForm);
      setSimResult(res);
    } catch (err) {
      handleError(err);
    } finally {
      setSimBusy(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getQuadMinistries();
      setData(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Building2}
        title={ar ? "مركز القيادة الاستراتيجية للوزارات الأربعة" : "Quad-Ministry Strategic Command Hub"}
        meta={
          <span className="text-xs text-on-surface-variant font-mono">
            {ar ? "حوكمة الموارد القومية • 120 مليون مواطن" : "National Resource Governance • 120M Base"}
          </span>
        }
        actions={
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading} icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}>
            {ar ? "تحديث البيانات اللحظية" : "Refresh"}
          </Button>
        }
      />

      {/* Top Ministry Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab("mohp")}
          className={`flex items-center gap-3 p-4 rounded-xl border text-start transition ${
            activeTab === "mohp"
              ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40 text-emerald-300"
              : "bg-surface border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeTab === "mohp" ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-container text-on-surface-variant"}`}>
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{ar ? "وزارة الصحة" : "Health & Population"}</p>
            <p className="text-[11px] opacity-70">{ar ? "الرصد الوبائي والأمصال" : "Epidemics & Vaccines"}</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("mohesr")}
          className={`flex items-center gap-3 p-4 rounded-xl border text-start transition ${
            activeTab === "mohesr"
              ? "bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/40 text-blue-300"
              : "bg-surface border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeTab === "mohesr" ? "bg-blue-500/20 text-blue-400" : "bg-surface-container text-on-surface-variant"}`}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{ar ? "التعليم العالي" : "Higher Education"}</p>
            <p className="text-[11px] opacity-70">{ar ? "تنسيق كليات الطب" : "Dynamic Admission"}</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("mosit")}
          className={`flex items-center gap-3 p-4 rounded-xl border text-start transition ${
            activeTab === "mosit"
              ? "bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/40 text-amber-300"
              : "bg-surface border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeTab === "mosit" ? "bg-amber-500/20 text-amber-400" : "bg-surface-container text-on-surface-variant"}`}>
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{ar ? "وزارة التموين" : "Supply & Trade"}</p>
            <p className="text-[11px] opacity-70">{ar ? "حوكمة الدعم وسقف الـ 5" : "Family Cap & Subsidies"}</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("mol")}
          className={`flex items-center gap-3 p-4 rounded-xl border text-start transition ${
            activeTab === "mol"
              ? "bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40 text-purple-300"
              : "bg-surface border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
          }`}
        >
          <div className={`p-2.5 rounded-lg ${activeTab === "mol" ? "bg-purple-500/20 text-purple-400" : "bg-surface-container text-on-surface-variant"}`}>
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{ar ? "وزارة العمل" : "Labor & Manpower"}</p>
            <p className="text-[11px] opacity-70">{ar ? "التكليف وإجهاد الأطباء" : "Takleef & Burnout"}</p>
          </div>
        </button>
      </div>

      {loading && !data && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-on-surface-variant">
            {ar ? "جاري تحميل المؤشرات الاستراتيجية للوزارات..." : "Loading strategic indicators..."}
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="flex flex-col gap-6">

          {/* TAB 1: Ministry of Health (MoHP) */}
          {activeTab === "mohp" && (
            <div className="flex flex-col gap-6">
              {/* Outbreak Alert Banner */}
              <Card className="border-red-500/40 bg-red-950/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertOctagon className="h-6 w-6 text-red-500 animate-pulse" />
                    <div>
                      <CardTitle className="text-red-400">{ar ? "نظام الرصد الوبائي المبكر (Z-Score Outbreak Alerts)" : "Outbreak Detection Engine"}</CardTitle>
                      <p className="text-xs text-slate-400">{ar ? "تحليل انحراف الحالات الحادة عن المعدل الطبيعي بالمحافظات" : "Epidemiological deviation from baseline"}</p>
                    </div>
                  </div>
                  <Badge tone="error">{ar ? "حالة تأهب نشطة" : "Active Alerts"}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.mohp.outbreakAlerts.map((alert: any, idx: number) => (
                      <div key={idx} className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-on-surface">{alert.governorate}</span>
                            <Badge tone={alert.status === 'CRITICAL_OUTBREAK' ? 'error' : alert.status === 'WATCH' ? 'warning' : 'success'}>
                              Z = {alert.zScore}
                            </Badge>
                          </div>
                          <p className="text-xs text-on-surface-variant mb-2">{alert.syndrome}</p>
                        </div>
                        <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-xs text-on-surface-variant">
                          <span>{ar ? "الحالات الحالية:" : "Active:"} <strong className="text-on-surface">{alert.activeCases}</strong></span>
                          <span>{ar ? "المعدل الطبيعي:" : "Baseline:"} {alert.baseline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vaccine Cold-Chain & Strategic Drug Reserves */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-emerald-400" />
                      {ar ? "سلسلة التبريد ومخزون الأمصال واللقاحات" : "Vaccine Cold-Chain Telemetry"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                      <span className="text-sm font-semibold">{ar ? "سلامة درجات الحرارة للمخازن المركزية:" : "Telemetry Compliance:"}</span>
                      <span className="text-emerald-400 font-bold">{data.mohp.vaccineColdChain.telemetryCompliancePct}%</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {data.mohp.vaccineColdChain.strategicReserves.map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-on-surface">{v.vaccineName}</p>
                            <p className="text-xs text-on-surface-variant">{ar ? `مخزون استراتيجي يكفي: ${v.targetBufferMonths} أشهر` : `Buffer: ${v.targetBufferMonths} Months`}</p>
                          </div>
                          <span className="text-xs font-mono font-bold bg-surface-container-high px-2.5 py-1 rounded">
                            {Number(v.availableDoses).toLocaleString()} {ar ? "جرعة" : "Doses"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-cyan-400" />
                      {ar ? "المخزون الاستراتيجي للأدوية الحرجة والمنقذة للحياة" : "Critical Emergency Drug Buffers"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {data.mohp.strategicDrugReserves.map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-lg">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{d.category}</p>
                          <p className="text-xs text-on-surface-variant">{ar ? `رصيد الجمهورية: ${d.nationalStockDays} يوم استهلاك` : `National Stock: ${d.nationalStockDays} Days`}</p>
                        </div>
                        <Badge tone={d.status === 'OPTIMAL' ? 'success' : 'warning'}>
                          {d.status === 'OPTIMAL' ? (ar ? "رصيد آمن" : "Optimal") : (ar ? "إعادة طلب" : "Reorder")}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: Ministry of Higher Education (MoHESR) */}
          {activeTab === "mohesr" && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-400" />
                    {ar ? "المعادلة الديناميكية لتنسيق كليات الطب والتمريض (Dynamic Faculty Admission)" : "Dynamic Medical Admission Quotas"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-on-surface-variant">
                    {ar 
                      ? "تقوم الخوارزمية المركزية بحساب مؤشر العجز الطبي الإقليمي لكل محافظة وإصدار توصيات مباشرة لتعديل الحد الأدنى للقبول الجامعي لسد الفجوة الطبية مع شرط تكليف إقليمي."
                      : "Algorithm dynamically computes regional medical deficit and recommends university threshold offsets with regional service bonds."}
                  </p>

                  <div className="flex flex-col gap-3">
                    {data.mohesr.facultyAdmissionRecommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-outline-variant/30 bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-base text-on-surface">{rec.region}</span>
                            <Badge tone={rec.status === 'ACTION_REQUIRED' ? 'warning' : 'success'}>
                              {rec.status === 'ACTION_REQUIRED' ? (ar ? "تعديل مطلوب" : "Action Required") : (ar ? "متزن" : "Balanced")}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-300 font-semibold">{rec.faculty}</p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {ar ? `مؤشر العجز الإقليمي: ${rec.currentDeficitPer1000} لكل 1000 مواطن` : `Deficit: ${rec.currentDeficitPer1000} per 1000`}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 bg-surface-container p-3 rounded-lg text-xs">
                          <div className="text-center">
                            <span className="text-on-surface-variant block">{ar ? "تعديل التنسيق" : "Score Offset"}</span>
                            <span className="text-base font-black text-amber-400 font-mono">{rec.recommendedAdmissionOffsetPct}%</span>
                          </div>
                          <div className="text-center border-s border-outline-variant/40 ps-4">
                            <span className="text-on-surface-variant block">{ar ? "التكليف الإلزامي" : "Service Bond"}</span>
                            <span className="text-base font-black text-emerald-400 font-mono">{rec.mandatoryRegionalServiceYears} {ar ? "سنوات" : "Years"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Research Data feeds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-on-surface-variant mb-1">{ar ? "سجلات أبحاث مجهولة الهوية" : "Anonymized Genomic Feeds"}</p>
                    <p className="text-2xl font-black text-blue-400 font-mono">{Number(data.mohesr.researchDataFeeds.anonymizedGenomicRecords).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-on-surface-variant mb-1">{ar ? "تجارب إكلينيكية جامعية نشطة" : "Active Clinical Trials"}</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono">{data.mohesr.researchDataFeeds.activeUniversityClinicalTrials}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-on-surface-variant mb-1">{ar ? "الجامعات الشريكة بالربط" : "Partner Universities"}</p>
                    <p className="text-2xl font-black text-purple-400 font-mono">{data.mohesr.researchDataFeeds.partnerUniversities.length}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 3: Ministry of Supply (MoSIT) */}
          {activeTab === "mosit" && (
            <div className="flex flex-col gap-6">
              <Card className="border-amber-500/40 bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    {ar ? "حوكمة الدعم التمويني للأسرة (سقف الـ 5 أفراد)" : "Family Cap Subsidy Governance Engine"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <p className="text-sm text-slate-300">
                    {ar
                      ? "الربط الآلي بين تسجيل المواليد في المنظومة الصحية وقواعد بيانات التموين لحجب إضافة الدعم عن الطفل السادس وما بعده لدعم سياسات تنظيم الأسرة."
                      : "Automatic sync between newborn health records and ration card databases, capping benefits at 5 family members."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "أسر وصلت لسقف الدعم (5+)" : "Families Exceeding Cap"}</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{Number(data.mosit.familiesExceedingCap).toLocaleString()}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "إضافات تموينية محجوبة" : "Blocked Newborn Additions"}</p>
                      <p className="text-2xl font-black text-red-400 font-mono">{Number(data.mosit.blockedNewbornRationAdditions).toLocaleString()}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "الوفر السنوي المحقق للدولة" : "Annual State Savings"}</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{Number(data.mosit.estimatedAnnualSubsidySavingsEgp).toLocaleString()} EGP</p>
                    </div>
                  </div>

                  {/* Stunting and Nutrition Distribution */}
                  <div>
                    <h4 className="text-sm font-bold text-on-surface mb-3">
                      {ar ? "مؤشرات سوء التغذية والأنيميا لتوجيه الدعم العيني للسلع بالقرى" : "Child Nutrition & Targeted Food Commodities"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {data.mosit.stuntingAndAnemiaIndex.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-surface rounded-lg border border-outline-variant/30">
                          <p className="font-bold text-sm text-on-surface">{item.governorate}</p>
                          <p className="text-xs text-red-400 my-1">{ar ? `نسبة الأنيميا: ${item.childAnemiaPct}%` : `Anemia: ${item.childAnemiaPct}%`}</p>
                          <p className="text-xs text-emerald-300 font-medium">{item.priorityCommodity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive 5-Member Family Cap Simulator */}
                  <div className="p-4 rounded-xl bg-surface border border-amber-500/40">
                    <h4 className="text-sm font-bold text-amber-400 mb-2">
                      {ar ? "محاكي التحقق اللحظي من سقف البطاقة التموينية (الحد الأقصى 5 أفراد للأسرة)" : "Live 5-Member Family Ration Card Eligibility Simulator"}
                    </h4>
                    <form onSubmit={runSimulator} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] text-on-surface-variant mb-1">{ar ? "كود رب الأسرة (MTI)" : "Head of Family MTI"}</label>
                        <input
                          value={simForm.headMti}
                          onChange={(e) => setSimForm({ ...simForm, headMti: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-on-surface-variant mb-1">{ar ? "اسم رب الأسرة" : "Head Name"}</label>
                        <input
                          value={simForm.headNameAr}
                          onChange={(e) => setSimForm({ ...simForm, headNameAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-on-surface-variant mb-1">{ar ? "عدد الأفراد الحاليين بالبطاقة" : "Current Family Size"}</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={simForm.currentMembersCount}
                          onChange={(e) => setSimForm({ ...simForm, currentMembersCount: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-on-surface-variant mb-1">{ar ? "اسم المولود المراد إضافته" : "Newborn to Add"}</label>
                        <input
                          value={simForm.newMemberNameAr}
                          onChange={(e) => setSimForm({ ...simForm, newMemberNameAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container text-xs"
                        />
                      </div>
                      <Button type="submit" loading={simBusy} size="sm">
                        {ar ? "فحص استحقاق الإضافة" : "Check Eligibility"}
                      </Button>
                    </form>

                    {simResult && (
                      <div className={`mt-4 p-4 rounded-xl border ${simResult.rationCardAdditionAllowed ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-red-950/40 border-red-500/50 text-red-300"}`}>
                        <div className="flex items-center justify-between font-bold text-sm mb-1">
                          <span>{simResult.statusCode}</span>
                          <span className="font-mono text-xs">{simResult.SyncTarget}</span>
                        </div>
                        <p className="text-xs">{ar ? simResult.decisionAr : simResult.decisionEn}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: Ministry of Labor (MoL) */}
          {activeTab === "mol" && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-400" />
                    {ar ? "حوكمة التكليف الطبي وقياس إجهاد الأطقم الطبية (Takleef & Burnout Index)" : "Workforce & Burnout Governance"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "إجمالي الكوادر الطبية النشطة" : "Active Medical Workforce"}</p>
                      <p className="text-2xl font-black text-purple-400 font-mono">{Number(data.mol.registeredHealthcareWorkforce).toLocaleString()}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "نسبة إتمام التكليف الطبي" : "Takleef Fulfillment"}</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{data.mol.compulsoryAssignmentRatePct}%</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 text-center">
                      <p className="text-xs text-on-surface-variant mb-1">{ar ? "متوسط الساعات الإضافية أسبوعياً" : "Avg Weekly Overtime"}</p>
                      <p className="text-2xl font-black text-amber-400 font-mono">{data.mol.averageWeeklyOvertimeHours} {ar ? "ساعة" : "Hours"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-on-surface mb-3">
                      {ar ? "إنذارات الإجهاد الوظيفي الحاد للمستشفيات (Acute Fatigue Monitoring)" : "Staff Fatigue & Overwork Alerts"}
                    </h4>
                    <div className="flex flex-col gap-3">
                      {data.mol.burnoutFatigueAlerts.map((b: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-outline-variant/30">
                          <div>
                            <p className="font-bold text-sm text-on-surface">{b.facility}</p>
                            <p className="text-xs text-on-surface-variant">{b.department}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold">{ar ? `مؤشر الإجهاد: ${b.fatigueScore}/100` : `Fatigue: ${b.fatigueScore}/100`}</span>
                            <Badge tone={b.alertLevel === 'HIGH_RISK_FATIGUE' ? 'error' : b.alertLevel === 'MODERATE_RISK' ? 'warning' : 'success'}>
                              {b.alertLevel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
