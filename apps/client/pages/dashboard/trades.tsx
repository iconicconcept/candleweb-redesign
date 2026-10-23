import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { PortfolioMetricsV2, TradeMetricsV2, TradeV2, TradeV2Status } from "../../types/tradingV2";
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
} from "../../lib/tradingV2Metrics";

const STATUS_META: Record<TradeV2Status, { label: string; cls: string }> = {
  RUNNING: { label: "Running", cls: "on5" },
  PAUSED: { label: "Paused", cls: "off6" },
  ERROR: { label: "Not responding", cls: "bad5" },
};

const DIRECTION_LABEL: Record<string, string> = {
  BOTH: "Long & short",
  LONG: "Long only",
  SHORT: "Short only",
};

type Filter = "all" | "running" | "paused";

const IND_LIMIT = 10;

/* Each row costs one `GET /trading_v2/trades/{id}/metrics/`. A long list is
   capped rather than opening the page on a request per trade. */
const PER_TRADE_METRIC_CAP = 20;

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

const TradesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { trades, tradesLoading: isLoading, tradesLoaded: loaded } = useSelector(
    (state: RootState) => state.tradingV2,
  );
  const { balance } = useSelector((state: RootState) => state.user);

  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TradeV2 | null>(null);

  /* Account-wide money — `GET /trading_v2/metrics/`. Local state: nothing
     else on the page reads it, and a stale PnL is worse than no PnL. */
  const [metrics, setMetrics] = useState<PortfolioMetricsV2 | null>(null);
  const fetchedRef = useRef(false);

  /* What is actually deployed right now — `GET /positions/?status=open`.
     This is money on the venue, which is not the same as allocated capital:
     an allocation is a ceiling, a position is a fill. Valued at the mark. */
  const {
    rows: positions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open" });
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

  /* Per-row "PnL · 30D" — one `GET /trading_v2/trades/{id}/metrics/` per row
     shown. These are NEVER summed into the band above: positions match by
     venue and symbol, so two trades on one pair and account report the same
     money, and adding the rows would count it twice. The band reads the
     account-wide endpoint, which has already resolved that overlap. */
  const [rowMetrics, setRowMetrics] = useState<Record<number, TradeMetricsV2 | null>>({});
  const [rowsAsked, setRowsAsked] = useState(false);
  const rowsRef = useRef<string>("");

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listTrades(axiosToken));
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    /* The band's "Net · 30d" is the PnL across EVERY trade, so it comes from
       the account-wide `GET /trading_v2/metrics/` rather than from summing
       the rows. Summing per-trade metrics would double-count: positions match
       by venue and symbol, so two trades on one pair and account report the
       same positions. The portfolio endpoint has already resolved that. */
    tradingV2Service
      .getPortfolioMetrics(axiosToken, { window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );

  const shown = useMemo(() => {
    if (filter === "running") return trades.filter((t) => t.status === "RUNNING");
    if (filter === "paused") return trades.filter((t) => t.status !== "RUNNING");
    return trades;
  }, [trades, filter]);

  /* The exact ids the effect below will ask for, shared with the render so
     the two can never disagree about which rows were requested — a row left
     out of the capped set must say so, not sit on "reading…" forever. */
  const metricIds = useMemo(
    () => shown.slice(0, PER_TRADE_METRIC_CAP).map((t) => t.id),
    [shown],
  );

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const key = metricIds.join(",");
    if (rowsRef.current === key) return;
    rowsRef.current = key;
    if (!metricIds.length) {
      setRowMetrics({});
      setRowsAsked(true);
      return;
    }
    let live = true;
    let landed = false;
    Promise.all(
      metricIds.map((id) =>
        tradingV2Service
          .getTradeMetrics(axiosToken, id, { window_days: DEFAULT_WINDOW_DAYS })
          .then((m) => [id, m] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((pairs) => {
      if (!live) return;
      const next: Record<number, TradeMetricsV2 | null> = {};
      pairs.forEach(([id, m]) => {
        next[id] = m;
      });
      landed = true;
      setRowMetrics(next);
      setRowsAsked(true);
    });
    return () => {
      live = false;
      /* If the effect re-runs before the answer lands — a new `trades`
         array from Redux, or a filter click, is enough, since both rebuild
         `metricIds` — this cleanup discards the reply. The guard above must
         then be released, or the next run skips the request as "already
         asked" while its only result was just thrown away, and the cell
         reads "reading…" until a reload. Released only when nothing landed,
         so a completed fetch is not re-issued. */
      if (!landed && rowsRef.current === key) rowsRef.current = "";
    };
  }, [axiosToken, metricIds]);

  const runningCount = trades.filter((t) => t.status === "RUNNING").length;
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
      if (t.status === "RUNNING") {
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

          {shown.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.PAUSED;
            const running = t.status === "RUNNING";
            const isAi = t.decider_type === "CANDLE_AI";
            const decider = isAi ? "CandleAI" : t.bot_name || "Own bot";
            const chips = indicatorChips(t.indicators);
            /* This row's own PnL. A PnL cell is a percentage over an amount
               per the design, so `pnlCellParts` leads with the percentage and
               drops to the money when the response carries no percentage. */
            const rowAsked = metricIds.includes(t.id);
            const rm = rowMetrics[t.id];
            const rowPnl = pnlCellParts(
              metricRead(rm, REALISED_PCT_FIELDS, realisedPct(rm)),
              metricRead(rm, REALISED_FIELDS, realisedPnl(rm)),
            );
            return (
              <div
                key={t.id}
                className={`fx-tcard ${t.status === "ERROR" ? "hot" : ""} ${!running && t.status !== "ERROR" ? "off5" : ""}`}
              >
                <div className="fx-tl1">
                  <span className="tn2">{t.pair_name || `Pair #${t.pair}`}</span>
                  <span className={`fx-run2 ${meta.cls}`}>{meta.label}</span>
                  <span className={`fx-byb ${isAi ? "ai2" : ""}`}>● {decider}</span>
                  <span className="tsp2">
                    {t.timeframe} · {t.exchange_name || `Account #${t.exchange_account}`}
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
                  <div className="fx-tm2">
                    <span>Direction</span>
                    <b>{DIRECTION_LABEL[t.direction] || t.direction}</b>
                    <em>{t.trailing_stop ? "trailing stop" : "fixed stop"}</em>
                  </div>
                  <div className="fx-tm2">
                    <span className="fx-kase">PnL · 30D</span>
                    <b className={rowAsked && rowsAsked ? toneClass(rowPnl.tone, "up5", "dn5") : "mut2"}>
                      {!rowAsked || !rowsAsked ? "—" : rowPnl.figure}
                    </b>
                    <em>
                      {!rowAsked
                        ? `beyond the first ${PER_TRADE_METRIC_CAP} rows`
                        : !rowsAsked
                          ? "reading…"
                          : rowPnl.caption}
                    </em>
                  </div>
                  <div className="fx-tm2 wide2">
                    <span>Indicators sent</span>
                    <IndicatorChips chips={chips} />
                  </div>
                </div>

                {t.status === "ERROR" && (
                  <div className="fx-flat2">
                    <b>Attention</b> · this trade is in an error state — check the bot and its
                    endpoint.
                  </div>
                )}

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
