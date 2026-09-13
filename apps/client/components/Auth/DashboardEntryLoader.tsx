import { useEffect, useMemo, useState } from "react";
import useSiteTheme from "../../lib/hooks/useSiteTheme";

/**
 * Full-page loader shown only while signing in or creating an account (see
 * AuthPanel's `busy` state) — everywhere else in the app keeps the plain
 * candle-ring `Loader`. Ported from the "candleweb-loader" mockup: a little
 * flag-bearer walking past a candle chart with a crowd cheering him on.
 * Themed off the site theme (light by default) since that's what the auth
 * pages use, not the dashboard's own dark/light toggle.
 */

const MESSAGES = ["Signing you in", "Loading your dashboard", "Getting things ready"];

const TOKENS = {
  dark: {
    bg: "#08090C",
    line2: "rgba(255,255,255,.13)",
    t1: "#F5F6F4",
    t3: "#6E747C",
    teal: "#2EE6A8",
    deep: "#0B8F6B",
    sk: "rgba(255,255,255,.06)",
    heart: "#FF6F91",
  },
  light: {
    bg: "#FFFFFF",
    line2: "rgba(14,21,18,.20)",
    t1: "#0D1512",
    t3: "#6A7671",
    teal: "#0E9E72",
    deep: "#0B8F6B",
    sk: "rgba(14,21,18,.055)",
    heart: "#F0517A",
  },
};

const CANDLE_HEIGHTS = [34, 52, 40, 68, 48, 76, 58, 88, 64, 96, 72, 104, 62, 84];

function buildScenery() {
  let bars = "";
  let ticks = "";
  for (let pass = 0; pass < 2; pass++) {
    const ox = pass * 420;
    for (let i = 0; i < CANDLE_HEIGHTS.length; i++) {
      const h = CANDLE_HEIGHTS[i];
      const x = ox + i * 30 + 4;
      const y = 168 - h;
      bars += `<rect class="cel-candle${h > 64 ? " up" : ""}" x="${x}" y="${y}" width="13" height="${h}" rx="3"/>`;
    }
    for (let t = 0; t < 14; t++) {
      const tx = ox + t * 30 + 8;
      ticks += `<line class="cel-tick" x1="${tx}" y1="176" x2="${tx + 11}" y2="176"/>`;
    }
  }
  return { bars, ticks };
}

type FanPose = "wave" | "thumb" | "clap" | "cheer";
const CAST: { x: number; s: number; pose: FanPose; near: boolean; d: number }[] = [
  { x: 44, s: 0.72, pose: "wave", near: false, d: 0.0 },
  { x: 140, s: 0.8, pose: "thumb", near: true, d: 0.21 },
  { x: 200, s: 0.66, pose: "clap", near: false, d: 0.55 },
  { x: 336, s: 0.7, pose: "cheer", near: true, d: 0.12 },
  { x: 398, s: 0.76, pose: "wave", near: false, d: 0.34 },
];

const HEART_PATH = "M0 3 C-3.6 .6 -5 -1.6 -3.6 -3.4 C-2.4 -4.9 -.6 -4.2 0 -2.8 C.6 -4.2 2.4 -4.9 3.6 -3.4 C5 -1.6 3.6 .6 0 3 Z";

function heart(hx: number, hy: number, delay: number, drift: number, slow: boolean) {
  return `<g transform="translate(${hx} ${hy})"><path class="cel-heart${slow ? " slow" : ""}" d="${HEART_PATH}" style="animation-delay:${delay.toFixed(2)}s;--dx:${drift}px"/></g>`;
}

const HEART_SOURCES: Record<FanPose, [number, number, number][]> = {
  wave: [[11, -44, 5]],
  thumb: [
    [10, -50, 5],
    [-3, -46, -5],
  ],
  clap: [[1, -49, 4]],
  cheer: [
    [-10, -45, -6],
    [11, -47, 6],
  ],
};

