"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/src/layout/widgets/sidebar";
import { AlertTriangle, Info, OctagonAlert, Check } from "lucide-react";
import { ALERTS, AlertSeverity } from "@/src/_lib/constant/mock-alerts";
import { DetailTopbar } from "@/src/shared/detail-topbar";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { StatusBadge } from "@/src/shared/status-badge";

const FILTERS: { value: AlertSeverity | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const SEVERITY_META: Record<
  AlertSeverity,
  { rail: "red" | "amber" | "blue"; tone: "critical" | "warning" | "info"; icon: typeof AlertTriangle; iconBg: string; iconColor: string }
> = {
  critical: { rail: "red", tone: "critical", icon: OctagonAlert, iconBg: "bg-red-50", iconColor: "text-red-500" },
  warning: { rail: "amber", tone: "warning", icon: AlertTriangle, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  info: { rail: "blue", tone: "info", icon: Info, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
};

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
  const unacknowledged = visible.filter((a) => !a.acknowledged);
  const acknowledged = visible.filter((a) => a.acknowledged);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex-1">
        <DetailTopbar
          backHref="/"
          backLabel="Dashboard"
          title="Alerts"
          subtitle={`${counts.all} total · ${counts.critical} critical needing attention`}
        />

        <main className="flex flex-col gap-5 px-8 pb-8 pt-5">
          <div className="flex gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-100"
                }`}
              >
                {label}
                {value !== "all" && (
                  <span className="ml-1.5 opacity-60">{counts[value]}</span>
                )}
              </button>
            ))}
          </div>

          {unacknowledged.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Needs attention
              </h2>
              <div className="flex flex-col gap-3">
                {unacknowledged.map((alert) => {
                  const meta = SEVERITY_META[alert.severity];
                  const Icon = meta.icon;
                  return (
                    <StatusRailRow key={alert.id} tone={meta.rail}>
                      <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3.5">
                        <div className="flex gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                          >
                            <Icon size={16} className={meta.iconColor} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {alert.title}
                              </p>
                              <StatusBadge tone={meta.tone} label={alert.severity} />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {alert.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {alert.building} · {alert.zone}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs text-slate-400">
                            {alert.timestamp}
                          </span>
                          <button className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                            <Check size={12} />
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    </StatusRailRow>
                  );
                })}
              </div>
            </section>
          )}

          {acknowledged.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Resolved
              </h2>
              <div className="flex flex-col gap-3">
                {acknowledged.map((alert) => {
                  const meta = SEVERITY_META[alert.severity];
                  const Icon = meta.icon;
                  return (
                    <StatusRailRow key={alert.id} tone="emerald">
                      <div className="flex items-start justify-between gap-4 rounded-xl px-4 py-3 opacity-60">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <Icon size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {alert.title}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-400">
                              {alert.building} · {alert.zone}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {alert.timestamp}
                        </span>
                      </div>
                    </StatusRailRow>
                  );
                })}
              </div>
            </section>
          )}

          {visible.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm text-slate-400">
                No {filter} alerts right now.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
