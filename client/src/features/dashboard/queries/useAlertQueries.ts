import { alertService } from "@/src/services/alerts.services";
import { useQuery } from "@tanstack/react-query";
export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.getAlerts,
  });
}

export function useUnreadAlerts() {
  return useQuery({
    queryKey: ["alerts", "unread"],
    queryFn: alertService.getUnreadAlerts,
  });
}