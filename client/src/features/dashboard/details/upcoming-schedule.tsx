import Link from "next/link";
import { Thermometer } from "lucide-react";
import { StatusBadge } from "@/src/shared/status-badge";
import { SCHEDULE } from "@/src/_lib/constant/mock-schedule";

export function UpcomingSchedule() {
  const next24h = SCHEDULE.filter((s) => s.day === "Today").slice(0, 4);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Upcoming Schedule</h2>
        <Link href="/dashboard/schedule" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          View all
        </Link>
      </div>
      <p className="mb-4 text-xs text-slate-400">Next 24h</p>

      <div className="flex flex-col">
        {next24h.map((entry, i) => {
          const tone = entry.status === "heating" ? "emerald" : "amber";
          return (
            <Link key={entry.id} href={`/dashboard/buildings/${encodeURIComponent(entry.building)}`}>
              <div className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <div className={`h-2 w-2 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {i < next24h.length - 1 && <div className="mt-1 w-px flex-1 bg-slate-100 dark:bg-graphite-700" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{entry.time}</span>
                    <StatusBadge
                      tone={entry.status === "heating" ? "heating" : "scheduled"}
                      label={entry.status === "heating" ? "Heating" : "Scheduled"}
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-700">{entry.hall}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="truncate">{entry.countdown ?? entry.lecture}</span>
                    <span className="flex items-center gap-0.5">
                      <Thermometer size={11} />
                      {entry.temperature}°C
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
