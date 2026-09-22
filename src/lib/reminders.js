import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Lazily built (not at module scope) because `db` is null during server-side
// prerendering — see the comment in lib/firebase.js.
function remindersRef() {
  return collection(db, "reminders");
}

export const OFFSET_OPTIONS = [
  { value: 0, label: "At scheduled time" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
];

export const REPEAT_TYPES = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "custom", label: "Custom days" },
];

export function subscribeReminders(uid, callback) {
  const q = query(remindersRef(), where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const reminders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    reminders.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    callback(reminders);
  });
}

export async function createReminder(uid, data) {
  return addDoc(remindersRef(), {
    uid,
    routineId: data.routineId,
    routineName: data.routineName,
    time: data.time,
    repeat: data.repeat, // { type, days? }
    offsetMinutes: data.offsetMinutes ?? 0,
    enabled: data.enabled ?? true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: serverTimestamp(),
    // 'once' reminders fire a single time then flip firedOnce, so they
    // don't need to be manually deleted after they go off.
    firedOnce: false,
  });
}

export async function updateReminder(reminderId, data) {
  return updateDoc(doc(db, "reminders", reminderId), data);
}

export async function deleteReminder(reminderId) {
  return deleteDoc(doc(db, "reminders", reminderId));
}

export async function setReminderEnabled(reminderId, enabled) {
  return updateDoc(doc(db, "reminders", reminderId), { enabled });
}
