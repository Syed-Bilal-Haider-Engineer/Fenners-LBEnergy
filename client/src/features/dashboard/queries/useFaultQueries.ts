import { faultService } from "@/src/services/fault.services";
import { useQuery } from "@tanstack/react-query";

export function useFaults(window: "heating" | "cooling" = "heating") {
  return useQuery({
    queryKey: ["faults", window],
    queryFn: () => faultService.getFaults(window),
  });
}

export function useFaultTimeline(
  deviceId: string | undefined,
  window: "heating" | "cooling" = "heating"
) {
  return useQuery({
    queryKey: ["faults", "timeline", window, deviceId],
    queryFn: () => faultService.getTimeline(deviceId!, window),
    enabled: Boolean(deviceId),
  });
}
