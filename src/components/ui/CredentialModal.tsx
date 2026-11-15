"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Modal } from "./Modal";
import { Button } from "./Button";

/** Shows a one-time temporary password. It is never stored by the server in clear, so this is the only chance to copy it. */
export function CredentialModal({ open, onClose, loginId, password }: { open: boolean; onClose: () => void; loginId?: string; password: string }) {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [copied, setCopied] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={ar ? "بيانات الدخول المؤقتة" : "Temporary credentials"} size="sm">
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2 rounded-lg bg-warning-container p-3 text-sm font-semibold text-on-warning-container">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          {ar ? "تظهر هذه الكلمة مرة واحدة فقط. سلّمها للمستخدم، وسيُطلب منه تغييرها عند أول دخول." : "Shown only once. Hand it over now; the user must change it at first sign-in."}
        </p>
        {loginId && <div className="text-sm"><span className="text-on-surface-variant">{ar ? "معرّف الدخول" : "Login ID"}: </span><strong dir="ltr" className="font-mono">{loginId}</strong></div>}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-3">
          <strong dir="ltr" className="select-all font-mono text-lg tracking-wider">{password}</strong>
          <Button size="sm" variant="outline" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={async () => { try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } }}>
            {copied ? (ar ? "تم النسخ" : "Copied") : ar ? "نسخ" : "Copy"}
          </Button>
        </div>
        <Button onClick={onClose}>{ar ? "تم التسليم" : "Done"}</Button>
      </div>
    </Modal>
  );
}
