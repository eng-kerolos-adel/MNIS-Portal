"use client";

import {
  fetchAndActivate,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
} from "firebase/remote-config";
import { getFirebaseApp } from "./client";

export interface PortalRemoteConfig {
  maintenanceMode: boolean;
  maintenanceMessageAr: string;
  maintenanceMessageEn: string;
  minSupportedAppVersion: string;
  aiHealthAssistantEnabled: boolean;
  aiGeminiModel: string;
  realtimeQueueSyncEnabled: boolean;
  emergencyQrTtlMinutes: number;
}

export const DEFAULT_PORTAL_REMOTE_CONFIG: PortalRemoteConfig = {
  maintenanceMode: false,
  maintenanceMessageAr: "جاري إجراء صيانة دورية للمنظومة، نعود خلال دقائق.",
  maintenanceMessageEn: "Scheduled system maintenance in progress. We will be back shortly.",
  minSupportedAppVersion: "1.0.0",
  aiHealthAssistantEnabled: true,
  aiGeminiModel: "gemini-3.8-flash",
  realtimeQueueSyncEnabled: true,
  emergencyQrTtlMinutes: 15,
};

let cachedConfig: PortalRemoteConfig | null = null;
let inflight: Promise<PortalRemoteConfig> | null = null;

export async function getPortalRemoteConfig(forceRefresh = false): Promise<PortalRemoteConfig> {
  if (typeof window === "undefined") return DEFAULT_PORTAL_REMOTE_CONFIG;
  if (cachedConfig && !forceRefresh) return cachedConfig;
  if (inflight && !forceRefresh) return inflight;

  inflight = (async () => {
    const app = getFirebaseApp();
    if (!app) return DEFAULT_PORTAL_REMOTE_CONFIG;
    try {
      const rc = getRemoteConfig(app);
      rc.settings.minimumFetchIntervalMillis =
        process.env.NODE_ENV === "production" ? 3_600_000 : 60_000;
      rc.defaultConfig = {
        maintenance_mode: DEFAULT_PORTAL_REMOTE_CONFIG.maintenanceMode,
        maintenance_message_ar: DEFAULT_PORTAL_REMOTE_CONFIG.maintenanceMessageAr,
        maintenance_message_en: DEFAULT_PORTAL_REMOTE_CONFIG.maintenanceMessageEn,
        min_supported_app_version: DEFAULT_PORTAL_REMOTE_CONFIG.minSupportedAppVersion,
        ai_health_assistant_enabled: DEFAULT_PORTAL_REMOTE_CONFIG.aiHealthAssistantEnabled,
        ai_gemini_model: DEFAULT_PORTAL_REMOTE_CONFIG.aiGeminiModel,
        realtime_queue_sync_enabled: DEFAULT_PORTAL_REMOTE_CONFIG.realtimeQueueSyncEnabled,
        emergency_qr_ttl_minutes: DEFAULT_PORTAL_REMOTE_CONFIG.emergencyQrTtlMinutes,
      };
      await fetchAndActivate(rc);
      const resolved: PortalRemoteConfig = {
        maintenanceMode: getBoolean(rc, "maintenance_mode"),
        maintenanceMessageAr:
          getString(rc, "maintenance_message_ar") || DEFAULT_PORTAL_REMOTE_CONFIG.maintenanceMessageAr,
        maintenanceMessageEn:
          getString(rc, "maintenance_message_en") || DEFAULT_PORTAL_REMOTE_CONFIG.maintenanceMessageEn,
        minSupportedAppVersion:
          getString(rc, "min_supported_app_version") || DEFAULT_PORTAL_REMOTE_CONFIG.minSupportedAppVersion,
        aiHealthAssistantEnabled: getBoolean(rc, "ai_health_assistant_enabled"),
        aiGeminiModel:
          getString(rc, "ai_gemini_model") || DEFAULT_PORTAL_REMOTE_CONFIG.aiGeminiModel,
        realtimeQueueSyncEnabled: getBoolean(rc, "realtime_queue_sync_enabled"),
        emergencyQrTtlMinutes:
          getNumber(rc, "emergency_qr_ttl_minutes") || DEFAULT_PORTAL_REMOTE_CONFIG.emergencyQrTtlMinutes,
      };
      cachedConfig = resolved;
      return resolved;
    } catch {
      return DEFAULT_PORTAL_REMOTE_CONFIG;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
