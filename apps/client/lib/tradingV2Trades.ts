import { DeciderRecordV2, TradeV2 } from "../types/tradingV2";
import { metricNum, pctLabel, signedMoney, winRateLabel } from "./tradingV2Metrics";

/**
 * Reading a trade's own fields — its name, its confidence gate and the record
 * it now carries on the list row.
 */

/**
 * What to call a trade on screen.
 *
 * `display_name` is the field to show: it is `name` when the user gave one
 * and "ETHUSDT · 15m" when they did not, so it is never blank. `name` itself
 * is empty on most trades and showing it directly leaves a hole where the
 * title should be. The pair is kept as a last resort for a row that predates
 * the field.
 */
export const tradeTitle = (trade: TradeV2 | null | undefined): string => {
  if (!trade) return "Trade";
  const display = trade.display_name?.trim();
  if (display) return display;
  const named = trade.name?.trim();
  if (named) return named;
  return trade.pair_name || `Pair #${trade.pair}`;
};

/** The pair and timeframe, for the line under a title that may be a name. */
export const tradeSubtitle = (trade: TradeV2): string =>
  `${trade.pair_name || `Pair #${trade.pair}`} · ${trade.timeframe}`;

/** True when the title above is the user's own words rather than the pair,
 *  so the pair still has to be said somewhere. */
export const hasOwnName = (trade: TradeV2 | null | undefined): boolean =>
  !!trade?.name?.trim();

/* ------------------------------------------------------------------ *
 * The confidence gate
 * ------------------------------------------------------------------ */

/** The code's long-standing default, and what existing trades were given. */
export const DEFAULT_MIN_CONFIDENCE = 50;

/** Highest value the field accepts. 100 is refused: a gate at 100 could never
 *  open, since a decision has to score ABOVE the number to be acted on. */
export const MAX_MIN_CONFIDENCE = 99;

/**
 * The gate, as a sentence.
 *
 * "Above" is the whole point and the easy thing to get wrong: at 60, a
 * decision scoring exactly 60 is held and only 61 trades. It applies both
 * ways — to a BUY opening a position and a SELL closing one — so a high gate
 * can leave a position open as well as keep one from being opened.
 */
export const confidenceRule = (min: number | null | undefined): string => {
  if (min == null || !Number.isFinite(min)) return "Acts on any confidence your bot sends.";
  return `Acts only on decisions above ${min} — a ${min} is held, a ${min + 1} can trade.`;
};

/** Valid input, or the reason it is not. Mirrors the server's own 400 so the
 *  form can refuse before the round trip rather than after it. */
export const confidenceError = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return "Required — a whole number from 0 to 99.";
  if (!/^\d+$/.test(trimmed)) return "Must be a whole number from 0 to 99.";
  const n = Number(trimmed);
  if (n > MAX_MIN_CONFIDENCE) return "Must be a whole number from 0 to 99.";
  return null;
};

/* ------------------------------------------------------------------ *
 * The trade's own record
 * ------------------------------------------------------------------ */

/**
 * The win-rate caption on a trade row: "11.1% · 2 won · 16 lost".
 *
 * `win_rate` is null until something has closed, and that is a different
 * state from 0% — a trade that has lost everything it closed, and one that
 * has closed nothing, must not read the same. The null case returns the count
 * instead so the row still says something true.
 */
export const tradeRecord = (
  trade: TradeV2,
): { rate: number | null; caption: string } => {
  const closed = trade.closed_trades ?? null;
  const wins = trade.wins ?? null;
  const losses = trade.losses ?? null;
  const rate = trade.win_rate ?? null;

  if (rate == null) {
    if (closed === 0) return { rate: null, caption: "nothing closed yet" };
    if (closed == null) return { rate: null, caption: "no record yet" };
    return { rate: null, caption: `${closed.toLocaleString()} closed` };
  }
  if (wins != null && losses != null) {
    return { rate, caption: `${wins} won · ${losses} lost` };
  }
  return { rate, caption: closed == null ? "of closed trades" : `of ${closed} closed` };
};

/* ------------------------------------------------------------------ *
 * Whose record it is
 * ------------------------------------------------------------------ */

/**
 * The record above belongs to the TRADE, not to whoever decides it now.
 *
 * A trade can be switched between a bot and CandleAI, and `closed_trades` /
 * `win_rate` keep counting straight through the switch. So a card that puts
 * the decider's name next to that win rate credits the new decider with the
 * old one's losses — which is what this page did until these fields arrived.
 *
 * `current_decider_record` is the figure that belongs beside a name, and
 * `record_by_decider` is every decider that ever opened a position on the
 * trade, current first. Both are read through here so the card, the detail
 * strip and the filter cannot drift apart.
 */

/** One decider's record, resolved into what a chip or a row actually draws. */
export type DeciderRead = {
  /** Ready to show — the bot's name, "CandleAI", or "No bot recorded". */
  name: string;
  /** React key / filter value. Falls back to the name, which the API keeps
   *  distinct for exactly this reason. */
  key: string;
  /** True on the trade's decider now. */
  current: boolean;
  closed: number | null;
  /** Null until something closed under THIS decider — a dash, not 0%. */
  rate: number | null;
  /** Percent of the capital its closed positions used, and the money. */
  netPct: number | null;
  netMoney: number | null;
  /** "3 closed · 66.7%", or the truthful short version when there is less to
   *  say. Never blank, so a chip always has a caption. */
  caption: string;
};

/** The API's own word for a position whose decision was not kept. */
export const NO_DECIDER_NAME = "No bot recorded";

