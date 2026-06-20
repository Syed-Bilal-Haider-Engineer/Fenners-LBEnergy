"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Sun, ChevronDown } from "lucide-react";
import { getRole, ROLE_LABEL, type Role } from "@/src/features/auth/role";

export function Topbar() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  const label = role ? ROLE_LABEL[role] : "Guest";

  return (
    <header className="flex items-center justify-between px-2 pb-6">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-graphite-900">
          Good morning <span className="text-xl">👋</span>
        </h1>

        <p className="mt-0.5 text-sm text-graphite-600/80">
          Here&rsquo;s what&rsquo;s happening with your buildings today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Range */}
        <button className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-graphite-900 shadow-panel transition hover:bg-slate-50">
          <Calendar className="h-4 w-4 text-graphite-600" />
          May 20 – May 26, 2024
        </button>

        {/* Theme Toggle */}
        <button
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-graphite-600 shadow-panel transition hover:bg-slate-50"
        >
          <Sun className="h-4 w-4" />
        </button>

        {/* Profile Link */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 rounded-lg border border-line bg-white py-1.5 pl-1.5 pr-2.5 shadow-panel transition hover:bg-slate-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-500 text-xs font-bold text-white">
            LB
          </span>

          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-graphite-900">{label}</p>
            <p className="text-[10px] text-graphite-600">LB Energy</p>
          </div>

          <ChevronDown className="h-4 w-4 text-graphite-600" />
        </Link>
      </div>
    </header>
  );
}
