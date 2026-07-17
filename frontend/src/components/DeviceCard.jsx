import { useState } from "react";
import { Pencil, Trash2, Check, X, Wifi, WifiOff } from "lucide-react";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function DeviceCard({ device, onSelect, onRename, onRemove, isSelected }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(device.customName || "");

  const label = device.customName || device.hostname || device.ip;
  const isOnline = device.isOnline;

  const submitRename = (e) => {
    e.stopPropagation();
    onRename(device._id, draftName.trim());
    setEditing(false);
  };

  return (
    <div
      onClick={() => onSelect(device)}
      className={`group relative cursor-pointer rounded-lg border bg-base-panel p-4 shadow-panel transition-colors
        ${isSelected ? "border-wire/60" : "border-base-border hover:border-ink-faint/60"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* status dot with pulsing halo when online */}
          <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
            {isOnline && (
              <span className="absolute h-3 w-3 rounded-full bg-signal-up/70 animate-pulse_ring" />
            )}
            <span
              className={`relative h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-signal-up" : "bg-signal-down"
              }`}
            />
          </div>

          <div className="min-w-0">
            {editing ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitRename(e)}
                  placeholder={device.hostname || device.ip}
                  className="w-32 rounded border border-base-border bg-base-raised px-1.5 py-0.5 text-sm text-ink outline-none focus:border-wire"
                />
                <button onClick={submitRename} className="text-signal-up hover:text-signal-up/80">
                  <Check size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(false);
                  }}
                  className="text-ink-faint hover:text-ink-dim"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="truncate text-sm font-semibold text-ink">{label}</p>
            )}
            <p className="mt-0.5 truncate font-mono text-xs text-ink-dim">{device.ip}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDraftName(device.customName || "");
              setEditing(true);
            }}
            className="rounded p-1 text-ink-faint hover:bg-base-raised hover:text-ink"
            title="Rename"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remove ${label} from monitoring?`)) onRemove(device._id);
            }}
            className="rounded p-1 text-ink-faint hover:bg-signal-downDim hover:text-signal-down"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-base-border pt-2.5">
        <div className="flex items-center gap-1.5 text-xs text-ink-dim">
          {isOnline ? (
            <Wifi size={12} className="text-signal-up" />
          ) : (
            <WifiOff size={12} className="text-signal-down" />
          )}
          <span>{isOnline ? "online" : "offline"}</span>
        </div>
        <div className="text-right text-xs text-ink-faint">
          {isOnline && device.lastLatencyMs != null ? (
            <span className="font-mono">{device.lastLatencyMs} ms</span>
          ) : (
            <span>last seen {timeAgo(device.lastSeen)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
