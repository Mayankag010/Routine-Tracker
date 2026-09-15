import { useEffect, useState } from "react";
import { subscribeNoteDatesInRange } from "@/lib/daily-notes";

/** Returns a live Set<dateKey> of days (within range) that have a journal note. */
export function useNoteDatesInRange(uid, startKey, endKey) {
  const [dates, setDates] = useState(new Set());

  useEffect(() => {
    if (!uid) {
      setDates(new Set());
      return;
    }
    return subscribeNoteDatesInRange(uid, startKey, endKey, setDates);
  }, [uid, startKey, endKey]);

  return dates;
}
