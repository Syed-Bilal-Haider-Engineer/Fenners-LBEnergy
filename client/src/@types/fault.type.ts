export type FaultSeverity = "low" | "medium" | "high" | "critical";

export interface FaultEvidence {
  rows: number;
  maxAbsResidualDegC: number | null;
  maxPeerDeviationDegC: number;
  meanRoomTempDegC: number;
  meanSetpointDegC: number;
}

export interface FaultAlert {
  id: string;
  type: string;
  severity: FaultSeverity;
  title: string;
  message: string;
  deviceId: string;
  createdAt: string;
  resolvedAt: string;
  durationMinutes: number;
  temperature: number;
  setpoint: number;
  evidence: FaultEvidence;
  likelyCause?: string;
  probableComponent?: string;
  partsToPick?: string[];
  recommendedAction?: string;
  confidence?: number;
  evidenceSummary?: string;
}

export interface FaultSummary {
  rows_scored: number;
  devices: number;
  rows_with_fault_flags: number;
  alert_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  residual_rmse_degC: number;
  window: "heating" | "cooling";
}

export interface FaultResponse {
  summary: FaultSummary;
  alerts: FaultAlert[];
  sampleCount: number;
}

export interface FaultTimelineRow {
  ts: string;
  device_id: string;
  T_room: number | null;
  setpoint: number | null;
  T_supply: number | null;
  T_out: number | null;
  P_device_kw: number | null;
  rc_residual: number | null;
  residual_z: number | null;
  cusum_pos: number | null;
  cusum_neg: number | null;
  defrost?: boolean | number | null;
  compressor?: boolean | number | null;
  heating_req?: boolean | number | null;
  cooling_req?: boolean | number | null;
  hardware_alarm?: boolean | null;
  peer_sensor_outlier?: boolean | null;
  cusum_negative_alarm?: boolean | null;
  cusum_positive_alarm?: boolean | null;
  rc_negative_shift?: boolean | null;
  rc_positive_shift?: boolean | null;
  compressor_no_effect?: boolean | null;
  setpoint_miss?: boolean | null;
  any_fault_flag?: boolean | null;
}

export interface FaultTimelineResponse {
  window: "heating" | "cooling";
  deviceId: string | null;
  count: number;
  rows: FaultTimelineRow[];
}
