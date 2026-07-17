// cron/monitorJob.js
//
// This is the heart of the app. On every tick it:
//   1. Runs an ARP scan to discover devices (new + existing)
//   2. Actively pings every *known* device (catches quiet devices the
//      ARP scan alone would miss)
//   3. Diffs the result against each device's last known state
//   4. Debounces flaps: only flips to "down" after FAILURE_THRESHOLD
//      consecutive missed pings
//   5. Writes a StatusLog entry ONLY on a real transition (not every tick)
//   6. Emits a socket.io event so the dashboard updates live
//   7. Optionally fires an email alert once a device has been down long
//      enough (ALERT_AFTER_MINUTES)

const cron = require("node-cron");
const Device = require("../models/Device");
const StatusLog = require("../models/StatusLog");
const { scanNetwork } = require("../services/scanner");
const { pingAll } = require("../services/pinger");
const { sendDownAlert, sendRecoveryAlert } = require("../services/alertService");
const { emitDeviceUpdate } = require("../socket");

const FAILURE_THRESHOLD = Number(process.env.FAILURE_THRESHOLD || 3);
const ALERT_AFTER_MINUTES = Number(process.env.ALERT_AFTER_MINUTES || 5);

async function runScanTick() {
  const scanned = await scanNetwork(process.env.SCAN_SUBNET);

  // Upsert anything newly discovered so it shows up as a known device.
  for (const found of scanned) {
    if (!found.mac) continue; // can't key on an unknown MAC
    await Device.findOneAndUpdate(
      { mac: found.mac },
      {
        $setOnInsert: {
          mac: found.mac,
          ip: found.ip,
          hostname: found.hostname,
          firstSeen: new Date(),
          isOnline: true,
          lastSeen: new Date(),
        },
        // keep IP/hostname fresh even for devices we already knew about,
        // since DHCP leases change
        $set: { ip: found.ip, hostname: found.hostname || undefined },
      },
      { upsert: true, new: true }
    );
  }

  // Now actively ping every known device (this is what actually decides
  // up/down status - the ARP scan above is just for discovery).
  const knownDevices = await Device.find({});
  const pingResults = await pingAll(knownDevices);

  for (const device of knownDevices) {
    const result = pingResults.get(device.ip) || { alive: false, latencyMs: null };
    await applyPingResult(device, result);
  }
}

async function applyPingResult(device, { alive, latencyMs }) {
  const wasOnline = device.isOnline;

  if (alive) {
    device.consecutiveFailures = 0;
    device.lastSeen = new Date();
    device.lastLatencyMs = latencyMs;

    if (!wasOnline) {
      // Transition: down -> up
      device.isOnline = true;
      device.downAlertSent = false;
      await device.save();
      await logTransition(device, "up", latencyMs);
      emitDeviceUpdate(device);
      await sendRecoveryAlert(device);
    } else {
      // Still up - just refresh lastSeen/latency, no new log entry
      await device.save();
    }
    return;
  }

  // Ping failed this tick.
  device.consecutiveFailures += 1;

  if (wasOnline && device.consecutiveFailures >= FAILURE_THRESHOLD) {
    // Transition: up -> down (debounced)
    device.isOnline = false;
    await device.save();
    await logTransition(device, "down", null);
    emitDeviceUpdate(device);
  } else {
    await device.save();
  }

  // If it's been down long enough, and we haven't already alerted, fire once.
  if (!device.isOnline && !device.downAlertSent) {
    const downSince = await getDownSince(device._id);
    const minutesDown = downSince
      ? (Date.now() - downSince.getTime()) / 60000
      : 0;

    if (minutesDown >= ALERT_AFTER_MINUTES) {
      device.downAlertSent = true;
      await device.save();
      await sendDownAlert(device);
    }
  }
}

async function logTransition(device, status, latencyMs) {
  await StatusLog.create({
    deviceId: device._id,
    status,
    timestamp: new Date(),
    latencyMs,
  });
}

async function getDownSince(deviceId) {
  const lastDownLog = await StatusLog.findOne({
    deviceId,
    status: "down",
  }).sort({ timestamp: -1 });
  return lastDownLog ? lastDownLog.timestamp : null;
}

function startMonitorJob() {
  const intervalMs = Number(process.env.SCAN_INTERVAL_MS || 45000);
  const intervalSeconds = Math.max(5, Math.round(intervalMs / 1000));

  // node-cron needs a cron expression, not a raw interval, so build a
  // "every N seconds" expression (falls back to every-minute above 59s
  // granularity limitations by just running once per minute).
  const cronExpr =
    intervalSeconds < 60 ? `*/${intervalSeconds} * * * * *` : `*/1 * * * *`;

  console.log(`[monitorJob] scheduled with expression "${cronExpr}"`);

  // Run once immediately on boot so the dashboard isn't empty while
  // waiting for the first scheduled tick.
  runScanTick().catch((err) => console.error("[monitorJob] initial tick failed:", err));

  cron.schedule(cronExpr, () => {
    runScanTick().catch((err) => console.error("[monitorJob] tick failed:", err));
  });
}

module.exports = { startMonitorJob, runScanTick };
