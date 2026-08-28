import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
/* eslint-disable react/no-unescaped-entities */

const SETUP = [
  {
    title: "Pick a market",
    body: "A pair and a timeframe — BTC/USDT on 15 minutes, say. CandleAI watches it and nothing else.",
  },
  {
    title: "Set your limits",
    body: "How much of your balance you're willing to risk on one trade, the largest position you'll allow, and whether it may go short as well as long.",
  },
  {
    title: "Switch it on",
    body: "From the next candle close it starts deciding. Pause it whenever you like; open positions keep the stops already placed on them.",
  },
];

const DECIDES = [
  {
    label: "What it looks at",
    title: "Price and momentum",
    body: "Recent candles, RSI, MACD, moving averages and volatility — the same inputs our builders feed their own agents.",
  },
  {
    label: "What it returns",
    title: "A decision and a reason",
    body: "Every call is stored with the market data behind it, so you can look at any trade later and see exactly what it was reacting to.",
  },
  {
    label: "What it never does",
    title: "Move your money",
    body: "It can open and close positions in your own exchange account. It cannot withdraw, transfer or hold anything.",
  },
];

const COMPARE: [string, string, string][] = [
  ["Setup", "Pick a pair, set your limits, switch on.", "Build a workflow, connect an endpoint, test it."],
  ["Who writes the strategy", "We do.", "You do — and it stays yours."],
  ["Skills needed", "None.", "Comfortable with n8n, Make, or code."],
  ["Execution & monitoring", "Identical.", "Identical."],
  ["Trade records", "Identical.", "Identical."],
  ["Your money", "Stays in your exchange account.", "Stays in your exchange account."],
  ["Can you change how it decides?", "Only the risk settings.", "Everything."],
];

const LAYERS = [
  {
    tone: "",
    title: "Risk per trade",
    body: "You decide how much of your balance a single losing trade may cost, from a fraction of a per cent up to ten. CandleAI's stop is placed to match — it cannot choose to risk more.",
  },
  {
    tone: "",
    title: "Position ceiling",
    body: "A hard cap on how large any one position can be. Whatever CandleAI wants to do, an order above your ceiling is refused before it reaches the exchange.",
  },
  {
    tone: "",
    title: "Pause any time",
    body: "One tap stops new positions. Anything already open keeps its stop, so pausing never leaves a trade unattended.",
  },
  {
    tone: "i",
    title: "Every decision on the record",
    body: "You can open any trade it made and see the candles it saw, the reason it gave, where the stop sat and how the position closed.",
  },
];

const FAQ: [string, string][] = [
  [
    "Do I need to know how to trade?",
    "No, but you should understand what you're risking. The setup asks for a risk percentage and a position ceiling; those two numbers decide how much a bad run can cost you. If you're not sure what to pick, start at the low end — you can raise it later.",
  ],
  [
    "How much money do I need to start?",
    "Enough that your exchange will accept the order size, which varies by pair. More important than the amount is that it's money you can afford to lose entirely.",
  ],
  [
    "Where does my money sit?",
    "In your own exchange account, in your name. Candleweb has no wallet and no deposit address. We place orders using API keys you create with trade permission only, and you can revoke them on the exchange at any moment.",
  ],
  [
    "Can I run CandleAI and my own bot at the same time?",
    "Yes. They're separate trades. Some people run CandleAI on one pair while testing a bot of their own on another, then compare the records.",
  ],
  [
    "What happens when I'm asleep?",
    "The same as when you're awake. Stops and trailing stops are enforced by Candleweb's own workers, not by the agent, so positions stay managed continuously.",
  ],
  [
    "Can I see what it's about to do before it does it?",
    "Not in advance — it decides at the candle close and acts. But every decision is recorded immediately, and you can pause the trade at any point if you don't like what you're seeing.",
  ],
  [
    "Is there a fee?",
    "Check the pricing page for current terms. Whatever it is, it's a fee for the service — we don't take a share of your trades.",
  ],
];

