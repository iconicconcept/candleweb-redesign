# Candleweb Dashboard — API requests for the backend

**From:** Frontend team
**Re:** Endpoints the redesigned dashboard needs before each page is fully functional
**Base URL:** `https://api.candleweb.io/api/`
**Auth:** same bearer token as every other authed endpoint, unless noted.

---

## How to read this

The dashboard has been rebuilt page by page. Most pages are already wired to
existing endpoints and working. This document lists **only what is still
missing or unconfirmed**, so you know exactly what to build.

Each item has: what the UI needs it for, a **proposed** request/response
(rename freely — just tell us the final shape), and what the frontend does
today as a stand-in.

Priority:

| P | Meaning |
|---|---|
| **P1** | A visible feature is broken / faked without it |
| **P2** | Works today but via an ugly workaround (e.g. a loop of single calls) |
| **P3** | Confirm-only — no build, just tell us the shape/enum and we adjust |

---

## P1 — New endpoints (a feature is faked or blocked without these)

### 1.1 Trading pairs list
- **Why:** `trading_v2` trades store `pair` as an integer id. The New-trade form
  needs to show a dropdown of tradeable pairs. Right now it shows a **hard-coded
  list of 5 pairs** (`BTC/USDT`…`LINK/USDT`) that may not match your DB ids.
- **Proposed:** `GET /trading_v2/pairs/`
  ```json
  [
    { "id": 1, "symbol": "BTC/USDT", "base": "BTC", "quote": "USDT", "is_active": true },
    { "id": 2, "symbol": "ETH/USDT", "base": "ETH", "quote": "USDT", "is_active": true }
  ]
  ```
- **Used by:** `pages/dashboard/trades/new.tsx`

### 1.2 Exchange accounts list (for trading_v2)
- **Why:** trades store `exchange_account` as an integer id. The form needs the
  user's connected exchange accounts to choose from. Currently a **hard-coded
  list** (`KuCoin · main`, `Binance · main`, …).
- **Question:** is this the same thing as `GET /exchange/record/`? If so, tell us
  and we'll use that. If `trading_v2` has its own account model, we need its list.
- **Proposed:** `GET /trading_v2/exchange-accounts/`
  ```json
  [
    { "id": 1, "label": "KuCoin · main", "exchange": "kucoin", "is_active": true }
  ]
  ```
- **Used by:** `pages/dashboard/trades/new.tsx`

### 1.3 Per-account balance
- **Why:** the New-trade form has a "Free to allocate" panel and the trades list
  has a "capital allocated / in positions / free" band. Both render `—` today.
- **Proposed:** `GET /trading_v2/exchange-accounts/{id}/balance/`
  ```json
  {
    "currency": "USDT",
    "total": "5000.00",
    "allocated_to_trades": "3200.00",
    "free": "1800.00"
  }
  ```
- **Used by:** `pages/dashboard/trades/new.tsx`, `pages/dashboard/trades.tsx`

### 1.4 Per-trade performance
- **Why:** the trades list shows a "P&L · 30d" figure per trade and the (not yet
  built) trade-detail page needs full stats. All `—` today.
- **Proposed:** either a field block on each `GET /trading_v2/trades/` row, or
  `GET /trading_v2/trades/{id}/performance/`
  ```json
  {
    "realized_pnl": "125.40",
    "unrealized_pnl": "-12.10",
    "pnl_pct_30d": 4.7,
    "open_position": {
      "side": "LONG", "size": "0.05", "entry_price": "63500.00", "mark_price": "63980.00"
    },
    "win_rate": 0.61,
    "trades_count_30d": 34
  }
  ```
- **Used by:** `pages/dashboard/trades.tsx` (+ future trade-detail page). Also the source `bots.tsx`
  would sum per-bot to fill in each bot row's honest `—`-and-`.fx-preview` "P&L · 30d" tile.

