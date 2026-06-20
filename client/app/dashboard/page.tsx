'use client'
import { Alerts } from "@/src/features/dashboard/alerts";
import { EnergyChart } from "@/src/features/dashboard/energy-chart";
import { HeatPumpStatus } from "@/src/features/dashboard/heat-pump-status";
import { KpiRow } from "@/src/features/dashboard/kpi-row";
import { ScenarioSimulator } from "@/src/features/dashboard/scenario-simulator";
import { Sidebar } from "@/src/layout/widgets/sidebar";
import { TopBuildings } from "@/src/features/dashboard/top-buildings";
import { Topbar } from "@/src/features/dashboard/topbar";
import { UpcomingSchedule } from "@/src/features/dashboard/upcoming-schedule";


export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="flex flex-col gap-5 px-8 pb-8 pt-5">
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
      </div>
    </div>
  );
}
