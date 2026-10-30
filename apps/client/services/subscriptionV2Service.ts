import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError, AxiosInstance } from "axios";
import { axiosApi } from "../lib/axiosApi";
import { error } from "../components/alert/Toast";
import {
  setPlansV2,
  setMeV2,
  setUsageV2,
  setReviewsV2,
  setReviewPacksV2,
  setInvoicesV2,
  setPaymentMethodsV2,
} from "../redux/slices/subscriptionV2Slice";
import {
  CheckoutResultV2,
  EntitlementsV2,
  InvoiceV2,
  PaymentMethodV2,
  PaymentVerifyV2,
  PlanV2,
  ReviewBalanceV2,
  ReviewPackV2,
  SubCycle,
  SubscriptionV2,
  UsageV2,
} from "../types/subscriptionV2";
import { revalidate } from "../redux/slices/revalidateSlice";

const BASE = "/subscription_v2/";

/* Responses come wrapped as { status, message, data } — unwrap, but tolerate
   a bare body too so a backend change doesn't blank the page. */
const unwrap = <T>(body: any): T => {
  if (body && typeof body === "object" && !Array.isArray(body) && "data" in body && ("status" in body || "message" in body))
    return body.data as T;
  return body as T;
};

const getErrorMessage = (err: any): string => {
  const e = err as AxiosError;
  const data = e.response?.data as any;
  if (!data) return e.message ?? e.toString();
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }
  return e.message ?? e.toString();
};

