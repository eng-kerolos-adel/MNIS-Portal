"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Phone, AlertTriangle, Heart, Droplet, CheckCircle2, AlertOctagon, Radio, Search } from "lucide-react";
import { api } from "@/lib/data/service";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface EmergencyData {
  mti: string;
  fullNameEn: string;
  fullNameAr: string;
  bloodType: string;
  governorate?: string;
  insuranceActive?: boolean;
  allergies: Array<string | { en?: string; ar?: string }>;
  chronicConditions: Array<string | { en?: string; ar?: string }>;
  organDonor: boolean;
}

const renderItem = (item: string | { en?: string; ar?: string }) =>
  typeof item === "string" ? item : item?.ar || item?.en || "—";

function EmergencyTriageContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("mti") || searchParams.get("token") || "";

  const [inputToken, setInputToken] = useState(initialToken);
  const [loading, setLoading] = useState(Boolean(initialToken));
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmergencyData | null>(null);

  const verify = useCallback(async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.verifyNfcCard(tok.trim());
      setData(res);
    } catch (err: any) {
      setData(null);
      setError(err?.message || "الكارت غير ساري أو تم إلغاؤه (Card Invalid or Revoked)");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialToken.trim()) {
      void verify(initialToken);
    } else {
      setLoading(false);
    }
  }, [initialToken, verify]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Emergency Header */}
      <div className="w-full max-w-2xl bg-red-950/40 border border-red-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-4 text-center">
        <div className="inline-flex p-3 rounded-full bg-red-600/20 text-red-500 mb-3 border border-red-500/30">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-wide">
          منظومة الإنقاذ والطوارئ الطبية الوطنية (MNIS — NFC / QR Rescue)
        </h1>
        <p className="text-xs text-red-300 mt-1 font-mono">
          EGYPTIAN NATIONAL RESCUE & ZERO-LOGIN PARAMEDIC TRIAGE
        </p>
      </div>

      {/* Interactive NFC / QR Scanner */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
          قارئ بطاقة الطوارئ الذكية أو كود الهوية الطبية (NFC / QR / MTI):
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify(inputToken);
          }}
          className="flex gap-2"
        >
          <input
            dir="ltr"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="NFC Token or MTI-EG-..."
            className="flex-1 h-10 rounded-xl bg-slate-950 border border-slate-700 px-3 text-xs font-mono text-white outline-none focus:border-red-500"
          />
          <button
            type="submit"
            disabled={!inputToken.trim() || loading}
            className="px-4 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            قراءة الشريحة
          </button>
        </form>
      </div>

      {!data && !loading && !error && (
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-xl flex flex-col items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-red-500" />
          <div>
            <h2 className="text-lg font-bold text-white">في انتظار مسح بطاقة NFC أو رمز الاستجابة السريع (QR)</h2>
            <p className="text-xs text-slate-400 mt-1">
              مرر بطاقة المريض الذكية على القارئ أو أدخل كود الهوية الطبية الموحدة (MTI) أعلاه لعرض الفصيلة والحساسية الدوائية والأمراض المزمنة فوراً.
            </p>
          </div>
          <a
            href="tel:123"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-base shadow-lg transition"
          >
            <Phone className="w-5 h-5" />
            اتصال فوري بهيئة الإسعاف المصرية (123)
          </a>
        </div>
      )}

      {loading && (
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-400">جاري التحقق من التوقيع التشفيري (SHA-256) لشريحة NFC وقراءة سجل إنقاذ الحياة...</p>
        </div>
      )}

      {error && !loading && (
        <div className="w-full max-w-2xl bg-slate-900 border border-red-500/40 rounded-2xl p-8 text-center shadow-xl">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">فشل التحقق من الشريحة أو تم إيقافها أمنياً</h3>
          <p className="text-sm text-red-300 mb-6">{error}</p>
          <a
            href="tel:123"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-lg shadow-lg transition"
          >
            <Phone className="w-6 h-6" />
            اتصال فوري بالإسعاف المصري (123)
          </a>
        </div>
      )}

      {data && !loading && (
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          {/* Patient Main Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                ✓ شريحة NFC نشطة وموثقة بتشفير SHA-256
              </span>
              <h2 className="text-2xl font-black text-white">{data.fullNameAr}</h2>
              <p className="text-xs text-slate-400 font-mono">
                {data.fullNameEn} • MTI: {data.mti} {data.governorate ? `• ${data.governorate}` : ""}
              </p>
            </div>

            {/* Blood Type Badge */}
            <div className="flex flex-col items-center justify-center bg-red-600 text-white rounded-2xl w-20 h-20 shadow-lg shadow-red-600/30 border-2 border-red-400">
              <Droplet className="w-5 h-5 fill-white mb-0.5" />
              <span className="text-2xl font-black">{data.bloodType.replace("_POS", "+").replace("_NEG", "-")}</span>
              <span className="text-[9px] font-bold">فصيلة الدم</span>
            </div>
          </div>

          {/* Critical Allergies Box */}
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              تحذير الحساسية الدوائية والغذائية المؤكدة (Critical Allergies):
            </div>
            {data.allergies && data.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {renderItem(allergy)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">لا توجد حساسيات دوائية مهددة للحياة مسجلة في ملف المريض.</p>
            )}
          </div>

          {/* Chronic Conditions Box */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
              <Heart className="w-4 h-4 text-amber-500" />
              الأمراض المزمنة والتاريخ المرضي الحرج (Chronic Conditions):
            </div>
            {data.chronicConditions && data.chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.chronicConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1.5 rounded-lg font-semibold"
                  >
                    {renderItem(cond)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">لا توجد أمراض مزمنة مسجلة.</p>
            )}
          </div>

          {/* Organ Donor & Insurance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">التبرع بالأعضاء بعد الوفاة:</span>
              {data.organDonor ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> متبرع موثق رسمياً
                </span>
              ) : (
                <span className="text-slate-500 font-semibold">غير مسجل كمتبرع</span>
              )}
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">تغطية التأمين الصحي الشامل:</span>
              <span className="text-emerald-400 font-bold">
                {data.insuranceActive !== false ? "مغطى بالكامل للطوارئ (UHIA)" : "طوارئ مجانية بقرار الدولة"}
              </span>
            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="tel:123"
              className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-base shadow-xl shadow-red-600/20 transition active:scale-[0.98]"
            >
              <Phone className="w-5 h-5 fill-white" />
              اتصال فوري بهيئة الإسعاف المصرية (123)
            </a>

            <p className="text-[11px] text-center text-slate-500">
              بيانات طبية سيادية سرية مشفرة طبقاً لقانون حماية البيانات الشخصية رقم 151 لسنة 2020 — لا يُكشف الرقم القومي في وضع الطوارئ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <EmergencyTriageContent />
    </Suspense>
  );
}
