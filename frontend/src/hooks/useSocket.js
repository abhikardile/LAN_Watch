import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/**
 * Owns the socket connection + the live device list. Fetches the initial
 * snapshot over REST, then keeps it fresh via the `device:update` event
 * so the dashboard never has to poll.
 */
export function useSocket() {
  const [devices, setDevices] = useState([]);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/devices`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDevices(data);
      })
      .catch((err) => console.error("Failed to load devices:", err));

    const socket = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("device:update", (updated) => {
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });

      if (updated.isOnline === false) {
        const id = `${updated._id}-${Date.now()}`;
        setToasts((prev) => [
          ...prev,
          {
            id,
            name: updated.customName || updated.hostname || updated.ip,
            ip: updated.ip,
          },
        ]);
      }
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  const renameDevice = useCallback(async (id, customName) => {
    const res = await fetch(`${API_BASE}/api/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName }),
    });
    const updated = await res.json();
    setDevices((prev) => prev.map((d) => (d._id === id ? updated : d)));
    return updated;
  }, []);

  const removeDevice = useCallback(async (id) => {
    await fetch(`${API_BASE}/api/devices/${id}`, { method: "DELETE" });
    setDevices((prev) => prev.filter((d) => d._id !== id));
  }, []);

  const fetchLogs = useCallback(async (id, range = "24h") => {
    const res = await fetch(`${API_BASE}/api/devices/${id}/logs?range=${range}`);
    return res.json();
  }, []);

  return {
    devices,
    connected,
    toasts,
    dismissToast,
    renameDevice,
    removeDevice,
    fetchLogs,
  };
}
