import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { AppDispatch, RootState } from "../redux/store";
import subscriptionV2Service from "../services/subscriptionV2Service";
import useUserStore from "../lib/hooks/useUserStore";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import { Written, useRevealOnScroll } from "../components/public/Written";
import { PlanV2, ReviewPackV2, SubscriptionV2 } from "../types/subscriptionV2";
import { isLivePlan, longDate, planRank } from "../lib/subscriptionV2Format";
import { validateEmailAddress } from "../utils/emailValidate";
import { signUpPath } from "../lib/authRedirect";
import useAxiosAuth from "../lib/hooks/useAxiosAuth";
import PaymentMethodModal from "../components/public/PaymentMethodModal";
import { writePending } from "../lib/subscriptionPending";
import { success as toastSuccess, warning as toastWarning } from "../components/alert/Toast";

/**
 * Public pricing page, built from candleweb-pricing.html.
 *
 * Every number comes from `GET /subscription_v2/plans/` and
 * `GET /subscription_v2/review-packs/`, both public. Plan names, taglines,
 * prices, feature lists, included volume and the overage rate are the
 * backend's, so this page cannot drift from what checkout actually charges.
 *
 * Choosing a plan starts checkout here. It used to bounce to
 * /dashboard/subscription, which read as the page refusing to sell: you picked
 * a plan on the pricing page and landed somewhere else with nothing happening.
 * The money still moves through the same `subscriptionV2Service` calls the
 * dashboard uses, and the processor still returns to the dashboard — that is
 * where the plan lives and where the result is verified — so there is one
 * checkout, started from two places, not two checkouts.
 */

type Cycle = "monthly" | "annual";
type Currency = "NGN" | "USD";

/**
 * What the payment dialog is about to buy.
 *
 * `subscribe` and `change` hit different endpoints for the same gesture: the
 * API refuses POST /subscribe/ from anyone who already holds a plan, so a
 * subscriber picking a different card here has to go through /change-plan/,
 * exactly as the dashboard does.
 */
type Intent =
  | { kind: "subscribe"; plan: PlanV2 }
  | { kind: "change"; plan: PlanV2 }
  | { kind: "reviews"; pack: ReviewPackV2 };

const ORDER = ["paper", "builder", "desk"];
const LEAD = "builder";

const Tick = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </svg>
);
const Minus = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 12h12" />
  </svg>
);

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (value: number, currency: Currency) => {
  const sym = currency === "NGN" ? "₦" : "$";
  const dec = currency === "USD" && Math.round(value) !== value ? 2 : 0;
  return (
    sym +
    value.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
  );
};
const usd = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

/** What the plan is actually charged per period. */
const billed = (plan: PlanV2 | undefined, cur: Currency, cycle: Cycle) =>
  num(plan?.prices?.[cur]?.[cycle]);

/** The same fee expressed per month, so yearly and monthly can be compared. */
const perMonth = (plan: PlanV2 | undefined, cur: Currency, cycle: Cycle) =>
  cycle === "monthly" ? billed(plan, cur, "monthly") : billed(plan, cur, "annual") / 12;

/** Entitlement helpers — `null` means unlimited throughout this API. */
const cap = (v: unknown, unlimited = "Unlimited") => (v == null ? unlimited : String(v));

