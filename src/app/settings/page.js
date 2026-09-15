"use client";

import { useEffect, useState } from "react";
import {
  User,
  Palette,
  Bell,
  AlarmClock,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { subscribePreferences, updatePreferences, DEFAULT_PREFERENCES } from "@/lib/preferences";
import { subscribeReminders } from "@/lib/reminders";
import { subscribeRoutines } from "@/lib/routines";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { RemindersSettings } from "@/components/settings/RemindersSettings";
import { RoutinePreferencesSettings } from "@/components/settings/RoutinePreferencesSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AboutSettings } from "@/components/settings/AboutSettings";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, emoji: "👤" },
  { id: "appearance", label: "Appearance", icon: Palette, emoji: "🎨" },
  { id: "notifications", label: "Notifications", icon: Bell, emoji: "🔔" },
  { id: "reminders", label: "Reminders", icon: AlarmClock, emoji: "⏰" },
  { id: "routine-preferences", label: "Routine Preferences", icon: SlidersHorizontal, emoji: "⚙️" },
  { id: "data-privacy", label: "Data & Privacy", icon: ShieldCheck, emoji: "🔐" },
  { id: "security", label: "Security", icon: Lock, emoji: "🛡️" },
  { id: "about", label: "About", icon: Info, emoji: "ℹ️" },
];

function SettingsContent({ sectionId, ctx }) {
  const { user, prefs, routines, reminders, save } = ctx;
  switch (sectionId) {
    case "profile":
      return <ProfileSettings user={user} prefs={prefs} onSave={save} />;
    case "appearance":
      return <AppearanceSettings />;
    case "notifications":
      return <NotificationsSettings prefs={prefs} onSave={save} />;
    case "reminders":
      return <RemindersSettings routines={routines} reminders={reminders} />;
    case "routine-preferences":
      return <RoutinePreferencesSettings prefs={prefs} onSave={save} />;
    case "data-privacy":
      return <DataPrivacySettings user={user} />;
    case "security":
      return <SecuritySettings user={user} />;
    case "about":
      return <AboutSettings />;
    default:
      return null;
  }
}

function SettingsPageContent() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [routines, setRoutines] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [activeSection, setActiveSection] = useState(null); // null => mobile shows the list

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribePreferences(user.uid, setPrefs),
      subscribeReminders(user.uid, setReminders),
      subscribeRoutines(user.uid, setRoutines),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  async function save(partial) {
    setSaveError("");
    try {
      await updatePreferences(user.uid, partial);
    } catch {
      setSaveError("Unable to save settings. Please try again.");
    }
  }

  if (!prefs) {
    return (
      <div className="px-6 py-10 md:px-12 max-w-3xl">
        <p className="text-inkSoft">Loading settings…</p>
      </div>
    );
  }

  const desktopSection = activeSection || "profile";
  const ctx = { user, prefs: prefs || DEFAULT_PREFERENCES, routines, reminders, save };

  return (
    <div className="px-6 py-10 md:px-12 max-w-4xl">
      <h1 className="font-display text-3xl mb-8">Settings</h1>

      {saveError && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 max-w-md">
          {saveError}
        </p>
      )}

      <div className="md:flex md:gap-10">
        {/* Desktop: always-visible left nav */}
        <nav className="hidden md:flex md:flex-col md:w-56 md:shrink-0 gap-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                desktopSection === id
                  ? "bg-ink text-paper"
                  : "text-inkSoft hover:bg-paperDark hover:text-ink"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop content */}
        <div className="hidden md:block flex-1 min-w-0">
          <SettingsContent sectionId={desktopSection} ctx={ctx} />
        </div>

        {/* Mobile: list of categories, or a single open panel */}
        <div className="md:hidden flex-1">
          {activeSection === null ? (
            <ul className="divide-y divide-line border-t border-line">
              {SECTIONS.map(({ id, label, emoji }) => (
                <li key={id}>
                  <button
                    onClick={() => setActiveSection(id)}
                    className="w-full flex items-center justify-between py-4 text-sm text-ink"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      {label}
                    </span>
                    <ChevronRight size={18} className="text-inkSoft" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-1.5 text-sm text-inkSoft hover:text-ink mb-6"
              >
                <ChevronLeft size={16} />
                Settings
              </button>
              <SettingsContent sectionId={activeSection} ctx={ctx} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <SettingsPageContent />
      </AppShell>
    </RequireAuth>
  );
}
