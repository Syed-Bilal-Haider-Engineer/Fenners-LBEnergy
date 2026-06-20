export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertRecord {
  id: string;
  title: string;
  description: string;
  building: string;
  zone: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
}

export const ALERTS: AlertRecord[] = [
  {
    id: "al-1",
    title: "Heat pump in Hall C",
    description: "Temperature not reaching target after 40 minutes of active heating.",
    building: "TUM Campus",
    zone: "Hall C",
    severity: "critical",
    timestamp: "5 min ago",
    acknowledged: false,
  },
  {
    id: "al-2",
    title: "Sensor in Hall D",
    description: "Temperature sensor deviation detected, readings fluctuating ±4°C.",
    building: "TUM Campus",
    zone: "Hall D",
    severity: "warning",
    timestamp: "1 h ago",
    acknowledged: false,
  },
  {
    id: "al-3",
    title: "Maintenance reminder",
    description: "Filter check recommended for units active over 800 hours.",
    building: "Expo Hall A",
    zone: "Main Unit",
    severity: "info",
    timestamp: "3 h ago",
    acknowledged: false,
  },
  {
    id: "al-4",
    title: "Heat pump offline",
    description: "Unit lost connection to gateway. Last signal 22 minutes ago.",
    building: "Event Tent 3",
    zone: "North Unit",
    severity: "critical",
    timestamp: "22 min ago",
    acknowledged: false,
  },
  {
    id: "al-5",
    title: "Energy spike detected",
    description: "Consumption 38% above weekly average for this time slot.",
    building: "Sports Hall",
    zone: "Main Unit",
    severity: "warning",
    timestamp: "4 h ago",
    acknowledged: true,
  },
  {
    id: "al-6",
    title: "Scheduled maintenance complete",
    description: "Routine inspection finished, all systems nominal.",
    building: "Dormitory Area",
    zone: "Block B",
    severity: "info",
    timestamp: "1 day ago",
    acknowledged: true,
  },
];
