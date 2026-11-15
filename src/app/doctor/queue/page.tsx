"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Zap,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Siren,
  CheckCircle2,
  XCircle,
  Timer,
  ShieldCheck,
  Plus,
  Stethoscope,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { ApiError } from "@/lib/api/client";
import { api, patientId } from "@/lib/data/service";
import type { NationalIdentity, QueueTicket } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import { matchesPatientQuery, pick } from "@/lib/utils/format";

const STATUS_TONE: Record<QueueTicket["status"], "warning" | "secondary" | "success" | "error"> = {
  waiting: "warning",
  "in-consultation": "secondary",
  completed: "success",
  "no-show": "error",
};
const STATUS_LABEL: Record<QueueTicket["status"], { en: string; ar: string }> = {
  waiting: { en: "Waiting", ar: "بالانتظار" },
  "in-consultation": { en: "In consultation", ar: "بالكشف" },
  completed: { en: "Completed", ar: "تم الكشف" },
  "no-show": { en: "No-show", ar: "لم يحضر" },
};

export default function DoctorQueuePage() {
  const { locale, t, dir } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const router = useRouter();
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<QueueTicket | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [citizenSearch, setCitizenSearch] = useState("");
  const [citizenResults, setCitizenResults] = useState<NationalIdentity[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<NationalIdentity | null>(null);
  const [reasonAr, setReasonAr] = useState("كشف باطنة وقلب شامل ومتابعة دورية");
  const [reasonEn, setReasonEn] = useState("Comprehensive Internal Medicine & Cardiology Checkup");
  const [isEmergency, setIsEmergency] = useState(false);

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const ar = locale === "ar";

  const load = useCallback(async () => {
    try {
      setTickets(await api.getQueue());
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!addModalOpen) return;
    api
      .searchPatients(citizenSearch.trim())
      .then((res) => {
        setCitizenResults(res);
        if (!selectedCitizen && res[0]) setSelectedCitizen(res[0]);
      })
      .catch(() => {});
  }, [addModalOpen, citizenSearch, selectedCitizen]);

  const filtered = useMemo(() => {
    return tickets.filter((tk) =>
      matchesPatientQuery(tk.patient, query, tk.ticketNo, tk.reason.ar, tk.reason.en)
    );
  }, [tickets, query]);

  async function callNext() {
    setBusy(true);
    try {
      const called = await api.callNext();
      push(
        "success",
        ar
          ? `تمت مناداة ${pick(called.patient.fullName, locale)}`
          : `${pick(called.patient.fullName, locale)} has been called`,
        called.ticketNo
      );
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404)
        push("info", ar ? "لا يوجد مرضى بالانتظار" : "No patients waiting");
      else handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: QueueTicket["status"]) {
    try {
      await api.setVisitStatus(id, status);
      setSelected(null);
      push("success", t("common.saved"));
      await load();
    } catch (e) {
      handleError(e);
    }
  }

  async function startConsultationForTicket(ticket: QueueTicket) {
    setBusy(true);
    try {
      if (ticket.status === "waiting") {
        await api.setVisitStatus(ticket.id, "in-consultation");
      }
      const pid = patientId(ticket.patient);
      setSelected(null);
      router.push(`/doctor/consultation?patientId=${encodeURIComponent(pid)}&visitId=${encodeURIComponent(ticket.id)}`);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function createQueueTicket() {
    if (!selectedCitizen) return;
    setBusy(true);
    try {
      const pid = patientId(selectedCitizen);
      await api.createTicket({
        patientId: pid,
        reasonEn: reasonEn.trim() || reasonAr.trim(),
        reasonAr: reasonAr.trim() || reasonEn.trim(),
        isEmergency,
      });
      push("success", ar ? "تم إدراج المواطن في قائمة انتظار العيادة بنجاح" : "Citizen added to clinic queue");
      setAddModalOpen(false);
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  const waiting = tickets.filter((x) => x.status === "waiting");
  const done = tickets.filter((x) => x.status === "completed").length;
  const avgWait = waiting.length
    ? Math.round(waiting.reduce((s, x) => s + x.waitMinutes, 0) / waiting.length)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={HeartPulse}
        title={ar ? "قائمة انتظار العيادة" : "Clinic queue"}
        meta={
          <>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-tertiary" />
              {ar ? "الطوارئ أولاً ثم بترتيب الوصول" : "Emergencies first, then by arrival"}
            </span>
            <span className="flex items-center gap-1 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {ar ? "بحث فوري بالاسم أو الرقم القومي (14 رقم) أو الكود الوطني MTI" : "Instant search by Name, 14-digit National ID, or MTI"}
            </span>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setAddModalOpen(true)}
            >
              {ar ? "إدراج مواطن بالطابور" : "Add Patient to Queue"}
            </Button>
            <Button loading={busy} icon={<Zap className="h-4 w-4" />} onClick={callNext}>
              {ar ? "مناداة المريض التالي" : "Call next patient"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={User} label={ar ? "بالانتظار" : "Waiting"} value={waiting.length} tone="warning" />
        <StatCard icon={CheckCircle2} label={ar ? "تم الكشف" : "Seen"} value={done} tone="success" />
        <StatCard
          icon={Timer}
          label={ar ? "متوسط الانتظار" : "Avg. wait"}
          value={`${avgWait} ${ar ? "د" : "min"}`}
          tone="secondary"
        />
        <StatCard
          icon={Siren}
          label={ar ? "حالات طارئة" : "Emergency"}
          value={tickets.filter((x) => x.isEmergency && x.status === "waiting").length}
          tone="error"
        />
      </div>

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>{ar ? "الطابور الموحد للعيادة" : "Clinic Queue"}</CardTitle>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              ar
                ? "ابحث بالاسم، الرقم القومي (14 رقم)، كود MTI، أو رقم التذكرة..."
                : "Search by Name, National ID (14 digits), MTI, or Ticket #..."
            }
            className="w-full sm:w-96"
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loading && (
            <p className="py-6 text-center text-sm text-on-surface-variant">{t("common.loading")}</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              {ar ? "لا توجد تذاكر مطابقة للبحث" : "No matching tickets"}
            </p>
          )}
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelected(ticket)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-outline-variant/40 p-3 text-start transition-colors hover:bg-surface-container-low"
            >
              <div className="relative h-11 w-11 shrink-0">
                <Image
                  src={ticket.patient.photoUrl}
                  alt=""
                  fill
                  sizes="44px"
                  className="rounded-lg object-cover"
                  unoptimized
                />
                {ticket.isEmergency && (
                  <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-white">
                    <Siren className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold text-on-surface">
                    {pick(ticket.patient.fullName, locale)}
                  </span>
                  <span className="shrink-0 rounded bg-secondary-container px-1.5 py-0.5 text-xs font-bold text-on-secondary-container">
                    {ticket.ticketNo}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    MTI: {ticket.patient.mti}
                  </span>
                  {ticket.patient.nationalId && (
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      {ar ? "الرقم القومي:" : "NID:"} <strong className="text-on-surface">{ticket.patient.nationalId}</strong>
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                  {pick(ticket.reason, locale)}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Stethoscope className="h-3.5 w-3.5" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    void startConsultationForTicket(ticket);
                  }}
                >
                  {ar ? "بدء الكشف" : "Consult"}
                </Button>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={STATUS_TONE[ticket.status]}>
                    {pick(STATUS_LABEL[ticket.status], locale)}
                  </Badge>
                  <span className="text-[11px] text-on-surface-variant">
                    {ticket.waitMinutes} {ar ? "د" : "min"}
                  </span>
                </div>
              </div>
              <Chevron className="h-4 w-4 shrink-0 text-on-surface-variant" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ticket Detail & Action Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? pick(selected.patient.fullName, locale) : ""}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src={selected.patient.photoUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="rounded-xl object-cover"
                  unoptimized
                />
                <span className="absolute -bottom-1 -end-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                  {selected.patient.bloodType}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold font-mono text-primary">MTI: {selected.patient.mti}</p>
                {selected.patient.nationalId && (
                  <p className="text-xs font-mono text-on-surface">
                    {ar ? "الرقم القومي:" : "National ID:"} <strong>{selected.patient.nationalId}</strong>
                  </p>
                )}
                <p className="text-xs text-on-surface-variant">
                  {selected.patient.sex === "male" ? t("common.male") : t("common.female")}،{" "}
                  {selected.patient.age} {t("common.years")}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3 text-sm">
              <p className="font-semibold text-on-surface">{pick(selected.reason, locale)}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {ar ? "التذكرة" : "Ticket"}: {selected.ticketNo}
              </p>
            </div>
            {selected.patient.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.patient.allergies.map((a, i) => (
                  <Badge key={i} tone="error">
                    {pick(a, locale)}
                  </Badge>
                ))}
              </div>
            )}
            <Button
              size="lg"
              loading={busy}
              icon={<Stethoscope className="h-4 w-4" />}
              onClick={() => startConsultationForTicket(selected)}
            >
              {ar ? "بدء الكشف وفتح غرفة الكشف الطبي" : "Start Consultation & Open Clinical File"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setStatus(selected.id, "completed")}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                {ar ? "إنهاء الكشف" : "Complete visit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStatus(selected.id, "no-show")}
                icon={<XCircle className="h-4 w-4" />}
              >
                {ar ? "لم يحضر" : "No-show"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Citizen to Queue Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={ar ? "إدراج مواطن في طابور العيادة" : "Add Citizen to Clinic Queue"}
      >
        <div className="flex flex-col gap-3">
          <SearchInput
            value={citizenSearch}
            onChange={setCitizenSearch}
            placeholder={
              ar
                ? "ابحث عن المواطن بالاسم أو الرقم القومي أو كود MTI..."
                : "Search citizen by Name, National ID, or MTI..."
            }
          />
          <div className="max-h-44 overflow-y-auto rounded-lg border border-outline-variant/40 divide-y divide-outline-variant/20">
            {citizenResults.map((p) => {
              const pid = patientId(p);
              const isSel = selectedCitizen && patientId(selectedCitizen) === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setSelectedCitizen(p)}
                  className={`w-full flex items-center justify-between p-2.5 text-start text-xs transition-colors ${
                    isSel ? "bg-primary-container text-on-primary-container font-bold" : "hover:bg-surface-container-low"
                  }`}
                >
                  <div>
                    <p className="font-bold">{pick(p.fullName, locale)}</p>
                    <p className="font-mono text-[11px] opacity-80">
                      MTI: {p.mti} {p.nationalId ? `• NID: ${p.nationalId}` : ""}
                    </p>
                  </div>
                  <Badge tone="secondary">{p.bloodType}</Badge>
                </button>
              );
            })}
          </div>
          <input
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            value={reasonAr}
            onChange={(e) => setReasonAr(e.target.value)}
            placeholder={ar ? "سبب الزيارة (عربي)" : "Reason (Arabic)"}
          />
          <input
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            value={reasonEn}
            onChange={(e) => setReasonEn(e.target.value)}
            placeholder={ar ? "سبب الزيارة (إنجليزي)" : "Reason (English)"}
            dir="ltr"
          />
          <label className="flex items-center gap-2 text-xs font-bold text-error">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="h-4 w-4 accent-error"
            />
            {ar ? "حالة طوارئ حرجة (أولوية قصوى في مقدمة الطابور)" : "Critical Emergency (Priority Queue Jump)"}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button loading={busy} disabled={!selectedCitizen} onClick={createQueueTicket}>
              {ar ? "تأكيد وإصدار تذكرة الكشف" : "Confirm & Issue Queue Ticket"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
