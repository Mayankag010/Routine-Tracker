"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DateRoutineRow } from "@/components/DateRoutineRow";
import { DailyNoteSection } from "@/components/DailyNoteSection";
import { routineAppliesOnDate, fromDateKey, toDateKey } from "@/lib/schedule";
import { percentFor } from "@/lib/analytics";

export function DateDetailsDrawer({ dateKey, routines, summary, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount closed, then flip open a frame later so the CSS transition
    // actually animates in instead of snapping to its final state.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setMounted(false);
    setTimeout(onClose, 220); // let the close animation finish first
  }

  if (!dateKey) return null;

  const date = fromDateKey(dateKey);
  const todayKey = toDateKey(new Date());
  const isFuture = dateKey > todayKey;
  const label = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const applicable = routines.filter((r) => routineAppliesOnDate(r, date));
  const stats = summary[dateKey];
  const percent = percentFor(stats);

  return (
    <div className="fixed inset-0 z-30">
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`absolute bg-paper flex flex-col
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          transition-transform duration-200 ease-out
          ${mounted ? "translate-y-0" : "translate-y-full"}
          md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full
          md:w-[400px] md:max-h-none md:rounded-t-none md:rounded-l-2xl
          md:transition-transform md:duration-200 md:ease-out
          ${mounted ? "md:translate-x-0" : "md:translate-x-full"}
        `}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-display text-xl">{label}</h2>
            {applicable.length > 0 && (
              <>
                <p className="text-sm text-inkSoft mt-1">
                  {stats?.done ?? 0} of {applicable.length} routines completed
                </p>
                <div className="h-1.5 w-40 rounded-full bg-paperDark mt-2 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${percent ?? 0}%` }}
                  />
                </div>
              </>
            )}
          </div>
          <button onClick={handleClose} aria-label="Close" className="text-inkSoft hover:text-ink shrink-0 ml-3">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isFuture && (
            <p className="text-sm text-inkSoft py-4">
              Future routines cannot be completed yet.
            </p>
          )}

          {!isFuture && applicable.length === 0 && (
            <div className="py-10 text-center">
              <p className="mb-1">No routines scheduled</p>
              <p className="text-sm text-inkSoft">
                There were no routines planned for this day.
              </p>
            </div>
          )}

          {!isFuture && applicable.length > 0 && (
            <ul className="divide-y divide-line">
              {applicable.map((routine) => (
                <DateRoutineRow
                  key={routine.id}
                  routine={routine}
                  dateKey={dateKey}
                  editable={!isFuture}
                />
              ))}
            </ul>
          )}

          {!isFuture && (
            <div className="mt-6 pt-6 border-t border-line">
              <DailyNoteSection dateKey={dateKey} dateLabel={label} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line shrink-0">
          <button
            onClick={handleClose}
            className="w-full rounded-lg border border-line py-2.5 text-sm hover:border-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
