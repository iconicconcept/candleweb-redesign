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
import Dialog from "../../../../components/dashboard/focus/Dialog";
import ReviewChange, {
  KIND_LABEL,
} from "../../../../components/dashboard/focus/ReviewChange";
import { CheckIcon, WarnIcon } from "../../../../components/dashboard/focus/icons";
import { error, success } from "../../../../components/alert/Toast";
import { writeClipboard } from "../../../../lib/hooks/useClipboard";
import { revalidate } from "../../../../redux/slices/revalidateSlice";
import {
  ACTION_ERROR_TITLE,
  barRows,
  isStaleStateCode,
  recStamp,
  touchesLive,
} from "../../../../lib/botRecommendationsV2";
import {
  BotReviewReadinessV2,
  BotReviewV2,
  RecommendationV2,
} from "../../../../types/tradingV2";

/**
 * A bot's review — `bots/{id}/review`, built to `candleweb-bot-review.html`.
 *
 * The page it replaces explained everything in prose and asked the user to
 * read their way to the point. This one leads with a verdict, then gives one
 * collapsed row per recommendation that opens onto the change itself and the
 * buttons that act on it. The reading is the thing that got cut; nothing the
 * backend reports was dropped with it, and anything longer than a line — the
 * evidence paragraph, the decisions behind it — moved behind "See the
 * evidence", which is the recommendation's own page.
 *
 * ## Where the content comes from
 *
 * Some of the design's blocks have no field behind them and are therefore not
 * rendered rather than filled with plausible numbers:
 *
 *  - **"How sure is this review"** (the reliability meters) would need a
 *    per-finding confidence the API does not return. The sample it is built
 *    on — decisions read, closed trades read, which book — IS returned, so
 *    that part is kept, as the scope chips under the verdict.
 *  - **The composition / histogram / range charts.** The API returns `bars`,
 *    which is the design's `compare` chart; the other three need the
 *    per-decision data the recommendation page requests one level down.
 *  - **The verdict's coloured figure** (`Earner lost 1.23R`) is a sentence
 *    the reviewer writes. `summary` is that sentence, so it is shown whole
 *    rather than reassembled around a number we would have to pick.
 *
 * ## Two things this must not get wrong
 *
 * **A running review is not a finished one.** `recommendations` is empty and
 * `progress` is null until `status` is `COMPLETED`.
 *
 * **Candleweb cannot change the bot.** A prompt recommendation is applied by
 * the user, in their own workflow; "Mark as applied" only updates Candleweb's
 * copy. The buttons and the change block both say so.
 */

/* Verbatim from the spec. A user is about to send their prompt, their
   reasoning and their P&L to a model, and the list of what that includes is
   the point — which is why it is a disclosure and not a summary. */
const DISCLOSURE =
  "Your bot's prompt and its trading record on that prompt in the mode you're in (Demo or " +
  "Live): every decision and its reasoning, the market data it saw, and each trade's " +
  "settings, allocation, entry and exit prices, profit or loss and fees. Also what earlier " +
  "reviews recommended and what you did with each, including any reason you gave for " +
  "dismissing one. Your exchange keys, balances, email and other account details are never " +
  "sent.";

/* The fallback bar, used only until `review-readiness` answers with the real
   one — the threshold is an entitlement and a plan can set its own. */
const REVIEW_AT = 20;

/* Severity drives the row's number badge and its first pill. */
const PRIORITY: Record<string, { cls: string; pill: string; label: string }> = {
  HIGH: { cls: "p-main", pill: "bad", label: "main cause" },
  MEDIUM: { cls: "p-medium", pill: "warn", label: "medium impact" },
  LOW: { cls: "p-low", pill: "", label: "low impact" },
};

const VERDICT: Record<string, { tone: string; line: string }> = {
  GOOD: { tone: "pos", line: "Nothing needs changing." },
  NEEDS_CHANGES: { tone: "neg", line: "Something in the prompt is costing money." },
  NOT_ENOUGH_DATA: { tone: "neu", line: "Not enough history to judge the prompt yet." },
};

const ChevIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const isPending = (r: BotReviewV2 | null): boolean =>
  r?.status === "SENDING" || r?.status === "SENT";

/**
 * The reviewer writes its verdict as a paragraph, and the design's headline
 * slot holds one sentence. Split at the end of the first sentence: that
 * sentence leads, the rest reads as the supporting line beneath it.
 *
 * Decimals are safe — "1.23R" has no space after its point — and a sentence
 * only ends where the next one starts with a capital, a digit or a bracket.
 */
