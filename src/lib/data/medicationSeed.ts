import type { Medication } from "@/types/domain";

/**
 * Live Synchronized Egyptian & International Drug Formulary Module
 *
 * 100% live-synced from external authoritative APIs (zero hardcoded drug arrays):
 * 1) Egyptian Drug Live Search API (eg-drugs-api.mahmoudfalous.workers.dev) — 27,617+ marketed drugs in Egypt
 * 2) Full Live Egyptian Drug Feed (raw.githubusercontent.com/mahmoudfalous/eg-drugs/main/data/eg_drugs.json)
 * 3) U.S. NIH NLM RxNorm Prescribe API (rxnav.nlm.nih.gov/REST/Prescribe/drugs.json)
 * 4) U.S. OpenFDA Drug NDC API (api.fda.gov/drug/ndc.json)
 * 5) Hospital Live Pharmacy Inventory (when accessible to role)
 */

export interface DrugCatalogItem extends Omit<Medication, "id"> {
  genericName?: string;
  category?: { en: string; ar: string };
  manufacturer?: string;
  barcode?: string;
  indicationsAr?: string;
  oldPrice?: number;
  source?: "EG_DRUGS_LIVE_API" | "PHARMACY_INVENTORY" | "RXNORM_NIH" | "OPENFDA";
}

export interface LiveMedicationSearchResult {
  items: DrugCatalogItem[];
  totalAvailable: number;
  totalMatches: number;
  page: number;
  hasMore: boolean;
  syncedAt: string;
  activeSources: string[];
}

export const medicationSeed: DrugCatalogItem[] = [];

const EG_DRUGS_API_BASE = "https://eg-drugs-api.mahmoudfalous.workers.dev/v1/search";
const EG_DRUGS_FULL_FEED_URL =
  "https://raw.githubusercontent.com/mahmoudfalous/eg-drugs/main/data/eg_drugs.json";

type RawEgDrug = {
  id?: number | string;
  name?: string;
  arabic?: string;
  active?: string;
  company?: string;
  price?: string | number;
  oldprice?: string | number;
  barcode?: string;
  units?: string;
  description?: string;
  uses?: string;
};

type IndexedEgDrug = {
  raw: RawEgDrug;
  item: DrugCatalogItem;
  searchBlob: string;
};

const ARABIC_TO_EN_DRUG_HINTS: Array<[string, string]> = [
  ["أموكسيسيلين", "amoxicillin"],
  ["اموكسيسيلين", "amoxicillin"],
  ["أوجمنتين", "augmentin"],
  ["اوجمنتين", "augmentin"],
  ["باراسيتامول", "paracetamol"],
  ["بنادول", "panadol"],
  ["بانادول", "panadol"],
  ["أزيثرومايسين", "azithromycin"],
  ["سيبروفلوكساسين", "ciprofloxacin"],
  ["أوميبرازول", "omeprazole"],
  ["بانتوبرازول", "pantoprazole"],
  ["نيكسيوم", "nexium"],
  ["ميتفورمين", "metformin"],
  ["أنسولين", "insulin"],
  ["انسولين", "insulin"],
  ["أتورفاستاتين", "atorvastatin"],
  ["أملوديبين", "amlodipine"],
  ["بيسوبرولول", "bisoprolol"],
  ["كونكور", "concor"],
  ["أسبرين", "aspirin"],
  ["إيبوبروفين", "ibuprofen"],
  ["ايبوبروفين", "ibuprofen"],
  ["ديكلوفيناك", "diclofenac"],
  ["كتافلام", "cataflam"],
  ["ليثيروكسين", "levothyroxine"],
  ["إلتروكسين", "eltroxin"],
  ["فنتولين", "ventolin"],
  ["كلوبيدوجريل", "clopidogrel"],
  ["بلافيكس", "plavix"],
  ["لوسارتان", "losartan"],
  ["كوزار", "cozaar"],
  ["وارفارين", "warfarin"],
  ["ماريفان", "marevan"],
  ["فوروسيميد", "furosemide"],
  ["لازيكس", "lasix"],
  ["أبيكسابان", "apixaban"],
  ["إليكويس", "eliquis"],
  ["ريفاروكسابان", "rivaroxaban"],
  ["زاريلتو", "xarelto"],
];

function normalizeAr(text: string): string {
  return text
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .toLowerCase();
}

