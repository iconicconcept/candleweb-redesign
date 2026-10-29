import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * The home hero — the waterline, built to `candleweb-home-waterline.html`.
 *
 * Above the surface sits what the user builds: three nodes in n8n. Below it,
 * seen through the water, is what Candleweb runs for them. A candle closes,
 * the market data bubbles up to their webhook, their agent decides, and the
 * decision falls back through the surface as a drop — which splashes, ripples,
 * and then lights each module it passes through on its way to a filled order
 * and an armed stop.
 *
 * ## Why this is imperative rather than React state
 *
 * Every frame of it is measurement: the wires between modules are SVG paths
 * computed from `getBoundingClientRect`, the surface is a sine field redrawn
 * per frame, and the lens is a mask position chased with easing. Driving that
 * through state would re-render the tree sixty times a second to move
 * attributes React does not own anyway. So the whole engine runs in one
 * effect against refs, exactly as the design does, and React keeps ownership
 * of the markup.
 *
 * Two consequences worth knowing:
 *
 *  - **The bubbles are not React's.** They are created and destroyed by the
 *    engine and inserted before the water layer, which is safe because React
 *    only reconciles the nodes it created itself. They are all removed on
 *    cleanup.
 *  - **Nothing the engine measures may carry `landing-rise`.** That class
 *    holds a `translateY(24px)` until the reveal observer clears it, and a
 *    transform moves `getBoundingClientRect` — so the build panel and every
 *    module would be wired up at the wrong coordinates. The reveal is kept to
 *    the copy column, which the engine never measures.
 */

/* The order the story walks, below the surface. Each key is a module's
   `data-m`, and the wires are built between consecutive pairs. */
const PATH = [
  "intake",
  "checks",
  "size",
  "router",
  "exch",
  "fills",
  "stop",
  "trail",
  "review",
] as const;

/* What the console reads as each module lights. One real trade, start to
   finish, with the clock moving as it would. */
const LOG: Record<string, string> = {
  intake: "14:45:01  decision in · buy · 15% of balance · moderate",
  checks: "14:45:01  checks passed · BTC/USDT · balance ok · trade-only key",
  size: "14:45:01  sized → 0.0311 BTC",
  router: "14:45:02  order routed",
  exch: "14:45:02  KuCoin · market buy sent",
  fills: "14:45:02  filled 0.0311 BTC @ 64,356.10",
  stop: "14:45:02  stop armed on exchange · 64,046.00",
  trail: "15:31:40  stop trailed ↑ 64,813.00",
  review: "16:20:41  stop hit · closed +0.71% · journaled for bot review",
};
const IDLE = "watching 4 exchanges · waiting for the next candle close";

const NS = "http://www.w3.org/2000/svg";

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
};

