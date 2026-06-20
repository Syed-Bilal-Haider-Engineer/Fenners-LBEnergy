import { buildingService } from "@/src/services/building.services";
import { useQuery } from "@tanstack/react-query";

export function useBuildings() {
  return useQuery({
    queryKey: ["buildings"],
    queryFn: buildingService.getBuildings,
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: ["buildings", id],
    queryFn: () => buildingService.getBuildingById(id),
    enabled: !!id,
  });
}