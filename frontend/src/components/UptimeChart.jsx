import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RANGES = [
  { key: "1h", label: "1H" },
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
];

function buildTimelineSegments(logs, rangeStart, rangeEnd) {
  // Turn a list of up/down transition points into evenly-charted segments
  // Recharts can render as a step area (0 = down, 1 = up).
  const points = [];
  let cursor = rangeStart;
  let currentValue = logs.length && logs[0].status === "down" ? 1 : 1; // optimistic start

  if (logs.length === 0) {
    points.push({ t: rangeStart, v: 1 });
    points.push({ t: rangeEnd, v: 1 });
    return points;
  }

  points.push({ t: cursor, v: currentValue });
  for (const log of logs) {
    const v = log.status === "up" ? 1 : 0;
    points.push({ t: new Date(log.timestamp), v: currentValue });
    points.push({ t: new Date(log.timestamp), v });
    currentValue = v;
  }
  points.push({ t: rangeEnd, v: currentValue });
  return points;
}

export default function UptimeChart({ device, fetchLogs }) {
  const [range, setRange] = useState("24h");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!device) return;
    setLoading(true);
    fetchLogs(device._id, range)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [device, range, fetchLogs]);

  if (!device) return null;

  const rangeMs = { "1h": 3600000, "24h": 86400000, "7d": 604800000 }[range];
  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - rangeMs);

  const chartData = data
    ? buildTimelineSegments(data.logs, rangeStart, rangeEnd).map((p) => ({
        time: p.t.getTime(),
        up: p.v,
      }))
    : [];

  return (
    <div className="rounded-lg border border-base-border bg-base-panel p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {device.customName || device.hostname || device.ip}
          </p>
          <p className="font-mono text-xs text-ink-faint">
            {device.mac} · {device.vendor || "vendor unknown"}
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-base-border bg-base-raised p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                range === r.key
                  ? "bg-wire/20 text-wire"
                  : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-ink">
          {loading || !data ? "—" : `${data.uptimePercent.toFixed(2)}%`}
        </span>
        <span className="text-xs text-ink-dim">uptime · last {range}</span>
      </div>

      <div className="mt-3 h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="upFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3FD97F" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3FD97F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#232B36" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={[rangeStart.getTime(), rangeEnd.getTime()]}
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
              stroke="#5B6472"
              tick={{ fontSize: 10, fill: "#5B6472" }}
              minTickGap={40}
            />
            <YAxis domain={[0, 1]} hide />
            <Tooltip
              contentStyle={{
                background: "#161C25",
                border: "1px solid #232B36",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(t) => new Date(t).toLocaleString()}
              formatter={(v) => [v === 1 ? "up" : "down", "status"]}
            />
            <Area
              type="stepAfter"
              dataKey="up"
              stroke="#3FD97F"
              strokeWidth={1.5}
              fill="url(#upFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
