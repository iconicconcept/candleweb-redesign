import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import { writeClipboard } from "../lib/hooks/useClipboard";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

/* The downloadable template lives in public/, so it is served from the site
   root. Its developer keys are examples; the trade URLs are placeholders and
   the n8n credential ids are removed. */
const TEMPLATE_FILE = "/candleweb-trading-bot-workflow.json";
const TEMPLATE_NAME = "My Candleweb Trading Bot Workflow.json";

const NAV: { heading: string; items: { id: string; label: string }[] }[] = [
  {
    heading: "Overview",
    items: [
      { id: "overview", label: "What you will build" },
      { id: "actions", label: "How Candleweb acts" },
    ],
  },
  {
    heading: "Set up in Candleweb",
    items: [
      { id: "mode", label: "Choose Demo or Live" },
      { id: "bot", label: "Create a bot" },
      { id: "trade", label: "Create a trade" },
      { id: "connect", label: "Connection details" },
    ],
  },
  {
    heading: "Quick start",
    items: [{ id: "template", label: "Use the template" }],
  },
  {
    heading: "Build it in n8n",
    items: [
      { id: "credential", label: "Save your key" },
      { id: "schedule", label: "Run once per candle" },
      { id: "candles", label: "Get the candles" },
      { id: "has-data", label: "Skip empty runs" },
      { id: "prepare", label: "Prepare for the AI" },
      { id: "ai", label: "The AI decision" },
      { id: "send", label: "Send the decision" },
      { id: "test", label: "Test, then switch on" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { id: "schema", label: "Output schema" },
      { id: "fields", label: "Decision fields" },
      { id: "errors", label: "Troubleshooting" },
    ],
  },
];

const ALL_IDS = NAV.flatMap((group) => group.items.map((item) => item.id));

/** Click-to-copy with a short "Copied" confirmation. */
const useCopied = (text: string) => {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(t);
  }, [state]);
  const copy = async () => setState((await writeClipboard(text)) ? "ok" : "fail");
  return { state, copy };
};

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6.5A1.5 1.5 0 016.5 5H15" />
  </svg>
);

/**
 * A code block. With `label`, it is something the reader is told to paste,
 * so it gets a bar with a Copy button. Without, it is an example to read
 * (a diagram, a shortened response) and stays a plain block.
 */
const Code = ({ children, label }: { children: string; label?: string }) => {
  const { state, copy } = useCopied(children);
  if (!label) return <pre className="docs-pre">{children}</pre>;
  return (
    <div className="docs-code">
      <div className="docs-code-bar">
        <span>{label}</span>
        <button type="button" className={`docs-copy ${state}`} onClick={copy} aria-label={`Copy ${label}`}>
          <CopyIcon />
          {state === "ok" ? "Copied" : state === "fail" ? "Select and copy" : "Copy"}
        </button>
      </div>
      <pre className="docs-pre">{children}</pre>
      <span className="docs-sr" role="status" aria-live="polite">
        {state === "ok" ? `${label} copied` : ""}
      </span>
    </div>
  );
};

/** A short value to type into n8n (a header name, a cron expression). */
const CopyCode = ({ children }: { children: string }) => {
  const { state, copy } = useCopied(children);
  return (
    <span className="docs-icopy">
      <code>{children}</code>
      <button
        type="button"
        className={`docs-icopy-btn ${state}`}
        onClick={copy}
        aria-label={state === "ok" ? "Copied" : `Copy ${children}`}
        title={state === "ok" ? "Copied" : "Copy"}
      >
        {state === "ok" ? "✓" : <CopyIcon />}
      </button>
    </span>
  );
};

const Note = ({
  kind,
  title,
  children,
}: {
  kind: "warn" | "tip";
  title: string;
  children: ReactNode;
}) => (
  <div className={`docs-note docs-note--${kind}`}>
    <strong>{title}</strong>
    <div>{children}</div>
  </div>
);