### 1.5 Bot decision history — DELIVERED 2026-10-02
**Shipped as `GET /trading_v2/decisions/?bot=<id>` (not the proposed
`/bots/{id}/decisions/`), wrapped as `{ status, message, count, results }`.
Field names differ from the proposal below — see `types/tradingV2.d.ts`
(`BotDecisionV2`) for what actually arrives: `decision`, `confidence`,
`rationale`, `candles_seen`, `market_data_count`, `saw_stale_data`,
`think_time_seconds`, `decided_at`. There is no order outcome (`status`,
`size_pct`): nothing is bought or sold from a decision, so "what the order
did" does not exist. Wired in `components/dashboard/focus/DecisionsList.tsx`.
Original request kept below for reference.**

- **Why:** the bot-detail page has a "Recent decisions" table (candle → the bot's
  call → what the order did). It's a **design-only placeholder** right now.
- **Proposed:** `GET /trading_v2/bots/{id}/decisions/?page=N`
  ```json
  {
    "count": 128,
    "next": "...?page=2",
    "results": [
      {
        "id": 9001,
        "created_at": "2026-09-10T14:00:00Z",
        "trade": 12,
        "pair_symbol": "BTC/USDT",
        "candle_close_time": "2026-09-10T13:59:59Z",
        "action": "buy",            // buy | sell | hold | (or signal strength)
        "size_pct": 25,
        "reply_ms": 840,            // how long the bot took to answer
        "status": "filled",        // filled | rejected | no_reply | error
        "rationale": "higher-low held, RSI 41"
      }
    ]
  }
  ```
- **Used by:** `pages/dashboard/bots/[id]/index.tsx`
- **Also needed by:** `pages/dashboard/bots.tsx` — the design's fleet-wide "Fleet health — 7 days"
  trend, failure streaks, and "reviews waiting"/"strategy comparison" milestone panel on the bots
  list page all need this same per-bot decision history (aggregated across bots), plus 1.6 and 1.7
  below. Today that section only shows each bot's *current* status (real), with an honest
  `.fx-preview` note in place of the rest.

### 1.6 Bot health / uptime — DELIVERED 2026-10-02
**Shipped as `GET /trading_v2/bots/{id}/health/` plus a fleet roll-up at
`GET /trading_v2/bots/health/`, both wrapped as `{ status, message, data }`.
Field names differ from the proposal below — see `BotHealthV2` /
`FleetHealthV2` in `types/tradingV2.d.ts`. Two things to know when reading it:
`unavailable` lists the fields with no measurement yet, which must render as
"Not measured yet" rather than 0 or 100%; and `daily_replies` is always
exactly 30 zero-filled entries. Presentation rules live in
`lib/botHealthV2.ts`. Still missing: p95 reply time, and the settings page's
"last *successful* call" (the endpoint reports last signal, not last success).
Original request kept below for reference.**

- **Why:** bot-detail shows "Uptime · 30d", "Median reply time", "Decisions · 30d".
  All `—` today.
- **Proposed:** `GET /trading_v2/bots/{id}/health/`
  ```json
  {
    "uptime_pct_30d": 99.2,
    "median_reply_ms": 780,
    "p95_reply_ms": 2100,
    "decisions_30d": 412,
    "calls_today": 96,
    "success_rate_30d": 0.98,
    "last_seen_at": "2026-09-10T14:00:00Z"
  }
  ```
- **Used by:** `pages/dashboard/bots/[id]/index.tsx`, `pages/dashboard/bots/[id]/settings.tsx`
  (the "Last successful call · average reply" line under the webhook URL — needs `last_seen_at`
  of the last *successful* call + an average/median reply time)

### 1.7 Bot review / recommendation
- **Why:** `pages/dashboard/bots/[id]/review.tsx` is built as a **full design-only
  page** — verdict, "what's working / what's costing you", a suggested prompt
  change. Nothing behind it.
