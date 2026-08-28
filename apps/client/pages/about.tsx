import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
/* eslint-disable react/no-unescaped-entities */

const beliefs = [
  [
    "01",
    "Your money stays yours",
    "We have no wallet, no pooled balance, no deposit address. Funds sit in your exchange account and orders are placed there under your name.",
  ],
  [
    "02",
    "Every decision is on the record",
    "We store the exact candles and indicator values your bot saw at the moment it chose, next to what it decided and what happened after.",
  ],
  [
    "03",
    "Built for Africa, opened to the world",
    "We built for the people in our own classrooms first, and what came out of that works for a builder anywhere.",
  ],
];
const partners = [
  ["KuCoin", "Broker partner"],
  ["BitMart", "Broker partner"],
  ["Yellow Card", "On & off ramp"],
];
const timeline = [
  [
    "2023",
    "Candleweb starts",
    "Founded to bring automated trading to African retail investors.",
  ],
  [
    "2024 - 2025",
    "The hard problems surface",
    "Partial fills, rate limits and position monitoring turn out to be the real work.",
  ],
  [
    "April 2026",
    "Tutor Cohort 1",
    "Students build working agents and hit the same wall we did.",
  ],
  [
    "Mid 2026",
    "n8n Approved Curriculum",
    "Tutor's automation track is recognised by n8n.",
  ],
  [
    "August 2026",
    "Cohort 2, and a change of direction",
    "Candleweb repositions from a trading product to infrastructure.",
  ],
  [
    "Now",
    "Bring your bot",
    "Market data, monitoring, execution and review between a decision and a closed position.",
  ],
];
const teams = [
  [
    "Trading",
    "Market structure, indicators and regimes. Keeps CandleAI's strategy honest.",
  ],
  [
    "Research & Development",
    "Agent architecture, model work and the questions we have not answered yet.",
  ],
  [
    "Engineering",
    "The platform, API, workers and everything that must still be correct at 3am.",
  ],
  [
    "Education",
    "Tutor's cohorts and curriculum take someone from no automation experience to a working agent.",
  ],
  [
    "Growth & Compliance",
    "How Candleweb is explained, and the review every claim about money passes.",
  ],
];