const Table = ({
  head,
  rows,
  plain,
}: {
  head: string[];
  rows: ReactNode[][];
  plain?: boolean;
}) => (
  <div className="docs-tw">
    <table className={`docs-table${plain ? " docs-table--plain" : ""}`}>
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell}>{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PIPELINE = `[On each candle close] → [Get Candles] → [Has Data?] → [Prepare for AI] → [AI Decision] → [Send Decision]`;

const CANDLES_RES = `{
  "status": "success",
  "trade_id": 42,
  "pair": "BTCUSDT",
  "timeframe": "15m",
  "is_stale": false,
  "delivery_id": 5120,
  "market_data_ids": [8801, 8802, 8803],
  "position": null,
  "risk_preview": {
    "min_confidence": 50,
    "accepted_risks": ["LOW", "MEDIUM"],
    "would_arm": true,
    "blocked_by": null,
    "agent_exits": false,
    "stop_pct": "0.0075",
    "size_quote": "50.00",
    "loss_at_stop": "0.63"
  },
  "last_exit": null,
  "candles": [
    { "open_time": "2026-11-01T10:00:00Z", "open": 69210.5, "high": 69388.0,
      "low": 69180.2, "close": 69355.9, "volume": 118.42, "is_closed": true,
      "source": "minutes", "minutes": 15,
      "indicators": { "mom_rsi_14": 61.4 },
      "readiness": { ... },
      "market_data_ids": [8801, 8802, 8803, 8804, 8805, ...] }
  ]
}`;

const PREPARE_CODE = `// What the AI sees: the market and your position, and no ids.
// Send Decision copies the ids Candleweb needs straight from Get Candles.
const data = $('Get Candles').item.json;

const withoutId = (block) => {
  if (!block) return null;
  const { position_id, ...rest } = block;
  return rest;
};

return {
  json: {
    market: data.pair,
    timeframe: data.timeframe,
    stale: data.is_stale,
    position: withoutId(data.position),
    risk_preview: data.risk_preview,
    last_exit: withoutId(data.last_exit),
    candles: (data.candles || []).map((c) => ({
      time: c.open_time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      closed: c.is_closed,
      indicators: c.indicators,
    })),
  },
};`;

const PROMPT = `Market: {{ $json.market }} on the {{ $json.timeframe }} timeframe.
The data is {{ $json.stale ? 'STALE (delayed) - be cautious' : 'fresh' }}.

Open position on this market (null means none):
{{ JSON.stringify($json.position) }}

What a BUY right now would do (stop, size, and whether it would be accepted):
{{ JSON.stringify($json.risk_preview) }}

How the last position closed (null means none yet):
{{ JSON.stringify($json.last_exit) }}

Candles, oldest first. The last one may still be forming (closed false):
{{ JSON.stringify($json.candles) }}

Decide what to do now.`;

const SYSTEM_MESSAGE = `You are a careful crypto trading assistant for a long-only spot trade. You receive
recent candles with indicators, the open position (if any), and what a BUY would do
right now. Give ONE decision.

What your decision does:
- BUY opens a position at the market, but only if your confidence is above
  risk_preview.min_confidence and your risk is LOW or MEDIUM. Candleweb sets the
  stop and the size. A BUY does nothing while a position is open, or when
  risk_preview.would_arm is false (risk_preview.blocked_by says why).
- SELL closes the open position at the market, but only if risk_preview.agent_exits
  is true and your confidence is above risk_preview.min_confidence. It never opens
  a short. With no open position, SELL does nothing.
- HOLD does nothing. If the picture is unclear, choose HOLD. HOLD is always valid.

Rules:
- confidence: a whole number from 0 to 100 for how sure you are. Be honest: it
  decides whether Candleweb acts.
- risk: LOW, MEDIUM or HIGH for how risky acting on this decision is right now.
  HIGH never opens a position.
- Before a BUY, compare the move you expect with risk_preview.stop_pct (the stop
  distance as a fraction of the price) and the fees. If the move you expect is
  smaller than the stop, choose HOLD.
- If risk_preview is null, do not BUY.
- rationale: one or two short sentences, citing the specific numbers you used
  (for example RSI or price levels).
- Use only the data given. Never invent prices or indicator values.
- If the data is marked STALE, choose HOLD and say why.
- Reply only in the required format.`;

const SEND_BODY = `{{ JSON.stringify({
  trade_id:        $('Get Candles').item.json.trade_id,
  delivery_id:     $('Get Candles').item.json.delivery_id,
  market_data_ids: $('Get Candles').item.json.market_data_ids,
  decision:        $json.output.decision,
  confidence:      $json.output.confidence,
  risk:            $json.output.risk,
  rationale:       $json.output.rationale
}) }}`;

const DECISION_RES = `{
  "status": "success",
  "repeated": false,
  "message": "Decision recorded",
  "decision_id": 904,
  "decision": "HOLD",
  "confidence": 62,
  "risk": "LOW",
  "entry_outcome": "NOT_AN_ENTRY",
  "entry_outcome_detail": "A HOLD decision does not open a position.",
  "risk_plan": null,
  "entry": null,
  "exit": null
}`;

const SCHEMA = `{
  "type": "object",
  "additionalProperties": false,
  "required": ["decision", "confidence", "risk", "rationale"],
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["BUY", "SELL", "HOLD"],
      "description": "What to do now. HOLD when unclear."
    },
    "confidence": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "How sure you are, 0 to 100."
    },
    "risk": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH"],
      "description": "How risky acting on this decision is right now."
    },
    "rationale": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500,
      "description": "One or two sentences citing the numbers used."
    }
  }
}`;

export default function DocsPage() {
  const [activeId, setActiveId] = useState(ALL_IDS[0]);

  useEffect(() => {
    const headings = ALL_IDS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!headings.length) return;
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }),
      { rootMargin: "-12% 0px -78% 0px" },
    );
    headings.forEach((heading) => spy.observe(heading));
    return () => spy.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Docs | Candleweb</title>
        <meta
          name="description"
          content="Connect a Candleweb trade to an n8n AI bot: set up the trade, import the ready-made workflow template or build it step by step, and let Candleweb act on your bot's decisions."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="docs-stage">
        <div className="docs-aura">
          <b className="b1" />
          <b className="b2" />
          <b className="b3" />
        </div>
        <div className="docs-grid" />

        <PublicHeader active="docs" />

        <header className="landing-wrap docs-hero" id="top">
          <p className="docs-eyebrow">Bot setup guide</p>
          <h1>Connect your trade to an n8n AI bot.</h1>
          <p className="sub">
            A step-by-step setup guide for bot builders. No coding needed.
            Import the ready-made template, or build the workflow yourself one
            node at a time.
          </p>
          <div className="docs-hero-cta">
            <a className="docs-btn" href={TEMPLATE_FILE} download={TEMPLATE_NAME}>
              Download the n8n template
            </a>
            <a className="docs-btn docs-btn--ghost" href="#template">
              How to use it
            </a>
          </div>
        </header>

        <div className="landing-wrap docs-layout">
          <aside className="docs-nav">
            {NAV.map((group) => (
              <div className="grp" key={group.heading}>
                <span>{group.heading}</span>
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={activeId === item.id ? "is-active" : ""}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </aside>

          <div>
            {/* ------------------------------------------------ Overview */}
            <section className="docs-sec" id="overview">
              <h2>What you will build</h2>
              <p>
                An n8n workflow that, each time a candle closes on your trade's
                timeframe:
              </p>
              <ol className="docs-list">
                <li>
                  <strong>Gets the latest candles</strong> for your trade from
                  Candleweb, with your open position and what a buy would do
                  right now.
                </li>
                <li>
                  <strong>Asks an AI</strong> what to do: buy, sell or hold.
                </li>
                <li>
                  <strong>Sends that decision back</strong> to Candleweb, which
                  acts on it when it clears your trade's bar.
                </li>
              </ol>
              <p>
                The AI only sees the <strong>market and your position</strong>,
                and only ever gives its <strong>opinion</strong>: decision,
                confidence, risk and reason. The ids Candleweb needs back never
                reach the AI. They are <strong>copied over automatically</strong>{" "}
                from Candleweb's own response.
              </p>
              <Code>{PIPELINE}</Code>
              <Note kind="warn" title="Your bot's decisions can place trades.">
                A confident BUY opens a position, and a SELL can close one if you
                allow it. On a <strong>Demo</strong> trade this uses your paper
                account: real market prices, no real money. On a{" "}
                <strong>Live</strong> trade, Candleweb places{" "}
                <strong>real orders</strong> on your exchange. Build and test on
                a Demo trade first.
              </Note>
            </section>

            <section className="docs-sec" id="actions">
              <h2>How Candleweb acts on a decision</h2>
              <Table
                plain
                head={["Decision", "What happens"]}
                rows={[
                  [
                    "BUY",
                    <>
                      Candleweb opens a position at the market price, but only
                      when the confidence is{" "}
                      <strong>above your trade's minimum confidence</strong> (50
                      unless you change it) and the risk is{" "}
                      <strong>LOW or MEDIUM</strong>. Candleweb sets the stop and
                      the size from your trade's risk settings. Trading is
                      long-only, and a BUY is refused while a position on the
                      same market is already open.
                    </>,
                  ],
                  [
                    "SELL",
                    <>
                      Candleweb closes the trade's open position at the market
                      price, but only when{" "}
                      <strong>Let my bot's SELL close the position</strong> is on
                      for the trade and the confidence clears the same bar. If it
                      is off (the default), the SELL is only recorded, and
                      positions close by their stop or trailing stop. A SELL
                      never opens a short.
                    </>,
                  ],
                  ["HOLD", "Recorded. Nothing else happens."],
                ]}
              />
              <p>
                Every decision is recorded on the trade's decision timeline.
                Candleweb's reply to each decision says what it did and why (see{" "}
                <a href="#test">Test, then switch on</a>).
              </p>
            </section>

            {/* ------------------------------------------- Part 1: Candleweb */}
            <section className="docs-sec" id="mode">
              <p className="docs-kicker">Part 1 · Set up in Candleweb</p>
              <h2>Step 1: Choose Demo or Live</h2>
              <p>
                Open <strong>Settings</strong> and check the{" "}
                <strong>Demo/Live</strong> switch. A trade runs in the mode the
                switch is set to <strong>when you create the trade</strong>, and
                it keeps that mode. Switching later only changes new trades.
                Leave it on <strong>Demo</strong> while you build and test.
              </p>
            </section>

            <section className="docs-sec" id="bot">
              <h2>Step 2: Create a bot</h2>
              <p>
                Go to <strong>Bots</strong>, create a new bot, and fill in:
              </p>
              <Table
                plain
                head={["Setting", "Choose"]}
                rows={[
                  ["Name", "Anything you like, for example My n8n bot"],
                  [
                    "Platform",
                    <>
                      <strong>n8n Cloud</strong> or{" "}
                      <strong>n8n self-hosted</strong>
                    </>,
                  ],
                  [
                    "Data delivery",
                    <>
                      <strong>My bot will pull</strong>. Push is not available
                      yet.
                    </>,
                  ],
                  [
                    "Reply timeout",
                    <>
                      <strong>60</strong> seconds. An AI usually answers in 5 to
                      30 seconds.
                    </>,
                  ],
                  [
                    "Decision style",
                    <>
                      <strong>Buy / sell / hold</strong> or{" "}
                      <strong>Buy / hold only</strong>. Candleweb does not act on
                      Signal strength bots.
                    </>,
                  ],
                  [
                    "When there is no reply",
                    <>
                      Leave it on <strong>Skip the candle</strong>.
                    </>,
                  ],
                ]}
              />
              <p>
                Save, then copy the bot's <strong>developer key</strong>. It
                looks like <code>cw_dev_3f9a1b2c...</code>.
              </p>
              <Note kind="warn" title="Keep your developer key private.">
                Anyone who has it can send decisions as your bot, and those
                decisions can trade. If you regenerate the key, the old one stops
                working immediately, so update n8n (Step 5) straight away.
              </Note>
            </section>

            <section className="docs-sec" id="trade">
              <h2>Step 3: Create a trade and point it at your bot</h2>
              <p>
                Go to <strong>Trades</strong>, create a new trade, and fill in:
              </p>
              <Table
                plain
                head={["Setting", "What to know"]}
                rows={[
                  [
                    "Exchange account",
                    "Needed for a Live trade. A Demo trade can run without one.",
                  ],
                  ["Pair", "The market to trade, for example BTCUSDT."],
                  [
                    "Timeframe",
                    <>
                      <strong>1m, 5m, 15m, 1h or 4h.</strong> Do not choose 1
                      day: the candle feed does not support it yet.
                    </>,
                  ],
                  ["Allocated amount", "The money this trade may use."],
                  [
                    "Indicators",
                    "Pick them from the list. Your bot receives their values with every candle.",
                  ],
                  [
                    "Candle history",
                    "How many candles your bot receives on each pull (20 by default).",
                  ],
                  [
                    "Who decides",
                    <>
                      <strong>Your bot</strong> (not CandleAI), then choose the
                      bot from Step 2.
                    </>,
                  ],
                  [
                    "Minimum confidence",
                    <>
                      Candleweb acts only on decisions with a confidence{" "}
                      <strong>above</strong> this. At 50, a 50 is held.
                    </>,
                  ],
                  [
                    "Risk per position",
                    "\"Lose at most X% of this trade's capital if a stop is hit\" (0.1 to 25).",
                  ],
                  [
                    "Max position size",
                    "\"Use at most X% of this trade's capital per position\" (1 to 100).",
                  ],
                  [
                    "Trailing stop",
                    "On by default. The stop follows the price up as each candle closes.",
                  ],
                  [
                    "Let my bot's SELL close the position",
                    "Off by default. Turn it on if you want your bot's SELL decisions to close positions.",
                  ],
                ]}
              />
              <p>
                Save. The trade is <strong>active straight away</strong>.
                Creating it also gives your bot permission to open positions for
                your account, so it can trade as soon as you connect it.
              </p>
            </section>

            <section className="docs-sec" id="connect">
              <h2>Step 4: Copy the connection details</h2>
              <p>
                Open the trade and find <strong>Connect your bot</strong>. Copy
                these three:
              </p>
              <Table
                head={["What", "Method", "Looks like"]}
                rows={[
                  [
                    "Pull URL",
                    "GET",
                    <code key="pull">
                      https://api.candleweb.io/api/trading_v2/trades/42/candles/
                    </code>,
                  ],
                  [
                    "Decision URL",
                    "POST",
                    <code key="decision">
                      https://api.candleweb.io/api/trading_v2/trades/42/decision/
                    </code>,
                  ],
                  ["Developer key", "", <code key="key">cw_dev_3f9a1b2c...</code>],
                ]}
              />
              <p>
                Use the URLs exactly as shown. <code>42</code> is your trade's
                number. Your bot sends the key on both calls in a header named{" "}
                <code>X-Candleweb-Key</code>.
              </p>
              <p>
                Now either <a href="#template">import the template</a> (fastest)
                or <a href="#credential">build the workflow yourself</a>.
              </p>
            </section>

            {/* ----------------------------------------------- Template */}
            <section className="docs-sec" id="template">
              <p className="docs-kicker">Quick start</p>
              <h2>Use the workflow template</h2>
              <p>
                Skip the build: download our ready-made n8n workflow, import it,
                and fill in your own connection details from Step 4.
              </p>
              <figure className="docs-figure">
                <img
                  src="/template_image.jpeg"
                  alt="The Candleweb trading bot workflow in the n8n editor: Schedule Trigger, Get the candles, Has Data?, Edit Fields, AI Agent with OpenRouter Chat Model, Simple Memory and Structured Output Parser, then Send Decision."
                  width={1600}
                  height={828}
                  loading="lazy"
                />
              </figure>
              <div className="docs-download">
                <div>
                  <strong>{TEMPLATE_NAME}</strong>
                  <span>n8n workflow · JSON</span>
                </div>
                <a className="docs-btn" href={TEMPLATE_FILE} download={TEMPLATE_NAME}>
                  Download template
                </a>
              </div>

              <h3>Step 1: Import the workflow into n8n</h3>
              <ol className="docs-list">
                <li>
                  Open your n8n dashboard (either n8n Cloud or your self-hosted
                  n8n).
                </li>
                <li>
                  Click <strong>Create Workflow</strong> or{" "}
                  <strong>New Workflow</strong>.
                </li>
                <li>
                  In the workflow editor, click the three-dot menu (⋯) in the
                  top-right corner.
                </li>
                <li>
                  Select <strong>Import from File</strong>.
                </li>
                <li>
                  Choose the file <code>{TEMPLATE_NAME}</code> from your
                  computer.
                </li>
                <li>
                  The workflow nodes and their connections should appear
                  automatically.
                </li>
                <li>
                  Click <strong>Save</strong>.
                </li>
              </ol>

              <h3>Step 2: Configure the imported nodes</h3>
              <p>Your workflow contains these nodes:</p>
              <Table
                plain
                head={["Node", "What it does"]}
                rows={[
                  ["Schedule Trigger", "Runs the workflow every 3 minutes."],
                  ["Get the candles", "Pulls the latest candles from Candleweb."],
                  [
                    "Has Data? → Edit Fields",
                    "Stops the run when there are no candles, and sets the memory session.",
                  ],
                  [
                    "Prepare for AI",
                    "Builds the AI's view of the market and leaves out every id.",
                  ],
                  [
                    "AI Agent",
                    "OpenRouter Chat Model + Simple Memory + Structured Output Parser decide BUY, SELL or HOLD.",
                  ],
                  ["Send Decision", "Posts the decision back to Candleweb."],
                ]}
              />
              <Note kind="warn" title="Imported the template before?">
                Earlier copies sent the AI Candleweb's ids along with the market
                data. Download the template again and import it fresh. The
                picture above does not show the new{" "}
                <strong>Prepare for AI</strong> node yet, but your import will
                include it, between <strong>Edit Fields</strong> and{" "}
                <strong>AI Agent</strong>.
              </Note>
              <p>
                <strong>Configure OpenRouter:</strong>
              </p>
              <ol className="docs-list">
                <li>
                  Click the <strong>OpenRouter Chat Model</strong> node.
                </li>
                <li>
                  Under <strong>Credentials</strong>, select an existing
                  OpenRouter credential or create a new one.
                </li>
                <li>
                  Get your API key from{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenRouter API Keys
                  </a>
                  .
                </li>
                <li>Enter the API key and save the credential.</li>
                <li>
                  Verify that the selected AI model is available to your
                  account.
                </li>
              </ol>
              <p>
                <strong>Configure Candleweb:</strong>
              </p>
              <ol className="docs-list">
                <li>
                  Open the <strong>Get the candles</strong> node and replace the
                  URL with the <strong>Pull URL</strong> from your trade's{" "}
                  <strong>Connect your bot</strong> panel.
                </li>
                <li>
                  Open the <strong>Send Decision</strong> node and replace the
                  URL with your trade's <strong>Decision URL</strong>.
                </li>
                <li>
                  In both nodes, replace the example value of the{" "}
                  <code>X-Candleweb-Key</code> header with your own developer
                  key.
                </li>
              </ol>

              <h3>Step 3: Test the workflow</h3>
              <ol className="docs-list">
                <li>Keep the workflow unpublished while testing.</li>
                <li>
                  Click <strong>Execute Workflow</strong> or{" "}
                  <strong>Test Workflow</strong>.
                </li>
                <li>
                  Check that <strong>Get the candles</strong> successfully
                  retrieves market data.
                </li>
                <li>
                  Check that <strong>Prepare for AI</strong> shows prices and
                  indicators, and no <code>id</code>, <code>hash</code>,{" "}
                  <code>market_data_ids</code>, <code>delivery_id</code> or{" "}
                  <code>position_id</code>.
                </li>
                <li>
                  Verify that the <strong>AI Agent</strong> produces a valid
                  BUY, SELL or HOLD response.
                </li>
                <li>
                  Check <strong>Send Decision</strong> for a successful API
                  response.
                </li>
              </ol>
              <Note kind="warn" title="Test on Demo only.">
                Because this workflow sends trading decisions to Candleweb, test
                it on a Demo trade only.
              </Note>

              <h3>Step 4: Enable automatic execution</h3>
              <p>
                Once testing succeeds, click <strong>Publish</strong> in the
                workflow editor. On current n8n versions, publishing enables
                scheduled production executions.
              </p>
              <p>
                The imported schedule runs every 3 minutes. You can change this
                interval in the <strong>Schedule Trigger</strong> node; matching
                it to your trade's timeframe avoids paying for repeat AI calls on
                the same candle (see{" "}
                <a href="#schedule">Run once per candle</a>).
              </p>
              <Note kind="tip" title="Final check">
                Open the <strong>Executions</strong> tab to monitor successful
                runs, API errors and AI Agent failures. If the workflow shows{" "}
                <strong>Unknown node type</strong> after import, check your n8n
                version and whether its AI/LangChain nodes are supported.
              </Note>
            </section>

            {/* ---------------------------------------------- Part 2: n8n */}
            <section className="docs-sec" id="credential">
              <p className="docs-kicker">Part 2 · Build the workflow in n8n</p>
              <h2>Step 5: Save your developer key as a credential</h2>
              <p>
                This keeps the key out of your workflow, so it never appears in
                screenshots or exports.
              </p>
              <ol className="docs-list">
                <li>
                  In n8n, go to <strong>Credentials</strong> and choose{" "}
                  <strong>Add credential</strong>.
                </li>
                <li>
                  Search for <strong>Header Auth</strong> and select it.
                </li>
                <li>
                  Set <strong>Name</strong> to <CopyCode>X-Candleweb-Key</CopyCode>,
                  spelled exactly like this, with the same capital letters and
                  dashes. Set <strong>Value</strong> to your developer key (
                  <code>cw_dev_...</code>).
                </li>
                <li>
                  Rename the credential to something clear, such as{" "}
                  <strong>Candleweb - My Bot</strong>, then{" "}
                  <strong>Save</strong>.
                </li>
              </ol>
            </section>

            <section className="docs-sec" id="schedule">
              <h2>Step 6: Run once per candle</h2>
              <ol className="docs-list">
                <li>
                  Create a new workflow. Open its <strong>Settings</strong> and
                  set <strong>Timezone</strong> to <strong>UTC</strong>, because
                  candles close on UTC times.
                </li>
                <li>
                  Add a <strong>Schedule Trigger</strong> node.
                </li>
                <li>
                  Set <strong>Trigger Interval</strong> to{" "}
                  <strong>Custom (Cron)</strong> and enter the expression for
                  your trade's timeframe:
                </li>
              </ol>
              <Table
                head={["Timeframe", "Cron expression", "Runs"]}
                rows={[
                  ["1m", <CopyCode key="c">15 * * * * *</CopyCode>, "every minute, at second 15"],
                  ["5m", <CopyCode key="c">15 */5 * * * *</CopyCode>, "every 5 minutes"],
                  ["15m", <CopyCode key="c">15 */15 * * * *</CopyCode>, "every 15 minutes"],
                  ["1h", <CopyCode key="c">15 0 * * * *</CopyCode>, "every hour"],
                  ["4h", <CopyCode key="c">15 0 */4 * * *</CopyCode>, "every 4 hours"],
                ]}
              />
              <Note kind="tip" title="Why second 15, and why match the timeframe">
                A candle is saved a few seconds after it closes, so your bot
                always gets the fresh one. Each pull asks your bot for a
                decision: pulling every minute on a 1h trade would run (and pay
                for) sixty AI calls on the same candle.
              </Note>
            </section>

            <section className="docs-sec" id="candles">
              <h2>Step 7: Get the candles</h2>
              <p>
                Add an <strong>HTTP Request</strong> node after the trigger and
                rename it <strong>Get Candles</strong>. Later steps refer to it
                by this exact name.
              </p>
              <Table
                plain
                head={["Setting", "Value"]}
                rows={[
                  ["Method", "GET"],
                  [
                    "URL",
                    <>
                      your <strong>Pull URL</strong>
                    </>,
                  ],
                  ["Authentication", "Generic Credential Type"],
                  ["Generic Auth Type", "Header Auth"],
                  [
                    "Header Auth",
                    <strong key="cred">Candleweb - My Bot</strong>,
                  ],
                  ["Options > Timeout", "30000 (30 seconds)"],
                ]}
              />
              <p>
                Click <strong>Execute step</strong>. You should see something
                like this (shortened):
              </p>
              <Code>{CANDLES_RES}</Code>
              <ul className="docs-list">
                <li>
                  <code>trade_id</code>, <code>delivery_id</code> and{" "}
                  <code>market_data_ids</code> are the three values Candleweb
                  needs back. Step 11 copies them across.
                </li>
                <li>
                  <code>position</code> is your open position on this market,
                  with its entry price, stop and unrealised profit or loss. It
                  is <code>null</code> when nothing is open.
                </li>
                <li>
                  <code>risk_preview</code> says what a BUY right now would do:
                  the stop distance (<code>stop_pct</code> is a fraction, so
                  0.0075 means 0.75%), the size, the loss if the stop is hit,
                  and whether it would be accepted (<code>would_arm</code>; if
                  not, <code>blocked_by</code> says why).
                </li>
                <li>
                  <code>last_exit</code> says how the last position closed.
                </li>
                <li>
                  The response also contains <code>order_book</code> and{" "}
                  <code>context</code> (market depth, BTC, funding and more).
                  This guide does not pass them to the AI, but you can.
                </li>
              </ul>
              <Note
                kind="warn"
                title="The response is full of ids. The AI must not see them."
              >
                Each candle lists the stored rows behind it in{" "}
                <code>market_data_ids</code>: 15 on a 15m candle, 60 on a 1h
                candle, 240 on a 4h candle. On a 1m trade each candle also has
                an <code>id</code> and a <code>hash</code>.{" "}
                <code>position</code> and <code>last_exit</code> carry a{" "}
                <code>position_id</code>. Handed the whole response, an AI ends
                up reading thousands of id numbers instead of prices, and its
                decisions are about the ids. Step 9 picks out only what the AI
                needs.
              </Note>
            </section>

            <section className="docs-sec" id="has-data">
              <h2>Step 8: Skip the run when there is nothing to decide on</h2>
              <ol className="docs-list">
                <li>
                  Add an <strong>If</strong> node after{" "}
                  <strong>Get Candles</strong> and rename it{" "}
                  <strong>Has Data?</strong>
                </li>
                <li>
                  Add the condition <strong>Array &gt; is not empty</strong>,
                  with the value set to the expression{" "}
                  <CopyCode>{"{{ $json.candles }}"}</CopyCode>.
                </li>
                <li>
                  Connect only the <strong>true</strong> output to the next
                  step.
                </li>
              </ol>
            </section>

            <section className="docs-sec" id="prepare">
              <h2>Step 9: Prepare what the AI sees</h2>
              <p>
                This step builds the AI's view of the market: prices, volumes,
                indicators, your position and what a BUY would do. It leaves out
                every id in the response. The ids still reach Candleweb: Step 11
                copies them straight from <strong>Get Candles</strong>.
              </p>
              <ol className="docs-list">
                <li>
                  Add a <strong>Code</strong> node after the{" "}
                  <strong>true</strong> output of <strong>Has Data?</strong> and
                  rename it <strong>Prepare for AI</strong>.
                </li>
                <li>
                  Set <strong>Mode</strong> to{" "}
                  <strong>Run Once for Each Item</strong> and{" "}
                  <strong>Language</strong> to <strong>JavaScript</strong>.
                </li>
                <li>Replace the code in the box with:</li>
              </ol>
              <Code label="Code node · JavaScript">{PREPARE_CODE}</Code>
              <p>
                Click <strong>Execute step</strong>. The output should show your
                candles' prices and indicators, and no <code>id</code>,{" "}
                <code>hash</code>, <code>market_data_ids</code>,{" "}
                <code>delivery_id</code> or <code>position_id</code> anywhere.
              </p>
            </section>

            <section className="docs-sec" id="ai">
              <h2>Step 10: The AI decision</h2>
              <ol className="docs-list">
                <li>
                  Add an <strong>AI Agent</strong> node after{" "}
                  <strong>Prepare for AI</strong> and rename it{" "}
                  <strong>AI Decision</strong>.
                </li>
                <li>
                  Attach a <strong>Chat Model</strong> (for example Anthropic or
                  OpenAI) to its <strong>Chat Model</strong> slot.
                </li>
                <li>
                  Turn on <strong>Require Specific Output Format</strong>. This
                  adds an <strong>Output Parser</strong> slot.
                </li>
                <li>
                  Attach a <strong>Structured Output Parser</strong> to that
                  slot. Set <strong>Schema Type</strong> to{" "}
                  <strong>Define using JSON Schema</strong>, and paste the{" "}
                  <a href="#schema">output schema</a>.
                </li>
                <li>
                  Set <strong>Source for Prompt</strong> to{" "}
                  <strong>Define below</strong>, switch the{" "}
                  <strong>Prompt</strong> field to <strong>Expression</strong>,
                  and paste:
                </li>
              </ol>
              <Code label="Prompt · Expression">{PROMPT}</Code>
              <Note kind="warn" title="Use this prompt exactly.">
                Keep <strong>Source for Prompt</strong> set to{" "}
                <strong>Define below</strong>. Do not use{" "}
                <strong>Take from previous node automatically</strong>, and do
                not pass <code>$('Get Candles')</code> or its whole output to the
                AI: both hand it the ids.
              </Note>
              <p>
                Under <strong>Options</strong>, add a{" "}
                <strong>System Message</strong> and paste:
              </p>
              <Code label="System Message">{SYSTEM_MESSAGE}</Code>
            </section>

            <section className="docs-sec" id="send">
              <h2>Step 11: Send the decision back</h2>
              <p>
                Add an <strong>HTTP Request</strong> node after{" "}
                <strong>AI Decision</strong> and rename it{" "}
                <strong>Send Decision</strong>.
              </p>
              <Table
                plain
                head={["Setting", "Value"]}
                rows={[
                  ["Method", "POST"],
                  [
                    "URL",
                    <>
                      your <strong>Decision URL</strong>
                    </>,
                  ],
                  [
                    "Authentication",
                    <>
                      Generic Credential Type &gt; Header Auth &gt;{" "}
                      <strong>Candleweb - My Bot</strong>
                    </>,
                  ],
                  ["Send Body", "On"],
                  ["Body Content Type", "JSON"],
                  ["Specify Body", "Using JSON"],
                  [
                    "Settings > Retry On Fail",
                    "Off is fine. If you turn it on, a retry is safe: Candleweb accepts one decision per pull and returns the first one again.",
                  ],
                ]}
              />
              <p>
                Switch the <strong>JSON</strong> field to{" "}
                <strong>Expression</strong> mode and paste:
              </p>
              <Code label="JSON · Expression">{SEND_BODY}</Code>
              <Note kind="tip" title="Why this is safe">
                The first three lines are copied straight from{" "}
                <strong>Get Candles</strong>, exactly as Candleweb sent them.
                Only the last four come from the AI's answer (
                <code>$json.output</code>), and the output schema only allows
                valid values for those.
              </Note>
            </section>

            <section className="docs-sec" id="test">
              <h2>Step 12: Test on Demo, then switch it on</h2>
              <p>
                Click <strong>Execute workflow</strong>.{" "}
                <strong>Send Decision</strong> should show a response like this
                (shortened):
              </p>
              <Code>{DECISION_RES}</Code>
              <p>
                Read <code>entry_outcome</code> and{" "}
                <code>entry_outcome_detail</code> to see what Candleweb did:
              </p>
              <Table
                head={["entry_outcome", "Meaning"]}
                rows={[
                  [
                    "NOT_AN_ENTRY",
                    "A HOLD, or a SELL while SELL-to-close is off. Nothing was traded.",
                  ],
                  [
                    "BELOW_THRESHOLD",
                    "The confidence was not above the trade's minimum, or the risk was HIGH. Normal: the bar did its job.",
                  ],
                  [
                    "REFUSED",
                    "Candleweb would not act, for example because a position is already open or the balance is too low. The detail says why.",
                  ],
                  [
                    "ARMED",
                    <>
                      The BUY was accepted and the entry is being placed.{" "}
                      <code>entry</code> shows the fill once it happens.
                    </>,
                  ],
                  [
                    "EXIT_QUEUED",
                    <>
                      The SELL was accepted and the position is being closed.{" "}
                      <code>exit</code> shows the sale once it fills.
                    </>,
                  ],
                ]}
              />
              <p>
                Toggle the workflow to <strong>Active</strong>. Watch the trade's
                decisions, positions and notifications in Candleweb for a while
                before you create a Live trade with the same bot.
              </p>
            </section>

            {/* ------------------------------------------------ Reference */}
            <section className="docs-sec" id="schema">
              <p className="docs-kicker">Reference</p>
              <h2>The output schema</h2>
              <p>
                Paste this into the <strong>Structured Output Parser</strong>{" "}
                in Step 10. It allows exactly four fields, and only valid values
                for each.
              </p>
              <Code label="Structured Output Parser · JSON Schema">{SCHEMA}</Code>
              <p>
                The schema deliberately leaves out <code>trade_id</code>,{" "}
                <code>delivery_id</code> and <code>market_data_ids</code>. The
                AI never writes them, so it cannot get them wrong.
              </p>
            </section>

            <section className="docs-sec" id="fields">
              <h2>What Candleweb expects in each decision</h2>
              <Table
                head={["Field", "Required", "Where it comes from"]}
                rows={[
                  ["decision", "Yes", "AI: BUY, SELL or HOLD"],
                  ["confidence", "Yes", "AI: whole number, 0 to 100"],
                  ["risk", "Yes", "AI: LOW, MEDIUM or HIGH"],
                  ["market_data_ids", "Yes", "Copied from Get Candles"],
                  [
                    "trade_id",
                    "Recommended",
                    "Copied from Get Candles (must match the trade in the URL)",
                  ],
                  [
                    "delivery_id",
                    "Recommended",
                    "Copied from Get Candles (ties the decision to that pull)",
                  ],
                  [
                    "rationale",
                    "No",
                    "AI: a short reason, shown to you. Up to 4000 characters; longer is cut.",
                  ],
                  [
                    "entry_price",
                    "No",
                    "Not used in this guide. A price for a BUY to wait for, instead of buying at the market.",
                  ],
                ]}
              />
            </section>

            <section className="docs-sec" id="errors">
              <h2>If something goes wrong</h2>
              <Table
                plain
                head={["You see", "It means", "Fix"]}
                rows={[
                  [
                    <code key="e">401 X-Candleweb-Key header is required.</code>,
                    "The credential is not attached",
                    <>
                      Choose <strong>Candleweb - My Bot</strong> under Header
                      Auth on the node.
                    </>,
                  ],
                  [
                    <code key="e">401 Invalid developer key.</code>,
                    "Wrong or old key",
                    "Re-copy the key into the Candleweb - My Bot credential.",
                  ],
                  [
                    <code key="e">401 This bot is paused.</code>,
                    "The bot is paused in Candleweb",
                    "Resume it on your bot's page.",
                  ],
                  [
                    <code key="e">403 This bot is not assigned to this trade.</code>,
                    "The key belongs to another bot",
                    "Use the key of the bot the trade points to, or change the trade's bot.",
                  ],
                  [
                    <code key="e">404 Not found.</code>,
                    "Wrong trade number in the URL",
                    <>
                      Copy the URLs again from the trade's{" "}
                      <strong>Connect your bot</strong> panel.
                    </>,
                  ],
                  [
                    <code key="e">
                      400 Timeframe '1d' is not available on the candle feed yet.
                    </code>,
                    "The trade is on 1 day",
                    "Use 1m, 5m, 15m, 1h or 4h.",
                  ],
                  [
                    <code key="e">400 risk: Required… or confidence: …</code>,
                    "The AI's answer is missing a field",
                    <>
                      Check <strong>Require Specific Output Format</strong> is on
                      and the schema is pasted.
                    </>,
                  ],
                  [
                    <code key="e">400 on market_data_ids or trade_id</code>,
                    "The values were typed or edited by hand",
                    "Use the Step 11 expression exactly. The values must come from Get Candles.",
                  ],
                  [
                    "The AI's reasons talk about ids, hashes or delivery numbers instead of prices",
                    "The AI is being given Candleweb's whole response",
                    <>
                      Add the <strong>Prepare for AI</strong> step (Step 9) and
                      use the Step 10 prompt exactly.
                    </>,
                  ],
                  [
                    <code key="e">200 "repeated": true</code>,
                    "A decision was already sent for this pull",
                    "Normal if a run was repeated. The next pull gets a new decision.",
                  ],
                  [
                    <code key="e">429</code>,
                    "Too many requests",
                    "Use the Step 6 schedule. The limits are 120 pulls and 60 decisions a minute.",
                  ],
                  [
                    "A BUY was recorded, but nothing was bought",
                    "It did not clear the bar, or was refused",
                    <>
                      Read <code>entry_outcome_detail</code> on the decision.
                    </>,
                  ],
                  [
                    "A SELL did not close the position",
                    "SELL-to-close is off",
                    <>
                      Turn on <strong>Let my bot's SELL close the position</strong>{" "}
                      on the trade.
                    </>,
                  ],
                ]}
              />
              <Note kind="tip" title="Good to know">
                Your bot owes one decision per candle it is shown. A candle with
                no decision within the reply timeout counts as a missed reply in
                your bot's health stats. Sending HOLD does not. If your AI model
                has an outage, the run stops at <strong>AI Decision</strong> and
                nothing is sent.
              </Note>
              <p>
                Menu names can differ slightly between n8n versions, and between
                versions of the Candleweb app. If a setting is not exactly where
                this guide says, look for the closest match.
              </p>
            </section>
          </div>
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
