import { Card, CardHeader } from "../../components/ui/card";

interface AlertItem {
  title: string;
  detail: string;
  time: string;
}

const ALERTS: AlertItem[] = [
  { title: "Heat pump in Hall C", detail: "Temperature not reaching target", time: "5 min ago" },
  { title: "Sensor in Hall D", detail: "Temperature sensor deviation detected", time: "1 h ago" },
  { title: "Maintenance Reminder", detail: "Filter check recommended", time: "3 h ago" },
];

function AlertIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function Alerts() {
  return (
    <Card>
      <CardHeader title="Alerts" action={<button className="text-xs font-medium text-ember-600">View all</button>} />
      <div className="flex flex-col gap-1">
        {ALERTS.map((a, i) => (
          <button
            key={a.title}
            className={`flex items-center gap-3 rounded-lg py-2.5 text-left transition-colors hover:bg-graphite-700/[0.03] ${
              i !== ALERTS.length - 1 ? "border-b border-b-line" : ""
            }`}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500">
              <AlertIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-graphite-900">{a.title}</p>
              <p className="truncate text-xs text-graphite-600/70">{a.detail}</p>
            </div>
            <span className="flex-shrink-0 text-xs text-graphite-600/50">{a.time}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
