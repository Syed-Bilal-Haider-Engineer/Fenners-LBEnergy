'use client'

import { ScenarioSimulator } from '@/src/features/dashboard/scenario-simulator'
import { DetailTopbar } from '@/src/shared/detail-topbar'

function Page() {
  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Scenarios"
        subtitle="Demo what-if simulator"
      />
      <ScenarioSimulator />
    </>
  )
}

export default Page
