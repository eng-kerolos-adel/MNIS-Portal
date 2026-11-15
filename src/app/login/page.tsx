"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, ShieldCheck, User, Sparkles, Siren } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApiError } from "@/lib/api/useApiError";
import { homeFor } from "@/lib/nav";
import { BRAND_LOGO_URL } from "@/lib/assets";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

const DEMO_ROLES = [
  { labelAr: "الطبيب (د. طارق)", labelEn: "Doctor", email: "doctor@mnis.demo" },
  { labelAr: "الصيدلي (ص. منى)", labelEn: "Pharmacist", email: "pharmacist@mnis.demo" },
  { labelAr: "المعمل والأشعة", labelEn: "Lab & PACS", email: "lab1@mnis.demo" },
  { labelAr: "المستشفى والطوارئ", labelEn: "Hospital & ER", email: "er@mnis.demo" },
  { labelAr: "مكتب الاستقبال", labelEn: "Reception", email: "reception@mnis.demo" },
  { labelAr: "الـ 4 وزارات والقيادة", labelEn: "4 Ministries Exec", email: "exec@mnis.demo" },
  { labelAr: "مدير النظام والأمن", labelEn: "System Admin", email: "admin@mnis.demo" },
];

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
    router.replace(user.mustChangePassword ? "/change-password" : homeFor(user.role));
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await performLogin(identifier.trim(), password);
  }

  async function performLogin(email: string, pass: string) {
    setBusy(true);
    setNotice(null);
    try {
      const u = await login(email, pass);
      if (u.role === "PATIENT") {
        await logout();
        setNotice(
          ar
            ? "هذه البوابة للكوادر الطبية فقط. استخدم تطبيق المواطن على الموبايل."
            : "This portal is for clinical staff only. Please use the citizen mobile app."
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
            href="/presentation"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-on-primary shadow-level-1 hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {ar ? "العرض التقديمي الشامل وفلو كل مستخدم ووزارة" : "Master Presentation & User Flows"}
          </Link>
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
        <div className="flex w-full max-w-lg flex-col gap-4">
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
                {ar ? "استخدم البريد الإلكتروني المسجل لدى الإدارة أو اختر دخولاً سريعاً أدناه" : "Use your staff email or pick a 1-click demo role below"}
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

            {/* 1-Click Demo Role Switcher for Live Discussion */}
            <div className="border-t border-outline-variant/40 pt-4">
              <p className="mb-2 text-center text-xs font-bold text-on-surface-variant">
                {ar ? "دخول تجريبي فوري بضغطة واحدة لجميع القطاعات (للعرض والمناقشة):" : "1-Click Instant Demo Login across Sectors:"}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {DEMO_ROLES.map((r) => (
                  <button
                    key={r.email}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const pw = "MnisDemo#2026!Secure";
                      setIdentifier(r.email);
                      setPassword(pw);
                      void performLogin(r.email, pw);
                    }}
                    className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors"
                  >
                    {ar ? r.labelAr : r.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-[11px] text-on-surface-variant">{t("common.poweredBy")}</p>
          </form>
        </div>
      </main>
    </div>
  );
}
