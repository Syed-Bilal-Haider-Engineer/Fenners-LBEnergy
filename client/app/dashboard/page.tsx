"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Alerts } from "@/src/features/dashboard/alerts";
import { EnergyChart } from "@/src/features/dashboard/energy-chart";
import { HeatPumpStatus } from "@/src/features/dashboard/heat-pump-status";
import { KpiRow } from "@/src/features/dashboard/kpi-row";
import { ScenarioSimulator } from "@/src/features/dashboard/scenario-simulator";
import { TopBuildings } from "@/src/features/dashboard/top-buildings";
import { Topbar } from "@/src/features/dashboard/topbar";
import { TechnicianDashboard } from "@/src/features/dashboard/technician-dashboard";
import { UpcomingSchedule } from "@/src/features/dashboard/upcoming-schedule";
import { getRole, setRole, type Role } from "@/src/features/auth/role";

function DashboardContent() {
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const role =
    requestedRole === "manager" || requestedRole === "technician"
      ? (requestedRole as Role)
      : getRole();

  useEffect(() => {
    if (requestedRole === "manager" || requestedRole === "technician") {
      setRole(requestedRole);
    }
  }, [requestedRole]);

  if (role === "technician") {
    return <TechnicianDashboard />;
  }

  return (
    <>
      <Topbar />

      <main className="flex flex-col gap-5">
        <KpiRow />

        <div className="grid grid-cols-[1fr_360px] gap-5">
          <EnergyChart />
          <UpcomingSchedule />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <HeatPumpStatus />
          <TopBuildings />
          <Alerts />
        </div>

        <ScenarioSimulator />
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
