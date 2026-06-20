"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Location = { id: string; name: string; units: number };

const SEED: Location[] = [
  { id: "seed-1", name: "Main Campus", units: 8 },
  { id: "seed-2", name: "Expo Hall A", units: 4 },
];

const KEY = "lb-locations";
const SEL_KEY = "lb-location-selected";
const clampUnits = (v: number) => Math.min(50, Math.max(1, Math.round(v || 1)));

type Ctx = {
  locations: Location[];
  selected: Location;
  setSelectedId: (id: string) => void;
  addLocation: (name: string, units: number) => void;
  removeLocation: (id: string) => void;
};

const LocationsContext = createContext<Ctx | null>(null);

export function LocationsProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>(SEED);
  const [selectedId, setSelectedIdState] = useState<string>(SEED[0].id);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: Location[] = raw ? JSON.parse(raw) : SEED;
      if (list.length) setLocations(list);
      const sel = localStorage.getItem(SEL_KEY);
      if (sel && list.some((l) => l.id === sel)) setSelectedIdState(sel);
      else if (list[0]) setSelectedIdState(list[0].id);
    } catch {}
  }, []);

  // persist list
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(locations));
    } catch {}
  }, [locations]);

  function setSelectedId(id: string) {
    setSelectedIdState(id);
    try {
      localStorage.setItem(SEL_KEY, id);
    } catch {}
  }

  function addLocation(name: string, units: number) {
    const n = name.trim();
    if (!n) return;
    const loc: Location = { id: crypto.randomUUID(), name: n, units: clampUnits(units) };
    setLocations((l) => [...l, loc]);
    setSelectedId(loc.id);
  }

  function removeLocation(id: string) {
    setLocations((l) => {
      if (l.length <= 1) return l; // always keep at least one location
      const next = l.filter((x) => x.id !== id);
      if (id === selectedId && next[0]) setSelectedId(next[0].id);
      return next;
    });
  }

  const selected =
    locations.find((l) => l.id === selectedId) ?? locations[0] ?? SEED[0];

  return (
    <LocationsContext.Provider
      value={{ locations, selected, setSelectedId, addLocation, removeLocation }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const ctx = useContext(LocationsContext);
  if (!ctx) throw new Error("useLocations must be used within LocationsProvider");
  return ctx;
}
