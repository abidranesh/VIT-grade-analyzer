"use client";
import { useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function useCountUp(value: number, durationMs = 650, decimals = 2): number {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) { setDisplay(value); return; }
    startRef.current = 0;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      setDisplay(parseFloat(current.toFixed(decimals + 2)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else { setDisplay(value); fromRef.current = value; }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, durationMs, decimals, reduced]);

  useEffect(() => { fromRef.current = value; }, [reduced, value]);

  return display;
}

