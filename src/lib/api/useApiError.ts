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
  ALREADY_EXISTS: { en: "Already exists", ar: "موجود بالفعل" },
  ACCOUNT_ALREADY_EXISTS: { en: "This citizen already has an account", ar: "هذا المواطن لديه حساب بالفعل" },
  INVALID_OR_EXPIRED_CODE: { en: "Invalid or expired code", ar: "الكود غير صحيح أو منتهي" },
  INVALID_CREDENTIALS: { en: "Incorrect ID/email or password", ar: "بيانات الدخول غير صحيحة" },
  TOO_MANY_REQUESTS: { en: "Too many attempts, try again in a minute", ar: "محاولات كثيرة، حاول بعد دقيقة" },
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
