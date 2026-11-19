"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, ShieldCheck, User, Siren } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApiError } from "@/lib/api/useApiError";
import { homeFor } from "@/lib/nav";
import { BRAND_LOGO_URL } from "@/lib/assets";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export default function LoginPage() {
  const { locale, t } = useLocale();
  const { user, loading, login, logout } = useAuth();
  const handleError = useApiError();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const ar = locale === "ar";

  useEffect(() => {
    if (loading || !user) return;
    router.replace(user.mustChangePassword ? "/change-password" : homeFor(user.role, user.specialityEn));
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const u = await login(identifier.trim(), password);
      if (u.role === "PATIENT") {
        await logout();
        setNotice(
          ar
            ? "هذه البوابة للكوادر الطبية والإدارية فقط. يرجى استخدام تطبيق المواطن على الهاتف."
            : "This portal is for authorized medical and administrative staff only. Citizens should use the mobile app."
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Image src={BRAND_LOGO_URL} alt="MNIS" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" unoptimized />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-primary">{t("brand.name")}</span>
            <span className="text-[11px] text-on-surface-variant">{t("brand.fullName")}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/emergency"
            className="inline-flex items-center gap-1.5 rounded-xl bg-error px-3 py-2 text-xs font-bold text-on-error shadow-level-1 hover:opacity-90"
          >
            <Siren className="h-3.5 w-3.5" />
            {ar ? "طوارئ NFC" : "NFC Emergency"}
          </Link>
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="flex w-full max-w-md flex-col gap-4">
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col gap-5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-level-2"
          >
            <div className="flex flex-col gap-1 text-center">
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold text-primary">{ar ? "تسجيل دخول الكوادر" : "Staff sign-in"}</h1>
              <p className="text-sm text-on-surface-variant">
                {ar
                  ? "أدخل البريد الإلكتروني الوظيفي وكلمة المرور المعتمدة من الإدارة"
                  : "Sign in with your officially registered institutional email and password"}
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
              {ar ? "البريد الإلكتروني" : "Email"}
              <span className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  dir="ltr"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 w-full rounded-lg bg-surface-container-low ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
              {ar ? "كلمة المرور" : "Password"}
              <span className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg bg-surface-container-low ps-9 pe-10 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  aria-label="toggle password"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {notice && <p className="rounded-lg bg-warning-container p-3 text-sm font-semibold text-on-warning-container">{notice}</p>}

            <Button type="submit" size="lg" loading={busy || loading}>
              {ar ? "دخول" : "Sign in"}
            </Button>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] font-semibold text-on-surface-variant">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {ar
                  ? "الدخول مقتصر على الكوادر الطبية والإدارية المرخصة — جميع العمليات موثقة رقابياً"
                  : "Authorized clinical and administrative staff only — all sessions are securely audited"}
              </span>
            </div>

            <p className="text-center text-[11px] text-on-surface-variant">{t("common.poweredBy")}</p>
          </form>
        </div>
      </main>
    </div>
  );
}
