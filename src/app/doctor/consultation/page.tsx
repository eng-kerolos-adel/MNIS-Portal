"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import {
  Stethoscope,
  Plus,
  Trash2,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  Save,
  BadgeCheck,
  TestTubes,
  History,
  Pill,
  ScanLine,
  ArrowUpRight,
  UserCheck,
  Sparkles,
  Activity,
  FileText,
  Printer,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId, rxCode } from "@/lib/data/service";
import type { LabSample, Medication, NationalIdentity, PatientDocument, Prescription, QueueTicket } from "@/types/domain";
import { medicationSeed } from "@/lib/data/medicationSeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OfficialPrintModal } from "@/components/ui/OfficialPrintModal";
import { formatDate, pick } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
const input = "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export default function ConsultationPage() {
  const { locale, t } = useLocale();
  const { user: me } = useAuth();
  const { push } = useToast();
  const handleError = useApiError();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get("patientId");
  const urlVisitId = searchParams.get("visitId");
  const ar = locale === "ar";

  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);
  const [visitId, setVisitId] = useState<string | null>(urlVisitId);
  const [patient, setPatient] = useState<NationalIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  // Patient unified history
  const [patientRxHistory, setPatientRxHistory] = useState<Prescription[]>([]);
  const [patientLabHistory, setPatientLabHistory] = useState<LabSample[]>([]);
  const [patientRadiology, setPatientRadiology] = useState<any[]>([]);
  const [patientAllowances, setPatientAllowances] = useState<any[]>([]);
  const [patientDocs, setPatientDocs] = useState<PatientDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [printRx, setPrintRx] = useState<Prescription | null>(null);
  const [vitals, setVitals] = useState({ bp: "120/80", hr: "76", temp: "37.0", spo2: "98", glucose: "105" });

  const [meds, setMeds] = useState<(Medication & { isChronic?: boolean })[]>([]);
  const [dxEn, setDxEn] = useState("");
  const [dxAr, setDxAr] = useState("");
  const [icd, setIcd] = useState("");
  const [isChronicRx, setIsChronicRx] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedCode, setSignedCode] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [redeemingShare, setRedeemingShare] = useState(false);

  const [refTarget, setRefTarget] = useState("HOSPITAL");
  const [refUrgency, setRefUrgency] = useState("ROUTINE");
  const [refReason, setRefReason] = useState("");
  const [labPanel, setLabPanel] = useState("Complete Blood Count (CBC)");
  const [labsList, setLabsList] = useState<{ id: string; nameEn: string; nameAr: string }[]>([]);
  const [hospitalsList, setHospitalsList] = useState<{ id: string; nameEn: string; nameAr: string }[]>([]);
  const [targetLabId, setTargetLabId] = useState("");
  const [targetHospitalId, setTargetHospitalId] = useState("");

  const [medModalOpen, setMedModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    nameEn: "Amoxicillin",
    nameAr: "أموكسيسيلين",
    dose: "500mg",
    formEn: "Capsule",
    freqEn: "Every 8 hours",
    days: 7,
    qty: 2,
    isChronic: false,
  });

  const loadPatientHistory = useCallback(async (pid: string) => {
    try {
      const [rxList, labList, rads, allow, docs] = await Promise.all([
        api.getPrescriptions(pid),
        api.getLabSamples(pid),
        api.getRadiologyUploads(pid).catch(() => []),
        api.getChronicAllowances(pid).catch(() => []),
        api.getPatientDocuments(pid).catch(() => []),
      ]);
      setPatientRxHistory(rxList);
      setPatientLabHistory(labList);
      setPatientRadiology(rads);
      setPatientAllowances(allow);
      setPatientDocs(docs);
    } catch {
      // ignore non-critical history errors
    }
  }, []);

  async function openDocumentPreview(doc: PatientDocument) {
    try {
      const full = await api.getPatientDocumentFile(doc.id);
      setPreviewDoc(full);
    } catch (e) {
      handleError(e);
    }
  }

  async function approveDocument(docId: string) {
    try {
      await api.reviewPatientDocument(docId);
      push("success", ar ? "تم اعتماد الوثيقة وإشعار المواطن على تطبيقه فوراً" : "Document reviewed & citizen notified");
      if (patient) await loadPatientHistory(patientId(patient));
      setPreviewDoc(null);
    } catch (e) {
      handleError(e);
    }
  }

  const selectCitizenById = useCallback(
    async (pid: string) => {
      try {
        const p = await api.getPatient(pid);
        setPatient(p);
        setMeds([]);
        setSignedCode(null);
        await loadPatientHistory(pid);
      } catch (e) {
        handleError(e);
      }
    },
    [handleError, loadPatientHistory]
  );

  const load = useCallback(async () => {
    try {
      const [q, labs, hospitals] = await Promise.all([
        api.getQueue(),
        api.getLabs().catch(() => []),
        api.getHospitals().catch(() => []),
      ]);
      setQueueTickets(q);
      setLabsList(labs);
      setHospitalsList(hospitals);
      if (labs.length > 0) setTargetLabId((cur) => cur || labs[0]!.id);
      if (hospitals.length > 0) setTargetHospitalId((cur) => cur || hospitals[0]!.id);

      const inConsult = q.filter((x) => x.status === "in-consultation");
      if (urlPatientId) {
        await selectCitizenById(urlPatientId);
      } else if (urlVisitId) {
        const matched = q.find((x) => x.id === urlVisitId);
        if (matched) {
          setVisitId(matched.id);
          await selectCitizenById(patientId(matched.patient));
        }
      } else if (inConsult.length > 0 && inConsult[0]) {
        setVisitId(inConsult[0].id);
        await selectCitizenById(patientId(inConsult[0].patient));
      } else {
        setVisitId(null);
        setPatient(null);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError, selectCitizenById, urlPatientId, urlVisitId]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncQueue = useCallback(async () => {
    if (me && me.role !== "DOCTOR" && me.role !== "ADMIN") return;
    try {
      const q = await api.getQueue();
      setQueueTickets(q);
      const activeInConsult = q.find((x) => x.status === "in-consultation");
      const unsavedWork = meds.length > 0 || dxEn.trim().length > 0 || dxAr.trim().length > 0;
      if (activeInConsult && activeInConsult.id !== visitId && (!patient || !unsavedWork)) {
        setVisitId(activeInConsult.id);
        await selectCitizenById(patientId(activeInConsult.patient));
      }
    } catch {
      // ignore background poll failures
    }
  }, [me, visitId, patient, meds.length, dxEn, dxAr, selectCitizenById]);
  useAutoRefresh(syncQueue, 8_000);

  // Real-time Allergy & Drug-Drug Interaction (DDI) safety engine
  const safetyWarnings: string[] = [];
  if (patient && meds.length > 0) {
    const allergyTerms = patient.allergies.flatMap((a) => [a.en.toLowerCase(), a.ar.toLowerCase()]);
    for (const m of meds) {
      const medLower = `${m.name.en} ${m.name.ar}`.toLowerCase();
      const isPenicillinClass =
        medLower.includes("amox") ||
        medLower.includes("penicillin") ||
        medLower.includes("augmentin") ||
        medLower.includes("بنسلين") ||
        medLower.includes("أموكس");
      const hasPenicillinAllergy = allergyTerms.some(
        (al) => al.includes("penicillin") || al.includes("بنسلين") || al.includes("amox")
      );
      if (
        (isPenicillinClass && hasPenicillinAllergy) ||
        allergyTerms.some((al) => al.length > 2 && medLower.includes(al))
      ) {
        safetyWarnings.push(
          ar
            ? `تحذير حساسية قاتلة: المريض يعاني من حساسية مسجلة تتعارض مع دواء (${m.name.ar || m.name.en})!`
            : `CRITICAL ALLERGY ALERT: Patient has a documented allergy conflicting with (${m.name.en})!`
        );
      }
    }
    const names = meds.map((m) => m.name.en.toLowerCase());
    if (
      names.some((n) => n.includes("warfarin")) &&
      names.some((n) => n.includes("aspirin") || n.includes("ibuprofen"))
    ) {
      safetyWarnings.push(
        ar
          ? "تداخل دوائي خطر (DDI): الجمع بين Warfarin ومضادات الالتهاب/الأسبرين يضاعف خطر النزيف الحاد."
          : "SEVERE DDI WARNING: Co-prescribing Warfarin with Aspirin/NSAIDs significantly increases major bleeding risk."
      );
    }
  }

  function addMedication() {
    setMeds((m) => [
      ...m,
      {
        id: `local-${Date.now()}`,
        name: { en: newMed.nameEn, ar: newMed.nameAr || newMed.nameEn },
        dose: newMed.dose,
        form: { en: newMed.formEn, ar: newMed.formEn },
        frequency: { en: newMed.freqEn, ar: newMed.freqEn },
        durationDays: newMed.days,
        quantity: newMed.qty,
        substitutionAllowed: true,
        stockStatus: "in-stock",
        unitPrice: 0,
        isChronic: newMed.isChronic,
      },
    ]);
    setMedModalOpen(false);
  }

  async function orderLabTest() {
    if (!patient) return;
    const pid = patientId(patient);
    const chosenLab = labsList.find((l) => l.id === targetLabId);
    setBusy(true);
    try {
      await api.orderLabSample({
        patientId: pid,
        panelEn: labPanel,
        panelAr: labPanel,
        sampleTypeEn: "Venous Blood",
        sampleTypeAr: "عينة دم وريدي",
        priority: "URGENT",
        targetLabUserId: targetLabId || undefined,
      });
      push(
        "success",
        ar
          ? `تم إرسال طلب التحليل إلى (${chosenLab?.nameAr || "المعمل المركزي"}) فوراً`
          : `Lab sample order sent to ${chosenLab?.nameEn || "Central Lab"}`
      );
      await loadPatientHistory(pid);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function createReferral() {
    if (!patient) return;
    const chosenHospital = hospitalsList.find((h) => h.id === targetHospitalId);
    const chosenLab = labsList.find((l) => l.id === targetLabId);
    setBusy(true);
    try {
      await api.createReferral({
        patientId: patientId(patient),
        targetType: refTarget,
        urgency: refUrgency,
        departmentEn: refTarget === "HOSPITAL" ? chosenHospital?.nameEn : refTarget === "LAB" ? chosenLab?.nameEn : undefined,
        departmentAr: refTarget === "HOSPITAL" ? chosenHospital?.nameAr : refTarget === "LAB" ? chosenLab?.nameAr : undefined,
        clinicalNoteEn: refReason,
        clinicalNoteAr: refReason,
      });
      push(
        "success",
        ar ? "تم الإرسال" : "Sent",
        ar ? "تم إنشاء الإحالة الطبية وتوجيهها تلقائياً للمنشأة المحددة" : "Referral created and routed to selected facility"
      );
      setRefReason("");
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function signAndSend() {
    if (!patient) return;
    const pid = patientId(patient);
    setBusy(true);
    try {
      const rx = await api.createAndSignPrescription({
        patientId: pid,
        diagnosisEn: dxEn.trim() || dxAr.trim(),
        diagnosisAr: dxAr.trim() || dxEn.trim(),
        icd10: icd.trim() || undefined,
        isChronic: isChronicRx,
        items: meds.map((m) => ({
          nameEn: m.name.en,
          nameAr: m.name.ar,
          form: m.form.en,
          dose: m.dose,
          frequencyEn: m.frequency.en,
          frequencyAr: m.frequency.ar,
          durationDays: m.durationDays,
          quantity: m.quantity,
          substitutionAllowed: m.substitutionAllowed,
          isChronic: m.isChronic || isChronicRx,
          monthlyAllowance: m.quantity,
        })),
      });
      setSignedCode(rx.id.slice(0, 8).toUpperCase());
      if (visitId) {
        const vitalsSummary = `BP ${vitals.bp}, HR ${vitals.hr}, Temp ${vitals.temp}C, SpO2 ${vitals.spo2}%, Glu ${vitals.glucose}`;
        await api.setVisitStatus(visitId, "completed", vitalsSummary).catch(() => undefined);
      }
      push(
        "success",
        ar
          ? "تم توقيع الروشتة وإرسالها للصيدلية وتحديث حصص الأدوية المزمنة وتطبيق المواطن فوراً"
          : "Prescription signed, sent to pharmacy, and chronic quotas updated"
      );
      await loadPatientHistory(pid);
      const latestQ = await api.getQueue().catch(() => queueTickets);
      setQueueTickets(latestQ);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function completeConsultationVisit() {
    if (!visitId) return;
    setBusy(true);
    try {
      const vitalsSummary = `BP ${vitals.bp}, HR ${vitals.hr}, Temp ${vitals.temp}C, SpO2 ${vitals.spo2}%, Glu ${vitals.glucose}`;
      await api.setVisitStatus(visitId, "completed", vitalsSummary);
      push(
        "success",
        ar ? "تم حفظ العلامات الحيوية وإنهاء جلسة الكشف وإغلاق التذكرة" : "Vitals saved & consultation session completed"
      );
      setVisitId(null);
      setPatient(null);
      setMeds([]);
      setSignedCode(null);
      const latestQ = await api.getQueue().catch(() => []);
      setQueueTickets(latestQ);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeemShareCode() {
    const clean = shareCode.trim().toUpperCase();
    if (clean.length !== 10) return;
    setRedeemingShare(true);
    try {
      const res = await api.redeemShare(clean);
      setPatient(res.patient);
      setShareCode("");
      await loadPatientHistory(patientId(res.patient));
      push(
        "success",
        ar
          ? `تم فك كود المشاركة (${clean}) واستدعاء سجل المواطن الكامل بنجاح`
          : `Share code (${clean}) redeemed and citizen medical record loaded`
      );
    } catch (e) {
      handleError(e);
    } finally {
      setRedeemingShare(false);
    }
  }

  if (me && me.role !== "DOCTOR" && me.role !== "ADMIN") {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-8 border-error/30 bg-error-container/15">
        <AlertTriangle className="h-10 w-10 text-error mx-auto mb-3" />
        <h2 className="text-lg font-bold text-primary">
          {ar ? "غرفة الكشف والملف الطبي مخصصة للطبيب المعالج فقط" : "Consultation & Medical Records — Physician Only"}
        </h2>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          {ar
            ? "صلاحية الموظف المساعد للطبيب تقتصر على تأكيد الحجوزات وتنظيم طابور دخول الحالات دون الدخول إلى السجلات الإكلينيكية أو تحرير الروشتات."
            : "Clinic Assistants manage appointment confirmation and queue flow only and cannot access clinical consultations or prescribe medications."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => router.replace("/doctor/appointments")}>
            {ar ? "العودة لحجوزات العيادة" : "Back to Clinic Appointments"}
          </Button>
          <Button variant="outline" onClick={() => router.replace("/doctor/queue")}>
            {ar ? "طابور العيادة" : "Clinic Queue"}
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) return <p className="p-10 text-center text-sm text-on-surface-variant">{t("common.loading")}</p>;

  const canSign = !!patient && meds.length > 0 && (dxEn.trim().length >= 2 || dxAr.trim().length >= 2) && !signedCode;

  return (
    <div className="flex flex-col gap-5">
      {/* Scoped Clinic Queue Selector & Citizen Share Code Access */}
      <Card className="p-4 border-primary/20 bg-surface-container-lowest">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-primary">
              <UserCheck className="inline h-3.5 w-3.5 me-1" />
              {ar ? "مرضى طابور عيادتك الحاليين (بعد تسجيل حضورهم لدى المساعد):" : "Current Clinic Queue Patients (Checked-In):"}
            </label>
            <select
              value={visitId ?? ""}
              onChange={(e) => {
                const vid = e.target.value;
                setVisitId(vid);
                const tk = queueTickets.find((x) => x.id === vid);
                if (tk) void selectCitizenById(patientId(tk.patient));
              }}
              className={input}
            >
              <option value="">
                {ar ? "— اختر مريضاً من طابور عيادتك —" : "— Select from your clinic queue —"}
              </option>
              {queueTickets
                .filter((x) => x.status === "in-consultation" || x.status === "waiting")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.ticketNo}] {pick(v.patient.fullName, locale)} — MTI: {v.patient.mti}{" "}
                    {v.patient.nationalId ? `(${v.patient.nationalId})` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-tertiary">
              <ShieldCheck className="inline h-3.5 w-3.5 me-1" />
              {ar ? "أو استدعاء ملف مواطن بكود المشاركة المؤقت (من تطبيق الموبايل):" : "Or Redeem 10-Char Citizen App Share Code:"}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase().slice(0, 10))}
                dir="ltr"
                maxLength={10}
                placeholder="A1B2C3D4E5"
                className="h-10 flex-1 min-w-[160px] rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 font-mono text-xs font-bold uppercase tracking-widest outline-none focus:border-primary"
              />
              <Button
                size="sm"
                variant="outline"
                loading={redeemingShare}
                disabled={shareCode.trim().length !== 10}
                onClick={() => void handleRedeemShareCode()}
              >
                {ar ? "فك الكود واستدعاء السجل" : "Redeem & Load Record"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {!patient && (
        <Card className="p-8 text-center border-primary/20 bg-surface-container-lowest space-y-3">
          <Stethoscope className="h-10 w-10 text-primary mx-auto opacity-80" />
          <h2 className="text-base font-bold text-primary">
            {ar
              ? "غرفة الكشف جاهزة — بانتظار إدخال المريض من الموظف المساعد"
              : "Consultation Room Ready — Waiting for Clinic Assistant to Admit Patient"}
          </h2>
          <p className="text-xs text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            {ar
              ? `عدد الحالات المنتظرة في طابور عيادتك حالياً: (${queueTickets.filter((x) => x.status === "waiting").length}). عند قيام الموظف المساعد بإدخال الحالة، سيظهر ملف المواطن تلقائياً هنا، أو يمكنك اختيار المريض أعلاه.`
              : `Currently waiting in your clinic queue: (${queueTickets.filter((x) => x.status === "waiting").length}). The patient's medical record opens automatically once admitted by your clinic assistant, or select manually above.`}
          </p>
        </Card>
      )}

      {patient && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image src={patient.photoUrl} alt="" fill sizes="64px" className="rounded-xl object-cover" unoptimized />
                <span className="absolute -bottom-1 -end-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                  {patient.bloodType}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-primary">{pick(patient.fullName, locale)}</h1>
                  <Badge tone="secondary">
                    {patient.sex === "male" ? t("common.male") : t("common.female")}، {patient.age} {t("common.years")}
                  </Badge>
                  {patient.insuranceActive && (
                    <Badge tone="success" icon={<BadgeCheck className="h-3 w-3" />}>
                      {ar ? "تأمين صحي سارٍ" : "Active insurance"}
                    </Badge>
                  )}
                  {visitId && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      loading={busy}
                      onClick={() => void completeConsultationVisit()}
                    >
                      {ar ? "حفظ العلامات الحيوية وإنهاء الكشف" : "Save Vitals & Complete Visit"}
                    </Button>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-on-surface-variant font-mono">
                  <span>
                    MTI: <strong className="text-primary tracking-wider">{patient.mti}</strong>
                  </span>
                  {patient.nationalId && (
                    <span>
                      {ar ? "الرقم القومي" : "National ID"}:{" "}
                      <strong className="text-on-surface tracking-wider">{patient.nationalId}</strong>
                    </span>
                  )}
                </div>
                {patient.chronicConditions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {patient.chronicConditions.map((c, i) => (
                      <Badge key={i} tone="warning">
                        {pick(c, locale)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {patient.allergies.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs font-bold text-error">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {ar ? "حساسية مسجلة" : "Allergies"}
                </span>
                <div className="flex flex-wrap justify-end gap-1">
                  {patient.allergies.map((a, i) => (
                    <Badge key={i} tone="error">
                      {pick(a, locale)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Clinical AI Copilot & Live Vitals Tracker */}
      {patient && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-primary/25 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs text-primary">
                <Sparkles className="h-4 w-4 text-secondary" />
                {ar ? "المساعد الإكلينيكي الذكي (Clinical AI Copilot)" : "Clinical AI Copilot"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="space-y-1">
                {patientLabHistory.some((s) => s.results?.some((r) => r.flag !== "normal")) ? (
                  <p className="rounded-lg bg-error-container/70 px-2.5 py-1.5 font-semibold text-on-error-container">
                    {ar
                      ? "رصد تحاليل معملية غير طبيعية — يُوصى بمراجعة القيم الحرجة أعلاه قبل تحرير الدواء."
                      : "Abnormal lab findings detected — review elevated/critical analytes prior to prescribing."}
                  </p>
                ) : (
                  <p className="rounded-lg bg-surface-container-lowest px-2.5 py-1.5 text-on-surface-variant">
                    {ar
                      ? "ملخص إكلينيكي فوري: جميع التحاليل المسجلة ضمن النطاق الطبيعي أو بانتظار الاعتماد."
                      : "Clinical summary: All recorded lab analytes are within normal range or pending verification."}
                  </p>
                )}
                {patient.allergies.length > 0 && (
                  <p className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 font-semibold text-amber-800 dark:text-amber-300">
                    {ar
                      ? `تنبيه حساسية نشط: تجنب وصف أي بدائل تحتوي على (${patient.allergies.map((a) => pick(a, locale)).join("، ")}).`
                      : `Active Allergy Guard: Avoid prescribing agents cross-reacting with (${patient.allergies.map((a) => pick(a, locale)).join(", ")}).`}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold text-on-surface-variant">
                  {ar ? "إدراج سريع للتشخيص المرمز (ICD-10):" : "1-Click ICD-10 Diagnosis Presets:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: "I10", en: "Essential hypertension", ar: "ارتفاع ضغط الدم الأساسي", chronic: true },
                    { code: "E11.9", en: "Type 2 diabetes mellitus", ar: "السكري من النوع الثاني", chronic: true },
                    { code: "I25.1", en: "Coronary artery disease", ar: "قصور الشريان التاجي", chronic: true },
                    { code: "J06.9", en: "Acute upper respiratory infection", ar: "التهاب حاد بالجهاز التنفسي العلوي", chronic: false },
                    { code: "D50.9", en: "Iron deficiency anemia", ar: "أنيميا نقص الحديد", chronic: false },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setIcd(item.code);
                        setDxEn(item.en);
                        setDxAr(item.ar);
                        setIsChronicRx(item.chronic);
                      }}
                      className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-[11px] font-semibold hover:border-primary hover:bg-primary/10 transition"
                    >
                      <span className="font-mono text-primary">{item.code}</span> — {ar ? item.ar : item.en}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xs w-full">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-tertiary" />
                  {ar ? "العلامات الحيوية أثناء الكشف (Clinical Vitals)" : "Consultation Vitals Tracker"}
                </span>
                <Badge tone={Number(vitals.spo2) < 94 || Number(vitals.temp) >= 38 ? "error" : "success"}>
                  {Number(vitals.spo2) < 94 || Number(vitals.temp) >= 38
                    ? ar ? "مؤشر غير مستقر" : "Vital Alert"
                    : ar ? "مؤشرات مستقرة" : "Vitals Stable"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{ar ? "الضغط BP" : "BP (mmHg)"}</label>
                <input className={input} dir="ltr" value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{ar ? "النبض HR" : "HR (bpm)"}</label>
                <input className={input} dir="ltr" value={vitals.hr} onChange={(e) => setVitals({ ...vitals, hr: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{ar ? "الحرارة Temp" : "Temp (°C)"}</label>
                <input className={input} dir="ltr" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{ar ? "الأكسجين SpO2" : "SpO2 (%)"}</label>
                <input className={input} dir="ltr" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{ar ? "السكر Glucose" : "Glucose"}</label>
                <input className={input} dir="ltr" value={vitals.glucose} onChange={(e) => setVitals({ ...vitals, glucose: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Unified Patient Record across Sectors (Pharmacy + Lab + Radiology) */}
      {patient && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs">
                <Pill className="h-4 w-4 text-secondary" />
                {ar ? `الروشتات والحصص المزمنة (${patientRxHistory.length})` : `Prescriptions (${patientRxHistory.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {patientAllowances.length > 0 && (
                <div className="rounded-lg bg-secondary-container/40 p-2 text-xs">
                  <p className="font-bold text-secondary mb-1">
                    {ar ? "حصص الأدوية المزمنة النشطة بالصيدلية:" : "Active Chronic Quotas:"}
                  </p>
                  {patientAllowances.map((al: any) => (
                    <div key={al.id} className="flex justify-between text-[11px]">
                      <span>{ar ? al.drugNameAr : al.drugNameEn}</span>
                      <span className="font-mono font-bold">
                        {al.dispensedThisMonth}/{al.monthlyLimit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {patientRxHistory.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3 text-center">
                  {ar ? "لا توجد روشتات سابقة" : "No prior prescriptions"}
                </p>
              ) : (
                patientRxHistory.slice(0, 4).map((rx) => (
                  <div key={rx.id} className="rounded-lg border border-outline-variant/40 p-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-on-surface truncate">{pick(rx.diagnosis, locale)}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge tone={rx.status === "dispensed" ? "success" : "warning"}>{rxCode(rx)}</Badge>
                        <button
                          type="button"
                          onClick={() => setPrintRx(rx)}
                          title={ar ? "طباعة الروشتة الرسمية بـ QR" : "Print Official QR Rx"}
                          className="rounded p-1 text-primary hover:bg-primary/10"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {rx.medications.map((m) => pick(m.name, locale)).join("، ")} • {formatDate(rx.createdAt, locale)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs">
                <TestTubes className="h-4 w-4 text-tertiary" />
                {ar ? `نتائج المعمل المركزي (${patientLabHistory.length})` : `Central Lab Results (${patientLabHistory.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {patientLabHistory.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3 text-center">
                  {ar ? "لا توجد تحاليل مسجلة" : "No lab samples"}
                </p>
              ) : (
                patientLabHistory.slice(0, 4).map((s) => (
                  <div key={s.id} className="rounded-lg border border-outline-variant/40 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{pick(s.testPanel, locale)}</span>
                      <Badge tone={s.status === "verified" ? "success" : "warning"}>{s.barcode}</Badge>
                    </div>
                    {s.results && s.results.length > 0 ? (
                      <div className="mt-1 space-y-0.5 border-t border-outline-variant/30 pt-1">
                        {s.results.map((r) => (
                          <div key={r.id} className="flex justify-between text-[11px]">
                            <span>{pick(r.analyte, locale)}</span>
                            <span className={r.flag !== "normal" ? "font-bold text-error" : "font-mono"}>
                              {r.value} {r.unit} ({r.flag.toUpperCase()})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {ar ? "الحالة:" : "Status:"} {s.status}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs">
                <ScanLine className="h-4 w-4 text-primary" />
                {ar ? `فحوصات الأشعة PACS (${patientRadiology.length})` : `PACS Radiology (${patientRadiology.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {patientRadiology.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3 text-center">
                  {ar ? "لا توجد صور أشعة مرفوعة" : "No PACS studies"}
                </p>
              ) : (
                patientRadiology.map((rad: any) => (
                  <div key={rad.id} className="rounded-lg border border-outline-variant/40 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        [{rad.modality}] {ar ? rad.bodyPartAr : rad.bodyPartEn}
                      </span>
                      <History className="h-3.5 w-3.5 text-on-surface-variant" />
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {ar ? rad.findingsAr : rad.findingsEn}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs">
                <FileText className="h-4 w-4 text-secondary" />
                {ar ? `وثائق المواطن المرفوعة (${patientDocs.length})` : `Citizen Documents (${patientDocs.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {patientDocs.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3 text-center">
                  {ar ? "لا توجد وثائق مرفوعة من تطبيق المواطن" : "No uploaded citizen documents"}
                </p>
              ) : (
                patientDocs.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-outline-variant/40 p-2 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-on-surface truncate">{doc.label}</span>
                      <Badge tone={doc.status === "REVIEWED" ? "success" : "warning"}>
                        {doc.status === "REVIEWED" ? (ar ? "معتمد" : "Reviewed") : (ar ? "قيد المراجعة" : "Pending")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void openDocumentPreview(doc)}
                        className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-[11px] font-semibold hover:bg-surface-container-high"
                      >
                        <Eye className="h-3 w-3" />
                        {ar ? "معاينة" : "Preview"}
                      </button>
                      {doc.status === "PENDING_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => void approveDocument(doc.id)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {ar ? "اعتماد طبي" : "Approve"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {safetyWarnings.length > 0 && (
        <div className="rounded-xl border-2 border-red-500 bg-red-500/10 p-4 text-red-700 dark:text-red-300 space-y-1">
          {safetyWarnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 animate-bounce" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            {ar ? "التشخيص الطبي" : "Clinical Diagnosis"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            className={input}
            placeholder="Diagnosis (English)"
            value={dxEn}
            onChange={(e) => setDxEn(e.target.value)}
            maxLength={200}
            dir="ltr"
          />
          <input
            className={input}
            placeholder="التشخيص (عربي)"
            value={dxAr}
            onChange={(e) => setDxAr(e.target.value)}
            maxLength={200}
          />
          <input
            className={input}
            placeholder="ICD-10 (e.g. I10 / E11)"
            value={icd}
            onChange={(e) => setIcd(e.target.value)}
            maxLength={40}
            dir="ltr"
          />
          <label className="sm:col-span-3 flex items-center gap-2 text-xs font-semibold pt-1">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={isChronicRx}
              onChange={(e) => setIsChronicRx(e.target.checked)}
            />
            {ar
              ? "مرض مزمن — تفعيل الحصة الشهرية المتكررة تلقائياً في الصيدلية وتطبيق المواطن"
              : "Chronic Condition — Auto-provision monthly pharmacy refill allowance"}
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? "الروشتة الإلكترونية وفحص التداخلات الدوائية" : "E-Prescription & DDI Safety Engine"}</CardTitle>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setMedModalOpen(true)}
            disabled={!!signedCode}
          >
            {ar ? "إضافة دواء" : "Add medication"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {meds.map((med) => (
            <div key={med.id} className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {pick(med.name, locale)} — {med.dose}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {pick(med.form, locale)} • {pick(med.frequency, locale)} • {med.durationDays} {ar ? "يوم" : "days"} • ×{med.quantity}
                  </p>
                </div>
              </div>
              {!signedCode && (
                <button
                  onClick={() => setMeds((m) => m.filter((x) => x.id !== med.id))}
                  className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  aria-label="remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {meds.length === 0 && (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              {ar ? "لم تتم إضافة أدوية بعد" : "No medications added yet"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-6 w-6 text-tertiary" />
          <h2 className="text-base font-bold text-primary">{ar ? "الاعتماد والتوقيع الرقمي" : "Digital sign-off"}</h2>
        </div>
        <p className="flex items-center gap-1 text-xs font-semibold text-tertiary">
          <ShieldCheck className="h-4 w-4" />
          {ar
            ? "ختم سلامة رقمي مشفر يربط الروشتة بالصيدليات وحساب التأمين الصحي وتطبيق المواطن لحظياً"
            : "Cryptographic integrity seal linking prescription to pharmacies, UHIA claims, and Citizen App"}
        </p>
        {signedCode && (
          <div className="flex items-center justify-between rounded-lg bg-success-container p-3 text-sm font-semibold text-on-success-container">
            <span>
              {ar ? "تم الاعتماد وإرسال الروشتة للصيدلية. رقم الروشتة:" : "Signed. Prescription no.:"} {signedCode}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSignedCode(null);
                setMeds([]);
                setDxEn("");
                setDxAr("");
              }}
            >
              {ar ? "كتابة روشتة أخرى" : "New Rx"}
            </Button>
          </div>
        )}
        <Button size="lg" loading={busy} disabled={!canSign} icon={<Save className="h-5 w-5" />} onClick={signAndSend}>
          {signedCode ? t("common.saved") : ar ? "توقيع وإرسال للصيدلية" : "Sign & send to pharmacy"}
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubes className="h-4 w-4" />
              {ar ? "طلب تحليل معملي فوري" : "Direct Lab Order"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <select className={input} value={labPanel} onChange={(e) => setLabPanel(e.target.value)}>
              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) — صورة دم كاملة</option>
              <option value="HbA1c & Fasting Glucose">HbA1c & Fasting Glucose — سكر تراكمي وصائم</option>
              <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel — وظائف كبد وكلى</option>
              <option value="Lipid Profile">Lipid Profile — دهون الدم</option>
              <option value="Cardiac Troponin-I (STAT)">Cardiac Troponin-I (STAT) — إنزيمات قلب طارئة</option>
            </select>
            {labsList.length > 0 && (
              <select className={input} value={targetLabId} onChange={(e) => setTargetLabId(e.target.value)}>
                {labsList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {ar ? `المعمل: ${l.nameAr}` : `Lab: ${l.nameEn}`}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" onClick={orderLabTest} disabled={busy || !patient}>
              {ar ? "إرسال العينة لقائمة انتظار المعمل المحدد" : "Send Order to Selected Lab Queue"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {ar ? "إحالة المريض الشبكية" : "Network Patient Referral"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className={input} value={refTarget} onChange={(e) => setRefTarget(e.target.value)}>
                <option value="HOSPITAL">{ar ? "مستشفى / طوارئ" : "Hospital / ER"}</option>
                <option value="LAB">{ar ? "معمل مركزي" : "Central Lab"}</option>
                <option value="PHARMACY">{ar ? "صيدلية" : "Pharmacy"}</option>
              </select>
              <select className={input} value={refUrgency} onChange={(e) => setRefUrgency(e.target.value)}>
                <option value="ROUTINE">{ar ? "اعتيادي (Routine)" : "Routine"}</option>
                <option value="CRITICAL">{ar ? "طوارئ حرجة (Critical)" : "Critical"}</option>
              </select>
            </div>
            {refTarget === "HOSPITAL" && hospitalsList.length > 0 && (
              <select className={input} value={targetHospitalId} onChange={(e) => setTargetHospitalId(e.target.value)}>
                {hospitalsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {ar ? `المستشفى: ${h.nameAr}` : `Hospital: ${h.nameEn}`}
                  </option>
                ))}
              </select>
            )}
            {refTarget === "LAB" && labsList.length > 0 && (
              <select className={input} value={targetLabId} onChange={(e) => setTargetLabId(e.target.value)}>
                {labsList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {ar ? `المعمل: ${l.nameAr}` : `Lab: ${l.nameEn}`}
                  </option>
                ))}
              </select>
            )}
            <input
              className={input}
              placeholder={ar ? "سبب الإحالة والملاحظات الإكلينيكية" : "Reason for referral"}
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
            />
            <Button onClick={createReferral} disabled={!refReason || busy || !patient}>
              {ar ? "إرسال إحالة" : "Send Referral"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {medModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{ar ? "إضافة دواء للروشتة" : "Add Medication"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <select
                className={input}
                onChange={(e) => {
                  const found = medicationSeed.find((s) => s.name.en === e.target.value);
                  if (found) {
                    setNewMed({
                      nameEn: found.name.en,
                      nameAr: found.name.ar,
                      dose: found.dose,
                      formEn: found.form.en,
                      freqEn: found.frequency.en,
                      days: found.durationDays,
                      qty: found.quantity,
                      isChronic: found.durationDays >= 30,
                    });
                  }
                }}
              >
                <option value="">
                  {ar
                    ? "— اختر من الدليل الدوائي المصري أو اكتب أدناه —"
                    : "— Pick from Egyptian Drug Formulary or type below —"}
                </option>
                {medicationSeed.map((s, idx) => (
                  <option key={idx} value={s.name.en}>
                    {s.name.en} ({s.name.ar}) — {s.dose}
                  </option>
                ))}
              </select>
              <input
                className={input}
                value={newMed.nameEn}
                placeholder={ar ? "اسم الدواء (EN)" : "Medication Name (EN)"}
                onChange={(e) => setNewMed({ ...newMed, nameEn: e.target.value })}
              />
              <input
                className={input}
                value={newMed.nameAr}
                placeholder={ar ? "اسم الدواء (AR)" : "Medication Name (AR)"}
                onChange={(e) => setNewMed({ ...newMed, nameAr: e.target.value })}
              />
              <input
                className={input}
                value={newMed.dose}
                placeholder={ar ? "الجرعة (مثال 500mg)" : "Dose (e.g. 500mg)"}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
              />
              <input
                className={input}
                value={newMed.formEn}
                placeholder={ar ? "الشكل الدوائي (Tablet/Capsule)" : "Form (e.g. Tablet)"}
                onChange={(e) => setNewMed({ ...newMed, formEn: e.target.value })}
              />
              <input
                className={input}
                value={newMed.freqEn}
                placeholder={ar ? "التكرار (كل 12 ساعة)" : "Frequency"}
                onChange={(e) => setNewMed({ ...newMed, freqEn: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className={input}
                  value={newMed.days}
                  placeholder={ar ? "أيام" : "Days"}
                  onChange={(e) => setNewMed({ ...newMed, days: +e.target.value })}
                />
                <input
                  type="number"
                  className={input}
                  value={newMed.qty}
                  placeholder={ar ? "الكمية" : "Qty"}
                  onChange={(e) => setNewMed({ ...newMed, qty: +e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setMedModalOpen(false)}>
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={addMedication} disabled={!newMed.nameEn}>
                  {ar ? "إضافة" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.label ?? ""}
      >
        {previewDoc && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>{previewDoc.mimeType}</span>
              <Badge tone={previewDoc.status === "REVIEWED" ? "success" : "warning"}>
                {previewDoc.status}
              </Badge>
            </div>
            {previewDoc.fileBase64 && previewDoc.mimeType.startsWith("image/") ? (
              <img
                src={`data:${previewDoc.mimeType};base64,${previewDoc.fileBase64}`}
                alt={previewDoc.label}
                className="max-h-96 w-full rounded-lg border border-outline-variant/40 object-contain bg-surface-container-low"
              />
            ) : previewDoc.fileBase64 && previewDoc.mimeType === "application/pdf" ? (
              <iframe
                src={`data:application/pdf;base64,${previewDoc.fileBase64}`}
                title={previewDoc.label}
                className="h-96 w-full rounded-lg border border-outline-variant/40"
              />
            ) : (
              <p className="py-6 text-center text-xs text-on-surface-variant">
                {ar ? "لا يمكن عرض هذا النوع من الملفات" : "Unsupported preview format"}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                {ar ? "إغلاق" : "Close"}
              </Button>
              {previewDoc.status === "PENDING_REVIEW" && (
                <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => void approveDocument(previewDoc.id)}>
                  {ar ? "اعتماد وإرفاق بالسجل الإكلينيكي" : "Approve & Attach to Clinical Record"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <OfficialPrintModal rx={printRx} onClose={() => setPrintRx(null)} />
    </div>
  );
}
