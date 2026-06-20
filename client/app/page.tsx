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
    icon: <BarChart3 className="h-8 w-8" />,
  },
  {
    role: "technician",
    title: "Technician",
    desc: "Operations, alerts, schedule and unit status.",
    icon: <Wrench className="h-8 w-8" />,
  },
];

export default function Home() {
  const router = useRouter();

  function choose(role: Role) {
    setRole(role);
    router.push(`/dashboard?role=${role}`);
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: "linear-gradient(135deg, #eef4f9 0%, #ffffff 50%, #fff3f0 100%)" }}
    >
      {/* animated floating orange/blue background (lava-lamp) */}
      <span className="blob blob-ocean anim-a" style={{ width: 540, height: 540, left: "-8%", top: "-14%" }} />
      <span className="blob blob-coral anim-b" style={{ width: 600, height: 600, right: "-10%", bottom: "-16%" }} />
      <span className="blob blob-ember anim-c" style={{ width: 440, height: 440, right: "6%", top: "-12%" }} />
      <span className="blob blob-sky anim-d" style={{ width: 480, height: 480, left: "0%", bottom: "-12%" }} />
      <span className="blob blob-coral anim-c" style={{ width: 360, height: 360, left: "44%", top: "34%", opacity: 0.45 }} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/lb-energy-logo-white.svg"
          alt="LB Energy"
          className="relative z-10 h-16 w-auto"
        />

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
            Intelligent Heat Link
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.1]">
            Mobile Wärme, intelligent gesteuert.
          </h2>
          <p className="mt-4 text-lg font-light text-white/90">
            Betriebskosten mobiler Heizgeräte um <strong className="font-bold">20–30&nbsp;%</strong>{" "}
            senken — bei jederzeit optimalem Raumklima.
          </p>
        </div>

        <div className="relative z-10 h-24" />
      </aside>

      {/* ── Role selection ──────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/product/onq-round-remover.png"
          alt="OnQ controller"
          className="absolute top-12 h-auto w-24 object-contain drop-shadow-lg sm:w-28"
        />

        <div className="w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/lb-energy-logo-ink.svg"
            alt="LB Energy"
            className="mb-8 h-12 w-auto lg:hidden"
          />

          <p className="text-gradient text-sm font-bold uppercase tracking-[0.18em]">
            Willkommen
          </p>
          <h1 className="mt-2 text-4xl font-bold text-graphite-900">
            Wählen Sie Ihre <span className="text-gradient">ROLLE</span>
          </h1>
          <p className="mt-3 text-graphite-600">
            Öffnen Sie das Dashboard, das zu Ihrer Arbeit passt.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => choose(r.role)}
                className="group flex items-center gap-4 border border-line bg-white p-5 text-left shadow-panel transition-colors hover:border-coral-500"
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-coral-50 text-coral-500 transition-colors group-hover:bg-coral-500 group-hover:text-white">
                  {r.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-bold uppercase tracking-wide text-graphite-900">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-graphite-600">{r.desc}</span>
                </span>
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-mist-400 transition-all group-hover:translate-x-1 group-hover:text-coral-500" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-gradient text-base font-bold uppercase tracking-[0.2em]">Welcome</p>
        <h1 className="mt-3 text-5xl font-bold text-graphite-900 md:text-6xl">
          Choose your <span className="text-gradient">ROLE</span>
        </h1>
        <p className="mt-4 text-lg text-graphite-600 md:text-xl">
          Open the dashboard that fits your work.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => choose(r.role)}
              className="group flex flex-col items-center gap-5 border border-line bg-white p-8 text-center shadow-panel transition-colors hover:border-coral-500"
            >
              <span className="flex h-16 w-16 items-center justify-center bg-coral-50 text-coral-500 transition-colors group-hover:bg-coral-500 group-hover:text-white">
                {r.icon}
              </span>
              <span>
                <span className="flex items-center justify-center gap-2 text-2xl font-bold uppercase tracking-wide text-graphite-900">
                  {r.title}
                  <ArrowRight className="h-5 w-5 text-mist-400 transition-all group-hover:translate-x-1 group-hover:text-coral-500" />
                </span>
                <span className="mt-2 block text-base text-graphite-600">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-12 flex items-center justify-center gap-2 text-sm text-graphite-600/70">
          <span className="spark" style={{ width: 10, height: 10 }} />
          No login required · Demo mode
        </p>
      </div>
    </div>
  );
}
