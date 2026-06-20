type Tone = "ember" | "amber" | "sky" | "coral" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  ember: "bg-ember-50 text-ember-600",
  amber: "bg-amber-50 text-amber-500",
  sky: "bg-sky-50 text-sky-500",
  coral: "bg-coral-50 text-coral-500",
  neutral: "bg-graphite-700/5 text-graphite-600",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
