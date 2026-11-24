"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, Globe, RefreshCw, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { logPortalFeatureEvent } from "@/lib/firebase/analytics";
import {
  EGYPT_GOVERNORATES_DEFAULT,
  fetchEgyptGovernorates,
  filterGovernorateAreas,
  getEgyptLocationsSyncStats,
  searchEgyptNominatimLive,
  type EgyptCity,
  type EgyptGovernorate,
  type EgyptLocationsSyncStats,
} from "@/lib/data/egyptLocations";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CredentialModal } from "@/components/ui/CredentialModal";
import { WebcamCapture } from "@/components/ui/WebcamCapture";

const field =
  "h-11 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterCitizenPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";

  const [governorates, setGovernorates] = useState<EgyptGovernorate[]>(
    EGYPT_GOVERNORATES_DEFAULT,
  );
  const [locSyncing, setLocSyncing] = useState(true);
  const [locStats, setLocStats] = useState<EgyptLocationsSyncStats | null>(null);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [liveOsmAreas, setLiveOsmAreas] = useState<EgyptCity[]>([]);
  const [f, setF] = useState({
    nationalId: "",
    phone: "",
    fullNameEn: "",
    fullNameAr: "",
    sex: "MALE" as "MALE" | "FEMALE",
    birthDate: "",
    bloodType: "",
    photoUrl: "",
    insuranceActive: true,
    governorate: "",
    district: "",
    addressAr: "",
    addressEn: "",
    chronicConditions: "",
    allergies: "",
  });
  const [idPhotoVerified, setIdPhotoVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cred, setCred] = useState<{
    loginId?: string;
    password: string;
    mti?: string;
    nfcToken?: string;
  } | null>(null);

  async function syncLocations(force = false) {
    setLocSyncing(true);
    try {
      const data = await fetchEgyptGovernorates(force);
      setGovernorates(data);
      setLocStats(getEgyptLocationsSyncStats());
      if (force) {
        push(
          "success",
          ar
            ? `تمت المزامنة الحية: ${data.length} محافظة وجميع المراكز والقرى والأحياء`
            : `Live synced ${data.length} Egypt governorates & all local districts`,
        );
      }
    } finally {
      setLocSyncing(false);
    }
  }

  useEffect(() => {
    void syncLocations(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGov = governorates.find((g) => g.en === f.governorate);

  useEffect(() => {
    const q = areaSearch.trim();
    if (!selectedGov || q.length < 2) {
      setLiveOsmAreas([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      void searchEgyptNominatimLive(q, selectedGov.en, ctrl.signal).then((rows) => {
        if (!ctrl.signal.aborted) setLiveOsmAreas(rows);
      });
    }, 320);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [areaSearch, selectedGov]);

  const filteredAreas = filterGovernorateAreas(
    selectedGov,
    selectedCenter,
    areaSearch,
    liveOsmAreas,
  );

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const phoneRegex = /^(?:(?:\+|00)?200?|0)?1[0125]\d{8}$/;
  const valid =
    /^\d{14}$/.test(f.nationalId) &&
    phoneRegex.test(f.phone.trim()) &&
    f.fullNameEn.trim().length >= 2 &&
    f.fullNameAr.trim().length >= 2 &&
    f.addressAr.trim().length >= 5 &&
    !!f.birthDate &&
    Boolean(f.photoUrl) &&
    idPhotoVerified;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.openCitizenAccount({
        ...f,
        phone: f.phone.trim(),
        photoUrl: f.photoUrl || undefined,
        fullNameEn: f.fullNameEn.trim(),
        fullNameAr: f.fullNameAr.trim(),
        bloodType: f.bloodType || undefined,
        governorate: f.governorate || undefined,
        district: f.district || undefined,
        addressAr: f.addressAr.trim(),
        addressEn: f.addressEn.trim() || f.addressAr.trim(),
        chronicConditions: f.chronicConditions
          ? f.chronicConditions
              .split(",")
              .map((s) => ({ en: s.trim(), ar: s.trim() }))
          : [],
        allergies: f.allergies
          ? f.allergies.split(",").map((s) => ({ en: s.trim(), ar: s.trim() }))
          : [],
      });
      void logPortalFeatureEvent("reception_citizen_created", {
        hasPhone: true,
      });
      setCred({
        loginId: r.loginId,
        password: r.temporaryPassword,
        mti: r.mti,
        nfcToken: r.nfcToken,
      });
      push(
        "success",
        ar
          ? "تم فتح حساب المواطن وتسجيل رقمه وعنوانه وإصدار NFC"
          : "Citizen account, address, phone & NFC card issued",
        `MTI: ${r.mti}`,
      );
      setF({
        nationalId: "",
        phone: "",
        fullNameEn: "",
        fullNameAr: "",
        sex: "MALE",
        birthDate: "",
        bloodType: "",
        photoUrl: "",
        insuranceActive: true,
        governorate: "",
        district: "",
        addressAr: "",
        addressEn: "",
        chronicConditions: "",
        allergies: "",
      });
      setIdPhotoVerified(false);
      setSelectedCenter("");
      setAreaSearch("");
      setLiveOsmAreas([]);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UserPlus}
        title={
          ar
            ? "تسجيل مواطن جديد لأول مرة (كما في بطاقة الرقم القومي)"
            : "Register New Citizen Account (as on National ID Card)"
        }
        badge={ar ? "الاستقبال الموحد" : "Unified Reception"}
        actions={
          <Link href="/reception/citizens">
            <Button variant="outline" icon={<Users className="h-4 w-4" />}>
              {ar ? "سجل المواطنين المسجلين" : "Registered Citizens"}
            </Button>
          </Link>
        }
      />

      {cred?.nfcToken && (
        <Card className="border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs">
            <p className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {ar
                ? `تم إصدار وتفعيل كارت الطوارئ الذكي (NFC/QR) للمواطن (${cred.mti})`
                : `NFC/QR Smart Emergency Card Issued & Activated (${cred.mti})`}
            </p>
            <p className="font-mono text-on-surface-variant mt-1">
              {ar ? "رمز بطاقة الطوارئ الذكية (NFC):" : "Smart NFC Card Reference:"}{" "}
              {cred.nfcToken}
            </p>
          </div>
          <a
            href={`/emergency?token=${encodeURIComponent(cred.nfcToken)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {ar ? "معاينة صفحة طوارئ المواطن (NFC Rescue Scan)" : "Open Emergency NFC Scan Page"}
          </a>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {ar
              ? "بيانات الهوية القومية والعنوان الكامل في جميع محافظات ومناطق مصر"
              : "National Identity & Complete Egypt Address Details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <WebcamCapture
                value={f.photoUrl}
                onChange={(url) => set("photoUrl", url)}
                verified={idPhotoVerified}
                onVerifiedChange={setIdPhotoVerified}
              />
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الرقم القومي (14 رقماً)" : "National ID (14 digits)"}
              <input
                className={field}
                dir="ltr"
                inputMode="numeric"
                maxLength={14}
                value={f.nationalId}
                onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "رقم موبايل المواطن (لتأكيد الهوية بكود SMS)" : "Citizen Mobile (for SMS OTP Identity Confirmation)"}
              <input
                className={field}
                dir="ltr"
                inputMode="tel"
                placeholder="01012345678"
                maxLength={16}
                value={f.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^\d+]/g, ""))}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "تاريخ الميلاد" : "Date of birth"}
              <input
                className={field}
                type="date"
                dir="ltr"
                max={new Date().toISOString().slice(0, 10)}
                value={f.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الاسم بالإنجليزية" : "Full name (English)"}
              <input
                className={field}
                dir="ltr"
                maxLength={120}
                value={f.fullNameEn}
                onChange={(e) => set("fullNameEn", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "الاسم بالعربية" : "Full name (Arabic)"}
              <input
                className={field}
                maxLength={120}
                value={f.fullNameAr}
                onChange={(e) => set("fullNameAr", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "النوع" : "Sex"}
              <select
                className={field}
                value={f.sex}
                onChange={(e) => set("sex", e.target.value as "MALE" | "FEMALE")}
              >
                <option value="MALE">{ar ? "ذكر" : "Male"}</option>
                <option value="FEMALE">{ar ? "أنثى" : "Female"}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "فصيلة الدم" : "Blood type"}
              <select
                className={field}
                value={f.bloodType}
                onChange={(e) => set("bloodType", e.target.value)}
              >
                <option value="">—</option>
                {BLOOD.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 rounded-xl border border-secondary/30 bg-secondary/5 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Globe className={`h-4 w-4 text-secondary ${locSyncing ? "animate-spin" : ""}`} />
                <div>
                  <p className="font-bold text-on-surface">
                    {locSyncing
                      ? ar
                        ? "جاري مزامنة جميع محافظات ومراكز وقرى وأحياء مصر حياً من الـ API..."
                        : "Live-syncing all 27 Egypt governorates, centers & localities from APIs..."
                      : ar
                        ? `متزامن حياً من الـ API: ${locStats?.governoratesCount ?? governorates.length} محافظة • ${locStats?.centersCount ?? 0} مركز وقسم • ${(locStats?.areasCount ?? 0).toLocaleString()} قرية وحي وشياخة ومنطقة`
                        : `Live API Synced: ${locStats?.governoratesCount ?? governorates.length} Governorates • ${locStats?.centersCount ?? 0} Centers/Qisms • ${(locStats?.areasCount ?? 0).toLocaleString()} Villages & Neighborhoods`}
                  </p>
                  {locStats?.syncedAt && !locSyncing && (
                    <p className="text-[11px] text-on-surface-variant">
                      {ar ? "آخر مزامنة حية:" : "Last live sync:"}{" "}
                      {new Date(locStats.syncedAt).toLocaleTimeString(ar ? "ar-EG" : "en-US")} •{" "}
                      {locStats.sources.join(" + ")}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={locSyncing}
                onClick={() => void syncLocations(true)}
                icon={<RefreshCw className={`h-3.5 w-3.5 ${locSyncing ? "animate-spin" : ""}`} />}
              >
                {ar ? "تحديث حي من الـ API" : "Refresh Live API"}
              </Button>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? `المحافظة (${governorates.length} محافظة)` : `Governorate (${governorates.length})`}
              <select
                className={field}
                value={f.governorate}
                onChange={(e) => {
                  setF((x) => ({ ...x, governorate: e.target.value, district: "" }));
                  setSelectedCenter("");
                  setAreaSearch("");
                  setLiveOsmAreas([]);
                }}
              >
                <option value="">
                  {locSyncing
                    ? ar
                      ? "-- جاري التحميل من الـ API --"
                      : "-- Syncing Governorates --"
                    : ar
                      ? "-- اختر المحافظة --"
                      : "-- Select Governorate --"}
                </option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.en}>
                    {ar
                      ? `${g.ar} (${g.en}) — ${g.cities.length.toLocaleString()} منطقة`
                      : `${g.en} (${g.ar}) — ${g.cities.length.toLocaleString()} areas`}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar
                ? `المركز / القسم / المدينة (${selectedGov?.centers.length ?? 0})`
                : `Center / Markaz / Qism (${selectedGov?.centers.length ?? 0})`}
              <select
                className={field}
                value={selectedCenter}
                onChange={(e) => {
                  setSelectedCenter(e.target.value);
                  setF((x) => ({ ...x, district: "" }));
                }}
                disabled={!f.governorate}
              >
                <option value="">
                  {ar ? "-- كل مراكز وأقسام المحافظة --" : "-- All Centers & Qisms --"}
                </option>
                {(selectedGov?.centers ?? []).map((ctr) => (
                  <option key={ctr.code} value={ctr.code}>
                    {ar ? `${ctr.ar} (${ctr.en})` : `${ctr.en} (${ctr.ar})`}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {ar
                    ? `القرية / الحي / الشياخة / المنطقة (${filteredAreas.length.toLocaleString()} منطقة)`
                    : `Village / Neighborhood / District (${filteredAreas.length.toLocaleString()} areas)`}
                </span>
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute top-2.5 start-2.5 text-on-surface-variant" />
                  <input
                    type="text"
                    className="h-8 w-full rounded-md bg-surface-container-low ps-8 pe-2.5 text-xs font-normal outline-none focus:ring-2 focus:ring-secondary/50"
                    placeholder={
                      ar
                        ? "بحث في قرى وأحياء وشياخات المحافظة..."
                        : "Search villages, neighborhoods & areas..."
                    }
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    disabled={!f.governorate}
                  />
                </div>
              </div>
              <select
                className={field}
                value={f.district}
                onChange={(e) => set("district", e.target.value)}
                disabled={!f.governorate}
              >
                <option value="">
                  {ar ? "-- اختر المنطقة / القرية / الحي --" : "-- Select Village / Neighborhood / Area --"}
                </option>
                {filteredAreas.map((c) => (
                  <option key={c.id} value={c.en}>
                    {ar
                      ? `${c.ar}${c.centerAr && c.centerAr !== c.ar ? ` (${c.centerAr})` : ""} — ${c.en}`
                      : `${c.en}${c.centerEn && c.centerEn !== c.en ? ` (${c.centerEn})` : ""} — ${c.ar}`}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar
                ? "العنوان بالتفصيل بالعربية (كما في بطاقة الرقم القومي: الشارع / رقم العقار / الدور / الشقة)"
                : "Detailed Address in Arabic (Street / Building / Floor / Apt)"}
              <input
                className={field}
                maxLength={200}
                placeholder={
                  ar
                    ? "مثال: 15 شارع عباس العقاد، عمارة 4، الدور الثالث، شقة 6"
                    : "e.g. 15 Abbas El Akkad St, Bldg 4, Floor 3"
                }
                value={f.addressAr}
                onChange={(e) => set("addressAr", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "العنوان بالتفصيل بالإنجليزية (اختياري)" : "Detailed Address in English (Optional)"}
              <input
                className={field}
                dir="ltr"
                maxLength={200}
                placeholder="e.g. 15 Abbas El Akkad St, Bldg 4, Floor 3, Apt 6"
                value={f.addressEn}
                onChange={(e) => set("addressEn", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "الأمراض المزمنة (افصل بفاصلة)" : "Chronic Conditions (comma separated)"}
              <input
                className={field}
                placeholder={ar ? "مثال: السكري، الضغط" : "e.g. Diabetes, Hypertension"}
                value={f.chronicConditions}
                onChange={(e) => set("chronicConditions", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
              {ar ? "الحساسية الدوائية والغذائية (افصل بفاصلة)" : "Allergies (comma separated)"}
              <input
                className={field}
                placeholder={ar ? "مثال: البنسلين، الأسبرين" : "e.g. Penicillin, Aspirin"}
                value={f.allergies}
                onChange={(e) => set("allergies", e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={f.insuranceActive}
                onChange={(e) => set("insuranceActive", e.target.checked)}
              />
              {ar ? "تأمين صحي شامل سارٍ (UHIA)" : "Active Universal Health Insurance (UHIA)"}
            </label>
            <div className="sm:col-span-2 space-y-2">
              {(!f.photoUrl || !idPhotoVerified) && (
                <p className="text-xs font-semibold text-amber-600">
                  {ar
                    ? "• يرجى تصوير المواطن بالويب كام وتأكيد مطابقة الصورة مع بطاقة الرقم القومي قبل تفعيل الحساب."
                    : "• Please capture the citizen's webcam photo and check the National ID photo match box before submitting."}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                loading={busy}
                disabled={!valid}
                icon={<UserPlus className="h-5 w-5" />}
              >
                {ar ? "فتح الحساب وإصدار بطاقة NFC" : "Open Account & Issue NFC Card"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <CredentialModal
        open={!!cred}
        onClose={() => setCred(null)}
        loginId={cred?.loginId}
        password={cred?.password ?? ""}
      />
    </div>
  );
}
