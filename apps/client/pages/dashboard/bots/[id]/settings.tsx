import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import { error } from "../../../../components/alert/Toast";
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
  const { bots } = useSelector((state: RootState) => state.tradingV2);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && !Number.isNaN(id);

  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);

  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState<null | "save" | "key" | "delete">(null);
  const [confirmKey, setConfirmKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const loadedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
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
    } finally {
      setBusy(null);
    }
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

  const copyText = (v: string | null | undefined) => {
    if (v && navigator.clipboard) navigator.clipboard.writeText(v);
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
                <b>Not responding.</b> {bot.consecutive_fail_count} failed calls in a row — no
                orders are being placed for any trade this bot decides. Fix the webhook, then
                resume.
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
                      Webhook URL
                    </label>
                    <div className="fx-inp">
                      <input
                        id="hk"
                        type="url"
                        value={form.webhook_url}
                        onChange={(e) => set("webhook_url", e.target.value)}
                      />
                    </div>
                    {/* last-call time and reply average need the bot health endpoint
                        (DASHBOARD_ENDPOINTS §1.6) — shown as — until it exists */}
                    <p className="fx-hint">
                      Last successful call — · average reply —
                      {bot.consecutive_fail_count > 0 &&
                        ` · ${bot.consecutive_fail_count} failed call${bot.consecutive_fail_count === 1 ? "" : "s"} in a row`}
                    </p>
                  </div>

                  {/* developer key */}
                  <div style={{ marginTop: "18px" }}>
                    <span className="fx-fl">Developer key</span>
                    <div className="fx-key">
                      <code>{bot.dev_key || "•••••••••••••••• — shown only on create / regenerate"}</code>
                      <button
                        type="button"
                        className="fx-mini"
                        disabled={!bot.dev_key}
                        title={bot.dev_key ? undefined : "The full key is only shown on create / regenerate"}
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
                    <h3>Prompt &amp; logic</h3>
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
                </section>

                {/* 04 alerts */}
                <section className="fx-fsec">
                  <div className="fx-fh">
                    <span className="fx-fn">04</span>
                    <h3>Alerts</h3>
                  </div>
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
                  <div className="fx-fr" style={{ marginTop: "8px" }}>
                    <div>
                      <label className="fx-fl" htmlFor="ap">
                        Pause the bot after this many failures in a row
                      </label>
                      <div className="fx-inp" style={{ maxWidth: "160px" }}>
                        <input
                          id="ap"
                          type="number"
                          min={0}
                          value={form.auto_pause_after_n_fails}
                          onChange={(e) =>
                            set(
                              "auto_pause_after_n_fails",
                              Math.max(0, parseInt(e.target.value, 10) || 0),
                            )
                          }
                        />
                      </div>
                      <p className="fx-hint">0 disables auto-pause.</p>
                    </div>
                  </div>
                </section>

                <section className="fx-fsec">
                  <div className="fx-actions">
                    <Link className="fx-cta ghost2" href={`/dashboard/bots/${bot.id}`}>
                      Back to overview
                    </Link>
                    <button
                      className="fx-cta main2"
                      type="button"
                      disabled={busy === "save" || !dirty}
                      onClick={save}
                    >
                      {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}
                    </button>
                  </div>
                </section>

                {/* danger zone */}
                <div className="fx-danger">
                  <div className="dtx">
                    <b>Remove this bot</b>
                    <p>
                      The bot and its stored prompt are deleted. Any trade it decides for is left
                      without a decider and pauses — stops stay in place — until you assign another
                      bot or CandleAI.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="fx-dbtn"
                    disabled={busy === "delete"}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <TrashIcon /> Remove bot
                  </button>
                </div>
              </form>

              <aside className="fx-side2">
                <div className="fx-unlock">
                  <h4>Before you change the prompt</h4>
                  <p className="us">Three things worth knowing.</p>
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
                  <div className="fx-ul">
                    <i>3</i>
                    <div>
                      <b>Nothing applies until you save</b>
                      <span>Then from the next candle close</span>
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
            Every n8n workflow, Make scenario or script that calls Candleweb for this bot will need
            the new key pasted in. Until then, those calls fail and the bot shows as not responding.
          </p>
        </Dialog>

        {/* new key — shown once */}
        <Dialog
          open={!!newKey}
          onClose={() => setNewKey(null)}
          labelledBy="newkey-title"
          icon={<RefreshIcon />}
          title={<span id="newkey-title">New developer key</span>}
          subtitle="Copy it now — it is shown once"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={copyKey}>
                Copy key
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
