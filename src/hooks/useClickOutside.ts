/**
 * @file useClickOutside.ts
 * @description React hook that fires a callback whenever the user clicks outside
 * a given DOM element. Used to close dropdowns, modals, and popovers when the
 * user interacts with the rest of the page.
 *
 * Gotchas:
 * - The hook attaches a "click" listener on `document`. If multiple instances are
 *   mounted simultaneously they each attach their own listener — this is intentional
 *   and correct, but keep it in mind for performance in lists.
 * - The `enabled` guard allows callers to conditionally disable the listener (e.g.
 *   when the element is not visible) without unmounting the component.
 * - `callback` should be stable (useCallback) to avoid re-attaching the listener
 *   on every render, since it is listed as a useEffect dependency.
 */
import { useEffect } from "react";

/**
 * Calls `callback` whenever a click event occurs outside the element referenced
 * by `ref`. The listener is only active when `enabled` is true (default).
 *
 * @param ref      - React ref pointing to the container element to monitor.
 * @param callback - Function to call when an outside click is detected.
 * @param enabled  - When false, the document listener is not attached. Defaults to true.
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