- **Depends on 1.5** (needs decision history to analyse).
- **Proposed:** `GET /trading_v2/bots/{id}/review/`
  ```json
  {
    "status": "ready",             // ready | not_enough_data
    "decisions_analysed": 240,
    "grade": "B-",
    "prompt_consistency": 0.72,     // how often it followed its own stated rules
    "estimated_cost_of_top_issue": "-180.00",
    "findings_good": ["Entries after a clean higher-low held longer than average"],
    "findings_bad":  ["Selling the first red candle after a run — most reversed within 3 candles"],
    "suggested_prompt_change": {
      "before": "Sell when a red candle closes.",
      "after":  "Sell when two consecutive red candles close AND volume rises.",
      "supporting_decision_ids": [9001, 9014, 9037]
    }
  }
  ```
- **Used by:** `pages/dashboard/bots/[id]/review.tsx`

### 1.8 Update profile (username / email)
- **Why:** Settings shows username and email **read-only** — there is no way to
  change them. (The old settings page's "Edit" button was a no-op.)
- **Proposed:** `PATCH /user/profile/`  →  `{ "username": "...", "email": "..." }`
  Return the updated profile. If email changes need re-verification, return
  `{ "email_verification_sent": true }` and we'll show that.
- **Used by:** `pages/dashboard/settings.tsx`

### 1.9 All-notifications feed (not just unread)
- **Why:** the Notifications page has an "All" tab and a total count, but only
  `GET /notification/unread/` exists — read notifications can't be displayed.
- **Proposed:** `GET /notification/?page=N` (all statuses, paginated, same row
  shape as the unread feed) — or add a `?status=all|read|unread` param to the
  existing endpoint.
- **Used by:** `pages/dashboard/notifications.tsx`

### 1.10 Closed-trades history
- **Why:** the whole **History** page (`pages/dashboard/history.tsx`) is a
  design-only preview — there is no closed-position data anywhere.
- **Proposed:** `GET /trading_v2/trades/history/?page=N` (or `?status=closed` on
  the trades list)
  ```json
  {
    "count": 412,
    "next": "...?page=2",
    "results": [
      {
        "id": 55012,
        "trade": 12,
        "trade_name": "ETH momentum",
        "pair_symbol": "ETH/USDT",
        "bot_name": "Momentum v3",
        "side": "LONG",
        "entry_price": "3214.80",
        "exit_price": "3268.42",
        "opened_at": "2026-09-10T13:10:00Z",
        "closed_at": "2026-09-10T14:45:00Z",
        "exit_reason": "trailing_stop",   // stop_hit | trailing_stop | bot_closed | manual
        "realized_pnl": "84.20",
        "realized_pnl_pct": 1.67
      }
    ]
  }
  ```
- **Used by:** `pages/dashboard/history.tsx`

### 1.11 History summary
- **Why:** the History page's summary band (closed count, win rate, avg win / avg
  loss, net, best day) and the per-bot rollup.
- **Proposed:** `GET /trading_v2/trades/history/summary/?window=30d`
  ```json
  {
    "window": "30d",
    "closed_count": 412,
    "won": 241, "lost": 171,
    "win_rate": 0.585,
    "avg_win_pct": 1.31, "avg_loss_pct": -0.84,
    "net_amount": "232.40", "net_pct": 2.84,
    "best_day": { "date": "2026-08-22", "amount": "118.30" },
    "by_bot": [
      { "bot": 3, "bot_name": "Momentum v3", "closed": 186, "win_rate": 0.61, "net_pct": 3.1 }
    ]
  }
  ```
- **Used by:** `pages/dashboard/history.tsx` (can be derived client-side if 1.10 returns everything)

### 1.12 Account equity history
- **Why:** the Overview hero chart. Currently a static placeholder line.
- **Proposed:** `GET /trading_v2/exchange-accounts/{id}/equity/?window=30d` (or
  account-agnostic `GET /trading_v2/equity/?window=30d`)
  ```json
  { "currency": "USDT", "points": [ { "t": "2026-08-11T00:00:00Z", "equity": "8120.00" } ] }
  ```
