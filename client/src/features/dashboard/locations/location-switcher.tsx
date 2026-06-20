"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Plus, Check, Minus, X } from "lucide-react";
import { useLocations } from "./locations-context";

const clampUnits = (v: number) => Math.min(50, Math.max(1, Math.round(v || 1)));

export function LocationSwitcher() {
  const { locations, selected, setSelectedId, addLocation, removeLocation } = useLocations();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [units, setUnits] = useState(4);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setConfirmId(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit() {
    if (!name.trim()) return;
    addLocation(name, units);
    setName("");
    setUnits(4);
    setAdding(false);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-graphite-900 shadow-panel transition hover:bg-canvas dark:bg-graphite-800"
      >
        <MapPin className="h-4 w-4 text-coral-500" />
        {selected.name}
        <ChevronDown className="h-4 w-4 text-graphite-600" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-line bg-white shadow-lg dark:bg-graphite-800">
          <ul className="max-h-64 overflow-y-auto py-1">
            {locations.map((loc) => {
              const active = loc.id === selected.id;

              if (confirmId === loc.id) {
                return (
                  <li
                    key={loc.id}
                    className="flex items-center justify-between gap-2 bg-coral-50 px-3 py-2 text-sm dark:bg-graphite-700"
                  >
                    <span className="text-graphite-900">
                      Delete <strong className="font-bold">{loc.name}</strong>?
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          removeLocation(loc.id);
                          setConfirmId(null);
                        }}
                        className="bg-coral-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-coral-600"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="border border-line px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-graphite-600 transition-colors hover:text-graphite-900"
                      >
                        Cancel
                      </button>
                    </span>
                  </li>
                );
              }

              return (
                <li key={loc.id} className="flex items-center hover:bg-canvas">
                  <button
                    onClick={() => {
                      setSelectedId(loc.id);
                      setOpen(false);
                    }}
                    className="flex flex-1 items-center justify-between px-3 py-2 text-left text-sm"
                  >
                    <span className="flex items-center gap-2 text-graphite-900">
                      {active ? (
                        <Check className="h-4 w-4 text-coral-500" />
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                      {loc.name}
                    </span>
                    <span className="text-xs text-graphite-600">{loc.units} units</span>
                  </button>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove ${loc.name}`}
                      onClick={() => setConfirmId(loc.id)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-graphite-600/50 transition-colors hover:text-coral-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line p-2">
            {!adding ? (
              <button
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-coral-500 hover:bg-canvas"
              >
                <Plus className="h-4 w-4" />
                Add location
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Location name"
                  className="rounded-md border border-line bg-white px-2.5 py-2 text-sm text-graphite-900 outline-none placeholder:text-graphite-600/40 focus:border-coral-500 dark:bg-graphite-700"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Decrease units"
                      onClick={() => setUnits((u) => clampUnits(u - 1))}
                      className="flex h-8 w-8 items-center justify-center border border-line text-graphite-900 hover:border-coral-500 hover:text-coral-500"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      value={units}
                      min={1}
                      max={50}
                      onChange={(e) => setUnits(clampUnits(Number(e.target.value)))}
                      className="tabular w-12 border border-line bg-white px-1 py-1.5 text-center text-sm font-bold text-graphite-900 outline-none dark:bg-graphite-700"
                      aria-label="Number of heat pump units"
                    />
                    <button
                      type="button"
                      aria-label="Increase units"
                      onClick={() => setUnits((u) => clampUnits(u + 1))}
                      className="flex h-8 w-8 items-center justify-center border border-line text-graphite-900 hover:border-coral-500 hover:text-coral-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="ml-1 text-xs text-graphite-600">units</span>
                  </div>
                  <button
                    type="button"
                    onClick={submit}
                    className="bg-coral-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-coral-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
