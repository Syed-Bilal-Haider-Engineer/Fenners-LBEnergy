export interface Building {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  totalConsumption: number;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  currentConsumption: number;
  temperature: number;
  occupancy: number;
}