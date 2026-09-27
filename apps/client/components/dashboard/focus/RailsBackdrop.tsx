import { useEffect, useRef } from "react";

const W = 1200;
const LANES = [98, 182];
const NS = "http://www.w3.org/2000/svg";

/**
 * The subscription hero's backdrop: two faint rails with the occasional pulse
 * travelling along them and landing with a ripple at the right edge. Ported
 * from the subscription mockups' `rails()` script. Colours are read from the
 * fx tokens every frame, so it follows the light/dark switch live. Pauses
 * off-screen and in a background tab; static rails under reduced motion.
 */
export default function RailsBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const svg = svgRef.current;
    if (!host || !svg) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = (t: string, a: Record<string, string | number>) => {
      const n = document.createElementNS(NS, t);
      Object.entries(a).forEach(([k, v]) => n.setAttribute(k, String(v)));
      return n;
    };
    const tok = (v: string) => getComputedStyle(host).getPropertyValue(v).trim();

    svg.innerHTML = "";
    const defs = el("defs", {});
    svg.appendChild(defs);

    /* the rail emerges from the veil and brightens toward the exchange edge */
    const gR = el("linearGradient", { id: "rl9", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: W, y2: 0 });
    const r0 = el("stop", { offset: "0%", "stop-opacity": 0 });
    const r1 = el("stop", { offset: "52%", "stop-opacity": 0.34 });
    const r2 = el("stop", { offset: "100%", "stop-opacity": 0.46 });
    gR.append(r0, r1, r2);
    defs.appendChild(gR);
    LANES.forEach((y) =>
      svg.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y, "stroke-width": 1.1, stroke: "url(#rl9)" })),
    );
    const paintRails = () => {
      r0.setAttribute("stop-color", tok("--fx-deep"));
      r1.setAttribute("stop-color", tok("--fx-deep"));
      r2.setAttribute("stop-color", tok("--fx-teal"));
    };
    paintRails();
    if (reduce) return;

    const glow = el("g", {});
    const tails = el("g", {});
    const dots = el("g", {});
    svg.append(glow, tails, dots);

    type Pulse = {
      g: Element; s0: Element; s1: Element; s2: Element;
      t: Element; s: Element; d: Element;
      x: number; y: number; v: number; len: number;
    };
    const pulses: Pulse[] = [];
    let uid = 0;

    const spawn = (x?: number) => {
      const y = LANES[Math.floor(Math.random() * LANES.length)];
      const id = `pt9-${uid++}`;
      /* userSpaceOnUse, because a horizontal line has no bounding-box height to gradient across */
      const g = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", y1: 0, y2: 0 });
      const s0 = el("stop", { offset: "0%", "stop-opacity": 0 });
      const s1 = el("stop", { offset: "62%", "stop-opacity": 0.38 });
      const s2 = el("stop", { offset: "100%", "stop-opacity": 0.95 });
      g.append(s0, s1, s2);
      defs.appendChild(g);
      const t = el("line", { "stroke-width": 1.8, "stroke-linecap": "round", stroke: `url(#${id})` });
      const s = el("circle", { r: 9, cx: -40, cy: y });
      const d = el("circle", { r: 2.7, cx: -40, cy: y });
      glow.appendChild(s);
      tails.appendChild(t);
      dots.appendChild(d);
      pulses.push({ g, s0, s1, s2, t, s, d, x: x ?? -40, y, v: 0.5 + Math.random() * 0.4, len: 150 + Math.random() * 110 });
    };

    const land = (x: number, y: number) => {
      const r = el("circle", { cx: x, cy: y, r: 3, fill: "none", "stroke-width": 1 });
      glow.appendChild(r);
      let t = 0;
      const grow = () => {
        t += 0.016;
        if (t >= 1) {
          r.remove();
          return;
        }
        r.setAttribute("r", String(3 + t * 26));
        r.setAttribute("opacity", String((1 - t) * 0.3));
        r.setAttribute("stroke", tok("--fx-teal"));
        requestAnimationFrame(grow);
      };
      grow();
    };

    let acc = 0;
    let raf: number | null = null;
    let visible = true;

    const frame = () => {
      const tl = tok("--fx-teal");
      const t2 = tok("--fx-teal2");
      paintRails();
      acc++;
      if (acc % 170 === 0 && pulses.length < 3) spawn();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.x += p.v;
        const back = Math.max(p.x - p.len, 0);
        const o =
          Math.min(Math.max((p.x - 250) / 300, 0), 1) * Math.min(Math.max((W - p.x) / 130, 0), 1);
        p.g.setAttribute("x1", String(back));
        p.g.setAttribute("x2", String(p.x));
        p.s0.setAttribute("stop-color", tl);
        p.s1.setAttribute("stop-color", tl);
        p.s2.setAttribute("stop-color", t2);
        p.t.setAttribute("x1", String(back));
        p.t.setAttribute("y1", String(p.y));
        p.t.setAttribute("x2", String(p.x));
        p.t.setAttribute("y2", String(p.y));
        p.t.setAttribute("opacity", String(o));
        p.d.setAttribute("cx", String(p.x));
        p.d.setAttribute("fill", t2);
        p.d.setAttribute("opacity", String(o));
        p.s.setAttribute("cx", String(p.x));
        p.s.setAttribute("fill", tl);
        p.s.setAttribute("opacity", String(o * 0.13));
        if (p.x >= W - 4) {
          land(W - 4, p.y);
          [p.d, p.s, p.t, p.g].forEach((n) => n.remove());
          pulses.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const pause = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const resume = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVis);
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (es) => {
          visible = es[0].isIntersecting;
          if (visible) resume();
          else pause();
        },
        { threshold: 0 },
      );
      io.observe(host);
    }

    spawn(560);
    spawn(930);
    resume();

    return () => {
      pause();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="fx-hero-chart rails9" ref={hostRef}>
      <svg ref={svgRef} viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true" />
    </div>
  );
}
