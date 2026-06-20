'use client'
import ProfilePage from '@/src/features/dashboard/profile/profile'
import { Sidebar } from '@/src/layout/widgets/sidebar'
import { DetailTopbar } from '@/src/shared/detail-topbar'
function Page() {
  return (
     <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex-1">
        <DetailTopbar
          backHref="/dashboard"
          backLabel="Dashboard"
          title="Profile"
        />
       <ProfilePage/>
        </div>
        </div>
 
  )
}

export default Page
