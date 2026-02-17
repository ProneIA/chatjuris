import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children, isDark }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) { startY.current = null; return; }
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    if (delta > 0) {
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const triggered = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pullDistance > 0 ? "none" : "auto" }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 overflow-hidden transition-all"
        style={{ height: pullDistance }}
      >
        <div
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
            triggered
              ? "border-blue-500 bg-blue-500 text-white scale-110"
              : isDark
              ? "border-neutral-600 bg-neutral-800 text-neutral-400"
              : "border-slate-200 bg-white text-slate-400"
          }`}
          style={{ transform: `rotate(${progress * 360}deg) scale(${0.6 + progress * 0.5})` }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </div>
      </div>

      {/* Content shifted down while pulling */}
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: pullDistance === 0 ? "transform 0.3s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}