function resolveEnglishApiQuery(rawQuery: string): string {
  const clean = rawQuery.trim();
  if (!clean) return "";
  if (/[a-zA-Z]/.test(clean)) return clean;
  const norm = normalizeAr(clean);
  for (const [arKey, enVal] of ARABIC_TO_EN_DRUG_HINTS) {
    if (norm.includes(normalizeAr(arKey))) return enVal;
  }
  return "";
}

function inferFormAndDose(
  rawName: string,
  rawDosageForm?: string,
): { formEn: string; formAr: string; dose: string; defaultQty: number; defaultFreqEn: string; defaultFreqAr: string } {
  const txt = `${rawName} ${rawDosageForm ?? ""}`.toLowerCase();
  const doseMatch = rawName.match(
    /\b(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:mg|mcg|gm|g|ml|iu|i\.u|%|unit|مجم|جم|مل))\b/i,
  );
  const dose = doseMatch ? doseMatch[1]!.replace(/\s+/g, "") : "Standard";

  if (txt.includes("caps") || txt.includes("كبسول")) {
    return { formEn: "Capsule", formAr: "كبسولات", dose, defaultQty: 20, defaultFreqEn: "Every 8 hours", defaultFreqAr: "كل 8 ساعات" };
  }
  if (txt.includes("syr") || txt.includes("susp") || txt.includes("solution") || txt.includes("شراب") || txt.includes("معلق")) {
    return { formEn: "Syrup", formAr: "شراب", dose, defaultQty: 1, defaultFreqEn: "5ml every 8 hours", defaultFreqAr: "5 مل كل 8 ساعات" };
  }
  if (txt.includes("amp") || txt.includes("vial") || txt.includes("inj") || txt.includes("حقن") || txt.includes("امبول") || txt.includes("فيال")) {
    return { formEn: "Injection", formAr: "حقن", dose, defaultQty: 5, defaultFreqEn: "Once daily IM/IV", defaultFreqAr: "مرة يومياً عضل أو وريد" };
  }
  if (txt.includes("inhaler") || txt.includes("spray") || txt.includes("بخاخ")) {
    return { formEn: "Inhaler/Spray", formAr: "بخاخ", dose, defaultQty: 1, defaultFreqEn: "2 puffs twice daily", defaultFreqAr: "بختان مرتين يومياً" };
  }
  if (txt.includes("cream") || txt.includes("oint") || txt.includes("gel") || txt.includes("كريم") || txt.includes("مرهم") || txt.includes("جل")) {
    return { formEn: "Cream/Ointment", formAr: "كريم / مرهم", dose, defaultQty: 1, defaultFreqEn: "Apply twice daily", defaultFreqAr: "دهان مرتين يومياً" };
  }
  if (txt.includes("drop") || txt.includes("قطر") || txt.includes("نقط")) {
    return { formEn: "Drops", formAr: "قطرة", dose, defaultQty: 1, defaultFreqEn: "Twice daily", defaultFreqAr: "مرتين يومياً" };
  }
  if (txt.includes("supp") || txt.includes("لبوس")) {
    return { formEn: "Suppository", formAr: "لبوس", dose, defaultQty: 5, defaultFreqEn: "At bedtime", defaultFreqAr: "عند النوم" };
  }
  if (txt.includes("sach") || txt.includes("فوار") || txt.includes("كيس") || txt.includes("اكياس")) {
    return { formEn: "Sachet", formAr: "أكياس / فوار", dose, defaultQty: 10, defaultFreqEn: "Twice daily after meals", defaultFreqAr: "مرتين يومياً بعد الأكل" };
  }
  return { formEn: "Tablet", formAr: "أقراص", dose, defaultQty: 20, defaultFreqEn: "Every 12 hours", defaultFreqAr: "كل 12 ساعة" };
}

