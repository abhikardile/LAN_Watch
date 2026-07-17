// socket.js
//
// Thin wrapper so any part of the backend can emit events without
// passing the `io` instance around everywhere.

const { Server } = require("socket.io");

let io = null;

function initSocket(httpServer, clientOrigin) {
  io = new Server(httpServer, {
    cors: { origin: clientOrigin, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
}

/** Emit a device status change to every connected dashboard. */
function emitDeviceUpdate(device) {
  if (!io) return;
  io.emit("device:update", device);
}

module.exports = { initSocket, getIO, emitDeviceUpdate };
