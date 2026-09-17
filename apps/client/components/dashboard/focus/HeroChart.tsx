import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

type Props = {
  /** SVG path "d" for the base equity line, e.g. "M0 210 L60 198 ...". */
  path: string;
  width?: number;
  height?: number;
  /** Hides the fish when the account is down on the day. */
  downDay?: boolean;
};

/* Wavelengths/amplitudes/speeds for the three stacked swells that make the
   surface read as moving water rather than a sine wave. Ported from the
   candleweb-dashboard-focus.html mockup, scaled down from its 1200-wide
   viewBox to this component's default 900-wide one. */
const W = [147, 66, 31];
const S = [0.74, 1.16, 1.72];
const A = [5.7, 3.15, 1.35];
const SWELL = 4.1;
const SWELL_SPEED = 0.42;

/* `bias` is the fraction of the chart width each fish's leftmost reach
   starts from (0 = roams the full width, closer to 1 = stays over on the
   right). The last two are the small pair added on request, kept mostly
   over the right side of the chart. */
const SCHOOL = [
  { len: 25, depth: 0.17, spd: 29, dir: 1, op: 0.85, ph: 0.0, bias: 0.15 },
  { len: 18, depth: 0.31, spd: 20, dir: 1, op: 0.7, ph: 2.1, bias: 0.35 },
  { len: 32, depth: 0.48, spd: 13, dir: -1, op: 0.55, ph: 4.3, bias: 0.25 },
  { len: 11, depth: 0.22, spd: 24, dir: 1, op: 0.65, ph: 1.2, bias: 0.55 },
  { len: 9, depth: 0.4, spd: 18, dir: -1, op: 0.55, ph: 3.4, bias: 0.6 },
];

const MOTES = [2.1, 1.6, 2.3, 1.4];