/**
 * One decider's record as a single line: "66.7% · 3 closed · +$18.40".
 *
 * Money leads over percentage when both are known, which is the opposite of
 * the band's PnL cells — here the line sits inside a chip beside a win rate
 * that is already a percentage, and two percentages in one chip read as one
 * figure contradicting itself.
 */
export const deciderLine = (r: DeciderRead): string => {
  const parts: (string | null)[] = [r.rate == null ? null : winRateLabel(r.rate), r.caption];
  if (r.netMoney != null) parts.push(signedMoney(r.netMoney));
  else if (r.netPct != null) parts.push(pctLabel(r.netPct));
  return parts.filter(Boolean).join(" · ");
};

/**
 * Read one record. Everything is optional on the wire and the money fields
 * have been seen as strings, so each one goes through `metricNum` rather than
 * a `typeof` check — see `DeciderRecordV2`.
 */
export const deciderRead = (rec: DeciderRecordV2 | null | undefined): DeciderRead | null => {
  if (!rec) return null;
  const name = rec.name?.trim() || NO_DECIDER_NAME;
  const closed = rec.closed_trades ?? null;
  const rate = metricNum(rec.win_rate);
  const wins = rec.wins ?? null;
  const losses = rec.losses ?? null;

  /* Same rule as `tradeRecord`: a null rate is "nothing closed", which must
     not render as 0%. The caption carries whatever IS known instead. */
  let caption: string;
  if (rate == null) {
    caption =
      closed === 0 || closed == null
        ? "nothing closed yet"
        : `${closed.toLocaleString()} closed`;
  } else if (closed != null) {
    caption = `${closed.toLocaleString()} closed`;
    if (wins != null && losses != null) caption += ` · ${wins}W ${losses}L`;
  } else {
    caption = wins != null && losses != null ? `${wins}W ${losses}L` : "of closed trades";
  }

  return {
    name,
    key: String(rec.key ?? name),
    current: rec.current === true,
    closed,
    rate,
    netPct: metricNum(rec.net_return_pct),
    netMoney: metricNum(rec.realised_pnl),
    caption,
  };
};

/**
 * Every decider with a record on this trade, current first.
 *
 * The API already orders it that way, so the order is kept rather than
 * re-sorted — `current: true` leading is the contract. Entries that read as
 * nothing at all are dropped, so an empty array means "no record to show"
 * rather than "a row of dashes".
 */
export const deciderReads = (trade: TradeV2 | null | undefined): DeciderRead[] => {
  const rows = trade?.record_by_decider;
  if (!Array.isArray(rows)) return [];
  return rows
    .map(deciderRead)
    .filter((r): r is DeciderRead => !!r && (r.closed != null || r.rate != null));
};

/**
 * True when this trade's decider has changed and more than one of them has a
 * record on it.
 *
 * This is the only case where the trade-level `win_rate` is a blend of two
 * records, and therefore the only case where the card has to say so. One
 * decider, or none, and the trade's figure and its decider's are the same
 * number — labelling it "all deciders" there would invent a distinction.
 */
export const hasPastDeciders = (trade: TradeV2 | null | undefined): boolean =>
  deciderReads(trade).length > 1;

/* ------------------------------------------------------------------ *
 * Who decides it now
 * ------------------------------------------------------------------ */

/**
 * The decider's name for the chip.
 *
 * `current_decider_record.name` is preferred when it is there: it is the
 * API's own word for the decider, so it stays right without this file having
 * to know that CandleAI is spelled with no space. The `decider_type` reading
 * is the fallback for a trade that predates the field — and "Own bot" is the
 * last resort, for an OWN_BOT trade whose bot name did not come back.
 */
export const tradeDeciderName = (trade: TradeV2 | null | undefined): string => {
  const named = trade?.current_decider_record?.name?.trim();
  if (named && named !== NO_DECIDER_NAME) return named;
  if (!trade) return "—";
  if (trade.decider_type === "CANDLEAI") return "CandleAI";
  return trade.bot_name?.trim() || "Own bot";
};

/**
 * What the decider filter matches on: WHO DECIDES THE TRADE NOW.
 *
 * Deliberately not `record_by_decider`. Filtering on the historical record
 * would list a trade under a bot that no longer decides it, and the whole
 * point of these fields is that a past decider's results are not the current
 * one's. "What did this bot ever do" is a question History answers, across
 * every trade, which is where it belongs. Here the filter answers "what is
 * this bot deciding right now", and the per-card strip shows the history.
 */
export const tradeDeciderKey = (trade: TradeV2 | null | undefined): string => {
  if (!trade) return "";
  if (trade.decider_type === "CANDLEAI") return "candleai";
  return trade.bot != null ? `bot:${trade.bot}` : "unassigned";
};

/**
 * The options for that filter, built from the trades in hand.
 *
 * `GET trades/` takes no decider parameter, so this is a client-side narrow
 * of a list already fetched — no extra request, and no chance of the option
 * list offering something that returns nothing. CandleAI sorts last: it is
 * one shared decider and reads as a category beside the user's own bots.
 */
export const deciderOptions = (
  trades: TradeV2[],
): { key: string; name: string; count: number }[] => {
  const byKey = new Map<string, { key: string; name: string; count: number }>();
  for (const t of trades) {
    const key = tradeDeciderKey(t);
    if (!key) continue;
    const found = byKey.get(key);
    if (found) found.count += 1;
    else byKey.set(key, { key, name: tradeDeciderName(t), count: 1 });
  }
  /* `Array.from`, not a spread: the build targets ES5 and spreading a Map
     iterator needs --downlevelIteration (TS2802). */
  return Array.from(byKey.values()).sort((a, b) => {
    if (a.key === "candleai") return 1;
    if (b.key === "candleai") return -1;
    return a.name.localeCompare(b.name);
  });
};
