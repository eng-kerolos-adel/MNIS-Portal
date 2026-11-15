"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApiError } from "@/lib/api/useApiError";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button } from "@/components/ui/Button";

export default function ChangePasswordPage() {
  const { locale } = useLocale();
  const { user, loading, changePassword } = useAuth();
  const handleError = useApiError();
  const { push } = useToast();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const ar = locale === "ar";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const strong = next.length >= 10 && /[A-Za-z]/.test(next) && /\d/.test(next);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await changePassword(current, next);
      push("success", ar ? "تم تغيير كلمة المرور. سجّل الدخول من جديد." : "Password changed. Please sign in again.");
      router.replace("/login");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-level-2">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-container text-on-warning-container"><KeyRound className="h-6 w-6" /></span>
          <h1 className="text-xl font-bold text-primary">{ar ? "غيّر كلمة المرور المؤقتة" : "Change your temporary password"}</h1>
          <p className="text-sm text-on-surface-variant">{ar ? "لا يمكنك استخدام النظام قبل اختيار كلمة مرور خاصة بك." : "You can't use the system until you choose your own password."}</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {ar ? "كلمة المرور المؤقتة" : "Temporary password"}
          <input type="password" required dir="ltr" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-11 rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {ar ? "كلمة المرور الجديدة" : "New password"}
          <input type="password" required dir="ltr" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="h-11 rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50" />
          <span className={`text-xs font-normal ${strong ? "text-success" : "text-on-surface-variant"}`}>
            {ar ? "10 أحرف على الأقل، وتحتوي على حروف وأرقام" : "At least 10 characters, with letters and digits"}
          </span>
        </label>
        <Button type="submit" size="lg" loading={busy} disabled={!strong || !current}>{ar ? "حفظ" : "Save"}</Button>
      </form>
    </div>
  );
}
