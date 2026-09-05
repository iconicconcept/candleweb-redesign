import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import referralService from "../../services/referralService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import useEthereum from "../../lib/hooks/useEthereum";
import useCopyToClipboard from "../../lib/hooks/useClipboard";
import { isValidEthereumAddress } from "../../utils/ethers";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { success, warning } from "../../components/alert/Toast";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Loader from "../../components/Loader";
import { SearchIcon } from "../../components/dashboard/focus/icons";

type Filter = "all" | "earning" | "waiting";

interface ReferralRow {
  referred_id: string;
  created_at?: Date | string;
  reward_amount: string;
  is_claimed?: boolean;
  kind: "earning" | "waiting";
}

const rowInitials = (id: string) => (id || "??").replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();

export default function InviteDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);
  const { copyToClipboard } = useCopyToClipboard();
  const { claimReferralReward, loading: chainLoading } = useEthereum();

  const { userReferralRecord, subscribedReferrals, unsubscribedReferrals } = useSelector(
    (state: RootState) => state.referral,
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token || null;
    dispatch(referralService.getUserReferral(axiosToken));
    dispatch(referralService.getSubscribedReferral(axiosToken));
    dispatch(referralService.getUnsubscribedReferral(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const walletReady = !!user?.wallet_address && isValidEthereumAddress(user.wallet_address);
  const referralLink = `https://www.candleweb.io/register?referral=${user?.username ?? ""}`;

  const totalEarning = userReferralRecord?.total_earning ?? 0;
  const claimedEarning = userReferralRecord?.claimed_earning ?? 0;
  const unclaimedEarning = userReferralRecord?.unclaimed_earning ?? 0;
  const referralCount = userReferralRecord?.referral_count ?? 0;

  const rows = useMemo<ReferralRow[]>(() => {
    const earning: ReferralRow[] = (subscribedReferrals?.results ?? []).map((r) => ({
      referred_id: r.referred_id ?? "",
      created_at: r.created_at,
      reward_amount: r.reward_amount ?? "0",
      is_claimed: r.is_claimed,
      kind: "earning",
    }));
    const waiting: ReferralRow[] = (unsubscribedReferrals?.results ?? []).map((r) => ({
      referred_id: r.referred_id ?? "",
      created_at: r.created_at,
      reward_amount: r.reward_amount ?? "0",
      is_claimed: r.is_claimed,
      kind: "waiting",
    }));
    return [...earning, ...waiting];
  }, [subscribedReferrals, unsubscribedReferrals]);

  const counts = {
    all: rows.length,
    earning: rows.filter((r) => r.kind === "earning").length,
    waiting: rows.filter((r) => r.kind === "waiting").length,
  };

  const visible = rows.filter((r) => {
    if (filter !== "all" && r.kind !== filter) return false;
    if (query && !r.referred_id.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const copyLink = async () => {
    if (!walletReady) {
      warning("Add a wallet address in Settings before sharing — the link only earns once it's set.");
      return;
    }
    const ok = await copyToClipboard(referralLink);
    if (ok) {
      setCopied(true);
      success("Referral link copied");
      setTimeout(() => setCopied(false), 1900);
    } else {
      warning("Couldn't copy — select the link and copy it by hand.");
    }
  };

  const share = (network: "whatsapp" | "telegram" | "x" | "email") => {
    if (!walletReady) {
      warning("Add a wallet address in Settings first.");
      return;
    }
    const text = `Join me on Candleweb — AI-assisted crypto trading. ${referralLink}`;
    const urls: Record<typeof network, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Candleweb")}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent("Join me on Candleweb")}&body=${encodeURIComponent(text)}`,
    };
    window.open(urls[network], "_blank", "noopener,noreferrer");
  };

  const claim = async (referredId: string) => {
    if (!referredId || claimingId) return;
    if (!walletReady) {
      warning("Connect a wallet in Settings to receive referral payouts.");
      return;
    }
    setClaimingId(referredId);
    try {
      await claimReferralReward(referredId);
      dispatch(referralService.getUserReferral(axiosToken));
      dispatch(referralService.getSubscribedReferral(axiosToken));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Invite & earn | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {chainLoading && <Loader />}

      <DashboardShell active="invite">
        <TopBar
          crumb="Dashboard / Invite & earn"
          title="Invite & earn"
          subtitle="You keep a share of what each friend pays for their Candleweb plan, every month they stay subscribed. Nothing is taken from their deposits and nothing from their trades."
        />

        <div className={`fx-claimbar rv d1 ${unclaimedEarning <= 0 ? "empty9" : ""}`}>
          <div className="cb2">
            <em>Unclaimed earnings</em>
            <b>{dollarFormat(unclaimedEarning)}</b>
            <span>
              {unclaimedEarning > 0
                ? "Claim each referral's reward from the list below — payouts settle on-chain to your wallet."
                : "Nothing waiting. Your share lands here the day a friend pays for their plan."}
            </span>
          </div>
          <button
            className="fx-cta main2"
            type="button"
            disabled={unclaimedEarning <= 0}
            onClick={() => setFilter("earning")}
          >
            {unclaimedEarning > 0 ? "Show earning referrals" : "Nothing to claim"}
          </button>
        </div>

        <div className="fx-cap2 rv d2">
          <div className="fx-cp">
            <span>Earned all time</span>
            <b className="up6">{dollarFormat(totalEarning)}</b>
            <i>across every referral</i>
          </div>
          <div className="fx-cp">
            <span>Paid out</span>
            <b>{dollarFormat(claimedEarning)}</b>
            <i>claimed to your wallet</i>
          </div>
          <div className="fx-cp">
            <span>Unclaimed</span>
            <b className="am6">{dollarFormat(unclaimedEarning)}</b>
            <i>ready to claim</i>
          </div>
          <div className="fx-cp">
            <span>Friends joined</span>
            <b>{referralCount}</b>
            <i>{counts.earning} on a paid plan</i>
          </div>
        </div>

        <div className="fx-blk">
          <div className="fx-sh">
            <h2>Share your link</h2>
            <span className="sub2">Anyone who signs up through it is tagged to you.</span>
          </div>
          {!walletReady && (
            <p className="fx-hint" style={{ marginBottom: 12 }}>
              <b>Add a wallet address in Settings first.</b> Referral payouts settle on-chain, so the
              link only starts earning once your wallet is set.
            </p>
          )}
          <div className="fx-lk">
            <code>{referralLink}</code>
            <button
              className={`fx-mini ${copied ? "copied2" : "go"}`}
              type="button"
              onClick={copyLink}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="fx-sh2">
            <button className="fx-sb" type="button" onClick={() => share("whatsapp")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.5 11.6a8.5 8.5 0 01-12.4 7.5L3.5 20.5l1.5-4.4a8.5 8.5 0 1115.5-4.5z" />
                <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
              </svg>
              WhatsApp
            </button>
            <button className="fx-sb" type="button" onClick={() => share("telegram")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 4L2.8 11.2l5.3 1.7L20 5.4l-9.2 9.1.4 5 2.8-3.6 4.2 3z" />
              </svg>
              Telegram
            </button>
            <button className="fx-sb" type="button" onClick={() => share("x")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
              X
            </button>
            <button className="fx-sb" type="button" onClick={() => share("email")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
                <path d="M3.5 7l8.5 6 8.5-6" />
              </svg>
              Email
            </button>
          </div>
        </div>

        <div className="fx-blk">
          <div className="fx-sh">
            <h2>Who joined</h2>
            <span className="sub2">{rows.length} through your link.</span>
          </div>
          <div className="fx-nctl">
            <div className="fx-search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search by username"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="fx-tabs2">
              {(["all", "earning", "waiting"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`fx-tab2 ${filter === f ? "on" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "earning" ? "Earning" : "Not subscribed"}{" "}
                  <em>{counts[f]}</em>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            {visible.length === 0 ? (
              <div className="fx-nempty2">
                <i>
                  <SearchIcon />
                </i>
                <b>{query ? "Nobody matches that" : "Nobody here yet"}</b>
                <p>
                  {query
                    ? "Try a shorter search, or switch back to All."
                    : filter === "earning"
                      ? "A friend has to be on a paid plan before anything is owed to you."
                      : "Share your link and whoever signs up will show up here."}
                </p>
              </div>
            ) : (
              visible.map((r, i) => {
                const amount = parseFloat(r.reward_amount || "0");
                const canClaim = r.kind === "earning" && !r.is_claimed && amount > 0;
                return (
                  <div
                    className={`fx-rf ${r.kind === "earning" ? "earn8" : "wait8"}`}
                    key={`${r.referred_id}-${i}`}
                  >
                    <span className={`fx-av3 ${r.kind === "earning" ? "g2" : ""}`}>
                      {rowInitials(r.referred_id)}
                    </span>
                    <div className="fx-rfb">
                      <b>{r.referred_id || "Unknown"}</b>
                      <div className="fx-rfm">
                        <span className={`fx-st2 ${r.kind === "earning" ? "earn8" : "new8"}`}>
                          {r.kind === "earning"
                            ? r.is_claimed
                              ? "Claimed"
                              : "Earning"
                            : "No plan yet"}
                        </span>
                        {r.created_at && (
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className={`fx-amt2 ${amount > 0 ? "" : "z8"}`}>
                      <b>{dollarFormat(amount)}</b>
                      {canClaim ? (
                        <button
                          className="fx-mini claim"
                          type="button"
                          disabled={claimingId === r.referred_id}
                          onClick={() => claim(r.referred_id)}
                        >
                          {claimingId === r.referred_id ? "Claiming…" : "Claim"}
                        </button>
                      ) : (
                        <em>{r.is_claimed ? "Claimed" : "All time"}</em>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>What this is, and what it isn&rsquo;t.</b> You are paid out of the subscription fee your
            friend pays us — we keep less, you keep the rest. There is no second level and nothing you
            earn is funded by anybody&rsquo;s deposit. Accounts you make yourself, or friends who never
            fund and trade with their own money, earn nothing and are removed when we find them.
          </p>
        </div>
      </DashboardShell>
    </>
  );
}
