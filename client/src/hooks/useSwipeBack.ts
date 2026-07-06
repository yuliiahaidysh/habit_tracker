import { useEffect, useRef } from "react";

interface SwipeBackOptions {
  onSwipeBack: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export function useSwipeBack({
  onSwipeBack,
  threshold = 100,
  velocityThreshold = 0.5,
}: SwipeBackOptions) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now(),
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y);
      const deltaTime = touchEnd.time - touchStartRef.current.time;

      // Check if swipe is primarily horizontal (not vertical)
      if (deltaY > Math.abs(deltaX) * 0.5) {
        return;
      }

      const velocity = deltaX / deltaTime;

      // Trigger back if swiped from left edge with sufficient distance or velocity
      if (
        touchStartRef.current.x < 50 &&
        (deltaX > threshold || velocity > velocityThreshold)
      ) {
        onSwipeBack();
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeBack, threshold, velocityThreshold]);
}
