import { FaultResponse, FaultTimelineResponse } from "../@types/fault.type";
import { api } from "../_lib/api/client";

export const faultService = {
  getFaults: (window: "heating" | "cooling" = "heating") =>
    api.get<FaultResponse>("/faults", { params: { window } }).then((res) => res.data),

  getTimeline: (
    deviceId: string,
    window: "heating" | "cooling" = "heating",
    limit = 1200
  ) =>
    api
      .get<FaultTimelineResponse>("/faults/timeline", {
        params: { window, deviceId, limit },
      })
      .then((res) => res.data),
};
