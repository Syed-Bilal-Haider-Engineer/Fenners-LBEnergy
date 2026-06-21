"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DetailTopbar } from "@/src/shared/detail-topbar";
import { SCHEDULE, type ScheduleEntry } from "@/src/_lib/constant/mock-schedule";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { StatusBadge } from "@/src/shared/status-badge";
import { Thermometer, Plus } from "lucide-react";

const STATUS_META = {
  heating: { rail: "emerald", tone: "heating", label: "Heating" },
  scheduled: { rail: "amber", tone: "scheduled", label: "Scheduled" },
  idle: { rail: "slate", tone: "idle", label: "Idle" },
} as const;

export default function SchedulePage() {
  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const s of SCHEDULE) {
      const arr = map.get(s.day) ?? [];
      arr.push(s);
      map.set(s.day, arr);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Schedule"
        subtitle={`${SCHEDULE.length} sessions`}
        actions={
          <button className="flex items-center gap-1 bg-slate-900 text-white px-3 py-2 rounded-lg">
            <Plus size={14} />
            New
          </button>
        }
      />

      <main className="flex flex-col gap-6">
        {grouped.map(([day, entries]) => (
          <section key={day}>
            <h2 className="text-sm font-semibold mb-3">{day}</h2>

            <div className="bg-surface border rounded-2xl p-2">
              {entries.map((e) => {
                const meta = STATUS_META[e.status];

                return (
                  <Link key={e.id} href={`/dashboard/buildings/${encodeURIComponent(e.building)}`}>
                    <StatusRailRow tone={meta.rail} className="p-3 hover:bg-slate-50 dark:hover:bg-graphite-700 rounded-xl">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">{e.hall}</p>
                          <p className="text-sm text-slate-500">{e.lecture}</p>
                        </div>

                        <div className="flex gap-3 items-center">
                          <span className="text-sm flex items-center gap-1">
                            <Thermometer size={14} />
                            {e.temperature}°C
                          </span>
                          <StatusBadge tone={meta.tone} label={meta.label} />
                        </div>
                      </div>
                    </StatusRailRow>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
