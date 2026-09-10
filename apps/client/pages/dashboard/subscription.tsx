import Head from "next/head";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExpirationDate, dollarFormat, formatDate } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import subscriptionService from "../../services/subscriptionService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useEthereum from "../../lib/hooks/useEthereum";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { error } from "../../components/alert/Toast";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import { CheckIcon, ShieldIcon, CardStackIcon } from "../../components/dashboard/focus/icons";
import { SubscriptionSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import Loader from "../../components/Loader";
import SubscriptionModal from "../../components/dashboard/modal/Subscription";
import { SubscriptionProp, Feature, SubscriptionHistoryProp } from "../../types/subscription";
import { IPricingProps } from "../pricing";

const MIN_UNITS = 20;

type FeatureRow = { label: string; ok: boolean };

/** Turn a plan's raw `features[0]` object into readable card bullets. */
const readFeatures = (feature?: Feature): FeatureRow[] => {
  if (!feature) return [];
  const rows: FeatureRow[] = [];
  const title = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  Object.entries(feature).forEach(([key, value]) => {
    if (key === "description" || key === "order_per_day") return;
    if (value === null || value === undefined || value === "") return;

    if (key === "max_invest_amount" || key === "min_invest_amount") {
      const label = key === "max_invest_amount" ? "Max trade amount" : "Min trade amount";
      rows.push({ label: `${label} ${dollarFormat(parseFloat(String(value)))}`, ok: true });
      return;
    }
    if (typeof value === "boolean") {
      rows.push({ label: title(key), ok: value });
      return;
    }
    rows.push({ label: `${value} ${title(key).toLowerCase()}`, ok: true });
  });

  return rows;
};

const SubscriptionPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { paySubscription } = useEthereum();

  const { isLoading, subscriptions, currentPlan, subscriptionHistory, paymentIds } = useSelector(
    (state: RootState) => state.subscription,
  );

  const [units, setUnits] = useState(MIN_UNITS);
  const [choosePlan, setChoosePlan] = useState<SubscriptionProp | null>(null);
  const [payModal, setPayModal] = useState<{ open: boolean; plan?: IPricingProps }>({ open: false });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(subscriptionService.getSubscriptionList());
    if (paymentIds.length === 0) dispatch(subscriptionService.getPaymentId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = String(axiosToken.defaults.headers["Authorization"] ?? "");
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token;
    dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const hasPlan = currentPlan && Object.keys(currentPlan).length > 0;

  const planFor = (id?: number): SubscriptionProp | undefined =>
    subscriptions.find((s) => s.id === id);

  const activePlan = hasPlan ? planFor(currentPlan.subscription_id) : undefined;
  const activePlanName =
    activePlan?.name || currentPlan.subscription?.[0]?.description || "your plan";

  const activeNetworks = paymentIds.filter((p) => p.is_active);

  const history = useMemo(
    () =>
      [...(subscriptionHistory ?? [])].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      ),
    [subscriptionHistory],
  );

  const historyStatus = (h: SubscriptionHistoryProp) => {
    if (h.is_active) return { label: "Active", off: false };
    if (h.expiry_date && new Date(h.expiry_date).getTime() < Date.now())
      return { label: "Expired", off: true };
    return { label: "Ended", off: true };
  };

  const openChoose = (plan: SubscriptionProp) => {
    setUnits(MIN_UNITS);
    setChoosePlan(plan);
  };

  const continueToPayment = () => {
    if (!choosePlan) return;
    setPayModal({
      open: true,
      plan: {
        title: choosePlan.name!,
        price: parseFloat(choosePlan.price || "0"),
        id: choosePlan.id!,
      },
    });
    setChoosePlan(null);
  };

  const paymentProceed = async (id: number, network: number) => {
    if (hasPlan) {
      error("You already have an active plan.");
      return;
    }
    const plan = payModal.plan;
    if (!plan) return;

    setPaying(true);
    setPayModal({ open: false });
    try {
      await paySubscription(plan.price.toString(), id, addExpirationDate(false), network, units);
    } catch (err) {
      console.error(err);
    } finally {
      await new Promise((r) => setTimeout(r, 1200));
      setPaying(false);
    }
  };

  const cancelPlan = async () => {
    if (!currentPlan.id) return;
    await dispatch(
      subscriptionService.cancelSubscription({ api: axiosToken, id: currentPlan.id }),
    );
    setCancelOpen(false);
  };

  const chosenTotal = choosePlan
    ? dollarFormat(parseFloat((parseFloat(choosePlan.price || "0") * units).toFixed(2)))
    : "";

  return (
    <>
      <Head>
        <title>Subscription | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="subscription">
        <TopBar
          crumb="Dashboard / Subscription"
          title="Subscription"
          subtitle="Your plan, the units you have left, and every payment you have made."
        />

        {paying && <Loader />}

        {isLoading && subscriptions.length === 0 ? (
          <SubscriptionSkeletonLoader />
        ) : (
          <>
            {/* ---- hero: current plan / no plan ---- */}
            <section className="fx-sub-hero rv d1">
              <div className="fx-chips">
                {hasPlan ? (
                  <>
                    <span className="fx-chip ok4">
                      <i />
                      {activePlanName}, active
                    </span>
                    <span className="fx-chip">
                      <i />
                      Paid in crypto
                    </span>
                  </>
                ) : (
                  <>
                    <span className="fx-chip warn4">
                      <i />
                      No plan yet
                    </span>
                    <span className="fx-chip">
                      <i />
                      Nothing being charged
                    </span>
                  </>
                )}
              </div>

              {hasPlan ? (
                <>
                  <p className="fx-eqlab">Units remaining</p>
                  <p className="fx-eq">
                    {(currentPlan.tokens ?? 0).toLocaleString()}
                    <small>on {activePlanName}</small>
                  </p>
                  <span className="fx-delta">
                    <ShieldIcon />
                    {currentPlan.expiry_date
                      ? `Runs until ${formatDate(currentPlan.expiry_date)}`
                      : "Active"}
                  </span>

                  <div className="fx-substat">
                    <div className="fx-ss">
                      <span>Plan</span>
                      <b style={{ textTransform: "capitalize" }}>{activePlanName}</b>
                    </div>
                    <div className="fx-ss">
                      <span>Price per unit</span>
                      <b>
                        {activePlan?.price
                          ? dollarFormat(parseFloat(activePlan.price))
                          : "--"}
                      </b>
                    </div>
                    <div className="fx-ss">
                      <span>Purchased</span>
                      <b>
                        {currentPlan.created_at ? formatDate(currentPlan.created_at) : "--"}
                      </b>
                    </div>
                    <div className="fx-ss">
                      <span>Expires</span>
                      <b>
                        {currentPlan.expiry_date ? formatDate(currentPlan.expiry_date) : "--"}
                      </b>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="fx-eqlab">Costs you today</p>
                  <p className="fx-eq">$0</p>
                  <span className="fx-delta">
                    <CheckIcon />
                    Pick a plan and choose how many units to buy
                  </span>

                  <div className="fx-emptyrow">
                    <a className="fx-cta main2" href="#plans">
                      Choose a plan
                    </a>
                  </div>

                  <div className="fx-substat">
                    <div className="fx-ss">
                      <span>Plans available</span>
                      <b>{subscriptions.length || "--"}</b>
                    </div>
                    <div className="fx-ss">
                      <span>Minimum units</span>
                      <b>{MIN_UNITS}</b>
                    </div>
                    <div className="fx-ss">
                      <span>Payment</span>
                      <b>Crypto</b>
                    </div>
                    <div className="fx-ss">
                      <span>Networks</span>
                      <b>{activeNetworks.length || "--"}</b>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* ---- plans ---- */}
            <section className="fx-sec" id="plans" data-rv>
              <div className="fx-sh">
                <h2>
                  Plans <span className="sub2">buy units against the plan that fits your trading</span>
                </h2>
              </div>

              {subscriptions.length === 0 ? (
                <div className="fx-soft">
                  <p>Couldn&rsquo;t load the plans. Reload the page to try again.</p>
                </div>
              ) : (
                <div className="fx-plans">
                  {subscriptions.map((plan) => {
                    const isCurrent = hasPlan && plan.id === currentPlan.subscription_id;
                    const rows = readFeatures(plan.features?.[0]);
                    return (
                      <div
                        key={plan.id}
                        className={`fx-plan ${isCurrent ? "cur9" : ""}`}
                      >
                        {isCurrent && <span className="pk9">Your plan</span>}
                        <h3>{plan.name?.split(" ")[0]}</h3>
                        <p className="pw9">{plan.features?.[0]?.description || " "}</p>
                        <div className="pp9">
                          <b>{dollarFormat(parseFloat(plan.price || "0"))}</b>
                          <span>per unit</span>
                        </div>
                        <span className="pa9">Minimum {MIN_UNITS} units</span>

                        <ul className="fx-pft">
                          {rows.map((row, i) => (
                            <li key={i} className={row.ok ? "" : "no9"}>
                              {row.ok ? (
                                <svg viewBox="0 0 24 24">
                                  <path d="M20 6.5 9.2 17.3 4 12.1" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24">
                                  <path d="M6 12h12" />
                                </svg>
                              )}
                              {row.label}
                            </li>
                          ))}
                        </ul>

                        <button
                          className={`fx-mini ${isCurrent ? "" : "go9"}`}
                          type="button"
                          disabled={isCurrent || hasPlan}
                          onClick={() => openChoose(plan)}
                        >
                          {isCurrent
                            ? "Current plan"
                            : hasPlan
                              ? "Plan active"
                              : `Choose ${plan.name?.split(" ")[0]}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---- how buying works + cancel ---- */}
            <div className="fx-cols fx-sec">
              <section>
                <div className="fx-sh">
                  <h2>How buying units works</h2>
                </div>
                <div className="fx-soft">
                  <div className="fx-riskline">
                    <span>Price</span>
                    <b>Flat, per unit</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Minimum purchase</span>
                    <b>{MIN_UNITS} units</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Paid with</span>
                    <b>Crypto, on-chain</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Networks</span>
                    <b>{activeNetworks.map((n) => n.name).join(", ") || "--"}</b>
                  </div>
                  <p style={{ margin: "13px 0 0", fontSize: "12.4px", color: "var(--fx-t3)", lineHeight: 1.6 }}>
                    Each purchase is confirmed on-chain and runs until its expiry date. Prices
                    are set per unit &mdash; the total you pay is the unit price times the number
                    of units you buy.
                  </p>
                </div>
              </section>

              <section>
                <div className="fx-sh">
                  <h2>Payment</h2>
                </div>
                <div className="fx-soft">
                  <div className="fx-riskline">
                    <span>Method</span>
                    <b>Crypto</b>
                  </div>
                  {hasPlan && (
                    <div className="fx-riskline">
                      <span>Plan expires</span>
                      <b>
                        {currentPlan.expiry_date
                          ? formatDate(currentPlan.expiry_date)
                          : "--"}
                      </b>
                    </div>
                  )}
                  {hasPlan && currentPlan.transaction_hash && (
                    <div className="fx-riskline">
                      <span>Last transaction</span>
                      <b style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {currentPlan.transaction_hash.slice(0, 10)}…
                      </b>
                    </div>
                  )}
                  {hasPlan ? (
                    <button
                      className="fx-mini"
                      type="button"
                      style={{ width: "100%", padding: "12px 0", marginTop: "14px" }}
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel plan
                    </button>
                  ) : (
                    <p style={{ margin: "6px 0 0", fontSize: "12.4px", color: "var(--fx-t3)", lineHeight: 1.6 }}>
                      Your payments will show here once you are on a plan.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* ---- funds safety ---- */}
            <section className="fx-sec" data-rv>
              <div className="fx-sh">
                <h2>Your funds</h2>
              </div>
              <div className="fx-safe9">
                <span className="si9">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z" />
                    <path d="M9.5 12l1.8 1.8L15 10" />
                  </svg>
                </span>
                <div>
                  <h3>Candleweb never holds your money</h3>
                  <p>
                    Units pay for the platform only. Your trading funds stay in your own
                    exchange account &mdash; the API keys you connect can read and trade but can
                    never withdraw.
                  </p>
                </div>
              </div>
            </section>

            {/* ---- billing history ---- */}
            <section className="fx-sec" data-rv>
              <div className="fx-sh">
                <h2>
                  Billing history <span className="sub2">{history.length} purchase{history.length === 1 ? "" : "s"}</span>
                </h2>
              </div>
              {history.length === 0 ? (
                <div className="fx-soft">
                  <p>No purchases yet.</p>
                </div>
              ) : (
                <div className="fx-pos">
                  {history.map((h) => {
                    const plan = planFor(h.subscription_id);
                    const status = historyStatus(h);
                    const amount =
                      plan?.price && h.tokens
                        ? dollarFormat(parseFloat(plan.price) * h.tokens)
                        : "--";
                    return (
                      <div className="fx-brow" key={h.id}>
                        <span className="bd9">
                          {h.created_at ? formatDate(h.created_at) : "--"}
                        </span>
                        <span className="bt9">
                          {plan?.name?.split(" ")[0] ||
                            h.subscription?.[0]?.description ||
                            "Plan"}
                          {h.tokens ? ` · ${h.tokens} units` : ""}
                        </span>
                        <span className="bm9">{amount}</span>
                        <span className={`bs9 ${status.off ? "off9" : ""}`}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </DashboardShell>

      {/* choose-units dialog */}
      <Dialog
        open={!!choosePlan}
        onClose={() => setChoosePlan(null)}
        labelledBy="choose-plan-title"
        icon={<CardStackIcon />}
        title={<span id="choose-plan-title">Buy {choosePlan?.name?.split(" ")[0]} units</span>}
        subtitle={`${dollarFormat(parseFloat(choosePlan?.price || "0"))} per unit · minimum ${MIN_UNITS}`}
        footer={
          <>
            <button className="fx-cta ghost2" type="button" onClick={() => setChoosePlan(null)}>
              Back
            </button>
            <button className="fx-cta main2" type="button" onClick={continueToPayment}>
              Continue to payment
            </button>
          </>
        }
      >
        <label className="fx-eqlab" style={{ display: "block", marginBottom: "8px" }}>
          Number of units
        </label>
        <div className="fx-step9">
          <button
            className="sb9"
            type="button"
            disabled={units <= MIN_UNITS}
            onClick={() => setUnits((u) => Math.max(MIN_UNITS, u - 1))}
          >
            −
          </button>
          <span className="sv9">{units}</span>
          <button className="sb9" type="button" onClick={() => setUnits((u) => u + 1)}>
            +
          </button>
        </div>
        <div className="fx-riskline" style={{ marginTop: "14px" }}>
          <span>Total</span>
          <b>{chosenTotal}</b>
        </div>
      </Dialog>

      {/* cancel-plan dialog */}
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        tone="amber"
        labelledBy="cancel-plan-title"
        title={<span id="cancel-plan-title">Cancel your plan?</span>}
        subtitle="You keep the units you have already bought until they expire."
        footer={
          <>
            <button className="fx-cta ghost2" type="button" onClick={() => setCancelOpen(false)}>
              Keep my plan
            </button>
            <button className="fx-cta main2" type="button" onClick={cancelPlan}>
              Cancel plan
            </button>
          </>
        }
      >
        <p className="fx-dwarn">
          Cancelling stops the plan from renewing. Any units still on your account stay usable
          until their expiry date.
        </p>
      </Dialog>

      {/* payment / network selection (existing modal) */}
      <SubscriptionModal
        isOpen={payModal.open}
        subscription={payModal.plan}
        units={units}
        setIsOpen={(e) => setPayModal((prev) => ({ ...prev, open: e }))}
        continueFunction={(id, network) => paymentProceed(id, network)}
      />
    </>
  );
};

export default SubscriptionPage;
