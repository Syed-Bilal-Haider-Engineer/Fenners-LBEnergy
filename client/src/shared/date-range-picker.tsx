"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DATA_WINDOWS,
  formatRange,
  useFilters,
  type DateRange,
} from "@/src/features/dashboard/filters/filters-context";

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function monthGrid(month: Date) {
  const first = startOfMonth(month);
  // Monday-first offset
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateRangePicker() {
  const { range, setRange, coverage } = useFilters();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date(range.from + "T00:00:00")));
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPendingFrom(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(d: Date) {
    const iso = toISO(d);
    if (!pendingFrom) {
      setPendingFrom(iso);
      return;
    }
    const next: DateRange = pendingFrom <= iso ? { from: pendingFrom, to: iso } : { from: iso, to: pendingFrom };
    setRange(next);
    setPendingFrom(null);
    setOpen(false);
  }

  function applyPreset(w: { from: string; to: string }) {
    setRange({ from: w.from, to: w.to });
    setViewMonth(startOfMonth(new Date(w.from + "T00:00:00")));
    setPendingFrom(null);
    setOpen(false);
  }

  function inSelection(iso: string) {
    if (pendingFrom) return iso === pendingFrom;
    return iso >= range.from && iso <= range.to;
  }
  function isEndpoint(iso: string) {
    return iso === range.from || iso === range.to || iso === pendingFrom;
  }
  // Does a given day fall inside a window that has real data?
  function hasData(iso: string) {
    return DATA_WINDOWS.some((w) => iso >= w.from && iso <= w.to);
  }

  const months = [viewMonth, addMonths(viewMonth, 1)];

  const coverageLabel =
    coverage.coveredDays === 0
      ? "No data in range"
      : coverage.fraction >= 1
        ? "Full data coverage"
        : `${coverage.coveredDays}/${coverage.totalDays} days with data`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-graphite-900 shadow-panel transition hover:bg-canvas dark:bg-graphite-800"
      >
        <Calendar className="h-4 w-4 text-graphite-600" />
        {formatRange(range)}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[560px] rounded-lg border border-line bg-white p-4 shadow-lg dark:bg-graphite-800">
          {/* Presets */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {DATA_WINDOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => applyPreset(w)}
                className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-graphite-700 dark:text-graphite-600 hover:border-coral-500 hover:text-coral-600"
              >
                {w.label}
              </button>
            ))}
            <button
              onClick={() => applyPreset({ from: DATA_WINDOWS[0].from, to: DATA_WINDOWS[1].to })}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-graphite-700 dark:text-graphite-600 hover:border-coral-500 hover:text-coral-600"
            >
              All data
            </button>
            <span className="ml-auto text-xs font-medium text-graphite-600/70">{coverageLabel}</span>
          </div>

          {/* Two-month calendar */}
          <div className="flex items-start gap-6">
            {months.map((m, mi) => {
              const cells = monthGrid(m);
              return (
                <div key={mi} className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    {mi === 0 ? (
                      <button
                        onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                        className="text-graphite-600 hover:text-graphite-900"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="text-sm font-semibold text-graphite-900">
                      {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(m)}
                    </span>
                    {mi === 1 ? (
                      <button
                        onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                        className="text-graphite-600 hover:text-graphite-900"
                      >
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                  </div>
                  <div className="mb-1 grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((d) => (
                      <span key={d} className="text-center text-[10px] font-medium text-graphite-600/50">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {cells.map((d, i) => {
                      if (!d) return <span key={i} />;
                      const iso = toISO(d);
                      const selected = inSelection(iso);
                      const endpoint = isEndpoint(iso);
                      const data = hasData(iso);
                      return (
                        <button
                          key={i}
                          onClick={() => pick(d)}
                          className={`relative flex h-8 items-center justify-center text-xs transition ${
                            endpoint
                              ? "bg-coral-500 font-semibold text-white"
                              : selected
                                ? "bg-coral-50 text-graphite-900 dark:bg-coral-500/15"
                                : "text-graphite-700 dark:text-graphite-600 hover:bg-canvas"
                          }`}
                        >
                          {d.getDate()}
                          {data && !endpoint && (
                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-graphite-600/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> days with telemetry &amp; model output
            {pendingFrom && <span className="ml-auto text-coral-600">Pick an end date…</span>}
          </p>
        </div>
      )}
    </div>
  );
}
