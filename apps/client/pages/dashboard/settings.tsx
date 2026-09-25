import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { maskString, maskWalletAddress } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import userService from "../../services/userService";
import exchangeServices from "../../services/exchangeService";
import tradeService from "../../services/tradeService";
import subscriptionService from "../../services/subscriptionService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import useEthereum from "../../lib/hooks/useEthereum";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { getFirstAndLastLetter } from "../../utils/constants";
import { maskEmailUsername } from "../../utils/emailValidate";
import { success, error, warning } from "../../components/alert/Toast";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import {
  setUserRecord,
  setUnsubscribedReferral,
  setSubscribedReferral,
} from "../../redux/slices/referralSlice";
import {
  setSubscription,
  setSubscriptionHistory,
  setCurrentPlan,
} from "../../redux/slices/subscriptionSlice";
import {
  setActiveTrade,
  setPortfolioTrade,
  setYearList,
  setYearAnalysis,
} from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import {
  CheckIcon,
  WarnIcon,
  CopyIcon,
  PlusIcon,
} from "../../components/dashboard/focus/icons";

const CONFIG_IPS = ["65.21.47.124", "107.155.122.236", "209.182.234.182"];

/* Which chain the address on file lives on — display/validation only. The
   API has nowhere to store this yet (BACKEND_API_REQUESTS.md: "wallet-network
   selector" is on the list of things not built on the backend). */
const NETWORKS = ["USDT · TRC-20", "USDT · ERC-20", "USDC · ERC-20", "BTC", "ETH"];

/* Same shape check as the mockup — confirms the string at least looks like
   an address for one of the common chains, not that it's real. */
function addrShapeOK(v: string) {
  return /^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33}|bc1[a-z0-9]{25,50})$/.test(v.trim());
}

