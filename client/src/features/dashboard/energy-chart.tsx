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

const data: EnergyData[] = [
  { day: "Mon", thisWeek: 1450, lastWeek: 2200 },
  { day: "Tue", thisWeek: 1900, lastWeek: 3000 },
  { day: "Wed", thisWeek: 2950, lastWeek: 3650 },
  { day: "Thu", thisWeek: 2550, lastWeek: 3350 },
  { day: "Fri", thisWeek: 2300, lastWeek: 3050 },
  { day: "Sat", thisWeek: 2500, lastWeek: 3200 },
  { day: "Sun", thisWeek: 1500, lastWeek: 2150 },
];

export function EnergyChart() {
  return (
    <Card>
      <CardHeader
        title="Energy Consumption"
        action={
          <div className="flex items-center gap-4 text-xs text-graphite-600/80">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded-full bg-green-500" />
              This Week
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 border-t-2 border-dashed border-gray-400" />
              Last Week
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
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
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
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
              tickFormatter={(value) =>
                value === 0 ? "0" : `${value / 1000}k`
              }
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
              stroke="#22C55E"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                stroke: "#22C55E",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}