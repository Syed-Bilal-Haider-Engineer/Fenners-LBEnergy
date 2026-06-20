import { api } from "../_lib/api/client";

export const buildingService = {
  getBuildings: () =>
    api.get("/buildings").then((res) => res.data),

  getBuildingById: (id: string) =>
    api.get(`/buildings/${id}`).then((res) => res.data),
};