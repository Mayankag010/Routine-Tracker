"use client";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  confirming = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-ink/40 px-0 md:px-6">
      <div className="w-full md:max-w-sm bg-paper rounded-t-2xl md:rounded-2xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl mb-2">{title}</h2>
        {description && <p className="text-sm text-inkSoft mb-4">{description}</p>}
        {children}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 rounded-lg border border-line py-2.5 text-sm text-ink hover:bg-paperDark transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className={`flex-1 rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-ink text-paper hover:brightness-110"
            }`}
          >
            {confirming ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
