import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../../redux/store";
import tradingV2Service, {
  RecommendationActionError,
} from "../../../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../../../utils/check_auth";
import DashboardShell from "../../../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../../../components/dashboard/focus/TopBar";
import Dialog from "../../../../../../components/dashboard/focus/Dialog";
import { CheckIcon, WarnIcon } from "../../../../../../components/dashboard/focus/icons";
import { error, success } from "../../../../../../components/alert/Toast";
import { writeClipboard } from "../../../../../../lib/hooks/useClipboard";
import { revalidate } from "../../../../../../redux/slices/revalidateSlice";
import {
  ACTION_ERROR_TITLE,
  allTradesGone,
  appliedLine,
  barRows,
  hasChange,
  impactTiles,
  isApplied,
  isDismissed,
  isStaleStateCode,
  recStamp,
  settingTargetLabel,
  settingValueLabel,
  severityMeta,
  sinceApplyingLine,
  touchesLive,
  tradeRows,
} from "../../../../../../lib/botRecommendationsV2";
import { BotReviewV2, RecommendationV2 } from "../../../../../../types/tradingV2";

/**
 * One recommendation from a finished bot review — built to
 * `candleweb-recommendation-focus.html`.
 *
 * Reached as My bots → a bot → Review → Recommendation 1 of 4, which is also
 * what the URL says: the recommendation is identified by its REVIEW and its
 * own id (`/bot-reviews/{reviewId}/recommendations/{rid}/`), and the bot is
 * in the path because the crumb and the "open settings" link both need it —
 * the recommendation payload carries `review_id` but no bot.
 *
 * Two calls, because the page needs two different things:
 *  - the recommendation itself, for everything in the left column;
 *  - its review, for `progress` ("3 of 6 applied") and for the denominator
 *    under "Trades affected" — neither is on the recommendation.
 *
 * ## What Apply actually does
 *
 * It depends on `change.kind`, and the difference matters:
 *
 *  - **`SETTING`** — Candleweb edits the trade itself, through the same
 *    checks as the Edit trade form. A change touching a LIVE trade is
 *    refused once with `CONFIRM_LIVE` and nothing is changed, so the dialog
 *    that follows is not a courtesy: it is the only way the call succeeds.
 *  - **`PROMPT`** — Candleweb cannot change the bot. The bot runs on n8n,
 *    Make, Zapier or the user's own code and Candleweb never sends it the
 *    prompt, so the user pastes the change themselves and "Mark as applied"
 *    only updates Candleweb's COPY. The three steps in the side panel say
 *    this in order, and the panel must not imply otherwise.
 *
 * ## What is NOT recomputed here
 *
 * Every percentage, average and cost is the review's own, over the decisions
 * it actually read. The five trade rows on screen are a sample of them, so
 * averaging those would put a different number next to the same label.
 */

/* The design lists five rows and then offers the rest, which keeps the block
   from pushing the apply panel off a laptop screen on a recommendation with
   forty decisions behind it. */
const TRADE_PREVIEW = 5;

/* The last sentence of this is load-bearing and the guide says to keep it: a
   recommendation is a pattern in past trades, and a rule that helped before
   can stop working when conditions change. */
const HOW_IT_WAS_WORKED_OUT =
  "Review reads every stored decision for this bot — the candles it saw, the reasoning it gave, " +
  "where the stop sat, and how the position closed — and compares outcomes across groups.";

const CTA_STYLE = { padding: "13px 18px", fontSize: "13.8px" } as const;

const RecommendationPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots } = useSelector((state: RootState) => state.tradingV2);

  const readId = (v: string | string[] | undefined) =>
    typeof v === "string" && /^\d+$/.test(v) ? parseInt(v, 10) : null;
  const botId = readId(router.query.id);
  const reviewId = readId(router.query.reviewId);
  const rid = readId(router.query.rid);
  const valid = botId != null && reviewId != null && rid != null;

  const bot = useMemo(() => bots.find((b) => b.id === botId) || null, [bots, botId]);

  const [rec, setRec] = useState<RecommendationV2 | null>(null);
  const [recFailed, setRecFailed] = useState<string | null>(null);
  const [review, setReview] = useState<BotReviewV2 | null>(null);

  /* Which action is in flight. One at a time: apply and dismiss contradict
     each other, and the server rate-limits them together (30 a minute). */
  const [busy, setBusy] = useState<"apply" | "dismiss" | "reopen" | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAllTrades, setShowAllTrades] = useState(false);

  /* The two dialogs Apply can demand before it will go through. */
  const [confirmLive, setConfirmLive] = useState<RecommendationActionError | null>(null);
  const [promptChanged, setPromptChanged] = useState<RecommendationActionError | null>(null);
  const [wholePrompt, setWholePrompt] = useState("");
  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState("");

  /* Keyed by recommendation, so stepping Previous/Next re-reads instead of
     leaving the last one on screen under the new id. */
  const loadedRef = useRef<string | null>(null);
  const reviewRef = useRef<number | null>(null);

  const loadRecommendation = useCallback(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    setRecFailed(null);
    tradingV2Service
      .getRecommendation(axiosToken, reviewId as number, rid as number)
      .then(setRec)
      .catch((e: Error) => {
        setRec(null);
        setRecFailed(e.message || "This recommendation couldn't be read.");
      });
  }, [axiosToken, valid, reviewId, rid]);

  useEffect(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    const key = `${reviewId}:${rid}`;
    if (loadedRef.current === key) return;
    loadedRef.current = key;
    /* Anything the user had half-done belongs to the previous recommendation. */
    setRec(null);
    setShowAllTrades(false);
    setCopied(false);
    setDismissReason("");
    loadRecommendation();
  }, [valid, reviewId, rid, axiosToken, loadRecommendation]);

  /* The review is per-review, not per-recommendation, so stepping through the
     four does not re-read it. */
  useEffect(() => {
    if (reviewId == null || !isAuthorizationHeaderSet(axiosToken)) return;
    if (reviewRef.current === reviewId) return;
    reviewRef.current = reviewId;
    tradingV2Service
      .getBotReview(axiosToken, reviewId)
      .then(setReview)
      .catch(() => setReview(null));
  }, [reviewId, axiosToken]);

  /* The bot, for the crumb and the settings link. Only when the list has not
     already been loaded by another page. */
  const botFetchedRef = useRef<number | null>(null);
  useEffect(() => {
    if (botId == null || bot || !isAuthorizationHeaderSet(axiosToken)) return;
    if (botFetchedRef.current === botId) return;
    botFetchedRef.current = botId;
    dispatch(tradingV2Service.getBot({ api: axiosToken, id: botId }));
  }, [botId, bot, axiosToken, dispatch]);

  /* ---------------------------------------------------------------- *
   * Reading it
   * ---------------------------------------------------------------- */

  const severity = severityMeta(rec);
  const tiles = impactTiles(rec, review);
  const bars = barRows(rec?.bars);
  const rows = tradeRows(rec?.trades);
  const change = rec?.change ?? null;
  const isPrompt = change?.kind === "PROMPT";
  const isSetting = change?.kind === "SETTING";
  const applied = isApplied(rec);
  const dismissed = isDismissed(rec);
  const actionable = hasChange(rec) && !applied && !dismissed;
  const gone = allTradesGone(rec);
  const progress = review?.progress ?? null;
  const progressLine = appliedLine(progress);
  const sinceLine = sinceApplyingLine(progress);

  /* "Showing 5 of 14". The total is what the review says it looked at, which
     can be more than the rows it sent back — so the caption counts the rows
     on screen against that figure rather than against the array length, and
     "see the rest" only appears when there are more rows actually in hand. */
  const totalTrades = rec?.impact?.trades_affected ?? rows.length;
  const shownRows = showAllTrades ? rows : rows.slice(0, TRADE_PREVIEW);
  const moreInHand = rows.length > shownRows.length;

  const sampleSize = review?.closed_trades ?? review?.decisions_on_prompt ?? null;

  /* ---------------------------------------------------------------- *
   * Acting on it
   * ---------------------------------------------------------------- */

  const copyReplacement = async (then?: () => void) => {
    const text = change?.replace?.trim();
    if (!text) return;
    if (await writeClipboard(text)) {
      setCopied(true);
      success("New text copied — paste it into your bot's prompt.");
      then?.();
    } else {
      error("Couldn't copy — select the text by hand");
    }
  };

  /* Applying can change a trade's settings, and a prompt apply restarts the
     bot's review counter. Both are shown elsewhere in the dashboard, so both
     are marked stale rather than left to their own next poll. */
  const afterApply = (updated: RecommendationV2) => {
    setRec(updated);
    const keys: Parameters<typeof revalidate>[0] = ["reviewReadiness"];
    if (updated.change?.kind === "SETTING") keys.push("trades");
    dispatch(revalidate(keys));
  };

  const onActionError = (e: RecommendationActionError) => {
    /* Acted on already — in another tab, most likely. The state the server
       has is the true one, so re-read rather than argue with it. */
    if (isStaleStateCode(e.code)) {
      loadRecommendation();
      error(e.message);
      return;
    }
    if (e.code === "CONFIRM_LIVE") {
      setConfirmLive(e);
      return;
    }
    if (e.code === "PROMPT_CHANGED") {
      /* Pre-fill with Candleweb's copy so the user edits rather than types it
         from nothing; it is their bot's prompt that is authoritative, and the
         dialog says so. */
      setWholePrompt(bot?.prompt ?? "");
      setPromptChanged(e);
      return;
    }
    /* Rate limited: 30 apply / dismiss / reopen calls a minute, and NOTHING
       was changed — so the button stays enabled and this only asks them to
       wait rather than reporting a failure they have to undo. */
    if (e.httpStatus === 429) {
      error("Too many changes at once — try again in a moment.");
      return;
    }
    const title = e.code ? ACTION_ERROR_TITLE[e.code] : undefined;
    error(title ? `${title} — ${e.message}` : e.message);
  };

  const doApply = async (body: { confirm?: boolean; prompt?: string } = {}) => {
    if (!valid) return;
    setBusy("apply");
    try {
      const updated = await tradingV2Service.applyRecommendation(
        axiosToken,
        reviewId as number,
        rid as number,
        body,
      );
      afterApply(updated);
      setConfirmLive(null);
      setPromptChanged(null);
      success(
        updated.change?.kind === "SETTING"
          ? "Applied — your trade has been updated."
          : "Marked as applied. Candleweb's copy of the prompt now matches.",
      );
    } catch (e: any) {
      onActionError(e as RecommendationActionError);
    } finally {
      setBusy(null);
    }
  };

  const doDismiss = async () => {
    if (!valid) return;
    setBusy("dismiss");
    try {
      const updated = await tradingV2Service.dismissRecommendation(
        axiosToken,
        reviewId as number,
        rid as number,
        dismissReason,
      );
      setRec(updated);
      setDismissOpen(false);
      setDismissReason("");
      success("Dismissed. Review won't raise this again.");
    } catch (e: any) {
      onActionError(e as RecommendationActionError);
    } finally {
      setBusy(null);
    }
  };

  const doReopen = async () => {
    if (!valid) return;
    setBusy("reopen");
    try {
      const updated = await tradingV2Service.reopenRecommendation(
        axiosToken,
        reviewId as number,
        rid as number,
      );
      setRec(updated);
      success("Reopened.");
    } catch (e: any) {
      onActionError(e as RecommendationActionError);
    } finally {
      setBusy(null);
    }
  };

  const goTo = (target: number | null | undefined) => {
    if (target == null) return;
    router.push(`/dashboard/bots/${botId}/review/${reviewId}/${target}`);
  };

  const title = rec?.title?.trim() || "Recommendation";
  const botName = bot?.name || review?.bot_name || "Bot";

  return (
    <>
      <Head>
        <title>{rec?.title ? `${title} | Candleweb` : "Recommendation | Candleweb"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          hideHeading
          title={title}
          crumb={
            <>
              <Link href="/dashboard/bots">‹ My bots</Link> /{" "}
              {/* Both of these need the bot id, and a malformed URL is exactly
                  when it is missing — a crumb linking to /bots/null/review
                  would be the one thing on the page offering to make it
                  worse, so the names go in as plain text instead. */}
              {botId == null ? (
                <>
                  {botName} / Review
                </>
              ) : (
                <>
                  <Link href={`/dashboard/bots/${botId}`}>{botName}</Link> /{" "}
                  <Link href={`/dashboard/bots/${botId}/review`}>Review</Link>
                </>
              )}{" "}
              / Recommendation{rec?.position != null ? ` ${rec.position}` : ""}
            </>
          }
        />

        {!rec && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {!valid
              ? "Recommendation not found."
              : recFailed || "Loading this recommendation…"}
            {recFailed && (
              <>
                {" "}
                <button type="button" className="fx-mini" onClick={loadRecommendation}>
                  Try again
                </button>
              </>
            )}
          </p>
        )}

        {rec && (
          <>
            {/* ---- title block ---- */}
            <div className="rv d1" style={{ marginTop: "clamp(16px,2vw,24px)" }}>
              {severity && <span className={`fx-sev2 ${severity.cls}`}>{severity.label}</span>}
              <h1 className="fx-title" style={{ marginTop: "14px", maxWidth: "20ch" }}>
                {title}
              </h1>
              {rec.summary && (
                <p className="fx-sub3" style={{ maxWidth: "64ch" }}>
                  {rec.summary}
                </p>
              )}
            </div>

            {/* ---- the impact tiles ---- a tile whose figure could not be
                 worked out is absent, not zero: "Estimated cost $0.00" reads
                 as "this costs you nothing", which is the opposite of what a
                 missing figure means. */}
            {tiles.length > 0 && (
              <div className="fx-cost rv d2">
                {tiles.map((t) => (
                  <div className="fx-cst" key={t.key}>
                    <span>{t.label}</span>
                    <b className={t.tone}>{t.figure}</b>
                    <i>{t.caption}</i>
                  </div>
                ))}
              </div>
            )}

            <div className="fx-two2">
              <section data-rv>
                {/* ---- what to change ---- */}
                {change && (
                  <>
                    <div className="fx-sh">
                      <h2>What to change</h2>
                      {isPrompt && change.replace?.trim() && (
                        <button
                          type="button"
                          className="fx-link"
                          onClick={() => copyReplacement()}
                        >
                          {copied ? "Copied ✓" : "Copy new text →"}
                        </button>
                      )}
                    </div>

                    {/* A prompt change is a text diff. Either half can be
                        absent — a pure addition has nothing to remove, a pure
                        removal nothing to put in its place — so neither block
                        is drawn empty. */}
                    {isPrompt && (
                      <div className="fx-diff2">
                        {change.remove?.trim() && (
                          <div className="fx-dl2 old2">
                            <span className="fx-dtag">Remove</span>- {change.remove.trim()}
                          </div>
                        )}
                        {change.replace?.trim() && (
                          <div className="fx-dl2 new2">
                            <span className="fx-dtag">Replace with</span>+ {change.replace.trim()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* A setting change is a before → after per trade, not a
                        diff. `current` is read now, so it is right even if the
                        user changed it after the review ran. */}
                    {isSetting && (
                      <div style={{ marginTop: "8px" }}>
                        {(change.trades ?? []).map((t, i) => (
                          <div className="fx-riskline" key={t.trade_id ?? `t-${i}`}>
                            <span>
                              {settingTargetLabel(t.target ?? change.target)} ·{" "}
                              {t.trade_name || `Trade #${t.trade_id}`}
                              {/* `live7` is the dashboard's amber "live mode"
                                  badge. Deliberately not `fail4`, which is
                                  the rose, pulsing style for a bot that is
                                  FAILING — a live trade is not a fault. */}
                              {t.mode === "LIVE" && (
                                <>
                                  {" "}
                                  <em className="fx-run2 live7" style={{ fontStyle: "normal" }}>
                                    Live
                                  </em>
                                </>
                              )}
                            </span>
                            {t.exists === false ? (
                              <b className="mut2">Trade deleted</b>
                            ) : (
                              <b>
                                {settingValueLabel(t.current)} →{" "}
                                <span className="tealb">
                                  {settingValueLabel(t.suggested ?? change.suggested)}
                                </span>
                              </b>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {change.applies_to && (
                      <p className="fx-hint" style={{ marginTop: "12px" }}>
                        {change.applies_to}
                      </p>
                    )}

                    {/* Only prompt changes restart the counter, and the
                        backend says which do — a setting change showing this
                        note would be a warning about something that is not
                        going to happen. */}
                    {change.restarts_review_count && (
                      <p className="fx-hint" style={{ marginTop: "12px" }}>
                        Applying this restarts the review counter for this bot. That&rsquo;s
                        deliberate &mdash; results before and after a change have to stay
                        separate.
                      </p>
                    )}
                  </>
                )}

                {/* ---- the evidence ---- */}
                {(rec.evidence || bars.length > 0) && (
                  <div style={{ marginTop: "28px" }}>
                    <div className="fx-sh">
                      <h2>The evidence</h2>
                    </div>
                    <div className="fx-evid">
                      {rec.evidence && <p>{rec.evidence}</p>}
                      {bars.length > 0 && (
                        <div className="fx-bars">
                          {bars.map((b) => (
                            <div className="fx-cmp2" key={b.label}>
                              <span>{b.label}</span>
                              <div className="bar3">
                                <i className={b.tone} style={{ width: `${b.width}%` }} />
                              </div>
                              <b className={b.value != null && b.value < 0 ? "dn5" : "up5"}>
                                {b.figure}
                              </b>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---- the trades behind it ---- */}
                {rows.length > 0 && (
                  <div style={{ marginTop: "28px" }}>
                    <div className="fx-sh">
                      <h2>
                        The {totalTrades.toLocaleString()} trade{totalTrades === 1 ? "" : "s"}
                      </h2>
                      {/* `GET history/` filters by bot, trade, pair and exit
                          reason — not by decision id — so this opens History
                          rather than claiming a filter it cannot apply. */}
                      <Link className="fx-link" href="/dashboard/history">
                        Open in history →
                      </Link>
                    </div>
                    <div className="fx-tradelist">
                      {shownRows.map((r) => (
                        <div className="fx-tl2" key={r.key}>
                          <span className="d5">{r.date}</span>
                          <span className="p5">{r.pair}</span>
                          <span className="r5">{r.rationale}</span>
                          <span className={`v5 ${r.tone}`}>
                            {r.figure}
                            {r.alternative && <small>{r.alternative}</small>}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="fx-hint" style={{ marginTop: "14px" }}>
                      Showing {shownRows.length.toLocaleString()} of{" "}
                      {totalTrades.toLocaleString()}
                      {moreInHand && (
                        <>
                          {" · "}
                          <button
                            type="button"
                            className="fx-link"
                            onClick={() => setShowAllTrades(true)}
                          >
                            see the rest
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* ---- previous / next ---- disabled rather than hidden at
                     either end, so the pair keeps its place and "1 of 4" does
                     not move as you step through. */}
                <div className="fx-recnav">
                  <button
                    type="button"
                    className="fx-mini"
                    disabled={rec.previous_id == null}
                    onClick={() => goTo(rec.previous_id)}
                  >
                    ‹ Previous
                  </button>
                  <span>
                    {rec.position != null && rec.of != null
                      ? `Recommendation ${rec.position} of ${rec.of}`
                      : "This recommendation"}
                  </span>
                  <button
                    type="button"
                    className="fx-mini"
                    disabled={rec.next_id == null}
                    onClick={() => goTo(rec.next_id)}
                  >
                    Next ›
                  </button>
                </div>
              </section>

              <aside className="fx-side2" data-rv>
                {/* ---- apply ---- */}
                {actionable && (
                  <div className="fx-unlock">
                    <h4>Apply this?</h4>

                    {isPrompt ? (
                      <>
                        {/* Candleweb never edits the prompt: the bot runs on
                            the user's own platform and Candleweb never sends
                            it one. The three steps are the actual division of
                            labour, not a formality. */}
                        <p className="us">Candleweb never edits your prompt. You do.</p>
                        <div className={`fx-ul ${copied ? "got3" : ""}`}>
                          <i>{copied ? "✓" : "1"}</i>
                          <div>
                            <b>Copy the new line</b>
                            <span>One click, ready to paste</span>
                          </div>
                        </div>
                        <div className="fx-ul">
                          <i>2</i>
                          <div>
                            <b>Paste into your prompt</b>
                            <span>In bot settings, or in n8n</span>
                          </div>
                        </div>
                        <div className="fx-ul">
                          <i>3</i>
                          <div>
                            <b>Mark it applied</b>
                            <span>So review can measure the change</span>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "9px",
                            marginTop: "18px",
                          }}
                        >
                          <button
                            type="button"
                            className="fx-cta main2"
                            style={CTA_STYLE}
                            onClick={() =>
                              copyReplacement(() =>
                                router.push(`/dashboard/bots/${botId}/settings`),
                              )
                            }
                          >
                            Copy and open settings →
                          </button>
                          <button
                            type="button"
                            className="fx-cta ghost2"
                            style={CTA_STYLE}
                            disabled={busy === "apply"}
                            onClick={() => doApply()}
                          >
                            {busy === "apply" ? "Marking…" : "Mark as applied"}
                          </button>
                          <button
                            type="button"
                            className="fx-cta ghost2"
                            style={CTA_STYLE}
                            onClick={() => setDismissOpen(true)}
                          >
                            Dismiss &mdash; I disagree
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* A setting change Candleweb can make itself, so this
                            is one button — and every trade is changed or none
                            is. */}
                        <p className="us">
                          {gone
                            ? "The trade this would change no longer exists."
                            : "Candleweb changes the trade for you. Every trade it names, or none."}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "9px",
                            marginTop: "4px",
                          }}
                        >
                          {!gone && (
                            <button
                              type="button"
                              className={`fx-cta ${touchesLive(rec) ? "live6" : "main2"}`}
                              style={CTA_STYLE}
                              disabled={busy === "apply"}
                              onClick={() => doApply()}
                            >
                              {busy === "apply"
                                ? "Applying…"
                                : (change?.trades ?? []).length > 1
                                  ? "Apply to my trades"
                                  : "Apply to my trade"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="fx-cta ghost2"
                            style={CTA_STYLE}
                            onClick={() => setDismissOpen(true)}
                          >
                            Dismiss &mdash; I disagree
                          </button>
                        </div>
                      </>
                    )}

                    <p className="fx-tip2">
                      <b style={{ color: "var(--fx-t2)" }}>Disagreeing is fine.</b> Dismissing
                      tells review not to raise it again, and we&rsquo;d rather know than keep
                      suggesting something you&rsquo;ve considered.
                    </p>
                  </div>
                )}

                {/* ---- already applied ---- no undo: the change was actually
                     made. Reversing a setting means editing the trade, which
                     is where that is said. */}
                {applied && (
                  <div className="fx-unlock">
                    <h4>Applied</h4>
                    <p className="us">
                      {rec.applied_at ? `You applied this on ${recStamp(rec.applied_at)}.` : ""}{" "}
                      {rec.applied_change?.copy_updated === false
                        ? "Candleweb's copy of the prompt already contained it."
                        : isPrompt
                          ? "Candleweb's copy of the prompt was updated to match."
                          : ""}
                    </p>
                    {(rec.applied_change?.trades ?? []).map((t, i) => (
                      <div className="fx-riskline" key={t.trade_id ?? `a-${i}`}>
                        <span>{t.trade_name || `Trade #${t.trade_id}`}</span>
                        <b>
                          {settingValueLabel(t.before)} →{" "}
                          <span className="tealb">{settingValueLabel(t.after)}</span>
                        </b>
                      </div>
                    ))}
                    <p className="fx-tip2">
                      This one can&rsquo;t be undone here, because its change was made. To
                      reverse a setting,{" "}
                      <Link className="fx-link" href="/dashboard/trades">
                        edit the trade
                      </Link>
                      .
                    </p>
                  </div>
                )}

                {/* ---- dismissed ---- reopening is offered, because changing
                     one's mind is the normal case. */}
                {dismissed && (
                  <div className="fx-unlock">
                    <h4>Dismissed</h4>
                    <p className="us">
                      {rec.dismissed_at
                        ? `You dismissed this on ${recStamp(rec.dismissed_at)}.`
                        : "You dismissed this."}{" "}
                      Review won&rsquo;t raise it again.
                    </p>
                    {rec.dismiss_reason && (
                      <div className="fx-eg2" style={{ marginTop: 0 }}>
                        {rec.dismiss_reason}
                      </div>
                    )}
                    <div style={{ marginTop: "16px" }}>
                      <button
                        type="button"
                        className="fx-cta ghost2"
                        style={CTA_STYLE}
                        disabled={busy === "reopen"}
                        onClick={doReopen}
                      >
                        {busy === "reopen" ? "Undoing…" : "Undo — reopen it"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- nothing to apply ---- some recommendations are an
                     observation with no edit attached. Keyed off `hasChange`
                     and not merely `change == null`: a change object that is
                     present but empty — a prompt diff with neither half, a
                     setting change naming no trade — is just as unactionable,
                     and testing only for null left the panel blank in exactly
                     those cases. */}
                {!hasChange(rec) && !applied && !dismissed && (
                  <div className="fx-unlock">
                    <h4>Nothing to apply</h4>
                    <p className="us" style={{ marginBottom: 0 }}>
                      This one has no change attached — it&rsquo;s an observation about how the
                      bot has been trading, for you to weigh.
                    </p>
                  </div>
                )}

                {/* ---- progress ---- */}
                {progressLine && (
                  <div className={`fx-applied ${progress?.applied ? "" : "off8"}`}>
                    <i>✓</i>
                    <div>
                      <b>{progressLine}</b>
                      {/* Only when each side of the comparison has enough
                          closed positions — the backend decides that, and
                          below it the figure is noise and its `note` says
                          what is missing instead. */}
                      {sinceLine && <span>{sinceLine}</span>}
                    </div>
                  </div>
                )}

                {/* ---- how this was worked out ---- */}
                <div
                  className="fx-unlock"
                  style={{
                    marginTop: "14px",
                    borderColor: "var(--fx-line)",
                    /* The design hard-codes rgba(255,255,255,.018), which is
                       invisible on the light theme; `--w018` is that exact
                       value and flips with the theme. */
                    background: "var(--w018)",
                  }}
                >
                  <h4>How this was worked out</h4>
                  <p className="us" style={{ marginBottom: 0 }}>
                    {HOW_IT_WAS_WORKED_OUT} It&rsquo;s a pattern in{" "}
                    {sampleSize != null ? `${sampleSize.toLocaleString()} ` : ""}past trades, not a
                    forecast. A rule that helped here can stop working when conditions change.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* ---- CONFIRM_LIVE ---- the first apply was refused and changed
             NOTHING, so this is the call, not a courtesy. It names the trades
             because "this changes a live trade" without saying which is not
             something anyone can agree to. */}
        <Dialog
          open={!!confirmLive}
          onClose={() => setConfirmLive(null)}
          tone="amber"
          labelledBy="confirm-live-title"
          icon={<WarnIcon />}
          title={<span id="confirm-live-title">Change a live trade?</span>}
          subtitle="This one places real orders"
          footer={
            <>
              <button
                className="fx-cta ghost2"
                type="button"
                onClick={() => setConfirmLive(null)}
              >
                Cancel
              </button>
              <button
                className="fx-cta live6"
                type="button"
                disabled={busy === "apply"}
                onClick={() => doApply({ confirm: true })}
              >
                {busy === "apply" ? "Applying…" : "Yes, apply it"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">{confirmLive?.message}</p>
          {(confirmLive?.changes ?? []).map((c, i) => (
            <div className="fx-riskline" key={c.trade_id ?? `c-${i}`}>
              <span>
                {settingTargetLabel(c.target)} · {c.trade_name || `Trade #${c.trade_id}`}
                {c.mode === "LIVE" ? " (Live)" : ""}
              </span>
              <b>
                {settingValueLabel(c.before)} →{" "}
                <span className="tealb">{settingValueLabel(c.after)}</span>
              </b>
            </div>
          ))}
        </Dialog>

        {/* ---- PROMPT_CHANGED ---- Candleweb's copy no longer contains the
             line to remove, so it cannot make the edit blind. The bot's own
             prompt is the authority, which is why this asks for the whole
             thing rather than trying to patch what it has. */}
        <Dialog
          open={!!promptChanged}
          onClose={() => setPromptChanged(null)}
          tone="amber"
          labelledBy="prompt-changed-title"
          icon={<WarnIcon />}
          title={<span id="prompt-changed-title">Paste your bot&rsquo;s prompt</span>}
          subtitle="Candleweb's copy is out of date"
          footer={
            <>
              <button
                className="fx-cta ghost2"
                type="button"
                onClick={() => setPromptChanged(null)}
              >
                Cancel
              </button>
              <button
                className="fx-cta main2"
                type="button"
                disabled={busy === "apply" || !wholePrompt.trim()}
                onClick={() => doApply({ prompt: wholePrompt })}
              >
                {busy === "apply" ? "Marking…" : "Mark as applied"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">{promptChanged?.message}</p>
          <label className="fx-fl" htmlFor="whole-prompt" style={{ marginTop: "14px" }}>
            Your bot&rsquo;s prompt as it stands now
          </label>
          <textarea
            id="whole-prompt"
            className="fx-ta"
            value={wholePrompt}
            onChange={(e) => setWholePrompt(e.target.value)}
            placeholder="Paste the whole prompt your bot is running on."
          />
          <p className="fx-hint">
            Candleweb makes the change to this text and stores the result as its copy. Your bot is
            not touched either way.
          </p>
        </Dialog>

        {/* ---- dismiss ---- the reason is optional and goes to the reviewer
             with the bot's next review, which is the whole reason to ask for
             it rather than just recording a no. */}
        <Dialog
          open={dismissOpen}
          onClose={() => setDismissOpen(false)}
          labelledBy="dismiss-title"
          icon={<CheckIcon />}
          title={<span id="dismiss-title">Dismiss this recommendation?</span>}
          subtitle="Review won't raise it again"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setDismissOpen(false)}>
                Keep it
              </button>
              <button
                className="fx-cta main2"
                type="button"
                disabled={busy === "dismiss"}
                onClick={doDismiss}
              >
                {busy === "dismiss" ? "Dismissing…" : "Dismiss it"}
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            We&rsquo;d rather know than keep suggesting something you&rsquo;ve considered. If you
            say why, the reviewer reads it with this bot&rsquo;s next review &mdash; so it can take
            your reasoning into account instead of raising the same point again.
          </p>
          <label className="fx-fl" htmlFor="dismiss-reason" style={{ marginTop: "14px" }}>
            Why, if you&rsquo;d like to say <em>— optional</em>
          </label>
          <textarea
            id="dismiss-reason"
            className="fx-ta"
            style={{ minHeight: "96px" }}
            maxLength={500}
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="e.g. I close early on purpose — I'd rather bank small wins."
          />
          <p className="fx-hint">{500 - dismissReason.length} characters left</p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default RecommendationPage;
