export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface AlertResponse {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: string;
}