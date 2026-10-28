import { axiosApi } from "./axiosApi";
import type {
  IndicatorCatalogueV2,
  IndicatorV2,
  IndicatorV2Category,
} from "../types/tradingV2";

// `indicators` is documented as a comma/space string on read, but the API
// has been observed sending it back as a string[] too — handle both so a
// shape mismatch doesn't crash the trades pages.
export const indicatorChips = (raw: string | string[] | null | undefined): string[] => {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return (raw || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/* ------------------------------------------------------------------ *
 * The catalogue — GET /trading_v2/indicators/
 * ------------------------------------------------------------------ */

const CATALOGUE_URL = "/trading_v2/indicators/";

/**
 * Kept for the life of the tab, not per component.
 *
 * The catalogue describes Candleweb rather than the user, changes only when
 * an indicator is added, and is served `Cache-Control: public, max-age=3600`.
 * Three screens want it at once (the form, the trades list, a trade's detail)
 * and a module-level promise means they share ONE request rather than three
 * of 106 KB. `inFlight` is what does that: callers that arrive while the
 * first request is still open wait on it instead of starting another.
 */
let loaded: IndicatorCatalogueV2 | null = null;
let inFlight: Promise<IndicatorCatalogueV2> | null = null;

/** What has already arrived, for a first render that need not wait. */
export const cachedCatalogue = (): IndicatorCatalogueV2 | null => loaded;

export const loadIndicatorCatalogue = (): Promise<IndicatorCatalogueV2> => {
  if (loaded) return Promise.resolve(loaded);
  if (inFlight) return inFlight;
  /* `axiosApi`, not the authorised instance: this endpoint takes no login,
     so the picker is not blocked behind a token refresh. */
  inFlight = axiosApi
    .get(CATALOGUE_URL)
    .then(({ data }) => {
      const body = (data?.data ?? data ?? {}) as Partial<IndicatorCatalogueV2>;
      const cat: IndicatorCatalogueV2 = {
        categories: Array.isArray(body.categories) ? body.categories : [],
        indicators: Array.isArray(body.indicators) ? body.indicators : [],
      };
      /* Only a usable answer is cached. Caching an empty one would turn a
         single bad response into an empty picker for the whole session. */
      if (cat.indicators.length) loaded = cat;
      return cat;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};

/**
 * The same names with repeats dropped, first occurrence kept.
 *
 * The picker cannot produce a repeat — it toggles. A trade saved before any
 * of this could, and sending the same name twice would have the bot receive
 * one value twice under one heading. Applied where a stored list is read in
 * and again where the payload is built, so neither path can carry one.
 */
export const dedupeIndicators = (names: string[]): string[] => Array.from(new Set(names));

/** Name → entry, for turning a trade's stored names back into labels. */
export const indicatorIndex = (
  cat: IndicatorCatalogueV2 | null,
): Map<string, IndicatorV2> =>
  new Map((cat?.indicators ?? []).map((i) => [i.name, i]));

/**
 * The catalogue's own qualifier on the eight legacy names, as in
 * "RSI (14), classic".
 *
 * It is dropped for display. The qualifier describes where a name came from,
 * not what the bot is sent — and these labels are read in chips, where the
 * thing being named is what matters and the suffix is the longest part of it.
 * The distinction is kept where it counts: a `classic` name is still never
 * offered by the picker, and picking its current name still swaps rather than
 * doubles it.
 */
const CLASSIC_SUFFIX = /,\s*classic\s*$/i;

/**
 * What to show for a stored name.
 *
 * Falls back to the name itself, which is what a trade saved before the
 * catalogue existed may hold, and is also what shows for the moment before
 * the catalogue lands. Either way the user sees something true rather than a
 * blank.
 */
export const indicatorLabel = (index: Map<string, IndicatorV2>, name: string): string =>
  (index.get(name)?.display_name || name).replace(CLASSIC_SUFFIX, "");

/** Labels for a whole stored list, in the trade's own order. */
export const indicatorLabels = (
  index: Map<string, IndicatorV2>,
  names: string[],
): string[] => names.map((n) => indicatorLabel(index, n));

/** The `classic` category is back-compat only and is never offered. */
export const CLASSIC_CATEGORY = "classic";

/** Comparisons against Bitcoin, which are empty on Bitcoin itself. */
export const BITCOIN_CATEGORY = "cross_asset";

/**
 * Categories the picker offers, in the order the response gives them.
 *
 * `classic` always goes: it exists so older trades keep working, and offering
 * it would let someone pick a name that is already selected under its current
 * one. `cross_asset` goes on a BTC market, where every one of its indicators
 * compares Bitcoin with itself and is always empty.
 */
export const pickerCategories = (
  cat: IndicatorCatalogueV2 | null,
  opts: { pairName?: string } = {},
): IndicatorV2Category[] => {
  const btc = isBitcoinPair(opts.pairName);
  return (cat?.categories ?? []).filter(
    (c) => c.key !== CLASSIC_CATEGORY && !(btc && c.key === BITCOIN_CATEGORY),
  );
};

/** "BTC/USDT", "BTCUSDT", "btc-usdt" — the base asset is Bitcoin. */
export const isBitcoinPair = (pairName?: string | null): boolean => {
  const n = (pairName || "").trim().toUpperCase();
  if (!n) return false;
  return /^(X?BT|BTC)[\/\-_ ]?(USDT|USD|USDC|BUSD)$/.test(n);
};

/** The indicators a category tab lists, minus anything hidden for this trade. */
export const indicatorsFor = (
  cat: IndicatorCatalogueV2 | null,
  categoryKey: string | "popular",
  opts: { pairName?: string } = {},
): IndicatorV2[] => {
  const all = (cat?.indicators ?? []).filter((i) => offered(i, opts));
  if (categoryKey === "popular") return all.filter((i) => i.common);
  return all.filter((i) => i.category === categoryKey);
};

const offered = (i: IndicatorV2, opts: { pairName?: string }): boolean => {
  if (i.category === CLASSIC_CATEGORY) return false;
  if (i.category === BITCOIN_CATEGORY && isBitcoinPair(opts.pairName)) return false;
  return true;
};

/**
 * Search across name, label and description, ignoring case.
 *
 * `description` is in deliberately so someone who knows what they want but
 * not what it is called — "overbought" — finds RSI, Stochastic and Williams
 * %R. `name` is in so pasting `mom_rsi_14` from a bot's prompt finds it.
 */
export const searchIndicators = (
  cat: IndicatorCatalogueV2 | null,
  query: string,
  opts: { pairName?: string } = {},
): IndicatorV2[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return (cat?.indicators ?? [])
    .filter((i) => offered(i, opts))
    .filter(
      (i) =>
        i.display_name.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q),
    );
};

/**
 * The selection after toggling `name`, with duplicates resolved.
 *
 * Adding an indicator drops any selected `classic` alias of it: `rsi` and
 * `mom_rsi_14` are one value under two names, and keeping both would send the
 * bot the same number twice. This can only come up when editing a trade saved
 * before the catalogue existed, which is the only way a classic name is in
 * the list at all — the picker itself never offers one.
 */
export const toggleIndicatorName = (
  selected: string[],
  name: string,
  index: Map<string, IndicatorV2>,
): string[] => {
  if (selected.includes(name)) return selected.filter((n) => n !== name);

  const entry = index.get(name);
  /* Picking the current name for something already held under its classic
     alias: replace, in place, so the chip does not jump to the end. */
  const supersedes = selected.filter((n) => index.get(n)?.same_as === name);
  if (supersedes.length) {
    let swapped = false;
    return selected.map((n) => {
      if (!supersedes.includes(n)) return n;
      if (swapped) return n;
      swapped = true;
      return name;
    });
  }
  /* The other direction — adding a classic whose current name is already
     selected. The picker cannot do this, but an edit arriving by URL could. */
  if (entry?.same_as && selected.includes(entry.same_as)) return selected;

  return [...selected, name];
};

/**
 * Stored names the catalogue does not have.
 *
 * Only a trade saved before names were checked can hold one. Saving with it
 * still in the list is a 400, so the picker marks it and asks for it to be
 * taken out rather than letting the user hit a refusal they cannot read.
 */
export const unknownIndicatorNames = (
  selected: string[],
  index: Map<string, IndicatorV2>,
): string[] => (index.size === 0 ? [] : selected.filter((n) => !index.has(n)));

/**
 * What a new trade starts with.
 *
 * The same four the form has always defaulted to — RSI, MACD, MACD signal and
 * SMA 50 — under their real names rather than the legacy aliases it used to
 * send. The default is deliberately unchanged: this work fixes spelling, and
 * quietly changing which indicators a new trade gets would be a different
 * decision wearing its clothes. All four are in the catalogue's popular set,
 * so they are visible on the tab the picker opens on.
 *
 * Checked against the catalogue before use — a name that has gone would
 * otherwise make every new trade unsaveable until someone noticed, which is
 * the exact failure this change is undoing.
 */
export const DEFAULT_INDICATORS = [
  "mom_rsi_14",
  "mom_macd_12_26_9",
  "mom_macd_signal_12_26_9",
  "trd_sma_50",
];

export const defaultIndicators = (index: Map<string, IndicatorV2>): string[] =>
  index.size === 0 ? DEFAULT_INDICATORS : DEFAULT_INDICATORS.filter((n) => index.has(n));