export default function HeroChart({ path, width = 900, height = 260, downDay = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const midRef = useRef<SVGPathElement>(null);
  const underRef = useRef<SVGPathElement>(null);
  const crestRef = useRef<SVGPathElement>(null);
  const moteRefs = useRef<(SVGCircleElement | null)[]>([]);
  const fishRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    const line = lineRef.current;
    const area = areaRef.current;
    if (reduce || !svg || !line || !area) return;

    const raw = path
      .replace(/[ML]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number);
    const src: Point[] = [];
    for (let i = 0; i + 1 < raw.length; i += 2) src.push({ x: raw[i], y: raw[i + 1] });
    if (src.length < 2) return;

    const STEP = 6;
    const base: Point[] = [];
    for (let x = 0; x <= width; x += STEP) {
      let j = 0;
      while (j < src.length - 2 && src[j + 1].x < x) j++;
      const a = src[j];
      const b = src[j + 1];
      const t = (x - a.x) / (b.x - a.x);
      base.push({ x, y: a.y + (b.y - a.y) * Math.max(0, Math.min(1, t)) });
    }

    const swim = !downDay;

    let kx = 1;
    let ky = 1;
    function measure() {
      const r = svg!.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        kx = width / r.width;
        ky = height / r.height;
      }
    }
    measure();
    window.addEventListener("resize", measure);

    function swell(x: number, s: number, phase: number, scale: number) {
      let v = 0;
      for (let k = 0; k < 3; k++) {
        v += A[k] * scale * Math.sin(x / W[k] + s * S[k] * (k % 2 ? -1 : 1) + phase * (k + 1));
      }
      return v;
    }
    function build(pts: Point[]) {
      let d = "M" + pts[0].x + " " + pts[0].y.toFixed(2);
      for (let i = 1; i < pts.length; i++) d += " L" + pts[i].x + " " + pts[i].y.toFixed(2);
      return d;
    }
    function sampleY(pts: Point[], x: number) {
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(x / STEP)));
      return pts[i].y;
    }

    let t0 = 0;
    let running = true;
    let visible = true;
    let raf = 0;

    function frame(ts: number) {
      if (!running) return;
      if (!t0) t0 = ts;
      const s = (ts - t0) / 1000;
      let ramp = Math.max(0, Math.min(1, (s - 1.9) / 1.6));
      ramp = ramp * ramp * (3 - 2 * ramp);
      const lift = SWELL * Math.sin(s * SWELL_SPEED) * ramp;

      const surface: Point[] = [];
      const midPts: Point[] = [];
      const deepPts: Point[] = [];
      for (let i = 0; i < base.length; i++) {
        const p = base[i];
        surface.push({ x: p.x, y: p.y + lift + swell(p.x, s, 0, 1) * ramp });
        midPts.push({ x: p.x, y: p.y + 10 + lift * 0.7 + swell(p.x, s, 2.1, 0.78) * ramp });
        deepPts.push({ x: p.x, y: p.y + 22 + lift * 0.4 + swell(p.x, s, 4.0, 0.55) * ramp });
      }

      const sd = build(surface);
      line!.setAttribute("d", sd);
      area!.setAttribute("d", `${sd} L${width} ${height} L0 ${height} Z`);
      if (midRef.current) midRef.current.setAttribute("d", `${build(midPts)} L${width} ${height} L0 ${height} Z`);
      if (underRef.current)
        underRef.current.setAttribute("d", `${build(deepPts)} L${width} ${height} L0 ${height} Z`);

      if (crestRef.current) {
        crestRef.current.setAttribute("d", sd);
        crestRef.current.setAttribute("stroke-dashoffset", String(((1 - ((s / 5.2) % 1)) * 860).toFixed(1)));
      }

      const motes = moteRefs.current;
      for (let m = 0; m < motes.length; m++) {
        const el = motes[m];
        if (!el) continue;
        const mx = ((m * (width / 4) + s * 20) % (width + 40)) - 20;
        const my = sampleY(surface, Math.max(0, Math.min(width, mx))) - 3;
        el.setAttribute("cx", mx.toFixed(1));
        el.setAttribute("cy", my.toFixed(1));
        el.setAttribute("opacity", (0.18 + 0.42 * (0.5 + 0.5 * Math.sin(s * 1.3 + m * 1.9))).toFixed(2));
      }

      if (swim) {
        const fish = fishRefs.current;
        for (let f = 0; f < fish.length; f++) {
          const el = fish[f];
          if (!el) continue;
          const cfg = SCHOOL[f % SCHOOL.length];
          const xMin = width * cfg.bias - 60;
          const xMax = width + 60;
          const span = xMax - xMin;
          const travel = (s * cfg.spd + cfg.ph * 140) % span;
          const fx = cfg.dir > 0 ? xMin + travel : xMax - travel;
          const top = sampleY(surface, Math.max(0, Math.min(width, fx)));
          const need = cfg.len * 0.34 + 6;
          const avail = height - 2 - top;
          if (avail < need * 2.1) {
            el.setAttribute("opacity", "0");
            continue;
          }
          let fy = top + avail * cfg.depth + 3 * Math.sin(s * 0.8 + cfg.ph);
          if (fy < top + need) fy = top + need;
          if (fy > height - 2 - need) fy = height - 2 - need;
          const sz = cfg.len / 32;
          const tilt = 4.5 * Math.sin(s * 1.5 + cfg.ph);
          const edge = Math.min(1, Math.min(fx + 40, width + 60 - fx) / 90);
          el.setAttribute("opacity", (cfg.op * Math.max(0, edge)).toFixed(3));
          el.setAttribute(
            "transform",
            `translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${(kx * sz).toFixed(4)} ${(ky * sz).toFixed(
              4,
            )}) rotate(${tilt.toFixed(2)})`,
          );
          const dir = el.querySelector(".fdir") as SVGGElement | null;
          if (dir) {
            dir.setAttribute("transform", cfg.dir > 0 ? "" : "scale(-1 1)");
            const tail = dir.querySelector(".ftail") as SVGPathElement | null;
            if (tail) tail.setAttribute("transform", `rotate(${(19 * Math.sin(s * 5.4 + cfg.ph)).toFixed(2)} -12 0)`);
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function resume() {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame((ts) => {
        t0 = ts - 4000;
        frame(ts);
      });
    }
    function pause() {
      running = false;
      t0 = 0;
      if (raf) cancelAnimationFrame(raf);
    }

    function onVisibility() {
      if (document.hidden) pause();
      else resume();
    }
    document.addEventListener("visibilitychange", onVisibility);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) resume();
          else pause();
        },
        { threshold: 0 },
      );
      io.observe(svg);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
    };
  }, [path, width, height, downDay]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fxeq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2EE6A8" stopOpacity=".26" />
          <stop offset="1" stopColor="#2EE6A8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fxeq2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B8F6B" stopOpacity=".22" />
          <stop offset="1" stopColor="#0B8F6B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fxeq3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2EE6A8" stopOpacity=".16" />
          <stop offset="1" stopColor="#2EE6A8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path ref={underRef} className="fillunder" d="" fill="url(#fxeq2)" />
      <path ref={midRef} className="fillmid" d="" fill="url(#fxeq3)" />
      <path ref={areaRef} className="fillarea" d={`${path} L${width} ${height} L0 ${height} Z`} fill="url(#fxeq)" />

      <g className="school" fill="#03150F" stroke="rgba(158,245,217,.55)" strokeWidth="0.6">
        {SCHOOL.map((_, i) => (
          <g
            className="fish"
            key={i}
            opacity="0"
            ref={(el) => {
              fishRefs.current[i] = el;
            }}
          >
            <g className="fdir">
              <path className="ftail" d="M-12 0 L-21.5 -6.2 L-19 0 L-21.5 6.2 Z" />
              <path d="M-12 0 C-7 -6.4 6 -6.4 12 0 C6 6.4 -7 6.4 -12 0 Z" />
              <path d="M-2 4.6 L2.4 4.6 L-1 8.2 Z" />
            </g>
          </g>
        ))}
      </g>

      <path
        ref={lineRef}
        className="line"
        d={path}
        fill="none"
        stroke="#2EE6A8"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        ref={crestRef}
        className="crest"
        d=""
        fill="none"
        stroke="#7FF3CD"
        strokeWidth="2.2"
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray="70 1000"
        opacity=".85"
      />

      <g className="motes" fill="#7FF3CD">
        {MOTES.map((r, i) => (
          <circle
            key={i}
            className="mote"
            r={r}
            opacity="0"
            ref={(el) => {
              moteRefs.current[i] = el;
            }}
          />
        ))}
      </g>
    </svg>
  );
}
