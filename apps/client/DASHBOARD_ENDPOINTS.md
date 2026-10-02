# Dashboard — endpoint status per redesigned page

Status of the dashboard pages rebuilt on the `dashboard-focus` shell, and the
API each one still needs to be fully functional.

Legend: ✅ wired & working · ⛔ missing / blocking · ❓ exists but shape unconfirmed

Base URL: `https://api.candleweb.io/api/` (`apps/client/lib/axiosApi.ts`).

---

## 1. Subscription — `pages/dashboard/subscription.tsx` (rebuilt on subscription_v2, 2026-09-27)

Two designs on one route: `candleweb-subscription-new.html` (no live subscription) and
`candleweb-subscription.html` (on a plan, incl. the free Paper plan). Old token-pack
`/subscription/*` endpoints are no longer used by this page (the public pricing page still
uses them). Service `services/subscriptionV2Service.ts`, slice `subscriptionV2`.

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /subscription_v2/plans/` | plan cards, prices by currency × cycle, bullets, entitlements (upgrade/downgrade diff rows) |
| ✅ | `GET /subscription_v2/me/` | picks the view. Handled as `{subscription, entitlements}` **or** a bare Subscription — the schema says Subscription, the description says a wrapper; confirm which. |
| ✅ | `GET /subscription_v2/me/usage/` | hero volume + included-volume meter |
| ✅ | `GET /subscription_v2/me/reviews/` | review chip, ring, streak |
| ✅ | `GET /subscription_v2/me/invoices/` | billing history; an `open`/`failed` invoice shows a "Pay … due" button |
| ✅ | `GET /subscription_v2/me/payment-methods/` | "Paying with" label |
| ✅ | `POST /subscription_v2/subscribe/` | free plan starts inline; paid → redirect to `checkout_url` |
| ✅ | `POST /subscription_v2/change-plan/` | upgrade → `checkout_url`; downgrade → `scheduled` + `effective_at` toast |
| ✅ | `POST /subscription_v2/cancel/` · `/resume/` | cancel dialog; "undo cancellation" button while `cancel_at_period_end` |
| ✅ | `POST /subscription_v2/me/invoices/{number}/pay/` | pay an outstanding invoice |
| ❓ | checkout return URL | on return the page polls `/me/` (6× / 3s) if the query has `status`, `tx_ref`, `transaction_id` or `checkout`. Confirm what Flutterwave's `redirect_url` points at and which params it carries. |
| ⛔ | crypto payment | subscribe/change-plan take no payment method and only return a Flutterwave checkout, so "Pay with crypto" is shown disabled ("Soon"). |
| ✅ (2026-09-30) | `GET /subscription_v2/review-packs/` | public; top-up strip in the "Bot reviews" card (active view), sorted by quantity, "save N%" from `unit_amount` vs the dearest pack |
| ✅ (2026-09-30) | `POST /subscription_v2/reviews/purchase/` | `{pack, callback_url}` via the pay dialog → Flutterwave `checkout_url`. On return the page polls `/me/reviews/` + `/me/invoices/` and only confirms once the top-up invoice is `paid` or the balance rises by the pack size. Never gated on `unlock_closed_trades`. Not offered on the "no plan yet" view (not in that mockup), though the API allows it. |
| ⛔ | invoice download | "Download invoices" link not built — no PDF endpoint. |
| ⛔ | closed-trades count | "First bot review · N of 20 trades" meter shows 0 filled; no closed-trade count per prompt. |

---

## 2. Daily Tasks — `pages/dashboard/tasks.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /task/all/`, `/task/stats/`, `/task/streak/`, `/task/leaderboard/` | |
| ✅ | `GET /task/reward/` | earned/claimable rewards |
| ✅ | `POST /task/reward/` | submit verification link for a task |
| ✅ | `POST /task/reward/claim/{id}/` | claim one reward (POST only — the legacy GET is being disabled) |
| ✅ | `GET /task/course/{course_id}/` | **course tasks** (2026-09-26). Not in `/task/all/` any more. Looped over the ids from `GET /tutor/courses/`; 403 (not enrolled) / 400 (no course) skipped quietly. Shown in the "Course tasks" section, grouped by course. |
| ✅ | `task_type` / `category` on task lists | `standard \| quiz \| builder` → row tag (quiz / project) + per-type submit-dialog copy. Every type still submits a link via `POST /task/reward/` — no quiz-questions or project-upload endpoint yet. |
| ✅ | `/task/streak/` new meaning | `user_streak` = consecutive **weeks** with activity (task or class). Labels changed from "days running"/"tasks logged" to "weeks running"; `longest_streak` shown as "best N"; `last_activity` drives the "This week" card (assumes Monday week start). `streak_sources` not rendered — shape undocumented. Academy + course-detail labels updated too. |
| ❓ | `task_type` on `GET /task/reward/` rows | needed for the Quiz clean / Builder badges. FE reads it if present; badges show "Needs task-type data" otherwise. |
| ⛔ | **`POST /task/reward/claim-all/`** | "Claim all" currently loops the single-claim endpoint once per reward. |
| ✅ (superseded — see `task_type` row above) | ~~task type/kind field on `GET /task/all/`~~ | The design (`candleweb-tasks-focus.html`) has 4 task kinds — watch / read / quiz / project — where only **project** needs a human marker; watch/read (self-reported via a confirm checkbox) and quiz (graded client-side) go straight to "ready to claim" the moment they're submitted. Our `TaskProp` has no field to tell these apart, so every submission goes through the same `POST /task/reward/` + marker-review path regardless of kind. Net effect: nothing ever reaches "ready to claim" instantly — the claim banner only appears once a human/admin flips `is_verified`, which can be hours or days later. **This is why the claim card looked "gone" to the PM** — it's not broken, it's just gated on a marker for every task now, including the kinds the design expects to self-verify. Need either a `type` field (so the FE can fast-track watch/read/quiz client-side like the design) or confirmation that "every task is human-reviewed" is the accepted product behavior (in which case the design's copy for those task types should change too). |
| ❓ | `/task/leaderboard/` shape | page matches `account_id === user.username`; confirm it returns `account_id`, `point`, `level`. |
| ❓ | `GET /task/all/` empty response | when there are no tasks it returns `{ "message": "..." }` instead of `[]`. FE now treats that as an empty list (was showing it as an error toast on every visit). Cleaner would be to always return an array. `GET /task/reward/` has the same shape and is now handled the same way. |

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
| ⛔ | **`action`/`is_handled` fields per notification** | design's "needs-you" banner + "Needs you" tab + per-row action button ("Claim 40 credits", "Replace the key") — no data marks a notification actionable, so these are omitted rather than faked. See BACKEND_API_REQUESTS.md §1.18. |
| ⛔ | **`DELETE /notification/{id}/`** (dismiss) and **mark-unread** | design lets you dismiss one row or flip it back to unread; only mark-read and delete-everything exist today. See §1.19. |
| ⛔ | **`GET/PATCH /notification/preferences/`** | design's per-category mute + quiet-hours panel, and the "Muted" stat — no preferences endpoint exists. See §1.20. |
| ✅ (2026-09-18) | day-grouping ("Today / Yesterday / Earlier") | added client-side from real `created_at`, matches the design's `.fx-nday` grouping. |

---

## 4. Academy / Tutor overview — `pages/dashboard/tutor/index.tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /tutor/courses/featured/` | shop / catalogue |
| ✅ | `GET /currency/retrieve/all/` | USD rate for the AI-unit revenue figure |
| ✅ | task endpoints (see §2) | study stats / streak / rank |
| ⛔ | **`GET /tutor/courses/` — per-user progress** | the "Your learning" list. The response has **no** per-user `progress` / `status` / `completed_at` / `is_enrolled` — so every enrolled course read as "In progress / 0%". FE workaround: it now fetches `GET /tutor/courses/{id}/` for each course and derives progress from `class_schedules` (a session past its `end_datetime`, or `is_completed`, counts as done). This is N extra requests — please add `progress` (0–100), `status` (`not_started`/`in_progress`/`completed`) and `completed_at` to each row of this list, **or** ship a dedicated `GET /tutor/courses/enrolled/`. Also confirm whether this endpoint (when authed) returns the caller's enrollments or the whole catalogue — the sample showed `current_enrollment_count: 0` on a course the user says they own. |

---

## 5. Course detail — `pages/dashboard/tutor/course/[id].tsx`

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /tutor/courses/{id}/` | course + lessons |
| ✅ | `GET /certificate/{username}/` | certificate lookup + download |
| ❓ | per-user completion | confirm `GET /tutor/courses/{id}/` returns lesson/module completion state for the caller (needed for the progress UI). |
| ✅ | `GET /tutor/courses/{id}/ai-units/` | "Credits earned here" tile (2026-09-26) — `earned_units` + "from N claimed tasks". Claimed rewards only; 403/404 message shown in the caption. |
| ✅ | `POST /tutor/schedules/{id}/check-in/` | every Join (hero "Continue learning" + module dialog) goes through check-in and opens the `class_link` from its response — never the schedule's own link — so attendance is recorded and counts toward the streak. Join enabled from 15 min before start to class end. |

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

