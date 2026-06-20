type RailTone = "emerald" | "amber" | "red" | "blue" | "slate";

const RAIL_COLORS: Record<RailTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  slate: "bg-slate-300",
};

export function StatusRailRow({
  tone,
  children,
  className = "",
}: {
  tone: RailTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-4 ${className}`}>
      <div className={`w-1 shrink-0 rounded-full ${RAIL_COLORS[tone]}`} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
