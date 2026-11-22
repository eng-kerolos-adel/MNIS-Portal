"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UserPlus,
  CreditCard,
  KeyRound,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  Trash2,
  Building2,
  XCircle,
  RefreshCw,
  Globe,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { useAuth } from "@/lib/auth/AuthProvider";
import { api, patientId } from "@/lib/data/service";
import { logPortalFeatureEvent } from "@/lib/firebase/analytics";
import {
  EGYPT_GOVERNORATES_DEFAULT,
  fetchEgyptGovernorates,
  filterGovernorateAreas,
  formatEgyptAddress,
  getEgyptLocationsSyncStats,
  searchEgyptNominatimLive,
  type EgyptCity,
  type EgyptGovernorate,
  type EgyptLocationsSyncStats,
} from "@/lib/data/egyptLocations";
import type { NationalIdentity } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CredentialModal } from "@/components/ui/CredentialModal";
import { pick } from "@/lib/utils/format";

const field =
  "h-11 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export default function CitizenAccountsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const { user } = useAuth();
  const ar = locale === "ar";
  const isMinistryOrAdmin = user?.role === "EXECUTIVE" || user?.role === "ADMIN";

  const [governorates, setGovernorates] = useState<EgyptGovernorate[]>(
    EGYPT_GOVERNORATES_DEFAULT,
  );
  const [locSyncing, setLocSyncing] = useState(true);
  const [locStats, setLocStats] = useState<EgyptLocationsSyncStats | null>(null);
  const [addrCenter, setAddrCenter] = useState("");
  const [addrAreaSearch, setAddrAreaSearch] = useState("");
  const [liveOsmAreas, setLiveOsmAreas] = useState<EgyptCity[]>([]);
  const [cred, setCred] = useState<{
    loginId?: string;
    password: string;
    mti?: string;
  } | null>(null);
  const [citizens, setCitizens] = useState<NationalIdentity[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [issuedNfc, setIssuedNfc] = useState<{ mti: string; token: string } | null>(null);
  const [phoneTarget, setPhoneTarget] = useState<NationalIdentity | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [addressTarget, setAddressTarget] = useState<NationalIdentity | null>(null);
  const [addrGov, setAddrGov] = useState("");
  const [addrDist, setAddrDist] = useState("");
  const [addrAr, setAddrAr] = useState("");
  const [addrEn, setAddrEn] = useState("");
  const [addrBusy, setAddrBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NationalIdentity | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<NationalIdentity | null>(null);
  const [pushTitleAr, setPushTitleAr] = useState("تأكيد الهوية الطبية (MNIS)");
  const [pushTitleEn, setPushTitleEn] = useState("MNIS Identity Verification");
  const [pushBodyAr, setPushBodyAr] = useState(
    "أهلاً بك في منظومة MNIS. يرجى تأكيد رقم هاتفك عبر كود SMS من التطبيق لإثبات هويتك كمواطن.",
  );
  const [pushBodyEn, setPushBodyEn] = useState(
    "Welcome to MNIS. Please confirm your reception-registered phone via SMS OTP inside the app.",
  );
  const [pushBusy, setPushBusy] = useState(false);

  const phoneRegex = /^(?:(?:\+|00)?200?|0)?1[0125]\d{8}$/;

  const loadCitizens = useCallback(
    async (q = "") => {
      try {
        const list = await api.searchPatients(q);
        setCitizens(list);
      } catch (e) {
        handleError(e);
      }
    },
    [handleError],
  );

  const syncLocations = useCallback(
    async (force = false) => {
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
              : `Live synced ${data.length} governorates & all local districts`,
          );
        }
      } finally {
        setLocSyncing(false);
      }
    },
    [ar, push],
  );

  useEffect(() => {
    void loadCitizens("");
    void syncLocations(false);
  }, [loadCitizens, syncLocations]);

  const editGovObj = governorates.find((g) => g.en === addrGov);

  useEffect(() => {
    const q = addrAreaSearch.trim();
    if (!addressTarget || !editGovObj || q.length < 2) {
      setLiveOsmAreas([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      void searchEgyptNominatimLive(q, editGovObj.en, ctrl.signal).then((rows) => {
        if (!ctrl.signal.aborted) setLiveOsmAreas(rows);
      });
    }, 320);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [addrAreaSearch, addressTarget, editGovObj]);

  const editFilteredAreas = filterGovernorateAreas(
    editGovObj,
    addrCenter,
    addrAreaSearch,
    liveOsmAreas,
  );

  async function handleIssueOrReplaceNfc(p: NationalIdentity) {
    try {
      const res = await api.replaceNfcCard(patientId(p));
      setIssuedNfc({ mti: p.mti, token: res.token });
      push(
        "success",
        ar
          ? `تم إصدار شريحة NFC مشفرة جديدة للمواطن ${pick(p.fullName, locale)}`
          : `New encrypted NFC card issued for ${pick(p.fullName, locale)}`,
      );
    } catch (e) {
      handleError(e);
    }
  }

  async function handleResetPassword(p: NationalIdentity) {
    if (
      !window.confirm(
        ar
          ? `إعادة تعيين كلمة مرور تطبيق الموبايل للمواطن ${pick(p.fullName, locale)}؟`
          : `Reset mobile app password for ${pick(p.fullName, locale)}?`,
      )
    )
      return;
    try {
      const res = await api.resetCitizenPassword(patientId(p));
      setCred({
        loginId: p.nationalId || p.mti,
        password: res.temporaryPassword,
        mti: p.mti,
      });
      push(
        "success",
        ar ? "تم إصدار كلمة مرور مؤقتة جديدة للمواطن" : "New temporary password generated",
      );
    } catch (e) {
      handleError(e);
    }
  }

  async function savePhoneUpdate(e: FormEvent) {
    e.preventDefault();
    if (!phoneTarget) return;
    setPhoneBusy(true);
    try {
      await api.updateCitizenPhone(patientId(phoneTarget), phoneInput.trim());
      void logPortalFeatureEvent("reception_phone_updated");
      push(
        "success",
        ar
          ? "تم تسجيل/تحديث رقم الهاتف — جاهز لإرسال كود التحقق SMS"
          : "Citizen phone saved — ready for SMS OTP verification",
      );
      setPhoneTarget(null);
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    } finally {
      setPhoneBusy(false);
    }
  }

  async function saveAddressUpdate(e: FormEvent) {
    e.preventDefault();
    if (!addressTarget || addrAr.trim().length < 3) return;
    setAddrBusy(true);
    try {
      await api.updateCitizenAddress(patientId(addressTarget), {
        governorate: addrGov || undefined,
        district: addrDist || undefined,
        addressAr: addrAr.trim(),
        addressEn: addrEn.trim() || undefined,
      });
      push(
        "success",
        ar ? "تم تحديث العنوان التفصيلي للمواطن بنجاح" : "Citizen detailed address updated",
      );
      setAddressTarget(null);
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    } finally {
      setAddrBusy(false);
    }
  }

  async function submitDeletionRequest(e: FormEvent) {
    e.preventDefault();
    if (!deleteTarget || deleteReason.trim().length < 3) return;
    setDeleteBusy(true);
    try {
      await api.requestCitizenDeletion(patientId(deleteTarget), deleteReason.trim());
      push(
        "success",
        ar
          ? "تم إرسال طلب حذف المواطن إلى الوزارة للمراجعة والتأكيد"
          : "Citizen deletion request submitted to Ministry for confirmation",
      );
      setDeleteTarget(null);
      setDeleteReason("");
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleApproveDeletion(p: NationalIdentity) {
    if (
      !window.confirm(
        ar
          ? `تأكيد الوزارة: سيتم حذف المواطن (${pick(p.fullName, locale)}) وسجله نهائياً دون إمكانية الاسترجاع. هل أنت متأكد؟`
          : `Ministry Confirmation: permanently delete citizen (${pick(p.fullName, locale)}) and all records?`,
      )
    )
      return;
    try {
      await api.approveCitizenDeletion(patientId(p));
      push(
        "success",
        ar
          ? "تم اعتماد الوزارة وحذف سجل المواطن نهائياً"
          : "Ministry approved and permanently deleted citizen record",
      );
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    }
  }

  async function handleRejectDeletion(p: NationalIdentity) {
    try {
      await api.rejectCitizenDeletion(patientId(p));
      push(
        "success",
        ar
          ? isMinistryOrAdmin
            ? "تم رفض طلب الحذف والإبقاء على سجل المواطن"
            : "تم إلغاء طلب الحذف"
          : "Deletion request cancelled",
      );
      await loadCitizens(searchQ);
    } catch (err) {
      handleError(err);
    }
  }

  async function sendPushSubmit(e: FormEvent) {
    e.preventDefault();
    if (!notifyTarget) return;
    setPushBusy(true);
    try {
      const res = await api.sendCitizenPush(patientId(notifyTarget), {
        titleAr: pushTitleAr.trim(),
        titleEn: pushTitleEn.trim(),
        bodyAr: pushBodyAr.trim(),
        bodyEn: pushBodyEn.trim(),
      });
      void logPortalFeatureEvent("reception_push_sent");
      push(
        "success",
        res.sent > 0
          ? ar
            ? `تم إرسال إشعار Push لجهاز المواطن بنجاح (وصل إلى ${res.sent} جهاز)`
            : `Push delivered to ${res.sent} device(s)`
          : ar
            ? "تم حفظ الإشعار داخل تطبيق المواطن (سيصل كإشعار فوري بمجرد فتح تطبيق الأندرويد)"
            : "Notification saved in app inbox (push activates once citizen opens Android app)",
      );
      setNotifyTarget(null);
    } catch (err) {
      handleError(err);
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={CreditCard}
        title={
          ar
            ? "سجل المواطنين المسجلين وإدارة البطاقات الذكية (NFC)"
            : "Registered Citizens & Smart NFC Card Directory"
        }
        badge={ar ? "الاستقبال الموحد" : "Unified Reception"}
        actions={
          <Link href="/reception/register">
            <Button icon={<UserPlus className="h-4 w-4" />}>
              {ar ? "تسجيل مواطن جديد لأول مرة" : "Register New Citizen"}
            </Button>
          </Link>
        }
      />

      {issuedNfc && (
        <Card className="border-emerald-500/40 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs">
            <p className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {ar
                ? `تم إصدار وتفعيل كارت الطوارئ الذكي (NFC/QR) للمواطن (${issuedNfc.mti})`
                : `NFC/QR Smart Emergency Card Issued & Activated (${issuedNfc.mti})`}
            </p>
            <p className="font-mono text-on-surface-variant mt-1">
              {ar ? "رمز بطاقة الطوارئ الذكية (NFC):" : "Smart NFC Card Reference:"}{" "}
              {issuedNfc.token}
            </p>
          </div>
          <a
            href={`/emergency?token=${encodeURIComponent(issuedNfc.token)}`}
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
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {ar
                ? "المواطنون المسجلون بالمنظومة"
                : "Registered Citizens"}{" "}
              ({citizens.length})
            </CardTitle>
            <p className="text-xs text-on-surface-variant mt-1">
              {ar
                ? "تعديل الهاتف والعنوان التفصيلي، إصدار بطاقات NFC، إرسال الإشعارات، وطلبات الحذف المعتمدة من الوزارة"
                : "Manage phone, detailed address, NFC cards, app password, push notifications & Ministry-confirmed deletions"}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-3 start-3 text-on-surface-variant" />
              <input
                className="h-10 w-full rounded-lg bg-surface-container-low ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder={
                  ar
                    ? "بحث بالاسم أو MTI أو الرقم القومي..."
                    : "Search name, MTI, or National ID..."
                }
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
            <div
              key={p.mti}
              className="flex flex-col justify-between gap-3 rounded-xl border border-outline-variant/40 p-3.5 bg-surface-container-low/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <Image
                      src={p.photoUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                    <span className="absolute -bottom-1 -end-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {p.bloodType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {pick(p.fullName, locale)}
                    </p>
                    <p className="text-xs font-mono text-primary font-semibold">{p.mti}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        dir="ltr"
                        className="font-mono text-on-surface-variant flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {p.phone ?? (ar ? "لم يُسجّل هاتف" : "No phone")}
                      </span>
                      {p.phone && (
                        <Badge tone={p.phoneVerifiedAt ? "success" : "warning"}>
                          {p.phoneVerifiedAt ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />{" "}
                              {ar ? "موثّق SMS" : "SMS Verified"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />{" "}
                              {ar ? "بانتظار SMS" : "Pending SMS"}
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant flex items-start gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                      <span>
                        {formatEgyptAddress(p, ar, governorates) ||
                          (ar ? "لم يُسجّل العنوان بالتفصيل" : "Detailed address not recorded")}
                      </span>
                    </p>
                    {p.allergies.length > 0 && (
                      <p className="text-[11px] text-error font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {p.allergies.map((a) => pick(a, locale)).join("، ")}
                      </p>
                    )}
                  </div>
                </div>
                <Badge tone={p.insuranceActive ? "success" : "neutral"}>
                  {p.insuranceActive
                    ? ar
                      ? "مؤمَّن"
                      : "Insured"
                    : ar
                      ? "غير مؤمَّن"
                      : "Uninsured"}
                </Badge>
              </div>
              {p.deletionRequestedAt && (
                <div className="rounded-lg border border-error/40 bg-error/10 p-2.5 text-xs flex flex-col gap-2">
                  <div>
                    <p className="font-bold text-error flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {ar
                        ? "طلب حذف معلّق — بانتظار تأكيد الوزارة"
                        : "Deletion Requested — Pending Ministry Confirmation"}
                    </p>
                    <p className="text-[11px] text-on-surface mt-0.5">
                      {ar ? "السبب:" : "Reason:"} {p.deletionReason}
                      {p.deletionRequestedByName
                        ? ` • ${ar ? "مُقدّم الطلب:" : "By:"} ${p.deletionRequestedByName}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isMinistryOrAdmin && (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleApproveDeletion(p)}
                      >
                        {ar ? "تأكيد الوزارة والحذف نهائياً" : "Ministry Approve & Delete"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleRejectDeletion(p)}
                    >
                      {isMinistryOrAdmin
                        ? ar
                          ? "رفض طلب الحذف"
                          : "Reject Deletion"
                        : ar
                          ? "إلغاء الطلب"
                          : "Withdraw Request"}
                    </Button>
                  </div>
                </div>
              )}
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
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Phone className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setPhoneTarget(p);
                    setPhoneInput(p.phone ?? "");
                  }}
                >
                  {ar ? "رقم الهاتف" : "Phone"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setAddressTarget(p);
                    setAddrGov(p.governorate ?? "");
                    setAddrDist(p.district ?? "");
                    setAddrAr(p.address.ar ?? "");
                    setAddrEn(p.address.en ?? "");
                    setAddrCenter("");
                    setAddrAreaSearch("");
                    setLiveOsmAreas([]);
                  }}
                >
                  {ar ? "العنوان بالتفصيل" : "Address"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Bell className="w-3.5 h-3.5" />}
                  onClick={() => setNotifyTarget(p)}
                >
                  {ar ? "إشعار Push" : "Push"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  onClick={() => handleIssueOrReplaceNfc(p)}
                >
                  {ar ? "إصدار / بدل فاقد NFC" : "Replace NFC"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                  onClick={() => handleResetPassword(p)}
                >
                  {ar ? "كلمة مرور الموبايل" : "App Password"}
                </Button>
                {!p.deletionRequestedAt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-error hover:bg-error/10"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setDeleteTarget(p);
                      setDeleteReason("");
                    }}
                  >
                    {ar ? "طلب حذف (بتأكيد الوزارة)" : "Request Deletion"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CredentialModal
        open={!!cred}
        onClose={() => setCred(null)}
        loginId={cred?.loginId}
        password={cred?.password ?? ""}
      />

      <Modal
        open={!!phoneTarget}
        onClose={() => setPhoneTarget(null)}
        title={ar ? "تسجيل / تحديث رقم هاتف المواطن" : "Register / Update Citizen Mobile"}
        size="sm"
      >
        <form onSubmit={savePhoneUpdate} className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant">
            {ar
              ? `سيستلم المواطن (${phoneTarget ? pick(phoneTarget.fullName, locale) : ""}) رمز تأكيد عبر SMS على هذا الرقم داخل تطبيق MNIS لإثبات ملكيته للهوية الطبية.`
              : `The citizen (${phoneTarget ? pick(phoneTarget.fullName, locale) : ""}) will verify this reception-registered number via SMS OTP inside the MNIS app.`}
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {ar ? "رقم الهاتف المحمول" : "Mobile Number"}
            <input
              className={field}
              dir="ltr"
              inputMode="tel"
              placeholder="01012345678 أو +201012345678"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d+]/g, ""))}
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPhoneTarget(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              loading={phoneBusy}
              disabled={!phoneRegex.test(phoneInput.trim())}
            >
              {ar ? "حفظ الرقم" : "Save Phone"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!addressTarget}
        onClose={() => setAddressTarget(null)}
        title={ar ? "تحديث العنوان التفصيلي للمواطن" : "Update Citizen Detailed Address"}
        size="md"
      >
        <form onSubmit={saveAddressUpdate} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-on-surface-variant">
              {addressTarget ? `${pick(addressTarget.fullName, locale)} (${addressTarget.mti})` : ""}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={locSyncing}
              onClick={() => void syncLocations(true)}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${locSyncing ? "animate-spin" : ""}`} />}
            >
              {ar ? "تحديث حي من الـ API" : "Sync Live API"}
            </Button>
          </div>
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2 text-[11px] flex items-center gap-2">
            <Globe className={`w-3.5 h-3.5 text-secondary shrink-0 ${locSyncing ? "animate-spin" : ""}`} />
            <span>
              {locSyncing
                ? ar
                  ? "جاري مزامنة جميع المحافظات والمراكز والقرى والأحياء حياً..."
                  : "Live-syncing all 27 Egypt governorates, centers & areas..."
                : ar
                  ? `متزامن حياً: ${locStats?.governoratesCount ?? governorates.length} محافظة • ${locStats?.centersCount ?? 0} مركز وقسم • ${(locStats?.areasCount ?? 0).toLocaleString()} قرية وحي وشياخة ومنطقة`
                  : `Live Synced: ${locStats?.governoratesCount ?? governorates.length} Govs • ${locStats?.centersCount ?? 0} Centers • ${(locStats?.areasCount ?? 0).toLocaleString()} Areas`}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {ar ? `المحافظة (${governorates.length})` : `Governorate (${governorates.length})`}
              <select
                className={field}
                value={addrGov}
                onChange={(e) => {
                  setAddrGov(e.target.value);
                  setAddrDist("");
                  setAddrCenter("");
                  setAddrAreaSearch("");
                  setLiveOsmAreas([]);
                }}
              >
                <option value="">
                  {locSyncing ? (ar ? "-- جاري التزامن --" : "-- Syncing --") : ar ? "-- اختر --" : "-- Select --"}
                </option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.en}>
                    {ar ? `${g.ar} (${g.en}) — ${g.cities.length.toLocaleString()}` : `${g.en} (${g.ar}) — ${g.cities.length.toLocaleString()}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {ar
                ? `المركز / القسم / المدينة (${editGovObj?.centers.length ?? 0})`
                : `Center / Markaz / Qism (${editGovObj?.centers.length ?? 0})`}
              <select
                className={field}
                value={addrCenter}
                onChange={(e) => {
                  setAddrCenter(e.target.value);
                  setAddrDist("");
                }}
                disabled={!addrGov}
              >
                <option value="">
                  {ar ? "-- كل مراكز وأقسام المحافظة --" : "-- All Centers & Qisms --"}
                </option>
                {(editGovObj?.centers ?? []).map((ctr) => (
                  <option key={ctr.code} value={ctr.code}>
                    {ar ? `${ctr.ar} (${ctr.en})` : `${ctr.en} (${ctr.ar})`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {ar
                  ? `القرية / الحي / الشياخة / المنطقة (${editFilteredAreas.length.toLocaleString()})`
                  : `Village / Neighborhood / District (${editFilteredAreas.length.toLocaleString()})`}
              </span>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute top-2.5 start-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  className="h-8 w-full rounded-md bg-surface-container-low ps-8 pe-2 text-[11px] font-normal outline-none focus:ring-2 focus:ring-secondary/50"
                  placeholder={ar ? "ابحث عن قرية أو حي أو منطقة..." : "Filter villages & neighborhoods..."}
                  value={addrAreaSearch}
                  onChange={(e) => setAddrAreaSearch(e.target.value)}
                  disabled={!addrGov}
                />
              </div>
            </div>
            <select
              className={field}
              value={addrDist}
              onChange={(e) => setAddrDist(e.target.value)}
              disabled={!addrGov}
            >
              <option value="">{ar ? "-- اختر المنطقة / القرية / الحي --" : "-- Select Area / Village --"}</option>
              {editFilteredAreas.map((c) => (
                <option key={c.id} value={c.en}>
                  {ar
                    ? `${c.ar}${c.centerAr && c.centerAr !== c.ar ? ` (${c.centerAr})` : ""} — ${c.en}`
                    : `${c.en}${c.centerEn && c.centerEn !== c.en ? ` (${c.centerEn})` : ""} — ${c.ar}`}
                </option>
              ))}
            </select>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "العنوان بالتفصيل بالعربية" : "Detailed Address (Arabic)"}
            <input
              className={field}
              maxLength={200}
              placeholder={
                ar ? "الشارع، رقم العقار، الدور، الشقة، علامة مميزة..." : "Street, building, floor, apt..."
              }
              value={addrAr}
              onChange={(e) => setAddrAr(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "العنوان بالتفصيل بالإنجليزية (اختياري)" : "Detailed Address (English, optional)"}
            <input
              className={field}
              dir="ltr"
              maxLength={200}
              value={addrEn}
              onChange={(e) => setAddrEn(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAddressTarget(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              loading={addrBusy}
              disabled={addrAr.trim().length < 3}
              icon={<MapPin className="w-4 h-4" />}
            >
              {ar ? "حفظ العنوان" : "Save Address"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          ar
            ? "طلب حذف سجل مواطن (يتطلب تأكيد الوزارة)"
            : "Request Citizen Deletion (Ministry Confirmation Required)"
        }
        size="sm"
      >
        <form onSubmit={submitDeletionRequest} className="flex flex-col gap-3">
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            {ar
              ? `لن يتم حذف المواطن (${deleteTarget ? pick(deleteTarget.fullName, locale) : ""}) فوراً؛ سيُرفع الطلب إلى لوحة وزارة الصحة لاعتماده وتأكيده قبل الحذف النهائي.`
              : `This record (${deleteTarget ? pick(deleteTarget.fullName, locale) : ""}) will NOT be deleted immediately. Your request will be queued for Ministry confirmation before permanent deletion.`}
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "سبب طلب الحذف" : "Reason for Deletion Request"}
            <textarea
              className="min-h-[84px] w-full rounded-lg bg-surface-container-low p-3 text-sm outline-none focus:ring-2 focus:ring-error/50"
              maxLength={300}
              placeholder={
                ar
                  ? "اكتب سبب طلب حذف السجل بوضوح (مثال: سجل مكرر / خطأ في الرقم القومي / وفاة)..."
                  : "Enter clear justification for deletion..."
              }
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={deleteBusy}
              disabled={deleteReason.trim().length < 3}
              icon={<Trash2 className="w-4 h-4" />}
            >
              {ar ? "إرسال الطلب للوزارة" : "Submit to Ministry"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!notifyTarget}
        onClose={() => setNotifyTarget(null)}
        title={ar ? "إرسال إشعار فوري عبر Firebase (Push)" : "Send Instant Firebase Push Notification"}
        size="sm"
      >
        <form onSubmit={sendPushSubmit} className="flex flex-col gap-3">
          <p className="text-xs text-on-surface-variant">
            {ar
              ? `المستلم: ${notifyTarget ? pick(notifyTarget.fullName, locale) : ""} (${notifyTarget?.mti ?? ""})`
              : `Recipient: ${notifyTarget ? pick(notifyTarget.fullName, locale) : ""} (${notifyTarget?.mti ?? ""})`}
          </p>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "عنوان الإشعار (عربي)" : "Title (Arabic)"}
            <input
              className={field}
              value={pushTitleAr}
              onChange={(e) => setPushTitleAr(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "عنوان الإشعار (إنجليزي)" : "Title (English)"}
            <input
              className={field}
              dir="ltr"
              value={pushTitleEn}
              onChange={(e) => setPushTitleEn(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "محتوى الرسالة (عربي)" : "Message Body (Arabic)"}
            <textarea
              className="min-h-[80px] w-full rounded-lg bg-surface-container-low p-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
              value={pushBodyAr}
              onChange={(e) => setPushBodyAr(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            {ar ? "محتوى الرسالة (إنجليزي)" : "Message Body (English)"}
            <textarea
              className="min-h-[72px] w-full rounded-lg bg-surface-container-low p-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
              dir="ltr"
              value={pushBodyEn}
              onChange={(e) => setPushBodyEn(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setNotifyTarget(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" loading={pushBusy} icon={<Bell className="w-4 h-4" />}>
              {ar ? "إرسال الإشعار الآن" : "Send Push Now"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
