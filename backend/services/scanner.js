// services/scanner.js
//
// Wraps `local-devices` to get a snapshot of everything currently on the
// LAN's ARP table: { ip, mac, name }. This only sees devices that have
// recently talked on the network, so it's normally paired with an active
// ping sweep (see pinger.js) for devices you already know about but that
// might be idle.
//
// IMPORTANT: this must run on a machine that's actually on the LAN
// (your laptop, a Raspberry Pi, a home server). It will not find anything
// useful if the backend is deployed to a cloud host.

const localDevices = require("local-devices");

/**
 * Scan the local subnet and return raw ARP entries.
 * @param {string} [subnet] optional CIDR, e.g. "192.168.1.0/24".
 *   If omitted, local-devices infers it from the active network interface.
 * @returns {Promise<Array<{ip: string, mac: string, name: string}>>}
 */
async function scanNetwork(subnet) {
  try {
    const results = subnet ? await localDevices(subnet) : await localDevices();
    // local-devices returns name: "?" when it can't resolve a hostname
    return results.map((d) => ({
      ip: d.ip,
      mac: (d.mac || "").toLowerCase(),
      hostname: d.name && d.name !== "?" ? d.name : "",
    }));
  } catch (err) {
    console.error("[scanner] LAN scan failed:", err.message);
    return [];
  }
}

// Allow `npm run scan:test` to sanity-check this file standalone,
// before it's wired into the cron job.
if (require.main === module) {
  scanNetwork(process.env.SCAN_SUBNET)
    .then((devices) => {
      console.log(`Found ${devices.length} device(s):`);
      console.table(devices);
    })
    .catch((err) => console.error(err));
}

module.exports = { scanNetwork };
