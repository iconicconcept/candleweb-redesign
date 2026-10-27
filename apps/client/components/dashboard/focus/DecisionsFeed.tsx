import { AxiosInstance } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Dialog from "./Dialog";
import tradingV2Service from "../../../services/tradingV2Service";
import usePoll, { POLL } from "../../../lib/hooks/usePoll";
import { useRevalidateEffect } from "../../../lib/hooks/useRevalidate";
import { error } from "../../alert/Toast";
import {
  confidenceLabel,
  decidedAtShort,
  decisionMeta,
  secondsLabel,
  whenLabel,
} from "../../../lib/botHealthV2";
import {
  RISK_FILTERS,
  entryPriceLabel,
  idsTidied,
  marketDataIds,
  outcomePnl,
  outcomePnlCaption,
  entryOutcome,
  riskMeta,
} from "../../../lib/botDecisionsV2";
import { signedMoney, toneClass } from "../../../lib/tradingV2Metrics";
import {
  BookV2Param,
  BotDecisionV2,
  BotDecisionV2Action,
  BotDecisionV2Detail,
  BotDecisionV2Risk,
} from "../../../types/tradingV2";

/**
 * What the user's bots have decided, listed in place rather than on a page of
 * its own. A few at a time: "Show more" fetches the next page and appends it,
 * "Close" drops back to the first few. Any row opens that one decision in
 * full.
 *
 * Paging is driven by `count` — the TOTAL from the endpoint, never
 * `results.length` — so the button can say how many are left. Filters are only
 * ever sent when they have a value: `?bot=undefined` is a 400
 * ("bot: Must be an id."), which in practice only means the id had not loaded
 * yet.
 *
 * Field rules kept in one place because each one misleads on its own:
 *
 *  - `think_time_seconds` is measured by Candleweb, not self-reported, and is
 *    `null` when the bot posted without fetching through us. It shows a dash,
 *    never `0`.
 *  - `saw_stale_data: true` means the candles were already behind when the bot
 *    received them — the first thing to check when a bot does something odd.
 *  - `candles_seen` is the number users see. `market_data_count` is the stored
 *    rows behind it and reads like a bug, so it only appears in the detail,
 *    explained.
 *  - `rationale` is free text from the user's own bot. React escapes it;
 *    nothing here uses dangerouslySetInnerHTML.
 */

type Props = {
  api: AxiosInstance;
  /** Which book to list. Decisions are book-scoped: a Live feed must not show
   *  what the same bots decided on paper. */
  book?: BookV2Param;
  /** Narrow the feed to one bot or one trade. Omitted = every bot. */
  bot?: number;
  trade?: number;
  /** How many to show before "Show more". */
  pageSize?: number;
  /** Shown when the user has no decisions at all. */
  empty?: React.ReactNode;
  /** Re-fetch when this changes (e.g. after a pause/resume). */
  refreshKey?: number;
};

const FILTERS: { value: BotDecisionV2Action | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
  { value: "HOLD", label: "Hold" },
];