function mapRawEgDrug(r: RawEgDrug): DrugCatalogItem | null {
  const en = String(r.name ?? "").trim();
  const ar = String(r.arabic ?? "").trim();
  if (!en && !ar) return null;
  const inferred = inferFormAndDose(`${en} ${ar}`);
  const parsedPrice = Number.parseFloat(String(r.price ?? "0"));
  const parsedOldPrice = Number.parseFloat(String(r.oldprice ?? "0"));
  const active = String(r.active ?? "").trim();
  const company = String(r.company ?? "").trim();
  const desc = String(r.description ?? "").trim();
  const uses = String(r.uses ?? "").trim();
  const barcode = String(r.barcode ?? "").trim();

  return {
    name: { en: en || ar, ar: ar || en },
    genericName: active || undefined,
    category: desc ? { en: desc, ar: desc } : { en: "Egyptian Drug Index", ar: "دليل الدواء المصري" },
    form: { en: inferred.formEn, ar: inferred.formAr },
    dose: inferred.dose,
    frequency: { en: inferred.defaultFreqEn, ar: inferred.defaultFreqAr },
    durationDays: 7,
    quantity: inferred.defaultQty,
    substitutionAllowed: true,
    stockStatus: "in-stock",
    unitPrice: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0,
    oldPrice: Number.isFinite(parsedOldPrice) && parsedOldPrice > 0 ? parsedOldPrice : undefined,
    manufacturer: company || undefined,
    barcode: barcode || undefined,
    indicationsAr: uses || undefined,
    source: "EG_DRUGS_LIVE_API",
  };
}

let fullEgCatalog: IndexedEgDrug[] | null = null;
let fullEgCatalogSyncedAt: string | null = null;
let fullEgCatalogPromise: Promise<IndexedEgDrug[] | null> | null = null;

export async function syncFullEgyptianDrugsCatalog(forceRefresh = false): Promise<{ count: number; syncedAt: string } | null> {
  if (fullEgCatalog && !forceRefresh) {
    return { count: fullEgCatalog.length, syncedAt: fullEgCatalogSyncedAt ?? new Date().toISOString() };
  }
  if (fullEgCatalogPromise && !forceRefresh) {
    const res = await fullEgCatalogPromise;
    return res ? { count: res.length, syncedAt: fullEgCatalogSyncedAt ?? new Date().toISOString() } : null;
  }

  fullEgCatalogPromise = (async () => {
    try {
      const res = await fetch(EG_DRUGS_FULL_FEED_URL, {
        cache: forceRefresh ? "no-store" : "default",
      });
      if (!res.ok) return null;
      const rows = (await res.json()) as RawEgDrug[];
      if (!Array.isArray(rows) || rows.length === 0) return null;

      const indexed: IndexedEgDrug[] = [];
      for (const raw of rows) {
        const item = mapRawEgDrug(raw);
        if (!item) continue;
        const searchBlob = normalizeAr(
          `${raw.name ?? ""} ${raw.arabic ?? ""} ${raw.active ?? ""} ${raw.company ?? ""} ${raw.description ?? ""} ${raw.uses ?? ""} ${raw.barcode ?? ""}`,
        );
        indexed.push({ raw, item, searchBlob });
      }
      fullEgCatalog = indexed;
      fullEgCatalogSyncedAt = new Date().toISOString();
      return indexed;
    } catch {
      return null;
    } finally {
      fullEgCatalogPromise = null;
    }
  })();

  const loaded = await fullEgCatalogPromise;
  return loaded ? { count: loaded.length, syncedAt: fullEgCatalogSyncedAt ?? new Date().toISOString() } : null;
}

const searchCache = new Map<string, { items: DrugCatalogItem[]; totalMatches: number; hasMore: boolean; sources: string[] }>();