- **Used by:** `pages/dashboard/index.tsx`

### 1.13 Account-wide decision feed — DELIVERED 2026-10-02
**Shipped as `GET /trading_v2/decisions/` with `bot`, `trade`, `decision`,
`limit` and `offset` filters. Powers the Overview "Recent activity" spine and
the per-bot feed on bot detail, both through the inline `DecisionsFeed`
component (paged with Show more / Close). There is no separate decisions page.
Original request kept below.**

- **Why:** the Overview "Recent activity" spine. Same data as the per-bot
  decisions (1.5) but across all of the user's bots, newest first.
- **Proposed:** `GET /trading_v2/decisions/?limit=20` — same row shape as 1.5
  plus `bot_name`.
- **Used by:** `pages/dashboard/index.tsx`

### 1.14 What an exchange key can actually do
- **Why:** the Exchanges page has a full "Key safety" dashboard built to the design
  (score ring, a 4-item checklist, a 4-badge "Earned" grid) — but every one of those
  reads a per-key permission we can't check today, so the whole section currently
  renders in an honest "not scored yet" state instead of a real score.
- **Proposed:** either new fields on `GET /exchange/record/` or a
  `GET /exchange/record/{id}/permissions/`:
  ```json
  { "can_withdraw": false, "can_trade": true, "can_read": true,
    "futures_enabled": false, "ip_restricted": true, "expires_at": null }
  ```
- **Exactly how the UI would use each field** (so the shape above is enough to light
  up the whole section, not just part of it):
  - **Score ring** (0–100, averaged across all connected keys): `+35` if `can_withdraw`
    is false, `+20` if `ip_restricted`, `+15` if `futures_enabled` is false, `+15` if
    `can_trade`, `+10` if `can_read`, `+5` if `expires_at` is null or >14 days out.
  - **Checklist row 1** "No key can move money out" — true only if every key has
    `can_withdraw: false`.
  - **Checklist row 2** "Every key locked to our IP" — true only if every key has
    `ip_restricted: true`.
  - **Checklist row 3** "Spot only, no futures or margin" — true only if every key has
    `futures_enabled: false`.
  - **Checklist row 4** "No key close to expiring" — true only if every key's
    `expires_at` is null or more than 14 days away.
  - **Badge "Trade-only keys"** — same criterion as checklist row 1.
  - **Badge "Locked down"** — same criterion as checklist row 2.
  - **Badge "Nothing stale"** — same criterion as checklist row 4.
  - **Badge "More than one"** — already real today (`exchangeRecord.length >= 2`), no
    new field needed.
- **Used by:** `pages/dashboard/settings.tsx` (the "Account safety" stat + section — same score
  ring number, same fields), `pages/dashboard/exchanges.tsx`, `pages/dashboard/exchanges/new.tsx` (the Connect
  page's "we check what you actually granted" line and the design's read-only verification run —
  reach exchange / read balance / read permissions / confirm withdraw off / check IP lock — both
  wait on this; ideally `POST /exchange/record/` returns the same permission fields on success)

### 1.15 Balance per exchange account
- **Why:** same page also wants Balance / Available / In-open-positions **per
  connected account**. `/trade/portfolio/balance/` only gives per-currency
  totals across everything, not split by which exchange it's on.
- **Proposed:** `GET /exchange/record/{id}/balance/` (same shape as 1.3).
- **Used by:** `pages/dashboard/exchanges.tsx`

