"use client";

import { Card, CardHeader } from "../../components/ui/card";
import { useLocations } from "./locations/locations-context";

type Segment = { label: string; value: number; pct: number; color: string };

function Donut({ segments }: { segments: Segment[] }) {
  const radius = 56;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const segments = SEGMENTS.filter((s) => s.pct > 0).map((segment, index, source) => {
    const previousPct = source.slice(0, index).reduce((sum, item) => sum + item.pct, 0);
    return {
      ...segment,
      dash: (segment.pct / 100) * circumference,
      offset: (previousPct / 100) * circumference,
    };
  });

  return (
    <svg viewBox="0 0 140 140" className="h-[150px] w-[150px] -rotate-90">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEF0F3" strokeWidth={stroke} />
      {segments
        .filter((s) => s.pct > 0)
        .map((s) => {
          const dash = (s.pct / 100) * circumference;
          const circle = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return circle;
        })}
    </svg>
  );
}

export function HeatPumpStatus() {
  const { selected } = useLocations();
  const total = selected.units;

  const active = Math.round(total * 0.45);
  const warning = Math.max(0, Math.round(total * 0.1));
  const offline = total >= 12 ? 1 : 0;
  const idle = Math.max(0, total - active - warning - offline);
  const pct = (n: number) => (total ? +((n / total) * 100).toFixed(1) : 0);

  const SEGMENTS: Segment[] = [
    { label: "Active", value: active, pct: pct(active), color: "#1fa971" },
    { label: "Idle", value: idle, pct: pct(idle), color: "#19567b" },
    { label: "Warning", value: warning, pct: pct(warning), color: "#f59e0b" },
    { label: "Offline", value: offline, pct: pct(offline), color: "#f24227" },
  ];

  return (
    <Card>
      <CardHeader title="Heat Pump Status" />
      <div className="flex items-center gap-5">
        <div className="relative flex flex-shrink-0 items-center justify-center">
          <Donut segments={SEGMENTS} />
          <div className="absolute flex flex-col items-center">
            <span className="tabular text-2xl font-semibold text-graphite-900">{total}</span>
            <span className="text-[11px] text-graphite-600/60">Total</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {SEGMENTS.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="w-16 text-graphite-900">{s.label}</span>
              <span className="tabular w-6 text-graphite-600/70">{s.value}</span>
              <span className="tabular text-xs text-graphite-600/50">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
