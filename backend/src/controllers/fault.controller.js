const fs = require("fs");
const path = require("path");

const OUTPUTS_DIR = path.join(__dirname, "..", "..", "..", "outputs");

const TIMELINE_COLUMNS = [
  "ts", "device_id", "T_room", "setpoint", "T_supply", "T_out", "P_device_kw",
  "rc_residual", "residual_z", "cusum_pos", "cusum_neg",
  "defrost", "compressor", "heating_req", "cooling_req",
  "hardware_alarm", "peer_sensor_outlier",
  "cusum_negative_alarm", "cusum_positive_alarm",
  "rc_negative_shift", "rc_positive_shift",
  "compressor_no_effect", "setpoint_miss", "any_fault_flag",
];

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function coerce(value, header) {
  if (value === "" || value === undefined) return null;
  if (value === "True") return true;
  if (value === "False") return false;
  if (header === "ts" || header === "device_id") return value;
  const n = Number(value);
  return isNaN(n) ? value : n;
}

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = coerce(values[i], h);
    });
    return row;
  });
}

function projectTimelineRow(row) {
  const out = {};
  for (const col of TIMELINE_COLUMNS) {
    out[col] = col in row ? row[col] : null;
  }
  return out;
}

const getFaults = (req, res) => {
  const window = req.query.window === "cooling" ? "cooling" : "heating";
  const alertsPath = path.join(OUTPUTS_DIR, `anomaly_alerts_${window}.json`);

  if (!fs.existsSync(alertsPath)) {
    return res.status(404).json({
      error: `Anomaly output not found for window "${window}". Run: python scripts/anomaly.py --window ${window}`,
    });
  }

  try {
    const artifact = JSON.parse(fs.readFileSync(alertsPath, "utf8"));
    return res.json({
      summary: artifact.summary,
      alerts: artifact.alerts,
      sampleCount: artifact.summary.rows_scored,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse anomaly output.", detail: err.message });
  }
};

const getTimeline = (req, res) => {
  const window = req.query.window === "cooling" ? "cooling" : "heating";
  const deviceId = req.query.deviceId ?? null;
  const limit = Math.min(parseInt(req.query.limit ?? "1200", 10) || 1200, 10000);

  const scoredPath = path.join(OUTPUTS_DIR, `anomaly_scores_${window}.csv`);

  if (!fs.existsSync(scoredPath)) {
    return res.status(404).json({
      error: `Scored output not found for window "${window}". Run: python scripts/anomaly.py --window ${window}`,
    });
  }

  try {
    const content = fs.readFileSync(scoredPath, "utf8");
    let rows = parseCsv(content).map(projectTimelineRow);

    if (deviceId) {
      rows = rows.filter((r) => r.device_id === deviceId);
    }

    rows = rows.slice(-limit);

    return res.json({
      window,
      deviceId: deviceId ?? null,
      count: rows.length,
      rows,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse scored output.", detail: err.message });
  }
};

module.exports = { getFaults, getTimeline };