function ButtonLink({
  href,
  children,
  tone = "amber",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "amber" | "teal";
}) {
  return (
    <Link href={href} className={`about-btn about-btn-${tone}`}>
      {children}
    </Link>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="about-eyebrow about-rise">{children}</p>;
}

export default function About() {
  const router = useRouter();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) =>
            entry.isIntersecting && entry.target.classList.add("is-seen"),
        ),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".about-rise")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Head>
        <title>About | Candleweb</title>
        <meta
          name="description"
          content="Candleweb builds trading infrastructure for people who build their own agents, in Africa and for the world."
        />
      </Head>
      <main className="about-stage">
        <div className="about-aura" />
        <div className="about-grid" />
        <PublicHeader active="about" />
        <div className="landing-wrap">
          <header className="about-hero" id="top">
            <Eyebrow>About Candleweb</Eyebrow>
            <h1 className="about-rise">
              We build the part
              <br />
              <span>nobody wants to build.</span>
            </h1>
            <p className="about-sub about-rise">
              Candleweb is infrastructure for agentic trading, built in Africa.
              We started because the interesting half of an automated trading
              system - the part that decides - had become easy, and the boring
              half had not. Someone had to do the boring half. We decided it
              should be us, built here rather than imported.
            </p>
            <div className="about-facts">
              {[
                ["2023", "Building since"],
                ["Africa", "Built here, open to the world"],
                ["2", "Tutor cohorts taught"],
                ["n8n", "Approved Curriculum"],
              ].map(([value, label]) => (
                <div className="about-fact about-rise" key={value}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </header>
        </div>
        <section className="about-band">
          <div className="about-wrap about-section about-story">
            <div className="about-rise">
              <Eyebrow>How we got here</Eyebrow>
              <h2>Started with a model. Ended up with plumbing.</h2>
              <div className="about-shift">
                <p>
                  <b>Then</b>A trading bot, aimed at people who wanted one.
                </p>
                <strong>↓</strong>
                <p>
                  <b>Now</b>Infrastructure, aimed at people who build their own.
                </p>
              </div>
            </div>
            <div className="about-rise">
              <p>
                Candleweb began as a trading model. We built a reinforcement
                learning agent, trained it, connected it to an exchange, and
                watched it work - right up until a real order half-filled and
                the whole thing fell over.
              </p>
              <p>
                That failure taught us more than the model did. The intelligence
                was never the constraint. The constraint was everything
                downstream of the decision: watching a position at three in the
                morning, enforcing a stop when the connection drops, and
                reconciling a fill that arrived in four pieces.
              </p>
              <div className="about-pull">
                We stopped trying to build the smartest bot and started building
                the thing every bot needs and nobody enjoys writing.
              </div>
              <p>
                Then we taught a room full of people to build agents. They built
                things that formed genuinely good opinions about the market and
                got stuck at exactly the same wall we had. That was the moment
                Candleweb became infrastructure. You bring the strategy. We run
                everything after it.
              </p>
            </div>
          </div>
        </section>
        <section className="about-wrap about-section">
          <Eyebrow>What we hold to</Eyebrow>
          <h2 className="about-rise">Three positions we won't trade away.</h2>
          <div className="about-beliefs">
            {beliefs.map(([number, title, text]) => (
              <article className="about-card about-rise" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about-band">
          <div className="about-wrap about-section">
            <Eyebrow>Two ways in</Eyebrow>
            <h2 className="about-rise">
              Not everyone wants to build a bot. That's fine.
            </h2>
            <p className="about-lede about-rise">
              Either way an agent does the trading. Candleweb runs the same
              infrastructure underneath both routes - what changes is who writes
              the strategy.
            </p>
            <div className="about-doors">
              <article className="about-door about-rise">
                <small>For builders</small>
                <h3>Bring your bot</h3>
                <p>
                  We feed your n8n, Make, or code agent live market data, take
                  back its decision, and run the trade from there.
                </p>
                <ButtonLink href="/" tone="teal">
                  See how it works ↗
                </ButtonLink>
              </article>
              <article className="about-door about-amber about-rise">
                <small>For everyone else</small>
                <h3>CandleAI</h3>
                <p>
                  Our own trading agent reads the market, makes the call, and
                  runs the position on the same execution and monitoring layer.
                </p>
                <ButtonLink href="/candleai" tone="teal">
                  Explore CandleAI ↗
                </ButtonLink>
              </article>
            </div>
            <p className="about-note about-rise">
              Same execution path. Same monitoring. Same trade records. Same
              rule about who holds your money - you do.
            </p>
          </div>
        </section>
        <section className="about-wrap about-section">
          <Eyebrow>Who we work with</Eyebrow>
          <h2 className="about-rise">
            Signed relationships, not just API keys.
          </h2>
          <p className="about-lede about-rise">
            Anyone can call a public exchange endpoint. We went further, because
            people trusting us with their trading deserve to know we have
            supported relationships with the venues their orders reach.
          </p>
          <div className="about-partners">
            {partners.map(([name, kind], index) => (
              <article
                className={`about-card about-partner about-rise ${index === 2 ? "about-amber" : ""}`}
                key={name}
              >
                <h3>{name}</h3>
                <small>{kind}</small>
                <p>
                  {index === 0
                    ? "A signed broker partnership and supported, accountable channel for agent orders."
                    : index === 1
                      ? "Your agent behaves identically whichever supported venue you trade on."
                      : "Licensed local currency rails across Africa for funding and withdrawals."}
                </p>
              </article>
            ))}
          </div>
          <div className="about-p-note about-rise">
            <b>Also</b>
            <span>
              <strong>n8n Approved Curriculum</strong> - Tutor's automation
              track is recognised by n8n.
            </span>
          </div>
        </section>
        <section className="about-band">
          <div className="about-wrap about-section">
            <Eyebrow>The road so far</Eyebrow>
            <h2 className="about-rise">
              Three years of getting it wrong first.
            </h2>
            <div className="about-timeline">
              {timeline.map(([when, title, text], index) => (
                <div
                  className={`about-timeline-row about-rise ${index === timeline.length - 1 ? "now" : ""}`}
                  key={when}
                >
                  <time>{when}</time>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="about-wrap about-section">
          <Eyebrow>The people</Eyebrow>
          <h2 className="about-rise">
            Five teams. One system to keep standing.
          </h2>
          <p className="about-lede about-rise">
            We're deliberately small, and most people here sit across more than
            one of these. What follows is how the work is divided.
          </p>
          <div className="about-teams">
            {teams.map(([title, text]) => (
              <article className="about-team about-rise" key={title}>
                <small>Team</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about-band">
          <div className="about-wrap about-section about-story">
            <div className="about-rise">
              <Eyebrow>Tutor by Candleweb</Eyebrow>
              <h2>We'd rather teach you than sell to you.</h2>
            </div>
            <div className="about-rise">
              <p>
                Tutor is our cohort programme in AI automation and personal
                finance. Students learn APIs and webhooks, build real workflows
                in n8n, and think properly about money before trading it.
              </p>
              <p>
                It exists because the people best served by Candleweb are people
                who can build. Rather than wait for them to appear, we teach
                them.
              </p>
              <ButtonLink href="/tutor" tone="teal">
                Explore courses ↗
              </ButtonLink>
            </div>
          </div>
        </section>
        <div className="about-wrap about-section" id="join">
          <section className="about-cta">
            <div className="about-rise">
              <Eyebrow>Work with us</Eyebrow>
              <h2>If this sounds like your kind of problem.</h2>
              <p className="about-lede">
                We hire rarely and slowly, and care more about what you've built
                than where you studied. If infrastructure that has to be correct
                at three in the morning appeals to you, we'd like to hear from
                you.
              </p>
              <ol>
                <li>
                  <span>1</span>Engineering - execution, monitoring,
                  integrations
                </li>
                <li>
                  <span>2</span>R&amp;D - signals, indicators, market structure
                </li>
                <li>
                  <span>3</span>Teaching - Tutor instructors and curriculum
                </li>
              </ol>
            </div>
            <form
              className="about-form about-rise"
              onSubmit={(event) => {
                event.preventDefault();
                router.push("mailto:hello@candleweb.io");
              }}
            >
              <label htmlFor="about-email">Email</label>
              <input
                id="about-email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <label htmlFor="about-interest">
                What would you want to work on?
              </label>
              <select id="about-interest" defaultValue="Engineering">
                <option>Engineering</option>
                <option>R&amp;D / market research</option>
                <option>Teaching with Tutor</option>
                <option>Something else</option>
              </select>
              <button className="about-btn about-btn-amber" type="submit">
                Get in touch ↗
              </button>
              <p>
                We read everything. We reply to most things, though not always
                quickly.
              </p>
            </form>
          </section>
        </div>
        <PublicFooter />
      </main>
    </>
  );
}