async function queryEgDrugsWorkerApi(
  query: string,
  page: number,
  limit: number,
  forceRefresh: boolean,
  signal?: AbortSignal,
): Promise<{ items: DrugCatalogItem[]; totalResults: number; hasNext: boolean } | null> {
  // Worker API rejects '%' characters; normalize Alef hamza forms for reliable Arabic matching
  const sanitized = query.trim().replace(/[أإآ]/g, "ا").replace(/%/g, "").trim();
  if (!sanitized) return null;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);
  const onParentAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onParentAbort, { once: true });

  try {
    const url = `${EG_DRUGS_API_BASE}?q=${encodeURIComponent(sanitized)}&page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      cache: forceRefresh ? "no-store" : "default",
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      pagination?: { total_results?: number; has_next?: boolean };
      results?: RawEgDrug[];
    };
    const items = (data.results ?? [])
      .map(mapRawEgDrug)
      .filter((x): x is DrugCatalogItem => x !== null);
    return {
      items,
      totalResults: Number(data.pagination?.total_results ?? items.length),
      hasNext: Boolean(data.pagination?.has_next),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onParentAbort);
  }
}

export async function searchMedicationsLiveWithMeta(
  rawQuery: string,
  options: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    pharmacyInventory?: Array<{ nameEn?: string; nameAr?: string; form?: string; quantity?: number; unitCost?: number }>;
    signal?: AbortSignal;
  } = {},
): Promise<LiveMedicationSearchResult> {
  const {
    page = 1,
    limit = 25,
    forceRefresh = false,
    pharmacyInventory = [],
    signal,
  } = options;

  const clean = rawQuery.trim();
  const normQ = normalizeAr(clean);
  const effectiveEgQuery = clean || "mg";

  // Trigger background full catalog sync (27,617+ drugs) so every subsequent search also matches indications/categories
  if (!fullEgCatalog && !fullEgCatalogPromise) {
    void syncFullEgyptianDrugsCatalog(false);
  } else if (forceRefresh) {
    searchCache.clear();
    await syncFullEgyptianDrugsCatalog(true);
  }

  const invMatches: DrugCatalogItem[] = pharmacyInventory
    .filter((inv) => {
      if (!normQ) return page === 1;
      const blob = normalizeAr(`${inv.nameEn ?? ""} ${inv.nameAr ?? ""}`);
      return blob.includes(normQ);
    })
    .map((inv) => ({
      name: { en: inv.nameEn ?? inv.nameAr ?? "", ar: inv.nameAr ?? inv.nameEn ?? "" },
      category: { en: "Hospital Pharmacy Stock", ar: "مخزون صيدلية المستشفى" },
      form: { en: inv.form || "Tablet", ar: inv.form || "أقراص" },
      dose: "Standard",
      frequency: { en: "Every 12 hours", ar: "كل 12 ساعة" },
      durationDays: 7,
      quantity: Math.max(1, Math.min(30, inv.quantity ?? 10)),
      substitutionAllowed: true,
      stockStatus: (inv.quantity ?? 0) > 10 ? "in-stock" : (inv.quantity ?? 0) > 0 ? "low" : "out-of-stock",
      unitPrice: inv.unitCost ?? 0,
      source: "PHARMACY_INVENTORY" as const,
    }));

  const cacheKey = `${normQ}::p${page}::l${limit}`;
  let remote = !forceRefresh ? searchCache.get(cacheKey) : undefined;

  if (!remote) {
    const activeSources: string[] = [];
    const items: DrugCatalogItem[] = [];
    let totalMatches = 0;
    let hasMore = false;

    const enApiQuery = resolveEnglishApiQuery(clean);
    const shouldQueryGlobal = enApiQuery.length >= 3 && page === 1;
    const useCatalogBrowse = !clean && !!fullEgCatalog;

    const [egWorkerRes, rxRes, fdaRes] = await Promise.all([
      useCatalogBrowse
        ? Promise.resolve(null)
        : queryEgDrugsWorkerApi(effectiveEgQuery, page, limit, forceRefresh, signal),
      shouldQueryGlobal
        ? fetch(`https://rxnav.nlm.nih.gov/REST/Prescribe/drugs.json?name=${encodeURIComponent(enApiQuery)}`, { signal })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
      shouldQueryGlobal
        ? fetch(
            `https://api.fda.gov/drug/ndc.json?search=brand_name:${encodeURIComponent(enApiQuery)}*+generic_name:${encodeURIComponent(enApiQuery)}*&limit=10`,
            { signal },
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    if (egWorkerRes && egWorkerRes.items.length > 0) {
      activeSources.push("Egypt Drug Live API (27,617+ Drugs)");
      items.push(...egWorkerRes.items);
      totalMatches = egWorkerRes.totalResults;
      hasMore = egWorkerRes.hasNext;
    }

    // Supplement from full live-synced catalog (covers Arabic uses/indications, categories, or full browse)
    if (fullEgCatalog) {
      const feedLabel = `Egypt Drug Live Feed (${fullEgCatalog.length.toLocaleString()} Drugs)`;
      if (!activeSources.some((s) => s.startsWith("Egypt Drug"))) {
        activeSources.push(feedLabel);
      }
      const tokens = normQ.split(/\s+/).filter(Boolean);
      const matched = tokens.length
        ? fullEgCatalog.filter((entry) => tokens.every((tk) => entry.searchBlob.includes(tk)))
        : fullEgCatalog;
      const offset = (page - 1) * limit;
      const sliced = matched.slice(offset, offset + limit).map((m) => m.item);
      if (items.length === 0 || (page === 1 && sliced.length > items.length)) {
        for (const sItem of sliced) {
          items.push(sItem);
        }
        totalMatches = Math.max(totalMatches, matched.length);
        hasMore = hasMore || offset + sliced.length < matched.length;
      }
    }

    if (fdaRes && Array.isArray(fdaRes.results)) {
      activeSources.push("OpenFDA NDC API");
      for (const r of fdaRes.results) {
        const brand = String(r.brand_name ?? r.generic_name ?? "").trim();
        const generic = String(r.generic_name ?? "").trim();
        const strength = String(r.active_ingredients?.[0]?.strength ?? "").trim();
        if (!brand) continue;
        const inferred = inferFormAndDose(`${brand} ${strength}`, String(r.dosage_form ?? ""));
        items.push({
          name: { en: brand, ar: brand },
          genericName: generic || undefined,
          category: { en: String(r.pharm_class?.[0] ?? "OpenFDA NDC"), ar: "قاعدة الدواء العالمية OpenFDA" },
          form: { en: inferred.formEn, ar: inferred.formAr },
          dose: strength || inferred.dose,
          frequency: { en: inferred.defaultFreqEn, ar: inferred.defaultFreqAr },
          durationDays: 7,
          quantity: inferred.defaultQty,
          substitutionAllowed: true,
          stockStatus: "in-stock",
          unitPrice: 0,
          source: "OPENFDA",
        });
      }
    }

    if (rxRes && Array.isArray(rxRes.drugGroup?.conceptGroup)) {
      activeSources.push("NIH NLM RxNorm API");
      for (const grp of rxRes.drugGroup.conceptGroup) {
        for (const cp of (grp.conceptProperties ?? []).slice(0, 8)) {
          const fullName = String(cp.synonym || cp.name || "").trim();
          if (!fullName) continue;
          const cleanName = fullName.length > 72 ? `${fullName.slice(0, 69)}...` : fullName;
          const inferred = inferFormAndDose(fullName);
          items.push({
            name: { en: cleanName, ar: cleanName },
            genericName: enApiQuery,
            category: { en: "NIH NLM RxNorm", ar: "المكتبة الطبية NIH RxNorm" },
            form: { en: inferred.formEn, ar: inferred.formAr },
            dose: inferred.dose,
            frequency: { en: inferred.defaultFreqEn, ar: inferred.defaultFreqAr },
            durationDays: 7,
            quantity: inferred.defaultQty,
            substitutionAllowed: true,
            stockStatus: "in-stock",
            unitPrice: 0,
            source: "RXNORM_NIH",
          });
        }
      }
    }

    remote = { items, totalMatches, hasMore, sources: activeSources };
    if (items.length > 0) {
      searchCache.set(cacheKey, remote);
    }
  }

  const dedup = new Map<string, DrugCatalogItem>();
  for (const item of [...invMatches, ...remote.items]) {
    const k = `${item.name.en.toLowerCase().trim()}__${item.dose.toLowerCase()}__${item.source ?? ""}`;
    if (!dedup.has(k)) dedup.set(k, item);
  }

  const activeSources = [...remote.sources];
  if (invMatches.length > 0 && !activeSources.includes("Hospital Pharmacy Inventory")) {
    activeSources.unshift("Hospital Pharmacy Inventory");
  }

  return {
    items: Array.from(dedup.values()),
    totalAvailable: fullEgCatalog?.length ?? 27617,
    totalMatches: Math.max(remote.totalMatches, dedup.size),
    page,
    hasMore: remote.hasMore,
    syncedAt: fullEgCatalogSyncedAt ?? new Date().toISOString(),
    activeSources,
  };
}

export async function searchMedicationsLive(
  rawQuery: string,
  pharmacyInventory: Array<{ nameEn?: string; nameAr?: string; form?: string; quantity?: number; unitCost?: number }> = [],
  signal?: AbortSignal,
): Promise<DrugCatalogItem[]> {
  const res = await searchMedicationsLiveWithMeta(rawQuery, { pharmacyInventory, signal });
  return res.items;
}
