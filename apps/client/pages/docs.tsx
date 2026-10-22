import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
/* eslint-disable react/no-unescaped-entities */

const NAV: { heading: string; items: { id: string; label: string }[] }[] = [
  {
    heading: "Getting started",
    items: [
      { id: "base", label: "Base URL" },
      { id: "auth", label: "Authentication" },
      { id: "flow", label: "The trading loop" },
    ],
  },
  {
    heading: "Endpoints",
    items: [
      { id: "candles", label: "Get market data" },
      { id: "decision", label: "Post a decision" },
      { id: "push", label: "Receive a push" },
      { id: "state", label: "Read your state" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { id: "indicators", label: "Indicators" },
      { id: "errors", label: "Errors" },
      { id: "limits", label: "Rate limits" },
      { id: "n8n", label: "n8n quickstart" },
    ],
  },
];

const ALL_IDS = NAV.flatMap((group) => group.items.map((item) => item.id));

const Pre = ({ children }: { children: string }) => (
  <pre className="docs-pre" dangerouslySetInnerHTML={{ __html: children }} />
);

const FLOW = `<span class="c">candle closes</span>
   <span class="m">→</span> Candleweb computes your indicators
   <span class="m">→</span> your bot reads them  (GET /candles)   <span class="c">or receives a push</span>
   <span class="m">→</span> your bot replies     (POST /decision)
   <span class="m">→</span> Candleweb places the order, arms the stop, trails it, closes it
   <span class="m">→</span> the whole thing is written to your trade records`;

const CANDLES_RES = `{
  <span class="k">"trade_id"</span>: <span class="s">"tr_9f2c"</span>,
  <span class="k">"pair"</span>: <span class="s">"BTC/USDT"</span>,
  <span class="k">"timeframe"</span>: <span class="s">"15m"</span>,
  <span class="k">"closed_at"</span>: <span class="s">"2026-08-22T14:45:00Z"</span>,
  <span class="k">"candles"</span>: [
    { <span class="k">"t"</span>: <span class="s">"14:30:00Z"</span>, <span class="k">"o"</span>: <span class="n">64180.2</span>, <span class="k">"h"</span>: <span class="n">64221.4</span>, <span class="k">"l"</span>: <span class="n">64150.0</span>, <span class="k">"c"</span>: <span class="n">64210.5</span>, <span class="k">"v"</span>: <span class="n">489</span> },
    { <span class="k">"t"</span>: <span class="s">"14:45:00Z"</span>, <span class="k">"o"</span>: <span class="n">64210.5</span>, <span class="k">"h"</span>: <span class="n">64388.0</span>, <span class="k">"l"</span>: <span class="n">64180.2</span>, <span class="k">"c"</span>: <span class="n">64355.9</span>, <span class="k">"v"</span>: <span class="n">533</span> }
  ],
  <span class="k">"indicators"</span>: {
    <span class="k">"rsi_14"</span>: <span class="n">61.4</span>,
    <span class="k">"macd_12_26_9"</span>: <span class="n">18.7</span>,
    <span class="k">"ema_50"</span>: <span class="n">63980.1</span>,
    <span class="k">"atr_14"</span>: <span class="n">214.6</span>
  },
  <span class="k">"position"</span>: <span class="s">null</span>
}`;

const DECISION_BODY = `<span class="c">// request</span>
{
  <span class="k">"action"</span>: <span class="s">"buy"</span>,
  <span class="k">"size_pct"</span>: <span class="n">10</span>,
  <span class="k">"rationale"</span>: <span class="s">"RSI recovering off 45, MACD positive, above EMA-50."</span>
}

<span class="c">// response — 201</span>
{
  <span class="k">"decision_id"</span>: <span class="s">"dc_4a71e0"</span>,
  <span class="k">"accepted"</span>: <span class="s">true</span>,
  <span class="k">"order"</span>: {
    <span class="k">"side"</span>: <span class="s">"buy"</span>,
    <span class="k">"qty"</span>: <span class="n">0.0311</span>,
    <span class="k">"filled_at"</span>: <span class="n">64356.10</span>,
    <span class="k">"stop"</span>: <span class="n">63712.00</span>,
    <span class="k">"size_pct_applied"</span>: <span class="n">8.3</span>
  }
}`;

const PUSH_BODY = `<span class="c">// what we send you</span>
<span class="m">POST</span> https://your-n8n.app/webhook/candleweb
<span class="m">X-Candleweb-Key:</span> cw_dev_8f3a91c47e2b6d05af1e34c9

<span class="c">// what we expect back, within your timeout</span>
{ <span class="k">"action"</span>: <span class="s">"hold"</span>, <span class="k">"rationale"</span>: <span class="s">"RSI 74 — overbought, waiting."</span> }`;

const N8N_BODY = `<span class="c">// node 1 — HTTP Request (GET)</span>
URL     https://api.candleweb.io/v1/trades/tr_9f2c/candles
Header  X-Candleweb-Key: cw_dev_...

<span class="c">// node 2 — HTTP Request (POST)</span>
URL     https://api.candleweb.io/v1/trades/tr_9f2c/decision
Header  X-Candleweb-Key: cw_dev_...
Body    {{ $json.decision }}`;

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
        <title>API reference | Candleweb</title>
        <meta
          name="description"
          content="Candleweb API reference — read market data, post a trading decision, and let Candleweb place and manage the order."
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
          <p className="docs-eyebrow">API reference</p>
          <h1>Two endpoints, one key.</h1>
          <p className="sub">
            Everything your bot needs to trade through Candleweb. Read the market
            data endpoint, post a decision back, and we handle the order from
            there.
          </p>
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
            <section className="docs-sec" id="base">
              <h2>Base URL</h2>
              <p>
                All requests go to a single host over HTTPS. There is no sandbox
                host — use a trade saved as <strong>paused</strong> to exercise
                the loop without placing orders.
              </p>
              <Pre>https://api.candleweb.io/v1</Pre>
            </section>

            <section className="docs-sec" id="auth">
              <h2>Authentication</h2>
              <p>
                Every request carries your <strong>developer key</strong> in a
                header. The same key travels in both directions: we send it when
                we call your bot, so you can verify the candle came from us; your
                bot sends it back with a decision, which is what authorises us to
                place the order.
              </p>
              <Pre>{`<span class="m">X-Candleweb-Key:</span> cw_dev_8f3a91c47e2b6d05af1e34c9`}</Pre>
              <p>
                Keys are issued per bot. Regenerating one takes effect
                immediately, so update your workflow first. Treat it like a
                password — anyone holding it can send decisions that trade your
                account.
              </p>
            </section>

            <section className="docs-sec" id="flow">
              <h2>The trading loop</h2>
              <p>
                A <strong>trade</strong> is a configuration you create in the
                dashboard: pair, timeframe, indicators, risk and size. A{" "}
                <strong>bot</strong> is what decides. Every endpoint below is
                scoped to a trade, so editing the trade changes what the endpoint
                returns without touching your workflow.
              </p>
              <Pre>{FLOW}</Pre>
            </section>

            <section className="docs-sec" id="candles">
              <h2>Get market data</h2>
              <Pre>{`<span class="m">GET</span> /v1/trades/{trade_id}/candles`}</Pre>
              <p>
                Returns the closed candles and indicator values for this trade.
                Safe to poll; the payload only changes when a candle closes.
              </p>
              <div className="docs-tw">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Query parameter</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>limit</td>
                      <td>integer</td>
                      <td>
                        Candles to return. Defaults to the trade's history
                        setting. Max 200.
                      </td>
                    </tr>
                    <tr>
                      <td>format</td>
                      <td>string</td>
                      <td>
                        <code>full</code> (default) or <code>compact</code>,
                        which drops the OHLCV array and returns indicators only.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Pre>{CANDLES_RES}</Pre>
              <p>
                <code>position</code> is <code>null</code> when nothing is open,
                or an object describing the current position — useful if your
                bot's decision depends on whether it's already in the market.
              </p>
            </section>

            <section className="docs-sec" id="decision">
              <h2>Post a decision</h2>
              <Pre>{`<span class="m">POST</span> /v1/trades/{trade_id}/decision`}</Pre>
              <div className="docs-tw">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        action<span className="docs-req">required</span>
                      </td>
                      <td>string</td>
                      <td>
                        <code>buy</code>, <code>sell</code>, <code>hold</code>,
                        or <code>close</code> to exit an open position.
                      </td>
                    </tr>
                    <tr>
                      <td>size_pct</td>
                      <td>number</td>
                      <td>
                        Percentage of balance to commit. Capped by the trade's
                        ceiling; ignored on <code>hold</code> and{" "}
                        <code>close</code>.
                      </td>
                    </tr>
                    <tr>
                      <td>rationale</td>
                      <td>string</td>
                      <td>
                        One sentence explaining the decision. Stored with the
                        record and read by bot review. Strongly recommended.
                      </td>
                    </tr>
                    <tr>
                      <td>confidence</td>
                      <td>number</td>
                      <td>Optional, 0–1. Recorded but not acted on.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Pre>{DECISION_BODY}</Pre>
              <p>
                <code>size_pct_applied</code> may be lower than you asked for —
                that's your risk setting and position ceiling being enforced. If
                the order is refused entirely, <code>accepted</code> is{" "}
                <code>false</code> and a <code>reason</code> field explains why.
              </p>
            </section>

            <section className="docs-sec" id="push">
              <h2>Receive a push</h2>
              <p>
                If you chose push when adding your bot, we POST the same payload
                as <code>GET /candles</code> to your URL at every close, carrying
                your developer key. Reply with a decision body and we'll act on
                it — no separate POST needed.
              </p>
              <Pre>{PUSH_BODY}</Pre>
              <p>
                Verify the key before you act on the payload. If you don't reply
                in time we apply the no-reply rule you set on the bot — skip,
                hold, or close — and log the miss.
              </p>
            </section>

            <section className="docs-sec" id="state">
              <h2>Read your state</h2>
              <p>
                Three read-only endpoints for building your own views. All
                paginated, all scoped to your account.
              </p>
              <div className="docs-tw">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>GET /v1/trades</td>
                      <td>Your trades and their current status.</td>
                    </tr>
                    <tr>
                      <td>GET /v1/positions</td>
                      <td>
                        Open positions with entry, stop and unrealised PnL.
                      </td>
                    </tr>
                    <tr>
                      <td>GET /v1/records</td>
                      <td>
                        Closed trades, each with the market data and rationale
                        behind it.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="docs-sec" id="indicators">
              <h2>Indicators</h2>
              <p>
                Selected per trade in the dashboard. The key in the payload is
                always the lowercase name with its parameters, so{" "}
                <code>ema_50</code> and <code>macd_12_26_9</code> are stable and
                predictable.
              </p>
              <div className="docs-tw">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Indicator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["rsi_14", "Relative Strength Index"],
                      ["macd_12_26_9", "MACD histogram value"],
                      ["ema_50 · ema_200", "Exponential moving averages"],
                      ["atr_14", "Average True Range"],
                      ["bb_20_2", "Bollinger Bands — upper, middle, lower"],
                      ["stoch_14_3", "Stochastic oscillator"],
                      ["vol_sma_20", "Volume, 20-period average"],
                    ].map(([key, name]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="docs-sec" id="errors">
              <h2>Errors</h2>
              <p>
                Standard HTTP codes with a JSON body. Anything we refuse is
                written to your records with the reason, so a rejected order is
                never silent.
              </p>
              <div className="docs-tw">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>401</td>
                      <td>Missing or invalid developer key.</td>
                    </tr>
                    <tr>
                      <td>403</td>
                      <td>Key is valid but not authorised for this trade.</td>
                    </tr>
                    <tr>
                      <td>404</td>
                      <td>No such trade, or it belongs to another account.</td>
                    </tr>
                    <tr>
                      <td>409</td>
                      <td>
                        Decision conflicts with current state — a buy while
                        already long, for example.
                      </td>
                    </tr>
                    <tr>
                      <td>422</td>
                      <td>
                        Order refused by your own limits. Check{" "}
                        <code>reason</code>.
                      </td>
                    </tr>
                    <tr>
                      <td>429</td>
                      <td>Rate limited. Back off and retry.</td>
                    </tr>
                    <tr>
                      <td>502</td>
                      <td>
                        The exchange rejected or timed out. We retry; the record
                        shows what happened.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="docs-sec" id="limits">
              <h2>Rate limits</h2>
              <p>
                Limits are per account, not per exchange — we compute indicators
                centrally so you never touch the exchange's own limits. Current
                headroom is returned on every response.
              </p>
              <Pre>{`<span class="m">X-RateLimit-Remaining:</span> 4871
<span class="m">X-RateLimit-Reset:</span> 1756483200`}</Pre>
            </section>

            <section className="docs-sec" id="n8n">
              <h2>n8n quickstart</h2>
              <p>
                Two nodes. Set the HTTP Request node's header, point it at your
                trade, feed the result into whatever decides, and post the answer
                back.
              </p>
              <Pre>{N8N_BODY}</Pre>
              <p>
                There's a full walkthrough with screenshots on the{" "}
                <Link href="/blog">blog</Link>, and the{" "}
                <Link href="/tutor">Academy</Link> covers building the decision
                step from scratch.
              </p>
            </section>
          </div>
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
