import { Card, CardHeader } from "../../components/ui/card";

// Per-hall savings sum to the real backtest total (558 kWh). Hall A is the
// visible laggard — its pump (BDAF0E14) is faulted, so it still runs hot and
// saves least. This is the breadcrumb the manager follows into the Alerts card.
const BUILDINGS = [
  { name: "Hall B", kwh: 152 },
  { name: "Hall C", kwh: 148 },
  { name: "Hall D", kwh: 140 },
  { name: "Hall A · Pump BDAF0E14", kwh: 118 },
];

const MAX = BUILDINGS[0].kwh;

export function TopBuildings() {
  return (
    <Card>
      <CardHeader
        title="Top Buildings by Savings"
        action={<button className="text-xs font-medium text-ember-600">View all</button>}
      />
      <div className="flex flex-col gap-3.5">
        {BUILDINGS.map((b) => (
          <div key={b.name}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="text-graphite-900">{b.name}</span>
              <span className="tabular text-graphite-600/70">{b.kwh.toLocaleString()} kWh</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-700/5">
              <div
                className="h-full rounded-full bg-ember-500"
                style={{ width: `${(b.kwh / MAX) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
