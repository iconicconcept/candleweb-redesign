import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import subscriptionV2Service from "../../services/subscriptionV2Service";
import tradingV2Service from "../../services/tradingV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import toast from "react-hot-toast";
import { success, warning } from "../../components/alert/Toast";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import RailsBackdrop from "../../components/dashboard/focus/RailsBackdrop";
import { CardStackIcon, CheckIcon, ShieldIcon } from "../../components/dashboard/focus/icons";
import { SubscriptionSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import { DESIGN_EXCHANGES } from "../../lib/exchangeCatalog";
import {
  altLine,
  annualSaving,
  currencyWord,
  exchangesLabel,
  isLivePlan,
  longDate,
  money,
  planRank,
  priceOf,
  rowDate,
  shortDate,
  usd,
} from "../../lib/subscriptionV2Format";
import type { InvoiceV2, PlanV2, SubCurrency, SubCycle, SubscriptionV2 } from "../../types/subscriptionV2";

/* ------------------------------------------------------------------ *
 * small shared bits
 * ------------------------------------------------------------------ */

const Tick = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </svg>
);
const Dash = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6 12h12" />
  </svg>
);
const CardGlyph = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="6.5" width="18" height="12" rx="2.6" />
    <path d="M3 10.5h18M16.5 14.5h1.5" />
  </svg>
);
const CoinGlyph = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 8.2h4a2.2 2.2 0 010 4.4h-4M9.4 12.6h4.4a2.2 2.2 0 010 4.4H9.4M9.4 6.6v12M11.6 5.2v2M11.6 18.6v2" />
  </svg>
);
const ShieldGlyph = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </svg>
);
const BADGE_ICONS = {
  plug: (
    <svg viewBox="0 0 24 24">
      <path d="M9 3v6M15 3v6" />
      <path d="M7 9h10v4a5 5 0 01-10 0z" />
      <path d="M12 18v3" />
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24">
      <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24">
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M7 11v5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5" />
    </svg>
  ),
};

/** 20-segment meter; `filled` of 20 lit, the next one shimmering. */
const Segments = ({ filled }: { filled: number }) => (
  <div className="fx-seg">
    {new Array(20).fill(0).map((_, i) => (
      <i key={i} className={i < filled ? "f" : i === filled ? "nx" : ""} />
    ))}
  </div>
);

/** Dots for streak rows */
const Dots = ({ total, on }: { total: number; on: number }) => (
  <div className="fx-dots2">
    {new Array(total).fill(0).map((_, i) => (
      <em key={i} className={i < on ? "on4" : ""} />
    ))}
  </div>
);

const Safe = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="fx-safe9">
    <span className="si9">
      <ShieldGlyph />
    </span>
    <div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  </div>
);

/** Hero price that counts up from 0 on first paint (mockup behaviour). */
const CountUp = ({ amount, cur }: { amount: number; cur: SubCurrency }) => {
  const [shown, setShown] = useState(amount);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || amount <= 0) {
      setShown(amount);
      return;
    }
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / 1100, 1);
      setShown(Math.round(amount * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [amount]);
  return <>{money(shown, cur)}</>;
};

/* ------------------------------------------------------------------ *
 * plans grid — cycle + preview-currency switches and the three cards
 * ------------------------------------------------------------------ */

type CardAction = { label: string; go?: boolean; disabled?: boolean; onClick?: () => void };

