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

## 9. My trades — `pages/dashboard/trades.tsx` + `pages/dashboard/trades/new.tsx`

Rebuilt 2026-09-10 on the new **Trades (v2)** API (`/api/trading_v2/`).
`services/tradingV2Service.ts` + `redux/slices/tradingV2Slice.ts`.

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /trading_v2/trades/` | list |
| ✅ | `POST /trading_v2/trades/` | create (status=PAUSED) — "Save as paused" |
| ✅ | `GET /trading_v2/trades/{id}/` | hydrate the edit form |
| ✅ | `PATCH /trading_v2/trades/{id}/` | "Save changes" |
| ✅ | `DELETE /trading_v2/trades/{id}/` | delete |
| ✅ | `POST /trading_v2/trades/{id}/start/` · `/pause/` | run / pause controls |
| ⛔ | **pairs list** | `pair` is an int id; no endpoint. New-trade form uses a hard-coded placeholder list (`PLACEHOLDER_PAIRS`). |
| ✅ | **bots list (BotV2)** | `GET /trading_v2/bots/` — the `bot` select now loads real bots (see §10). Falls back to an empty list + "Add one" link. |
| ⛔ | **exchange accounts list** | `exchange_account` is an int id; `/exchange/record/` may or may not be the same thing. Placeholder list (`PLACEHOLDER_ACCOUNTS`). |
| ⛔ | **per-account balance** | the New-trade "Free to allocate" panel + the trades-list "capital" band need Total / allocated / free per account. Rendered as a `—` preview. |
| ⛔ | **per-trade performance** | trades-list P&L, open position, win rate — no read endpoint. Rendered as `—` preview. |
| ❓ | **`decider_type` = CandleAI value** | doc only shows `OWN_BOT`. Front-end sends `"CANDLE_AI"` (guess) with `bot: null`. Confirm the enum + whether `bot` must be omitted vs null. |
| ❓ | **canonical indicator keys** | doc example: `rsi, macd, macd_signal, sma_50`. Front-end assumes a set in `INDICATORS`; confirm/replace with a list endpoint. |
| ❓ | **`status` enum** | assumed `RUNNING` / `PAUSED` / `ERROR` (doc example only shows `PAUSED`). |
| ❓ | **no demo/live field** | mockup has a Demo/Live switch; v2 payload has none. Cut — confirm whether the exchange account implies it. |

Bot-facing (documented, not used by the dashboard UI): `GET /trading_v2/trades/{trade_id}/candles/`, `POST …/decision/` — shown as reference URLs on the New-trade screen.

**Trade-detail page** (`candleweb-trade-detail-focus.html`) not built — needs a decisions-list endpoint, open-position / order data, and per-trade stats (win rate, confidence calibration). None exist.

The old `tradeService` v1 endpoints (`/trade/portfolio/`, `/trade/activate/{id}/`, `/trade/cancel/{id}/`) are still used by the not-yet-rebuilt **Overview** page.

---

## 10. My bots — `pages/dashboard/bots.tsx` + `bots/new.tsx` + `bots/[id]/{index,settings,review}.tsx`

Built 2026-09-10 on the **Bots (v2)** API (`/api/trading_v2/bots/`). Shares
`services/tradingV2Service.ts` + `redux/slices/tradingV2Slice.ts` with §9.
New rail/mobile-tab item `"bots"`. Enum → label maps in `lib/botV2Labels.ts`.

Routes: `bots.tsx` (list, wired) · `bots/new.tsx` (add, wired) ·
`bots/[id]/index.tsx` (detail/overview — header + config + linked trades are
live, health/decisions/P&L are **design-only** behind `.fx-preview`) ·
`bots/[id]/settings.tsx` (edit, wired) · `bots/[id]/review.tsx`
(recommendation — **design-only**, no data at all).

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /trading_v2/bots/` | list page + the trade-form bot picker |
| ✅ | `POST /trading_v2/bots/` | "Add a bot" — `dev_key` returned once, shown in a one-time dialog |
| ✅ | `GET /trading_v2/bots/{id}/` | hydrate the settings page |
| ✅ | `PATCH /trading_v2/bots/{id}/` | "Save changes" on settings |
| ✅ | `DELETE /trading_v2/bots/{id}/` | danger-zone remove |
| ✅ | `POST /trading_v2/bots/{id}/pause/` · `/resume/` | pause / resume controls |
| ✅ | `POST /trading_v2/bots/{id}/regenerate-key/` | returns `{ status, dev_key }`; new key shown once |
| ✅ | `POST /trading_v2/bots/test-connection/` | `{ webhook_url }` → `{ ok, status_code?, body?, error? }`; never throws |
| ❓ | **enum values** | doc spells out only `platform=N8N_CLOUD`, `reach_mode=PUSH`, `on_no_reply=SKIP`, `decision_style=BUY_SELL_HOLD`, `status=ACTIVE`. Front-end assumes the rest (`N8N_SELF/MAKE/ZAPIER/OWN_CODE/OTHER`, `PULL`, `HOLD/CLOSE`, `BUY_HOLD/SIGNAL_STRENGTH`, `PAUSED/FAILING`) in `lib/botV2Labels.ts` + `types/tradingV2.d.ts`. Confirm/replace. |
| ❓ | **`model_name`** | free-text string. Front-end offers a fixed `MODEL_OPTIONS` list but sends whatever's set; confirm there's no server-side enum. |
| ❓ | **`dev_key` on later reads** | assumed masked/absent after create. Settings page shows `••••` until regenerate if the field comes back empty. Confirm. |
| ❓ | **`test-connection` response shape** | `BotV2TestResult` (`ok`/`status_code`/`body`/`error`) is the front-end's assumption — confirm field names. |
| ⛔ | **per-bot health / uptime / reply-time** | bot-detail shows 30d uptime %, median reply time. No endpoint — `—` preview strip on `bots/[id]/index.tsx`. |
| ⛔ | **per-bot decisions list** | `bots/[id]/index.tsx` "Recent decisions" is a design-only table (candle → action → outcome). Needs `GET /trading_v2/bots/{id}/decisions/` (or similar). |
| ⛔ | **per-bot P&L** | "net on its trades · 30d" — `—` preview on detail + review. |
| ⛔ | **bot review / recommendation** | `bots/[id]/review.tsx` is built as design-only (verdict, findings columns, suggested-prompt-change). Needs the decision history above **plus** an analysis endpoint that returns the verdict + findings + prompt diff. Every figure on that page is a placeholder. |

Bot-facing (documented, not used by the dashboard UI): the bot authenticates
its calls to `…/trades/{id}/candles/` and `…/decision/` with `dev_key` in the
`X-Candleweb-Key` header.

---

## Cross-cutting

- **Token refresh URL has a double slash** — `${uri}/user/refresh/get/token/` in
  `lib/axiosApi.ts` and `lib/hooks/useRefreshToken.ts` (`uri` already ends `/`).
  Frontend fix, but worth confirming the server tolerates `//`.
