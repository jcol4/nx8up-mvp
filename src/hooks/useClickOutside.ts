import { useEffect } from "react";

/**
 * Calls the callback when a click occurs outside the element referenced by ref.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [ref, callback, enabled]);
}
