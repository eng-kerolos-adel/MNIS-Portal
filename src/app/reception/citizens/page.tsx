"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { UserPlus, CreditCard, KeyRound, ExternalLink, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId } from "@/lib/data/service";
import type { NationalIdentity } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CredentialModal } from "@/components/ui/CredentialModal";
import { pick } from "@/lib/utils/format";

const field = "h-11 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const GOVERNORATES = [
  { ar: "القاهرة", en: "Cairo", cities: [{ ar: "مدينة نصر", en: "Nasr City" }, { ar: "مصر الجديدة", en: "Heliopolis" }, { ar: "المعادي", en: "Maadi" }, { ar: "شبرا", en: "Shoubra" }, { ar: "التجمع الخامس", en: "New Cairo" }] },
  { ar: "الجيزة", en: "Giza", cities: [{ ar: "الدقي", en: "Dokki" }, { ar: "المهندسين", en: "Mohandeseen" }, { ar: "الهرم", en: "Haram" }, { ar: "الشيخ زايد", en: "Sheikh Zayed" }, { ar: "أكتوبر", en: "6th of October" }] },
  { ar: "الإسكندرية", en: "Alexandria", cities: [{ ar: "سموحة", en: "Smouha" }, { ar: "سيدي بشر", en: "Sidi Beshr" }, { ar: "المنتزه", en: "Montaza" }, { ar: "محرم بك", en: "Moharam Bek" }, { ar: "برج العرب", en: "Borg El Arab" }] },
  { ar: "بورسعيد", en: "Port Said", cities: [{ ar: "بورفؤاد", en: "Port Fouad" }, { ar: "الشرق", en: "Al-Sharq" }, { ar: "الزهور", en: "Al-Zohour" }] },
  { ar: "الإسماعيلية", en: "Ismailia", cities: [{ ar: "الإسماعيلية", en: "Ismailia" }, { ar: "فايد", en: "Fayed" }, { ar: "القنطرة", en: "Qantara" }] },
  { ar: "الأقصر", en: "Luxor", cities: [{ ar: "الأقصر", en: "Luxor" }, { ar: "إسنا", en: "Esna" }, { ar: "أرمنت", en: "Armant" }] },
  { ar: "أسوان", en: "Aswan", cities: [{ ar: "أسوان", en: "Aswan" }, { ar: "إدفو", en: "Edfu" }, { ar: "كوم أمبو", en: "Kom Ombo" }] },
];

