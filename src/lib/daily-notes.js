import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Lazily built (not at module scope) because `db` is null during server-side
// prerendering — see the comment in lib/firebase.js.
function notesRef() {
  return collection(db, "dailyNotes");
}

// One note per user per day, enforced by using a deterministic doc id
// (Firestore has no multi-field unique constraint like SQL's
// UNIQUE(user_id, note_date) — a stable id keyed on both fields is the
// idiomatic equivalent: saving the same user+date always overwrites the
// same doc instead of creating a duplicate).
function noteId(uid, dateKey) {
  return `${uid}_${dateKey}`;
}

export const NOTE_MAX_LENGTH = 2000;

export function subscribeNote(uid, dateKey, callback) {
  const ref = doc(db, "dailyNotes", noteId(uid, dateKey));
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => callback(null)
  );
}

export async function saveNote(uid, dateKey, content, { isNew = false } = {}) {
  const ref = doc(db, "dailyNotes", noteId(uid, dateKey));
  return setDoc(
    ref,
    {
      uid,
      noteDate: dateKey,
      content: content.slice(0, NOTE_MAX_LENGTH),
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true }
  );
}

export async function deleteNote(uid, dateKey) {
  return deleteDoc(doc(db, "dailyNotes", noteId(uid, dateKey)));
}

/** Live set of dateKeys (within range) that have a non-empty note — used
 * for the calendar's subtle journal-entry dot indicator and for the
 * "Journal entries this month" analytics stat. */
export function subscribeNoteDatesInRange(uid, startKey, endKey, callback) {
  const q = query(
    notesRef(),
    where("uid", "==", uid),
    where("noteDate", ">=", startKey),
    where("noteDate", "<=", endKey)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const dates = new Set(
        snapshot.docs.filter((d) => (d.data().content || "").trim().length > 0).map((d) => d.data().noteDate)
      );
      callback(dates);
    },
    () => callback(new Set())
  );
}
