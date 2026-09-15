import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const routinesRef = collection(db, "routines");

export function subscribeRoutines(uid, callback) {
  const q = query(routinesRef, where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const routines = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Newest first is confusing for a checklist people check daily —
    // keep a stable, predictable order instead.
    routines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    callback(routines);
  });
}

export async function createRoutine(
  uid,
  { name, color, schedule, type = "checkbox", target = 1, unit = "", icon = "", description = "" }
) {
  return addDoc(routinesRef, {
    uid,
    name,
    color,
    schedule,
    type,
    target,
    unit,
    icon,
    description,
    createdAt: serverTimestamp(),
  });
}

export async function updateRoutine(
  routineId,
  { name, color, schedule, type, target, unit, icon = "", description = "" }
) {
  // Editing a routine (including changing its type/target) only affects
  // how *future* days are evaluated — it never touches past completion
  // docs, so historical data (and past streaks/analytics) stay intact.
  return updateDoc(doc(db, "routines", routineId), {
    name,
    color,
    schedule,
    type,
    target,
    unit,
    icon,
    description,
  });
}

export async function deleteRoutine(routineId) {
  return deleteDoc(doc(db, "routines", routineId));
}

export function subscribeCompletion(routineId, dateKey, callback, onError) {
  const ref = doc(db, "routines", routineId, "completions", dateKey);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? snap.data().done : false),
    (err) => onError?.(err)
  );
}

export async function setCompletion(routineId, dateKey, done) {
  const ref = doc(db, "routines", routineId, "completions", dateKey);
  return setDoc(ref, { done, date: dateKey }, { merge: true });
}

/**
 * For count/duration/goal routines: write today's (or any date's) progress
 * value. `done` is computed right here, against the target passed in (the
 * routine's target *at the time of this write*), and stored on the doc —
 * not recalculated later from the routine's current target. That's what
 * keeps past days from silently changing if the routine's target is edited
 * afterwards.
 */
export async function setProgressValue(routineId, dateKey, value, target) {
  const safeValue = Math.max(0, Number(value) || 0);
  const done = target > 0 && safeValue >= target;
  const ref = doc(db, "routines", routineId, "completions", dateKey);
  return setDoc(ref, { value: safeValue, done, date: dateKey }, { merge: true });
}

/** Full completion doc (value + done) for count/duration/goal routines. */
export function subscribeCompletionValue(routineId, dateKey, callback, onError) {
  const ref = doc(db, "routines", routineId, "completions", dateKey);
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.data();
      callback({ value: data?.value ?? 0, done: data?.done ?? false });
    },
    (err) => onError?.(err)
  );
}

/**
 * Adds minutes to a duration-type routine's progress for one day, without
 * clobbering whatever's already logged there — used by the Timer feature
 * (Part 7 of the timer spec) so a finished timer session contributes on
 * top of, rather than overwrites, today's existing progress. A transaction
 * keeps this safe if a session is logged around the same time as a manual
 * +/- tap on the Today page. `done` is still computed and stored at write
 * time (see setProgressValue above) for the same "past days never change
 * retroactively" reason.
 */
export async function addDurationProgress(routineId, dateKey, addMinutes, target) {
  const ref = doc(db, "routines", routineId, "completions", dateKey);
  const safeAdd = Math.max(0, Number(addMinutes) || 0);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? Number(snap.data().value) || 0 : 0;
    const next = current + safeAdd;
    const done = target > 0 && next >= target;
    tx.set(ref, { value: next, done, date: dateKey }, { merge: true });
  });
}

export function subscribeCompletionsInRange(routineId, startKey, endKey, callback) {
  const ref = collection(db, "routines", routineId, "completions");
  const q = query(ref, where("date", ">=", startKey), where("date", "<=", endKey));
  return onSnapshot(q, (snapshot) => {
    const doneDateKeys = snapshot.docs
      .filter((d) => d.data().done)
      .map((d) => d.id);
    callback(doneDateKeys);
  });
}
