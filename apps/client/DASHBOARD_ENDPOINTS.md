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
| ⛔ | **task type/kind field on `GET /task/all/`** | The design (`candleweb-tasks-focus.html`) has 4 task kinds — watch / read / quiz / project — where only **project** needs a human marker; watch/read (self-reported via a confirm checkbox) and quiz (graded client-side) go straight to "ready to claim" the moment they're submitted. Our `TaskProp` has no field to tell these apart, so every submission goes through the same `POST /task/reward/` + marker-review path regardless of kind. Net effect: nothing ever reaches "ready to claim" instantly — the claim banner only appears once a human/admin flips `is_verified`, which can be hours or days later. **This is why the claim card looked "gone" to the PM** — it's not broken, it's just gated on a marker for every task now, including the kinds the design expects to self-verify. Need either a `type` field (so the FE can fast-track watch/read/quiz client-side like the design) or confirmation that "every task is human-reviewed" is the accepted product behavior (in which case the design's copy for those task types should change too). |
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
| ⛔ | **credits earned per course** | the stats band's "Credits earned here" tile has no real source — AI credits are only tracked account-wide (`GET /task/stats/`), with no link back to which course earned them. Shows `—` behind a "needs a per-course credits endpoint" chip rather than the account-wide total mislabeled as course-specific. See BACKEND_API_REQUESTS.md §1.17. |

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
| ⛔ | **bot decision feed** | "Recent activity" spine is a design-only placeholder. Needs the per-bot decisions endpoint from §10 (`GET /trading_v2/bots/{id}/decisions/`), ideally an account-wide `GET /trading_v2/decisions/?limit=` for this feed. |
| ⛔ | **momentum / review-readiness** | design-only — needs the decisions feed + `GET /trading_v2/bots/{id}/review/` (§10). |

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

Bot-facing (documented, not used by the dashboard UI): `GET /trading_v2/trades/{trade_id}/candles/`, `POST …/decision/` — shown as reference URLs on the New-trade screen.

**Trade-detail page** (`candleweb-trade-detail-focus.html`) not built — needs a decisions-list endpoint, open-position / order data, and per-trade stats (win rate, confidence calibration). None exist.

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
| ⛔ | **per-key permission introspection** | the whole "Key safety" panel from the mockup (withdrawal on/off, IP lock, futures, spot, read, expiry → a 0-100 score). No endpoint reads back what a key actually granted. Rendered as a `.fx-preview` note; only the IP-allowlist box is real. Needs `GET /exchange/record/{id}/permissions/` (or fields on the record: `can_withdraw`, `can_trade`, `can_read`, `ip_restricted`, `expires_at`). |
| ⛔ | **per-account balance breakdown** | mockup shows Balance / Available / In-positions **per exchange account**. `/trade/portfolio/balance/` is per-currency, not per-account. Stat band shows the account-wide total only. |
| ❓ | `is_active` semantics | assumed `true` = key valid, `false` = expired/revoked. Confirm, and whether an `expires_at` / `last_synced_at` is available. |
| — | "Sync all" | no dedicated endpoint — just re-fetches records + balance. |

---

## Cross-cutting

- **Token refresh URL has a double slash** — `${uri}/user/refresh/get/token/` in
  `lib/axiosApi.ts` and `lib/hooks/useRefreshToken.ts` (`uri` already ends `/`).
  Frontend fix, but worth confirming the server tolerates `//`.
