"use client";

import { useMemo, useState } from "react";
import { DetailTopbar } from "@/src/shared/detail-topbar";
import { ALERTS, AlertSeverity } from "@/src/_lib/constant/mock-alerts";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { StatusBadge } from "@/src/shared/status-badge";
import { AlertTriangle, Info, OctagonAlert, Check } from "lucide-react";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

const SEVERITY_META = {
  critical: { rail: "red", tone: "critical", icon: OctagonAlert, iconBg: "bg-red-50", iconColor: "text-red-500" },
  warning: { rail: "amber", tone: "warning", icon: AlertTriangle, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  info: { rail: "blue", tone: "info", icon: Info, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
} as const;

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const counts = useMemo(() => {
    return {
      all: ALERTS.length,
      critical: ALERTS.filter((a) => a.severity === "critical").length,
      warning: ALERTS.filter((a) => a.severity === "warning").length,
      info: ALERTS.filter((a) => a.severity === "info").length,
    };
  }, []);

  const visible = ALERTS.filter((a) => filter === "all" || a.severity === filter);
  const unack = visible.filter((a) => !a.acknowledged);
  const ack = visible.filter((a) => a.acknowledged);

  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Alerts"
        subtitle={`${counts.all} total · ${counts.critical} critical`}
      />

      <main className="flex flex-col gap-5">
        {/* Filters */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
                filter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Unacknowledged */}
        {unack.length > 0 && (
          <section className="rounded-2xl  bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold">Needs attention</h2>

            <div className="flex flex-col gap-3">
              {unack.map((a) => {
                const meta = SEVERITY_META[a.severity];
                const Icon = meta.icon;

                return (
                  <StatusRailRow key={a.id} tone={meta.rail}>
                    <div className="flex justify-between bg-slate-50 p-4 rounded-xl">
                      <div className="flex gap-3">
                        <div className={`h-9 w-9 flex items-center justify-center rounded-full ${meta.iconBg}`}>
                          <Icon size={16} className={meta.iconColor} />
                        </div>

                        <div>
                          <p className="font-semibold text-sm">{a.title}</p>
                          <p className="text-sm text-slate-500">{a.description}</p>
                        </div>
                      </div>

                      <button className="text-xs flex items-center gap-1  px-2 py-1 rounded-md">
                        <Check size={12} />
                        Ack
                      </button>
                    </div>
                  </StatusRailRow>
                );
              })}
            </div>
          </section>
        )}

        {/* Acknowledged */}
        {ack.length > 0 && (
          <section className="rounded-2xl  bg-white p-5 opacity-70">
            <h2 className="mb-4 text-sm font-semibold">Resolved</h2>

            <div className="flex flex-col gap-3">
              {ack.map((a) => (
                <div key={a.id} className="text-sm">
                  {a.title}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}