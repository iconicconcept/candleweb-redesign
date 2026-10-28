import { useMemo, useState } from "react";
import {
  indicatorLabel,
  indicatorsFor,
  pickerCategories,
  searchIndicators,
  toggleIndicatorName,
  unknownIndicatorNames,
} from "../../../lib/tradingV2Indicators";
import type { IndicatorCatalogue } from "../../../lib/hooks/useIndicatorCatalogue";
import type { IndicatorV2 } from "../../../types/tradingV2";

/* Momentum, Trend, Volatility and Volume are what most strategies read, so
   they sit next to Popular. The rest are specialist and go behind "More" —
   thirteen tabs in a row would bury the four that matter. */
const UP_FRONT = ["momentum", "trend", "volatility", "volume"];

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  catalogue: IndicatorCatalogue;
  /** Decides whether "Versus Bitcoin" is worth offering. */
  pairName?: string;
  /** A 400 the server answered with, to show under the picker. */
  fieldError?: string | null;
};

const IndicatorPicker = ({ selected, onChange, catalogue, pairName, fieldError }: Props) => {
  const { catalogue: cat, index, loading, failed, reload } = catalogue;
  const [tab, setTab] = useState<string>("popular");
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const categories = useMemo(() => pickerCategories(cat, { pairName }), [cat, pairName]);
  const front = categories.filter((c) => UP_FRONT.includes(c.key));
  const rest = categories.filter((c) => !UP_FRONT.includes(c.key));

  const searching = query.trim().length > 0;
  const rows: IndicatorV2[] = useMemo(
    () =>
      searching
        ? searchIndicators(cat, query, { pairName })
        : indicatorsFor(cat, tab, { pairName }),
    [cat, query, searching, tab, pairName],
  );

  /* Only a trade saved before names were checked can hold one of these. */
  const unknown = useMemo(() => unknownIndicatorNames(selected, index), [selected, index]);

  const toggle = (name: string) => onChange(toggleIndicatorName(selected, name, index));
  const tabName = searching
    ? ""
    : tab === "popular"
      ? "Popular"
      : categories.find((c) => c.key === tab)?.name || "";
  const tabNote = searching ? "" : categories.find((c) => c.key === tab)?.description || "";

  if (failed) {
    return (
      <div className="fx-indp">
        <div className="fx-indp-fail">
          <b>Indicators couldn&rsquo;t be loaded.</b>
          <span>
            {/* The trade's own list is untouched by this — saving now keeps
                whatever it already had rather than wiping it to empty. */}
            {selected.length
              ? `This trade keeps the ${selected.length} it already has. The rest of the form still saves.`
              : "The rest of the form still saves."}
          </span>
          <button type="button" className="fx-mini" onClick={reload}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-indp">
      <div className="fx-indp-bar">
        <input
          className="fx-indp-search"
          type="search"
          value={query}
          placeholder="Search indicators…"
          aria-label="Search indicators"
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="fx-indp-count">
          {selected.length} selected
        </span>
      </div>

      {!searching && (
        <div className="fx-indp-tabs" role="tablist" aria-label="Indicator categories">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "popular"}
            className={`fx-indp-tab ${tab === "popular" ? "on8" : ""}`}
            onClick={() => setTab("popular")}
          >
            Popular
          </button>
          {front.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={tab === c.key}
              className={`fx-indp-tab ${tab === c.key ? "on8" : ""}`}
              onClick={() => setTab(c.key)}
            >
              {c.name}
            </button>
          ))}
          {more &&
            rest.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={tab === c.key}
                className={`fx-indp-tab ${tab === c.key ? "on8" : ""}`}
                onClick={() => setTab(c.key)}
              >
                {c.name}
              </button>
            ))}
          {rest.length > 0 && (
            <button
              type="button"
              className="fx-indp-tab more3"
              aria-expanded={more}
              onClick={() => setMore((v) => !v)}
            >
              {more ? "Less ▴" : "More ▾"}
            </button>
          )}
        </div>
      )}

      {!searching && tabNote && <p className="fx-indp-note">{tabNote}</p>}

      <div className="fx-indp-list">
        {loading && !rows.length && <p className="fx-indp-empty">Loading indicators…</p>}
        {!loading && !rows.length && (
          <p className="fx-indp-empty">
            {searching ? `Nothing matches “${query.trim()}”.` : "Nothing in this group."}
          </p>
        )}
        {rows.map((i) => {
          const on = selected.includes(i.name);
          const expanded = open === i.name;
          return (
            <div className={`fx-indp-row ${on ? "on8" : ""}`} key={i.name}>
              <button
                type="button"
                className="fx-indp-pick"
                aria-pressed={on}
                onClick={() => toggle(i.name)}
              >
                <span className="fx-indp-box" aria-hidden="true">
                  {on ? "✓" : ""}
                </span>
                <span className="fx-indp-name">{i.display_name}</span>
                {searching && <span className="fx-indp-cat">{i.category.replace(/_/g, " ")}</span>}
              </button>
              <button
                type="button"
                className="fx-indp-info"
                aria-expanded={expanded}
                aria-label={`What ${i.display_name} is`}
                onClick={() => setOpen(expanded ? null : i.name)}
              >
                ⓘ
              </button>
              {expanded && (
                <div className="fx-indp-desc">
                  <p>{i.description}</p>
                  <em>{i.values}</em>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fx-indp-chips">
        {selected.length === 0 && <span className="fx-indp-empty2">Nothing selected yet.</span>}
        {selected.map((n) => {
          const gone = unknown.includes(n);
          return (
            <span className={`fx-indp-chip ${gone ? "gone2" : ""}`} key={n}>
              {gone ? n : indicatorLabel(index, n)}
              {gone && <em>No longer available</em>}
              <button
                type="button"
                aria-label={`Remove ${indicatorLabel(index, n)}`}
                onClick={() => onChange(selected.filter((s) => s !== n))}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {unknown.length > 0 && (
        <p className="fx-indp-warn">
          {/* Saving with one of these still in the list is a 400, so it is
              worth saying before the user finds out the hard way. */}
          <b>{unknown.length === 1 ? "One indicator is" : `${unknown.length} indicators are`}</b> no
          longer available and must be removed before this trade can be saved.
        </p>
      )}

      {fieldError && <p className="fx-indp-warn">{fieldError}</p>}
    </div>
  );
};

export default IndicatorPicker;
