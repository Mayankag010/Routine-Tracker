import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Lazily built (not at module scope) because `db` is null during server-side
// prerendering — see the comment in lib/firebase.js.
function sessionsRef() {
  return collection(db, "timerSessions");
}

/**
 * Logs one completed (or meaningfully-stopped) timer session. This is the
 * only thing the Timer feature ever writes to Firestore — individual ticks
 * stay in localStorage (lib/timer/storage.js). `startedAt`/`endedAt` are
 * ISO strings (so they're immediately available for client-side sorting,
 * the same pattern lib/reminders.js and lib/daily-notes.js use); `createdAt`
 * is the usual serverTimestamp for record-keeping.
 *
 * `routineId` is only ever set when the session was tracked against a
 * duration-type routine — see lib/routine-types.js `isNumericType`/type
 * checks at the call site. Ownership (`uid`) always comes from the
 * authenticated caller, never trusted from elsewhere.
 */
export async function logTimerSession(
  uid,
  { timerType, durationSeconds, startedAt, endedAt, routineId = null, routineName = "" }
) {
  return addDoc(sessionsRef(), {
    uid,
    timerType, // "countdown" | "stopwatch" | "pomodoro-focus"
    durationSeconds: Math.max(0, Math.round(durationSeconds || 0)),
    startedAt,
    endedAt,
    routineId,
    routineName,
    createdAt: serverTimestamp(),
  });
}

/**
 * All of the user's sessions, most recent first. Filtered to a single
 * equality clause (uid) with client-side sorting — same reasoning as
 * lib/routines.js's subscribeRoutines: it avoids requiring a composite
 * Firestore index just to show a short "Recent Sessions" list.
 */
export function subscribeRecentSessions(uid, callback, max = 20) {
  const q = query(sessionsRef(), where("uid", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      sessions.sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
      callback(sessions.slice(0, max));
    },
    () => callback([])
  );
}

/**
 * Sessions started on/after `sinceIso`, for the Analytics "Focus Time"
 * stat. Filters by uid only (equality-only, so it's covered by Firestore's
 * automatic single-field indexing — no manual composite index needed) and
 * applies the startedAt range client-side, the same tradeoff
 * subscribeRecentSessions above makes: simplicity over an unbounded
 * server-side query, since a given user's total session count stays small.
 * Combining `where("uid","==",uid)` with `where("startedAt",">=",sinceIso)`
 * server-side would need a composite index (uid ASC, startedAt ASC) that
 * Firestore does not auto-create — without it, this would throw a
 * "query requires an index" error at runtime (silently surfaced as 0
 * here, since onSnapshot's error handler falls back to callback([])).
 */
export function subscribeSessionsSince(uid, sinceIso, callback) {
  const q = query(sessionsRef(), where("uid", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs
        .map((d) => d.data())
        .filter((s) => (s.startedAt || "") >= sinceIso);
      callback(sessions);
    },
    () => callback([])
  );
}
