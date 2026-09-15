import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_ACCENT } from "@/lib/theme";

// One document per user, keyed by uid — mirrors how `routines` scopes data
// per-user, just without a query since we always know the exact doc id.
export const DEFAULT_PREFERENCES = {
  displayName: "",
  avatarEmoji: "🙂",
  theme: "system", // 'dark' | 'light' | 'system'
  accent: DEFAULT_ACCENT,
  notifications: {
    enabled: false,
    routineReminders: true,
    streakReminders: true,
    dailySummary: false,
    achievementNotifications: true,
    goalNotifications: true,
    missedRoutineNotifications: true,
    weeklyProgressSummary: false,
  },
  smartRemindersEnabled: true,
  dailySummaryTime: "21:00",
  weeklySummaryDay: 0, // 0 = Sunday
  weeklySummaryTime: "18:00",
  routinePreferences: {
    defaultReminderTime: "09:00",
    defaultCategory: "",
    defaultAfterCompletion: "stay", // 'stay' | 'next-routine' | 'dashboard'
    weekStart: "monday", // 'monday' | 'sunday'
    dateFormat: "DD/MM/YYYY", // 'DD/MM/YYYY' | 'MM/DD/YYYY'
  },
};

function mergeDefaults(data) {
  return {
    ...DEFAULT_PREFERENCES,
    ...data,
    notifications: { ...DEFAULT_PREFERENCES.notifications, ...(data?.notifications || {}) },
    routinePreferences: {
      ...DEFAULT_PREFERENCES.routinePreferences,
      ...(data?.routinePreferences || {}),
    },
  };
}

export function subscribePreferences(uid, callback) {
  const ref = doc(db, "userPreferences", uid);
  return onSnapshot(
    ref,
    (snap) => callback(mergeDefaults(snap.exists() ? snap.data() : null)),
    () => callback(mergeDefaults(null))
  );
}

export async function updatePreferences(uid, partial) {
  const ref = doc(db, "userPreferences", uid);
  return setDoc(ref, { ...partial, updatedAt: serverTimestamp() }, { merge: true });
}
