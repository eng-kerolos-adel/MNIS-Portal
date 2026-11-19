"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Building2, CalendarCheck, Check, FlaskConical, RefreshCw, ShieldAlert, Stethoscope, UserPlus, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { pick, formatDate, formatTime } from "@/lib/utils/format";

type Appt = Awaited<ReturnType<typeof api.getAppointments>>[number];
type Doctor = Awaited<ReturnType<typeof api.getDoctors>>[number];
type LabFacility = Awaited<ReturnType<typeof api.getLabs>>[number];

const TONE = { REQUESTED: "warning", CONFIRMED: "success", REJECTED: "error", CANCELLED: "neutral", COMPLETED: "secondary" } as const;
const LABEL: Record<Appt["status"], { en: string; ar: string }> = {
  REQUESTED: { en: "Awaiting Confirmation", ar: "بانتظار التأكيد" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكد" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  COMPLETED: { en: "Completed", ar: "تم" },
};
const field = "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export function AppointmentsManager({ mode }: { mode: "clinic" | "lab" }) {
  const { locale } = useLocale();
  const { user: me } = useAuth();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const isLab = mode === "lab";

  const [items, setItems] = useState<Appt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [labs, setLabs] = useState<LabFacility[]>([]);
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [tab, setTab] = useState<"open" | "confirmed" | "all">("open");
  const isGlobalAdmin = me?.role === "ADMIN" || me?.role === "EXECUTIVE";
  const [sel, setSel] = useState<Appt | null>(null);
  const [when, setWhen] = useState("");
  const [providerId, setProviderId] = useState("");
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string }[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, docs, labList] = await Promise.all([
        api.getAppointments(),
        isLab ? Promise.resolve([] as Doctor[]) : api.getDoctors(),
        isLab ? api.getLabs() : Promise.resolve([] as LabFacility[]),
      ]);
      setItems(a.filter((x) => (isLab ? x.type === "LAB" : x.type === "CLINIC")));
      setDoctors(docs);
      setLabs(labList);
    } catch (e) {
      handleError(e);
    }
  }, [handleError, isLab]);

  useEffect(() => {
    void load();
  }, [load]);
  useAutoRefresh(load, 15_000);

  // Default clinic assistant or lab receptionist to their own assigned provider when applicable
  useEffect(() => {
    if (facilityFilter !== "ALL" || !me) return;
    if (isLab && labs.some((l) => l.id === me.id)) {
      setFacilityFilter(me.id);
    } else if (!isLab && me.role === "DOCTOR" && doctors.some((d) => d.id === me.id)) {
      setFacilityFilter(me.id);
    }
  }, [isLab, labs, doctors, me, facilityFilter]);

  const scoped = useMemo(() => {
    const byProvider = !isGlobalAdmin || facilityFilter === "ALL" ? items : items.filter((i) => i.doctorId === facilityFilter);
    if (tab === "open") return byProvider.filter((i) => i.status === "REQUESTED");
    if (tab === "confirmed") return byProvider.filter((i) => i.status === "CONFIRMED");
    return byProvider;
  }, [items, facilityFilter, tab, isGlobalAdmin]);

  const openCount = useMemo(
    () => (!isGlobalAdmin || facilityFilter === "ALL" ? items : items.filter((i) => i.doctorId === facilityFilter)).filter((i) => i.status === "REQUESTED").length,
    [items, facilityFilter, isGlobalAdmin]
  );

  const confirmedCount = useMemo(
    () => (!isGlobalAdmin || facilityFilter === "ALL" ? items : items.filter((i) => i.doctorId === facilityFilter)).filter((i) => i.status === "CONFIRMED").length,
    [items, facilityFilter, isGlobalAdmin]
  );

  function open(a: Appt) {
    setSel(a);
    const defaultDate = a.preferredDate ? new Date(a.preferredDate).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    setWhen(defaultDate);
    setProviderId(a.doctorId ?? (isLab ? labs[0]?.id : doctors[0]?.id) ?? "");
    setNote("");
  }

  useEffect(() => {
    if (isLab || !providerId || !when) {
      setSlots([]);
      return;
    }
    const dayStr = when.slice(0, 10);
    api.getDoctorSlots(providerId, dayStr).then(setSlots).catch(() => setSlots([]));
  }, [isLab, providerId, when]);

  async function checkIn(apptId: string) {
    setBusy(true);
    try {
      const res = await api.checkInAppointment(apptId);
      push(
        "success",
        ar
          ? `تم تسجيل حضور المريض وإدخاله طابور العيادة بنجاح (تذكرة رقم: ${res.visit?.ticketNo ?? "—"})`
          : `Patient checked in to clinic queue (Ticket: ${res.visit?.ticketNo ?? "—"})`
      );
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!sel || !when) return;
    setBusy(true);
    try {
      await api.confirmAppointment(sel.id, {
        scheduledAt: new Date(when).toISOString(),
        doctorId: providerId || undefined,
        note: note.trim() || undefined,
      });
      push(
        "success",
        isLab
          ? ar
            ? "تم تأكيد حجز المعمل وإصدار باركود العينة في قائمة السحب وإشعار المواطن"
            : "Lab booking confirmed, sample barcode issued, and citizen notified"
          : ar
            ? "تم تأكيد موعد العيادة وإشعار المواطن — يمكنك تسجيل حضوره وإدخاله الطابور عند وصوله"
            : "Clinic appointment slot confirmed & citizen notified"
      );
      setSel(null);
      await load();
    } catch (e) {
      handleError(e);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!sel) return;
    setBusy(true);
    try {
      await api.rejectAppointment(sel.id, note.trim() || undefined);
      push("info", ar ? "تم رفض الطلب وإشعار المواطن" : "Request rejected & citizen notified");
      setSel(null);
      await load();
    } catch (e) {
      handleError(e);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={isLab ? FlaskConical : CalendarCheck}
        title={isLab ? (ar ? "استقبال وتأكيد حجوزات المعامل" : "Laboratory Appointment Reception") : (ar ? "إدارة حجوزات العيادة (الموظف المساعد للطبيب)" : "Clinic Appointments (Doctor's Assistant)")}
        badge={isLab ? (ar ? "استقبال المعامل المسجلة بمصر" : "Nationwide Lab Reception") : (ar ? "بوابة سكرتارية ومساعد الطبيب" : "Clinic Assistant Desk")}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
            {ar ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs">
        <ShieldAlert className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="font-semibold text-on-surface leading-relaxed">
          {isLab
            ? ar
              ? "مسؤول استقبال المعمل يستقبل حجوزات المواطنين المرسلة لهذا المعمل فقط، ويؤكد الموعد لإصدار باركود العينة فوراً دون أي تعارض مع الاستقبال العام أو عيادات الأطباء."
              : "Lab receptionists manage lab bookings routed specifically to registered laboratories and issue sample barcodes directly into the intake queue."
            : ar
              ? "صلاحية الموظف المساعد للطبيب: استقبال وتأكيد حجوزات العيادة وفق أوقات العمل المتاحة التي حددها الطبيب وإدارة طابور دخول الحالات — دون صلاحية فتح غرفة الكشف أو تحرير الروشتات أو تعديل الملف الطبي."
              : "Clinic Assistant Scope: Confirms clinic requests within the physician's published schedule and manages room entry queue — strictly separated from clinical prescribing and medical records."}
        </p>
      </div>

      {/* Facility / Physician Scope Banner or Filter Bar (Admin/Executive only) */}
      {isGlobalAdmin ? (
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant px-1">
              {isLab ? <FlaskConical className="h-3.5 w-3.5 text-secondary" /> : <Stethoscope className="h-3.5 w-3.5 text-primary" />}
              {isLab ? (ar ? "تصفية حسب المعمل:" : "Filter by Laboratory:") : (ar ? "تصفية حسب عيادة الطبيب:" : "Filter by Physician / Clinic:")}
            </span>
            <button
              type="button"
              onClick={() => setFacilityFilter("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${facilityFilter === "ALL" ? "bg-primary text-on-primary" : "bg-surface-container-low hover:bg-surface-container"}`}
            >
              {isLab ? (ar ? `كل المعامل (${items.length})` : `All Labs (${items.length})`) : (ar ? `كل العيادات (${items.length})` : `All Clinics (${items.length})`)}
            </button>
            {(isLab ? labs : doctors).map((item) => {
              const count = items.filter((x) => x.doctorId === item.id).length;
              const label = isLab
                ? ar
                  ? (item as LabFacility).nameAr
                  : (item as LabFacility).nameEn
                : ar
                  ? (item as Doctor).fullNameAr
                  : (item as Doctor).fullNameEn;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFacilityFilter(item.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${facilityFilter === item.id ? "bg-primary text-on-primary" : "bg-surface-container-low hover:bg-surface-container"}`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-3 border-primary/20 bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-bold text-primary">
              <Building2 className="h-4 w-4" />
              {isLab ? (ar ? "المعمل النشط:" : "Assigned Laboratory:") : (ar ? "العيادة النشطة:" : "Assigned Clinic:")}{" "}
              <span className="text-on-surface">
                {(ar ? me?.facilityAr : me?.facilityEn) || (ar ? me?.fullNameAr : me?.fullNameEn)}
              </span>
            </span>
            <Badge tone="secondary">
              {ar ? `${items.length} حجز خاص بهذه المنشأة فقط` : `${items.length} Facility-Scoped Bookings`}
            </Badge>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isLab ? (ar ? "حجوزات التحاليل الواردة من تطبيق المواطن" : "Incoming Lab Bookings") : (ar ? "طلبات مواعيد العيادة الواردة للطبيب" : "Incoming Clinic Appointment Requests")}</CardTitle>
          <Tabs
            tabs={[
              { id: "open", label: ar ? "بانتظار التأكيد" : "Awaiting", count: openCount },
              { id: "confirmed", label: isLab ? (ar ? "المؤكدة" : "Confirmed") : (ar ? "مؤكدة — تسجيل الحضور" : "Confirmed — Check-In"), count: confirmedCount },
              { id: "all", label: ar ? "السجل الكامل" : "All" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {scoped.length === 0 && (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {ar ? "لا توجد طلبات حجز مطابقة حالياً" : "No matching appointment requests"}
            </p>
          )}
          {scoped.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  <Image src={a.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-on-surface">{pick(a.patient.fullName, locale)}</p>
                    <span className="font-mono text-[11px] text-primary font-semibold">MTI: {a.patient.mti}</span>
                    {a.testPanel && <Badge tone="secondary">{a.testPanel}</Badge>}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {a.reason} • {ar ? "يفضّل:" : "prefers:"} {formatDate(a.preferredDate, locale)} {formatTime(a.preferredDate, locale)}
                  </p>
                  {a.doctor && (
                    <p className="text-[11px] font-semibold text-secondary flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {isLab
                        ? ar
                          ? (a.doctor.facilityAr ?? a.doctor.fullNameAr)
                          : (a.doctor.facilityEn ?? a.doctor.fullNameEn)
                        : `${ar ? a.doctor.fullNameAr : a.doctor.fullNameEn}${a.doctor.facilityAr || a.doctor.facilityEn ? ` — ${ar ? (a.doctor.facilityAr ?? a.doctor.facilityEn) : (a.doctor.facilityEn ?? a.doctor.facilityAr)}` : ""}`}
                    </p>
                  )}
                  {a.scheduledAt && (
                    <p className="text-xs font-semibold text-success mt-0.5">
                      {ar ? "الموعد المؤكد:" : "Confirmed:"} {formatDate(a.scheduledAt, locale)} {formatTime(a.scheduledAt, locale)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 ps-14 sm:ps-0">
                <Badge tone={TONE[a.status]}>{pick(LABEL[a.status], locale)}</Badge>
                {a.status === "REQUESTED" && (
                  <Button size="sm" onClick={() => open(a)}>
                    {ar ? "مراجعة وتأكيد" : "Review & Confirm"}
                  </Button>
                )}
                {!isLab && a.status === "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<UserPlus className="h-3.5 w-3.5" />}
                    loading={busy}
                    onClick={() => checkIn(a.id)}
                  >
                    {ar ? "تسجيل حضور وإدخال الطابور" : "Check-In to Queue"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? pick(sel.patient.fullName, locale) : ""}>
        {sel && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-container-low p-3 text-sm space-y-1">
              {sel.testPanel && <p className="font-bold text-secondary">{ar ? "التحليل المطلوب:" : "Lab Panel:"} {sel.testPanel}</p>}
              <p>{sel.reason}</p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {ar ? "تاريخ ووقت الموعد المؤكد" : "Confirmed Date & Time"}
              <input type="datetime-local" dir="ltr" className={field} value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {isLab ? (ar ? "المعمل المسؤول" : "Assigned Laboratory") : (ar ? "الطبيب المعالج" : "Attending Physician")}
              {isGlobalAdmin ? (
                <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                  {(isLab ? labs : doctors).map((d) => (
                    <option key={d.id} value={d.id}>
                      {isLab
                        ? ar
                          ? (d as LabFacility).nameAr
                          : (d as LabFacility).nameEn
                        : `${ar ? (d as Doctor).fullNameAr : (d as Doctor).fullNameEn}${(d as Doctor).specialityAr || (d as Doctor).specialityEn ? ` — ${ar ? ((d as Doctor).specialityAr ?? (d as Doctor).specialityEn) : ((d as Doctor).specialityEn ?? (d as Doctor).specialityAr)}` : ""}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg bg-surface-container-low px-3 py-2.5 text-xs font-bold text-primary">
                  {isLab
                    ? (ar ? sel.doctor?.facilityAr ?? me?.facilityAr : sel.doctor?.facilityEn ?? me?.facilityEn) ?? "Laboratory"
                    : `${ar ? sel.doctor?.fullNameAr ?? me?.fullNameAr : sel.doctor?.fullNameEn ?? me?.fullNameEn}`}
                </div>
              )}
            </label>
            {!isLab && slots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {ar ? "الفترات المتاحة في جدول الطبيب لهذا اليوم:" : "Physician's Available Schedule Slots:"}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {slots.map((s) => {
                    const timeStr = s.slotStart.includes("T") ? new Date(s.slotStart).toTimeString().slice(0, 5) : s.slotStart.slice(0, 5);
                    const isoLocal = `${when.slice(0, 10)}T${timeStr}`;
                    return (
                      <button
                        key={s.slotStart}
                        type="button"
                        onClick={() => setWhen(isoLocal)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border ${when === isoLocal ? "bg-primary text-on-primary border-primary" : "border-outline-variant/40 hover:bg-surface-container-low"}`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <input className={field} placeholder={ar ? "ملاحظة للمواطن (اختياري)" : "Note for citizen (optional)"} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" loading={busy} icon={<X className="h-4 w-4" />} onClick={reject}>
                {ar ? "رفض" : "Reject"}
              </Button>
              <Button loading={busy} disabled={!when} icon={<Check className="h-4 w-4" />} onClick={confirm}>
                {isLab ? (ar ? "تأكيد وإصدار باركود" : "Confirm & Issue Barcode") : (ar ? "تأكيد حجز الموعد" : "Confirm Slot")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
