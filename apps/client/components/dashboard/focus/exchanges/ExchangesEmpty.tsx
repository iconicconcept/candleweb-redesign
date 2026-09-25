import Link from "next/link";
import { useRef, useState } from "react";
import { error } from "../../../alert/Toast";
import Dialog from "../Dialog";
import { CheckIcon, CopyIcon } from "../icons";
import type { ExchangeProp } from "../../../../types/exchange";
import {
  CONFIG_IPS,
  DESIGN_EXCHANGES,
  backendFor,
  needsPassphrase,
} from "../../../../lib/exchangeCatalog";

/* The design's pre-flight checklist. These are the user ticking off what they
   set on the exchange — nothing here is saved or sent; the score is only a
   projection of the key they're about to create. */
type Perm = "read" | "spot" | "withdraw" | "futures" | "ip";
const PERMS: { k: Perm; t: string; s: string }[] = [
  { k: "read", t: "Read", s: "Lets us show your balance, your open positions and what actually filled." },
  {
    k: "spot",
    t: "Spot trade",
    s: "Lets us place, manage and close the orders your bot decides on. Without this, nothing trades.",
  },
  {
    k: "withdraw",
    t: "Withdraw — leave this off",
    s: "We never need it and never ask for it. No legitimate trading service does.",
  },
  {
    k: "futures",
    t: "Futures and margin — leave this off",
    s: "Candleweb trades spot only. Granting more adds risk and buys you nothing.",
  },
  {
    k: "ip",
    t: "IP allowlist",
    s: "Paste our addresses into the key’s restriction field. A key locked to our addresses is useless anywhere else.",
  },
];

type Props = { exchanges: ExchangeProp[] };

