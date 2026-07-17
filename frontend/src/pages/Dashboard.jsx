import { useState, useMemo } from "react";
import { Radar } from "lucide-react";
import { useSocket } from "../hooks/useSocket.js";
import DeviceList from "../components/DeviceList.jsx";
import UptimeChart from "../components/UptimeChart.jsx";
import AlertToast from "../components/AlertToast.jsx";

export default function Dashboard() {
  const { devices, connected, toasts, dismissToast, renameDevice, removeDevice, fetchLogs } =
    useSocket();
  const [selectedId, setSelectedId] = useState(null);

  const selectedDevice = useMemo(
    () => devices.find((d) => d._id === selectedId) || null,
    [devices, selectedId]
  );

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Radar size={20} className="text-wire" />
            <h1 className="text-base font-semibold tracking-tight">LAN Watch</h1>
            <span className="hidden text-xs text-ink-faint sm:inline">
              network device scanner &amp; uptime monitor
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-signal-up" : "bg-signal-down"
              }`}
            />
            <span className="text-ink-dim">
              {connected ? "live" : "reconnecting…"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <DeviceList
              devices={devices}
              selectedId={selectedId}
              onSelect={(d) => setSelectedId(d._id)}
              onRename={renameDevice}
              onRemove={removeDevice}
            />
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {selectedDevice ? (
              <UptimeChart device={selectedDevice} fetchLogs={fetchLogs} />
            ) : (
              <div className="rounded-lg border border-dashed border-base-border p-6 text-center">
                <p className="text-sm text-ink-dim">Select a device</p>
                <p className="mt-1 text-xs text-ink-faint">
                  Its uptime history and latency will show up here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      <AlertToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
