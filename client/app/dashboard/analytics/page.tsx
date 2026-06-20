'use client'

import { EnergyChart } from '@/src/features/dashboard/energy-chart'
import { DetailTopbar } from '@/src/shared/detail-topbar'

function Page() {
  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Analytics"
        subtitle="Energy comparison and comfort performance"
      />
      <EnergyChart />
    </>
  )
}

export default Page