function buildFan(c: (typeof CAST)[number], ox: number) {
  const d = `style="animation-delay:${c.d}s"`;
  const body = '<circle class="head" cx="0" cy="-36" r="6"/><path d="M0 -30 V-16"/><path d="M0 -16 L-7 0"/><path d="M0 -16 L7 0"/>';
  let arms = "";
  if (c.pose === "wave") {
    arms = `<path d="M0 -27 L-8 -18"/><path class="fan-wave" ${d} d="M0 -27 L9 -41"/>`;
  } else if (c.pose === "thumb") {
    arms =
      `<path d="M0 -27 L-8 -18"/><path class="fan-nod" ${d} d="M0 -26 L9 -28 L9 -40"/>` +
      `<circle class="thumb fan-nod" ${d} cx="9" cy="-44" r="3.4"/>`;
  } else if (c.pose === "clap") {
    arms = `<path class="fan-armL" ${d} d="M0 -27 L-8 -21"/><path class="fan-armR" ${d} d="M0 -27 L8 -21"/>`;
  } else {
    arms = '<path d="M0 -27 L-9 -41"/><path d="M0 -27 L9 -41"/>';
  }
  const inner = `<g class="${c.pose === "cheer" ? "fan-hop" : "fan-nod"}" ${d}>${body}${arms}</g>`;
  const sources = HEART_SOURCES[c.pose] || [[0, -48, 4]];
  let withHearts = inner;
  sources.forEach(([hx, hy, drift], i) => {
    withHearts += heart(hx, hy, c.d + i * 0.9, drift, i > 0);
  });
  return `<g class="cel-fan${c.near ? " near" : ""}" transform="translate(${c.x + ox},168) scale(${c.s})">${withHearts}</g>`;
}

function buildFans() {
  let crowd = "";
  for (let pass = 0; pass < 2; pass++) {
    for (const c of CAST) crowd += buildFan(c, pass * 420);
  }
  return crowd;
}

