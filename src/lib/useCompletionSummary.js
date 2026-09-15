import { useEffect, useState } from "react";
import { subscribeCompletionsInRange } from "@/lib/routines";
import { eachDateKeyInRange, fromDateKey, routineAppliesOnDate } from "@/lib/schedule";

/**
 * Returns a map of dateKey -> { scheduled, done } for the given date range,
 * counting only routines that are actually scheduled on each day.
 */
export function useCompletionSummary(routines, startKey, endKey) {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!routines || routines.length === 0) {
      setSummary({});
      return;
    }

    const doneByRoutine = {};
    const dateKeys = eachDateKeyInRange(startKey, endKey);

    function recompute() {
      const map = {};
      for (const dateKey of dateKeys) {
        const date = fromDateKey(dateKey);
        let scheduled = 0;
        let done = 0;
        for (const routine of routines) {
          if (routineAppliesOnDate(routine, date)) {
            scheduled++;
            if (doneByRoutine[routine.id]?.has(dateKey)) done++;
          }
        }
        map[dateKey] = { scheduled, done };
      }
      setSummary(map);
    }

    const unsubscribers = routines.map((routine) => {
      doneByRoutine[routine.id] = new Set();
      return subscribeCompletionsInRange(routine.id, startKey, endKey, (doneDateKeys) => {
        doneByRoutine[routine.id] = new Set(doneDateKeys);
        recompute();
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, startKey, endKey]);

  return summary;
}
