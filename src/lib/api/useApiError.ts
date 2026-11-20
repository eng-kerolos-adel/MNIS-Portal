"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { ApiError } from "./client";

const MESSAGES: Record<string, { en: string; ar: string }> = {
  NO_PATIENTS_WAITING: { en: "No patients are waiting", ar: "لا يوجد مرضى بالانتظار" },
  INSUFFICIENT_ROLE: { en: "You don't have permission for this action", ar: "ليست لديك صلاحية لهذا الإجراء" },
  INVALID_STATE_TRANSITION: { en: "This step is no longer available (someone else may have acted)", ar: "هذه الخطوة لم تعد متاحة (ربما تم تنفيذها من مستخدم آخر)" },
  BED_NOT_AVAILABLE: { en: "That bed is no longer available", ar: "هذا السرير لم يعد متاحاً" },
  DUAL_SIGNOFF_REQUIRED: { en: "A different lab specialist must verify these results", ar: "يجب أن يعتمد النتائج أخصائي معمل آخر" },
  RX_SIGNATURE_TAMPERED: { en: "Prescription digital signature verification failed", ar: "فشل التحقق من الختم الرقمي المشفر للروشتة" },
  ALREADY_EXISTS: { en: "Already exists", ar: "موجود بالفعل" },
  ACCOUNT_ALREADY_EXISTS: { en: "This citizen already has an account", ar: "هذا المواطن لديه حساب بالفعل" },
  INVALID_OR_EXPIRED_CODE: { en: "Invalid or expired code", ar: "الكود غير صحيح أو منتهي" },
  INVALID_CREDENTIALS: { en: "Incorrect ID/email or password", ar: "بيانات الدخول غير صحيحة" },
  TOO_MANY_REQUESTS: { en: "Too many attempts, try again in a minute", ar: "محاولات كثيرة، حاول بعد دقيقة" },
  PRIMARY_AND_SECONDARY_EMAIL_MUST_DIFFER: { en: "Primary and secondary staff emails must be different", ar: "يجب اختلاف البريد الإلكتروني للموظف الأول عن الموظف الثاني" },
  PRIMARY_EMAIL_ALREADY_EXISTS: { en: "Primary staff email is already registered", ar: "البريد الإلكتروني للموظف الأول مسجل بالفعل" },
  SECONDARY_EMAIL_ALREADY_EXISTS: { en: "Secondary staff email is already registered", ar: "البريد الإلكتروني للموظف الثاني مسجل بالفعل" },
  APPOINTMENT_NOT_CONFIRMED_FOR_CHECKIN: { en: "Appointment must be confirmed before clinic check-in", ar: "يجب تأكيد الموعد أولاً قبل تسجيل حضور المريض" },
  LAB_RECEPTION_CANNOT_ENTER_OR_VERIFY_RESULTS: { en: "Lab receptionists cannot enter or verify diagnostic test results", ar: "صلاحية استقبال المعمل لا تسمح بإدخال أو اعتماد النتائج" },
  OUT_OF_FACILITY_SCOPE: { en: "This record belongs to another facility", ar: "هذا السجل يخص منشأة طبية أخرى" },
  ER_CASE_ALREADY_CLOSED: { en: "This ER case is already admitted or discharged", ar: "حالة الطوارئ تم إغلاقها أو تسكينها بالفعل" },
  CANNOT_DEACTIVATE_SELF: { en: "You cannot deactivate your own admin account", ar: "لا يمكنك تعطيل حسابك الإداري الحالي" },
  INVALID_BLOOD_UNIT_STATE: { en: "This blood unit is expired or already used/discarded", ar: "كيس الدم منتهي الصلاحية أو تم استخدامه/إعدامه بالفعل" },
  FLAG_ALREADY_REVIEWED: { en: "This clinical flag was already reviewed", ar: "تمت مراجعة هذا التنبيه السريري مسبقاً" },
  CLAIM_ALREADY_EXISTS: { en: "An insurance claim already exists for this prescription", ar: "توجد مطالبة تأمينية مسجلة بالفعل لهذه الروشتة" },
  ALLOWANCE_PERIOD_EXPIRED: { en: "This chronic allowance period has expired", ar: "انتهت صلاحية فترة الحصة الشهرية الحالية" },
  NOT_YOUR_PRESCRIPTION: { en: "Only the prescribing physician can perform this action", ar: "هذا الإجراء متاح للطبيب مُصدر الروشتة فقط" },
};

/** Returns a handler that turns any thrown error into a localized toast. */
export function useApiError() {
  const { locale } = useLocale();
  const { push } = useToast();
  return useCallback(
    (e: unknown) => {
      const code = e instanceof ApiError ? e.code : "NETWORK";
      const known = MESSAGES[code] ?? (e instanceof ApiError && e.status === 429 ? MESSAGES.TOO_MANY_REQUESTS : undefined);
      push(
        "error",
        known ? known[locale] : locale === "ar" ? "تعذّر تنفيذ العملية" : "Action failed",
        known ? undefined : code === "NETWORK" ? (locale === "ar" ? "تعذّر الاتصال بالخادم" : "Could not reach the server") : code
      );
    },
    [locale, push]
  );
}
