import { useEffect } from "react";

/**
 * Drives the little walking figure on the active nav icon (see NavIcon):
 * it strides while the page scrolls and waves after sitting idle a while.
 * Ported from the dashboard-focus mockups' `walkers()` script — kept as
 * plain DOM/rAF code since it's pure presentation with no React state.
 */
export default function useNavWalker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hosts = Array.prototype.slice.call(document.querySelectorAll(".ico2")) as HTMLElement[];
    if (!hosts.length) return;

    const IDLE_MS = 1600;
    const WAVE_MS = 3400;

    const q = (h: Element, s: string) => h.querySelector(s) as SVGElement | null;
    const wk = hosts.map((h) => q(h, ".wk"));
    const legA = hosts.map((h) => q(h, ".leg-a"));
    const legB = hosts.map((h) => q(h, ".leg-b"));
    const armA = hosts.map((h) => q(h, ".arm-a"));
    const armB = hosts.map((h) => q(h, ".arm-b"));
    const walkSvg = hosts.map((h) => q(h, ".ic-walk"));
    const btns = hosts.map((h) => h.closest("a, button")) as (HTMLElement | null)[];

    let mode: "panel" | "walk" | "wave" = "panel";
    let lastY = window.scrollY || 0;
    let dir = 1;
    let speed = 0;
    let phase = 0;
    let raf: number | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let waveStart = 0;
    let waveArmed = true;
    let destroyed = false;

    function human(on: boolean) {
      btns.forEach((b) => b && b.classList.toggle("walking9", on));
    }
    function waving(on: boolean) {
      btns.forEach((b) => b && b.classList.toggle("waving9", on));
    }
    function faceLeft(on: boolean) {
      walkSvg.forEach((s) => s && s.classList.toggle("left9", on));
    }
    function apply(la: number, lb: number, aa: number, ab: number, tx: number, ty: number) {
      for (let i = 0; i < hosts.length; i++) {
        legA[i]?.setAttribute("transform", `rotate(${la.toFixed(1)} 12 12.7)`);
        legB[i]?.setAttribute("transform", `rotate(${lb.toFixed(1)} 12 12.7)`);
        armA[i]?.setAttribute("transform", `rotate(${aa.toFixed(1)} 12 8.2)`);
        armB[i]?.setAttribute("transform", `rotate(${ab.toFixed(1)} 12 8.2)`);
        wk[i]?.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
      }
    }

    function poseWalk(t: number) {
      const sw = 30 * Math.sin(t);
      const aw = 24 * Math.sin(t + Math.PI);
      apply(sw - 8, -sw + 8, aw, -aw, 0, 0.5 * Math.abs(Math.cos(t)));
    }

    function poseWave(el: number) {
      const into = Math.min(1, el / 340);
      const outo = Math.min(1, Math.max(0, (WAVE_MS - el) / 340));
      let lift = Math.min(into, outo);
      lift = lift * lift * (3 - 2 * lift);
      const flap = 34 * Math.sin((el / 1000) * 8) * lift;
      apply(-7, 7, 10 + -104 * lift + flap, 12, 0, -0.6 * lift);
    }

    function loop(ts: number) {
      if (destroyed) return;
      if (mode === "walk") {
        phase += 0.22 + speed * 0.055;
        speed *= 0.92;
        poseWalk(phase);
      } else if (mode === "wave") {
        const el = ts - waveStart;
        if (el >= WAVE_MS) {
          setMode("panel");
          return;
        }
        poseWave(el);
      } else {
        raf = null;
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function setMode(next: "panel" | "walk" | "wave") {
      if (mode === next) return;
      mode = next;
      if (next === "panel") {
        human(false);
        faceLeft(false);
        waving(false);
        if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
        apply(-8, 8, 0, 0, 0, 0);
        return;
      }
      human(true);
      waving(next === "wave");
      if (next === "wave") faceLeft(false);
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function busy() {
      return (
        document.hidden ||
        !!document.querySelector(".fx-modal:not([hidden])") ||
        !!document.querySelector(".fx-pop:not([hidden])")
      );
    }

    function fireWave() {
      if (mode !== "panel" || !waveArmed || busy()) return;
      waveStart = performance.now();
      setMode("wave");
      setTimeout(armIdle, WAVE_MS + 200);
    }

    function armIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (mode !== "panel" || !waveArmed || busy()) {
          armIdle();
          return;
        }
        fireWave();
      }, IDLE_MS);
    }

    function poke() {
      waveArmed = true;
      if (mode === "wave") setMode("panel");
      armIdle();
    }

    const onHostEnter = () => {
      if (idleTimer) clearTimeout(idleTimer);
      fireWave();
    };
    hosts.forEach((h) => h.addEventListener("pointerenter", onHostEnter));

    const onScroll = () => {
      const y = window.scrollY || 0;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) < 1) return;
      dir = dy > 0 ? 1 : -1;
      speed = Math.min(14, Math.abs(dy));
      faceLeft(dir < 0);
      setMode("walk");
      waveArmed = true;
      armIdle();
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        if (mode === "walk") setMode("panel");
      }, 260);
    };

    const onVisibility = () => {
      if (document.hidden) {
        setMode("panel");
        if (idleTimer) clearTimeout(idleTimer);
      } else {
        armIdle();
      }
    };

    document.addEventListener("pointerdown", poke, { passive: true });
    document.addEventListener("keydown", poke, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    armIdle();

    return () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      if (stopTimer) clearTimeout(stopTimer);
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener("pointerdown", poke);
      document.removeEventListener("keydown", poke);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      hosts.forEach((h) => h.removeEventListener("pointerenter", onHostEnter));
    };
  }, []);
}
