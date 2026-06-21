"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Standalone dark-mode toggle. AppTopbar bundles its own copy of the filters,
// so pages with a custom header (e.g. the technician dashboard) use this to get
// the same toggle without pulling in LocationSwitcher / DateRangePicker.
export function ThemeToggle() {
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
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-graphite-600 shadow-panel transition hover:bg-canvas dark:bg-graphite-800"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
