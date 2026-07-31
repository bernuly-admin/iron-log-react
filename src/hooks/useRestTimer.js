import { useState, useRef, useCallback, useEffect } from "react";

// Smooth (requestAnimationFrame) rest countdown driven by a target timestamp,
// so it stays accurate even if the tab throttles. Fires a beep + vibrate at 0.
export function useRestTimer() {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds (float, for the ring)
  const [total, setTotal] = useState(0);
  const endRef = useRef(0);
  const rafRef = useRef(0);
  const audioCtxRef = useRef(null);

  const beep = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = (audioCtxRef.current ||= new Ctx());
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + t);
        gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.16);
      });
    } catch {
      /* audio not available */
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setRemaining(0);
    setTotal(0);
  }, []);

  const tick = useCallback(() => {
    const left = (endRef.current - Date.now()) / 1000;
    if (left <= 0) {
      setRemaining(0);
      cancelAnimationFrame(rafRef.current);
      setRunning(false);
      beep();
      try { navigator.vibrate?.([120, 60, 120]); } catch { /* no vibrate */ }
      return;
    }
    setRemaining(left);
    rafRef.current = requestAnimationFrame(tick);
  }, [beep]);

  const start = useCallback((seconds) => {
    // Unlock audio within the user gesture that starts the timer.
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { const c = (audioCtxRef.current ||= new Ctx()); if (c.state === "suspended") c.resume(); }
    } catch { /* ignore */ }
    cancelAnimationFrame(rafRef.current);
    endRef.current = Date.now() + seconds * 1000;
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const adjust = useCallback((delta) => {
    if (!running) return;
    endRef.current += delta * 1000;
    const left = Math.max(0, (endRef.current - Date.now()) / 1000);
    setTotal((t) => Math.max(1, t + delta));
    setRemaining(left);
  }, [running]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { running, remaining, total, start, stop, adjust };
}