export default function WaterlineHero() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const deepRef = useRef<HTMLDivElement | null>(null);
  const waterRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLSpanElement | null>(null);
  const logRef = useRef<HTMLSpanElement | null>(null);
  const surfRef = useRef<SVGSVGElement | null>(null);
  const wbRef = useRef<SVGPathElement | null>(null);
  const wfRef = useRef<SVGPathElement | null>(null);
  const wcRef = useRef<SVGPathElement | null>(null);
  const r1Ref = useRef<SVGEllipseElement | null>(null);
  const r2Ref = useRef<SVGEllipseElement | null>(null);
  const baseRef = useRef<SVGSVGElement | null>(null);
  const hotRef = useRef<SVGSVGElement | null>(null);
  const hookRef = useRef<HTMLDivElement | null>(null);
  const agentRef = useRef<HTMLDivElement | null>(null);
  const httpRef = useRef<HTMLDivElement | null>(null);
  const agentIRef = useRef<HTMLElement | null>(null);
  const kucoinRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const deep = deepRef.current;
    const water = waterRef.current;
    const lens = lensRef.current;
    const surf = surfRef.current;
    const WB = wbRef.current;
    const WF = wfRef.current;
    const WC = wcRef.current;
    const R1 = r1Ref.current;
    const R2 = r2Ref.current;
    const base = baseRef.current;
    const hot = hotRef.current;
    const drop = dropRef.current;
    const logEl = logRef.current;
    const agentI = agentIRef.current;
    const kucoin = kucoinRef.current;
    const N = {
      hook: hookRef.current,
      agent: agentRef.current,
      http: httpRef.current,
    };
    if (
      !scene ||
      !deep ||
      !water ||
      !lens ||
      !surf ||
      !WB ||
      !WF ||
      !WC ||
      !R1 ||
      !R2 ||
      !base ||
      !hot ||
      !drop ||
      !logEl ||
      !agentI ||
      !kucoin ||
      !N.hook ||
      !N.agent ||
      !N.http
    ) {
      return;
    }

    const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const M: Record<string, HTMLElement> = {};
    scene.querySelectorAll<HTMLElement>("[data-m]").forEach((el) => {
      if (el.dataset.m) M[el.dataset.m] = el;
    });

    const easeIO = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const mkEl = <K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs: Record<string, string | number>,
      parent: SVGSVGElement,
    ): SVGElementTagNameMap[K] => {
      const e = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => e.setAttribute(k, String(attrs[k])));
      parent.appendChild(e);
      return e;
    };

    /* Every coordinate in the scene is relative to the scene box, so a wire
       drawn into either overlay lands on the module it describes whatever the
       page has scrolled to. */
    const box = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      const s = scene.getBoundingClientRect();
      return {
        x: r.left - s.left,
        y: r.top - s.top,
        w: r.width,
        h: r.height,
        cx: r.left - s.left + r.width / 2,
        cy: r.top - s.top + r.height / 2,
      };
    };

    /* A cubic between two boxes, leaving and entering by whichever side faces
       the other — so the wiring reads as plumbing rather than as a web of
       diagonals across the grid. */
    const link = (a: Box, b: Box): string => {
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      if (Math.abs(dy) > Math.abs(dx) * 0.6) {
        const x1 = a.cx;
        const y1 = dy > 0 ? a.y + a.h : a.y;
        const x2 = b.cx;
        const y2 = dy > 0 ? b.y : b.y + b.h;
        const my = (y1 + y2) / 2;
        return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
      }
      const x1 = dx > 0 ? a.x + a.w : a.x;
      const y1 = a.cy;
      const x2 = dx > 0 ? b.x : b.x + b.w;
      const y2 = b.cy;
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    };

    let W = 0;
    let H = 0;
    let SKY = 0;
    let mobile = false;
    let LR = 120;
    let hotPaths: (SVGPathElement & { _len?: number })[] = [];
    let skyPaths: SVGPathElement[] = [];
    let skyPk: SVGCircleElement | null = null;
    let bubbles: HTMLSpanElement[] = [];
    let lensInit = false;
    let lx = 0;
    let ly = 0;
    let tx = 0;
    let ty = 0;
    let lastPointer = -1e9;
    let focus: HTMLElement | null = null;

    const bubble = (src: Box, hookBox: Box, isBurst: boolean) => {
      const b = document.createElement("span");
      b.className = "landing-wl-bub" + (isBurst ? " burst" : "");
      const x = src.x + src.w * (0.25 + Math.random() * 0.5);
      b.style.setProperty("--bx", `${x}px`);
      b.style.setProperty("--b0", `${src.y + 8}px`);
      b.style.setProperty("--b1", `${SKY - 2}px`);
      b.style.setProperty(
        "--bw",
        `${(hookBox.cx - x) * (isBurst ? 0.9 : 0.4) + (Math.random() * 24 - 12)}px`,
      );
      b.style.setProperty(
        "--bs",
        `${isBurst ? 5 + Math.random() * 6 : 3 + Math.random() * 6}px`,
      );
      b.style.setProperty(
        "--bd",
        `${isBurst ? 1.3 + Math.random() * 0.5 : 4 + Math.random() * 3.5}s`,
      );
      b.style.setProperty(
        "--bl",
        `${isBurst ? Math.random() * 0.35 : -Math.random() * 7}s`,
      );
      scene.insertBefore(b, water);
      if (isBurst) {
        b.addEventListener("animationend", () => b.remove());
      }
      return b;
    };

    const burst = () => {
      const src = box(M.data);
      const hookBox = box(N.hook as HTMLElement);
      for (let k = 0; k < 9; k += 1) bubble(src, hookBox, true);
    };

    const layout = () => {
      W = scene.clientWidth;
      H = scene.clientHeight;
      SKY = deep.offsetTop;
      mobile = W < 760;
      LR = mobile ? 86 : 125;

      surf.style.top = `${SKY - 24}px`;
      surf.setAttribute("viewBox", `0 0 ${W} 48`);
      water.style.top = `${SKY + 20}px`;
      water.style.setProperty("--lr", `${LR}px`);
      lens.style.width = `${LR * 1.72}px`;
      lens.style.height = `${LR * 1.72}px`;
      [base, hot].forEach((s) => {
        s.setAttribute("viewBox", `0 0 ${W} ${H}`);
        s.innerHTML = "";
      });

      hotPaths = [];
      for (let i = 0; i < PATH.length - 1; i += 1) {
        const d = link(box(M[PATH[i]]), box(M[PATH[i + 1]]));
        mkEl("path", { class: "landing-wl-wire", d }, base);
        const hp = mkEl("path", { class: "landing-wl-hw", d }, hot) as
          SVGPathElement & { _len?: number };
        const L = hp.getTotalLength();
        hp.style.strokeDasharray = `${L} ${L}`;
        hp.style.strokeDashoffset = String(L);
        hp._len = L;
        hotPaths.push(hp);
      }
      /* The two feeds that are always on rather than part of the story: the
         watchers into the exchanges, and the key vault into the router. */
      mkEl(
        "path",
        { class: "landing-wl-wire", d: link(box(M.watch), box(M.exch)) },
        base,
      );
      mkEl(
        "path",
        { class: "landing-wl-wire", d: link(box(M.vault), box(M.router)) },
        base,
      );

      skyPaths = [];
      (
        [
          ["hook", "agent"],
          ["agent", "http"],
        ] as const
      ).forEach((pr) => {
        const a = box(N[pr[0]] as HTMLElement);
        const b = box(N[pr[1]] as HTMLElement);
        const mx = (a.x + a.w + b.x) / 2;
        const d = `M${a.x + a.w} ${a.cy} C${mx} ${a.cy} ${mx} ${b.cy} ${b.x} ${b.cy}`;
        skyPaths.push(mkEl("path", { class: "landing-wl-sw", d }, hot));
      });
      skyPk = mkEl(
        "circle",
        { class: "landing-wl-pk", r: 4, cx: -20, cy: -20 },
        hot,
      );

      const src = box(M.data);
      const hookBox = box(N.hook as HTMLElement);
      bubbles.forEach((b) => b.remove());
      bubbles = [];
      if (!REDUCE) {
        for (let k = 0; k < 11; k += 1) {
          bubbles.push(bubble(src, hookBox, false));
        }
      }
      if (!lensInit) {
        lx = W / 2;
        tx = W / 2;
        ly = SKY + 160;
        ty = SKY + 160;
        lensInit = true;
      }
    };

    /* ---- the surface ----
       Two sine layers, plus a real ripple travelling out from wherever the
       decision landed, so the splash is the same event the drop caused rather
       than a loop that happens to be playing. */
    let rip: { x: number; t: number } | null = null;
    const waveY = (x: number, t: number, front: boolean) => {
      let y =
        24 +
        (front
          ? 5 * Math.sin(x / 95 + t * 1.35) + 3 * Math.sin(x / 38 - t * 2.2)
          : 4 * Math.sin(x / 110 + t * 1.1 + 1) +
            2.5 * Math.sin(x / 43 - t * 1.7));
      if (front && rip) {
        const dt = t - rip.t;
        const dist = Math.abs(x - rip.x);
        if (dt < 3.2 && dist < dt * 280) {
          y +=
            10 *
            Math.exp(-dt * 1.25) *
            Math.exp(-dist / 200) *
            Math.sin(dist / 15 - dt * 11);
        }
      }
      return y;
    };
    const drawSurface = (t: number) => {
      const step = mobile ? 12 : 14;
      let b = "";
      let f = "";
      for (let x = 0; x <= W + step; x += step) {
        b += `${x ? "L" : "M"}${x} ${waveY(x, t, false).toFixed(1)}`;
        f += `${x ? "L" : "M"}${x} ${waveY(x, t, true).toFixed(1)}`;
      }
      WB.setAttribute("d", b);
      WC.setAttribute("d", f);
      WF.setAttribute("d", `${f} L${W + step} 48 L0 48 Z`);
    };
    const splash = (x: number, t: number) => {
      rip = { x, t };
      [R1, R2].forEach((r) => {
        r.setAttribute("cx", String(x));
        r.setAttribute("cy", "24");
        r.classList.remove("is-on");
        void r.getBBox();
        r.classList.add("is-on");
      });
    };

    /* ---- the lens ----
       Follows the pointer while there is one, and after a couple of seconds
       without goes back to following whichever module the story is lighting —
       so the water is always clear where the thing being described is. */
    const onPointerMove = (e: PointerEvent) => {
      const s = scene.getBoundingClientRect();
      const y = e.clientY - s.top;
      if (y < SKY) return;
      tx = e.clientX - s.left;
      ty = y;
      lastPointer = performance.now();
    };
    const drawLens = (now: number, t: number) => {
      const auto = now - lastPointer > 2600;
      if (auto) {
        if (focus) {
          const b = box(focus);
          tx = b.cx;
          ty = b.cy;
        } else {
          tx = W * (0.5 + 0.32 * Math.sin(t * 0.35));
          ty =
            SKY + 90 + (H - SKY - 150) * (0.5 + 0.45 * Math.sin(t * 0.52 + 1));
        }
      }
      const k = auto ? 0.05 : 0.2;
      lx += (tx - lx) * k;
      ly += (ty - ly) * k;
      const top = SKY + 20;
      const size = LR * 1.72;
      water.style.setProperty("--lx", `${lx.toFixed(1)}px`);
      water.style.setProperty("--ly", `${(ly - top).toFixed(1)}px`);
      lens.style.transform = `translate(${(lx - size / 2).toFixed(1)}px,${(ly - size / 2).toFixed(1)}px)`;
      lens.style.opacity = ly < top - 10 ? "0" : "1";
    };

    /* ---- tweens, all driven by the one frame loop ---- */
    type Tween = {
      t0: number | null;
      dur: number;
      fn: (k: number) => void;
      done?: () => void;
    };
    let tweens: Tween[] = [];
    const tween = (dur: number, fn: (k: number) => void, done?: () => void) => {
      tweens.push({ t0: null, dur, fn, done });
    };
    const runTweens = (now: number) => {
      tweens = tweens.filter((tw) => {
        if (tw.t0 === null) tw.t0 = now;
        const k = Math.min(1, (now - tw.t0) / tw.dur);
        tw.fn(k);
        if (k >= 1) {
          if (tw.done) tw.done();
          return false;
        }
        return true;
      });
    };
    const travelSky = (i: number, dur: number) => {
      const p = skyPaths[i];
      if (!p || !skyPk) return;
      const L = p.getTotalLength();
      tween(
        dur,
        (k) => {
          const q = p.getPointAtLength(L * easeIO(k));
          skyPk?.setAttribute("cx", String(q.x));
          skyPk?.setAttribute("cy", String(q.y));
        },
        () => skyPk?.setAttribute("cx", "-20"),
      );
    };
    /* The decision falling out of the user's HTTP node and through the
       surface into Candleweb's intake — one bezier, splashing the moment it
       crosses the waterline rather than when the tween ends. */
    const fall = () => {
      const a = box(N.http as HTMLElement);
      const b = box(M.intake);
      const x0 = a.cx;
      const y0 = a.y + a.h;
      const x3 = b.cx;
      const y3 = b.y;
      const x1 = x0;
      const y1 = SKY + 30;
      const x2 = x3;
      const y2 = y3 - 50;
      let splashed = false;
      drop.classList.add("is-on");
      tween(
        900,
        (k) => {
          const e = k * k * (3 - 2 * k);
          const u = 1 - e;
          const x =
            u * u * u * x0 + 3 * u * u * e * x1 + 3 * u * e * e * x2 + e * e * e * x3;
          const y =
            u * u * u * y0 + 3 * u * u * e * y1 + 3 * u * e * e * y2 + e * e * e * y3;
          drop.style.transform = `translate(${x}px,${y}px)`;
          if (!splashed && y >= SKY - 2) {
            splashed = true;
            splash(x, performance.now() / 1000);
          }
        },
        () => drop.classList.remove("is-on"),
      );
    };

    /* ---- the story, one candle at a time ---- */
    let timers: number[] = [];
    let running = false;
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const clearTimers = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const say = (s: string) => {
      logEl.textContent = s;
      logEl.classList.remove("is-flip");
      void logEl.offsetWidth;
      logEl.classList.add("is-flip");
    };
    const reset = () => {
      PATH.forEach((k) => M[k]?.classList.remove("is-hot", "is-warm"));
      M.data?.classList.remove("is-hot");
      hotPaths.forEach((p) => {
        p.style.transition = "none";
        p.style.strokeDashoffset = String(p._len ?? 0);
      });
      (Object.keys(N) as (keyof typeof N)[]).forEach((k) =>
        N[k]?.classList.remove("is-on", "is-thinking"),
      );
      agentI.textContent = "your prompt";
      kucoin.classList.remove("is-on");
      focus = null;
    };
    const light = (i: number) => {
      const k = PATH[i];
      if (i > 0) {
        M[PATH[i - 1]]?.classList.remove("is-hot");
        M[PATH[i - 1]]?.classList.add("is-warm");
        const hp = hotPaths[i - 1];
        if (hp) {
          hp.style.transition = "stroke-dashoffset .45s ease";
          hp.style.strokeDashoffset = "0";
        }
      }
      M[k]?.classList.add("is-hot");
      focus = M[k] ?? null;
      if (k === "exch") kucoin.classList.add("is-on");
      say(LOG[k]);
    };
    const cycle = () => {
      if (!running) return;
      clearTimers();
      reset();
      at(0, () => {
        M.data?.classList.add("is-hot");
        focus = M.data ?? null;
        burst();
        say("14:45:00  candle closed · indicators computed for BTC/USDT 15m");
      });
      at(1500, () => {
        M.data?.classList.remove("is-hot");
        N.hook?.classList.add("is-on");
        focus = null;
        travelSky(0, 600);
      });
      at(2100, () => {
        N.hook?.classList.remove("is-on");
        N.agent?.classList.add("is-thinking");
        agentI.textContent = "deciding";
      });
      at(3200, () => {
        N.agent?.classList.remove("is-thinking");
        N.agent?.classList.add("is-on");
        agentI.textContent = "buy · 15%";
        travelSky(1, 550);
      });
      at(3750, () => {
        N.agent?.classList.remove("is-on");
        N.http?.classList.add("is-on");
      });
      at(3950, () => {
        N.http?.classList.remove("is-on");
        fall();
      });
      let t = 4850;
      PATH.forEach((k, i) => {
        at(t, () => light(i));
        t += k === "trail" ? 900 : 520;
      });
      at(t + 1600, () => {
        const last = M[PATH[PATH.length - 1]];
        last?.classList.remove("is-hot");
        last?.classList.add("is-warm");
        focus = null;
        say(IDLE);
      });
      at(t + 3400, cycle);
    };

    let raf = 0;
    let looping = false;
    let inView = false;
    const frame = (now: number) => {
      if (!looping) return;
      const t = now / 1000;
      drawSurface(t);
      drawLens(now, t);
      runTweens(now);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (looping) return;
      looping = true;
      raf = requestAnimationFrame(frame);
      running = true;
      cycle();
    };
    const stop = () => {
      looping = false;
      running = false;
      cancelAnimationFrame(raf);
      clearTimers();
      tweens = [];
      drop.classList.remove("is-on");
    };

    layout();
    /* Only when there is something for it to steer: with reduced motion the
       lens is not rendered and the frame loop never starts. */
    if (!REDUCE) scene.addEventListener("pointermove", onPointerMove);

    let rz = 0;
    const onResize = () => {
      window.clearTimeout(rz);
      rz = window.setTimeout(() => {
        layout();
        if (running) cycle();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    /* The copy reflows as webfonts land, which moves the waterline without a
       resize event ever firing — and every wire is measured against it. The
       design waits on `fonts.ready`; the observer below covers the rest (a
       lazy image above, a long word wrapping) and is guarded on the measured
       height so re-laying out can never feed itself. */
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => layout()).catch(() => undefined);
    }
    let lastH = scene.clientHeight;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (Math.abs(scene.clientHeight - lastH) < 2) return;
        lastH = scene.clientHeight;
        onResize();
      });
      ro.observe(scene);
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };

    let io: IntersectionObserver | null = null;
    if (REDUCE) {
      /* The end state, held still: a flat surface, the wiring drawn, every
         module lit warm and KuCoin selected. Nothing moves and nothing is
         scheduled. */
      drawSurface(0);
      PATH.forEach((k) => M[k]?.classList.add("is-warm"));
      hotPaths.forEach((p) => {
        p.style.strokeDashoffset = "0";
      });
      kucoin.classList.add("is-on");
    } else if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (es) => {
          inView = es[0].isIntersecting;
          if (inView) start();
          else stop();
        },
        { threshold: 0.08 },
      );
      io.observe(scene);
      document.addEventListener("visibilitychange", onVisibility);
    } else {
      inView = true;
      start();
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stop();
      window.clearTimeout(rz);
      window.removeEventListener("resize", onResize);
      scene.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
      ro?.disconnect();
      /* The bubbles are the engine's own DOM, so the engine takes them with
         it — React never knew they were there. */
      scene.querySelectorAll(".landing-wl-bub").forEach((b) => b.remove());
    };
  }, []);

  return (
    <section className="landing-wl" id="top">
      <div className="landing-wl-scene" ref={sceneRef}>
        {/* ---- above the surface ---- */}
        <div className="landing-wrap landing-wl-sky">
          <div className="landing-wl-copy">
            <p className="landing-eyebrow landing-rise">
              Infrastructure for agentic trading
            </p>
            <h1 className="landing-rise rise-left">
              Bring your AI agents.
              <br />
              <span>We&rsquo;ll run the hard part.</span>
            </h1>
            <p className="landing-sub landing-rise">
              Your agent makes the call. Candleweb runs everything under the
              waterline: market data with 400+ indicators, execution on four
              exchanges, round-the-clock monitoring and a review of every trade.
            </p>
            <div className="landing-hero-cta landing-rise rise-left">
              <Link className="landing-btn landing-btn-amber" href="#access">
                Get Started <span>↗</span>
              </Link>
              <Link className="landing-btn landing-btn-teal" href="#how">
                See the handoff
              </Link>
            </div>
          </div>

          {/* The three nodes the user builds. Measured by the engine, so no
              reveal class may go on this column — see the note above. */}
          <div className="landing-wl-build">
            <div className="landing-wl-tag">
              what you build<b>three nodes in n8n</b>
            </div>
            <div className="landing-wl-flow">
              <div className="landing-wn" ref={hookRef}>
                <span className="ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                  </svg>
                </span>
                <div>
                  <b>Webhook</b>
                  <i>candle in</i>
                </div>
              </div>
              <div className="landing-wn" ref={agentRef}>
                <span className="ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="7" width="14" height="11" rx="3" />
                    <path d="M12 3v4M9 12h.01M15 12h.01M9.5 15h5" />
                  </svg>
                </span>
                <div>
                  <b>AI agent</b>
                  <i ref={agentIRef}>your prompt</i>
                </div>
              </div>
              <div className="landing-wn" ref={httpRef}>
                <span className="ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h12M13 6l6 6-6 6" />
                  </svg>
                </span>
                <div>
                  <b>HTTP request</b>
                  <i>&rarr; Candleweb</i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- the surface ---- */}
        <svg className="landing-wl-surf" ref={surfRef} aria-hidden="true">
          <path className="landing-wl-wb" ref={wbRef} />
          <path className="landing-wl-wf" ref={wfRef} />
          <path className="landing-wl-wc" ref={wcRef} />
          <ellipse className="landing-wl-rip" ref={r1Ref} rx="120" ry="12" />
          <ellipse
            className="landing-wl-rip b"
            ref={r2Ref}
            rx="80"
            ry="8"
          />
        </svg>

        {/* ---- below the surface ---- */}
        <div className="landing-wrap landing-wl-deep" ref={deepRef}>
          <span className="landing-wl-tag">&darr; what Candleweb runs</span>
          <div className="landing-wl-grid">
            <div
              className="landing-wm is-warm"
              data-m="watch"
              style={{ gridArea: "watch" }}
            >
              <span className="hb" />
              <b>Stream watchers</b>
              <i>exchange feeds, always on</i>
            </div>
            <div className="landing-wm" data-m="vault" style={{ gridArea: "vault" }}>
              <b>Key vault</b>
              <i>trade-only keys, never withdrawals</i>
            </div>
            <div
              className="landing-wm src"
              data-m="data"
              style={{ gridArea: "data" }}
            >
              <b>Market data engine</b>
              <i>OHLCV + 400+ indicators</i>
            </div>
            <div
              className="landing-wm"
              data-m="intake"
              style={{ gridArea: "intake" }}
            >
              <b>Webhook intake</b>
              <i>your bot&rsquo;s decision</i>
            </div>
            <div className="landing-wm" data-m="exch" style={{ gridArea: "exch" }}>
              <b>Exchanges</b>
              <div className="landing-wl-xch">
                <span ref={kucoinRef}>KuCoin</span>
                <span>Binance</span>
                <span>Bybit</span>
                <span>BitMart</span>
              </div>
            </div>
            <div
              className="landing-wm"
              data-m="router"
              style={{ gridArea: "router" }}
            >
              <b>Order router</b>
              <i>retries, rate limits</i>
            </div>
            <div className="landing-wm" data-m="size" style={{ gridArea: "size" }}>
              <b>Risk sizing</b>
              <i>from your risk appetite</i>
            </div>
            <div
              className="landing-wm"
              data-m="checks"
              style={{ gridArea: "checks" }}
            >
              <b>Decision checks</b>
              <i>pair, balance, permissions</i>
            </div>
            <div
              className="landing-wm"
              data-m="fills"
              style={{ gridArea: "fills" }}
            >
              <b>Fill tracking</b>
              <i>partials, remainders</i>
            </div>
            <div className="landing-wm" data-m="stop" style={{ gridArea: "stop" }}>
              <b>Stop placement</b>
              <i>on the exchange</i>
            </div>
            <div
              className="landing-wm"
              data-m="trail"
              style={{ gridArea: "trail" }}
            >
              <b>Trailing stop</b>
              <i>follows price up</i>
            </div>
            <div
              className="landing-wm"
              data-m="review"
              style={{ gridArea: "review" }}
            >
              <b>Journal + bot review</b>
              <i>edits for your prompt</i>
            </div>
          </div>
          <div className="landing-wl-console">
            <span ref={logRef}>{IDLE}</span>
          </div>
        </div>

        <svg className="landing-wl-wires base" ref={baseRef} aria-hidden="true" />
        <div className="landing-wl-water" ref={waterRef} />
        <svg className="landing-wl-wires hot" ref={hotRef} aria-hidden="true" />
        <div className="landing-wl-lens" ref={lensRef} />
        <span className="landing-wl-drop" ref={dropRef} />
      </div>
    </section>
  );
}
