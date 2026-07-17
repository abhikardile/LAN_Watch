// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");

const { initSocket } = require("./socket");
const { startMonitorJob } = require("./cron/monitorJob");
const devicesRouter = require("./routes/devices");
const logsRouter = require("./routes/logs");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/network-monitor";

async function main() {
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.use("/api/devices", devicesRouter);
  // logsRouter defines "/:id/logs", nested under the same /api/devices prefix
  app.use("/api/devices", logsRouter);

  const httpServer = http.createServer(app);
  initSocket(httpServer, CLIENT_ORIGIN);

  await mongoose.connect(MONGODB_URI);
  console.log(`[server] connected to MongoDB at ${MONGODB_URI}`);

  httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });

  startMonitorJob();
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});
