"use client";

const SWATCHES = [
  "#E4572E", // coral
  "#D9A441", // mustard
  "#7C9885", // sage
  "#2C8F76", // teal
  "#5B8FB9", // sky
  "#8859A3", // plum
  "#D46A94", // rose
  "#8C5E3C", // cocoa
  "#5B6672", // slate
  "#C4443B", // brick
];

export function ColorPicker({ value, onChange }) {
  return (
    <div>
      <span className="block text-sm text-inkSoft mb-2">Color</span>
      <div className="flex flex-wrap gap-2 mb-3">
        {SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={`Use color ${hex}`}
            onClick={() => onChange(hex)}
            className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: hex,
              borderColor: value === hex ? "rgb(var(--color-ink))" : "transparent",
            }}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-inkSoft">
        Custom
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 rounded border border-line bg-surface cursor-pointer"
        />
        <span className="font-mono text-xs">{value}</span>
      </label>
    </div>
  );
}