## 8. Overview — `pages/dashboard/index.tsx` (rebuilt 2026-09-10)

Rebuilt on `.fx-*` from `candleweb-dashboard-focus.html` (+ the new-account
variant `candleweb-new-account-dashboard.html`). The legacy body + the
`useDashboardBootstrap` v1 `/trade/*` calls are **gone** from this route.

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /trading_v2/bots/` | "Your bots" strip |
| ✅ | `GET /trading_v2/trades/` | "Your trades" list (shown as positions) + counts |
| ✅ | `GET /trade/portfolio/balance/` | hero "Account balance" figure (sums non-CDE balances) |
| ✅ | `GET /exchange/record/` | status chip + empty-state detection |
| ✅ | notifications | via `TopBar` (see §3) |
| ⛔ | **equity time series** | hero chart is a static placeholder SVG. Needs account-equity history (per exchange account, daily points). |
| ⛔ | **open positions + stop distance** | "Your trades" rows show `—` for P&L and have no live position/entry/stop/mark. Needs the same per-trade performance / open-position data as §9. |
| ⛔ | **daily & 30d P&L, drawdown, at-risk** | hero substats "Open P&L", "Realised · 30d" render `—`. |
| ✅ (2026-10-02) | **bot decision feed** | `GET /trading_v2/decisions/` — the "Recent activity" spine is live, rendered by the shared `DecisionsFeed` component. Clicking a row opens the decision detail (`GET /decisions/{id}/`). |
| ◔ (2026-10-02) | **momentum / review-readiness** | "Days with no bot failures" is now real from `GET /trading_v2/bots/health/` (the fleet's *worst* bot, not an average). The 20-trade review-readiness meter and "suggestions applied" still need closed-trade history + `GET /trading_v2/bots/{id}/review/` (§10). |

New-account state: shown when `bots`, `trades` and `exchangeRecord` are all
empty — a 3-step getting-started panel linking to the real flows (Settings →
connect exchange, `/dashboard/bots/new`, `/dashboard/trades/new`). The mockup's
full interactive 4-step walkthrough with its own modals was **cut** — the real
steps are their own pages.

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

| ✅ (2026-10-02) | **`candles_url` / `decision_url` on every trade** | the trade response now carries both, already host-correct. The form no longer builds them from the id (the old `API_ROOT` constant pointed at production while the app runs against sandbox) and shows them through `ConnectBotPanel` with copy buttons plus the bot's `dev_key` — after create and on the setup screen. Both are `null` on a CandleAI trade, where the panel is hidden. |
| ⛔ (2026-10-02) | **`1d` candle feed** | the model accepts `1d` but the feed does not serve it, so a `1d` trade fails forever with "Timeframe '1d' is not available on the candle feed yet." **`1d` was removed from the timeframe dropdown** (`TIMEFRAMES` in `trades/new.tsx`) and goes back when the feed supports it. |
| ⛔ (2026-10-02) | **indicator values above 1m** | on 15m/1h/4h every indicator value comes back `null`; the candles themselves are correct. The picker still works and the form warns on those timeframes. No screen displays indicator *values* yet — don't build one until this is fixed. |

Bot-facing (documented, not called by the dashboard UI): `GET /trading_v2/trades/{trade_id}/candles/`, `POST …/decision/` — surfaced to the user through `ConnectBotPanel`, always from `candles_url` / `decision_url`, never assembled.

**Trade-detail page** (`candleweb-trade-detail-focus.html`) still not built as its
own route — `/dashboard/trades/new?id=<id>` serves as the detail/edit screen and
now carries the connection panel. A dedicated page would need open-position /
order data and per-trade stats (win rate, confidence calibration), which do not
exist; per-trade decisions do (`/dashboard/decisions?trade=<id>`).

The old `tradeService` v1 endpoints (`/trade/portfolio/`, `/trade/activate/{id}/`, `/trade/cancel/{id}/`, `/trade/active/`, `/trade/portfolio/profit/*`) are now **unused by any redesigned page** — `useDashboardBootstrap` and the legacy Overview body were the last callers. They can be retired once no other legacy route needs them.

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
| ✅ (2026-09-30) | **enum values** | confirmed against the API schema. Three FE guesses were wrong and got rejected ("not a valid choice"): `N8N_SELF`→`N8N_SELF_HOSTED`, `OWN_CODE`→`CUSTOM_CODE`, `BUY_HOLD`→`BUY_HOLD_ONLY`. Also `webhook_url` is optional for PULL — sent as `null` when empty (a blank string fails URL validation). |
| ✅ (2026-09-30) | `GET /trading_v2/limits/` | `bots/new.tsx` disables both add buttons when `agents.can_start_another` is false and says why (no plan / N of N running) with a link to plans. Not yet used on trades or on resume. |
| ❓ | **`model_name`** | free-text string. Front-end offers a fixed `MODEL_OPTIONS` list but sends whatever's set; confirm there's no server-side enum. |
| ✅ (2026-10-02) | **`dev_key` on later reads** | confirmed present in full on **every** bot response, not only on create/regenerate. It is masked in the UI by choice (Show/Copy), not because the API withholds it. The "shown only on create" captions were removed. |
| ❓ | **`test-connection` response shape** | `BotV2TestResult` (`ok`/`status_code`/`body`/`error`) is the front-end's assumption — confirm field names. |
| ✅ (2026-10-02) | **per-bot health / uptime / reply-time** | `GET /trading_v2/bots/{id}/health/`. The Connection block, the "Reply time" vital and the 30-day `.fx-uptime` bar chart (from `daily_replies`) are live. **Rule:** a field named in `health.unavailable` renders as "Not measured yet" — never 0, never a green 100%. Helpers in `lib/botHealthV2.ts`. Still absent: p95 reply time, and last *successful* call for the settings page. |
| ✅ (2026-10-02) | **per-bot decisions list** | `GET /trading_v2/decisions/?bot=<id>`, live on `bots/[id]/index.tsx` as an inline `DecisionsFeed` (5 at a time, Show more / Close, row opens the detail). No order outcome column: nothing is bought or sold from a decision, so "what the order did" does not exist. |
| ⛔ | **per-bot P&L** | "net on its trades · 30d" — `—` preview on detail + review. |
| ⛔ | **bot review / recommendation** | `bots/[id]/review.tsx` is built as design-only (verdict, findings columns, suggested-prompt-change). Needs the decision history above **plus** an analysis endpoint that returns the verdict + findings + prompt diff. Every figure on that page is a placeholder. |
| ⛔ (2026-09-23) | **fleet-level trend/streaks/milestone + per-bot P&L on the list page** | `bots.tsx` now has a real "Your bots at a glance" section (segmented fleet-health meter using each bot's *current* `status`, which is real) but the design's 7-day trend, failure streaks and "reviews waiting"/"strategy comparison" milestone panel are all `.fx-preview`-gated — same root cause as the two rows above (needs decision history + a review endpoint). Each bot row also got an honest `.fx-preview` "P&L · 30d" tile rather than a fabricated number. |
| ⛔ (2026-09-23) | **bot-detail header/vitals/review-readiness now match the design's real shape** | `bots/[id]/index.tsx` was rebuilt to the design: `.fx-bhead` (bot name as `<h1>`, status+connection below it) and the 5-column `.fx-vitals` row (Net·30d, Win rate, Avg win/loss, Open now, Reply time) replaced a smaller ad-hoc header and a 4-column placeholder row. All 5 vitals are still `—` — Net/Win-rate/Avg-win-loss need §1.4, Reply time needs §1.6, and **Open now** needs a new thing: per-trade open-*position* state (not just `TradeV2.status`, which only says config-running/paused/error, not whether a position is currently held). Also added the design's "Review readiness" section (trade-count meter, streaks, "This bot's milestones" checklist) — every metric needs bot decision history (§1.5) except "Prompt stored," which is real (`!!bot.prompt`). |
| ⛔ (2026-09-23) | **bot-detail two-column layout + Connection/Endpoints split** | Page body was flattened into one column before, missing the design's `.fx-two2` split (Connection/Endpoints/Trades this bot runs on the left, Recent decisions/Prompt in use on the right) — now matches. "Connection" (`.fx-health` 4-tile grid: Last signal/Reply time/Failed·7d/Uptime·30d) is entirely `—` — same §1.6 gap, and its `.fx-uptime` 30-day bar chart is **omitted rather than faked**, since there's no daily reply-history data to draw real bars from. "Endpoints" (webhook + dev key, real) now uses the shared `.fx-ep2` card style with a working Copy button (`navigator.clipboard`); Regenerate stays settings-only rather than duplicating that flow here. |
| ⛔ | **"Open now" — per-trade open-position flag** | `TradeV2Status` only covers whether the trade *config* is running, not whether it's actively holding a position and on which pair. See BACKEND_API_REQUESTS.md §1.21. |
| ❓ | **CandleAI on/off toggle** | the design's `bots.tsx` mockup shows a toggle switch on the CandleAI hero card. `CANDLE_AI` is a real `decider_type` chosen per-trade (`types/tradingV2.d.ts`), but there's no account-level "enable/disable CandleAI" field or endpoint anywhere — so it's unclear what the toggle is meant to control. Not built; needs product/backend clarification before it can be wired to anything real. |

Bot-facing (documented, not called by the dashboard UI): the bot authenticates
its calls to `…/trades/{id}/candles/` and `…/decision/` with `dev_key` in the
`X-Candleweb-Key` header. The dashboard **shows** those two URLs — it never
builds them: they come off the trade response as `candles_url` /
`decision_url`, already pointing at the right host, and the old hand-built
`API_ROOT` constant on the trade form pointed at production while the app runs
against sandbox. See `components/dashboard/focus/ConnectBotPanel.tsx`.

---

## 10b. Bot decisions — `components/dashboard/focus/DecisionsFeed.tsx` (2026-10-02)

**No page of its own.** A standalone `/dashboard/decisions` route was built and
then removed the same day: decisions belong next to the bot that made them, not
in a separate destination. `DecisionsFeed` is a self-fetching, self-paging
component dropped wherever decisions are relevant — a few rows, a **Show more**
that fetches and appends the next page, a **Close** that drops back to the
first few, and a row click that opens that one decision in full.

In use on: Overview ("Recent activity", all bots, 4 at a time) and bot detail
("Decisions", `bot=<id>`, 5 at a time). The trades list links a trade to its
bot rather than to a decisions URL. The record of what each bot answered when
it was handed a candle — **no order is placed from a decision**, nothing here
is a trade.

| Status | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /trading_v2/decisions/` | `{ status, message, count, results }`. Filters: `bot`, `trade`, `decision` (BUY/SELL/HOLD), `limit` (default 25, max 100), `offset`. Paging is driven by **`count`** (the total), never `results.length`. A filter is only ever sent when it has a value — `?bot=undefined` is a 400 (`"bot: Must be an id."`). |
| ✅ | `GET /trading_v2/decisions/{id}/` | bare object, adds `market_data_ids`. Opened from any decision row. `market_data_ids` can be **shorter** than `market_data_count` — the count is frozen at decision time and the links go when old market data is tidied up; the UI says so rather than showing a bare mismatch. |

Field rules enforced in `DecisionsList` / `lib/botHealthV2.ts`:

- `think_time_seconds` is measured by Candleweb, not self-reported; `null`
  renders as a dash, **never `0`**.
- `candles_seen` is what users see. `market_data_count` only appears in the
  detail dialog, explained — it looks like a bug otherwise.
- `saw_stale_data: true` gets a visible marker; it is the first thing to check
  when a bot does something strange.
- `rationale` is free text from the user's own bot; React escapes it and
  nothing uses `dangerouslySetInnerHTML`.
- `confidence` is 0–100 and optional.

The `trade` filter is supported by the endpoint but not currently used by any
screen — a per-trade feed would go on the trade setup page if it is ever asked
for.

---

## 11. History — `pages/dashboard/history.tsx` (built 2026-09-10, design-only)

Built on `.fx-*` from `candleweb-history-focus.html`. New rail item `"history"`.
The page is **entirely a preview** — there is no closed-trades data.

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /trading_v2/bots/` | per-bot strip lists the real bots (name + status); their closed/win-rate/net numbers are `—` |
| ⛔ | **closed-trades list** | the whole page. Needs `GET /trading_v2/trades/history/?page=N` (or `?status=closed` on the trades list) returning, per closed position: pair, side, bot, trade name, entry price, exit price, opened_at, closed_at, exit reason (`stop_hit` / `trailing_stop` / `bot_closed` / `manual`), realised P&L (amount + pct). |
| ⛔ | **history summary** | closed count, win rate, avg win / avg loss, net (amount + pct), best day — a `GET /trading_v2/trades/history/summary/?window=30d` block, or derive client-side from a full list. |
| ⛔ | **per-bot history rollup** | closed / win-rate / net per bot — same, grouped by bot. |
| ⛔ | **export** | the "Export" button needs a CSV endpoint (`GET /trading_v2/trades/history/export/`) or is done client-side once the list exists. |

---

## 12. Exchanges — `pages/dashboard/exchanges.tsx` (built 2026-09-11)

Built on `.fx-*` from `candleweb-exchanges-focus.html` (+ empty / add-exchange
mockups). New rail item `"exchanges"` (5th, before Daily tasks; `SwapIcon`) and a
mobile tab; the mobile bar now ends in a **"More"** sheet holding History / Daily
tasks / Academy / Settings. A stand-alone, richer version of the Settings
"Exchanges" section — reuses `AddExchangeDialog`.

| | Endpoint | Notes |
|---|---|---|
| ✅ | `GET /exchange/record/` | connected-account list (name via `/exchange/list/`, masked `API_KEY`, `is_active`) |
| ✅ | `GET /exchange/list/` | supported exchanges — "Add another exchange" grid |
| ✅ | `POST /exchange/record/` · `DELETE /exchange/record/{id}` | add (via `AddExchangeDialog`) / disconnect |
| ✅ | `GET /trade/portfolio/balance/` | "Total balance" stat (sum of non-CDE balances) |
| ✅ | `GET /trading_v2/trades/` | "trades running here" chips — matched by `trade.exchange_account === record.id` |
| ⛔ | **per-key permission introspection** | the full "Key safety" dashboard is now built to the design (score ring, 4-item checklist, 4-badge "Earned" grid) — but rendered in an honest "not scored yet" state, since no endpoint reads back what a key actually granted. Only the "More than one account" badge and the IP-allowlist box use real data. Needs `GET /exchange/record/{id}/permissions/` (or fields on the record: `can_withdraw`, `can_trade`, `can_read`, `futures_enabled`, `ip_restricted`, `expires_at`) — see BACKEND_API_REQUESTS.md §1.14 for the exact per-item scoring rules. |
| ⛔ | **per-account balance breakdown** | mockup shows Balance / Available / In-positions **per exchange account**. `/trade/portfolio/balance/` is per-currency, not per-account. Stat band shows the account-wide total only. |
| ❓ | `is_active` semantics | assumed `true` = key valid, `false` = expired/revoked. Confirm, and whether an `expires_at` / `last_synced_at` is available. |
| — | "Sync all" | no dedicated endpoint — just re-fetches records + balance. |

---

## Cross-cutting

- **Token refresh URL has a double slash** — `${uri}/user/refresh/get/token/` in
  `lib/axiosApi.ts` and `lib/hooks/useRefreshToken.ts` (`uri` already ends `/`).
  Frontend fix, but worth confirming the server tolerates `//`.
