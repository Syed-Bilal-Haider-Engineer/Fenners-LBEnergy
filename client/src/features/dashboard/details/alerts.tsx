import Link from "next/link";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { ALERTS } from "@/src/_lib/constant/mock-alerts";


const SEVERITY_ICON = {
  critical: { icon: OctagonAlert, bg: "bg-red-50", color: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-500" },
  info: { icon: Info, bg: "bg-blue-50", color: "text-blue-500" },
};

export function Alerts() {
  const preview = ALERTS.filter((a) => !a.acknowledged).slice(0, 3);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
        <Link href="/dashboard/alerts" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {preview.map((alert) => {
          const meta = SEVERITY_ICON[alert.severity];
          const Icon = meta.icon;
          return (
            <Link key={alert.id} href="/dashboard/alerts" className="flex items-start gap-3 group">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                <Icon size={15} className={meta.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 group-hover:underline">
                  {alert.title}
                </p>
                <p className="truncate text-xs text-slate-400">{alert.description}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{alert.timestamp}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
