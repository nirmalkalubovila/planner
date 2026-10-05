import { useEffect, useRef, useState } from "react";

/**
 * True once the element has scrolled into view, so a looping visual only runs when it can be seen.
 * Without IntersectionObserver it is true straight away. Reduced motion is handled in CSS, not here.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}
