"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardCheck,
  Gauge,
  OctagonAlert,
  PackageCheck,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Card, CardHeader } from "@/src/components/ui/card";
import { FaultAlert, FaultSeverity, FaultTimelineRow } from "@/src/@types/fault.type";
import { useFaults, useFaultTimeline } from "./queries/useFaultQueries";

const SEVERITY_ORDER: Record<FaultSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_STYLE: Record<FaultSeverity, string> = {
  critical: "bg-coral-50 text-coral-600",
  high: "bg-amber-50 text-amber-600",
  medium: "bg-sky-50 text-sky-600",
  low: "bg-ember-50 text-ember-600",
};

const EMPTY_TIMELINE: FaultTimelineRow[] = [];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortDevice(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function isRecovered(rows: FaultTimelineRow[]) {
  const recent = rows.slice(-40).filter((r) => typeof r.rc_residual === "number");
  if (recent.length < 8) return false;
  const mean = recent.reduce((sum, r) => sum + Math.abs(r.rc_residual ?? 0), 0) / recent.length;
  return mean < 0.08;
}

function statusFor(alert: FaultAlert, watched: Set<string>, verified: Set<string>, recovered: boolean) {
  if (verified.has(alert.id) || (watched.has(alert.id) && recovered)) return "Verified";
  if (watched.has(alert.id)) return "Watching";
  return "Open";
}

function sortAlerts(alerts: FaultAlert[]) {
  return [...alerts].sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severity !== 0) return severity;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

function fallbackParts(alert: FaultAlert) {
  switch (alert.type) {
    case "hardware_alarm":
      return ["Controller interface module", "communication harness", "service laptop"];
    case "compressor_no_effect":
      return ["Refrigerant service kit", "fan inspection kit", "filter set"];
    case "peer_sensor_outlier":
      return ["Temperature sensor", "mounting clip", "calibration kit"];
    case "setpoint_miss":
      return ["Filter set", "refrigerant service kit", "thermal inspection kit"];
    default:
      return ["Filter set", "seal inspection kit"];
  }
}

function fallbackComponent(alert: FaultAlert) {
  switch (alert.type) {
    case "hardware_alarm":
      return "Controller / communications";
    case "compressor_no_effect":
      return "Compressor / fan-coil / refrigerant circuit";
    case "peer_sensor_outlier":
      return "Room temperature sensor";
    case "setpoint_miss":
      return "Envelope / capacity";
    default:
      return "Thermal system";
  }
}

function fallbackAction(alert: FaultAlert) {
  switch (alert.type) {
    case "hardware_alarm":
      return "Read the alarm register, inspect controller wiring, then clear and observe.";
    case "compressor_no_effect":
      return "Inspect compressor operation, fan airflow, filters, and refrigerant pressures first.";
    case "peer_sensor_outlier":
      return "Compare against peer pumps and recalibrate or replace the sensor.";
    case "setpoint_miss":
      return "Check whether preheat was long enough, then inspect capacity, refrigerant, filters, and envelope leakage.";
    default:
      return "Inspect the unit against the residual trace and peer behavior.";
  }
}

function fallbackCause(alert: FaultAlert) {
  switch (alert.type) {
    case "hardware_alarm":
      return "Controller fault or communication error register is active.";
    case "compressor_no_effect":
      return "Running unit is drawing power but delivering weak thermal effect.";
    case "peer_sensor_outlier":
      return "Sensor drift, placement issue, or local airflow bias.";
    case "setpoint_miss":
      return "Extended conditioning could not reach target; likely envelope loss, refrigerant low, or undersizing.";
    default:
      return alert.message;
  }
}

function fallbackEvidenceSummary(alert: FaultAlert) {
  return `${alert.title}. ${alert.message}`;
}

function buildPumpRows(alerts: FaultAlert[]) {
  const byDevice = new Map<string, FaultAlert[]>();
  alerts.forEach((alert) => {
    const existing = byDevice.get(alert.deviceId) ?? [];
    existing.push(alert);
    byDevice.set(alert.deviceId, existing);
  });

  return Array.from(byDevice.entries()).map(([deviceId, deviceAlerts]) => {
    const ordered = sortAlerts(deviceAlerts);
    const current = ordered[0];
    const peerDeviation = Math.max(...deviceAlerts.map((a) => a.evidence.maxPeerDeviationDegC ?? 0));
    const workShare =
      current.type === "compressor_no_effect"
        ? "Loafing"
        : peerDeviation > 0.8
          ? "Uneven"
          : current.severity === "critical"
            ? "Carrying risk"
            : "Balanced";
    return {
      deviceId,
      current,
      alertCount: deviceAlerts.length,
      peerDeviation,
      workShare,
    };
  });
}

function chartRows(rows: FaultTimelineRow[]) {
  return rows.slice(-260).map((row) => ({
    time: formatTime(row.ts),
    residual: row.rc_residual,
    room: row.T_room,
    setpoint: row.setpoint,
    supply: row.T_supply,
    defrost: row.defrost ? 1 : 0,
    fault: row.any_fault_flag ? 1 : 0,
  }));
}

export function TechnicianDashboard() {
  const { data, isLoading } = useFaults("heating");
  const alerts = useMemo(() => sortAlerts(data?.alerts ?? []), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const selected = alerts.find((alert) => alert.id === selectedId) ?? alerts[0];
  const { data: timeline, isLoading: timelineLoading } = useFaultTimeline(selected?.deviceId, "heating");
  const timelineRows = timeline?.rows ?? EMPTY_TIMELINE;
  const recovered = isRecovered(timelineRows);
  const currentStatus = selected ? statusFor(selected, watched, verified, recovered) : "Open";
  const pumpRows = useMemo(() => buildPumpRows(alerts), [alerts]);
  const chartData = useMemo(() => chartRows(timelineRows), [timelineRows]);

  const markPerformed = () => {
    if (!selected) return;
    setWatched((prev) => new Set(prev).add(selected.id));
  };

  const markVerified = () => {
    if (!selected) return;
    setVerified((prev) => new Set(prev).add(selected.id));
  };

  return (
    <>
      <header className="flex items-center justify-between px-2 pb-6">
        <div>
          <h1 className="text-[22px] font-bold text-graphite-900">Technician diagnostics</h1>
          <p className="mt-0.5 text-sm text-graphite-600/80">
            Fault triage, pump evidence, and fix confirmation for today&apos;s service work.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-graphite-700 shadow-panel">
          <Wrench className="h-4 w-4 text-coral-500" />
          Field Technician
        </div>
      </header>

      <main className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-4">
          <RiskTile icon={OctagonAlert} label="Critical" value={data?.summary.critical_count ?? 0} tone="critical" />
          <RiskTile icon={Gauge} label="High risk" value={data?.summary.high_count ?? 0} tone="high" />
          <RiskTile icon={ClipboardCheck} label="Watching" value={watched.size} tone="medium" />
          <RiskTile icon={ShieldCheck} label="Verified" value={verified.size} tone="low" />
        </div>

        <div className="grid grid-cols-[360px_1fr] gap-5">
          <Card className="min-h-[650px]">
            <CardHeader
              title="Fault inbox"
              subtitle={isLoading ? "Loading faults..." : `${alerts.length} grouped incidents`}
            />
            <div className="flex max-h-[590px] flex-col gap-2 overflow-y-auto pr-1">
              {!isLoading && alerts.length === 0 && (
                <p className="py-4 text-sm text-graphite-600/70">No active fault alerts.</p>
              )}
              {alerts.map((alert) => {
                const active = selected?.id === alert.id;
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedId(alert.id)}
                    className={`border p-3 text-left transition ${
                      active
                        ? "border-coral-500 bg-coral-50"
                        : "border-line bg-white hover:border-graphite-300"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${SEVERITY_STYLE[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs tabular text-graphite-600/70">
                        {Math.round((alert.confidence ?? 0.72) * 100)}%
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-graphite-900">{alert.title}</p>
                    <p className="mt-1 text-xs leading-4 text-graphite-600/75">
                      {alert.evidenceSummary ?? fallbackEvidenceSummary(alert)}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-graphite-600">
                      Pump {shortDevice(alert.deviceId)} · {formatTime(alert.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader
                title={selected ? selected.title : "Fault evidence"}
                subtitle={selected ? `Pump ${shortDevice(selected.deviceId)} · ${currentStatus}` : "Select a fault"}
              />
              {selected ? (
                <div className="grid grid-cols-[1fr_300px] gap-5">
                  <div>
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      <EvidenceMetric label="Likely cause" value={selected.likelyCause ?? fallbackCause(selected)} />
                      <EvidenceMetric label="Component" value={selected.probableComponent ?? fallbackComponent(selected)} />
                      <EvidenceMetric
                        label="Confidence"
                        value={`${Math.round((selected.confidence ?? 0.72) * 100)}%`}
                      />
                    </div>
                    <div className="h-[290px] border border-line bg-white p-3">
                      {timelineLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-graphite-600/70">
                          Loading timeline...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                            <CartesianGrid stroke="#E4E6EA" strokeDasharray="3 3" />
                            <XAxis dataKey="time" hide />
                            <YAxis yAxisId="temp" tick={{ fontSize: 11 }} stroke="#5b6470" />
                            <YAxis yAxisId="residual" orientation="right" tick={{ fontSize: 11 }} stroke="#ff6148" />
                            <Tooltip />
                            <Area
                              yAxisId="temp"
                              dataKey="defrost"
                              fill="#e7f0f7"
                              stroke="transparent"
                              name="Defrost marker"
                            />
                            <Line yAxisId="temp" type="monotone" dataKey="room" stroke="#19567b" dot={false} name="Room" />
                            <Line yAxisId="temp" type="monotone" dataKey="setpoint" stroke="#1fa971" dot={false} name="Setpoint" />
                            <Line yAxisId="temp" type="monotone" dataKey="supply" stroke="#8f8f9d" dot={false} name="Supply" />
                            <Line
                              yAxisId="residual"
                              type="monotone"
                              dataKey="residual"
                              stroke="#f24227"
                              strokeWidth={2}
                              dot={false}
                              name="Residual"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <aside className="flex flex-col gap-3">
                    <div className="border border-line bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-graphite-900">
                        <PackageCheck className="h-4 w-4 text-coral-500" />
                        Parts to pick
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(selected.partsToPick ?? fallbackParts(selected)).map((part) => (
                          <span key={part} className="bg-white px-2 py-1 text-xs font-medium text-graphite-700">
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border border-line bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-graphite-900">Recommended action</p>
                      <p className="mt-2 text-sm leading-5 text-graphite-600">
                        {selected.recommendedAction ?? fallbackAction(selected)}
                      </p>
                    </div>
                    <div className="border border-line bg-white p-4">
                      <p className="text-sm font-semibold text-graphite-900">Resolve and confirm</p>
                      <p className="mt-2 text-sm leading-5 text-graphite-600">
                        {currentStatus === "Verified"
                          ? "Residual has returned near baseline for the available trace."
                          : currentStatus === "Watching"
                            ? "Repair logged. Watching residual recovery against baseline."
                            : "Log the fix, then watch the residual trace before closing."}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={markPerformed}
                          className="bg-graphite-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Mark fix performed
                        </button>
                        <button
                          onClick={markVerified}
                          className="border border-line px-3 py-2 text-xs font-semibold text-graphite-700"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              ) : (
                <p className="py-8 text-sm text-graphite-600/70">No fault selected.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Pump health" subtitle={`${pumpRows.length} pumps with active evidence`} />
              <div className="overflow-hidden border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-graphite-600">
                    <tr>
                      <th className="px-3 py-2">Pump</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Work share</th>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {pumpRows.map((row) => {
                      const active = selected?.deviceId === row.deviceId;
                      return (
                        <tr
                          key={row.deviceId}
                          className={active ? "bg-coral-50/60" : "bg-white"}
                          onClick={() => setSelectedId(row.current.id)}
                        >
                          <td className="px-3 py-3 font-semibold text-graphite-900">{shortDevice(row.deviceId)}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${SEVERITY_STYLE[row.current.severity]}`}>
                              {row.current.severity}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-graphite-700">{row.workShare}</td>
                          <td className="px-3 py-3 text-graphite-700">
                            {row.current.probableComponent ?? fallbackComponent(row.current)}
                          </td>
                          <td className="px-3 py-3 text-graphite-600">
                            {row.current.recommendedAction ?? fallbackAction(row.current)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function RiskTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof OctagonAlert;
  label: string;
  value: number;
  tone: FaultSeverity;
}) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase text-graphite-600/70">{label}</p>
        <p className="mt-1 tabular text-3xl font-semibold text-graphite-900">{value}</p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center ${SEVERITY_STYLE[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase text-graphite-600/60">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-graphite-900">{value}</p>
    </div>
  );
}
