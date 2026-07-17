// services/alertService.js
//
// Fires an email when a device has been down long enough to be a real
// alert, not just a debounced blip. Disabled by default (ALERTS_ENABLED
// in .env) since it needs SMTP credentials to work.

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.ALERTS_ENABLED !== "true") return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Send a "device is down" email. Caller is responsible for deciding
 * *when* this should fire (see monitorJob.js: downAlertSent flag +
 * ALERT_AFTER_MINUTES) so we don't spam on every scan tick.
 */
async function sendDownAlert(device) {
  const t = getTransporter();
  if (!t) return; // alerts disabled - no-op

  const label = device.customName || device.hostname || device.ip;

  try {
    await t.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: process.env.ALERT_TO_EMAIL,
      subject: `Device down: ${label}`,
      text:
        `${label} (${device.ip}, ${device.mac}) stopped responding to pings ` +
        `as of ${device.lastSeen.toISOString()}.`,
    });
    console.log(`[alertService] sent down-alert for ${label}`);
  } catch (err) {
    console.error("[alertService] failed to send alert:", err.message);
  }
}

/**
 * Send a "device is back up" email, for symmetry with the down alert.
 */
async function sendRecoveryAlert(device) {
  const t = getTransporter();
  if (!t) return;

  const label = device.customName || device.hostname || device.ip;

  try {
    await t.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: process.env.ALERT_TO_EMAIL,
      subject: `Device back online: ${label}`,
      text: `${label} (${device.ip}, ${device.mac}) is responding to pings again.`,
    });
    console.log(`[alertService] sent recovery-alert for ${label}`);
  } catch (err) {
    console.error("[alertService] failed to send alert:", err.message);
  }
}

module.exports = { sendDownAlert, sendRecoveryAlert };
