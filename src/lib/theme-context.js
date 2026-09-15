"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribePreferences, updatePreferences } from "@/lib/preferences";
import {
  DEFAULT_ACCENT,
  applyThemeToDocument,
  readLocalThemeCache,
  writeLocalThemeCache,
} from "@/lib/theme";

const ThemeContext = createContext({
  theme: "system",
  accent: DEFAULT_ACCENT,
  setTheme: () => {},
  setAccent: () => {},
});

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState("system");
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);

  // Apply the locally cached choice immediately (the inline script in
  // layout.js already painted it before hydration; this just keeps React
  // state in sync so the Appearance settings UI reflects it).
  useEffect(() => {
    const cached = readLocalThemeCache();
    setThemeState(cached.theme);
    setAccentState(cached.accent);
  }, []);

  // Once signed in, the user's saved preferences (Firestore) are the
  // source of truth and override the local cache.
  useEffect(() => {
    if (!user) return;
    return subscribePreferences(user.uid, (prefs) => {
      setThemeState(prefs.theme);
      setAccentState(prefs.accent);
      writeLocalThemeCache({ theme: prefs.theme, accent: prefs.accent });
      applyThemeToDocument({ theme: prefs.theme, accent: prefs.accent });
    });
  }, [user]);

  useEffect(() => {
    applyThemeToDocument({ theme, accent });
  }, [theme, accent]);

  // React to OS-level light/dark changes when the user has chosen "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyThemeToDocument({ theme, accent });
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, accent]);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    writeLocalThemeCache({ theme: nextTheme });
    applyThemeToDocument({ theme: nextTheme, accent });
    if (user) updatePreferences(user.uid, { theme: nextTheme });
  }

  function setAccent(nextAccent) {
    setAccentState(nextAccent);
    writeLocalThemeCache({ accent: nextAccent });
    applyThemeToDocument({ theme, accent: nextAccent });
    if (user) updatePreferences(user.uid, { accent: nextAccent });
  }

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeSettings() {
  return useContext(ThemeContext);
}
