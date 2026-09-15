"use client";

import { useThemeSettings } from "@/lib/theme-context";
import { ACCENT_PRESETS } from "@/lib/theme";

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export function AppearanceSettings() {
  const { theme, accent, setTheme, setAccent } = useThemeSettings();

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Appearance</h2>

      <div className="mb-8">
        <span className="block text-sm text-inkSoft mb-3">Theme</span>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                theme === t.value
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-inkSoft hover:border-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm text-inkSoft mb-3">Accent color</span>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => setAccent(preset.hex)}
              aria-label={`Use ${preset.name} accent`}
              title={preset.name}
              className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: preset.hex,
                borderColor: accent.toLowerCase() === preset.hex.toLowerCase() ? "rgb(var(--color-ink))" : "transparent",
              }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-inkSoft">
          Custom accent color
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-9 w-14 rounded border border-line bg-surface cursor-pointer"
          />
          <span className="font-mono text-xs">{accent}</span>
        </label>
        <p className="text-xs text-inkSoft mt-4 max-w-sm">
          Your accent color is applied to buttons, progress rings, charts, streak
          indicators, checkboxes, and focus outlines throughout the app.
        </p>
      </div>
    </div>
  );
}