### 1.16 Task type/kind field (flagged by PM — the "missing claim card")
- **Why:** the design has 4 task kinds — watch / read / quiz / project — and
  only **project** needs a human marker. Watch and read are self-reported
  (a confirm checkbox), quiz is graded client-side, so both go straight to
  "ready to claim" the moment they're submitted. `GET /task/all/` returns no
  field to tell these apart, so every submission goes through the same
  `POST /task/reward/` + marker-review path — nothing ever reaches "ready to
  claim" until a human flips `is_verified`, even for a task the design expects
  to self-verify instantly. **This is the bug the PM reported as "the claim
  card is no longer there"** — it's not broken, it's gated on a marker for
  every task now, including the kinds that shouldn't need one.
- **Proposed:** add a `type` field to each task — `"watch" | "read" | "quiz" |
  "project"` — on `GET /task/all/`, and auto-set `is_verified: true` on
  `POST /task/reward/` for every type except `"project"`. Alternatively, tell
  us if "every submission is human-reviewed" is the intended product
  behaviour — if so we'll adjust the design's copy for watch/read/quiz instead
  of expecting an instant reward.
- **Used by:** `pages/dashboard/tasks.tsx`, `components/dashboard/focus/academy/DailyTasks.tsx`

### 1.17 Credits earned per course (QA "Issue 34" — course detail stats band)
- **Why:** the course detail page's stats band has a "Credits earned here" tile. AI credits are
  only tracked account-wide (`GET /task/stats/` → `earned_units`), with no link back to which
  course a credit was earned from — so we can't show a real number scoped to just this course.
- **Proposed:** either `GET /tutor/courses/{id}/credits-earned/` → `{ "credits": 240 }`, or add a
  `course_id` to whatever awards AI credits for finishing a module/quiz so we can sum it client-side.