export default function CandleAI() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>CandleAI | Candleweb's trading agent — no code required</title>
        <meta
          name="description"
          content="CandleAI is Candleweb's own trading agent. Choose the market, the risk and the size — it reads the chart and makes the call, on the same execution and monitoring as the bots our builders bring."
        />
        <meta property="og:title" content="CandleAI | Don't want to build a bot? Use ours." />
        <meta
          property="og:description"
          content="No code, no workflow, no webhook. CandleAI trades within limits you set, in your own exchange account."
        />
        <link rel="canonical" href="https://candleweb.io/candleai" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="candleai-stage">
        <div className="cai-aura">
          <b className="b1" />
          <b className="b2" />
          <b className="b3" />
        </div>
        <div className="cai-grid" />

        <PublicHeader active="candleai" />

        <header className="landing-wrap cai-hero" id="top">
          <p className="cai-eyebrow cai-rise">For everyone else</p>
          <h1 className="cai-rise">
            Don't want to build a bot?
            <br />
            <span className="grad">Use ours.</span>
          </h1>
          <p className="sub cai-rise">
            CandleAI is Candleweb's own trading agent. You choose the market, the
            risk and the size — it reads the chart and makes the call. No code, no
            workflow, no webhook. It runs on exactly the same execution,
            monitoring and record-keeping as the bots our builders bring.
          </p>
          <div className="cai-cta cai-rise">
            <Link href="/register" className="pub-btn pub-btn-amber">
              Get Started <span>↗</span>
            </Link>
            <Link href="/" className="pub-btn pub-btn-teal">
              I'd rather build my own
            </Link>
          </div>
        </header>

        <section className="cai-band">
          <div className="landing-wrap cai-sec">
            <p className="cai-eyebrow cai-rise">Setting it up</p>
            <h2 className="cai-rise">Three decisions, and it's running.</h2>
            <div className="cai-hcards">
              {SETUP.map((step, index) => (
                <div className="cai-hc cai-rise" key={step.title}>
                  <span className="n3">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-wrap cai-sec">
          <p className="cai-eyebrow cai-rise">How it decides</p>
          <h2 className="cai-rise">
            It reads the same data a careful trader would.
          </h2>
          <p className="cai-lede cai-rise">
            At every candle close CandleAI looks at recent price action alongside
            a standard set of indicators, and returns one of three answers: buy,
            sell, or do nothing. Most of the time the answer is do nothing — and
            it explains why, in a sentence you can read back later.
          </p>
          <div className="cai-custody">
            {DECIDES.map((item) => (
              <div className="cai-cus cai-rise" key={item.label}>
                <span>{item.label}</span>
                <b>{item.title}</b>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cai-band">
          <div className="landing-wrap cai-sec">
            <p className="cai-eyebrow cai-rise">Which one is for you</p>
            <h2 className="cai-sm cai-rise">CandleAI, or your own bot?</h2>
            <div className="cai-cmpwrap cai-rise">
              <table className="cai-cmp">
                <thead>
                  <tr>
                    <th />
                    <th className="hl">CandleAI</th>
                    <th>Your own bot</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([label, a, b]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{a}</td>
                      <td>{b}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Switching later</td>
                    <td colSpan={2}>
                      Assign the same trade to a different bot whenever you like.
                      Nothing is locked in.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="landing-wrap cai-sec">
          <p className="cai-eyebrow cai-rise">You stay in control</p>
          <h2 className="cai-rise">It trades within limits you set.</h2>
          <div className="cai-layers">
            {LAYERS.map((layer) => (
              <div className={`cai-layer ${layer.tone} cai-rise`} key={layer.title}>
                <h3>{layer.title}</h3>
                <p>{layer.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cai-band">
          <div className="landing-wrap cai-sec">
            <div className="cai-honest cai-rise">
              <b>What we won't tell you</b>
              <p>
                We will not tell you what CandleAI will earn, because nobody can.
                It loses on individual trades and it can lose over a month.
                Markets take money from people as readily as they give it, and
                any service that implies otherwise is selling you something.
              </p>
              <p>
                What we will tell you is exactly what it did and why — every
                decision, with the data behind it — so you can judge it on
                evidence rather than promises. Start with an amount you can
                afford to lose, and use the risk settings.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-wrap cai-sec">
          <p className="cai-eyebrow cai-rise">Common questions</p>
          <h2 className="cai-sm cai-rise">Before you switch it on.</h2>
          <div className="cai-qa">
            {FAQ.map(([question, answer]) => (
              <details className="cai-rise" key={question}>
                <summary>
                  {question}
                  <i>+</i>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="landing-wrap cai-sec" style={{ paddingTop: 0 }}>
          <section className="cai-cta-box">
            <div className="cai-rise">
              <p className="cai-eyebrow">Get started</p>
              <h2 style={{ maxWidth: "16ch" }}>
                Let CandleAI take the first trade.
              </h2>
              <p className="cai-lede">
                Connect your exchange, choose a pair, set your limits. You can
                pause it after one trade if you don't like what you see.
              </p>
            </div>
            <form
              className="cai-form cai-rise"
              onSubmit={(event) => {
                event.preventDefault();
                router.push("/register");
              }}
            >
              <label htmlFor="cai-email">Email</label>
              <input id="cai-email" type="email" placeholder="you@example.com" />
              <label htmlFor="cai-experience">Have you traded before?</label>
              <select id="cai-experience" defaultValue="No, this would be my first">
                <option>No, this would be my first</option>
                <option>A little</option>
                <option>Yes, regularly</option>
              </select>
              <button type="submit" className="pub-btn pub-btn-amber">
                Get Started <span>↗</span>
              </button>
              <p className="cai-fine">
                Free to connect. Trading digital assets carries risk, including
                the total loss of your capital.
              </p>
            </form>
          </section>
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