export default function DashboardEntryLoader() {
  const { theme } = useSiteTheme();
  const tk = TOKENS[theme === "light" ? "light" : "dark"];
  const [msgIndex, setMsgIndex] = useState(0);
  const [slow, setSlow] = useState(false);

  const scenery = useMemo(buildScenery, []);
  const fans = useMemo(buildFans, []);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1700);
    const slowTimer = setTimeout(() => setSlow(true), 6000);
    return () => {
      clearInterval(msgTimer);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div className="cel-load" role="status" aria-live="polite" aria-label="Loading Candleweb">
      <div className="cel-in">
        <div className="cel-scene">
          <svg viewBox="0 0 420 200" role="img" aria-label="Candleweb">
            <g className="cel-far" dangerouslySetInnerHTML={{ __html: scenery.bars }} />
            <line className="cel-ground" x1="0" y1="168" x2="420" y2="168" />
            <g className="cel-ticks" dangerouslySetInnerHTML={{ __html: scenery.ticks }} />
            <g className="cel-fans" dangerouslySetInnerHTML={{ __html: fans }} />

            <ellipse className="cel-shadow" cx="252" cy="173" rx="27" ry="4" />

            <g className="cel-walk">
              <line className="cel-pole" x1="268" y1="98" x2="268" y2="34" />
              <g className="cel-cloth">
                <path d="M268 36 H128 L146 58 L128 80 H268 Z" />
                <text x="211" y="64" textAnchor="middle">
                  Candleweb
                </text>
              </g>
              <g className="cel-figure">
                <circle className="head" cx="252" cy="96" r="10.5" />
                <path d="M252 107 V136" />
                <path className="cel-armA" d="M252 114 L234 131" />
                <path d="M252 114 L268 98" />
                <path className="cel-legA" d="M252 136 L266 166" />
                <path className="cel-legB" d="M252 136 L238 166" />
              </g>
            </g>
          </svg>
        </div>

        <p className="cel-msg" key={msgIndex}>
          {MESSAGES[msgIndex]}
        </p>
        <div className="cel-bar">
          <i />
        </div>

        <p className={`cel-slow ${slow ? "on" : ""}`}>
          <b>This is slower than usual.</b> Your trades keep running on the exchange either way —
          nothing depends on this screen being open.
        </p>
      </div>

      <style jsx>{`
        .cel-load {
          position: fixed;
          inset: 0;
          z-index: 999999999;
          display: grid;
          place-items: center;
          background: ${tk.bg};
          animation: celFade 0.3s ease both;
        }
        .cel-in {
          position: relative;
          width: min(420px, calc(100vw - 48px));
          text-align: center;
          color: ${tk.t1};
          font-family: "Outfit", "Helvetica Neue", Arial, sans-serif;
        }
        .cel-scene {
          position: relative;
          width: 100%;
          height: 200px;
          margin-bottom: 22px;
          overflow: hidden;
        }
        .cel-scene svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .cel-scene :global(.cel-far),
        .cel-scene :global(.cel-ticks),
        .cel-scene :global(.cel-fans) {
          animation: celScroll 9s linear infinite;
        }
        .cel-scene :global(.cel-candle) {
          fill: ${tk.sk};
        }
        .cel-scene :global(.cel-candle.up) {
          fill: ${tk.teal};
          opacity: 0.3;
        }
        .cel-ground {
          stroke: ${tk.line2};
          stroke-width: 2;
        }
        .cel-scene :global(.cel-tick) {
          stroke: ${tk.line2};
          stroke-width: 2;
          stroke-linecap: round;
          animation: celScroll 3.6s linear infinite;
        }
        .cel-shadow {
          fill: ${tk.t1};
          opacity: 0.1;
          animation: celShadow 0.46s ease-in-out infinite;
        }
        .cel-walk {
          animation: celBob 0.46s ease-in-out infinite;
        }
        .cel-figure {
          stroke: ${tk.t1};
          stroke-width: 3.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        .cel-figure :global(.head) {
          fill: ${tk.t1};
          stroke: none;
        }
        .cel-armA {
          transform-origin: 252px 114px;
          animation: celStrideB 0.46s ease-in-out infinite;
          stroke-width: 3;
        }
        .cel-legA {
          transform-origin: 252px 136px;
          animation: celStrideA 0.46s ease-in-out infinite;
        }
        .cel-legB {
          transform-origin: 252px 136px;
          animation: celStrideB 0.46s ease-in-out infinite;
        }
        .cel-pole {
          stroke: ${tk.t1};
          stroke-width: 3.4;
          stroke-linecap: round;
        }
        .cel-cloth {
          transform-origin: 268px 58px;
          animation: celFlutter 1.5s ease-in-out infinite;
        }
        .cel-cloth path {
          fill: ${tk.teal};
        }
        .cel-cloth text {
          fill: #04241b;
          font-family: "Outfit", sans-serif;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.2px;
        }
        .cel-scene :global(.cel-fan) {
          stroke: ${tk.t3};
          stroke-width: 2.6;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          opacity: 0.62;
        }
        .cel-scene :global(.cel-fan .head),
        .cel-scene :global(.cel-fan .thumb) {
          fill: ${tk.t3};
          stroke: none;
        }
        .cel-scene :global(.cel-fan.near) {
          opacity: 0.85;
          stroke: ${tk.t1};
        }
        .cel-scene :global(.cel-fan.near .head),
        .cel-scene :global(.cel-fan.near .thumb) {
          fill: ${tk.t1};
        }
        .cel-scene :global(.fan-wave) {
          transform-origin: 0px -27px;
          animation: celWave 0.62s ease-in-out infinite;
        }
        .cel-scene :global(.fan-armL) {
          transform-origin: 0px -27px;
          animation: celClapL 0.44s ease-in-out infinite;
        }
        .cel-scene :global(.fan-armR) {
          transform-origin: 0px -27px;
          animation: celClapR 0.44s ease-in-out infinite;
        }
        .cel-scene :global(.fan-hop) {
          animation: celHop 0.72s cubic-bezier(0.4, 0, 0.5, 1) infinite;
        }
        .cel-scene :global(.fan-nod) {
          animation: celNod 0.9s ease-in-out infinite;
        }
        .cel-scene :global(.cel-heart) {
          fill: ${tk.heart};
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: celHeart 2.7s ease-out infinite;
        }
        .cel-scene :global(.cel-heart.slow) {
          animation-duration: 3.3s;
        }

        @keyframes celStrideA {
          0%,
          100% {
            transform: rotate(24deg);
          }
          50% {
            transform: rotate(-24deg);
          }
        }
        @keyframes celStrideB {
          0%,
          100% {
            transform: rotate(-24deg);
          }
          50% {
            transform: rotate(24deg);
          }
        }
        @keyframes celBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2.5px);
          }
        }
        @keyframes celShadow {
          0%,
          100% {
            transform: scaleX(1);
            opacity: 0.1;
          }
          50% {
            transform: scaleX(0.88);
            opacity: 0.07;
          }
        }
        @keyframes celFlutter {
          0%,
          100% {
            transform: skewY(-3.2deg) scaleX(1);
          }
          35% {
            transform: skewY(2.4deg) scaleX(0.975);
          }
          70% {
            transform: skewY(-1.2deg) scaleX(0.995);
          }
        }
        @keyframes celScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-420px);
          }
        }
        @keyframes celWave {
          0%,
          100% {
            transform: rotate(-17deg);
          }
          50% {
            transform: rotate(19deg);
          }
        }
        @keyframes celClapL {
          0%,
          100% {
            transform: rotate(13deg);
          }
          50% {
            transform: rotate(-9deg);
          }
        }
        @keyframes celClapR {
          0%,
          100% {
            transform: rotate(-13deg);
          }
          50% {
            transform: rotate(9deg);
          }
        }
        @keyframes celHop {
          0%,
          100% {
            transform: translateY(0);
          }
          42% {
            transform: translateY(-7px);
          }
        }
        @keyframes celNod {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @keyframes celHeart {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.35);
          }
          16% {
            opacity: 0.95;
            transform: translate(0, -4px) scale(1);
          }
          55% {
            opacity: 0.75;
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx, 3px), -24px) scale(0.7);
          }
        }
        @keyframes celFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .cel-msg {
          font-size: 14.5px;
          color: ${tk.t3};
          min-height: 21px;
          margin: 0 0 16px;
          animation: celFade 0.3s ease both;
        }
        .cel-bar {
          height: 3px;
          border-radius: 99px;
          background: ${tk.line2};
          overflow: hidden;
          position: relative;
        }
        .cel-bar i {
          display: block;
          height: 100%;
          border-radius: 99px;
          width: 34%;
          background: linear-gradient(90deg, ${tk.deep}, ${tk.teal});
          box-shadow: 0 0 12px rgba(46, 230, 168, 0.45);
          animation: celSweep 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes celSweep {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(330%);
          }
        }
        .cel-slow {
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid ${tk.line2};
          font-size: 12.5px;
          color: ${tk.t3};
          line-height: 1.6;
          opacity: 0;
          transition: opacity 0.5s;
        }
        .cel-slow.on {
          opacity: 1;
        }
        .cel-slow b {
          color: ${tk.t1};
          font-weight: 600;
        }

        @media (prefers-reduced-motion: reduce) {
          .cel-scene :global(.cel-far),
          .cel-scene :global(.cel-ticks),
          .cel-scene :global(.cel-fans),
          .cel-scene :global(.cel-tick),
          .cel-walk,
          .cel-armA,
          .cel-legA,
          .cel-legB,
          .cel-cloth,
          .cel-shadow,
          .cel-bar i,
          .cel-scene :global(.fan-wave),
          .cel-scene :global(.fan-armL),
          .cel-scene :global(.fan-armR),
          .cel-scene :global(.fan-hop),
          .cel-scene :global(.fan-nod),
          .cel-scene :global(.cel-heart) {
            animation: none !important;
          }
          .cel-bar i {
            width: 100%;
            opacity: 0.32;
          }
        }
      `}</style>
    </div>
  );
}
