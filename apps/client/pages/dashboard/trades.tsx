import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import userService from "../../services/userService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import { TrashIcon } from "../../components/dashboard/focus/icons";
import { PortfolioMetricsV2, TradeV2, TradeV2Status } from "../../types/tradingV2";
import { BalanceProp } from "../../types/user";
import { indicatorChips } from "../../lib/tradingV2Indicators";
import useOpenPositions from "../../lib/hooks/useOpenPositions";
import {
  DEFAULT_WINDOW_DAYS,
  REALISED_FIELDS,
  REALISED_PCT_FIELDS,
  metricRead,
  pnlCellParts,
  realisedPct,
  realisedPnl,
  toneClass,
  winRateLabel,
} from "../../lib/tradingV2Metrics";
import {
  DeciderRead,
  confidenceRule,
  deciderLine,
  deciderOptions,
  deciderRead,
  deciderReads,
  hasPastDeciders,
  tradeDeciderKey,
  tradeDeciderName,
  tradeRecord,
  tradeTitle,
} from "../../lib/tradingV2Trades";
import useIndicatorCatalogue from "../../lib/hooks/useIndicatorCatalogue";
import { indicatorLabels } from "../../lib/tradingV2Indicators";
import useBook from "../../lib/hooks/useBook";
import usePoll, { POLL } from "../../lib/hooks/usePoll";
import { useRevalidateEffect } from "../../lib/hooks/useRevalidate";

const STATUS_META: Record<TradeV2Status, { label: string; cls: string }> = {
  ACTIVE: { label: "Running", cls: "on5" },
  PAUSED: { label: "Paused", cls: "off6" },
};

const DIRECTION_LABEL: Record<string, string> = {
  BOTH: "Long & short",
  LONG: "Long only",
  SHORT: "Short only",
};

type Filter = "all" | "running" | "paused";

/* Chips now sit in one cell of the metrics row rather than across the card,
   and that cell fits about five on a line. Ten would wrap to three lines and
   drive the row's height on its own; the rest stay one click away under
   "Load more". */
const IND_LIMIT = 4;

const IndicatorChips = ({ chips }: { chips: string[] }) => {
  const [open, setOpen] = useState(false);
  if (!chips.length)
    return (
      <div className="fx-ind2">
        <span className="fx-ip">none</span>
      </div>
    );
  const extra = chips.length - IND_LIMIT;
  const shownChips = open || extra <= 0 ? chips : chips.slice(0, IND_LIMIT);
  return (
    <div className="fx-ind2">
      {shownChips.map((c) => (
        <span className="fx-ip" key={c}>
          {c}
        </span>
      ))}
      {extra > 0 && (
        <button type="button" className="fx-ip more2" onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : `Load more (${extra})`}
        </button>
      )}
    </div>
  );
};

/**
 * Who has decided this trade, and what each of them made on it.
 *
 * Only drawn when the trade's decider has CHANGED — when one decider has the
 * whole record, the card's win rate already is that decider's and a strip
 * repeating it says nothing. Collapsed by default: the current decider's
 * figures are on the chip above, and this is the "and before that" answer.
 */
const DeciderStrip = ({ rows }: { rows: DeciderRead[] }) => {
  const [open, setOpen] = useState(false);
  if (rows.length < 2) return null;
  const past = rows.filter((r) => !r.current);
  return (
    <div className="fx-ind2" style={{ marginTop: "14px" }}>
      <button type="button" className="fx-ip more2" onClick={() => setOpen((v) => !v)}>
        {open
          ? "Hide earlier deciders"
          : `${past.length} earlier decider${past.length === 1 ? "" : "s"}`}
      </button>
      {open &&
        rows.map((r) => (
          <span className="fx-ip" key={r.key} title={deciderLine(r)}>
            {r.name}
            {r.current ? " (now)" : ""} · {deciderLine(r)}
          </span>
        ))}
    </div>
  );
};

const TradesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { trades, tradesLoading: isLoading, tradesLoaded: loaded } = useSelector(
    (state: RootState) => state.tradingV2,
  );
  const { balance } = useSelector((state: RootState) => state.user);
  /* Every list and figure on this page answers for ONE book. A Live
     dashboard must not list demo trades, nor add their allocation into the
     Capital Allocated band. */
  const book = useBook();
  /* Only for turning each trade's stored indicator names into the labels a
     user recognises. Cached for the tab, so this shares the form's request
     rather than making one of its own. */
  const { index: indicatorIndex } = useIndicatorCatalogue();

  const [filter, setFilter] = useState<Filter>("all");
  /* Which decider's trades to show. "" is all of them. `GET trades/` takes no
     decider parameter, so this narrows the list already in hand rather than
     asking again — see `tradeDeciderKey` for why it matches on the CURRENT
     decider and not on the historical record. */
  const [decider, setDecider] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TradeV2 | null>(null);

  /* Account-wide money — `GET /trading_v2/metrics/`. Local state: nothing
     else on the page reads it, and a stale PnL is worse than no PnL. */
  const [metrics, setMetrics] = useState<PortfolioMetricsV2 | null>(null);
  /* Holds the book it last fetched for, not a bare boolean: flipping the
     Demo/Live switch has to re-ask, and "we already fetched" would otherwise
     leave the other book's trades on screen. */
  const fetchedRef = useRef<string | null>(null);

  /* What is actually deployed right now — `GET /positions/?status=open`.
     This is money on the venue, which is not the same as allocated capital:
     an allocation is a ceiling, a position is a fill. Valued at the mark. */
  const {
    rows: positions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open", book });
  const deployed = useMemo(() => {
    if (!positionsAsked || positionsFailed || positions.length === 0) return null;
    let total: number | null = null;
    for (const p of positions) {
      const qty = typeof p.qty === "number" ? p.qty : null;
      const mark = typeof p.mark_price === "number" ? p.mark_price : null;
      if (qty != null && mark != null) total = (total ?? 0) + qty * mark;
    }
    return total;
  }, [positions, positionsAsked, positionsFailed]);

  /* The per-row "PnL · 30D" cell used to cost one
     `GET /trading_v2/trades/{id}/metrics/` per row — up to twenty requests to
     open this page. The trade row now carries its own record (`closed_trades`,
     `wins`, `losses`, `win_rate`), so the cell is filled from the list
     response that is already in hand and the fan-out is gone. That record is
     all-time rather than windowed, which is why the cell says so. */

  /* The band's "Net · 30d" is the PnL across EVERY trade in this book, so it
     comes from the account-wide `GET /trading_v2/metrics/` rather than from
     summing the rows. A callback, so a poll or a notification can re-read it
     without re-dispatching the trades list and the balance alongside. */
  const loadMetrics = useCallback(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    return tradingV2Service
      .getPortfolioMetrics(axiosToken, { book, window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [axiosToken, book]);

  const loadTrades = useCallback(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
  }, [axiosToken, dispatch, book]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (fetchedRef.current === book) return;
    fetchedRef.current = book;
    loadTrades();
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch, book]);

  /* A fill, a close or a trade starting changes both the list and the band.
     The intervals are the net under anything that arrives silently. */
  useRevalidateEffect("trades", loadTrades);
  useRevalidateEffect("metrics", loadMetrics);
  usePoll(loadTrades, POLL.trades);
  usePoll(loadMetrics, POLL.metrics);

  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );

  /* Built from the list, so the dropdown can never offer a decider that no
     trade in this book points at. A trade's decider can be swapped, so the
     options change with the list rather than being held in state. */
  const deciders = useMemo(() => deciderOptions(trades), [trades]);

  /* A decider the user had selected can stop existing — the last trade using
     it is deleted, or re-pointed at another bot, or the Demo/Live switch
     brings back a list that never had it. Left alone, the select would sit on
     a value nothing matches and the page would read as "no trades". */
  useEffect(() => {
    if (decider && !deciders.some((d) => d.key === decider)) setDecider("");
  }, [deciders, decider]);

  const shown = useMemo(() => {
    let rows = trades;
    if (filter === "running") rows = rows.filter((t) => t.status === "ACTIVE");
    else if (filter === "paused") rows = rows.filter((t) => t.status !== "ACTIVE");
    if (decider) rows = rows.filter((t) => tradeDeciderKey(t) === decider);
    return rows;
  }, [trades, filter, decider]);

  const runningCount = trades.filter((t) => t.status === "ACTIVE").length;
  const capitalAllocated = trades.reduce((s, t) => s + (parseFloat(t.allocated_amount) || 0), 0);
  const balanceKnown = !!balance && balance.length > 0;
  const freeToAllocate = balanceKnown ? Math.max(0, totalBalance - capitalAllocated) : null;
  const allocPct = balanceKnown && totalBalance > 0 ? Math.min(100, (capitalAllocated / totalBalance) * 100) : 0;

  /* The band's one money figure: realised PnL across every trade. A PnL cell
     is a percentage over an amount, per the design — `pnlCellParts` builds
     that pair and falls back to the amount when no percentage is sent. */
  const netPct = metricRead(metrics, REALISED_PCT_FIELDS, realisedPct(metrics));
  const netAmount = metricRead(metrics, REALISED_FIELDS, realisedPnl(metrics));
  const net = pnlCellParts(netPct, netAmount);

  const toggleRun = async (t: TradeV2) => {
    setBusyId(t.id);
    try {
      if (t.status === "ACTIVE") {
        await dispatch(tradingV2Service.pauseTrade({ api: axiosToken, id: t.id }));
      } else {
        await dispatch(tradingV2Service.startTrade({ api: axiosToken, id: t.id }));
      }
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await dispatch(tradingV2Service.deleteTrade({ api: axiosToken, id: confirmDelete.id }));
      setConfirmDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head>
        <title>My trades | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="trades">
        <TopBar
          crumb="Dashboard / My trades"
          title="My trades"
          subtitle="Each one is a setup you defined. A bot decides; Candleweb executes."
        />

        <div className="fx-sh rv d1" style={{ marginTop: "clamp(18px,2.4vw,26px)" }}>
          <h2>
            All trades{" "}
            <span className="sub2">
              {trades.length} set up · {runningCount} running
            </span>
          </h2>
          <Link className="fx-cta main2" href="/dashboard/trades/new" style={{ flex: "0 0 auto", minWidth: 0, padding: "12px 20px", fontSize: "14px" }}>
            New trade
          </Link>
        </div>

        {/* ---- performance overview ---- every cell is live now: capital
             and free to allocate from the trades and the balance, Net · 30d
             from `GET /metrics/`, and what is actually deployed from
             `GET /positions/?status=open`. */}
        <section className="fx-mom rv d2" style={{ marginTop: "clamp(20px,2.6vw,30px)", paddingTop: "22px" }}>
          <div className="fx-sh">
            <h2>
              How your trades are doing
            </h2>

          </div>
          <div className="fx-cap2" style={{ marginTop: 0 }}>
            <div className="fx-cp">
              <span>Capital allocated</span>
              <b>{dollarFormat(capitalAllocated)}</b>
              <i>across {trades.length} trades</i>
            </div>
            <div className="fx-cp">
              <span>In open positions</span>
              <b className={deployed == null ? "mut2" : undefined}>
                {deployed == null ? "—" : dollarFormat(deployed)}
              </b>
              <i>
                {positionsFailed
                  ? "couldn't read positions"
                  : !positionsAsked
                    ? "reading…"
                    : `${positions.length} open position${positions.length === 1 ? "" : "s"}`}
              </i>
            </div>
            <div className="fx-cp">
              <span>Free to allocate</span>
              <b className={freeToAllocate == null ? "mut2" : undefined}>
                {freeToAllocate == null ? "—" : dollarFormat(freeToAllocate)}
              </b>
              <i>{freeToAllocate == null ? "needs a balance endpoint" : "across your exchanges"}</i>
            </div>
            {/* Net across every trade, from the account-wide metrics call. */}
            <div className="fx-cp">
              <span>Net · {DEFAULT_WINDOW_DAYS}d</span>
              <b className={toneClass(net.tone, "up6", "fx-dn")}>{net.figure}</b>
              <i>{net.caption}</i>
            </div>
          </div>
          <div className="fx-capbar" style={{ marginTop: "20px" }}>
            <div className="cb">
              <i className="p1" style={{ width: `${allocPct}%` }} />
              <i className="p3" style={{ width: `${100 - allocPct}%` }} />
            </div>
            <div className="fx-caplab">
              <span>
                <i className="k1" />
                Allocated — {dollarFormat(capitalAllocated)}
              </span>
              <span>
                <i className="k3" />
                Free — {freeToAllocate == null ? "—" : dollarFormat(freeToAllocate)}
              </span>
            </div>
          </div>
        </section>

        {/* ---- the real list ---- */}
        <section className="fx-sec rv d3">
          <div className="fx-sh">
            <h2>Your trades</h2>
            <div className="fx-tfilter">
              {(["all", "running", "paused"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`fx-mini ${filter === f ? "go" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "running" ? "Running" : "Paused"}
                </button>
              ))}
              {/* Only once there is a choice to make. One decider means every
                  trade is under it, and the dropdown would narrow nothing. */}
              {deciders.length > 1 && (
                <select
                  className={`fx-fs ${decider ? "act2" : ""}`}
                  value={decider}
                  aria-label="Decider"
                  onChange={(e) => setDecider(e.target.value)}
                >
                  <option value="">All deciders</option>
                  {deciders.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.name} ({d.count})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {isLoading && !loaded && (
            <p className="fx-hint" style={{ padding: "18px 4px" }}>
              Loading your trades…
            </p>
          )}

          {loaded && trades.length === 0 && (
            <div className="fx-flat2" style={{ marginTop: 0 }}>
              <b>No trades yet.</b> Set one up and it runs against live candles — nothing reaches
              the exchange until you start it.
            </div>
          )}

          {/* A filter can now empty the list on an account that does have
              trades, which is a different thing from having none and must
              not read as the empty state above. */}
          {loaded && trades.length > 0 && shown.length === 0 && (
            <div className="fx-flat2" style={{ marginTop: 0 }}>
              <b>Nothing matches.</b> No {filter === "all" ? "" : `${filter} `}trade
              {decider ? ` is decided by ${deciders.find((d) => d.key === decider)?.name}` : "s here"}.
              <button
                type="button"
                className="fx-ip more2"
                onClick={() => {
                  setFilter("all");
                  setDecider("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {shown.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.PAUSED;
            const running = t.status === "ACTIVE";
            const isAi = t.decider_type === "CANDLEAI";
            /* The API's own name for the decider where it sends one, so this
               row does not have to spell "CandleAI" itself. */
            const deciderName = tradeDeciderName(t);
            /* What the decider deciding this trade NOW has made on it — and
               nothing else. The trade-level record below counts whoever
               decided, which after a swap is a different number; putting the
               two side by side unlabelled is what credited a new decider
               with an old bot's losses. */
            const own = deciderRead(t.current_decider_record);
            const everyone = deciderReads(t);
            const swapped = hasPastDeciders(t);
            /* Labels, not the stored names: a trade holds `trd_ema_50` and
               the chip has to read "EMA (50)". Falls back to the raw name
               until the catalogue lands, and for a name it no longer has. */
            const chips = indicatorLabels(indicatorIndex, indicatorChips(t.indicators));
            /* This trade's own record, straight off the list response. A null
               `win_rate` means nothing has closed yet, which is NOT 0% — a
               trade that lost everything it closed and one that has closed
               nothing must not read the same. */
            const record = tradeRecord(t);
            return (
              <div
                key={t.id}
                className={`fx-tcard ${running ? "" : "off5"}`}
              >
                <div className="fx-tl1">
                  {/* `display_name` — the user's own name for the trade, or
                      "ETHUSDT · 15m" when they gave none. Never `name`, which
                      is blank on most rows. */}
                  <span className="tn2">{tradeTitle(t)}</span>
                  <span className={`fx-run2 ${meta.cls}`}>{meta.label}</span>
                  {/* The decider's own record rides on its own chip, so the
                      number is read as belonging to the name beside it rather
                      than to whichever figure the card happens to show next.
                      A decider that has closed nothing says so — it is a new
                      decider on an old trade, not a decider with no results. */}
                  <span
                    className={`fx-byb ${isAi ? "ai2" : ""}`}
                    title={own ? `${own.name}: ${deciderLine(own)}` : undefined}
                  >
                    ● {deciderName}
                    {own && <> · {deciderLine(own)}</>}
                  </span>
                  {/* The pair is repeated here because the title above may now
                      be words of the user's own that never mention it. The
                      venue name is sent for a demo trade too — it has no
                      account of its own but still runs against a named
                      market — so the name leads either way. */}
                  <span className="tsp2">
                    {t.pair_name || `Pair #${t.pair}`} · {t.timeframe} ·{" "}
                    {t.exchange_name ||
                      (t.exchange_account == null ? "demo" : `Account #${t.exchange_account}`)}
                  </span>
                </div>

                <div className="fx-tgrid">
                  <div className="fx-tm2">
                    <span>Allocated</span>
                    <b>{dollarFormat(parseFloat(t.allocated_amount) || 0)}</b>
                    <em>{t.candle_history_len} candle history</em>
                  </div>
                  <div className="fx-tm2">
                    <span>Risk / trade</span>
                    <b>{parseFloat(t.risk_pct)}%</b>
                    <em>max size {t.max_size_pct}%</em>
                  </div>
                  {/* The gate on this trade's decisions. Worth a cell of its
                      own: it is the setting that decides whether the bot's
                      answers are acted on at all. */}
                  <div className="fx-tm2">
                    <span>Acts above</span>
                    <b className={t.min_confidence == null ? "mut2" : undefined}>
                      {t.min_confidence == null ? "—" : t.min_confidence}
                    </b>
                    <em title={confidenceRule(t.min_confidence)}>confidence</em>
                  </div>
                  <div className="fx-tm2">
                    <span>Direction</span>
                    <b>{DIRECTION_LABEL[t.direction] || t.direction}</b>
                    <em>{t.trailing_stop ? "trailing stop" : "fixed stop"}</em>
                  </div>
                  {/* The TRADE's all-time record, off the list response — no
                      per-row request. Not a 30-day window: this is what the
                      trade has done since it was set up, under every decider
                      it has had. When it has had more than one, the caption
                      has to say so: otherwise this figure and the one on the
                      decider chip above disagree with no explanation, and a
                      user can only conclude one of them is wrong. */}
                  <div className="fx-tm2">
                    <span className="fx-kase">WIN RATE</span>
                    <b className={record.rate == null ? "mut2" : undefined}>
                      {record.rate == null ? "—" : winRateLabel(record.rate)}
                    </b>
                    <em title={swapped ? "This trade's own record, under every decider it has had." : undefined}>
                      {swapped ? `all deciders · ${record.caption}` : record.caption}
                    </em>
                  </div>
                  <div className="fx-tm2 wide2">
                    <span>Indicators sent</span>
                    <IndicatorChips chips={chips} />
                  </div>
                </div>

                {/* Every decider that ever opened a position on this trade.
                    Draws nothing until there is more than one. */}
                <DeciderStrip rows={everyone} />

                <div className="fx-tacts">
                  <button
                    type="button"
                    className={`fx-mini ${running ? "" : "go"}`}
                    disabled={busyId === t.id}
                    onClick={() => toggleRun(t)}
                  >
                    {busyId === t.id ? "…" : running ? "Pause" : "Start"}
                  </button>
                  {/* The read screen. `new?id=` stays the edit screen and is
                      still linked beside this one. */}
                  <Link className="fx-mini" href={`/dashboard/trades/${t.id}`}>
                    Open
                  </Link>
                  <Link className="fx-mini" href={`/dashboard/trades/new?id=${t.id}`}>
                    {isAi ? "Edit setup" : "Setup & connection"}
                  </Link>
                  {!isAi && t.bot != null && (
                    <Link className="fx-mini" href={`/dashboard/bots/${t.bot}`}>
                      Bot &amp; decisions
                    </Link>
                  )}
                  <button
                    type="button"
                    className="fx-mini dgr"
                    disabled={busyId === t.id}
                    onClick={() => setConfirmDelete(t)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <Dialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          tone="amber"
          labelledBy="del-trade-title"
          icon={<TrashIcon />}
          title={<span id="del-trade-title">Delete this trade?</span>}
          subtitle={
            confirmDelete
              ? `${confirmDelete.pair_name || `Pair #${confirmDelete.pair}`} · ${confirmDelete.timeframe}`
              : ""
          }
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmDelete(null)}>
                Keep it
              </button>
              <button
                className="fx-cta dgr2"
                type="button"
                disabled={busyId === confirmDelete?.id}
                onClick={doDelete}
              >
                Delete trade
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The setup is removed for good. If the trade is running it is stopped first — an open
            position is not closed automatically, so close it from the exchange if you need to.
          </p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default TradesPage;
