"use client";

/**
 * Client side of the weather widget. Talks only to our own /api/weather
 * route (src/app/api/weather/route.js) — never the weather provider
 * directly — and caches the result in localStorage for ~15 minutes so the
 * widget doesn't refetch on every render or every dashboard visit.
 */

const CACHE_PREFIX = "routine-tracker:weather:";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// No saved city preference exists anywhere in the app yet, so this is the
// one default the spec asks for. If a city preference is ever added to
// Settings/preferences.js later, pass it into fetchWeather() instead.
export const DEFAULT_WEATHER_CITY = "Jaipur";

function readCache(city) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + city);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAtMs || Date.now() - parsed.fetchedAtMs > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(city, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + city,
      JSON.stringify({ ...data, fetchedAtMs: Date.now() })
    );
  } catch {
    // Ignore — widget still works, it'll just refetch next time.
  }
}

/**
 * Resolves to { tempC, city }. Throws if the lookup fails, so callers can
 * show "Weather unavailable". Pass { force: true } to bypass the cache
 * (manual refresh).
 */
export async function fetchWeather(city = DEFAULT_WEATHER_CITY, { force = false } = {}) {
  if (!force) {
    const cached = readCache(city);
    if (cached) return { tempC: cached.tempC, city: cached.city };
  }

  const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error("Weather unavailable");

  const data = await res.json();
  if (data?.error || !Number.isFinite(data?.tempC)) throw new Error("Weather unavailable");

  writeCache(city, { tempC: data.tempC, city: data.city });
  return { tempC: data.tempC, city: data.city };
}
