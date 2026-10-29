import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service, {
  TradingV2ActionError,
} from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";
import { error, success } from "../../../../components/alert/Toast";
import { revalidate } from "../../../../redux/slices/revalidateSlice";
import {
  ACTION_ERROR_TITLE,
  appliedLine,
  recStamp,
  severityMeta,
  sinceApplyingLine,
} from "../../../../lib/botRecommendationsV2";
import { metricNum, winRateLabel } from "../../../../lib/tradingV2Metrics";
import {
  BotReviewReadinessV2,
  BotReviewV2,
  RecommendationV2,
} from "../../../../types/tradingV2";

/**
 * A bot's reviews — `bots/{id}/review`.
 *
 * Candleweb sends its reviewing agent the bot's prompt and its trading record
 * on that prompt, and gets back a verdict, a summary and a list of
 * recommendations. This page runs one, watches it, and reads it back; each
 * recommendation opens on its own page.
 *
 * Four endpoints:
 *  - `GET  bots/{id}/review-readiness/` — can a review run, and what is
 *    missing if not. Triggers-only (§9): nothing moves it but a position
 *    closing or the prompt being edited.
 *  - `POST bots/{id}/reviews/` — run one. Spends a review, given back on
 *    failure, which is why nothing here ever retries on its own.
 *  - `GET  bots/{id}/reviews/` — the bot's reviews, newest first.
 *  - `GET  bot-reviews/{id}/` — one review in full, polled while it is still
 *    being written.
 *
 * ## The two things this page must not get wrong
 *
 * **A running review is not a finished one.** `recommendations` is empty and
 * `progress` is null until `status` is `COMPLETED`, so neither may be read as
 * "this review found nothing". The page shows a working state until the
 * status says otherwise.
 *
 * **The user has to know what gets sent before they send it.** The
 * disclosure below is kept in full, including the money figures, and shown
 * both before the first review and beside the button afterwards. Shortening
 * it to "your trading record" would be the one genuinely misleading edit
 * available here.
 */

/* Verbatim from the spec, and deliberately not trimmed: a user is about to
   send their prompt, their reasoning and their P&L to a model, and the list
   of what that includes is the point. */
const DISCLOSURE =
  "To review your bot, Candleweb sends its reviewing agent your bot's prompt and its " +
  "trading record on that prompt in the mode you're in (Demo or Live): every decision and " +
  "its reasoning, the market data it saw, and each trade's settings, allocation, entry and " +
  "exit prices, profit or loss and fees. It also sends what earlier reviews recommended and " +
  "what you did with each, including any reason you gave for dismissing one. Your exchange " +
  "keys, balances, email and other account details are never sent.";

/* The fallback bar, used only until `review-readiness` answers with the real
   one — the threshold is an entitlement and a plan can set its own. Same
   constant as the Overview, the bots list and the bot detail page. */
const REVIEW_AT = 20;