function PlansSection({
  plans,
  cycle,
  setCycle,
  cur,
  setCur,
  note,
  tagFor,
  actionFor,
  heading,
}: {
  plans: PlanV2[];
  cycle: SubCycle;
  setCycle: (c: SubCycle) => void;
  cur: SubCurrency;
  setCur: (c: SubCurrency) => void;
  note?: React.ReactNode;
  tagFor: (p: PlanV2) => { text: string; current: boolean } | null;
  actionFor: (p: PlanV2) => CardAction;
  heading: React.ReactNode;
}) {
  const saving = annualSaving(plans);
  return (
    <section className="fx-sec" id="plans">
      <div className="fx-sh">
        <h2>{heading}</h2>
      </div>

      <div className="fx-swtrow">
        <div className="fx-swt" role="group" aria-label="Billing cycle">
          {(["monthly", "annual"] as SubCycle[]).map((c) => (
            <button key={c} type="button" className={cycle === c ? "on" : ""} onClick={() => setCycle(c)}>
              {c === "monthly" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
        <div className="fx-swt" role="group" aria-label="Currency">
          {(["NGN", "USD"] as SubCurrency[]).map((c) => (
            <button key={c} type="button" className={cur === c ? "on" : ""} onClick={() => setCur(c)}>
              {c === "NGN" ? "₦ Naira" : "$ Dollar"}
            </button>
          ))}
        </div>
        {cycle === "annual" && saving && <span className="fx-saven">{saving}</span>}
        {note && <span className="fx-swtnote">{note}</span>}
      </div>

      {plans.length === 0 ? (
        <div className="fx-soft">
          <p>Couldn&rsquo;t load the plans. Reload the page to try again.</p>
        </div>
      ) : (
        <div className="fx-plans">
          {plans.map((plan) => {
            const tag = tagFor(plan);
            const act = actionFor(plan);
            return (
              <div key={plan.code} className={`fx-plan ${tag?.current ? "cur9" : ""}`}>
                {tag && <span className="pk9">{tag.text}</span>}
                <h3>{plan.name}</h3>
                <p className="pw9">{plan.tagline}</p>
                <div className="pp9">
                  <b>{money(priceOf(plan, cur, cycle), cur)}</b>
                  {!plan.is_free && <span>{cycle === "monthly" ? "per month" : "per year"}</span>}
                </div>
                <span className="pa9">{altLine(plan, cur, cycle)}</span>
                <ul className="fx-pft">
                  {plan.features.map((f, i) => (
                    <li key={i} className={f.included ? "" : "no9"}>
                      {f.included ? <Tick /> : <Dash />}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  className={`fx-mini ${act.go ? "go9" : ""}`}
                  type="button"
                  disabled={act.disabled}
                  onClick={act.onClick}
                >
                  {act.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * the page
 * ------------------------------------------------------------------ */

/* what a checkout we sent the user to was for — survives the round trip */
type Pending = { kind: "plan"; plan: string } | { kind: "invoice"; number: string };
const PENDING_KEY = "cw-sub-pending";
const writePending = (p: Pending) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, at: Date.now() }));
  } catch {
    /* private mode — the query-string check still runs */
  }
};
const readPending = (): Pending | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    /* a checkout abandoned hours ago isn't what this visit is about */
    if (!p?.at || Date.now() - p.at > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p as Pending;
  } catch {
    return null;
  }
};
const clearPending = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
};

/* the design's small "→" explainer links */
const explain = (msg: string) => toast(msg, { duration: 6500, style: { maxWidth: 460 } });
const HOW_BILLING =
  "How billing works: a flat plan fee, monthly or yearly, plus a small percentage only on traded volume above what your plan includes — never on the whole amount.";
const WHAT_REVIEW =
  "What a bot review does: it reads your closed trades against the exact candles each decision saw, and names the rule that is losing you money.";

type PayIntent =
  | { kind: "subscribe"; plan: PlanV2; cycle: SubCycle }
  | { kind: "change"; plan: PlanV2; cycle: SubCycle }
  | { kind: "invoice"; invoice: InvoiceV2 };

const SubscriptionPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);

  const { plans, plansLoaded, subscription, entitlements, meLoaded, usage, reviews, invoices, paymentMethods } =
    useSelector((state: RootState) => state.subscriptionV2);
  const { bots, botsLoaded } = useSelector((state: RootState) => state.tradingV2);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);

  const [cycle, setCycle] = useState<SubCycle>("monthly");
  const [cur, setCur] = useState<SubCurrency>("NGN");
  const [meFailed, setMeFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [pay, setPay] = useState<PayIntent | null>(null);
  const [payMethod, setPayMethod] = useState<"card" | "crypto">("card");
  const [moveTo, setMoveTo] = useState<PlanV2 | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchedTokenRef = useRef<string | null>(null);

  const loadMine = async () => {
    const res = await dispatch(subscriptionV2Service.getMe(axiosToken));
    setMeFailed(res.meta.requestStatus === "rejected");
    dispatch(subscriptionV2Service.getUsage(axiosToken));
    dispatch(subscriptionV2Service.getReviews(axiosToken));
    dispatch(subscriptionV2Service.getInvoices(axiosToken));
    dispatch(subscriptionV2Service.getPaymentMethods(axiosToken));
    return res;
  };

  useEffect(() => {
    if (!plansLoaded) dispatch(subscriptionV2Service.listPlans());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = String(axiosToken.defaults.headers["Authorization"] ?? "");
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token;
    loadMine();
    if (!botsLoaded) dispatch(tradingV2Service.listBots(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  /* Back from a Flutterwave checkout. The redirect proves nothing — only the
     webhook settles a payment — so re-read /me/ (or the invoice) a few times
     and only call it a success when the thing we paid for actually shows up.
     What we were paying for is remembered in sessionStorage before leaving,
     so this works whatever query string the provider sends back with. */
  useEffect(() => {
    if (!router.isReady || !isAuthorizationHeaderSet(axiosToken)) return;
    const q = router.query;
    const pending = readPending();
    const fromQuery = !!(q.status || q.tx_ref || q.transaction_id || q.checkout);
    if (!pending && !fromQuery) return;
    let stop = false;
    let done = false;
    setConfirming(true);
    (async () => {
      for (let i = 0; i < 6 && !stop && !done; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 800 : 3000));
        if (stop) return;
        if (pending?.kind === "invoice") {
          const res: any = await dispatch(subscriptionV2Service.getInvoices(axiosToken));
          const inv = (res?.payload as InvoiceV2[] | undefined)?.find((x) => x.number === pending.number);
          if (inv?.status === "paid") {
            success("Payment received. Thank you — your plan carries on as normal.");
            done = true;
          }
          loadMine();
        } else {
          const res: any = await loadMine();
          const sub: SubscriptionV2 | null = res?.payload?.subscription ?? null;
          if (pending && isLivePlan(sub) && sub.plan_code === pending.plan) {
            success(`You're on ${sub.plan_name}. A receipt is on its way to your email.`);
            done = true;
          }
        }
      }
      if (stop) return;
      if (!done) {
        if (String(q.status ?? "").toLowerCase().includes("cancel"))
          warning("Checkout was cancelled. Nothing was charged.");
        else if (pending)
          warning("Your payment is still being confirmed. This page updates once it lands — check back in a minute.");
      }
      clearPending();
      setConfirming(false);
      if (fromQuery) router.replace("/dashboard/subscription", undefined, { shallow: true });
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, axiosToken]);

  const firstName = user?.first_name || user?.username || "there";
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => planRank(a) - planRank(b)), [plans]);
  const live = isLivePlan(subscription) ? subscription : null;
  const currentPlan = live ? plans.find((p) => p.code === live.plan_code) : undefined;
  const freePlan = sortedPlans.find((p) => p.is_free);
  const runningBots = bots.filter((b) => b.status === "ACTIVE").length;
  const openInvoice = invoices.find((i) => i.status === "open" || i.status === "failed");

  /* the switches start on what the subscriber is actually billed — a plan
     change sends the switch's cycle, so an annual subscriber must not be
     silently moved to monthly */
  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current || !meLoaded) return;
    syncedRef.current = true;
    if (live && !plans.find((p) => p.code === live.plan_code)?.is_free) {
      setCycle(live.cycle);
      setCur(live.billing_currency);
    }
  }, [meLoaded, live, plans]);

  /* ---------- actions ---------- */

  const goCheckout = (url: string | null | undefined, pending: Pending) => {
    if (!url) return false;
    writePending(pending);
    window.location.assign(url);
    return true;
  };

  const startFree = async () => {
    if (!freePlan) return;
    setBusy(true);
    const res: any = await dispatch(
      subscriptionV2Service.subscribe({ api: axiosToken, plan: freePlan.code, cycle: "monthly" }),
    );
    setBusy(false);
    if (res.meta.requestStatus !== "fulfilled") return;
    if (goCheckout(res.payload?.checkout_url, { kind: "plan", plan: freePlan.code })) return;
    success(`You're on ${freePlan.name}. Add a bot and it starts trading on paper — nothing at risk.`);
    loadMine();
  };

  const continuePay = async () => {
    if (!pay) return;
    setBusy(true);
    let res: any;
    if (pay.kind === "invoice") {
      res = await dispatch(subscriptionV2Service.payInvoice({ api: axiosToken, number: pay.invoice.number }));
    } else {
      const thunk = pay.kind === "subscribe" ? subscriptionV2Service.subscribe : subscriptionV2Service.changePlan;
      res = await dispatch(thunk({ api: axiosToken, plan: pay.plan.code, cycle: pay.cycle }));
    }
    if (res.meta.requestStatus !== "fulfilled") {
      setBusy(false);
      return;
    }
    const body = res.payload ?? {};
    const pending: Pending =
      pay.kind === "invoice" ? { kind: "invoice", number: pay.invoice.number } : { kind: "plan", plan: pay.plan.code };
    if (goCheckout(body.checkout_url, pending)) return; // leaving the page; busy stays on
    setBusy(false);
    setPay(null);
    if (body.subscription) success(`You're on ${body.subscription.plan_name}.`);
    else success("Done. Your plan will update as soon as the payment is confirmed.");
    loadMine();
  };

  const confirmDowngrade = async (plan: PlanV2) => {
    setBusy(true);
    const res: any = await dispatch(
      subscriptionV2Service.changePlan({ api: axiosToken, plan: plan.code, cycle: live?.cycle ?? cycle }),
    );
    setBusy(false);
    if (res.meta.requestStatus !== "fulfilled") return;
    setMoveTo(null);
    const body = res.payload ?? {};
    if (goCheckout(body.checkout_url, { kind: "plan", plan: plan.code })) return;
    success(
      body.scheduled && body.effective_at
        ? `Moving to ${plan.name} on ${longDate(body.effective_at)}. You keep ${live?.plan_name} until then.`
        : `Moving to ${plan.name}.`,
    );
    loadMine();
  };

  const confirmCancel = async () => {
    setBusy(true);
    const res: any = await dispatch(subscriptionV2Service.cancel(axiosToken));
    setBusy(false);
    if (res.meta.requestStatus !== "fulfilled") return;
    setCancelOpen(false);
    const until = res.payload?.active_until ?? live?.current_period_end;
    warning(
      `Plan cancelled. ${live?.plan_name} runs until ${longDate(until)} — open positions keep their stops after that. You can undo this from this page until then.`,
    );
    loadMine();
  };

  const resumePlan = async () => {
    setBusy(true);
    const res: any = await dispatch(subscriptionV2Service.resume(axiosToken));
    setBusy(false);
    if (res.meta.requestStatus !== "fulfilled") return;
    success(`Plan restored. ${live?.plan_name} renews on ${longDate(live?.renews_on)} as before.`);
    loadMine();
  };

  const openPay = (intent: PayIntent) => {
    setPayMethod("card");
    setPay(intent);
  };

  /* ---------- pay dialog copy ---------- */

  const payLine = (() => {
    if (!pay) return "";
    if (pay.kind === "invoice") return `${pay.invoice.description} · ${money(pay.invoice.total, pay.invoice.currency)}`;
    const p = pay.plan;
    const each = pay.cycle === "monthly" ? "a month" : "a year";
    const price = `${money(priceOf(p, "NGN", pay.cycle), "NGN")} ${each}`;
    return pay.kind === "change" ? `${p.name} · prorated today, then ${price}` : `${p.name} · ${price}`;
  })();

  /* ---------- views ---------- */

  const loading = !plansLoaded || (!meLoaded && !meFailed);

  const title = loading
    ? "Subscription"
    : live
      ? `Your plan, ${firstName}.`
      : `No plan yet, ${firstName}.`;

  const subtitle = loading
    ? "Your plan, what it includes, and every charge."
    : live
      ? [
          live.plan_name,
          currentPlan?.is_free || !live.current_period_end
            ? "free, never renews"
            : live.cancel_at_period_end
              ? `ends ${longDate(live.current_period_end)}`
              : `renews ${longDate(live.renews_on)}`,
          `${runningBots} of ${entitlements?.max_concurrent_agents ?? currentPlan?.entitlements.max_concurrent_agents ?? "—"} agents running`,
        ].join(" · ")
      : "Nothing running · nothing charged";

  return (
    <>
      <Head>
        <title>Subscription | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="subscription">
        <TopBar crumb="Dashboard / Subscription" title={title} subtitle={subtitle} />

        {confirming && (
          <p className="fx-warn2" style={{ marginTop: 16 }}>
            <em>●</em>
            <span>Confirming your payment with Flutterwave — this page updates as soon as it lands.</span>
          </p>
        )}

        {loading ? (
          <SubscriptionSkeletonLoader />
        ) : meFailed ? (
          <div className="fx-soft rv d1" style={{ marginTop: 24 }}>
            <h3>Couldn&rsquo;t load your plan</h3>
            <p style={{ marginBottom: 14 }}>
              Something went wrong reading your subscription. Nothing about your plan has changed.
            </p>
            <button className="fx-mini" type="button" onClick={() => loadMine()}>
              Try again
            </button>
          </div>
        ) : live ? (
          /* ================= on a plan ================= */
          <>
            <section className="fx-hero rv d1">
              <div className="fx-chips">
                {live.status === "past_due" ? (
                  <span className="fx-chip warn4">
                    <i />
                    Payment past due
                  </span>
                ) : live.cancel_at_period_end ? (
                  <span className="fx-chip warn4">
                    <i />
                    {live.plan_name}, ends {shortDate(live.current_period_end)}
                  </span>
                ) : (
                  <span className="fx-chip ok4">
                    <i />
                    {live.plan_name}, active
                  </span>
                )}
                {!currentPlan?.is_free && (
                  <span className="fx-chip ok4">
                    <i />
                    Paying in {currencyWord(live.billing_currency)}
                  </span>
                )}
                {reviews && reviews.included_per_month > 0 && (
                  <span className={`fx-chip ${reviews.balance <= 1 ? "warn4" : "ok4"}`}>
                    <i />
                    {reviews.balance} review{reviews.balance === 1 ? "" : "s"} left this month
                  </span>
                )}
              </div>
              <RailsBackdrop />
              <div className="fx-hero-in">
                <p className="fx-eqlab">You pay</p>
                <p className="fx-eq">
                  <CountUp amount={Number(live.price_amount || 0)} cur={live.billing_currency} />
                </p>
                <span className="fx-delta">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.4v5l3.2 2" />
                  </svg>
                  {currentPlan?.is_free || !live.current_period_end
                    ? "free, never renews"
                    : live.cancel_at_period_end
                      ? `plan ends ${shortDate(live.current_period_end)} · no further charges`
                      : `every ${live.cycle === "monthly" ? "month" : "year"} · next charge ${shortDate(live.renews_on)}`}
                </span>

                <div className="fx-substat">
                  <div className="fx-ss">
                    <span>Agents running</span>
                    <b>{runningBots}</b>
                    <i>of {entitlements?.max_concurrent_agents ?? currentPlan?.entitlements.max_concurrent_agents ?? "—"}</i>
                  </div>
                  <div className="fx-ss">
                    <span>Volume this {live.cycle === "annual" ? "period" : "month"}</span>
                    <b>{usage ? usd(usage.used) : "—"}</b>
                    <i>of {usage ? usd(usage.included) : "—"}</i>
                  </div>
                  <div className="fx-ss">
                    <span>Bot reviews left</span>
                    <b className="up3">{reviews ? reviews.balance : "—"}</b>
                    <i>of {reviews ? reviews.included_per_month : "—"}</i>
                  </div>
                  <div className="fx-ss">
                    <span>On {live.plan_name}</span>
                    <b>{live.months_on_plan}</b>
                    <i>month{live.months_on_plan === 1 ? "" : "s"}</i>
                  </div>
                </div>
              </div>
            </section>

            <PlansSection
              plans={sortedPlans}
              cycle={cycle}
              setCycle={setCycle}
              cur={cur}
              setCur={setCur}
              heading={
                <>
                  Plans <span className="sub2">the difference is only what your agents can reach</span>
                </>
              }
              note={`Preview only. You are billed ${live.cycle === "monthly" ? "monthly" : "yearly"} in ${currencyWord(live.billing_currency)}.`}
              tagFor={(p) => (p.code === live.plan_code ? { text: "Your plan", current: true } : null)}
              actionFor={(p) => {
                if (p.code === live.plan_code) return { label: "Current plan", disabled: true };
                const up = planRank(p) > planRank(currentPlan);
                return {
                  label: up ? `Move to ${p.name}` : p.is_free ? `Move to ${p.name}` : `Switch to ${p.name}`,
                  go: up,
                  disabled: busy,
                  onClick: () => setMoveTo(p),
                };
              }}
            />

            <UsageSection
              live={live}
              usage={usage}
              reviews={reviews}
              exchangeCount={exchangeRecord.length}
              bots={bots}
              sortedPlans={sortedPlans}
              currentPlan={currentPlan}
            />

            <div className="fx-cols fx-sec">
              <section>
                <div className="fx-sh">
                  <h2>Bot reviews</h2>
                  <button className="fx-link" type="button" onClick={() => explain(WHAT_REVIEW)}>
                    What a review does &rarr;
                  </button>
                </div>
                <div className="fx-soft">
                  <div className="fx-ledger">
                    <div
                      className={`fx-ring ${reviews && reviews.balance <= 1 ? "mid5" : ""}`}
                      style={
                        {
                          "--v": reviews && reviews.included_per_month
                            ? Math.round((reviews.balance / reviews.included_per_month) * 100)
                            : 0,
                          "--sz": "58px",
                        } as React.CSSProperties
                      }
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 44 44">
                        <circle className="tr" cx="22" cy="22" r="19" />
                        <circle className="vl" cx="22" cy="22" r="19" />
                      </svg>
                      <b>{reviews ? reviews.balance : "—"}</b>
                    </div>
                    <div className="lt9">
                      <b>
                        {reviews
                          ? `${reviews.balance} review${reviews.balance === 1 ? "" : "s"} left this ${live.cycle === "annual" ? "period" : "month"}`
                          : "Reviews"}
                      </b>
                      <span>
                        {reviews?.resets_on ? `Resets ${longDate(reviews.resets_on)}. ` : ""}
                        Unused reviews do not roll over
                        {reviews && reviews.unlock_closed_trades > 0
                          ? `, and a review needs ${reviews.unlock_closed_trades} closed trades on the same prompt.`
                          : "."}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="fx-sh">
                  <h2>Payment</h2>
                </div>
                <div className="fx-soft" style={{ marginBottom: 14 }}>
                  <div className="fx-riskline">
                    <span>Paying with</span>
                    <b>
                      {(paymentMethods.find((m) => m.is_default) ?? paymentMethods[0])?.label ??
                        (currentPlan?.is_free ? "Nothing — free plan" : `Card · ${currencyWord(live.billing_currency)}`)}
                    </b>
                  </div>
                  <div className="fx-riskline">
                    <span>Next charge</span>
                    <b>
                      {currentPlan?.is_free || !live.current_period_end || live.cancel_at_period_end
                        ? "None"
                        : `${shortDate(live.renews_on)} · ${money(live.price_amount, live.billing_currency)}`}
                    </b>
                  </div>
                  <div className="fx-riskline">
                    <span>Billed in</span>
                    <b>{live.billing_currency === "USD" ? "Dollars" : "Naira"}</b>
                  </div>
                  {openInvoice && (
                    <button
                      className="fx-mini wide9 go9"
                      type="button"
                      style={{ marginTop: 14 }}
                      disabled={busy}
                      onClick={() => openPay({ kind: "invoice", invoice: openInvoice })}
                    >
                      Pay {money(openInvoice.total, openInvoice.currency)} due
                    </button>
                  )}
                  <p style={{ margin: "13px 0 0", fontSize: "12.4px", color: "var(--fx-t3)", lineHeight: 1.6 }}>
                    The currency switch in Plans previews prices, it does not change how you are billed.
                  </p>
                </div>
                {!currentPlan?.is_free &&
                  (live.cancel_at_period_end ? (
                    <button
                      className="fx-mini wide9 go9"
                      type="button"
                      disabled={busy}
                      onClick={resumePlan}
                    >
                      Keep {live.plan_name} — undo cancellation
                    </button>
                  ) : (
                    <button
                      className="fx-mini wide9"
                      type="button"
                      disabled={busy}
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel plan
                    </button>
                  ))}
              </section>
            </div>

            <section className="fx-sec">
              <div className="fx-sh">
                <h2>If a payment fails</h2>
              </div>
              <Safe title="Your stops keep running">
                Open positions keep their stop, their trailing stop and their monitoring until they
                close, whether or not the plan is paid. Only new entries pause. Your money never leaves
                your own exchange account, and our key can read and trade but never withdraw.
              </Safe>
            </section>

            <BillingHistory invoices={invoices} />
          </>
        ) : (
          /* ================= no plan yet ================= */
          <>
            <section className="fx-hero rv d1">
              <div className="fx-chips">
                <span className="fx-chip warn4">
                  <i />
                  No plan yet
                </span>
                <span className="fx-chip">
                  <i style={{ background: "var(--fx-t3)" }} />
                  {bots.length ? `${bots.length} agent${bots.length === 1 ? "" : "s"} connected` : "No agent connected"}
                </span>
                <span className="fx-chip">
                  <i style={{ background: "var(--fx-t3)" }} />
                  Nothing being charged
                </span>
              </div>
              <RailsBackdrop />
              <div className="fx-hero-in">
                <p className="fx-eqlab">Costs you today</p>
                <p className="fx-eq">{money(0, "NGN")}</p>
                <span className="fx-delta">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M20 6.5 9.2 17.3 4 12.1" />
                  </svg>
                  {freePlan ? `${freePlan.name} needs no card and no exchange keys` : "Nothing is charged until you choose a plan"}
                </span>

                <div className="fx-emptyrow">
                  {freePlan && (
                    <button className="fx-cta main2" type="button" style={{ flex: "0 0 auto", minWidth: 0 }} disabled={busy} onClick={startFree}>
                      Start on {freePlan.name}
                    </button>
                  )}
                  <button
                    className="fx-cta ghost2"
                    type="button"
                    style={{ flex: "0 0 auto", minWidth: 0 }}
                    onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    Compare plans
                  </button>
                </div>

                <div className="fx-substat">
                  <div className="fx-ss">
                    <span>Indicators available</span>
                    <b>400</b>
                    <i>and counting</i>
                  </div>
                  <div className="fx-ss">
                    <span>Exchanges supported</span>
                    <b>{DESIGN_EXCHANGES.length}</b>
                    <i>{DESIGN_EXCHANGES.map((x) => x.name).join(", ")}</i>
                  </div>
                  {freePlan && (
                    <div className="fx-ss">
                      <span>Agents on {freePlan.name}</span>
                      <b>{freePlan.entitlements.max_concurrent_agents}</b>
                      <i>free</i>
                    </div>
                  )}
                  <div className="fx-ss">
                    <span>Card needed</span>
                    <b>No</b>
                  </div>
                </div>
              </div>
            </section>

            <section className="fx-sec">
              <div className="fx-sh">
                <h2>
                  What happens after you start <span className="sub2">nothing here needs a card</span>
                </h2>
              </div>
              <div className="fx-cols">
                <div className="fx-spine">
                  <div className="fx-ev good">
                    <span className="t2">Step 1</span>
                    <b>Point your agent at two endpoints</b>
                    <p>
                      We send candles plus the indicators you pick. Your agent replies buy, sell or
                      hold. n8n, Make, Zapier or your own code.
                    </p>
                  </div>
                  <div className="fx-ev good">
                    <span className="t2">Step 2</span>
                    <b>Watch it trade on paper</b>
                    <p>
                      Real candles, simulated fills. You see every decision and the exact data behind
                      it, without a naira on the line.
                    </p>
                  </div>
                  <div className="fx-ev good">
                    <span className="t2">Step 3</span>
                    <b>Get your first bot review</b>
                    <p>
                      At {freePlan?.entitlements.bot_review_unlock_closed_trades ?? 20} closed trades on
                      the same prompt, we read them back against what your agent saw and name the rule
                      losing you money. Free, once.
                    </p>
                  </div>
                  <div className="fx-ev">
                    <span className="t2">Step 4</span>
                    <b>Go live when you want to</b>
                    <p>
                      Move to a paid plan, connect your exchange with trade-only keys, and the same agent
                      starts placing real orders. Your money never leaves your account.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="fx-soft" style={{ marginBottom: 14 }}>
                    <h3>Why start on paper</h3>
                    <p>
                      An agent that has never traded is a guess. Twenty closed trades on paper cost
                      nothing and tell you whether the strategy holds up before a single naira is at
                      risk. Most people who go straight to live find that out the expensive way.
                    </p>
                  </div>
                  <div className="fx-soft">
                    <h3 style={{ marginBottom: 12 }}>What you never pay for</h3>
                    <div className="fx-riskline">
                      <span>Market data on Paper</span>
                      <b>Free</b>
                    </div>
                    <div className="fx-riskline">
                      <span>Stops and monitoring</span>
                      <b>In every plan</b>
                    </div>
                    <div className="fx-riskline">
                      <span>Your decision record</span>
                      <b>Always yours</b>
                    </div>
                    <div className="fx-riskline">
                      <span>Setup or cancellation</span>
                      <b>{money(0, "NGN")}</b>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <PlansSection
              plans={sortedPlans}
              cycle={cycle}
              setCycle={setCycle}
              cur={cur}
              setCur={setCur}
              heading={
                <>
                  Plans <span className="sub2">the difference is only what your agents can reach</span>
                </>
              }
              tagFor={(p) => (p.is_free ? { text: "Start here", current: true } : null)}
              actionFor={(p) =>
                p.is_free
                  ? { label: `Start on ${p.name}`, go: true, disabled: busy, onClick: startFree }
                  : {
                      label: `Choose ${p.name}`,
                      disabled: busy,
                      onClick: () => openPay({ kind: "subscribe", plan: p, cycle }),
                    }
              }
            />

            <section className="fx-mom">
              <div className="fx-sh">
                <h2>
                  What you unlock <span className="sub2">nothing claimed yet</span>
                </h2>
                <button className="fx-link" type="button" onClick={() => explain(HOW_BILLING)}>
                  How billing works &rarr;
                </button>
              </div>
              <div className="fx-momgrid">
                <div>
                  <div className="fx-meter">
                    <div className="fx-mh">
                      <b>First bot review</b>
                      <span>unlocks at {freePlan?.entitlements.bot_review_unlock_closed_trades ?? 20} trades</span>
                    </div>
                    <Segments filled={0} />
                    <p className="fx-mnote">
                      Connect an agent and let it close{" "}
                      {freePlan?.entitlements.bot_review_unlock_closed_trades ?? 20} trades on the same
                      prompt. Paper counts. The first review is free, and it does not need a paid plan.
                    </p>
                  </div>
                  <div className="fx-streaks2">
                    <div className="fx-stk2">
                      <span>Agents connected</span>
                      <b style={bots.length ? undefined : { color: "var(--fx-t3)" }}>{bots.length}</b>
                      <i>{bots.length ? "ready for a plan" : "starts when you do"}</i>
                    </div>
                    <div className="fx-stk2">
                      <span>Reviews available</span>
                      <b style={reviews?.balance ? undefined : { color: "var(--fx-t3)" }}>
                        {reviews ? reviews.balance : 0}
                      </b>
                      <i>of {freePlan?.entitlements.bot_reviews_per_month ?? 1} free</i>
                      <Dots total={freePlan?.entitlements.bot_reviews_per_month ?? 1} on={reviews?.balance ?? 0} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="fx-badges2">
                    <div className={`fx-bdg ${bots.length ? "won" : ""}`}>
                      {!bots.length && <span className="lk2">step 1</span>}
                      <span className="bi">{BADGE_ICONS.bot}</span>
                      <b>First agent connected</b>
                      <span>Two endpoints, no SDK</span>
                    </div>
                    <div className="fx-bdg">
                      <span className="lk2">step 2</span>
                      <span className="bi">{BADGE_ICONS.target}</span>
                      <b>First trade closed</b>
                      <span>On paper is fine</span>
                    </div>
                    <div className="fx-bdg">
                      <span className="lk2">{freePlan?.entitlements.bot_review_unlock_closed_trades ?? 20} trades</span>
                      <span className="bi">{BADGE_ICONS.bars}</span>
                      <b>First bot review</b>
                      <span>The rule costing you money, named</span>
                    </div>
                    <div className={`fx-bdg ${exchangeRecord.length ? "won" : ""}`}>
                      {!exchangeRecord.length && <span className="lk2">needs a paid plan</span>}
                      <span className="bi">{BADGE_ICONS.plug}</span>
                      <b>Exchange connected</b>
                      <span>Trade-only keys, no withdrawal</span>
                    </div>
                  </div>
                  <div className="fx-next">
                    {freePlan && (
                      <div className="fx-nx">
                        <em>Now</em>
                        <span>
                          <b>Start on {freePlan.name}</b> &mdash; free, no card
                        </span>
                      </div>
                    )}
                    {sortedPlans
                      .filter((p) => !p.is_free)
                      .slice(0, 2)
                      .map((p, i) => (
                        <div className="fx-nx" key={p.code}>
                          <em>{i === 0 ? "Next" : "Later"}</em>
                          <span>
                            <b>{i === 0 ? "Live execution" : "More than one exchange"}</b> &mdash; needs {p.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="fx-sec">
              <div className="fx-sh">
                <h2>Before you pay anything</h2>
              </div>
              <Safe title="Your money stays where it is">
                Candleweb never holds your funds. When you go live, you give us a key that can read and
                trade on your own exchange account and nothing else &mdash; it cannot withdraw. If a
                payment ever fails, open positions keep their stop, their trailing stop and their
                monitoring until they close. Only new entries pause.
              </Safe>
            </section>

            <section className="fx-sec">
              <div className="fx-sh">
                <h2>When you are ready to pay</h2>
              </div>
              <div className="fx-cols even9">
                <div className="fx-soft">
                  <h3 style={{ marginBottom: 12 }}>How you pay</h3>
                  <div className="fx-pays">
                    <div className="fx-pay9">
                      <span className="pi9">
                        <CardGlyph />
                      </span>
                      <span className="pt9">
                        <b>Card, in naira</b>
                        <span>Card, bank transfer or USSD through Flutterwave</span>
                      </span>
                    </div>
                    <div className="fx-pay9" style={{ opacity: 0.6 }}>
                      <span className="pi9">
                        <CoinGlyph />
                      </span>
                      <span className="pt9">
                        <b>Crypto</b>
                        <span>USDT or USDC — coming soon</span>
                      </span>
                      <span className="pc9">Soon</span>
                    </div>
                  </div>
                </div>
                <div className="fx-soft">
                  <h3 style={{ marginBottom: 12 }}>{invoices.length ? "Past charges" : "No charges yet"}</h3>
                  <p style={{ marginBottom: 14 }}>
                    {invoices.length
                      ? "Your earlier invoices are listed below."
                      : "Your invoices will appear here once you are on a paid plan."}{" "}
                    Cancel whenever you like and the plan runs to the end of the period you already paid
                    for.
                  </p>
                  <button
                    className="fx-mini wide9"
                    type="button"
                    onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    Choose a plan
                  </button>
                </div>
              </div>
            </section>

            {invoices.length > 0 && <BillingHistory invoices={invoices} />}
          </>
        )}

        {/* ---- how would you like to pay ---- */}
        <Dialog
          open={!!pay}
          onClose={() => !busy && setPay(null)}
          labelledBy="pay-title"
          icon={<CardStackIcon />}
          title={<span id="pay-title">How would you like to pay?</span>}
          subtitle={payLine}
          footer={
            <>
              <button className="fx-cta ghost2" type="button" disabled={busy} onClick={() => setPay(null)}>
                Not now
              </button>
              <button className="fx-cta main2" type="button" disabled={busy} onClick={continuePay}>
                {busy ? "Opening checkout…" : "Continue"}
              </button>
            </>
          }
        >
          <div className="fx-pays pick9">
            <button
              type="button"
              className={`fx-pay9 ${payMethod === "card" ? "on9" : ""}`}
              aria-pressed={payMethod === "card"}
              onClick={() => setPayMethod("card")}
            >
              <span className="pi9">
                <CardGlyph />
              </span>
              <span className="pt9">
                <b>Pay with card</b>
                <span>In naira. Card, bank transfer or USSD through Flutterwave.</span>
              </span>
              <span className="pc9" aria-hidden="true">
                <Tick />
              </span>
            </button>
            <button type="button" className="fx-pay9" disabled aria-disabled="true">
              <span className="pi9">
                <CoinGlyph />
              </span>
              <span className="pt9">
                <b>Pay with crypto</b>
                <span>USDT or USDC, from any wallet or exchange.</span>
              </span>
              <span className="pc9">Soon</span>
            </button>
          </div>
          <p className="fx-dwarn">
            You&rsquo;ll finish on Flutterwave&rsquo;s secure checkout, then come back here. Your plan
            changes once the payment is confirmed. Either way your trading funds stay on your own
            exchange &mdash; this pays for the platform, nothing else.
          </p>
        </Dialog>

        {/* ---- move to another plan (up or down) ---- */}
        {live && moveTo && (
          <MovePlanDialog
            from={currentPlan}
            to={moveTo}
            live={live}
            busy={busy}
            onClose={() => setMoveTo(null)}
            onUpgrade={() => {
              const target = moveTo;
              setMoveTo(null);
              setTimeout(() => openPay({ kind: "change", plan: target, cycle }), 240);
            }}
            onDowngrade={() => confirmDowngrade(moveTo)}
          />
        )}

        {/* ---- cancel ---- */}
        {live && (
          <Dialog
            open={cancelOpen}
            onClose={() => !busy && setCancelOpen(false)}
            labelledBy="cancel-title"
            icon={<ShieldIcon />}
            title={<span id="cancel-title">Cancel your plan?</span>}
            subtitle="Your stops do not cancel with it"
            footer={
              <>
                <button className="fx-cta ghost2" type="button" disabled={busy} onClick={() => setCancelOpen(false)}>
                  Keep my plan
                </button>
                <button className="fx-cta main2" type="button" disabled={busy} onClick={confirmCancel}>
                  {busy ? "Cancelling…" : "Cancel plan"}
                </button>
              </>
            }
          >
            <div className="fx-riskline">
              <span>{live.plan_name} stays active until</span>
              <b>{longDate(live.current_period_end)}</b>
            </div>
            <div className="fx-riskline">
              <span>Open positions</span>
              <b>Keep their stops</b>
            </div>
            <div className="fx-riskline">
              <span>New entries</span>
              <b className="fx-dn">Stop {shortDate(live.current_period_end)}</b>
            </div>
            <div className="fx-riskline">
              <span>Your trade record</span>
              <b>Stays available</b>
            </div>
            <p className="fx-dwarn">
              Anything already open keeps its stop, its trailing stop and its monitoring until it
              closes. Candleweb keeps watching those positions even after the plan ends &mdash; we are
              not going to walk away from a live trade over a subscription.
            </p>
          </Dialog>
        )}

      </DashboardShell>
    </>
  );
};

/* ------------------------------------------------------------------ *
 * on-a-plan: usage, streaks, badges
 * ------------------------------------------------------------------ */

function UsageSection({
  live,
  usage,
  reviews,
  exchangeCount,
  bots,
  sortedPlans,
  currentPlan,
}: {
  live: SubscriptionV2;
  usage: RootState["subscriptionV2"]["usage"];
  reviews: RootState["subscriptionV2"]["reviews"];
  exchangeCount: number;
  bots: RootState["tradingV2"]["bots"];
  sortedPlans: PlanV2[];
  currentPlan?: PlanV2;
}) {
  const included = Number(usage?.included ?? 0);
  const used = Number(usage?.used ?? 0);
  const filled = included > 0 ? Math.min(20, Math.floor((used / included) * 20)) : 0;
  const liveBot = bots.find((b) => b.status === "ACTIVE");
  const higher = sortedPlans.filter((p) => planRank(p) > planRank(currentPlan));
  const months = live.months_on_plan;

  return (
    <section className="fx-mom">
      <div className="fx-sh">
        <h2>
          What you are using <span className="sub2">where you sit against what the plan includes</span>
        </h2>
        <button className="fx-link" type="button" onClick={() => explain(HOW_BILLING)}>
          How billing works &rarr;
        </button>
      </div>
      <div className="fx-momgrid">
        <div>
          <div className="fx-meter">
            <div className="fx-mh">
              <b>Included volume this {live.cycle === "annual" ? "period" : "month"}</b>
              <span>{usage ? `${usd(used)} of ${usd(included)}` : "—"}</span>
            </div>
            <Segments filled={filled} />
            <p className="fx-mnote">
              {included > 0 ? (
                <>
                  Nothing extra is charged until your agents move more than {usd(included)} this
                  period. After that it is {Number(usage?.overage_rate_pct ?? 0)}% on the amount above
                  the line, not on everything.
                  {Number(usage?.overage_due ?? 0) > 0 && ` Estimated so far: ${usd(usage?.overage_due)}.`}
                </>
              ) : (
                <>{live.plan_name} runs on paper, so there is no live volume to count.</>
              )}
            </p>
          </div>
          <div className="fx-streaks2">
            <div className="fx-stk2">
              <span>Months on {live.plan_name}</span>
              <b>{months}</b>
              <i>since {longDate(live.started_at)}</i>
              <Dots total={6} on={Math.min(6, months)} />
            </div>
            {reviews && reviews.included_per_month > 0 && (
              <div className="fx-stk2">
                <span>Reviews used this {live.cycle === "annual" ? "period" : "month"}</span>
                <b className="amb3">{reviews.used_this_period}</b>
                <i>of {reviews.included_per_month}</i>
                <Dots total={reviews.included_per_month} on={reviews.used_this_period} />
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="fx-badges2">
            <div className={`fx-bdg ${exchangeCount ? "won" : ""}`}>
              {!exchangeCount && <span className="lk2">not yet</span>}
              <span className="bi">{BADGE_ICONS.plug}</span>
              <b>Exchange connected</b>
              <span>Trade-only keys, no withdrawal</span>
            </div>
            <div className={`fx-bdg ${liveBot ? "won" : ""}`}>
              {!liveBot && <span className="lk2">not yet</span>}
              <span className="bi">{BADGE_ICONS.bot}</span>
              <b>Agent live on {live.plan_name}</b>
              <span>{liveBot ? liveBot.name : "Start a bot to earn this"}</span>
            </div>
            <div className={`fx-bdg ${months >= 6 ? "won" : ""}`}>
              {months < 6 && (
                <span className="lk2">
                  {6 - months} month{6 - months === 1 ? "" : "s"}
                </span>
              )}
              <span className="bi">{BADGE_ICONS.cap}</span>
              <b>Half year</b>
              <span>Six months without a lapse</span>
            </div>
            <div className={`fx-bdg ${live.cycle === "annual" ? "won" : ""}`}>
              {live.cycle !== "annual" && <span className="lk2">locked</span>}
              <span className="bi">{BADGE_ICONS.target}</span>
              <b>Annual saver</b>
              <span>{live.cycle === "annual" ? "Paying yearly" : "Switch to yearly and pay less"}</span>
            </div>
          </div>
          <div className="fx-next">
            {reviews && reviews.included_per_month > 0 && (
              <div className="fx-nx">
                <em>Now</em>
                <span>
                  <b>Bot review</b> &mdash; {reviews.balance} left this {live.cycle === "annual" ? "period" : "month"}
                </span>
              </div>
            )}
            {higher.slice(0, 2).map((p, i) => (
              <div className="fx-nx" key={p.code}>
                <em>{i === 0 ? "Next" : "Later"}</em>
                <span>
                  <b>
                    {p.entitlements.max_concurrent_agents} agents at once
                    {p.entitlements.max_exchanges == null ? ", every exchange" : ""}
                  </b>{" "}
                  &mdash; needs {p.name}
                </span>
              </div>
            ))}
            {!higher.length && (
              <div className="fx-nx">
                <em>Next</em>
                <span>
                  <b>You&rsquo;re on the top plan</b> &mdash; nothing left to unlock
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * billing history
 * ------------------------------------------------------------------ */

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "" },
  open: { label: "Due", cls: "warn9" },
  failed: { label: "Failed", cls: "bad9" },
  draft: { label: "Draft", cls: "off9" },
  void: { label: "Void", cls: "off9" },
};

function BillingHistory({ invoices }: { invoices: InvoiceV2[] }) {
  return (
    <section className="fx-sec">
      <div className="fx-sh">
        <h2>
          Billing history{" "}
          <span className="sub2">
            {invoices.length} charge{invoices.length === 1 ? "" : "s"}
          </span>
        </h2>
      </div>
      {invoices.length === 0 ? (
        <div className="fx-soft">
          <p>No charges yet.</p>
        </div>
      ) : (
        <>
          <div className="fx-pos">
            {invoices.map((inv) => {
              const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: "" };
              return (
                <div className="fx-brow" key={inv.id}>
                  <span className="bd9">{rowDate(inv.paid_at ?? inv.issued_at)}</span>
                  <span className="bt9">{inv.description}</span>
                  <span className="bm9">{money(inv.total, inv.currency)}</span>
                  <span className={`bs9 ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
          <div className="fx-stopl" style={{ marginTop: 12 }}>
            <span>Charges are shown in the currency they were taken in.</span>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * move-plan dialog — upgrades go on to payment, downgrades are scheduled
 * ------------------------------------------------------------------ */

function MovePlanDialog({
  from,
  to,
  live,
  busy,
  onClose,
  onUpgrade,
  onDowngrade,
}: {
  from?: PlanV2;
  to: PlanV2;
  live: SubscriptionV2;
  busy: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onDowngrade: () => void;
}) {
  const up = planRank(to) > planRank(from);
  const fromFree = !!from?.is_free;
  const a = from?.entitlements;
  const b = to.entitlements;
  const rows: [string, string, string][] = a
    ? ([
        ["Agents at once", String(a.max_concurrent_agents), String(b.max_concurrent_agents)],
        ["Exchanges", exchangesLabel(a.max_exchanges), exchangesLabel(b.max_exchanges)],
        ["Bot reviews a month", String(a.bot_reviews_per_month), String(b.bot_reviews_per_month)],
        ["Included volume", usd(a.included_volume_usd), usd(b.included_volume_usd)],
        ["Live execution", a.live_execution ? "Yes" : "No", b.live_execution ? "Yes" : "No"],
      ] as [string, string, string][]).filter(([, x, y]) => x !== y)
    : [];

  return (
    <Dialog
      open
      onClose={() => !busy && onClose()}
      tone={up ? "teal" : "amber"}
      labelledBy="move-title"
      icon={<CheckIcon />}
      title={<span id="move-title">Move to {to.name}?</span>}
      subtitle={up ? "Nothing stops while the plan changes" : `You keep ${live.plan_name} until the period ends`}
      footer={
        <>
          <button className="fx-cta ghost2" type="button" disabled={busy} onClick={onClose}>
            Keep {live.plan_name}
          </button>
          <button className="fx-cta main2" type="button" disabled={busy} onClick={up ? onUpgrade : onDowngrade}>
            {up ? "Continue to payment" : busy ? "Scheduling…" : `Move to ${to.name}`}
          </button>
        </>
      }
    >
      {rows.map(([label, x, y]) => (
        <div className="fx-riskline" key={label}>
          <span>{label}</span>
          <b>
            {x} &rarr; {y}
          </b>
        </div>
      ))}
      <div className="fx-riskline">
        <span>Charged today</span>
        <b>{!up ? "Nothing" : fromFree ? "The full price, at checkout" : "Prorated at checkout"}</b>
      </div>
      {!up && (
        <div className="fx-riskline">
          <span>Takes effect</span>
          <b>{longDate(live.current_period_end)}</b>
        </div>
      )}
      <p className="fx-dwarn">
        {up && fromFree
          ? `Your running agents keep running through the change. ${to.name} starts once the payment is confirmed and renews from that day.`
          : up
          ? `Your running agents keep running through the change. Today's charge is only the difference for what is left of this period, and your renewal date (${longDate(live.renews_on)}) does not move.`
          : `Nothing is charged now. ${live.plan_name} and everything it includes stays until ${longDate(live.current_period_end)}, then you move to ${to.name}. Open positions keep their stops either way.`}
      </p>
    </Dialog>
  );
}

export default SubscriptionPage;
