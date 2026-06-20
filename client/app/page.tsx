"use client";

import { useRouter } from "next/navigation";
import { BarChart3, Wrench, ArrowRight } from "lucide-react";
import { setRole, type Role } from "@/src/features/auth/role";

const ROLES: {
  role: Role;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    role: "manager",
    title: "Manager",
    desc: "Overview of energy, cost, CO₂ and buildings.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    role: "technician",
    title: "Technician",
    desc: "Operations, alerts, schedule and unit status.",
    icon: <Wrench className="h-6 w-6" />,
  },
];

export default function Home() {
  const router = useRouter();

  function choose(role: Role) {
    setRole(role);
    router.push("/dashboard");
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: "linear-gradient(135deg, #e6eff6 0%, #ffffff 50%, #ffefeb 100%)" }}
    >
      {/* vivid brand glows — like the lbenergy.tech hero */}
      <span className="glow-ocean" style={{ width: 620, height: 620, left: -220, top: -240, opacity: 0.45 }} />
      <span className="glow-coral" style={{ width: 640, height: 640, right: -220, bottom: -240, opacity: 0.5 }} />
      <span className="glow-coral" style={{ width: 460, height: 460, left: "50%", top: -220, transform: "translateX(-50%)", opacity: 0.22 }} />

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* LB Energy × OnQ collaboration lockup */}
        <div className="mb-14 flex items-center justify-center gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lb-energy-logo-ink.svg" alt="LB Energy" className="h-32 w-auto md:h-44" />
          <span className="text-5xl font-light text-mist-400 md:text-6xl">×</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tool-logo.jpeg" alt="OnQ" className="h-24 w-auto md:h-32" />
        </div>

        <p className="text-gradient text-sm font-bold uppercase tracking-[0.18em]">Welcome</p>
        <h1 className="mt-2 text-4xl font-bold text-graphite-900 md:text-5xl">
          Choose your <span className="text-gradient">ROLE</span>
        </h1>
        <p className="mt-3 text-graphite-600">Open the dashboard that fits your work.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => choose(r.role)}
              className="group flex flex-col items-start gap-4 border border-line bg-white p-6 text-left shadow-panel transition-colors hover:border-coral-500"
            >
              <span className="flex h-12 w-12 items-center justify-center bg-coral-50 text-coral-500 transition-colors group-hover:bg-coral-500 group-hover:text-white">
                {r.icon}
              </span>
              <span>
                <span className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-graphite-900">
                  {r.title}
                  <ArrowRight className="h-4 w-4 text-mist-400 transition-all group-hover:translate-x-1 group-hover:text-coral-500" />
                </span>
                <span className="mt-1 block text-sm text-graphite-600">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-graphite-600/70">
          <span className="spark" style={{ width: 8, height: 8 }} />
          No login required · Demo mode
        </p>
      </div>
    </div>
  );
}
