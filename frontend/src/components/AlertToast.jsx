import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-signal-downDim bg-base-panel p-3 shadow-panel animate-[fadeIn_0.2s_ease-out]">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-signal-down" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.name} went offline</p>
        <p className="font-mono text-xs text-ink-faint">{toast.ip}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-ink-faint hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function AlertToast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