const PricingPage = () => {
  useRevealOnScroll();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useUserStore();
  const isLoggedIn = Object.keys(user).length > 0;

  const { plans, reviewPacks, subscription, reviews } = useSelector(
    (state: RootState) => state.subscriptionV2,
  );

  const axiosToken = useAxiosAuth();

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [cur, setCur] = useState<Currency>("NGN");
  /** What is waiting on "card or crypto", or null. */
  const [intent, setIntent] = useState<Intent | null>(null);
  const [paying, setPaying] = useState(false);
  /* the user's own answer to "charge me again when the period ends" */
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    dispatch(subscriptionV2Service.listPlans());
    dispatch(subscriptionV2Service.listReviewPacks());
  }, [dispatch]);

  /* A visitor who is already signed in may already be paying us. Without this
     the page can only offer /subscribe/, which the API refuses for anyone on a
     plan — the "you are already on a plan" wall this page used to hit. */
  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch(subscriptionV2Service.getMe(axiosToken));
    dispatch(subscriptionV2Service.getReviews(axiosToken));
  }, [dispatch, isLoggedIn, axiosToken]);

  /** The subscription that is still granting a plan, or null. */
  const live = isLivePlan(subscription) ? subscription : null;

  /* An empty store is "not asked yet", not "no plan" — on a first paint, or
     after a /me/ that went out while the access token was being refreshed. A
     click that lands then asks again rather than answering from the gap, which
     is what sent a subscriber to /subscribe/ and got them refused. */
  const currentPlanOf = async (): Promise<SubscriptionV2 | null> => {
    if (!isLoggedIn) return null;
    if (live) return live;
    const res: any = await dispatch(subscriptionV2Service.getMe(axiosToken));
    const sub = res?.payload?.subscription ?? null;
    return isLivePlan(sub) ? sub : null;
  };

  const byCode = useMemo(() => {
    const map: Record<string, PlanV2> = {};
    (plans || []).forEach((p: PlanV2) => (map[p.code] = p));
    return map;
  }, [plans]);

  const ordered = useMemo(
    () =>
      ORDER.map((code) => byCode[code]).filter(Boolean) as PlanV2[],
    [byCode],
  );

  /* Volume allowances and the overage rate drive the estimator, so it can
     never disagree with what the plans actually include. */
  const included = (code: string) => num(byCode[code]?.entitlements?.included_volume_usd);
  const overage = (code: string) => num(byCode[code]?.entitlements?.overage_rate_pct) / 100;

  /* ---------------- estimator ---------------- */
  const [mode, setMode] = useState<"paper" | "live">("live");
  const [agents, setAgents] = useState(2);
  const [exchanges, setExchanges] = useState(1);
  const [volume, setVolume] = useState(6000);
  /* A plan is only called a "fit" once the visitor has told us something. */
  const [touched, setTouched] = useState(false);

  const volFee = (code: string, v: number) =>
    code === "paper" ? 0 : Math.max(0, v - included(code)) * overage(code);

  const fit = useMemo(() => {
    if (!ordered.length) return null;
    if (mode === "paper") {
      return {
        code: "paper",
        why:
          agents > 1
            ? "Paper runs one agent. Start with your strongest, then move to Builder to run up to three."
            : "One agent against live candles with simulated fills. No card, no keys.",
      };
    }
    const builderAgents = byCode.builder?.entitlements?.max_concurrent_agents ?? 3;
    const builderExch = byCode.builder?.entitlements?.max_exchanges ?? 1;
    const needsDesk = agents > builderAgents || exchanges > builderExch;

    const costBuilder = perMonth(byCode.builder, "USD", cycle) + volFee("builder", volume);
    const costDesk = perMonth(byCode.desk, "USD", cycle) + volFee("desk", volume);

    if (!needsDesk && costDesk < costBuilder) {
      return {
        code: "desk",
        why: "Builder would cover you, but at this volume Desk costs less each month.",
      };
    }
    if (!needsDesk) {
      return {
        code: "builder",
        why: `One exchange and up to ${builderAgents} agents. Builder covers it.`,
      };
    }
    if (agents > builderAgents && exchanges > builderExch) {
      return {
        code: "desk",
        why: `More than ${builderAgents} agents across ${exchanges} exchanges needs Desk.`,
      };
    }
    if (agents > builderAgents) {
      const deskAgents = byCode.desk?.entitlements?.max_concurrent_agents ?? 15;
      return {
        code: "desk",
        why: `${agents} agents at once needs Desk, which runs up to ${deskAgents}.`,
      };
    }
    return { code: "desk", why: `Trading on ${exchanges} exchanges needs Desk.` };
    /* volFee reads only byCode, which is listed. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.length, mode, agents, exchanges, volume, cycle, byCode]);

  const fitCode = fit?.code ?? "builder";
  const fitPlan = byCode[fitCode];

  /* The volume at which Desk's higher fee is repaid by its larger allowance. */
  const breakEven = useMemo(() => {
    const rate = overage("builder");
    if (!rate) return 0;
    const diff = perMonth(byCode.desk, "USD", cycle) - perMonth(byCode.builder, "USD", cycle);
    return included("builder") + diff / rate;
    /* included/overage read only byCode, which is listed. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCode, cycle]);

  const tip = useMemo(() => {
    if (mode === "paper" || !fitPlan) return "";
    if (fitCode === "builder" || (fitCode === "desk" && exchanges === 1 && agents <= 3))
      return `Above about ${usd(Math.round(breakEven / 1000) * 1000)} a month, Desk costs less than Builder.`;
    if (volume > included("desk"))
      return `You're ${usd(volume - included("desk"))} over Desk's included volume, so the ${
        overage("desk") * 100
      }% applies to that part only.`;
    return "";
    /* included/overage read only byCode, which is listed. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fitCode, exchanges, agents, volume, breakEven, fitPlan, byCode]);

  /* The fitting plan's name changes with a swap, not a jump. */
  const nameRef = useRef<HTMLParagraphElement | null>(null);
  const lastFit = useRef<string | null>(null);
  useEffect(() => {
    const el = nameRef.current;
    if (!el || lastFit.current === fitCode) return;
    if (lastFit.current !== null) {
      el.classList.remove("swap");
      void el.offsetWidth;
      el.classList.add("swap");
    }
    lastFit.current = fitCode;
  }, [fitCode]);

  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    setTouched(true);
    set(v);
  };

  /* ---------------- the closing "start free" box ---------------- */
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  /* The address typed here is carried to /register and seeded into its email
     field, so nobody types it twice. */
  const startFree = () => {
    const value = email.trim();
    if (!validateEmailAddress(value)) {
      setEmailError(
        value
          ? "That email address is missing something. Check it and try again."
          : "Enter your email so we know where to send your account link.",
      );
      return;
    }
    router.push(`/register?email=${encodeURIComponent(value)}`);
  };

  /* ---------------- choosing a plan ---------------- */

  /* Signing in is the one thing that still has to happen elsewhere — there is
     no anonymous checkout. Coming back to /pricing rather than the dashboard
     means the plan they picked is still in front of them. */
  const choose = async (code: string) => {
    const plan = byCode[code];
    if (!isLoggedIn) {
      router.push(signUpPath("/pricing"));
      return;
    }
    if (!plan) {
      router.push("/dashboard/subscription");
      return;
    }
    const held = await currentPlanOf();
    /* Already holding a plan: the only thing left to buy is a different one,
       and that is a change, never a second subscription. */
    if (held) {
      if (held.plan_code === plan.code) {
        toastWarning(
          `You're already on ${plan.name}. Everything about it lives on your subscription page.`,
          "plan",
        );
        router.push("/dashboard/subscription");
        return;
      }
      /* Moving up is paid for now, so it finishes here. Moving down takes no
         money today — it only decides when the current plan stops — so it goes
         to the subscription page, which says what is lost and from when. */
      if (planRank(plan) > planRank(byCode[held.plan_code])) {
        /* from a paid plan, start from the answer already on file; a free
           plan never asked */
        setAutoRenew(byCode[held.plan_code]?.is_free ? true : held.auto_renew ?? true);
        setIntent({ kind: "change", plan });
        return;
      }
      router.push(`/dashboard/subscription?move=${encodeURIComponent(plan.code)}`);
      return;
    }
    /* The free plan takes no money, so it asks no payment question. */
    if (plan.is_free) {
      submit({ kind: "subscribe", plan });
      return;
    }
    setAutoRenew(true);
    setIntent({ kind: "subscribe", plan });
  };

  /* ---------------- buying bot reviews ---------------- */

  /* No plan check here, deliberately. The subscription page sells a pack to
     whoever clicks one and lets the API rule on it; guessing the same rule a
     second time from this page's copy of /me/ only invents a refusal the
     backend never made — which is exactly what it did while that copy was
     still loading. Signing in is the one precondition, because there is no
     anonymous checkout to send them to. */
  const buyPack = (pack: ReviewPackV2) => {
    if (!isLoggedIn) {
      router.push(signUpPath("/pricing"));
      return;
    }
    setIntent({ kind: "reviews", pack });
  };

  /* ---------------- one checkout, three things to buy ---------------- */

  const submit = async (it: Intent) => {
    setPaying(true);
    let res: any;
    if (it.kind === "reviews") {
      res = await dispatch(
        subscriptionV2Service.buyReviews({
          api: axiosToken,
          pack: it.pack.code,
          callbackUrl: `${window.location.origin}/dashboard/subscription?checkout=reviews`,
        }),
      );
    } else {
      const thunk =
        it.kind === "change" ? subscriptionV2Service.changePlan : subscriptionV2Service.subscribe;
      res = await dispatch(
        thunk({
          api: axiosToken,
          plan: it.plan.code,
          cycle: it.plan.is_free ? "monthly" : cycle,
          /* a free plan never charges, so there is nothing to agree to */
          autoRenew: it.plan.is_free ? undefined : autoRenew,
        }),
      );
    }
    if (res.meta.requestStatus !== "fulfilled") {
      /* subscriptionV2Service has already said why — a second toast here is
         the same refusal twice. */
      setPaying(false);
      setIntent(null);
      return;
    }
    const body = res.payload ?? {};
    if (body.checkout_url) {
      /* The dashboard reads this when the processor sends them back, so the
         result is confirmed against the API rather than trusted from a
         redirect. Leaving the page: `paying` stays on. */
      writePending(
        it.kind === "reviews"
          ? {
              kind: "reviews",
              quantity: num(it.pack.quantity),
              number: body.invoice?.number ?? null,
              before: reviews?.balance ?? 0,
            }
          : { kind: "plan", plan: it.plan.code },
      );
      window.location.assign(body.checkout_url);
      return;
    }
    setPaying(false);
    setIntent(null);
    if (it.kind === "reviews") {
      toastSuccess("Done. Your reviews are added as soon as the payment is confirmed.");
      router.push("/dashboard/subscription");
      return;
    }
    const free = it.kind === "subscribe" && it.plan.is_free;
    toastSuccess(
      body.scheduled && body.effective_at
        ? `Moving to ${it.plan.name} on ${longDate(body.effective_at)}. You keep ${
            subscription?.plan_name ?? "your plan"
          } until then.`
        : free
          ? `You're on ${it.plan.name}. Add a bot and it starts trading on paper — nothing at risk.`
          : `You're on ${it.plan.name}.`,
    );
    router.push(free ? "/dashboard" : "/dashboard/subscription");
  };

  const fee = perMonth(fitPlan, cur, cycle);
  const vFee = volFee(fitCode, volume);
  const incl = included(fitCode);
  const over = mode !== "paper" && volume > incl;
  const filledSegs = mode === "paper" || !incl ? 0 : over ? 20 : Math.round((volume / incl) * 20);

  const total =
    fitCode === "paper"
      ? money(0, cur)
      : cur === "USD"
        ? money(fee + vFee, "USD")
        : vFee > 0
          ? `${money(fee, "NGN")} + ${money(vFee, "USD")}`
          : money(fee, "NGN");

  /* A subscriber is not choosing a first plan, they are moving between plans —
     the button has to say so, or "Choose Desk" reads as a second purchase. */
  const planCta = (plan: PlanV2) => {
    if (live)
      return live.plan_code === plan.code
        ? `Your plan`
        : planRank(plan) > planRank(byCode[live.plan_code])
          ? `Move to ${plan.name}`
          : `Switch to ${plan.name}`;
    return plan.is_free ? `Start on ${plan.name}` : `Choose ${plan.name}`;
  };

  return (
    <>
      <Head>
        <title>Pricing | Candleweb</title>
        <meta
          name="description"
          content="Candleweb plans. Start on Paper for free, go live on Builder, or run many agents across exchanges on Desk. Pay in naira or crypto."
        />
        <meta property="og:title" content="Pricing | Candleweb" />
        <meta
          property="og:description"
          content="A flat monthly fee in naira or crypto, and a small fee only on volume above what your plan includes."
        />
        <link rel="canonical" href="https://candleweb.io/pricing" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="pricing-stage">
        <div className="pr-aura">
          <b className="b1" />
          <b className="b2" />
          <b className="b3" />
        </div>
        <div className="pr-grid" />

        <PublicHeader
          active="pricing"
          cta={{ label: "Start free", onClick: () => choose("paper") }}
        />

        {/* ================= hero ================= */}
        <header className="landing-wrap pr-hero" id="top">
          <p className="pr-eyebrow landing-rise">Plans and pricing</p>
          <h1 className="landing-rise">
            Same engine on every plan.{" "}
            <br />
            <span className="pr-grad">You choose how far it reaches.</span>
          </h1>
          <p className="pr-sub landing-rise">
            A flat monthly fee in naira or crypto. A{" "}
            {num(byCode.builder?.entitlements?.overage_rate_pct) || 0.1}% fee only on volume above
            what your plan includes, never on all of it. Start on Paper with no card and no
            exchange keys.
          </p>

          <Rails />

          <p className="pr-railcap landing-rise">
            Every plan pays for what happens in between: the data, the order, the stop and the
            record.
          </p>

          <div className="pr-toggles landing-rise">
            <div className="pr-sw" role="group" aria-label="Billing cycle">
              <button
                type="button"
                aria-pressed={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={cycle === "annual"}
                onClick={() => setCycle("annual")}
              >
                Yearly
              </button>
            </div>
            <div className="pr-sw" role="group" aria-label="Currency">
              <button type="button" aria-pressed={cur === "NGN"} onClick={() => setCur("NGN")}>
                Naira ₦
              </button>
              <button type="button" aria-pressed={cur === "USD"} onClick={() => setCur("USD")}>
                Dollar $
              </button>
            </div>
            <span className={`pr-save ${cycle === "annual" ? "on" : ""}`}>Two months free</span>
          </div>
        </header>

        {/* ================= plans ================= */}
        <section className="landing-wrap" id="plans" aria-label="Plans">
          {ordered.length === 0 ? (
            <p className="pr-railcap" style={{ padding: "40px 0" }}>
              Loading plans…
            </p>
          ) : (
            <div className="pr-plans">
              {ordered.map((plan) => {
                const amount = billed(plan, cur, cycle);
                const otherCur: Currency = cur === "NGN" ? "USD" : "NGN";
                const alt = plan.is_free
                  ? "Free, always"
                  : cycle === "annual"
                    ? `${money(perMonth(plan, cur, "annual"), cur)} a month, billed yearly`
                    : `or ${money(billed(plan, otherCur, "monthly"), otherCur)} a month`;
                return (
                  <article
                    className={`pr-plan landing-rise rise-pop ${plan.code === LEAD ? "lead" : ""} ${
                      touched && plan.code === fitCode ? "fit" : ""
                    }`}
                    key={plan.code}
                  >
                    {plan.code === LEAD && (
                      <span className="pr-leadflag">Live trading starts here</span>
                    )}
                    <span className="pr-fitflag">Fits you</span>
                    <h3>{plan.name}</h3>
                    <p className="pr-for">{plan.tagline}</p>
                    <div className="pr-price">
                      <b>{money(amount, cur)}</b>
                      {!plan.is_free && <span>{cycle === "monthly" ? "a month" : "a year"}</span>}
                    </div>
                    <span className="pr-alt">{alt}</span>
                    <button
                      type="button"
                      className={`pub-btn ${plan.code === LEAD ? "pub-btn-amber" : "pub-btn-teal"}`}
                      onClick={() => choose(plan.code)}
                    >
                      {planCta(plan)} <span>→</span>
                    </button>
                    <ul className="pr-feat">
                      {plan.features.map((f, i) => (
                        <li
                          key={i}
                          className={`${f.included ? "" : "no"} ${
                            i === 0 && f.text.toLowerCase().startsWith("everything") ? "first" : ""
                          }`}
                        >
                          {f.included ? <Tick /> : <Minus />}
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}

          <div className="pr-under landing-rise">
            <span className="ic">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 8l9-4 9 4-9 4-9-4z" />
                <path d="M7 11v5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5" />
              </svg>
            </span>
            <p>
              <b>Enrolled in the Academy?</b> Cohort fees include three months of Builder, so you
              can put the agent you build in class straight onto a live market.{" "}
              <Link href="/tutor#courses">See Academy courses</Link>
            </p>
          </div>
        </section>

        {/* ================= estimator ================= */}
        <section className="landing-wrap pr-sec" id="fit">
          <p className="pr-eyebrow landing-rise">Find your plan</p>
          <h2>
            <Written text="Tell us what you run. We'll show what it costs." />
          </h2>
          <p className="pr-lede landing-rise">
            Move the controls to match your setup. The plan that fits lights up above, and you see
            the monthly bill before you pay anything.
          </p>

          <div className="pr-est">
            <div className="pr-in landing-rise rise-left">
              <div className="pr-q">
                <div className="pr-qh">
                  <span className="lab" id="modeLab">
                    How are you trading?
                  </span>
                </div>
                <div className="pr-seg two" role="group" aria-labelledby="modeLab">
                  <button
                    type="button"
                    aria-pressed={mode === "paper"}
                    onClick={() => touch(setMode)("paper")}
                  >
                    Paper only, for now
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "live"}
                    onClick={() => touch(setMode)("live")}
                  >
                    With real money
                  </button>
                </div>
              </div>

              <div className="pr-q">
                <div className="pr-qh">
                  <label htmlFor="pr-agents">Agents running at once</label>
                  <output htmlFor="pr-agents">{agents}</output>
                </div>
                <input
                  className="pr-range"
                  id="pr-agents"
                  type="range"
                  min={1}
                  max={byCode.desk?.entitlements?.max_concurrent_agents ?? 15}
                  step={1}
                  value={agents}
                  style={
                    {
                      "--p": `${((agents - 1) / ((byCode.desk?.entitlements?.max_concurrent_agents ?? 15) - 1)) * 100}%`,
                    } as React.CSSProperties
                  }
                  onChange={(e) => touch(setAgents)(Number(e.target.value))}
                />
                <div className="pr-scale">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>{byCode.desk?.entitlements?.max_concurrent_agents ?? 15}</span>
                </div>
              </div>

              <div className={`pr-q ${mode === "paper" ? "off" : ""}`}>
                <div className="pr-qh">
                  <span className="lab" id="exLab">
                    Exchanges you trade on
                  </span>
                </div>
                <div className="pr-seg" role="group" aria-labelledby="exLab">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={exchanges === n}
                      onClick={() => touch(setExchanges)(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="hint">KuCoin, Binance, Bybit and BitMart are supported.</p>
              </div>

              <div className={`pr-q ${mode === "paper" ? "off" : ""}`}>
                <div className="pr-qh">
                  <label htmlFor="pr-vol">Volume your agents trade a month</label>
                  <output htmlFor="pr-vol">{usd(volume)}</output>
                </div>
                <input
                  className="pr-range"
                  id="pr-vol"
                  type="range"
                  min={0}
                  max={100000}
                  step={1000}
                  value={volume}
                  style={{ "--p": `${(volume / 100000) * 100}%` } as React.CSSProperties}
                  onChange={(e) => touch(setVolume)(Number(e.target.value))}
                />
                <div className="pr-scale">
                  <span>$0</span>
                  <span>$25k</span>
                  <span>$50k</span>
                  <span>$75k</span>
                  <span>$100k</span>
                </div>
                <p className="hint">
                  The dollar value of orders Candleweb places for your agents in a month.
                </p>
              </div>
            </div>

            <div className="pr-out landing-rise rise-right" aria-live="polite">
              <p className="pr-outlab">The plan that fits</p>
              <p className="pr-fitname" ref={nameRef}>
                {fitPlan?.name ?? "—"}
              </p>
              <p className="pr-why">{fit?.why ?? ""}</p>

              {mode !== "paper" && incl > 0 && (
                <div className="pr-meter">
                  <div className="pr-mh">
                    <span>Included volume used</span>
                    <b className={over ? "over" : ""}>
                      {over
                        ? `${usd(volume - incl)} over ${usd(incl)}`
                        : `${usd(volume)} of ${usd(incl)}`}
                    </b>
                  </div>
                  <div className={`pr-segs ${over ? "over" : ""}`}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <i key={i} className={i < filledSegs ? "f" : ""} />
                    ))}
                  </div>
                </div>
              )}

              <div className="pr-bill">
                <div className="pr-row">
                  <span>Plan fee</span>
                  <b>
                    {fitCode === "paper"
                      ? "Free"
                      : money(fee, cur) + (cycle === "annual" ? " · billed yearly" : "")}
                  </b>
                </div>
                <div className="pr-row">
                  <span>
                    {cur === "NGN" && vFee > 0 ? "Volume fee, at the day's rate" : "Volume fee"}
                  </span>
                  <b>{fitCode === "paper" ? "None" : money(vFee, "USD")}</b>
                </div>
                <div className="pr-row tot">
                  <span>Each month</span>
                  <b>{total}</b>
                </div>
              </div>

              {tip && <p className="pr-tip">{tip}</p>}
              <p className="pr-next">
                {fitCode === "paper" ? (
                  <>
                    <b>Next unlock:</b> your first bot review at{" "}
                    {byCode.paper?.entitlements?.bot_review_unlock_closed_trades ?? 20} closed
                    trades.
                  </>
                ) : fitCode === "builder" ? (
                  <>
                    <b>Next unlock:</b> a second exchange, or a fourth agent, moves you to Desk.
                  </>
                ) : (
                  <>
                    <b>You&rsquo;re on the top plan.</b> Running more than{" "}
                    {byCode.desk?.entitlements?.max_concurrent_agents ?? 15} agents? Talk to us.
                  </>
                )}
              </p>
              <button
                type="button"
                className={`pub-btn ${fitCode === "paper" ? "pub-btn-teal" : "pub-btn-amber"}`}
                onClick={() => choose(fitCode)}
              >
                {fitPlan ? planCta(fitPlan) : "Choose a plan"} <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= path ================= */}
        <section className="pr-band">
          <div className="landing-wrap pr-sec">
            <p className="pr-eyebrow landing-rise">How most people move up</p>
            <h2>
              <Written text="Start without paying. Upgrade when your agent earns its place." />
            </h2>
            <div className="pr-path">
              {[
                {
                  n: 1,
                  tag: "Paper",
                  h: "Prove the agent works",
                  p: "Connect it and let it trade simulated fills against live candles. See every decision it makes, and why.",
                  u: (
                    <>
                      Unlocks at {byCode.paper?.entitlements?.bot_review_unlock_closed_trades ?? 20}{" "}
                      closed trades: <b>your first bot review</b>
                    </>
                  ),
                },
                {
                  n: 2,
                  tag: "Builder",
                  h: "Go live on one exchange",
                  p: "Add trade-only API keys. Your agent's orders are placed, watched and closed on your own account.",
                  u: (
                    <>
                      Unlocks:{" "}
                      <b>
                        CandleAI and {byCode.builder?.entitlements?.bot_reviews_per_month ?? 2}{" "}
                        reviews a month
                      </b>
                    </>
                  ),
                },
                {
                  n: 3,
                  tag: "Desk",
                  h: "Run several strategies",
                  p: `Up to ${byCode.desk?.entitlements?.max_concurrent_agents ?? 15} agents across every exchange you connect, with your full decision record exportable.`,
                  u: (
                    <>
                      Unlocks: <b>CSV and JSON export, priority support</b>
                    </>
                  ),
                },
              ].map((s) => (
                <div className="pr-step landing-rise rise-pop" key={s.n}>
                  <div className="st">
                    <span>{s.n}</span>
                    <em>{s.tag}</em>
                  </div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                  <span className="unl">{s.u}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= compare ================= */}
        <section className="landing-wrap pr-sec" id="compare">
          <p className="pr-eyebrow landing-rise">Compare plans</p>
          <h2>
            <Written text="Everything, side by side." />
          </h2>
          {ordered.length > 0 && (
            <div className="pr-cmpwrap landing-rise">
              <table className="pr-cmp">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="dash" style={{ fontSize: 14, fontWeight: 500 }}>
                        Plan
                      </span>
                    </th>
                    {ordered.map((p) => (
                      <th scope="col" className={p.code === LEAD ? "lead" : ""} key={p.code}>
                        {p.name}
                        <small>
                          {p.is_free
                            ? "Free"
                            : `${money(billed(p, cur, cycle), cur)} ${
                                cycle === "monthly" ? "a month" : "a year"
                              }`}
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="grp">
                    <th colSpan={ordered.length + 1}>Trading</th>
                  </tr>
                  <CompareRow
                    label="Live execution"
                    plans={ordered}
                    value={(e) =>
                      !e.live_execution
                        ? "Paper only"
                        : e.max_exchanges == null
                          ? "All connected exchanges"
                          : `${e.max_exchanges} exchange`
                    }
                  />
                  <CompareRow
                    label="Agents at once"
                    plans={ordered}
                    value={(e) => cap(e.max_concurrent_agents)}
                  />
                  <CompareRow
                    label="Pairs and indicators"
                    plans={ordered}
                    value={(e) =>
                      `${
                        e.max_pairs == null
                          ? "Unlimited pairs"
                          : `${e.max_pairs} pair${e.max_pairs === 1 ? "" : "s"}`
                      }, ${e.max_indicators == null ? "every indicator" : `${e.max_indicators} indicators`}`
                    }
                  />
                  <CompareRow
                    label="CandleAI"
                    plans={ordered}
                    value={(e) => (e.candleai_included ? "Included" : "—")}
                  />
                  <tr className="grp">
                    <th colSpan={ordered.length + 1}>Records and reviews</th>
                  </tr>
                  <CompareRow
                    label="Decision record"
                    plans={ordered}
                    value={(e) =>
                      e.decision_record_days == null
                        ? e.record_export
                          ? "Full, with CSV and JSON export"
                          : "Full"
                        : `Kept ${e.decision_record_days} days`
                    }
                  />
                  <CompareRow
                    label="Bot reviews"
                    plans={ordered}
                    value={(e) =>
                      `${e.bot_reviews_per_month} a month`
                    }
                  />
                  <tr className="grp">
                    <th colSpan={ordered.length + 1}>Volume</th>
                  </tr>
                  <CompareRow
                    label="Included each month"
                    plans={ordered}
                    value={(e) =>
                      num(e.included_volume_usd) > 0 ? usd(num(e.included_volume_usd)) : "—"
                    }
                  />
                  <CompareRow
                    label="Above that"
                    plans={ordered}
                    value={(e) =>
                      num(e.overage_rate_pct) > 0
                        ? `${num(e.overage_rate_pct)}% of the amount over`
                        : "—"
                    }
                  />
                  <tr className="grp">
                    <th colSpan={ordered.length + 1}>Support</th>
                  </tr>
                  <CompareRow
                    label="Priority support"
                    plans={ordered}
                    value={(e) => (e.priority_support ? "Included" : "—")}
                  />
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ================= reviews + paying ================= */}
        <section className="pr-band">
          <div className="landing-wrap pr-sec">
            <p className="pr-eyebrow landing-rise">Paying</p>
            <h2>
              <Written text="Naira or crypto. Nothing touches your trading funds." />
            </h2>
            <div className="pr-two">
              <div className="pr-card landing-rise rise-left">
                <h3>Need more bot reviews?</h3>
                <p>
                  A review reads your closed trades against the exact candles each decision saw, and
                  names the rule that is losing you money. Buy extra any time on a paid plan.
                </p>
                {reviewPacks && reviewPacks.length > 0 && (
                  <div className="pr-tops">
                    {reviewPacks.map((pack: ReviewPackV2) => (
                      <button
                        className="pr-top"
                        type="button"
                        key={pack.code}
                        onClick={() => buyPack(pack)}
                      >
                        <b>
                          {money(num(pack.amount), (pack.currency as Currency) || "NGN")}
                        </b>
                        <span>{pack.name}</span>
                        {num(pack.quantity) > 1 && (
                          <em>
                            {money(num(pack.unit_amount), (pack.currency as Currency) || "NGN")}{" "}
                            each
                          </em>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <p className="pr-fine">
                  Each review needs{" "}
                  {byCode.builder?.entitlements?.bot_review_unlock_closed_trades ?? 20} closed
                  trades on the same prompt. Included reviews reset every month and don&rsquo;t roll
                  over.
                </p>
              </div>

              <div className="pr-card landing-rise rise-right">
                <h3>Two ways to pay</h3>
                <p>
                  You choose at checkout. The dollar prices above are for reference; card payments
                  are taken in naira.
                </p>
                <div className="pr-methods">
                  <div className="pr-method">
                    <span className="mi">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="6.5" width="18" height="12" rx="2.6" />
                        <path d="M3 10.5h18M16.5 14.5h1.5" />
                      </svg>
                    </span>
                    <div>
                      <b>Card, bank transfer or USSD</b>
                      <span>In naira, at checkout.</span>
                    </div>
                  </div>
                  <div className="pr-method">
                    <span className="mi">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9.4 8.2h4a2.2 2.2 0 010 4.4h-4M9.4 12.6h4.4a2.2 2.2 0 010 4.4H9.4M9.4 6.6v12M11.6 5.2v2M11.6 18.6v2" />
                      </svg>
                    </span>
                    <div>
                      <b>Crypto</b>
                      <span>
                        USDT or USDC from any wallet or exchange, the same amount at the day&rsquo;s
                        rate.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pr-safe landing-rise">
              <span className="si">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z" />
                  <path d="M9.5 12l1.8 1.8L15 10" />
                </svg>
              </span>
              <div>
                <h3>If a payment fails, your stops keep running</h3>
                <p>
                  Open positions keep their stop, their trailing stop and their monitoring until
                  they close, whether or not the plan is paid. Only new entries pause. Your money
                  never leaves your own exchange account, and our key can read and trade but never
                  withdraw.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= faq ================= */}
        <section className="landing-wrap pr-sec" id="faq">
          <p className="pr-eyebrow landing-rise">Questions</p>
          <h2>
            <Written text="Before you choose." />
          </h2>
          <div className="pr-faq landing-rise">
            {[
              [
                "Can I start without a card?",
                "Yes. Paper is free and needs no card and no exchange keys. Connect one agent and it runs against live candles with simulated fills, so you can see how it behaves before any real money is involved.",
              ],
              [
                "What counts as volume?",
                `The dollar value of orders Candleweb places for your agents in a month. Builder includes ${usd(
                  included("builder"),
                )} and Desk includes ${usd(included("desk"))}. Above that we charge ${
                  overage("builder") * 100
                }% on the amount over the line only.`,
              ],
              [
                "Can I change plans later?",
                "Yes. Moving up takes effect straight away, and the first charge is prorated against what is left of your month. Your running agents keep running through the change.",
              ],
              [
                "What happens if I cancel?",
                "Your plan stays active until the end of the period you paid for. After that, anything already open keeps its stop, trailing stop and monitoring until it closes. Only new entries stop, and your trade record stays available.",
              ],
              [
                "Does Candleweb ever hold my money?",
                "No. You trade from your own exchange account using API keys you create with trade permission only. The plan fee pays for the platform and nothing else.",
              ],
              [
                "Why is there a yearly option?",
                `Paying yearly costs the same as ten months, so two months are free. Builder works out at ${money(
                  perMonth(byCode.builder, cur, "annual"),
                  cur,
                )} a month and Desk at ${money(perMonth(byCode.desk, cur, "annual"), cur)}.`,
              ],
            ].map(([q, a]) => (
              <details key={q as string}>
                <summary>
                  {q}
                  <i>+</i>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ================= closing ================= */}
        <div className="landing-wrap" style={{ paddingBottom: "clamp(56px,7vw,108px)" }}>
          <section className="pr-cta" id="start">
            <div className="landing-rise rise-left">
              <p className="pr-eyebrow">Start free</p>
              <h2>Put your agent on Paper today.</h2>
              <p className="pr-lede">
                No card and no exchange keys. When it has earned your trust, move it to a live
                market in a few minutes.
              </p>
            </div>
            <form
              className="pr-ctabox landing-rise rise-right"
              onSubmit={(e) => {
                e.preventDefault();
                startFree();
              }}
            >
              <label htmlFor="pr-email">Email</label>
              <input
                id="pr-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "pr-email-err" : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
              />
              {emailError && (
                <p className="pr-ctaerr" id="pr-email-err" role="alert">
                  {emailError}
                </p>
              )}
              <button type="submit" className="pub-btn pub-btn-amber">
                Create free account <span>→</span>
              </button>
              <p className="pr-ctafine">
                Free forever on Paper. You pick a paid plan only when you want to trade live.
              </p>
            </form>
          </section>
        </div>

        <PublicFooter />
      </main>

      {intent && (
        <PaymentMethodModal
          summary={
            intent.kind === "reviews"
              ? `${intent.pack.name} · ${money(
                  num(intent.pack.amount),
                  (intent.pack.currency as Currency) || "NGN",
                )}`
              : /* What checkout will actually charge for the period: the
                   full yearly price on Yearly, and in the currency billed —
                   naira for a first plan, the subscription's own currency
                   for a change. The page's switch is only a preview. */
                (() => {
                  const payCur: Currency =
                    intent.kind === "change" && subscription
                      ? (subscription.billing_currency as Currency)
                      : "NGN";
                  const amount = billed(intent.plan, payCur, cycle);
                  return `${intent.plan.name} · ${
                    amount === 0
                      ? "free"
                      : `${money(amount, payCur)} ${cycle === "annual" ? "a year" : "a month"}`
                  }`;
                })()
          }
          note={
            intent.kind === "reviews"
              ? "You'll finish on the processor's secure checkout, then land on your subscription page. The reviews are added once the payment is confirmed, and they never expire."
              : "You'll finish on the processor's secure checkout, then land on your subscription page. Your plan changes once the payment is confirmed — your trading funds stay on your own exchange."
          }
          renew={
            intent.kind === "reviews"
              ? undefined
              : {
                  on: autoRenew,
                  period: cycle === "annual" ? "year" : "month",
                  planName: intent.plan.name,
                  onToggle: () => setAutoRenew((v) => !v),
                }
          }
          busy={paying}
          onCancel={() => setIntent(null)}
          onContinue={() => submit(intent)}
        />
      )}
    </>
  );
};

/** One row of the comparison table, read straight off each plan's entitlements. */
const CompareRow = ({
  label,
  plans,
  value,
}: {
  label: string;
  plans: PlanV2[];
  value: (e: any) => string;
}) => (
  <tr>
    <th scope="row">{label}</th>
    {plans.map((p) => {
      const text = value(p.entitlements || {});
      return (
        <td
          key={p.code}
          className={`${p.code === LEAD ? "lead" : ""} ${text === "—" ? "dash" : ""}`.trim()}
        >
          {text}
        </td>
      );
    })}
  </tr>
);

/**
 * The hero rails: pulses travelling from the agent's decision to the exchange,
 * which is what every plan is paying for. Decorative, so it is hidden from
 * assistive tech and sits still when reduced motion is asked for.
 */
const Rails = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const host = hostRef.current;
    if (!svg || !host) return;

    const NS = "http://www.w3.org/2000/svg";
    const make = (tag: string, attrs: Record<string, string | number>) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
      return node;
    };

    let width = 1000;
    let height = 96;
    let lanes = [34, 62];
    let startX = 160;
    let landX = 880;
    let uid = 0;

    const defs = make("defs", {});
    svg.appendChild(defs);
    const rail = make("linearGradient", {
      id: "pr-rail",
      gradientUnits: "userSpaceOnUse",
      x1: 0,
      y1: 0,
      x2: 1000,
      y2: 0,
    });
    (
      [
        ["0%", "pr-s0", "0"],
        ["45%", "pr-s1", ".4"],
        ["100%", "pr-s2", ".6"],
      ] as const
    ).forEach(([offset, cls, opacity]) =>
      rail.appendChild(make("stop", { offset, class: cls, "stop-opacity": opacity })),
    );
    defs.appendChild(rail);

    const lines = lanes.map((y) => {
      const line = make("line", {
        x1: 0,
        y1: y,
        x2: width,
        y2: y,
        "stroke-width": 1.1,
        stroke: "url(#pr-rail)",
      });
      svg.appendChild(line);
      return line;
    });
    const glow = make("g", {});
    const tails = make("g", {});
    const dots = make("g", {});
    svg.appendChild(glow);
    svg.appendChild(tails);
    svg.appendChild(dots);

    const size = () => {
      width = Math.max(320, svg.clientWidth || 1000);
      height = svg.clientHeight || 96;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      rail.setAttribute("x2", String(width));
      const mid = height / 2;
      lanes = [mid - 14, mid + 14];
      lines.forEach((line, i) => {
        line.setAttribute("x2", String(width));
        line.setAttribute("y1", String(lanes[i]));
        line.setAttribute("y2", String(lanes[i]));
      });
      const left = host.querySelector(".pr-end.l") as HTMLElement | null;
      const right = host.querySelector(".pr-end.r") as HTMLElement | null;
      startX = (left?.offsetWidth ?? 150) + 12;
      landX = width - (right?.offsetWidth ?? 150) - 4;
    };
    size();
    window.addEventListener("resize", size);

    const still =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return () => window.removeEventListener("resize", size);

    type Pulse = {
      g: SVGElement;
      tail: SVGElement;
      soft: SVGElement;
      dot: SVGElement;
      x: number;
      lane: number;
      v: number;
      len: number;
    };
    const pulses: Pulse[] = [];

    const spawn = (x?: number) => {
      const lane = Math.random() < 0.5 ? 0 : 1;
      const id = `pr-p${uid++}`;
      const g = make("linearGradient", { id, gradientUnits: "userSpaceOnUse", y1: 0, y2: 0 });
      g.appendChild(make("stop", { offset: "0%", class: "pr-p0", "stop-opacity": "0" }));
      g.appendChild(make("stop", { offset: "65%", class: "pr-p1", "stop-opacity": ".4" }));
      g.appendChild(make("stop", { offset: "100%", class: "pr-p2", "stop-opacity": ".95" }));
      defs.appendChild(g);
      const tail = make("line", {
        "stroke-width": 1.8,
        "stroke-linecap": "round",
        stroke: `url(#${id})`,
      });
      const soft = make("circle", { r: 9, class: "pr-soft" });
      const dot = make("circle", { r: 2.6, class: "pr-dot" });
      glow.appendChild(soft);
      tails.appendChild(tail);
      dots.appendChild(dot);
      pulses.push({
        g,
        tail,
        soft,
        dot,
        x: x ?? -20,
        lane,
        v: 0.9 + Math.random() * 0.7,
        len: 120 + Math.random() * 90,
      });
    };

    const land = (x: number, y: number) => {
      const ring = make("circle", {
        cx: x,
        cy: y,
        r: 3,
        fill: "none",
        class: "pr-ring",
        "stroke-width": 1,
      });
      glow.appendChild(ring);
      let t = 0;
      const grow = () => {
        t += 0.02;
        if (t >= 1) {
          ring.remove();
          return;
        }
        ring.setAttribute("r", String(3 + t * 24));
        ring.setAttribute("opacity", String((1 - t) * 0.4));
        requestAnimationFrame(grow);
      };
      grow();
    };

    let ticks = 0;
    let raf: number | null = null;
    let onScreen = true;

    const frame = () => {
      ticks += 1;
      if (ticks % 120 === 0 && pulses.length < 3) spawn();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const y = lanes[p.lane];
        p.x += p.v;
        const back = Math.max(p.x - p.len, 0);
        const fadeIn = Math.min(Math.max((p.x - startX) / 200, 0), 1);
        const fadeOut = Math.min(Math.max((landX - p.x) / 70 + 0.15, 0), 1);
        const o = fadeIn * fadeOut;
        p.g.setAttribute("x1", String(back));
        p.g.setAttribute("x2", String(p.x));
        p.tail.setAttribute("x1", String(back));
        p.tail.setAttribute("y1", String(y));
        p.tail.setAttribute("x2", String(p.x));
        p.tail.setAttribute("y2", String(y));
        p.tail.setAttribute("opacity", String(o));
        p.dot.setAttribute("cx", String(p.x));
        p.dot.setAttribute("cy", String(y));
        p.dot.setAttribute("opacity", String(o));
        p.soft.setAttribute("cx", String(p.x));
        p.soft.setAttribute("cy", String(y));
        p.soft.setAttribute("opacity", String(o * 0.14));
        if (p.x >= landX) {
          land(landX, y);
          p.dot.remove();
          p.soft.remove();
          p.tail.remove();
          p.g.remove();
          pulses.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const pause = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const resume = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVisibility);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = entries[0].isIntersecting;
          onScreen ? resume() : pause();
        },
        { threshold: 0 },
      );
      io.observe(svg);
    }

    spawn(width * 0.42);
    spawn(width * 0.7);
    resume();

    return () => {
      pause();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <div className="pr-rails landing-rise" ref={hostRef} aria-hidden="true">
      <svg ref={svgRef} />
      <span className="pr-end l">
        <i />
        <span className="lg">Your agent decides</span>
        <span className="sm">Agent</span>
      </span>
      <span className="pr-end r">
        <i />
        <span className="lg">Your exchange</span>
        <span className="sm">Exchange</span>
      </span>
    </div>
  );
};

export default PricingPage;
