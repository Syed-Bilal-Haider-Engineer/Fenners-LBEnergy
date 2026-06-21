type StatusTone = "active" | "warning" | "critical" | "info" | "idle" | "scheduled" | "heating";

const TONE_STYLES: Record<StatusTone, string> = {
  active: "bg-emerald-50 text-emerald-700",
  heating: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-amber-50 text-amber-700",
  warning: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  idle: "bg-slate-100 text-slate-600 dark:bg-graphite-700 dark:text-graphite-600",
};

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${TONE_STYLES[tone]}`}
    >
      {label}
    </span>
  );
}
