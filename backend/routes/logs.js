// routes/logs.js
const express = require("express");
const router = express.Router();
const StatusLog = require("../models/StatusLog");
const Device = require("../models/Device");

const RANGE_MS = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

// GET /api/devices/:id/logs?range=24h - uptime history + computed uptime %
router.get("/:id/logs", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const range = RANGE_MS[req.query.range] || RANGE_MS["24h"];
    const rangeStart = new Date(Date.now() - range);

    // Pull the last log strictly before the range, so we know what state
    // the device was in at the start of the window (otherwise the first
    // partial segment gets miscounted).
    const priorLog = await StatusLog.findOne({
      deviceId: device._id,
      timestamp: { $lt: rangeStart },
    }).sort({ timestamp: -1 });

    const logsInRange = await StatusLog.find({
      deviceId: device._id,
      timestamp: { $gte: rangeStart },
    }).sort({ timestamp: 1 });

    const uptimePercent = computeUptimePercent({
      rangeStart,
      rangeEnd: new Date(),
      priorStatus: priorLog ? priorLog.status : device.isOnline ? "up" : "down",
      logsInRange,
    });

    res.json({
      device,
      range: req.query.range || "24h",
      uptimePercent,
      logs: logsInRange,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Uptime % = (time spent "up" within the window) / (window duration) * 100
 *
 * Walk the transitions chronologically, starting from whatever the status
 * was at the beginning of the window, and sum up the "up" segments.
 */
function computeUptimePercent({ rangeStart, rangeEnd, priorStatus, logsInRange }) {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  if (totalMs <= 0) return 100;

  let upMs = 0;
  let cursor = rangeStart;
  let currentStatus = priorStatus;

  for (const log of logsInRange) {
    const segmentEnd = log.timestamp;
    if (currentStatus === "up") {
      upMs += segmentEnd.getTime() - cursor.getTime();
    }
    currentStatus = log.status;
    cursor = segmentEnd;
  }

  // Final segment from the last transition to now
  if (currentStatus === "up") {
    upMs += rangeEnd.getTime() - cursor.getTime();
  }

  return Math.max(0, Math.min(100, (upMs / totalMs) * 100));
}

module.exports = router;
