"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, ExternalLink, Scan, Pill, AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pick } from "@/lib/utils/format";
import type { NationalIdentity } from "@/types/domain";

function SearchResults() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const { locale } = useLocale();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<NationalIdentity[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (qStr: string) => {
    setLoading(true);
    try {
      const res = await api.searchPatients(qStr.trim());
      setResults(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    setQuery(initialQ);
    void load(initialQ);
  }, [initialQ, load]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Search}
        title={ar ? "السجل الوطني الموحد والبحث الفوري في الهويات الطبية" : "National Medical Identity Directory & Global Search"}
        meta={
          <span className="text-xs font-semibold text-on-surface-variant">
            {ar
              ? "بحث فوري عبر الفهرس الأعمى المشفر (HMAC-SHA256 Blind Index) بالرقم القومي أو MTI أو الاسم"
              : "Instant O(1) lookup via HMAC-SHA256 Blind Index by National ID, MTI, or Name"}
          </span>
        }
      />

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              void load(e.target.value);
            }}
            placeholder={ar ? "ابحث بالاسم، كود الهوية الطبية (MTI-EG-...)، أو الرقم القومي (14 رقماً)..." : "Search by Name, MTI-EG-..., or 14-digit National ID..."}
            className="h-11 flex-1 rounded-xl bg-surface-container-low px-4 text-sm outline-none focus:ring-2 focus:ring-secondary/50"
          />
        </form>
      </Card>

      {loading && <p className="text-center text-sm py-8 text-on-surface-variant">{ar ? "جاري البحث في السجل الوطني..." : "Searching national registry..."}</p>}

      {!loading && results.length === 0 && (
        <p className="text-center text-sm py-8 text-on-surface-variant">
          {ar ? "لم يتم العثور على أي مواطنين يطابقون بحثك." : "No citizens found matching your query."}
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((p) => (
            <Card key={p.mti}>
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0">
                    <Image src={p.photoUrl} alt="" fill sizes="56px" className="rounded-lg object-cover" unoptimized />
                    <span className="absolute -bottom-1 -end-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {p.bloodType}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{pick(p.fullName, locale)}</p>
                    <p className="text-xs font-mono font-semibold text-primary">MTI: {p.mti}</p>
                    {p.nationalId && <p className="text-xs font-mono text-on-surface-variant">NID: {p.nationalId}</p>}
                  </div>
                </div>

                {p.allergies.length > 0 && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.allergies.map((a) => pick(a, locale)).join("، ")}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
                  <Badge tone={p.insuranceActive ? "success" : "neutral"}>
                    {p.insuranceActive ? (ar ? "تأمين شامل سارٍ" : "UHIA Active") : ar ? "بدون تأمين" : "Uninsured"}
                  </Badge>
                  {p.allergies.length > 0 && (
                    <Badge tone="error">
                      {p.allergies.length} {ar ? "حساسية" : "Allergies"}
                    </Badge>
                  )}
                  {p.chronicConditions.length > 0 && (
                    <Badge tone="warning">
                      {p.chronicConditions.length} {ar ? "أمراض مزمنة" : "Chronic"}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-outline-variant/30 text-xs">
                  <a
                    href={`/emergency?token=${encodeURIComponent(p.mti)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white font-bold flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {ar ? "بطاقة الطوارئ" : "Emergency ID"}
                  </a>
                  <Link
                    href="/lab/radiology"
                    className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container font-semibold flex items-center gap-1"
                  >
                    <Scan className="w-3 h-3 text-primary" />
                    {ar ? "الأشعة" : "Radiology"}
                  </Link>
                  <Link
                    href="/pharmacy/chronic-allowances"
                    className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container font-semibold flex items-center gap-1"
                  >
                    <Pill className="w-3 h-3 text-secondary" />
                    {ar ? "حصص الدواء" : "Allowances"}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SearchResults />
    </Suspense>
  );
}
