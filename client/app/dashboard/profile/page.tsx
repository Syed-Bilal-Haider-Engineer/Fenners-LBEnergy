'use client'

import ProfilePage from '@/src/features/dashboard/profile/profile'
import { DetailTopbar } from '@/src/shared/detail-topbar'

function Page() {
  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Profile"
      />

      <ProfilePage />
    </>
  )
}

export default Page