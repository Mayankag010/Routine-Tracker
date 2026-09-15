export const DEFAULT_ACCENT = "#1F6F5C";

export const ACCENT_PRESETS = [
  { name: "Teal", hex: "#1F6F5C" },
  { name: "Coral", hex: "#E4572E" },
  { name: "Sky", hex: "#5B8FB9" },
  { name: "Plum", hex: "#8859A3" },
  { name: "Rose", hex: "#D46A94" },
  { name: "Mustard", hex: "#D9A441" },
  { name: "Sage", hex: "#7C9885" },
];

export const THEME_OPTIONS = ["dark", "light", "system"];

const LOCAL_THEME_KEY = "routine-tracker:theme";
const LOCAL_ACCENT_KEY = "routine-tracker:accent";

export function readLocalThemeCache() {
  if (typeof window === "undefined") return { theme: "system", accent: DEFAULT_ACCENT };
  return {
    theme: window.localStorage.getItem(LOCAL_THEME_KEY) || "system",
    accent: window.localStorage.getItem(LOCAL_ACCENT_KEY) || DEFAULT_ACCENT,
  };
}

export function writeLocalThemeCache({ theme, accent }) {
  if (typeof window === "undefined") return;
  if (theme) window.localStorage.setItem(LOCAL_THEME_KEY, theme);
  if (accent) window.localStorage.setItem(LOCAL_ACCENT_KEY, accent);
}

/** "#1F6F5C" -> "31 111 92" (space-separated channels, for Tailwind's rgb(var(--x) / <alpha>)). */
export function hexToChannels(hex) {
  const clean = (hex || DEFAULT_ACCENT).replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "31 111 92";
  return `${r} ${g} ${b}`;
}

/** Lightens a hex color toward white by `amount` (0-1). Used to derive the
 * "soft" hover/active variant of whatever accent the user picks. */
export function lightenHex(hex, amount = 0.18) {
  const clean = (hex || DEFAULT_ACCENT).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/** Resolves 'dark' | 'light' | 'system' down to the actual 'dark' | 'light' to apply. */
export function resolveTheme(theme) {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies theme + accent to <html> immediately — used both by the
 * pre-hydration inline script (to avoid a flash of the wrong theme) and by
 * ThemeProvider whenever the user changes a setting. */
export function applyThemeToDocument({ theme, accent }) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolveTheme(theme) === "dark");
  root.style.setProperty("--color-accent", hexToChannels(accent));
  root.style.setProperty("--color-accent-soft", hexToChannels(lightenHex(accent, 0.18)));
}
