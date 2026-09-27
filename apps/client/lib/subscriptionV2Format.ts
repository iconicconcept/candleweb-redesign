import type { PlanV2, SubCurrency, SubCycle, SubscriptionV2 } from "../types/subscriptionV2";

const SYM: Record<SubCurrency, string> = { NGN: "₦", USD: "$" };

/** "₦10,000", "$12", "$24.17" — decimals only when there are any. */
export const money = (amount: string | number | null | undefined, cur: SubCurrency = "NGN") => {
  const n = Number(amount ?? 0);
  if (!isFinite(n)) return "—";
  const whole = Math.abs(n % 1) < 0.005;
  return (
    SYM[cur] +
    n.toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    })
  );
};

/** "$3,240" for USD volume figures */
export const usd = (amount: string | number | null | undefined) => money(amount, "USD");

export const priceOf = (plan: PlanV2, cur: SubCurrency, cycle: SubCycle): number =>
  Number(plan.prices?.[cur]?.[cycle] ?? 0);

/** The small line under a plan's price, as the mockups word it. */
export const altLine = (plan: PlanV2, cur: SubCurrency, cycle: SubCycle) => {
  if (plan.is_free) return "Free, always";
  if (cycle === "monthly") {
    const other: SubCurrency = cur === "NGN" ? "USD" : "NGN";
    const p = plan.prices?.[other]?.monthly;
    return p ? `or ${money(p, other)} a month` : "";
  }
  return `${money(priceOf(plan, cur, "annual") / 12, cur)} a month, billed yearly`;
};

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six"];

/** Months saved by paying yearly, from the catalogue itself ("Two months free"). */
export const annualSaving = (plans: PlanV2[]) => {
  let best = 0;
  plans.forEach((p) => {
    const m = Number(p.prices?.NGN?.monthly ?? 0);
    const a = Number(p.prices?.NGN?.annual ?? 0);
    if (m > 0 && a > 0) best = Math.max(best, Math.round(12 - a / m));
  });
  if (best <= 0) return "";
  return `${WORDS[best] ?? best} month${best === 1 ? "" : "s"} free`;
};

/** Order plans cheapest first by their naira monthly price. */
export const planRank = (plan?: PlanV2) => Number(plan?.prices?.NGN?.monthly ?? 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "6 Oct" */
export const shortDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "6 October" */
export const longDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : `${d.getDate()} ${LONG[d.getMonth()]}`;
};
/** "6 SEP 2026" — billing rows */
export const rowDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : `${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
};

export const currencyWord = (cur?: SubCurrency) => (cur === "USD" ? "dollars" : "naira");

/** A subscription that still grants its plan (cancelled-at-period-end still counts). */
export const isLivePlan = (s: SubscriptionV2 | null | undefined): s is SubscriptionV2 =>
  !!s && s.status !== "expired" && !s.ended_at;

/** "all connected" for a null exchange limit, else the number */
export const exchangesLabel = (n: number | null | undefined) => (n == null ? "all connected" : String(n));
