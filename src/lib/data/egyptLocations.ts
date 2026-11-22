/**
 * Live Synchronized Egyptian Administrative Divisions & Areas API Module
 *
 * Fetches real-time hierarchical data directly from authoritative external sources:
 * 1) Full Egypt Divisions API (27 Governorates, 418 Centers/Markazes/Qisms, 5,773 Villages/Neighborhoods/Shiyakhat)
 *    via jsDelivr CDN + GitHub Raw mirror
 * 2) Bosta Live Egypt Cities & Districts API (3,580 Urban Districts & Delivery Zones)
 * 3) Tech-Labs Egypt Governorates & Cities API (396 Cities & New Cities)
 * 4) OpenStreetMap Nominatim Live Egypt Geocoder (for live village/street/hamlet lookup)
 *
 * Zero hardcoded static location arrays — synced live with external APIs.
 */

export interface EgyptCenter {
  id: string;
  code: string;
  ar: string;
  en: string;
  type: string;
}

export interface EgyptCity {
  id: string;
  ar: string;
  en: string;
  centerCode?: string;
  centerAr?: string;
  centerEn?: string;
  type?: string;
}

export interface EgyptGovernorate {
  id: string;
  code: string;
  ar: string;
  en: string;
  centers: EgyptCenter[];
  cities: EgyptCity[];
}

export interface EgyptLocationsSyncStats {
  governoratesCount: number;
  centersCount: number;
  areasCount: number;
  syncedAt: string;
  sources: string[];
}

// Live API endpoints
const DIVISIONS_CDN_URL =
  "https://cdn.jsdelivr.net/gh/Zeyad-Mohamed1/egypt-governorates-cities-villages@main/data/egypt-divisions.json";
const DIVISIONS_RAW_URL =
  "https://raw.githubusercontent.com/Zeyad-Mohamed1/egypt-governorates-cities-villages/main/data/egypt-divisions.json";
const BOSTA_DISTRICTS_URL =
  "https://app.bosta.co/api/v2/cities/getAllDistricts?countryId=60e4482c7cb7d4bc4849c4d5";
const TECHLABS_GOV_URL =
  "https://raw.githubusercontent.com/Tech-Labs/egypt-governorates-and-cities-db/master/governorates.json";
const TECHLABS_CITY_URL =
  "https://raw.githubusercontent.com/Tech-Labs/egypt-governorates-and-cities-db/master/cities.json";

export const EGYPT_GOVERNORATES_DEFAULT: EgyptGovernorate[] = [];

type RawDivisionLocality = {
  id?: number | string;
  code?: string;
  type?: string;
  name_ar?: string;
  name_en?: string;
};

type RawDivisionCenter = {
  id?: number | string;
  code?: string;
  type?: string;
  name_ar?: string;
  name_en?: string;
  label_en?: string;
  status?: string;
  localities?: RawDivisionLocality[];
};

type RawDivisionGovernorate = {
  id?: number | string;
  code?: string;
  name_ar?: string;
  name_en?: string;
  centers?: RawDivisionCenter[];
};

type RawBostaCity = {
  cityId?: string;
  cityCode?: string;
  cityName?: string;
  cityOtherName?: string;
  districts?: Array<{
    districtId?: string;
    districtName?: string;
    districtOtherName?: string;
    zoneName?: string;
    zoneOtherName?: string;
  }>;
};

type RawTechGov = { id: string; governorate_name_ar: string; governorate_name_en: string };
type RawTechCity = { id: string; governorate_id: string; city_name_ar: string; city_name_en: string };

