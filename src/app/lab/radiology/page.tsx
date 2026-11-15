"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, patientId } from "@/lib/data/service";
import type { Bilingual, NationalIdentity } from "@/types/domain";
import { ScanEye, Search, Upload, Eye, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function RadiologyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get("patientId");

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<NationalIdentity | null>(null);
  const [studies, setStudies] = useState<any[]>([]);
  const [modality, setModality] = useState("X-Ray");
  const [bodyPartEn, setBodyPartEn] = useState("Chest PA");
  const [bodyPartAr, setBodyPartAr] = useState("أشعة صدر أمامية");
  const [findingsEn, setFindingsEn] = useState("Clear lung fields, normal cardiac silhouette.");
  const [findingsAr, setFindingsAr] = useState("الرئتان سليمتان وحجم القلب طبيعي.");
  const [fileData, setFileData] = useState<{ mimeType: string; base64: string; name: string } | null>(null);
  const [previewStudy, setPreviewStudy] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const searchPatients = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const list = await api.searchPatients(query);
      setPatients(list);
      if (urlPatientId) {
        const matched = list.find((p) => patientId(p) === urlPatientId);
        if (matched) {
          await selectPatient(matched);
          return;
        }
      }
      if (list.length > 0 && !selectedPatient) await selectPatient(list[0]!);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Search failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void searchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPatient = async (p: NationalIdentity) => {
    setSelectedPatient(p);
    setLoading(true);
    try {
      const list = await api.getRadiologyUploads(patientId(p));
      setStudies(list);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load studies" });
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      setFileData({ mimeType: file.type || "image/png", base64, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setUploading(true);
    setToast(null);
    try {
      const fallbackPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      await api.uploadRadiology({
        patientId: patientId(selectedPatient),
        modality,
        bodyPartEn,
        bodyPartAr,
        findingsEn,
        findingsAr,
        mimeType: fileData?.mimeType ?? "image/png",
        fileBase64: fileData?.base64 ?? fallbackPng,
      });
      setToast({
        type: "ok",
        msg: isAr ? "تم رفع تقرير وصورة الأشعة في السجل الطبي الموحد للمريض" : "Radiology study uploaded to patient's unified medical record",
      });
      setFileData(null);
      await selectPatient(selectedPatient);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const openStudy = async (id: string) => {
    try {
      const full = await api.getRadiologyOne(id);
      setPreviewStudy(full);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load image" });
    }
  };

  const removeStudy = async (id: string) => {
    try {
      await api.deleteRadiology(id);
      if (selectedPatient) await selectPatient(selectedPatient);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Delete failed" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={ScanEye}
        title={isAr ? "الأشعة التشخيصية والتقارير المصورة" : "Diagnostic Radiology & Medical Imaging"}
        meta={
          isAr
            ? "رفع فحوصات الأشعة المقطعية والرنين المغناطيسي والأشعة السينية وربطها مباشرة بالهوية الطبية للمواطن"
            : "Upload X-Ray, CT, MRI, and Ultrasound imaging reports directly into the citizen's national medical identity"
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            {isAr ? "اختيار المريض" : "Select Citizen"}
          </h3>
          <form onSubmit={searchPatients} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو كود MTI..." : "Search name or MTI..."}
              className="flex-1 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
              {isAr ? "بحث" : "Search"}
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {patients.map((p) => (
              <button
                key={p.mti}
                onClick={() => selectPatient(p)}
                className={`w-full text-start p-3 rounded-xl border transition-all ${
                  selectedPatient?.mti === p.mti ? "border-primary bg-primary/10" : "border-outline-variant/40 hover:bg-surface-container-low"
                }`}
              >
                <div className="font-bold text-sm">{pick(p.fullName)}</div>
                <div className="text-xs font-mono text-on-surface-variant">{p.mti}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              <Card className="p-5">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  {isAr ? `رفع فحص أشعة جديد للمريض: ${pick(selectedPatient.fullName)}` : `Upload Imaging Study for ${pick(selectedPatient.fullName)}`}
                </h3>
                <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "نوع الفحص (Modality)" : "Modality"}</label>
                    <select
                      value={modality}
                      onChange={(e) => setModality(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    >
                      <option value="X-Ray">X-Ray (أشعة سينية)</option>
                      <option value="CT">CT Scan (أشعة مقطعية)</option>
                      <option value="MRI">MRI (رنين مغناطيسي)</option>
                      <option value="Ultrasound">Ultrasound (موجات صوتية)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "ملف الأشعة (صورة أو PDF)" : "Imaging File (PNG/JPG/PDF)"}</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={onFileChange}
                      className="w-full text-xs file:me-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "العضو المفحوص (EN)" : "Body Part (EN)"}</label>
                    <input
                      required
                      value={bodyPartEn}
                      onChange={(e) => setBodyPartEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "العضو المفحوص (AR)" : "Body Part (AR)"}</label>
                    <input
                      required
                      value={bodyPartAr}
                      onChange={(e) => setBodyPartAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "التقرير الطبي (EN)" : "Radiologist Findings (EN)"}</label>
                    <textarea
                      rows={2}
                      value={findingsEn}
                      onChange={(e) => setFindingsEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "التقرير الطبي (AR)" : "Radiologist Findings (AR)"}</label>
                    <textarea
                      rows={2}
                      value={findingsAr}
                      onChange={(e) => setFindingsAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90"
                    >
                      {uploading ? (isAr ? "جاري الحفظ..." : "Uploading...") : (isAr ? "حفظ وإرسال للسجل الطبي" : "Upload Radiology Study")}
                    </button>
                  </div>
                </form>
              </Card>

              {previewStudy && (
                <Card className="p-5 border-2 border-primary space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">
                      {previewStudy.modality} — {isAr ? previewStudy.bodyPartAr : previewStudy.bodyPartEn}
                    </h4>
                    <button onClick={() => setPreviewStudy(null)} className="text-xs text-on-surface-variant hover:underline">
                      {isAr ? "إغلاق المعاينة" : "Close Preview"}
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {isAr ? previewStudy.findingsAr || previewStudy.findingsEn : previewStudy.findingsEn}
                  </p>
                  {previewStudy.fileBase64 && previewStudy.mimeType?.startsWith("image/") && (
                    <div className="rounded-xl overflow-hidden border border-outline-variant/40 bg-black/90 p-4 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${previewStudy.mimeType};base64,${previewStudy.fileBase64}`}
                        alt="Radiology Study"
                        className="max-h-80 object-contain"
                      />
                    </div>
                  )}
                </Card>
              )}

              <Card className="overflow-hidden">
                <div className="p-4 border-b border-outline-variant/40">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ScanEye className="w-4 h-4 text-primary" />
                    {isAr ? "أرشيف فحوصات الأشعة للمريض" : "Patient Radiology Studies"} ({studies.length})
                  </h3>
                </div>
                {studies.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    {isAr ? "لا توجد فحوصات أشعة مسجلة لهذا المريض." : "No radiology studies found for this citizen."}
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/40">
                    {studies.map((s) => (
                      <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold">
                              {s.modality}
                            </span>
                            <span className="font-bold text-sm">{isAr ? s.bodyPartAr : s.bodyPartEn}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {isAr ? s.findingsAr || s.findingsEn : s.findingsEn}
                          </p>
                          <div className="text-[11px] font-mono text-on-surface-variant mt-1">
                            {new Date(s.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openStudy(s.id)}
                            className="p-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low"
                            title={isAr ? "معاينة الصورة" : "View Image"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeStudy(s.id)}
                            className="p-2 rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10"
                            title={isAr ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-on-surface-variant">
              <ScanEye className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {isAr ? "ابحث عن مريض واختره لعرض أو رفع فحوصات الأشعة الخاصة به" : "Search and select a citizen to view or upload radiology imaging studies"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
