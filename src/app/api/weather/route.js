import { NextResponse } from "next/server";

/**
 * GET /api/weather?city=Jaipur
 *
 * Tiny server-side proxy in front of the weather provider. The whole point
 * of this route is to keep WEATHER_API_KEY out of the browser: this file
 * only ever runs on the server (Next.js Route Handler), so the key is safe
 * here in a way it would never be inside a client component or anything
 * prefixed NEXT_PUBLIC_.
 *
 * Returns only what the widget needs — { tempC, city } — never the raw
 * provider payload (forecast/humidity/wind/etc.), so there's nothing extra
 * to accidentally display.
 */

const DEFAULT_CITY = "Jaipur";

export async function GET(request) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") || "").trim() || DEFAULT_CITY;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${apiKey}`;
    // Always hit the provider fresh — the 10-15 min cache lives client-side
    // (src/lib/weather.js) so this route stays a simple pass-through.
    const upstream = await fetch(url, { cache: "no-store" });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Weather lookup failed" }, { status: 502 });
    }

    const data = await upstream.json();
    const tempC = Math.round(data?.main?.temp);

    if (!Number.isFinite(tempC)) {
      return NextResponse.json({ error: "Weather lookup failed" }, { status: 502 });
    }

    return NextResponse.json({ tempC, city: data?.name || city });
  } catch {
    return NextResponse.json({ error: "Weather lookup failed" }, { status: 502 });
  }
}
