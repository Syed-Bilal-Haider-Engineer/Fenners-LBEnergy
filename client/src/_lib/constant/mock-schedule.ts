export type ScheduleStatus = "heating" | "scheduled" | "idle";

export interface ScheduleEntry {
  id: string;
  day: string;
  date: string;
  time: string;
  countdown?: string;
  building: string;
  hall: string;
  lecture: string;
  temperature: number;
  status: ScheduleStatus;
}

export const SCHEDULE: ScheduleEntry[] = [
  { id: "sc-1", day: "Today", date: "Mon, 17 Nov", time: "07:00", countdown: "in 2h", building: "TUM Campus", hall: "Hall A", lecture: "Mathematics for Engineers", temperature: 21, status: "heating" },
  { id: "sc-2", day: "Today", date: "Mon, 17 Nov", time: "10:00", countdown: "in 10h", building: "TUM Campus", hall: "Hall B", lecture: "Physics II — Thermodynamics", temperature: 21, status: "heating" },
  { id: "sc-3", day: "Today", date: "Mon, 17 Nov", time: "13:00", building: "Expo Hall A", hall: "Hall C", lecture: "Engineering Materials", temperature: 20, status: "scheduled" },
  { id: "sc-4", day: "Today", date: "Mon, 17 Nov", time: "15:00", building: "Expo Hall A", hall: "Hall D", lecture: "Thermal Systems Design", temperature: 21, status: "scheduled" },
  { id: "sc-5", day: "Tomorrow", date: "Tue, 18 Nov", time: "08:00", building: "Sports Hall", hall: "Main Court", lecture: "Sports Science Lab", temperature: 19, status: "scheduled" },
  { id: "sc-6", day: "Tomorrow", date: "Tue, 18 Nov", time: "09:30", building: "TUM Campus", hall: "Hall A", lecture: "Mathematics for Engineers", temperature: 21, status: "scheduled" },
  { id: "sc-7", day: "Tomorrow", date: "Tue, 18 Nov", time: "14:00", building: "Event Tent 3", hall: "North Unit", lecture: "Guest Lecture — Robotics", temperature: 20, status: "scheduled" },
  { id: "sc-8", day: "Wed, 19 Nov", date: "Wed, 19 Nov", time: "07:30", building: "TUM Campus", hall: "Hall B", lecture: "Physics II — Thermodynamics", temperature: 21, status: "scheduled" },
  { id: "sc-9", day: "Wed, 19 Nov", date: "Wed, 19 Nov", time: "11:00", building: "Dormitory Area", hall: "Block B", lecture: "Resident maintenance window", temperature: 18, status: "idle" },
];
