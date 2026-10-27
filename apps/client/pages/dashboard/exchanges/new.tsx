import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import exchangeServices from "../../../services/exchangeService";
import userService from "../../../services/userService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import { error } from "../../../components/alert/Toast";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import Dialog from "../../../components/dashboard/focus/Dialog";
import { CheckIcon, CopyIcon } from "../../../components/dashboard/focus/icons";
import type { ExchangeProp, ExchangeRecord } from "../../../types/exchange";
import type { ExchangeData } from "../../../components/dashboard/modal/AddExchange";
import {
  CONFIG_IPS,
  DESIGN_EXCHANGES,
  offeredExchanges,
  needsPassphrase,
  backendFor as findBackend,
} from "../../../lib/exchangeCatalog";

const listOf = (a: string[]) =>
  a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

const ConnectExchangePage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { exchanges, exchangeRecord, isLoading } = useSelector(
    (state: RootState) => state.exchange,
  );
  const fetchedRef = useRef(false);

  const [exKey, setExKey] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [ipLocked, setIpLocked] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [connected, setConnected] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    if (exchanges.length < 1) dispatch(exchangeServices.getExchanges());
    dispatch(exchangeServices.getExchangeRecords(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  /* backend row for each design exchange, by name */
  const backendFor = (key: string) => findBackend(exchanges, key);
  /* Only what an admin currently offers. A deactivated exchange is gone from
     the picker rather than greyed with a note about the API — nobody should
     be able to read the setup guide for one they cannot connect. */
  const offered = offeredExchanges(exchanges);

  /* preselect from ?exchange=<backend id> (the Exchanges page's per-exchange
     buttons), otherwise the first design exchange the backend offers */
  useEffect(() => {
    if (exKey != null || exchanges.length === 0) return;
    const q = typeof router.query.exchange === "string" ? router.query.exchange : "";
    /* A link to an exchange that is no longer offered must not select it —
       it falls through to the first one that is. */
    const fromQuery = offered.find((d) => String(backendFor(d.key)?.id) === q);
    setExKey((fromQuery ?? offered[0] ?? DESIGN_EXCHANGES[0]).key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchanges, exKey, router.query.exchange]);

  const design = DESIGN_EXCHANGES.find((d) => d.key === exKey) ?? null;
  const ex = design ? backendFor(design.key) : null;
  const exName = design?.name ?? "the exchange";
  const guide = { menu: design?.menu ?? "API settings", ticks: design?.ticks ?? "read and spot trade" };
  const passNeeded = needsPassphrase(design?.key ?? "");
  const connectedIds = new Set(
    exchangeRecord.map((r: ExchangeRecord) => String(r.supported_exchange_id)),
  );

  const akOK = apiKey.trim().length >= 16;
  const asOK = secret.trim().length >= 16;
  const ppOK = !passNeeded || passphrase.trim().length >= 4;
  const credsOK = akOK && asOK && ppOK;

  const steps = [!!ex, credsOK, ipLocked, credsOK];
  const doneCount = steps.filter(Boolean).length;
  const firstOpen = steps.indexOf(false);

  /* scores the key being handed over, from what's on this form — not a
     read-back from the exchange (that needs BACKEND_API_REQUESTS §1.14) */
  const score = (credsOK ? 80 : akOK || asOK ? 30 : 0) + (ipLocked ? 20 : 0);
  const band = score >= 80 ? "" : score >= 55 ? "mid5" : "low5";

  const missing: string[] = [];
  if (!design) missing.push("pick an exchange");
  else if (!ex) missing.push(`${exName} isn't available on the backend yet`);
  if (!akOK) missing.push("paste the API key");
  if (!asOK) missing.push("paste the secret");
  if (!ppOK) missing.push("add the passphrase");
  const ready = missing.length === 0;

  const pickExchange = (key: string) => {
    setExKey(key);
    if (!needsPassphrase(key)) setPassphrase("");
  };

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp((v) => (v === ip ? null : v)), 1500);
    } catch {
      error("Couldn't copy — select it by hand");
    }
  };

  const connect = () => {
    if (!ready || !ex) return;
    const data: ExchangeData = passNeeded
      ? {
          supported_exchange_id: ex.id,
          API_KEY: apiKey.trim(),
          API_SECRET: secret.trim(),
          API_PASSPHRASE: passphrase.trim(),
        }
      : { supported_exchange_id: ex.id, API_KEY: apiKey.trim(), API_SECRET: secret.trim() };

    dispatch(exchangeServices.addExchange({ axiosToken, data })).then((res: any) => {
      if (res?.error) {
        error(typeof res.payload === "string" ? res.payload : `Couldn't connect ${exName}`);
        return;
      }
      dispatch(exchangeServices.getExchangeRecords(axiosToken));
      dispatch(userService.getBalance(axiosToken));
      setConnected(exName);
    });
  };

  const helpSteps = [
    <>
      Sign in to <b>{exName}</b> and open <b>{guide.menu}</b> from the account menu.
    </>,
    <>
      Choose <b>Create API</b> and name it <b>candleweb</b>.
    </>,
    passNeeded ? (
      <>Set a passphrase you&rsquo;ll remember — you&rsquo;ll need it in the field on the left.</>
    ) : (
      <>{exName} keys don&rsquo;t need a passphrase here, so there&rsquo;s nothing extra to note down.</>
    ),
    <>
      Tick <b>{guide.ticks}</b>. Leave withdrawal unticked.
    </>,
    <>Paste our IP addresses into the restriction field, then copy the key and secret straight here.</>,
  ];

  return (
    <>
      <Head>
        <title>Connect an exchange | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="exchanges">
        <TopBar
          crumb={
            <>
              <a href="/dashboard/exchanges">‹ Exchanges</a> / Connect
            </>
          }
          title="Connect an exchange"
          subtitle="A trade-only key, checked before it goes anywhere near an order."
        />

        <div className="fx-formwrap">
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <div className="fx-prog">
              <div className="fx-ph">
                <b>Connecting an account</b>
                <span>
                  {doneCount} of {steps.length} ready
                </span>
              </div>
              <div className="fx-psteps">
                {steps.map((done, i) => (
                  <i key={i} className={done ? "done3" : i === firstOpen ? "cur3" : ""} />
                ))}
              </div>
            </div>

            {/* 01 — which exchange */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">01</span>
                <h3>Which exchange</h3>
                {steps[0] && <span className="fx-tick2">✓</span>}
              </div>
              <p className="fx-fsub">Pick the account you want Candleweb to place orders on.</p>
              <div className="fx-xpick" role="group" aria-label="Exchange">
                {offered.map((d) => {
                  const row = backendFor(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className={`fx-xp ${d.key === exKey ? "sel" : ""}`}
                      aria-pressed={d.key === exKey}
                      onClick={() => pickExchange(d.key)}
                    >
                      <span className="xlogo">
                        <img src={d.logo} alt={d.name} style={{ objectFit: d.fit }} />
                      </span>
                      <span className="xs">
                        {row && connectedIds.has(String(row.id)) ? `${d.tag} · connected` : d.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* the design's optional "Label" field has nowhere to be saved:
                  BACKEND_API_REQUESTS §1.24 */}
              <div style={{ marginTop: "16px" }}>
                <span className="fx-fl">
                  Label <em>— optional</em>
                </span>
                <span className="fx-preview">
                  <i>◔</i> Needs a label field on exchange records (§1.24)
                </span>
              </div>
            </section>

            {/* 02 — credentials */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">02</span>
                <h3>Your API credentials</h3>
                {steps[1] && <span className="fx-tick2">✓</span>}
              </div>
              <p className="fx-fsub">
                Created on <b>{exName}</b> under <b>{guide.menu}</b>. Once saved, the key is never
                shown back in full.
              </p>

              <div>
                <label className="fx-fl" htmlFor="ak">
                  API key
                </label>
                <div className={`fx-inp ${akOK ? "ok8" : ""}`}>
                  <input
                    id="ak"
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="Paste your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <span className="tick8">✓</span>
                </div>
                <p className="fx-hint">
                  {apiKey.trim() && !akOK
                    ? "That looks short for an API key. Check you copied the whole string."
                    : "A long string of letters and numbers, shown on the exchange next to the key’s name."}
                </p>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label className="fx-fl" htmlFor="as">
                  API secret
                </label>
                <div className={`fx-inp ${asOK ? "ok8" : ""}`}>
                  <input
                    id="as"
                    className="pk2"
                    type={showSecret ? "text" : "password"}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="Paste your API secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <button className="peek" type="button" onClick={() => setShowSecret((v) => !v)}>
                    {showSecret ? "Hide" : "Show"}
                  </button>
                  <span className="tick8">✓</span>
                </div>
                <p className="fx-hint">
                  Most exchanges show the secret once, when you create the key. If you&rsquo;ve lost
                  it, create a new key rather than hunting for it.
                </p>
              </div>

              {passNeeded && (
                <div style={{ marginTop: "16px" }}>
                  <label className="fx-fl" htmlFor="pp">
                    API passphrase
                  </label>
                  <div className={`fx-inp ${passphrase.trim().length >= 4 ? "ok8" : ""}`}>
                    <input
                      id="pp"
                      className="pk2"
                      type={showPass ? "text" : "password"}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="The passphrase you set on the exchange"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                    />
                    <button className="peek" type="button" onClick={() => setShowPass((v) => !v)}>
                      {showPass ? "Hide" : "Show"}
                    </button>
                    <span className="tick8">✓</span>
                  </div>
                  <div className="fx-cond">
                    <i>!</i>
                    <p>
                      <b>Required for {exName}.</b> This is the passphrase you chose when creating
                      the key — not your exchange login password. Exchanges that don&rsquo;t use one
                      hide this field.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 03 — permissions */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">03</span>
                <h3>Permissions on the key</h3>
                {steps[2] && <span className="fx-tick2">✓</span>}
              </div>
              <p className="fx-fsub">Set these on the exchange before you paste.</p>
              {/* the design's "we check what you actually granted" needs a
                  permission read-back: BACKEND_API_REQUESTS §1.14 */}
              {/* <p className="fx-hint" style={{ margin: "-8px 0 16px" }}>
                <span className="fx-preview">
                  <i>◔</i> Checking what the key actually grants needs the key-permissions endpoint
                  (§1.14)
                </span>
              </p> */}
              <div className="fx-pcheck">
                <div className="fx-pc on3">
                  <i>✓</i>
                  <div>
                    <b>Enable: General / Read</b>
                    <span>So we can show your balance and confirm what filled.</span>
                  </div>
                </div>
                <div className="fx-pc on3">
                  <i>✓</i>
                  <div>
                    <b>Enable: Spot trade</b>
                    <span>So we can place and close the orders your bot decides on.</span>
                  </div>
                </div>
                <div className="fx-pc off3">
                  <i>✕</i>
                  <div>
                    <b>Leave off: Withdraw</b>
                    <span>We never need it. No trading service should ask for it.</span>
                  </div>
                </div>
                <div className="fx-pc off3">
                  <i>✕</i>
                  <div>
                    <b>Leave off: Futures &amp; margin</b>
                    <span>Candleweb trades spot only. More permission, no more benefit.</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <span className="fx-fl">
                  IP allowlist <em>— worth more than everything above it</em>
                </span>
                <div className="fx-ips">
                  {CONFIG_IPS.map((ip) => (
                    <button key={ip} className="fx-ipc" type="button" onClick={() => copyIp(ip)}>
                      {ip}
                      {copiedIp === ip ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  ))}
                </div>
                <div className="fx-sw" style={{ marginTop: "6px" }}>
                  <div className="tx">
                    <b>I&rsquo;ve restricted the key to these addresses</b>
                    <span>
                      A key locked to our addresses does nothing from anywhere else, even if it leaks.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`fx-tg ${ipLocked ? "" : "off4"}`}
                    aria-pressed={ipLocked}
                    aria-label="IP allowlist set"
                    onClick={() => setIpLocked((v) => !v)}
                  />
                </div>
              </div>
            </section>

            {/* 04 — what connect does */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">04</span>
                <h3>What happens when you connect</h3>
                {steps[3] && <span className="fx-tick2">✓</span>}
              </div>
              <div className="fx-rv2">
                <div className="rh2">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <b>What happens when you press connect</b>
                </div>
                <p>
                  The key is saved to your Candleweb account for <b>{exName}</b>, and its balance
                  shows up wherever you allocate money to a trade.{" "}
                  <b>
                    No orders are placed until you point a trade at this account and start it.
                  </b>
                </p>
              </div>
              {/* the design's read-only verification run (reach the exchange,
                  read balance, read permissions, confirm withdraw off, check IP
                  lock) needs a per-key read-back: BACKEND_API_REQUESTS §1.14 */}
              <p className="fx-hint" style={{ margin: "0 0 4px" }}>
                <span className="fx-preview">
                  <i>◔</i> The read-only key check before saving needs the key-permissions endpoint
                  (§1.14)
                </span>
              </p>

              <div className="fx-actions" style={{ marginTop: "22px" }}>
                <Link className="fx-cta ghost2" href="/dashboard/exchanges">
                  Cancel
                </Link>
                <button
                  className="fx-cta main2"
                  type="button"
                  disabled={!ready || isLoading}
                  onClick={connect}
                >
                  {isLoading ? "Connecting…" : "Connect exchange"}
                </button>
              </div>
              <p className="fx-note3">
                {ready ? (
                  ipLocked ? (
                    "The key is restricted to our addresses, so it is worthless anywhere else. Connect it."
                  ) : (
                    "You can connect without the IP restriction, but you’d be leaving the best protection on the table."
                  )
                ) : (
                  <>
                    Before you can connect: <b>{listOf(missing)}</b>.
                  </>
                )}
              </p>
            </section>
          </form>

          <aside className="fx-side2">
            <div className="fx-gauge2">
              <div
                className={`fx-ring ${band}`}
                style={{ "--v": score } as React.CSSProperties}
                role="img"
                aria-label={`Key safety score ${score} of 100`}
              >
                <svg viewBox="0 0 44 44" aria-hidden="true">
                  <circle className="tr" cx="22" cy="22" r="19" />
                  <circle className="vl" cx="22" cy="22" r="19" />
                </svg>
                <b>{score}</b>
              </div>
              <b>
                {score >= 100 ? "Nothing left to tighten" : score >= 80 ? "Good, one gap" : "Key safety"}
              </b>
              <p>
                {!credsOK
                  ? "Fills in as you go. It scores the key you’re about to hand over, not your trading."
                  : !ipLocked
                    ? "Restrict the key to our IP addresses and this reaches 100. It is the cheapest twenty points on the page."
                    : "Credentials in and locked to our addresses. Connect it."}
              </p>
            </div>

            <div className="fx-help">
              <h4>Creating the key on {exName}</h4>
              <p className="hs">About three minutes. Keep it open in another tab.</p>
              {helpSteps.map((s, i) => (
                <div className="fx-hstep" key={i}>
                  <i>{i + 1}</i>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* connected */}
        <Dialog
          open={!!connected}
          onClose={() => router.push("/dashboard/exchanges")}
          labelledBy="ex-done-title"
          icon={<CheckIcon />}
          title={<span id="ex-done-title">{connected} is connected</span>}
          subtitle="Key saved · shown masked from now on"
          footer={
            <>
              <Link className="fx-cta ghost2" href="/dashboard/exchanges">
                Back to exchanges
              </Link>
              <Link className="fx-cta main2" href="/dashboard/trades/new">
                Set up a trade
              </Link>
            </>
          }
        >
          <div className="fx-count">
            <div
              className={`fx-ring ${band}`}
              style={{ "--v": score } as React.CSSProperties}
              role="img"
              aria-label={`Key safety score ${score} of 100`}
            >
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle className="tr" cx="22" cy="22" r="19" />
                <circle className="vl" cx="22" cy="22" r="19" />
              </svg>
              <b>{score}</b>
            </div>
            <div className="ct">
              <span>Key safety</span>
              <p>
                {ipLocked
                  ? "Restricted to our addresses. With read and spot trade only, this key can trade and nothing else."
                  : `Add the IP restriction on ${connected} and this reaches 100.`}
              </p>
            </div>
          </div>
          <div className="fx-dsteps">
            <div className="fx-dstep on9">
              <em>done</em>
              <b>The account is connected</b>
              <p>Its balance shows up wherever you allocate money to a trade.</p>
            </div>
            <div className="fx-dstep">
              <em>next</em>
              <b>Point a trade at it</b>
              <p>Nothing is placed until a trade names this account and you start it.</p>
            </div>
            <div className="fx-dstep">
              <em>whenever you like</em>
              <b>Revoke it on the exchange</b>
              <p>Delete the key there and our access ends that second. You don&rsquo;t need to tell us.</p>
            </div>
          </div>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default ConnectExchangePage;
