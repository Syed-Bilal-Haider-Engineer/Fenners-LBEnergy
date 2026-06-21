"use client";

import { useMemo } from "react";
import Link from "next/link";
import { OctagonAlert, Gauge, ShieldCheck, Euro, ArrowUpRight, Wrench } from "lucide-react";
import { AppTopbar } from "@/src/shared/app-topbar";
import { Card, CardHeader } from "@/src/components/ui/card";
import { useFaults } from "@/src/features/dashboard/queries/useFaultQueries";
import type { FaultAlert, FaultSeverity } from "@/src/@types/fault.type";

// Manager risk lens: the early-detection evidence behind the "avoided failure" savings.
// Deep triage lives in the technician view — this is the financial/risk summary.
const EUR_PER_INCIDENT = 750; // matches Energy & Savings assumption

const SEVERITY_STYLE: Record<FaultSeverity, string> = {
  critical: "bg-coral-50 text-coral-600",
  high: "bg-amber-50 text-amber-600",
  medium: "bg-sky-50 text-sky-600",
  low: "bg-slate-100 text-slate-600 dark:bg-graphite-700 dark:text-graphite-600",
};

function shortDevice(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default function AlertsPage() {
  const { data, isLoading } = useFaults("heating");

  const top = useMemo(() => {
    const order: Record<FaultSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...(data?.alerts ?? [])]
      .sort((a, b) => order[a.severity] - order[b.severity] || (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 8);
  }, [data]);

  const critical = data?.summary.critical_count ?? 0;
  const high = data?.summary.high_count ?? 0;
  const caughtEarly = critical; // critical issues flagged before a hard failure
  const exposureAvoided = caughtEarly * EUR_PER_INCIDENT;

  return (
    <>
      <AppTopbar title="Alerts" subtitle="Early-detection risk & financial exposure" />

      <main className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-4">
          <RiskKpi icon={OctagonAlert} tone="critical" label="Critical" value={isLoading ? "…" : `${critical}`} />
          <RiskKpi icon={Gauge} tone="high" label="High risk" value={isLoading ? "…" : `${high}`} />
          <RiskKpi icon={ShieldCheck} tone="low" label="Caught early" value={isLoading ? "…" : `${caughtEarly}`} />
          <RiskKpi
            icon={Euro}
            tone="medium"
            label="Est. exposure avoided"
            value={isLoading ? "…" : `€${exposureAvoided.toLocaleString("en-US")}`}
          />
        </div>

        <Card>
          <CardHeader
            title="Top incidents"
            subtitle="Ranked by severity and model confidence"
            action={
              <Link
                href="/dashboard?role=technician"
                className="inline-flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700"
              >
                <Wrench className="h-3.5 w-3.5" /> Open technician triage
              </Link>
            }
          />
          <div className="flex flex-col gap-2">
            {isLoading && <p className="py-4 text-sm text-graphite-600/70">Loading incidents…</p>}
            {!isLoading && top.length === 0 && (
              <p className="py-4 text-sm text-graphite-600/70">No active incidents.</p>
            )}
            {top.map((a: FaultAlert) => (
              <Link
                key={a.id}
                href="/dashboard?role=technician"
                className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 transition hover:border-coral-500"
              >
                <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${SEVERITY_STYLE[a.severity]}`}>
                  {a.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-graphite-900">{a.title}</p>
                  <p className="truncate text-xs text-graphite-600/75">
                    Pump {shortDevice(a.deviceId)} · {Math.round((a.confidence ?? 0.72) * 100)}% confidence
                  </p>
                </div>
                {a.severity === "critical" && (
                  <span className="flex-shrink-0 text-xs font-medium text-graphite-600">
                    ~€{EUR_PER_INCIDENT.toLocaleString("en-US")} exposure
                  </span>
                )}
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-graphite-600/50" />
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-graphite-600/55">
            Exposure is a modeled estimate (€{EUR_PER_INCIDENT}/critical incident) — see Energy &amp; Savings.
          </p>
        </Card>
      </main>
    </>
  );
}

function RiskKpi({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof OctagonAlert;
  tone: FaultSeverity;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase text-graphite-600/70">{label}</p>
        <p className="tabular mt-1 text-2xl font-semibold text-graphite-900">{value}</p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${SEVERITY_STYLE[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
}
