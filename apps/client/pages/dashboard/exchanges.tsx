import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat, maskString } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import exchangeServices from "../../services/exchangeService";
import userService from "../../services/userService";
import tradingV2Service from "../../services/tradingV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { getFirstAndLastLetter } from "../../utils/constants";
import { success, error } from "../../components/alert/Toast";
import { setBalance } from "../../redux/slices/userSlice";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import ExchangesEmpty from "../../components/dashboard/focus/exchanges/ExchangesEmpty";
import {
  WarnIcon,
  PlusIcon,
  CheckIcon,
  CopyIcon,
  ShieldIcon,
  LockIcon,
  InviteIcon,
  ClockIcon,
} from "../../components/dashboard/focus/icons";
import type { ExchangeProp, ExchangeRecord } from "../../types/exchange";
import type { BalanceProp } from "../../types/user";

/* Exchange keys must allow these three Candleweb addresses (same set as Settings). */
const CONFIG_IPS = ["65.21.47.124", "107.155.122.236", "209.182.234.182"];

/* The design's "Key safety" dashboard scores each connected key on withdrawal
   permission, IP lock, futures/margin access and expiry — none of which our
   API returns yet (see BACKEND_API_REQUESTS.md §1.14). Rather than hide the
   section or fabricate a score, it's built to the real layout with every
   item honestly marked as unscored, so the shape of the data this page needs
   is visible instead of just described in a doc. */
const SAFETY_CHECKS = [
  { t: "No key can move money out", s: "Needs withdrawal-permission data per key" },
  { t: "Every key locked to our IP", s: "Needs IP-restriction data per key" },
  { t: "Spot only, no futures or margin", s: "Needs futures/margin-permission data per key" },
  { t: "No key close to expiring", s: "Needs key-expiry data per key" },
];

/* "More than one" is the one badge this page can already judge for real —
   it only needs the connected-account count, not per-key permission data. */
const SAFETY_BADGES = [
  { t: "Trade-only keys", s: "No key can move money out", Icon: ShieldIcon, scoreable: false },
  { t: "Locked down", s: "Every key tied to our IP", Icon: LockIcon, scoreable: false },
  { t: "More than one", s: "Two or more accounts live", Icon: InviteIcon, scoreable: true },
  { t: "Nothing stale", s: "No key near expiry", Icon: ClockIcon, scoreable: false },
];

const DashboardExchangesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();

  const { exchanges, exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const { balance } = useSelector((state: RootState) => state.user);
  const { trades } = useSelector((state: RootState) => state.tradingV2);
  const fetchedRef = useRef(false);

  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  /* the empty state is only shown once the record list has actually loaded,
     so a user with accounts never sees it flash up */
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(exchangeServices.getExchangeRecords(axiosToken)).finally(() => setRecordsLoaded(true));
    if (exchanges.length < 1) dispatch(exchangeServices.getExchanges());
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    dispatch(tradingV2Service.listTrades(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const exchangeName = (raw?: string | number) => {
    if (raw == null || raw === "") return "Exchange";
    const match = exchanges.find((x: ExchangeProp) => String(x.id) === String(raw));
    return match?.name ?? String(raw);
  };

  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );

  const activeCount = exchangeRecord.filter((r: ExchangeRecord) => r.is_active).length;
  const tradesUsingExchanges = trades.filter((t) => t.exchange_account != null).length;

  const tradesFor = (recId?: number) =>
    recId == null ? [] : trades.filter((t) => t.exchange_account === recId);

  const connectedIds = new Set(exchangeRecord.map((r) => String(r.supported_exchange_id)));

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp((v) => (v === ip ? null : v)), 1500);
    } catch {
      error("Couldn't copy — select it by hand");
    }
  };

  const syncAll = async () => {
    if (syncing) return;
    setSyncing(true);
    dispatch(setBalance(""));
    await Promise.all([
      dispatch(exchangeServices.getExchangeRecords(axiosToken)),
      dispatch(userService.getBalance(axiosToken)),
    ]);
    setSyncing(false);
    success("Accounts synced");
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    dispatch(exchangeServices.deleteExchange({ api: axiosToken, id: removeTarget.id })).then(() => {
      dispatch(exchangeServices.getExchangeRecords(axiosToken));
      dispatch(userService.getBalance(axiosToken));
      success(`${exchangeName(removeTarget.name)} disconnected`);
      setRemoveTarget(null);
    });
  };

  const isEmpty = exchangeRecord.length === 0;

  return (
    <>
      <Head>
        <title>Exchanges | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="exchanges">
        {isEmpty ? (
          <>
            <TopBar
              title="Exchanges"
              subtitle="Connect the account your bots will trade on. It stays yours — Candleweb only places orders inside it."
            />
            {recordsLoaded ? (
              <ExchangesEmpty exchanges={exchanges} />
            ) : (
              <p className="fx-hint" style={{ padding: "24px 4px" }}>
                Loading your exchanges…
              </p>
            )}
          </>
        ) : (
          <>
        <TopBar
          crumb="Dashboard / Exchanges"
          title="Exchanges"
          subtitle="Where your money lives. Candleweb places orders inside your own account — it never holds funds, and it never can."
          actions={
            <button className="fx-mini" type="button" onClick={syncAll} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync all"}
            </button>
          }
        />

        <div className="fx-cap2 rv d1">
          <div className="fx-cp">
            <span>Accounts connected</span>
            <b>{exchangeRecord.length}</b>
            <i>
              {exchangeRecord.length
                ? exchangeRecord
                    .map((r) => exchangeName(r.supported_exchange_id))
                    .join(", ")
                : "none yet"}
            </i>
          </div>
          <div className="fx-cp">
            <span>Total balance</span>
            <b>{balance && balance.length ? dollarFormat(totalBalance) : "—"}</b>
            <i>across every account</i>
          </div>
          <div className="fx-cp">
            <span>Keys active</span>
            <b className={activeCount ? "up6" : ""}>{activeCount}</b>
            <i>of {exchangeRecord.length} connected</i>
          </div>
          <div className="fx-cp">
            <span>Trades running</span>
            <b>{tradesUsingExchanges}</b>
            <i>placing orders on these accounts</i>
          </div>
        </div>

          <section className="fx-sec rv d2">
            <div className="fx-sh">
              <h2>
                Connected accounts <span className="sub2">orders are placed in your name</span>
              </h2>
            </div>

            <div>
              {exchangeRecord.map((rec: ExchangeRecord) => {
                const running = tradesFor(rec.id);
                return (
                  <div className="fx-xrow" key={rec.id}>
                    <span className="xl2">
                      {getFirstAndLastLetter(exchangeName(rec.supported_exchange_id))}
                    </span>
                    <div className="xn2">
                      <b>{exchangeName(rec.supported_exchange_id)}</b>
                      <span>key {maskString(rec.API_KEY ?? "")}</span>
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
                          name: String(rec.supported_exchange_id ?? ""),
                        })
                      }
                    >
                      Disconnect
                    </button>
                    <div className="xw2">
                      {running.length === 0 ? (
                        <span className="fx-trp none7">No trades on this account yet</span>
                      ) : (
                        running.slice(0, 5).map((t) => (
                          <span className="fx-trp" key={t.id}>
                            <i />
                            {t.pair_name || `Pair #${t.pair}`}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        {/* Key safety — full dashboard layout, matching the design; every
            score/checklist/badge item is honestly marked unscored until a
            per-key permissions endpoint exists (BACKEND_API_REQUESTS.md §1.14).
            Only "More than one account" and the IP-allowlist box use real data. */}
        <section className="fx-mom rv d3">
          <div className="fx-sh">
            <h2>
              Key safety{" "}
              <span className="sub2">
                {exchangeRecord.length
                  ? `${exchangeRecord.length} key${exchangeRecord.length === 1 ? "" : "s"} connected`
                  : "nothing connected"}
              </span>
            </h2>
            <span className="fx-preview">
              <i>◔</i> Needs a per-key permissions endpoint
            </span>
          </div>
          <div className="fx-momgrid">
            <div>
              <div className="fx-scorehead">
                <div
                  className="fx-ring"
                  style={{ "--v": 0 } as React.CSSProperties}
                  role="img"
                  aria-label="Key safety score — not yet available"
                >
                  <svg viewBox="0 0 44 44" aria-hidden="true">
                    <circle className="tr" cx="22" cy="22" r="19" />
                    <circle className="vl" cx="22" cy="22" r="19" />
                  </svg>
                  {/* inline override — neither the "good" teal nor "bad" rose
                      ring tone applies here, since there's nothing to score */}
                  <b style={{ color: "var(--fx-t3)" }}>—</b>
                </div>
                <div className="vt">
                  <b>Not scored yet</b>
                  <p>
                    Candleweb can&rsquo;t yet read back which permissions a key actually carries —
                    withdrawal, IP-lock, futures access, expiry — so nothing below is a real score yet.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                {SAFETY_CHECKS.map((item, i) => (
                  <div className="fx-ul" key={item.t}>
                    <i>{i + 1}</i>
                    <div>
                      <b>{item.t}</b>
                      <span>{item.s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="fx-sh" style={{ marginBottom: 12 }}>
                <h2 style={{ fontSize: 15 }}>Earned</h2>
              </div>
              <div className="fx-badges2">
                {SAFETY_BADGES.map((b) => {
                  const won = b.scoreable && exchangeRecord.length >= 2;
                  return (
                    <div className={`fx-bdg ${won ? "won" : ""}`} key={b.t}>
                      <span className="lk2">{won ? "Earned" : b.scoreable ? "Locked" : "Needs data"}</span>
                      <span className="bi">
                        <b.Icon />
                      </span>
                      <b>{b.t}</b>
                      <span>{b.s}</span>
                    </div>
                  );
                })}
              </div>
              <p
                className="fx-tip2"
                style={{ borderTop: "1px solid var(--fx-line)", marginTop: 18, paddingTop: 16 }}
              >
                <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> None of this protects you from a
                bad strategy. It protects you from losing the account itself — a different risk, and
                the only one you can remove completely.
              </p>
            </div>
          </div>

          <div className="fx-ipbox" style={{ marginTop: 26 }}>
            <b>Restrict your key to these addresses</b>
            <p>
              For automated trading to work, your exchange key must allow these three Candleweb
              addresses — and ideally nothing else.
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
        </section>

        <section className="fx-sec">
          <div className="fx-sh">
            <h2>Add another exchange</h2>
            <span className="sub2">
              One account runs as many trades as you like — you don&rsquo;t need a second.
            </span>
          </div>
          {exchanges.length === 0 ? (
            <Link className="fx-mini go" href="/dashboard/exchanges/new">
              <PlusIcon /> Add exchange
            </Link>
          ) : (
            <div className="fx-avail">
              {exchanges.map((x: ExchangeProp) => (
                <div className="fx-av" key={x.id}>
                  <span className="xl2">{getFirstAndLastLetter(x.name)}</span>
                  <b>{x.name}</b>
                  <Link className="fx-mini" href={`/dashboard/exchanges/new?exchange=${x.id}`}>
                    {connectedIds.has(String(x.id)) ? "Add account" : "Connect"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="fx-fund">
          <span className="fl2">YC</span>
          <div>
            <b>Need to fund your account?</b>
            <p>
              Candleweb doesn&rsquo;t hold or convert money. To move local currency into an exchange
              account, use the buy-crypto flow — the deposit goes straight to your exchange, never
              through us.
            </p>
            <Link
              className="fx-cta live6"
              href="/buy-crypto"
              style={{ flex: "0 0 auto", minWidth: 0, padding: "12px 20px", fontSize: "13.5px" }}
            >
              Buy crypto
            </Link>
          </div>
        </div>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>How this works.</b> You add API keys with trade permission only. Orders are placed
            inside your own exchange account, in your name. Candleweb has no withdrawal permission
            and no deposit address — there is nothing here for us to hold. Revoke a key on the
            exchange and our access ends immediately; open positions keep the stops already on them.
          </p>
        </div>

          </>
        )}

        <Dialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          tone="amber"
          icon={<WarnIcon />}
          title={`Disconnect ${exchangeName(removeTarget?.name)}?`}
          subtitle="Candleweb stops seeing it immediately"
          labelledBy="remove-exchange-title"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setRemoveTarget(null)}>
                Keep it
              </button>
              <button className="fx-cta live6" type="button" onClick={confirmRemove}>
                Disconnect
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            Any trade pointing at this account stops placing orders, and every trade associated with
            this exchange is removed. Positions already open keep the stops on them.
          </p>
          <p className="fx-dwarn">
            Disconnecting here <b>does not revoke the key</b>. Delete it on the exchange as well, or it
            stays valid for whoever holds it.
          </p>
        </Dialog>

      </DashboardShell>
    </>
  );
};

export default DashboardExchangesPage;
