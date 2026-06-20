import { AlertResponse } from "../@types/alert.type";
import { api } from "../_lib/api/client";


export const alertService = {
  getAlerts: () =>
    api
      .get<AlertResponse[]>("/alerts")
      .then((res) => res.data),

  getUnreadAlerts: () =>
    api
      .get<AlertResponse[]>("/alerts/unread")
      .then((res) => res.data),

  markAsRead: (alertId: string) =>
    api
      .patch(`/alerts/${alertId}/read`)
      .then((res) => res.data),
};