import { useRef, useState } from "react";

export function useSavedMessage() {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);

  function flash(text = "Settings saved") {
    setMessage(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(""), 2500);
  }

  return [message, flash];
}
