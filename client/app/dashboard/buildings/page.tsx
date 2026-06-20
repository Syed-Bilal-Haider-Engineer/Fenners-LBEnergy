'use client'
import BuildingDetailPage from '@/src/features/dashboard/details/buildings/[id]/Builidings'
import React from 'react'

function Page({ params }: { params: { id: string } }) {
   const buildingKey = decodeURIComponent(params.id);
  return (
   <BuildingDetailPage buildingKey={buildingKey}/>
  )
}

export default Page
