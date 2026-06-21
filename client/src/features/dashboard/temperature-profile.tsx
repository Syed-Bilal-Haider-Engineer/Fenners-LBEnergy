"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardHeader } from "@/src/components/ui/card";
import { useFilters, formatRange } from "@/src/features/dashboard/filters/filters-context";
import { useFaults, useFaultTimeline } from "@/src/features/dashboard/queries/useFaultQueries";

const TARGET_POINTS = 220;

function labelFor(ts: string, multiDay: boolean) {
  const d = new Date(ts);
  if (multiDay) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function TemperatureProfile() {
  const { range, coverage } = useFilters();
  const window = coverage.window === "cooling" ? "cooling" : "heating";

  // Reuse the live fault feed to get a real device id, then pull its full timeline.
  const { data: faults } = useFaults(window);
  const deviceId = faults?.alerts?.[0]?.deviceId;
  const { data: timeline, isLoading } = useFaultTimeline(deviceId, window);

  const { rows, stats } = useMemo(() => {
    const all = timeline?.rows ?? [];
    const inRange = all.filter((r) => {
      const day = (r.ts ?? "").slice(0, 10);
      return day >= range.from && day <= range.to && typeof r.T_room === "number";
    });
    const multiDay = range.from !== range.to;
    const step = Math.max(1, Math.ceil(inRange.length / TARGET_POINTS));
    const sampled = inRange
      .filter((_, i) => i % step === 0)
      .map((r) => ({
        label: labelFor(r.ts, multiDay),
        room: r.T_room,
        setpoint: r.setpoint,
        outside: r.T_out,
      }));

    const rooms = inRange.map((r) => r.T_room as number);
    const minT = rooms.length ? Math.min(...rooms) : 0;
    const maxT = rooms.length ? Math.max(...rooms) : 0;
    // % of samples within comfort (>= setpoint - 0.5) while a 21°C setpoint is active
    const active = inRange.filter((r) => (r.setpoint ?? 0) >= 20);
    const comfy = active.filter((r) => (r.T_room as number) >= (r.setpoint as number) - 0.5);
    const comfortPct = active.length ? Math.round((comfy.length / active.length) * 100) : null;

    return { rows: sampled, stats: { minT, maxT, comfortPct } };
  }, [timeline, range]);

  const hasData = rows.length > 0;

  return (
    <Card>
      <CardHeader
        title="Temperature Profile"
        subtitle={`Room vs. setpoint vs. outside · ${formatRange(range)}`}
        action={
          <div className="flex items-center gap-4 text-xs text-graphite-600/80">
            <Legend color="#19567b" label="Room" />
            <Legend color="#1fa971" label="Setpoint" dashed />
            <Legend color="#9AA3AF" label="Outside" />
          </div>
        }
      />

      {!hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-sm text-graphite-600/70">
          {isLoading ? (
            "Loading telemetry…"
          ) : (
            <>
              <p>No telemetry in the selected range.</p>
              <p className="text-xs">Use the <strong>Heating week</strong> or <strong>Cooling week</strong> preset.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-6">
            <Stat label="Room low" value={`${stats.minT.toFixed(1)}°C`} />
            <Stat label="Room high" value={`${stats.maxT.toFixed(1)}°C`} />
            {stats.comfortPct !== null && (
              <Stat label="Time at comfort" value={`${stats.comfortPct}%`} />
            )}
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <ComposedChart data={rows} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="temp-room-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#19567b" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#19567b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E7E9ED" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  minTickGap={48}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}°`}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toFixed(1)}°C`, name]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E7E9ED" }}
                />
                <Area
                  type="monotone"
                  dataKey="room"
                  stroke="#19567b"
                  strokeWidth={2.5}
                  fill="url(#temp-room-fill)"
                  name="Room"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="setpoint"
                  stroke="#1fa971"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Setpoint"
                />
                <Line
                  type="monotone"
                  dataKey="outside"
                  stroke="#9AA3AF"
                  strokeWidth={2}
                  dot={false}
                  name="Outside"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-0.5 w-3.5 rounded-full"
        style={dashed ? { borderTop: `2px dashed ${color}` } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase text-graphite-600/60">{label}</p>
      <p className="tabular text-lg font-semibold text-graphite-900">{value}</p>
    </div>
  );
}
