
'use client'
import { getRole } from '@/src/features/auth/role'
import AlertsPage from '@/src/features/dashboard/details/alerts/Alert'
import { TechnicianDashboard } from '@/src/features/dashboard/technician-dashboard'

function Page() {
  if (getRole() === 'technician') {
    return <TechnicianDashboard />
  }

  return (
 <AlertsPage/>
  )
}

export default Page
