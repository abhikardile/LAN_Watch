// routes/devices.js
const express = require("express");
const router = express.Router();
const Device = require("../models/Device");

// GET /api/devices - current device list + status
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find({}).sort({ lastSeen: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/devices/:id - rename/tag a device
router.patch("/:id", async (req, res) => {
  try {
    const { customName } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { $set: { customName } },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/devices/:id - remove a stale device
router.delete("/:id", async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
