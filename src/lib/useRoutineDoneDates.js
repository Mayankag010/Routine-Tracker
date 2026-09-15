import { useEffect, useState } from "react";
import { subscribeCompletionsInRange } from "@/lib/routines";

/** Returns { [routineId]: Set<dateKey> } of completed days, live-updating. */
export function useRoutineDoneDates(routines, startKey, endKey) {
  const [doneMap, setDoneMap] = useState({});

  useEffect(() => {
    if (!routines || routines.length === 0) {
      setDoneMap({});
      return;
    }

    const unsubscribers = routines.map((routine) =>
      subscribeCompletionsInRange(routine.id, startKey, endKey, (doneDateKeys) => {
        setDoneMap((prev) => ({ ...prev, [routine.id]: new Set(doneDateKeys) }));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines, startKey, endKey]);

  return doneMap;
}
