'use client'

import { DetailTopbar } from '@/src/shared/detail-topbar'

function Page() {
  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Settings"
        subtitle="Demo configuration"
      />
      <main className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-slate-500">
          Operational settings are intentionally static in the demo build.
        </p>
      </main>
    </>
  )
}

export default Page
