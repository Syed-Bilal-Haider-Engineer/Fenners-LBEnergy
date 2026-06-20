import { Card, CardHeader } from "../../components/ui/card";

const SEGMENTS = [
  { label: "Active", value: 11, pct: 37.9, color: "#22C55E" },
  { label: "Idle", value: 16, pct: 55.2, color: "#3B82F6" },
  { label: "Warning", value: 2, pct: 6.9, color: "#F59E0B" },
  { label: "Offline", value: 0, pct: 0, color: "#EF4444" },
];

function Donut() {
  const radius = 56;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" className="h-[150px] w-[150px] -rotate-90">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEF0F3" strokeWidth={stroke} />
      {SEGMENTS.filter((s) => s.pct > 0).map((s) => {
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
  return (
    <Card>
      <CardHeader title="Heat Pump Status" />
      <div className="flex items-center gap-5">
        <div className="relative flex flex-shrink-0 items-center justify-center">
          <Donut />
          <div className="absolute flex flex-col items-center">
            <span className="tabular text-2xl font-semibold text-graphite-900">29</span>
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
