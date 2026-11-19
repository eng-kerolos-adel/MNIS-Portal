"use client";

import { useEffect } from "react";

/** Periodically invokes `fn` while the browser tab is visible. */
export function useAutoRefresh(fn: () => void | Promise<void>, intervalMs = 15_000) {
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void fn();
    }, intervalMs);
    return () => clearInterval(id);
  }, [fn, intervalMs]);
}