const DecisionsFeed = ({ api, book, bot, trade, pageSize = 5, empty, refreshKey }: Props) => {
  const [rows, setRows] = useState<BotDecisionV2[]>([]);
  const [count, setCount] = useState(0);
  const [kind, setKind] = useState<BotDecisionV2Action | "all">("all");
  const [risk, setRisk] = useState<BotDecisionV2Risk | "all">("all");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const [detail, setDetail] = useState<BotDecisionV2Detail | null>(null);
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  /* Guards an append against a filter change that lands mid-flight: a late
     page from the previous filter must not be stitched onto the new list. */
  const runRef = useRef(0);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const run = ++runRef.current;
      setLoading(true);
      setFailed(null);
      try {
        const page = await tradingV2Service.listDecisions(api, {
          book,
          bot,
          trade,
          decision: kind === "all" ? undefined : kind,
          risk: risk === "all" ? undefined : risk,
          limit: pageSize,
          offset,
        });
        if (run !== runRef.current) return;
        setRows((prev) => (append ? [...prev, ...page.results] : page.results));
        setCount(page.count);
      } catch (err: any) {
        if (run !== runRef.current) return;
        // Every trading_v2 error carries a readable `message`.
        setFailed(err?.message || "Couldn't load decisions.");
        if (!append) setRows([]);
      } finally {
        if (run === runRef.current) {
          setLoading(false);
          setLoaded(true);
        }
      }
    },
    [api, book, bot, trade, kind, risk, pageSize],
  );

  // First page, and again whenever the filter or the scope changes.
  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage, refreshKey]);

  /**
   * Bring in new decisions without taking away what the reader is looking at.
   *
   * The obvious refresh — `fetchPage(0, false)` — would collapse an expanded
   * list back to the first page, which is the same trap the notifications
   * poll documents and avoids: someone reading row thirty is snapped back to
   * row five by an event they did not cause. So it re-reads as many rows as
   * are currently shown, from the top, and replaces them. The list keeps its
   * length, gains whatever is new at the front, and the reader's place
   * survives.
   *
   * It stands down while a request is already running, and while a decision's
   * detail dialog is open — re-rendering the list under an open dialog is
   * movement the reader did not ask for.
   */
  const rowsShown = rows.length;
  const refresh = useCallback(async () => {
    if (loading || detailFor != null) return;
    const run = ++runRef.current;
    try {
      const page = await tradingV2Service.listDecisions(api, {
        book,
        bot,
        trade,
        decision: kind === "all" ? undefined : kind,
        risk: risk === "all" ? undefined : risk,
        limit: Math.max(pageSize, rowsShown),
        offset: 0,
      });
      if (run !== runRef.current) return;
      setRows(page.results);
      setCount(page.count);
      setFailed(null);
    } catch {
      /* A failed refresh keeps the rows that are already on screen: they were
         true when they were read, and blanking a readable list because one
         background request failed is strictly worse. */
    }
  }, [api, book, bot, trade, kind, risk, pageSize, rowsShown, loading, detailFor]);

  /* A new decision arrives as a notification; the interval is the net under
     it for anything that does not. */
  useRevalidateEffect("decisions", refresh, loaded);
  usePoll(refresh, POLL.decisions, loaded);

  const openDetail = async (id: number) => {
    setDetailFor(id);
    setDetail(null);
    setDetailBusy(true);
    try {
      setDetail(await tradingV2Service.getDecision(api, id));
    } catch (err: any) {
      // A 404 here is also "belongs to someone else" — the message is
      // "Not found." either way, deliberately, so ids cannot be probed.
      error(err?.message || "Couldn't load that decision.");
      setDetailFor(null);
    } finally {
      setDetailBusy(false);
    }
  };

  const closeDetail = () => {
    setDetailFor(null);
    setDetail(null);
  };

  const remaining = Math.max(0, count - rows.length);
  const expanded = rows.length > pageSize;

  /* `market_data_ids` can be SHORTER than `market_data_count`: the count is
     frozen when the decision is made and the links go when old market data is
     cleaned up. That is tidying, not a bot that saw less than it claimed. */
  const seenIds = marketDataIds(detail);
  const tidied = idsTidied(detail);
  const result = outcomePnl(detail);
  const refusal = entryOutcome(detail);

  const rowProps = (id: number) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => openDetail(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail(id);
      }
    },
  });

  return (
    <>
      {/* The filter only earns its place once there is enough to sift. */}
      {(count > pageSize * 2 || kind !== "all" || risk !== "all") && (
        <div className="fx-tfilter" style={{ marginBottom: 12 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`fx-mini ${kind === f.value ? "go" : ""}`}
              onClick={() => setKind(f.value)}
            >
              {f.label}
            </button>
          ))}
          {/* The bot's own rating, not ours — so it sifts, it does not rank. */}
          <span className="fx-src" style={{ margin: "0 2px 0 6px" }}>
            |
          </span>
          {RISK_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`fx-mini ${risk === f.value ? "go" : ""}`}
              onClick={() => setRisk(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {failed && (
        <div className="fx-failmsg" style={{ marginTop: 0 }}>
          <b>Couldn&rsquo;t load decisions.</b> {failed}{" "}
          <button
            type="button"
            className="fx-mini"
            style={{ marginLeft: 8 }}
            onClick={() => fetchPage(0, false)}
          >
            Try again
          </button>
        </div>
      )}

      {!failed && !loaded && (
        <p className="fx-hint" style={{ padding: "14px 4px" }}>
          Loading decisions…
        </p>
      )}

      {!failed && loaded && rows.length === 0 && (
        <div className="fx-flat2" style={{ marginTop: 0 }}>
          {kind !== "all" || risk !== "all" ? (
            <>
              <b>Nothing matches that filter.</b> A bot that only ever holds still has its
              answers recorded, and risk is whatever the bot itself rated — try widening it.
            </>
          ) : (
            (empty ?? (
              <>
                <b>No decisions yet.</b> A decision is recorded each time a bot fetches candles and
                posts an answer back — including the times it answers <code>HOLD</code>.
              </>
            ))
          )}
        </div>
      )}

      {!failed && rows.length > 0 && (
        <>
          <div className="fx-spine">
            {rows.map((d) => {
              const meta = decisionMeta(d.decision);
              return (
                <div
                  key={d.id}
                  className={`fx-ev pick9 ${
                    d.decision === "BUY" ? "good" : d.decision === "SELL" ? "bad" : ""
                  }`}
                  {...rowProps(d.id)}
                >
                  <span className="t2">
                    {decidedAtShort(d.decided_at)}
                    {" · "}
                    {d.think_time_seconds == null
                      ? "no think time"
                      : `answered in ${secondsLabel(d.think_time_seconds)}`}
                  </span>
                  <b>
                    {meta.label} on {d.pair} · {d.timeframe}
                  </b>
                  <p>
                    {d.bot_name} saw {d.candles_seen} candle{d.candles_seen === 1 ? "" : "s"}
                    {d.confidence != null && <> · {confidenceLabel(d.confidence)} confident</>}
                    {riskMeta(d.risk) && <> · {riskMeta(d.risk)!.label.toLowerCase()}</>}
                    {d.saw_stale_data && (
                      <>
                        {" · "}
                        <span
                          className="stale9"
                          title="The candles were already behind when the bot received them — check this first if the decision looks odd."
                        >
                          ⚠ stale data
                        </span>
                      </>
                    )}
                  </p>
                  {/* the bot's own words get the template's quoted block, not
                      a <br /> inside the line above. Clamped to three lines
                      because a real rationale is a paragraph — the row opens
                      it in full. */}
                  {d.rationale && <div className="q">{d.rationale}</div>}
                </div>
              );
            })}
          </div>

          {(remaining > 0 || expanded) && (
            <div className="fx-feedacts">
              {remaining > 0 && (
                <button
                  type="button"
                  className="fx-mini go"
                  disabled={loading}
                  onClick={() => fetchPage(rows.length, true)}
                >
                  {loading
                    ? "Loading…"
                    : `Show ${Math.min(pageSize, remaining)} more`}
                </button>
              )}
              {expanded && (
                <button
                  type="button"
                  className="fx-mini"
                  disabled={loading}
                  onClick={() => fetchPage(0, false)}
                >
                  Close
                </button>
              )}
              <span className="rest9">
                {rows.length} of {count.toLocaleString()}
              </span>
            </div>
          )}
        </>
      )}

      <Dialog
        open={detailFor != null}
        onClose={closeDetail}
        labelledBy="decision-detail-title"
        title={
          <span id="decision-detail-title">
            {detail ? `${decisionMeta(detail.decision).label} on ${detail.pair}` : "Decision"}
          </span>
        }
        subtitle={detail ? `${detail.bot_name} · ${detail.timeframe}` : undefined}
        footer={
          <button className="fx-cta ghost2" type="button" onClick={closeDetail}>
            Close
          </button>
        }
      >
        {detailBusy && <p className="fx-hint">Loading…</p>}
        {detail && (
          <>
            <div className="fx-health">
              <div className="fx-hz">
                <span>Decided</span>
                <b>{whenLabel(detail.decided_at)}</b>
              </div>
              <div className="fx-hz">
                <span>Confidence</span>
                <b className={detail.confidence == null ? "mut2" : undefined}>
                  {confidenceLabel(detail.confidence)}
                </b>
              </div>
              <div className="fx-hz">
                <span>Think time</span>
                <b className={detail.think_time_seconds == null ? "mut2" : undefined}>
                  {secondsLabel(detail.think_time_seconds)}
                </b>
              </div>
              <div className="fx-hz">
                <span>Candles seen</span>
                <b>{detail.candles_seen}</b>
              </div>
              {/* The bot's OWN rating — labelled as its word, not a verdict
                  Candleweb reached. */}
              <div className="fx-hz">
                <span>Bot rated risk</span>
                <b className={detail.risk == null ? "mut2" : undefined}>
                  {riskMeta(detail.risk)?.label ?? "—"}
                </b>
              </div>
              {/* The price it QUOTED when deciding. Not a fill: an order may
                  never have been placed, and one that was filled at whatever
                  the venue gave. */}
              <div className="fx-hz">
                <span>Price when decided</span>
                <b className={entryPriceLabel(detail) === "—" ? "mut2" : undefined}>
                  {entryPriceLabel(detail)}
                </b>
              </div>
              {/* The one thing `outcome` is read for: what the position this
                  decision opened actually made. The rest of that field — the
                  order, the condition id, the fill prices — stays unrendered;
                  it buried this figure. */}
              <div className="fx-hz">
                <span>Result</span>
                <b className={toneClass(result.value, "up5", "dn5")}>
                  {result.value == null ? "—" : signedMoney(result.value)}
                </b>
              </div>
            </div>
            <p className="fx-hint" style={{ marginTop: 10 }}>
              {outcomePnlCaption(result)}
            </p>

            {/* A refused entry is not a bot that did nothing — it is a bot
                whose order the gate turned away, and the backend says why.
                The commonest reason now is a live BUY on a plan without live
                trading. */}
            {refusal.refused && (
              <p className="fx-failmsg" style={{ marginTop: 12 }}>
                <b>This entry was refused.</b>{" "}
                {refusal.detail ||
                  "Candleweb's gate turned the order away, so no position was opened."}
              </p>
            )}

            {detail.think_time_seconds == null && (
              <p className="fx-hint" style={{ marginTop: 12 }}>
                No think time: this decision was posted without fetching the candles through
                Candleweb, so there was nothing to time.
              </p>
            )}

            {detail.saw_stale_data && (
              <p className="fx-failmsg">
                <b>Stale data.</b> The candles were already behind when this bot received them. If
                this decision looks wrong, start here.
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              <div className="fx-sh">
                <h2>Why</h2>
              </div>
              {detail.rationale ? (
                <pre className="fx-pre">{detail.rationale}</pre>
              ) : (
                <p className="fx-hint">
                  This bot sent no rationale. It does not have to — but a sentence here is what
                  makes a decision reviewable later.
                </p>
              )}
            </div>

            {/* <div style={{ marginTop: 18 }}>
              <div className="fx-sh">
                <h2>
                  Candle records it looked at <span className="sub2">{seenIds.length}</span>
                </h2>
              </div>
              <p className="fx-hint" style={{ marginTop: 0 }}>
                {tidied ? (
                  <>
                    This decision was made against <b>{detail.market_data_count}</b> stored records;{" "}
                    <b>{seenIds.length}</b> are still linked. Some have since been cleaned up — the
                    bot did see all {detail.market_data_count}.
                  </>
                ) : (
                  <>
                    Oldest first. These are the stored rows behind the <b>{detail.candles_seen}</b>{" "}
                    candles at this trade&rsquo;s timeframe, which is why there can be more of them
                    than candles.
                  </>
                )}
              </p>
              {seenIds.length > 0 && <pre className="fx-pre">{seenIds.join(", ")}</pre>}
            </div> */}
          </>
        )}
      </Dialog>
    </>
  );
};

export default DecisionsFeed;
