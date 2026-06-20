"use client";

import { useMemo } from "react";
import { Thermometer, Plus } from "lucide-react";
import Link from "next/link";
import { SCHEDULE, ScheduleStatus } from "@/src/_lib/constant/mock-schedule";
import { DetailTopbar } from "@/src/shared/detail-topbar";
import { Sidebar } from "@/src/layout/widgets/sidebar";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { StatusBadge } from "@/src/shared/status-badge";

const STATUS_META: Record<ScheduleStatus, { rail: "emerald" | "amber" | "slate"; tone: "heating" | "scheduled" | "idle"; label: string }> = {
  heating: { rail: "emerald", tone: "heating", label: "Heating" },
  scheduled: { rail: "amber", tone: "scheduled", label: "Scheduled" },
  idle: { rail: "slate", tone: "idle", label: "Idle" },
};

export default function SchedulePage() {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof SCHEDULE>();
    for (const entry of SCHEDULE) {
      const list = map.get(entry.day) ?? [];
      list.push(entry);
      map.set(entry.day, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex-1">
        <DetailTopbar
          backHref="/"
          backLabel="Dashboard"
          title="Schedule"
          subtitle={`${SCHEDULE.length} sessions across the next 7 days`}
          actions={
            <button className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800">
              <Plus size={15} />
              New session
            </button>
          }
        />

        <main className="flex flex-col gap-6 px-8 pb-8 pt-5">
          {grouped.map(([day, entries]) => (
            <section key={day}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{day}</h2>
                <span className="text-xs text-slate-400">{entries[0].date}</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-2">
                <div className="flex flex-col gap-1">
                  {entries.map((entry) => {
                    const meta = STATUS_META[entry.status];
                    return (
                      <Link
                        key={entry.id}
                        href={`/buildings/${encodeURIComponent(entry.building)}`}
                      >
                        <StatusRailRow tone={meta.rail} className="rounded-xl px-3 py-3 hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 shrink-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {entry.time}
                                </p>
                                {entry.countdown && (
                                  <p className="text-xs text-slate-400">{entry.countdown}</p>
                                )}
                              </div>
                              <div className="h-8 w-px bg-slate-100" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {entry.hall}
                                  <span className="ml-1.5 font-normal text-slate-400">
                                    · {entry.building}
                                  </span>
                                </p>
                                <p className="text-sm text-slate-500">{entry.lecture}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-sm text-slate-500">
                                <Thermometer size={14} />
                                {entry.temperature}°C
                              </span>
                              <StatusBadge tone={meta.tone} label={meta.label} />
                            </div>
                          </div>
                        </StatusRailRow>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
