// services/pinger.js
//
// Actively checks whether a known device is alive, independent of the ARP
// scan. This is what catches devices that are still on the network but
// quiet (nothing in the ARP cache recently), and it's also what gives us
// a latency number for the uptime chart.
//
// Two-stage check:
//   1. ICMP ping (fast, works for routers/PCs/IoT/most things)
//   2. TCP fallback (for devices that silently drop ICMP while idle -
//      phones especially). We try a short list of common ports; if any
//      of them either accepts a connection OR actively refuses one
//      (ECONNREFUSED - that's the OS's TCP stack answering, which means
//      the host is definitely up even though that port is closed), we
//      count the device as alive. Only a timeout/unreachable counts as
//      down.

const ping = require("ping");
const net = require("net");
const os = require("os");

// Windows' ping.exe uses "-n" for packet count; every other platform
// (Linux, macOS, BSD) uses "-c". Hardcoding one breaks the other.
const countFlag = os.platform() === "win32" ? "-n" : "-c";

// Ports worth trying as a fallback liveness check, in priority order:
//  - 62078: Apple's "lockdownd" service - often reachable on iPhones/iPads
//           over Wi-Fi even when the device is idle and ignoring ICMP.
//  - 5000:  common on Android/AirPlay-capable devices, and macOS (AirPlay
//           Receiver / ControlCenter) in recent versions.
//  - 80/443: HTTP(S) - long shot on a phone, but free to check, and
//           covers routers, smart-TVs, printers, IoT devices, etc.
const TCP_FALLBACK_PORTS = [62078, 5000, 80, 443];
const TCP_PROBE_TIMEOUT_MS = 800;

/**
 * Try a single TCP connection to ip:port.
 * Resolves alive:true if the connection succeeds OR is actively refused
 * (both mean *something* answered at the IP layer). Resolves alive:false
 * only on a timeout or an unreachable/no-route error.
 * @returns {Promise<{alive: boolean, latencyMs: number|null}>}
 */
function tcpProbe(ip, port, timeoutMs = TCP_PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (alive) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ alive, latencyMs: alive ? Date.now() - start : null });
    };

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => finish(true));

    socket.once("timeout", () => finish(false));

    socket.once("error", (err) => {
      // ECONNREFUSED means a device at that IP actively rejected the
      // connection - the OS's network stack had to be up and running to
      // send that RST, so the host itself is alive even though the port
      // is closed. Anything else (EHOSTUNREACH, ENETUNREACH, etc.) means
      // we couldn't even reach the host.
      finish(err.code === "ECONNREFUSED");
    });

    socket.connect(port, ip);
  });
}

/**
 * Try each fallback port in parallel, and use whichever one resolves
 * "alive" first. If every port comes back dead, the device is dead.
 * @returns {Promise<{alive: boolean, latencyMs: number|null, port: number|null}>}
 */
async function tcpFallbackCheck(ip) {
  const attempts = TCP_FALLBACK_PORTS.map((port) =>
    tcpProbe(ip, port).then((result) => ({ ...result, port }))
  );

  const results = await Promise.all(attempts);
  const firstAlive = results.find((r) => r.alive);

  if (firstAlive) return firstAlive;
  return { alive: false, latencyMs: null, port: null };
}

/**
 * Ping one host, with a TCP fallback for devices that ignore ICMP.
 * @param {string} ip
 * @returns {Promise<{alive: boolean, latencyMs: number|null, via: string}>}
 */
async function pingHost(ip) {
  try {
    const res = await ping.promise.probe(ip, {
      timeout: 2, // seconds
      extra: [countFlag, "1"], // single echo request, keep scans fast
    });

    if (res.alive) {
      const latencyMs = res.time !== "unknown" ? Math.round(Number(res.time)) : null;
      return { alive: true, latencyMs, via: "icmp" };
    }
  } catch (err) {
    console.error(`[pinger] ICMP ping to ${ip} failed:`, err.message);
    // fall through to TCP fallback below
  }

  // ICMP didn't answer - try the TCP fallback before declaring it dead.
  const fallback = await tcpFallbackCheck(ip);
  return {
    alive: fallback.alive,
    latencyMs: fallback.latencyMs,
    via: fallback.alive ? `tcp:${fallback.port}` : "none",
  };
}

/**
 * Ping a batch of devices in parallel.
 * @param {Array<{ip: string}>} devices
 * @returns {Promise<Map<string, {alive: boolean, latencyMs: number|null, via: string}>>}
 *   keyed by ip
 */
async function pingAll(devices) {
  const entries = await Promise.all(
    devices.map(async (d) => [d.ip, await pingHost(d.ip)])
  );
  return new Map(entries);
}

if (require.main === module) {
  const target = process.argv[2] || "192.168.1.1";
  pingHost(target).then((r) => console.log(`${target} ->`, r));
}

module.exports = { pingHost, pingAll, tcpProbe, tcpFallbackCheck };
