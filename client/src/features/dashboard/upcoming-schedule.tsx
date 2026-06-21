import { Badge } from "../../components/ui/badge";
import { Card, CardHeader } from "../../components/ui/card";

interface ScheduleItem {
  time: string;
  duration: string;
  hall: string;
  lecture: string;
  temp: string;
  status: "Heating" | "Scheduled";
  accent: "ember" | "amber";
}

// Times in local CEST; first lecture 06:30 = 04:30 UTC (the real event start).
// Duration column shows the predictive preheat lead. Hall A maps to pump BDAF0E14
// (the faulted unit) — the breadcrumb into Alerts / the technician view.
const ITEMS: ScheduleItem[] = [
  { time: "06:30", duration: "−3.8h lead", hall: "Hall A", lecture: "Mathematics 101 · Pump BDAF0E14", temp: "21°C", status: "Heating", accent: "ember" },
  { time: "09:00", duration: "−4.1h lead", hall: "Hall B", lecture: "Physics 201", temp: "21°C", status: "Heating", accent: "ember" },
  { time: "11:30", duration: "−4.0h lead", hall: "Hall C", lecture: "Engineering Basics", temp: "20°C", status: "Scheduled", accent: "amber" },
  { time: "14:00", duration: "−4.3h lead", hall: "Hall D", lecture: "Thermodynamics", temp: "21°C", status: "Scheduled", accent: "amber" },
];

export function UpcomingSchedule() {
  return (
    <Card>
      <CardHeader
        title="Upcoming Schedule"
        subtitle="Next 24h"
        action={<button className="text-xs font-medium text-ember-600">View all</button>}
      />
      <div className="flex flex-col">
        {ITEMS.map((item, i) => (
          <div
            key={item.hall}
            className={`flex items-center gap-3 border-l-[3px] py-3 pl-3 ${
              item.accent === "ember" ? "border-ember-500" : "border-amber-500"
            } ${i !== ITEMS.length - 1 ? "border-b border-b-line" : ""}`}
          >
            <div className="w-12 flex-shrink-0 text-right">
              <p className="tabular text-[13px] font-semibold text-graphite-900">{item.time}</p>
              <p className="tabular text-[11px] text-graphite-600/60">{item.duration}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-graphite-900">{item.hall}</p>
              <p className="truncate text-xs text-graphite-600/70">{item.lecture}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 text-xs text-graphite-600/80">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2a4 4 0 0 0-4 4v6.5a5 5 0 1 0 8 0V6a4 4 0 0 0-4-4Z" />
              </svg>
              {item.temp}
            </div>
            <Badge tone={item.accent}>{item.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