export default function CitizenAccountsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [f, setF] = useState({
    nationalId: "",
    fullNameEn: "",
    fullNameAr: "",
    sex: "MALE" as "MALE" | "FEMALE",
    birthDate: "",
    bloodType: "",
    insuranceActive: true,
    governorate: "",
    district: "",
    chronicConditions: "",
    allergies: "",
  });
  const [busy, setBusy] = useState(false);
  const [cred, setCred] = useState<{ loginId?: string; password: string; mti?: string; nfcToken?: string } | null>(null);
  const [citizens, setCitizens] = useState<NationalIdentity[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [issuedNfc, setIssuedNfc] = useState<{ mti: string; token: string } | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const valid = /^\d{14}$/.test(f.nationalId) && f.fullNameEn.trim().length >= 2 && f.fullNameAr.trim().length >= 2 && !!f.birthDate;

  const loadCitizens = useCallback(async (q = "") => {
    try {
      const list = await api.searchPatients(q);
      setCitizens(list);
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  useEffect(() => {
    void loadCitizens("");
  }, [loadCitizens]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.openCitizenAccount({
        ...f,
        fullNameEn: f.fullNameEn.trim(),
        fullNameAr: f.fullNameAr.trim(),
        bloodType: f.bloodType || undefined,
        governorate: f.governorate || undefined,
        district: f.district || undefined,
        chronicConditions: f.chronicConditions ? f.chronicConditions.split(",").map((s) => ({ en: s.trim(), ar: s.trim() })) : [],
        allergies: f.allergies ? f.allergies.split(",").map((s) => ({ en: s.trim(), ar: s.trim() })) : [],
      });
      setCred({ loginId: r.loginId, password: r.temporaryPassword, mti: r.mti, nfcToken: r.nfcToken });
      push("success", ar ? "تم فتح حساب المواطن وإصدار كارت NFC للطوارئ" : "Citizen account & NFC card issued", `MTI: ${r.mti}`);
      setF({ nationalId: "", fullNameEn: "", fullNameAr: "", sex: "MALE", birthDate: "", bloodType: "", insuranceActive: true, governorate: "", district: "", chronicConditions: "", allergies: "" });
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueOrReplaceNfc(p: NationalIdentity) {
    try {
      const res = await api.replaceNfcCard(patientId(p));
      setIssuedNfc({ mti: p.mti, token: res.token });
      push("success", ar ? `تم إصدار شريحة NFC مشفرة جديدة للمواطن ${pick(p.fullName, locale)}` : `New encrypted NFC card issued for ${pick(p.fullName, locale)}`);
    } catch (e) {
      handleError(e);
    }
  }

  async function handleResetPassword(p: NationalIdentity) {
    if (!window.confirm(ar ? `إعادة تعيين كلمة مرور تطبيق الموبايل للمواطن ${pick(p.fullName, locale)}؟` : `Reset mobile app password for ${pick(p.fullName, locale)}?`)) return;
    try {
      const res = await api.resetCitizenPassword(patientId(p));
      setCred({ loginId: p.nationalId || p.mti, password: res.temporaryPassword, mti: p.mti });
      push("success", ar ? "تم إصدار كلمة مرور مؤقتة جديدة للمواطن" : "New temporary password generated");
    } catch (e) {
      handleError(e);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UserPlus}
        title={ar ? "فتح حساب مواطن وإدارة بطاقات الهوية الطبية الذكية (NFC)" : "Citizen Onboarding & Smart NFC Medical ID Cards"}
        badge={ar ? "الاستقبال الموحد" : "Unified Reception"}
      />

      {/* Issued NFC Banner */}
      {(cred?.nfcToken || issuedNfc) && (
        <Card className="border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs">
            <p className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {ar
                ? `تم إصدار وتفعيل كارت الطوارئ الذكي (NFC/QR) للمواطن (${issuedNfc?.mti ?? cred?.mti})`
                : `NFC/QR Smart Emergency Card Issued & Activated (${issuedNfc?.mti ?? cred?.mti})`}
            </p>
            <p className="font-mono text-on-surface-variant mt-1">
              {ar ? "رمز بطاقة الطوارئ الذكية (NFC):" : "Smart NFC Card Reference:"} {issuedNfc?.token ?? cred?.nfcToken}
            </p>
          </div>
          <a
            href={`/emergency?token=${encodeURIComponent(issuedNfc?.token ?? cred?.nfcToken ?? "")}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {ar ? "معاينة صفحة طوارئ المواطن (NFC Rescue Scan)" : "Open Emergency NFC Scan Page"}
          </a>
        </Card>
      )}

      {/* Registered Citizens & NFC Card Management Directory */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {ar ? "سجل المواطنين المسجلين وإدارة بطاقات الطوارئ الذكية (NFC)" : "Registered Citizens & Smart NFC Card Directory"} ({citizens.length})
            </CardTitle>
            <p className="text-xs text-on-surface-variant mt-1">
              {ar
                ? "إصدار أو استبدال شرائح NFC المفقودة، معاينة شاشة إنقاذ الحياة الفورية، أو استعادة كلمة مرور تطبيق المواطن"
                : "Issue or replace lost NFC cards, preview live emergency rescue profile, or reset citizen mobile app password"}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-72">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-3 start-3 text-on-surface-variant" />
              <input
                className="h-10 w-full rounded-lg bg-surface-container-low ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder={ar ? "بحث بالاسم أو MTI أو الرقم القومي..." : "Search name, MTI, or National ID..."}
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  void loadCitizens(e.target.value);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {citizens.map((p) => (
            <div key={p.mti} className="flex flex-col justify-between gap-3 rounded-xl border border-outline-variant/40 p-3.5 bg-surface-container-low/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <Image src={p.photoUrl} alt="" fill sizes="48px" className="rounded-lg object-cover" unoptimized />
                    <span className="absolute -bottom-1 -end-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {p.bloodType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{pick(p.fullName, locale)}</p>
                    <p className="text-xs font-mono text-primary font-semibold">{p.mti}</p>
                    {p.allergies.length > 0 && (
                      <p className="text-[11px] text-error font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {p.allergies.map((a) => pick(a, locale)).join("، ")}
                      </p>
                    )}
                  </div>
                </div>
                <Badge tone={p.insuranceActive ? "success" : "neutral"}>
                  {p.insuranceActive ? (ar ? "مؤمَّن" : "Insured") : ar ? "غير مؤمَّن" : "Uninsured"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-outline-variant/30">
                <a
                  href={`/emergency?token=${encodeURIComponent(p.mti)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {ar ? "شاشة طوارئ NFC" : "Emergency NFC"}
                </a>
                <Button size="sm" variant="outline" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => handleIssueOrReplaceNfc(p)}>
                  {ar ? "إصدار / بدل فاقد NFC" : "Replace NFC"}
                </Button>
                <Button size="sm" variant="ghost" icon={<KeyRound className="w-3.5 h-3.5" />} onClick={() => handleResetPassword(p)}>
                  {ar ? "كلمة مرور الموبايل" : "App Password"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Open New Citizen Account Form */}
      <Card>
        <CardHeader>
          <CardTitle>{ar ? "تسجيل مواطن جديد لأول مرة (كما في بطاقة الرقم القومي)" : "Register New Citizen Account (as on National ID Card)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الرقم القومي (14 رقماً)" : "National ID (14 digits)"}
              <input className={field} dir="ltr" inputMode="numeric" maxLength={14} value={f.nationalId} onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, ""))} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "تاريخ الميلاد" : "Date of birth"}
              <input className={field} type="date" dir="ltr" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الاسم بالإنجليزية" : "Full name (English)"}
              <input className={field} dir="ltr" maxLength={120} value={f.fullNameEn} onChange={(e) => set("fullNameEn", e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الاسم بالعربية" : "Full name (Arabic)"}
              <input className={field} maxLength={120} value={f.fullNameAr} onChange={(e) => set("fullNameAr", e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "النوع" : "Sex"}
              <select className={field} value={f.sex} onChange={(e) => set("sex", e.target.value as "MALE" | "FEMALE")}>
                <option value="MALE">{ar ? "ذكر" : "Male"}</option>
                <option value="FEMALE">{ar ? "أنثى" : "Female"}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "المحافظة" : "Governorate"}
              <select className={field} value={f.governorate} onChange={(e) => set("governorate", e.target.value)}>
                <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                {GOVERNORATES.map((g) => (
                  <option key={g.en} value={g.en}>{ar ? g.ar : g.en}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "المركز/المدينة" : "City/District"}
              <select className={field} value={f.district} onChange={(e) => set("district", e.target.value)} disabled={!f.governorate}>
                <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                {GOVERNORATES.find((g) => g.en === f.governorate)?.cities.map((c) => (
                  <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "فصيلة الدم" : "Blood type"}
              <select className={field} value={f.bloodType} onChange={(e) => set("bloodType", e.target.value)}>
                <option value="">—</option>
                {BLOOD.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "الأمراض المزمنة (افصل بفاصلة)" : "Chronic Conditions (comma separated)"}
              <input className={field} placeholder={ar ? "مثال: السكري، الضغط" : "e.g. Diabetes, Hypertension"} value={f.chronicConditions} onChange={(e) => set("chronicConditions", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "الحساسية الدوائية والغذائية (افصل بفاصلة)" : "Allergies (comma separated)"}
              <input className={field} placeholder={ar ? "مثال: البنسلين، الأسبرين" : "e.g. Penicillin, Aspirin"} value={f.allergies} onChange={(e) => set("allergies", e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={f.insuranceActive} onChange={(e) => set("insuranceActive", e.target.checked)} />
              {ar ? "تأمين صحي شامل سارٍ (UHIA)" : "Active Universal Health Insurance (UHIA)"}
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" loading={busy} disabled={!valid} icon={<UserPlus className="h-5 w-5" />}>
                {ar ? "فتح الحساب وإصدار بطاقة NFC" : "Open Account & Issue NFC Card"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <CredentialModal open={!!cred} onClose={() => setCred(null)} loginId={cred?.loginId} password={cred?.password ?? ""} />
    </div>
  );
}
