"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_PORTAL_REMOTE_CONFIG,
  getPortalRemoteConfig,
  type PortalRemoteConfig,
} from "@/lib/firebase/remote-config";

export function RemoteConfigBanner() {
  const { locale } = useLocale();
  const [rc, setRc] = useState<PortalRemoteConfig>(DEFAULT_PORTAL_REMOTE_CONFIG);

  useEffect(() => {
    let alive = true;
    void getPortalRemoteConfig().then((cfg) => {
      if (alive) setRc(cfg);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!rc.maintenanceMode) return null;

  const msg = locale === "ar" ? rc.maintenanceMessageAr : rc.maintenanceMessageEn;

  return (
    <div className="mx-auto mt-3 w-full max-w-[1440px] px-4 sm:px-6">
      <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <span>{msg}</span>
      </div>
    </div>
  );
}
