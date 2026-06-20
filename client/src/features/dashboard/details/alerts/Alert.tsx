"use client";

import { DetailTopbar } from "@/src/shared/detail-topbar";
import { ALERTS } from "@/src/_lib/constant/mock-alerts";
import { StatusRailRow } from "@/src/shared/status-rail-row";
import { OctagonAlert, Check } from "lucide-react";

export default function AlertsPage() {
  const unack = ALERTS.filter((a) => !a.acknowledged);
  const ack = ALERTS.filter((a) => a.acknowledged);

  return (
    <>
      <DetailTopbar
        backHref="/dashboard"
        backLabel="Dashboard"
        title="Alerts"
        subtitle={`${ALERTS.length} alerts`}
      />

      <main className="flex flex-col gap-5">
        {/* Unacknowledged */}
        {unack.length > 0 && (
          <section className="rounded-2xl bg-white p-5 dark:bg-graphite-800">
            <h2 className="mb-4 text-sm font-semibold text-graphite-900">Needs attention</h2>

            <div className="flex flex-col gap-3">
              {unack.map((a) => (
                <StatusRailRow key={a.id} tone="red">
                  <div className="flex justify-between rounded-xl bg-slate-50 p-4 dark:bg-graphite-700">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-50 text-coral-500">
                        <OctagonAlert size={16} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-graphite-900">{a.title}</p>
                        <p className="text-sm text-graphite-600">{a.description}</p>
                      </div>
                    </div>

                    <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-graphite-600">
                      <Check size={12} />
                      Ack
                    </button>
                  </div>
                </StatusRailRow>
              ))}
            </div>
          </section>
        )}

        {/* Acknowledged */}
        {ack.length > 0 && (
          <section className="rounded-2xl bg-white p-5 opacity-70 dark:bg-graphite-800">
            <h2 className="mb-4 text-sm font-semibold text-graphite-900">Resolved</h2>

            <div className="flex flex-col gap-3">
              {ack.map((a) => (
                <div key={a.id} className="text-sm text-graphite-900">
                  {a.title}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
