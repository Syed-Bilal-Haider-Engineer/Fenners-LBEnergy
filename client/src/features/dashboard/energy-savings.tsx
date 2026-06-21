"use client";

import { useMemo } from "react";
import { Zap, Euro, Leaf, ShieldCheck, Info } from "lucide-react";
import { AppTopbar } from "@/src/shared/app-topbar";
import { Card, CardHeader } from "@/src/components/ui/card";
import { EnergyChart } from "@/src/features/dashboard/energy-chart";
import { DATA_WINDOWS, useFilters } from "@/src/features/dashboard/filters/filters-context";
import { useLocations } from "@/src/features/dashboard/locations/locations-context";

// Per full heating week, for the 4-pump demo campus (outputs/backtest_heating.csv).
const BASE = { kwh: 558, preheatEur: 167, co2T: 0.223 };
// Failure-prevention savings are MODELED, not measured — clearly labelled below.
const PREVENTED_CRITICAL_PER_WEEK = 2; // critical incidents caught before hard failure
const EUR_PER_INCIDENT = 750; // assumption: after-hours call-out + expedited parts + lost room-hours
const HEATING_DAYS = 7;

function overlapDays(from: string, to: string, w: { from: string; to: string }) {
  const a = from > w.from ? from : w.from;
  const b = to < w.to ? to : w.to;
  if (a > b) return 0;
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86_400_000) + 1;
}

export function EnergySavings() {
  const { range } = useFilters();
  const { selected } = useLocations();

  const m = useMemo(() => {
    const heatDays = overlapDays(range.from, range.to, DATA_WINDOWS[0]);
    const scaleDays = heatDays / HEATING_DAYS;
    const scaleUnits = selected.units / 4;
    const f = scaleDays * scaleUnits;

    const kwh = BASE.kwh * f;
    const preheatEur = BASE.preheatEur * f;
    const co2T = BASE.co2T * f;
    const prevented = Math.round(PREVENTED_CRITICAL_PER_WEEK * f);
    const failureEur = prevented * EUR_PER_INCIDENT;
    return {
      hasData: heatDays > 0,
      kwh,
      preheatEur,
      co2T,
      prevented,
      failureEur,
      totalEur: preheatEur + failureEur,
    };
  }, [range, selected]);

  const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
  const kwh = (n: number) => `${Math.round(n).toLocaleString("en-US")}`;

  return (
    <>
      <AppTopbar title="Energy & Savings" subtitle="Consumption, money saved, and avoided emissions" />

      {!m.hasData ? (
        <Card className="text-sm text-graphite-600">
          No energy/model data in the selected date range. Use the <strong>Heating week</strong> preset
          in the date picker to see the savings breakdown.
        </Card>
      ) : (
        <main className="flex flex-col gap-5">
          {/* Headline KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Kpi icon={Zap} tone="ember" label="Energy Saved" value={kwh(m.kwh)} unit="kWh" />
            <Kpi icon={Euro} tone="sky" label="Total Cost Saved" value={eur(m.totalEur)} />
            <Kpi icon={Leaf} tone="ember" label="CO₂ Avoided" value={m.co2T.toFixed(2)} unit="t" />
          </div>

          {/* Two-stream savings breakdown */}
          <Card>
            <CardHeader
              title="Where the savings come from"
              subtitle="Two independent streams — measured and modeled"
            />
            <div className="grid grid-cols-2 gap-4">
              {/* Stream 1 — measured */}
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
                    <Zap className="h-4 w-4 text-ember-600" /> Preheat optimization
                  </span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-600">
                    Measured
                  </span>
                </div>
                <p className="tabular text-2xl font-semibold text-graphite-900">{eur(m.preheatEur)}</p>
                <p className="mt-1 text-xs text-graphite-600/80">
                  {kwh(m.kwh)} kWh of preheat-window electricity avoided vs. blind preheat — the cheap
                  hot-water coil starts early so the expensive electric boost never fires (~71%).
                </p>
                <p className="mt-2 text-[11px] text-graphite-600/55">
                  Source: model backtest (B1 vs B3), preheat window only.
                </p>
              </div>

              {/* Stream 2 — modeled */}
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
                    <ShieldCheck className="h-4 w-4 text-coral-500" /> Avoided failure cost
                  </span>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                    Estimate
                  </span>
                </div>
                <p className="tabular text-2xl font-semibold text-graphite-900">{eur(m.failureEur)}</p>
                <p className="mt-1 text-xs text-graphite-600/80">
                  {m.prevented} critical issue{m.prevented === 1 ? "" : "s"} caught early by anomaly
                  detection, before a hard failure and an emergency call-out.
                </p>
                <p className="mt-2 flex items-start gap-1 text-[11px] text-graphite-600/55">
                  <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Assumption: {m.prevented} × €{EUR_PER_INCIDENT}/incident (after-hours call-out +
                  expedited parts + lost room-hours). Not a measured figure.
                </p>
              </div>
            </div>
          </Card>

          {/* Consumption chart */}
          <EnergyChart />
        </main>
      )}
    </>
  );
}

function Kpi({
  icon: Icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: typeof Zap;
  tone: "ember" | "sky";
  label: string;
  value: string;
  unit?: string;
}) {
  const toneCls = tone === "ember" ? "bg-ember-50 text-ember-600" : "bg-sky-50 text-sky-500";
  return (
    <Card className="flex items-start gap-3.5">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[13px] text-graphite-600/80">{label}</p>
        <p className="tabular mt-0.5 text-[22px] font-semibold leading-none text-graphite-900">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-graphite-600/70">{unit}</span>}
        </p>
      </div>
    </Card>
  );
}
