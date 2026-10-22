import { AxiosInstance } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Dialog from "./Dialog";
import tradingV2Service from "../../../services/tradingV2Service";
import { error } from "../../alert/Toast";
import {
  confidenceLabel,
  secondsLabel,
  whenLabel,
} from "../../../lib/botHealthV2";
import { BotDecisionV2, BotDecisionV2Detail } from "../../../types/tradingV2";

/**
 * The trade-detail "Decisions and orders" log — `candleweb-trade-detail-focus
 * .html`'s `.fx-dlog`, not the Overview's `.fx-spine` feed. Same endpoint
 * (`GET /decisions/?trade=<id>`), different presentation: this one is a
 * per-decision record with a confidence read-out and what the gate did with
 * it, where the Overview's is a glanceable activity spine.
 *
 * What is real and what is not, per row:
 *
 *  - the time, the call, the confidence and the rationale all come from the
 *    decision itself.
 *  - the **order** line does not. The design prints a fill, a stop and a fee
 *    under each decision; that lives in `outcome` on `GET /decisions/{id}/`,
 *    which is detail-only and documented as `additionalProperties: {}` — an
 *    undocumented shape. Until it is documented (P3 §3.M13) every row says
 *    what it actually knows instead.
 *  - a **HOLD** is the exception: a hold places nothing by definition, so
 *    those rows carry the design's own sentence, which is simply true.
 *
 * Confidence arrives 0–100 (`BotDecisionDetail.confidence`), so the design's
 * five bars are filled from `round(confidence / 20)` and run amber below 60,
 * which is where the design's own examples switch.
 */

type Props = {
  api: AxiosInstance;
  trade: number;
  /** How many to show before "load more". */
  pageSize?: number;
  /** Re-fetch when this changes (e.g. after a pause/resume). */
  refreshKey?: number;
};

/** "Today 14:45" / "Yesterday 22:14" / "9 Sep 11:05", as the design writes it. */
const logStamp = (iso: string) => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return `Today ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`;
};

/* The design's row tone and badge per call. `skip3` / `x3` is the gate's
   "Rejected", which needs `outcome` — nothing renders it yet, but the mapping
   is here so it is one line when that lands. */
const CALL = {
  BUY: { row: "buy3", badge: "b3", label: "Buy" },
  SELL: { row: "sell3", badge: "s4", label: "Sell" },
  HOLD: { row: "hold3", badge: "h3", label: "Hold" },
} as const;

const callOf = (d: string) => CALL[d as keyof typeof CALL] ?? CALL.HOLD;

/** Five bars, filled from a 0–100 confidence; amber under 60. */
const ConfidenceDots = ({ confidence }: { confidence: number | null }) => {
  if (confidence == null) return null;
  const filled = Math.round(confidence / 20);
  const tone = confidence < 60 ? "mid6" : "on6";
  return (
    <span className="fx-conf">
      <span className="fx-cdots">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i < filled ? tone : ""} />
        ))}
      </span>
      {(confidence / 100).toFixed(2)}
    </span>
  );
};

const TradeDecisionLog = ({ api, trade, pageSize = 6, refreshKey }: Props) => {
  const [rows, setRows] = useState<BotDecisionV2[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const [detail, setDetail] = useState<BotDecisionV2Detail | null>(null);
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  /* Guards an append against a refresh landing mid-flight. */
  const runRef = useRef(0);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const run = ++runRef.current;
      setLoading(true);
      setFailed(null);
      try {
        const page = await tradingV2Service.listDecisions(api, {
          trade,
          limit: pageSize,
          offset,
        });
        if (run !== runRef.current) return;
        setRows((prev) => (append ? [...prev, ...page.results] : page.results));
        setCount(page.count);
      } catch (err: any) {
        if (run !== runRef.current) return;
        setFailed(err?.message || "Couldn't load decisions.");
        if (!append) setRows([]);
      } finally {
        if (run === runRef.current) {
          setLoading(false);
          setLoaded(true);
        }
      }
    },
    [api, trade, pageSize],
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage, refreshKey]);

  const openDetail = async (id: number) => {
    setDetailFor(id);
    setDetail(null);
    setDetailBusy(true);
    try {
      setDetail(await tradingV2Service.getDecision(api, id));
    } catch (err: any) {
      /* A 404 here is also "belongs to someone else" — the message is
         "Not found." either way, deliberately, so ids cannot be probed. */
      error(err?.message || "Couldn't load that decision.");
      setDetailFor(null);
    } finally {
      setDetailBusy(false);
    }
  };

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

  const remaining = Math.max(0, count - rows.length);

  return (
    <>
      {failed && (
        <div className="fx-failmsg">
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
          <b>No decisions on this trade yet.</b> One is recorded each time its decider fetches
          candles and answers — including the times it answers <code>HOLD</code>.
        </div>
      )}

      {!failed && rows.length > 0 && (
        <>
          <div className="fx-dlog">
            {rows.map((d) => {
              const call = callOf(d.decision);
              return (
                <div key={d.id} className={`fx-de pick9 ${call.row}`} {...rowProps(d.id)}>
                  <div className="fx-deh">
                    <span className="tt2">{logStamp(d.decided_at)}</span>
                    <span className={`fx-act2 ${call.badge}`}>{call.label}</span>
                    <ConfidenceDots confidence={d.confidence} />
                    {/* `.fx-deout` is the design's outcome column — what the
                        order did. It needs `outcome`; stale data is the one
                        thing we DO know here and is worth the same slot. */}
                    {d.saw_stale_data && (
                      <span
                        className="fx-deout"
                        style={{ color: "var(--fx-amber2)", fontSize: "11px" }}
                        title="The candles were already behind when the bot received them — check this first if the decision looks odd."
                      >
                        ⚠ stale data
                      </span>
                    )}
                  </div>

                  {d.rationale && <div className="fx-why2">{d.rationale}</div>}

                  {d.decision === "HOLD" ? (
                    <div className="fx-noorder">
                      No order placed — hold decisions never reach the exchange.
                    </div>
                  ) : (
                    <div className="fx-order2">
                      <span>
                        Saw{" "}
                        <b>
                          {d.candles_seen} candle{d.candles_seen === 1 ? "" : "s"}
                        </b>
                      </span>
                      <span>
                        Answered in <b>{secondsLabel(d.think_time_seconds)}</b>
                      </span>
                      <span>
                        On <b>{d.timeframe}</b>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="fx-hint" style={{ marginTop: "16px" }}>
            Showing {rows.length} of {count.toLocaleString()}
            {remaining > 0 && (
              <>
                {" · "}
                <button
                  type="button"
                  className="fx-link"
                  disabled={loading}
                  onClick={() => fetchPage(rows.length, true)}
                >
                  {loading ? "loading…" : "load more"}
                </button>
              </>
            )}
          </p>
        </>
      )}

      <Dialog
        open={detailFor != null}
        onClose={() => {
          setDetailFor(null);
          setDetail(null);
        }}
        labelledBy="trade-decision-title"
        title={
          <span id="trade-decision-title">
            {detail ? `${callOf(detail.decision).label} on ${detail.pair}` : "Decision"}
          </span>
        }
        subtitle={detail ? `${detail.bot_name} · ${detail.timeframe}` : undefined}
        footer={
          <button
            className="fx-cta ghost2"
            type="button"
            onClick={() => {
              setDetailFor(null);
              setDetail(null);
            }}
          >
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
            </div>

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
          </>
        )}
      </Dialog>
    </>
  );
};

export default TradeDecisionLog;
