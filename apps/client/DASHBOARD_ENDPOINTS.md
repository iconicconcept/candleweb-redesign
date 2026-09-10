# Dashboard — endpoint status per redesigned page

Status of the dashboard pages rebuilt on the `dashboard-focus` shell, and the
API each one still needs to be fully functional.

Legend: ✅ wired & working · ⛔ missing / blocking · ❓ exists but shape unconfirmed

Base URL: `https://api.candleweb.io/api/` (`apps/client/lib/axiosApi.ts`).

---

## 1. Subscription — `pages/dashboard/subscription.tsx` (rebuilt)

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /subscription/retrieve/all/` | plan list + `features[0]` |
| ✅ | `GET /subscription/user/history/` | current plan + billing history |
| ✅ | `GET /subscription/payment/methods/all/` | crypto networks |
| ✅ | `POST /subscription/user/` | create sub after on-chain payment |
| ✅ | `GET /subscription/cancel/{id}` | cancel plan |
| ⛔ | **`amount_paid` field on each `/subscription/user/history/` row** | history has no stored amount. The page currently derives it as `plan.price × tokens`, which is wrong once a plan's price changes or a plan is deleted. Need the actual charged amount + currency stored per purchase. |
| ❓ | expiry semantics | confirm whether `tokens` are voided at `expiry_date` or only the plan status changes. |

---

## 2. Daily Tasks — `pages/dashboard/tasks.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /task/all/`, `/task/stats/`, `/task/streak/`, `/task/leaderboard/` | |
| ✅ | `GET /task/reward/` | earned/claimable rewards |
| ✅ | `POST /task/reward/` | submit verification link for a task |
| ✅ | `GET /task/reward/claim/{id}/` | claim one reward |
| ⛔ | **`POST /task/reward/claim-all/`** | "Claim all" currently loops the single-claim endpoint once per reward. |
| ❓ | `/task/leaderboard/` shape | page matches `account_id === user.username`; confirm it returns `account_id`, `point`, `level`. |

---

## 3. Notifications — `pages/dashboard/notifications.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /notification/unread/?page=N` | unread list + pagination |
| ✅ | `GET /notification/{id}` | mark one read |
| ✅ | `GET /notification/clear/` | clear all |
| ⛔ | **`GET /notification/` (all statuses, paginated)** | the page has an "All" tab + total count, but only the *unread* feed exists. Read notifications can't be shown. |
| ⛔ | **`POST /notification/read-all/`** | "Mark all read" loops `GET /notification/{id}` per unread item. |
| ❓ | category field | the category chips filter client-side on the payload — confirm each notification carries a `type`/`category`. |

---

## 4. Academy / Tutor overview — `pages/dashboard/tutor/index.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /tutor/courses/featured/` | shop / catalogue |
| ✅ | `GET /currency/retrieve/all/` | USD rate for the AI-unit revenue figure |
| ✅ | task endpoints (see §2) | study stats / streak / rank |
| ❓ / ⛔ | **`GET /tutor/courses/`** | page reads `data.data.results[]` and expects per-user `progress`, `is_active`, `status`. Unclear whether this returns the caller's **enrollments** or the whole catalogue. If catalogue-only, need a `GET /tutor/courses/enrolled/` (or those fields added for the authed user). |

---

## 5. Course detail — `pages/dashboard/tutor/course/[id].tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /tutor/courses/{id}/` | course + lessons |
| ✅ | `GET /certificate/{username}/` | certificate lookup + download |
| ❓ | per-user completion | confirm `GET /tutor/courses/{id}/` returns lesson/module completion state for the caller (needed for the progress UI). |

> Known FE bug: this page renders its own `<AIAgentChat>` **and** gets the shell's default one → two chat widgets. Fix on the frontend.

---

## 6. Invite & earn — `pages/dashboard/invite.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /referral/user/referral/record/` | totals |
| ✅ | `GET /referral/user/referral/subscribed/` · `/unsubscribed/` | referred-user lists |
| ✅ | on-chain claim → `PUT /referral/user/referral/{id}/claim/` (`transaction_hash`) | per-row reward claim |
| ❓ | `/referral/user/referral/record/` fields | confirm it returns `claimed_earning` and `unclaimed_earning`. |
| ❓ | claim flow | confirm the on-chain claim is intended and there is no server-only claim path. |

Cut as mockup-only (no backend): email invites, funnel analytics, rate tiers, milestones, payout-destination widget.

---

## 7. Settings — `pages/dashboard/settings.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /user/profile/`, `GET /trade/portfolio/balance/` | |
| ✅ | trading mode toggle (`updateUserDemo`) + refetch cascade | |
| ✅ | `PUT /user/update-wallet-password/` | withdrawal wallet (connect-wallet only) |
| ✅ | `GET /exchange/list/`, `GET /exchange/record/`, `POST` add, `DELETE` remove | exchanges |
| ✅ | `POST /user/delete` | delete account |
| ⛔ | **`PATCH /user/profile/`** (username / email) | both are shown read-only — there is no update endpoint. |

Cut as mockup-only: account-safety score, per-key withdrawal/IP-restriction detection, wallet-network selector.

---

## 8. Overview — `pages/dashboard/index.tsx` (chrome-only, not yet rebuilt)

Body still on the legacy components; theming patched for now. No new endpoints —
uses the existing `useDashboardBootstrap` set (`/trade/portfolio/`,
`/trade/portfolio/profit/pair/list/`, `/trade/portfolio/balance/`,
`/exchange/record/`, active trades). Full rebuild waits for its mockup.

## 9. My trades — `pages/dashboard/trades.tsx` (chrome-only, not yet rebuilt)

Body still legacy. `GET /trade/portfolio/`, `GET /trade/activate/{id}/`,
`GET /trade/cancel/{id}/` — all exist. Full rebuild waits for its mockup.

---

## Cross-cutting

- **Token refresh URL has a double slash** — `${uri}/user/refresh/get/token/` in
  `lib/axiosApi.ts` and `lib/hooks/useRefreshToken.ts` (`uri` already ends `/`).
  Frontend fix, but worth confirming the server tolerates `//`.