function normalizeAr(text: string): string {
  return text
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeEn(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function areaDedupKey(arName: string, enName: string, centerCode?: string): string {
  const nAr = normalizeAr(arName).replace(/^(قسم|مركز|مدينه|مدينة|قرية|حي)\s+/, "");
  const nEn = normalizeEn(enName);
  const scope = centerCode ?? "";
  return `${scope}::${nAr || nEn}`;
}

const BOSTA_TO_EG_CODE: Record<string, string> = {
  "EG-01": "EG01", // Cairo
  "EG-02": "EG02", // Alexandria
  "EG-13": "EG03", // Port Said
  "EG-12": "EG04", // Suez
  "EG-14": "EG11", // Damietta
  "EG-05": "EG12", // Dakahlia
  "EG-10": "EG13", // Sharqia
  "EG-06": "EG14", // Qalyubia
  "EG-08": "EG15", // Kafr El Sheikh
  "EG-07": "EG16", // Gharbia
  "EG-09": "EG17", // Monufia
  "EG-04": "EG18", // Beheira
  "EG-11": "EG19", // Ismailia
  "EG-25": "EG21", // Giza
  "EG-16": "EG22", // Beni Suef
  "EG-15": "EG23", // Faiyum
  "EG-19": "EG24", // Minya
  "EG-17": "EG25", // Asyut
  "EG-18": "EG26", // Sohag
  "EG-20": "EG27", // Qena
  "EG-21": "EG28", // Aswan
  "EG-22": "EG29", // Luxor
  "EG-23": "EG31", // Red Sea
  "EG-24": "EG32", // New Valley
  "EG-28": "EG33", // Matrouh
  "EG-03": "EG33", // North Coast -> Matrouh
  "EG-27": "EG34", // North Sinai
  "EG-26": "EG35", // South Sinai
};

const EN_GOV_ALIASES: Record<string, string> = {
  cairo: "EG01",
  alexandria: "EG02",
  "port said": "EG03",
  suez: "EG04",
  damietta: "EG11",
  dakahlia: "EG12",
  sharkia: "EG13",
  sharqia: "EG13",
  qalyubia: "EG14",
  kalioubia: "EG14",
  "el kalioubia": "EG14",
  "kafr al sheikh": "EG15",
  "kafr alsheikh": "EG15",
  "kafr el sheikh": "EG15",
  gharbiya: "EG16",
  gharbia: "EG16",
  monofia: "EG17",
  monufia: "EG17",
  beheira: "EG18",
  behira: "EG18",
  ismailia: "EG19",
  giza: "EG21",
  "bani suif": "EG22",
  "beni suef": "EG22",
  fayoum: "EG23",
  faiyum: "EG23",
  minya: "EG24",
  menya: "EG24",
  assiut: "EG25",
  assuit: "EG25",
  asyut: "EG25",
  sohag: "EG26",
  qena: "EG27",
  aswan: "EG28",
  luxor: "EG29",
  "red sea": "EG31",
  "new valley": "EG32",
  matrouh: "EG33",
  "north coast": "EG33",
  "north sinai": "EG34",
  "south sinai": "EG35",
};

function extractRows<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    const table = raw.find(
      (item): item is { type: string; data: T[] } =>
        Boolean(item && typeof item === "object" && "data" in item && Array.isArray((item as { data?: unknown }).data)),
    );
    return table ? table.data : (raw as T[]);
  }
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

let cachedGovernorates: EgyptGovernorate[] | null = null;
let cachedStats: EgyptLocationsSyncStats | null = null;
let pendingFetch: Promise<EgyptGovernorate[]> | null = null;

export function getEgyptLocationsSyncStats(): EgyptLocationsSyncStats | null {
  return cachedStats;
}

async function fetchJsonWithTimeout(url: string, forceRefresh: boolean, timeoutMs = 15000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: forceRefresh ? "no-store" : "default",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchEgyptGovernorates(forceRefresh = false): Promise<EgyptGovernorate[]> {
  if (cachedGovernorates && !forceRefresh) return cachedGovernorates;
  if (pendingFetch && !forceRefresh) return pendingFetch;

  pendingFetch = (async () => {
    try {
      const fetchDivisions = fetchJsonWithTimeout(DIVISIONS_CDN_URL, forceRefresh, 15000).catch(() =>
        fetchJsonWithTimeout(DIVISIONS_RAW_URL, forceRefresh, 15000),
      );
      const fetchBosta = fetchJsonWithTimeout(BOSTA_DISTRICTS_URL, forceRefresh, 12000).catch(() => null);
      const fetchTechGov = fetchJsonWithTimeout(TECHLABS_GOV_URL, forceRefresh, 10000).catch(() => null);
      const fetchTechCity = fetchJsonWithTimeout(TECHLABS_CITY_URL, forceRefresh, 10000).catch(() => null);

      const [divRes, bostaRes, techGovRes, techCityRes] = await Promise.all([
        fetchDivisions.catch(() => null),
        fetchBosta,
        fetchTechGov,
        fetchTechCity,
      ]);

      const sources: string[] = [];
      const govMap = new Map<
        string,
        {
          id: string;
          code: string;
          ar: string;
          en: string;
          centersMap: Map<string, EgyptCenter>;
          areasMap: Map<string, EgyptCity>;
        }
      >();
      const arNameToCode = new Map<string, string>();
      const enNameToCode = new Map<string, string>();

      const ensureGov = (code: string, id: string, ar: string, en: string) => {
        const existing = govMap.get(code);
        if (existing) return existing;
        const entry = {
          id,
          code,
          ar: ar.trim(),
          en: en.trim(),
          centersMap: new Map<string, EgyptCenter>(),
          areasMap: new Map<string, EgyptCity>(),
        };
        govMap.set(code, entry);
        arNameToCode.set(normalizeAr(ar), code);
        enNameToCode.set(normalizeEn(en), code);
        return entry;
      };

      const rawDivisions = extractRows<RawDivisionGovernorate>(divRes);
      if (rawDivisions.length > 0) {
        sources.push("Egypt Admin Divisions (27 Governorates · 418 Centers · 5,773 Villages & Neighborhoods)");
        for (const g of rawDivisions) {
          const code = String(g.code ?? g.id ?? "").trim();
          const ar = String(g.name_ar ?? "").trim();
          const en = String(g.name_en ?? "").trim();
          if (!code || (!ar && !en)) continue;
          const govEntry = ensureGov(code, String(g.id ?? code), ar || en, en || ar);

          for (const c of g.centers ?? []) {
            const centerCode = String(c.code ?? c.id ?? "").trim();
            const cAr = String(c.name_ar ?? "").trim();
            const cEn = String(c.name_en ?? c.label_en ?? "").trim();
            const cType = String(c.type ?? "center").trim();
            if (!cAr && !cEn) continue;
            if (cType !== "zemam_out") {
              govEntry.centersMap.set(centerCode, {
                id: String(c.id ?? centerCode),
                code: centerCode,
                ar: cAr || cEn,
                en: cEn || cAr,
                type: cType,
              });
              const cKey = areaDedupKey(cAr || cEn, cEn || cAr, centerCode);
              if (!govEntry.areasMap.has(cKey)) {
                govEntry.areasMap.set(cKey, {
                  id: `ctr_${centerCode}`,
                  ar: cAr || cEn,
                  en: cEn || cAr,
                  centerCode,
                  centerAr: cAr || cEn,
                  centerEn: cEn || cAr,
                  type: cType,
                });
              }
            }

            for (const loc of c.localities ?? []) {
              const locAr = String(loc.name_ar ?? "").trim();
              const locEn = String(loc.name_en ?? "").trim();
              if (!locAr && !locEn) continue;
              const lKey = areaDedupKey(locAr || locEn, locEn || locAr, centerCode);
              if (!govEntry.areasMap.has(lKey)) {
                govEntry.areasMap.set(lKey, {
                  id: `loc_${String(loc.code ?? loc.id ?? lKey)}`,
                  ar: locAr || locEn,
                  en: locEn || locAr,
                  centerCode,
                  centerAr: cAr || cEn,
                  centerEn: cEn || cAr,
                  type: String(loc.type ?? "locality"),
                });
              }
            }
          }
        }
      }

      // 2. Merge Tech-Labs Cities API (396 official cities)
      const techGovs = extractRows<RawTechGov>(techGovRes);
      const techCities = extractRows<RawTechCity>(techCityRes);
      if (techGovs.length > 0 && techCities.length > 0) {
        sources.push("Tech-Labs Cities API");
        const techIdToCode = new Map<string, string>();
        for (const tg of techGovs) {
          const code =
            enNameToCode.get(normalizeEn(tg.governorate_name_en)) ??
            EN_GOV_ALIASES[normalizeEn(tg.governorate_name_en)] ??
            arNameToCode.get(normalizeAr(tg.governorate_name_ar)) ??
            `TL_${tg.id}`;
          techIdToCode.set(String(tg.id), code);
          if (!govMap.has(code)) {
            ensureGov(code, String(tg.id), tg.governorate_name_ar, tg.governorate_name_en);
          }
        }
        for (const tc of techCities) {
          const code = techIdToCode.get(String(tc.governorate_id));
          const govEntry = code ? govMap.get(code) : undefined;
          if (!govEntry) continue;
          const ar = tc.city_name_ar.trim();
          const en = tc.city_name_en.trim();
          // Skip if already present in any center/locality by Arabic/English city name
          const arNorm = normalizeAr(ar);
          const alreadyExists = Array.from(govEntry.areasMap.values()).some(
            (existing) => normalizeAr(existing.ar) === arNorm || normalizeEn(existing.en) === normalizeEn(en),
          );
          if (!alreadyExists) {
            govEntry.areasMap.set(`tl_${tc.id}`, {
              id: `tl_${tc.id}`,
              ar: ar || en,
              en: en || ar,
              type: "city",
            });
          }
        }
      }

      // 3. Merge Bosta Live Egypt Districts & Delivery Zones API (3,580 neighborhoods & zones)
      const bostaRows = extractRows<RawBostaCity>(bostaRes);
      if (bostaRows.length > 0) {
        sources.push("Bosta Live Egypt Districts API");
        for (const bc of bostaRows) {
          const bCode = String(bc.cityCode ?? "").trim();
          const bEn = normalizeEn(String(bc.cityName ?? ""));
          const bAr = normalizeAr(String(bc.cityOtherName ?? "").replace(/مرسي\s+/g, ""));
          const targetCode =
            BOSTA_TO_EG_CODE[bCode] ?? EN_GOV_ALIASES[bEn] ?? enNameToCode.get(bEn) ?? arNameToCode.get(bAr);
          const govEntry = targetCode ? govMap.get(targetCode) : undefined;
          if (!govEntry) continue;

          // Build fast global Arabic/English index per governorate to avoid adding identical names
          const existingNames = new Set<string>();
          for (const a of govEntry.areasMap.values()) {
            existingNames.add(normalizeAr(a.ar));
            existingNames.add(normalizeEn(a.en));
          }

          for (const d of bc.districts ?? []) {
            const dEn = String(d.districtName ?? d.zoneName ?? "").trim();
            const dAr = String(d.districtOtherName ?? d.zoneOtherName ?? "").trim();
            const zoneAr = String(d.zoneOtherName ?? "").trim();
            const zoneEn = String(d.zoneName ?? "").trim();
            if (!dAr && !dEn) continue;
            const nAr = normalizeAr(dAr || dEn);
            const nEn = normalizeEn(dEn || dAr);
            if (existingNames.has(nAr) || (nEn && existingNames.has(nEn))) continue;
            existingNames.add(nAr);
            if (nEn) existingNames.add(nEn);
            const did = String(d.districtId ?? `${bCode}_${nEn}`);
            govEntry.areasMap.set(`bosta_${did}`, {
              id: `bosta_${did}`,
              ar: dAr || dEn,
              en: dEn || dAr,
              centerAr: zoneAr || undefined,
              centerEn: zoneEn || undefined,
              type: "district",
            });
          }
        }
      }

      let totalCenters = 0;
      let totalAreas = 0;
      const assembled: EgyptGovernorate[] = Array.from(govMap.values())
        .map((g) => {
          const centers = Array.from(g.centersMap.values()).sort((a, b) => a.ar.localeCompare(b.ar, "ar"));
          const cities = Array.from(g.areasMap.values()).sort((a, b) => a.ar.localeCompare(b.ar, "ar"));
          totalCenters += centers.length;
          totalAreas += cities.length;
          return {
            id: g.id,
            code: g.code,
            ar: g.ar,
            en: g.en,
            centers,
            cities,
          };
        })
        .sort((a, b) => a.code.localeCompare(b.code));

      cachedGovernorates = assembled;
      cachedStats = {
        governoratesCount: assembled.length,
        centersCount: totalCenters,
        areasCount: totalAreas,
        syncedAt: new Date().toISOString(),
        sources,
      };
      return assembled;
    } catch {
      return cachedGovernorates ?? [];
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

/**
 * Queries live OpenStreetMap Nominatim for any specific hamlet, street, ezba, or village inside Egypt.
 */
export async function searchEgyptNominatimLive(
  query: string,
  governorateName?: string,
  signal?: AbortSignal,
): Promise<EgyptCity[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const fullQuery = governorateName ? `${clean}, ${governorateName}, Egypt` : `${clean}, Egypt`;
  try {
    const url = `https://nominatim.openstreetmap.org/search?countrycodes=eg&format=json&addressdetails=1&accept-language=ar,en&limit=12&q=${encodeURIComponent(fullQuery)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      place_id?: number;
      display_name?: string;
      name?: string;
      type?: string;
      address?: Record<string, string>;
    }>;
    return rows.map((row) => {
      const addr = row.address ?? {};
      const areaName =
        row.name ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.town ||
        addr.city_district ||
        addr.city ||
        row.display_name ||
        clean;
      const centerName = addr.county || addr.state_district || addr.city || addr.town || "";
      return {
        id: `osm_${row.place_id ?? areaName}`,
        ar: areaName,
        en: row.display_name ? row.display_name.split(",").slice(0, 2).join(", ").trim() : areaName,
        centerAr: centerName || undefined,
        centerEn: centerName || undefined,
        type: row.type ?? "osm",
      };
    });
  } catch {
    return [];
  }
}

export function filterGovernorateAreas(
  gov: EgyptGovernorate | undefined,
  centerCode: string,
  searchQuery: string,
  extraLiveAreas: EgyptCity[] = [],
): EgyptCity[] {
  if (!gov) return [];
  let list = gov.cities;
  if (centerCode) {
    list = list.filter((c) => c.centerCode === centerCode);
  }
  const q = normalizeAr(searchQuery);
  if (q) {
    list = list.filter((c) => {
      const hay = normalizeAr(`${c.ar} ${c.en} ${c.centerAr ?? ""} ${c.centerEn ?? ""}`);
      return hay.includes(q);
    });
  }
  if (extraLiveAreas.length > 0) {
    const seen = new Set(list.map((c) => normalizeAr(c.ar)));
    const extras = extraLiveAreas.filter((e) => !seen.has(normalizeAr(e.ar)));
    list = [...list, ...extras];
  }
  return list;
}

export function formatEgyptAddress(
  p: { governorate?: string | null; district?: string | null; address?: { ar: string; en: string } },
  ar: boolean,
  govs: EgyptGovernorate[] = cachedGovernorates ?? [],
): string {
  const govRaw = (p.governorate ?? "").trim();
  const distRaw = (p.district ?? "").trim();
  const govObj = govs.find((g) => g.en.toLowerCase() === govRaw.toLowerCase() || g.ar === govRaw || g.code === govRaw);
  const govLabel = govObj ? (ar ? govObj.ar : govObj.en) : govRaw;
  const distObj = govObj?.cities.find((c) => c.en.toLowerCase() === distRaw.toLowerCase() || c.ar === distRaw);
  const distLabel = distObj ? (ar ? distObj.ar : distObj.en) : distRaw;
  const streetLabel = ar ? (p.address?.ar || p.address?.en || "") : (p.address?.en || p.address?.ar || "");
  return [govLabel, distLabel, streetLabel].filter((x) => x && x.trim().length > 0).join(" — ");
}
