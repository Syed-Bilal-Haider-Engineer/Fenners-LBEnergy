"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardHeader } from "../../components/ui/card";

interface EnergyData {
  day: string;
  thisWeek: number;
  lastWeek: number;
}

// Preheat-window electrical energy per morning, from outputs/backtest_heating.csv.
// thisWeek = predictive controller (B3, flat Mode-1 ~32.9 kWh); lastWeek = blind
// preheat baseline (B1) which fires the expensive electric boost. ~71% reduction.
const data: EnergyData[] = [
  { day: "Mon", thisWeek: 33, lastWeek: 53 },
  { day: "Tue", thisWeek: 33, lastWeek: 83 },
  { day: "Wed", thisWeek: 33, lastWeek: 95 },
  { day: "Thu", thisWeek: 33, lastWeek: 157 },
  { day: "Fri", thisWeek: 33, lastWeek: 155 },
  { day: "Sat", thisWeek: 33, lastWeek: 127 },
  { day: "Sun", thisWeek: 33, lastWeek: 117 },
];

export function EnergyChart() {
  return (
    <Card>
      <CardHeader
        title="Energy Consumption"
        subtitle="Preheat-window kWh per morning"
        action={
          <div className="flex items-center gap-4 text-xs text-graphite-600/80">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded-full bg-coral-500" />
              Predictive
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 border-t-2 border-dashed border-gray-400" />
              Blind preheat
            </span>
          </div>
        }
      />

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
          >
            {/* Unique gradient ID (prevents conflicts) */}
            <defs>
              <linearGradient id="energy-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6148" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ff6148" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#E7E9ED"
              vertical={false}
              strokeDasharray="0"
            />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              domain={[0, 180]}
              ticks={[0, 60, 120, 180]}
              tickFormatter={(value) => `${value}`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            {/* Area Fill (This Week) */}
            <Area
              type="monotone"
              dataKey="thisWeek"
              stroke="none"
              fill="url(#energy-chart-gradient)"
            />

            {/* Last Week Line */}
            <Line
              type="monotone"
              dataKey="lastWeek"
              stroke="#9AA3AF"
              strokeWidth={2}
              strokeDasharray="5 6"
              dot={false}
            />

            {/* This Week Line */}
            <Line
              type="monotone"
              dataKey="thisWeek"
              stroke="#ff6148"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                stroke: "#ff6148",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}