import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

async function fetchUserRoutinesWithCompletions(uid) {
  const routinesSnap = await getDocs(query(collection(db, "routines"), where("uid", "==", uid)));
  const routines = [];
  for (const routineDoc of routinesSnap.docs) {
    const completionsSnap = await getDocs(collection(db, "routines", routineDoc.id, "completions"));
    routines.push({
      id: routineDoc.id,
      ...routineDoc.data(),
      completions: completionsSnap.docs
        .filter((d) => d.data().done)
        .map((d) => d.id)
        .sort(),
    });
  }
  return routines;
}

async function fetchUserReminders(uid) {
  const snap = await getDocs(query(collection(db, "reminders"), where("uid", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchUserPreferences(uid) {
  const snap = await getDoc(doc(db, "userPreferences", uid));
  return snap.exists() ? snap.data() : {};
}

function download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportUserDataAsJSON(uid) {
  const [routines, reminders, preferences] = await Promise.all([
    fetchUserRoutinesWithCompletions(uid),
    fetchUserReminders(uid),
    fetchUserPreferences(uid),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    routines,
    reminders,
    preferences,
  };
  download(`routine-tracker-export-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

export async function exportUserDataAsCSV(uid) {
  const routines = await fetchUserRoutinesWithCompletions(uid);
  const rows = [["routine", "date", "completed"]];
  for (const routine of routines) {
    if (routine.completions.length === 0) {
      rows.push([routine.name, "", ""]);
      continue;
    }
    for (const date of routine.completions) {
      rows.push([routine.name, date, "yes"]);
    }
  }
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  download(`routine-tracker-export-${Date.now()}.csv`, csv, "text/csv");
}

/** Deletes every completion doc for the user's routines, leaving the
 * routines themselves (and their names/schedules/colors) intact. */
export async function clearCompletionHistory(uid) {
  const routinesSnap = await getDocs(query(collection(db, "routines"), where("uid", "==", uid)));
  for (const routineDoc of routinesSnap.docs) {
    const completionsSnap = await getDocs(collection(db, "routines", routineDoc.id, "completions"));
    const docs = completionsSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

/** Deletes all Firestore data for the user (routines, completions,
 * reminders, preferences). Does NOT delete the Firebase Auth account
 * itself — call `deleteUser(auth.currentUser)` after this succeeds. */
export async function deleteAllUserData(uid) {
  const routinesSnap = await getDocs(query(collection(db, "routines"), where("uid", "==", uid)));
  for (const routineDoc of routinesSnap.docs) {
    const completionsSnap = await getDocs(collection(db, "routines", routineDoc.id, "completions"));
    const docs = completionsSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const remindersSnap = await getDocs(query(collection(db, "reminders"), where("uid", "==", uid)));

  const batch = writeBatch(db);
  routinesSnap.docs.forEach((d) => batch.delete(d.ref));
  remindersSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "userPreferences", uid));
  await batch.commit();
}
