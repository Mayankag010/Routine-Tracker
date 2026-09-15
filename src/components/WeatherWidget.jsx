"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchWeather, DEFAULT_WEATHER_CITY } from "@/lib/weather";

/**
 * Deliberately tiny — same spirit as TimerQuickCard on this page. Shows
 * only a temperature and a city name; no forecast/condition/humidity/wind,
 * and no separate page. Reads from src/lib/weather.js, which itself only
 * ever talks to our own /api/weather route (the provider's API key never
 * reaches this component or any other client code).
 */
export function WeatherWidget() {
  const [state, setState] = useState({ status: "loading", tempC: null, city: DEFAULT_WEATHER_CITY });

  const load = useCallback((force = false) => {
    setState((s) => ({ ...s, status: "loading" }));
    fetchWeather(DEFAULT_WEATHER_CITY, { force })
      .then(({ tempC, city }) => setState({ status: "ready", tempC, city }))
      .catch(() => setState((s) => ({ ...s, status: "error" })));
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface/40 px-4 py-3">
      <div>
        {state.status === "loading" && <p className="text-sm text-inkSoft">Loading weather…</p>}
        {state.status === "error" && <p className="text-sm text-inkSoft">Weather unavailable</p>}
        {state.status === "ready" && (
          <>
            <p className="font-display text-2xl tabular-nums">{state.tempC}°C</p>
            <p className="text-xs text-inkSoft">{state.city}</p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => load(true)}
        aria-label="Refresh weather"
        className="text-inkSoft hover:text-ink transition-colors disabled:opacity-40"
        disabled={state.status === "loading"}
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
}
