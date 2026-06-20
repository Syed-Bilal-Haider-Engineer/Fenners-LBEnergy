export interface BuildingUnit {
  id: string;
  name: string;
  status: "active" | "idle" | "warning" | "offline";
  temperature: number;
  targetTemperature: number;
  energyToday: number;
}

export interface BuildingRecord {
  id: string;
  name: string;
  location: string;
  savingsKwh: number;
  savingsPercent: number;
  totalUnits: number;
  activeUnits: number;
  units: BuildingUnit[];
}

export const BUILDINGS: Record<string, BuildingRecord> = {
  "TUM Campus": {
    id: "tum-campus",
    name: "TUM Campus",
    location: "Munich, Garching",
    savingsKwh: 4250,
    savingsPercent: 18,
    totalUnits: 12,
    activeUnits: 9,
    units: [
      { id: "u1", name: "Hall A", status: "active", temperature: 21, targetTemperature: 21, energyToday: 412 },
      { id: "u2", name: "Hall B", status: "active", temperature: 20.8, targetTemperature: 21, energyToday: 398 },
      { id: "u3", name: "Hall C", status: "warning", temperature: 18.2, targetTemperature: 20, energyToday: 356 },
      { id: "u4", name: "Hall D", status: "idle", temperature: 19, targetTemperature: 21, energyToday: 0 },
    ],
  },
  "Expo Hall A": {
    id: "expo-hall-a",
    name: "Expo Hall A",
    location: "Munich, Riem",
    savingsKwh: 3120,
    savingsPercent: 14,
    totalUnits: 6,
    activeUnits: 4,
    units: [
      { id: "u5", name: "Main Floor", status: "active", temperature: 20, targetTemperature: 20, energyToday: 540 },
      { id: "u6", name: "Mezzanine", status: "active", temperature: 19.5, targetTemperature: 20, energyToday: 280 },
    ],
  },
  "Event Tent 3": {
    id: "event-tent-3",
    name: "Event Tent 3",
    location: "Munich, Olympiapark",
    savingsKwh: 2310,
    savingsPercent: 9,
    totalUnits: 4,
    activeUnits: 2,
    units: [
      { id: "u7", name: "North Unit", status: "offline", temperature: 0, targetTemperature: 19, energyToday: 0 },
      { id: "u8", name: "South Unit", status: "active", temperature: 19, targetTemperature: 19, energyToday: 190 },
    ],
  },
  "Sports Hall": {
    id: "sports-hall",
    name: "Sports Hall",
    location: "Munich, Garching",
    savingsKwh: 1870,
    savingsPercent: 11,
    totalUnits: 5,
    activeUnits: 5,
    units: [
      { id: "u9", name: "Main Court", status: "active", temperature: 18, targetTemperature: 18, energyToday: 310 },
    ],
  },
  "Dormitory Area": {
    id: "dormitory-area",
    name: "Dormitory Area",
    location: "Munich, Garching",
    savingsKwh: 990,
    savingsPercent: 6,
    totalUnits: 8,
    activeUnits: 6,
    units: [
      { id: "u10", name: "Block A", status: "active", temperature: 20, targetTemperature: 20, energyToday: 220 },
      { id: "u11", name: "Block B", status: "idle", temperature: 18, targetTemperature: 19, energyToday: 0 },
    ],
  },
};
