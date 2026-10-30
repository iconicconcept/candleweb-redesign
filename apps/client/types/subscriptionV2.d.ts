/**
 * Subscriptions (v2) — `/api/subscription_v2/`.
 * Flat plans (Paper / Builder / Desk) billed monthly or annually through a
 * Flutterwave checkout. Decimals come back as strings.
 */

export type SubCycle = "monthly" | "annual";
export type SubCurrency = "NGN" | "USD";
export type SubStatus = "active" | "past_due" | "cancelled" | "expired";
export type SubSource = "self_serve" | "course_grant" | "admin" | "default";

export interface PlanEntitlementV2 {
  live_execution: boolean;
  candleai_included: boolean;
  max_concurrent_agents: number;
  /** null = every exchange the user has connected */
  max_exchanges: number | null;
  /** null = unlimited */
  max_pairs: number | null;
  /** null = unlimited */
  max_indicators: number | null;
  bot_reviews_per_month: number;
  /** closed trades on one prompt before a review unlocks; 0 = immediately */
  bot_review_unlock_closed_trades: number;
  included_volume_usd: string;
  overage_rate_pct: string;
  /** null = kept indefinitely */
  decision_record_days: number | null;
  record_export: boolean;
  priority_support: boolean;
}

export interface PlanV2 {
  id: number;
  /** machine name, e.g. "builder" — what subscribe / change-plan take */
  code: string;
  name: string;
  tagline: string;
  is_free: boolean;
  /** { NGN: { monthly: "10000.00", annual: "100000.00" }, USD: {...} } */
  prices: Partial<Record<SubCurrency, Partial<Record<SubCycle, string>>>>;
  entitlements: PlanEntitlementV2;
  features: { text: string; included: boolean }[];
}

export interface SubscriptionV2 {
  id: number;
  plan_code: string;
  plan_name: string;
  cycle: SubCycle;
  /** what the user is actually charged in — the page's currency switch is a preview */
  billing_currency: SubCurrency;
  /** price snapshot at purchase */
  price_amount: string;
  status: SubStatus;
  source: SubSource;
  started_at: string;
  current_period_start: string;
  /** null on a free plan, which never renews */
  current_period_end: string | null;
  /** blank when the plan will not charge again */
  renews_on: string | null;
  /** when what is paid for (or granted) runs out */
  period_ends_on?: string | null;
  /** the server's own answer to "is there another charge coming" */
  will_renew?: boolean;
  /** the user agreed at checkout to be charged again; off = the plan runs out */
  auto_renew?: boolean;
  cancel_at_period_end: boolean;
  ended_at: string | null;
  months_on_plan: number;
}

export interface EntitlementsV2 extends PlanEntitlementV2 {
  plan_code: string;
  plan_name: string;
  status: string;
  may_open_new_positions: boolean;
  may_manage_open_positions: boolean;
}

export interface UsageV2 {
  metric: string;
  period_start: string | null;
  period_end: string | null;
  used: string;
  included: string;
  remaining: string;
  overage_rate_pct: string;
  overage_due: string;
}

export interface ReviewBalanceV2 {
  balance: number;
  included_per_month: number;
  used_this_period: number;
  resets_on: string | null;
  unlock_closed_trades: number;
}

/** GET /review-packs/ — public; `unit_amount` is the price per review */
export interface ReviewPackV2 {
  code: string;
  name: string;
  quantity: number;
  currency: SubCurrency;
  amount: string;
  unit_amount: string;
}

export type InvoiceStatusV2 = "draft" | "open" | "paid" | "failed" | "void";
export type InvoiceKindV2 = "subscription" | "overage" | "topup" | "course_grant";

export interface InvoiceV2 {
  id: number;
  number: string;
  kind: InvoiceKindV2;
  description: string;
  currency: SubCurrency;
  subtotal: string;
  total: string;
  status: InvoiceStatusV2;
  period_start: string | null;
  period_end: string | null;
  issued_at: string;
  paid_at: string | null;
  lines: { description: string; quantity: string; unit_amount: string; amount: string }[];
}

export interface PaymentMethodV2 {
  id: number;
  provider: "flutterwave" | "crypto" | "manual";
  kind: "card" | "crypto";
  /** e.g. "Card ending 4242" */
  label: string;
  is_default: boolean;
}

/** POST /subscribe/ and /change-plan/ — whichever of these the case returns */
/** GET /payments/verify/ — `paid` stays false until the provider confirms */
export interface PaymentVerifyV2 {
  paid: boolean;
  message?: string;
}

export interface CheckoutResultV2 {
  checkout_url?: string | null;
  subscription?: SubscriptionV2 | null;
  /** change-plan upgrade: the prorated difference */
  amount_due?: string | null;
  /** change-plan downgrade: scheduled for effective_at */
  scheduled?: boolean;
  effective_at?: string | null;
  /** cancel */
  active_until?: string | null;
  /** reviews/purchase: the pack and the open top-up invoice */
  pack?: { code: string; quantity: number; amount: string } | null;
  invoice?: { number: string; kind?: InvoiceKindV2; total: string } | null;
  message?: string;
}
