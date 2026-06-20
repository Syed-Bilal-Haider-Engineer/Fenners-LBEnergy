"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  BarChart3,
  AlertTriangle,
  RotateCcw,
  FileText,
  Settings,
  MapPin,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle, badge: 3 },
  { href: "/dashboard/scenarios", label: "Scenarios", icon: RotateCcw },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col justify-between bg-[#0A0A0A] px-4 py-6 text-white">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-r from-[#0EA56D] to-[#047857] text-white">
            N
          </div>
          <Link href="/dashboard" > <span className="text-sm font-semibold tracking-tight">IB Engergy</span> </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </span>
                {badge ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-emerald-400">
          <MapPin size={14} />
        </div>
        <p className="text-sm font-semibold leading-tight">Building of the Future</p>
        <p className="mt-1 text-xs leading-snug text-white/45">
          Intelligent Control of Mobile Structures
        </p>
      </div>
    </aside>
  );
}
