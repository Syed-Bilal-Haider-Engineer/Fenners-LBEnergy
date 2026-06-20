
import { BUILDINGS } from "@/src/_lib/constant/mock-buildings";
import { DetailTopbar } from "@/src/shared/detail-topbar";
import { StatusBadge } from "@/src/shared/status-badge";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { Thermometer, Zap, TrendingDown, Boxes } from "lucide-react";
import { notFound } from "next/navigation";

const UNIT_META = {
  active: { rail: "emerald", tone: "active", label: "Active" },
  idle: { rail: "slate", tone: "idle", label: "Idle" },
  warning: { rail: "amber", tone: "warning", label: "Warning" },
  offline: { rail: "red", tone: "critical", label: "Offline" },
} as const;

export default function BuildingDetailPage({buildingKey}:{buildingKey:string}) {

  const building = BUILDINGS[buildingKey];

  if (!building) notFound();

  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title={building.name}
        subtitle={building.location}
      />

        <main className="flex flex-col gap-5 px-8 pb-8 pt-5">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingDown size={16} className="text-emerald-500" />}
              label="Energy saved"
              value={`${building.savingsKwh.toLocaleString()} kWh`}
              sub={`${building.savingsPercent}% vs last month`}
            />
            <StatCard
              icon={<Boxes size={16} className="text-blue-500" />}
              label="Units"
              value={`${building.activeUnits} / ${building.totalUnits}`}
              sub="currently active"
            />
            <StatCard
              icon={<Zap size={16} className="text-amber-500" />}
              label="Today's usage"
              value={`${building.units.reduce((sum, u) => sum + u.energyToday, 0).toLocaleString()} kWh`}
              sub="across all units"
            />
            <StatCard
              icon={<Thermometer size={16} className="text-slate-500" />}
              label="Avg temperature"
              value={`${(
                building.units.reduce((sum, u) => sum + u.temperature, 0) / building.units.length
              ).toFixed(1)}°C`}
              sub="building average"
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Units & Halls
            </h2>
            <div className="flex flex-col gap-1">
              {building.units.map((unit) => {
                const meta = UNIT_META[unit.status];
                const onTarget = Math.abs(unit.temperature - unit.targetTemperature) < 0.5;
                return (
                  <StatusRailRow key={unit.id} tone={meta.rail} className="rounded-xl px-3 py-3.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {unit.name}
                          </p>
                          <StatusBadge tone={meta.tone} label={meta.label} />
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {unit.status === "offline"
                            ? "No signal from unit"
                            : `${unit.temperature}°C ${
                                onTarget ? "· at target" : `· target ${unit.targetTemperature}°C`
                              }`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {unit.energyToday > 0 ? `${unit.energyToday} kWh` : "—"}
                        </p>
                        <p className="text-xs text-slate-400">today</p>
                      </div>
                    </div>
                  </StatusRailRow>
                );
              })}
            </div>
          </section>
        </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
