"use client";

import { useEffect, useMemo, useState } from "react";
import { Crosshair, ExternalLink, Loader2, MapPin } from "lucide-react";
import {
  EGYPT_GOVERNORATES_DEFAULT,
  fetchEgyptGovernorates,
  filterGovernorateAreas,
  type EgyptGovernorate,
} from "@/lib/data/egyptLocations";
import { Button } from "@/components/ui/Button";

export interface LocationFieldsValue {
  governorate: string;
  city: string;
  district: string;
  addressAr: string;
  addressEn: string;
  latitude?: number;
  longitude?: number;
}

const fieldCls =
  "h-10 w-full rounded-lg bg-surface-container-low px-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-secondary/50";

const GOV_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  cairo: { lat: 30.0444, lng: 31.2357 },
  giza: { lat: 30.0131, lng: 31.2089 },
  alexandria: { lat: 31.2001, lng: 29.9187 },
  qalyubia: { lat: 30.4591, lng: 31.1786 },
  sharqia: { lat: 30.5877, lng: 31.502 },
  dakahlia: { lat: 31.0409, lng: 31.3785 },
  gharbia: { lat: 30.7865, lng: 31.0004 },
  monufia: { lat: 30.5503, lng: 31.0106 },
  beheira: { lat: 31.042, lng: 30.469 },
  "kafr el sheikh": { lat: 31.1107, lng: 30.9388 },
  damietta: { lat: 31.4175, lng: 31.8144 },
  "port said": { lat: 31.2653, lng: 32.3019 },
  ismailia: { lat: 30.5965, lng: 32.2715 },
  suez: { lat: 29.9668, lng: 32.5498 },
  faiyum: { lat: 29.3084, lng: 30.8428 },
  fayoum: { lat: 29.3084, lng: 30.8428 },
  "beni suef": { lat: 29.0661, lng: 31.0994 },
  minya: { lat: 28.0871, lng: 30.7618 },
  asyut: { lat: 27.1783, lng: 31.1859 },
  sohag: { lat: 26.5591, lng: 31.6957 },
  qena: { lat: 26.1551, lng: 32.716 },
  luxor: { lat: 25.6872, lng: 32.6396 },
  aswan: { lat: 24.0889, lng: 32.8998 },
  "red sea": { lat: 27.2579, lng: 33.8116 },
  "new valley": { lat: 25.439, lng: 30.5586 },
  matrouh: { lat: 31.3543, lng: 27.2373 },
  "north sinai": { lat: 31.1321, lng: 33.8033 },
  "south sinai": { lat: 27.9158, lng: 34.3299 },
};

export function EgyptLocationFields({
  ar,
  value,
  onChange,
  required = false,
  compact = false,
}: {
  ar: boolean;
  value: LocationFieldsValue;
  onChange: (next: LocationFieldsValue) => void;
  required?: boolean;
  compact?: boolean;
}) {
  const [governorates, setGovernorates] = useState<EgyptGovernorate[]>(EGYPT_GOVERNORATES_DEFAULT);
  const [geoBusy, setGeoBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchEgyptGovernorates().then((list) => {
      if (alive) setGovernorates(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const selectedGov = useMemo(() => {
    const q = value.governorate.trim().toLowerCase();
    return governorates.find(
      (g) => g.en.toLowerCase() === q || g.code.toLowerCase() === q || g.ar === value.governorate.trim(),
    );
  }, [governorates, value.governorate]);

  const areas = useMemo(
    () => filterGovernorateAreas(selectedGov, "", "").slice(0, 120),
    [selectedGov],
  );

  async function detectGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        let addrAr = value.addressAr;
        let addrEn = value.addressEn;
        let gov = value.governorate;
        let district = value.district;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ar,en&lat=${lat}&lon=${lng}`,
          );
          if (res.ok) {
            const j = (await res.json()) as {
              display_name?: string;
              address?: Record<string, string>;
            };
            const a = j.address ?? {};
            gov = a.state || a.governorate || gov;
            district = a.suburb || a.neighbourhood || a.city_district || a.town || district;
            if (!addrAr && j.display_name) addrAr = j.display_name;
            if (!addrEn && j.display_name) addrEn = j.display_name;
          }
        } catch {
          /* keep manual address with exact GPS coords */
        } finally {
          onChange({
            ...value,
            governorate: gov,
            district,
            addressAr: addrAr,
            addressEn: addrEn,
            latitude: lat,
            longitude: lng,
          });
          setGeoBusy(false);
        }
      },
      () => {
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <MapPin className="h-3.5 w-3.5" />
          {ar ? "الموقع الجغرافي والعنوان التفصيلي" : "Geographic Location & Detailed Address"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={geoBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            onClick={detectGps}
            disabled={geoBusy}
          >
            {ar ? "تحديد GPS تلقائي" : "Detect GPS"}
          </Button>
          {typeof value.latitude === "number" && typeof value.longitude === "number" && (
            <a
              href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {ar ? "خرائط جوجل" : "Maps"}
            </a>
          )}
        </div>
      </div>

      <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        <select
          className={fieldCls}
          required={required}
          value={value.governorate}
          onChange={(e) => {
            const govName = e.target.value;
            const centroid = GOV_CENTROIDS[govName.toLowerCase()];
            onChange({
              ...value,
              governorate: govName,
              city: govName,
              district: "",
              ...(centroid ? { latitude: centroid.lat, longitude: centroid.lng } : {}),
            });
          }}
        >
          <option value="">{ar ? "-- اختر المحافظة --" : "-- Select Governorate --"}</option>
          {governorates.map((g) => (
            <option key={g.id} value={g.en}>
              {ar ? `${g.ar} (${g.en})` : `${g.en} (${g.ar})`}
            </option>
          ))}
        </select>

        {areas.length > 0 ? (
          <select
            className={fieldCls}
            value={value.district}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
          >
            <option value="">{ar ? "-- المدينة / الحي / المركز --" : "-- City / District --"}</option>
            {areas.map((a) => (
              <option key={a.id} value={ar ? a.ar : a.en}>
                {ar ? `${a.ar} (${a.en})` : `${a.en} (${a.ar})`}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={fieldCls}
            placeholder={ar ? "المدينة / المركز / الحي (مثال: المعادي)" : "City / District"}
            value={value.district}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
          />
        )}
      </div>

      <input
        className={fieldCls}
        required={required}
        placeholder={
          ar
            ? "العنوان التفصيلي بالعربية (الشارع، رقم العقار، الدور، علامة مميزة)..."
            : "Detailed Street Address (Arabic)"
        }
        value={value.addressAr}
        onChange={(e) => onChange({ ...value, addressAr: e.target.value })}
      />

      {!compact && (
        <input
          className={fieldCls}
          dir="ltr"
          placeholder="Detailed Street Address (English - optional)"
          value={value.addressEn}
          onChange={(e) => onChange({ ...value, addressEn: e.target.value })}
        />
      )}

      <div className="grid grid-cols-2 gap-2" dir="ltr">
        <input
          className={`${fieldCls} font-mono text-xs`}
          type="number"
          step="any"
          placeholder="Latitude (e.g. 30.0444)"
          value={value.latitude ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              latitude: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <input
          className={`${fieldCls} font-mono text-xs`}
          type="number"
          step="any"
          placeholder="Longitude (e.g. 31.2357)"
          value={value.longitude ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              longitude: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
    </div>
  );
}
