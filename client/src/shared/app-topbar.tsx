"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { LocationSwitcher } from "@/src/features/dashboard/locations/location-switcher";
import { DateRangePicker } from "@/src/shared/date-range-picker";

// Shared topbar used on every manager page so the global Location + Date filters
// are always present and persist across tabs.
export function AppTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.theme = next ? "dark" : "light";
    } catch {}
    setDark(next);
  }

  return (
    <header className="mb-6 flex items-start justify-between px-2">
      <div>
        <h1 className="text-[22px] font-bold text-graphite-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-graphite-600/80">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <LocationSwitcher />
        <DateRangePicker />
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          aria-pressed={dark}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-graphite-600 shadow-panel transition hover:bg-canvas dark:bg-graphite-800"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