const VERDICT_META: Record<string, { label: string; cls: string }> = {
  GOOD: { label: "Good", cls: "live4" },
  NEEDS_CHANGES: { label: "Needs changes", cls: "warn4" },
  NOT_ENOUGH_DATA: { label: "Not enough data", cls: "pause4" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SENDING: { label: "Sending", cls: "warn4" },
  SENT: { label: "Reviewing", cls: "warn4" },
  COMPLETED: { label: "Complete", cls: "live4" },
  FAILED: { label: "Failed", cls: "fail4" },
};

/* The headings above each blocker's own message. An unrecognised code still
   renders with its message rather than being dropped. */
const BLOCKER_TITLE: Record<string, string> = {
  NO_PROMPT: "No prompt stored",
  TOO_FEW_CLOSED_TRADES: "Not enough closed trades",
  NO_REVIEWS_LEFT: "No reviews left",
};

/** A review still being written. `progress` and `recommendations` are not
 *  filled yet, so nothing may be concluded from their being empty. */
const isPending = (r: BotReviewV2 | null): boolean =>
  r?.status === "SENDING" || r?.status === "SENT";

const BotReviewPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots } = useSelector((state: RootState) => state.tradingV2);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && Number.isFinite(id);
  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);

  const [readiness, setReadiness] = useState<BotReviewReadinessV2 | null>(null);
  const [readinessAsked, setReadinessAsked] = useState(false);
  /* Every review this bot has had, newest first. The newest one is the one
     the page is "about"; the rest are the history list. */
  const [reviews, setReviews] = useState<BotReviewV2[] | null>(null);
  const [reviewsFailed, setReviewsFailed] = useState(false);
  /* The newest review in full — the list rows may be summaries. */
  const [current, setCurrent] = useState<BotReviewV2 | null>(null);
  const [launching, setLaunching] = useState(false);
  /* 503: reviews are switched off server-side. The one refusal where the
     button should disappear rather than explain itself. */
  const [reviewsOff, setReviewsOff] = useState(false);

  const botFetchedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!valid || bot || !isAuthorizationHeaderSet(axiosToken)) return;
    if (botFetchedRef.current === id) return;
    botFetchedRef.current = id;
    dispatch(tradingV2Service.getBot({ api: axiosToken, id: id as number }));
  }, [valid, id, bot, axiosToken, dispatch]);

  const loadReadiness = useCallback(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    tradingV2Service
      .getBotReviewReadiness(axiosToken, id as number)
      .then(setReadiness)
      .catch(() => setReadiness(null))
      .finally(() => setReadinessAsked(true));
  }, [axiosToken, id, valid]);

  const loadReviews = useCallback(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    setReviewsFailed(false);
    tradingV2Service
      .listBotReviews(axiosToken, id as number)
      .then((rows) => {
        setReviews(rows);
        /* The newest row is re-read in full: a list row need not carry
           `recommendations` or `progress`. */
        const newest = rows[0];
        if (!newest) {
          setCurrent(null);
          return;
        }
        tradingV2Service
          .getBotReview(axiosToken, newest.id)
          .then(setCurrent)
          .catch(() => setCurrent(newest));
      })
      .catch(() => {
        setReviews(null);
        setReviewsFailed(true);
      });
  }, [axiosToken, id, valid]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  /* ---- a review in flight ----
     Polled at the doc's 10–20s while SENDING or SENT, and stopped the moment
     it is not: a finished review cannot change again. */
  const currentId = current?.id ?? null;
  const pending = isPending(current);
  useEffect(() => {
    if (currentId == null || !pending || !isAuthorizationHeaderSet(axiosToken)) return;
    const tick = setInterval(() => {
      tradingV2Service
        .getBotReview(axiosToken, currentId)
        .then((r) => {
          setCurrent(r);
          if (r.status === "COMPLETED" || r.status === "FAILED") {
            /* A finished review has spent one and may have produced
               recommendations, so readiness and the history list are both
               stale, and so is every other surface that counts them. */
            loadReadiness();
            loadReviews();
            dispatch(revalidate(["reviewReadiness"]));
          }
        })
        .catch(() => {
          /* A dropped poll is not evidence the review failed, and saying so
             would be a lie the next tick corrects. */
        });
    }, 15000);
    return () => clearInterval(tick);
  }, [currentId, pending, axiosToken, loadReadiness, loadReviews, dispatch]);

  /* ---- reading it ---- */
  const reviewNeeded = readiness?.closed_trades_needed ?? REVIEW_AT;
  const closedOnPrompt = readiness?.closed_trades_on_prompt ?? null;
  const reviewsLeft = readiness?.reviews_available ?? null;
  const blockers = readiness?.blockers ?? [];
  const canRun = readiness?.ready === true && !reviewsOff;
  const recommendations: RecommendationV2[] = current?.recommendations ?? [];
  const counts = current?.recommendation_counts ?? null;
  const progressLine = appliedLine(current?.progress);
  const sinceLine = sinceApplyingLine(current?.progress);
  /* Reviews finished before recommendations existed carry the old shape
     instead, and still have something to show. */
  const legacy =
    current?.status === "COMPLETED" && recommendations.length === 0
      ? current?.recommendation ?? null
      : null;
  const past = (reviews ?? []).filter((r) => r.id !== currentId);
  const botName = bot?.name || current?.bot_name || "Bot";

  const launch = async () => {
    if (!valid) return;
    setLaunching(true);
    try {
      const { review, alreadyRunning } = await tradingV2Service.startBotReview(
        axiosToken,
        id as number,
      );
      setCurrent(review);
      loadReadiness();
      loadReviews();
      success(
        alreadyRunning
          ? "A review of this bot is already running."
          : "Review started — this takes a minute or two.",
      );
    } catch (e: any) {
      const err = e as TradingV2ActionError;
      if (err.httpStatus === 503) {
        setReviewsOff(true);
        error(err.message || "Bot review is switched off at the moment.");
      } else if (err.code === "NOT_READY") {
        /* The page disagreed with the server. The server is right, so re-read
           rather than leave a button offering something it will refuse. */
        loadReadiness();
        error(err.blockers?.[0]?.message || err.message);
      } else {
        const title = err.code ? ACTION_ERROR_TITLE[err.code] : undefined;
        error(title ? `${title} — ${err.message}` : err.message);
      }
    } finally {
      setLaunching(false);
    }
  };

  const verdict = current?.verdict ? VERDICT_META[current.verdict] : null;
  const statusMeta = current?.status ? STATUS_META[current.status] : null;

  return (
    <>
      <Head>
        <title>{bot ? `${bot.name} · review` : "Bot review"} | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          crumb={
            <>
              <Link href="/dashboard/bots">‹ My bots</Link> /{" "}
              {valid ? <Link href={`/dashboard/bots/${id}`}>{botName}</Link> : botName} / Review
            </>
          }
          title={bot ? `${bot.name} · review` : "Bot review"}
          subtitle="Candleweb reads the prompt against what the bot actually did, and tells you which rule to change."
        />

        {!valid && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            Bot not found.
          </p>
        )}

        {valid && (
          <>
            {/* ---- the latest review ---- */}
            <section
              className="fx-mom rv d1"
              style={{ marginTop: "clamp(18px,2.4vw,26px)", paddingTop: "22px" }}
            >
              <div className="fx-sh">
                <h2>
                  Latest review{" "}
                  {current?.created_at && (
                    <span className="sub2">{recStamp(current.created_at)}</span>
                  )}
                </h2>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {current?.book && (
                    <span className="fx-st4 pause4">{current.book}</span>
                  )}
                  {statusMeta && (
                    <span className={`fx-st4 ${statusMeta.cls}`}>{statusMeta.label}</span>
                  )}
                  {verdict && <span className={`fx-st4 ${verdict.cls}`}>{verdict.label}</span>}
                </div>
              </div>

              {reviewsFailed && (
                <p className="fx-hint" style={{ marginTop: 0 }}>
                  This bot&rsquo;s reviews couldn&rsquo;t be read just now.{" "}
                  <button type="button" className="fx-mini" onClick={loadReviews}>
                    Try again
                  </button>
                </p>
              )}

              {!reviewsFailed && reviews == null && (
                <p className="fx-hint" style={{ marginTop: 0 }}>
                  Reading this bot&rsquo;s reviews…
                </p>
              )}

              {/* Never reviewed. */}
              {!reviewsFailed && reviews != null && !current && (
                <div className="fx-flat2" style={{ marginTop: 0 }}>
                  <b>This bot hasn&rsquo;t been reviewed yet.</b> A review reads its closed
                  trades against the prompt that produced them and names the rule that is
                  costing money.
                </div>
              )}

              {/* Still being written: `recommendations` is empty and
                  `progress` is null, and neither means the review found
                  nothing. */}
              {isPending(current) && (
                <div className="fx-rv2" style={{ marginBottom: 0 }}>
                  <div className="rh2">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <b>
                      {current?.status === "SENDING"
                        ? "Sending to the reviewer…"
                        : "The reviewer is reading…"}
                    </b>
                  </div>
                  <p>
                    This usually takes a minute or two. The page updates itself — you can leave
                    it and come back.
                    {current?.decisions_on_prompt != null && (
                      <>
                        {" "}
                        Reading {current.decisions_on_prompt.toLocaleString()} decision
                        {current.decisions_on_prompt === 1 ? "" : "s"}
                        {current.closed_trades != null && (
                          <> and {current.closed_trades.toLocaleString()} closed trades</>
                        )}
                        .
                      </>
                    )}
                  </p>
                </div>
              )}

              {current?.status === "FAILED" && (
                <p className="fx-failmsg" style={{ marginTop: 0 }}>
                  <b>This review failed.</b>{" "}
                  {current.failure_reason || "The reviewer didn't finish."}{" "}
                  Your review was given back.
                </p>
              )}

              {/* Finished. The summary leads — it is the answer; the verdict
                  chip above only grades it. */}
              {current?.status === "COMPLETED" && (
                <>
                  {current.summary && (
                    <p className="fx-mnote" style={{ marginTop: 0, maxWidth: "76ch" }}>
                      {current.summary}
                    </p>
                  )}
                  {current.sample_note && (
                    <p className="fx-hint" style={{ marginTop: "10px" }}>
                      {current.sample_note}
                    </p>
                  )}

                  <div className="fx-cap2" style={{ marginTop: "20px" }}>
                    <div className="fx-cp">
                      <span>Recommendations</span>
                      <b className={counts?.total ? undefined : "mut2"}>
                        {counts?.total ?? recommendations.length}
                      </b>
                      <i>
                        {counts?.applied != null
                          ? `${counts.applied} applied`
                          : "from this review"}
                      </i>
                    </div>
                    <div className="fx-cp">
                      <span>Closed trades read</span>
                      <b className={current.closed_trades == null ? "mut2" : undefined}>
                        {current.closed_trades?.toLocaleString() ?? "—"}
                      </b>
                      <i>on this prompt</i>
                    </div>
                    <div className="fx-cp">
                      <span>Decisions read</span>
                      <b className={current.decisions_on_prompt == null ? "mut2" : undefined}>
                        {current.decisions_on_prompt?.toLocaleString() ?? "—"}
                      </b>
                      <i>every one on the prompt</i>
                    </div>
                    <div className="fx-cp">
                      <span>Still open</span>
                      <b className={counts?.open ? "amb3" : undefined}>{counts?.open ?? 0}</b>
                      <i>
                        {counts?.dismissed != null
                          ? `${counts.dismissed} dismissed`
                          : "not acted on yet"}
                      </i>
                    </div>
                  </div>

                  {progressLine && (
                    <div className={`fx-applied ${current.progress?.applied ? "" : "off8"}`}>
                      <i>✓</i>
                      <div>
                        <b>{progressLine}</b>
                        {/* Only when each side of the comparison has enough
                            closed positions — the backend decides that. */}
                        {sinceLine && <span>{sinceLine}</span>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ---- what it found ---- one row per recommendation, each
                 opening on its own page. */}
            {current?.status === "COMPLETED" && recommendations.length > 0 && (
              <section className="fx-sec rv d2">
                <div className="fx-sh">
                  <h2>
                    What it found{" "}
                    <span className="sub2">
                      {recommendations.length} recommendation
                      {recommendations.length === 1 ? "" : "s"}
                    </span>
                  </h2>
                </div>
                {recommendations.map((rec) => {
                  const sev = severityMeta(rec);
                  const acted = rec.status === "APPLIED" || rec.status === "DISMISSED";
                  return (
                    <Link
                      key={rec.id}
                      className={`fx-bcard ${acted ? "off5" : ""}`}
                      href={`/dashboard/bots/${id}/review/${current.id}/${rec.id}`}
                      style={{ display: "block" }}
                    >
                      <div className="fx-bl1">
                        <span className="nm4">{rec.title || "Recommendation"}</span>
                        {sev && <span className={`fx-sev2 ${sev.cls}`}>{sev.label}</span>}
                        {rec.status && rec.status !== "OPEN" && (
                          <span className="fx-st4 pause4">
                            {rec.status_label || rec.status.toLowerCase()}
                          </span>
                        )}
                        {rec.position != null && rec.of != null && (
                          <span className="fx-src">
                            {rec.position} of {rec.of}
                          </span>
                        )}
                      </div>
                      {rec.summary && (
                        <p className="fx-failmsg" style={{ marginTop: 0, color: "var(--fx-t2)" }}>
                          {rec.summary}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </section>
            )}

            {/* Reviews that predate recommendations keep the old shape, and
                still have a summary worth showing. */}
            {legacy && (legacy.summary || legacy.findings != null) && (
              <section className="fx-sec rv d2">
                <div className="fx-sh">
                  <h2>
                    What it found <span className="sub2">from an earlier review format</span>
                  </h2>
                </div>
                {legacy.summary && <p className="fx-mnote" style={{ marginTop: 0 }}>{legacy.summary}</p>}
              </section>
            )}

            {/* Completed, but nothing to change. */}
            {current?.status === "COMPLETED" && recommendations.length === 0 && !legacy && (
              <section className="fx-sec rv d2">
                <div className="fx-flat2" style={{ marginTop: 0 }}>
                  <b>No changes recommended.</b> The reviewer read this bot&rsquo;s record and
                  found nothing worth changing in the prompt.
                </div>
              </section>
            )}

            {/* ---- run a review ---- */}
            <section className="fx-sec rv d3">
              <div className="fx-sh">
                <h2>{current ? "Review it again" : "Review this bot"}</h2>
                {readinessAsked && reviewsLeft != null && (
                  <span className="fx-src">
                    {reviewsLeft} review{reviewsLeft === 1 ? "" : "s"} left
                  </span>
                )}
              </div>

              {/* The readiness bar — closed trades on the CURRENT prompt,
                  both books counted. Editing the prompt, model or decision
                  style restarts it; renaming the bot does not. */}
              <div className="fx-meter">
                <div className="fx-mh">
                  <b>Closed trades on this prompt</b>
                  <span>
                    {closedOnPrompt == null
                      ? `— of ${reviewNeeded}`
                      : `${closedOnPrompt.toLocaleString()} of ${reviewNeeded}`}
                  </span>
                </div>
                <div className="fx-seg">
                  {new Array(reviewNeeded).fill(0).map((_, i) => {
                    const filled =
                      closedOnPrompt == null
                        ? 0
                        : Math.max(0, Math.min(reviewNeeded, closedOnPrompt));
                    return (
                      <i key={i} className={i < filled ? "f" : i === filled ? "nx" : ""} />
                    );
                  })}
                </div>
                {metricNum(readiness?.win_rate) != null && (
                  <p className="fx-mnote">
                    {winRateLabel(metricNum(readiness?.win_rate))} of those were wins
                    {readiness?.wins != null && readiness?.losses != null && (
                      <>
                        {" "}
                        ({readiness.wins} won · {readiness.losses} lost)
                      </>
                    )}
                    .
                  </p>
                )}
              </div>

              {/* Everything still missing, in the backend's own words. */}
              {readinessAsked && blockers.length > 0 && (
                <div className="fx-soft warn5" style={{ marginTop: "16px" }}>
                  <h3>Before a review can run</h3>
                  {blockers.map((b, i) => (
                    <p key={b.code ?? i} style={{ marginTop: i ? "10px" : "6px" }}>
                      <b style={{ color: "var(--fx-t1)" }}>
                        {(b.code && BLOCKER_TITLE[b.code]) || "Still needed"}
                      </b>
                      <br />
                      {b.message}
                      {b.code === "NO_PROMPT" && (
                        <>
                          {" "}
                          <Link className="fx-link" href={`/dashboard/bots/${id}/settings`}>
                            Add a prompt →
                          </Link>
                        </>
                      )}
                      {b.code === "NO_REVIEWS_LEFT" && (
                        <>
                          {" "}
                          <Link className="fx-link" href="/dashboard/subscription">
                            Get a review pack →
                          </Link>
                        </>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {/* The disclosure, in full, every time — not only before the
                  first review. */}
              <div className="fx-rv2" style={{ marginTop: "18px", marginBottom: "18px" }}>
                <div className="rh2">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z" />
                  </svg>
                  <b>What gets sent</b>
                </div>
                <p>{DISCLOSURE}</p>
              </div>

              <div className="fx-actions">
                <Link className="fx-cta ghost2" href={`/dashboard/bots/${id}`}>
                  Back to this bot
                </Link>
                {!reviewsOff && (
                  <button
                    className="fx-cta main2"
                    type="button"
                    disabled={!canRun || launching || isPending(current)}
                    onClick={launch}
                  >
                    {launching
                      ? "Starting…"
                      : isPending(current)
                        ? "A review is running…"
                        : current
                          ? "Review it again"
                          : "Review this bot"}
                  </button>
                )}
              </div>
              <p className="fx-note3">
                {reviewsOff
                  ? "Bot review is switched off at the moment."
                  : canRun
                    ? "One review is spent when this starts, and given back if it fails."
                    : readinessAsked
                      ? "The button turns on once this bot has what a review needs."
                      : "Checking what this bot has on record…"}
              </p>
            </section>

            {/* ---- past reviews ---- */}
            {past.length > 0 && (
              <section className="fx-sec rv d4">
                <div className="fx-sh">
                  <h2>
                    Past reviews <span className="sub2">{past.length}</span>
                  </h2>
                </div>
                {past.map((r) => {
                  const v = r.verdict ? VERDICT_META[r.verdict] : null;
                  const sm = r.status ? STATUS_META[r.status] : null;
                  const firstRec = r.recommendations?.[0]?.id ?? null;
                  const row = (
                    <div className="fx-bl1">
                      <span className="nm4">{recStamp(r.created_at)}</span>
                      {r.book && <span className="fx-st4 pause4">{r.book}</span>}
                      {sm && <span className={`fx-st4 ${sm.cls}`}>{sm.label}</span>}
                      {v && <span className={`fx-st4 ${v.cls}`}>{v.label}</span>}
                      <span className="fx-src">
                        {r.recommendation_counts?.total != null
                          ? `${r.recommendation_counts.total} recommendation${
                              r.recommendation_counts.total === 1 ? "" : "s"
                            }`
                          : "—"}
                      </span>
                    </div>
                  );
                  return firstRec != null ? (
                    <Link
                      key={r.id}
                      className="fx-bcard"
                      href={`/dashboard/bots/${id}/review/${r.id}/${firstRec}`}
                      style={{ display: "block" }}
                    >
                      {row}
                    </Link>
                  ) : (
                    <div key={r.id} className="fx-bcard" style={{ cursor: "default" }}>
                      {row}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default BotReviewPage;