/** GET /plans/ — public */
const listPlans = createAsyncThunk("subscriptionV2/plans", async (_: void, thunkApi) => {
  try {
    const { data } = await axiosApi.get(`${BASE}plans/`);
    const plans = unwrap<PlanV2[]>(data);
    const list = Array.isArray(plans) ? plans : [];
    thunkApi.dispatch(setPlansV2(list));
    return list;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

/** GET /review-packs/ — public; bought reviews never expire */
const listReviewPacks = createAsyncThunk("subscriptionV2/reviewPacks", async (_: void, thunkApi) => {
  try {
    const { data } = await axiosApi.get(`${BASE}review-packs/`);
    const packs = unwrap<ReviewPackV2[]>(data);
    const list = Array.isArray(packs) ? packs : [];
    thunkApi.dispatch(setReviewPacksV2(list));
    return list;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

/** GET /me/ — `subscription` is null when the user has never been on a plan;
    entitlements are always populated. Accepts either the documented
    { subscription, entitlements } body or a bare Subscription. */
const getMe = createAsyncThunk("subscriptionV2/me", async (api: AxiosInstance, thunkApi) => {
  try {
    const { data } = await api.get(`${BASE}me/`);
    const body = unwrap<any>(data) ?? {};
    const subscription: SubscriptionV2 | null =
      "subscription" in body ? body.subscription ?? null : body.plan_code ? body : null;
    const entitlements: EntitlementsV2 | null = body.entitlements ?? null;
    const me = { subscription, entitlements };
    thunkApi.dispatch(setMeV2(me));
    return me;
  } catch (err: any) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

const makeGet = <T>(name: string, path: string, set: (v: T) => any) =>
  createAsyncThunk(`subscriptionV2/${name}`, async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get(`${BASE}${path}`);
      const value = unwrap<T>(data);
      thunkApi.dispatch(set(value));
      return value;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  });

/** GET /me/usage/ — traded volume this period vs the plan's included volume */
const getUsage = makeGet<UsageV2>("usage", "me/usage/", setUsageV2);
/** GET /me/reviews/ — bot reviews left */
const getReviews = makeGet<ReviewBalanceV2>("reviews", "me/reviews/", setReviewsV2);
/** GET /me/invoices/ — every charge, newest first */
const getInvoices = makeGet<InvoiceV2[]>("invoices", "me/invoices/", (v) =>
  setInvoicesV2(Array.isArray(v) ? v : []),
);
/** GET /me/payment-methods/ — provider token + label only */
const getPaymentMethods = makeGet<PaymentMethodV2[]>("paymentMethods", "me/payment-methods/", (v) =>
  setPaymentMethodsV2(Array.isArray(v) ? v : []),
);

/* Writes resolve to the (unwrapped) body, or reject with a message that has
   already been toasted — callers only need to branch on the outcome. */
const post = async (api: AxiosInstance, path: string, body: unknown = {}) => {
  const { data } = await api.post(`${BASE}${path}`, body);
  return (unwrap<CheckoutResultV2>(data) ?? {}) as CheckoutResultV2;
};
const fail = (err: any, thunkApi: { rejectWithValue: (v: string) => any }) => {
  const msg = getErrorMessage(err);
  error(msg);
  return thunkApi.rejectWithValue(msg);
};

/* Every checkout body takes an optional `callback_url` (schema: CallbackUrl).
   Leave it out and the provider returns the user to whatever host the server
   is configured with — which is still an older deployment — so send our own
   origin on every flow, not just the review packs. The subscription page
   confirms the result against the API whatever query string comes back, so
   the `checkout` marker is only there to say what was being bought. */
const returnUrl = (checkout: string, override?: string) => {
  if (override) return { callback_url: override };
  if (typeof window === "undefined") return {};
  return { callback_url: `${window.location.origin}/dashboard/subscription?checkout=${checkout}` };
};

/* `autoRenew` is the user's own answer to "charge me again when the period
   ends" — the server treats a missing answer as no. */
type PlanChoice = {
  api: AxiosInstance;
  plan: string;
  cycle: SubCycle;
  callbackUrl?: string;
  autoRenew?: boolean;
};

/** POST /subscribe/ — free plan starts now (`subscription`), paid returns `checkout_url`.
    The subscription page asks for `autoRenew`; a caller that doesn't ask yet
    (the pricing page) keeps sending yes, as it always has. */
const subscribe = createAsyncThunk("subscriptionV2/subscribe", async (p: PlanChoice, thunkApi) => {
  try {
    return await post(p.api, "subscribe/", {
      plan: p.plan,
      cycle: p.cycle,
      auto_renew: p.autoRenew ?? true,
      ...returnUrl("plan", p.callbackUrl),
    });
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /change-plan/ — upgrade returns `checkout_url` + `amount_due`; downgrade is `scheduled`.
    `auto_renew` left out keeps the subscription's current setting. */
const changePlan = createAsyncThunk("subscriptionV2/changePlan", async (p: PlanChoice, thunkApi) => {
  try {
    return await post(p.api, "change-plan/", {
      plan: p.plan,
      cycle: p.cycle,
      ...(p.autoRenew === undefined ? {} : { auto_renew: p.autoRenew }),
      ...returnUrl("plan", p.callbackUrl),
    });
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /cancel/ — runs to the end of the paid period (`active_until`) */
const cancel = createAsyncThunk("subscriptionV2/cancel", async (api: AxiosInstance, thunkApi) => {
  try {
    /* A plan change moves what the account may do — live trading, exporting,
       and how far back History is allowed to reach. Both of those are read
       from entitlements, so both are re-read. */
    thunkApi.dispatch(revalidate(["entitlements", "history"]));
    return await post(api, "cancel/");
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /resume/ — undo a cancellation while the plan is still running */
const resume = createAsyncThunk("subscriptionV2/resume", async (api: AxiosInstance, thunkApi) => {
  try {
    thunkApi.dispatch(revalidate(["entitlements", "history"]));
    return await post(api, "resume/");
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /me/invoices/{number}/pay/ — checkout for one unpaid invoice */
const payInvoice = createAsyncThunk(
  "subscriptionV2/payInvoice",
  async (p: { api: AxiosInstance; number: string; callbackUrl?: string }, thunkApi) => {
    try {
      return await post(
        p.api,
        `me/invoices/${encodeURIComponent(p.number)}/pay/`,
        returnUrl("invoice", p.callbackUrl),
      );
    } catch (err: any) {
      return fail(err, thunkApi);
    }
  },
);

/** POST /reviews/purchase/ — opens a checkout for a pack. Nothing is credited
    until the payment is verified, so re-read /me/reviews/ after the return. */
const buyReviews = createAsyncThunk(
  "subscriptionV2/buyReviews",
  async (p: { api: AxiosInstance; pack: string; callbackUrl?: string }, thunkApi) => {
    try {
      return await post(p.api, "reviews/purchase/", {
        pack: p.pack,
        ...returnUrl("reviews", p.callbackUrl),
      });
    } catch (err: any) {
      return fail(err, thunkApi);
    }
  },
);

/** GET /payments/verify/?reference= — asks the provider about one checkout
    and, if it was paid, settles its invoice there and then: the plan starts or
    the reviews land without waiting for the webhook. `paid` stays false until
    the provider confirms. Safe to repeat and safe to race the webhook. Not
    toasted on failure — the return page falls back to watching /me/. */
const verifyPayment = createAsyncThunk(
  "subscriptionV2/verifyPayment",
  async (p: { api: AxiosInstance; reference: string }, thunkApi) => {
    try {
      const { data } = await p.api.get(`${BASE}payments/verify/`, {
        params: { reference: p.reference },
      });
      const body = unwrap<PaymentVerifyV2>(data) ?? ({} as PaymentVerifyV2);
      return { ...body, paid: body.paid === true } as PaymentVerifyV2;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const subscriptionV2Service = {
  listPlans,
  listReviewPacks,
  getMe,
  getUsage,
  getReviews,
  getInvoices,
  getPaymentMethods,
  subscribe,
  changePlan,
  cancel,
  resume,
  payInvoice,
  buyReviews,
  verifyPayment,
};

export default subscriptionV2Service;
