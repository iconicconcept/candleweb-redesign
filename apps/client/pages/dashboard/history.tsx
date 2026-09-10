import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";

/* candleweb-history-focus.html — DESIGN ONLY.
   Every figure needs a closed-trades endpoint, which does not exist yet
   (GET /trading_v2/trades/history/ or similar). The per-bot strip lists the
   user's real bots; everything else is a placeholder behind a preview ribbon.
   Tracked in DASHBOARD_ENDPOINTS.md §11. */

const FILTERS = ["All bots", "All trades", "All pairs", "All exits", "Last 30 days"];

const DashboardHistoryPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots } = useSelector((state: RootState) => state.tradingV2);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
  }, [axiosToken, dispatch]);

  return (
    <>
      <Head>
        <title>History | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="history">
        <TopBar
          crumb="Dashboard / History"
          title="History"
          subtitle="Every order every bot has placed and closed."
        />

        <div className="fx-inuse" style={{ marginTop: "clamp(16px,2vw,24px)" }}>
          <i>◔</i>
          <p>
            <b>This page is a preview.</b> A closed-trades endpoint doesn&rsquo;t exist yet, so
            there is nothing to list. The layout below is what it will look like — every figure is
            a placeholder until the backend ships it.
          </p>
        </div>

        {/* summary — design only */}
        <div className="fx-summary rv" style={{ marginTop: "clamp(16px,2vw,22px)" }}>
          <div className="fx-sm">
            <span>Closed trades</span>
            <b className="mut2">—</b>
            <i>last 30 days</i>
          </div>
          <div className="fx-sm">
            <span>Win rate</span>
            <b className="mut2">—</b>
            <i>won · lost</i>
          </div>
          <div className="fx-sm">
            <span>Average win</span>
            <b className="mut2">—</b>
            <i>vs. average loss</i>
          </div>
          <div className="fx-sm">
            <span>Net · 30d</span>
            <b className="mut2">—</b>
            <i>needs a P&amp;L endpoint</i>
          </div>
          <div className="fx-sm">
            <span>Best day</span>
            <b className="mut2">—</b>
            <i>—</i>
          </div>
        </div>

        {/* filters — decorative */}
        <div className="fx-filters rv">
          {FILTERS.map((f, i) => (
            <button key={f} type="button" className={`fx-fs ${i === 0 ? "act2" : ""}`} disabled>
              {f}
            </button>
          ))}
          <button type="button" className="fx-exp" disabled>
            Export
          </button>
        </div>

        {/* per-bot strip — bots are real, the numbers aren't */}
        <div className="fx-bbar rv">
          {bots.length === 0 ? (
            <div className="fx-bb">
              <div className="bt2">
                <b>No bots yet</b>
              </div>
              <div className="bnums">
                <span>
                  <Link href="/dashboard/bots/new" style={{ color: "var(--fx-teal2)" }}>
                    Add a bot
                  </Link>
                </span>
              </div>
            </div>
          ) : (
            bots.slice(0, 4).map((b) => (
              <div className="fx-bb" key={b.id}>
                <div className="bt2">
                  <i style={{ background: b.status === "FAILING" ? "var(--fx-rose)" : undefined }} />
                  <b>{b.name}</b>
                </div>
                <div className="bnums">
                  <span>
                    Closed
                    <b className="mut2">—</b>
                  </span>
                  <span>
                    Win rate
                    <b className="mut2">—</b>
                  </span>
                  <span>
                    Net
                    <b className="mut2">—</b>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* day groups — design only */}
        <div className="fx-day">
          <h3>
            When trades close <span className="dn4">· they group by day here</span>
          </h3>
          <span className="dt2 mut2">—</span>
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div className="fx-hrow" key={i}>
            <div className="fx-tm">—</div>
            <div className="fx-hp">
              <b style={{ color: "var(--fx-t3)" }}>—</b>
            </div>
            <div className="fx-hmeta">
              <em>bot</em> · trade name
              <br />
              entry → exit · held —
            </div>
            <div className="fx-exit">Exit reason</div>
            <div className="fx-hres">
              <span className="mut2">—</span>
              <small>—</small>
            </div>
          </div>
        ))}

        <div className="fx-more2">
          <span>Showing 0 of 0</span>
          <div className="fx-pgb">
            <button type="button" disabled>
              ‹
            </button>
            <button type="button" disabled>
              ›
            </button>
          </div>
        </div>

        <p className="fx-hint" style={{ marginTop: "18px" }}>
          Each row will show the pair, the bot, entry and exit prices, how long it was held, why it
          closed (stop hit / trailing stop / bot closed) and the result. The frontend is ready — it
          needs <code>GET /trading_v2/trades/history/</code> (or similar) with closed positions and
          their P&amp;L.
        </p>
      </DashboardShell>
    </>
  );
};

export default DashboardHistoryPage;
