'use client'

import Link from 'next/link'
import { BUILDINGS } from '@/src/_lib/constant/mock-buildings'
import { DetailTopbar } from '@/src/shared/detail-topbar'

function Page() {
  const buildings = Object.values(BUILDINGS).sort((a, b) => b.savingsKwh - a.savingsKwh)

  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Buildings"
        subtitle={`${buildings.length} demo buildings`}
      />

      <main className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {buildings.map((building) => (
          <Link
            key={building.id}
            href={`/dashboard/buildings/${encodeURIComponent(building.name)}`}
            className="rounded-2xl border border-line bg-surface p-5 shadow-panel transition hover:border-coral-500"
          >
            <p className="text-sm font-semibold text-slate-900">{building.name}</p>
            <p className="mt-1 text-sm text-slate-500">{building.location}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-400">Energy saved</p>
                <p className="tabular text-xl font-semibold text-slate-900">
                  {building.savingsKwh.toLocaleString()} kWh
                </p>
              </div>
              <p className="tabular text-sm font-semibold text-emerald-600">
                {building.savingsPercent}%
              </p>
            </div>
          </Link>
        ))}
      </main>
    </>
  )
}

export default Page
