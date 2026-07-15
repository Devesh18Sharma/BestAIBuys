import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

/**
 * Auto-scrolls a container to the bottom when new content arrives, but
 * respects manual scroll-up (won't hijack the user's position).
 *
 * Why we don't use the plain `scroll` event for follow detection:
 * our own programmatic smooth-scroll FIRES scroll events. During the
 * smooth animation the intermediate `scrollTop` is far from the new
 * (just-grown) `scrollHeight`, so a "near bottom" check would flip
 * `following = false` and cancel every subsequent auto-scroll.
 *
 * Instead, the user's intent to scroll up is detected from real input
 * events — `wheel`, `touchmove`, and arrow / page / space keys.
 * Programmatic scrolls don't trigger those. The plain `scroll` event
 * is still listened to, but only to drive the floating "↓" button.
 */
const NEAR_BOTTOM_THRESHOLD = 140;

export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  depCount: number,
) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const followingRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
  }, [containerRef]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    followingRef.current = true;
    setShowScrollButton(false);
  }, [containerRef]);

  /**
   * Externally pause the auto-tail. Useful when something else
   * (e.g. results landing) wants to scroll to a specific anchor instead
   * of the bottom. Caller is responsible for the explicit scroll.
   */
  const setFollowing = useCallback((following: boolean) => {
    followingRef.current = following;
    if (!following) setShowScrollButton(true);
  }, []);

  // Passive scroll handler — only manages the "↓ scroll to bottom" pill.
  // If the user has dragged themselves back to the bottom, re-enable
  // follow mode automatically.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const near = isNearBottom();
      if (near) followingRef.current = true;
      setShowScrollButton(!near);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef, isNearBottom]);

  // User-intent events — explicitly stop following when they scroll up.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onUserScroll = () => {
      // Defer the check by one frame so the scroll position has updated.
      requestAnimationFrame(() => {
        followingRef.current = isNearBottom();
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        onUserScroll();
      }
    };
    el.addEventListener("wheel", onUserScroll, { passive: true });
    el.addEventListener("touchmove", onUserScroll, { passive: true });
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onUserScroll);
      el.removeEventListener("touchmove", onUserScroll);
      el.removeEventListener("keydown", onKey);
    };
  }, [containerRef, isNearBottom]);

  // New chat message → scroll, with a chained rAF + 180ms follow-up so
  // late-laying-out content (MUI cards, framer-motion enter) gets caught.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !followingRef.current) return;
    const r = requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
    );
    const t = setTimeout(() => {
      if (followingRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 180);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [depCount, containerRef]);

  // Content height grows after paint (image loads, expanding cards) — keep tailing.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      if (followingRef.current) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    });

    // Observe every direct child (the message column and the wide results
    // section in ChatShell). Re-observe whenever children are added so new
    // top-level message blocks also feed into the size signal.
    const observeAll = () => {
      ro.disconnect();
      for (const child of Array.from(el.children)) ro.observe(child);
    };
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(el, { childList: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [containerRef]);

  return { showScrollButton, scrollToBottom, setFollowing };
}
