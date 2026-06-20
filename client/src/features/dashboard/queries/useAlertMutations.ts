import { alertService } from "@/src/services/alerts.services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAlertMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const markAsRead = useMutation({
    mutationFn: (alertId: string) =>
      alertService.markAsRead(alertId),
    onSuccess: invalidate,
  });

  return {
    markAsRead,
  };
}