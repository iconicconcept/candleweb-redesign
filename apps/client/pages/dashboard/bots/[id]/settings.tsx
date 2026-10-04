import Head from "next/head";
import Link from "next/link";
import { maskString } from "ui";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import { error, success } from "../../../../components/alert/Toast";
import { writeClipboard } from "../../../../lib/hooks/useClipboard";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";
import Dialog from "../../../../components/dashboard/focus/Dialog";
import { TrashIcon, RefreshIcon, WarnIcon } from "../../../../components/dashboard/focus/icons";
import {
  BotV2,
  BotV2DecisionStyle,
  BotV2OnNoReply,
  BotV2Platform,
  BotV2ReachMode,
} from "../../../../types/tradingV2";
import {
  PLATFORMS,
  REACH_MODES,
  ON_NO_REPLY,
  DECISION_STYLES,
  TIMEOUT_OPTIONS,
  MODEL_OPTIONS,
  STATUS_META,
} from "../../../../lib/botV2Labels";

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

const fromBot = (b: BotV2): FormState => ({
  name: b.name,
  note: b.note || "",
  platform: b.platform,
  reach_mode: b.reach_mode,
  webhook_url: b.webhook_url || "",
  reply_timeout_s: b.reply_timeout_s,
  on_no_reply: b.on_no_reply,
  prompt: b.prompt || "",
  model_name: b.model_name || "",
  decision_style: b.decision_style,
  alert_email_on_fail: b.alert_email_on_fail,
  alert_push_on_fail: b.alert_push_on_fail,
  auto_pause_after_n_fails: b.auto_pause_after_n_fails,
});

const BotSettingsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, trades } = useSelector((state: RootState) => state.tradingV2);
  const { user } = useUserStore((state) => state);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && !Number.isNaN(id);

  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);

  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState<null | "save" | "run" | "key" | "delete">(null);
  const [confirmKey, setConfirmKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const loadedRef = useRef<number | null>(null);
  const tradesRef = useRef(false);

  useEffect(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    if (!tradesRef.current) {
      tradesRef.current = true;
      dispatch(tradingV2Service.listTrades(axiosToken));
    }
    if (!bot && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(tradingV2Service.getBot({ api: axiosToken, id: id as number }));
    }
  }, [valid, id, bot, axiosToken, dispatch]);

  useEffect(() => {
    if (bot && form === null) setForm(fromBot(bot));
  }, [bot, form]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  /* trades this bot decides for — drives the live "currently runs N trades" line */
  const linkedTrades = useMemo(() => trades.filter((t) => t.bot === id), [trades, id]);

  /* the threshold the pause toggle restores when switched back on */
  const pauseN = form?.auto_pause_after_n_fails || bot?.auto_pause_after_n_fails || 10;

  const dirty = useMemo(() => {
    if (!bot || !form) return false;
    return JSON.stringify(form) !== JSON.stringify(fromBot(bot));
  }, [bot, form]);

  const save = async () => {
    if (!bot || !form) return;
    if (!form.name.trim()) {
      error("Give the bot a name.");
      return;
    }
    const hookUrl = form.webhook_url.trim();
    if (hookUrl ? !/^https?:\/\//i.test(hookUrl) : form.reach_mode === "PUSH") {
      error(hookUrl ? "Enter a valid webhook URL (https://…)." : "A push bot needs a webhook URL.");
      return;
    }
    setBusy("save");
    try {
      await dispatch(
        tradingV2Service.updateBot({
          api: axiosToken,
          id: bot.id,
          data: {
            name: form.name.trim(),
            note: form.note.trim(),
            platform: form.platform,
            reach_mode: form.reach_mode,
            webhook_url: form.webhook_url.trim() || null,
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
    } finally {
      setBusy(null);
    }
  };

  const toggleRun = async () => {
    if (!bot) return;
    setBusy("run");
    try {
      if (bot.status === "ACTIVE") {
        await dispatch(tradingV2Service.pauseBot({ api: axiosToken, id: bot.id }));
      } else {
        await dispatch(tradingV2Service.resumeBot({ api: axiosToken, id: bot.id }));
      }
      setConfirmPause(false);
    } finally {
      setBusy(null);
    }
  };

  const discard = () => {
    if (bot) setForm(fromBot(bot));
    setConfirmDiscard(false);
  };

  const regenerate = async () => {
    if (!bot) return;
    setBusy("key");
    try {
      await dispatch(
        tradingV2Service.regenerateBotKey({
          api: axiosToken,
          id: bot.id,
          onSuccess: (key) => {
            setConfirmKey(false);
            setNewKey(key);
          },
        }),
      );
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    if (!bot) return;
    setBusy("delete");
    try {
      await dispatch(
        tradingV2Service.deleteBot({
          api: axiosToken,
          id: bot.id,
          onSuccess: () => router.push("/dashboard/bots"),
        }),
      );
    } finally {
      setBusy(null);
    }
  };

  const [copied, setCopied] = useState(false);
  const copyText = async (v: string | null | undefined) => {
    if (!v) return;
    if (await writeClipboard(v)) {
      success("Developer key copied");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      error("Couldn't copy — select the key and copy it manually.");
    }
  };
  const copyKey = () => copyText(newKey);

  const meta = bot ? STATUS_META[bot.status] ?? STATUS_META.PAUSED : null;

  return (
    <>
      <Head>
        <title>{bot ? `${bot.name} · settings` : "Bot settings"} | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          crumb={
            <>
              <a href="/dashboard/bots">‹ My bots</a> /{" "}
              {bot ? <a href={`/dashboard/bots/${bot.id}`}>{bot.name}</a> : "Bot"} / Settings
            </>
          }
          title={bot ? `${bot.name} · settings` : "Bot settings"}
          subtitle="Changes take effect from the next candle close. Open positions keep their stops."
        />

        {!bot && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {valid ? "Loading this bot…" : "Bot not found."}
          </p>
        )}

        {bot && form && meta && (
          <>
            {meta.dead && (
              <p className="fx-failmsg">
                <b>Not responding.</b> Candleweb is not getting answers from this bot, so no orders
                are being placed for any trade it decides. Fix it here, then resume — its
                reliability record is on{" "}
                <Link href={`/dashboard/bots/${bot.id}`} style={{ color: "var(--fx-teal2)" }}>
                  the bot&rsquo;s page
                </Link>
                .
              </p>
            )}

            <div className="fx-formwrap">
              <form onSubmit={(e) => e.preventDefault()}>
                {/* 01 identity */}
                <section className="fx-fsec">
                  <div className="fx-fh">
                    <span className="fx-fn">01</span>
                    <h3>Identity</h3>
                  </div>
                  <p className="fx-fsub">What this bot is called, and where it runs.</p>
                  <div className="fx-fr two2">
                    <div>
                      <label className="fx-fl" htmlFor="bn">
                        Bot name
                      </label>
                      <div className="fx-inp">
                        <input
                          id="bn"
                          type="text"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                        />
                      </div>
                      <p className="fx-hint">
                        Renaming keeps all history — past records follow the bot, not the name.
                      </p>
                    </div>
                    <div>
                      <label className="fx-fl" htmlFor="bv">
                        Version or note <em>— optional</em>
                      </label>
                      <div className="fx-inp">
                        <input
                          id="bv"
                          type="text"
                          value={form.note}
                          onChange={(e) => set("note", e.target.value)}
                        />
                      </div>
                      <p className="fx-hint">Shown on the review page so you can tell versions apart.</p>
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

                {/* 02 connection */}
                <section className="fx-fsec">
                  <div className="fx-fh">
                    <span className="fx-fn">02</span>
                    <h3>Connection</h3>
                  </div>
                  <p className="fx-fsub">
                    How we reach your bot, and what happens when we can&rsquo;t.
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
                            : "Your bot pulls market data on its own schedule, then posts a decision back."}
                        </span>
                        <em>
                          {bot.reach_mode === r.value
                            ? "Currently active"
                            : r.value === "PUSH"
                              ? "Recommended"
                              : "Works behind a firewall"}
                        </em>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <label className="fx-fl" htmlFor="hk">
                      Webhook URL {form.reach_mode === "PULL" && <em>— optional for pull mode</em>}
                    </label>
                    <div className="fx-inp">
                      <input
                        id="hk"
                        type="url"
                        value={form.webhook_url}
                        onChange={(e) => set("webhook_url", e.target.value)}
                      />
                    </div>
                    <p className="fx-hint">
                      Last signal, reply time, failed candles and 30-day uptime are on{" "}
                      <Link href={`/dashboard/bots/${bot.id}`} style={{ color: "var(--fx-teal2)" }}>
                        the bot&rsquo;s page
                      </Link>
                      .
                    </p>
                  </div>

                  {/* developer key */}
                  <div style={{ marginTop: "18px" }}>
                    <span className="fx-fl">Developer key</span>
                    <div className="fx-key">
                      <code>{bot.dev_key ? maskString(bot.dev_key) : "— no key on this bot —"}</code>
                      <button
                        type="button"
                        className="fx-mini"
                        disabled={!bot.dev_key}
                        title={bot.dev_key ? undefined : "This bot has no developer key"}
                        onClick={() => copyText(bot.dev_key)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="fx-mini"
                        disabled={busy === "key"}
                        onClick={() => setConfirmKey(true)}
                      >
                        Regenerate
                      </button>
                    </div>
                    <p className="fx-warn2">
                      <em>!</em>
                      <span>
                        Regenerating takes effect immediately. Update your workflow first or this bot
                        stops being able to trade.
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
                          {!TIMEOUT_OPTIONS.includes(form.reply_timeout_s) && (
                            <option value={form.reply_timeout_s}>
                              {form.reply_timeout_s} seconds
                            </option>
                          )}
                        </select>
                      </div>
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
                    </div>
                  </div>
                </section>

                {/* 03 prompt */}
                <section className="fx-fsec">
                  <div className="fx-fh">
                    <span className="fx-fn">03</span>
                    <h3>Prompt</h3>
                  </div>
                  <p className="fx-fsub">
                    Bot review reads this alongside every decision. Results before and after an
                    edit are only comparable if you know when it changed — note it in the version
                    field.
                  </p>
                  <div className="fx-fr two2" style={{ marginBottom: "16px" }}>
                    <div>
                      <label className="fx-fl" htmlFor="md">
                        Model
                      </label>
                      <div className="fx-inp">
                        <select
                          id="md"
                          value={form.model_name}
                          onChange={(e) => set("model_name", e.target.value)}
                        >
                          <option value="">Not set</option>
                          {MODEL_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                          {form.model_name && !MODEL_OPTIONS.includes(form.model_name) && (
                            <option value={form.model_name}>{form.model_name}</option>
                          )}
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
                          onChange={(e) =>
                            set("decision_style", e.target.value as BotV2DecisionStyle)
                          }
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
                    Saved{" "}
                    {new Date(bot.updated_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {form.prompt.length.toLocaleString()} characters
                  </p>
                </section>

                {/* 04 alerts */}
                <section className="fx-fsec">
                  <div className="fx-fh">
                    <span className="fx-fn">04</span>
                    <h3>Alerts</h3>
                  </div>
                  <p className="fx-fsub">A silent bot looks the same as a bot with no signals.</p>
                  <div className="fx-sw">
                    <div className="tx">
                      <b>Email me if this bot stops responding</b>
                      <span>
                        After two consecutive failures{user?.email ? `, to ${user.email}` : ""}.
                      </span>
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
                      <b>Pause after {pauseN} failures in a row</b>
                      <span>Stops us hammering a dead endpoint.</span>
                    </div>
                    <button
                      type="button"
                      className={`fx-tg ${form.auto_pause_after_n_fails > 0 ? "" : "off4"}`}
                      aria-pressed={form.auto_pause_after_n_fails > 0}
                      aria-label="Pause after repeated failures"
                      onClick={() =>
                        set("auto_pause_after_n_fails", form.auto_pause_after_n_fails > 0 ? 0 : pauseN)
                      }
                    />
                  </div>
                  {/* no field on the bot for this yet: BACKEND_API_REQUESTS §1.22 */}
                  <div className="fx-sw">
                    <div className="tx">
                      <b>Tell me when review has new suggestions</b>
                      <span>Weekly, once there&rsquo;s enough history to say something useful.</span>
                    </div>
                    <span className="fx-preview">
                      <i>◔</i> Needs a review-alerts field on the bot API (§1.22)
                    </span>
                  </div>
                </section>

                <div>
                  <div className="fx-actions">
                    <button
                      className="fx-cta ghost2"
                      type="button"
                      disabled={!dirty || busy === "save"}
                      onClick={() => setConfirmDiscard(true)}
                    >
                      Discard changes
                    </button>
                    <button
                      className="fx-cta main2"
                      type="button"
                      disabled={busy === "save" || !dirty}
                      onClick={save}
                    >
                      {busy === "save" ? "Saving…" : "Save settings"}
                    </button>
                  </div>
                </div>

                {/* pause or remove */}
                <div className="fx-danger">
                  <div className="dtx">
                    <b>Pause or remove this bot</b>
                    <p>
                      Pausing stops new decisions immediately. Open positions keep the stops already
                      placed on them and close normally — pausing never leaves a trade unmanaged.
                    </p>
                    <div className="fx-inuse">
                      <i>ⓘ</i>
                      <p>
                        {linkedTrades.length === 0 ? (
                          <>
                            This bot isn&rsquo;t assigned to any trade, so removing it doesn&rsquo;t
                            affect anything that&rsquo;s running.
                          </>
                        ) : (
                          <>
                            This bot currently runs{" "}
                            <b>
                              {linkedTrades.length} trade{linkedTrades.length === 1 ? "" : "s"}
                            </b>
                            . Removing it leaves {linkedTrades.length === 1 ? "it" : "them"} without
                            a decider; {linkedTrades.length === 1 ? "it" : "they"}&rsquo;ll pause
                            until you assign another bot or CandleAI.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="fx-dacts">
                      <button
                        type="button"
                        className="fx-cta ghost2"
                        disabled={busy === "run"}
                        onClick={() => (bot.status === "ACTIVE" ? setConfirmPause(true) : toggleRun())}
                      >
                        {busy === "run"
                          ? "Working…"
                          : bot.status === "ACTIVE"
                            ? "Pause bot"
                            : "Resume bot"}
                      </button>
                      <button
                        type="button"
                        className="fx-dbtn"
                        disabled={busy === "delete"}
                        onClick={() => setConfirmDelete(true)}
                      >
                        Remove bot
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <aside className="fx-side2">
                <div className="fx-unlock">
                  <h4>Before you change the prompt</h4>
                  <p className="us">Two things worth knowing.</p>
                  <div className="fx-ul got3">
                    <i>✓</i>
                    <div>
                      <b>History is kept</b>
                      <span>Past records never change</span>
                    </div>
                  </div>
                  <div className="fx-ul">
                    <i>2</i>
                    <div>
                      <b>Your developer key stays the same</b>
                      <span>It never changes unless you reset it</span>
                    </div>
                  </div>
                  <p className="fx-tip2">
                    <b>Tip.</b> If you&rsquo;re applying a review suggestion, note it in the version
                    field — you&rsquo;ll want to know which change caused what.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* regenerate-key confirm */}
        <Dialog
          open={confirmKey}
          onClose={() => setConfirmKey(false)}
          tone="amber"
          labelledBy="key-warn-title"
          icon={<WarnIcon />}
          title={<span id="key-warn-title">Regenerate the developer key?</span>}
          subtitle="The current key stops working the moment you do"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmKey(false)}>
                Keep current key
              </button>
              <button
                className="fx-cta dgr2"
                type="button"
                disabled={busy === "key"}
                onClick={regenerate}
              >
                {busy === "key" ? "Working…" : "Regenerate key"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The old key stops working the moment you do this, on <b>every</b> trade this bot
            decides for — one key serves them all. Every n8n workflow, Make scenario or script
            that calls Candleweb for this bot will need the new key pasted in; until then those
            calls are refused and the bot shows as not responding. The trade URLs themselves do not
            change.
          </p>
        </Dialog>

        {/* new key — shown once */}
        <Dialog
          open={!!newKey}
          onClose={() => setNewKey(null)}
          labelledBy="newkey-title"
          icon={<RefreshIcon />}
          title={<span id="newkey-title">New developer key</span>}
          subtitle="Paste it into your bot before it is next called"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={copyKey}>
                {copied ? "Copied ✓" : "Copy key"}
              </button>
              <button className="fx-cta main2" type="button" onClick={() => setNewKey(null)}>
                Done
              </button>
            </>
          }
        >
          <div className="fx-key" style={{ marginTop: 0 }}>
            <code>{newKey}</code>
          </div>
          <p className="fx-dwarn">
            Update every workflow that calls Candleweb for this bot with this value in the{" "}
            <code>X-Candleweb-Key</code> header.
          </p>
        </Dialog>

        {/* pause confirm */}
        <Dialog
          open={confirmPause}
          onClose={() => setConfirmPause(false)}
          tone="amber"
          labelledBy="pause-bot-title"
          icon={<WarnIcon />}
          title={<span id="pause-bot-title">Pause {bot?.name}?</span>}
          subtitle="New decisions stop immediately"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmPause(false)}>
                Leave it running
              </button>
              <button
                className="fx-cta main2"
                type="button"
                disabled={busy === "run"}
                onClick={toggleRun}
              >
                {busy === "run" ? "Pausing…" : "Pause bot"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The bot stops answering candles from now on. Open positions keep the stops already placed
            on them and close normally. You can resume it whenever you like — pausing doesn&rsquo;t
            close anything.
          </p>
        </Dialog>

        {/* discard confirm */}
        <Dialog
          open={confirmDiscard}
          onClose={() => setConfirmDiscard(false)}
          tone="amber"
          labelledBy="discard-title"
          icon={<WarnIcon />}
          title={<span id="discard-title">Discard your changes?</span>}
          subtitle="Nothing has been saved yet"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmDiscard(false)}>
                Keep editing
              </button>
              <button className="fx-cta main2" type="button" onClick={discard}>
                Discard
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The form goes back to the settings the bot is running on right now. Anything you edited
            on this page is lost.
          </p>
        </Dialog>

        {/* delete confirm */}
        <Dialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          tone="amber"
          labelledBy="del-bot-title"
          icon={<TrashIcon />}
          title={<span id="del-bot-title">Remove {bot?.name}?</span>}
          subtitle="This cannot be undone"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmDelete(false)}>
                Keep the bot
              </button>
              <button
                className="fx-cta dgr2"
                type="button"
                disabled={busy === "delete"}
                onClick={doDelete}
              >
                {busy === "delete" ? "Removing…" : "Remove bot"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The bot and its prompt are deleted for good. Trades it decides for pause until you assign
            another decider.
          </p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default BotSettingsPage;
