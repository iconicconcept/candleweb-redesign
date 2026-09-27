import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import tradingV2Service from "../../../services/tradingV2Service";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { error, success } from "../../../components/alert/Toast";
import { writeClipboard } from "../../../lib/hooks/useClipboard";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import Dialog from "../../../components/dashboard/focus/Dialog";
import { CheckIcon } from "../../../components/dashboard/focus/icons";
import {
  PLATFORMS,
  REACH_MODES,
  ON_NO_REPLY,
  DECISION_STYLES,
  TIMEOUT_OPTIONS,
  MODEL_OPTIONS,
} from "../../../lib/botV2Labels";
import {
  BotV2,
  BotV2DecisionStyle,
  BotV2OnNoReply,
  BotV2Platform,
  BotV2ReachMode,
  BotV2TestResult,
} from "../../../types/tradingV2";

const DEFAULT_PROMPT = `You are a disciplined crypto trading analyst. You will receive the last 20 closed candles for a single pair along with the indicators the trade is configured to send.

Decide one of: buy, sell, hold.

Return JSON only: { "action", "size_pct", "rationale" }`;

/* The exact request/reply shape a bot integrates against — documentation of
   the API contract, not a stand-in for real trade data, so it's safe to show
   before a test has actually run (matches the design's static preview). */
const SAMPLE_REQUEST = `{
  "trade_id": "tr_9f2c",
  "pair": "BTC/USDT",
  "timeframe": "15m",
  "indicators": {
    "rsi_14": 61.4,
    "macd_12_26_9": 18.7,
    "ema_50": 63980.1
  }
}`;
const SAMPLE_REPLY = `{
  "action": "buy",
  "size_pct": 10,
  "rationale": "RSI off 45, MACD positive, above EMA-50."
}`;

type FormState = {
  name: string;
  note: string;
  platform: BotV2Platform;
  reach_mode: BotV2ReachMode;
  webhook_url: string;
  reply_timeout_s: number;
  on_no_reply: BotV2OnNoReply;
  prompt: string;
  model_name: string;
  decision_style: BotV2DecisionStyle;
  alert_email_on_fail: boolean;
  alert_push_on_fail: boolean;
  auto_pause_after_n_fails: number;
};

const DEFAULTS: FormState = {
  name: "",
  note: "",
  platform: "N8N_CLOUD",
  reach_mode: "PUSH",
  webhook_url: "",
  reply_timeout_s: 60,
  on_no_reply: "SKIP",
  prompt: DEFAULT_PROMPT,
  model_name: "Claude Sonnet",
  decision_style: "BUY_SELL_HOLD",
  alert_email_on_fail: true,
  alert_push_on_fail: true,
  auto_pause_after_n_fails: 10,
};

const AddBotPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<BotV2TestResult | null>(null);
  const [created, setCreated] = useState<BotV2 | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const needsWebhook = form.reach_mode === "PUSH";

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!form.name.trim()) m.push("name it");
    if (needsWebhook && !/^https?:\/\//i.test(form.webhook_url.trim())) m.push("add a valid webhook URL");
    return m;
  }, [form.name, form.webhook_url, needsWebhook]);

  /* Real completion, one flag per section below (05 has working defaults, so
     nothing there is required) plus a final "ready to save" flag — not the
     design's illustrative "3 of 6 · about 1 min left", since we can't know
     how long this takes any given person. */
  const stepsDone = [
    !!form.name.trim(),
    needsWebhook ? /^https?:\/\//i.test(form.webhook_url.trim()) : true,
    !!form.prompt.trim(),
    !!testResult?.ok,
    true,
    missing.length === 0,
  ];
  const doneCount = stepsDone.filter(Boolean).length;

  const runTest = async () => {
    if (!/^https?:\/\//i.test(form.webhook_url.trim())) {
      error("Enter a webhook URL first.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await dispatch(
        tradingV2Service.testBotConnection({ api: axiosToken, webhook_url: form.webhook_url.trim() }),
      );
      setTestResult(res.payload as BotV2TestResult);
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    if (missing.length) {
      error(`Before saving: ${missing.join(", ")}.`);
      return;
    }
    setBusy(true);
    try {
      const res: any = await dispatch(
        tradingV2Service.createBot({
          api: axiosToken,
          data: {
            name: form.name.trim(),
            note: form.note.trim(),
            platform: form.platform,
            reach_mode: form.reach_mode,
            webhook_url: form.webhook_url.trim(),
            reply_timeout_s: form.reply_timeout_s,
            on_no_reply: form.on_no_reply,
            prompt: form.prompt,
            model_name: form.model_name,
            decision_style: form.decision_style,
            alert_email_on_fail: form.alert_email_on_fail,
            alert_push_on_fail: form.alert_push_on_fail,
            auto_pause_after_n_fails: form.auto_pause_after_n_fails,
          },
        }),
      );
      if (res?.payload?.id) setCreated(res.payload as BotV2);
    } finally {
      setBusy(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const copyKey = async () => {
    if (!created?.dev_key) return;
    if (await writeClipboard(created.dev_key)) {
      success("Developer key copied");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      error("Couldn't copy — select the key and copy it manually.");
    }
  };

  return (
    <>
      <Head>
        <title>Add a bot | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          crumb={
            <>
              <a href="/dashboard/bots">‹ My bots</a> / Add
            </>
          }
          title="Add a bot"
          subtitle="Tell us what it runs on and how to reach it. About two minutes."
        />

        <div className="fx-prog">
          <div className="fx-ph">
            <b>Setup progress</b>
            <span>
              {doneCount} of {stepsDone.length} done
            </span>
          </div>
          <div className="fx-psteps">
            {stepsDone.map((done, i) => {
              const isCurrent = !done && stepsDone.slice(0, i).every(Boolean);
              return <i key={i} className={done ? "done3" : isCurrent ? "cur3" : ""} />;
            })}
          </div>
        </div>

        <div className="fx-formwrap">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* 01 — identity */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">01</span>
                <h3>What is it</h3>
                <span className="fx-tick2">✓</span>
              </div>
              <p className="fx-fsub">A name you&rsquo;ll recognise later, and where it runs.</p>

              <div className="fx-fr two2">
                <div>
                  <label className="fx-fl" htmlFor="bn">
                    Bot name
                  </label>
                  <div className="fx-inp">
                    <input
                      id="bn"
                      type="text"
                      placeholder="Momentum v3"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  <p className="fx-hint">Shown on every position and decision this bot makes.</p>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="bv">
                    Version or note <em>— optional</em>
                  </label>
                  <div className="fx-inp">
                    <input
                      id="bv"
                      type="text"
                      placeholder="e.g. added volume filter, 14 Aug"
                      value={form.note}
                      onChange={(e) => set("note", e.target.value)}
                    />
                  </div>
                  <p className="fx-hint">
                    Useful when you change the logic and want to compare before and after.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <span className="fx-fl">Platform</span>
                <div className="fx-plat">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`fx-pl2 ${form.platform === p.value ? "sel" : ""}`}
                      onClick={() => set("platform", p.value)}
                    >
                      <span className="ck">✓</span>
                      <b>{p.label}</b>
                      <span>{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 02 — connection */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">02</span>
                <h3>How Candleweb reaches it</h3>
                <span className="fx-tick2">✓</span>
              </div>
              <p className="fx-fsub">
                Push is the normal choice. Pull suits self-hosted setups that aren&rsquo;t reachable
                from the internet.
              </p>

              <div className="fx-reach2">
                {REACH_MODES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`fx-rc2 ${form.reach_mode === r.value ? "sel" : ""}`}
                    onClick={() => set("reach_mode", r.value)}
                  >
                    <span className="ck">✓</span>
                    <b>{r.label}</b>
                    <span>
                      {r.value === "PUSH"
                        ? "We POST the closed candle to your URL and wait for a decision."
                        : "Your bot calls our market-data endpoint on its own schedule, then posts a decision back."}
                    </span>
                    <em>{r.value === "PUSH" ? "Recommended" : "Works behind a firewall"}</em>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "16px" }}>
                <label className="fx-fl" htmlFor="hk">
                  Your webhook URL {!needsWebhook && <em>— optional for pull mode</em>}
                </label>
                <div className="fx-inp">
                  <input
                    id="hk"
                    type="url"
                    placeholder="https://your-n8n.app/webhook/candleweb"
                    value={form.webhook_url}
                    onChange={(e) => set("webhook_url", e.target.value)}
                  />
                </div>
                <p className="fx-hint">
                  Must accept a POST and reply with JSON. Use the test below before saving.
                </p>
              </div>

              {/* developer key — issued by the backend on create, so before save the
                  field shows where it will appear; the one-time dialog hands it over */}
              <div style={{ marginTop: "18px" }}>
                <span className="fx-fl">Developer key</span>
                <div className="fx-key">
                  <code className={created?.dev_key ? "" : "pend"}>
                    {created?.dev_key || "cw_dev_•••••••••••••••• — issued when you save"}
                  </code>
                  <button
                    type="button"
                    className="fx-mini"
                    disabled={!created?.dev_key}
                    title={created?.dev_key ? undefined : "Available once the bot is saved"}
                    onClick={copyKey}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="fx-mini"
                    disabled
                    title="Regenerate from the bot's settings once it is saved"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="fx-kflow">
                  <div className="fx-kf">
                    <i>1</i>
                    <div>
                      <b>Candleweb → your bot</b>
                      <span>
                        We include the key on every call, so your workflow can confirm the candle
                        really came from us.
                      </span>
                    </div>
                  </div>
                  <div className="fx-kf">
                    <i>2</i>
                    <div>
                      <b>Your bot → Candleweb</b>
                      <span>
                        Your bot sends the same key back in the <code>X-Candleweb-Key</code> header.
                        That authorises us to place and manage the order.
                      </span>
                    </div>
                  </div>
                </div>
                <p className="fx-warn2">
                  <em>!</em>
                  <span>
                    Treat this like a password. Regenerating takes effect immediately — update your
                    workflow first, or your bot stops being able to act.
                  </span>
                </p>
              </div>

              <div className="fx-fr two2" style={{ marginTop: "18px" }}>
                <div>
                  <label className="fx-fl" htmlFor="to">
                    Reply timeout
                  </label>
                  <div className="fx-inp">
                    <select
                      id="to"
                      value={form.reply_timeout_s}
                      onChange={(e) => set("reply_timeout_s", parseInt(e.target.value, 10))}
                    >
                      {TIMEOUT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="fx-hint">How long we wait before giving up on this candle.</p>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="nf">
                    If your bot doesn&rsquo;t reply
                  </label>
                  <div className="fx-inp">
                    <select
                      id="nf"
                      value={form.on_no_reply}
                      onChange={(e) => set("on_no_reply", e.target.value as BotV2OnNoReply)}
                    >
                      {ON_NO_REPLY.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="fx-hint">Applies to timeouts and errors. Stops stay armed either way.</p>
                </div>
              </div>

            </section>

            {/* 03 — prompt */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">03</span>
                <h3>The prompt or logic it runs on</h3>
                <span className="fx-tick2">✓</span>
              </div>
              <p className="fx-fsub">
                Paste the prompt your agent uses, or describe the rules if it isn&rsquo;t an LLM.
              </p>

              <div className="fx-rv2">
                <div className="rh2">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <b>This is what bot review reads</b>
                </div>
                <p>
                  Candleweb stores your prompt alongside every decision and the exact market data it
                  saw. Once there is a history, review compares the two and points at the rule that
                  is costing you money.
                </p>
              </div>

              <div className="fx-fr two2" style={{ marginBottom: "16px" }}>
                <div>
                  <label className="fx-fl" htmlFor="md">
                    Model <em>— optional</em>
                  </label>
                  <div className="fx-inp">
                    <select
                      id="md"
                      value={form.model_name}
                      onChange={(e) => set("model_name", e.target.value)}
                    >
                      {MODEL_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="ds">
                    Decision style
                  </label>
                  <div className="fx-inp">
                    <select
                      id="ds"
                      value={form.decision_style}
                      onChange={(e) => set("decision_style", e.target.value as BotV2DecisionStyle)}
                    >
                      {DECISION_STYLES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <label className="fx-fl" htmlFor="pr">
                Prompt <em>— used only for review, never run by us</em>
              </label>
              <div className="fx-inp">
                <textarea
                  id="pr"
                  className="fx-ta"
                  spellCheck={false}
                  value={form.prompt}
                  onChange={(e) => set("prompt", e.target.value)}
                />
              </div>
              <p className="fx-hint">
                Edit or delete it any time from the bot&rsquo;s settings. Never shared, never used to
                train models.
              </p>
            </section>

            {/* 04 — test */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">04</span>
                <h3>Test the connection</h3>
                <span className="fx-tick2">✓</span>
              </div>
              <p className="fx-fsub">
                We send one sample candle to your webhook with a throwaway key. Nothing is traded.
              </p>
              <div className="fx-test">
                <div className="fx-th2">
                  <b>Sample exchange</b>
                  <button
                    className="fx-mini go"
                    type="button"
                    disabled={testing}
                    onClick={runTest}
                  >
                    {testing ? "Sending…" : "Send test candle"}
                  </button>
                </div>
                <div className="fx-tsplit">
                  <div>
                    <span>We send</span>
                    <pre className="fx-pre">{SAMPLE_REQUEST}</pre>
                  </div>
                  <div>
                    <span>{testResult ? "Your bot replied" : "Your bot should reply"}</span>
                    <pre className={`fx-pre ${testResult ? (testResult.ok ? "ok9" : "bad9") : ""}`}>
                      {testResult
                        ? testResult.ok
                          ? testResult.body != null
                            ? JSON.stringify(testResult.body, null, 2)
                            : `OK · HTTP ${testResult.status_code ?? 200}`
                          : `Failed${testResult.status_code ? ` · HTTP ${testResult.status_code}` : ""}${testResult.error ? `\n${testResult.error}` : ""}`
                        : SAMPLE_REPLY}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* 05 — alerts */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">05</span>
                <h3>Tell me when it breaks</h3>
                <span className="fx-tick2">✓</span>
              </div>
              <p className="fx-fsub">
                A silent bot looks the same as a bot with no signals. We&rsquo;d rather wake you.
              </p>

              <div className="fx-sw">
                <div className="tx">
                  <b>Email me if this bot stops responding</b>
                  <span>After two consecutive failures.</span>
                </div>
                <button
                  type="button"
                  className={`fx-tg ${form.alert_email_on_fail ? "" : "off4"}`}
                  aria-pressed={form.alert_email_on_fail}
                  aria-label="Email on failure"
                  onClick={() => set("alert_email_on_fail", !form.alert_email_on_fail)}
                />
              </div>
              <div className="fx-sw">
                <div className="tx">
                  <b>Push notification on failure</b>
                  <span>Sent to the Candleweb app on your phone.</span>
                </div>
                <button
                  type="button"
                  className={`fx-tg ${form.alert_push_on_fail ? "" : "off4"}`}
                  aria-pressed={form.alert_push_on_fail}
                  aria-label="Push on failure"
                  onClick={() => set("alert_push_on_fail", !form.alert_push_on_fail)}
                />
              </div>
              <div className="fx-sw">
                <div className="tx">
                  <b>Pause the bot after 10 failures in a row</b>
                  <span>Stops us hammering a dead endpoint. You can resume it any time.</span>
                </div>
                <button
                  type="button"
                  className={`fx-tg ${form.auto_pause_after_n_fails > 0 ? "" : "off4"}`}
                  aria-pressed={form.auto_pause_after_n_fails > 0}
                  aria-label="Pause after repeated failures"
                  onClick={() =>
                    set("auto_pause_after_n_fails", form.auto_pause_after_n_fails > 0 ? 0 : 10)
                  }
                />
              </div>
            </section>

            <section className="fx-fsec">
              <div className="fx-actions">
                <button
                  className="fx-cta ghost2"
                  type="button"
                  disabled={busy}
                  onClick={save}
                >
                  {busy ? "Saving…" : "Save bot"}
                </button>
                <button
                  className="fx-cta main2"
                  type="button"
                  disabled={busy || missing.length > 0}
                  onClick={async () => {
                    await runTest();
                    await save();
                  }}
                >
                  {busy ? "Saving…" : "Test and add bot →"}
                </button>
              </div>
              <p className="fx-note3">
                {missing.length > 0 ? (
                  <>
                    <b>Before you can add it:</b> {missing.join(", ")}.
                  </>
                ) : (
                  "No orders are placed until you assign this bot to a trade and start it."
                )}
              </p>
            </section>
          </form>

          <aside className="fx-side2">
            <div className="fx-unlock">
              <h4>What adding this unlocks</h4>
              <p className="us">A decider you can point trades at.</p>
              <div className={`fx-ul ${form.name.trim() ? "got3" : ""}`}>
                <i>{form.name.trim() ? "✓" : "1"}</i>
                <div>
                  <b>Bot details set</b>
                  <span>Name, platform, endpoint</span>
                </div>
              </div>
              <div className={`fx-ul ${testResult?.ok ? "got3" : ""}`}>
                <i>{testResult?.ok ? "✓" : "2"}</i>
                <div>
                  <b>Connection tested</b>
                  <span>Your webhook answered correctly</span>
                </div>
              </div>
              <div className="fx-ul">
                <i>3</i>
                <div>
                  <b>Assign it to a trade</b>
                  <span>From the New trade screen</span>
                </div>
              </div>
              <p className="fx-tip2">
                <b>Tip.</b> Bots that store a prompt get reviewed. Bots that don&rsquo;t can only
                show you what happened, never why.
              </p>
            </div>
          </aside>
        </div>

        {/* dev_key — shown once */}
        <Dialog
          open={!!created}
          onClose={() => {
            setCreated(null);
            router.push("/dashboard/bots");
          }}
          labelledBy="key-title"
          icon={<CheckIcon />}
          title={<span id="key-title">{created?.name} is added</span>}
          subtitle="Copy the developer key now — it is shown once"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={copyKey}>
                {copied ? "Copied ✓" : "Copy key"}
              </button>
              <button
                className="fx-cta main2"
                type="button"
                onClick={() => {
                  setCreated(null);
                  router.push("/dashboard/bots");
                }}
              >
                Done
              </button>
            </>
          }
        >
          <div className="fx-key" style={{ marginTop: 0 }}>
            <code>{created?.dev_key}</code>
          </div>
          <p className="fx-dwarn">
            Your bot must send this key back in the <code>X-Candleweb-Key</code> header. If you lose
            it, regenerate a new one from the bot&rsquo;s settings — the old one stops working the
            moment you do.
          </p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default AddBotPage;
