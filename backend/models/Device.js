const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    mac: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ip: { type: String, required: true },
    hostname: { type: String, default: "" },
    customName: { type: String, default: "" },
    vendor: { type: String, default: "" },
    isOnline: { type: Boolean, default: true },
    consecutiveFailures: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now },
    firstSeen: { type: Date, default: Date.now },
    lastLatencyMs: { type: Number, default: null },
    // set true once we've told the alert service this device is down,
    // so we don't send duplicate alerts every scan tick
    downAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Convenience: what should show up in the UI as the device's name
deviceSchema.virtual("displayName").get(function () {
  return this.customName || this.hostname || this.ip;
});

deviceSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Device", deviceSchema);
