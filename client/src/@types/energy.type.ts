export interface EnergyConsumption {
  timestamp: string;
  consumption: number; // kWh
}

export interface EnergyConsumptionResponse {
  buildingId: string;
  buildingName: string;
  totalConsumption: number;
  unit: "kWh";
  data: EnergyConsumption[];
}