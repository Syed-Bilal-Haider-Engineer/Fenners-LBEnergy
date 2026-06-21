"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DateRange = { from: string; to: string }; // yyyy-mm-dd inclusive

// The two windows where real IHL telemetry / model output exists. Used to tell
// the user honestly when a chosen range has data vs. not.
export const DATA_WINDOWS: { id: "heating" | "cooling"; label: string; from: string; to: string }[] = [
  { id: "heating", label: "Heating week", from: "2026-03-30", to: "2026-04-05" },
  { id: "cooling", label: "Cooling week", from: "2026-05-25", to: "2026-05-31" },
];

// Default to the heating week — that's where the demo story lives.
const DEFAULT_RANGE: DateRange = { from: "2026-03-30", to: "2026-04-05" };
const KEY = "lb-date-range";

function daysBetween(a: string, b: string) {
  const ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime();
  return Math.round(ms / 86_400_000) + 1; // inclusive
}

function overlapDays(r: DateRange, w: { from: string; to: string }) {
  const from = r.from > w.from ? r.from : w.from;
  const to = r.to < w.to ? r.to : w.to;
  if (from > to) return 0;
  return daysBetween(from, to);
}

export type Coverage = {
  totalDays: number;
  coveredDays: number;
  fraction: number; // covered / total, 0..1
  window: "heating" | "cooling" | "mixed" | null; // dominant data window in range
};

type Ctx = {
  range: DateRange;
  setRange: (r: DateRange) => void;
  coverage: Coverage;
};

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [range, setRangeState] = useState<DateRange>(DEFAULT_RANGE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DateRange;
        if (parsed?.from && parsed?.to) setRangeState(parsed);
      }
    } catch {}
  }, []);

  function setRange(r: DateRange) {
    const ordered = r.from <= r.to ? r : { from: r.to, to: r.from };
    setRangeState(ordered);
    try {
      localStorage.setItem(KEY, JSON.stringify(ordered));
    } catch {}
  }

  const coverage = useMemo<Coverage>(() => {
    const totalDays = Math.max(1, daysBetween(range.from, range.to));
    const heat = overlapDays(range, DATA_WINDOWS[0]);
    const cool = overlapDays(range, DATA_WINDOWS[1]);
    const coveredDays = heat + cool;
    let window: Coverage["window"] = null;
    if (heat > 0 && cool > 0) window = "mixed";
    else if (heat > 0) window = "heating";
    else if (cool > 0) window = "cooling";
    return { totalDays, coveredDays, fraction: Math.min(1, coveredDays / totalDays), window };
  }, [range]);

  return (
    <FiltersContext.Provider value={{ range, setRange, coverage }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}

export function formatRange(r: DateRange) {
  const fmt = (s: string) =>
    new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(s + "T00:00:00"));
  const year = new Date(r.to + "T00:00:00").getFullYear();
  return `${fmt(r.from)} – ${fmt(r.to)}, ${year}`;
}