const splitFirstSentence = (
  text: string | null | undefined,
): { head: string; rest: string } => {
  const t = (text ?? "").trim();
  const m = t.match(/^(.+?[.!?])\s+(?=[A-Z0-9(\u201c"])/);
  if (!m) return { head: t, rest: "" };
  return { head: m[1], rest: t.slice(m[0].length).trim() };
};

/* The first money or R figure in the headline takes the verdict's colour, as
   the design does with "lost 1.23R". Matched in the text the reviewer wrote
   and rendered as an element — never as injected HTML. */
const FIGURE =
  /([\u2212-]?\+?\$?\d[\d,]*(?:\.\d+)?(?:R|%)(?![A-Za-z])|[\u2212-]?\$\d[\d,]*(?:\.\d+)?)/;
const emphasiseFigure = (head: string): React.ReactNode => {
  const m = head.match(FIGURE);
  if (!m || m.index == null) return head;
  return (
    <>
      {head.slice(0, m.index)}
      <em>{m[0]}</em>
      {head.slice(m.index + m[0].length)}
    </>
  );
};

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
  const [reviews, setReviews] = useState<BotReviewV2[] | null>(null);
  const [reviewsFailed, setReviewsFailed] = useState(false);
  const [current, setCurrent] = useState<BotReviewV2 | null>(null);
  /* True between the list landing and the newest review landing in full.
     Without it that gap read as "no review yet" — the list had arrived but
     the review it points at had not. */
  const [currentLoading, setCurrentLoading] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [reviewsOff, setReviewsOff] = useState(false);

  /* Which rows are open. Seeded from status — an open recommendation starts
     expanded, an acted-on one starts closed — then the user's own clicks win. */
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const [busyRec, setBusyRec] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  /* The three things that need confirming before they are sent. */
  const [confirmApply, setConfirmApply] = useState<RecommendationV2 | null>(null);
  const [confirmLive, setConfirmLive] = useState<TradingV2ActionError | null>(null);
  const [promptChanged, setPromptChanged] = useState<TradingV2ActionError | null>(null);
  const [wholePrompt, setWholePrompt] = useState("");
  const [dismissing, setDismissing] = useState<RecommendationV2 | null>(null);
  const [dismissReason, setDismissReason] = useState("");

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
        const newest = rows[0];
        if (!newest) {
          setCurrent(null);
          return;
        }
        /* Re-read in full: a list row need not carry `recommendations`. */
        setCurrentLoading(true);
        tradingV2Service
          .getBotReview(axiosToken, newest.id)
          .then(setCurrent)
          .catch(() => setCurrent(newest))
          .finally(() => setCurrentLoading(false));
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

  /* Polled at the doc's 10–20s while the review is being written, and stopped
     the moment it is not: a finished review cannot change again. */
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
            loadReadiness();
            loadReviews();
            dispatch(revalidate(["reviewReadiness"]));
          }
        })
        .catch(() => {
          /* A dropped poll is not evidence the review failed. */
        });
    }, 15000);
    return () => clearInterval(tick);
  }, [currentId, pending, axiosToken, loadReadiness, loadReviews, dispatch]);

  /* ---------------------------------------------------------------- *
   * Reading it
   * ---------------------------------------------------------------- */

  const reviewNeeded = readiness?.closed_trades_needed ?? REVIEW_AT;
  const closedOnPrompt = readiness?.closed_trades_on_prompt ?? null;
  const reviewsLeft = readiness?.reviews_available ?? null;
  const blockers = readiness?.blockers ?? [];
  const canRun = readiness?.ready === true && !reviewsOff && !pending;
  const recs: RecommendationV2[] = current?.recommendations ?? [];
  const counts = current?.recommendation_counts ?? null;
  const done = recs.filter((r) => r.status === "APPLIED").length;
  const dismissed = recs.filter((r) => r.status === "DISMISSED").length;
  const openCount = recs.filter((r) => r.status === "OPEN").length;
  const verdict = current?.verdict ? VERDICT[current.verdict] : null;
  const botName = bot?.name || current?.bot_name || "Bot";

  /* The skeleton is for the FIRST read only. A refresh after a review
     finishes, or after launching one, keeps what is on screen until the new
     answer replaces it, rather than blanking the page each time. */
  const loading = !reviewsFailed && current == null && (reviews == null || currentLoading);
  const verdictText = splitFirstSentence(current?.summary);
  const sampleText = splitFirstSentence(current?.sample_note);
  const verdictTone = verdict?.tone ?? "neu";

  const isOpen = (rec: RecommendationV2) =>
    openRows[rec.id] !== undefined ? openRows[rec.id] : rec.status === "OPEN";

  /* ---------------------------------------------------------------- *
   * Acting on it
   * ---------------------------------------------------------------- */

  /* A recommendation that came back from an action replaces its row in
     place — re-reading the whole review would collapse every open row. */
  const replaceRec = (updated: RecommendationV2) => {
    setCurrent((c) =>
      c
        ? {
            ...c,
            recommendations: (c.recommendations ?? []).map((r) =>
              r.id === updated.id ? updated : r,
            ),
          }
        : c,
    );
  };

  const onActionError = (e: TradingV2ActionError, rec: RecommendationV2) => {
    if (isStaleStateCode(e.code)) {
      /* Acted on already, in another tab. The server's state is the true one. */
      loadReviews();
      error(e.message);
      return;
    }
    if (e.code === "CONFIRM_LIVE") {
      setConfirmApply(rec);
      setConfirmLive(e);
      return;
    }
    if (e.code === "PROMPT_CHANGED") {
      setWholePrompt(bot?.prompt ?? "");
      setConfirmApply(rec);
      setPromptChanged(e);
      return;
    }
    if (e.httpStatus === 429) {
      error("Too many changes at once — try again in a moment.");
      return;
    }
    const title = e.code ? ACTION_ERROR_TITLE[e.code] : undefined;
    error(title ? `${title} — ${e.message}` : e.message);
  };

  const doApply = async (
    rec: RecommendationV2,
    body: { confirm?: boolean; prompt?: string } = {},
  ) => {
    if (current == null) return;
    setBusyRec(rec.id);
    try {
      const updated = await tradingV2Service.applyRecommendation(
        axiosToken,
        current.id,
        rec.id,
        body,
      );
      replaceRec(updated);
      setConfirmApply(null);
      setConfirmLive(null);
      setPromptChanged(null);
      setOpenRows((o) => ({ ...o, [rec.id]: false }));
      /* Applying a setting edits a trade; a prompt apply restarts the bot's
         review counter. Both are shown elsewhere. */
      const keys: Parameters<typeof revalidate>[0] = ["reviewReadiness"];
      if (updated.change?.kind === "SETTING") keys.push("trades");
      dispatch(revalidate(keys));
      loadReadiness();
      success(
        updated.change?.kind === "SETTING"
          ? "Applied — your trade has been updated."
          : "Marked as applied. The review count starts again from this prompt.",
      );
    } catch (e: any) {
      onActionError(e as TradingV2ActionError, rec);
    } finally {
      setBusyRec(null);
    }
  };

  const doDismiss = async () => {
    const rec = dismissing;
    if (!rec || current == null) return;
    setBusyRec(rec.id);
    try {
      const updated = await tradingV2Service.dismissRecommendation(
        axiosToken,
        current.id,
        rec.id,
        dismissReason,
      );
      replaceRec(updated);
      setDismissing(null);
      setDismissReason("");
      setOpenRows((o) => ({ ...o, [rec.id]: false }));
      success("Dismissed. Review won't raise this again.");
    } catch (e: any) {
      onActionError(e as TradingV2ActionError, rec);
    } finally {
      setBusyRec(null);
    }
  };

  const doReopen = async (rec: RecommendationV2) => {
    if (current == null) return;
    setBusyRec(rec.id);
    try {
      const updated = await tradingV2Service.reopenRecommendation(
        axiosToken,
        current.id,
        rec.id,
      );
      replaceRec(updated);
      setOpenRows((o) => ({ ...o, [rec.id]: true }));
      success("Reopened.");
    } catch (e: any) {
      onActionError(e as TradingV2ActionError, rec);
    } finally {
      setBusyRec(null);
    }
  };

  const copyReplacement = async (rec: RecommendationV2) => {
    const text = rec.change?.replace?.trim();
    if (!text) return;
    if (await writeClipboard(text)) {
      setCopied(rec.id);
      setTimeout(() => setCopied((c) => (c === rec.id ? null : c)), 2000);
      success("Copied. Paste it into your bot's prompt, then mark it applied.");
    } else {
      error("Couldn't copy — select the text by hand");
    }
  };

  const launch = async () => {
    if (!valid) return;
    setLaunching(true);
    try {
      const { review, alreadyRunning } = await tradingV2Service.startBotReview(
        axiosToken,
        id as number,
      );
      setCurrent(review);
      setOpenRows({});
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
        loadReadiness();
        error(err.blockers?.[0]?.message || err.message);
      } else {
        error(err.message);
      }
    } finally {
      setLaunching(false);
    }
  };

  /* The progress ring. 17 is the circle's radius below. */
  const ringC = 2 * Math.PI * 17;
  const ringFrac = recs.length ? done / recs.length : 0;

  return (
    <>
      <Head>
        <title>{bot ? `${bot.name} · review` : "Bot review"} | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <div className="fx-review">
          <TopBar
            crumb={
              <>
                <Link href="/dashboard/bots">‹ My bots</Link> /{" "}
                {valid ? <Link href={`/dashboard/bots/${id}`}>{botName}</Link> : botName} /
                Review
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
              {/* ---- latest review ---- */}
              <div className="sh">
                <h2>
                  Latest review
                  {current?.created_at && <small>{recStamp(current.created_at)}</small>}
                </h2>
                <div className="pills">
                  {current?.book && <span className="pill dot">{current.book}</span>}
                  {current?.status && (
                    <span
                      className={`pill ${
                        current.status === "COMPLETED"
                          ? "ok"
                          : current.status === "FAILED"
                            ? "bad"
                            : "warn"
                      }`}
                    >
                      {current.status.toLowerCase()}
                    </span>
                  )}
                  {current?.status === "COMPLETED" &&
                    (openCount ? (
                      <span className="pill warn">
                        {openCount === 1 ? "1 change to look at" : `${openCount} changes to look at`}
                      </span>
                    ) : (
                      <span className="pill ok">nothing open</span>
                    ))}
                </div>
              </div>

              {reviewsFailed && (
                <div className="card empty">
                  <span className="ic">
                    <ClockIcon />
                  </span>
                  <div>
                    <h3>Couldn&rsquo;t read this bot&rsquo;s reviews</h3>
                    <p>
                      The request didn&rsquo;t come back.{" "}
                      <button type="button" className="link" onClick={loadReviews}>
                        Try again
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Shaped like the verdict card and two recommendation rows, so
                  nothing jumps when the real review replaces it. */}
              {loading && (
                <div aria-busy="true" aria-label="Reading the latest review">
                  <div className="card verdict">
                    <div className="v-main">
                      <span className="k">Verdict</span>
                      <p className="v-line">
                        <i className="fx-skel" style={{ width: "92%", height: "0.85em" }} />
                        <br />
                        <i className="fx-skel" style={{ width: "58%", height: "0.85em" }} />
                      </p>
                      <p className="v-sum">
                        <i className="fx-skel" style={{ width: "86%" }} />
                        <br />
                        <i className="fx-skel" style={{ width: "64%" }} />
                      </p>
                      <div className="tags">
                        <i className="fx-skel" style={{ width: 74, height: 24 }} />
                        <i className="fx-skel" style={{ width: 128, height: 24 }} />
                        <i className="fx-skel" style={{ width: 132, height: 24 }} />
                      </div>
                    </div>
                    <div className="v-nums">
                      {["Recommendations", "Still open", "Closed trades", "Decisions"].map((l) => (
                        <div className="vn" key={l}>
                          <span className="k">{l}</span>
                          <div>
                            <b>
                              <i className="fx-skel" style={{ width: 42, height: 26 }} />
                            </b>
                            <small>
                              <i className="fx-skel" style={{ width: 70 }} />
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {[0, 1].map((i) => (
                    <div className="card rec" key={i}>
                      <div className="rh" style={{ cursor: "default" }}>
                        <i className="fx-skel" style={{ width: 28, height: 28, borderRadius: 9 }} />
                        <span>
                          <i className="fx-skel" style={{ width: "78%", height: 16 }} />
                          <span className="meta">
                            <i className="fx-skel" style={{ width: 92, height: 20 }} />
                            <i className="fx-skel" style={{ width: 84, height: 20 }} />
                          </span>
                        </span>
                        <span />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !reviewsFailed && reviews != null && reviews.length === 0 && (
                <div className="card empty">
                  <span className="ic">
                    <ClockIcon />
                  </span>
                  <div>
                    <h3>No review yet</h3>
                    <p>
                      {botName} has {closedOnPrompt ?? 0} of the {reviewNeeded} closed trades a
                      first review needs. Until then there&rsquo;s nothing reliable to judge the
                      prompt on.
                    </p>
                  </div>
                </div>
              )}

              {isPending(current) && (
                <div className="card empty">
                  <span className="ic">
                    <ClockIcon />
                  </span>
                  <div>
                    <h3>
                      {current?.status === "SENDING"
                        ? "Sending to the reviewer"
                        : "The reviewer is reading"}
                    </h3>
                    <p>
                      This usually takes a minute or two. The page updates itself — you can
                      leave it and come back.
                    </p>
                  </div>
                </div>
              )}

              {current?.status === "FAILED" && (
                <div className="card empty">
                  <span className="ic" style={{ borderColor: "var(--rose-line)", background: "var(--rose-bg)", color: "var(--fx-rose2)" }}>
                    <WarnIcon />
                  </span>
                  <div>
                    <h3>This review failed</h3>
                    <p>
                      {current.failure_reason || "The reviewer didn't finish."} Your review was
                      given back.
                    </p>
                  </div>
                </div>
              )}

              {/* The verdict. `summary` is the reviewer's own sentence and is
                  shown whole — it is the answer, and the chip above only
                  grades it. */}
              {current?.status === "COMPLETED" && (
                <div
                  className="card verdict"
                  style={
                    {
                      "--tone":
                        verdictTone === "pos"
                          ? "var(--fx-teal)"
                          : verdictTone === "neg"
                            ? "var(--fx-rose)"
                            : "var(--fx-t1)",
                      "--tone-bg":
                        verdictTone === "pos"
                          ? "var(--teal-bg)"
                          : verdictTone === "neg"
                            ? "var(--rose-bg)"
                            : "var(--soft)",
                    } as React.CSSProperties
                  }
                >
                  <div className="v-main">
                    <span className="k">Verdict</span>
                    {/* One sentence leads, as the design has it. A long first
                        sentence steps the type down rather than running to
                        six lines of headline. */}
                    <p className={`v-line ${verdictText.head.length > 110 ? "long" : ""}`}>
                      {verdictText.head
                        ? emphasiseFigure(verdictText.head)
                        : verdict?.line || "The reviewer read this bot."}
                    </p>
                    {/* The rest of the verdict, clamped to three lines. Nothing
                        the reviewer wrote is dropped — it opens in place. */}
                    {verdictText.rest && (
                      <>
                        <p className={`v-sum ${verdictOpen ? "" : "clamp"}`}>{verdictText.rest}</p>
                        {verdictText.rest.length > 200 && (
                          <button
                            type="button"
                            className="link v-more"
                            onClick={() => setVerdictOpen((v) => !v)}
                          >
                            {verdictOpen ? "Show less" : "Read the full verdict"}
                          </button>
                        )}
                      </>
                    )}
                    {/* The sample the verdict rests on — the part of the
                        design's reliability block the API actually reports. */}
                    <div className="tags">
                      {current.book && <span>{current.book} book</span>}
                      {current.decisions_on_prompt != null && (
                        <span>
                          <b>{current.decisions_on_prompt.toLocaleString()}</b> decisions read
                        </span>
                      )}
                      {current.closed_trades != null && (
                        <span>
                          <b>{current.closed_trades.toLocaleString()}</b> closed trades read
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="v-nums">
                    <div className="vn">
                      <span className="k">Recommendations</span>
                      <div>
                        <b className={recs.length ? undefined : "mut"}>
                          {counts?.total ?? recs.length}
                        </b>
                        <small>{done} applied</small>
                      </div>
                    </div>
                    <div className="vn">
                      <span className="k">Still open</span>
                      <div>
                        <b className={openCount ? undefined : "mut"}>{openCount}</b>
                        <small>{dismissed} dismissed</small>
                      </div>
                    </div>
                    <div className="vn">
                      <span className="k">Closed trades</span>
                      <div>
                        <b className={current.closed_trades == null ? "mut" : undefined}>
                          {current.closed_trades?.toLocaleString() ?? "—"}
                        </b>
                        <small>on this prompt</small>
                      </div>
                    </div>
                    <div className="vn">
                      <span className="k">Decisions</span>
                      <div>
                        <b className={current.decisions_on_prompt == null ? "mut" : undefined}>
                          {current.decisions_on_prompt?.toLocaleString() ?? "—"}
                        </b>
                        <small>every one on the prompt</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- how sure is this review ----
                   The design's reliability block. Its per-finding meters have
                   no field behind them; `sample_note` is the reviewer's own
                   account of how much the verdict rests on, so it fills this
                   card — first sentence as the heading, the rest beneath. */}
              {current?.status === "COMPLETED" && sampleText.head && (
                <>
                  <div className="sh">
                    <h2>How sure is this review</h2>
                  </div>
                  <div className="card trust">
                    <span className="k">Sample</span>
                    <h4>{sampleText.head}</h4>
                    {sampleText.rest && <p>{sampleText.rest}</p>}
                  </div>
                </>
              )}

              {/* ---- what to change ---- */}
              {current?.status === "COMPLETED" && recs.length > 0 && (
                <>
                  <div className="sh">
                    <h2>
                      What to change
                      <small>
                        {recs.length} recommendation{recs.length === 1 ? "" : "s"}
                      </small>
                    </h2>
                  </div>

                  <div className="card progress">
                    <svg className="ring" viewBox="0 0 42 42" aria-hidden="true">
                      <circle className="bg" cx="21" cy="21" r="17" />
                      <circle
                        className="fg"
                        cx="21"
                        cy="21"
                        r="17"
                        strokeDasharray={`${(ringC * ringFrac).toFixed(1)} ${ringC.toFixed(1)}`}
                      />
                      <text x="21" y="21">
                        {done}/{recs.length}
                      </text>
                    </svg>
                    <div>
                      <b>
                        {done} of {recs.length} applied
                        {dismissed ? ` · ${dismissed} dismissed` : ""}
                      </b>
                      <span>
                        {done === 0
                          ? "Applied changes are compared against the trades before them at the next review."
                          : "The next review compares the trades before and after these changes."}
                      </span>
                    </div>
                  </div>

                  {recs.map((rec, i) => {
                    const pr = PRIORITY[rec.severity ?? ""] ?? PRIORITY.LOW;
                    const open = isOpen(rec);
                    const applied = rec.status === "APPLIED";
                    const isDismissed = rec.status === "DISMISSED";
                    const isPrompt = rec.change?.kind === "PROMPT";
                    const bars = barRows(rec.bars);
                    const busy = busyRec === rec.id;
                    const widest = bars.length
                      ? Math.max(...bars.map((b) => Math.abs(b.value ?? 0)))
                      : 0;
                    return (
                      <article
                        key={rec.id}
                        className={`card rec ${pr.cls} s-${(rec.status ?? "open").toLowerCase()} ${
                          open ? "open" : ""
                        }`}
                      >
                        <button
                          className="rh"
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenRows((o) => ({ ...o, [rec.id]: !open }))}
                        >
                          <span className="n">{applied ? "✓" : i + 1}</span>
                          <span>
                            <h3>{rec.title || "Recommendation"}</h3>
                            <span className="meta">
                              <span className={`pill ${pr.pill}`}>
                                {rec.severity_label || pr.label}
                              </span>
                              {rec.change?.kind && (
                                <span className="pill">{KIND_LABEL[rec.change.kind]}</span>
                              )}
                              {rec.status === "OPEN" && rec.change?.kind === "SETTING" && (
                                <span className="pill auto">applies automatically</span>
                              )}
                              {rec.status === "OPEN" && isPrompt && (
                                <span className="pill">you apply this</span>
                              )}
                              {applied && <span className="pill ok">applied</span>}
                              {isDismissed && <span className="pill">dismissed</span>}
                            </span>
                          </span>
                          <span className="chev">
                            <ChevIcon />
                          </span>
                        </button>

                        <div className="rb">
                          {rec.summary && <p>{rec.summary}</p>}

                          {/* `bars` is the design's compare chart — the one
                              visualisation the API returns data for. */}
                          {bars.length > 0 && (
                            <div className="viz">
                              <div className="bars">
                                {bars.map((b) => (
                                  <div className="bar" key={b.label}>
                                    <span>{b.label}</span>
                                    <div className="tr">
                                      <span
                                        className={b.tone === "bad3" ? "t-neg" : "t-pos"}
                                        style={{
                                          width: `${
                                            widest
                                              ? (Math.abs(b.value ?? 0) / widest) * 100
                                              : 0
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <b>{b.figure}</b>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <ReviewChange rec={rec} />

                          {/* The long reads — evidence, the decisions behind
                              it, the impact tiles — live one level down. That
                              is the text this redesign took off the page. */}
                          <div className="act">
                            {rec.status === "OPEN" && rec.change?.kind === "SETTING" && (
                              <>
                                <button
                                  className="btn btn-p"
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    touchesLive(rec) ? setConfirmApply(rec) : doApply(rec)
                                  }
                                >
                                  {busy ? "Applying…" : "Apply change"}
                                </button>
                                <button
                                  className="btn btn-q"
                                  type="button"
                                  onClick={() => setDismissing(rec)}
                                >
                                  Dismiss
                                </button>
                                <span className="note">
                                  Candleweb changes this setting for you.
                                </span>
                              </>
                            )}
                            {rec.status === "OPEN" && isPrompt && (
                              <>
                                <button
                                  className="btn btn-p"
                                  type="button"
                                  onClick={() => copyReplacement(rec)}
                                >
                                  {copied === rec.id ? "Copied ✓" : "Copy new text"}
                                </button>
                                <button
                                  className="btn btn-g"
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setConfirmApply(rec)}
                                >
                                  {busy ? "Saving…" : "Mark as applied"}
                                </button>
                                <button
                                  className="btn btn-q"
                                  type="button"
                                  onClick={() => setDismissing(rec)}
                                >
                                  Dismiss
                                </button>
                              </>
                            )}

                            {applied && (
                              <div className="state ok" style={{ width: "100%" }}>
                                <span>
                                  <b>
                                    {rec.change?.kind === "SETTING"
                                      ? "Applied by Candleweb"
                                      : "Applied by you"}
                                  </b>
                                  {rec.applied_at ? ` · ${recStamp(rec.applied_at)}` : ""}
                                </span>
                                <span className="sp" />
                                {/* An applied change was actually made, so
                                    there is nothing here to undo — reversing a
                                    setting means editing the trade. */}
                                <Link className="link" href={`/dashboard/trades`}>
                                  Edit the trade
                                </Link>
                              </div>
                            )}
                            {isDismissed && (
                              <div className="state dis" style={{ width: "100%" }}>
                                <span>
                                  <b>Dismissed</b>
                                  {rec.dismiss_reason ? ` · “${rec.dismiss_reason}”` : ""}
                                </span>
                                <span className="sp" />
                                <button
                                  className="link"
                                  type="button"
                                  disabled={busy}
                                  onClick={() => doReopen(rec)}
                                >
                                  {busy ? "Restoring…" : "Restore"}
                                </button>
                              </div>
                            )}
                          </div>

                          <p style={{ margin: "12px 0 0" }}>
                            <Link
                              className="link"
                              href={`/dashboard/bots/${id}/review/${current.id}/${rec.id}`}
                            >
                              See the evidence →
                            </Link>
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </>
              )}

              {current?.status === "COMPLETED" && recs.length === 0 && (
                <div className="card empty">
                  <span className="ic">
                    <CheckIcon />
                  </span>
                  <div>
                    <h3>No changes recommended</h3>
                    <p>
                      The reviewer read this bot&rsquo;s record and found nothing worth changing
                      in the prompt.
                    </p>
                  </div>
                </div>
              )}

              {/* ---- run it again ---- */}
              <div className="sh">
                <h2>
                  {loading ? "Run a review" : current ? "Review it again" : "First review"}
                  {reviewsLeft != null && (
                    <small>
                      {reviewsLeft} review{reviewsLeft === 1 ? "" : "s"} left
                    </small>
                  )}
                </h2>
              </div>
              <div className="card next">
                <div className="next-top">
                  <b>Closed trades on this prompt</b>
                  <span>
                    <em>{closedOnPrompt ?? "—"}</em> of {reviewNeeded}
                  </span>
                </div>
                <div className="seg" aria-hidden="true">
                  {new Array(reviewNeeded).fill(0).map((_, i) => (
                    <i
                      key={i}
                      className={
                        closedOnPrompt != null && i < Math.min(reviewNeeded, closedOnPrompt)
                          ? "on"
                          : ""
                      }
                    />
                  ))}
                </div>
                <p>
                  {readiness?.ready
                    ? "Enough trades for a fair review."
                    : `A review needs ${reviewNeeded} closed trades on the current prompt, so it judges the prompt on results, not on a few lucky or unlucky trades. Changing the prompt or a bot setting starts the count again.`}
                </p>

                {/* Everything still missing, in the backend's own words. */}
                {readinessAsked &&
                  blockers.map((b, i) => (
                    <p key={b.code ?? i} style={{ marginTop: "10px" }}>
                      {b.message}
                      {b.code === "NO_PROMPT" && (
                        <>
                          {" "}
                          <Link className="link" href={`/dashboard/bots/${id}/settings`}>
                            Add a prompt
                          </Link>
                        </>
                      )}
                      {b.code === "NO_REVIEWS_LEFT" && (
                        <>
                          {" "}
                          <Link className="link" href="/dashboard/subscription">
                            Get a review pack
                          </Link>
                        </>
                      )}
                    </p>
                  ))}

                <details className="sent">
                  <summary>What gets sent for a review</summary>
                  <p>{DISCLOSURE}</p>
                </details>

                <div className="next-act">
                  <Link
                    className="btn btn-g"
                    href={`/dashboard/bots/${id}`}
                    style={{ textDecoration: "none" }}
                  >
                    Back to this bot
                  </Link>
                  {!reviewsOff && (
                    <button
                      className="btn btn-p"
                      type="button"
                      disabled={!canRun || launching}
                      onClick={launch}
                    >
                      {launching
                        ? "Starting…"
                        : pending
                          ? "A review is running…"
                          : current
                            ? "Review it again"
                            : "Review this bot"}
                    </button>
                  )}
                </div>
                <small className="next-note">
                  {reviewsOff
                    ? "Bot review is switched off at the moment."
                    : canRun
                      ? "One review is spent when this starts, and given back if it fails."
                      : "The button turns on once this bot has what a review needs."}
                </small>
              </div>
            </>
          )}
        </div>

        {/* ---- confirm an apply ---- shows the same change block as the row
             it was opened from, so a confirmation can never describe the
             change differently from the thing being confirmed. */}
        <Dialog
          open={!!confirmApply}
          onClose={() => {
            setConfirmApply(null);
            setConfirmLive(null);
            setPromptChanged(null);
          }}
          tone={confirmLive || promptChanged ? "amber" : "teal"}
          labelledBy="apply-title"
          icon={confirmLive || promptChanged ? <WarnIcon /> : <CheckIcon />}
          title={
            <span id="apply-title">
              {promptChanged
                ? "Paste your bot’s prompt"
                : confirmLive
                  ? "Change a live trade?"
                  : confirmApply?.change?.kind === "SETTING"
                    ? "Apply this change?"
                    : "Have you updated the prompt?"}
            </span>
          }
          subtitle={confirmApply?.title ?? ""}
          footer={
            <>
              <button
                className="fx-cta ghost2"
                type="button"
                onClick={() => {
                  setConfirmApply(null);
                  setConfirmLive(null);
                  setPromptChanged(null);
                }}
              >
                {promptChanged ? "Cancel" : "Not yet"}
              </button>
              <button
                className={`fx-cta ${confirmLive ? "live6" : "main2"}`}
                type="button"
                disabled={
                  busyRec != null || (!!promptChanged && !wholePrompt.trim())
                }
                onClick={() =>
                  confirmApply &&
                  doApply(
                    confirmApply,
                    promptChanged
                      ? { prompt: wholePrompt }
                      : confirmLive
                        ? { confirm: true }
                        : {},
                  )
                }
              >
                {busyRec != null
                  ? "Applying…"
                  : confirmLive
                    ? "Yes, apply it"
                    : confirmApply?.change?.kind === "SETTING"
                      ? "Apply change"
                      : "Yes, it’s updated"}
              </button>
            </>
          }
        >
          {confirmApply && !promptChanged && (
            <div className="fx-review" style={{ marginTop: "14px" }}>
              <ReviewChange rec={confirmApply} />
            </div>
          )}
          {confirmLive && <p className="fx-dwarn">{confirmLive.message}</p>}
          {promptChanged && (
            <>
              <p className="fx-dwarn">{promptChanged.message}</p>
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
            </>
          )}
          {!confirmLive && !promptChanged && confirmApply?.change?.kind !== "SETTING" && (
            <p className="fx-dwarn">
              Only mark it applied once the new text is live in your workflow — Candleweb
              can&rsquo;t check that for you. The review count then starts again from this
              prompt.
            </p>
          )}
        </Dialog>

        {/* ---- dismiss ---- the reason goes to the reviewer with the bot's
             next review, which is the whole reason to ask for it. */}
        <Dialog
          open={!!dismissing}
          onClose={() => setDismissing(null)}
          labelledBy="dismiss-title"
          icon={<CheckIcon />}
          title={<span id="dismiss-title">Dismiss this recommendation?</span>}
          subtitle={dismissing?.title ?? ""}
          footer={
            <>
              <button
                className="fx-cta ghost2"
                type="button"
                onClick={() => setDismissing(null)}
              >
                Cancel
              </button>
              <button
                className="fx-cta main2"
                type="button"
                disabled={busyRec != null}
                onClick={doDismiss}
              >
                {busyRec != null ? "Dismissing…" : "Dismiss"}
              </button>
            </>
          }
        >
          <label className="fx-fl" htmlFor="why">
            Why not? <em>— optional, the next review reads this</em>
          </label>
          <textarea
            id="why"
            className="fx-ta"
            style={{ minHeight: "96px" }}
            maxLength={500}
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="e.g. I want it to scalp. Fees are part of the plan."
          />
          <p className="fx-hint">{500 - dismissReason.length} characters left</p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default BotReviewPage;
