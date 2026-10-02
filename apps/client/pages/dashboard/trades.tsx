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
import { TradeV2, TradeV2Status } from "../../types/tradingV2";
import { BalanceProp } from "../../types/user";
import { indicatorChips } from "../../lib/tradingV2Indicators";

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
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listTrades(axiosToken));
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
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

  const runningCount = trades.filter((t) => t.status === "RUNNING").length;
  const capitalAllocated = trades.reduce((s, t) => s + (parseFloat(t.allocated_amount) || 0), 0);
  const balanceKnown = !!balance && balance.length > 0;
  const freeToAllocate = balanceKnown ? Math.max(0, totalBalance - capitalAllocated) : null;
  const allocPct = balanceKnown && totalBalance > 0 ? Math.min(100, (capitalAllocated / totalBalance) * 100) : 0;

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

        {/* ---- performance overview — preview only, not wired ---- */}
        <section className="fx-mom rv d2" style={{ marginTop: "clamp(20px,2.6vw,30px)", paddingTop: "22px" }}>
          <div className="fx-sh">
            <h2>
              How your trades are doing <span className="sub2">preview</span>
            </h2>
            <span className="fx-preview">
              <i>◔</i> Metrics arrive when the backend exposes them
            </span>
          </div>
          <div className="fx-cap2" style={{ marginTop: 0 }}>
            <div className="fx-cp">
              <span>Capital allocated</span>
              <b>{dollarFormat(capitalAllocated)}</b>
              <i>across {trades.length} trades</i>
            </div>
            <div className="fx-cp">
              <span>In open positions</span>
              <b className="mut2">—</b>
              <i>not available yet</i>
            </div>
            <div className="fx-cp">
              <span>Free to allocate</span>
              <b className={freeToAllocate == null ? "mut2" : undefined}>
                {freeToAllocate == null ? "—" : dollarFormat(freeToAllocate)}
              </b>
              <i>{freeToAllocate == null ? "needs a balance endpoint" : "across your exchanges"}</i>
            </div>
            <div className="fx-cp">
              <span>Net · 30d</span>
              <b className="mut2">—</b>
              <i>needs a P&amp;L endpoint</i>
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
                    <span>P&amp;L · 30d</span>
                    <b className="mut2">—</b>
                    <em>not available yet</em>
                  </div>
                  <div className="fx-tm2">
                    <span>Indicators sent</span>
                    <div className="fx-ind2">
                      {chips.length ? (
                        chips.map((c) => (
                          <span className="fx-ip" key={c}>
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="fx-ip">none</span>
                      )}
                    </div>
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
