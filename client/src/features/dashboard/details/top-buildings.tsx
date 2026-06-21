import { BUILDINGS } from "@/src/_lib/constant/mock-buildings";
import Link from "next/link";


const buildingList = Object.values(BUILDINGS).sort((a, b) => b.savingsKwh - a.savingsKwh);
const maxSavings = buildingList[0]?.savingsKwh ?? 1;

export function TopBuildings() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Top Buildings by Savings</h2>
        <Link href="/dashboard/buildings" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {buildingList.map((building) => (
          <Link key={building.id} href={`/dashboard/buildings/${encodeURIComponent(building.name)}`}>
            <div className="group">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  {building.name}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {building.savingsKwh.toLocaleString()} kWh
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-graphite-700">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(building.savingsKwh / maxSavings) * 100}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
