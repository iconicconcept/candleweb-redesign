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
  PlanV2,
  ReviewBalanceV2,
  ReviewPackV2,
  SubCycle,
  SubscriptionV2,
  UsageV2,
} from "../types/subscriptionV2";

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

type PlanChoice = { api: AxiosInstance; plan: string; cycle: SubCycle };

/** POST /subscribe/ — free plan starts now (`subscription`), paid returns `checkout_url` */
const subscribe = createAsyncThunk("subscriptionV2/subscribe", async (p: PlanChoice, thunkApi) => {
  try {
    return await post(p.api, "subscribe/", { plan: p.plan, cycle: p.cycle });
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /change-plan/ — upgrade returns `checkout_url` + `amount_due`; downgrade is `scheduled` */
const changePlan = createAsyncThunk("subscriptionV2/changePlan", async (p: PlanChoice, thunkApi) => {
  try {
    return await post(p.api, "change-plan/", { plan: p.plan, cycle: p.cycle });
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /cancel/ — runs to the end of the paid period (`active_until`) */
const cancel = createAsyncThunk("subscriptionV2/cancel", async (api: AxiosInstance, thunkApi) => {
  try {
    return await post(api, "cancel/");
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /resume/ — undo a cancellation while the plan is still running */
const resume = createAsyncThunk("subscriptionV2/resume", async (api: AxiosInstance, thunkApi) => {
  try {
    return await post(api, "resume/");
  } catch (err: any) {
    return fail(err, thunkApi);
  }
});

/** POST /me/invoices/{number}/pay/ — checkout for one unpaid invoice */
const payInvoice = createAsyncThunk(
  "subscriptionV2/payInvoice",
  async (p: { api: AxiosInstance; number: string }, thunkApi) => {
    try {
      return await post(p.api, `me/invoices/${encodeURIComponent(p.number)}/pay/`);
    } catch (err: any) {
      return fail(err, thunkApi);
    }
  },
);

/** POST /reviews/purchase/ — opens a checkout for a pack. Nothing is credited
    until the webhook settles it, so re-read /me/reviews/ after the return. */
const buyReviews = createAsyncThunk(
  "subscriptionV2/buyReviews",
  async (p: { api: AxiosInstance; pack: string; callbackUrl?: string }, thunkApi) => {
    try {
      return await post(p.api, "reviews/purchase/", {
        pack: p.pack,
        ...(p.callbackUrl ? { callback_url: p.callbackUrl } : {}),
      });
    } catch (err: any) {
      return fail(err, thunkApi);
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
};

export default subscriptionV2Service;
