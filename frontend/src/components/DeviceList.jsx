import DeviceCard from "./DeviceCard.jsx";

export default function DeviceList({ devices, selectedId, onSelect, onRename, onRemove }) {
  const onlineCount = devices.filter((d) => d.isOnline).length;

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-base-border py-20 text-center">
        <p className="text-sm text-ink-dim">No devices discovered yet.</p>
        <p className="mt-1 text-xs text-ink-faint">
          The scanner runs on an interval — devices will appear here as soon as
          the first scan completes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-ink-dim">
        <span>
          <span className="font-mono text-ink">{devices.length}</span> devices
        </span>
        <span className="text-base-border">•</span>
        <span>
          <span className="font-mono text-signal-up">{onlineCount}</span> online
        </span>
        <span className="text-base-border">•</span>
        <span>
          <span className="font-mono text-signal-down">
            {devices.length - onlineCount}
          </span>{" "}
          offline
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {devices.map((device) => (
          <DeviceCard
            key={device._id}
            device={device}
            isSelected={device._id === selectedId}
            onSelect={onSelect}
            onRename={onRename}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