export default function ExchangesEmpty({ exchanges }: Props) {
  const chooserRef = useRef<HTMLElement>(null);
  const [x, setX] = useState(DESIGN_EXCHANGES[0].key);
  const [p, setP] = useState<Record<Perm, boolean>>({
    read: false,
    spot: false,
    withdraw: false,
    futures: false,
    ip: false,
  });
  const [keyInfo, setKeyInfo] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const ex = DESIGN_EXCHANGES.find((d) => d.key === x) ?? DESIGN_EXCHANGES[0];
  const row = backendFor(exchanges, ex.key);
  const offered = exchanges.length === 0 || !!row;

  /* a brand new key is nowhere near expiry, hence the base 5 */
  const score =
    5 +
    (p.read ? 10 : 0) +
    (p.spot ? 15 : 0) +
    (!p.withdraw ? 35 : 0) +
    (!p.futures ? 15 : 0) +
    (p.ip ? 20 : 0);
  const band = score >= 80 ? "" : score >= 55 ? "mid5" : "low5";

  const title = !p.read && !p.spot
    ? "Nothing set yet"
    : p.withdraw
      ? "This key can move your money"
      : score >= 100
        ? "As tight as a key gets"
        : score >= 80
          ? "Good key"
          : "Missing something";
  const blurb = p.withdraw
    ? `Go back to ${ex.name} and untick withdrawal before you paste anything here.`
    : !p.read || !p.spot
      ? !p.read && !p.spot
        ? "Switch on what you granted and this shows what the key would score once connected."
        : "Read and spot trade are both required — without them there is nothing to connect."
      : !p.ip
        ? "Add the IP restriction and this key becomes worthless to anyone but us. Worth 20 points and thirty seconds."
        : p.futures
          ? "Turn futures off. Candleweb never uses it, so it is pure downside."
          : "Read, spot trade, nothing else, locked to our addresses. Paste it in.";
  const warn = p.withdraw
    ? "A withdrawal-enabled key is the one mistake here that can cost you everything in the account."
    : p.futures
      ? "Futures permission adds risk Candleweb will never use."
      : "";

  const ready = p.read && p.spot && !p.withdraw && offered;
  const passNeeded = needsPassphrase(ex.key);

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp((v) => (v === ip ? null : v)), 1500);
    } catch {
      error("Couldn't copy — select it by hand");
    }
  };

  const walk: [string, React.ReactNode][] = [
    [
      "Open the key page",
      <>
        Sign in to <b>{ex.name}</b> and open <b>{ex.menu}</b> from the account menu.
      </>,
    ],
    [
      "Create a new key",
      <>
        Name it <b>candleweb</b> so you can tell it apart later.{" "}
        {passNeeded
          ? `Set a passphrase you’ll remember — ${ex.name} asks for one, and so will we.`
          : `${ex.name} doesn’t use a passphrase here, so there is nothing extra to note down.`}
      </>,
    ],
    [
      "Tick the right boxes",
      <>
        Enable <b>{ex.ticks}</b>. Leave withdrawal unticked — if the page nudges you to enable it,
        ignore the nudge.
      </>,
    ],
    [
      "Restrict it to our addresses",
      <>
        Paste <b>{CONFIG_IPS.join(", ")}</b> into the IP restriction field. This is the single most
        valuable box on the page.
      </>,
    ],
    [
      "Copy it straight here",
      <>
        Take the key and secret across in one go. {ex.name} shows the secret once and never again.
      </>,
    ],
  ];

  const scrollToChooser = () =>
    chooserRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <div className="fx-jrn">
        <div className="fx-jrnh">
          <b>Getting to your first trade</b>
          <span>Step 1 of 4</span>
        </div>
        <div className="fx-jsteps">
          <div className="fx-js cur8">
            <em>You are here</em>
            <b>Connect an exchange</b>
          </div>
          <div className="fx-js">
            <em>Next</em>
            <b>Point a bot at it</b>
          </div>
          <div className="fx-js">
            <em>Then</em>
            <b>Set up a trade</b>
          </div>
          <div className="fx-js">
            <em>Finally</em>
            <b>Your first decision</b>
          </div>
        </div>
      </div>

      <div className="fx-empty">
        <div className="eic">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h13l-3-3M20 17H7l3 3" />
          </svg>
        </div>
        <h2>No exchange connected yet</h2>
        <p>
          Candleweb places orders on an account you already own. Until one is connected, your bots
          can think but they can&rsquo;t trade. It takes about five minutes, and you can revoke it from
          the exchange at any moment without asking us.
        </p>
        <div className="eb">
          <button
            className="fx-cta main2"
            type="button"
            style={{ flex: "0 0 auto", minWidth: 0 }}
            onClick={scrollToChooser}
          >
            Connect an exchange
          </button>
          <button
            className="fx-cta ghost2"
            type="button"
            style={{ flex: "0 0 auto", minWidth: 0 }}
            onClick={() => setKeyInfo(true)}
          >
            What is an API key?
          </button>
        </div>
      </div>

      <section className="fx-sec" ref={chooserRef}>
        <div className="fx-sh">
          <h2>Choose where you trade</h2>
          <span className="sub2">You&rsquo;ll need an account there already, with funds in it.</span>
        </div>
        <div className="fx-choose" role="group" aria-label="Exchange">
          {DESIGN_EXCHANGES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`fx-ch ${d.key === x ? "sel" : ""}`}
              aria-pressed={d.key === x}
              onClick={() => setX(d.key)}
            >
              <span className="ck">✓</span>
              <span className="xlogo">
                <img src={d.logo} alt={d.name} style={{ objectFit: d.fit }} />
              </span>
              <span className={`fx-broker ${d.key === "bitmart" ? "b7" : d.broker ? "" : "n7"}`}>
                {d.tag}
              </span>
            </button>
          ))}
        </div>
        <p className="fx-hint" style={{ marginTop: "12px" }}>
          {ex.note}
        </p>
      </section>

      <section className="fx-sec">
        <div className="fx-sh">
          <h2>Set the key up right, before you paste it</h2>
          <span className="sub2">
            Tick what you&rsquo;ve switched on at <b style={{ color: "var(--fx-teal2)" }}>{ex.name}</b>
            . We&rsquo;ll score it.
          </span>
        </div>
        <div className="fx-pre8">
          <div>
            {PERMS.map((perm) => {
              const on = p[perm.k];
              const danger = (perm.k === "withdraw" || perm.k === "futures") && on;
              return (
                <div
                  key={perm.k}
                  className={`fx-sw ${danger ? "bad8" : on ? "on8" : ""}`}
                >
                  <div className="tx">
                    <b>{perm.t}</b>
                    <span>{perm.s}</span>
                  </div>
                  <button
                    type="button"
                    className={`fx-tg ${on ? "" : "off4"} ${danger ? "rd8" : ""}`}
                    aria-pressed={on}
                    aria-label={perm.t}
                    onClick={() => setP((v) => ({ ...v, [perm.k]: !v[perm.k] }))}
                  />
                </div>
              );
            })}
            <div className="fx-ips" style={{ marginTop: "14px" }}>
              {CONFIG_IPS.map((ip) => (
                <button key={ip} className="fx-ipc" type="button" onClick={() => copyIp(ip)}>
                  {ip}
                  {copiedIp === ip ? <CheckIcon /> : <CopyIcon />}
                </button>
              ))}
            </div>
          </div>

          <div className="fx-gauge">
            <div
              className={`fx-ring ${band}`}
              style={{ "--v": score } as React.CSSProperties}
              role="img"
              aria-label={`Projected key safety ${score} of 100`}
            >
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle className="tr" cx="22" cy="22" r="19" />
                <circle className="vl" cx="22" cy="22" r="19" />
              </svg>
              <b>{score}</b>
            </div>
            <b>{title}</b>
            <p>{blurb}</p>
            {warn && <p className="gw">{warn}</p>}
          </div>
        </div>
      </section>

      <section className="fx-sec">
        <div className="fx-sh">
          <h2>Creating the key on {ex.name}</h2>
          <span className="sub2">Five steps, about three minutes. Keep it open in another tab.</span>
        </div>
        <div className="fx-walk">
          {walk.map(([t, body], i) => (
            <div className="fx-wk" key={t}>
              <i>{i + 1}</i>
              <div>
                <b>{t}</b>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
          {ready ? (
            <Link
              className="fx-cta main2"
              href={row ? `/dashboard/exchanges/new?exchange=${row.id}` : "/dashboard/exchanges/new"}
              style={{ flex: "0 0 auto", minWidth: "220px" }}
            >
              Connect {ex.name}
            </Link>
          ) : (
            <button
              className="fx-cta main2"
              type="button"
              disabled
              style={{ flex: "0 0 auto", minWidth: "220px" }}
            >
              Connect {ex.name}
            </button>
          )}
        </div>
        <p className="fx-note3">
          {!offered ? (
            <span className="fx-preview">
              <i>◔</i> {ex.name} isn&rsquo;t in the backend&rsquo;s exchange list yet
            </span>
          ) : ready ? (
            <>
              You&rsquo;ll paste the key{passNeeded ? ", secret and passphrase" : " and secret"} for{" "}
              {ex.name} on the next screen.
            </>
          ) : p.withdraw ? (
            <>
              <b>Untick withdrawal on {ex.name} first.</b> We won&rsquo;t take a key that can move money
              out, even though we would never use it.
            </>
          ) : (
            <>
              Switch on{" "}
              <b>{!p.read && !p.spot ? "read and spot trade" : !p.read ? "read" : "spot trade"}</b>{" "}
              once you&rsquo;ve set them at {ex.name}.
            </>
          )}
        </p>
      </section>

      <div className="fx-fund">
        <span className="fl2">YC</span>
        <div>
          <b>Don&rsquo;t have an exchange account yet?</b>
          <p>
            You&rsquo;ll need one, funded, before Candleweb can do anything. Our partner Yellow Card
            handles local-currency deposits across Africa, so you can fund an exchange account directly.
            Nothing passes through Candleweb — we never hold or convert money.
          </p>
          <Link
            className="fx-cta live6"
            href="/buy-crypto"
            style={{ flex: "0 0 auto", minWidth: 0, padding: "12px 20px", fontSize: "13.5px" }}
          >
            Fund via Yellow Card
          </Link>
        </div>
      </div>

      <div className="fx-caveat">
        <i>ⓘ</i>
        <p>
          <b>You stay in control.</b> Your funds never leave your exchange account, and Candleweb has no
          deposit address. Delete the key on your exchange and our access ends that second — no notice,
          no support ticket, no waiting. Open positions keep the stops already placed on them.
        </p>
      </div>

      <Dialog
        open={keyInfo}
        onClose={() => setKeyInfo(false)}
        labelledBy="key-info-title"
        icon={<CheckIcon />}
        title={<span id="key-info-title">What an API key actually is</span>}
        subtitle="Two minutes of reading, once"
        footer={
          <button className="fx-cta main2" type="button" onClick={() => setKeyInfo(false)}>
            Makes sense
          </button>
        }
      >
        <div className="fx-dsteps" style={{ marginTop: "18px" }}>
          <div className="fx-dstep on9">
            <em>the short version</em>
            <b>A key is a limited password</b>
            <p>
              Your exchange lets you mint one, decide exactly what it may do, and delete it whenever you
              like. It is not your login and it cannot change your login.
            </p>
          </div>
          <div className="fx-dstep">
            <em>what we ask for</em>
            <b>Read and place orders</b>
            <p>Enough to see your balance and to buy and sell on your behalf. That is the whole job.</p>
          </div>
          <div className="fx-dstep">
            <em>what we never ask for</em>
            <b>Moving money out</b>
            <p>
              Withdrawal permission is a separate tickbox. Leave it off and the key physically cannot
              send your funds anywhere — not to us, not to anyone who steals it.
            </p>
          </div>
          <div className="fx-dstep">
            <em>how it ends</em>
            <b>You delete it, not us</b>
            <p>Revoke the key on the exchange and our access stops that second. You don&rsquo;t need to tell us.</p>
          </div>
        </div>
      </Dialog>
    </>
  );
}
