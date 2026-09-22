"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // auth is null when the NEXT_PUBLIC_FIREBASE_* env vars aren't
    // configured — nothing to subscribe to, so just stop loading.
    if (!auth) {
      setLoading(false);
      return;
    }

    // Firebase calls this every time the login state changes
    // (on load, on sign in, on sign out) so the whole app always
    // knows who's logged in without us checking manually.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
