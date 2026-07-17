const mongoose = require("mongoose");

const statusLogSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  status: { type: String, enum: ["up", "down"], required: true },
  timestamp: { type: Date, default: Date.now },
  latencyMs: { type: Number, default: null },
});

// This is the query pattern we run constantly: "give me the last 24h/7d
// of transitions for device X, newest first"
statusLogSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model("StatusLog", statusLogSchema);
