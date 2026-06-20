const FEED = [
  { site: "TUM Campus", metric: "Hall A reached 21°C", time: "2m ago", tone: "ember" as const },
  { site: "Expo Hall A", metric: "−340 kWh today", time: "6m ago", tone: "ember" as const },
  { site: "Event Tent 3", metric: "Predictive start in 8 min", time: "11m ago", tone: "sky" as const },
  { site: "Sports Hall", metric: "Anomaly cleared automatically", time: "18m ago", tone: "amber" as const },
  { site: "Dormitory Area", metric: "−€42 vs manual control", time: "24m ago", tone: "ember" as const },
];

export function LiveFeedPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-graphite-900 px-10 py-10">
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-500 text-sm font-bold text-graphite-950">
            LB
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">ENERGY</span>
        </div>

        <h2 className="mt-12 max-w-sm text-[26px] font-semibold leading-snug text-white">
          A mobile building that thinks for itself.
        </h2>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-mist-400">
          Predictive control, anomaly detection, and savings — visible in real time,
          across every hall and tent on site.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-mist-400/70">Live across sites</p>
        {FEED.map((item, i) => (
          <div
            key={item.site}
            className="flex items-center gap-3 rounded-lg border border-graphite-700 bg-graphite-800/70 px-3.5 py-2.5"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <span
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                item.tone === "ember"
                  ? "bg-ember-500"
                  : item.tone === "amber"
                  ? "bg-amber-500"
                  : "bg-sky-500"
              }`}
            />
            <span className="text-[13px] font-medium text-white">{item.site}</span>
            <span className="text-[13px] text-mist-400">{item.metric}</span>
            <span className="ml-auto flex-shrink-0 text-xs text-mist-400/60">{item.time}</span>
          </div>
        ))}
      </div>

      {/* ambient pulse line motif, echoing the dashboard chart */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 w-full opacity-[0.18]"
        viewBox="0 0 600 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,120 C60,40 120,140 180,80 C240,20 300,130 360,70 C420,10 480,120 540,60 C570,30 600,90 600,90"
          fill="none"
          stroke="#22C55E"
          strokeWidth="2"
          className="pulse-line"
        />
      </svg>
    </div>
  );
}
