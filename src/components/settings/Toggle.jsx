"use client";

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={`flex items-start justify-between gap-4 py-3 ${
        disabled ? "opacity-50" : "cursor-pointer"
      }`}
    >
      <span className="flex-1">
        {label && <span className="block text-sm text-ink">{label}</span>}
        {description && <span className="block text-xs text-inkSoft mt-0.5">{description}</span>}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
}