export default function SettingsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user, setUser, removeUser } = useUserStore((state) => state);
  const { connectWallet } = useEthereum();

  const { exchanges, exchangeRecord } = useSelector((state: RootState) => state.exchange);

  const [isLive, setIsLive] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [manualAddress, setManualAddress] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setIsLive(!!user?.is_live_mode);
  }, [user?.is_live_mode]);

  useEffect(() => {
    if (!user?.email) dispatch(userService.getUser(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token || null;

    dispatch(exchangeServices.getExchangeRecords(axiosToken));
    if (exchanges.length < 1) dispatch(exchangeServices.getExchanges());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const initials = getFirstAndLastLetter(user?.username ?? "CW");
  const activeExchanges = exchangeRecord.filter((e) => e.is_active).length;
  const walletSet = !!user?.wallet_address;

  const exchangeName = (raw?: string) => {
    if (!raw) return "Exchange";
    const match = exchanges.find((x) => String(x.id) === String(raw));
    return match?.name ?? raw;
  };

  const runModeSwitch = (next: boolean) => {
    setModeBusy(true);
    dispatch(userService.updateUserDemo({ is_live: next, api: axiosToken }))
      .then(async (dt: any) => {
        setUser({ ...dt.payload, access_token: user?.access_token });
        await dispatch(exchangeServices.getExchangeRecords(axiosToken));
        success(next ? "Live mode on" : "Back to demo");
        dispatch(setActiveTrade([]));
        dispatch(setBalance(""));
        dispatch(setPortfolioTrade({}));
        dispatch(userService.getBalance(axiosToken));
        dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "6months" }));
        dispatch(tradeService.getTradePortfolio(axiosToken));
        dispatch(tradeService.getTradePairList(axiosToken));
        dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken));
        setIsLive(next);
      })
      .finally(() => setModeBusy(false));
  };

  const pickMode = (next: boolean) => {
    if (next === isLive || modeBusy) return;
    if (next) {
      setConfirmLive(true);
      return;
    }
    runModeSwitch(false);
  };

  const connectWalletAddress = async () => {
    if (walletBusy) return;
    setWalletBusy(true);
    try {
      const res = await connectWallet();
      if (!res) return;
      const value: any = await dispatch(
        userService.updateWalletAddress({
          wallet_address: res.walletAddress,
          password: res.signMessage,
          api: axiosToken,
        }),
      );
      if (value?.error) return;
      setUser({ ...value.payload, access_token: user?.access_token });
      success("Withdrawal wallet updated");
    } finally {
      setWalletBusy(false);
    }
  };

  /* Pasted address, no wallet signature — the API's password field is
     optional, but /user/update-wallet-password/ is documented as
     "connect-wallet only", so this is a real call whose acceptance is up
     to the backend, not something to fake client-side either way. */
  const saveManualAddress = async () => {
    if (walletBusy || !addrShapeOK(manualAddress)) return;
    setWalletBusy(true);
    try {
      const value: any = await dispatch(
        userService.updateWalletAddress({
          wallet_address: manualAddress.trim(),
          api: axiosToken,
        }),
      );
      if (value?.error) {
        error(typeof value.payload === "string" ? value.payload : "Couldn't save that address.");
        return;
      }
      setUser({ ...value.payload, access_token: user?.access_token });
      setManualAddress("");
      success("Withdrawal address saved");
    } finally {
      setWalletBusy(false);
    }
  };

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp((v) => (v === ip ? null : v)), 1500);
    } catch {
      error("Couldn't copy — select it by hand");
    }
  };

  const confirmRemoveExchange = () => {
    if (!removeTarget) return;
    dispatch(exchangeServices.deleteExchange({ api: axiosToken, id: removeTarget.id })).then(() => {
      dispatch(exchangeServices.getExchangeRecords(axiosToken));
      dispatch(userService.getBalance(axiosToken));
      success(`${exchangeName(removeTarget.name)} removed`);
      setRemoveTarget(null);
    });
  };

  const confirmDeleteAccount = () => {
    dispatch(userService.deleteUser(axiosToken)).then(() => {
      removeUser();
      dispatch(setSubscription([]));
      dispatch(setExchangeRecord([]));
      dispatch(setNotification({}));
      dispatch(setUserRecord({}));
      dispatch(setUnsubscribedReferral({}));
      dispatch(setSubscribedReferral({}));
      dispatch(setSubscriptionHistory([]));
      dispatch(setActiveTrade([]));
      dispatch(setPortfolioTrade({}));
      dispatch(setYearList({}));
      dispatch(setYearAnalysis([]));
      dispatch(setCurrentPlan({}));
      dispatch(setBalance(""));
      router.push("/");
    });
  };

  return (
    <>
      <Head>
        <title>Settings | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="settings">
        <TopBar
          crumb="Dashboard / Settings"
          title="Settings"
          subtitle="Your account, where payouts go, and which exchanges Candleweb may place orders on."
        />

        <div className="fx-cap2 rv d1">
          <div className="fx-cp">
            <span>Trading mode</span>
            <b className={isLive ? "am6" : ""} style={{ fontSize: 22 }}>
              {isLive ? "Live" : "Demo"}
            </b>
            <i>{isLive ? "real orders on real money" : "paper fills at live prices"}</i>
          </div>
          <div className="fx-cp">
            <span>Exchanges active</span>
            <b>{activeExchanges}</b>
            <i>of {exchangeRecord.length} connected</i>
          </div>
          <div className="fx-cp">
            <span>Withdrawal address</span>
            <b style={{ fontSize: 22 }}>{walletSet ? "Set" : "Not set"}</b>
            <i>
              {walletSet
                ? maskWalletAddress(user?.wallet_address ?? "")
                : "payouts have nowhere to go"}
            </i>
          </div>
          <div className="fx-cp">
            <span>Account safety</span>
            <b className="mut2">—</b>
            <i>needs a permissions endpoint</i>
          </div>
        </div>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Account safety</h2>
            <span className="fx-preview">
              <i>◔</i> Scoring needs a permissions endpoint
            </span>
          </div>
          <p className="fx-hint" style={{ marginBottom: walletSet ? 0 : 16 }}>
            Candleweb can&rsquo;t yet read back which permissions your exchange keys actually carry
            — whether one can withdraw, or is locked to our IP addresses — so it can&rsquo;t score
            your setup the way the design calls for. What it can tell you for certain:{" "}
            {walletSet
              ? "you have a withdrawal address on file."
              : "you don’t have a withdrawal address on file yet."}
          </p>
          {!walletSet && (
            <p className="fx-warn2">
              <em>●</em>
              <span>Add one below — without it, there&rsquo;s nowhere for a payout to go.</span>
            </p>
          )}
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Profile</h2>
            <span className="sub2">Your username and email.</span>
          </div>
          <div className="fx-pcard">
            <div className="fx-pbanner" />
            <div className="fx-phead">
              <span className="fx-pav">{initials}</span>
              <div className="fx-pwho">
                <b>{user?.username ?? "Your account"}</b>
                <span>{user?.email ? maskEmailUsername(user.email) : maskWalletAddress(user?.wallet_address ?? "")}</span>
              </div>
            </div>
            <div className="fx-fields">
              <div className="fx-frow">
                <div className="fx-fk">
                  <em>Username</em>
                  <b>{user?.username ?? "—"}</b>
                </div>
                <button
                  className="fx-mini"
                  type="button"
                  onClick={() =>
                    warning("Changing your username isn't available yet — it needs a profile update endpoint.")
                  }
                >
                  Edit
                </button>
              </div>
              <div className="fx-frow">
                <div className="fx-fk">
                  <em>Email</em>
                  <b>
                    {user?.email ? maskEmailUsername(user.email) : "—"}
                    {user?.email && <span className="fx-vf">Verified</span>}
                  </b>
                </div>
                <button
                  className="fx-mini"
                  type="button"
                  onClick={() =>
                    warning("Changing your email isn't available yet — it needs a profile update endpoint.")
                  }
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Trading mode</h2>
            <span className="sub2">Applies to every trade that doesn&rsquo;t set its own.</span>
          </div>
          <div className="fx-env" role="group" aria-label="Trading mode">
            <button
              type="button"
              className={`fx-eb ${!isLive ? "sel3" : ""}`}
              aria-pressed={!isLive}
              disabled={modeBusy}
              onClick={() => pickMode(false)}
            >
              <b>Demo</b>
              <span>Paper money, live prices</span>
            </button>
            <button
              type="button"
              className={`fx-eb live8 ${isLive ? "sel3" : ""}`}
              aria-pressed={isLive}
              disabled={modeBusy}
              onClick={() => pickMode(true)}
            >
              <b>Live</b>
              <span>Real orders, real money</span>
            </button>
          </div>
          <p className="fx-envnote">
            {isLive ? (
              <>
                <em>Every new trade places real orders on your exchange, with real money.</em>{" "}
                Trades already running keep the mode they were started in.
              </>
            ) : (
              "New trades are filled on paper at live prices. Your bots are called exactly the same way — only the fill is simulated."
            )}
          </p>
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Withdrawal address</h2>
            <span className="sub2">Where payouts go. Candleweb never moves funds on its own.</span>
          </div>
          <div className="fx-fr two2">
            <div>
              <label className="fx-fl" htmlFor="wNet">
                Network
              </label>
              <div className="fx-inp">
                <select id="wNet" value={network} onChange={(e) => setNetwork(e.target.value)}>
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <p className="fx-hint">
                Sending to the wrong network loses the funds. Nobody can reverse that, including
                us.
              </p>
            </div>
            <div>
              <label className="fx-fl" htmlFor="wAddr">
                Wallet address
              </label>
              <div className="fx-inp">
                <input
                  id="wAddr"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Paste your wallet address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </div>
              <div className="fx-key" style={{ marginTop: 9 }}>
                <button
                  className="fx-mini"
                  type="button"
                  disabled={walletBusy}
                  onClick={connectWalletAddress}
                >
                  {walletBusy ? "Waiting for wallet…" : "Connect a wallet instead"}
                </button>
                <button
                  className="fx-mini go"
                  type="button"
                  disabled={!addrShapeOK(manualAddress) || walletBusy}
                  onClick={saveManualAddress}
                >
                  Save address
                </button>
              </div>
              <p className="fx-hint">Paste the address exactly. We check the shape, not the owner.</p>
            </div>
          </div>
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Exchanges</h2>
            <Link className="fx-mini go" href="/dashboard/exchanges/new">
              <PlusIcon /> Add exchange
            </Link>
          </div>

          <div className="fx-ipbox">
            <b>Exchange configuration IPs</b>
            <p>
              For automated trading to work, your exchange key must allow these three addresses —
              and ideally nothing else. A key restricted to them is useless to anyone who steals it.
            </p>
            <div className="fx-ips">
              {CONFIG_IPS.map((ip) => (
                <button key={ip} className="fx-ipc" type="button" onClick={() => copyIp(ip)}>
                  {ip}
                  {copiedIp === ip ? <CheckIcon /> : <CopyIcon />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            {exchangeRecord.length === 0 ? (
              <p className="fx-nempty">
                <b>No exchange connected yet.</b>
              </p>
            ) : (
              exchangeRecord.map((rec) => (
                <div className="fx-xrow" key={rec.id}>
                  <span className="xl2">
                    {getFirstAndLastLetter(exchangeName(rec.supported_exchange_id))}
                  </span>
                  <div className="xn2">
                    <b>{exchangeName(rec.supported_exchange_id)}</b>
                    <span>{maskString(rec.API_KEY ?? "")}</span>
                  </div>
                  <span className={`fx-xst ${rec.is_active ? "on9" : "off9"}`}>
                    {rec.is_active ? "Active" : "Expired"}
                  </span>
                  <button
                    className="fx-mini dgr"
                    type="button"
                    onClick={() =>
                      setRemoveTarget({
                        id: String(rec.id),
                        name: rec.supported_exchange_id ?? "",
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="fx-danger">
          <div className="dtx">
            <b>Delete this account</b>
            <p>
              Removes your profile, your bots and your trade history. It does not touch your
              exchange accounts or your money — you still have to revoke the API keys yourself, on
              each exchange. Running trades stop, and open positions keep whatever stops are
              already on them.
            </p>
          </div>
          <button
            className="fx-cta dgr2"
            type="button"
            onClick={() => {
              setDeleteText("");
              setDeleteOpen(true);
            }}
          >
            Delete account
          </button>
        </div>

        <Dialog
          open={confirmLive}
          onClose={() => setConfirmLive(false)}
          tone="amber"
          icon={<WarnIcon />}
          title="Switch to live trading?"
          subtitle="Applies to every trade started from now on"
          labelledBy="live-title"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmLive(false)}>
                Stay on demo
              </button>
              <button
                className="fx-cta live6"
                type="button"
                disabled={modeBusy}
                onClick={() => {
                  setConfirmLive(false);
                  runModeSwitch(true);
                }}
              >
                Switch to live
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            New trades will place real orders on your exchange account, with real money, from the
            moment you start them. Trades already running keep the mode they were started in, and
            every limit you set — risk, order ceiling, direction — works identically.
          </p>
          <p className="fx-dwarn">You can switch back to demo at any time, and it takes effect immediately.</p>
        </Dialog>

        <Dialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          tone="amber"
          icon={<WarnIcon />}
          title={`Remove ${exchangeName(removeTarget?.name)}?`}
          subtitle="Candleweb stops seeing it immediately"
          labelledBy="remove-exchange-title"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setRemoveTarget(null)}>
                Keep it
              </button>
              <button className="fx-cta live6" type="button" onClick={confirmRemoveExchange}>
                Remove
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            Any trade pointing at this account stops placing orders, and every trade associated with
            this exchange is removed. Positions already open keep the stops on them.
          </p>
          <p className="fx-dwarn">
            Removing it here <b>does not revoke the key</b>. Delete it on the exchange as well, or it
            stays valid for whoever holds it.
          </p>
        </Dialog>

        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          tone="amber"
          icon={<WarnIcon />}
          title="Delete your account"
          subtitle="You can't reverse this action"
          labelledBy="delete-account-title"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setDeleteOpen(false)}>
                Keep my account
              </button>
              <button
                className="fx-cta live6"
                type="button"
                disabled={deleteText.trim() !== (user?.username ?? "")}
                onClick={confirmDeleteAccount}
              >
                Delete it
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            This removes your profile, bots, trades and course progress. It <b>does not</b> touch
            your money or your exchange accounts — you still have to revoke each API key yourself.
          </p>
          <div className="fx-fld" style={{ marginTop: 18 }}>
            <label className="fx-fl" htmlFor="delete-confirm">
              Type <b style={{ color: "var(--fx-t1)" }}>{user?.username}</b> to confirm
            </label>
            <div className="fx-inp">
              <input
                id="delete-confirm"
                type="text"
                autoComplete="off"
                placeholder="Your username"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
              />
            </div>
          </div>
        </Dialog>

      </DashboardShell>
    </>
  );
}
