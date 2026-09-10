import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";

/* Bot review / recommendation — DESIGN ONLY.
   Candleweb reads a bot's stored prompt alongside its decision history and
   the market data each decision saw, then points at the rule that is
   costing money. No endpoint exists for any of it yet (decision history,
   the analysis, or the suggested prompt edits). Every value here is a
   placeholder behind a `.fx-preview` ribbon. Tracked in
   DASHBOARD_ENDPOINTS.md §10 — wire when the backend ships it. */

const PLACEHOLDER_FINDINGS_GOOD = [
  "Entries after a clean higher-low held longer than average",
  "Position sizing stayed inside the trade's risk cap on every call",
  "No trades opened into the last candle before a funding reset",
];

const PLACEHOLDER_FINDINGS_BAD = [
  "Selling the first red candle after a run — most reversed within 3 candles",
  "Ignoring the volume filter the prompt describes on lower timeframes",
  "Holding through the stop level on 'hold' calls instead of closing",
];

const BotReviewPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots } = useSelector((state: RootState) => state.tradingV2);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && !Number.isNaN(id);
  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);
  const fetchedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    if (!bot && fetchedRef.current !== id) {
      fetchedRef.current = id;
      dispatch(tradingV2Service.getBot({ api: axiosToken, id: id as number }));
    }
  }, [valid, id, bot, axiosToken, dispatch]);

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
              <a href="/dashboard/bots">‹ My bots</a> /{" "}
              {bot ? <a href={`/dashboard/bots/${bot.id}`}>{bot.name}</a> : "Bot"} / Review
            </>
          }
          title={bot ? `${bot.name} · review` : "Bot review"}
          subtitle="Candleweb reads the prompt against what the bot actually did, and tells you which rule to change."
        />

        {!bot && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {valid ? "Loading this bot…" : "Bot not found."}
          </p>
        )}

        {bot && (
          <>
            <div className="fx-inuse" style={{ marginTop: "clamp(16px,2vw,24px)" }}>
              <i>◔</i>
              <p>
                <b>This page is a preview.</b> Review needs a decision history to read — no endpoint
                exposes one yet. The layout below is what it will look like; every figure is a
                placeholder until the backend ships it.
              </p>
            </div>

            {/* verdict */}
            <section
              className="fx-mom rv d1"
              style={{ marginTop: "clamp(18px,2.4vw,26px)", paddingTop: "22px" }}
            >
              <div className="fx-sh">
                <h2>
                  Verdict <span className="sub2">preview</span>
                </h2>
                <span className="fx-preview">
                  <i>◔</i> Generated after ~30 decisions on record
                </span>
              </div>
              <div className="fx-cap2" style={{ marginTop: 0 }}>
                <div className="fx-cp">
                  <span>Grade</span>
                  <b className="mut2">—</b>
                  <i>prompt vs. outcomes</i>
                </div>
                <div className="fx-cp">
                  <span>Decisions read</span>
                  <b className="mut2">—</b>
                  <i>needs a decisions endpoint</i>
                </div>
                <div className="fx-cp">
                  <span>Follows its own prompt</span>
                  <b className="mut2">—</b>
                  <i>consistency score</i>
                </div>
                <div className="fx-cp">
                  <span>Est. cost of the top issue</span>
                  <b className="mut2">—</b>
                  <i>over the window</i>
                </div>
              </div>
            </section>

            {/* findings */}
            <section className="fx-sec rv d2">
              <div className="fx-sh">
                <h2>What review would flag</h2>
                <span className="fx-preview">
                  <i>◔</i> Example findings — not from your data
                </span>
              </div>
              <div className="fx-find">
                <div className="fx-findcol ok">
                  <h4>Working</h4>
                  <ul>
                    {PLACEHOLDER_FINDINGS_GOOD.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="fx-findcol bad">
                  <h4>Costing you</h4>
                  <ul>
                    {PLACEHOLDER_FINDINGS_BAD.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* suggested prompt change */}
            <section className="fx-sec rv d3">
              <div className="fx-rv2">
                <div className="rh2">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <b>Suggested prompt change</b>
                </div>
                <p>
                  Review proposes a specific edit to the rule it thinks is hurting you, with the
                  decisions that back it up. You copy it into your workflow — Candleweb never edits
                  your bot for you.
                </p>
                <div className="fx-eg2">
                  {bot.prompt
                    ? "— diff against your stored prompt appears here —"
                    : "— add a prompt in settings so review has something to compare against —"}
                </div>
              </div>
            </section>

            <section className="fx-sec rv d3">
              <div className="fx-actions">
                <Link className="fx-cta ghost2" href={`/dashboard/bots/${bot.id}`}>
                  Back to overview
                </Link>
                <button className="fx-cta main2" type="button" disabled>
                  Run review — not available yet
                </button>
              </div>
              <p className="fx-note3">
                Review turns on automatically once this bot has enough decisions on record and the
                analysis endpoint is live.
              </p>
            </section>
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default BotReviewPage;
