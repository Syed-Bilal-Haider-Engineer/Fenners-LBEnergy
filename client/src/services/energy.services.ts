
import { EnergyConsumptionResponse } from "../@types/energy.type";
import { api } from "../_lib/api/client";

export const energyService = {
  getConsumption: () =>
    api
      .get<EnergyConsumptionResponse>("/energy/consumption")
      .then((res) => res.data),

  getRealtimeUsage: () =>
    api
      .get("/energy/realtime")
      .then((res) => res.data),

  getStatistics: () =>
    api
      .get("/energy/statistics")
      .then((res) => res.data),
};