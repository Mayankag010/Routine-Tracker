import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase is only ever used from client components (auth/db reads and
// writes all happen in effects and event handlers, never during render).
// Next.js still evaluates this module on the server when prerendering
// those pages though, and getAuth()/getFirestore() validate the config
// immediately — so on the server (or if the NEXT_PUBLIC_FIREBASE_* env
// vars aren't set yet) we skip initialization entirely instead of
// crashing the build.
const canInitialize = typeof window !== "undefined" && Boolean(firebaseConfig.apiKey);

// Avoid re-initializing the app on hot reloads
const app = canInitialize ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Cache Firestore data on-device (IndexedDB) so reads work offline and
// writes (like ticking a routine) queue locally and sync automatically
// once the connection comes back. Only runs in the browser, and only once.
if (db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open — persistence can only run in one at a time.
      // The app still works, it just won't cache in this tab.
    } else if (err.code === "unimplemented") {
      // Browser doesn't support the storage this needs (rare/older browsers).
    }
  });
}

export default app;