- **Used by:** `pages/dashboard/tutor/course/[id].tsx` (currently shows `—` under a "needs a
  per-course credits endpoint" chip rather than the account-wide total mislabeled as course-specific).

### 1.18 Actionable notifications (the design's "needs-you" banner + tab + per-row action button)
- **Why:** the notifications design has a hero banner ("3 things waiting on you"), a "Needs you"
  tab, and per-row CTA buttons ("Claim 40 credits", "Replace the key") with a handled/unhandled
  state. `GET /notification/unread/` only returns `id`, `notification_type`, `message`, `is_read`,
  `is_active`, `created_at` — nothing marks a notification as actionable or tracks whether its
  action was taken, so none of this can be built without fabricating which notifications "need"
  something.
- **Proposed:** add optional `action: { "label": string, "type": string, "target"?: string } | null`
  and `is_handled?: boolean` fields to each notification row. `type` lets the frontend pick the
  right client-side behaviour (e.g. `"claim_reward"`, `"open_url"`, `"navigate"`); `target` carries
  the id/URL it needs.
- **Used by:** `pages/dashboard/notifications.tsx` (banner, "Needs you" tab, and row actions all
  omitted for now rather than shown against fake data).

### 1.19 Dismiss / mark-unread a single notification
- **Why:** the design lets a user dismiss one notification (remove it from the list) or toggle it
  back to unread. Only `GET /notification/{id}` (marks read) and `GET /notification/clear/` (deletes
  **everything**) exist — no single-notification delete, no un-read.
- **Proposed:** `DELETE /notification/{id}/` for dismiss, and either a `PATCH /notification/{id}/`
  accepting `{ "is_read": false }` or a dedicated `GET /notification/{id}/unread/` to mirror the
  existing mark-read call.
- **Used by:** `pages/dashboard/notifications.tsx`

### 1.20 Notification delivery preferences (per-category mute + quiet hours)
- **Why:** the design's sidebar panel lets a user mute a category (Trades/Exchange/Academy/...) or
  set quiet hours, and the stat band shows a "Muted" count. There is no preferences endpoint, so
  nothing here is real yet.
- **Proposed:** `GET/PATCH /notification/preferences/` →
  ```json
  { "categories": { "Trades": true, "Exchange": true, "Academy": false }, "quiet_hours": null }
  ```
  (`quiet_hours: { "start": "22:00", "end": "07:00" }` when set). Security-type notices should stay
  non-mutable server-side, same as the design's disabled toggle.
- **Used by:** `pages/dashboard/notifications.tsx`

### 1.21 Open-position state per trade (bot-detail "Open now")
- **Why:** the bot-detail page's vitals row has an "Open now" stat (e.g. "2 · BTC and ETH") — how many
  positions this bot currently holds, and on which pairs. `TradeV2Status` (`RUNNING`/`PAUSED`/`ERROR`)
  only says whether the trade *configuration* is active, not whether a position is currently open —
  a `RUNNING` trade could easily be flat, waiting for its next signal.
- **Proposed:** either a `has_open_position: boolean` (+ `position_side`/`position_size`) field on each
  `GET /trading_v2/trades/` row, or a dedicated `GET /trading_v2/bots/{id}/open-positions/` returning
  the pairs currently held.
- **Used by:** `pages/dashboard/bots/[id]/index.tsx`

### 1.22 Review-suggestion alert setting on a bot
- **Why:** the Bot settings design has a 4th alert toggle, "Tell me when review has new suggestions"
  (weekly, once there's enough history). The bot model only has `alert_email_on_fail`,
  `alert_push_on_fail` and `auto_pause_after_n_fails`, so there is nowhere to save it. The row is
  shown with a "needs endpoint" tag instead of a toggle.
- **Proposed:** add `alert_review_suggestions: boolean` to the bot, readable on `GET /trading_v2/bots/{id}/`
  and writable on `PATCH`. Depends on 1.7 (review) for anything to actually be sent.
- **Used by:** `pages/dashboard/bots/[id]/settings.tsx`

### 1.23 Prompt versions + per-version review counter
- **Why:** the Bot settings design says editing the prompt "restarts the review counter" and shows
  "13 of 20 trades collected on the current version", a "view version history" link, and a sidebar
  item "Old version archived — you can compare them later". Today `prompt` is a single overwritten
  string, so none of that exists. All three spots carry a "needs endpoint" tag.
- **Proposed:**
  - Archive the previous prompt on every prompt change; `GET /trading_v2/bots/{id}/prompt-versions/` →
    `[{ "id": 7, "prompt": "...", "note": "added EMA-200 filter", "created_at": "...", "closed_trades": 186 }]`
  - On the bot: `current_prompt_version: { "id": 8, "closed_trades": 13, "review_threshold": 20 }`
- **Used by:** `pages/dashboard/bots/[id]/settings.tsx`

### 1.24 Label on an exchange record
- **Why:** the Connect-an-exchange design has an optional "Label" field ("Main account") so two
  accounts on the same exchange can be told apart. `POST /exchange/record/` only takes
  `supported_exchange_id`, `API_KEY`, `API_SECRET`, `API_PASSPHRASE`, so the field is shown with a
  "needs endpoint" tag instead of an input.
- **Proposed:** optional `label: string` on `POST /exchange/record/`, returned on `GET /exchange/record/`
  (same idea as the `label` in 1.2's proposed shape).
- **Used by:** `pages/dashboard/exchanges/new.tsx`

---

### 1.25 `task_type` + `category` on `GET /task/reward/` rows (Tasks page "Quiz clean" / "Builder" badges)

The badges need to know what kind of task each reward came from. Reward rows carry `task_id` but
not `task_type`, and `/task/all/` + `/task/course/{id}/` both drop a task once the user has taken
part — so after a submission nothing in the API says the task was a quiz or a builder project, and
there's no single-task endpoint to look it up. **Ask:** add `task_type` (and `category`) to each
reward row — the endpoint already says it merges the task's details in, so it's one more field.
**Stopgap in the FE:** `lib/taskTypeCache.ts` remembers each type seen on a task list before
submission (per browser), so tasks done before 2026-09-30, or on another device, stay untracked.

## P2 — Bulk endpoints (works now, but the frontend loops single calls)

### 2.1 Claim all task rewards
- **Now:** "Claim all" fires `POST /task/reward/claim/{id}/` once per reward in a loop.
- **Proposed:** `POST /task/reward/claim-all/` → claims every claimable reward,
  returns the list of claimed ids + new balance.
- **Used by:** `pages/dashboard/tasks.tsx`

### 2.2 Mark all notifications read
- **Now:** "Mark all read" loops `GET /notification/{id}` per unread item.
- **Proposed:** `POST /notification/read-all/` → marks all as read, returns count.
- **Used by:** `pages/dashboard/notifications.tsx`

---

## P3 — Confirm only (no build — just tell us the shape and we adjust)

### Trades (v2)

| # | Question |
|---|---|
| 3.1 | **`decider_type` enum.** Docs show only `OWN_BOT`. We send `"CANDLE_AI"` for the built-in AI with `bot: null`. Is that the right value? Should `bot` be omitted entirely instead of `null`? |
| 3.2 | **`status` enum.** We assume `RUNNING` / `PAUSED` / `ERROR`. Docs only showed `PAUSED`. Confirm the full set. |
| 3.3 | **Indicator keys.** Docs example: `rsi, macd, macd_signal, sma_50`. We hard-code a set (`rsi, macd, macd_signal, sma_20/50/200, ema_50/200, atr, bb_upper/lower, stoch, volume`). Give us the canonical list, or an endpoint `GET /trading_v2/indicators/`. |
| 3.4 | **Demo vs live.** The mockup had a Demo/Live switch; the v2 trade payload has no such field. Is demo/live implied by the exchange account, or is it missing? |
| 3.5 | **`indicators` on write.** We send `string[]`; reads come back as a comma/space string. Confirm write format. |

### Bots (v2)

| # | Question |
|---|---|
| 3.6 | ~~**Enum values.**~~ **Resolved 2026-09-30** — read from the schema (`BotV2PlatformEnum` etc.); FE corrected to `N8N_SELF_HOSTED`, `CUSTOM_CODE`, `BUY_HOLD_ONLY`. |
| 3.7 | **`model_name`.** Free-text, or is there a server-side enum? We show a suggested list but send whatever's typed. |
| 3.8 | **`dev_key` on reads.** We assume it comes back full only on create + regenerate-key, and is masked/absent on `GET /bots/{id}/`. Confirm — the settings page shows `••••` when it's empty. |
| 3.9 | **`test-connection` response.** We expect `{ ok: bool, status_code?: int, body?: any, error?: string }`. Confirm field names. Confirm it never returns a non-2xx for a failed webhook (we rely on that). |
| 3.10 | **`regenerate-key` response.** We expect `{ status: string, dev_key: string }`. Confirm. |

### Other pages

| # | Question |
|---|---|
| 3.11 | **Subscription history — `amount_paid`.** Rows from `GET /subscription/user/history/` have no stored charged amount. We derive `plan.price × tokens`, which breaks when a plan's price changes or a plan is deleted. Please store and return the **actual amount charged + currency** per purchase. |
| 3.12 | **Subscription expiry.** At `expiry_date`, are unused `tokens` voided, or does only the plan status change? |
| 3.13 | **Task leaderboard shape.** We match `account_id === user.username` and read `point`, `level`. Confirm those field names. |
| 3.14 | **`GET /tutor/courses/`.** We read `data.data.results[]` and expect per-user `progress`, `is_active`, `status`. Does this return the caller's **enrolled** courses or the whole catalogue? If catalogue-only, we need `GET /tutor/courses/enrolled/` (or those per-user fields added). |
| 3.15 | **Course completion.** Does `GET /tutor/courses/{id}/` include per-lesson / per-module completion state for the caller? Needed for the progress bars. |
| 3.16 | **Referral record fields.** Confirm `GET /referral/user/referral/record/` returns `claimed_earning` and `unclaimed_earning`. |
| 3.17 | **Referral claim.** Confirm the reward claim is on-chain only (`PUT /referral/user/referral/{id}/claim/` with `transaction_hash`) and there's no server-only claim path. |
| 3.18 | **`is_active` on `GET /exchange/record/`.** We show this as "Active" / "Expired". Confirm that's what it means, and whether there's also an `expires_at` or `last_synced_at` we could show. |
| 3.19 | **`GET /task/all/` when there are no tasks.** It replies `{ "message": "..." }` instead of an empty list. We now treat that as "no tasks" on our side, but it'd be cleaner if this always returned `[]`. |

---

## Bugs / cross-cutting

- **Token-refresh URL has a double slash.** `lib/axiosApi.ts` and
  `lib/hooks/useRefreshToken.ts` call `${uri}/user/refresh/get/token/` where
  `uri` already ends in `/`, producing `//`. We can fix it on the frontend —
  please confirm the server does (or doesn't) tolerate `//` so we know whether
  it's urgent.
- **`GET /exchange/list/` has test data and is missing BitMart.** It currently returns
  `binance`, `bybit`, `Kucoin` plus three rows named `<magicmock id='…'>` (leftover test
  fixtures). The design supports KuCoin, BitMart, Binance and Bybit. The Connect-an-exchange page
  (`pages/dashboard/exchanges/new.tsx`) now shows the design's four and matches each to this list
  by name (case-insensitive), so please: delete the magicmock rows, add **BitMart** (its card is
  disabled with "Not in /exchange/list/ yet" until then), and confirm which exchanges need
  `API_PASSPHRASE` — we only send it for KuCoin; the design says BitMart needs one too.
  The Exchanges page's "Add another exchange" row still renders this list as-is, so the magicmock
  rows show there too until they're removed.

---

## Already working (for reference — no action needed)

- **Subscription:** `GET /subscription/retrieve/all/`, `/user/history/`,
  `/payment/methods/all/`, `POST /subscription/user/`, `GET /subscription/cancel/{id}`
- **Tasks:** `GET /task/all/ /stats/ /streak/ /leaderboard/ /reward/`,
  `POST /task/reward/`, `POST /task/reward/claim/{id}/`
- **Notifications:** `GET /notification/unread/?page=N`, `GET /notification/{id}`,
  `GET /notification/clear/`
- **Academy:** `GET /tutor/courses/featured/`, `GET /tutor/courses/{id}/`,
  `GET /certificate/{username}/`, `GET /currency/retrieve/all/`
- **Invite:** `GET /referral/user/referral/record/ /subscribed/ /unsubscribed/`,
  `PUT /referral/user/referral/{id}/claim/`
- **Settings:** `GET /user/profile/`, `GET /trade/portfolio/balance/`,
  `PUT /user/update-wallet-password/`, `GET /exchange/list/ /record/`,
  exchange add/remove, `POST /user/delete`
- **Trades (v2):** `GET/POST /trading_v2/trades/`, `GET/PATCH/DELETE /trading_v2/trades/{id}/`,
  `POST /trading_v2/trades/{id}/start/ /pause/`
- **Bots (v2):** `GET/POST /trading_v2/bots/`, `GET/PATCH/DELETE /trading_v2/bots/{id}/`,
  `POST /trading_v2/bots/{id}/pause/ /resume/ /regenerate-key/`,
  `POST /trading_v2/bots/test-connection/`

---

## Features cut from mockups (no backend needed — for your awareness)

These were in the designs but have been **removed** from the build, not deferred:
email invites, referral funnel analytics / rate tiers / milestones / payout
widget, task weekly-goals / badges, notification delivery-preferences /
quiet-hours, account-safety score, per-API-key withdrawal/IP detection,
wallet-network selector, subscription flat monthly plans / bot-review allowances
/ volume meters / proration.
